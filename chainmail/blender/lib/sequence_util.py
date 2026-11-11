"""
chainmail — helpers for the packing sequence (scenes/kit_sequence.py) and the hero
still (scenes/kit_hero_open.py). Owned by the sequence scenes; item libs never import it.

  build_kit(...)             -> dict   the packed kit at its FINAL rest poses (box-local == world),
                                       assembled from the public kit/apparel/accessories/vessels
                                       builders with fit fixes (see FIT NOTES) so nothing intersects.
                                       Layout: Black hoodie, White cap yawed 70 deg in the bay's front-left
                                       corner (hood + drawcord grommets read behind it), card across the
                                       far ends of tumbler + bottle (label + etched mark read).
  make_wings(K, timing)      -> [Wing] the two cobalt tissue flaps of the hoodie bay: draped over the box
                                       rim, folded in over the goods. timing -> fold baked as per-frame
                                       shape keys; None -> static at static_pose. The free edge is a
                                       smooth, slightly irregular, curled curve (no per-column cut-off).
  tissue_tuft(...)           a lopsided crumpled tissue tuft (optional gap filler; not used by default).
  glide(), ease_*, drop_z()  easing: glide = velocity-limited move (distance spread over the frames).
  screen_linear(...)         world drop that moves through the CAMERA frame with a given profile.
  key_transform(...)         bake an object's per-frame transform (LINEAR keys, motion-blur safe).
  keep_vis(), shadow_fade()  appear one frame before entering; cast shadows fade in (no light pops).
  group_bvh(), overlaps()    world-space BVH of an object hierarchy + pairwise interpenetration test.
  rest_drop(...)             ray-cast "lower until touching" for an object group onto supports.
  start_height(...)          how high an item must start so it is fully above the camera frame.
  tame_microbump(...)        scene-level: clamp pixel-scale procedural bump on paper/pulp/tissue/wrap.
  edge_lock(...)             compositor: blends the frame border to an exact sRGB colour (#0B0B0F).

FIT NOTES (lib geometry vs the kit insert, measured at build time, so they adapt if libs change):
  * apparel.folded_hoodie is 231 x 285 mm incl. the peeking cuff; the hoodie bay is 210 x 292 mm
    -> UNIFORM xy scale (~0.88, logo keeps its proportions), bbox centred in the bay;
  * vessels.bottle("manojo") is Ø94.4 mm; kit.insert()'s bottle cradle is Ø85 mm -> uniformly scaled
    (~0.877), then slid along -Y until its shoulder clears the cradle cone;
  * accessories.cap(depth=0.21) (the lib's kit-pose footprint) is ~90 mm tall: on the packed hoodie it
    tops out ~0.133 < the closed lid's inner ceiling 0.150 -> no crown squash needed; it is lifted until
    it clears the hoodie by >= 0.5 mm (exact BVH test, lift_clear);
  * packed_box()'s lining tissue overhangs into the product pocket -> rebuilt with the pocket edge as
    a bound; the note card is ray-cast onto the real tumbler/bottle tops.
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

def lerp(a, b, t):
    return a + (b - a) * t

_GLIDE_CACHE = {}

def glide(t, a=0.18, d=0.55, v_end=0.12, v0=0.0):
    """Velocity-limited move, normalised 0..1: the speed ramps up smoothly over the first `a`
    of the time, cruises, then ramps down over the last `d` to `v_end` x cruise speed at t=1
    (a soft touchdown, not a dead stop). Unlike ease_out(p=3), the distance is spread evenly
    over the visible frames, so a scroll-scrubbed move is never a 2-frame jump. v0 > 0: already
    moving at v0 x cruise at t=0 (an item that starts just outside the frame enters at a steady,
    low speed instead of accelerating on screen)."""
    t = clamp01(t)
    key = (round(a, 4), round(d, 4), round(v_end, 4), round(v0, 4))
    if key not in _GLIDE_CACHE:
        x = np.linspace(0.0, 1.0, 4001)
        up = np.clip(x / a, 0, 1) if a > 0 else np.ones_like(x)
        up = v0 + (1 - v0) * up * up * (3 - 2 * up)
        dn = np.clip((x - (1 - d)) / d, 0, 1) if d > 0 else np.zeros_like(x)
        dn = dn * dn * (3 - 2 * dn)
        v = up * (1 - (1 - v_end) * dn)
        s = np.concatenate([[0.0], np.cumsum(0.5 * (v[1:] + v[:-1]) * np.diff(x))])
        _GLIDE_CACHE[key] = (x, s / s[-1])
    x, s = _GLIDE_CACHE[key]
    return float(np.interp(t, x, s))

def drop_z(f, f0, f1, z_start, z_rest, p=3.2, bounce=0.0012, bounce_frames=5.0, profile=None):
    """Vertical lowering: at f0 the item is at z_start, moves to touch z_rest at f1 (ease-out of
    power p, or profile(t) -> 0..1 e.g. glide), then a tiny soft bounce (up only: never below the
    rest height) settles it."""
    if f <= f0:
        return z_start
    if f < f1:
        u = (f - f0) / (f1 - f0)
        return lerp(z_start, z_rest, profile(u) if profile else ease_out(u, p))
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

def tight_bbox(root):
    """World bbox of the evaluated vertices (exact for rotated items, unlike object-bbox corners)."""
    P = world_points(root)
    return Vector(P.min(axis=0)), Vector(P.max(axis=0))

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


def lift_clear(moving, supports, margin=0.0005, step=0.0002, max_lift=0.02):
    """Raise `moving` until its triangles touch none of `supports` (BVH overlap, exact), then by
    `margin` more -> a guaranteed vertical clearance (rest_drop only probes vertices, so a support's
    bump between two of the item's vertices can still poke through). Returns the total lift."""
    B = group_bvh(supports)
    lifted = 0.0
    if B is not None:
        while lifted < max_lift:
            A = group_bvh([moving])
            if A is None or not A.overlap(B):
                break
            moving.location.z += step
            lifted += step
            bpy.context.view_layer.update()
    moving.location.z += margin
    bpy.context.view_layer.update()
    return lifted + margin


# ================================================================= kit assembly
def _item(kind, arg):
    try:
        if kind == "hoodie":
            import apparel
            return apparel.folded_hoodie(arg)
        if kind == "cap":
            import accessories
            color, depth = arg if isinstance(arg, tuple) else (arg, None)
            return accessories.cap(color, depth=depth) if depth else accessories.cap(color)
        if kind == "tumbler":
            import vessels
            return vessels.tumbler(arg)
        if kind == "bottle":
            import vessels
            return vessels.bottle(arg)
    except Exception as e:  # a lib mid-edit: fall back to the packaging proxies
        print(f"[seq] {kind}: lib failed ({type(e).__name__}: {e}); using kit proxy")
    return kit._item(kind, arg[0] if isinstance(arg, tuple) else arg)

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

# packed layout (box-local). The card lies across the far ends of tumbler + bottle (portrait, pushed to
# the back wall) so the bottle label and the tumbler's etched mark both read in front of it.
# cap: pushed into the FRONT-LEFT corner of the bay and yawed 70 deg (brim toward the right, peeking past
# the front wall; embroidered logo turned to the camera) so the hood + drawcord grommets read behind it
# (ray-cast from the hero camera: ~70 % of the hood zone visible vs 25 % for a straight cap)
CAP_XY = (-0.30, -0.30)            # clamped into the bay (3 mm margin) -> front-left corner
CAP_ROT = 70.0                     # extra yaw (deg, + = brim swings toward +X)
CAP_DEPTH = 0.21                   # accessories.cap(depth=...) kit-pose footprint (BRIEF: ~0.19 deep)
CARD_POSE = (0.152, 0.09, -3.0)    # x, y (clamped to the back wall), rot_z (deg): across the far ends
TUMBLER_LOGO_Z = 0.072             # kit staging: etched mark moved toward the base (front) so it clears the card
HERO_CAP = CAP_XY + (CAP_ROT, CAP_DEPTH)   # (x, y | 99 = front of the bay, yaw deg, depth m | 0 = full size)
WING_ONLY = ("WingLeft",)          # the back flap is left open: the hood + drawcords of the hoodie read
WING_OPTS = {"WingLeft": dict(stop_z=0.118), "WingBack": dict(L=0.085, stop_z=0.105)}
TUFTS = [   # (x, y, footprint x, footprint y, height, rot_z, seed)
    (0.016, 0.084, 0.060, 0.115, 0.044, 6.0, 11),     # behind the product
    (0.016, -0.150, 0.064, 0.036, 0.030, -8.0, 12),   # in front of the product
]

def build_kit(number=1, edition=48, hoodie="Black", cap="White", tumbler="Matte Black", spirit="manojo",
              puffs=True, cap_xy=CAP_XY, card_pose=CARD_POSE, cap_rot=CAP_ROT, cap_depth=CAP_DEPTH,
              cap_clear=0.0005, log=None):
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
    # --- hoodie: pressed to the packed height; UNIFORM xy scale to the bay (the lib's fold is wider
    #     than the bay incl. the peeking cuff) so the embroidered logo keeps its proportions
    h = _item("hoodie", hoodie)
    lo, hi = kit.world_bbox(h)
    if hi.z - lo.z > kit.HOODIE_PACKED_H + 1e-4:
        h.scale.z *= kit.HOODIE_PACKED_H / (hi.z - lo.z)
    kit.place(h, "hoodie")
    lo, hi = kit.world_bbox(h)
    m = 0.003
    s = min(1.0, (x1 - x0 - 2 * m) / (hi.x - lo.x), (y1 - y0 - 2 * m) / (hi.y - lo.y))
    if s < 1.0:
        h.scale.x *= s; h.scale.y *= s
        notes.append(f"hoodie: {1000 * (hi.x - lo.x):.0f}x{1000 * (hi.y - lo.y):.0f} mm folded > bay "
                     f"{1000 * (x1 - x0):.0f}x{1000 * (y1 - y0):.0f} mm -> uniform xy scale {s:.3f}")
    kit.place(h, "hoodie")
    lo, hi = kit.world_bbox(h)            # centre the (asymmetric, cuff) bbox in the bay
    h.location.x += (x0 + x1) / 2 - (lo.x + hi.x) / 2
    h.location.y += (y0 + y1) / 2 - (lo.y + hi.y) / 2
    bpy.context.view_layer.update()
    K["hoodie"] = h
    # --- cap nested on the hoodie (ray-cast onto its real top), front-left of the bay
    c = _item("cap", (cap, cap_depth))
    kit.place(c, "cap")
    if cap_rot:
        c.rotation_euler.z += math.radians(cap_rot)
        bpy.context.view_layer.update()
    lo, hi = tight_bbox(c)                # vertex bbox: a yawed cap's object-bbox corners over-pad
    cx = cap_xy[0] if cap_xy and cap_xy[0] is not None else (lo.x + hi.x) / 2
    cx = min(max(cx, x0 + m + (hi.x - lo.x) / 2), x1 - m - (hi.x - lo.x) / 2)
    if cap_xy and cap_xy[1] is not None:
        cy = min(max(cap_xy[1], y0 + m + (hi.y - lo.y) / 2), y1 - m - (hi.y - lo.y) / 2)
    else:
        cy = y0 + m + (hi.y - lo.y) / 2
    c.location.x += cx - (lo.x + hi.x) / 2
    c.location.y += cy - (lo.y + hi.y) / 2
    bpy.context.view_layer.update()
    rest_drop(c, [h], clearance=0.0006)
    lo, hi = tight_bbox(c)
    lift = lift_clear(c, [h], margin=cap_clear)
    notes.append(f"cap: {1000 * (hi.x - lo.x):.0f}x{1000 * (hi.y - lo.y):.0f}x{1000 * (hi.z - lo.z):.0f} mm "
                 f"(depth {cap_depth}), rot {cap_rot:+.0f} deg, lifted {1000 * lift:.2f} mm to clear the "
                 f"hoodie by {1000 * cap_clear:.1f} mm; top z {kit.world_bbox(c)[1].z:.4f}")
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
    # --- note card across the BACK of the tumbler + bottle tops (ray-cast, never through)
    card = kit.note_card(number=number, edition=edition)
    tops = []
    for o in (tm, b):
        lo, hi = kit.world_bbox(o)
        tops.append(((lo.x + hi.x) / 2, hi.z))
    (xt, zt), (xb, zb) = tops
    ang = math.atan2(zb - zt, xb - xt)
    cxp, cyp, crz = card_pose if card_pose else (kit.SLOTS["card"][0], kit.SLOTS["card"][1], kit.SLOTS["card"][3])
    card.rotation_euler = (0.0, -ang, math.radians(crz))
    card.location = (cxp, cyp, max(zt, zb) + 0.01)
    bpy.context.view_layer.update()
    # keep it inside the insert (back wall) whatever the rotation
    lo, hi = kit.world_bbox(card)
    lim = kit.BOX_D / 2 - kit.BOARD - 0.004
    if hi.y > lim:
        card.location.y -= hi.y - lim
        bpy.context.view_layer.update()
    rest_drop(card, [tm, b], clearance=0.0005)
    K["card"] = card
    # --- tissue tufts in the gaps (stuffed last, before the card)
    K["puffs"] = []
    if puffs:
        for i, (px, py, sx, sy, sz, rz, seed) in enumerate(TUFTS):
            pf = tissue_tuft((sx, sy, sz), seed=seed + number)
            pf.location = (px, py, kit.INS_TOP + 0.02)
            pf.rotation_euler = (0, 0, math.radians(rz))
            bpy.context.view_layer.update()
            rest_drop(pf, [ins], clearance=0.0003)     # sits ON the insert top, not sunk into it
            for k in range(8):                          # shrink until it touches no rigid item
                if overlaps([pf], [p, tm, b, card]) == 0:
                    break
                pf.scale *= 0.92
                bpy.context.view_layer.update()
                rest_drop(pf, [ins], clearance=0.0003)
            K["puffs"].append(pf)
    K["notes"] = notes
    return K

def tissue_tuft(size=(0.06, 0.10, 0.04), seed=0, color="cobalt", name=None):
    """A loose, crumpled tuft of tissue stuffed into a gap: an irregular, lopsided mound with
    sharp random creases (voronoi F2-F1 ridges at two scales) — no radial symmetry, no 'petals'.
    Origin at its underside centre, resting on z=0."""
    from mathutils import noise
    rnd = random.Random(seed * 7919 + 13)
    off = [Vector((rnd.uniform(-50, 50), rnd.uniform(-50, 50), rnd.uniform(-50, 50))) for _ in range(5)]
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1.0)
    a, b_, h = size[0] / 2, size[1] / 2, size[2]
    peak = Vector((rnd.uniform(-0.35, 0.35), rnd.uniform(-0.35, 0.35), 0))   # lopsided crest
    for v in bm.verts:
        p = v.co.copy()
        lob = noise.fractal(p * 1.0 + off[0], 0.5, 2.0, 2)
        r = 1.0 + 0.26 * lob
        # big pillowy facets with sharp V creases between them (F2-F1 is ~0 on cell borders),
        # a sparser second layer of creases across them; no fine noise (reads as sponge)
        d1 = noise.voronoi(p * 1.9 + off[1])[0]
        d2 = noise.voronoi(p * 4.2 + off[2])[0]
        r += 0.20 * min(d1[1] - d1[0], 0.45) + 0.045 * min(d2[1] - d2[0], 0.35)
        r += 0.006 * noise.noise(p * 9.0 + off[3])
        q = p * r
        z = q.z
        if z > 0:
            tilt = 1.0 + 0.45 * (p.x * peak.x + p.y * peak.y)
            z = h * (z / 1.45) ** 0.85 * tilt
        else:
            z = 0.0004 + 0.0015 * (-z)          # the tucked-under bottom, just above the support
        v.co = Vector((q.x / 1.3 * a, q.y / 1.3 * b_, max(z, 0.0004)))
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new(name or f"TissueTuft_{seed}")
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name or f"TissueTuft_{seed}", me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(kit.mat_tissue_thin(color))
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.00015
    sol.offset = 0.0
    return o

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


def screen_linear(cam, obj, dz0, prof, n=160):
    """u (0..1) -> dz (dz0..0) such that the item's bbox centre moves through the CAMERA FRAME with
    the velocity profile prof(u) (perspective: high, near-camera positions sweep the frame faster
    for the same world speed, so a world-space ease makes the first visible frames jump)."""
    lo, hi = kit.world_bbox(obj)
    c = (lo + hi) / 2
    dzs = np.linspace(0.0, dz0, n)
    ys = np.array([project(cam, [c + Vector((0, 0, d))])[0].y for d in dzs])
    ys = np.maximum.accumulate(ys)                  # monotone (guards numerical wobble)
    y0, y1 = ys[-1], ys[0]
    def f(u):
        y = y0 + (y1 - y0) * prof(u)
        return float(np.interp(y, ys + np.arange(n) * 1e-9, dzs))
    return f


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
    # (matte_tissue() turns this into matte paper; kept as the base so the two tissue looks match)
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
        """Paper crumple along the sheet normal (baked into every pose, so it moves with the sheet):
        flat-ish facets separated by SHARP creases (voronoi F2-F1 ridges, two scales, random sign per
        cell so creases are both mountain and valley folds) + a slow wave; no smooth noise ripples
        (those read as satin / melted wax)."""
        from mathutils import noise
        n_t, n_s = self.n_t, self.n_s
        width = (self.h1 - self.h0).length
        D = np.zeros((n_t, n_s))
        o1 = Vector((self.ph[3] * 3.0, 1.7, 0.3)); o2 = Vector((5.1, self.ph[2] * 2.0, 2.9))
        for i in range(n_t):
            for j in range(n_s):
                q = Vector((self.t[i] * width, self.s[j], 0.0))
                d1, p1 = noise.voronoi(q * 34.0 + o1)[:2]
                d2, p2 = noise.voronoi(q * 71.0 + o2)[:2]
                # facet tilt: each cell is a tilted plane (gradient across it), creases where cells meet
                sgn1 = 1.0 if (math.sin(p1[0].x * 12.9898 + p1[0].y * 78.233) * 43758.5) % 1.0 > 0.5 else -1.0
                r1 = min(d1[1] - d1[0], 0.6)
                r2 = min(d2[1] - d2[0], 0.5)
                D[i, j] = (sgn1 * 0.0021 * (0.6 - r1) / 0.6 + 0.0007 * (r2 - 0.25) / 0.25
                           + 0.0006 * noise.noise(q * 9.0 + o2))
        D -= D.mean()
        # the hinge row stays on its line (no gap at the wall), free edge keeps full crumple
        ramp = np.clip(np.linspace(0.0, 1.0, n_s) / 0.12, 0.0, 1.0)[None, :]
        return D * ramp

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
                  spread=(-0.012, -0.006, 0.0, 0.006, 0.012)):
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

def _erode_blur(x, w):
    """Smooth LOWER envelope of a per-column signal: running min over +-w columns, then a
    Gaussian (sigma w/3, truncated at +-w). Result <= x everywhere, and free of kinks."""
    n = len(x)
    xp = np.pad(x, w, mode="edge")
    er = np.array([xp[i:i + 2 * w + 1].min() for i in range(n)])
    k = np.exp(-0.5 * (np.arange(-w, w + 1) / max(w / 3.0, 1e-6)) ** 2)
    k /= k.sum()
    ep = np.pad(er, w, mode="edge")
    return np.convolve(ep, k, mode="valid")

def _blur_cols(A, sigma):
    """Gaussian blur of a (n_t, n_s) field along the column (hinge) axis."""
    if sigma <= 0:
        return A
    w = int(math.ceil(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-w, w + 1) / sigma) ** 2)
    k /= k.sum()
    Ap = np.pad(A, ((w, w), (0, 0)), mode="edge")
    return sum(k[j] * Ap[j:j + A.shape[0]] for j in range(2 * w + 1))

class FoldWing(Wing):
    def setup(self, s_rim, bend_r, bvh, lead=0.38, stop_z=0.120, curl=0.55, curl_len=0.016,
              edge_var=0.006, smooth_w=12, min_len=0.035, lat_sigma=3.0):
        """Final pose = drape over the goods (ray-cast support envelope). The free edge is a SMOOTH,
        slightly irregular curve: each column may only reach the point where the support first
        climbs above stop_z (e.g. the flank of the cap's crown); that per-column limit is replaced
        by a smooth lower envelope (_erode_blur), varied by a few mm of low-frequency noise, and
        the last curl_len of the sheet lifts off in a soft curl (paper edges never lie dead flat)."""
        n_t, n_s = self.n_t, self.n_s
        L = self.L
        a = np.array(self.h0); b = np.array(self.h1)
        tt = self.t[:, None]
        prof = []
        self.sup = []
        lim = np.empty(n_t)
        for i in range(n_t):
            o = a + (b - a) * self.t[i]
            u, w, us, sup = drape_profile(bvh, o, self.inward, self.h1 - self.h0)
            prof.append((u, w))
            self.sup.append((us, sup))
            seg = np.sqrt(np.diff(u) ** 2 + np.diff(w) ** 2)
            sacc = np.concatenate([[0.0], np.cumsum(seg)])
            over = np.nonzero(w + o[2] > stop_z)[0]
            over = over[over > 0]
            lim[i] = sacc[over[0]] if len(over) else 1e9
        ph = self.ph
        lim = np.minimum(lim, L * self.col_len)
        Lc = _erode_blur(lim, smooth_w)
        # a few mm of slow variation (never longer than the limit)
        Lc = Lc - edge_var * (0.5 + 0.5 * np.sin(self.t * 6.28 * 1.3 + ph[0]) * np.sin(self.t * 6.28 * 0.55 + ph[2]))
        Lc = np.maximum(Lc, min_len)
        self.Lc = Lc
        S = np.linspace(0.0, 1.0, n_s)[None, :] * Lc[:, None]
        self.S = S
        self.ds = np.gradient(S, axis=1)
        # initial: up the wall (leaning in a hair), a soft roll over the rim, hanging down outside;
        # per-column variation of where/how it rolls so the edge reads as paper, not a ruler line
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
        # lateral bending stiffness: neighbouring columns cannot crease independently (a column-by-
        # column drape over an oblique edge, e.g. the cap's brim, makes a staircase of creases)
        th_f = _blur_cols(th_f, lat_sigma)
        # soft curl of the free edge (lifts up off the goods), varying along the edge
        cv = curl * (0.65 + 0.35 * np.sin(tt * 6.28 * 1.7 + ph[3]))
        th_f = th_f + cv * np_smooth(Lc[:, None] - curl_len, Lc[:, None], S)
        self.th_f = th_f
        self.lead = lead
        self.stop_z = stop_z

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

def make_wings(K, timing=None, frame_after=120, n_t=72, n_s=60, opts=None, static_pose=None, only=None,
               ease=None):
    """The two cobalt tissue flaps of the hoodie bay (left wall + back wall).
    timing=((f0, f1), (f0, f1)) -> fold baked as per-frame shape keys (sequence);
    timing=None -> built at static_pose[name] (default 1.0 = folded in) as a static mesh (stills).
    opts: {name: dict(L=..., stop_z=..., curl=...)} per-wing overrides; only: subset of names."""
    mat = mat_tissue_uv("cobalt")
    in_x = kit.BOX_W / 2 - kit.BOARD
    in_y = kit.BOX_D / 2 - kit.BOARD
    hz = WING_HZ
    spec = [
        ("WingLeft", (-in_x + 0.008, -0.118, hz), (-in_x + 0.008, 0.112, hz), (1, 0, 0), 0.122, 4),
        ("WingBack", (-0.212, in_y - 0.008, hz), (-0.042, in_y - 0.008, hz), (0, -1, 0), 0.118, 9),
    ]
    opts = opts or {}
    static_pose = static_pose or {}
    sc = bpy.context.scene
    supports = [K["hoodie"], K["cap"], K["lining"]]
    wings = []
    for k, (name, h0, h1, inw, L, seed) in enumerate(spec):
        if only is not None and name not in only:
            continue
        o = dict(opts.get(name, {}))
        L = o.pop("L", L)
        w = FoldWing(name, h0, h1, inw, L, n_s=n_s, n_t=n_t, seed=seed)
        if timing is not None and wings:
            sc.frame_set(frame_after)
        # later wings lie ON the earlier ones (no coincident sheets at the corner)
        hb = group_bvh(supports + [x.obj for x in wings])
        w.setup(s_rim=kit.BOX_H + 0.002 - hz, bend_r=0.011, bvh=hb, **o)
        w.build(mat)
        if timing is None:
            w.bake_static(w.pose(static_pose.get(name, 1.0)))
        else:
            f0, f1 = timing[k]
            ez = ease or (lambda u: ease_in_out(u, 2.2))
            def pf(f, w=w, f0=f0, f1=f1, ez=ez):
                return w.pose(ez((f - f0) / (f1 - f0)))
            w.bake(list(range(f0 - 1, f1 + 2)), pf)
            w.f0, w.f1 = f0, f1
        wings.append(w)
    if timing is not None:
        sc.frame_set(frame_after)
    bpy.context.view_layer.update()
    for w in wings:
        w.final_lo, w.final_hi = world_bbox(w.obj)
    return wings


# ================================================================= kit staging: tumbler etch position
def tumbler_logo_z(z=None, logo_h=0.016):
    """Scene-level staging (libs untouched): slide the tumbler's laser-etched 'your logo' along the
    body to height z (m from the tumbler base; the lib puts it at 0.142). Lying in the kit with its
    lid to the back, z=0.072 puts the mark ~1 cm in front of the note card's edge."""
    z = TUMBLER_LOGO_Z if z is None else z
    n = 0
    for m in bpy.data.materials:
        if not m.use_nodes or not m.name.startswith("tumbler_coat"):
            continue
        for nd in m.node_tree.nodes:
            if nd.type == "MATH" and nd.operation == "MULTIPLY_ADD" and \
                    abs(nd.inputs[1].default_value - 1.0 / logo_h) < 1e-3:
                nd.inputs[2].default_value = 0.5 - z / logo_h
                n += 1
    return n


# ================================================================= scene-level: lining edge + hoodie read
def crumple_lining(o, z0=0.066, z1=0.092, wave=0.028, crease=0.007, seed=5):
    """Break the bay lining's bunched wall edge (kit.tissue clamps the sheet at the walls -> a soft
    roll with a dead-straight top edge): two Z-only displacements weighted by height above the
    hoodie (z0..z1) - a low-frequency wave (the top edge rises and dips by ~wave) and sharp voronoi
    F2-F1 creases (paper folds). Z-only: a sheet standing along a wall slides within its own plane,
    so nothing is pushed into the walls or the goods."""
    M = o.matrix_world
    vg = o.vertex_groups.new(name="seq_crumple")
    for v in o.data.vertices:
        z = (M @ v.co).z
        vg.add([v.index], smoothstep(z0, z1, z), "REPLACE")
    t1 = bpy.data.textures.new(f"seq_lining_wave_{seed}", "CLOUDS")
    t1.noise_scale = 0.045
    t1.noise_depth = 1
    t2 = bpy.data.textures.new(f"seq_lining_crease_{seed}", "VORONOI")
    t2.noise_scale = 0.022
    t2.weight_1, t2.weight_2 = -1.0, 1.0
    t2.noise_intensity = 1.6
    mods = []
    for tex, st, mid in ((t1, wave, 0.5), (t2, crease, 0.35)):
        md = o.modifiers.new(f"seq_{tex.name}", "DISPLACE")
        md.texture = tex
        md.texture_coords = "GLOBAL"
        md.direction = "Z"
        md.strength = st
        md.mid_level = mid
        md.vertex_group = vg.name
        mods.append(md)
    # before the thickness (solidify) modifier
    for k, md in enumerate(mods):
        o.modifiers.move(o.modifiers.find(md.name), k)
    return o


def hoodie_pop(K, energy=6.0, loc=(-0.62, 0.52, 0.30), bump_mul=1.5):
    """The hoodie is matte black fleece in a deep bay: without help it reads as a dark slab. A low,
    grazing soft light from the back-left, light-linked to the hoodie ONLY (no spill, no shadows on
    anything else), rakes across the knit, the hood fold and the drawcords; the fleece/rib bump is
    lifted x bump_mul at scene level. Returns the light object."""
    meshes = meshes_of(K["hoodie"])
    mats = set()
    for d in meshes:
        for sl in d.material_slots:
            if sl.material and sl.material.use_nodes:
                mats.add(sl.material)
    for m in mats:
        if any(k in m.name for k in ("fleece", "rib", "jersey")):
            for nd in m.node_tree.nodes:
                if nd.type == "BUMP":
                    nd.inputs["Strength"].default_value = min(1.0, nd.inputs["Strength"].default_value * bump_mul)
    lo, hi = world_bbox(K["hoodie"])
    tgt = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2 + 0.04, hi.z))
    L = area_light("HoodieRake", Vector(loc), tgt, size=0.5, size_y=0.25, energy=energy, color=(1.0, 0.97, 0.94))
    L.visible_camera = False
    L.visible_glossy = True
    col = bpy.data.collections.new("seq_hoodie_rake")
    for d in meshes:
        col.objects.link(d)
    L.light_linking.receiver_collection = col
    for co in col.collection_objects:
        co.light_linking.link_state = "INCLUDE"
    return L


# ================================================================= material: matte tissue paper
def matte_tissue(rough=0.82, spec=0.18, transl=0.15, crease_scale=60.0, crease_strength=0.45):
    """Scene-level override (libs untouched) of every tissue material (kit.mat_tissue_thin, the
    wings' tissue_uv_*): MATTE paper - no sheen, low specular, rough - with thin-sheet translucency
    (~15 % translucent mix, the liner glows through) and a coarser, stronger voronoi crease bump
    (faceted crumple instead of fine satin ripples). Returns the material names changed."""
    out = []
    for m in bpy.data.materials:
        if not m.use_nodes or "tissue" not in m.name.lower():
            continue
        nt = m.node_tree
        for nd in nt.nodes:
            if nd.type == "BSDF_PRINCIPLED":
                nd.inputs["Roughness"].default_value = rough
                nd.inputs["Specular IOR Level"].default_value = spec
                nd.inputs["Sheen Weight"].default_value = 0.0
                nd.inputs["Coat Weight"].default_value = 0.0
            elif nd.type == "MIX_SHADER" and any(l.from_node.type == "BSDF_TRANSLUCENT"
                                                 for l in nd.inputs[2].links):
                nd.inputs["Fac"].default_value = transl
            elif nd.type == "TEX_VORONOI" and nd.feature == "DISTANCE_TO_EDGE":
                nd.inputs["Scale"].default_value = crease_scale
                for l in nd.outputs["Distance"].links:
                    if l.to_node.type == "BUMP":
                        l.to_node.inputs["Strength"].default_value = crease_strength
                        l.to_node.inputs["Distance"].default_value = 0.0012
        out.append(m.name)
    return out


# ================================================================= material: tame pixel-scale micro-bump
def tame_microbump(min_scale=250.0, detail_max=2.0, bump_mul=0.4, name_has=None, skip_has=("fleece", "knit",
                   "twill", "thread", "embroid", "apparel", "acc_", "glass", "liquid", "label", "cork")):
    """Scene-level override (libs untouched): procedural noise/voronoi finer than `min_scale`
    (object/UV space, i.e. sub-2 mm features) aliases into per-pixel salt-and-pepper speckle at
    hero/sequence framing (~0.3 mm/px) and OIDN keeps it as 'detail'. For paper / pulp / tissue /
    soft-touch materials: clamp the noise Detail (octaves) and scale the strength of the bump
    nodes they drive. Returns a list of (material, n_noise, n_bump) that were changed."""
    out = []
    for m in bpy.data.materials:
        if not m.use_nodes or m.node_tree is None:
            continue
        nm = m.name.lower()
        if skip_has and any(k in nm for k in skip_has):
            continue
        if name_has and not any(k in nm for k in name_has):
            continue
        nt = m.node_tree
        fine = set()
        n_noise = 0
        for nd in nt.nodes:
            if nd.type in ("TEX_NOISE", "TEX_VORONOI") and "Scale" in nd.inputs:
                sc_in = nd.inputs["Scale"]
                if not sc_in.links and sc_in.default_value >= min_scale:
                    fine.add(nd.name)
                    if nd.type == "TEX_NOISE" and nd.inputs["Detail"].default_value > detail_max:
                        nd.inputs["Detail"].default_value = detail_max
                        n_noise += 1
        n_bump = 0
        if fine:
            # bump nodes whose Height is driven (through math/maprange/mix) by a fine texture
            def driven(node, depth=0):
                if node.name in fine:
                    return True
                if depth > 4:
                    return False
                for inp in node.inputs:
                    for l in inp.links:
                        if l.from_node.type != "BUMP" and driven(l.from_node, depth + 1):
                            return True
                return False
            for nd in nt.nodes:
                if nd.type == "BUMP" and nd.inputs["Height"].links and \
                        driven(nd.inputs["Height"].links[0].from_node):
                    nd.inputs["Strength"].default_value *= bump_mul
                    n_bump += 1
        if n_noise or n_bump:
            out.append((m.name, n_noise, n_bump))
    return out


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
