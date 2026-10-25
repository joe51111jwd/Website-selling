"""The Joyce Burger: brioche bun, American cheese, two 75:25 all-beef patties, Joyce sauce.

Every layer is its own object so the burger can be assembled or pulled apart ("burgerability":
every component in one bite). build() returns the layers bottom to top with their assembled z.
"""
import math
import random

import bpy

import kit

R_BUN = 0.054
R_PATTY = 0.052


# ---------------------------------------------------------------- shapes

def lathe(name, profile, segs=96, noise=0.0, seed=1, mat=None, subdiv=1):
    """Revolve [(r, z), ...] (open profile from the axis back to the axis) around z."""
    rng = random.Random(seed)
    ph = [rng.uniform(0, math.tau) for _ in range(4)]
    verts, faces = [], []
    P = len(profile)
    for i in range(segs):
        a = i / segs * math.tau
        k = 1 + noise * (math.sin(3 * a + ph[0]) * 0.5 + math.sin(5 * a + ph[1]) * 0.3 + math.sin(2 * a + ph[2]) * 0.6)
        for r, z in profile:
            verts.append((r * k * math.cos(a), r * k * math.sin(a), z))
    for i in range(segs):
        j = (i + 1) % segs
        for p in range(P - 1):
            faces.append((i * P + p, j * P + p, j * P + p + 1, i * P + p + 1))
    o = kit.mesh_obj(name, verts, faces, mat)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    if subdiv:
        s = o.modifiers.new("s", "SUBSURF")
        s.levels = s.render_levels = subdiv
    if noise:
        tex = bpy.data.textures.new(name + "_lumps", "CLOUDS")
        tex.noise_scale = 0.025
        d = o.modifiers.new("lumps", "DISPLACE")
        d.texture = tex
        d.strength = 0.0025
        d.texture_coords = "OBJECT"
    return o


def crown_profile(R=R_BUN, h=0.038, base=0.0):
    """Domed top bun, cut face at z=base (pointing down)."""
    pts = [(0.0, base)]
    for i in range(1, 7):
        pts.append((R * 0.93 * i / 6, base))
    # rounded lower edge, then the dome
    pts.append((R * 0.985, base + 0.0025))
    pts.append((R, base + 0.007))
    for i in range(1, 17):
        t = i / 16
        ang = t * math.pi / 2
        r = R * math.cos(ang) ** 0.85
        z = base + 0.007 + (h - 0.007) * math.sin(ang) ** 0.75
        pts.append((r, z))
    pts[-1] = (0.0, base + h)
    return pts


def heel_profile(R=R_BUN, h=0.02):
    pts = [(0.0, 0.0)]
    for i in range(1, 6):
        pts.append((R * 0.9 * i / 5, 0.0))
    pts += [(R * 0.96, 0.0012), (R * 0.99, 0.004), (R * 1.01, 0.009), (R * 1.005, 0.014), (R * 0.985, 0.0175),
            (R * 0.96, h)]
    for i in range(1, 7):
        pts.append((R * 0.96 * (1 - i / 6), h))
    return pts


def patty(name, mat, seed=3, R=R_PATTY, t=0.0095, segs=180):
    """A smashed patty: thin crispy lace at the rim, a thicker craggy middle."""
    rng = random.Random(seed)
    ph = [rng.uniform(0, math.tau) for _ in range(8)]

    def rim(a):
        return R * (1 + 0.035 * math.sin(3 * a + ph[0]) + 0.025 * math.sin(5 * a + ph[1])
                    + 0.02 * math.sin(11 * a + ph[2]) + 0.018 * math.sin(17 * a + ph[3])
                    + 0.012 * math.sin(29 * a + ph[4]) + 0.008 * math.sin(41 * a + ph[5]))

    rings = 14
    verts = [(0, 0, t)]
    for i in range(segs):
        a = i / segs * math.tau
        rr = rim(a)
        c, s = math.cos(a), math.sin(a)
        for k in range(1, rings + 1):
            f = k / rings
            # thickness falls away over the outer 30%: a crispy lacy edge
            th = t * (1.0 if f < 0.7 else max(0.18, 1 - ((f - 0.7) / 0.3) ** 1.6 * 0.82))
            verts.append((rr * f * c, rr * f * s, th))
        for k in range(rings, 0, -1):
            f = k / rings
            verts.append((rr * f * c, rr * f * s, 0.0 if f < 0.92 else 0.0007))
    verts.append((0, 0, 0))
    P = rings * 2
    last = len(verts) - 1

    def vid(i, p):
        return 1 + (i % segs) * P + p

    faces = []
    for i in range(segs):
        faces.append((0, vid(i, 0), vid(i + 1, 0)))
        for p in range(P - 1):
            faces.append((vid(i, p), vid(i, p + 1), vid(i + 1, p + 1), vid(i + 1, p)))
        faces.append((last, vid(i + 1, P - 1), vid(i, P - 1)))
    o = kit.mesh_obj(name, verts, faces, mat)
    tex = bpy.data.textures.new(name + "_crag", "CLOUDS")
    tex.noise_scale = 0.008
    tex.noise_depth = 3
    d = o.modifiers.new("crag", "DISPLACE")
    d.texture = tex
    d.strength = 0.0022
    d.texture_coords = "OBJECT"
    s_ = o.modifiers.new("s", "SUBSURF")
    s_.levels = s_.render_levels = 1
    return o, rim


def cheese(name, mat, rim, top, seed=5, size=0.094, n=64, rot=0.4):
    """A square slice of American cheese melted over a patty whose rim is rim(angle) at height top."""
    rng = random.Random(seed)
    sag = [rng.uniform(0.75, 1.25) for _ in range(4)]
    verts, faces = [], []
    half = size / 2
    for j in range(n + 1):
        for i in range(n + 1):
            x = -half + size * i / n
            y = -half + size * j / n
            # round the corners: pull the square toward a superellipse
            m = max(abs(x), abs(y))
            if m > 1e-9:
                se = (abs(x) ** 5 + abs(y) ** 5) ** 0.2
                x, y = x * m / se, y * m / se
            c, s = math.cos(rot), math.sin(rot)
            X, Y = x * c - y * s, x * s + y * c
            rho = math.hypot(X, Y)
            a = math.atan2(Y, X)
            edge = rim(a) * 0.96
            corner = max(abs(x), abs(y)) / half
            q = min(3, int(((a + math.pi) / (math.pi / 2)) % 4))
            if rho <= edge:
                z = top + 0.0011 - 0.0006 * (rho / edge) ** 4
                r_new = rho
            else:
                over = rho - edge
                # over the edge it folds down: radial reach shrinks, height drops
                r_new = edge + over * 0.3
                z = top + 0.0005 - over * 1.1 * sag[q] - over ** 2 * 12
                z = max(z, top - 0.022 * sag[q] * corner)
            k = r_new / rho if rho > 1e-6 else 1
            verts.append((X * k, Y * k, z))
    for j in range(n):
        for i in range(n):
            a0 = j * (n + 1) + i
            faces.append((a0, a0 + 1, a0 + n + 2, a0 + n + 1))
    o = kit.mesh_obj(name, verts, faces, mat)
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.0016
    sol.offset = -1
    sm = o.modifiers.new("smooth", "SMOOTH")
    sm.factor = 0.5
    sm.iterations = 4
    s_ = o.modifiers.new("s", "SUBSURF")
    s_.levels = s_.render_levels = 1
    return o


def sauce(name, mat, R, z, seed=9, drips=5, flip=False):
    """A layer of sauce with a few drips over the edge (hanging down; or up when flip, for the crown)."""
    rng = random.Random(seed)
    sgn = -1 if flip else 1
    verts = []
    segs, rings = 120, 8
    ph = [rng.uniform(0, math.tau) for _ in range(5)]
    drip_at = [rng.uniform(0, math.tau) for _ in range(drips)]
    for i in range(segs):
        a = i / segs * math.tau
        rr = R * (1 + 0.09 * math.sin(3 * a + ph[0]) + 0.05 * math.sin(7 * a + ph[1]) + 0.03 * math.sin(13 * a + ph[2]))
        boost = 0.0
        for d in drip_at:
            da = (a - d + math.pi) % math.tau - math.pi
            boost += math.exp(-(da / 0.09) ** 2)
        rr += boost * 0.006
        for k in range(1, rings + 1):
            f = k / rings
            hgt = 0.0036 * (1 - f ** 6)
            dz = -boost * 0.008 * max(0.0, (f - 0.85) / 0.15) ** 1.5
            verts.append((rr * f * math.cos(a), rr * f * math.sin(a), z + sgn * (hgt + dz)))
    faces = []
    verts.insert(0, (0, 0, z + sgn * 0.0028))
    for i in range(segs):
        j = (i + 1) % segs
        faces.append((0, 1 + i * rings, 1 + j * rings))
        for k in range(rings - 1):
            faces.append((1 + i * rings + k, 1 + i * rings + k + 1, 1 + j * rings + k + 1, 1 + j * rings + k))
    o = kit.mesh_obj(name, verts, faces, mat)
    if flip:
        o.data.flip_normals()
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.0012
    s_ = o.modifiers.new("s", "SUBSURF")
    s_.levels = s_.render_levels = 1
    return o


# ---------------------------------------------------------------- materials

def brioche_material():
    """Egg-washed brioche: deep glossy golden-brown on the crown fading to pale gold at the sides."""
    m, nt, b = kit.new_mat("Brioche")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1400, 0))
    obj = tc.outputs["Object"]
    geo = kit.node(nt, "ShaderNodeNewGeometry", (-1400, 400))
    nz = kit.node(nt, "ShaderNodeSeparateXYZ", (-1200, 400))
    kit.link(nt, geo, nz, "Normal", 0)
    n = kit.noise(nt, obj, 22, 5, 0.6, (-1200, -100))
    up = kit.math_node(nt, "MULTIPLY_ADD", n.outputs["Fac"], 0.5, (-950, 300))
    kit.link(nt, nz, up, "Z", 2)
    up.inputs[2].default_value = -0.25
    col = kit.ramp(nt, [(0.0, kit.rgb("#cc9a54")), (0.2, kit.rgb("#bc7a28")), (0.42, kit.rgb("#a85a14")),
                        (0.65, kit.rgb("#82400c")), (0.85, kit.rgb("#642c08")), (1.0, kit.rgb("#4e2206"))], (-700, 300))
    kit.link(nt, up, col, 0, "Fac")
    speck = kit.noise(nt, obj, 300, 2, 0.5, (-950, -300))
    spr = kit.ramp(nt, [(0.6, (1, 1, 1, 1)), (0.72, (0.82, 0.76, 0.7, 1))], (-700, -300))
    kit.link(nt, speck, spr, "Fac", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], spr.outputs[0], "MULTIPLY", (-400, 200))
    kit.link(nt, c2, b, 2, "Base Color")
    wet = kit.noise(nt, obj, 9, 3, 0.5, (-700, -700))
    wr = kit.ramp(nt, [(0.4, (0.32, 0.32, 0.32, 1)), (0.65, (0.12, 0.12, 0.12, 1))], (-450, -700))
    kit.link(nt, wet, wr, "Fac", "Fac")
    b.inputs["Roughness"].default_value = 0.5
    b.inputs["Coat Weight"].default_value = 0.55
    kit.link(nt, wr, b, 0, "Coat Roughness")
    b.inputs["Subsurface Weight"].default_value = 0.06
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.55)
    b.inputs["Subsurface Scale"].default_value = 0.002
    fine = kit.noise(nt, obj, 200, 4, 0.6, (-700, -500))
    bm = kit.bump(nt, fine.outputs["Fac"], 0.18, 0.0006, (0, -500))
    kit.link(nt, bm, b, 0, "Normal")
    kit.link(nt, bm, b, 0, "Coat Normal")
    return m


def crumb_material():
    """The cut faces, toasted on the griddle in butter: golden-brown, darker in the middle, open crumb."""
    m, nt, b = kit.new_mat("Crumb")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1400, 0))
    obj = tc.outputs["Object"]
    vor = kit.node(nt, "ShaderNodeTexVoronoi", (-1100, -200), Scale=420.0)
    vor.feature = "SMOOTH_F1"
    nt.links.new(obj, vor.inputs["Vector"])
    n = kit.noise(nt, obj, 40, 5, 0.6, (-1100, 200))
    sep = kit.node(nt, "ShaderNodeSeparateXYZ", (-1100, 450))
    nt.links.new(obj, sep.inputs[0])
    rad = kit.node(nt, "ShaderNodeVectorMath", (-900, 450))
    rad.operation = "LENGTH"
    comb = kit.node(nt, "ShaderNodeCombineXYZ", (-1000, 450))
    kit.link(nt, sep, comb, "X", "X")
    kit.link(nt, sep, comb, "Y", "Y")
    kit.link(nt, comb, rad, 0, 0)
    rr = kit.node(nt, "ShaderNodeMapRange", (-750, 450))
    rr.inputs["From Min"].default_value = 0.0
    rr.inputs["From Max"].default_value = R_BUN
    kit.link(nt, rad, rr, "Value", "Value")
    toast = kit.math_node(nt, "MULTIPLY_ADD", n.outputs["Fac"], 0.6, (-600, 300))
    kit.link(nt, rr, toast, 0, 2)
    col = kit.ramp(nt, [(0.25, kit.rgb("#8a4a18")), (0.5, kit.rgb("#b8742e")), (0.8, kit.rgb("#dcae6a")),
                        (1.0, kit.rgb("#ecd3a2"))], (-400, 300))
    kit.link(nt, toast, col, 0, "Fac")
    pores = kit.ramp(nt, [(0.0, (0.55, 0.5, 0.45, 1)), (0.25, (1, 1, 1, 1))], (-700, -200))
    kit.link(nt, vor, pores, "Distance", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], pores.outputs[0], "MULTIPLY", (-150, 200))
    kit.link(nt, c2, b, 2, "Base Color")
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Subsurface Weight"].default_value = 0.25
    b.inputs["Subsurface Scale"].default_value = 0.003
    b.inputs["Coat Weight"].default_value = 0.2
    b.inputs["Coat Roughness"].default_value = 0.3
    bm = kit.bump(nt, vor.outputs["Distance"], 0.6, 0.0012, (0, -400))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def patty_material():
    m, nt, b = kit.new_mat("Patty")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1400, 0))
    obj = tc.outputs["Object"]
    vd = kit.noise(nt, obj, 120, 3, 0.5, (-1500, -100))
    vdm = kit.node(nt, "ShaderNodeVectorMath", (-1350, -50))
    vdm.operation = "MULTIPLY_ADD"
    vdm.inputs[1].default_value = (0.004, 0.004, 0.004)
    kit.link(nt, vd, vdm, "Color", 0)
    nt.links.new(obj, vdm.inputs[2])
    vor = kit.node(nt, "ShaderNodeTexVoronoi", (-1150, -100), Scale=380.0)
    vor.feature = "SMOOTH_F1"
    kit.link(nt, vdm, vor, 0, "Vector")
    n = kit.noise(nt, obj, 30, 6, 0.65, (-1150, 200), distortion=0.6)
    fine = kit.noise(nt, obj, 900, 3, 0.6, (-1150, -400))
    h = kit.math_node(nt, "MULTIPLY_ADD", fine.outputs["Fac"], 0.4, (-900, -200))
    kit.link(nt, vor, h, "Distance", 2)
    # edges (thin lace) are lighter and crispier
    sep = kit.node(nt, "ShaderNodeSeparateXYZ", (-1150, 500))
    nt.links.new(obj, sep.inputs[0])
    comb = kit.node(nt, "ShaderNodeCombineXYZ", (-1000, 500))
    kit.link(nt, sep, comb, "X", "X")
    kit.link(nt, sep, comb, "Y", "Y")
    ln = kit.node(nt, "ShaderNodeVectorMath", (-850, 500))
    ln.operation = "LENGTH"
    kit.link(nt, comb, ln, 0, 0)
    ed = kit.node(nt, "ShaderNodeMapRange", (-700, 500))
    ed.inputs["From Min"].default_value = R_PATTY * 0.72
    ed.inputs["From Max"].default_value = R_PATTY * 1.02
    kit.link(nt, ln, ed, "Value", "Value")
    tone = kit.math_node(nt, "MULTIPLY_ADD", n.outputs["Fac"], 0.7, (-550, 300))
    kit.link(nt, ed, tone, 0, 2)
    tone.inputs[1].default_value = 0.0
    tone2 = kit.math_node(nt, "ADD", tone.outputs[0], None, (-450, 300))
    kit.link(nt, ed, tone2, 0, 1)
    col = kit.ramp(nt, [(0.15, kit.rgb("#120603")), (0.4, kit.rgb("#241007")), (0.65, kit.rgb("#3c1a0a")),
                        (0.85, kit.rgb("#5a2a10")), (1.0, kit.rgb("#7a3e18"))], (-300, 300))
    tn = kit.math_node(nt, "MULTIPLY", tone2.outputs[0], 0.75, (-380, 400))
    kit.link(nt, tn, col, 0, "Fac")
    cav = kit.ramp(nt, [(0.0, (0.6, 0.55, 0.5, 1)), (0.3, (1, 1, 1, 1))], (-500, 0))
    kit.link(nt, vor, cav, "Distance", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], cav.outputs[0], "MULTIPLY", (-100, 200))
    kit.link(nt, c2, b, 2, "Base Color")
    wet = kit.noise(nt, obj, 14, 3, 0.5, (-700, -600))
    wr = kit.ramp(nt, [(0.45, (0.42, 0.42, 0.42, 1)), (0.6, (0.14, 0.14, 0.14, 1))], (-450, -600))
    kit.link(nt, wet, wr, "Fac", "Fac")
    kit.link(nt, wr, b, 0, "Roughness")
    b.inputs["Specular IOR Level"].default_value = 0.55
    bm = kit.bump(nt, h.outputs[0], 0.75, 0.0014, (0, -400))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def cheese_material():
    m, nt, b = kit.new_mat("AmericanCheese")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1000, 0))
    n = kit.noise(nt, tc.outputs["Object"], 60, 3, 0.5, (-800, 0))
    col = kit.ramp(nt, [(0.35, kit.rgb("#f29600")), (0.65, kit.rgb("#f7ac22"))], (-500, 0))
    kit.link(nt, n, col, "Fac", "Fac")
    kit.link(nt, col, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.2
    b.inputs["Subsurface Weight"].default_value = 0.7
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.45, 0.08)
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 0.2
    b.inputs["Coat Roughness"].default_value = 0.1
    bm = kit.bump(nt, n.outputs["Fac"], 0.08, 0.001, (-200, -300))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def sauce_material():
    m, nt, b = kit.new_mat("JoyceSauce")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1000, 0))
    n = kit.noise(nt, tc.outputs["Object"], 500, 2, 0.5, (-800, 0))
    fl = kit.ramp(nt, [(0.7, kit.rgb("#e48a50")), (0.74, kit.rgb("#7a6a22"))], (-500, 0))
    kit.link(nt, n, fl, "Fac", "Fac")
    kit.link(nt, fl, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.25
    b.inputs["Subsurface Weight"].default_value = 0.35
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.7, 0.45)
    b.inputs["Subsurface Scale"].default_value = 0.0015
    b.inputs["Coat Weight"].default_value = 0.3
    b.inputs["Coat Roughness"].default_value = 0.05
    return m


# ---------------------------------------------------------------- assembly

LAYERS = ("heel", "sauce_low", "patty_low", "cheese_low", "patty_high", "cheese_high", "sauce_high", "crown")


def build():
    """Returns (root, [(key, obj, assembled_z)], parts). Every layer's mesh is modelled around z=0 of
    its own; obj.location.z = assembled_z puts it in place, and an explode() can space them out."""
    bri, crumb = brioche_material(), crumb_material()
    pm, cm, sm = patty_material(), cheese_material(), sauce_material()
    root = bpy.data.objects.new("BurgerRoot", None)
    bpy.context.scene.collection.objects.link(root)

    heel = lathe("Heel", heel_profile(), noise=0.012, seed=2, mat=bri)
    heel.data.materials.append(crumb)
    _cut_face(heel, 0.02, up=True)
    crown = lathe("Crown", crown_profile(), noise=0.015, seed=4, mat=bri)
    crown.data.materials.append(crumb)
    _cut_face(crown, 0.0, up=False)

    p1, rim1 = patty("PattyLow", pm, seed=3)
    p2, rim2 = patty("PattyHigh", pm, seed=8)
    c1 = cheese("CheeseLow", cm, rim1, 0.0095, seed=5, rot=0.35)
    c2 = cheese("CheeseHigh", cm, rim2, 0.0095, seed=6, rot=1.05)
    s1 = sauce("SauceLow", sm, 0.036, 0.0, seed=9, drips=2)
    s2 = sauce("SauceHigh", sm, 0.044, 0.0, seed=12, drips=3, flip=True)

    z = {
        "heel": 0.0, "sauce_low": 0.0195, "patty_low": 0.0215, "cheese_low": 0.0215,
        "patty_high": 0.0326, "cheese_high": 0.0326, "sauce_high": 0.0452, "crown": 0.0452,
    }
    objs = {"heel": heel, "sauce_low": s1, "patty_low": p1, "cheese_low": c1, "patty_high": p2,
            "cheese_high": c2, "sauce_high": s2, "crown": crown}
    # bake the modifiers in once: the patties and sauces have a many-sided centre vertex that makes
    # subdivision slow, and films would otherwise pay for it on every frame
    for o in objs.values():
        kit.apply_modifiers(o)
    layers = []
    for k in LAYERS:
        o = objs[k]
        o.parent = root
        o.location.z = z[k]
        layers.append((k, o, z[k]))
    return root, layers


def _cut_face(o, z, up):
    """Faces lying flat at height z (the cut side of a bun) get the crumb material."""
    for p in o.data.polygons:
        if abs(p.center.z - z) < 0.0008 and abs(p.normal.z) > 0.95:
            p.material_index = 1


def explode(layers, amount, gaps=None):
    """Space the layers out: amount 0 = assembled, 1 = fully exploded."""
    gaps = gaps or {"heel": 0.0, "sauce_low": 0.0, "patty_low": 0.034, "cheese_low": 0.058,
                    "patty_high": 0.088, "cheese_high": 0.112, "sauce_high": 0.15, "crown": 0.15}
    for k, o, z in layers:
        o.location.z = z + gaps[k] * amount
