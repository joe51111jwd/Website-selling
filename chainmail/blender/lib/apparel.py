"""
chainmail studio — apparel: retail-folded hoodies, tees and long sleeves.

    folded_hoodie(color="Black", seed=None)                 -> Empty root
    folded_tee(color="White", long_sleeve=False, seed=None)  -> Empty root

Every builder returns ONE Empty (identity transform) whose children are the
garment parts, with the origin at the base centre, resting on Z=0, the neck at
+Y and the folded waist toward -Y (front faces -Y, logo reads left->right from
the front). Footprint ~0.20 (X) x 0.27 (Y) m; hoodie 0.055 m tall, tees 0.03 m.
Builders never create cameras/lights or render.

Retail fold: body folded in thirds lengthwise (rounded side folds), sleeves
tucked behind, folded once at the waist (rounded near fold), chest + logo up.
Hoodie: hood folded forward over the top with a coverstitched centre seam,
round drawcords with metal aglets, embroidered (raised satin-stitch) logo, a
rib cuff peeking from under the right fold. Tee: rib collar with twin-needle
coverstitch, back-neck tape, woven neck label, screen-printed logo (matte,
slightly cracked ink with the knit showing through). Long sleeve: same + rib
cuff peeking from under the right fold.

Scene helpers (not used by the builders): stack(roots, placements) drapes each
garment onto the ones below it (soft sag over edges), frame_camera(...).
"""
import bpy, bmesh, math, os, random, subprocess
import numpy as np
from mathutils import Vector, Matrix, noise
from mathutils.bvhtree import BVHTree
from common import rgb, ASSETS, FONT_DISPLAY, FONT_MONO, FONT_TEXT, lathe, smooth, _new_mat

SWATCH = {"Black": "#151515", "Cement": "#CFCBC3", "White": "#F7F7F4", "Dust": "#E6E0D2",
          "Natural": "#E9E1CF"}
INK = {"Black": "#2B3BFF", "Cement": "#2B3BFF", "White": "#2B3BFF", "Dust": "#2B3BFF"}
TEX_DIR = os.path.join(ASSETS, "textures")
TEX_PRINT = os.path.join(TEX_DIR, "apparel_logo_mask.png")
TEX_LABEL = os.path.join(TEX_DIR, "apparel_label_mask.png")

W_FOLD, D_FOLD = 0.20, 0.27


# ============================================================== small utils
def _hex(color):
    return SWATCH.get(color, color)


def _stable_seed(s):
    return sum((i + 1) * ord(ch) for i, ch in enumerate(str(s))) % 997


def _ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _get_co(me):
    a = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", a)
    return a.reshape(-1, 3).astype(np.float64)


def _set_co(me, P):
    me.vertices.foreach_set("co", P.astype(np.float32).ravel())
    me.update()


def _noise2(x, y, freq, seed, z=0.0):
    off = (seed * 17.13 + 3.1, seed * 9.71 + 1.7, seed * 5.37 + z)
    out = np.empty(len(x))
    nz = noise.noise
    for i in range(len(x)):
        out[i] = nz(Vector((x[i] * freq + off[0], y[i] * freq + off[1], off[2])))
    return out


def _fbm(x, y, freq, seed, octaves=3, gain=0.5):
    tot = np.zeros(len(x))
    amp = 1.0
    for o in range(octaves):
        tot += amp * _noise2(x, y, freq * (2.0 ** o), seed + o * 31)
        amp *= gain
    return tot


def _crease(x, y, x0, y0, ang, length, width, amp, valleys=0.55):
    """Soft cloth wrinkle: a ridge (amp>0) or groove with shallow shoulders,
    tapering at both ends. Angle in radians, length/width in metres."""
    c, s = math.cos(ang), math.sin(ang)
    u = (x - x0) * c + (y - y0) * s
    n = -(x - x0) * s + (y - y0) * c
    tt = np.clip(u / length, 0.0, 1.0)
    env = np.where((u > 0) & (u < length), np.sin(np.pi * tt) ** 0.7 * (1.0 - 0.5 * tt), 0.0)
    prof = np.exp(-(n / width) ** 2) - valleys * 0.5 * (np.exp(-((n - 1.7 * width) / width) ** 2) +
                                                         np.exp(-((n + 1.7 * width) / width) ** 2))
    return amp * env * prof


def _dist_polyline(x, y, pts):
    pts = np.asarray(pts, dtype=np.float64)
    A, B = pts[:-1], pts[1:]
    AB = B - A
    L2 = (AB ** 2).sum(1) + 1e-12
    px = x[:, None] - A[None, :, 0]
    py = y[:, None] - A[None, :, 1]
    t = np.clip((px * AB[:, 0] + py * AB[:, 1]) / L2, 0.0, 1.0)
    dx = px - t * AB[:, 0]
    dy = py - t * AB[:, 1]
    return np.sqrt((dx * dx + dy * dy).min(1))


def _resample(pts, ds, closed=False):
    pts = [Vector((p[0], p[1])) for p in pts]
    if closed:
        pts = pts + [pts[0]]
    segs = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    total = sum((b - a).length for a, b in segs)
    n = max(2, int(round(total / ds)))
    out, acc, si = [], 0.0, 0
    lens = [(b - a).length for a, b in segs]
    for k in range(n + (0 if closed else 1)):
        target = total * k / n
        while si < len(segs) - 1 and acc + lens[si] < target:
            acc += lens[si]
            si += 1
        a, b = segs[si]
        t = 0.0 if lens[si] < 1e-12 else (target - acc) / lens[si]
        out.append(a.lerp(b, min(max(t, 0.0), 1.0)))
    return out


def _link(obj, parent=None):
    bpy.context.scene.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def _obj_from_bm(name, bm, mat=None, parent=None, smooth_shade=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    _link(o, parent)
    if mat is not None:
        me.materials.append(mat)
    if smooth_shade:
        smooth(o)
    return o


def _bvh(obj):
    """BVH of the evaluated object (modifiers applied) in the object's local space."""
    dg = bpy.context.evaluated_depsgraph_get()
    return BVHTree.FromObject(obj, dg)


def _hit(bvh, x, y, z0=1.0):
    loc, nrm, idx, dist = bvh.ray_cast(Vector((x, y, z0)), Vector((0, 0, -1)))
    if loc is None:
        return None, None
    if nrm.z < 0:
        nrm = -nrm
    return loc, nrm


def _surface_path(bvh, pts2d, ds, closed=False, smooth_n=5):
    """Drop a 2D polyline onto a surface. Returns (points, normals)."""
    P2 = _resample(pts2d, ds, closed)
    pts, nrms = [], []
    last = None
    for p in P2:
        loc, n = _hit(bvh, p.x, p.y)
        if loc is None:
            loc, n = (last[0].copy(), last[1].copy()) if last else (Vector((p.x, p.y, 0)), Vector((0, 0, 1)))
            loc.x, loc.y = p.x, p.y
        pts.append(loc)
        nrms.append(n)
        last = (loc, n)
    # smooth normals along the path (flat face normals -> calm frames)
    N = len(nrms)
    sm = []
    for i in range(N):
        acc = Vector((0, 0, 0))
        for k in range(-smooth_n, smooth_n + 1):
            j = (i + k) % N if closed else min(max(i + k, 0), N - 1)
            acc += nrms[j]
        sm.append(acc.normalized())
    return pts, sm


def _sweep(name, pts, normals, profile, closed=False, closed_profile=True, mat=None, parent=None):
    """Sweep a 2D profile along a 3D path. profile: list[(b, n)] or callable(i, s)->list.
    b = sideways (tangent x normal), n = along the surface normal. UV: u = arc length (m), v = profile 0..1."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    N = len(pts)
    svals = [0.0]
    for i in range(1, N):
        svals.append(svals[-1] + (pts[i] - pts[i - 1]).length)
    rings = []
    for i in range(N):
        if closed:
            t = pts[(i + 1) % N] - pts[i - 1]
        else:
            t = pts[min(i + 1, N - 1)] - pts[max(i - 1, 0)]
        t.normalize()
        nr = normals[i] - t * normals[i].dot(t)
        nr.normalize()
        bn = t.cross(nr)
        prof = profile(i, svals[i]) if callable(profile) else profile
        rings.append([bm.verts.new(pts[i] + bn * pb + nr * pn) for (pb, pn) in prof])
    M = len(rings[0])
    seg_end = N if closed else N - 1
    kmax = M if closed_profile else M - 1
    total = svals[-1] + ((pts[0] - pts[-1]).length if closed else 0.0)
    for i in range(seg_end):
        i2 = (i + 1) % N
        u0 = svals[i]
        u1 = svals[i2] if i2 > i else total
        for k in range(kmax):
            k2 = (k + 1) % M
            v0, v1 = k / kmax, (k + 1) / kmax
            try:
                f = bm.faces.new((rings[i][k], rings[i][k2], rings[i2][k2], rings[i2][k]))
            except ValueError:
                continue
            for lp, uv in zip(f.loops, ((u0, v0), (u0, v1), (u1, v1), (u1, v0))):
                lp[uvl].uv = uv
    return _obj_from_bm(name, bm, mat, parent)


# ============================================================== textures (Pillow, cached on disk)
_TEX_SCRIPT = r'''
import sys
from PIL import Image, ImageDraw, ImageFont
disp, mono, out_print, out_label = sys.argv[1:5]
# screen-print / embroidery mask: "your logo", white on black, tight crop
f = ImageFont.truetype(disp, 420)
bb = f.getbbox("your logo")
w, h = bb[2] - bb[0], bb[3] - bb[1]
pad = 40
im = Image.new("L", (w + 2 * pad, h + 2 * pad), 0)
ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), "your logo", font=f, fill=255)
im.save(out_print)
# woven neck label: "your logo" + size, white on black, 1100x560 (label 0.034 x 0.0175 m)
L = Image.new("L", (1100, 560), 0)
d = ImageDraw.Draw(L)
f1 = ImageFont.truetype(disp, 150)
bb = f1.getbbox("your logo")
d.text(((1100 - (bb[2] - bb[0])) / 2 - bb[0], 150 - bb[1]), "your logo", font=f1, fill=255)
f2 = ImageFont.truetype(mono, 92)
for txt, y in (("M", 360),):
    bb = f2.getbbox(txt)
    d.text(((1100 - (bb[2] - bb[0])) / 2 - bb[0], y - bb[1]), txt, font=f2, fill=255)
L.save(out_label)
'''


def _ensure_textures():
    if os.path.exists(TEX_PRINT) and os.path.exists(TEX_LABEL):
        return
    os.makedirs(TEX_DIR, exist_ok=True)
    env = {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
    subprocess.run(["python3", "-c", _TEX_SCRIPT, FONT_DISPLAY, FONT_MONO, TEX_PRINT, TEX_LABEL],
                   check=True, env=env)


def _image(path):
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = "Non-Color"
    return img


# ============================================================== shader building
class _NB:
    def __init__(self, nt):
        self.nt = nt

    def new(self, kind, **props):
        n = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def _in(self, sock, v):
        if isinstance(v, (int, float)):
            sock.default_value = v
        elif isinstance(v, tuple):
            sock.default_value = v
        else:
            self.nt.links.new(v, sock)

    def m(self, op, a, b=None, c=None, clamp=False):
        n = self.nt.nodes.new("ShaderNodeMath")
        n.operation = op
        n.use_clamp = clamp
        for i, v in enumerate((a, b, c)):
            if v is not None:
                self._in(n.inputs[i], v)
        return n.outputs[0]

    def mix(self, fac, a, b, kind="RGBA", blend="MIX"):
        n = self.nt.nodes.new("ShaderNodeMix")
        n.data_type = kind
        if kind == "RGBA":
            n.blend_type = blend
            self._in(n.inputs[0], fac)
            self._in(n.inputs[6], a)
            self._in(n.inputs[7], b)
            return n.outputs[2]
        self._in(n.inputs[0], fac)
        self._in(n.inputs[2], a)
        self._in(n.inputs[3], b)
        return n.outputs[0]

    def noise(self, vec, scale, detail=4.0, rough=0.5, dist=0.0, w=None):
        n = self.nt.nodes.new("ShaderNodeTexNoise")
        if w is not None:
            n.noise_dimensions = "4D"
            n.inputs["W"].default_value = w
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        n.inputs["Distortion"].default_value = dist
        self.link(vec, n.inputs["Vector"])
        return n.outputs["Fac"]

    def bump(self, height, strength, distance, normal=None):
        b = self.nt.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = strength
        b.inputs["Distance"].default_value = distance
        self.link(height, b.inputs["Height"])
        if normal is not None:
            self.link(normal, b.inputs["Normal"])
        return b.outputs["Normal"]


TAU = 2.0 * math.pi


def _jersey(nb, x, y, w=0.00078, h=0.00062):
    """Single-jersey face: columns of V-shaped loops (x = course direction, y = wale)."""
    fx = nb.m("FRACT", nb.m("DIVIDE", x, w))
    ax = nb.m("ABSOLUTE", nb.m("SUBTRACT", fx, 0.5))                       # 0 col centre .. 0.5 edge
    t = nb.m("ADD", nb.m("DIVIDE", y, h), nb.m("MULTIPLY", ax, 1.25))       # chevron
    stitch = nb.m("MULTIPLY_ADD", nb.m("COSINE", nb.m("MULTIPLY", t, TAU)), 0.5, 0.5)
    leg = nb.m("POWER", nb.m("SINE", nb.m("MULTIPLY", ax, TAU)), 0.6)      # two legs per column
    return nb.m("MULTIPLY", leg, nb.m("MULTIPLY_ADD", stitch, 0.45, 0.55))


def _rib(nb, across, pitch=0.0019):
    """1x1 rib: raised knit wales with deep purl valleys between."""
    s = nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", across, math.pi / pitch)))
    return nb.m("POWER", s, 0.55)


def mat_knit(color, name=None, kind="jersey", rib_axis="OBJ_Y", rib_pitch=0.0019, ink=None,
             print_rect=None, bump=0.85):
    """Cotton knit (jersey / french-terry face / 1x1 rib). Optional screen print:
    print_rect=(cx, cy, w, h) in object space (top projection), ink=hex."""
    hexc = _hex(color)
    name = name or f"apparel_{kind}_{color}" + ("_print" if print_rect else "") + (f"_{rib_axis}" if kind == "rib" else "")
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(obj, sep.inputs[0])
    x, y, z = sep.outputs[0], sep.outputs[1], sep.outputs[2]
    dark = sum(rgb(hexc)[:3]) / 3 < 0.05
    if kind == "rib":
        if rib_axis == "UV_X":
            uv = nb.new("ShaderNodeSeparateXYZ")
            nb.link(tc.outputs["UV"], uv.inputs[0])
            across = uv.outputs[0]
        elif rib_axis == "OBJ_X":
            across = x
        else:
            across = y
        H = _rib(nb, across, rib_pitch)
    else:
        # wale direction follows the garment length (y), wraps around folds with z
        H = _jersey(nb, x, y)
    yarn = nb.noise(obj, 2600.0, 3.0, 0.6)
    fuzz = nb.noise(obj, 9000.0, 2.0, 0.5)
    mott = nb.noise(obj, 140.0, 6.0, 0.55)
    height = nb.m("ADD", nb.m("MULTIPLY", H, 0.75), nb.m("MULTIPLY", yarn, 0.35))
    height = nb.m("ADD", height, nb.m("MULTIPLY", fuzz, 0.12))
    # albedo: base, slight heather mottling, knit valleys a touch darker (micro-occlusion)
    base = rgb(hexc)
    lo = tuple(c * (0.86 if not dark else 0.80) for c in base[:3]) + (1,)
    hi = tuple(min(1.0, c * (1.06 if not dark else 1.6)) for c in base[:3]) + (1,)
    heather = 0.55 if color == "Cement" else 0.3
    f_mott = nb.m("MULTIPLY_ADD", nb.m("SUBTRACT", mott, 0.5), heather * 2.0, 0.5, clamp=True)
    col = nb.mix(f_mott, lo, hi)
    yv = 0.5 if color == "Cement" else (0.55 if dark else 0.25)
    yarn_c = nb.m("MULTIPLY_ADD", yarn, yv, 1.0 - yv / 2)
    occl = nb.m("MULTIPLY_ADD", H, 0.18 if kind == "rib" else 0.15, 0.82 if kind == "rib" else 0.85)
    shade = nb.m("MULTIPLY", occl, yarn_c)
    gray = nb.new("ShaderNodeCombineXYZ")
    for i in range(3):
        nb.link(shade, gray.inputs[i])
    col = nb.mix(1.0, col, gray.outputs[0], blend="MULTIPLY")
    rough = nb.m("MULTIPLY_ADD", yarn, 0.08, 0.86)
    sheen_w = 0.3 if dark else 0.35
    spec_level = 0.06 if dark else 0.12
    if print_rect is not None:
        _ensure_textures()
        cx, cy, pw, ph = print_rect
        vm = nb.new("ShaderNodeVectorMath", operation="SUBTRACT")
        nb.link(obj, vm.inputs[0])
        vm.inputs[1].default_value = (cx - pw / 2, cy - ph / 2, 0)
        vd = nb.new("ShaderNodeVectorMath", operation="DIVIDE")
        nb.link(vm.outputs[0], vd.inputs[0])
        vd.inputs[1].default_value = (pw, ph, 1)
        tex = nb.new("ShaderNodeTexImage")
        tex.image = _image(TEX_PRINT)
        tex.extension = "CLIP"
        tex.interpolation = "Cubic"
        nb.link(vd.outputs[0], tex.inputs[0])
        mask = tex.outputs["Color"]
        mask = nb.m("ADD", mask, 0.0)
        # ink sits on the knit: thinner on loop tops, a few hairline cracks
        vor = nb.new("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
        vor.inputs["Scale"].default_value = 230.0
        vor.inputs["Randomness"].default_value = 1.0
        nb.link(obj, vor.inputs["Vector"])
        crack = nb.m("SUBTRACT", 1.0, nb.m("MINIMUM", nb.m("DIVIDE", vor.outputs["Distance"], 0.03), 1.0))
        sparse = nb.m("GREATER_THAN", nb.noise(obj, 70.0, 2.0, 0.5), 0.6)
        crack = nb.m("MULTIPLY", crack, sparse)
        cover = nb.m("SUBTRACT", 1.0, nb.m("MULTIPLY", crack, 0.7))
        cover = nb.m("MULTIPLY", cover, nb.m("MULTIPLY_ADD", H, 0.10, 0.90))
        im = nb.m("MULTIPLY", mask, cover, clamp=True)
        ink_c = tuple(c * 0.78 for c in rgb(ink or "#2B3BFF")[:3]) + (1,)
        ink_lo = tuple(c * 0.86 for c in ink_c[:3]) + (1,)
        ink_col = nb.mix(nb.m("MULTIPLY_ADD", H, 0.5, 0.5), ink_lo, ink_c)
        col = nb.mix(im, col, ink_col)
        rough = nb.mix(im, rough, 0.62, kind="FLOAT")
        sw = nb.mix(im, sheen_w, 0.12, kind="FLOAT")
        nb.link(sw, b.inputs["Sheen Weight"])
        height = nb.m("ADD", nb.m("MULTIPLY", height, nb.m("MULTIPLY_ADD", mask, -0.45, 1.0)),
                      nb.m("MULTIPLY", im, 0.35))
    else:
        b.inputs["Sheen Weight"].default_value = sheen_w
    nb.link(col, b.inputs["Base Color"])
    nb.link(rough, b.inputs["Roughness"])
    b.inputs["Sheen Roughness"].default_value = 0.6
    b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
    b.inputs["Specular IOR Level"].default_value = spec_level
    nb.link(nb.bump(height, bump if kind != "rib" else bump * 1.6, 0.00028 if kind != "rib" else 0.0006),
            b.inputs["Normal"])
    return m


def mat_thread(color, name=None, satin=False):
    """Sewing / embroidery thread. satin=True: polyester embroidery satin stitch
    (diagonal parallel stitches, glossy). Else spun thread on UV tubes (twist)."""
    hexc = _hex(color)
    name = name or f"apparel_thread_{'satin_' if satin else ''}{color}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    base = rgb(hexc)
    if satin:
        sep = nb.new("ShaderNodeSeparateXYZ")
        nb.link(tc.outputs["Object"], sep.inputs[0])
        a = math.radians(58)
        u = nb.m("ADD", nb.m("MULTIPLY", sep.outputs[0], math.cos(a)), nb.m("MULTIPLY", sep.outputs[1], math.sin(a)))
        v = nb.m("ADD", nb.m("MULTIPLY", sep.outputs[0], -math.sin(a)), nb.m("MULTIPLY", sep.outputs[1], math.cos(a)))
        p = 0.00055
        jit = nb.m("MULTIPLY", nb.noise(tc.outputs["Object"], 700.0, 1.0), 0.00025)
        stripe = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", nb.m("ADD", u, jit), math.pi / p))), 0.45)
        # stitch length breaks (needle penetrations every ~3.5 mm, staggered)
        cell = nb.m("FLOOR", nb.m("DIVIDE", u, p))
        stag = nb.m("FRACT", nb.m("MULTIPLY", cell, 0.37))
        brk = nb.m("FRACT", nb.m("ADD", nb.m("DIVIDE", v, 0.0035), stag))
        brk = nb.m("MINIMUM", nb.m("DIVIDE", brk, 0.08), 1.0)
        h = nb.m("MULTIPLY", stripe, nb.m("MULTIPLY_ADD", brk, 0.5, 0.5))
        lo = tuple(c * 0.7 for c in base[:3]) + (1,)
        col = nb.mix(h, lo, base)
        nb.link(col, b.inputs["Base Color"])
        nb.link(nb.m("MULTIPLY_ADD", stripe, -0.12, 0.30), b.inputs["Roughness"])
        b.inputs["Sheen Weight"].default_value = 0.3
        b.inputs["Sheen Roughness"].default_value = 0.3
        b.inputs["Specular IOR Level"].default_value = 0.6
        b.inputs["Anisotropic"].default_value = 0.0
        nb.link(nb.bump(h, 1.0, 0.00025), b.inputs["Normal"])
    else:
        sep = nb.new("ShaderNodeSeparateXYZ")
        nb.link(tc.outputs["UV"], sep.inputs[0])
        tw = nb.m("ADD", nb.m("DIVIDE", sep.outputs[0], 0.00045), nb.m("MULTIPLY", sep.outputs[1], 2.0))
        h = nb.m("MULTIPLY_ADD", nb.m("SINE", nb.m("MULTIPLY", tw, TAU)), 0.5, 0.5)
        dark = sum(base[:3]) / 3 < 0.05
        k = 1.25 if dark else 0.92
        tcol = tuple(min(1.0, c * k) for c in base[:3]) + (1,)
        lo = tuple(c * 0.75 for c in tcol[:3]) + (1,)
        nb.link(nb.mix(h, lo, tcol), b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.6
        b.inputs["Sheen Weight"].default_value = 0.5
        b.inputs["Sheen Roughness"].default_value = 0.35
        b.inputs["Specular IOR Level"].default_value = 0.4
        nb.link(nb.bump(h, 0.5, 0.0001), b.inputs["Normal"])
    return m


def mat_cord(color, name=None):
    """Braided round drawcord (tone-on-tone)."""
    hexc = _hex(color)
    name = name or f"apparel_cord_{color}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(tc.outputs["UV"], sep.inputs[0])
    u, v = sep.outputs[0], sep.outputs[1]
    p, k = 0.0042, 4.0
    a = nb.m("MULTIPLY_ADD", nb.m("SINE", nb.m("MULTIPLY", nb.m("ADD", nb.m("DIVIDE", u, p), nb.m("MULTIPLY", v, k)), TAU)), 0.5, 0.5)
    c = nb.m("MULTIPLY_ADD", nb.m("SINE", nb.m("MULTIPLY", nb.m("SUBTRACT", nb.m("DIVIDE", u, p), nb.m("MULTIPLY", v, k)), TAU)), 0.5, 0.5)
    sel = nb.m("GREATER_THAN", nb.m("SINE", nb.m("MULTIPLY", nb.m("ADD", nb.m("DIVIDE", u, p * 0.5), nb.m("MULTIPLY", v, 2 * k)), TAU * 0.5)), 0.0)
    h = nb.mix(sel, a, c, kind="FLOAT")
    h = nb.m("POWER", h, 0.6)
    fine = nb.noise(tc.outputs["Object"], 4000.0, 2.0)
    base = rgb(hexc)
    dark = sum(base[:3]) / 3 < 0.05
    lo = tuple(cc * (0.6 if not dark else 0.8) for cc in base[:3]) + (1,)
    hi = tuple(min(1.0, cc * (1.0 if not dark else 1.4)) for cc in base[:3]) + (1,)
    nb.link(nb.mix(h, lo, hi), b.inputs["Base Color"])
    nb.link(nb.m("MULTIPLY_ADD", fine, 0.1, 0.72), b.inputs["Roughness"])
    b.inputs["Sheen Weight"].default_value = 0.6 if dark else 0.4
    b.inputs["Sheen Roughness"].default_value = 0.4
    b.inputs["Specular IOR Level"].default_value = 0.35
    nb.link(nb.bump(nb.m("ADD", h, nb.m("MULTIPLY", fine, 0.2)), 0.8, 0.0004), b.inputs["Normal"])
    return m


def mat_aglet(name="apparel_aglet"):
    """Satin nickel tip."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    b.inputs["Base Color"].default_value = rgb("#C9CCD3")
    b.inputs["Metallic"].default_value = 1.0
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(tc.outputs["Object"], sep.inputs[0])
    n = nb.noise(tc.outputs["Object"], 3000.0, 3.0)
    nb.link(nb.m("MULTIPLY_ADD", n, 0.08, 0.16), b.inputs["Roughness"])
    nb.link(nb.bump(n, 0.08, 0.0001), b.inputs["Normal"])
    return m


def mat_label(ground, text, name=None, rect=(0, 0, 0.034, 0.0175)):
    """Woven damask neck label. rect=(cx, cy, w, h) in object space."""
    name = name or f"apparel_label_{ground}_{text}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    _ensure_textures()
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]
    cx, cy, w, h = rect
    vm = nb.new("ShaderNodeVectorMath", operation="SUBTRACT")
    nb.link(obj, vm.inputs[0])
    vm.inputs[1].default_value = (cx - w / 2, cy - h / 2, 0)
    vd = nb.new("ShaderNodeVectorMath", operation="DIVIDE")
    nb.link(vm.outputs[0], vd.inputs[0])
    vd.inputs[1].default_value = (w, h, 1)
    tex = nb.new("ShaderNodeTexImage")
    tex.image = _image(TEX_LABEL)
    tex.extension = "EXTEND"
    tex.interpolation = "Cubic"
    nb.link(vd.outputs[0], tex.inputs[0])
    mask = nb.m("ADD", tex.outputs["Color"], 0.0)
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(obj, sep.inputs[0])
    weft = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", sep.outputs[1], math.pi / 0.00018))), 0.5)
    warp = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", sep.outputs[0], math.pi / 0.00022))), 0.5)
    weave = nb.mix(mask, weft, warp, kind="FLOAT")      # text floats run the other way
    g, t = rgb(ground), rgb(text)
    col = nb.mix(mask, g, t)
    nb.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.62
    b.inputs["Sheen Weight"].default_value = 0.5
    b.inputs["Specular IOR Level"].default_value = 0.3
    nb.link(nb.bump(nb.m("ADD", weave, nb.m("MULTIPLY", mask, 0.6)), 0.5, 0.00012), b.inputs["Normal"])
    return m


# ============================================================== geometry: the folded body
def _slab(name, W, D, T, rc=0.012, step=0.002, parent=None, mat=None):
    """Soft 'capsule slab': flat top/bottom, semicircular (folded) edges of radius T/2,
    rounded corners (rc) in plan. Base centre at origin, z in [0, T]."""
    r = T / 2.0
    a, b = W / 2 - r, D / 2 - r
    rc = min(rc, a, b)
    ax, by = a - rc, b - rc
    nx, ny = max(8, int(round(W / step))), max(8, int(round(D / step)))
    nz = max(6, int(round(math.pi * r / step * 0.9)))
    bm = bmesh.new()
    verts = {}

    def V(i, j, k):
        key = (i, j, k)
        v = verts.get(key)
        if v is not None:
            return v
        X = -W / 2 + W * i / nx
        Y = -D / 2 + D * j / ny
        Z = -r + T * k / nz
        cx = min(max(X, -ax), ax)
        cy = min(max(Y, -by), by)
        dx, dy = X - cx, Y - cy
        dl = math.hypot(dx, dy)
        if dl > rc:
            cx += dx / dl * rc
            cy += dy / dl * rc
        else:
            cx, cy = X, Y
        q = Vector((X - cx, Y - cy, Z))
        if q.length < 1e-12:
            q = Vector((0, 0, 1 if Z >= 0 else -1))
        p = Vector((cx, cy, 0)) + q.normalized() * r
        p.z += r
        v = bm.verts.new(p)
        verts[key] = v
        return v

    def F(a_, b_, c_, d_):
        bm.faces.new((V(*a_), V(*b_), V(*c_), V(*d_)))

    for i in range(nx):
        for j in range(ny):
            F((i, j, 0), (i, j + 1, 0), (i + 1, j + 1, 0), (i + 1, j, 0))
            F((i, j, nz), (i + 1, j, nz), (i + 1, j + 1, nz), (i, j + 1, nz))
    for j in range(ny):
        for k in range(nz):
            F((0, j, k), (0, j, k + 1), (0, j + 1, k + 1), (0, j + 1, k))
            F((nx, j, k), (nx, j + 1, k), (nx, j + 1, k + 1), (nx, j, k + 1))
    for i in range(nx):
        for k in range(nz):
            F((i, 0, k), (i + 1, 0, k), (i + 1, 0, k + 1), (i, 0, k + 1))
            F((i, ny, k), (i, ny, k + 1), (i + 1, ny, k + 1), (i + 1, ny, k))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _obj_from_bm(name, bm, mat, parent)


def _fold_deform(P, W, D, T, seed, opts):
    """Turn the clean slab into folded cloth: pillowy edges, layer ridges, wavy fold
    outlines, a little sag, compression wrinkles. Returns new P (N,3)."""
    rnd = random.Random(seed)
    x, y, z = P[:, 0].copy(), P[:, 1].copy(), P[:, 2].copy()
    r = T / 2.0
    wt = _ss(0.40 * T, 0.97 * T, z)                         # 1 on the top skin, 0 underneath
    dxs = W / 2 - np.abs(x)
    dyb = y + D / 2
    dyt = D / 2 - y
    d = np.minimum(np.minimum(dxs, dyb), dyt)
    dz = np.zeros(len(x))
    # pillowy shoulders: top skin rolls down softly into the folds
    dz -= opts.get("droop", 0.16) * T * (1.0 - _ss(0.0, opts.get("droop_len", 0.03), d)) * wt
    # stacked layers under the side thirds -> faint ridges a few cm in from the side folds
    for sgn in (-1, 1):
        dd = W / 2 - sgn * x
        dz += opts.get("side_ridge", 0.05) * T * np.exp(-((dd - 0.034) / 0.02) ** 2) * wt
    # waist fold is a bit fuller
    dz += opts.get("waist_puff", 0.05) * T * np.exp(-((dyb - 0.035) / 0.03) ** 2) * wt
    # gentle large-scale undulation + finer irregularity
    dz += opts.get("undulate", 0.0011) * _fbm(x, y, opts.get("ufreq", 11.0), seed, 3) * wt
    dz += opts.get("ripple", 0.00025) * _fbm(x, y, 45.0, seed + 5, 2) * wt
    # compression wrinkles near the fold corners and along the side folds
    amp = opts.get("wrinkle", 0.0009)
    for (cx, cy) in ((-1, -1), (1, -1)):
        for kk in range(rnd.randint(2, 4)):
            x0 = cx * (W / 2 - rnd.uniform(0.004, 0.02))
            y0 = -D / 2 + rnd.uniform(0.004, 0.035)
            ang = math.atan2(rnd.uniform(0.4, 1.0), -cx * rnd.uniform(0.6, 1.2))
            dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.025, 0.06), rnd.uniform(0.0025, 0.0045),
                          amp * rnd.uniform(0.5, 1.1)) * wt
    # short compression wrinkles running in from the side folds (scalloped fold edge)
    for sgn in (-1, 1):
        ys_ = sorted(rnd.uniform(-D / 2 + 0.04, D / 2 - 0.04) for _ in range(rnd.randint(4, 7)))
        for y0 in ys_:
            x0 = sgn * (W / 2 + 0.004)
            ang = (math.pi if sgn > 0 else 0.0) + rnd.uniform(-0.45, 0.45)
            dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.018, 0.05), rnd.uniform(0.0022, 0.0042),
                          amp * rnd.uniform(0.5, 1.1)) * wt
    # and in from the waist fold
    for kk in range(rnd.randint(3, 5)):
        x0 = rnd.uniform(-W / 2 + 0.03, W / 2 - 0.03)
        ang = math.pi / 2 + rnd.uniform(-0.5, 0.5)
        dz += _crease(x, y, x0, -D / 2 - 0.004, ang, rnd.uniform(0.015, 0.04), rnd.uniform(0.0025, 0.004),
                      amp * rnd.uniform(0.4, 0.9)) * wt
    for kk in range(rnd.randint(3, 5)):
        sgn = rnd.choice((-1, 1))
        x0 = sgn * (W / 2 - rnd.uniform(0.0, 0.03))
        y0 = rnd.uniform(-D / 2 + 0.02, D / 2 - 0.08)
        ang = (math.pi if sgn > 0 else 0.0) + rnd.uniform(-0.5, 0.5)
        dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.05, 0.11), rnd.uniform(0.004, 0.008),
                      amp * rnd.uniform(0.35, 0.7), valleys=0.8) * wt
    for (x0, y0, ang, ln, wd, am) in opts.get("creases", []):
        dz += _crease(x, y, x0, y0, ang, ln, wd, am, valleys=0.3) * wt
    # wavy fold outlines (no ruler-straight edges) + slight outward bow of the folds
    edge_w = 1.0 - _ss(0.0, 0.022, d)
    ox = np.sign(x) * np.exp(-dxs / 0.008)
    oy = np.exp(-dyt / 0.008) - np.exp(-dyb / 0.008)
    wav = opts.get("wavy", 0.0014) * _fbm(x, y, 22.0, seed + 11, 2)
    bow_x = opts.get("bow", 0.0025) * (1.0 - (y / (D / 2)) ** 2)
    bow_y = opts.get("bow", 0.0025) * (1.0 - (x / (W / 2)) ** 2)
    x = x + ox * (wav + bow_x) * edge_w
    y = y + oy * (wav + bow_y) * edge_w
    # stacked layers show on the fold faces as soft steps (the folded-back panels / sleeves)
    side_w = 1.0 - _ss(0.0, r * 0.9, d)
    step_in = np.zeros(len(x))
    for k, zk in enumerate(opts.get("layers", (0.36, 0.66))):
        zz = zk * T + 0.0025 * T / 0.03 * _noise2(x, y, 30.0, seed + 40 + k)
        vary = np.clip(0.45 + 1.1 * _noise2(x, y, 14.0, seed + 60 + k), 0.0, 1.3)
        step_in += opts.get("layer_depth", 0.0011) * vary * np.exp(-((z - zz) / (0.045 * T + 0.0004)) ** 2)
    nrm = np.sqrt(ox * ox + oy * oy) + 1e-6
    x = x - ox / nrm * step_in * side_w
    y = y - oy / nrm * step_in * side_w
    z = z + dz
    return np.stack([x, y, np.maximum(z, 0.0)], axis=1)


def _body(name, W, D, T, mat, seed, opts, extra=None, parent=None, step=0.0021, levels=1):
    o = _slab(name, W, D, T, rc=opts.get("rc", 0.012), step=step, parent=parent, mat=mat)
    P = _get_co(o.data)
    P = _fold_deform(P, W, D, T, seed, opts)
    if extra:
        P = extra(P)
    _set_co(o.data, P)
    mod = o.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    return o


def _groove(P, T, pts, depth, width, bbox_margin=0.01):
    """Seam groove along a 2D polyline (stitching pulls the fabric in)."""
    pts = np.asarray(pts)
    x, y = P[:, 0], P[:, 1]
    sel = ((x > pts[:, 0].min() - bbox_margin) & (x < pts[:, 0].max() + bbox_margin) &
           (y > pts[:, 1].min() - bbox_margin) & (y < pts[:, 1].max() + bbox_margin) & (P[:, 2] > T * 0.5))
    if not sel.any():
        return P
    dist = _dist_polyline(x[sel], y[sel], pts)
    P[sel, 2] -= depth * np.exp(-(dist / width) ** 2)
    return P


# ============================================================== details
def _stitch_row(name, bvh, pts2d, mat, parent, pitch=0.0028, duty=0.8, radius=0.00026, lift=0.00008,
                closed=False):
    """A row of lock/coverstitch stitches: one swept thread tube pinched at every needle hole."""
    pts, nrms = _surface_path(bvh, pts2d, pitch / 7.0, closed)
    M = 6

    def prof(i, s):
        ph = (s / pitch) % 1.0
        f = math.sin(math.pi * ph / duty) ** 0.45 if ph < duty else 0.0
        rr = radius * max(f, 0.04)
        return [(rr * math.cos(TAU * k / M), lift + rr * 0.8 * math.sin(TAU * k / M) - radius * 0.25 * (1 - f))
                for k in range(M)]
    return _sweep(name, pts, nrms, prof, closed=closed, mat=mat, parent=parent)


def _cord(name, bvh, pts2d, mat, parent, radius=0.0029, aglet=True, seed=0):
    pts, nrms = _surface_path(bvh, pts2d, 0.0012, smooth_n=8)
    # lift onto the surface (cord centre sits a radius above it)
    M = 14
    rnd = random.Random(seed)

    def prof(i, s):
        squash = 0.92
        return [(radius * math.cos(TAU * k / M), radius * 0.97 + radius * squash * math.sin(TAU * k / M))
                for k in range(M)]
    o = _sweep(name, pts, nrms, prof, closed=False, mat=mat, parent=parent)
    if aglet:
        end, prev = pts[-1], pts[-6]
        t = (end - prev).normalized()
        n = nrms[-1]
        L = 0.021
        prof_a = [(0.0, 0.0), (0.0016, 0.0002), (0.0026, 0.0009), (0.0031, 0.0022), (0.00318, 0.004),
                  (0.00318, L - 0.0042), (0.0030, L - 0.0038), (0.0030, L - 0.0030), (0.00318, L - 0.0026),
                  (0.00318, L - 0.0006), (0.00300, L), (0.0026, L)]
        ag = lathe(name + "_aglet", prof_a, segments=40, mat=mat_aglet())
        zax = -t
        xax = n.cross(zax).normalized()
        yax = zax.cross(xax)
        rot = Matrix((xax, yax, zax)).transposed().to_4x4()
        tip = end + n * radius * 0.97 + t * (L - 0.004)
        ag.matrix_world = Matrix.Translation(tip) @ rot
        ag.parent = parent
        ag.matrix_parent_inverse = parent.matrix_world.inverted() if parent else Matrix()
    return o


def _text_mesh(body, font, width, extrude=0.0, bevel=0.0, name="txt", parent=None, mat=None):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.font = bpy.data.fonts.load(font, check_existing=True)
    cu.size = 0.02
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 2
    cu.resolution_u = 8
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = bpy.data.objects.new(name + "_curve", cu)
    bpy.context.scene.collection.objects.link(o)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    P = _get_co(me)
    span = P[:, 0].max() - P[:, 0].min()
    s = width / span
    P[:, :2] *= s
    P[:, 0] -= (P[:, 0].max() + P[:, 0].min()) / 2
    P[:, 1] -= (P[:, 1].max() + P[:, 1].min()) / 2
    P[:, 2] -= P[:, 2].min()
    _set_co(me, P)
    ob = bpy.data.objects.new(name, me)
    _link(ob, parent)
    if mat:
        me.materials.append(mat)
    return ob


def _conform(obj, bvh, offset=0.0, dx=0.0, dy=0.0):
    """Translate a flat mesh by (dx, dy) and drape it vertically onto a surface."""
    P = _get_co(obj.data)
    P[:, 0] += dx
    P[:, 1] += dy
    for i in range(len(P)):
        loc, n = _hit(bvh, P[i, 0], P[i, 1])
        if loc is not None:
            P[i, 2] = loc.z + P[i, 2] + offset
    _set_co(obj.data, P)
    return obj


def _empty(name):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.1
    bpy.context.scene.collection.objects.link(e)
    return e


def _cuff(name, parent, color, y_c, T_body, W, protrude=0.016, width=0.082, thick=0.0085, rot_deg=-6.0,
          side=1):
    """Rib cuff end peeking out from under a side fold (sleeve tucked behind): a flattened
    rib tube = two soft layers with the opening between them, ribs along the sleeve."""
    mat = mat_knit(color, kind="rib", rib_axis="OBJ_Y", rib_pitch=0.0013)
    L = 0.05
    layers = []
    for k, (tk, dl, dr, sd) in enumerate(((0.52, 0.0, 0.0, 3), (0.50, -0.0012, 1.6, 9))):
        t = thick * tk
        o = _slab(f"{name}{k}", L, width - 0.002 * k, t, rc=0.010, step=0.0011, parent=parent, mat=mat)
        P = _get_co(o.data)
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        top = _ss(0.3 * t, t, z)
        P[:, 2] += (0.0005 * _fbm(x, y, 70.0, sd, 2) + 0.0004 * np.cos(y / (width / 2) * 1.6)) * top
        P[:, 0] += 0.0012 * _fbm(x, y, 40.0, sd + 1, 1) * _ss(L / 2 - 0.01, L / 2, x)   # wavy cuff end
        P[:, 2] += k * (thick * 0.47)
        P[:, 0] += dl
        _set_co(o.data, P)
        a = math.radians(rot_deg + dr)
        M = Matrix.Translation((side * (W / 2 - L / 2 + protrude), y_c, 0.0)) @ Matrix.Rotation(a, 4, "Z")
        o.data.transform(M)
        mod = o.modifiers.new("Subsurf", "SUBSURF")
        mod.levels = 1
        mod.render_levels = 1
        layers.append(o)
    return layers[0]


# ============================================================== public builders
def folded_tee(color="White", long_sleeve=False, seed=None):
    """Retail-folded short- or long-sleeve tee, chest + screen print up. Returns Empty root."""
    seed = (_stable_seed(color) if seed is None else seed) + (500 if long_sleeve else 0)
    kind = "longsleeve" if long_sleeve else "tee"
    W, D, T = W_FOLD, D_FOLD, 0.030
    root = _empty(f"{kind}_{color}")
    # neckline (plan): HPS at the top fold, deep front U, shallow back
    xn, yh = 0.056, D / 2 - 0.004
    fd, bd = 0.074, 0.013
    band_w, band_h = 0.0155, 0.0032
    N = 80
    front = []
    for i in range(N + 1):
        u = -1.0 + 2.0 * i / N
        front.append((xn * u, yh - fd * (1.0 - abs(u) ** 2.3) ** (1 / 2.3)))
    back = []
    for i in range(1, N):
        u = 1.0 - 2.0 * i / N
        back.append((xn * u, yh - bd * math.sqrt(max(0.0, 1.0 - u * u))))
    loop = front + back                                                 # CCW, starts at left HPS

    def y_front(xx):
        u = np.clip(np.abs(xx) / xn, 0, 1)
        return yh - fd * (1.0 - u ** 2.3) ** (1 / 2.3)

    def y_back(xx):
        u = np.clip(np.abs(xx) / xn, 0, 1)
        return yh - bd * np.sqrt(1.0 - u * u)

    pw = 0.108 if not long_sleeve else 0.098
    print_cy = yh - fd - 0.052
    img_aspect = 1.0
    _ensure_textures()
    im = _image(TEX_PRINT)
    img_aspect = im.size[1] / im.size[0]
    print_rect = (0.0, print_cy, pw, pw * img_aspect)
    body_mat = mat_knit(color, name=f"apparel_jersey_{color}_{kind}", kind="jersey", ink=INK.get(color),
                        print_rect=print_rect)

    def extra(P):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        top = _ss(0.5 * T, 0.95 * T, z)
        # shoulders slope away from the neck a touch
        P[:, 1] -= 0.004 * (x / (W / 2)) ** 2 * _ss(D / 2 - 0.06, D / 2, y)
        # neck opening: look through to the back panel (a shallow recess)
        inside_v = np.minimum(y - y_front(x), y_back(x) - y)
        inside_h = (xn - np.abs(x))
        ins = _ss(-0.001, 0.004, np.minimum(inside_v, inside_h))
        P[:, 2] -= 0.0042 * ins * top
        # fabric rises slightly into the collar seam
        dist_front = np.abs(y - y_front(x)) + np.maximum(0, np.abs(x) - xn)
        P[:, 2] += 0.0006 * np.exp(-((dist_front - band_w - 0.004) / 0.004) ** 2) * top * (y < yh)
        # twin-needle grooves just outside the collar band
        for off in (band_w + 0.0024, band_w + 0.0056):
            pts = [(px, py - off * (1.0 - 0.0 * abs(px) / xn)) for (px, py) in front]
            pts = [(px * (1 + off / xn), py) for (px, py) in pts]
            P = _groove(P, T, pts, 0.00045, 0.0009)
        # back neck tape stitch lines
        for off in (0.0, 0.009):
            pts = [(px * 0.97, yh - bd - 0.0012 - off + bd * (1 - math.sqrt(max(0, 1 - (px / xn) ** 2)))) for (px, _) in back]
            P = _groove(P, T, pts, 0.0002, 0.0007)
        return P

    rs = random.Random(seed + 3)
    creases = []
    for sgn in (-1, 1):   # sleeves folded behind show through as soft diagonal ridges
        x0, y0 = sgn * rs.uniform(0.072, 0.085), rs.uniform(0.04, 0.075)
        ang = math.atan2(-rs.uniform(0.5, 0.9), -sgn * 1.0)
        creases.append((x0, y0, ang, rs.uniform(0.06, 0.09), rs.uniform(0.006, 0.009), 0.0011, ))
    for k in range(2):    # a couple of long soft ripples across the chest
        creases.append((rs.uniform(-0.09, -0.05), rs.uniform(-0.09, 0.0), rs.uniform(-0.25, 0.35),
                        rs.uniform(0.09, 0.15), rs.uniform(0.006, 0.01), rs.uniform(0.0008, 0.0013)))
    opts = dict(droop=0.20, side_ridge=0.07, waist_puff=0.06, undulate=0.0042, ripple=0.0005, creases=creases,
                wrinkle=0.0024, wavy=0.0024, bow=0.0024, rc=0.004, layer_depth=0.0013)
    body = _body(f"{kind}_{color}_body", W, D, T, body_mat, seed, opts, extra, parent=root)
    bvh = _bvh(body)

    # --- collar rib band (one closed ring: front outside-face up, back inside-face up)
    rib_mat = mat_knit(color, kind="rib", rib_axis="UV_X", rib_pitch=0.0016)
    # offset the loop outward by half the band, sweep a soft rounded strip
    ring_pts = _resample(loop, 0.0012, closed=True)
    n2 = len(ring_pts)
    center2d = []
    for i in range(n2):
        t = (ring_pts[(i + 1) % n2] - ring_pts[i - 1]).normalized()
        out = Vector((t.y, -t.x))
        center2d.append(ring_pts[i] + out * (band_w * 0.5))
    pts, nrms = _surface_path(bvh, center2d, 0.0012, closed=True, smooth_n=6)
    M = 22

    def band_prof(i, s):
        hw, hh = band_w * 0.5, band_h * 0.5
        out = []
        for k in range(M):
            th = TAU * k / M
            c, sn = math.cos(th), math.sin(th)
            e = 2.6
            bx = hw * math.copysign(abs(c) ** (2 / e), c)
            bz = hh * math.copysign(abs(sn) ** (2 / e), sn)
            # inner edge (b<0) is the rolled fold: fuller; outer edge tucks into the seam
            if bx > 0:
                bz *= 1.0 - 0.55 * (bx / hw) ** 3
            out.append((bx, bz + hh * 0.55))
        return out
    _sweep(f"{kind}_{color}_collar", pts, nrms, band_prof, closed=True, mat=rib_mat, parent=root)

    # --- coverstitch: twin needle around the front neck, single rows on the back-neck tape
    th_mat = mat_thread(color)
    for j, off in enumerate((band_w + 0.0024, band_w + 0.0056)):
        pts2 = [(px * (1 + off / xn), py - off) for (px, py) in front]
        _stitch_row(f"{kind}_{color}_cs{j}", bvh, pts2, th_mat, root)
    for j, off in enumerate((0.0, 0.009)):
        pts2 = [(px * 0.97, yh - bd - 0.0012 - off + bd * (1 - math.sqrt(max(0, 1 - (px / xn) ** 2))))
                for (px, _) in back]
        _stitch_row(f"{kind}_{color}_tape{j}", bvh, pts2, th_mat, root, pitch=0.0024, radius=0.0002)
    # shoulder seams (on the top fold, from the HPS outwards)
    for sgn in (-1, 1):
        pts2 = [(sgn * (xn + 0.004 + t * (W / 2 - xn - 0.012)), yh - 0.0035 - 0.0045 * t * t) for t in np.linspace(0, 1, 12)]
        _stitch_row(f"{kind}_{color}_sh{sgn}", bvh, pts2, th_mat, root, pitch=0.0026, radius=0.00022)

    # --- woven neck label, stitched under the back collar
    lw, lh = 0.030, 0.0155
    ly = yh - bd - 0.0016 - lh / 2
    lab_ground = "#EFEBE3" if color == "Black" else "#0B0B0F"
    lab_text = "#0B0B0F" if color == "Black" else "#EFEBE3"
    lab_mat = mat_label(lab_ground, lab_text, rect=(0.0, ly, lw, lh))
    lab = _slab(f"{kind}_{color}_label", lw, lh, 0.0005, rc=0.0008, step=0.0006, parent=root, mat=lab_mat)
    P = _get_co(lab.data)
    P[:, 1] += ly
    P[:, 2] += 0.0004 * np.exp(-((P[:, 1] - ly + lh / 2) / 0.004) ** 2)   # curls up a hair at the free end
    _set_co(lab.data, P)
    _conform(lab, bvh, offset=0.00005)

    if long_sleeve:
        _cuff(f"{kind}_{color}_cuff", root, color, y_c=-D / 2 + 0.072, T_body=T, W=W, protrude=0.011,
              width=0.074, thick=0.0085, rot_deg=-5.0)
    return root


def folded_hoodie(color="Black", seed=None):
    """Retail-folded pullover hoodie: hood folded forward over the top, drawcords + aglets on
    the chest, embroidered logo, rib cuff peeking out. Returns Empty root."""
    seed = _stable_seed(color) + 7 if seed is None else seed
    W, D, T = W_FOLD, D_FOLD, 0.046
    root = _empty(f"hoodie_{color}")
    body_mat = mat_knit(color, name=f"apparel_terry_{color}", kind="jersey", bump=0.55)
    opts = dict(droop=0.20, droop_len=0.04, side_ridge=0.05, waist_puff=0.06, undulate=0.0016,
                ripple=0.0003, wrinkle=0.0028, ufreq=7.0, wavy=0.0030, bow=0.003, rc=0.006, layer_depth=0.0012,
                layers=(0.38, 0.7))
    logo_w, logo_cy = 0.084, -0.022

    def extra(P):
        x, y = P[:, 0], P[:, 1]
        top = _ss(0.5 * T, 0.95 * T, P[:, 2])
        # embroidery pulls the fabric in a little (pucker)
        P[:, 2] -= 0.0005 * np.exp(-((x / 0.05) ** 2 + ((y - logo_cy) / 0.014) ** 2) ** 2) * top
        return P
    body = _body(f"hoodie_{color}_body", W, D, T, body_mat, seed, opts, extra, parent=root, step=0.0022)
    bvh = _bvh(body)

    # --- drawcords on the chest (emerge from under the hood edge)
    cord_mat = mat_cord(color)
    rnd = random.Random(seed)
    cords = []
    for sgn in (-1, 1):
        j = rnd.uniform(-0.004, 0.004)
        path = [(sgn * 0.020, 0.085), (sgn * 0.021, 0.060), (sgn * 0.026, 0.035),
                (sgn * (0.040 + j), 0.008), (sgn * (0.052 + j), -0.020), (sgn * (0.056 + j * 1.5), -0.048),
                (sgn * (0.055 + j), -0.066 + j * 2)]
        path = [Vector(p) for p in path]
        # smooth through a Catmull-Rom spline
        sm = []
        for i in range(len(path) - 1):
            p0, p1, p2, p3 = path[max(i - 1, 0)], path[i], path[i + 1], path[min(i + 2, len(path) - 1)]
            for k in range(8):
                t = k / 8
                sm.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                                 (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
        sm.append(path[-1])
        cords.append(_cord(f"hoodie_{color}_cord{sgn}", bvh, sm, cord_mat, root, seed=seed + sgn))

    # --- hood, folded forward over the top of the chest
    Wh, Dh, Th = W - 0.012, 0.098, 0.0095
    hood = _slab(f"hoodie_{color}_hood", Wh, Dh, Th, rc=0.03, step=0.0018, parent=root, mat=body_mat)
    P = _get_co(hood.data)
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    top = _ss(0.4 * Th, 0.97 * Th, z)
    near = _ss(0.0, -Dh / 2, y)                                       # 1 at the crown (near) edge
    # the crown fold is thinner than where the hood joins the neck
    P[:, 2] *= 1.0 - 0.35 * near
    # crown edge bows toward the viewer, two lobes with a dip at the centre seam
    P[:, 1] -= (0.012 * (1 - (x / (Wh / 2)) ** 2) - 0.004 * np.exp(-(x / 0.012) ** 2)) * near
    lobes = np.exp(-((np.abs(x) - 0.048) / 0.04) ** 2)
    P[:, 2] += (0.0012 * lobes - 0.0012 * np.exp(-(x / 0.0055) ** 2)) * top
    P[:, 2] += 0.0007 * _fbm(x, y, 12.0, seed + 3, 2) * top
    rh = random.Random(seed + 99)
    for kk in range(5):
        sgn = rh.choice((-1, 1))
        P[:, 2] += _crease(x, y, sgn * rh.uniform(0.02, 0.08), -Dh / 2 + rh.uniform(0.0, 0.01),
                           math.pi / 2 + sgn * rh.uniform(0.1, 0.5), rh.uniform(0.02, 0.05),
                           rh.uniform(0.002, 0.004), rh.uniform(0.0006, 0.0013)) * top
    P[:, 1] += D / 2 - Dh / 2 + 0.010                                 # wraps over the top fold
    _set_co(hood.data, P)
    hm = hood.modifiers.new("Subsurf", "SUBSURF")
    hm.levels = 1
    hm.render_levels = 1
    # lay the hood onto the body + cords (soft envelope), then the seam on top of it
    bpy.context.view_layer.update()
    _drape_local(hood, [body] + cords, sag=30.0, res=0.0016)
    hbvh = _bvh(hood)
    th_mat = mat_thread(color)
    hood_near = D / 2 - Dh + 0.010 + 0.004
    for j, off in enumerate((-0.0032, 0.0032)):
        pts2 = [(off, D / 2 + 0.004 - t * (D / 2 + 0.004 - hood_near - 0.003)) for t in np.linspace(0, 1, 30)]
        _stitch_row(f"hoodie_{color}_hs{j}", hbvh, pts2, th_mat, root, pitch=0.003, radius=0.00027)

    # --- embroidered logo: raised satin stitch
    emb = _text_mesh("your logo", FONT_DISPLAY, logo_w, extrude=0.00028, bevel=0.00032,
                     name=f"hoodie_{color}_logo", parent=root, mat=mat_thread("#2B3BFF", name="apparel_satin_cobalt", satin=True))
    _conform(emb, bvh, offset=-0.00012, dy=logo_cy)
    smooth(emb)

    # --- rib cuff peeking out from under the right fold
    _cuff(f"hoodie_{color}_cuff", root, color, y_c=-D / 2 + 0.075, T_body=T, W=W, protrude=0.008,
          width=0.080, thick=0.015, rot_deg=-6.0)
    return root


# ============================================================== stacking / draping
def _mesh_children(root):
    out = []
    for c in root.children_recursive:
        if c.type == "MESH":
            out.append(c)
    return out


def _height_grid(supports, xs, ys, z0=2.0):
    """Max surface height of support meshes (world space) on a grid; floor = 0."""
    dg = bpy.context.evaluated_depsgraph_get()
    trees = []
    for s in supports:
        se = s.evaluated_get(dg)
        me = se.to_mesh()
        mw = s.matrix_world
        co = np.empty(len(me.vertices) * 3, dtype=np.float32)
        me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        M = np.array(mw)
        cw = co @ M[:3, :3].T + M[:3, 3]
        polys = [tuple(p.vertices) for p in me.polygons]
        bb = (cw[:, 0].min(), cw[:, 0].max(), cw[:, 1].min(), cw[:, 1].max())
        trees.append((BVHTree.FromPolygons([Vector(v) for v in cw], polys), bb))
        se.to_mesh_clear()
    S = np.zeros((len(ys), len(xs)))
    down = Vector((0, 0, -1))
    for (tree, bb) in trees:
        ix = np.where((xs >= bb[0]) & (xs <= bb[1]))[0]
        iy = np.where((ys >= bb[2]) & (ys <= bb[3]))[0]
        for j in iy:
            for i in ix:
                loc = tree.ray_cast(Vector((xs[i], ys[j], z0)), down)[0]
                if loc is not None and loc.z > S[j, i]:
                    S[j, i] = loc.z
    return S


def _blur(A):
    k = np.array([1, 4, 6, 4, 1], dtype=np.float64) / 16.0
    B = np.pad(A, 2, mode="edge")
    B = sum(k[i] * B[:, i:i + A.shape[1]] for i in range(5))
    B = sum(k[i] * B[i:i + A.shape[0], :] for i in range(5))
    return B


def _dilate1d(A, k, res):
    """Parabolic grey-scale dilation along axis 1: out[i] = max_j A[j] - k*((i-j)*res)^2."""
    n = A.shape[1]
    idx = np.arange(n)
    pen = k * ((idx[:, None] - idx[None, :]) * res) ** 2          # (i, j)
    out = np.empty_like(A)
    for r in range(A.shape[0]):
        out[r] = (A[r][None, :] - pen).max(1)
    return out


def _envelope(S, sag, res, soften=10):
    """Stiff-but-soft cloth resting on S: rides over small dips, sags ~ sag*L^2 over an
    overhang of length L (sag in 1/m), then a light blur so creases soften."""
    E = _dilate1d(S, sag, res)
    E = _dilate1d(E.T, sag, res).T
    for _ in range(soften):
        E = _blur(E)
    for _ in range(4):
        E = np.maximum(S, _blur(np.maximum(S, E)))
    return E


def _offset_meshes(meshes, xs, ys, E, base):
    for o in meshes:
        me = o.data
        P = _get_co(me)
        M = np.array(o.matrix_world)
        Pw = P @ M[:3, :3].T + M[:3, 3]
        fx = np.clip((Pw[:, 0] - xs[0]) / (xs[1] - xs[0]), 0, len(xs) - 1.001)
        fy = np.clip((Pw[:, 1] - ys[0]) / (ys[1] - ys[0]), 0, len(ys) - 1.001)
        i0, j0 = fx.astype(int), fy.astype(int)
        tx, ty = fx - i0, fy - j0
        h = (E[j0, i0] * (1 - tx) * (1 - ty) + E[j0, i0 + 1] * tx * (1 - ty) +
             E[j0 + 1, i0] * (1 - tx) * ty + E[j0 + 1, i0 + 1] * tx * ty)
        dz = h - base
        Minv = np.linalg.inv(M[:3, :3])
        P += (np.stack([np.zeros_like(dz), np.zeros_like(dz), dz], 1) @ Minv.T)
        _set_co(me, P)


def _grid_for(meshes, res, margin=0.02):
    lo = np.array([1e9, 1e9])
    hi = -lo
    for o in meshes:
        M = np.array(o.matrix_world)
        P = _get_co(o.data) @ M[:3, :3].T + M[:3, 3]
        lo = np.minimum(lo, P[:, :2].min(0))
        hi = np.maximum(hi, P[:, :2].max(0))
    xs = np.arange(lo[0] - margin, hi[0] + margin, res)
    ys = np.arange(lo[1] - margin, hi[1] + margin, res)
    return xs, ys


def _drape_local(obj, supports, sag=30.0, res=0.0016):
    xs, ys = _grid_for([obj], res, 0.01)
    S = _height_grid(supports, xs, ys)
    E = _envelope(S, sag, res)
    _offset_meshes([obj], xs, ys, E + 0.0001, 0.0)


def drape(root, supports, sag=5.0, res=0.002):
    """Rest garment `root` (already placed in XY / rotated about Z, bottom at z=0) on top of
    the `supports` meshes: follows their surface, bridges small dips and sags softly where
    it overhangs an edge."""
    bpy.context.view_layer.update()
    meshes = _mesh_children(root)
    xs, ys = _grid_for(meshes, res, 0.03)
    S = _height_grid(supports, xs, ys)
    E = _envelope(S, sag, res)
    _offset_meshes(meshes, xs, ys, E + 0.0002, 0.0)


def stack(roots, placements, sag=5.0):
    """roots bottom->top, placements [(x, y, rot_z_deg), ...]. Each garment is draped onto
    everything below it."""
    supports = []
    for root, (x, y, rz) in zip(roots, placements):
        root.location = (x, y, 0.0)
        root.rotation_euler = (0.0, 0.0, math.radians(rz))
        bpy.context.view_layer.update()
        if supports:
            drape(root, supports, sag=sag)
        supports += [m for m in _mesh_children(root) if "_body" in m.name or "_hood" in m.name
                     or "_cord" in m.name]
    bpy.context.view_layer.update()
    return roots


def frame_camera(objs, az_deg=28.0, el_deg=34.0, lens=85.0, pad=0.08, fstop=None, aspect=1.0):
    """Product 3/4 camera that frames the given mesh objects with `pad` margin."""
    from bpy_extras.object_utils import world_to_camera_view
    from common import camera
    pts = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        M = o.matrix_world
        for v in list(o.data.vertices)[::7]:
            pts.append(M @ v.co)
    c = sum(pts, Vector()) / len(pts)
    az, el = math.radians(az_deg), math.radians(el_deg)
    dirv = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    dist = 1.0
    cam = camera(loc=c + dirv * dist, target=c, lens=lens)
    scene = bpy.context.scene
    for it in range(12):
        cam.location = c + dirv * dist
        from common import look_at
        look_at(cam, c)
        bpy.context.view_layer.update()
        uv = [world_to_camera_view(scene, cam, p) for p in pts]
        us = [q.x for q in uv]
        vs = [q.y for q in uv]
        umin, umax, vmin, vmax = min(us), max(us), min(vs), max(vs)
        ext = max(umax - umin, vmax - vmin)
        # recentre
        du, dv = (umin + umax) / 2 - 0.5, (vmin + vmax) / 2 - 0.5
        right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0))
        up = cam.matrix_world.to_3x3() @ Vector((0, 1, 0))
        width_world = 2 * dist * math.tan(math.atan(18.0 / lens))
        c = c + right * du * width_world + up * dv * width_world
        dist *= ext / (1.0 - 2 * pad)
    cam.location = c + dirv * dist
    from common import look_at
    look_at(cam, c)
    if fstop:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = dist
        cam.data.dof.aperture_fstop = fstop
    return cam
