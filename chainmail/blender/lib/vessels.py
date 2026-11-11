"""
chainmail vessels — the 25 oz insulated tumbler and the seven 750 ml spirit bottles.

Conventions (same as every lib in blender/lib):
  * metres, Z up; every builder returns ONE root Empty whose origin is the base
    centre, resting on Z=0, front (logo / label) facing -Y. Builders never create
    cameras/lights or render.

Public API
  tumbler(color="Matte Black", lid_open=False)  -> Empty  Ø0.083 x 0.265 m powder-coated steel
        tumbler: tapered double wall, exposed steel rim band, flip-handle lid with spout,
        laser-etched "your logo" (powder coat removed, steel shows through).
        color in TUMBLER_COLORS (catalog swatches) or any hex.
  bottle(kind)                                  -> Empty  750 ml spirit bottle, kind in BOTTLES:
        kettle-one, manojo, johnnie-black, jameson, four-roses, casamigos, maestro-dobel.
        Thick solid glass (outer + inner wall, punted base), liquid volume filled to 750 ml
        with a meniscus, real closure (cork/wood stopper or metal screw cap) and a blank
        minimal label (no trademarks).
  BOTTLES[kind]["height"], BOTTLES[kind]["fill_z"]
                                                 overall height incl. closure / liquid level (m); both
                                                 are filled in by bottle(kind) (the old private
                                                 "_height"/"_fill_z" keys are kept as aliases)
  bottle_info(kind)                              dict(fill_z, brimful_ml, height) — height is None
                                                 until bottle(kind) has been built once
  contact_occluder(root, kind=None, ...)         render helper: shadow-only disc just above the
                                                 floor inside a bottle/tumbler footprint, so a shadow
                                                 catcher records a tight contact crease under glass
  GLASS_SHADOW                                   fraction of light glass passes for shadow rays
"""
import bpy, bmesh, math, os, sys, json, shutil, subprocess
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from common import *  # noqa: F401,F403
import common as _c

TEX_DIR = os.path.join(ASSETS, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

TUMBLER_COLORS = {
    "Matte Black": "#1D1D1F",
    "Primrose": "#EBB3C4",
    "Lavender": "#CDB9E6",
    "Dune": "#D9D3CA",
}
TUMBLER_D, TUMBLER_H = 0.083, 0.265


# ================================================================= small helpers
def _link(o):
    bpy.context.scene.collection.objects.link(o)
    return o

def _root(name, children):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.05
    _link(e)
    for ch in children:
        ch.parent = e
    return e

def _mesh_obj(name, bm, mats=()):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    _link(o)
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    return o

def _python3():
    return shutil.which("python3") or "/usr/bin/python3"

def _pil(code, args):
    """Run a Pillow snippet with the system python (Blender's has no PIL)."""
    r = subprocess.run([_python3(), "-c", code, json.dumps(args)], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("PIL texture failed:\n" + r.stderr)

def _img(path, non_color=False):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color:
        im.colorspace_settings.name = "Non-Color"
    return im

def _lin(hexstr):
    return rgb(hexstr)

_MATS = {}
def _cached(key, fn):
    m = _MATS.get(key)
    try:
        ok = m is not None and bpy.data.materials.get(m.name) == m
    except ReferenceError:
        ok = False
    if not ok:
        m = fn()
        _MATS[key] = m
    return m


# ================================================================= profile geometry
def fillet(points, seg_per_rad=None, max_len=0.004, closed=False):
    """points: [(r, z, fillet_radius), ...]. Rounds every corner with a tangent arc
    (radius clamped to fit) and subdivides long segments so lofts get enough rings.
    Returns dense [(r, z), ...]."""
    P = [Vector((p[0], p[1])) for p in points]
    R = [p[2] if len(p) > 2 else 0.0 for p in points]
    n = len(P)
    pts = []
    for k in range(n):
        B = P[k]
        if (k == 0 or k == n - 1) and not closed or R[k] <= 0:
            pts.append(B.copy())
            continue
        A, C = P[k - 1], P[(k + 1) % n]
        u = (A - B); lu = u.length; u.normalize()
        v = (C - B); lv = v.length; v.normalize()
        cosang = max(-0.9999, min(0.9999, u.dot(v)))
        ang = math.acos(cosang)
        if ang > math.pi - 1e-3:
            pts.append(B.copy()); continue
        r = R[k]
        d = r / math.tan(ang / 2)
        dmax = 0.49 * min(lu, lv)
        if d > dmax:
            d = dmax
            r = d * math.tan(ang / 2)
        T1, T2 = B + u * d, B + v * d
        bis = (u + v).normalized()
        Cc = B + bis * (r / math.sin(ang / 2))
        a1 = math.atan2(T1.y - Cc.y, T1.x - Cc.x)
        a2 = math.atan2(T2.y - Cc.y, T2.x - Cc.x)
        da = a2 - a1
        while da > math.pi: da -= 2 * math.pi
        while da < -math.pi: da += 2 * math.pi
        nseg = max(3, int(abs(da) / math.radians(7)))
        for i in range(nseg + 1):
            a = a1 + da * i / nseg
            pts.append(Vector((Cc.x + r * math.cos(a), Cc.y + r * math.sin(a))))
    # subdivide long segments
    out = [pts[0]]
    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        L = (b - a).length
        if L < 1e-7:
            continue
        m = int(L / max_len)
        for j in range(1, m + 1):
            out.append(a.lerp(b, j / (m + 1)))
        out.append(b)
    return [(max(0.0, p.x), p.y) for p in out]


def offset_profile(prof, d):
    """Offset an open (r, z) polyline by d along its left normal (into a cavity
    for a bottom->top inner profile)."""
    out = []
    n = len(prof)
    for i in range(n):
        a = Vector(prof[max(0, i - 1)]); b = Vector(prof[min(n - 1, i + 1)])
        t = (b - a)
        if t.length < 1e-9:
            t = Vector((0, 1))
        t.normalize()
        nrm = Vector((-t.y, t.x))
        p = Vector(prof[i]) + nrm * d
        out.append((max(0.0, p.x), p.y))
    out[0] = (0.0, out[0][1])
    return out


class Section:
    """Cross-section of a loft. thetas: M angles (CCW from +X). base[i]: radial
    multiplier of the full shape (1 = circle). f(z) in [0,1] blends circle->shape."""
    def __init__(self, thetas, base=None, f=None):
        self.thetas = thetas
        self.base = base or [1.0] * len(thetas)
        self.f = f or (lambda z: 0.0)
        self.cs = [(math.cos(t), math.sin(t)) for t in thetas]

    def mult(self, i, z):
        fz = self.f(z)
        return 1.0 + (self.base[i] - 1.0) * fz

    def point(self, i, r, z, extra=1.0):
        m = self.mult(i, z) * extra
        c, s = self.cs[i]
        return (r * m * c, r * m * s, z)

    def area_unit(self, z):
        """Area of the cross-section for r = 1 at height z (cached per 0.1 mm)."""
        key = round(z * 10000)
        cache = self.__dict__.setdefault("_acache", {})
        if key in cache:
            return cache[key]
        A = 0.0
        M = len(self.thetas)
        for i in range(M):
            j = (i + 1) % M
            x1, y1, _ = self.point(i, 1.0, z)
            x2, y2, _ = self.point(j, 1.0, z)
            A += x1 * y2 - x2 * y1
        cache[key] = abs(A) / 2
        return cache[key]


def round_section(M=160):
    return Section([2 * math.pi * i / M for i in range(M)])


def poly_section(normals_deg, apothems, rc, M=256, f=None):
    """Convex rounded polygon (Minkowski sum of inset polygon + circle rc),
    resampled uniformly by arc length. Radius 1 == apothem of the first face."""
    ns = [math.radians(a) for a in normals_deg]
    K = len(ns)
    corners = []
    for k in range(K):
        n1, n2 = ns[k], ns[(k + 1) % K]
        a1, a2 = apothems[k] - rc, apothems[(k + 1) % K] - rc
        # solve [cos n1 sin n1; cos n2 sin n2] p = [a1 a2]
        det = math.cos(n1) * math.sin(n2) - math.sin(n1) * math.cos(n2)
        x = (a1 * math.sin(n2) - a2 * math.sin(n1)) / det
        y = (math.cos(n1) * a2 - math.cos(n2) * a1) / det
        corners.append((x, y, n1, n2))
    dense = []
    for (x, y, n1, n2) in corners:
        if n2 < n1:
            n2 += 2 * math.pi
        steps = 24
        for s in range(steps + 1):
            a = n1 + (n2 - n1) * s / steps
            dense.append((x + rc * math.cos(a), y + rc * math.sin(a)))
    # resample by arc length
    L = [0.0]
    for i in range(1, len(dense) + 1):
        a = dense[i - 1]; b = dense[i % len(dense)]
        L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    tot = L[-1]
    pts = []
    j = 0
    for i in range(M):
        s = tot * i / M
        while L[j + 1] < s:
            j += 1
        a = dense[j]; b = dense[(j + 1) % len(dense)]
        t = (s - L[j]) / max(1e-12, L[j + 1] - L[j])
        pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    thetas = [math.atan2(p[1], p[0]) for p in pts]
    base = [math.hypot(*p) for p in pts]
    return Section(thetas, base, f)


def rect_section(depth_ratio, rc, M=256, f=None):
    """Rounded rectangle, half-width 1 along X, half-depth depth_ratio along Y."""
    return poly_section([-90, 0, 90, 180], [depth_ratio, 1.0, depth_ratio, 1.0], rc, M, f)


def ngon_section(n, rc, M=288, f=None):
    """Regular n-gon with a flat face centred at the front (-Y); apothem 1."""
    return poly_section([-90 + 360 * k / n for k in range(n)], [1.0] * n, rc, M, f)


def smoothstep(e0, e1):
    def f(z):
        t = max(0.0, min(1.0, (z - e0) / (e1 - e0)))
        return t * t * (3 - 2 * t)
    return f

def inv_smoothstep(e0, e1):
    g = smoothstep(e0, e1)
    return lambda z: 1.0 - g(z)


def loft(name, prof, sec=None, mats=(), mat_of=None, radial=None):
    """Revolve/loft a dense (r, z) profile through a Section. Poles (r=0) become
    single vertices. mat_of(k) -> material index for the band between profile
    points k and k+1. radial(i, k) -> extra radial multiplier (knurls, ridges)."""
    sec = sec or round_section()
    M = len(sec.thetas)
    bm = bmesh.new()
    rows = []
    for k, (r, z) in enumerate(prof):
        if r < 1e-7:
            rows.append([bm.verts.new((0.0, 0.0, z))])
        else:
            rows.append([bm.verts.new(sec.point(i, r, z, radial(i, k) if radial else 1.0))
                         for i in range(M)])
    for k in range(len(rows) - 1):
        A, B = rows[k], rows[k + 1]
        mi = mat_of(k) if mat_of else 0
        for i in range(M):
            j = (i + 1) % M
            if len(A) == 1 and len(B) == 1:
                continue
            if len(A) == 1:
                f = bm.faces.new((A[0], B[j], B[i]))
            elif len(B) == 1:
                f = bm.faces.new((A[i], A[j], B[0]))
            else:
                f = bm.faces.new((A[i], A[j], B[j], B[i]))
            f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _mesh_obj(name, bm, mats)


def sweep(name, path, section, closed=True, up=(0, 0, 1), mats=()):
    """Sweep a 2D section [(x, y)...] (closed loop, x = across path in plane,
    y = along `up`) along a 3D path."""
    bm = bmesh.new()
    rings = []
    n = len(path)
    U = Vector(up)
    for k in range(n):
        p = Vector(path[k])
        a = Vector(path[(k - 1) % n] if closed or k > 0 else path[k])
        b = Vector(path[(k + 1) % n] if closed or k < n - 1 else path[k])
        t = (b - a).normalized()
        side = t.cross(U).normalized()
        upv = side.cross(t).normalized()
        rings.append([bm.verts.new(p + side * sx + upv * sy) for (sx, sy) in section])
    S = len(section)
    for k in range(n if closed else n - 1):
        A, B = rings[k], rings[(k + 1) % n]
        for i in range(S):
            j = (i + 1) % S
            bm.faces.new((A[i], A[j], B[j], B[i]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _mesh_obj(name, bm, mats)


def rrect_pts(w, h, r, seg=6):
    pts = []
    hx, hy = w / 2 - r, h / 2 - r
    for cx, cy, a0 in ((hx, hy, 0), (-hx, hy, 90), (-hx, -hy, 180), (hx, -hy, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def stadium_path(w, l, z, n=96, y0=0.0):
    """Closed stadium (w across X, l along Y) at height z."""
    r = w / 2
    hl = l / 2 - r
    pts = []
    per = n // 2
    for i in range(per):
        a = math.pi + math.pi * i / (per - 1)          # front semicircle (-Y)
        pts.append((r * math.cos(a), y0 - hl + r * math.sin(a), z))
    for i in range(per):
        a = math.pi * i / (per - 1)                    # back semicircle (+Y)
        pts.append((r * math.cos(a), y0 + hl + r * math.sin(a), z))
    return pts


def profile_interp(prof):
    """r(z) for the monotonic outer-wall part of a dense profile."""
    zs = [p[1] for p in prof]
    def r_at(z):
        best = None
        for i in range(len(prof) - 1):
            z1, z2 = prof[i][1], prof[i + 1][1]
            if (z1 - z) * (z2 - z) <= 0 and abs(z2 - z1) > 1e-9:
                t = (z - z1) / (z2 - z1)
                r = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t
                best = r if best is None else max(best, r)
        return best or 0.0
    return r_at


# ================================================================= materials
def _principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes.get("Principled BSDF"), nt.nodes.get("Material Output")

def _tex_coord(nt):
    return nt.nodes.new("ShaderNodeTexCoord")

def _noise(nt, vec, scale, detail=2.0, rough=0.5, dist=0.0):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    n.inputs["Distortion"].default_value = dist
    if vec is not None:
        nt.links.new(vec, n.inputs["Vector"])
    return n

def _map(nt, vec, scale=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0)):
    m = nt.nodes.new("ShaderNodeMapping")
    m.inputs["Scale"].default_value = scale
    m.inputs["Location"].default_value = loc
    m.inputs["Rotation"].default_value = rot
    nt.links.new(vec, m.inputs["Vector"])
    return m

def _maprange(nt, src, a, b, c, d, clamp=True):
    m = nt.nodes.new("ShaderNodeMapRange")
    m.inputs["From Min"].default_value = a
    m.inputs["From Max"].default_value = b
    m.inputs["To Min"].default_value = c
    m.inputs["To Max"].default_value = d
    m.clamp = clamp
    nt.links.new(src, m.inputs["Value"])
    return m

def _math(nt, op, a, b=None, clamp=False):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = clamp
    for idx, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[idx].default_value = v
        else:
            nt.links.new(v, n.inputs[idx])
    return n

def _bump(nt, height, strength, distance, normal=None):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height, b.inputs["Height"])
    if normal is not None:
        nt.links.new(normal, b.inputs["Normal"])
    return b

def _radial_tangent(nt):
    t = nt.nodes.new("ShaderNodeTangent")
    t.direction_type = "RADIAL"
    t.axis = "Z"
    return t

GLASS_SHADOW = 0.62   # fraction of light glass lets through for shadow rays (fake caustic fill)

def _shadow_mix(nt, out, shader_out, tint=(1, 1, 1), strength=None):
    """Glass/liquid: shadow rays see a tinted transparent BSDF instead of a
    refracting surface, so contact shadows of clear glass stay light (caustics are
    off) while camera/glossy rays still refract. Volumes still attenuate."""
    s = GLASS_SHADOW if strength is None else strength
    lp = nt.nodes.new("ShaderNodeLightPath")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = (tint[0] * s, tint[1] * s, tint[2] * s, 1)
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Shadow Ray"], mix.inputs["Fac"])
    nt.links.new(shader_out, mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return mix


def mat_vessel_glass(key="flint", absorb=None, density=0.0, rough=0.0, ior=1.52, stipple=None):
    """Bottle glass: Principled transmission, optional absorption volume for
    coloured glass (thick edges read deeper, like real green/aqua glass), shadow
    trick, faint surface waviness (moulded glass is never optically flat)."""
    def build():
        m, nt, b, out = _principled(f"glass_{key}")
        b.inputs["Base Color"].default_value = (1, 1, 1, 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["IOR"].default_value = ior
        b.inputs["Transmission Weight"].default_value = 1.0
        co = _tex_coord(nt)
        wav = _noise(nt, co.outputs["Object"], 38.0, 2.0, 0.4)
        h = _math(nt, "MULTIPLY", wav.outputs["Fac"], 1.0)
        if stipple:
            # stippled/knurled band at the heel: tiny dimples near the base (z < stipple)
            v = nt.nodes.new("ShaderNodeTexVoronoi")
            v.feature = "F1"
            v.inputs["Scale"].default_value = 900.0
            nt.links.new(co.outputs["Object"], v.inputs["Vector"])
            sep = nt.nodes.new("ShaderNodeSeparateXYZ")
            nt.links.new(co.outputs["Object"], sep.inputs["Vector"])
            band = _maprange(nt, sep.outputs["Z"], stipple * 0.55, stipple, 1.0, 0.0)
            dm = _math(nt, "MULTIPLY", v.outputs["Distance"], band.outputs["Result"])
            dm2 = _math(nt, "MULTIPLY", dm.outputs[0], 6.0)
            h = _math(nt, "ADD", h.outputs[0], dm2.outputs[0])
        _bp = _bump(nt, h.outputs[0], 0.035, 0.0006, None)
        nt.links.new(_bp.outputs["Normal"], b.inputs["Normal"])
        tint = (1, 1, 1)
        if absorb is not None and density > 0:
            vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
            vol.inputs["Color"].default_value = tuple(absorb[:3]) + (1,)
            vol.inputs["Density"].default_value = density
            nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
            tint = tuple(0.5 + 0.5 * c for c in absorb[:3])
        _shadow_mix(nt, out, b.outputs["BSDF"], tint)
        return m
    return _cached(("glass", key), build)


def mat_vessel_liquid(key, color, density):
    """common.mat_liquid (clear dielectric IOR 1.36 + absorption volume) plus the
    shadow trick so the liquid throws a tinted, not black, shadow."""
    def build():
        m = _c.mat_liquid(color, density, name=f"liquid_{key}")
        nt = m.node_tree
        b = nt.nodes.get("Principled BSDF")
        out = nt.nodes.get("Material Output")
        _shadow_mix(nt, out, b.outputs["BSDF"], (1, 1, 1), 0.9)
        return m
    return _cached(("liquid", key), build)


def mat_cork(key="cork", color="#B98E5E", dark="#7A5434"):
    """Natural agglomerated cork: speckled granules, dark pores, very rough."""
    def build():
        m, nt, b, out = _principled(f"cork_{key}")
        co = _tex_coord(nt)
        vor = nt.nodes.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 1100.0
        vor.inputs["Randomness"].default_value = 1.0
        nt.links.new(co.outputs["Object"], vor.inputs["Vector"])
        n = _noise(nt, co.outputs["Object"], 420.0, 6.0, 0.7)
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.25
        ramp.color_ramp.elements[0].color = _lin(dark)
        ramp.color_ramp.elements[1].position = 0.75
        ramp.color_ramp.elements[1].color = _lin(color)
        mix = _math(nt, "MULTIPLY", n.outputs["Fac"], vor.outputs["Color"] if False else 1.0)
        add = _math(nt, "ADD", mix.outputs[0], 0.0)
        nt.links.new(vor.outputs["Distance"], add.inputs[1])
        avg = _math(nt, "MULTIPLY", add.outputs[0], 0.62)
        nt.links.new(avg.outputs[0], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.88
        pores = _maprange(nt, vor.outputs["Distance"], 0.0, 0.18, 0.0, 1.0)
        h = _math(nt, "MULTIPLY", pores.outputs["Result"], n.outputs["Fac"])
        _bp = _bump(nt, h.outputs[0], 0.55, 0.0006)
        nt.links.new(_bp.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("cork", key), build)


def mat_wood(key="walnut", light="#7B4F31", dark="#5A3620", rough=0.42, coat=0.25, ring_spacing=0.0040,
             pith=(-0.052, 0.034), axis="Z", line="#3E2414"):
    """Turned wood (stopper heads). The blank's grain runs along the turning axis, so the growth
    rings are near-cylinders around an OFF-AXIS pith (`pith`, object space, metres): on the turned
    surface they read as long, gently wandering grain lines, wider apart where the rings cut the
    surface obliquely. Object coordinates of the single stopper mesh are the one shared texture
    space, so nothing restarts along the profile.
      * rings: Wave RINGS on (x, y, 0.06 z) relative to the pith, domain-warped by low-frequency
        noise (distortion) -> 6-10 lines across the visible face (ring_spacing ~4.5 mm)
      * latewood: a thin darker line per ring (sharpened sine), narrow colour contrast
      * pores: noise stretched along the axis (scale 400 x 6) -> fine open-pore streaks, as colour
        and as a 0.02 bump; satin oil finish (coat 0.25, coat roughness 0.3)."""
    def build():
        m, nt, b, out = _principled(f"wood_{key}")
        co = _tex_coord(nt)
        obj = co.outputs["Object"]
        # low-frequency warp (grain wander) -- added to the coordinates
        warp = _noise(nt, _map(nt, obj, scale=(1.0, 1.0, 0.35)).outputs["Vector"], 38.0, 2.0, 0.5)
        wv = nt.nodes.new("ShaderNodeVectorMath"); wv.operation = "SUBTRACT"
        nt.links.new(warp.outputs["Color"], wv.inputs[0]); wv.inputs[1].default_value = (0.5, 0.5, 0.5)
        ws = nt.nodes.new("ShaderNodeVectorMath"); ws.operation = "SCALE"
        nt.links.new(wv.outputs["Vector"], ws.inputs[0]); ws.inputs["Scale"].default_value = 0.0012
        wa = nt.nodes.new("ShaderNodeVectorMath"); wa.operation = "ADD"
        nt.links.new(obj, wa.inputs[0]); nt.links.new(ws.outputs["Vector"], wa.inputs[1])
        if axis == "Z":
            rc = _map(nt, wa.outputs["Vector"], scale=(1.0, 1.0, 0.06), loc=(-pith[0], -pith[1], 0.0))
        else:
            rc = _map(nt, wa.outputs["Vector"], scale=(0.06, 1.0, 1.0), loc=(0.0, -pith[0], -pith[1]))
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type = "RINGS"
        wave.rings_direction = "SPHERICAL"
        wave.wave_profile = "SIN"
        # Blender wave rings: phase = 20 * scale * |p|  -> spacing = 2*pi / (20 * scale)
        wave.inputs["Scale"].default_value = 2 * math.pi / (20.0 * ring_spacing)
        wave.inputs["Distortion"].default_value = 2.0
        wave.inputs["Detail"].default_value = 2.0
        wave.inputs["Detail Scale"].default_value = 0.6
        wave.inputs["Detail Roughness"].default_value = 0.5
        nt.links.new(rc.outputs["Vector"], wave.inputs["Vector"])
        # thin latewood line: (1 - fac)^4 is ~0 most of the period, peaks briefly
        inv = _math(nt, "SUBTRACT", 1.0, wave.outputs["Fac"])
        late0 = _math(nt, "POWER", inv.outputs[0], 9.0)
        late = _math(nt, "MULTIPLY", late0.outputs[0], 0.42)
        # broad earlywood/latewood tone drift across the face (figure)
        fig = _noise(nt, _map(nt, rc.outputs["Vector"], scale=(1.0, 1.0, 0.25)).outputs["Vector"], 70.0, 4.0, 0.55)
        tone = _maprange(nt, fig.outputs["Fac"], 0.32, 0.68, 0.0, 1.0)
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[0].color = _lin(dark)
        ramp.color_ramp.elements[1].position = 1.0
        ramp.color_ramp.elements[1].color = _lin(light)
        nt.links.new(tone.outputs["Result"], ramp.inputs["Fac"])
        # pores: high frequency across, low along the grain
        psc = (400.0, 400.0, 6.0) if axis == "Z" else (6.0, 400.0, 400.0)
        pore = _noise(nt, _map(nt, obj, scale=psc).outputs["Vector"], 1.0, 3.0, 0.6)
        pmask = _maprange(nt, pore.outputs["Fac"], 0.56, 0.72, 0.0, 1.0)
        # colour = tone ramp, darkened toward the latewood line colour by lines + pores
        dk = _math(nt, "MULTIPLY_ADD", pmask.outputs["Result"], 0.30)
        nt.links.new(late.outputs[0], dk.inputs[2])
        dkc = _math(nt, "MINIMUM", dk.outputs[0], 0.85)
        mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"; mixc.blend_type = "MIX"
        nt.links.new(dkc.outputs[0], mixc.inputs[0])
        nt.links.new(ramp.outputs["Color"], mixc.inputs[6])
        mixc.inputs[7].default_value = _lin(line)
        nt.links.new(mixc.outputs[2], b.inputs["Base Color"])
        # roughness: pores and latewood slightly rougher (oil sits less glossy in the open grain)
        rr = _math(nt, "MULTIPLY_ADD", dkc.outputs[0], 0.12)
        rr.inputs[2].default_value = rough
        nt.links.new(rr.outputs[0], b.inputs["Roughness"])
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.3
        b.inputs["Sheen Weight"].default_value = 0.05
        hgt = _math(nt, "SUBTRACT", 1.0, pmask.outputs["Result"])
        hl = _math(nt, "MULTIPLY_ADD", late.outputs[0], -0.3)
        nt.links.new(hgt.outputs[0], hl.inputs[2])
        _bp = _bump(nt, hl.outputs[0], 0.02, 0.0004)
        nt.links.new(_bp.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("wood", key), build)


def mat_metal(key, color="#C9CCD3", rough=0.18, aniso=0.6, brushed=True, coat=0.0):
    """Brushed/spun metal (caps, steel rim): anisotropic around Z with fine
    circumferential brush streaks modulating roughness."""
    def build():
        m, nt, b, out = _principled(f"metal_{key}")
        b.inputs["Base Color"].default_value = _lin(color)
        b.inputs["Metallic"].default_value = 1.0
        b.inputs["Roughness"].default_value = rough
        b.inputs["Coat Weight"].default_value = coat
        if brushed:
            b.inputs["Anisotropic"].default_value = aniso
            t = _radial_tangent(nt)
            nt.links.new(t.outputs["Tangent"], b.inputs["Tangent"])
            co = _tex_coord(nt)
            mp = _map(nt, co.outputs["Object"], scale=(30.0, 30.0, 4000.0))
            n = _noise(nt, mp.outputs["Vector"], 1.0, 4.0, 0.7)
            rr = _maprange(nt, n.outputs["Fac"], 0.3, 0.7, rough * 0.75, rough * 1.35)
            nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
            _bp = _bump(nt, n.outputs["Fac"], 0.03, 0.0002)
            nt.links.new(_bp.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("metal", key), build)


def mat_plastic(key, color, rough=0.32, coat=0.0, grain=0.04):
    def build():
        m, nt, b, out = _principled(f"plastic_{key}")
        b.inputs["Base Color"].default_value = _lin(color)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Coat Weight"].default_value = coat
        co = _tex_coord(nt)
        n = _noise(nt, co.outputs["Object"], 3000.0, 3.0, 0.6)
        _bp = _bump(nt, n.outputs["Fac"], grain, 0.0002)
        nt.links.new(_bp.outputs["Normal"], b.inputs["Normal"])
        return m
    return _cached(("plastic", key), build)


def mat_silicone(key="gasket", color="#1A1A1D"):
    def build():
        m, nt, b, out = _principled(f"silicone_{key}")
        b.inputs["Base Color"].default_value = _lin(color)
        b.inputs["Roughness"].default_value = 0.55
        b.inputs["Sheen Weight"].default_value = 0.2
        return m
    return _cached(("silicone", key), build)


# ================================================================= tumbler
_TUMBLER_LOGO_CODE = r'''
import sys, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
a = json.loads(sys.argv[1])
W, H = a["w"], a["h"]; SS = 3
img = Image.new("L", (W * SS, H * SS), 0)
d = ImageDraw.Draw(img)
f = ImageFont.truetype(a["font"], int(H * SS * 0.40))
cx, cy = W * SS / 2, H * SS / 2
# a thin roundel mark + wordmark, centred
d.text((cx, cy - H * SS * 0.02), "your logo", font=f, fill=255, anchor="mm")
tw = f.getlength("your logo")
y = cy + H * SS * 0.30
d.rectangle([cx - tw / 2, y, cx + tw / 2, y + H * SS * 0.035], fill=255)
img = img.resize((W, H), Image.LANCZOS)
img.save(a["out"])
img.filter(ImageFilter.GaussianBlur(a["blur"])).save(a["out_blur"])
'''

TUMBLER_LOGO_W, TUMBLER_LOGO_H, TUMBLER_LOGO_Z = 0.048, 0.016, 0.142

def tumbler_logo_mask():
    out = os.path.join(TEX_DIR, "vessel_tumbler_logo.png")
    blur = os.path.join(TEX_DIR, "vessel_tumbler_logo_blur.png")
    if not (os.path.exists(out) and os.path.exists(blur)):
        _pil(_TUMBLER_LOGO_CODE, {"w": 1536, "h": 512, "font": FONT_DISPLAY, "out": out,
                                  "out_blur": blur, "blur": 2.0})
    return out, blur


def mat_tumbler_body(color_name):
    """Powder coat over stainless with a laser-etched 'your logo': the etch
    burns the coat off and leaves frosted bare steel, very slightly recessed.
    The mask is projected cylindrically from object space (front = -Y)."""
    hexc = TUMBLER_COLORS.get(color_name, color_name)
    def build():
        m, nt, b, out = _principled(f"tumbler_coat_{color_name}")
        co = _tex_coord(nt)
        # ---- powder coat: orange-peel + fine grit, satin
        b.inputs["Base Color"].default_value = _lin(hexc)
        dark = sum(_lin(hexc)[:3]) / 3 < 0.05
        b.inputs["Roughness"].default_value = 0.62 if dark else 0.55
        b.inputs["Coat Weight"].default_value = 0.08
        b.inputs["Coat Roughness"].default_value = 0.35
        b.inputs["Sheen Weight"].default_value = 0.05 if dark else 0.04
        b.inputs["Sheen Roughness"].default_value = 0.4
        peel = _noise(nt, co.outputs["Object"], 520.0, 3.0, 0.55)
        grit = nt.nodes.new("ShaderNodeTexVoronoi")
        grit.inputs["Scale"].default_value = 5200.0
        nt.links.new(co.outputs["Object"], grit.inputs["Vector"])
        # ---- cylindrical projection of the logo mask
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(co.outputs["Object"], sep.inputs["Vector"])
        ny = _math(nt, "MULTIPLY", sep.outputs["Y"], -1.0)
        ang = _math(nt, "ARCTAN2", sep.outputs["X"], ny.outputs[0])
        u = _math(nt, "MULTIPLY_ADD", ang.outputs[0], 0.0405 / TUMBLER_LOGO_W)
        u.inputs[2].default_value = 0.5
        v = _math(nt, "MULTIPLY_ADD", sep.outputs["Z"], 1.0 / TUMBLER_LOGO_H)
        v.inputs[2].default_value = 0.5 - TUMBLER_LOGO_Z / TUMBLER_LOGO_H
        comb = nt.nodes.new("ShaderNodeCombineXYZ")
        nt.links.new(u.outputs[0], comb.inputs["X"])
        nt.links.new(v.outputs[0], comb.inputs["Y"])
        mpath, bpath = tumbler_logo_mask()
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = _img(mpath, True)
        tex.extension = "CLIP"
        tex.interpolation = "Cubic"
        nt.links.new(comb.outputs["Vector"], tex.inputs["Vector"])
        texb = nt.nodes.new("ShaderNodeTexImage")
        texb.image = _img(bpath, True)
        texb.extension = "CLIP"
        nt.links.new(comb.outputs["Vector"], texb.inputs["Vector"])
        # front only (atan2 wraps at the back)
        mask = tex.outputs["Color"]
        # ---- height: orange peel on the coat, etched steel recessed + laser hatch
        hatch = nt.nodes.new("ShaderNodeTexWave")
        hatch.wave_type = "BANDS"
        hatch.bands_direction = "Z"
        hatch.inputs["Scale"].default_value = 1400.0
        hatch.inputs["Distortion"].default_value = 0.3
        nt.links.new(co.outputs["Object"], hatch.inputs["Vector"])
        coat_h = _math(nt, "MULTIPLY_ADD", peel.outputs["Fac"], 0.8)
        nt.links.new(grit.outputs["Distance"], coat_h.inputs[2])
        inv = _math(nt, "SUBTRACT", 1.0, texb.outputs["Color"])
        h1 = _math(nt, "MULTIPLY", coat_h.outputs[0], inv.outputs[0])
        h2 = _math(nt, "MULTIPLY_ADD", inv.outputs[0], 1.4)   # coat stands proud of the etch
        nt.links.new(h1.outputs[0], h2.inputs[2])
        hm = _math(nt, "MULTIPLY", hatch.outputs["Fac"], 0.12)
        hm2 = _math(nt, "MULTIPLY", hm.outputs[0], texb.outputs["Color"])
        h3 = _math(nt, "ADD", h2.outputs[0], hm2.outputs[0])
        bump = _bump(nt, h3.outputs[0], 0.22, 0.00025)
        nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
        # ---- etched steel BSDF
        st = nt.nodes.new("ShaderNodeBsdfPrincipled")
        st.inputs["Base Color"].default_value = (0.36, 0.36, 0.37, 1)
        st.inputs["Metallic"].default_value = 1.0
        st.inputs["Roughness"].default_value = 0.40
        st.inputs["Anisotropic"].default_value = 0.4
        tg = _radial_tangent(nt)
        nt.links.new(tg.outputs["Tangent"], st.inputs["Tangent"])
        nt.links.new(bump.outputs["Normal"], st.inputs["Normal"])
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(mask, mix.inputs["Fac"])
        nt.links.new(b.outputs["BSDF"], mix.inputs[1])
        nt.links.new(st.outputs["BSDF"], mix.inputs[2])
        nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
        return m
    return _cached(("tumbler_coat", color_name), build)


def tumbler(color="Matte Black", lid_open=False):
    """25 oz insulated tumbler (BruMate Rise-like), Ø0.083 x 0.265 m."""
    hexc = TUMBLER_COLORS.get(color, color)
    coat = mat_tumbler_body(color)
    steel = mat_metal("tumbler_steel", "#C4C6CA", rough=0.30, aniso=0.85)
    steel_in = mat_metal("tumbler_steel_inner", "#A9ABAF", rough=0.3, aniso=0.5)
    lid_mat = mat_plastic(f"tumbler_lid_{color}", hexc, rough=0.38 if color != "Matte Black" else 0.45,
                          coat=0.05)
    gasket = mat_silicone("tumbler_gasket", "#141416")
    dark = mat_plastic("tumbler_spout_dark", "#0C0C0E", rough=0.5)

    R = 0.0415
    parts = []
    # ---- body: powder-coated outer wall with a recessed base, steel band at top,
    #      rolled lip, inner wall (single mesh, material index per band)
    Z_COAT_TOP = 0.2218
    Z_RIM = 0.2300
    body_pts = [
        (0.0, 0.0035, 0), (0.0300, 0.0035, 0.002), (0.0318, 0.0, 0.0015),
        (0.0352, 0.0, 0.0028), (0.0356, 0.006, 0.0),
        (0.0381, 0.075, 0.0), (0.0402, 0.140, 0.0), (R, 0.200, 0.0),
        (R, Z_COAT_TOP - 0.0004, 0.0003), (R - 0.0004, Z_COAT_TOP, 0.0),    # coat edge
        (R - 0.0004, Z_COAT_TOP + 0.0006, 0.0003),
        (R - 0.0004, Z_RIM - 0.0012, 0.0011), (R - 0.0018, Z_RIM, 0.0009),   # rolled steel lip
        (R - 0.0034, Z_RIM - 0.0010, 0.0008), (R - 0.0034, 0.200, 0.0),
        (0.0332, 0.040, 0.0), (0.0310, 0.012, 0.004), (0.0, 0.012, 0.0),
    ]
    prof = fillet(body_pts, max_len=0.006)
    # material per segment: coat below the coat edge, steel above, inner steel inside
    k_coat = next(k for k, (r, z) in enumerate(prof) if z >= Z_COAT_TOP - 0.00005 and r > R - 0.002)
    k_top = max(range(len(prof)), key=lambda k: prof[k][1])
    k_in = next(k for k in range(k_top, len(prof)) if prof[k][0] <= R - 0.0033)
    def body_mat(k):
        return 0 if k < k_coat else (1 if k < k_in else 2)
    body = loft("tumbler_body", prof, round_section(192), mats=(coat, steel, steel_in), mat_of=body_mat)
    parts.append(body)

    # ---- lid: color-matched plastic, gasket line, parting groove, recessed top well
    zl = Z_RIM + 0.0004
    gas = loft("tumbler_gasket", fillet([(0.0, zl - 0.0002), (0.0395, zl - 0.0002, 0.0003),
                                        (0.0397, zl + 0.0012, 0.0003), (0.0, zl + 0.0012)]),
               round_section(160), mats=(gasket,))
    parts.append(gas)
    ZT = 0.2588           # lid top rim
    ZW = 0.2556           # recessed well floor
    lid_pts = [
        (0.0, zl + 0.0010, 0), (0.0402, zl + 0.0010, 0.0008),
        (0.0404, zl + 0.0105, 0.0), (0.0398, zl + 0.0112, 0.0002), (0.0398, zl + 0.0124, 0.0002),
        (0.0404, zl + 0.0131, 0.0),                                    # parting groove
        (0.0404, ZT - 0.0035, 0.0032), (0.0358, ZT, 0.0012),           # rounded top edge
        (0.0336, ZT, 0.0008), (0.0322, ZW, 0.0010), (0.0, ZW, 0),
    ]
    lid = loft("tumbler_lid", fillet(lid_pts, max_len=0.004), round_section(192), mats=(lid_mat,))
    parts.append(lid)

    # ---- spout (front): raised stadium nub, rolled rim, recessed dark drinking slot
    stad = rect_section(1.55, 1.0, 160, lambda z: 1.0)
    sp_pts = [(0.0, ZW - 0.0012), (0.0070, ZW - 0.0012, 0.0), (0.0068, ZW + 0.0021, 0.0011),
              (0.0050, ZW + 0.0029, 0.0007), (0.0037, ZW + 0.0022, 0.0005), (0.0034, ZW + 0.0006, 0.0004),
              (0.0, ZW + 0.0006)]
    sp_prof = fillet(sp_pts, max_len=0.0008)
    k_hole = next(k for k, (r, z) in enumerate(sp_prof) if r < 0.0040 and z < ZW + 0.0024 and k > 3)
    nub = loft("tumbler_spout", sp_prof, stad, mats=(lid_mat, dark), mat_of=lambda k: 0 if k < k_hole else 1)
    nub.location = (0, -0.0205, 0)
    parts += [nub]
    # rear hinge blocks
    for sx in (-1, 1):
        hb = rounded_box(f"tumbler_hinge_{sx}", (0.0062, 0.0082, 0.0068), 0.0026, 4,
                         (sx * 0.0142, 0.0258, ZW - 0.0016), mat=lid_mat)
        parts.append(hb)

    # ---- flip handle: stadium loop + front tab with plug, hinged at the back
    HY = 0.0262           # hinge axis y
    HZ = ZW + 0.0034      # hinge axis z
    sec = rrect_pts(0.0062, 0.0050, 0.0020, 5)
    loop = sweep("tumbler_handle_loop", stadium_path(0.0310, 0.0560, 0.0, 120, 0.0), sec)
    loop.location = (0, -0.0010, HZ)
    assign(loop, lid_mat)
    tab = rounded_box("tumbler_handle_tab", (0.0230, 0.0150, 0.0042), 0.0019, 4,
                      (0, -0.0205, HZ - 0.0021), mat=lid_mat)
    pin = None
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.0026, depth=0.0215,
                                        location=(0, HY, HZ), rotation=(0, math.radians(90), 0))
    pin = bpy.context.active_object
    pin.name = "tumbler_hinge_barrel"
    bevel(pin, 0.0007, 3)
    smooth(pin)
    assign(pin, lid_mat)
    handle = _root("tumbler_handle", [loop, tab, pin])
    # pivot the handle about the hinge axis
    for ch in (loop, tab, pin):
        ch.location = (ch.location.x, ch.location.y - HY, ch.location.z - HZ)
    handle.location = (0, HY, HZ)
    if lid_open:
        handle.rotation_euler = (math.radians(-104), 0, 0)
    parts += [handle]

    root = _root(f"tumbler_{color}", parts)
    return root


# ================================================================= bottles
# label designs are generated with PIL into assets/textures/vessel_label_<kind>.png (RGBA colour,
# alpha = label shape) + vessel_label_<kind>_foil.png (white = chrome hot foil).
_LABEL_CODE = r'''
import sys, json, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
a = json.loads(sys.argv[1])
pxm = a["pxm"]                      # pixels per metre
W, H = int(a["w"] * pxm), int(a["h"] * pxm)
mm = pxm / 1000.0
st = a["style"]
img = Image.new("RGBA", (W, H), tuple(a["paper"]) + (255,))
foil = Image.new("L", (W, H), 0)
shape = Image.new("L", (W, H), 255)
d = ImageDraw.Draw(img); fd = ImageDraw.Draw(foil); sd = ImageDraw.Draw(shape)
ink = tuple(a["ink"]) + (255,)
cob = tuple(a["cobalt"]) + (255,)
mono = lambda s: ImageFont.truetype(a["mono"], max(6, int(s * mm)))
text = lambda s: ImageFont.truetype(a["text"], max(6, int(s * mm)))
disp = lambda s: ImageFont.truetype(a["disp"], max(6, int(s * mm)))
def rect(drw, m, w, fill):
    drw.rectangle([m * mm, m * mm, W - m * mm, H - m * mm], outline=fill, width=max(1, int(w * mm)))
def hline(drw, y, x0, x1, w, fill):
    drw.rectangle([x0 * mm, y * mm, x1 * mm, y * mm + max(1, w * mm)], fill=fill)
cx = W / 2
if st == "vodka":            # tall cream label, double hairline, chrome roundel, mono micro type
    rect(d, 2.2, 0.28, ink); rect(d, 3.4, 0.14, ink)
    r = 7.0 * mm; cy = H * 0.36
    fd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=255, width=int(0.7 * mm))
    fd.ellipse([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], fill=255)
    hline(d, H / mm * 0.62, 12, W / mm - 12, 0.18, ink)
    d.text((cx, H * 0.70), "no. 01", font=mono(2.6), fill=ink, anchor="mm")
    d.text((cx, H - 7 * mm), "750 ml   40% alc./vol.", font=mono(1.7), fill=ink, anchor="mm")
elif st == "mezcal":         # warm uncoated paper, deckled edge, cobalt sun-burst stamp
    import random
    random.seed(7)
    sd.rectangle([0, 0, W, H], fill=0)
    pts = []
    n = 160
    for i in range(n):
        t = i / n
        pts.append((t * W, random.uniform(0, 0.9) * mm))
    for i in range(n):
        t = i / n
        pts.append((W - random.uniform(0, 0.9) * mm, t * H))
    for i in range(n):
        t = i / n
        pts.append((W - t * W, H - random.uniform(0, 0.9) * mm))
    for i in range(n):
        t = i / n
        pts.append((random.uniform(0, 0.9) * mm, H - t * H))
    sd.polygon(pts, fill=255)
    cy = H * 0.42; r0, r1 = 4.2 * mm, 11.5 * mm
    for k in range(48):
        th = 2 * math.pi * k / 48
        w = 0.55 if k % 2 == 0 else 0.3
        d.line([(cx + r0 * math.cos(th), cy + r0 * math.sin(th)), (cx + r1 * math.cos(th), cy + r1 * math.sin(th))],
               fill=cob, width=max(1, int(w * mm)))
    d.ellipse([cx - 2.6 * mm, cy - 2.6 * mm, cx + 2.6 * mm, cy + 2.6 * mm], fill=cob)
    hline(d, H / mm - 15, 14, W / mm - 14, 0.2, ink)
    d.text((cx, H - 10.5 * mm), "hecho a mano", font=mono(2.2), fill=ink, anchor="mm")
    d.text((cx, H - 6 * mm), "750 ml   43% alc./vol.", font=mono(1.7), fill=ink, anchor="mm")
elif st == "scotch":         # ink label, chrome foil hairline frame + bar
    rect(fd, 2.4, 0.3, 255); rect(fd, 3.5, 0.14, 255)
    hline(fd, H / mm * 0.30, W / mm * 0.5 - 9, W / mm * 0.5 + 9, 0.9, 255)
    hline(fd, H / mm * 0.30 + 2.2, W / mm * 0.5 - 4, W / mm * 0.5 + 4, 0.25, 255)
    d.text((cx, H * 0.62), "aged 12 years", font=mono(2.4), fill=(200, 196, 188, 255), anchor="mm")
    d.text((cx, H - 7 * mm), "750 ml   40% alc./vol.", font=mono(1.7), fill=(170, 166, 160, 255), anchor="mm")
elif st == "irish":          # cream label, fine ink border, cobalt band
    rect(d, 2.0, 0.22, ink)
    d.rectangle([2.0 * mm, H * 0.42, W - 2.0 * mm, H * 0.42 + 3.2 * mm], fill=cob)
    hline(d, H / mm * 0.42 - 1.4, 2.0, W / mm - 2.0, 0.14, ink)
    hline(d, H / mm * 0.42 + 4.6, 2.0, W / mm - 2.0, 0.14, ink)
    d.text((cx, H * 0.24), "triple distilled", font=mono(2.4), fill=ink, anchor="mm")
    d.text((cx, H - 7 * mm), "750 ml   40% alc./vol.", font=mono(1.7), fill=ink, anchor="mm")
elif st == "bourbon":        # arched cream label, ink border following the arch, cobalt diamond
    sd.rectangle([0, 0, W, H], fill=0)
    ar = W / 2
    sd.rectangle([0, ar * 0.62, W, H], fill=255)
    sd.ellipse([0, 0, W, 2 * ar * 0.62 * 1.0 + 0.001], fill=255)
    m = 2.2 * mm
    d.rectangle([m, ar * 0.62, m + 0.25 * mm, H - m], fill=ink)
    d.rectangle([W - m - 0.25 * mm, ar * 0.62, W - m, H - m], fill=ink)
    d.rectangle([m, H - m - 0.25 * mm, W - m, H - m], fill=ink)
    d.arc([m, m, W - m, 2 * ar * 0.62 - m], 180, 360, fill=ink, width=max(1, int(0.25 * mm)))
    cy = H * 0.42; s = 4.5 * mm
    d.polygon([(cx, cy - s), (cx + s * 0.72, cy), (cx, cy + s), (cx - s * 0.72, cy)], fill=cob)
    hline(d, H / mm * 0.42 + 9, W / mm * 0.5 - 12, W / mm * 0.5 + 12, 0.18, ink)
    d.text((cx, H * 0.70), "small batch", font=mono(2.4), fill=ink, anchor="mm")
    d.text((cx, H - 7 * mm), "750 ml   40% alc./vol.", font=mono(1.7), fill=ink, anchor="mm")
elif st == "tequila_print":  # printed straight on glass: only chrome foil + bone ink, no paper
    sd.rectangle([0, 0, W, H], fill=0)
    m = 1.5 * mm
    for drw in (fd, sd):
        drw.rectangle([m, m, W - m, H - m], outline=255, width=max(1, int(0.35 * mm)))
    for drw in (fd, sd):
        drw.rectangle([cx - 8 * mm, H * 0.36, cx + 8 * mm, H * 0.36 + 0.9 * mm], fill=255)
        drw.rectangle([cx - 3.5 * mm, H * 0.36 + 2.6 * mm, cx + 3.5 * mm, H * 0.36 + 2.9 * mm], fill=255)
    f = mono(1.9)
    sd.text((cx, H - 6 * mm), "750 ml   40% alc./vol.", font=f, fill=255, anchor="mm")
    d.text((cx, H - 6 * mm), "750 ml   40% alc./vol.", font=f, fill=tuple(a["paper"]) + (255,), anchor="mm")
elif st == "tequila_tall":   # small bone label across three facets, ink hairlines, cobalt dot
    rect(d, 1.6, 0.2, ink)
    cy = H * 0.40
    d.ellipse([cx - 3.0 * mm, cy - 3.0 * mm, cx + 3.0 * mm, cy + 3.0 * mm], fill=cob)
    hline(d, cy / mm + 6.5, W / mm * 0.5 - 14, W / mm * 0.5 + 14, 0.16, ink)
    rect(fd, 3.0, 0.16, 255)
    d.text((cx, H - 6.2 * mm), "750 ml   40% alc./vol.", font=mono(1.6), fill=ink, anchor="mm")
elif st == "band_ink":       # neck band: ink with a chrome hairline
    hline(fd, H / mm * 0.5 - 0.15, 0, W / mm, 0.3, 255)
elif st == "band_cream":
    hline(d, 1.2, 0, W / mm, 0.18, ink); hline(d, H / mm - 1.4, 0, W / mm, 0.18, ink)
    d.rectangle([0, H * 0.5 - 0.9 * mm, W, H * 0.5 + 0.9 * mm], fill=cob)
img.putalpha(shape)
img.save(a["out"])
foil.save(a["foil"])
'''

def _label_tex(name, style, w, h, paper="#EFEBE3", ink="#0B0B0F", pxm=16000):
    out = os.path.join(TEX_DIR, f"vessel_label_{name}.png")
    foil = os.path.join(TEX_DIR, f"vessel_label_{name}_foil.png")
    hexrgb = lambda hx: [int(hx.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    _pil(_LABEL_CODE, {"pxm": pxm, "w": w, "h": h, "style": style, "paper": hexrgb(paper),
                       "ink": hexrgb(ink), "cobalt": hexrgb("#2433C8"), "mono": FONT_MONO,
                       "text": FONT_TEXT, "disp": FONT_DISPLAY, "out": out, "foil": foil})
    return out, foil


def mat_label(name, color_path, foil_path, rough=0.62, print_on_glass=False):
    """Paper label: printed colour image, hot-foil chrome where the foil mask is
    white, paper tooth + fibre bump, faint emboss on foil. Alpha cuts the shape."""
    def build():
        m, nt, b, out = _principled(f"label_{name}")
        uv = nt.nodes.new("ShaderNodeUVMap")
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = _img(color_path)
        tex.interpolation = "Cubic"
        nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        ft = nt.nodes.new("ShaderNodeTexImage")
        ft.image = _img(foil_path, True)
        ft.interpolation = "Cubic"
        nt.links.new(uv.outputs["UV"], ft.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = rough
        b.inputs["Sheen Weight"].default_value = 0.15
        co = _tex_coord(nt)
        fib = _noise(nt, co.outputs["Object"], 2400.0, 8.0, 0.65)
        tooth = _math(nt, "MULTIPLY", fib.outputs["Fac"], 1.0)
        emb = _math(nt, "MULTIPLY", ft.outputs["Color"], 0.8)
        h = _math(nt, "ADD", tooth.outputs[0], emb.outputs[0])
        bp = _bump(nt, h.outputs[0], 0.12, 0.00015)
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
        fo = nt.nodes.new("ShaderNodeBsdfPrincipled")
        fo.inputs["Base Color"].default_value = _lin("#D8DBE2")
        fo.inputs["Metallic"].default_value = 1.0
        # hot foil is a near-mirror; a fine concentric guilloche (from the label UV centre)
        # alternates mirror / satin so the foil flashes light-dark like real chrome foil
        # instead of reading as flat light-grey ink on cream
        gx = _map(nt, uv.outputs["UV"], scale=(1.0, 1.0, 1.0), loc=(-0.5, -0.36, 0.0))
        gw = nt.nodes.new("ShaderNodeTexWave")
        gw.wave_type = "RINGS"
        gw.rings_direction = "SPHERICAL"
        gw.inputs["Scale"].default_value = 60.0
        gw.inputs["Distortion"].default_value = 0.0
        nt.links.new(gx.outputs["Vector"], gw.inputs["Vector"])
        gr = _maprange(nt, gw.outputs["Fac"], 0.0, 1.0, 0.03, 0.30)
        nt.links.new(gr.outputs["Result"], fo.inputs["Roughness"])
        # a near-mirror facing the lens reflects the dark studio behind the camera: darker
        # gunmetal face-on, bright chrome toward grazing -> reads as metal next to cream paper
        lw = nt.nodes.new("ShaderNodeLayerWeight")
        lw.inputs["Blend"].default_value = 0.35
        nt.links.new(bp.outputs["Normal"], lw.inputs["Normal"])
        fr = nt.nodes.new("ShaderNodeValToRGB")
        fr.color_ramp.elements[0].color = _lin("#5E626B")
        fr.color_ramp.elements[1].position = 0.6
        fr.color_ramp.elements[1].color = _lin("#E2E5EA")
        g2 = _math(nt, "MULTIPLY_ADD", gw.outputs["Fac"], 0.25)
        nt.links.new(lw.outputs["Facing"], g2.inputs[2])
        nt.links.new(g2.outputs[0], fr.inputs["Fac"])
        nt.links.new(fr.outputs["Color"], fo.inputs["Base Color"])
        fo.inputs["Anisotropic"].default_value = 0.3
        nt.links.new(bp.outputs["Normal"], fo.inputs["Normal"])
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(ft.outputs["Color"], mix.inputs["Fac"])
        nt.links.new(b.outputs["BSDF"], mix.inputs[1])
        nt.links.new(fo.outputs["BSDF"], mix.inputs[2])
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mix2 = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(tex.outputs["Alpha"], mix2.inputs["Fac"])
        nt.links.new(tr.outputs["BSDF"], mix2.inputs[1])
        nt.links.new(mix.outputs["Shader"], mix2.inputs[2])
        nt.links.new(mix2.outputs["Shader"], out.inputs["Surface"])
        if print_on_glass:
            b.inputs["Roughness"].default_value = 0.4
        return m
    return _cached(("label", name), build)


def label_mesh(name, outer_prof, sec, z0, z1, width, offset=0.00010, cols=96, rows=48, full_wrap=False,
               thickness=0.00012, mat=None):
    """A paper label following the outer glass surface between z0..z1, centred
    on the front (-Y), `width` measured as arc length on its middle row. UVs map
    the whole label 0..1. full_wrap=True wraps 360° (neck bands)."""
    r_at = profile_interp(outer_prof)
    M = 1440
    th_fine = [-math.pi / 2 + 2 * math.pi * i / M for i in range(M + 1)]
    # radial multiplier at arbitrary theta: interpolate the section samples
    sth = sec.thetas; sb = sec.base
    order = sorted(range(len(sth)), key=lambda i: sth[i])
    ts = [sth[i] for i in order]; bs = [sb[i] for i in order]
    ts = [ts[-1] - 2 * math.pi] + ts + [ts[0] + 2 * math.pi]
    bs = [bs[-1]] + bs + [bs[0]]
    import bisect
    def base_at(t):
        t = (t + math.pi) % (2 * math.pi) - math.pi
        j = bisect.bisect_right(ts, t) - 1
        j = max(0, min(len(ts) - 2, j))
        u = (t - ts[j]) / max(1e-12, ts[j + 1] - ts[j])
        return bs[j] + (bs[j + 1] - bs[j]) * u
    def pos(t, z):
        r = r_at(z) + offset
        fz = sec.f(z)
        m = 1.0 + (base_at(t) - 1.0) * fz
        # keep the paper offset constant despite the multiplier
        rr = r_at(z) * m + offset
        return Vector((rr * math.cos(t), rr * math.sin(t), z))
    zm = 0.5 * (z0 + z1)
    if full_wrap:
        t0, t1 = -math.pi / 2 - math.pi, -math.pi / 2 + math.pi - 1e-4
    else:
        # find half-angle giving width/2 arc length on the mid row, symmetric about -Y
        acc = 0.0
        prev = pos(-math.pi / 2, zm)
        half = None
        for i in range(1, M // 2):
            t = -math.pi / 2 + 2 * math.pi * i / M
            p = pos(t, zm)
            acc += (p - prev).length
            prev = p
            if acc >= width / 2:
                half = t + math.pi / 2
                break
        half = half or math.pi * 0.9
        t0, t1 = -math.pi / 2 - half, -math.pi / 2 + half
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    grid = []
    for rI in range(rows + 1):
        z = z0 + (z1 - z0) * rI / rows
        grid.append([bm.verts.new(pos(t0 + (t1 - t0) * cI / cols, z)) for cI in range(cols + 1)])
    for rI in range(rows):
        for cI in range(cols):
            f = bm.faces.new((grid[rI][cI], grid[rI][cI + 1], grid[rI + 1][cI + 1], grid[rI + 1][cI]))
            for loop, (du, dv) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
                loop[uvl].uv = ((cI + du) / cols, (rI + dv) / rows)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # make normals point outward (away from Z axis)
    f0 = bm.faces[len(bm.faces) // 2]
    c = f0.calc_center_median()
    if f0.normal.dot(Vector((c.x, c.y, 0))) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    o = _mesh_obj(name, bm, (mat,) if mat else ())
    if thickness > 0:
        so = o.modifiers.new("Solidify", "SOLIDIFY")
        so.thickness = thickness
        so.offset = -1.0
    return o


# ---------------------------------------------------------------- bottle specs
# outer/inner: [(r, z, fillet)] bottom -> top. inner starts at the inner floor centre.
# 'section': ("round",) | ("rect", depth_ratio, rc, z_full, z_round) | ("ngon", n, rc, z_full, z_round)
# liquid colour: absorption (color, density) — see mat_liquid; density in 1/m.
BOTTLES = {
    "kettle-one": dict(
        desc="tall clear vodka, long neck, cork stopper with ink polymer cap",
        glass=("flint", None, 0.0),
        section=("round",),
        outer=[(0, 0.0075), (0.026, 0.0030, 0.004), (0.0335, 0.0, 0.0025), (0.0378, 0.0045, 0.004),
               (0.0382, 0.170, 0.0), (0.0376, 0.188, 0.012), (0.0175, 0.232, 0.016),
               (0.0138, 0.252, 0.010), (0.0130, 0.282, 0.0), (0.0136, 0.2835, 0.0005),
               (0.0148, 0.2855, 0.0012), (0.0148, 0.2925, 0.0012), (0.0136, 0.2935, 0.0005),
               (0.0132, 0.2955, 0.0006), (0.0132, 0.300, 0.0016), (0.0098, 0.300, 0.0016)],
        inner=[(0, 0.0115), (0.0280, 0.0095, 0.006), (0.0345, 0.016, 0.006), (0.0348, 0.170, 0.0),
               (0.0340, 0.188, 0.012), (0.0136, 0.232, 0.014), (0.0095, 0.252, 0.008),
               (0.0094, 0.300, 0.0)],
        liquid=("vodka", (0.985, 0.985, 0.975), 1.0),
        closure=("cork_cap", dict(z=0.300, bore=0.0094, shank=0.026, cap_r=0.0158, cap_h=0.0175,
                                 cap="ink_poly", band="chrome")),
        label=("vodka", dict(z0=0.060, z1=0.152, w=0.072, paper="#F1EDE4")),
        neck=("band_ink", dict(z0=0.262, z1=0.272, paper="#0B0B0F")),
        stipple=0.007,
    ),
    "manojo": dict(
        desc="squat artisanal mezcal, pale aqua glass, natural cork",
        glass=("aqua", (0.66, 0.92, 0.86), 110.0),
        section=("round",),
        outer=[(0, 0.0090), (0.033, 0.0035, 0.005), (0.0425, 0.0, 0.003), (0.0468, 0.0060, 0.005),
               (0.0472, 0.128, 0.0), (0.0462, 0.150, 0.026), (0.0200, 0.186, 0.014),
               (0.0160, 0.198, 0.006), (0.0155, 0.222, 0.0), (0.0172, 0.2245, 0.0012),
               (0.0172, 0.2305, 0.0015), (0.0122, 0.2305, 0.0012)],
        inner=[(0, 0.0130), (0.034, 0.0110, 0.006), (0.0426, 0.019, 0.006), (0.0430, 0.128, 0.0),
               (0.0420, 0.150, 0.024), (0.0160, 0.186, 0.012), (0.0118, 0.198, 0.005),
               (0.0118, 0.2305, 0.0)],
        liquid=("mezcal", (0.985, 0.98, 0.95), 1.4),
        closure=("cork_top", dict(z=0.2305, bore=0.0118, shank=0.028, top_r=0.0198, top_h=0.0190,
                                 top="cork")),
        label=("mezcal", dict(z0=0.040, z1=0.112, w=0.088, paper="#E9DFCB")),
        neck=None,
        stipple=0.009,
    ),
    "johnnie-black": dict(
        desc="square-shouldered rectangular scotch, dark amber, ink metal screw cap",
        glass=("flint_s", None, 0.0),
        section=("rect", 0.80, 0.16, 0.183, 0.210),
        outer=[(0, 0.0070), (0.030, 0.0030, 0.005), (0.0370, 0.0, 0.003), (0.0420, 0.0055, 0.0045),
               (0.0420, 0.180, 0.0), (0.0418, 0.1870, 0.0040), (0.0170, 0.2055, 0.006),
               (0.0148, 0.214, 0.004), (0.0148, 0.2440, 0.0), (0.0158, 0.2455, 0.0006),
               (0.0158, 0.2490, 0.0006), (0.0148, 0.2505, 0.0), (0.0146, 0.2690, 0.0012),
               (0.0104, 0.2690, 0.0012)],
        inner=[(0, 0.0118), (0.031, 0.0105, 0.005), (0.0372, 0.018, 0.005), (0.0372, 0.178, 0.0),
               (0.0366, 0.1840, 0.0040), (0.0128, 0.2040, 0.006), (0.0102, 0.214, 0.003),
               (0.0102, 0.2690, 0.0)],
        liquid=("scotch", (0.666, 0.412, 0.041), 70.0),
        closure=("screw_cap", dict(z0=0.2470, z1=0.2735, r=0.0163, metal="ink_cap", ridges=72)),
        label=("scotch", dict(z0=0.050, z1=0.140, w=0.064, paper="#111114")),
        neck=None,
        stipple=0.0,
    ),
    "jameson": dict(
        desc="green glass round whiskey, champagne metal screw cap",
        glass=("green", (0.42, 0.80, 0.50), 190.0),
        section=("round",),
        outer=[(0, 0.0080), (0.030, 0.0030, 0.005), (0.0365, 0.0, 0.003), (0.0405, 0.0055, 0.005),
               (0.0408, 0.168, 0.0), (0.0398, 0.186, 0.018), (0.0170, 0.226, 0.016),
               (0.0145, 0.240, 0.008), (0.0142, 0.2590, 0.0), (0.0154, 0.2605, 0.0006),
               (0.0154, 0.2640, 0.0006), (0.0143, 0.2655, 0.0), (0.0142, 0.2830, 0.0012),
               (0.0102, 0.2830, 0.0012)],
        inner=[(0, 0.0120), (0.031, 0.0105, 0.006), (0.0372, 0.018, 0.006), (0.0376, 0.168, 0.0),
               (0.0366, 0.186, 0.017), (0.0132, 0.226, 0.014), (0.0102, 0.240, 0.006),
               (0.0100, 0.2830, 0.0)],
        liquid=("irish", (0.89, 0.71, 0.24), 30.0),
        closure=("screw_cap", dict(z0=0.2615, z1=0.2885, r=0.0160, metal="champagne", ridges=64)),
        label=("irish", dict(z0=0.052, z1=0.132, w=0.080, paper="#F0EADB")),
        neck=("band_cream", dict(z0=0.244, z1=0.256, paper="#F0EADB")),
        stipple=0.008,
    ),
    "four-roses": dict(
        desc="rounded amber bourbon, synthetic cork with ink wood-look top",
        glass=("flint_r", None, 0.0),
        section=("round",),
        outer=[(0, 0.0075), (0.030, 0.0030, 0.005), (0.0372, 0.0, 0.003), (0.0412, 0.0065, 0.008),
               (0.0425, 0.090, 0.0), (0.0418, 0.150, 0.0), (0.0400, 0.178, 0.030),
               (0.0175, 0.222, 0.018), (0.0148, 0.242, 0.008), (0.0144, 0.2710, 0.0),
               (0.0160, 0.2735, 0.0012), (0.0160, 0.2790, 0.0015), (0.0100, 0.2790, 0.0012)],
        inner=[(0, 0.0118), (0.031, 0.0105, 0.006), (0.0378, 0.019, 0.008), (0.0390, 0.090, 0.0),
               (0.0383, 0.150, 0.0), (0.0364, 0.178, 0.028), (0.0136, 0.222, 0.016),
               (0.0098, 0.242, 0.006), (0.0098, 0.2790, 0.0)],
        liquid=("bourbon", (0.852, 0.623, 0.011), 52.0),
        closure=("cork_top", dict(z=0.2790, bore=0.0098, shank=0.024, top_r=0.0175, top_h=0.0150,
                                 top="ink_wood")),
        label=("bourbon", dict(z0=0.048, z1=0.150, w=0.074, paper="#F2E9D2")),
        neck=None,
        stipple=0.008,
    ),
    "casamigos": dict(
        desc="heavy squat clear tequila, thick base, rounded-square body, walnut stopper",
        glass=("flint_c", None, 0.0),
        section=("rect", 0.86, 0.30, 0.150, 0.178),
        outer=[(0, 0.0060), (0.034, 0.0025, 0.004), (0.0420, 0.0, 0.003), (0.0470, 0.0055, 0.0055),
               (0.0470, 0.146, 0.0), (0.0466, 0.153, 0.007), (0.0190, 0.1765, 0.008),
               (0.0168, 0.186, 0.004), (0.0168, 0.2050, 0.0), (0.0180, 0.2070, 0.0010),
               (0.0180, 0.2120, 0.0016), (0.0126, 0.2120, 0.0012)],
        inner=[(0, 0.0330), (0.032, 0.0315, 0.006), (0.0418, 0.040, 0.006), (0.0418, 0.144, 0.0),
               (0.0410, 0.150, 0.006), (0.0140, 0.1735, 0.008), (0.0124, 0.186, 0.003),
               (0.0124, 0.2120, 0.0)],
        liquid=("tequila_c", (0.99, 0.985, 0.97), 1.0),
        closure=("wood_stopper", dict(z=0.2120, bore=0.0124, shank=0.026, top_r=0.0185, top_h=0.040,
                                     wood="walnut")),
        label=("tequila_print", dict(z0=0.056, z1=0.128, w=0.062, paper="#EFEBE3")),
        neck=None,
        stipple=0.0,
    ),
    "maestro-dobel": dict(
        desc="tall faceted clear tequila, faceted chrome cap",
        glass=("flint_d", None, 0.0),
        section=("ngon", 12, 0.05, 0.218, 0.262),
        outer=[(0, 0.0070), (0.027, 0.0030, 0.004), (0.0330, 0.0, 0.003), (0.0376, 0.0050, 0.004),
               (0.0376, 0.198, 0.0), (0.0370, 0.208, 0.010), (0.0168, 0.246, 0.014),
               (0.0140, 0.262, 0.006), (0.0140, 0.2940, 0.0), (0.0150, 0.2955, 0.0006),
               (0.0150, 0.2990, 0.0006), (0.0140, 0.3005, 0.0), (0.0138, 0.3110, 0.0012),
               (0.0098, 0.3110, 0.0012)],
        inner=[(0, 0.0125), (0.026, 0.0110, 0.005), (0.0334, 0.018, 0.005), (0.0336, 0.198, 0.0),
               (0.0330, 0.208, 0.010), (0.0130, 0.246, 0.012), (0.0098, 0.262, 0.004),
               (0.0096, 0.3110, 0.0)],
        liquid=("tequila_d", (0.99, 0.985, 0.965), 1.0),
        closure=("screw_cap", dict(z0=0.2965, z1=0.3330, r=0.0168, metal="chrome_cap", ridges=0,
                                  facets=12, turn_deg=8.5)),
        label=("tequila_tall", dict(z0=0.092, z1=0.150, w=0.060, paper="#EFEBE3")),
        neck=None,
        stipple=0.007,
    ),
}


def _section_for(spec, M=None):
    s = spec["section"]
    if s[0] == "round":
        return round_section(M or 192)
    f = inv_smoothstep(s[3], s[4])
    if s[0] == "rect":
        return rect_section(s[1], s[2], M or 256, f)
    return ngon_section(s[1], s[2], M or 288, f)


def _volume(prof, sec, z_top):
    """Volume enclosed by an inner profile (bottom->top, starts at r=0) up to z_top."""
    V = 0.0
    for i in range(len(prof) - 1):
        (r0, z0), (r1, z1) = prof[i], prof[i + 1]
        if z0 >= z_top:
            break
        if z1 <= z0:
            continue
        zz1 = min(z1, z_top)
        t = (zz1 - z0) / (z1 - z0)
        rr1 = r0 + (r1 - r0) * t
        zm = 0.5 * (z0 + zz1)
        rm = 0.5 * (r0 + rr1)
        V += sec.area_unit(zm) * rm * rm * (zz1 - z0)
    return V


def _fill_level(prof, sec, target=0.75e-3):
    lo, hi = prof[0][1], max(p[1] for p in prof)
    for _ in range(40):
        mid = 0.5 * (lo + hi)
        if _volume(prof, sec, mid) < target:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def _liquid_profile(inner_dense, fill_z, gap=0.00025, men=0.0016):
    off = offset_profile(inner_dense, gap)
    pts = []
    for i, (r, z) in enumerate(off):
        if z >= fill_z:
            # interpolate crossing
            r0, z0 = off[i - 1]
            t = (fill_z - z0) / max(1e-9, z - z0)
            rf = r0 + (r - r0) * t
            break
        pts.append((r, z))
    else:
        rf = off[-1][0]
    # meniscus: liquid climbs the wall (concave), then flat to the centre
    w = min(0.0035, rf * 0.35)
    ztop = fill_z + men
    pts.append((rf, ztop))
    for k in range(1, 9):
        s = k / 8
        pts.append((rf - w * s, fill_z + men * (1 - s) ** 2.4))
    pts.append((0.0, fill_z))
    return pts


def bottle_info(kind):
    spec = BOTTLES[kind]
    sec = _section_for(spec, 96)
    inner = fillet(spec["inner"], max_len=0.003)
    fz = _fill_level(inner, sec)
    full = _volume(inner, sec, 10.0)
    h = spec.get("height")
    return dict(fill_z=fz, brimful_ml=full * 1e6, height=h)


def contact_occluder(root, kind=None, radius=None, scale=1.0, z0=0.0004, z1=0.0016, name=None):
    """Render helper (not part of the product): a thin slab in the footprint of a bottle (`kind`)
    or of radius `radius` (round), parented to `root`, visible ONLY to shadow rays. Glass passes
    most shadow light (see GLASS_SHADOW) and is hidden from diffuse rays in the glass scenes, so
    without this the catcher records almost no contact line and heavy bottles seem to hover.
    The slab sits inside the heel; its shadow spills out a few mm as a tight, dark crease."""
    if kind is not None:
        spec = BOTTLES[kind]
        sec = _section_for(spec, 128)
        r = profile_interp(fillet(spec["outer"], max_len=0.003))(0.006)
    else:
        sec, r = round_section(128), radius
    r *= scale
    o = loft(name or f"{root.name}_contact", [(0.0, z0), (r, z0), (r, z1), (0.0, z1)], sec)
    o.parent = root
    for attr in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_transmission",
                 "visible_volume_scatter"):
        setattr(o, attr, False)
    o.visible_shadow = True
    return o


def _closure(kind, spec, sec):
    ctype, c = spec["closure"]
    parts = []
    if ctype in ("cork_cap", "cork_top", "wood_stopper"):
        z, bore = c["z"], c["bore"]
        # cork shank inside the neck (visible through the glass), slight taper
        sh = loft(f"{kind}_cork_shank",
                  fillet([(0, z - c["shank"]), (bore - 0.0009, z - c["shank"], 0.0012),
                          (bore - 0.00025, z - c["shank"] + 0.006, 0.0), (bore - 0.00025, z + 0.0012),
                          (0, z + 0.0012)], max_len=0.003),
                  round_section(96), mats=(mat_cork("shank"),))
        parts.append(sh)
        if ctype == "cork_cap":
            # ink polymer cap with a chrome ring at the base
            capm = mat_plastic("ink_poly", "#121216", rough=0.28, coat=0.4)
            R, H = c["cap_r"], c["cap_h"]
            cap = loft(f"{kind}_cap", fillet([(0, z + 0.0016), (R - 0.0006, z + 0.0016, 0.0005),
                                              (R, z + 0.0035, 0.0006), (R - 0.0002, z + H - 0.002, 0.0),
                                              (R - 0.0010, z + H, 0.0018), (0, z + H + 0.0006)],
                                             max_len=0.002), round_section(128), mats=(capm,))
            ring = loft(f"{kind}_cap_ring", fillet([(bore + 0.0004, z + 0.0003), (R + 0.0003, z + 0.0003, 0.0004),
                                                    (R + 0.0003, z + 0.0028, 0.0004),
                                                    (bore + 0.0004, z + 0.0028)], max_len=0.002),
                        round_section(128), mats=(mat_metal("chrome_ring", "#D7D9DE", 0.12, 0.5),))
            parts += [cap, ring]
            top = z + H + 0.0006
        elif ctype == "cork_top":
            R, H = c["top_r"], c["top_h"]
            if c["top"] == "cork":
                tm = mat_cork("top", "#C29A6B", "#80593A")
                pts = [(0, z + 0.0004), (R - 0.0012, z + 0.0004, 0.0008), (R, z + 0.0030, 0.0018),
                       (R - 0.0006, z + H - 0.003, 0.0), (R - 0.0022, z + H, 0.0030), (0, z + H + 0.0004)]
            else:
                tm = mat_wood("ink_wood", "#2E2620", "#16110E", rough=0.35, coat=0.5, ring_spacing=0.0035,
                              line="#0D0A08")
                pts = [(0, z + 0.0004), (R - 0.0010, z + 0.0004, 0.0008), (R, z + 0.0025, 0.0014),
                       (R, z + H - 0.0035, 0.0), (R - 0.0035, z + H, 0.0035), (0, z + H + 0.0006)]
            top = loft(f"{kind}_stopper_top", fillet(pts, max_len=0.002), round_section(128), mats=(tm,))
            parts.append(top)
            top = z + H + 0.0006
        else:  # tall turned-wood stopper with a cork collar
            R, H = c["top_r"], c["top_h"]
            wm = mat_wood("walnut", "#7B4F31", "#5A3620", rough=0.42, coat=0.25)
            pts = [(0, z + 0.0004), (R - 0.0008, z + 0.0004, 0.0006), (R, z + 0.0020, 0.0012),
                   (R - 0.0010, z + 0.010, 0.0), (R - 0.0018, z + 0.016, 0.006), (R + 0.0006, z + H - 0.010, 0.010),
                   (R + 0.0006, z + H - 0.003, 0.0), (R - 0.0030, z + H, 0.0035), (0, z + H + 0.0008)]
            st = loft(f"{kind}_stopper", fillet(pts, max_len=0.002), round_section(128), mats=(wm,))
            parts.append(st)
            top = z + H + 0.0008
    else:  # screw cap: knurled/faceted metal shell, rolled top edge, perforated tamper ring
        z0, z1, R = c["z0"], c["z1"], c["r"]
        mk = c["metal"]
        if mk == "ink_cap":
            mt = mat_metal("ink_cap", "#18181B", rough=0.30, aniso=0.4, coat=0.6)
        elif mk == "champagne":
            mt = mat_metal("champagne_cap", "#C9B48A", rough=0.22, aniso=0.6)
        else:
            mt = mat_metal("chrome_cap", "#B9BCC2", rough=0.17, aniso=0.5)
        ridges = c.get("ridges", 0)
        facets = c.get("facets", 0)
        sec_c = ngon_section(facets, 0.04, 288, lambda z: 1.0) if facets else round_section(432 if ridges else 192)
        band_top = z0 + 0.0048
        pts = [(0.0, z1 - 0.0016), (R - 0.0025, z1 - 0.0004, 0.0), (R - 0.0012, z1, 0.0010),
               (R, z1 - 0.0016, 0.0012), (R, band_top + 0.0012, 0.0)]
        pts = list(reversed(pts))   # bottom -> top for the shell outside
        shell_pts = [(0.0142 if facets else R - 0.0012, band_top + 0.0002), (R, band_top + 0.0002, 0.0004)] + \
                    pts[1:]
        prof = fillet(shell_pts, max_len=0.0015)
        zlo, zhi = band_top + 0.003, z1 - 0.003
        def rad(i, k):
            if not ridges:
                return 1.0
            zz = prof[k][1]
            if zz < zlo or zz > zhi:
                return 1.0
            th = sec_c.thetas[i]
            s = 0.5 + 0.5 * math.cos(th * ridges)
            return 1.0 - 0.018 * s ** 3
        shell = loft(f"{kind}_cap_shell", prof, sec_c, mats=(mt,), radial=rad)
        parts.append(shell)
        # a screwed-down faceted cap never lands facet-aligned; the turn also keeps any facet
        # from facing a softbox square-on (a flat untextured grey strip in the render)
        cap_turn = math.radians(c.get("turn_deg", 0.0))
        shell.rotation_euler.z = cap_turn
        # tamper band (separated by a perforation gap)
        tb = loft(f"{kind}_cap_band", fillet([(R - 0.0016, z0), (R - 0.0001, z0, 0.0004),
                                             (R - 0.0001, z0 + 0.0042, 0.0004), (R - 0.0016, z0 + 0.0042)],
                                            max_len=0.001),
                  sec_c, mats=(mt,))
        tb.rotation_euler.z = cap_turn
        parts.append(tb)
        # bridges across the perforation
        for k in range(8):
            a = 2 * math.pi * (k + 0.5) / 8
            bpy.ops.mesh.primitive_cube_add(size=1, location=((R - 0.0006) * math.cos(a), (R - 0.0006) * math.sin(a),
                                                              z0 + 0.0046), rotation=(0, 0, a))
            br = bpy.context.active_object
            br.name = f"{kind}_cap_bridge{k}"
            br.scale = (0.0010, 0.0016, 0.0010)
            assign(br, mt)
            parts.append(br)
        top = z1
    return parts, top


def bottle(kind):
    """750 ml spirit bottle `kind` (see BOTTLES). Returns the root Empty."""
    spec = BOTTLES[kind]
    sec = _section_for(spec)
    gk, gabs, gden = spec["glass"]
    glass_m = mat_vessel_glass(gk, gabs, gden, stipple=spec.get("stipple") or None)
    outer = fillet(spec["outer"], max_len=0.003)
    inner = fillet(spec["inner"], max_len=0.003)
    glass_prof = outer + list(reversed(inner))
    parts = [loft(f"{kind}_glass", glass_prof, sec, mats=(glass_m,))]
    # liquid filled to 750 ml
    fz = _fill_level(inner, sec)
    lname, lcol, lden = spec["liquid"]
    lp = _liquid_profile(inner, fz)
    parts.append(loft(f"{kind}_liquid", lp, sec, mats=(mat_vessel_liquid(lname, lcol, lden),)))
    # closure
    cparts, top = _closure(kind, spec, sec)
    parts += cparts
    # label(s)
    if spec.get("label"):
        style, L = spec["label"]
        h = L["z1"] - L["z0"]
        cp, fp = _label_tex(kind, style, L["w"], h, paper=L["paper"])
        lm = mat_label(kind, cp, fp, print_on_glass=(style == "tequila_print"))
        parts.append(label_mesh(f"{kind}_label", outer, sec, L["z0"], L["z1"], L["w"], mat=lm,
                                thickness=0.0 if style == "tequila_print" else 0.00012,
                                offset=0.00006 if style == "tequila_print" else 0.00010))
    if spec.get("neck"):
        style, L = spec["neck"]
        r_at = profile_interp(outer)
        circ = 2 * math.pi * r_at(0.5 * (L["z0"] + L["z1"]))
        cp, fp = _label_tex(kind + "_neck", style, circ, L["z1"] - L["z0"], paper=L["paper"])
        lm = mat_label(kind + "_neck", cp, fp)
        parts.append(label_mesh(f"{kind}_neckband", outer, sec, L["z0"], L["z1"], circ, mat=lm,
                                full_wrap=True, cols=192, rows=8))
    # the rounded heel lifts the lowest glass point a hair above 0: re-seat everything on Z=0
    dz = min(v.co.z for v in parts[0].data.vertices)
    for p in parts:
        p.location.z -= dz
    spec["_height"] = spec["height"] = top - dz
    spec["_fill_z"] = spec["fill_z"] = fz - dz
    root = _root(f"bottle_{kind}", parts)
    return root
