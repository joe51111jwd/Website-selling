"""
chainmail accessories — dad cap, bull-denim tote, UltraHyde journal.

Public API (every builder returns ONE root Empty with identity rotation, origin at the
centre of its footprint, resting exactly on Z=0 (modifiers included), front facing -Y;
no cameras / lights / renders are created):

  cap(color="Black", style="dad", seed=None, logo="your logo", logo_color="cobalt") -> Empty
      unstructured 6-panel dad cap, ~0.165 W x 0.26 D (incl. pre-curved brim) x 0.115 H,
      brim to -Y, resting on brim corners + back rim (tilt lives on the inner "<name>_tilt"
      Empty so callers may set the root's rotation freely). style accepted for API
      compatibility; only the dad cap is modelled.
  tote(color="Natural", seed=None, logo="your logo", ink="cobalt") -> Empty
      bull denim tote 0.38 W x 0.40 H x 0.10 D body (~0.40 x 0.16 x 0.63 incl. slump and
      standing handles), printed face to -Y.
  journal(color="Blue", seed=None, logo="your logo", foil="chrome", ribbon_len=None) -> Empty
      5.5 x 8.25 in soft UltraHyde journal lying flat, front cover up: 0.1397 x 0.2096 x 0.016
      (+ elastic 1.3 mm, ribbon tail to -Y); spine on -X, head on +Y.

Colours are catalog names (Black, White, Natural, Red, Purple, Blue — site/src/data/catalog.js
swatches) or any hex. Geometry is procedural (numpy + bmesh). Decoration is the client's
placeholder mark "your logo" in Archivo Expanded: raised satin embroidery on the cap,
screen print on the tote, foil deboss on the journal. Text masks are cached in
blender/assets/textures/acc_logo_mask*.png. frame_camera() is a scene helper only.
"""
import bpy, bmesh, math, os, sys, random, subprocess
import numpy as np
from mathutils import Vector, Matrix, noise as mnoise

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from common import *  # noqa: F401,F403
import common as _c

TEX_DIR = os.path.join(_c.ASSETS, "textures")

SWATCH = {
    "Black": "#151515", "White": "#F7F7F4", "Natural": "#E9E1CF",
    "Red": "#8E3A3A", "Purple": "#4B3A72", "Blue": "#2F4778",
}

def _col(name, gain=1.0):
    h = SWATCH.get(name, name)
    c = rgb(h)
    return (c[0] * gain, c[1] * gain, c[2] * gain, 1.0)

# =================================================================== helpers
def _link(o, parent=None):
    if o.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(o)
    if parent is not None:
        o.parent = parent
    return o

def _empty(name):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.05
    bpy.context.scene.collection.objects.link(e)
    return e

def _mesh(name, verts, faces, mat=None, parent=None, loop_uv=None, smooth_shade=True, mats=None,
          face_mat=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.asarray(verts, dtype=float).tolist(), [], np.asarray(faces).tolist()
                   if not isinstance(faces, list) else faces)
    me.validate(clean_customdata=False)
    if loop_uv is not None:
        uvl = me.uv_layers.new(name="UVMap")
        uvl.data.foreach_set("uv", np.asarray(loop_uv, dtype=np.float32).ravel())
    if smooth_shade:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    o = bpy.data.objects.new(name, me)
    _link(o, parent)
    for m in (mats or ([mat] if mat else [])):
        me.materials.append(m)
    if face_mat is not None:
        me.polygons.foreach_set("material_index", np.asarray(face_mat, dtype=np.int32))
    return o

def _grid_faces(nu, nv, closed_u=False, flip=False):
    idx = np.arange(nu * nv).reshape(nu, nv)
    iu = nu if closed_u else nu - 1
    nxt = (np.arange(iu) + 1) % nu
    a = idx[:iu, :-1]; b = idx[nxt][:, :-1]; c = idx[nxt][:, 1:]; d = idx[:iu, 1:]
    f = np.stack([a, b, c, d], -1).reshape(-1, 4)
    return f[:, ::-1] if flip else f

def _grid_obj(name, P, uv=None, closed_u=False, flip=False, mat=None, parent=None, mats=None):
    nu, nv = P.shape[:2]
    F = _grid_faces(nu, nv, closed_u, flip)
    luv = None
    if uv is not None:
        luv = uv.reshape(-1, 2)[F.ravel()]
    return _mesh(name, P.reshape(-1, 3), F, mat=mat, parent=parent, loop_uv=luv, mats=mats)

def _norm(v, axis=-1):
    n = np.linalg.norm(v, axis=axis, keepdims=True)
    return v / np.maximum(n, 1e-12)

def _ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)

def _noise3(P, scale, seed=0, octaves=3):
    """fbm noise at points P (N,3) -> (N,)"""
    off = Vector((seed * 13.17, seed * 7.31, seed * 3.77))
    out = np.empty(len(P))
    for i, p in enumerate(P):
        out[i] = mnoise.fractal(Vector(p) * scale + off, 0.5, 2.0, octaves, noise_basis="PERLIN_NEW")
    return out

def _resample(pts, ds, extra=None):
    """Uniform arc-length resample of a polyline (N,3) [+ per-point attributes (N,k)]."""
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    L = s[-1]
    n = max(2, int(round(L / ds)) + 1)
    si = np.linspace(0, L, n)
    out = np.stack([np.interp(si, s, pts[:, k]) for k in range(3)], -1)
    if extra is None:
        return out, L
    ex = np.stack([np.interp(si, s, extra[:, k]) for k in range(extra.shape[1])], -1)
    return out, ex, L

def _frames(pts, up):
    """Tangent / side / normal frames along a path; `up` (N,3) approximate normals."""
    T = np.gradient(pts, axis=0)
    T = _norm(T)
    N = up - (up * T).sum(-1, keepdims=True) * T
    N = _norm(N)
    B = np.cross(T, N)
    return T, B, N

def _sweep(name, pts, up, profile, mat=None, parent=None, closed_profile=True, uv_scale=(1.0, 1.0),
           twist=None, cap_ends=True):
    """Sweep a 2D profile [(side, normal), ...] along pts with normals `up`.
    UV: u = arc length * uv_scale[0], v = profile index fraction."""
    pts = np.asarray(pts, float)
    up = np.asarray(up, float)
    T, B, N = _frames(pts, up)
    if twist is not None:
        ca, sa = np.cos(twist)[:, None], np.sin(twist)[:, None]
        B, N = ca * B + sa * N, -sa * B + ca * N
    prof = np.asarray(profile, float)
    m = len(prof)
    V = pts[:, None, :] + prof[None, :, 0:1] * B[:, None, :] + prof[None, :, 1:2] * N[:, None, :]
    n = len(pts)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    # faces: along path (i) x around profile (j)
    idx = np.arange(n * m).reshape(n, m)
    jm = m if closed_profile else m - 1
    nj = (np.arange(jm) + 1) % m
    a = idx[:-1, :jm]; b = idx[1:, :jm]; c = idx[1:][:, nj]; d = idx[:-1][:, nj]
    F = np.stack([a, d, c, b], -1).reshape(-1, 4)
    # uv per loop
    pl = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(np.vstack([prof, prof[:1]]), axis=0), axis=1))])
    U = np.repeat(s[:, None] * uv_scale[0], m, 1)
    Vv = np.repeat(pl[None, :m] * uv_scale[1], n, 0)
    uv = np.stack([U, Vv], -1).reshape(-1, 2)
    faces = F.tolist()
    luv = uv[F.ravel()]
    verts = V.reshape(-1, 3)
    if cap_ends and closed_profile:
        extra_v = []
        for end, sign in ((0, -1), (n - 1, 1)):
            c0 = len(verts) + len(extra_v)
            extra_v.append(pts[end])
            ring = idx[end]
            for j in range(m):
                k = (j + 1) % m
                tri = (c0, ring[j], ring[k]) if sign > 0 else (c0, ring[k], ring[j])
                faces.append(list(tri))
        verts = np.vstack([verts, np.array(extra_v)])
        luv = np.vstack([luv, np.zeros((2 * m * 3, 2))])
    return _mesh(name, verts, faces, mat=mat, parent=parent, loop_uv=luv)

def _stitch_mesh(name, rows, mat, parent=None, pitch=0.0032, duty=0.86, radius=0.00030, lift=0.00004,
                 sides=6, stations=7, flat=0.62):
    """Running stitches along surface polylines. rows: list of (pts (N,3), normals (N,3)).
    Each stitch is a little thread capsule arching out of / back into the cloth."""
    verts, faces, uvs = [], [], []
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    for pts, nrm in rows:
        pts = np.asarray(pts, float); nrm = np.asarray(nrm, float)
        if len(pts) < 2:
            continue
        P, Nn, L = _resample(pts, pitch / 8.0, nrm)
        if L < pitch:
            continue
        Nn = _norm(Nn)
        seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
        s = np.concatenate([[0], np.cumsum(seg)])
        nst = int(L / pitch)
        start = (L - nst * pitch) / 2
        for k in range(nst):
            s0 = start + k * pitch + pitch * (1 - duty) / 2
            ss = np.linspace(s0, s0 + pitch * duty, stations)
            C = np.stack([np.interp(ss, s, P[:, q]) for q in range(3)], -1)
            Nl = _norm(np.stack([np.interp(ss, s, Nn[:, q]) for q in range(3)], -1))
            T = _norm(C[-1] - C[0])[None, :].repeat(stations, 0)
            B = _norm(np.cross(Nl, T))
            Nq = np.cross(T, B)
            tau = np.linspace(0, 1, stations)
            arch = np.sin(np.pi * tau) ** 0.5
            r = radius * (0.35 + 0.65 * arch)
            h = lift + radius * flat * (arch - 0.55)
            base = len(verts)
            for i in range(stations):
                for j in range(sides):
                    v = C[i] + Nq[i] * (h[i] + r[i] * flat * np.sin(ang[j])) + B[i] * r[i] * np.cos(ang[j])
                    verts.append(v)
            for i in range(stations - 1):
                for j in range(sides):
                    jn = (j + 1) % sides
                    faces.append((base + i * sides + j, base + i * sides + jn,
                                  base + (i + 1) * sides + jn, base + (i + 1) * sides + j))
                    uvs.extend([(tau[i], j / sides), (tau[i], (j + 1) / sides),
                                (tau[i + 1], (j + 1) / sides), (tau[i + 1], j / sides)])
            # end caps (tiny fans)
            for end in (0, stations - 1):
                ci = len(verts)
                verts.append(C[end] + Nq[end] * h[end])
                for j in range(sides):
                    jn = (j + 1) % sides
                    a_, b_ = base + end * sides + j, base + end * sides + jn
                    faces.append((ci, b_, a_) if end == 0 else (ci, a_, b_))
                    uvs.extend([(0, 0), (0, 0), (0, 0)])
    if not verts:
        return None
    return _mesh(name, np.array(verts), faces, mat=mat, parent=parent, loop_uv=np.array(uvs))

# =================================================================== materials
def _nodes(m):
    return m.node_tree.nodes, m.node_tree.links

def _uvcoord(nt, scale=1.0, rot_deg=0.0, uvmap=None):
    nodes, links = nt.nodes, nt.links
    if uvmap:
        tc = nodes.new("ShaderNodeUVMap"); tc.uv_map = uvmap; out = tc.outputs["UV"]
    else:
        tc = nodes.new("ShaderNodeTexCoord"); out = tc.outputs["UV"]
    mp = nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    mp.inputs["Rotation"].default_value[2] = math.radians(rot_deg)
    links.new(out, mp.inputs["Vector"])
    return mp.outputs["Vector"]

def _wave(nt, vec, scale, direction="DIAGONAL", distortion=0.0, detail=0.0, profile="SIN", phase=0.0):
    w = nt.nodes.new("ShaderNodeTexWave")
    w.wave_type = "BANDS"
    w.bands_direction = direction
    w.wave_profile = profile
    w.inputs["Scale"].default_value = scale
    w.inputs["Distortion"].default_value = distortion
    w.inputs["Detail"].default_value = detail
    w.inputs["Phase Offset"].default_value = phase
    nt.links.new(vec, w.inputs["Vector"])
    return w.outputs["Fac"]

def _noise(nt, vec, scale, detail=3.0, rough=0.5, distortion=0.0):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    n.inputs["Distortion"].default_value = distortion
    if vec is not None:
        nt.links.new(vec, n.inputs["Vector"])
    return n.outputs["Fac"]

def _math(nt, op, a, b=None, clamp=False):
    m = nt.nodes.new("ShaderNodeMath")
    m.operation = op
    m.use_clamp = clamp
    for i, x in enumerate((a, b)):
        if x is None:
            continue
        if isinstance(x, (int, float)):
            m.inputs[i].default_value = x
        else:
            nt.links.new(x, m.inputs[i])
    return m.outputs[0]

def _mixf(nt, fac, a, b):
    m = nt.nodes.new("ShaderNodeMix")
    m.data_type = "FLOAT"
    for i, x in ((0, fac), (2, a), (3, b)):
        if isinstance(x, (int, float)):
            m.inputs[i].default_value = x
        else:
            nt.links.new(x, m.inputs[i])
    return m.outputs[0]

def _mixc(nt, fac, a, b, blend="MIX"):
    m = nt.nodes.new("ShaderNodeMix")
    m.data_type = "RGBA"
    m.blend_type = blend
    for i, x in ((0, fac), (6, a), (7, b)):
        if isinstance(x, (int, float)):
            m.inputs[i].default_value = x
        elif isinstance(x, tuple):
            m.inputs[i].default_value = x
        else:
            nt.links.new(x, m.inputs[i])
    return m.outputs[2]

def _bumpn(nt, height, strength, distance, normal=None):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height, b.inputs["Height"])
    if normal is not None:
        nt.links.new(normal, b.inputs["Normal"])
    return b.outputs["Normal"]

def _img(path, non_color=True):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color:
        im.colorspace_settings.name = "Non-Color"
    return im

_MAT_CACHE = {}
def _cached(key, fn):
    m = _MAT_CACHE.get(key)
    try:
        alive = m is not None and bpy.data.materials.get(m.name) == m
    except ReferenceError:                      # file was reset (read_factory_settings) since caching
        alive = False
    if not alive:
        m = fn()
        _MAT_CACHE[key] = m
    return m

def mat_twill(color, name=None, pitch=0.00068, uv_scale=1.0, sheen=0.55, gain=1.0):
    """Brushed cotton twill (caps): diagonal wales + yarn slub + fuzz sheen. Uses UVs in metres.
    Dead-matte (cotton has almost no specular lobe); sheen is tinted by the dye, not white."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_twill_{color}")
        base = _col(color, gain)
        lum = sum(base[:3]) / 3
        if lum > 0.6:                                  # undyed / bleached cotton albedo
            base = tuple(c * 0.93 for c in base[:3]) + (1,)
        dark = lum < 0.3
        vec = _uvcoord(nt, uv_scale)
        tw = _wave(nt, vec, 0.4443 / pitch, "DIAGONAL", distortion=2.2, detail=2.0)
        yarn = _noise(nt, vec, 1.0 / 0.0009, detail=3.0, rough=0.65)
        slub = _noise(nt, vec, 1.0 / 0.010, detail=2.0)
        slub2 = _math(nt, "MULTIPLY", slub, 0.6)
        # wales broken up by yarn noise so it never reads as carbon fibre
        twy = _math(nt, "MULTIPLY", tw, _math(nt, "ADD", _math(nt, "MULTIPLY", yarn, 0.9), 0.35))
        h = _math(nt, "ADD", _math(nt, "MULTIPLY", twy, 0.6), _math(nt, "MULTIPLY", yarn, 0.4))
        # colour: wale shading + slow mottling
        mot = _noise(nt, vec, 1.0 / 0.03, detail=2.0)
        cv = _mixf(nt, 0.6, twy, mot)
        lo = tuple(c * (0.87 if not dark else 0.72) for c in base[:3]) + (1,)
        hi = tuple(min(1, c * (1.03 if not dark else 1.22)) for c in base[:3]) + (1,)
        col = _mixc(nt, cv, lo, hi)
        nt.links.new(col, b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 1.0 if dark else 0.95
        b.inputs["Sheen Weight"].default_value = 0.2 if dark else sheen * 0.6
        b.inputs["Sheen Roughness"].default_value = 0.5
        b.inputs["Sheen Tint"].default_value = (tuple(min(1, c * 3.0 + 0.05) for c in base[:3]) + (1,)
                                                if dark else tuple(base[:3]) + (1,))
        b.inputs["Specular IOR Level"].default_value = 0.08 if dark else 0.2
        nt.links.new(_bumpn(nt, _math(nt, "ADD", h, slub2), 0.4 if dark else 0.6, 0.0004), b.inputs["Normal"])
        return m
    return _cached(("twill", color, name, pitch, gain), mk)

def mat_thread_acc(color, name=None, shine=0.45, gain=1.0):
    """Polyester thread for top-stitching: twisted ply bump along the stitch UV."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_thread_{color}")
        base = _col(color, gain)
        b.inputs["Base Color"].default_value = base
        b.inputs["Roughness"].default_value = shine
        b.inputs["Sheen Weight"].default_value = 0.4
        b.inputs["Sheen Tint"].default_value = tuple(min(1, c * 4 + 0.03) for c in base[:3]) + (1,)
        b.inputs["Specular IOR Level"].default_value = 0.3
        b.inputs["Sheen Roughness"].default_value = 0.3
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (6.0, 1.0, 1.0)
        nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
        tw = _wave(nt, mp.outputs["Vector"], 1.0, "DIAGONAL")
        nt.links.new(_bumpn(nt, tw, 0.5, 0.0002), b.inputs["Normal"])
        return m
    return _cached(("thread", color, name, shine, gain), mk)

# Brand cobalt #2B3BFF (Lab 39/62/-96) lies outside what AgX Medium High Contrast can display
# for any scene-linear input (its chroma tops out ~80; best reachable dE76 ~35, e.g. #2640C1).
# A full-strength blue albedo gets lit as brightly as the cloth and AgX rolls it off to
# periwinkle (#4570DF), so the pigment is deepened and green is zeroed: lit satin / ink then
# displays as a deep electric cobalt (~#2E3FC6), the closest the house transform can show and
# consistent with apparel.COBALT_INK.
COBALT_RENDER = (0.010, 0.0, 0.22, 1.0)

def _ink(color):
    if color in ("cobalt", "#2B3BFF", "#2b3bff"):
        return COBALT_RENDER
    return rgb(SWATCH.get(color, color))

def mat_satin(color="cobalt", name="acc_satin", pitch=0.0009, rot=0.0, tangent=True):
    """Rayon satin-stitch embroidery: parallel floss lines, glossy anisotropic sheen.
    Floss direction per face from the CORNER attribute `satin_ang` (radians, in UV space) + rot;
    optional `satin_t` attribute (object-space floss tangent) steers the anisotropic highlight."""
    def mk():
        m, nt, b = _c._new_mat(name)
        base = _ink(color)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["UV"], sep.inputs["Vector"])
        at = nt.nodes.new("ShaderNodeAttribute"); at.attribute_name = "satin_ang"
        ang = _math(nt, "ADD", at.outputs["Fac"], math.radians(rot))
        sa, ca = _math(nt, "SINE", ang), _math(nt, "COSINE", ang)
        # phase runs perpendicular to the floss: c = -u sin a + v cos a
        c = _math(nt, "SUBTRACT", _math(nt, "MULTIPLY", sep.outputs["Y"], ca),
                  _math(nt, "MULTIPLY", sep.outputs["X"], sa))
        jit = _noise(nt, tc.outputs["UV"], 300.0, 1.0)
        xx = _math(nt, "ADD", _math(nt, "DIVIDE", c, pitch / math.pi), _math(nt, "MULTIPLY", jit, 0.18))
        sn = _math(nt, "POWER", _math(nt, "ABSOLUTE", _math(nt, "SINE", xx)), 0.5)
        # per-thread tension / sheen variation
        var = _noise(nt, tc.outputs["UV"], 260.0, 2.0)
        col = _mixc(nt, sn, tuple(c_ * 0.42 for c_ in base[:3]) + (1,), base)
        col = _mixc(nt, _math(nt, "MULTIPLY", var, 0.25), col, tuple(c_ * 0.8 for c_ in base[:3]) + (1,))
        nt.links.new(col, b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.4
        b.inputs["Sheen Weight"].default_value = 0.45
        b.inputs["Sheen Roughness"].default_value = 0.3
        b.inputs["Sheen Tint"].default_value = tuple(base[:3]) + (1,)
        b.inputs["Anisotropic"].default_value = 0.7
        b.inputs["Specular IOR Level"].default_value = 0.28
        if tangent:
            tt = nt.nodes.new("ShaderNodeAttribute"); tt.attribute_name = "satin_t"
            vt = nt.nodes.new("ShaderNodeVectorTransform")
            vt.vector_type = "VECTOR"; vt.convert_from = "OBJECT"; vt.convert_to = "WORLD"
            nt.links.new(tt.outputs["Vector"], vt.inputs["Vector"])
            nt.links.new(vt.outputs["Vector"], b.inputs["Tangent"])
        nt.links.new(_bumpn(nt, sn, 0.8, 0.00035), b.inputs["Normal"])
        return m
    return _cached(("satin", color, name), mk)

def mat_metal(kind="nickel", name=None):
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_metal_{kind}")
        tint = {"nickel": (0.80, 0.80, 0.80, 1), "gunmetal": (0.28, 0.28, 0.30, 1),
                "brass": (0.78, 0.60, 0.33, 1)}[kind]
        b.inputs["Base Color"].default_value = tint
        b.inputs["Metallic"].default_value = 1.0
        b.inputs["Roughness"].default_value = 0.22
        b.inputs["Anisotropic"].default_value = 0.4
        n = _noise(nt, None, 4000.0, 2.0)
        nt.links.new(_bumpn(nt, n, 0.05, 0.0001), b.inputs["Normal"])
        return m
    return _cached(("metal", kind, name), mk)

def mat_hole(color, name=None):
    """What you see through an eyelet: the shaded inside of the crown."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_hole_{color}")
        base = _col(color)
        lum = sum(base[:3]) / 3
        k = 0.04 if lum > 0.3 else 0.3
        b.inputs["Base Color"].default_value = tuple(c * k for c in base[:3]) + (1,)
        b.inputs["Roughness"].default_value = 1.0
        return m
    return _cached(("hole", color, name), mk)

# =================================================================== text masks (PIL, cached on disk)
def _python3():
    for p in ("/usr/bin/python3", "/usr/local/bin/python3"):
        if os.path.exists(p):
            return p
    return "python3"

def text_mask(body="your logo", px_h=1024, pad=0.08, name="acc_logo_mask", blur=0):
    """White-on-black PNG of `body` in Archivo Expanded (tight-cropped + pad).
    Returns (path, aspect = width/height)."""
    path = os.path.join(TEX_DIR, f"{name}.png")
    meta = path + ".txt"
    if not (os.path.exists(path) and os.path.exists(meta)):
        code = f"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
f = ImageFont.truetype({_c.FONT_DISPLAY!r}, {px_h})
im = Image.new('L', ({px_h} * 8, {px_h} * 2), 0)
d = ImageDraw.Draw(im)
d.text(({px_h // 2}, {px_h // 4}), {body!r}, font=f, fill=255)
bb = im.getbbox()
im = im.crop(bb)
w, h = im.size
p = int({pad} * h)
out = Image.new('L', (w + 2 * p, h + 2 * p), 0)
out.paste(im, (p, p))
if {blur}:
    out = out.filter(ImageFilter.GaussianBlur({blur}))
out.save({path!r})
open({meta!r}, 'w').write(str(out.size[0] / out.size[1]))
"""
        os.makedirs(TEX_DIR, exist_ok=True)
        subprocess.run([_python3(), "-c", code], check=True)
    aspect = float(open(meta).read())
    return path, aspect

def _uv_planar(obj, axes=(0, 1), scale=1.0):
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    vi = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get("vertex_index", vi)
    uv = co[vi][:, list(axes)] * scale
    me.uv_layers[0].data.foreach_set("uv", uv.astype(np.float32).ravel())

def _all_mesh_points(root, stride=1, evaluated=True):
    """World-space vertex positions of root + all mesh descendants (modifiers applied by default)."""
    pts = []
    dg = bpy.context.evaluated_depsgraph_get() if evaluated else None
    for o in [root] + list(root.children_recursive):
        if o.type != "MESH":
            continue
        if evaluated:
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
        else:
            me = o.data
        n = len(me.vertices)
        co = np.empty(n * 3); me.vertices.foreach_get("co", co)
        if evaluated:
            oe.to_mesh_clear()
        co = co.reshape(-1, 3)[::stride]
        M = np.array(o.matrix_world)
        pts.append(co @ M[:3, :3].T + M[:3, 3])
    return np.vstack(pts)

def _rest(root, pts_local=None):
    """Drop root onto Z=0 and centre its footprint on the origin (world space)."""
    bpy.context.view_layer.update()
    P = _all_mesh_points(root, 3) if pts_local is None else pts_local
    lo, hi = P.min(0), P.max(0)
    root.location.x -= (lo[0] + hi[0]) / 2
    root.location.y -= (lo[1] + hi[1]) / 2
    root.location.z -= lo[2]
    bpy.context.view_layer.update()
    return root

# =================================================================== CAP
# real-world unstructured dad cap: head opening ~57 cm (0.188 x 0.164 ellipse),
# crown ~9 cm, pre-curved brim ~7 cm. Local frame: crown axis = Z, front = -Y.
CAP = dict(a=0.094, b=0.082, H=0.057, dy=0.010, drop=0.034, L=0.069, pitch=10.0,
           arch_w=math.radians(20.5), arch_t=0.355, t_top=0.982, thick=0.0018,
           beta_back=24.0, beta_front=36.0, k1_back=0.52, k1_front=0.70, k2=0.66,
           cave=0.011, puff=0.0007, groove=0.0006, curv=1.6)

def _cap_rim_z(th, P):
    return np.where(np.cos(th) > 0, -P["drop"] * np.sin(th) ** 2, -P["drop"])

_PROF = dict(beta_back=24.0, beta_front=36.0, k1_back=0.52, k1_front=0.70, k2=0.62)

def _crown_profile(th, t, Q=None):
    """Side profile of the crown as a cubic Bezier from the rim (h=1, z=0) to the apex (h=0, z=1).
    Low-profile dad cap: the front panels lean well back and roll into a flat top early."""
    Q = Q or _PROF
    f = 0.5 + 0.5 * np.cos(th)                       # 1 front .. 0 back
    beta = np.radians(Q["beta_back"] + (Q["beta_front"] - Q["beta_back"]) * f)   # wall lean from vertical
    k1 = Q["k1_back"] + (Q["k1_front"] - Q["k1_back"]) * f
    k2 = Q["k2"] + 0.0 * f
    u = t
    p0 = (1.0, 0.0); p1 = (1 - k1 * np.sin(beta), k1 * np.cos(beta)); p2 = (k2, 1.0); p3 = (0.0, 1.0)
    m = 1 - u
    h = m ** 3 * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u ** 3 * p3[0]
    z = m ** 3 * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u ** 3 * p3[1]
    return h, z

def _crown_base(th, t, P):
    th = np.asarray(th, float); t = np.clip(np.asarray(t, float), 0.0, 1.0)
    a, b, H, dy = P["a"], P["b"], P["H"], P["dy"]
    h, zf = _crown_profile(th, t, P)
    x = b * np.sin(th) * h
    y = -a * np.cos(th) * h + dy * (1 - h)
    z = _cap_rim_z(th, P) * (1 - zf) + H * zf
    return np.stack([x, y, z], -1)

def _crown(th, t, P, groove=True, wr_seed=0, front_soft=1.0):
    """Displaced crown surface -> (points, normals, d/dθ length, d/dt length)."""
    th = np.asarray(th, float); t = np.asarray(t, float)
    e = 1e-4
    B = _crown_base(th, t, P)
    Bth = (_crown_base(th + e, t, P) - _crown_base(th - e, t, P)) / (2 * e)
    Bt = (_crown_base(th, t + e, P) - _crown_base(th, t - e, P)) / (2 * e)
    N = _norm(np.cross(Bth, Bt))
    rh = np.linalg.norm(Bth, axis=-1)
    rt = np.linalg.norm(Bt, axis=-1)
    seg = np.pi / 3
    rel = np.mod(th + seg / 2, seg) - seg / 2
    u = np.mod(th, seg) / seg
    ds = np.abs(rel) * rh
    top_fade = 1 - _ss(0.88, 0.985, t)
    d = np.zeros(th.shape)
    gw = 1.0 if groove is True else (0.0 if groove is False else groove)
    if groove is not False:
        # shallow welt: the seam allowance folded under lifts the cloth a hair either side
        d += (-P["groove"] * np.exp(-(ds / 0.0014) ** 2) +
              0.00030 * np.exp(-((ds - 0.0034) / 0.0018) ** 2)) * top_fade * gw
    front = np.abs(np.cos(th / 2)) ** 8                      # ~1 on the two front panels
    puff_amp = P["puff"] * (1 - 0.3 * front * front_soft)
    d += puff_amp * np.sin(np.pi * u) ** 0.8 * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.65
    # unstructured crown: the front softly caves where it rolls into the top
    rs = np.random.RandomState(wr_seed)
    c0 = rs.uniform(-0.25, 0.25)
    d += -P["cave"] * np.exp(-((th - c0) / 0.75) ** 2) * np.exp(-((t - 0.74) / 0.12) ** 2)
    d += 0.0022 * np.exp(-((th - c0) / 0.9) ** 2) * np.exp(-((t - 0.45) / 0.12) ** 2)
    for _k in range(7):                                   # soft handling folds
        tc_, thc_ = rs.uniform(0.25, 0.85), rs.uniform(-np.pi, np.pi)
        ang_ = rs.uniform(-1.0, 1.0)
        amp_ = rs.uniform(0.0014, 0.0030) * (1 if rs.rand() < 0.75 else -0.6)
        dd = (np.angle(np.exp(1j * (th - thc_))) * np.cos(ang_) + (t - tc_) * 2.4 * np.sin(ang_))
        along = (np.angle(np.exp(1j * (th - thc_))) * -np.sin(ang_) + (t - tc_) * 2.4 * np.cos(ang_))
        d += -amp_ * 0.8 * np.exp(-(dd / 0.085) ** 2) * np.exp(-(along / 0.30) ** 2)
    # soft handling wrinkles
    flat = B.reshape(-1, 3)
    wr = (_noise3(flat, 14.0, wr_seed, 3) * 0.0026 + _noise3(flat, 45.0, wr_seed + 5, 2) * 0.0005)
    d += wr.reshape(th.shape) * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.8
    lf = P.get("logo_field")
    if lf is not None:
        # embroidery: the stitched area stiffens the cloth (seam welt pulled flat under the
        # letters) and puckers it in a soft ring just outside the satin
        X, Y = _logo_xy(th, t, P)
        flat_, pk_ = _bilerp(lf, X, Y)
        if groove is not False:
            gfix = (P["groove"] * np.exp(-(ds / 0.0014) ** 2) -
                    0.00030 * np.exp(-((ds - 0.0034) / 0.0018) ** 2)) * top_fade * gw
            d += gfix * flat_
        d += -0.00022 * pk_
    Pp = B + N * d[..., None]
    return Pp, N, rh, rt

def _logo_xy(th, t, P):
    """Crown (θ, t) -> flat logo-plane coords (X across, Y up the front meridian), metres."""
    ts, sv, rh_t, s_c = P["logo_s"]
    X = np.angle(np.exp(1j * th)) * np.interp(t, ts, rh_t)
    Y = np.interp(t, ts, sv) - s_c
    return X, Y

def _bilerp(lf, X, Y):
    x0, y0, dx, F1, F2 = lf
    gx = (X - x0) / dx; gy = (Y - y0) / dx
    ny, nx = F1.shape
    inside = (gx >= 0) & (gx < nx - 1) & (gy >= 0) & (gy < ny - 1)
    ix = np.clip(np.floor(gx).astype(int), 0, nx - 2); iy = np.clip(np.floor(gy).astype(int), 0, ny - 2)
    fx = np.clip(gx - ix, 0, 1); fy = np.clip(gy - iy, 0, 1)
    out = []
    for F in (F1, F2):
        v = (F[iy, ix] * (1 - fx) * (1 - fy) + F[iy, ix + 1] * fx * (1 - fy) +
             F[iy + 1, ix] * (1 - fx) * fy + F[iy + 1, ix + 1] * fx * fy)
        out.append(np.where(inside, v, 0.0))
    return out

def _blur2(A, sig_px):
    r = int(3 * sig_px) + 1
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig_px) ** 2); k /= k.sum()
    A = np.apply_along_axis(lambda m: np.convolve(np.pad(m, r, mode="edge"), k, "valid"), 1, A)
    A = np.apply_along_axis(lambda m: np.convolve(np.pad(m, r, mode="edge"), k, "valid"), 0, A)
    return A

def _logo_field(body, width, dx=0.00025, margin=0.008):
    """Rasterised logo coverage around the embroidery: (flatten-weight, pucker-ring) grids."""
    path, asp = text_mask(body, name="acc_logo_mask_emb", px_h=512, pad=0.08)
    im = bpy.data.images.load(path, check_existing=True)
    w_, h_ = im.size
    px = np.empty(w_ * h_ * 4, dtype=np.float32); im.pixels.foreach_get(px)
    M = px.reshape(h_, w_, 4)[..., 0]                    # row 0 = bottom
    bpy.data.images.remove(im)
    pad_px = int(0.08 * (h_ / 1.16))
    gw_px = w_ - 2 * pad_px                              # glyph bbox width in px
    mpp = width / gw_px                                  # metres per mask pixel
    hw, hh = w_ * mpp / 2, h_ * mpp / 2
    xs = np.arange(-hw - margin, hw + margin, dx); ys = np.arange(-hh - margin, hh + margin, dx)
    GX, GY = np.meshgrid(xs, ys)
    u = (GX + hw) / mpp; v = (GY + hh) / mpp
    ok = (u >= 0) & (u < w_ - 1) & (v >= 0) & (v < h_ - 1)
    cov = np.where(ok, M[np.clip(v.astype(int), 0, h_ - 1), np.clip(u.astype(int), 0, w_ - 1)], 0.0)
    near = np.clip(_blur2(cov, 0.0016 / dx) * 3.0, 0, 1)            # stiffened zone round the letters
    ring = np.clip(_blur2(cov, 0.0009 / dx) - _blur2(cov, 0.00025 / dx) * 1.6, 0, None)
    ring = ring / max(ring.max(), 1e-6)
    return (xs[0], ys[0], dx, near, ring)

def _arch_t0(th, P):
    W, T = P["arch_w"], P["arch_t"]
    dlt = np.abs(np.mod(th, 2 * np.pi) - np.pi)
    q = np.clip(dlt / W, 0, 1)
    return np.where(dlt < W, T * (1 - q ** 2.6) ** (1 / 2.6), 0.0)

def _t_at_height(th, zrel, P):
    """t where the crown base is `zrel` above its rim (per θ)."""
    th = np.atleast_1d(np.asarray(th, float))
    ts = np.linspace(0, 1, 801)
    out = np.empty(th.shape)
    for i, a in enumerate(th):
        _, z = _crown_profile(np.full_like(ts, a), ts, P)
        Hh = P["H"] - _cap_rim_z(np.array([a]), P)[0]
        out[i] = np.interp(zrel / Hh, z, ts)
    return out

def cap(color="Black", style="dad", seed=None, logo="your logo", logo_color="cobalt", brim=None):
    """6-panel cap. Returns root Empty (origin base centre, front -Y).
    style="dad": unstructured low-profile washed-twill dad cap (default).
    style="trucker": retro trucker — structured, taller foam-backed front (no centre seam),
    breathable mesh rear panels, no eyelets.
    brim: bill projection in metres (default CAP["L"] = 0.069; the kit slot may want ~0.055)."""
    P = dict(CAP)
    trucker = style == "trucker"
    if trucker:
        P.update(H=0.068, beta_front=13.0, beta_back=20.0, k1_front=0.55, k1_back=0.52, k2=0.70,
                 cave=0.0, puff=0.0004, drop=0.030)
    if brim is not None:
        P["L"] = float(brim)
    P["trucker"] = trucker
    sd = seed if seed is not None else (7 if color == "Black" else 19)
    _cap_logo_setup(P, logo, sd)
    top_root = _empty(f"Cap_{color}")
    root = _empty(f"Cap_{color}_tilt")              # resting tilt lives here; top_root stays free
    root.parent = top_root
    # black twill is ~3% reflectance, not #151515 (0.7%): match the apparel blacks on the goods page
    g_ = 1.8 if color == "Black" else 1.0
    m_tw = mat_twill(color, name=f"acc_cap_twill_{color}", gain=g_)
    m_band = mat_twill(color, name=f"acc_cap_band_{color}", pitch=0.0006, sheen=0.35, gain=g_ * 0.8)
    # tonal thread (dyed to match), so seams read by relief, not as grey dashes
    thr_c = {"Black": "#141414", "White": "#D9D7D0"}.get(color, color)
    m_th = mat_thread_acc(thr_c, name=f"acc_cap_thread_{color}", shine=0.55)
    parts = []

    # ---------------- crown
    nth, ntt = 720, 116
    th = -np.pi + np.arange(nth) * (2 * np.pi / nth)
    t0 = _arch_t0(th, P)
    k = np.linspace(0, 1, ntt)
    TH = np.repeat(th[:, None], ntt, 1)
    TT = t0[:, None] + (P["t_top"] - t0[:, None]) * (k[None, :] ** 1.0)
    Pc, Nc, RH, RT = _crown(TH, TT, P, wr_seed=sd)
    # uv: panel-local u (arc length from panel centre) x meridian arc length
    vlen = np.concatenate([np.zeros((nth, 1)), np.cumsum(np.linalg.norm(np.diff(Pc, axis=1), axis=-1), 1)], 1)
    F = _grid_faces(nth, ntt, closed_u=True)
    fth = TH.ravel()[F].mean(1)
    seg = np.pi / 3
    # face panel by centre angle (handle wrap at ±π)
    fth_c = np.angle(np.exp(1j * TH.ravel()[F]).mean(1))
    pan = np.floor(np.mod(fth_c, 2 * np.pi) / seg)
    thc = pan * seg + seg / 2
    rng = np.random.RandomState(sd)
    offs = rng.uniform(0, 0.01, (6, 2))
    vth = TH.ravel()[F]
    dth = np.angle(np.exp(1j * (vth - thc[:, None])))
    U = dth * RH.ravel()[F] + offs[pan.astype(int), 0][:, None]
    V = vlen.ravel()[F] + offs[pan.astype(int), 1][:, None]
    luv = np.stack([U, V], -1).reshape(-1, 2)
    # close the top with a fan (hidden under the button)
    verts = np.vstack([Pc.reshape(-1, 3), _crown(np.array([0.0]), np.array([1.0]), P)[0]])
    ci = len(verts) - 1
    top = np.arange(nth) * ntt + (ntt - 1)
    fan = [(top[i], top[(i + 1) % nth], ci) for i in range(nth)]
    faces = F.tolist() + [list(f) for f in fan]
    luv = np.vstack([luv, np.zeros((len(fan) * 3, 2))])
    crown = _mesh("CapCrown", verts, faces, mat=m_tw, parent=root, loop_uv=luv)
    so = crown.modifiers.new("Solidify", "SOLIDIFY")
    so.thickness = P["thick"]; so.offset = -1.0; so.use_even_offset = True
    so.use_rim = True
    parts.append(crown)

    # ---------------- top button (fabric covered)
    prof = [(0.0, 0.0), (0.0078, 0.0), (0.0087, 0.0012), (0.0086, 0.0027), (0.0074, 0.0043),
            (0.0050, 0.0054), (0.0024, 0.0059), (0.0, 0.0060)]
    btn = lathe("CapButton", prof, segments=64, mat=m_tw)
    apex = _crown(np.array([0.0]), np.array([1.0]), P)[0][0]
    btn.location = (apex[0], apex[1], apex[2] - 0.0012)
    btn.parent = root
    _uv_planar(btn, (0, 1))
    sub = btn.modifiers.new("Sub", "SUBSURF"); sub.levels = sub.render_levels = 1
    parts.append(btn)
    # six radial seams converge under the button: thread ring round its skirt
    ang = np.linspace(0, 2 * np.pi, 97)
    ring = np.stack([apex[0] + 0.0087 * np.cos(ang), apex[1] + 0.0087 * np.sin(ang),
                     np.full_like(ang, apex[2] - 0.0006)], -1)

    # ---------------- seam top-stitching (two rows per seam)
    rows = []
    apex_v = apex
    for kk in range(6):
        ths = kk * seg
        for side in (-1, 1):
            if abs(ths - np.pi) < 1e-6:
                ts = np.linspace(P["arch_t"] + 0.035, 0.985, 400)
            else:
                ts = np.linspace(0.045, 0.985, 400)
            _, _, rh0, _ = _crown(np.full_like(ts, ths), ts, P, wr_seed=sd)
            thr = ths + side * 0.0034 / np.maximum(rh0, 1e-4)
            pts, nr, _, _ = _crown(thr, ts, P, wr_seed=sd)
            ok = (np.abs(thr - ths) < math.radians(24)) & (np.linalg.norm(pts - apex_v, axis=1) > 0.0125)
            idx = np.where(ok)[0]
            if len(idx) > 3:
                # keep the first contiguous run
                br = np.where(np.diff(idx) > 1)[0]
                idx = idx[: br[0] + 1] if len(br) else idx
                rows.append((pts[idx], nr[idx]))
    # sweatband attachment stitch (~7 mm above the rim), skipping the strap opening
    thb = np.linspace(-np.pi, np.pi, 1400)
    keep = np.abs(np.abs(thb) - np.pi) > P["arch_w"] + 0.02
    thb = thb[keep]
    tb = _t_at_height(thb, 0.0068, P)
    pts, nr, _, _ = _crown(thb, tb, P, wr_seed=sd)
    # split into the single run (θ from -(π-W) .. (π-W))
    rows.append((pts, nr))
    # binding round the strap opening + its stitch row
    tha = np.linspace(np.pi - P["arch_w"], np.pi + P["arch_w"], 260)
    ta = _arch_t0(tha, P) + 1e-4
    ta[0] = ta[-1] = 0.0
    edge, en, _, _ = _crown(tha, ta, P, wr_seed=sd)
    Te = _norm(np.gradient(edge, axis=0))
    away = _norm(np.cross(en, Te))
    # make `away` point into the fabric (towards larger t / away from the opening)
    mid = len(edge) // 2
    if away[mid][2] < 0:
        away = -away
    bind_c = edge - en * (P["thick"] * 0.5) + away * 0.0004
    bind = _sweep("CapBinding", bind_c, en, [(0.0016 * math.cos(q), 0.0014 * math.sin(q))
                                              for q in np.linspace(0, 2 * np.pi, 10, endpoint=False)],
                  mat=m_tw, parent=root, uv_scale=(1.0, 0.004))
    parts.append(bind)
    bst = edge + away * 0.0042
    rows.append((bst[6:-6], en[6:-6]))

    # ---------------- eyelets (embroidered vent holes), one per panel
    m_eye = mat_satin(color if color != "Black" else "#1d1d1d", name=f"acc_eyelet_{color}", pitch=0.00045,
                      rot=90.0, tangent=False)
    m_hole = mat_hole(color)
    for kk in range(6):
        thc_ = kk * seg + seg / 2
        tc_ = 0.64
        _, _, rh0, rt0 = _crown(np.array([thc_]), np.array([tc_]), P, wr_seed=sd)
        nr_, na_ = 9, 48
        rr = np.linspace(0.00125, 0.0031, nr_)
        aa = np.linspace(0, 2 * np.pi, na_, endpoint=False)
        R, A = np.meshgrid(rr, aa)                      # (na, nr)
        X, Y = R * np.cos(A), R * np.sin(A)
        thg = thc_ + X / rh0[0]
        tg = tc_ + Y / rt0[0]
        pts, nr, _, _ = _crown(thg, tg, P, wr_seed=sd)
        q = (R - rr[0]) / (rr[-1] - rr[0])
        hgt = 0.00055 * np.sin(np.pi * q) ** 0.6 + 0.00006
        V3 = pts + nr * hgt[..., None]
        uv = np.stack([A / (2 * np.pi) * 0.0195, R], -1)
        _grid_obj(f"CapEyelet{kk}", V3, uv=uv, closed_u=True, mat=m_eye, parent=root)
        # the hole
        ah = np.linspace(0, 2 * np.pi, 24, endpoint=False)
        hx, hy = 0.0013 * np.cos(ah), 0.0013 * np.sin(ah)
        hp, hn, _, _ = _crown(thc_ + hx / rh0[0], tc_ + hy / rt0[0], P, wr_seed=sd)
        cpt, cn, _, _ = _crown(np.array([thc_]), np.array([tc_]), P, wr_seed=sd)
        hv = np.vstack([hp + hn * 0.00004, cpt + cn * 0.00004])
        hf = [(i, (i + 1) % 24, 24) for i in range(24)]
        _mesh(f"CapEyeHole{kk}", hv, hf, mat=m_hole, parent=root)

    n_crown_rows = len(rows)
    # ---------------- brim (pre-curved)
    a, b, L = P["a"], P["b"], P["L"]
    kcurv = P["drop"] / b ** 2
    tp = math.tan(math.radians(P["pitch"]))

    def brim_z(x, y):
        ye = -a * np.sqrt(np.clip(1 - (x / b) ** 2, 0, 1))
        f = ye - y
        fwd = np.where(f > 0, f, 0.0)
        # junction follows the head opening; further out the bill bends down harder across its width
        cv = 1 + (P["curv"] - 1) * np.clip(fwd / L, 0, 1.2) ** 0.8
        return -kcurv * x ** 2 * cv - tp * fwd - 0.00015 * np.sin(x * 40) * fwd / L

    phi = np.radians(np.linspace(-89.5, 89.5, 320))
    w = np.linspace(-0.12, 1.0, 44)
    PH, Wg = np.meshgrid(phi, w, indexing="ij")
    Ex, Ey = b * np.sin(PH), -a * np.cos(PH)
    cph = np.clip(np.cos(PH), 0, 1)
    Ox, Oy = b * 1.005 * np.sin(PH), -a * np.cos(PH) - L * cph ** 0.62
    bx, by = Ex + Wg * (Ox - Ex), Ey + Wg * (Oy - Ey)
    bz = brim_z(bx, by)
    Bp = np.stack([bx, by, bz], -1)
    # the bill's top faces the key light square-on: one notch less albedo so it reads as the same cloth
    m_brim = mat_twill(color, name=f"acc_cap_brim_{color}", gain=0.9 * g_)
    brim = _grid_obj("CapBrim", Bp, uv=np.stack([bx, by], -1), flip=True, mat=m_brim, parent=root)
    so = brim.modifiers.new("Solidify", "SOLIDIFY")
    so.thickness = 0.0042; so.offset = -1.0; so.use_even_offset = True
    bv = brim.modifiers.new("Bevel", "BEVEL")
    bv.width = 0.0017; bv.segments = 4; bv.limit_method = "ANGLE"; bv.angle_limit = math.radians(40)
    parts.append(brim)
    # parallel stitch rows following the outer edge
    phf = np.radians(np.linspace(-89.5, 89.5, 1400))
    cf = np.clip(np.cos(phf), 0, 1)
    O2 = np.stack([b * 1.005 * np.sin(phf), -a * np.cos(phf) - L * cf ** 0.62], -1)
    Tg = np.gradient(O2, axis=0)
    Nin = _norm(np.stack([-Tg[:, 1], Tg[:, 0]], -1))
    if (Nin[len(Nin) // 2] * (np.zeros(2) - O2[len(O2) // 2])).sum() < 0:
        Nin = -Nin
    for i in range(8):
        d_ = 0.0046 + i * 0.0062
        Q = O2 + Nin * d_
        inside = (Q[:, 0] / (b + 0.0045)) ** 2 + (Q[:, 1] / (a + 0.0045)) ** 2 > 1.0
        idx = np.where(inside)[0]
        if len(idx) < 10:
            continue
        br = np.where(np.diff(idx) > 1)[0]
        if len(br):
            runs = np.split(idx, br + 1)
            idx = max(runs, key=len)
        Q = Q[idx]
        z = brim_z(Q[:, 0], Q[:, 1])
        e = 1e-4
        gx = (brim_z(Q[:, 0] + e, Q[:, 1]) - brim_z(Q[:, 0] - e, Q[:, 1])) / (2 * e)
        gy = (brim_z(Q[:, 0], Q[:, 1] + e) - brim_z(Q[:, 0], Q[:, 1] - e)) / (2 * e)
        nrm = _norm(np.stack([-gx, -gy, np.ones_like(gx)], -1))
        rows.append((np.stack([Q[:, 0], Q[:, 1], z], -1), nrm))

    # ---------------- sweatband (inside)
    W = P["arch_w"]
    ths = np.linspace(-np.pi + W + 0.035, np.pi - W - 0.035, 420)
    kb = np.linspace(0, 1, 16)
    tbt = _t_at_height(ths, 0.031, P)
    THs = np.repeat(ths[:, None], 16, 1)
    TTs = tbt[:, None] * kb[None, :]
    Ps, Ns, RHs, _ = _crown(THs, TTs, P, wr_seed=sd)
    Ps = Ps - Ns * (P["thick"] + 0.0003)
    Ps[:, 0, 2] -= 0.0004
    uvs = np.stack([THs * 0.085, TTs * 0.04], -1)
    band = _grid_obj("CapSweatband", Ps, uv=uvs, mat=m_band, parent=root)
    so = band.modifiers.new("Solidify", "SOLIDIFY"); so.thickness = 0.0011; so.offset = 1.0
    parts.append(band)

    # ---------------- back strap + metal slider
    def rim_pt(thv, inset):
        x = (b - inset) * np.sin(thv); y = -(a - inset) * np.cos(thv)
        return np.stack([x, y, np.full_like(thv, -P["drop"])], -1)
    tht = np.linspace(np.pi - W - 0.13, np.pi + W + 0.13, 160)
    sp = rim_pt(tht, P["thick"] + 0.0011)
    sp[:, 2] += 0.0112
    radial = _norm(np.stack([np.sin(tht) / b, -np.cos(tht) / a, np.zeros_like(tht)], -1))
    def rrect(wd, th_, r, n=4):
        pts_ = []
        for cx, cy, a0 in ((wd / 2 - r, th_ / 2 - r, 0), (-wd / 2 + r, th_ / 2 - r, 90),
                           (-wd / 2 + r, -th_ / 2 + r, 180), (wd / 2 - r, -th_ / 2 + r, 270)):
            for q in np.linspace(0, 90, n):
                aq = math.radians(a0 + q)
                pts_.append((cx + r * math.cos(aq), cy + r * math.sin(aq)))
        return pts_
    strap = _sweep("CapStrap", sp, radial, rrect(0.0205, 0.0017, 0.0007), mat=m_tw, parent=root,
                   uv_scale=(1.0, 1.0))
    parts.append(strap)
    # tail layer over the strap from the slider towards +x side
    th_sl = np.pi - 0.06
    tt = np.linspace(th_sl - 0.012, th_sl - 0.012 - 0.25, 50)
    tp_ = rim_pt(tt, P["thick"] + 0.0011 - 0.0018)
    tp_[:, 2] += 0.0112
    rad_t = _norm(np.stack([np.sin(tt) / b, -np.cos(tt) / a, np.zeros_like(tt)], -1))
    tail = _sweep("CapStrapTail", tp_, rad_t, rrect(0.0195, 0.0016, 0.0007), mat=m_tw, parent=root)
    parts.append(tail)
    # stitch rows along the strap edges (outer face)
    for zoff in (-0.0082, 0.0082):
        q_ = sp.copy(); q_[:, 2] += zoff
        rows.append((q_ + radial * 0.00085, radial))
        q2 = tp_.copy(); q2[:, 2] += zoff * 0.95
        rows.append((q2[4:] + rad_t[4:] * 0.0008, rad_t[4:]))
    # slider: rounded rectangular frame + centre bar
    c_sl = rim_pt(np.array([th_sl]), P["thick"] + 0.0011 - 0.0034)[0]
    c_sl[2] += 0.0112
    rad_s = _norm(np.array([np.sin(th_sl) / b, -np.cos(th_sl) / a, 0.0]))
    tan_s = _norm(np.cross(np.array([0, 0, 1.0]), rad_s))
    m_met = mat_metal("gunmetal" if color == "Black" else "nickel")
    fw, fh, fr = 0.0105, 0.0262, 0.0022
    loop = []
    for cx, cy, a0 in ((fw / 2 - fr, fh / 2 - fr, 0), (-fw / 2 + fr, fh / 2 - fr, 90),
                       (-fw / 2 + fr, -fh / 2 + fr, 180), (fw / 2 - fr, -fh / 2 + fr, 270)):
        for q in np.linspace(0, 90, 7)[:-1]:
            aq = math.radians(a0 + q)
            loop.append((cx + fr * math.cos(aq), cy + fr * math.sin(aq)))
    loop = np.array(loop)
    lp3 = c_sl[None, :] + loop[:, 0:1] * tan_s[None, :] + loop[:, 1:2] * np.array([0, 0, 1.0])[None, :]
    lp3 = np.vstack([lp3, lp3[:1]])
    wire = [(0.0011 * math.cos(q), 0.0008 * math.sin(q)) for q in np.linspace(0, 2 * np.pi, 10, endpoint=False)]
    upv = np.repeat(rad_s[None, :], len(lp3), 0)
    slider = _sweep("CapSlider", lp3, upv, wire, mat=m_met, parent=root, cap_ends=False)
    parts.append(slider)
    bar = np.stack([c_sl + np.array([0, 0, z]) for z in np.linspace(-fh / 2 + 0.0012, fh / 2 - 0.0012, 12)])
    _sweep("CapSliderBar", bar + rad_s * 0.0002, np.repeat(rad_s[None, :], 12, 0), wire, mat=m_met, parent=root)

    # ---------------- raised satin embroidery on the front panels
    if logo:
        emb = _cap_logo(P, logo, logo_color, root, sd)
        parts.append(emb)

    # crown top-stitching sits sunk into the twill (no beaded silhouette); bill/strap rows a hair heavier
    _stitch_mesh("CapStitches", rows[:n_crown_rows], m_th, parent=root, pitch=0.0030, radius=0.00022,
                 lift=-0.0001)
    stitches = _stitch_mesh("CapStitchesBrim", rows[n_crown_rows:], m_th, parent=root, pitch=0.0031,
                            radius=0.00028, lift=-0.00003)
    stitches_ring = _stitch_mesh("CapButtonStitch", [(ring, np.repeat([[0, 0, 1.0]], len(ring), 0))], m_th,
                                 parent=root, pitch=0.0026, radius=0.0003)

    # ---------------- rest pose: tilt about X so brim tips and back rim both touch the table
    bpy.context.view_layer.update()
    pts = _all_mesh_points(root, 2)
    def tilt(al):
        ca, sa = math.cos(al), math.sin(al)
        y = pts[:, 1] * ca - pts[:, 2] * sa
        z = pts[:, 1] * sa + pts[:, 2] * ca
        return z[y < -0.02].min() - z[y > 0.02].min()
    lo_, hi_ = math.radians(-30), math.radians(30)
    for _ in range(40):
        mid = (lo_ + hi_) / 2
        if tilt(lo_) * tilt(mid) <= 0:
            hi_ = mid
        else:
            lo_ = mid
    root.rotation_euler = ((lo_ + hi_) / 2, 0, 0)
    _rest(top_root)
    return top_root

def _text_flat_mesh(body, width, max_edge=0.0011, name="txt"):
    """Text as a dense flat triangle mesh in XY (centred), scaled to `width`.
    Returns (verts (N,2), faces, boundary-distance per vert)."""
    o = text(body, FONT_DISPLAY, size=0.05, extrude=0.0, name=name)
    me = o.data
    bm = bmesh.new(); bm.from_mesh(me)
    bpy.data.objects.remove(o, do_unlink=True)
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    sc = width / (max(xs) - min(xs))
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    for v in bm.verts:
        v.co.x = (v.co.x - cx) * sc; v.co.y = (v.co.y - cy) * sc; v.co.z = 0
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.triangulate(bm, faces=bm.faces, quad_method="BEAUTY", ngon_method="BEAUTY")
    for _ in range(10):
        long_e = [e for e in bm.edges if e.calc_length() > max_edge]
        if not long_e:
            break
        bmesh.ops.subdivide_edges(bm, edges=long_e, cuts=1, use_grid_fill=False)
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3])
    bmesh.ops.beautify_fill(bm, faces=bm.faces, edges=bm.edges)
    # boundary distance via KD-tree on densely sampled boundary edges
    from mathutils import kdtree
    bpts = []
    for e in bm.edges:
        if e.is_boundary:
            a_, b_ = e.verts[0].co, e.verts[1].co
            n = max(2, int((b_ - a_).length / 0.00008))
            for i in range(n):
                bpts.append(a_.lerp(b_, i / n))
    kd = kdtree.KDTree(len(bpts))
    for i, p in enumerate(bpts):
        kd.insert(p, i)
    kd.balance()
    bm.verts.ensure_lookup_table()
    V = np.array([(v.co.x, v.co.y) for v in bm.verts])
    D = np.array([0.0 if v.is_boundary else kd.find(v.co)[2] for v in bm.verts])
    Fc = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    return V, Fc, D

CAP_LOGO_W = 0.068          # embroidery width on the front panels (m)
CAP_LOGO_SC = 0.031         # height of the logo centre up the front meridian (arc length, m)

def _cap_logo_setup(P, body, sd):
    """Arc-length table of the front meridian + embroidery field (call before building the crown)."""
    ts = np.linspace(0.0, 0.97, 700)
    pts, _, rh, _ = _crown(np.zeros_like(ts), ts, P, groove=False, wr_seed=sd)
    sv = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))])
    P["logo_s"] = (ts, sv, rh, CAP_LOGO_SC)
    if body:
        P["logo_field"] = _logo_field(body, CAP_LOGO_W)

def _cap_logo(P, body, color, root, sd):
    """Raised satin-stitch embroidery: pillowed letters stitched straight across the centre seam,
    floss direction set per stroke (across the column) like a digitised satin file."""
    V, Fc, D = _text_flat_mesh(body, CAP_LOGO_W, max_edge=0.0006, name="cap_logo_txt")
    ts, sv, rh_t, s_c = P["logo_s"]
    t = np.interp(s_c + V[:, 1], sv, ts)
    th = V[:, 0] / np.interp(t, ts, rh_t)
    Pp, N, _, _ = _crown(th, t, P, groove=False, wr_seed=sd)
    # pillow cross-section: ~0.7 mm puff over the column, 0.3 mm underlay plateau
    wdt = 0.0009
    q = np.clip(D / wdt, 0, 1)
    h = 0.00030 * np.clip(D / 0.00025, 0, 1) ** 0.5 + 0.00042 * np.sqrt(1 - (1 - q) ** 2)
    X = Pp + N * (h - 0.00004)[:, None]
    Fa = np.array(Fc)
    # ---- per-face floss direction: across the stroke = along grad(D); 4 digitiser angles
    p0, p1, p2 = V[Fa[:, 0]], V[Fa[:, 1]], V[Fa[:, 2]]
    e1, e2 = p1 - p0, p2 - p0
    d1, d2 = D[Fa[:, 1]] - D[Fa[:, 0]], D[Fa[:, 2]] - D[Fa[:, 0]]
    det = e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]
    det = np.where(np.abs(det) < 1e-14, 1e-14, det)
    gx = (d1 * e2[:, 1] - d2 * e1[:, 1]) / det
    gy = (d2 * e1[:, 0] - d1 * e2[:, 0]) / det
    ang2 = np.stack([np.cos(2 * np.arctan2(gy, gx)), np.sin(2 * np.arctan2(gy, gx))], -1)
    # trust faces near the column edges (clean gradient), not the medial axis (gradient ~0 / flips)
    ang2 *= (np.hypot(gx, gy) * np.clip(1 - D[Fa].mean(1) / 0.0012, 0.05, 1))[:, None]
    # smooth over vertex-sharing neighbours (so serifs / joins don't salt-and-pepper)
    nv = len(V)
    def vsmooth(fv, it):
        for _ in range(it):
            acc_ = np.zeros((nv, fv.shape[1])); cnt = np.zeros(nv)
            for k in range(3):
                np.add.at(acc_, Fa[:, k], fv); np.add.at(cnt, Fa[:, k], 1)
            fv = 0.3 * fv + 0.7 * (acc_ / np.maximum(cnt, 1)[:, None])[Fa].mean(1)
        return fv
    ang2 = vsmooth(ang2, 40)
    a = 0.5 * np.arctan2(ang2[:, 1], ang2[:, 0])                    # floss direction (rad)
    qb = np.mod(np.round(a / (np.pi / 4)), 4).astype(int)           # 0 / 45 / 90 / 135 deg columns
    # majority filter so each column segment is one clean patch
    for _ in range(6):
        oh = np.eye(4)[qb]
        qb = np.argmax(vsmooth(oh, 2), 1)
    a = qb * (np.pi / 4)
    luv = V[Fa.ravel()]
    m = mat_satin(color, name=f"acc_cap_satin_{color}")
    o = _mesh("CapEmbroidery", X, Fc, mat=m, parent=root, loop_uv=luv)
    me = o.data
    at = me.attributes.new("satin_ang", "FLOAT", "CORNER")
    at.data.foreach_set("value", np.repeat(a, 3).astype(np.float32))
    # world-ish floss tangent for the anisotropic sheen (local frame of the crown at each face)
    Xf = X[Fa]
    t_th = Xf[:, 1] - Xf[:, 0]; t_tv = Xf[:, 2] - Xf[:, 0]
    # map the 2D direction through the face's affine map (uv -> 3D)
    M2 = np.stack([e1, e2], 1)                                       # (F,2,2) rows: e1,e2 in uv
    dirv = np.stack([np.cos(a), np.sin(a)], -1)
    try:
        co = np.linalg.solve(np.transpose(M2, (0, 2, 1)), dirv[..., None])[..., 0]
    except np.linalg.LinAlgError:
        co = np.zeros_like(dirv); co[:, 0] = 1
    T3 = _norm(co[:, 0:1] * t_th + co[:, 1:2] * t_tv)
    tg = me.attributes.new("satin_t", "FLOAT_VECTOR", "CORNER")
    tg.data.foreach_set("vector", np.repeat(T3, 3, 0).astype(np.float32).ravel())
    return o


# =================================================================== scene helpers (no side effects on import)
def shadow_footprint(objs, lights=("Key",), stride=6, soft=0.6):
    """Points on Z=0 covering the cast shadows (umbra + area-light penumbra) of `objs`, so
    frame_camera can keep the shadow-catcher alpha inside the frame (no hard cut at the border)."""
    pts = np.vstack([_all_mesh_points(o, stride) for o in objs])
    pts = pts[pts[:, 2] > 0.002]
    out = [pts * np.array([1, 1, 0])]
    for ln in lights:
        lo = bpy.data.objects.get(ln)
        if lo is None or lo.type != "LIGHT":
            continue
        L = np.array(lo.location)
        h = pts[:, 2:3]
        k = h / np.maximum(L[2] - h, 1e-3)
        S = pts + (pts - L) * k
        r = (max(lo.data.size, lo.data.size_y if lo.data.shape in ("RECTANGLE", "ELLIPSE") else 0) * 0.5 *
             k[:, 0] * soft)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            Q = S.copy(); Q[:, 0] += dx * r; Q[:, 1] += dy * r; Q[:, 2] = 0
            out.append(Q)
    return np.vstack(out)

def border_alpha(path, band=2):
    """Max alpha (0..1) on the outer `band` pixels of a rendered RGBA image (Blender-side check)."""
    im = bpy.data.images.load(path, check_existing=False)
    w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(px)
    a = px.reshape(h, w, 4)[..., 3]
    bpy.data.images.remove(im)
    return dict(left=float(a[:, :band].max()), right=float(a[:, -band:].max()),
                bottom=float(a[:band].max()), top=float(a[-band:].max()))

def fade_border(path, px=64):
    """Feather the shadow-catcher alpha to exactly 0 over the outer `px` pixels (ImageMagick,
    16-bit safe), so a cut-out never carries a straight shadow edge. Subjects are framed with
    >= 8% padding, so only shadow pixels live in this band."""
    import shutil
    if not shutil.which("convert"):
        print("[acc] fade_border: ImageMagick not found, skipped"); return path
    w, h = bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y
    pc = bpy.context.scene.render.resolution_percentage / 100.0
    w, h = int(w * pc), int(h * pc)
    k = max(4, int(px * pc))
    mask = path + ".fade.png"
    subprocess.run(["convert", "-size", f"{w - 2 * k}x{h - 2 * k}", "xc:white", "-bordercolor", "black",
                    "-border", str(k), "-blur", f"0x{k / 3.2:.1f}", "-level", "3%,100%", "-depth", "16", mask], check=True)
    tmp = path + ".tmp.png"
    subprocess.run(["convert", path, "(", "+clone", "-alpha", "extract", mask, "-compose", "multiply",
                    "-composite", ")", "-alpha", "off", "-compose", "copy_opacity", "-composite",
                    "-depth", "16" if not _c.PREVIEW else "8", tmp], check=True)
    os.replace(tmp, path)
    os.remove(mask)
    return path

def frame_camera(objs_or_pts, az_deg=30.0, el_deg=32.0, lens=85.0, pad=0.08, target_shift=(0, 0, 0),
                 aspect=1.0, fstop=None):
    """Product camera at azimuth/elevation (az 0 = looking from -Y) that frames the given
    objects (or (N,3) points) with `pad` margin on the tighter axis."""
    from bpy_extras.object_utils import world_to_camera_view
    if isinstance(objs_or_pts, np.ndarray):
        pts = objs_or_pts
    else:
        pts = np.vstack([_all_mesh_points(o, 4) if o.type == "EMPTY" else _all_mesh_points(o, 4)
                         for o in objs_or_pts])
    c = Vector(((pts.min(0) + pts.max(0)) / 2).tolist()) + Vector(target_shift)
    az, el = math.radians(az_deg), math.radians(el_deg)
    dirv = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam = camera(loc=c + dirv * 1.0, target=c, lens=lens)
    scene = bpy.context.scene
    sub = pts[:: max(1, len(pts) // 6000)]
    PV = [Vector(p) for p in sub]
    dist = 1.0
    for _ in range(14):
        cam.location = c + dirv * dist
        look_at(cam, c)
        bpy.context.view_layer.update()
        uv = [world_to_camera_view(scene, cam, p) for p in PV]
        us = [q.x for q in uv]; vs = [q.y for q in uv]
        umin, umax, vmin, vmax = min(us), max(us), min(vs), max(vs)
        # recentre the target on the bbox in screen space
        du, dv = (umin + umax) / 2 - 0.5, (vmin + vmax) / 2 - 0.5
        R = cam.matrix_world.to_3x3()
        half_w = dist * 18.0 / lens
        c = c + R @ Vector((du * 2 * half_w, dv * 2 * half_w / aspect, 0))
        ext = max((umax - umin), (vmax - vmin))
        dist *= ext / (1 - 2 * pad)
    cam.location = c + dirv * dist
    look_at(cam, c)
    if fstop:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = dist
        cam.data.dof.aperture_fstop = fstop
    return cam

# =================================================================== TOTE
TOTE = dict(W=0.38, D=0.10, H=0.40, rc=0.010, hem=0.032, handle_dx=0.066, strap_w=0.028, strap_t=0.0025)

DENIM_BASE = {"Natural": "#DDC48F"}   # undyed ecru: warmer/yellower than the UI swatch so it separates from White

def mat_denim(color, name=None, pitch=0.00135, print_mask=None, print_rect=None, ink="cobalt"):
    """Bull denim: steep 3x1 twill wales, vertical warp streaks/slubs, tonal flecks; dead-matte
    cotton (no plastic sheen). UV in metres (u across, v up). Optional plastisol screen print
    from a mask image: the weave telegraphs through the ink film."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_denim_{color}")
        base = _col(DENIM_BASE.get(color, color))
        lum = sum(base[:3]) / 3
        if lum > 0.6:
            base = tuple(c * 0.93 for c in base[:3]) + (1,)
        dark = lum < 0.3
        tc = nt.nodes.new("ShaderNodeTexCoord")
        uv = tc.outputs["UV"]
        # twill: bands at ~63 deg
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Rotation"].default_value[2] = math.radians(27)
        nt.links.new(uv, mp.inputs["Vector"])
        tw0 = _wave(nt, mp.outputs["Vector"], 0.31416 / pitch, "X", distortion=2.6, detail=3.0)
        # warp slubs: noise stretched vertically
        ms = nt.nodes.new("ShaderNodeMapping")
        ms.inputs["Scale"].default_value = (1 / 0.0016, 1 / 0.035, 1.0)
        nt.links.new(uv, ms.inputs["Vector"])
        slub = _noise(nt, ms.outputs["Vector"], 1.0, detail=3.0, rough=0.6)
        # broad warp streaks (1-3 cm bands running up the bag)
        mw = nt.nodes.new("ShaderNodeMapping")
        mw.inputs["Scale"].default_value = (1 / 0.022, 1 / 0.35, 1.0)
        nt.links.new(uv, mw.inputs["Vector"])
        streak = _noise(nt, mw.outputs["Vector"], 1.0, detail=4.0, rough=0.6, distortion=0.6)
        fine = _noise(nt, uv, 1 / 0.0007, detail=2.0)
        # irregular yarn: wale depth modulated by slubs + fine fibre noise
        tw = _math(nt, "MULTIPLY", tw0, _math(nt, "ADD", _math(nt, "MULTIPLY", slub, 0.8), 0.45))
        h = _math(nt, "ADD", _math(nt, "MULTIPLY", tw, 0.75), _math(nt, "MULTIPLY", fine, 0.25))
        h = _math(nt, "ADD", h, _math(nt, "MULTIPLY", slub, 0.25))
        # colour
        mot = _noise(nt, uv, 1 / 0.05, detail=2.0)
        cv = _mixf(nt, 0.55, _mixf(nt, 0.5, tw, slub), mot)
        k_lo = 0.84 if not dark else 0.78
        k_hi = 1.03 if not dark else 1.2
        lo = tuple(c * k_lo for c in base[:3]) + (1,)
        hi = tuple(min(1, c * k_hi) for c in base[:3]) + (1,)
        col = _mixc(nt, cv, lo, hi)
        # +-7% value along the warp streaks
        sk = _math(nt, "ADD", _math(nt, "MULTIPLY", _math(nt, "SUBTRACT", streak, 0.5), 0.17), 1.0)
        col = _mixc(nt, 1.0, col, _c_vec(nt, sk), blend="MULTIPLY")
        if color == "Natural":                          # cotton-seed flecks in undyed ecru
            vor = nt.nodes.new("ShaderNodeTexVoronoi")
            vor.inputs["Scale"].default_value = 210.0
            nt.links.new(uv, vor.inputs["Vector"])
            fl = _math(nt, "LESS_THAN", vor.outputs["Distance"], 0.06)
            fn = _noise(nt, uv, 40.0, 1.0)
            fl = _math(nt, "MULTIPLY", fl, _math(nt, "GREATER_THAN", fn, 0.5))
            col = _mixc(nt, _math(nt, "MULTIPLY", fl, 0.9), col, (0.06, 0.045, 0.025, 1))
        sheen_tint = tuple(min(1, c * (1.0 if not dark else 4.0) + (0 if not dark else 0.03)) for c in base[:3]) + (1,)
        bump_s = _math(nt, "MULTIPLY", h, 1.0)
        if print_mask:
            path, rect = print_mask, print_rect             # rect = (u0, v0, w, h)
            mpp = nt.nodes.new("ShaderNodeMapping")
            mpp.inputs["Scale"].default_value = (1 / rect[2], 1 / rect[3], 1)
            mpp.inputs["Location"].default_value = (0.5 - rect[0] / rect[2], 0.5 - rect[1] / rect[3], 0)
            nt.links.new(uv, mpp.inputs["Vector"])
            it = nt.nodes.new("ShaderNodeTexImage")
            it.image = _img(path)
            it.extension = "CLIP"
            it.interpolation = "Cubic"
            nt.links.new(mpp.outputs["Vector"], it.inputs["Vector"])
            # ragged ink edge where it bridges the twill valleys
            rough_e = _math(nt, "ADD", it.outputs["Color"], _math(nt, "MULTIPLY", _math(nt, "SUBTRACT", tw, 0.5), 0.16))
            mk_ = nt.nodes.new("ShaderNodeMapRange")
            mk_.inputs["From Min"].default_value = 0.42
            mk_.inputs["From Max"].default_value = 0.58
            nt.links.new(rough_e, mk_.inputs["Value"])
            mask = mk_.outputs["Result"]
            ink_c = _ink(ink)
            if ink == "cobalt":                           # plastisol on sunlit cotton: deeper pigment load
                ink_c = tuple(c_ * 0.66 for c_ in ink_c[:3]) + (1,)
            # the weave telegraphs through the film: ink x (1 - 0.25 * twill height)
            tfac = _math(nt, "SUBTRACT", 1.0, _math(nt, "MULTIPLY", _math(nt, "MINIMUM", tw, 1.0), 0.25))
            ink_col = _mixc(nt, 1.0, ink_c, _c_vec(nt, tfac), blend="MULTIPLY")
            col = _mixc(nt, mask, col, ink_col)
            # ink partly fills the twill + has its own film thickness
            flat = _mixf(nt, mask, h, _math(nt, "MULTIPLY", h, 0.55))
            bump_s = _math(nt, "ADD", flat, _math(nt, "MULTIPLY", mask, 0.5))
            nt.links.new(_mixf(nt, mask, 0.97, 0.6), b.inputs["Roughness"])
            nt.links.new(_mixf(nt, mask, 0.3, 0.06), b.inputs["Sheen Weight"])
            nt.links.new(_mixf(nt, mask, 0.15, 0.25), b.inputs["Specular IOR Level"])
        else:
            b.inputs["Roughness"].default_value = 0.97
            b.inputs["Sheen Weight"].default_value = 0.3
            b.inputs["Specular IOR Level"].default_value = 0.15
        nt.links.new(col, b.inputs["Base Color"])
        b.inputs["Sheen Roughness"].default_value = 0.45
        b.inputs["Sheen Tint"].default_value = sheen_tint
        nt.links.new(_bumpn(nt, bump_s, 0.68, 0.0006), b.inputs["Normal"])
        return m
    return _cached(("denim", color, name, print_mask), mk)

def _c_vec(nt, fac):
    """Grey RGBA from a float socket (for MULTIPLY mixes)."""
    cc = nt.nodes.new("ShaderNodeCombineColor")
    for i in range(3):
        nt.links.new(fac, cc.inputs[i])
    return cc.outputs[0]

def _tote_perim(p, T):
    """Rounded-rectangle perimeter (front centre p=0, counter-clockwise from above).
    -> x, y, nx, ny, panel(0 front, 1 right, 2 back, 3 left)"""
    hx, hy, r = T["W"] / 2, T["D"] / 2, T["rc"]
    sx, sy = hx - r, hy - r
    segs = [("L", (0, -hy), (sx, -hy)), ("A", (sx, -sy), -90), ("L", (hx, -sy), (hx, sy)), ("A", (sx, sy), 0),
            ("L", (sx, hy), (-sx, hy)), ("A", (-sx, sy), 90), ("L", (-hx, sy), (-hx, -sy)), ("A", (-sx, -sy), 180),
            ("L", (-sx, -hy), (0, -hy))]
    lens = [sx, r * np.pi / 2, 2 * sy, r * np.pi / 2, 2 * sx, r * np.pi / 2, 2 * sy, r * np.pi / 2, sx]
    pan_of = [0, 0, 1, 1, 2, 2, 3, 3, 0]
    Ltot = sum(lens)
    p = np.mod(np.asarray(p, float), Ltot)
    x = np.zeros_like(p); y = np.zeros_like(p); nx = np.zeros_like(p); ny = np.zeros_like(p)
    pan = np.zeros(p.shape, dtype=int)
    acc_ = 0.0
    for (kind, a_, b_), L_, pn in zip(segs, lens, pan_of):
        msk = (p >= acc_) & (p <= acc_ + L_ + 1e-12)
        q = (p[msk] - acc_) / L_
        if kind == "L":
            x[msk] = a_[0] + (b_[0] - a_[0]) * q; y[msk] = a_[1] + (b_[1] - a_[1]) * q
            tx, ty = (b_[0] - a_[0]), (b_[1] - a_[1]); tl = math.hypot(tx, ty)
            nx[msk], ny[msk] = ty / tl, -tx / tl
        else:
            ang = np.radians(b_ + 90 * q)
            x[msk] = a_[0] + r * np.cos(ang); y[msk] = a_[1] + r * np.sin(ang)
            nx[msk], ny[msk] = np.cos(ang), np.sin(ang)
        pan[msk] = pn
        acc_ += L_
    return x, y, nx, ny, pan, Ltot

def _tote_body(p, z, T, k):
    """Deformed bag wall point for perimeter coord p and height z (arrays). k = per-bag knobs.
    Every term is continuous around the perimeter (front/back vs gusset weights blend through
    the rounded corners), so the front panel, gusset and back stay one sewn tube with one rim."""
    p = np.asarray(p, float); z = np.asarray(z, float)
    x, y, nx, ny, pan, _ = _tote_perim(p, T)
    hx, hy, H = T["W"] / 2, T["D"] / 2, T["H"]
    zn = np.clip(z / H, 0, 1)
    fbw = np.abs(ny)                                   # 1 on front/back, 0 on the gussets, blends in corners
    sdw = 1 - fbw
    back = _ss(-0.3, 0.3, y / hy)                      # 0 front .. 1 back (continuous)
    # rounded bottom seam: walls tuck in over the last few mm
    rb = 0.009
    q = np.clip(1 - z / rb, 0, 1)
    tuck = rb * (1 - np.sqrt(np.clip(1 - q * q, 0, 1)))
    # panel bulge (lightly stuffed), strongest mid-panel, fading at corners and the hem
    wx = np.clip(1 - (x / hx) ** 2, 0, 1) ** 0.85
    wy = np.clip(1 - (y / hy) ** 2, 0, 1) ** 0.8
    prof = np.sin(np.pi * np.clip(zn * 0.92 + 0.04, 0, 1)) ** 0.6 * (1 - 0.25 * zn)
    bul = fbw * k["bulge"] * wx * prof + sdw * 0.55 * k["bulge"] * wy * prof * (1 - _ss(0.4, 0.9, zn))
    # corners wander a little (no ruler-straight edges)
    cw = _ss(hx - 0.03, hx, np.abs(x)) * np.sin(np.pi * zn) * 0.004 * np.sin(z * 11.0 + k["seed"] + np.sign(x) * 1.7)
    # side gussets fold in towards the top (V fold), the opening narrows at the ends
    pinch = _ss(0.38, 1.0, zn) * k["pinch"]
    ew = _ss(hx - 0.07, hx - 0.005, np.abs(x))
    vfold = sdw * 0.040 * pinch * np.clip(1 - np.abs(y) / hy, 0, 1) ** 1.2
    X = x + nx * (bul - tuck) - np.sign(x) * vfold + np.sign(x) * cw
    Y = y + ny * (bul - tuck)
    Y = Y * (1 - 0.62 * pinch * ew)
    # upper panel caves in softly between the handles (unfilled bag), lower panel bellies out
    cave = -fbw * k["cave"] * np.exp(-(x / 0.11) ** 2) * _ss(0.45, 0.97, zn) * (1 - 0.5 * _ss(0.97, 1.0, zn))
    X = X + nx * cave; Y = Y + ny * cave
    # rim: dips between the handles, droops past them (same along front, corner and gusset)
    sag = 0.005 * np.exp(-(x / 0.05) ** 2) + 0.010 * _ss(0.09, hx, np.abs(x))
    sag = sag + 0.004 * np.sin(x * 17.0 + k["seed"] + 2.0 * back) * (1 - _ss(hx - 0.04, hx, np.abs(x)))
    Z = z - sag * zn ** 3
    # whole-bag slump / lean
    X = X + k["lean_x"] * zn ** 1.6
    Y = Y + k["lean_y"] * zn ** 1.6
    # long vertical ripples (gravity), growing with height; fade out into the corners
    ph = k["seed"] * 1.7 + 2.3 * back
    rip = (np.sin(x * 26.0 + ph) * 0.6 + np.sin(x * 47.0 + 1.3 * ph) * 0.4) * (0.15 + 0.85 * zn ** 1.3)
    rip = rip * k["ripple"] * _ss(0.0, 0.05, z) * fbw * (1 - _ss(hx - 0.035, hx - 0.004, np.abs(x)))
    # soft noise folds, stretched vertically
    P0 = np.stack([x * 1.0, y * 1.0, z * 0.30], -1)
    w1 = _noise3(P0.reshape(-1, 3), 7.0, k["seed"], 3).reshape(z.shape)
    w2 = _noise3(np.stack([x, y, z], -1).reshape(-1, 3), 26.0, k["seed"] + 3, 2).reshape(z.shape)
    amp = (0.0068 * (0.3 + 0.7 * zn) * (0.35 + 0.65 * wx + 0.4 * sdw)) * _ss(0.0, 0.03, z)
    dd = w1 * amp + w2 * 0.0008 * _ss(0.0, 0.02, z) + rip
    # diagonal tension folds from the bottom corners and from the handle roots
    for sgn in (-1, 1):
        u_ = (x * sgn - (hx - 0.03)) * 0.8 + (z - 0.02)
        dd += fbw * -0.0026 * np.exp(-(u_ / 0.018) ** 2) * _ss(0.0, 0.03, z) * _ss(0.22, 0.05, z)
        v_ = (x * sgn - 0.066) * 1.1 + (H - 0.05 - z)
        dd += fbw * 0.0018 * np.exp(-(v_ / 0.02) ** 2) * _ss(H * 0.55, H * 0.85, z)
    # sewn corner: the seam allowance inside lifts a soft welt along the vertical corner seam
    dd += 0.0009 * np.exp(-((np.abs(x) - (hx - 0.0035)) / 0.0025) ** 2) * fbw * _ss(0.004, 0.02, z)
    X = X + nx * dd; Y = Y + ny * dd
    return np.stack([X, Y, Z], -1), pan

def _tote_normals(p, z, T, k, P=None):
    e = 2e-4
    Pp = _tote_body(p + e, z, T, k)[0]; Pm = _tote_body(p - e, z, T, k)[0]
    Zp = _tote_body(p, z + e, T, k)[0]; Zm = _tote_body(p, z - e, T, k)[0]
    return _norm(np.cross(Pp - Pm, Zp - Zm))

def _catmull(ctrl, n=200):
    C = np.asarray(ctrl, float)
    C = np.vstack([2 * C[0] - C[1], C, 2 * C[-1] - C[-2]])
    out = []
    for i in range(1, len(C) - 2):
        p0, p1, p2, p3 = C[i - 1], C[i], C[i + 1], C[i + 2]
        for t in np.linspace(0, 1, n // (len(C) - 3), endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                              (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(C[-2])
    return np.array(out)

def tote(color="Natural", seed=None, logo="your logo", ink="cobalt"):
    """Bull denim tote, 0.38 W x 0.40 H x 0.10 D, flat bottom, two handles standing up."""
    T = dict(TOTE)
    sd = seed if seed is not None else {"Black": 3, "Natural": 11, "White": 23}.get(color, 5)
    rs = np.random.RandomState(sd)
    k = dict(seed=sd, bulge=rs.uniform(0.013, 0.018), pinch=rs.uniform(0.8, 0.95),
             lean_x=rs.choice([-1, 1]) * rs.uniform(0.014, 0.024), lean_y=rs.uniform(-0.010, 0.006),
             cave=rs.uniform(0.014, 0.020), ripple=rs.uniform(0.0028, 0.0042))
    root = _empty(f"Tote_{color}")
    hx, hy, H = T["W"] / 2, T["D"] / 2, T["H"]
    _, _, _, _, _, Lp = _tote_perim(np.array([0.0]), T)
    # print mask
    mpath, asp = text_mask(logo, name="acc_logo_mask_print", blur=2)
    pw = 0.205
    rect = (0.0, 0.205, pw, pw / asp)
    m_den = mat_denim(color, name=f"acc_denim_{color}", print_mask=mpath, print_rect=rect, ink=ink)
    m_den_plain = mat_denim(color, name=f"acc_denim_plain_{color}")
    thread_col = {"Black": "#3a3a3a", "Natural": "#efe7d4", "White": "#f2f2ee"}.get(color, color)
    m_th = mat_thread_acc(thread_col, name=f"acc_tote_thread_{color}", shine=0.5)

    # ---------------- body
    nu = int(Lp / 0.0024)
    nz = int(H / 0.0024)
    pu = np.linspace(-Lp / 2, Lp / 2, nu, endpoint=False)
    zz = np.linspace(0, H, nz)
    PU, ZZ = np.meshgrid(pu, zz, indexing="ij")
    Pb, pan = _tote_body(PU, ZZ, T, k)
    F = _grid_faces(nu, nz, closed_u=True)
    U = PU.ravel()[F]
    wrap = (U.max(1) - U.min(1)) > Lp / 2
    U[wrap] = np.where(U[wrap] < 0, U[wrap] + Lp, U[wrap])
    luv = np.stack([U, ZZ.ravel()[F]], -1).reshape(-1, 2)
    body = _mesh("ToteBody", Pb.reshape(-1, 3), F, mat=m_den, parent=root, loop_uv=luv)
    so = body.modifiers.new("Solidify", "SOLIDIFY")
    so.thickness = 0.0019; so.offset = -1.0; so.use_even_offset = True
    so.material_offset = 1
    body.data.materials.append(m_den_plain)
    # bottom panel
    bp = _tote_body(pu, np.zeros_like(pu), T, k)[0]
    bv_ = np.vstack([bp, [[bp[:, 0].mean(), bp[:, 1].mean(), 0.0]]])
    c_ = len(bv_) - 1
    _mesh("ToteBottom", bv_ + np.array([0, 0, 0.0004]), [(i, c_, (i + 1) % nu) for i in range(nu)],
          mat=m_den_plain, parent=root)

    # ---------------- rolled hem at the rim
    rim = Pb[:, -1, :]
    rim_n = _tote_normals(pu, np.full_like(pu, H - 1e-3), T, k)
    rim_c = rim - rim_n * 0.00095 + np.array([0, 0, -0.0006])
    rim_c = np.vstack([rim_c, rim_c[:1]])
    rim_n2 = np.vstack([rim_n, rim_n[:1]])
    prof = [(0.0021 * math.cos(q), 0.0019 * math.sin(q)) for q in np.linspace(0, 2 * np.pi, 12, endpoint=False)]
    hem = _sweep("ToteHem", rim_c, rim_n2, prof, mat=m_den_plain, parent=root, cap_ends=False,
                 uv_scale=(1.0, 1.0))
    rows = []
    # hem stitching: two rows around the bag
    for dz in (0.0065, T["hem"]):
        zr = np.full_like(pu, H) - dz
        pts, _ = _tote_body(pu, zr, T, k)
        nr = _tote_normals(pu, zr, T, k)
        pts = np.vstack([pts, pts[:1]]); nr = np.vstack([nr, nr[:1]])
        rows.append((pts, nr))
    # corner seams: slight ridge lines are implied by the rounded corners; bottom topstitch row
    zb = np.full_like(pu, 0.011)
    pts, _ = _tote_body(pu, zb, T, k); nr = _tote_normals(pu, zb, T, k)
    rows.append((np.vstack([pts, pts[:1]]), np.vstack([nr, nr[:1]])))

    # ---------------- handles (front + back), standing up with a natural curve and twist
    # vertical corner seams: one top-stitch row on the front/back panel beside each sewn corner
    for xs_ in (-(hx - 0.0062), hx - 0.0062):
        for pp in (xs_, (Lp / 2 - xs_) if xs_ >= 0 else (-Lp / 2 - xs_)):
            zc = np.linspace(0.016, H - T["hem"] - 0.004, 160)
            pc = np.full_like(zc, pp)
            pts, _ = _tote_body(pc, zc, T, k)
            rows.append((pts, _tote_normals(pc, zc, T, k)))
    sw, st = T["strap_w"], T["strap_t"]
    sprof = []
    rr = 0.0005                                        # 2.5 mm webbing-weight denim strap, 0.5 mm edge roll
    corners_ = ((sw / 2 - rr, st / 2 - rr, 0), (-sw / 2 + rr, st / 2 - rr, 90),
                (-sw / 2 + rr, -st / 2 + rr, 180), (sw / 2 - rr, -st / 2 + rr, 270))
    for ci, (cx, cy, a0) in enumerate(corners_):
        for q in np.linspace(0, 90, 4):
            aq = math.radians(a0 + q)
            sprof.append((cx + rr * math.cos(aq), cy + rr * math.sin(aq)))
        if ci in (0, 2):                                # subdivide the flat faces so they shade flat
            nx_, ny_, _ = corners_[ci + 1]
            for f in np.linspace(0, 1, 10)[1:-1]:
                sprof.append((cx + (nx_ - cx) * f, (st / 2) * (1 if ci == 0 else -1)))
    for face, sgn in (("front", -1), ("back", 1)):
        dx = T["handle_dx"]
        lean = math.radians(rs.uniform(3, 9)) * sgn
        sway = math.radians(rs.uniform(-7, 7))
        peak = rs.uniform(0.215, 0.245)
        # flat attachment parts (conform to the panel), p of x on front/back panel
        def p_of_x(xv):
            return xv if face == "front" else (Lp / 2 - xv) if xv >= 0 else (-Lp / 2 - xv)
        legs = []
        for xs_ in (-dx, dx):
            zs = np.linspace(H - 0.050, H - 0.0015, 24)
            ps = np.full_like(zs, p_of_x(xs_))
            pts, _ = _tote_body(ps, zs, T, k)
            nr = _tote_normals(ps, zs, T, k)
            legs.append((pts + nr * (st / 2 + 0.0004), nr))
        # top of each leg -> arc
        A, An = legs[0][0][-1], legs[0][1][-1]
        B, Bn = legs[1][0][-1], legs[1][1][-1]
        out_n = _norm((An + Bn) / 2)
        xdir = _norm(B - A)
        zdir = np.array([0, 0, 1.0])
        # arc in a local plane, then lean (about xdir) & sway
        half = np.linalg.norm(B - A) / 2
        ctrl2 = [(-half, 0.0), (-half - 0.010, 0.050), (-half - 0.020, 0.115), (-half * 0.72, 0.185),
                 (0.0, peak), (half * 0.72, 0.185), (half + 0.020, 0.115), (half + 0.010, 0.050), (half, 0.0)]
        arc2 = _catmull(ctrl2, 240)
        mid = (A + B) / 2
        upv = zdir * math.cos(lean) + out_n * math.sin(abs(lean)) * 1.0
        upv = _norm(upv)
        # sway: tip the arc sideways a little about the out-normal
        upv2 = _norm(upv * math.cos(sway) + xdir * math.sin(sway))
        arc = mid[None, :] + arc2[:, 0:1] * xdir[None, :] + arc2[:, 1:2] * upv2[None, :]
        # assemble: leg0 (bottom->top), arc, leg1 (top->bottom)
        path = np.vstack([legs[0][0][:-1], arc, legs[1][0][::-1][1:]])
        pn0 = np.vstack([legs[0][1][:-1], np.zeros_like(arc), legs[1][1][::-1][1:]])
        path, _L = _resample(path, 0.0015)
        # smooth the joints
        for _ in range(6):
            path[1:-1] = path[1:-1] * 0.5 + (path[:-2] + path[2:]) * 0.25
        Tn = _norm(np.gradient(path, axis=0))
        # width direction: along xdir on the panel, twisting towards the out-normal near the top
        hgt = np.clip((path - mid) @ upv2, 0, None) / peak
        alpha = np.radians(78) * _ss(0.05, 0.85, hgt) * (1 + 0.15 * np.sin(np.arange(len(path)) / 40.0))
        wv = np.cos(alpha)[:, None] * xdir[None, :] + np.sin(alpha)[:, None] * out_n[None, :]
        wv = _norm(wv - (wv * Tn).sum(-1, keepdims=True) * Tn)
        Nn = _norm(np.cross(Tn, wv))
        # make the strap face point away from the bag on the legs
        if (Nn[0] * out_n).sum() < 0:
            Nn = -Nn
        strap = _sweep(f"ToteHandle_{face}", path, Nn, sprof, mat=m_den_plain, parent=root,
                       uv_scale=(1.0, 1.0))
        Bw = np.cross(Tn, Nn)
        for off in (-sw / 2 + 0.0035, sw / 2 - 0.0035):
            for fs in (1, -1):
                q_ = path + Bw * off + Nn * fs * (st / 2)
                rows.append((q_[3:-3], Nn[3:-3] * fs))
        # box-X stitch at each attachment
        for leg in legs:
            pts, nr = leg
            c0 = pts[8]; nn = nr[8]
            up_ = _norm(pts[-1] - pts[0]); side_ = _norm(np.cross(nn, up_))
            bw_, bh_ = sw / 2 - 0.0045, 0.016
            corners = [c0 + nn * (st / 2) + side_ * sx_ * bw_ + up_ * sy_ * bh_
                       for sx_, sy_ in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            box = np.array(corners + [corners[0]])
            dense = np.vstack([np.linspace(box[i], box[i + 1], 30) for i in range(4)])
            rows.append((dense, np.repeat(nn[None, :], len(dense), 0)))
            for a_, b_ in ((0, 2), (1, 3)):
                ln = np.linspace(corners[a_], corners[b_], 40)
                rows.append((ln, np.repeat(nn[None, :], 40, 0)))
    _stitch_mesh("ToteStitches", rows, m_th, parent=root, pitch=0.0036, radius=0.00042, duty=0.84)
    _rest(root)
    return root

# =================================================================== JOURNAL
JOURNAL = dict(Wc=0.1397, Lc=0.2096, tc=0.0013, Tp=0.0124, sq=0.0022, rc=0.0065, el_w=0.0062, el_t=0.0013,
               el_x=0.0165)

def mat_ultrahyde(color, name=None, logo_rect=None, sharp=None, soft=None, foil="chrome"):
    """Italian UltraHyde faux leather: fine pebble grain, satin sheen, gentle tonal variation.
    Optional foil deboss from masks mapped in UV space (u,v in metres)."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_ultrahyde_{color}")
        base = _col(color)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        uv = tc.outputs["UV"]
        vor = nt.nodes.new("ShaderNodeTexVoronoi")
        vor.feature = "SMOOTH_F1"
        vor.inputs["Scale"].default_value = 1 / 0.00085
        vor.inputs["Randomness"].default_value = 0.9
        nt.links.new(uv, vor.inputs["Vector"])
        grain = vor.outputs["Distance"]
        n1 = _noise(nt, uv, 1 / 0.0004, detail=2.0)
        mot = _noise(nt, uv, 1 / 0.025, detail=3.0)
        h = _math(nt, "ADD", _math(nt, "MULTIPLY", grain, 0.8), _math(nt, "MULTIPLY", n1, 0.25))
        lo = tuple(c * 0.86 for c in base[:3]) + (1,)
        hi = tuple(min(1, c * 1.10) for c in base[:3]) + (1,)
        col = _mixc(nt, _mixf(nt, 0.4, grain, mot), lo, hi)
        rough = _mixf(nt, grain, 0.40, 0.58)
        coat = 0.12
        bump_h = h
        foil_m = None
        if logo_rect is not None:
            def mapped(path):
                mpp = nt.nodes.new("ShaderNodeMapping")
                mpp.inputs["Scale"].default_value = (1 / logo_rect[2], 1 / logo_rect[3], 1)
                mpp.inputs["Location"].default_value = (0.5 - logo_rect[0] / logo_rect[2],
                                                        0.5 - logo_rect[1] / logo_rect[3], 0)
                nt.links.new(uv, mpp.inputs["Vector"])
                it = nt.nodes.new("ShaderNodeTexImage")
                it.image = _img(path); it.extension = "CLIP"; it.interpolation = "Cubic"
                nt.links.new(mpp.outputs["Vector"], it.inputs["Vector"])
                return it.outputs["Color"]
            sh = mapped(sharp)
            sf = mapped(soft)
            mr = nt.nodes.new("ShaderNodeMapRange")
            mr.inputs["From Min"].default_value = 0.35; mr.inputs["From Max"].default_value = 0.65
            nt.links.new(sh, mr.inputs["Value"])
            foil_m = mr.outputs["Result"]
            # deboss: pressed-in letters (soft edge), grain flattened inside the foil
            bump_h = _math(nt, "SUBTRACT", _mixf(nt, foil_m, h, _math(nt, "MULTIPLY", h, 0.15)),
                           _math(nt, "MULTIPLY", sf, 3.0))
        nt.links.new(col, b.inputs["Base Color"])
        nt.links.new(rough, b.inputs["Roughness"])
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.35
        b.inputs["Sheen Weight"].default_value = 0.15
        b.inputs["Sheen Roughness"].default_value = 0.4
        nrm = _bumpn(nt, bump_h, 0.42, 0.00035)
        nt.links.new(nrm, b.inputs["Normal"])
        if foil_m is not None:
            out = nt.nodes.get("Material Output")
            fb = nt.nodes.new("ShaderNodeBsdfPrincipled")
            # bright mirror foil (chrome #C9CCD3 on press): a polished film, only faintly brushed
            tint = (0.92, 0.93, 0.95, 1) if foil == "chrome" else (rgb(foil) if foil in _c.PALETTE else
                                                                   _col(foil))
            fb.inputs["Base Color"].default_value = tint
            fb.inputs["Metallic"].default_value = 1.0
            fb.inputs["Roughness"].default_value = 0.12
            fb.inputs["Anisotropic"].default_value = 0.2
            fn = _noise(nt, uv, 1 / 0.0012, detail=2.0)
            nt.links.new(_bumpn(nt, _math(nt, "SUBTRACT", _math(nt, "MULTIPLY", fn, 0.2),
                                          _math(nt, "MULTIPLY", sf, 3.0)), 0.35, 0.00035), fb.inputs["Normal"])
            mix = nt.nodes.new("ShaderNodeMixShader")
            nt.links.new(foil_m, mix.inputs["Fac"])
            nt.links.new(b.outputs["BSDF"], mix.inputs[1])
            nt.links.new(fb.outputs["BSDF"], mix.inputs[2])
            nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
        return m
    return _cached(("ultrahyde", color, name, sharp), mk)

def mat_page_edges(name="acc_page_edges"):
    """Cream FSC paper seen edge-on: fine sheet lines, signature gaps, faint dust."""
    def mk():
        m, nt, b = _c._new_mat(name)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        uv = tc.outputs["UV"]
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(uv, sep.inputs["Vector"])
        n = _noise(nt, uv, 1 / 0.004, detail=2.0)
        v = _math(nt, "ADD", sep.outputs["Y"], _math(nt, "MULTIPLY", n, 0.00006))
        sheet = _math(nt, "SINE", _math(nt, "DIVIDE", v, 0.00022 / (2 * math.pi)))
        sheet = _math(nt, "POWER", _math(nt, "ABSOLUTE", sheet), 4.0)
        sig = _math(nt, "SINE", _math(nt, "DIVIDE", v, 0.00155 / (2 * math.pi)))
        sig = _math(nt, "POWER", _math(nt, "ABSOLUTE", sig), 60.0)
        dark = _math(nt, "ADD", _math(nt, "MULTIPLY", sheet, 0.09), _math(nt, "MULTIPLY", sig, 0.22))
        paper = rgb("#F6EEDC")
        col = _mixc(nt, dark, paper, tuple(c * 0.55 for c in paper[:3]) + (1,))
        nt.links.new(col, b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.9
        b.inputs["Subsurface Weight"].default_value = 0.08
        b.inputs["Subsurface Radius"].default_value = (0.002, 0.0015, 0.001)
        nt.links.new(_bumpn(nt, _math(nt, "ADD", sheet, sig), 0.25, 0.00008), b.inputs["Normal"])
        return m
    return _cached(("pages",), mk)

def mat_elastic(color, name=None):
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_elastic_{color}")
        base = _col(color, 0.8)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
        ribs = _wave(nt, mp.outputs["Vector"], 0.31416 / 0.00055, "X", distortion=0.4)
        fib = _wave(nt, mp.outputs["Vector"], 0.31416 / 0.00025, "Y", distortion=1.0)
        h = _math(nt, "ADD", _math(nt, "MULTIPLY", ribs, 0.7), _math(nt, "MULTIPLY", fib, 0.3))
        col = _mixc(nt, h, tuple(c * 0.6 for c in base[:3]) + (1,), base)
        nt.links.new(col, b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.55
        b.inputs["Sheen Weight"].default_value = 0.6
        b.inputs["Sheen Roughness"].default_value = 0.3
        nt.links.new(_bumpn(nt, h, 0.6, 0.0003), b.inputs["Normal"])
        return m
    return _cached(("elastic", color, name), mk)

def mat_ribbon(color, name=None):
    """Satin bookmark ribbon: fine warp ribs, anisotropic sheen streaking ACROSS the ribbon
    (tangent = ribbon length via the sweep UV)."""
    def mk():
        m, nt, b = _c._new_mat(name or f"acc_ribbon_{color}")
        base = _col(color, 1.05)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        w = _wave(nt, tc.outputs["UV"], 0.31416 / 0.00016, "Y", distortion=0.2)
        b.inputs["Base Color"].default_value = base
        b.inputs["Roughness"].default_value = 0.32
        b.inputs["Anisotropic"].default_value = 0.9
        b.inputs["Sheen Weight"].default_value = 0.35
        b.inputs["Sheen Roughness"].default_value = 0.3
        b.inputs["Sheen Tint"].default_value = tuple(min(1, c * 2.0 + 0.05) for c in base[:3]) + (1,)
        b.inputs["Specular IOR Level"].default_value = 0.4
        b.inputs["Coat Weight"].default_value = 0.0
        tg = nt.nodes.new("ShaderNodeTangent")
        tg.direction_type = "UV_MAP"
        nt.links.new(tg.outputs["Tangent"], b.inputs["Tangent"])
        nt.links.new(_bumpn(nt, w, 0.12, 0.00006), b.inputs["Normal"])
        return m
    return _cached(("ribbon", color, name), mk)

def _cover_section(J, n_spine=24, n_plate=70, n_corner=16):
    """Centre-line of the wraparound cover in XZ: back plate (fore-edge -> spine), round spine,
    front plate (spine -> fore-edge). Returns (x, z, s, plate_flag(0 back,1 spine,2 front), corner beta)."""
    Wc, tc, Tp = J["Wc"], J["tc"], J["Tp"]
    Ttot = Tp + 2 * tc
    rs = (Ttot - tc) / 2
    xs = -Wc / 2 + rs
    rc = J["rc"]
    xf = Wc / 2
    pts = []
    # back plate from the fore-edge to the spine; corner region parametrised by angle
    # (beta = pi/2 at the fore-edge -> 0 where the full length starts)
    for bta in np.linspace(np.pi / 2, 0, n_corner, endpoint=False):
        e = rc * (1 - np.sin(bta))                    # distance from fore-edge
        pts.append((xf - e, tc / 2, 0, bta))
    for x in np.linspace(xf - rc, xs, n_plate, endpoint=False):
        pts.append((x, tc / 2, 0, 0.0))
    for a in np.linspace(-np.pi / 2, -3 * np.pi / 2, n_spine, endpoint=False):
        # slightly squarish spine (superellipse)
        ca, sa = np.cos(a), np.sin(a)
        p = 2.6
        r_ = rs / (abs(ca) ** p + abs(sa) ** p) ** (1 / p)
        pts.append((xs + r_ * ca * 1.0, Ttot / 2 + r_ * sa, 1, 0.0))
    for x in np.linspace(xs, xf - rc, n_plate, endpoint=False):
        pts.append((x, Ttot - tc / 2, 2, 0.0))
    for bta in np.linspace(0, np.pi / 2, n_corner):
        e = rc * (1 - np.sin(bta))
        pts.append((xf - e, Ttot - tc / 2, 2, bta))
    A = np.array(pts)
    return A[:, 0], A[:, 1], A[:, 2].astype(int), A[:, 3], Ttot

def journal(color="Blue", seed=None, logo="your logo", foil="chrome", ribbon_len=None):
    """5.5 x 8.25 in soft UltraHyde journal, 80 sheets, elastic closure, ribbon. Lies flat, spine on -X,
    head on +Y, front cover up."""
    J = dict(JOURNAL)
    sd = seed if seed is not None else {"Black": 2, "Red": 5, "Purple": 9, "Blue": 13}.get(color, 1)
    rs_ = np.random.RandomState(sd)
    root = _empty(f"Journal_{color}")
    Wc, Lc, tc, Tp, sq, rc = J["Wc"], J["Lc"], J["tc"], J["Tp"], J["sq"], J["rc"]
    # logo masks
    sharp, asp = text_mask(logo, name="acc_logo_mask_foil", blur=0)
    soft, _ = text_mask(logo, name="acc_logo_mask_foil_blur", blur=5)
    lw = 0.058
    x_logo = 0.006
    rect = (x_logo, 0.012, lw, lw / asp)
    m_cov = mat_ultrahyde(color, name=f"acc_ultrahyde_{color}", logo_rect=rect, sharp=sharp, soft=soft, foil=foil)

    # ---------------- cover
    x, z, plate, beta, Ttot = _cover_section(J)
    # soft cover: front plate fore-edge flares up a hair, slight bow
    xf = Wc / 2
    flare = np.where(plate == 2, 0.0006 * _ss(0.02, xf, x) ** 2, 0.0)
    ny_ = 90
    v = np.linspace(-1, 1, ny_)
    yext = Lc / 2 - rc + rc * np.cos(beta)            # rounded fore-edge corners
    X = np.repeat(x[:, None], ny_, 1)
    Y = yext[:, None] * v[None, :]
    Z = np.repeat((z + flare)[:, None], ny_, 1)
    Z = Z + np.where(plate[:, None] == 2, 0.0003 * np.sin(np.pi * (v[None, :] + 1) / 2) *
                     np.sin(np.pi * np.clip((X + Wc / 2) / Wc, 0, 1)), 0)
    # soft cover: faint low-frequency waviness on both plates
    wav = _noise3(np.stack([X, Y, np.zeros_like(X)], -1).reshape(-1, 3), 18.0, sd, 2).reshape(X.shape)
    Z = Z + np.where(plate[:, None] == 2, 1.0, np.where(plate[:, None] == 0, -0.4, 0.0)) * wav * 0.00045 * \
        _ss(-Wc / 2 + 0.008, -Wc / 2 + 0.03, X)
    P = np.stack([X, Y, Z], -1)
    uvx = np.where(plate[:, None] == 2, X, X + 10.0)
    uv = np.stack([uvx, Y], -1)
    cov = _grid_obj("JournalCover", P, uv=uv, mat=m_cov, parent=root)
    so = cov.modifiers.new("Solidify", "SOLIDIFY")
    so.thickness = tc; so.offset = 0.0; so.use_even_offset = True
    bv = cov.modifiers.new("Bevel", "BEVEL")
    bv.width = 0.00045; bv.segments = 2; bv.limit_method = "ANGLE"; bv.angle_limit = math.radians(50)

    # ---------------- page block
    Wp, Lp = Wc - sq - 0.0035, Lc - 2 * sq
    x0 = -Wc / 2 + (Ttot - tc) / 2 * 0.55
    x1 = Wc / 2 - sq
    rcp = rc - 0.0012
    outline = []
    # counter-clockwise from spine-tail corner
    outline.append((x0, -Lp / 2))
    for a in np.linspace(-90, 0, 12):
        outline.append((x1 - rcp + rcp * math.cos(math.radians(a)), -Lp / 2 + rcp + rcp * math.sin(math.radians(a))))
    for a in np.linspace(0, 90, 12):
        outline.append((x1 - rcp + rcp * math.cos(math.radians(a)), Lp / 2 - rcp + rcp * math.sin(math.radians(a))))
    outline.append((x0, Lp / 2))
    O = np.array(outline)
    # resample outline densely for smooth concave fore-edge
    Oc = np.vstack([O, O[:1]])
    Od, _ = _resample(np.column_stack([Oc, np.zeros(len(Oc))]), 0.0015)
    Od = Od[:-1, :2]
    nzp = 18
    zp = np.linspace(tc + 0.00015, Ttot - tc - 0.00015, nzp)
    rings = []
    for zz_ in zp:
        zn = (zz_ - zp[0]) / (zp[-1] - zp[0])
        conc = 0.0011 * (1 - (2 * zn - 1) ** 2)          # rounded spine -> concave fore-edge
        R = Od.copy()
        fore = _ss(x0 + 0.03, x1, R[:, 0])
        R[:, 0] -= conc * fore
        hd = _ss(Lp / 2 - 0.02, Lp / 2, np.abs(R[:, 1])) * (1 - fore * 0)
        R[:, 1] -= np.sign(R[:, 1]) * conc * 0.4 * hd
        rings.append(np.column_stack([R, np.full(len(R), zz_)]))
    PB = np.stack(rings, 1)                           # (n_outline, nz, 3)
    per = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(np.vstack([Od, Od[:1]]), axis=0), axis=1))])[:-1]
    uvp = np.stack([np.repeat(per[:, None], nzp, 1), np.repeat(zp[None, :], len(Od), 0)], -1)
    pages = _grid_obj("JournalPages", PB, uv=uvp, closed_u=True, mat=mat_page_edges(), parent=root)
    # caps
    me = pages.data
    bm = bmesh.new(); bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    n_o = len(Od)
    bot = [bm.verts[i * nzp] for i in range(n_o)]
    top = [bm.verts[i * nzp + nzp - 1] for i in range(n_o)]
    bm.faces.new(bot[::-1]); bm.faces.new(top)
    bm.to_mesh(me); bm.free()
    for p_ in me.polygons:
        p_.use_smooth = len(p_.vertices) == 4

    # ---------------- elastic closure (wraps head & tail, anchored in the back cover)
    ew, et = J["el_w"], J["el_t"]
    xe = Wc / 2 - J["el_x"]
    ztop = Ttot + et / 2 - 0.0002
    path = []
    re_ = Ttot / 2 + et / 2
    # tail end: from inside back cover, around the tail edge, onto the front cover
    yt = -Lc / 2
    path.append((yt + 0.006, et / 2 + 0.0001))
    path.append((yt + 0.0015, et / 2 + 0.0001))
    rz_top, rz_bot = ztop - Ttot / 2, Ttot / 2 - et / 2 - 0.0001     # never below the cover's base
    def zarc(ar):
        return Ttot / 2 + (rz_top if math.sin(ar) > 0 else rz_bot) * math.sin(ar)
    for a in np.linspace(-90, 90, 20):
        ar = math.radians(a)
        path.append((yt - 0.0008 - re_ * 0.215 * math.cos(ar), zarc(ar)))
    for yy in np.linspace(yt + 0.004, -yt - 0.004, 60):
        path.append((yy, ztop))
    for a in np.linspace(90, -90, 20):
        ar = math.radians(a)
        path.append((-yt + 0.0008 + re_ * 0.215 * math.cos(ar), zarc(ar)))
    path.append((-yt - 0.0015, et / 2 + 0.0001))
    path.append((-yt - 0.006, et / 2 + 0.0001))
    E = np.array([(xe, py, pz) for py, pz in path])
    E, _ = _resample(E, 0.0012)
    for _ in range(3):
        E[1:-1] = E[1:-1] * 0.5 + (E[:-2] + E[2:]) * 0.25
    # profile: width along X, thickness along the bend normal
    Te = _norm(np.gradient(E, axis=0))
    side = np.array([1.0, 0, 0])
    Ne = _norm(np.cross(side[None, :].repeat(len(E), 0), Te))
    if Ne[len(Ne) // 2][2] < 0:
        Ne = -Ne
    eprof = []
    rr = et / 2 * 0.95
    for cx, cy, a0 in ((ew / 2 - rr, 0, -90), (-ew / 2 + rr, 0, 90)):
        for q in np.linspace(0, 180, 6):
            aq = math.radians(a0 + q)
            eprof.append((cx + rr * math.cos(aq), cy + (et / 2) * math.sin(aq)))
    _sweep("JournalElastic", E, Ne, eprof, mat=mat_elastic(color), parent=root, uv_scale=(1.0, 1.0))

    # ---------------- ribbon bookmark: 6.5 mm satin, 0.25 mm thick, out of the tail of the page block,
    # one smooth roll over the back cover's edge, then lying out flat on whatever is below
    rw, rt = 0.0065, 0.00025
    xr = -Wc / 2 + 0.034 + rs_.uniform(-0.006, 0.006)
    zr = tc + Tp * rs_.uniform(0.45, 0.7)
    out_len = rs_.uniform(0.026, 0.034) if ribbon_len is None else ribbon_len
    y_p = -Lp / 2
    zb = rt / 2 + 0.0001
    y_e = -Lc / 2                                      # back-cover tail edge
    bez = [np.array(v) for v in ((y_p + 0.012, zr), (y_e - 0.0035, zr + 0.0004),
                                 (y_e - 0.0050, zb), (y_e - 0.0125, zb))]
    uu = np.linspace(0, 1, 120)
    B2 = ((1 - uu) ** 3)[:, None] * bez[0] + (3 * (1 - uu) ** 2 * uu)[:, None] * bez[1] + \
         (3 * (1 - uu) * uu ** 2)[:, None] * bez[2] + (uu ** 3)[:, None] * bez[3]
    R = np.column_stack([np.full(len(B2), xr), B2[:, 0], B2[:, 1]])
    if out_len > 0.012:
        # lying part: one gentle sideways arc (no kinks), length out_len beyond the landing
        L_lay = out_len - 0.012
        q = np.linspace(0, 1, 60)[1:]
        drift = rs_.choice([-1, 1]) * 0.22 * L_lay
        lay = np.stack([xr + drift * q ** 2, R[-1, 1] - L_lay * q, np.full_like(q, zb)], -1)
        R = np.vstack([R, lay])
    R, _ = _resample(R, 0.0006)
    for _ in range(6):
        R[1:-1] = R[1:-1] * 0.5 + (R[:-2] + R[2:]) * 0.25
    TR = _norm(np.gradient(R, axis=0))
    # ribbon width stays (nearly) across X -> no frame flips where it turns vertical
    ex = np.repeat(np.array([[1.0, 0, 0]]), len(R), 0)
    upr = _norm(np.cross(TR, ex))
    upr = np.where((upr[:, 2:3] < 0), -upr, upr)
    xs_ = np.linspace(-rw / 2, rw / 2, 9)
    rprof = [(x_, -rt / 2) for x_ in xs_] + [(x_, rt / 2) for x_ in xs_[::-1]]
    rib = _sweep("JournalRibbon", R, upr, rprof, mat=mat_ribbon(color), parent=root, cap_ends=True,
                 uv_scale=(1.0, 1.0))
    # V-notch at the free end: pull the centre of the end cap back along the ribbon
    me = rib.data
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    co[-1] = co[-1] - TR[-1] * 0.0040
    me.vertices.foreach_set("co", co.ravel()); me.update()

    bpy.context.view_layer.update()
    _rest(root, np.vstack([_all_mesh_points(cov, 2), _all_mesh_points(pages, 2)]))
    return root
