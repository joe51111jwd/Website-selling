"""Caviar & Latkes: three crispy potato latkes, crème fraîche, a mound of Ossetra caviar, chives.

The latkes are a lumpy disc plus a fringe of fried potato shreds (bevelled curves). The caviar is
one mesh of a few hundred pearls, packed into a dome with a little rejection sampling; each pearl
carries a random value so the shader can vary it from olive-grey to golden-brown.
"""
import math
import random

import bpy
from mathutils import Vector

import kit
import studio

R_LATKE = 0.033


def latke_body(name, mat, seed, R=R_LATKE, t=0.013):
    rng = random.Random(seed)
    ph = [rng.uniform(0, math.tau) for _ in range(6)]

    def rim(a):
        return R * (1 + 0.06 * math.sin(3 * a + ph[0]) + 0.04 * math.sin(5 * a + ph[1])
                    + 0.03 * math.sin(9 * a + ph[2]) + 0.02 * math.sin(15 * a + ph[3]))

    segs, rings = 96, 10
    verts = [(0, 0, t)]
    for i in range(segs):
        a = i / segs * math.tau
        rr = rim(a)
        c, s = math.cos(a), math.sin(a)
        for k in range(1, rings + 1):
            f = k / rings
            z = t * (1 - max(0.0, (f - 0.6) / 0.4) ** 2 * 0.55)
            verts.append((rr * f * c, rr * f * s, z))
        # side and underside
        verts.append((rr * 1.02 * c, rr * 1.02 * s, t * 0.25))
        for k in range(rings, 0, -1):
            f = k / rings
            verts.append((rr * f * 0.97 * c, rr * f * 0.97 * s, 0.0))
    verts.append((0, 0, 0))
    P = rings * 2 + 1
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
    tex = bpy.data.textures.new(name + "_lumps", "CLOUDS")
    tex.noise_scale = 0.006
    tex.noise_depth = 3
    d = o.modifiers.new("lumps", "DISPLACE")
    d.texture = tex
    d.strength = 0.003
    d.texture_coords = "OBJECT"
    sub = o.modifiers.new("s", "SUBSURF")
    sub.levels = sub.render_levels = 1
    return o, rim, t


def shreds(name, mat, body, rim, t, seed, count=260):
    """Fried potato shreds draped over the latke: strands are laid out in xy, then dropped onto the
    body's surface with ray casts, so they follow its lumps; at the rim they poke out as a crisp lace."""
    rng = random.Random(seed)
    deps = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(deps)

    def surface_z(x, y):
        hit, loc, nrm, _ = ev.ray_cast(Vector((x, y, 0.1)), Vector((0, 0, -1)))
        return loc.z if hit else None

    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.0011
    cu.bevel_resolution = 1
    cu.resolution_u = 3
    for k in range(count):
        a = rng.uniform(0, math.tau)
        rim_strand = k < count * 0.2
        if rim_strand:
            r0 = rim(a) * rng.uniform(0.78, 0.95)
            ang = a + rng.uniform(-1.2, 1.2)
            ln = rng.uniform(0.006, 0.011)
        else:
            r0 = rim(a) * math.sqrt(rng.uniform(0.0, 0.9))
            ang = rng.uniform(0, math.tau)
            ln = rng.uniform(0.008, 0.02)
        x0, y0 = r0 * math.cos(a), r0 * math.sin(a)
        curl = math.radians(rng.uniform(-70, 70))
        pts = []
        lastz = None
        for j in range(7):
            u = j / 6
            an = ang + curl * u
            px = x0 + math.cos(an) * ln * u + math.sin(u * 9 + k) * 0.0006
            py = y0 + math.sin(an) * ln * u + math.cos(u * 7 + k) * 0.0006
            z = surface_z(px, py)
            if z is None:
                # past the edge: crisp lace sticking out and slightly down
                z = (lastz if lastz is not None else t * 0.5) - 0.0009
            else:
                z += 0.0006
            lastz = z
            pts.append((px, py, z))
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for p, co in zip(sp.points, pts):
            p.co = (*co, 1)
        sp.use_smooth = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o


def quenelle(name, mat, seed, length=0.032, width=0.021, height=0.012):
    """Crème fraîche, shaped with two spoons: a lemon-shaped dome with a soft ridge."""
    rng = random.Random(seed)
    segs, rings = 64, 16
    verts = [(0, 0, height)]
    for k in range(1, rings + 1):
        v = k / rings * (math.pi / 2)
        for i in range(segs):
            u = i / segs * math.tau
            # lemon outline: pointed ends along x
            ex = math.cos(u) * (length / 2)
            ey = math.sin(u) * (width / 2) * (1 - 0.25 * abs(math.cos(u)) ** 3)
            r = math.sin(v)
            z = height * math.cos(v) ** 0.8
            ridge = 0.0009 * math.sin(u * 2 + 0.6) * math.sin(v * 2)
            verts.append((ex * r, ey * r + ridge, z))
    faces = []
    for i in range(segs):
        faces.append((0, 1 + i, 1 + (i + 1) % segs))
    for k in range(rings - 1):
        for i in range(segs):
            a = 1 + k * segs + i
            b = 1 + k * segs + (i + 1) % segs
            faces.append((a, a + segs, b + segs, b))
    # close the bottom
    base = 1 + (rings - 1) * segs
    verts.append((0, 0, 0))
    c = len(verts) - 1
    for i in range(segs):
        faces.append((base + (i + 1) % segs, base + i, c))
    o = kit.mesh_obj(name, verts, faces, mat)
    o.rotation_euler.z = rng.uniform(-0.4, 0.4)
    sub = o.modifiers.new("s", "SUBSURF")
    sub.levels = sub.render_levels = 1
    return o


def caviar(name, mat, seed, r=0.00155, a=0.0145, b=0.0105, c=0.0085, base_z=0.0):
    """A quenelle-shaped mound of pearls: a jittered close-packed lattice cut by an ellipsoid cap
    (semi-axes a, b, height c) sitting at base_z."""
    rng = random.Random(seed)
    d = 2 * r * 1.01
    pts = []
    nz = int(c / (d * 0.816)) + 2
    nx = int(a / d) + 2
    ny = int(b / (d * 0.866)) + 2
    for k in range(nz):
        z = k * d * 0.816
        ox = (d / 2) * (k % 2)
        oy = (d * 0.289) * (k % 2)
        for j in range(-ny, ny + 1):
            for i in range(-nx, nx + 1):
                x = i * d + (d / 2) * (j % 2) + ox
                y = j * d * 0.866 + oy
                if (x / a) ** 2 + (y / b) ** 2 + (z / c) ** 2 <= 1.0:
                    pts.append(Vector((x + rng.uniform(-0.15, 0.15) * r, y + rng.uniform(-0.15, 0.15) * r,
                                       base_z + r + z + rng.uniform(-0.1, 0.1) * r)))
    me = bpy.data.meshes.new(name)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    import bmesh
    bm = bmesh.new()
    rand_layer = bm.verts.layers.float.new("pearl")
    for p in pts:
        rr = r * rng.uniform(0.92, 1.04)
        res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rr)
        val = rng.random()
        for v in res["verts"]:
            v.co += p
            v[rand_layer] = val
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(mat)
    return o


def chives(name, mat, seed, count=7, spread=0.05):
    rng = random.Random(seed)
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.0007
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    out = []
    for k in range(count):
        x, y = rng.uniform(-spread, spread), rng.uniform(-spread * 0.5, spread * 0.5)
        ang = rng.uniform(0, math.tau)
        ln = rng.uniform(0.005, 0.011)
        sp = cu.splines.new("POLY")
        sp.points.add(1)
        sp.points[0].co = (x, y, 0, 1)
        sp.points[1].co = (x + math.cos(ang) * ln, y + math.sin(ang) * ln, 0, 1)
        out.append((x, y))
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o


# ---------------------------------------------------------------- materials

def latke_material():
    m, nt, b = kit.new_mat("Latke")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1400, 0))
    obj = tc.outputs["Object"]
    # shredded look: stretched noise in a few directions
    wave = kit.noise(nt, obj, 260, 4, 0.6, (-1100, -300))
    nt.links.new(obj, wave.inputs["Vector"])
    n = kit.noise(nt, obj, 70, 6, 0.6, (-1100, 100), distortion=0.8)
    col = kit.ramp(nt, [(0.25, kit.rgb("#2a1204")), (0.42, kit.rgb("#4e2608")), (0.58, kit.rgb("#7a4210")),
                        (0.75, kit.rgb("#9a5c1c"))], (-800, 100))
    kit.link(nt, n, col, "Fac", "Fac")
    ww = kit.ramp(nt, [(0.3, (0.7, 0.62, 0.55, 1)), (0.7, (1.05, 1.0, 0.95, 1))], (-800, -300))
    kit.link(nt, wave, ww, "Fac", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], ww.outputs[0], "MULTIPLY", (-500, 0))
    kit.link(nt, c2, b, 2, "Base Color")
    rough = kit.noise(nt, obj, 30, 3, 0.5, (-800, -600))
    rr = kit.ramp(nt, [(0.4, (0.55, 0.55, 0.55, 1)), (0.65, (0.2, 0.2, 0.2, 1))], (-500, -600))
    kit.link(nt, rough, rr, "Fac", "Fac")
    kit.link(nt, rr, b, 0, "Roughness")
    b.inputs["Subsurface Weight"].default_value = 0.15
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.7, 0.3)
    b.inputs["Subsurface Scale"].default_value = 0.002
    h = kit.math_node(nt, "MULTIPLY_ADD", wave.outputs["Fac"], 0.5, (-500, -400))
    kit.link(nt, n, h, "Fac", 2)
    bm = kit.bump(nt, h.outputs[0], 1.0, 0.002, (-200, -500))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def shred_material():
    m, nt, b = kit.new_mat("Shred")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1000, 0))
    n = kit.noise(nt, tc.outputs["Object"], 90, 5, 0.65, (-800, 0), distortion=1.5)
    col = kit.ramp(nt, [(0.3, kit.rgb("#4a2004")), (0.42, kit.rgb("#8a4a0e")), (0.55, kit.rgb("#b8761e")),
                        (0.68, kit.rgb("#d6a044"))], (-500, 0))
    kit.link(nt, n, col, "Fac", "Fac")
    kit.link(nt, col, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.32
    b.inputs["Subsurface Weight"].default_value = 0.3
    b.inputs["Subsurface Scale"].default_value = 0.0015
    return m


def creme_material():
    m, nt, b = kit.new_mat("CremeFraiche")
    b.inputs["Base Color"].default_value = kit.rgb("#f4efe4")
    b.inputs["Roughness"].default_value = 0.28
    b.inputs["Subsurface Weight"].default_value = 1.0
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.95, 0.8)
    b.inputs["Subsurface Scale"].default_value = 0.004
    b.inputs["Coat Weight"].default_value = 0.3
    b.inputs["Coat Roughness"].default_value = 0.15
    tc = kit.node(nt, "ShaderNodeTexCoord", (-800, -300))
    n = kit.noise(nt, tc.outputs["Object"], 300, 3, 0.5, (-600, -300))
    bm = kit.bump(nt, n.outputs["Fac"], 0.06, 0.0005, (-300, -300))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def caviar_material():
    """Ossetra: glassy, wet, olive-grey to golden-brown, each pearl a little different."""
    m, nt, b = kit.new_mat("Ossetra")
    at = kit.node(nt, "ShaderNodeAttribute", (-900, 0))
    at.attribute_name = "pearl"
    col = kit.ramp(nt, [(0.0, kit.rgb("#16130e")), (0.45, kit.rgb("#2a2216")), (0.8, kit.rgb("#4a3a20")),
                        (1.0, kit.rgb("#6a5228"))], (-600, 0))
    kit.link(nt, at, col, "Fac", "Fac")
    kit.link(nt, col, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.08
    b.inputs["Subsurface Weight"].default_value = 0.8
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.75, 0.35)
    b.inputs["Subsurface Scale"].default_value = 0.0015
    b.inputs["Specular IOR Level"].default_value = 0.5
    return m


def chive_material():
    m, nt, b = kit.new_mat("Chive")
    b.inputs["Base Color"].default_value = kit.rgb("#2c5a12")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Subsurface Weight"].default_value = 0.5
    b.inputs["Subsurface Radius"].default_value = (0.4, 1.0, 0.3)
    b.inputs["Subsurface Scale"].default_value = 0.002
    return m


# ---------------------------------------------------------------- assembly

def build(plate_mat=None):
    root = bpy.data.objects.new("LatkesRoot", None)
    bpy.context.scene.collection.objects.link(root)
    plate = studio.plate(radius=0.12, rim=0.022, depth=0.011,
                         mat=plate_mat or studio.porcelain(), name="Plate")
    plate.parent = root
    lm, sm, cm, cv, ch = latke_material(), shred_material(), creme_material(), caviar_material(), chive_material()
    # three latkes in a loose triangle
    spots = [(-0.038, -0.026, 0.25), (0.04, -0.022, -0.3), (0.0, 0.042, 0.6)]
    objs = [plate]
    floor = 0.0076  # top of the plate's well
    for i, (x, y, rot) in enumerate(spots):
        body, rim, t = latke_body(f"Latke{i}", lm, seed=10 + i)
        sh = shreds(f"Shreds{i}", sm, body, rim, t, seed=20 + i)
        q = quenelle(f"Creme{i}", cm, seed=30 + i)
        q.location.z = t - 0.001
        cav = caviar(f"Caviar{i}", cv, seed=40 + i, base_z=t + 0.0062)
        cav.rotation_euler.z = rot * 0.5
        chv = chives(f"Chives{i}", ch, seed=50 + i, count=5, spread=0.009)
        chv.location.z = t + 0.0062 + 0.0085 + 0.0024
        grp = bpy.data.objects.new(f"LatkeGroup{i}", None)
        bpy.context.scene.collection.objects.link(grp)
        grp.parent = root
        grp.location = (x, y, floor)
        grp.rotation_euler.z = rot
        for o in (body, sh, q, cav, chv):
            o.parent = grp
        objs += [body, sh, q, cav, chv]
    return root, objs
