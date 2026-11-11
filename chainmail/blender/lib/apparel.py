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
# Linear albedo that DISPLAYS as cobalt #2B3BFF under the house AgX (Medium High Contrast) at the
# exposure that puts White cotton at ~240 sRGB. A full-strength (0.024, 0.044, 1.0) ink is lit as
# brightly as the shirt and AgX rolls it off to periwinkle (#8DA2F3), so the pigment is deepened.
COBALT_INK = (0.0085, 0.0012, 0.16)
TEX_DIR = os.path.join(ASSETS, "textures")
TEX_PRINT = os.path.join(TEX_DIR, "apparel_logo_mask.png")
TEX_LABEL = os.path.join(TEX_DIR, "apparel_label_mask.png")
TEX_DIR_EMB = os.path.join(TEX_DIR, "apparel_logo_dir.png")

W_FOLD, D_FOLD = 0.20, 0.27


# ============================================================== small utils
# Render albedo per catalog colour, solved through the house view transform (AgX, Medium High
# Contrast) so that a key-lit top face DISPLAYS as the catalog swatch when White cotton sits at
# ~240 sRGB (EXPOSURE_*). AgX rolls bright warm tones off toward neutral, so Dust/Cement need a
# deeper, more chromatic albedo than their swatch hex to read as Dust/Cement on screen.
RENDER_ALBEDO = {"Black": "#151515", "White": "#F7F7F4", "Dust": "#C4B892", "Cement": "#958E80",
                 "Natural": "#CDBF9C"}


def _hex(color):
    return RENDER_ALBEDO.get(color, SWATCH.get(color, color))


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

# satin-stitch direction field for the embroidered logo: stitches run ACROSS each stroke, i.e.
# along the gradient of the blurred letter mask. Stored double-angle encoded (R,G = 0.5+0.5*cos/sin 2a)
# so opposite directions agree; B = blurred mask (edge proximity).
_DIR_SCRIPT = r'''
import sys
import numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1:3]
m = Image.open(src).convert("L")
W0, H0 = m.size
k = 1000.0 / W0
m = m.resize((1000, max(8, int(H0 * k))), Image.LANCZOS)
b = np.asarray(m.filter(ImageFilter.GaussianBlur(9)), dtype=np.float64) / 255.0
gy, gx = np.gradient(b)
a2 = 2 * np.arctan2(gy, gx)
mag = np.hypot(gx, gy)
c2, s2 = np.cos(a2) * mag, np.sin(a2) * mag
def blur(A, r):
    im = Image.fromarray(((A + 1) * 127.5).clip(0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float64) / 127.5 - 1
c2b, s2b = blur(c2 / (mag.max() + 1e-9), 6), blur(s2 / (mag.max() + 1e-9), 6)
n = np.hypot(c2b, s2b) + 1e-9
R = (0.5 + 0.5 * c2b / n) * 255
G = (0.5 + 0.5 * s2b / n) * 255
B = np.asarray(m.filter(ImageFilter.GaussianBlur(2)), dtype=np.float64)
Image.fromarray(np.stack([R, G, B], -1).clip(0, 255).astype(np.uint8)).save(out)
'''


def _ensure_textures():
    env = {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
    if not (os.path.exists(TEX_PRINT) and os.path.exists(TEX_LABEL)):
        os.makedirs(TEX_DIR, exist_ok=True)
        subprocess.run(["python3", "-c", _TEX_SCRIPT, FONT_DISPLAY, FONT_MONO, TEX_PRINT, TEX_LABEL],
                       check=True, env=env)
    if not os.path.exists(TEX_DIR_EMB):
        subprocess.run(["python3", "-c", _DIR_SCRIPT, TEX_PRINT, TEX_DIR_EMB], check=True, env=env)


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
    """Cotton knit. kind: 'jersey' (tee face), 'fleece' (heavyweight French terry / brushed
    hoodie face: matte, fuzzy, light-absorbing) or 'rib' (1x1 rib; rib_axis picks which
    coordinate runs ACROSS the wales: OBJ_X / OBJ_Y / UV_X / UV_Y, UVs in metres).
    Optional screen print: print_rect=(cx, cy, w, h) in object space (top projection), ink=hex."""
    hexc = _hex(color)
    name = name or f"apparel_{kind}_{color}" + ("_print" if print_rect else "") + (f"_{rib_axis}_{rib_pitch}" if kind == "rib" else "")
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(obj, sep.inputs[0])
    x, y, z = sep.outputs[0], sep.outputs[1], sep.outputs[2]
    base = rgb(hexc)
    dark = sum(base[:3]) / 3 < 0.05
    if kind == "rib":
        if rib_axis in ("UV_X", "UV_Y"):
            uv = nb.new("ShaderNodeSeparateXYZ")
            nb.link(tc.outputs["UV"], uv.inputs[0])
            across = uv.outputs[0] if rib_axis == "UV_X" else uv.outputs[1]
        elif rib_axis == "OBJ_X":
            across = x
        else:
            across = y
        H = _rib(nb, across, rib_pitch)
    elif kind == "fleece":
        H = _jersey(nb, x, y, w=0.00135, h=0.00112)        # French-terry face, heavier gauge
    else:
        H = _jersey(nb, x, y)
    yarn = nb.noise(obj, 2600.0, 3.0, 0.6)
    mott = nb.noise(obj, 140.0, 6.0, 0.55)
    # albedo: swatch colour on average; slight heather mottling + micro-occlusion in the knit valleys
    heather = 0.5 if color == "Cement" else (0.35 if dark else 0.22)
    var = 0.10 if dark else 0.035
    lo = tuple(c * (1.0 - var) for c in base[:3]) + (1,)
    hi = tuple(min(1.0, c * (1.0 + var)) for c in base[:3]) + (1,)
    f_mott = nb.m("MULTIPLY_ADD", nb.m("SUBTRACT", mott, 0.5), heather * 2.0, 0.5, clamp=True)
    col = nb.mix(f_mott, lo, hi)
    k_occ = 0.16 if kind == "rib" else (0.10 if kind == "fleece" else 0.07)
    if dark:
        k_occ *= 1.6
    occl = nb.m("MULTIPLY_ADD", nb.m("SUBTRACT", H, 0.6), k_occ, 1.0)
    yv = 0.35 if color == "Cement" else (0.4 if dark else 0.12)
    yarn_c = nb.m("MULTIPLY_ADD", nb.m("SUBTRACT", yarn, 0.5), yv, 1.0)
    shade = nb.m("MULTIPLY", occl, yarn_c)
    gray = nb.new("ShaderNodeCombineXYZ")
    for i in range(3):
        nb.link(shade, gray.inputs[i])
    col = nb.mix(1.0, col, gray.outputs[0], blend="MULTIPLY")
    if kind == "fleece":
        rough = nb.m("MULTIPLY_ADD", yarn, 0.04, 0.88)
        # dark fleece: sheen kept low and greyed so lit faces stay charcoal (25-50 sRGB), not satin
        sheen_w, spec_level, sheen_r = (0.07, 0.07, 0.6) if dark else (0.5, 0.2, 0.6)
        height = nb.m("ADD", nb.m("MULTIPLY", H, 0.8), nb.m("MULTIPLY", yarn, 0.3))
        bump_s, bump_d = (0.22 if dark else 0.28), 0.00028
    else:
        rough = nb.m("MULTIPLY_ADD", yarn, 0.08, 0.86)
        sheen_w = 0.08 if dark else 0.3
        spec_level = 0.04 if dark else 0.12
        sheen_r = 0.6
        height = nb.m("ADD", nb.m("MULTIPLY", H, 0.75), nb.m("MULTIPLY", yarn, 0.35))
        bump_s = bump if kind != "rib" else bump * 1.6
        bump_d = 0.00028 if kind != "rib" else 0.0006
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
        mask = nb.m("ADD", tex.outputs["Color"], 0.0)
        # plastisol: flat, opaque; a few sparse hairline cracks (<0.15 mm) let ~30 % of the shirt through
        vor = nb.new("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
        vor.inputs["Scale"].default_value = 110.0
        vor.inputs["Randomness"].default_value = 1.0
        nb.link(obj, vor.inputs["Vector"])
        crack = nb.m("SUBTRACT", 1.0, nb.m("MINIMUM", nb.m("DIVIDE", vor.outputs["Distance"], 0.011), 1.0))
        sparse = nb.m("GREATER_THAN", nb.noise(obj, 55.0, 2.0, 0.5), 0.66)
        crack = nb.m("MULTIPLY", crack, sparse)
        im = nb.m("MULTIPLY", mask, nb.m("SUBTRACT", 1.0, nb.m("MULTIPLY", crack, 0.3)), clamp=True)
        ink_c = tuple(ink) if isinstance(ink, (tuple, list)) else (COBALT_INK if ink in (None, "#2B3BFF") else rgb(ink))
        ink_c = (ink_c[0], ink_c[1], ink_c[2], 1.0)
        col = nb.mix(im, col, ink_c)
        rough = nb.mix(im, rough, 0.5, kind="FLOAT")
        sw = nb.mix(im, sheen_w, 0.03, kind="FLOAT")
        nb.link(sw, b.inputs["Sheen Weight"])
        spec = nb.mix(im, spec_level, 0.16, kind="FLOAT")
        nb.link(spec, b.inputs["Specular IOR Level"])
        # knit telegraphs through the ink as a faint bump only; the ink film itself has a soft edge
        height = nb.m("ADD", nb.m("MULTIPLY", height, nb.m("MULTIPLY_ADD", mask, -0.85, 1.0)),
                      nb.m("MULTIPLY", mask, 0.30))
        height = nb.m("SUBTRACT", height, nb.m("MULTIPLY", nb.m("MULTIPLY", crack, mask), 0.25))
    else:
        b.inputs["Sheen Weight"].default_value = sheen_w
        b.inputs["Specular IOR Level"].default_value = spec_level
    nb.link(col, b.inputs["Base Color"])
    nb.link(rough, b.inputs["Roughness"])
    b.inputs["Sheen Roughness"].default_value = sheen_r
    b.inputs["Sheen Tint"].default_value = (0.45, 0.45, 0.45, 1) if (dark and kind == "fleece") else (1, 1, 1, 1)
    b.inputs["Coat Weight"].default_value = 0.0
    nrm = nb.bump(height, bump_s, bump_d)
    if kind == "fleece":
        # brushed loop-back fuzz: very fine, very shallow
        fuzz = nb.noise(obj, 4200.0, 3.0, 0.7)
        nrm = nb.bump(fuzz, 0.4, 0.0002, normal=nrm)
    else:
        fuzz = nb.noise(obj, 9000.0, 2.0, 0.5)
        nrm = nb.bump(fuzz, 0.12, 0.0001, normal=nrm)
    nb.link(nrm, b.inputs["Normal"])
    return m


def mat_satin(dir_rect, color=None, name="apparel_satin_cobalt"):
    """Embroidery satin stitch in polyester thread. Stitch direction varies per stroke (runs
    across each letter stroke) from the direction-field texture; dir_rect=(cx, cy, w, h) maps
    object XY to the texture. Thread ridges at ~0.42 mm pitch, slight gaps between threads,
    anisotropic sheen along the thread."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    _ensure_textures()
    m, nt, b = _new_mat(name)
    nb = _NB(nt)
    tc = nb.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]
    sep = nb.new("ShaderNodeSeparateXYZ")
    nb.link(obj, sep.inputs[0])
    x, y = sep.outputs[0], sep.outputs[1]
    cx, cy, w, h = dir_rect
    vm = nb.new("ShaderNodeVectorMath", operation="SUBTRACT")
    nb.link(obj, vm.inputs[0])
    vm.inputs[1].default_value = (cx - w / 2, cy - h / 2, 0)
    vd = nb.new("ShaderNodeVectorMath", operation="DIVIDE")
    nb.link(vm.outputs[0], vd.inputs[0])
    vd.inputs[1].default_value = (w, h, 1)
    tex = nb.new("ShaderNodeTexImage")
    tex.image = _image(TEX_DIR_EMB)
    tex.extension = "EXTEND"
    tex.interpolation = "Linear"
    nb.link(vd.outputs[0], tex.inputs[0])
    rgbs = nb.new("ShaderNodeSeparateColor")
    nb.link(tex.outputs["Color"], rgbs.inputs[0])
    c2 = nb.m("MULTIPLY_ADD", rgbs.outputs[0], 2.0, -1.0)
    s2 = nb.m("MULTIPLY_ADD", rgbs.outputs[1], 2.0, -1.0)
    th = nb.m("MULTIPLY", nb.m("ARCTAN2", s2, c2), 0.5)
    ct, st = nb.m("COSINE", th), nb.m("SINE", th)
    # coordinate across the threads (perpendicular to the stitch direction)
    n_ = nb.m("SUBTRACT", nb.m("MULTIPLY", y, ct), nb.m("MULTIPLY", x, st))
    along = nb.m("ADD", nb.m("MULTIPLY", x, ct), nb.m("MULTIPLY", y, st))
    p = 0.00042
    jit = nb.m("MULTIPLY", nb.noise(obj, 900.0, 1.0), 0.00018)
    ph = nb.m("DIVIDE", nb.m("ADD", n_, jit), p)
    stripe = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", ph, math.pi))), 0.5)
    # each thread bulges in the middle of its span and dives at the stroke edge
    span = nb.m("MULTIPLY_ADD", nb.m("COSINE", nb.m("MULTIPLY", along, math.pi / 0.0032)), 0.12, 0.88)
    gaps = nb.m("MULTIPLY", nb.m("GREATER_THAN", nb.noise(obj, 1400.0, 1.0), 0.80), 0.5)
    h_ = nb.m("MULTIPLY", stripe, span)
    h_ = nb.m("SUBTRACT", h_, nb.m("MULTIPLY", gaps, nb.m("SUBTRACT", 1.0, stripe)))
    base = (0.009, 0.0022, 0.15) if color is None else rgb(color)[:3]
    hi = tuple(base) + (1,)
    lo = tuple(c * 0.55 for c in base) + (1,)
    col = nb.mix(nb.m("MULTIPLY", stripe, nb.m("SUBTRACT", 1.0, nb.m("MULTIPLY", gaps, 0.6))), lo, hi)
    nb.link(col, b.inputs["Base Color"])
    nb.link(nb.m("MULTIPLY_ADD", stripe, -0.10, 0.40), b.inputs["Roughness"])
    b.inputs["Specular IOR Level"].default_value = 0.32
    b.inputs["Anisotropic"].default_value = 0.65
    tang = nb.new("ShaderNodeCombineXYZ")
    nb.link(ct, tang.inputs[0])
    nb.link(st, tang.inputs[1])
    nb.link(tang.outputs[0], b.inputs["Tangent"])
    b.inputs["Sheen Weight"].default_value = 0.25
    b.inputs["Sheen Roughness"].default_value = 0.3
    nb.link(nb.bump(h_, 0.6, 0.00018), b.inputs["Normal"])
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
    hi = tuple(min(1.0, cc * (1.0 if not dark else 1.6)) for cc in base[:3]) + (1,)
    nb.link(nb.mix(h, lo, hi), b.inputs["Base Color"])
    nb.link(nb.m("MULTIPLY_ADD", fine, 0.1, 0.72), b.inputs["Roughness"])
    b.inputs["Sheen Weight"].default_value = 0.12 if dark else 0.4
    b.inputs["Sheen Roughness"].default_value = 0.5
    b.inputs["Specular IOR Level"].default_value = 0.15 if dark else 0.3
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
    # damask weave: fine warp/weft grid (~0.2 mm); the text yarns float the other way
    weft = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", sep.outputs[1], math.pi / 0.00020))), 0.6)
    warp = nb.m("POWER", nb.m("ABSOLUTE", nb.m("SINE", nb.m("MULTIPLY", sep.outputs[0], math.pi / 0.00024))), 0.6)
    grid = nb.m("MULTIPLY", weft, nb.m("MULTIPLY_ADD", warp, 0.5, 0.5))
    weave = nb.mix(mask, grid, warp, kind="FLOAT")
    g, t = rgb(ground), rgb(text)
    col = nb.mix(mask, g, t)
    shade = nb.m("MULTIPLY_ADD", weave, 0.18, 0.82)
    gray = nb.new("ShaderNodeCombineXYZ")
    for i in range(3):
        nb.link(shade, gray.inputs[i])
    col = nb.mix(1.0, col, gray.outputs[0], blend="MULTIPLY")
    nb.link(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.72
    b.inputs["Sheen Weight"].default_value = 0.12
    b.inputs["Sheen Roughness"].default_value = 0.5
    b.inputs["Specular IOR Level"].default_value = 0.25
    nb.link(nb.bump(nb.m("ADD", weave, nb.m("MULTIPLY", mask, 0.5)), 0.9, 0.00012), b.inputs["Normal"])
    return m


# ============================================================== geometry: the folded body
def _slab(name, W, D, T, rc=0.012, step=0.002, parent=None, mat=None, sq=2.0, rh=None):
    """Soft 'capsule slab': flat top/bottom, rounded (folded) edges, rounded corners (rc) in plan.
    The edge cross-section is a superellipse of exponent `sq` (2 = semicircle; 3-4 = a folded
    stack: near-vertical face with the curvature concentrated at top and bottom) with vertical
    radius T/2 and horizontal reach `rh` (default T/2). Base centre at origin, z in [0, T]."""
    r = T / 2.0
    rh = r if rh is None else rh
    a, b = W / 2 - rh, D / 2 - rh
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
        cx = min(max(X, -a), a)
        cy = min(max(Y, -b), b)
        # plan: rounded-rectangle core
        qx_, qy_ = min(max(cx, -ax), ax), min(max(cy, -by), by)
        dx, dy = cx - qx_, cy - qy_
        dl = math.hypot(dx, dy)
        if dl > rc:
            cx, cy = qx_ + dx / dl * rc, qy_ + dy / dl * rc
        hx, hy = (X - cx) / rh, (Y - cy) / rh
        hz = Z / r
        L = math.sqrt(hx * hx + hy * hy + hz * hz)
        if L < 1e-12:
            hx, hy, hz, L = 0.0, 0.0, (1.0 if Z >= 0 else -1.0), 1.0
        hx, hy, hz = hx / L, hy / L, hz / L
        hh = math.hypot(hx, hy)
        f = 1.0 / max(1e-9, (hh ** sq + abs(hz) ** sq)) ** (1.0 / sq)
        p = Vector((cx + hx * f * rh, cy + hy * f * rh, r + hz * f * r))
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
    lo_, hi_ = opts.get("corner_n", (2, 4))
    for (cx, cy) in ((-1, -1), (1, -1)):
        for kk in range(rnd.randint(lo_, hi_)):
            x0 = cx * (W / 2 - rnd.uniform(0.004, 0.02))
            y0 = -D / 2 + rnd.uniform(0.004, 0.035)
            ang = math.atan2(rnd.uniform(0.4, 1.0), -cx * rnd.uniform(0.6, 1.2))
            dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.025, 0.06), rnd.uniform(0.0025, 0.0045),
                          amp * rnd.uniform(0.5, 1.1)) * wt
    # short compression wrinkles running in from the side folds (scalloped fold edge)
    lo_, hi_ = opts.get("side_n", (4, 7))
    for sgn in (-1, 1):
        ys_ = sorted(rnd.uniform(-D / 2 + 0.04, D / 2 - 0.04) for _ in range(rnd.randint(lo_, hi_)))
        for y0 in ys_:
            x0 = sgn * (W / 2 + 0.004)
            ang = (math.pi if sgn > 0 else 0.0) + rnd.uniform(-0.45, 0.45)
            dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.018, 0.05), rnd.uniform(0.0022, 0.0042),
                          amp * rnd.uniform(0.5, 1.1) * opts.get("side_amp", 1.0)) * wt
    # and in from the waist fold
    lo_, hi_ = opts.get("waist_n", (3, 5))
    for kk in range(rnd.randint(lo_, hi_)):
        x0 = rnd.uniform(-W / 2 + 0.03, W / 2 - 0.03)
        ang = math.pi / 2 + rnd.uniform(-0.5, 0.5)
        dz += _crease(x, y, x0, -D / 2 - 0.004, ang, rnd.uniform(0.015, 0.04), rnd.uniform(0.0025, 0.004),
                      amp * rnd.uniform(0.4, 0.9)) * wt
    lo_, hi_ = opts.get("long_n", (3, 5))
    for kk in range(rnd.randint(lo_, hi_)):
        sgn = rnd.choice((-1, 1))
        x0 = sgn * (W / 2 - rnd.uniform(0.0, 0.03))
        y0 = rnd.uniform(-D / 2 + 0.02, D / 2 - 0.08)
        ang = (math.pi if sgn > 0 else 0.0) + rnd.uniform(-0.5, 0.5)
        dz += _crease(x, y, x0, y0, ang, rnd.uniform(0.05, 0.11), rnd.uniform(0.004, 0.008),
                      amp * rnd.uniform(0.35, 0.7), valleys=0.8) * wt
    # long shallow creases running parallel to the waist fold (layers settling behind it)
    for kk in range(opts.get("parallel_n", 0)):
        y0 = -D / 2 + rnd.uniform(0.022, 0.06)
        ln = rnd.uniform(0.08, 0.14)
        x0 = rnd.uniform(-W / 2 + 0.012, W / 2 - 0.012 - ln)
        dz += _crease(x, y, x0, y0, rnd.uniform(-0.08, 0.08), ln, rnd.uniform(0.004, 0.007),
                      opts.get("parallel_amp", 0.0006) * rnd.uniform(0.6, 1.0) * rnd.choice((-1, 1)),
                      valleys=0.4) * wt
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
        zz = zk * T + opts.get("layer_wobble", 0.0025) * T / 0.03 * _noise2(x, y, 30.0, seed + 40 + k)
        vary = np.clip(0.45 + 1.1 * _noise2(x, y, 14.0, seed + 60 + k), 0.0, 1.3)
        step_in += opts.get("layer_depth", 0.0011) * vary * np.exp(-((z - zz) / (opts.get("layer_w", 0.045) * T + 0.0004)) ** 2)
    # soft, irregular compression wrinkles on the fold faces (bunching of the folded plies)
    sw_amp = opts.get("face_wrinkle", 0.0)
    if sw_amp:
        along = np.where(np.abs(ox) > np.abs(oy), y, x)
        wv = _fbm(along * 1.0, z * 0.45, 55.0, seed + 90, 3)
        env = np.clip(0.3 + _noise2(along, z, 9.0, seed + 91), 0.0, 1.0)
        step_in -= sw_amp * wv * env * _ss(0.05 * T, 0.25 * T, z) * _ss(0.95 * T, 0.75 * T, z)
    nrm = np.sqrt(ox * ox + oy * oy) + 1e-6
    x = x - ox / nrm * step_in * side_w
    y = y - oy / nrm * step_in * side_w
    z = z + dz
    return np.stack([x, y, np.maximum(z, 0.0)], axis=1)


def _body(name, W, D, T, mat, seed, opts, extra=None, parent=None, step=0.0021, levels=1):
    o = _slab(name, W, D, T, rc=opts.get("rc", 0.012), step=step, parent=parent, mat=mat,
              sq=opts.get("sq", 2.0), rh=opts.get("rh"))
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
def _stitch_on(name, pts, nrms, mat, parent, pitch=0.0028, duty=0.8, radius=0.00026, lift=0.00008,
               closed=False):
    """Stitch row along a dense 3D path with surface normals (see _stitch_row)."""
    M = 6

    def prof(i, s):
        ph = (s / pitch) % 1.0
        f = math.sin(math.pi * ph / duty) ** 0.45 if ph < duty else 0.0
        rr = radius * max(f, 0.04)
        return [(rr * math.cos(TAU * k / M), lift + rr * 0.8 * math.sin(TAU * k / M) - radius * 0.25 * (1 - f))
                for k in range(M)]
    return _sweep(name, pts, nrms, prof, closed=closed, mat=mat, parent=parent)


def _stitch_row(name, bvh, pts2d, mat, parent, pitch=0.0028, duty=0.8, radius=0.00026, lift=0.00008,
                closed=False):
    """A row of lock/coverstitch stitches: one swept thread tube pinched at every needle hole."""
    pts, nrms = _surface_path(bvh, pts2d, pitch / 7.0, closed)
    return _stitch_on(name, pts, nrms, mat, parent, pitch, duty, radius, lift, closed)


def _bartack(name, bvh, x, y, mat, parent, length=0.006, ang=0.0, radius=0.0003):
    """Bar-tack: a short dense zig-zag of thread that locks the end of a seam."""
    c, s_ = math.cos(ang), math.sin(ang)
    pts2 = []
    n = 14
    for i in range(n + 1):
        t = -0.5 + i / n
        o = 0.0006 * (1 if i % 2 else -1)
        pts2.append((x + c * t * length - s_ * o, y + s_ * t * length + c * o))
    pts, nrms = _surface_path(bvh, pts2, 0.0002, smooth_n=3)
    return _sweep(name, pts, nrms, [(radius * math.cos(TAU * k / 6), radius * 0.9 + radius * 0.8 * math.sin(TAU * k / 6))
                                     for k in range(6)], mat=mat, parent=parent)


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
    cu.bevel_resolution = 3
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


def _stadium(w, t, M, puff=0.0, e=0.0):
    """Flattened-tube cross-section (stadium) w wide, t thick; M points uniformly spaced along
    the OUTER perimeter starting bottom-centre, counter-clockwise (+b first), each offset inward
    by e along its normal (so rings with different e correspond point-to-point).
    Returns [(b, h, v)] with h measured from the tube bottom and v = perimeter length (m)."""
    A = max(w / 2 - t / 2, 1e-5)
    r = t / 2
    hc = t / 2
    straight = 2 * A
    per = 2 * straight + 2 * math.pi * r
    out = []
    for k in range(M):
        d = per * k / M
        if d < A:                                    # bottom, centre -> +b
            bb, hh, nb_, nh = d, hc - r, 0.0, -1.0
        elif d < A + math.pi * r:                    # +b rounded edge
            th = (d - A) / r - math.pi / 2
            nb_, nh = math.cos(th), math.sin(th)
            bb, hh = A + r * nb_, hc + r * nh
        elif d < A + math.pi * r + straight:         # top, +b -> -b
            bb, hh, nb_, nh = A - (d - A - math.pi * r), hc + r, 0.0, 1.0
        elif d < A + 2 * math.pi * r + straight:     # -b rounded edge
            th = (d - A - math.pi * r - straight) / r + math.pi / 2
            nb_, nh = math.cos(th), math.sin(th)
            bb, hh = -A + r * nb_, hc + r * nh
        else:                                        # bottom, -b -> centre
            bb, hh, nb_, nh = -A + (d - A - 2 * math.pi * r - straight), hc - r, 0.0, -1.0
        if hh > hc and puff:
            hh += puff * max(0.0, 1.0 - (bb / (A + r)) ** 2)
        e_ = min(e, r - 0.0003)
        out.append((bb - nb_ * e_, hh - nh * e_, d))
    return out


def _tube(name, segs, mat, parent, M=48, lip=None, mapper=None, jitter=None):
    """Flattened fabric tube (sleeve / cuff) built in 'flat space' along a straight axis.
    segs: list of (u, w, t, puff) rings, u = position along the axis (m).
    lip=(delta, inner_len): roll the open end inward by a ply thickness `delta` and continue as
    the inner wall for inner_len (the visible cuff opening).
    mapper(u_arr, b_arr, h_arr) -> (N,3) positions (drape/bend into place).
    jitter(u, b, h) -> dh extra height (wrinkles). UV: u = axis length, v = perimeter (m)."""
    rings = []
    for (u, w, t, puff) in segs:
        rings.append((u, _stadium(w, t, M, puff)))
    if lip:
        delta, inner_len = lip
        u_end, w, t, puff = segs[-1]
        J = 6
        for j in range(1, J + 1):
            psi = math.pi * j / J
            e = delta / 2 * (1 - math.cos(psi))
            rings.append((u_end + delta / 2 * math.sin(psi), [(bb, hh, v) for (bb, hh, v) in _stadium(w, t, M, puff * (1 - j / J), e)]))
        for j in range(1, 4):
            rings.append((u_end - inner_len * j / 3, _stadium(w, t, M, 0.0, delta)))
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    U, B, Hh, Vv = [], [], [], []
    acc = 0.0
    ulen = []
    for i, (u, prof) in enumerate(rings):
        if i:
            acc += max(abs(u - rings[i - 1][0]), 0.0004)
        ulen.append(acc)
        for (bb, hh, v) in prof:
            U.append(u)
            B.append(bb)
            Hh.append(hh)
            Vv.append(v)
    U, B, Hh = np.array(U), np.array(B), np.array(Hh)
    if jitter is not None:
        Hh = Hh + jitter(U, B, Hh)
    P = mapper(U, B, Hh) if mapper else np.stack([U, B, Hh], 1)
    vs = [bm.verts.new(tuple(p)) for p in P]
    per = rings[0][1][-1][2] + (rings[0][1][-1][2] - rings[0][1][-2][2])
    for i in range(len(rings) - 1):
        for k in range(M):
            k2 = (k + 1) % M
            a0, a1 = i * M + k, i * M + k2
            b0, b1 = (i + 1) * M + k, (i + 1) * M + k2
            try:
                f = bm.faces.new((vs[a0], vs[b0], vs[b1], vs[a1]))
            except ValueError:
                continue
            v0 = Vv[a0]
            v1 = Vv[a1] if k2 else per
            for lp, uv in zip(f.loops, ((ulen[i], v0), (ulen[i + 1], v0), (ulen[i + 1], v1), (ulen[i], v1))):
                lp[uvl].uv = uv
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = _obj_from_bm(name, bm, mat, parent)
    # outward normals: the first ring's bottom points down
    return o


def _ring_path(u, w, t, M, mapper, upper_only=True, puff=0.0, lift=0.00025):
    """3D points + outward normals around a tube cross-section at axis position u (for seams)."""
    prof = _stadium(w, t, M, puff)
    if upper_only:
        prof = [p for p in prof if p[1] > t * 0.30]          # contiguous: +b edge, over the top, -b edge
    U = np.full(len(prof), u)
    B = np.array([p[0] for p in prof])
    H = np.array([p[1] for p in prof])
    hc = t / 2
    P0 = mapper(U, B * 0.999, hc + (H - hc) * 0.999)
    P1 = mapper(U, B * 1.03 + np.sign(B) * 0.0003, hc + (H - hc) * 1.03 + np.sign(H - hc) * 0.0003)
    pts = [Vector(p) for p in mapper(U, B, H)]
    nrms = [(Vector(b) - Vector(a)).normalized() for a, b in zip(P0, P1)]
    pts = [p + n * lift for p, n in zip(pts, nrms)]
    return pts, nrms


def _sleeve_segs(u0, u_body, u_cuff, w_sl, w_cf, t_sl, t_cf, step=0.0012):
    """Rings for sleeve body (u0..u_body, tapering) and rib cuff (u_body..u_cuff)."""
    body, cuff = [], []
    n1 = max(4, int((u_body - u0) / step))
    for i in range(n1 + 1):
        f = i / n1
        u = u0 + (u_body - u0) * f
        # ease the width/thickness into the cuff over the last 15 mm (sleeve gathers into the rib)
        g = _ss(u_body - 0.015, u_body, u)
        body.append((u, w_sl + (w_cf * 1.04 - w_sl) * g, t_sl + (t_cf * 1.05 - t_sl) * g, 0.0012 * (1 - g)))
    n2 = max(4, int((u_cuff - u_body) / step))
    for i in range(n2 + 1):
        u = u_body + (u_cuff - u_body) * i / n2
        # rib springs back a touch past the seam, then runs straight
        k = math.exp(-((u - u_body) / 0.004) ** 2)
        cuff.append((u, w_cf * (1.0 + 0.04 * k), t_cf * (1.0 + 0.05 * k), 0.0005))
    return body, cuff


def _cuff_tube(name, parent, color, x_end, y_c, z0, ang_deg, w_cf=0.05, t_cf=0.0085, L=0.06,
               sleeve_len=0.05, w_sl=0.062, t_sl=0.010, seed=0, sleeve_mat=None):
    """Sleeve end tucked under a side fold with only its rib cuff peeking out at x_end:
    straight flattened tube resting at height z0, axis rotated ang_deg from +X, open rib end."""
    rnd = random.Random(seed)
    a = math.radians(ang_deg)
    d = Vector((math.cos(a), math.sin(a)))
    p = Vector((-d.y, d.x))
    O = Vector((x_end, y_c)) - d * (L + sleeve_len)
    ph = rnd.uniform(0, 6)

    def mapper(U, B, H):
        X = O.x + U * d.x + B * p.x
        Y = O.y + U * d.y + B * p.y
        Z = z0 + H
        return np.stack([X, Y, Z], 1)

    def jitter(U, B, H):
        top = H > t_cf * 0.5
        wob = 0.00035 * np.sin(U * 260 + ph) * np.cos(B * 90)
        return np.where(top, wob, 0.0)
    body, cuff = _sleeve_segs(0.0, sleeve_len, sleeve_len + L, w_sl, w_cf, t_sl, t_cf)
    rib = mat_knit(color, kind="rib", rib_axis="UV_Y", rib_pitch=0.0014)
    sl = _tube(name + "_sleeve", body, sleeve_mat or mat_knit(color, kind="jersey"), parent, mapper=mapper,
               jitter=jitter)
    for mod in (sl,):
        m = mod.modifiers.new("Subsurf", "SUBSURF")
        m.levels = m.render_levels = 1
    cf = _tube(name, cuff, rib, parent, lip=(t_cf / 2 - 0.0011, 0.02), mapper=mapper, jitter=jitter)
    m = cf.modifiers.new("Subsurf", "SUBSURF")
    m.levels = m.render_levels = 1
    return cf


def _surface_sampler(bvh, r=0.003):
    """Smoothed top-surface height of a body (5 vertical rays in a cross of radius r)."""
    offs = ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r))

    def S(X, Y):
        out = np.empty(len(X))
        for i in range(len(X)):
            acc, n = 0.0, 0
            for (ox, oy) in offs:
                loc = bvh.ray_cast(Vector((X[i] + ox, Y[i] + oy, 1.0)), Vector((0, 0, -1)))[0]
                if loc is not None:
                    acc += loc.z
                    n += 1
            out[i] = acc / n if n else 0.0
        return out
    return S


def _front_sleeve(kind, color, root, bvh, W, D, T, opts, seed, side=-1, ang_deg=29.0, y_b=-0.022,
                  w_sl=0.066, t_sl=0.0105, w_cf=0.054, t_cf=0.0088, L_cf=0.05, L_front=0.132):
    """Long sleeve brought out of the `side` fold (-1 = left) and across the lower front:
    a flattened jersey tube that rolls over the side fold edge, then a rib cuff with an open,
    rolled end lying on the chest. Rib wales run along the sleeve axis."""
    rnd = random.Random(seed + 77)
    sg = side
    rh = opts.get("rh") or T / 2
    rv = T / 2
    x_b = W / 2 - rh                                      # where the side fold starts to round off
    a = math.radians(ang_deg)
    d = Vector((-sg * math.cos(a), -math.sin(a)))       # axis direction (toward the cuff)
    p = Vector((-d.y, d.x))
    phimax = math.radians(100.0)
    clear = 0.0009
    R_mid = rh + t_sl / 2
    u_b = (R_mid * phimax + 0.012) / abs(d.x)           # wrapped + tucked length, measured along the axis
    E = Vector((sg * x_b, y_b))                          # centreline crosses x_b at u = u_b
    u_end = u_b + L_front
    u_body = u_end - L_cf
    S = _surface_sampler(bvh)

    def mapper(U, B, H):
        X = E.x + (U - u_b) * d.x + B * p.x
        Y = E.y + (U - u_b) * d.y + B * p.y
        xl = sg * X                                       # local: + toward the fold edge
        out = np.empty((len(U), 3))
        flat = xl <= x_b
        Zs = S(X[flat], Y[flat])
        out[flat, 0], out[flat, 1], out[flat, 2] = X[flat], Y[flat], Zs + H[flat] + clear
        wr = ~flat
        if wr.any():
            zc = S(np.full(wr.sum(), sg * (x_b - 0.002)), Y[wr]) - rv
            aa = xl[wr] - x_b
            phi = aa / R_mid
            hh = H[wr] + clear * 1.4
            xo = np.where(phi <= phimax, x_b + (rh + hh) * np.sin(np.minimum(phi, phimax)),
                          x_b + (rh + hh) * math.sin(phimax) - (aa - phimax * R_mid))
            zo = zc + (rv + hh) * np.cos(np.minimum(phi, phimax))
            out[wr, 0], out[wr, 1], out[wr, 2] = sg * xo, Y[wr], zo
        return out

    creases = [(u_b + rnd.uniform(0.0, 0.03), rnd.uniform(-0.3, 0.3)) for _ in range(2)]
    creases += [(u_b + rnd.uniform(0.04, L_front - L_cf - 0.02), rnd.uniform(-0.5, 0.5)) for _ in range(2)]
    ph = rnd.uniform(0, 6)

    def jitter(U, B, H):
        top = _ss(0.45, 0.8, H / t_sl)
        dh = 0.0004 * np.sin(U * 140 + ph) * np.cos(B * 70 + ph)
        for (uk, sk) in creases:                           # soft compression folds across the sleeve
            dh += 0.0009 * np.exp(-(((U - uk) - sk * B) / 0.004) ** 2) * (1 - (2 * B / w_sl) ** 2).clip(0)
        dh -= 0.0006 * np.exp(-((U - u_body) / 0.0014) ** 2)        # cuff seam pulls in
        return dh * top

    body, cuff = _sleeve_segs(0.0, u_body, u_end, w_sl, w_cf, t_sl, t_cf)
    sl = _tube(f"{kind}_{color}_fsleeve", body, mat_knit(color, kind="jersey"), root, mapper=mapper,
               jitter=jitter)
    rib = mat_knit(color, kind="rib", rib_axis="UV_Y", rib_pitch=0.0014)
    cf = _tube(f"{kind}_{color}_fcuff", cuff, rib, root, lip=(t_cf / 2 - 0.0011, 0.02), mapper=mapper, jitter=jitter)
    for o in (sl, cf):
        m = o.modifiers.new("Subsurf", "SUBSURF")
        m.levels = m.render_levels = 1
    # coverstitched cuff seam, running over the top of the tube
    th = mat_thread(color)
    for j, du in enumerate((-0.0016, 0.0016)):
        pts, nrms = _ring_path(u_body + du, w_cf * 1.04, t_cf * 1.05, 220, mapper, lift=0.0001)
        _stitch_on(f"{kind}_{color}_cuffseam{j}", pts, nrms, th, root, pitch=0.0024, radius=0.0002)
    return sl


# ============================================================== public builders
def folded_tee(color="White", long_sleeve=False, seed=None, sleeve="front"):
    """Retail-folded short- or long-sleeve tee, chest + screen print up. Returns Empty root.
    Long sleeve: sleeve="front" brings the left sleeve out of the side fold and diagonally across
    the lower front with its open rib cuff on the chest (the recognisable long-sleeve fold);
    sleeve="tucked" keeps both sleeves behind with one rib cuff peeking out at the right."""
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
    opts = dict(droop=0.12, droop_len=0.022, side_ridge=0.06, waist_puff=0.05, undulate=0.0030, ripple=0.0004,
                creases=creases, wrinkle=0.0020, wavy=0.0013, bow=0.002, rc=0.004, layer_depth=0.0013,
                sq=2.6, rh=0.0125, face_wrinkle=0.0007)
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
    lab = _slab(f"{kind}_{color}_label", lw, lh, 0.0005, rc=0.0008, step=0.0005, parent=root, mat=lab_mat)
    P = _get_co(lab.data)
    P[:, 1] += ly
    _set_co(lab.data, P)
    _conform(lab, bvh, offset=0.00006)
    P = _get_co(lab.data)
    # sewn along its top edge into the back-neck tape; the free end lifts ~1.5 mm and the
    # label follows the neck curve (slightly cupped across its width)
    fr = np.clip((ly + lh / 2 - P[:, 1]) / lh, 0, 1)
    P[:, 2] += 0.0015 * fr ** 1.8 + 0.0004 * (P[:, 0] / (lw / 2)) ** 2
    P[:, 1] += 0.0004 * fr ** 2
    _set_co(lab.data, P)
    lbvh = _bvh(lab)
    _stitch_row(f"{kind}_{color}_labst", lbvh, [(-lw / 2 + 0.0012, ly + lh / 2 - 0.0013), (lw / 2 - 0.0012, ly + lh / 2 - 0.0013)],
                th_mat, root, pitch=0.0018, radius=0.00017)

    if long_sleeve and sleeve == "front":
        _front_sleeve(kind, color, root, bvh, W, D, T, opts, seed)
    elif long_sleeve:
        _cuff_tube(f"{kind}_{color}_cuff", root, color, x_end=W / 2 + 0.014, y_c=-D / 2 + 0.075, z0=0.0035,
                   ang_deg=-24.0, w_cf=0.052, t_cf=0.0085, L=0.055, sleeve_len=0.05, w_sl=0.06, t_sl=0.0095,
                   seed=seed, sleeve_mat=mat_knit(color, kind="jersey"))
    return root


def _bvh_multi(objs):
    """One BVH over several evaluated meshes (parent-local = world while the root is at identity)."""
    dg = bpy.context.evaluated_depsgraph_get()
    V, F = [], []
    for o in objs:
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        M = o.matrix_local if o.parent else o.matrix_world
        off = len(V)
        V += [M @ v.co for v in me.vertices]
        F += [tuple(off + i for i in p.vertices) for p in me.polygons]
        oe.to_mesh_clear()
    return BVHTree.FromPolygons(V, F)


def _bend_map(P, S, edge, rh, rv, axis=1, sign=1, phimax=math.radians(95), clear=0.0006, tuck=0.012):
    """Lay a flat-space mesh (z = height above its own bottom) onto a body top surface S(x, y),
    rolling it over a fold edge: beyond `edge` along `axis` (sign = which side) the cloth bends
    around an elliptic edge of reach rh / half-height rv, then tucks in under the fold."""
    X, Y, H = P[:, 0].copy(), P[:, 1].copy(), P[:, 2].copy()
    A = Y if axis == 1 else X
    al = sign * A
    out = np.empty_like(P)
    flat = al <= edge
    out[flat, 0], out[flat, 1] = X[flat], Y[flat]
    out[flat, 2] = S(X[flat], Y[flat]) + H[flat] + clear
    wr = ~flat
    if wr.any():
        Xe = X[wr] if axis == 1 else np.full(wr.sum(), sign * (edge - 0.002))
        Ye = np.full(wr.sum(), sign * (edge - 0.002)) if axis == 1 else Y[wr]
        zc = S(Xe, Ye) - rv
        R_mid = rh + float(np.median(H)) if len(H) else rh
        aa = al[wr] - edge
        phi = aa / R_mid
        hh = H[wr] + clear * 1.5
        pc = np.minimum(phi, phimax)
        ao = np.where(phi <= phimax, edge + (rh + hh) * np.sin(pc),
                      edge + (rh + hh) * math.sin(phimax) - (aa - phimax * R_mid))
        zo = zc + (rv + hh) * np.cos(pc)
        if axis == 1:
            out[wr, 0], out[wr, 1] = X[wr], sign * ao
        else:
            out[wr, 0], out[wr, 1] = sign * ao, Y[wr]
        out[wr, 2] = zo
    return out


def _grommet(name, loc, nrm, parent, r_in=0.0026, r_out=0.0047, h=0.0011):
    """Small nickel eyelet (rolled ring) seated in the fabric, axis along nrm."""
    prof = [(r_in * 0.92, -0.0012), (r_in, -0.0002), (r_in * 1.02, h * 0.75), (r_in + (r_out - r_in) * 0.25, h),
            (r_in + (r_out - r_in) * 0.6, h * 0.92), (r_out * 0.97, h * 0.55), (r_out, h * 0.2), (r_out * 0.97, 0.0)]
    g = lathe(name, prof, segments=40, mat=mat_aglet())
    z = Vector(nrm).normalized()
    xax = z.cross(Vector((0, 1, 0)))
    if xax.length < 1e-4:
        xax = Vector((1, 0, 0))
    xax.normalize()
    yax = z.cross(xax)
    g.matrix_world = Matrix.Translation(loc) @ Matrix((xax, yax, z)).transposed().to_4x4()
    g.parent = parent
    g.matrix_parent_inverse = parent.matrix_world.inverted()
    # the dark hole the cord disappears into
    hole = lathe(name + "_hole", [(0.0, -0.0004), (r_in * 0.97, -0.0004)], segments=24,
                 mat=mat_knit("#0B0B0F", name="apparel_hole_dark"))
    hole.matrix_world = g.matrix_world.copy()
    hole.parent = parent
    hole.matrix_parent_inverse = parent.matrix_world.inverted()
    return g


def folded_hoodie(color="Black", seed=None):
    """Retail-folded pullover hoodie in heavyweight fleece: flat-topped body with folded double-ply
    edges, the hood laid forward over the top fold as a two-ply panel with its rolled opening edge
    at the lower lip, drawcords coming out of nickel eyelets with metal aglets, embroidered
    satin-stitch logo, a rib cuff peeking out of the right fold. Returns Empty root."""
    seed = _stable_seed(color) + 7 if seed is None else seed
    W, D, T = W_FOLD, D_FOLD, 0.046
    root = _empty(f"hoodie_{color}")
    body_mat = mat_knit(color, name=f"apparel_fleece_{color}", kind="fleece")
    rh_b = 0.017
    opts = dict(droop=0.05, droop_len=0.015, side_ridge=0.025, waist_puff=0.015, undulate=0.0010, ufreq=7.0,
                ripple=0.00018, wrinkle=0.0016, corner_n=(0, 0), side_n=(2, 3), side_amp=0.55, waist_n=(0, 0),
                long_n=(1, 2), parallel_n=3, parallel_amp=0.0007, wavy=0.0014, bow=0.0022, rc=0.007,
                layer_depth=0.0017, layer_w=0.035, layers=(0.30, 0.62), layer_wobble=0.004, face_wrinkle=0.0011,
                sq=3.0, rh=rh_b)
    logo_w, logo_cy = 0.080, -0.030

    def extra(P):
        x, y = P[:, 0], P[:, 1]
        top = _ss(0.5 * T, 0.95 * T, P[:, 2])
        # embroidery pulls the fleece in ~0.3 mm around the logo (pucker), with faint radial drag lines
        r2 = (x / 0.050) ** 2 + ((y - logo_cy) / 0.013) ** 2
        P[:, 2] -= 0.0003 * np.exp(-r2 ** 2) * top
        P[:, 2] -= 0.00012 * np.exp(-r2) * np.cos(np.arctan2(y - logo_cy, x / 3.5) * 9) * top
        return P
    body = _body(f"hoodie_{color}_body", W, D, T, body_mat, seed, opts, extra, parent=root, step=0.0022)
    bvh = _bvh(body)
    S = _surface_sampler(bvh)

    # --- hood: two-ply fleece panel, wraps over the top fold, rolled opening edge at its lower lip
    Wh, Th = W - 0.018, 0.0085
    y_lip = D / 2 - 0.088                                 # lower (front) lip of the hood
    y_back = D / 2 + 0.032                                # flat-space back end (wraps over the top fold)
    Dh = y_back - y_lip
    hood = _slab(f"hoodie_{color}_hood", Wh, Dh, Th, rc=0.016, step=0.0016, parent=root, mat=body_mat,
                 sq=2.4, rh=0.0035)
    P = _get_co(hood.data)
    P[:, 1] += (y_back + y_lip) / 2
    x, y, h = P[:, 0], P[:, 1], P[:, 2]
    top = _ss(0.4 * Th, 0.97 * Th, h)
    rnd = random.Random(seed + 99)
    # two soft lobes (the hood halves) either side of the centre seam, seam pulls in
    lobes = np.exp(-((np.abs(x) - 0.045) / 0.035) ** 2)
    h += (0.0010 * lobes - 0.0007 * np.exp(-(x / 0.004) ** 2)) * top
    h += 0.0005 * _fbm(x, y, 16.0, seed + 3, 2) * top
    for kk in range(3):                                    # a few long shallow creases toward the lip
        sgn = rnd.choice((-1, 1))
        h += _crease(x, y, sgn * rnd.uniform(0.02, 0.07), y_lip + rnd.uniform(0.0, 0.006),
                     math.pi / 2 + sgn * rnd.uniform(0.1, 0.4), rnd.uniform(0.03, 0.05),
                     rnd.uniform(0.003, 0.005), rnd.uniform(0.0004, 0.0008), valleys=0.4) * top
    # the lip thins toward the rolled edge so the panel sits down onto it
    lipf = _ss(y_lip + 0.012, y_lip, y)
    h = h * (1.0 - 0.25 * lipf) + 0.0
    P[:, 2] = h
    P = _bend_map(P, S, D / 2 - rh_b, rh_b, T / 2, axis=1, sign=1, phimax=math.radians(100), clear=0.0008)
    _set_co(hood.data, P)
    hm = hood.modifiers.new("Subsurf", "SUBSURF")
    hm.levels = hm.render_levels = 1

    # rolled opening edge (facing + drawcord channel) along the lip, just proud of the panel
    rl_r = 0.0031
    xs_ = np.linspace(-Wh / 2 + 0.010, Wh / 2 - 0.010, 160)
    lip_pts, lip_n = [], []
    for xx in xs_:
        bend = 0.0018 * (1 - (xx / (Wh / 2)) ** 2)        # the lip bows a touch toward the viewer
        yy = y_lip + 0.0012 - bend
        zz = S(np.array([xx]), np.array([yy]))[0]
        lip_pts.append(Vector((xx, yy, zz)))
        lip_n.append(Vector((0, 0, 1)))

    def roll_prof(i, s_):
        endk = min(1.0, min(i, len(lip_pts) - 1 - i) / 8.0)  # rounded ends
        rr = rl_r * (0.55 + 0.45 * math.sin(endk * math.pi / 2))
        return [(rr * 1.05 * math.cos(TAU * k / 16), rr + 0.0004 + rr * 0.92 * math.sin(TAU * k / 16)) for k in range(16)]
    roll = _sweep(f"hoodie_{color}_hoodroll", lip_pts, lip_n, roll_prof, mat=body_mat, parent=root)
    smooth(roll)
    hbvh = _bvh_multi([hood, roll])
    th_mat = mat_thread(color)
    # coverstitch on the roll + full-length twin centre seam ending in a bar-tack at the lip
    _stitch_row(f"hoodie_{color}_rollst", hbvh, [(xx, y_lip + 0.0016 - 0.0018 * (1 - (xx / (Wh / 2)) ** 2)) for xx in xs_[8:-8]],
                th_mat, root, pitch=0.0028, radius=0.00024)
    for j, off in enumerate((-0.0030, 0.0030)):
        pts2 = [(off, D / 2 + 0.012 - t * (D / 2 + 0.012 - y_lip - 0.0045)) for t in np.linspace(0, 1, 40)]
        _stitch_row(f"hoodie_{color}_hs{j}", hbvh, pts2, th_mat, root, pitch=0.003, radius=0.00027)
    _bartack(f"hoodie_{color}_bartack", hbvh, 0.0, y_lip + 0.0040, th_mat, root, length=0.0085)

    # --- eyelets on the hood just above the rolled edge; cords come out of them and run down
    cord_mat = mat_cord(color)
    surf = _bvh_multi([body, hood, roll])
    y_eye = y_lip + 0.0105
    for sgn in (-1, 1):
        ex = sgn * 0.024
        loc, n = _hit(hbvh, ex, y_eye)
        _grommet(f"hoodie_{color}_eyelet{sgn}", loc + n * 0.0001, n, root)
        j = rnd.uniform(-0.004, 0.004)
        path = [(ex, y_eye - 0.0012), (ex + sgn * 0.002, y_eye - 0.010), (sgn * (0.031 + j), y_lip - 0.016),
                (sgn * (0.040 + j), y_lip - 0.045), (sgn * (0.049 + j), y_lip - 0.075),
                (sgn * (0.053 + j * 1.5), y_lip - 0.100), (sgn * (0.052 + j), y_lip - 0.118 + j * 2)]
        path = [Vector(p) for p in path]
        sm = []
        for i in range(len(path) - 1):
            p0, p1, p2, p3 = path[max(i - 1, 0)], path[i], path[i + 1], path[min(i + 2, len(path) - 1)]
            for k in range(8):
                t = k / 8
                sm.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                                 (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
        sm.append(path[-1])
        c = _cord(f"hoodie_{color}_cord{sgn}", surf, sm, cord_mat, root, radius=0.0024, seed=seed + sgn)
        Pc = _get_co(c.data)                                # the cord dives into the eyelet hole
        dd = np.hypot(Pc[:, 0] - ex, Pc[:, 1] - (y_eye - 0.0012))
        Pc[:, 2] -= 0.0034 * np.exp(-(dd / 0.0030) ** 2)
        _set_co(c.data, Pc)

    # --- embroidered logo: low, rounded satin stitch (~0.7 mm proud), per-stroke stitch direction
    _ensure_textures()
    im = _image(TEX_PRINT)
    iw, ih = im.size
    sc = logo_w / (iw - 80)
    sat = mat_satin((0.0, logo_cy, iw * sc, ih * sc))
    emb = _text_mesh("your logo", FONT_DISPLAY, logo_w, extrude=0.0, bevel=0.00042,
                     name=f"hoodie_{color}_logo", parent=root, mat=sat)
    Pe = _get_co(emb.data)
    zc = (Pe[:, 2].max() + Pe[:, 2].min()) / 2
    Pe[:, 2] = (Pe[:, 2] - zc).clip(0, None) * 1.6        # keep the upper half of the round bevel
    _set_co(emb.data, Pe)
    _conform(emb, bvh, offset=-0.00005, dy=logo_cy)
    smooth(emb)

    # --- rib cuff peeking out from under the right fold (sleeve tucked behind)
    _cuff_tube(f"hoodie_{color}_cuff", root, color, x_end=W / 2 + 0.013, y_c=-D / 2 + 0.072, z0=0.0035,
               ang_deg=-28.0, w_cf=0.058, t_cf=0.0125, L=0.06, sleeve_len=0.05, w_sl=0.07, t_sl=0.016,
               seed=seed, sleeve_mat=body_mat)
    return root


# ============================================================== scene rig (shared by the three goods scenes)
EXPOSURE_TEE = 1.3
EXPOSURE_HOODIE = 1.3


def studio_apparel(target=(0, 0, 0.04), key=1.0, rim=0.6, skip_catcher=("Rim",)):
    """The house studio() rig at product scale (key upper-left, rim back-right, all lights cast
    shadows) + common.shadow_catcher(); only energies are scaled. Lights named in skip_catcher
    are light-linked to exclude the catcher, so the low back-right rim still models the cloth
    but cannot throw a long smudge toward the camera. Returns the catcher."""
    from common import studio, shadow_catcher
    studio("soft", key=key, hdri_strength=0.35, rotation_deg=30, target=target, scale=0.45)
    bpy.data.objects["Rim"].data.energy *= rim
    catcher = shadow_catcher()
    if skip_catcher:
        coll = bpy.data.collections.new("apparel_catcher_exclude")
        coll.objects.link(catcher)
        coll.collection_objects[0].light_linking.link_state = "EXCLUDE"
        for n in skip_catcher:
            bpy.data.objects[n].light_linking.receiver_collection = coll
    return catcher


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
                     or "_cord" in m.name or "_fsleeve" in m.name or "_fcuff" in m.name]
    bpy.context.view_layer.update()
    return roots


def frame_camera(objs, az_deg=28.0, el_deg=34.0, lens=85.0, pad=0.08, fstop=None, aspect=1.0,
                 shadow_grow=(0.05, 0.12)):
    """Product 3/4 camera that frames the given mesh objects with `pad` margin. The framing
    also includes a ground-plane proxy: the objects' XY bbox grown by shadow_grow[0] toward
    -X/-Y and shadow_grow[1] toward +X/+Y (where the upper-left key throws the cast shadow),
    so the shadow-catcher shadow fades out inside the frame."""
    from bpy_extras.object_utils import world_to_camera_view
    from common import camera, look_at
    pts = []
    for o in objs:
        M = o.matrix_world
        for v in list(o.data.vertices)[::7]:
            pts.append(M @ v.co)
    c = sum(pts, Vector()) / len(pts)
    if shadow_grow:
        # project every sample along the key direction onto the ground (cast-shadow footprint),
        # pushed a little further for the soft penumbra, plus a small ring around the base
        g0, g1 = shadow_grow
        key = bpy.data.objects.get("Key")
        ldir = (key.location - c).normalized() if key else Vector((-0.5, -0.45, 0.74)).normalized()
        hd = Vector((-ldir.x, -ldir.y, 0.0)).normalized()
        extra = []
        for p in pts[::3]:
            g = p - ldir * (p.z / max(ldir.z, 0.2))
            g.z = 0.0
            extra.append(g + hd * g1)
            extra.append(Vector((p.x, p.y, 0.0)) - hd * g0)
        pts += extra
    az, el = math.radians(az_deg), math.radians(el_deg)
    dirv = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    dist = 1.0
    cam = camera(loc=c + dirv * dist, target=c, lens=lens)
    scene = bpy.context.scene
    for it in range(14):
        cam.location = c + dirv * dist
        look_at(cam, c)
        bpy.context.view_layer.update()
        uv = [world_to_camera_view(scene, cam, p) for p in pts]
        us = [q.x for q in uv]
        vs = [q.y for q in uv]
        umin, umax, vmin, vmax = min(us), max(us), min(vs), max(vs)
        ext = max(umax - umin, vmax - vmin)
        du, dv = (umin + umax) / 2 - 0.5, (vmin + vmax) / 2 - 0.5
        right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0))
        up = cam.matrix_world.to_3x3() @ Vector((0, 1, 0))
        width_world = 2 * dist * math.tan(math.atan(18.0 / lens))
        c = c + right * du * width_world + up * dv * width_world
        dist *= ext / (1.0 - 2 * pad)
    cam.location = c + dirv * dist
    look_at(cam, c)
    if fstop:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = dist
        cam.data.dof.aperture_fstop = fstop
    return cam


def edge_fade(inner=0.90, feather=0.035):
    """Compositor safety net for cut-outs: multiply the whole frame (RGBA, premultiplied) by a
    soft box mask so nothing - in practice only the faint tail of a shadow-catcher shadow -
    can reach the frame edge. inner = box size (fraction of frame), feather = blur radius
    (fraction of the frame width). Objects must sit inside the box (frame_camera pad >= 0.08)."""
    s = bpy.context.scene
    s.use_nodes = True
    nt = s.node_tree
    nt.nodes.clear()
    rl = nt.nodes.new("CompositorNodeRLayers")
    comp = nt.nodes.new("CompositorNodeComposite")
    box = nt.nodes.new("CompositorNodeBoxMask")
    box.inputs["Size"].default_value = (inner, inner)
    box.inputs["Mask"].default_value = 0.0
    box.inputs["Value"].default_value = 1.0
    blur = nt.nodes.new("CompositorNodeBlur")
    blur.filter_type = "FAST_GAUSS"
    px = s.render.resolution_x * s.render.resolution_percentage / 100.0 * feather
    blur.inputs["Size"].default_value = (px, px)
    sa = nt.nodes.new("CompositorNodeSetAlpha")
    sa.mode = "APPLY"
    nt.links.new(box.outputs[0], blur.inputs["Image"])
    nt.links.new(rl.outputs["Image"], sa.inputs["Image"])
    nt.links.new(blur.outputs[0], sa.inputs["Alpha"])
    nt.links.new(sa.outputs[0], comp.inputs["Image"])
    return nt


def crop_flag(rel_path):
    """Dev aid: `-- --preview --crop=x0,y0,x1,y1` (fractions, y up) renders only that region at
    100 % resolution (preview samples) to previews/<name>_crop.png, for judging material detail."""
    from common import argv_flags
    for f in argv_flags():
        if f.startswith("--crop="):
            x0, y0, x1, y1 = [float(v) for v in f[7:].split(",")]
            r = bpy.context.scene.render
            r.resolution_percentage = 100
            r.use_border, r.use_crop_to_border = True, True
            r.border_min_x, r.border_min_y, r.border_max_x, r.border_max_y = x0, y0, x1, y1
            if "--preview" in argv_flags():
                bpy.context.scene.cycles.samples = 48
            r.use_compositing = False
            from common import PREVIEW_DIR
            return os.path.join(PREVIEW_DIR, rel_path.replace(".png", "_crop.png"))   # never into out/
    return rel_path


def alpha_edge_report(path):
    """Max alpha on the outermost rows/columns of a rendered PNG (should be <= 0.01)."""
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    al = a.reshape(h, w, 4)[:, :, 3]
    rep = dict(left=float(al[:, 0].max()), right=float(al[:, -1].max()), bottom=float(al[0].max()),
               top=float(al[-1].max()), ring8=float(max(al[:, :8].max(), al[:, -8:].max(), al[:8].max(), al[-8:].max())))
    bpy.data.images.remove(img)
    print("[apparel] alpha edges", path, {k: round(v, 4) for k, v in rep.items()})
    return rep
