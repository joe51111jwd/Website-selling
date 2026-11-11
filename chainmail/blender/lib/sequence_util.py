"""
chainmail — helpers for the packing sequence (scenes/kit_sequence.py) and the hero
still (scenes/kit_hero_open.py). Owned by the sequence scenes; item libs never import it.

  build_kit(...)             -> dict   the packed kit at its FINAL rest poses (box-local == world),
                                       assembled from the public kit/apparel/accessories/vessels
                                       builders with fit fixes (see FIT NOTES) so nothing intersects.
  tissue_wing(...)           -> Mesh   hinged, crinkled tissue flap whose fold is baked as per-frame
                                       shape keys (inextensible cross-section, no texture swimming).
  ease_* / settle()          easing curves; drop_z() vertical lowering with a soft touchdown.
  key_transform(...)         bake an object's per-frame transform (LINEAR keys, motion-blur safe).
  group_bvh(), overlaps()    world-space BVH of an object hierarchy + pairwise interpenetration test.
  rest_drop(...)             ray-cast "lower until touching" for an object group onto supports.
  start_height(...)          how high an item must start so it is fully above the camera frame.
  edge_lock(...)             compositor: blends the frame border to an exact sRGB colour (#0B0B0F).

FIT NOTES (lib geometry vs the kit insert, measured at build time, so they adapt if libs change):
  * the folded hoodie is wider (cuff peeking out) than the 0.21 m hoodie bay -> scaled in X to fit;
  * the manojo bottle (Ø94 mm) is wider than its insert cradle (Ø85 mm) -> uniformly scaled to fit,
    then slid along Y until its shoulder clears the cradle cone;
  * packed_box()'s lining tissue overhangs into the product pocket -> rebuilt with the pocket edge as
    a bound; the note card is ray-cast onto the real tumbler/bottle tops;
  * the cap is ~17 mm taller than the closed lid allows -> callers may squash its crown (soft dad cap)
    when the lid closes (see cap_squash_for_lid()).
"""
import bpy, bmesh, math, os, sys, random
import numpy as np
from mathutils import Vector, Matrix, Euler, Quaternion
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from common import *  # noqa: F401,F403
import common as _c
import kit

# ================================================================= easing
def clamp01(x):
    return 0.0 if x < 0 else 1.0 if x > 1 else x

def smoothstep(a, b, x):
    t = clamp01((x - a) / (b - a)) if b != a else (1.0 if x >= b else 0.0)
    return t * t * (3 - 2 * t)

def smootherstep(a, b, x):
    t = clamp01((x - a) / (b - a)) if b != a else (1.0 if x >= b else 0.0)
    return t * t * t * (t * (6 * t - 15) + 10)

def ease_out(t, p=3.0):
    t = clamp01(t)
    return 1 - (1 - t) ** p

def ease_in(t, p=2.0):
    return clamp01(t) ** p

def ease_in_out(t, p=2.0):
    t = clamp01(t)
    return 0.5 * (2 * t) ** p if t < 0.5 else 1 - 0.5 * (2 - 2 * t) ** p

def settle(t, amp=1.0, freq=1.6, damp=4.0):
    """Damped oscillation that starts at 0 (t=0) and decays to 0 (t=1): sin * exp."""
    t = clamp01(t)
    return amp * math.sin(math.pi * freq * t) * math.exp(-damp * t) * (1 - t)

def lerp(a, b, t):
    return a + (b - a) * t

def drop_z(f, f0, f1, z_start, z_rest, p=3.2, bounce=0.0012, bounce_frames=5.0):
    """Vertical lowering: at f0 the item is at z_start, eases out (power p) to touch z_rest
    at f1, then a tiny soft bounce (up only: never below the rest height) settles it."""
    if f <= f0:
        return z_start
    if f < f1:
        return lerp(z_start, z_rest, ease_out((f - f0) / (f1 - f0), p))
    u = (f - f1) / bounce_frames
    if u >= 1.0:
        return z_rest
    return z_rest + bounce * math.sin(math.pi * u) * (1 - u) ** 0.6


# ================================================================= scene graph helpers
def descendants(o):
    out = [o]
    for ch in o.children:
        out += descendants(ch)
    return out

def meshes_of(root):
    return [d for d in descendants(root) if d.type == "MESH" and not d.hide_render]

def world_bbox(objs):
    if not isinstance(objs, (list, tuple)):
        objs = [objs]
    lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
    for r in objs:
        a, b = kit.world_bbox(r)
        lo = Vector(map(min, lo, a)); hi = Vector(map(max, hi, b))
    return lo, hi

def world_points(root, max_pts=None, seed=0):
    """Evaluated world-space vertices of every mesh under root (numpy Nx3)."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for d in meshes_of(root):
        de = d.evaluated_get(dg)
        me = de.to_mesh()
        n = len(me.vertices)
        if n:
            co = np.empty(n * 3, dtype=np.float64)
            me.vertices.foreach_get("co", co)
            co = co.reshape(-1, 3)
            M = np.array(d.matrix_world)
            pts.append(co @ M[:3, :3].T + M[:3, 3])
        de.to_mesh_clear()
    P = np.concatenate(pts) if pts else np.zeros((0, 3))
    if max_pts and len(P) > max_pts:
        rng = np.random.default_rng(seed)
        P = P[rng.choice(len(P), max_pts, replace=False)]
    return P

def group_bvh(roots, with_tris=False):
    """World-space BVH (evaluated, modifiers applied) of one or more hierarchies.
    with_tris=True -> (bvh, triangle centroid array) for locating overlaps."""
    if not isinstance(roots, (list, tuple)):
        roots = [roots]
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    V, T, off = [], [], 0
    for r in roots:
        for d in meshes_of(r):
            de = d.evaluated_get(dg)
            me = de.to_mesh()
            n = len(me.vertices)
            me.calc_loop_triangles()
            nt = len(me.loop_triangles)
            if n and nt:
                co = np.empty(n * 3, dtype=np.float64)
                me.vertices.foreach_get("co", co)
                co = co.reshape(-1, 3)
                M = np.array(d.matrix_world)
                V.append(co @ M[:3, :3].T + M[:3, 3])
                tri = np.empty(nt * 3, dtype=np.int64)
                me.loop_triangles.foreach_get("vertices", tri)
                T.append(tri.reshape(-1, 3) + off)
                off += n
            de.to_mesh_clear()
    if not V:
        return (None, None) if with_tris else None
    Vn = np.concatenate(V); Tn = np.concatenate(T)
    bvh = BVHTree.FromPolygons(Vn.tolist(), Tn.tolist(), all_triangles=True)
    if with_tris:
        return bvh, Vn[Tn].mean(axis=1)
    return bvh

def overlaps(a_roots, b_roots):
    """Number of intersecting triangle pairs between two object groups (0 = clean)."""
    A, B = group_bvh(a_roots), group_bvh(b_roots)
    if A is None or B is None:
        return 0
    return len(A.overlap(B))

def rest_drop(moving, supports, clearance=0.0004, probe=0.03, max_pts=6000, keep_xy=True):
    """Lower (or lift) `moving` (root object) straight down until its lowest
    point along each vertical ray is `clearance` above the supports. Returns dz applied."""
    bvh = group_bvh(supports)
    if bvh is None:
        return 0.0
    P = world_points(moving)
    if len(P) == 0:
        return 0.0
    # only the lower half of the item can touch something below it
    zc = np.percentile(P[:, 2], 55)
    P = P[P[:, 2] <= zc]
    if len(P) > max_pts:
        P = P[np.random.default_rng(1).choice(len(P), max_pts, replace=False)]
    best = None
    down = Vector((0, 0, -1))
    for p in P:
        o = Vector((p[0], p[1], p[2] + probe))
        hit = bvh.ray_cast(o, down, probe + 0.5)
        if hit[0] is not None:
            gap = hit[3] - probe
            best = gap if best is None or gap < best else best
    if best is None:
        return 0.0
    dz = -(best - clearance)
    moving.location.z += dz
    bpy.context.view_layer.update()
    return dz


# ================================================================= kit assembly
def _try(fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except TypeError:
        return fn(*a)

def _item(kind, arg):
    try:
        if kind == "hoodie":
            import apparel
            return apparel.folded_hoodie(arg)
        if kind == "cap":
            import accessories
            return accessories.cap(arg)
        if kind == "tumbler":
            import vessels
            return vessels.tumbler(arg)
        if kind == "bottle":
            import vessels
            return vessels.bottle(arg)
    except Exception as e:  # a lib mid-edit: fall back to the packaging proxies
        print(f"[seq] {kind}: lib failed ({type(e).__name__}: {e}); using kit proxy")
    return kit._item(kind, arg)

def _fit_xy(obj, slot, x0, x1, y0, y1, margin=0.0025, uniform=False, log=None):
    """Scale obj (about its placed centre) so its world bbox fits [x0,x1]x[y0,y1] - margin."""
    kit.place(obj, slot)
    lo, hi = kit.world_bbox(obj)
    sx = min(1.0, (x1 - x0 - 2 * margin) / max(hi.x - lo.x, 1e-6))
    sy = min(1.0, (y1 - y0 - 2 * margin) / max(hi.y - lo.y, 1e-6))
    if uniform:
        s = min(sx, sy)
        sx = sy = s
    if sx < 1.0 or sy < 1.0:
        # scale is applied in the object's (possibly rotated) frame: map world x/y to local axes
        rz = math.radians(kit.SLOTS[slot][3])
        if abs(math.sin(rz)) > 0.7:
            sx, sy = sy, sx
        obj.scale.x *= sx
        obj.scale.y *= sy
        if uniform:
            obj.scale.z *= sx
        kit.place(obj, slot)
        if log is not None:
            log.append(f"{obj.name}: fitted scale x{sx:.3f} y{sy:.3f}" + (" (uniform)" if uniform else ""))
    return obj

def build_kit(number=1, edition=48, hoodie="Black", cap="Black", tumbler="Matte Black", spirit="manojo",
              puffs=True, log=None):
    """Every part of the kit at its final packed pose (box-local coordinates == world, base on Z=0).
    Returns dict: base, insert, lining, hoodie, cap, tumbler, bottle, product, card, puffs[list], notes."""
    notes = [] if log is None else log
    K = {}
    K["base"] = kit.box_base()
    ins = kit.insert(); ins.location = (0, 0, kit.FLOOR_Z); K["insert"] = ins
    # --- bay lining: bounded by the inner walls AND the product pocket edge (packed_box's sheet
    #     rolls over the divider into the product pocket and intersects the product)
    x0, x1, y0, y1 = kit.HOODIE_BAY
    cx_, cy_ = (x0 + x1) / 2, (y0 + y1) / 2
    iw, idp = kit.BOX_W / 2 - kit.BOARD - 0.0004, kit.BOX_D / 2 - kit.BOARD - 0.0004
    px0 = kit.PRODUCT_POCKET[0] - 0.0015
    t = kit.tissue(seed=number + 2, bounds=(-iw - cx_, px0 - cx_, -idp - cy_, idp - cy_))
    t.location = (cx_, cy_, kit.FLOOR_Z)
    K["lining"] = t
    # --- hoodie: pressed to the packed height, fitted to the bay
    h = _item("hoodie", hoodie)
    lo, hi = kit.world_bbox(h)
    if hi.z - lo.z > kit.HOODIE_PACKED_H + 1e-4:
        h.scale.z *= kit.HOODIE_PACKED_H / (hi.z - lo.z)
    _fit_xy(h, "hoodie", x0, x1, y0, y1, margin=0.003, log=notes)
    K["hoodie"] = h
    # --- cap nested on the hoodie (ray-cast onto its real top)
    c = _item("cap", cap)
    _fit_xy(c, "cap", x0, x1, y0, y1, margin=0.003, uniform=True, log=notes)
    rest_drop(c, [h], clearance=0.0006)
    K["cap"] = c
    # --- product upright in its pocket
    p = kit.your_product()
    kit.place(p, "product")
    K["product"] = p
    # --- tumbler: lying in its cradle (cradle Ø87.6 mm)
    tm = _item("tumbler", tumbler)
    kit.place(tm, "tumbler")
    lo, hi = kit.world_bbox(tm)
    r_t = (hi.x - lo.x) / 2
    if r_t > 0.0438 - 0.0012:
        s = (0.0438 - 0.0012) / r_t
        tm.scale = (s, s, s); kit.place(tm, "tumbler")
        notes.append(f"tumbler: scaled {s:.3f} to fit its cradle")
    K["tumbler"] = tm
    # --- bottle: cradle Ø85 mm (insert) — scale to fit, then slide along -Y until it clears the cone
    b = _item("bottle", spirit)
    kit.place(b, "bottle")
    lo, hi = kit.world_bbox(b)
    r_b = (hi.x - lo.x) / 2
    if r_b > 0.0425 - 0.0011:
        s = (0.0425 - 0.0011) / r_b
        b.scale = (s, s, s)
        kit.place(b, "bottle")
        notes.append(f"bottle {spirit}: Ø{2 * r_b * 1000:.1f} mm > cradle Ø85 mm -> scaled {s:.3f}")
    # the cradle floor is cut for a Ø85 cylinder centred at SLOTS z + 0.040: seat the bottle's axis there
    lo, hi = kit.world_bbox(b)
    r_now = (hi.x - lo.x) / 2
    b.location.z += (kit.SLOTS["bottle"][2] + 0.040) - ((lo.z + hi.z) / 2)
    bpy.context.view_layer.update()
    y_base = b.location.y
    for dy in [0.0] + [-0.004 * k for k in range(1, 14)]:
        b.location.y = y_base + dy
        if overlaps([b], [ins]) == 0:
            if dy:
                notes.append(f"bottle: slid {dy * 1000:.0f} mm along -Y to clear the cradle shoulder")
            break
    else:
        notes.append("bottle: WARNING still touches the insert cradle")
    K["bottle"] = b
    # --- note card across the tumbler + bottle tops (ray-cast, never through)
    card = kit.note_card(number=number, edition=edition)
    tops = []
    for o in (tm, b):
        lo, hi = kit.world_bbox(o)
        tops.append(((lo.x + hi.x) / 2, hi.z))
    (xt, zt), (xb, zb) = tops
    ang = math.atan2(zb - zt, xb - xt)
    card.rotation_euler = (0.0, -ang, math.radians(kit.SLOTS["card"][3]))
    card.location = (kit.SLOTS["card"][0], kit.SLOTS["card"][1], max(zt, zb) + 0.01)
    bpy.context.view_layer.update()
    rest_drop(card, [tm, b], clearance=0.0005)
    K["card"] = card
    # --- tissue puffs in the gaps (stuffed last, before the card)
    K["puffs"] = []
    if puffs:
        specs = [
            ((0.016, 0.085, kit.INS_TOP - 0.010), (0.062, 0.12, 0.045), 6),       # behind the product
            ((0.016, -0.150, kit.INS_TOP - 0.006), (0.066, 0.036, 0.030), -8),    # in front of the product
            ((0.152, 0.150, kit.INS_TOP - 0.012), (0.030, 0.044, 0.040), 4),      # tumbler lid / bottle neck
        ]
        for i, (pos, size, rz) in enumerate(specs):
            pf = kit.tissue_puff(size, seed=11 + i + number)
            pf.location = pos
            pf.rotation_euler = (0, 0, math.radians(rz))
            bpy.context.view_layer.update()
            rest_drop(pf, [ins], clearance=0.0003)     # sits ON the insert top, not sunk into it
            # shrink until it touches no rigid item
            for k in range(6):
                if overlaps([pf], [p, tm, b]) == 0:
                    break
                pf.scale *= 0.9
            K["puffs"].append(pf)
    K["notes"] = notes
    return K

def kit_items(K):
    return [K[k] for k in ("hoodie", "cap", "product", "tumbler", "bottle", "card")]

def cap_top(K):
    return kit.world_bbox(K["cap"])[1].z

def make_lid(number=None, edition=48):
    """kit.lid() without its seal (the seal is animated separately) + the seal object."""
    l = kit.lid(None, edition)
    s = kit.seal(number or 1, edition)
    return l, s

SEAL_LOCAL = (kit.LID_W / 2 - 0.060, -kit.LID_D / 2 + 0.058, kit.LID_H + 0.00003)


# ================================================================= camera helpers
def sph_camera(target, az_deg, el_deg, dist, lens, name="Camera"):
    az, el = math.radians(az_deg), math.radians(el_deg)
    t = Vector(target)
    loc = t + Vector((dist * math.sin(az) * math.cos(el), -dist * math.cos(az) * math.cos(el),
                      dist * math.sin(el)))
    return camera(loc=tuple(loc), target=tuple(t), lens=lens, name=name)

def sph_loc(target, az_deg, el_deg, dist):
    az, el = math.radians(az_deg), math.radians(el_deg)
    t = Vector(target)
    return t + Vector((dist * math.sin(az) * math.cos(el), -dist * math.cos(az) * math.cos(el),
                       dist * math.sin(el)))

def project(cam, pts):
    """World points -> normalized camera view (x, y in 0..1, z depth)."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    return [world_to_camera_view(sc, cam, Vector(p)) for p in pts]

def bbox_corners(lo, hi):
    return [(x, y, z) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]

def start_height(cam, obj, margin=0.04, step=0.01, max_h=3.0):
    """Smallest dz (m) such that obj's bbox, lifted by dz, projects fully above the frame top
    (normalized y > 1 + margin) for the camera at its current pose."""
    lo, hi = kit.world_bbox(obj)
    dz = 0.0
    while dz < max_h:
        c = bbox_corners(lo + Vector((0, 0, dz)), hi + Vector((0, 0, dz)))
        if min(p.y for p in project(cam, c)) > 1.0 + margin:
            return dz
        dz += step
    return dz


# ================================================================= animation baking
def key_transform(obj, frames, fn, rot_mode="XYZ"):
    """fn(frame) -> (location Vector/tuple, rotation Euler/tuple(rad), scale tuple|None).
    Keys every frame; LINEAR interpolation so motion blur sees exactly the baked path."""
    obj.rotation_mode = rot_mode
    for f in frames:
        loc, rot, scl = fn(f)
        obj.location = loc
        obj.rotation_euler = rot
        obj.keyframe_insert("location", frame=f)
        obj.keyframe_insert("rotation_euler", frame=f)
        if scl is not None:
            obj.scale = scl
            obj.keyframe_insert("scale", frame=f)
    linear_keys(obj)

def linear_keys(idblock):
    ad = idblock.animation_data
    if not ad or not ad.action:
        return
    try:
        curves = ad.action.fcurves
    except AttributeError:   # layered actions (4.4+)
        curves = []
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    curves += list(cb.fcurves)
    for fc in curves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

def keep_vis(obj_root, f_show):
    """Hide a hierarchy (render + viewport) before frame f_show, visible from it (constant keys)."""
    for d in descendants(obj_root):
        for f, hidden in ((f_show - 1, True), (f_show, False)):
            d.hide_render = hidden
            d.hide_viewport = hidden
            d.keyframe_insert("hide_render", frame=f)
            d.keyframe_insert("hide_viewport", frame=f)
        d.hide_render = False
        d.hide_viewport = False


def _wrap_noshadow(m, prop):
    """Material copy whose shadow rays become transparent by the object's custom property `prop`
    (0 = normal shadows, the default when the property is missing; 1 = casts no shadow)."""
    nt = m.node_tree
    out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output), None) or \
        next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
    if out is None or not out.inputs["Surface"].links:
        return m
    src = out.inputs["Surface"].links[0].from_socket
    lp = nt.nodes.new("ShaderNodeLightPath")
    at = nt.nodes.new("ShaderNodeAttribute")
    at.attribute_type = "OBJECT"
    at.attribute_name = prop
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.use_clamp = True
    nt.links.new(lp.outputs["Is Shadow Ray"], mul.inputs[0])
    nt.links.new(at.outputs["Fac"], mul.inputs[1])
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(mul.outputs[0], mix.inputs["Fac"])
    nt.links.new(src, mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m

def shadow_fade(root, keys, prop="seq_noshadow"):
    """Fade an item's cast shadows in (no popping when an item appears above the frame between
    the lights and the box). keys = [(frame, noshadow 0..1), ...]; materials are copied per item."""
    cache = {}
    for d in meshes_of(root):
        for slot in d.material_slots:
            m = slot.material
            if m is None or not m.use_nodes:
                continue
            if m.name not in cache:
                cache[m.name] = _wrap_noshadow(m.copy(), prop)
            slot.link = "OBJECT"           # never touch shared mesh data / other objects
            slot.material = cache[m.name]
        for f, v in keys:
            d[prop] = float(v)
            d.keyframe_insert(f'["{prop}"]', frame=f)
        linear_keys(d)
    return root


# ================================================================= tissue wings (baked shape keys)
def mat_tissue_uv(color="cobalt"):
    """kit.mat_tissue_thin look, but its crinkle bump rides on UV (metres) so it sticks to a
    deforming sheet instead of swimming through object space."""
    name = f"tissue_uv_{color}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _c._new_mat(name)
    uvn = nt.nodes.new("ShaderNodeUVMap")
    co = uvn.outputs["UV"]
    b.inputs["Base Color"].default_value = rgb(color)
    b.inputs["Roughness"].default_value = 0.6
    b.inputs["Sheen Weight"].default_value = 0.45
    b.inputs["Sheen Roughness"].default_value = 0.4
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.feature = "DISTANCE_TO_EDGE"
    v.inputs["Scale"].default_value = 140.0
    nt.links.new(co, v.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 420.0
    n.inputs["Detail"].default_value = 6.0
    n.inputs["Roughness"].default_value = 0.6
    n.inputs["Distortion"].default_value = 1.0
    nt.links.new(co, n.inputs["Vector"])
    b1 = nt.nodes.new("ShaderNodeBump"); b1.inputs["Strength"].default_value = 0.25
    b1.inputs["Distance"].default_value = 0.0008
    nt.links.new(v.outputs["Distance"], b1.inputs["Height"])
    b2 = nt.nodes.new("ShaderNodeBump"); b2.inputs["Strength"].default_value = 0.12
    b2.inputs["Distance"].default_value = 0.0003
    nt.links.new(n.outputs["Fac"], b2.inputs["Height"])
    nt.links.new(b1.outputs["Normal"], b2.inputs["Normal"])
    nt.links.new(b2.outputs["Normal"], b.inputs["Normal"])
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = rgb(color)
    nt.links.new(b2.outputs["Normal"], tr.inputs["Normal"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.22
    nt.links.new(b.outputs["BSDF"], mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], nt.nodes.get("Material Output").inputs["Surface"])
    return m

def _integrate(theta, ds, p0):
    """Cross-section curve from tangent angles (rad) along arc length (inextensible sheet)."""
    d = np.stack([np.cos(theta), np.sin(theta)], axis=-1) * ds
    c = np.concatenate([np.zeros((1, 2)), np.cumsum(d[:-1], axis=0)], axis=0)
    return c + p0

class Wing:
    """A tissue flap hinged along a line. Cross-section coordinates per column: (u, w) where
    u = horizontal distance INTO the box from the hinge, w = height above the hinge.
    pose(p) -> vertex array; poses are baked as shape keys keyed one-per-frame."""
    def __init__(self, name, hinge0, hinge1, inward, length, n_s=64, n_t=56, seed=0):
        self.name = name
        self.h0, self.h1 = Vector(hinge0), Vector(hinge1)
        self.inward = Vector(inward).normalized()
        self.L = length
        self.n_s, self.n_t = n_s, n_t
        self.rng = np.random.default_rng(seed)
        self.s = np.linspace(0.0, length, n_s)
        self.t = np.linspace(0.0, 1.0, n_t)
        # per-column variation (tissue never folds as a perfect cylinder)
        ph = self.rng.uniform(0, 6.28, 4)
        tt = self.t
        self.col_len = 1.0 - 0.10 * (0.5 + 0.5 * np.sin(2.3 * tt * 6.28 + ph[0])) * np.sin(np.pi * tt) ** 0.3
        # fold-progress lag along the hinge: smooth and small, or the sheet shears into "flames"
        self.col_lag = 0.028 * np.sin(0.8 * tt * 6.28 + ph[1]) + 0.008 * np.sin(1.9 * tt * 6.28 + ph[2])
        self.ph = ph

    def world(self, U, W):
        """(n_t, n_s) cross-section arrays -> (n_t*n_s, 3) world points."""
        a = np.array(self.h0); b = np.array(self.h1)
        base = a[None, :] + (b - a)[None, :] * self.t[:, None]          # (n_t, 3)
        inw = np.array(self.inward)
        P = base[:, None, :] + U[..., None] * inw[None, None, :]
        P[..., 2] += W
        return P.reshape(-1, 3)

    def build(self, mat):
        bm = bmesh.new()
        uvl = bm.loops.layers.uv.new()
        width = (self.h1 - self.h0).length
        vs = [[bm.verts.new((0, 0, 0)) for _ in range(self.n_s)] for _ in range(self.n_t)]
        for i in range(self.n_t - 1):
            for j in range(self.n_s - 1):
                f = bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
                for l, (ii, jj) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                    l[uvl].uv = (self.t[ii] * width, self.s[jj])
        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(o)
        me.materials.append(mat)
        for p in me.polygons:
            p.use_smooth = True
        self.obj = o
        return o

    def crinkle(self, P):
        """Small normal-ish displacement (baked into every pose, so it moves with the sheet)."""
        from mathutils import noise
        n_t, n_s = self.n_t, self.n_s
        width = (self.h1 - self.h0).length
        D = np.zeros((n_t, n_s))
        for i in range(n_t):
            for j in range(n_s):
                q = Vector((self.t[i] * width * 38.0 + self.ph[3], self.s[j] * 38.0, 0.0))
                D[i, j] = noise.noise(q) * 0.0016 + noise.noise(q * 3.1) * 0.0005
        return D

    def _displaced(self, U, W, D):
        dU = np.gradient(U, axis=1); dW = np.gradient(W, axis=1)
        ln = np.sqrt(dU ** 2 + dW ** 2) + 1e-9
        return self.world(U + D * (-dW / ln), W + D * (dU / ln))

    def bake_static(self, UW):
        """Single pose, no shape keys (stills)."""
        P = self._displaced(UW[0], UW[1], self.crinkle(None))
        self.obj.data.vertices.foreach_set("co", P.ravel())
        self.obj.data.update()
        sol = self.obj.modifiers.new("thick", "SOLIDIFY")
        sol.thickness = 0.00015
        sol.offset = 0.0
        return self.obj

    def bake(self, frames, pose_fn):
        """pose_fn(frame) -> (U, W) arrays (n_t, n_s). One shape key per frame, value 1 only there."""
        o = self.obj
        o.shape_key_add(name="Basis", from_mix=False)
        D = self.crinkle(None)
        keys = []
        for f in frames:
            U, W = pose_fn(f)
            # crinkle along the cross-section normal
            dU = np.gradient(U, axis=1); dW = np.gradient(W, axis=1)
            ln = np.sqrt(dU ** 2 + dW ** 2) + 1e-9
            nU, nW = -dW / ln, dU / ln
            U2, W2 = U + D * nU, W + D * nW
            P = self.world(U2, W2)
            kb = o.shape_key_add(name=f"f{f:03d}", from_mix=False)
            kb.data.foreach_set("co", P.ravel())
            keys.append((f, kb))
        # also make the basis the first pose (so anything outside the keyed range is sane)
        first = np.empty(len(o.data.vertices) * 3)
        keys[0][1].data.foreach_get("co", first)
        o.data.shape_keys.key_blocks["Basis"].data.foreach_set("co", first)
        fs = [f for f, _ in keys]
        for idx, (f, kb) in enumerate(keys):
            prev = fs[idx - 1] if idx > 0 else None
            nxt = fs[idx + 1] if idx + 1 < len(fs) else None
            kb.value = 0.0
            if prev is not None:
                kb.keyframe_insert("value", frame=prev)
            kb.value = 1.0
            kb.keyframe_insert("value", frame=f)
            kb.value = 0.0
            if nxt is not None:
                kb.keyframe_insert("value", frame=nxt)
            if idx == 0:
                kb.value = 1.0
                kb.keyframe_insert("value", frame=f - 1000)   # hold the first pose before
            if nxt is None:
                kb.value = 1.0
                kb.keyframe_insert("value", frame=f + 1000)   # hold the last pose after
        kb0 = keys[0][1]
        linear_keys(o.data.shape_keys)
        sol = o.modifiers.new("thick", "SOLIDIFY")
        sol.thickness = 0.00015
        sol.offset = 0.0
        return o


def drape_profile(bvh, origin, inward, lateral, n=220, umax=0.20, clear=0.0045, sag=55.0,
                  spread=(-0.005, 0.0, 0.005)):
    """Support height along a ray into the box (relative to origin z) - max over a few lateral
    offsets so neighbouring columns never slice an edge running along them - then a bridging
    envelope: tissue spans valleys instead of following every crevice.
    Returns (u, W_envelope, u_s, S_support) with the hinge prepended to the envelope."""
    u = np.linspace(0.0, umax, n)
    S = np.full(n, -1.0)
    lat = Vector(lateral).normalized()
    for i, uu in enumerate(u):
        p = Vector(origin) + Vector(inward) * uu
        for dl in spread:
            for du in (-0.003, 0.003):
                q = p + lat * dl + Vector(inward) * du
                hit = bvh.ray_cast(Vector((q.x, q.y, 0.6)), Vector((0, 0, -1)), 1.0)
                if hit[0] is not None:
                    S[i] = max(S[i], hit[0].z - origin[2] + clear)
    S = np.maximum(S, -origin[2] + kit.FLOOR_Z)
    # envelope: W(u) = max_k S(u_k) - sag*(u-u_k)^2  (a sheet with some bending stiffness)
    W = np.max(S[None, :] - sag * (u[:, None] - u[None, :]) ** 2, axis=1)
    # the sheet starts AT the hinge: prepend it so the integrated sheet is not offset by W(0)
    return np.concatenate([[0.0], u + 1e-4]), np.concatenate([[0.0], W]), u, S

def theta_from_curve(u, w, L, n_s):
    """Arc-length re-parameterisation of (u, w) -> tangent angles theta(s) for s in [0, L]."""
    du, dw = np.diff(u), np.diff(w)
    seg = np.sqrt(du ** 2 + dw ** 2)
    sacc = np.concatenate([[0.0], np.cumsum(seg)])
    ang = np.arctan2(dw, du)
    s = np.linspace(0.0, L, n_s)
    mids = 0.5 * (sacc[:-1] + sacc[1:])
    th = np.interp(s, mids, np.unwrap(ang))
    return th

class FoldWing(Wing):
    def setup(self, s_rim, bend_r, bvh, lead=0.38, z_max=0.140):
        n_t, n_s = self.n_t, self.n_s
        L = self.L
        a = np.array(self.h0); b = np.array(self.h1)
        tt = self.t[:, None]
        # final: draped over the goods (ray-cast heightfield) per column
        prof = []
        self.sup = []
        Lc = np.empty(n_t)
        for i in range(n_t):
            o = a + (b - a) * self.t[i]
            u, w, us, sup = drape_profile(bvh, o, self.inward, self.h1 - self.h0)
            prof.append((u, w))
            self.sup.append((us, sup))
            # never climb above z_max (the closed lid's ceiling is 0.150)
            seg = np.sqrt(np.diff(u) ** 2 + np.diff(w) ** 2)
            sacc = np.concatenate([[0.0], np.cumsum(seg)])
            over = np.nonzero(w + o[2] > z_max)[0]
            s_cap = sacc[over[0]] if len(over) else 1e9
            Lc[i] = min(L * self.col_len[i], s_cap)
        S = np.linspace(0.0, 1.0, n_s)[None, :] * Lc[:, None]
        self.S = S
        self.ds = np.gradient(S, axis=1)
        # initial: up the wall (leaning in a hair), a soft roll over the rim, hanging down outside;
        # per-column variation of where/how it rolls so the edge reads as paper, not a ruler line
        ph = self.ph
        s_r = s_rim + 0.007 * (0.5 + 0.5 * np.sin(tt * 9.0 + ph[1])) * (0.6 + 0.4 * np.sin(tt * 23.0 + ph[2]))
        br = bend_r * (1.0 + 0.45 * (0.5 + 0.5 * np.sin(tt * 13.0 + ph[3])))
        lean = 0.04 * (0.5 + 0.5 * np.sin(tt * 7.0 + ph[0]))
        th_i = math.pi / 2 - lean + (math.pi + lean) * np_smooth(s_r, s_r + math.pi * br, S)
        # (always outward once hanging: theta < 270° hangs away from the wall)
        th_i -= 0.14 * (0.5 + 0.5 * np.sin(tt * 11.0 + ph[0])) * np_smooth(
            s_r + math.pi * br, s_r + math.pi * br + 0.03, S)
        self.th_i = th_i
        th_f = np.zeros_like(S)
        for i in range(n_t):
            u, w = prof[i]
            th_f[i] = theta_from_curve(u, w, S[i, -1], n_s)
        # keep the clockwise branch: final angles below the initial ones everywhere
        th_f = np.where(th_f > th_i, th_f - 2 * math.pi, th_f)
        self.th_f = th_f
        self.lead = lead
        self.z_max = z_max

    def pose(self, p):
        """p in [0, 1]: the tip leads (a hand carries the flap over), the base follows; any point
        that would dip into the goods mid-fold rides on top of them (support projection)."""
        sn = self.S / self.S[:, -1:]
        cl = self.col_lag - self.col_lag.min()
        lag = self.lead * (1.0 - sn) + cl[:, None]
        span = 1.0 - (self.lead + cl.max())
        q = np.clip((p - lag) / span, 0.0, 1.0)
        q = q * q * (3 - 2 * q)
        th = self.th_i + (self.th_f - self.th_i) * q
        dU = np.cos(th) * self.ds
        dW = np.sin(th) * self.ds
        U = np.concatenate([np.zeros((self.n_t, 1)), np.cumsum(dU[:, :-1], axis=1)], axis=1)
        W = np.concatenate([np.zeros((self.n_t, 1)), np.cumsum(dW[:, :-1], axis=1)], axis=1)
        for i in range(self.n_t):
            us, sup = self.sup[i]
            m = (U[i] > 0.0005) & (U[i] < us[-1])
            if m.any():
                W[i, m] = np.maximum(W[i, m], np.interp(U[i, m], us, sup))
        return U, W

def np_smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)
np_smooth = np_smooth


WING_HZ = 0.094       # where a flap leaves the bunched bay lining at the wall

def make_wings(K, timing=None, frame_after=120, n_t=72, n_s=60):
    """The two cobalt tissue flaps of the hoodie bay (left wall + back wall).
    timing=((f0, f1), (f0, f1)) -> fold baked as per-frame shape keys (sequence);
    timing=None -> built folded in (final pose, static mesh) for stills."""
    mat = mat_tissue_uv("cobalt")
    in_x = kit.BOX_W / 2 - kit.BOARD
    in_y = kit.BOX_D / 2 - kit.BOARD
    hz = WING_HZ
    spec = [
        ("WingLeft", (-in_x + 0.008, -0.118, hz), (-in_x + 0.008, 0.112, hz), (1, 0, 0), 0.122, 4),
        ("WingBack", (-0.212, in_y - 0.008, hz), (-0.042, in_y - 0.008, hz), (0, -1, 0), 0.118, 9),
    ]
    sc = bpy.context.scene
    supports = [K["hoodie"], K["cap"], K["lining"]]
    wings = []
    for k, (name, h0, h1, inw, L, seed) in enumerate(spec):
        w = FoldWing(name, h0, h1, inw, L, n_s=n_s, n_t=n_t, seed=seed)
        if timing is not None and wings:
            sc.frame_set(frame_after)
        # later wings lie ON the earlier ones (no coincident sheets at the corner)
        hb = group_bvh(supports + [x.obj for x in wings])
        w.setup(s_rim=kit.BOX_H + 0.002 - hz, bend_r=0.011, bvh=hb)
        w.build(mat)
        if timing is None:
            w.bake_static(w.pose(1.0))
        else:
            f0, f1 = timing[k]
            def pf(f, w=w, f0=f0, f1=f1):
                return w.pose(ease_in_out((f - f0) / (f1 - f0), 2.2))
            w.bake(list(range(f0 - 1, f1 + 2)), pf)
            w.f0, w.f1 = f0, f1
        wings.append(w)
    if timing is not None:
        sc.frame_set(frame_after)
    bpy.context.view_layer.update()
    for w in wings:
        w.final_lo, w.final_hi = world_bbox(w.obj)
    return wings


# ================================================================= compositor: exact border colour
def _pbr_neutral(c):
    """Khronos PBR Neutral tone map (scene linear -> display linear), per the spec."""
    start, desat = 0.8 - 0.04, 0.15
    x = min(c)
    off = x - 6.25 * x * x if x < 0.08 else 0.04
    c = [v - off for v in c]
    peak = max(c)
    if peak < start:
        return c
    d = 1 - start
    newp = 1 - d * d / (peak + d - start)
    c = [v * newp / peak for v in c]
    g = 1 - 1 / (desat * (peak - newp) + 1)
    return [v * (1 - g) + newp * g for v in c]

def inverse_view(hex_color):
    """Scene-linear RGB that renders as `hex_color` through Khronos PBR Neutral (dark colours)."""
    tgt = rgb(hex_color)[:3]
    x = list(tgt)
    for _ in range(60):     # fixed-point / Newton-free iteration (monotone, converges fast)
        y = _pbr_neutral(x)
        x = [max(0.0, xi + (ti - yi)) for xi, ti, yi in zip(x, tgt, y)]
    return tuple(x)

def _fade_mask(w, h, inner=0.74, outer=0.985, p=4.0, name="seq_edge_mask"):
    im = bpy.data.images.new(name, w, h, alpha=False, float_buffer=True)
    x = (np.arange(w) + 0.5) / w * 2 - 1
    y = (np.arange(h) + 0.5) / h * 2 - 1
    X, Y = np.meshgrid(x, y)
    d = (np.abs(X) ** p + np.abs(Y) ** p) ** (1 / p)
    t = np.clip((d - inner) / (outer - inner), 0, 1)
    f = t * t * (3 - 2 * t)          # 0 inside, 1 at the border
    px = np.repeat(f.astype(np.float32)[..., None], 4, axis=2)
    px[..., 3] = 1
    im.pixels.foreach_set(px.ravel())
    path = os.path.join(bpy.app.tempdir or "/tmp", f"{name}_{w}x{h}.exr")
    im.filepath_raw = path
    im.file_format = "OPEN_EXR"
    im.save()
    bpy.data.images.remove(im)
    im = bpy.data.images.load(path, check_existing=False)
    im.colorspace_settings.name = "Non-Color"
    return im

def edge_lock(hex_color="ink", inner=0.74, outer=0.985, p=4.0):
    """Compositor: mix the render toward the exact scene-linear value of `hex_color` with a
    super-ellipse mask that is 1 on the frame border -> the border pixels are exactly that
    colour after the view transform (canvas blends invisibly into the page section)."""
    s = bpy.context.scene
    w = int(s.render.resolution_x * s.render.resolution_percentage / 100)
    h = int(s.render.resolution_y * s.render.resolution_percentage / 100)
    s.use_nodes = True
    nt = s.node_tree
    nt.nodes.clear()
    rl = nt.nodes.new("CompositorNodeRLayers")
    im = nt.nodes.new("CompositorNodeImage")
    im.image = _fade_mask(w, h, inner, outer, p)
    col = nt.nodes.new("CompositorNodeRGB")
    lin = inverse_view(hex_color)
    col.outputs[0].default_value = (lin[0], lin[1], lin[2], 1.0)
    mix = nt.nodes.new("CompositorNodeMixRGB")
    mix.blend_type = "MIX"
    nt.links.new(im.outputs["Image"], mix.inputs[0])
    nt.links.new(rl.outputs["Image"], mix.inputs[1])
    nt.links.new(col.outputs[0], mix.inputs[2])
    comp = nt.nodes.new("CompositorNodeComposite")
    comp.use_alpha = False
    nt.links.new(mix.outputs[0], comp.inputs["Image"])
    return lin
