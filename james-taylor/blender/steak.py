"""The Chicago Cut Ribeye: a thick bone-in ribeye with a frenched bone, broiled from above.

The steak is one closed mesh built around a noisy outline. A small baked map (numpy) holds, for every
point of the outline, the distance to the edge and where the fat runs; both shaders read it in
object space, so any cut face (the slices are boolean cuts) shows a true medium-rare gradient:
crust, a thin grey band, then rosy pink to the centre.
"""
import math
import os
import random

import bpy
import numpy as np
from mathutils import Vector

import kit

H = 0.035          # thickness: about 1.6 inches
EDGE = 0.0065      # radius of the rounded edge
MAP = 384          # baked map resolution
BOX = 0.11         # the map covers [-BOX, BOX] in x and y


def _dang(a, b):
    """Angle difference wrapped to [-pi, pi]."""
    return (a - b + math.pi) % math.tau - math.pi


# ribeye silhouette: radius multipliers on a 0.09 x 0.065 m ellipse every 30 degrees, starting at +x
# (the eye end), sweeping through the cap (+y), the lip (-x) and the straight bone side (-y)
SHAPE = [1.0, 1.06, 1.13, 1.2, 1.16, 1.05, 1.1, 0.99, 0.9, 0.87, 0.9, 0.96]


def _catmull(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)


def outline_radius(theta, seed=7):
    rng = random.Random(seed)
    phases = [rng.uniform(0, math.tau) for _ in range(6)]
    a, b = 0.09, 0.065
    base = 1.0 / math.sqrt((math.cos(theta) / a) ** 2 + (math.sin(theta) / b) ** 2)
    u = (theta % math.tau) / math.tau * len(SHAPE)
    i = int(u)
    t = u - i
    n = len(SHAPE)
    k = _catmull(SHAPE[(i - 1) % n], SHAPE[i % n], SHAPE[(i + 1) % n], SHAPE[(i + 2) % n], t)
    wob = (0.018 * math.sin(5 * theta + phases[0]) + 0.012 * math.sin(7 * theta + phases[1])
           + 0.006 * math.sin(13 * theta + phases[2]) + 0.004 * math.sin(19 * theta + phases[3]))
    return base * k * (1 + wob)


def bake_map(seed=7):
    """RGBA float image over [-BOX,BOX]^2: R = distance to edge (m*10), G = fat, B = cap mask."""
    n = MAP
    xs = np.linspace(-BOX, BOX, n)
    X, Y = np.meshgrid(xs, xs)
    th = np.arctan2(Y, X)
    R = np.vectorize(lambda t: outline_radius(float(t), seed))(th)
    rr = np.hypot(X, Y)
    # distance to the edge, measured radially then corrected by the local slope (good enough here)
    d = np.clip(R - rr, 0, None) * 0.92
    # fat: a band hugging the outer edge on the cap side, and the seam between eye and cap
    dth = (th - 1.75 + np.pi) % (2 * np.pi) - np.pi
    cap = np.exp(-(dth ** 2) / 0.22)
    band = np.exp(-((d - 0.0035) ** 2) / (2 * 0.0022 ** 2)) * (0.08 + 0.92 * cap)
    seam_r = R * 0.62
    seam = np.exp(-((rr - seam_r) ** 2) / (2 * 0.0015 ** 2)) * np.exp(-(((th - 1.6 + np.pi) % (2 * np.pi) - np.pi) ** 2) / 0.6)
    kernel = 0.6 * np.exp(-(((X + 0.004) / 0.008) ** 2 + ((Y - 0.012) / 0.005) ** 2))
    fat = np.clip(band + seam * 0.9 + kernel * 0.8, 0, 1)
    capmask = np.clip((cap - 0.35) * 1.6 * (rr > seam_r), 0, 1)
    img = bpy.data.images.new("steak_map", n, n, alpha=True, float_buffer=True)
    px = np.stack([d * 10.0, fat, capmask, np.ones_like(d)], axis=-1).astype(np.float32)
    img.pixels.foreach_set(px.ravel())
    # write it out and read it back, so renders of a saved .blend find the same map
    path = os.path.join(kit.CACHE, f"steak_map_{seed}.exr")
    img.filepath_raw = path
    img.file_format = "OPEN_EXR"
    img.save()
    bpy.data.images.remove(img)
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = "Non-Color"
    return img


def steak_mesh(name="Ribeye", seed=7, n_theta=160):
    """Closed slab: top dome, rounded edge, flat bottom, following outline_radius."""
    prof = []  # (kind, value, z): kind 'frac' = fraction of (R-EDGE), 'edge' = angle on the rounding
    top = H / 2
    for i in range(1, 9):
        s = i / 8
        prof.append(("frac", s, top + 0.002 * (1 - s * s)))
    for i in range(1, 7):
        phi = math.pi / 2 - (i / 6) * (math.pi / 2)
        prof.append(("edge", phi, (top - EDGE) + EDGE * math.sin(phi)))
    for i in range(1, 4):
        prof.append(("side", 0, (top - EDGE) - i / 4 * 2 * (top - EDGE)))
    for i in range(0, 7):
        phi = -(i / 6) * (math.pi / 2)
        prof.append(("edge", phi, -(top - EDGE) + EDGE * math.sin(phi)))
    for i in range(7, 0, -1):
        s = i / 8
        prof.append(("frac", s, -top))

    verts = [(0, 0, top + 0.002)]
    for t in range(n_theta):
        th = t / n_theta * math.tau
        R = outline_radius(th, seed)
        c, s_ = math.cos(th), math.sin(th)
        for kind, v, z in prof:
            if kind == "frac":
                r = v * (R - EDGE)
            elif kind == "edge":
                r = R - EDGE + EDGE * math.cos(v)
            else:
                r = R
            verts.append((r * c, r * s_, z))
    verts.append((0, 0, -top))
    P = len(prof)
    bottom = len(verts) - 1

    def vid(t, p):
        return 1 + (t % n_theta) * P + p

    faces = []
    for t in range(n_theta):
        faces.append((0, vid(t, 0), vid(t + 1, 0)))
        for p in range(P - 1):
            faces.append((vid(t, p), vid(t, p + 1), vid(t + 1, p + 1), vid(t + 1, p)))
        faces.append((bottom, vid(t + 1, P - 1), vid(t, P - 1)))
    o = kit.mesh_obj(name, verts, faces)
    # an organic, slightly uneven surface
    tex = bpy.data.textures.new("steak_lumps", "CLOUDS")
    tex.noise_scale = 0.03
    tex.noise_depth = 3
    d = o.modifiers.new("lumps", "DISPLACE")
    d.texture = tex
    d.strength = 0.0032
    d.mid_level = 0.5
    d.texture_coords = "OBJECT"
    # broad, uneven swells: a real steak is never a flat slab
    tex2 = bpy.data.textures.new("steak_swell", "CLOUDS")
    tex2.noise_scale = 0.065
    tex2.noise_depth = 1
    d2 = o.modifiers.new("swell", "DISPLACE")
    d2.texture = tex2
    d2.strength = 0.007
    d2.mid_level = 0.5
    d2.texture_coords = "OBJECT"
    tex3 = bpy.data.textures.new("steak_knots", "CLOUDS")
    tex3.noise_scale = 0.012
    tex3.noise_depth = 2
    d3 = o.modifiers.new("knots", "DISPLACE")
    d3.texture = tex3
    d3.strength = 0.0018
    d3.mid_level = 0.5
    d3.texture_coords = "OBJECT"
    sub = o.modifiers.new("smooth", "SUBSURF")
    sub.levels = sub.render_levels = 1
    kit.apply_modifiers(o)
    return o


def _map_node(nt, img, loc, jitter=0.0):
    """Sample the baked map at this point's object-space xy (optionally jittered by noise)."""
    tc = kit.node(nt, "ShaderNodeTexCoord", (loc[0] - 800, loc[1]))
    vec = tc.outputs["Object"]
    if jitter:
        jn = kit.noise(nt, vec, 60, 3, 0.5, (loc[0] - 650, loc[1] - 200))
        jm = kit.node(nt, "ShaderNodeVectorMath", (loc[0] - 500, loc[1] - 100))
        jm.operation = "MULTIPLY_ADD"
        jm.inputs[1].default_value = (jitter, jitter, 0)
        off = kit.node(nt, "ShaderNodeVectorMath", (loc[0] - 600, loc[1] - 300))
        off.operation = "SUBTRACT"
        kit.link(nt, jn, off, "Color", 0)
        off.inputs[1].default_value = (0.5, 0.5, 0.5)
        kit.link(nt, off, jm, 0, 0)
        nt.links.new(vec, jm.inputs[2])
        vec = jm.outputs[0]
    mp = kit.node(nt, "ShaderNodeMapping", (loc[0] - 400, loc[1]))
    mp.inputs["Location"].default_value = (0.5, 0.5, 0)
    mp.inputs["Scale"].default_value = (1 / (2 * BOX), 1 / (2 * BOX), 1)
    nt.links.new(vec, mp.inputs["Vector"])
    it = kit.node(nt, "ShaderNodeTexImage", loc)
    it.image = img
    it.interpolation = "Cubic"
    it.extension = "EXTEND"
    kit.link(nt, mp, it, 0, "Vector")
    sep = kit.node(nt, "ShaderNodeSeparateColor", (loc[0] + 250, loc[1]))
    kit.link(nt, it, sep, "Color", "Color")
    return tc, sep


def crust_material(img):
    """Broiled crust: a deep, uneven brown with charred flecks, caramel high spots, a sheen of fat in
    patches rather than all over, golden rendered fat along the cap, a groove along the seam."""
    m, nt, b = kit.new_mat("RibeyeCrust")
    tc, sep = _map_node(nt, img, (-1600, 500))
    obj = tc.outputs["Object"]
    # height: organic crags at three scales, plus the seam groove
    vd = kit.noise(nt, obj, 150, 3, 0.5, (-1500, -100))
    vdm = kit.node(nt, "ShaderNodeVectorMath", (-1400, -50))
    vdm.operation = "MULTIPLY_ADD"
    vdm.inputs[1].default_value = (0.004, 0.004, 0.004)
    kit.link(nt, vd, vdm, "Color", 0)
    nt.links.new(obj, vdm.inputs[2])
    vor = kit.node(nt, "ShaderNodeTexVoronoi", (-1300, -100), Scale=520.0, Randomness=1.0)
    vor.feature = "SMOOTH_F1"
    vor.inputs["Smoothness"].default_value = 1.0
    kit.link(nt, vdm, vor, 0, "Vector")
    n1 = kit.math_node(nt, "POWER", vor.outputs["Distance"], 0.6, (-1150, -100))
    n2 = kit.noise(nt, obj, 1000, 3, 0.6, (-1300, -350))
    n3 = kit.noise(nt, obj, 45, 4, 0.5, (-1300, -600))
    h12 = kit.math_node(nt, "MULTIPLY_ADD", n2.outputs["Fac"], 0.35, (-1050, -200))
    kit.link(nt, n1, h12, 0, 2)
    h123 = kit.math_node(nt, "MULTIPLY_ADD", n3.outputs["Fac"], 0.35, (-850, -300))
    kit.link(nt, h12, h123, 0, 2)
    seamg = kit.math_node(nt, "MULTIPLY", sep.outputs["Green"], -0.5, (-1050, 300))
    hgt = kit.math_node(nt, "ADD", h123.outputs[0], seamg.outputs[0], (-650, -200))
    # colour from its own noise so it doesn't simply follow the bumps
    cn = kit.noise(nt, obj, 18, 6, 0.6, (-1300, 150), distortion=0.6)
    meat = kit.ramp(nt, [(0.32, kit.rgb("#110a06")), (0.45, kit.rgb("#22150c")), (0.55, kit.rgb("#382313")),
                         (0.66, kit.rgb("#4e321b")), (0.78, kit.rgb("#684427"))], (-1000, 150))
    kit.link(nt, cn, meat, "Fac", "Fac")
    charn = kit.noise(nt, obj, 75, 4, 0.55, (-1300, 400))
    charr = kit.ramp(nt, [(0.58, (0, 0, 0, 1)), (0.66, (1, 1, 1, 1))], (-1000, 400))
    kit.link(nt, charn, charr, "Fac", "Fac")
    meat2 = kit.mix_rgb(nt, charr.outputs[0], meat.outputs[0], kit.rgb("#080302"), "MIX", (-700, 250))
    # crevices a touch redder (juice), peaks a touch darker
    cav = kit.ramp(nt, [(0.35, (0.55, 0.5, 0.48, 1)), (0.6, (1, 1, 1, 1)), (0.9, (1.06, 0.95, 0.88, 1))], (-700, 0))
    kit.link(nt, h12, cav, 0, "Fac")
    meat3 = kit.mix_rgb(nt, 1.0, meat2.outputs[2], cav.outputs[0], "MULTIPLY", (-450, 200))
    # rendered fat: golden, darker where it caught the broiler
    fatc = kit.ramp(nt, [(0.3, kit.rgb("#24100a")), (0.5, kit.rgb("#5a3012")), (0.7, kit.rgb("#8e5c26"))], (-700, 650))
    kit.link(nt, cn, fatc, "Fac", "Fac")
    geo = kit.node(nt, "ShaderNodeNewGeometry", (-1300, 1000))
    nz = kit.node(nt, "ShaderNodeSeparateXYZ", (-1100, 1000))
    kit.link(nt, geo, nz, "Normal", 0)
    sidez = kit.math_node(nt, "ABSOLUTE", nz.outputs["Z"], None, (-950, 1000))
    side = kit.math_node(nt, "SUBTRACT", 0.8, sidez.outputs[0], (-800, 1000), clamp=True)
    side2 = kit.math_node(nt, "MULTIPLY", side.outputs[0], 1.6, (-650, 1000), clamp=True)
    capside = kit.math_node(nt, "MULTIPLY", side2.outputs[0], sep.outputs["Blue"], (-500, 1000))
    fat_top = kit.math_node(nt, "MULTIPLY", sep.outputs["Green"], 0.4, (-650, 850))
    fmask = kit.math_node(nt, "MAXIMUM", capside.outputs[0], fat_top.outputs[0], (-350, 900))
    fsm = kit.ramp(nt, [(0.3, (0, 0, 0, 1)), (0.75, (0.7, 0.7, 0.7, 1))], (-200, 900))
    kit.link(nt, fmask, fsm, 0, "Fac")
    col = kit.mix_rgb(nt, fsm.outputs[0], meat3.outputs[2], fatc.outputs[0], "MIX", (0, 400))
    kit.link(nt, col, b, 2, "Base Color")
    # mostly satin, with wet patches of fat and juice
    wet = kit.noise(nt, obj, 12, 3, 0.5, (-700, -500))
    wetr = kit.ramp(nt, [(0.46, (0.32, 0.32, 0.32, 1)), (0.6, (0.13, 0.13, 0.13, 1))], (-450, -500))
    kit.link(nt, wet, wetr, "Fac", "Fac")
    kit.link(nt, wetr, b, 0, "Roughness")
    b.inputs["Subsurface Weight"].default_value = 0.0
    spec = kit.node(nt, "ShaderNodeMapRange", (-200, -650))
    spec.inputs["From Min"].default_value = 0.16
    spec.inputs["From Max"].default_value = 0.5
    spec.inputs["To Min"].default_value = 0.42
    spec.inputs["To Max"].default_value = 0.22
    kit.link(nt, wetr, spec, 0, "Value")
    kit.link(nt, spec, b, 0, "Specular IOR Level")
    bm = kit.bump(nt, hgt.outputs[0], 0.6, 0.0014, (300, -450))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def interior_material(img):
    """Cut faces: crust -> grey band -> rosy medium-rare, with fat and grain."""
    m, nt, b = kit.new_mat("RibeyeInside")
    tc, sep = _map_node(nt, img, (-1600, 300), jitter=0.02)
    obj = tc.outputs["Object"]
    # distance to the nearest outer surface in mm: min(edge distance from the map, top/bottom)
    sepxyz = kit.node(nt, "ShaderNodeSeparateXYZ", (-1300, -100))
    kit.link(nt, tc, sepxyz, "Object", "Vector")
    absz = kit.math_node(nt, "ABSOLUTE", sepxyz.outputs["Z"], None, (-1100, -100))
    dz = kit.math_node(nt, "SUBTRACT", H / 2 + 0.0015, absz.outputs[0], (-900, -100))
    dz_mm = kit.math_node(nt, "MULTIPLY", dz.outputs[0], 1000, (-700, -100))
    de_mm = kit.math_node(nt, "MULTIPLY", sep.outputs["Red"], 100, (-700, 100))
    dmin = kit.math_node(nt, "SMOOTH_MIN", de_mm.outputs[0], dz_mm.outputs[0], (-500, 0))
    dmin.inputs[2].default_value = 2.0
    wob = kit.noise(nt, obj, 160, 3, 0.5, (-900, -350))
    wob_s = kit.math_node(nt, "MULTIPLY_ADD", wob.outputs["Fac"], 2.2, (-500, -250))
    wob_s.inputs[2].default_value = -1.1
    dd = kit.math_node(nt, "ADD", dmin.outputs[0], wob_s.outputs[0], (-300, 0))
    norm = kit.math_node(nt, "DIVIDE", dd.outputs[0], 16.0, (-150, 0), clamp=True)
    don = kit.ramp(nt, [
        (0.00, kit.rgb("#1e0c06")), (0.07, kit.rgb("#4a2616")), (0.14, kit.rgb("#7a5648")),
        (0.26, kit.rgb("#987064")), (0.4, kit.rgb("#b0707a")), (0.6, kit.rgb("#b25c68")),
        (1.00, kit.rgb("#a84a5a"))], (50, 100))
    kit.link(nt, norm, don, 0, "Fac")
    # fat seam and marbling
    fatm = kit.ramp(nt, [(0.35, (0, 0, 0, 1)), (0.6, (0.9, 0.9, 0.9, 1))], (-300, 400))
    kit.link(nt, sep, fatm, "Green", "Fac")
    marb = kit.noise(nt, obj, 55, 8, 0.65, (-900, 500), distortion=1.2)
    marbr = kit.ramp(nt, [(0.62, (0, 0, 0, 1)), (0.7, (1, 1, 1, 1))], (-600, 600))
    kit.link(nt, marb, marbr, "Fac", "Fac")
    fat_all = kit.math_node(nt, "MAXIMUM", fatm.outputs[0], marbr.outputs[0], (-100, 500))
    fatc = kit.mix_rgb(nt, fat_all.outputs[0], don.outputs[0], kit.rgb("#e4cfae"), "MIX", (350, 200))
    # grain: fine fibres across the cut
    grain = kit.node(nt, "ShaderNodeTexWave", (-900, -600), Scale=120, Distortion=14, Detail=6)
    grain.wave_type = "BANDS"
    kit.link(nt, tc, grain, "Object", "Vector")
    gr = kit.math_node(nt, "MULTIPLY_ADD", grain.outputs["Fac"], 0.12, (100, -400))
    gr.inputs[2].default_value = 0.9
    col = kit.mix_rgb(nt, 1.0, fatc.outputs[2], gr.outputs[0], "MULTIPLY", (550, 100))
    kit.link(nt, col, b, 2, "Base Color")
    b.inputs["Roughness"].default_value = 0.38
    b.inputs["Subsurface Weight"].default_value = 0.2
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.25, 0.2)
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.22
    fib = kit.noise(nt, obj, 900, 3, 0.6, (-900, -850))
    fh = kit.math_node(nt, "MULTIPLY_ADD", fib.outputs["Fac"], 0.6, (100, -700))
    kit.link(nt, grain, fh, "Fac", 2)
    bm = kit.bump(nt, fh.outputs[0], 0.3, 0.0006, (300, -500))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def bone_material():
    """Frenched rib bone: scraped clean, cream with roast-browned patches, darker toward the tip."""
    m, nt, b = kit.new_mat("Bone")
    obj = kit.tex_coord(nt)
    n = kit.noise(nt, obj, 45, 6, 0.6, (-900, 0), distortion=0.3)
    c = kit.ramp(nt, [(0.35, kit.rgb("#2e1708")), (0.5, kit.rgb("#5a3418")), (0.65, kit.rgb("#8a6238")),
                      (0.8, kit.rgb("#b09068"))], (-600, 0))
    kit.link(nt, n, c, "Fac", "Fac")
    sep = kit.node(nt, "ShaderNodeSeparateXYZ", (-900, 300))
    nt.links.new(obj, sep.inputs[0])
    tip = kit.node(nt, "ShaderNodeMapRange", (-700, 300))
    tip.inputs["From Min"].default_value = 0.05
    tip.inputs["From Max"].default_value = 0.092
    kit.link(nt, sep, tip, "X", "Value")
    n2 = kit.noise(nt, obj, 30, 4, 0.6, (-900, 500))
    tipn = kit.math_node(nt, "MULTIPLY", tip.outputs[0], n2.outputs["Fac"], (-500, 400))
    tipr = kit.ramp(nt, [(0.2, (0, 0, 0, 1)), (0.5, (1, 1, 1, 1))], (-350, 400))
    kit.link(nt, tipn, tipr, 0, "Fac")
    col = kit.mix_rgb(nt, tipr.outputs[0], c.outputs[0], kit.rgb("#4a2a12"), "MIX", (-150, 100))
    # near the meat the bone is browned and glossy with fat
    root = kit.node(nt, "ShaderNodeMapRange", (-700, -300))
    root.inputs["From Min"].default_value = 0.03
    root.inputs["From Max"].default_value = -0.01
    kit.link(nt, sep, root, "X", "Value")
    col2 = kit.mix_rgb(nt, root.outputs[0], col.outputs[2], kit.rgb("#3a1607"), "MIX", (50, 0))
    kit.link(nt, col2, b, 2, "Base Color")
    rr = kit.node(nt, "ShaderNodeMapRange", (-200, -300))
    rr.inputs["To Min"].default_value = 0.55
    rr.inputs["To Max"].default_value = 0.25
    kit.link(nt, root, rr, 0, "Value")
    kit.link(nt, rr, b, 0, "Roughness")
    b.inputs["Subsurface Weight"].default_value = 0.25
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.5)
    b.inputs["Subsurface Scale"].default_value = 0.002
    ridge = kit.node(nt, "ShaderNodeTexWave", (-900, -600), Scale=8, Distortion=3, Detail=4)
    ridge.bands_direction = "Y"
    nt.links.new(obj, ridge.inputs["Vector"])
    hh = kit.math_node(nt, "MULTIPLY_ADD", ridge.outputs["Fac"], 0.3, (-500, -600))
    kit.link(nt, n, hh, "Fac", 2)
    bm = kit.bump(nt, hh.outputs[0], 0.35, 0.0008)
    kit.link(nt, bm, b, 0, "Normal")
    return m


def bone(mat, crust):
    """A frenched rib bone: a flattened, gently curved shaft with a rounded, slightly knobbly end."""
    segs, rings = 28, 24
    root, length = -0.07, 0.135
    verts, faces = [], []
    for i in range(segs + 1):
        u = i / segs
        x = root + u * length
        y = 0.006 * math.sin(u * math.pi)
        w = 0.016 * (1.0 + 0.1 * math.sin(u * 7)) * (1.12 if u > 0.82 else 1.0)
        hgt = 0.0075
        if u > 0.92:
            k = (u - 0.92) / 0.08
            w *= math.sqrt(max(0.0, 1 - k * k)) * 0.85 + 0.15
            hgt *= math.sqrt(max(0.0, 1 - k * k)) * 0.85 + 0.15
        for j in range(rings):
            a = j / rings * math.tau
            verts.append((x, y + w * math.cos(a), hgt * math.sin(a)))
    for i in range(segs):
        for j in range(rings):
            a = i * rings + j
            b_ = i * rings + (j + 1) % rings
            faces.append((a, b_, b_ + rings, a + rings))
    end = len(verts)
    verts.append((root + length + 0.002, 0.0, 0.0))
    for j in range(rings):
        faces.append((segs * rings + j, segs * rings + (j + 1) % rings, end))
    o = kit.mesh_obj("Bone", verts, faces, mat)
    sub = o.modifiers.new("s", "SUBSURF")
    sub.levels = sub.render_levels = 1
    return o


def salt_flakes(target, count=45, seed=3, region=None, name="SteakSalt"):
    """House steak salt: small flat translucent crystals scattered on the top surfaces."""
    rng = random.Random(seed)
    m, nt, b = kit.new_mat("Salt")
    b.inputs["Base Color"].default_value = (0.9, 0.88, 0.85, 1)
    b.inputs["Roughness"].default_value = 0.08
    b.inputs["Transmission Weight"].default_value = 0.85
    b.inputs["IOR"].default_value = 1.54
    deps = bpy.context.evaluated_depsgraph_get()
    ev = target.evaluated_get(deps)
    mw = target.matrix_world
    verts, faces = [], []
    tries = 0
    while len(faces) < count * 6 and tries < count * 40:
        tries += 1
        lx = rng.uniform(-0.1, 0.1)
        ly = rng.uniform(-0.08, 0.08)
        if region and not region(lx, ly):
            continue
        hit, loc, nrm, _ = ev.ray_cast(Vector((lx, ly, 0.2)), Vector((0, 0, -1)))
        if not hit or nrm.z < 0.6:
            continue
        s = rng.uniform(0.0012, 0.0026)
        base = len(verts)
        rot = rng.uniform(0, math.tau)
        p = mw @ (loc + Vector((0, 0, s * 0.3)))
        corners = []
        for k in range(4):
            a = rot + k * math.pi / 2
            corners.append(Vector((math.cos(a) * s, math.sin(a) * s, 0)))
        for zz in (0.0, s * 0.35):
            for cvec in corners:
                verts.append(tuple(p + cvec + Vector((0, 0, zz))))
        faces += [(base, base + 1, base + 2, base + 3), (base + 7, base + 6, base + 5, base + 4)]
        for k in range(4):
            a0, a1 = base + k, base + (k + 1) % 4
            faces.append((a0, a1, a1 + 4, a0 + 4))
    o = kit.mesh_obj(name, verts, faces, m, smooth=False)
    return o


def build(split=False, seed=7, salt=False):
    """Returns (root empty, dict of objects). The steak sits on z=0, centred on the origin.
    split=True cuts it across at x=CUT into 'near' (with the bone) and 'far' halves, so a scene can
    pull them apart and show the medium-rare inside."""
    img = bake_map(seed)
    crust = crust_material(img)
    inside = interior_material(img)
    root = bpy.data.objects.new("RibeyeRoot", None)
    bpy.context.scene.collection.objects.link(root)

    st = steak_mesh("Ribeye", seed)
    st.data.materials.append(crust)
    st.data.materials.append(inside)
    st.location.z = H / 2

    bn = bone(bone_material(), crust)
    # the bone runs along the notch side and sticks out to -x
    bn.rotation_euler = (0, math.radians(4), math.radians(188))
    bn.location = (-0.062, -0.034, H / 2 + 0.002)
    objs = {"bone": bn}
    if salt:
        objs["salt"] = salt_flakes(st)
    if split:
        near, far = split_steak(st, inside)
        objs.update(near=near, far=far)
    else:
        objs["steak"] = st
    for o in objs.values():
        o.parent = root
    return root, objs


CUT = 0.018


def split_steak(st, inside, x=CUT):
    """Two halves of one boolean cut. Both keep the steak's object space, so the inside shader
    lines up wherever they are moved."""
    halves = []
    for op, xa, xb in (("near", -0.3, x), ("far", x, 0.3)):
        h = st.copy()
        h.data = st.data.copy()
        bpy.context.scene.collection.objects.link(h)
        bpy.ops.mesh.primitive_cube_add(size=1)
        c = bpy.context.active_object
        c.scale = (xb - xa, 0.4, 0.4)
        c.location = ((xa + xb) / 2, 0, H / 2)
        c.data.materials.append(inside)
        bm = h.modifiers.new("cut", "BOOLEAN")
        bm.operation = "INTERSECT"
        bm.object = c
        bm.solver = "EXACT"
        bm.material_mode = "TRANSFER"
        kit.apply_modifiers(h)
        bpy.data.objects.remove(c)
        # the cut is one flat n-gon: shade it flat, or it borrows the crust's curved normals
        for poly in h.data.polygons:
            if poly.material_index == 1:
                poly.use_smooth = False
        h.name = "Ribeye_" + op
        halves.append(h)
    bpy.data.objects.remove(st)
    return halves
