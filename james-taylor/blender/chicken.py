"""Shanghai Firecracker Chicken: sticky glazed fried chicken with sweet, fried and dried chiles.

The pieces are dropped into the bowl with a rigid-body simulation, then frozen where they landed.
"""
import math
import random

import bmesh
import bpy
from mathutils import Vector

import kit


def bowl(mat, R=0.085, h=0.05, name="Bowl"):
    prof = [(0.0, 0.0), (R * 0.42, 0.0), (R * 0.45, 0.006), (R * 0.55, 0.008),
            (R * 0.8, 0.02), (R * 0.95, 0.036), (R, h), (R * 1.005, h + 0.002), (R * 0.97, h + 0.0015),
            (R * 0.92, h - 0.012), (R * 0.75, 0.024), (R * 0.5, 0.0125), (0.0, 0.011)]
    segs = 96
    verts, faces = [], []
    P = len(prof)
    for i in range(segs):
        a = i / segs * math.tau
        for r, z in prof:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(segs):
        j = (i + 1) % segs
        for p in range(P - 1):
            faces.append((i * P + p, j * P + p, j * P + p + 1, i * P + p + 1))
    o = kit.mesh_obj(name, verts, faces, mat)
    kit.select_only(o)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    s = o.modifiers.new("s", "SUBSURF")
    s.levels = s.render_levels = 2
    return o


def nugget(name, mat, rng):
    """A craggy piece of battered chicken, about 3 cm."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=4, radius=0.5)
    sx, sy, sz = rng.uniform(0.015, 0.02), rng.uniform(0.011, 0.015), rng.uniform(0.009, 0.012)
    ph = [rng.uniform(0, 100) for _ in range(3)]
    for v in bm.verts:
        d = v.co.normalized()
        lump = (math.sin(d.x * 5 + ph[0]) * math.sin(d.y * 4 + ph[1]) * math.sin(d.z * 6 + ph[2])) * 0.22
        lump += (math.sin(d.x * 13 + ph[1]) * math.sin(d.y * 11 + ph[2])) * 0.07
        lump += (math.sin(d.x * 3 + ph[2]) * math.cos(d.z * 2 + ph[0])) * 0.15
        v.co = Vector((d.x * sx, d.y * sy, d.z * sz)) * (1 + lump)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    tex = bpy.data.textures.new(name + "_crunch", "CLOUDS")
    tex.noise_scale = 0.003
    tex.noise_depth = 2
    d = o.modifiers.new("crunch", "DISPLACE")
    d.texture = tex
    d.strength = 0.0012
    d.texture_coords = "OBJECT"
    return o


def chile(name, mat, stem_mat, rng):
    """A whole dried red chile: a curved, flattened, wrinkled cone with a stem cap."""
    L = rng.uniform(0.038, 0.055)
    w = rng.uniform(0.0055, 0.0075)
    bend = rng.uniform(-0.35, 0.35)
    segs, rings = 24, 16
    verts, faces = [], []
    for i in range(rings + 1):
        u = i / rings
        x = u * L
        y = bend * L * (u ** 2) * 0.5
        rad = w * (1 - u) ** 0.65 * (0.6 + 0.4 * math.sin(min(1.0, u * 6) * math.pi / 2))
        rad = max(rad, 0.0003)
        for j in range(segs):
            a = j / segs * math.tau
            wr = 1 + 0.1 * math.sin(a * 5 + u * 20)
            verts.append((x, y + rad * math.cos(a) * wr, rad * math.sin(a) * 0.65 * wr))
    for i in range(rings):
        for j in range(segs):
            a = i * segs + j
            b = i * segs + (j + 1) % segs
            faces.append((a, b, b + segs, a + segs))
    tip = len(verts)
    verts.append((L + 0.0008, bend * L * 0.5, 0))
    for j in range(segs):
        faces.append((rings * segs + j, rings * segs + (j + 1) % segs, tip))
    base = len(verts)
    verts.append((-0.0008, 0, 0))
    for j in range(segs):
        faces.append(((j + 1) % segs, j, base))
    o = kit.mesh_obj(name, verts, faces, mat)
    # stem
    cu = bpy.data.curves.new(name + "_stem", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.0012
    sp = cu.splines.new("POLY")
    sp.points.add(1)
    sp.points[0].co = (0.0, 0, 0, 1)
    sp.points[1].co = (-0.008, 0.002 * rng.uniform(-1, 1), 0.001, 1)
    st = bpy.data.objects.new(name + "_stem", cu)
    bpy.context.scene.collection.objects.link(st)
    cu.materials.append(stem_mat)
    st.parent = o
    sub = o.modifiers.new("s", "SUBSURF")
    sub.levels = sub.render_levels = 1
    return o


def glaze_material():
    """Sticky sweet chile glaze over crisp batter: amber-red, caramel-dark in the cracks, mirror-glossy."""
    m, nt, b = kit.new_mat("FirecrackerGlaze")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1400, 0))
    obj = tc.outputs["Object"]
    n = kit.noise(nt, obj, 90, 6, 0.65, (-1100, 100), distortion=0.5)
    vor = kit.node(nt, "ShaderNodeTexVoronoi", (-1100, -200), Scale=300.0)
    vor.feature = "SMOOTH_F1"
    nt.links.new(obj, vor.inputs["Vector"])
    col = kit.ramp(nt, [(0.25, kit.rgb("#2a0a03")), (0.45, kit.rgb("#4e1606")), (0.62, kit.rgb("#76280c")),
                        (0.8, kit.rgb("#a24a18"))], (-800, 100))
    kit.link(nt, n, col, "Fac", "Fac")
    cav = kit.ramp(nt, [(0.0, (0.55, 0.45, 0.4, 1)), (0.3, (1, 1, 1, 1))], (-800, -200))
    kit.link(nt, vor, cav, "Distance", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], cav.outputs[0], "MULTIPLY", (-500, 0))
    kit.link(nt, c2, b, 2, "Base Color")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Subsurface Weight"].default_value = 0.25
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.2)
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.04
    b.inputs["Coat Tint"].default_value = (1.0, 0.82, 0.62, 1)
    h = kit.math_node(nt, "MULTIPLY_ADD", vor.outputs["Distance"], 0.8, (-500, -300))
    kit.link(nt, n, h, "Fac", 2)
    bm = kit.bump(nt, h.outputs[0], 0.7, 0.0015, (-200, -400))
    kit.link(nt, bm, b, 0, "Normal")
    bm2 = kit.bump(nt, n.outputs["Fac"], 0.3, 0.002, (-200, -600))
    kit.link(nt, bm2, b, 0, "Coat Normal")
    return m


def chile_material():
    m, nt, b = kit.new_mat("DriedChile")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1200, 0))
    obj = tc.outputs["Object"]
    wav = kit.node(nt, "ShaderNodeTexWave", (-1000, -200), Scale=60, Distortion=12, Detail=6)
    nt.links.new(obj, wav.inputs["Vector"])
    n = kit.noise(nt, obj, 80, 4, 0.6, (-1000, 100))
    col = kit.ramp(nt, [(0.3, kit.rgb("#4a0604")), (0.55, kit.rgb("#8a1206")), (0.8, kit.rgb("#b8240c"))], (-700, 100))
    kit.link(nt, n, col, "Fac", "Fac")
    kit.link(nt, col, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.3
    b.inputs["Subsurface Weight"].default_value = 0.4
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.2, 0.1)
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.1
    bm = kit.bump(nt, wav.outputs["Fac"], 0.5, 0.0008, (-300, -300))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def stem_material():
    m, nt, b = kit.new_mat("ChileStem")
    b.inputs["Base Color"].default_value = kit.rgb("#5a5020")
    b.inputs["Roughness"].default_value = 0.6
    return m


def sesame_material():
    m, nt, b = kit.new_mat("Sesame")
    b.inputs["Base Color"].default_value = kit.rgb("#eadcc0")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Subsurface Weight"].default_value = 0.4
    b.inputs["Subsurface Scale"].default_value = 0.001
    return m


def scallion_material():
    m, nt, b = kit.new_mat("Scallion")
    b.inputs["Base Color"].default_value = kit.rgb("#3a6e1a")
    b.inputs["Roughness"].default_value = 0.3
    b.inputs["Subsurface Weight"].default_value = 0.6
    b.inputs["Subsurface Radius"].default_value = (0.5, 1.0, 0.4)
    b.inputs["Subsurface Scale"].default_value = 0.002
    return m


def glossy_black(name="BowlGlaze"):
    m, nt, b = kit.new_mat(name)
    b.inputs["Base Color"].default_value = kit.rgb("#0f0e0d")
    b.inputs["Roughness"].default_value = 0.4
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.12
    return m


def drop(pieces, bowl_obj, frames=90):
    """Rigid-body drop of pieces into the bowl, then freeze them at the last frame."""
    sc = bpy.context.scene
    if sc.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rw = sc.rigidbody_world
    rw.point_cache.frame_start = 1
    rw.point_cache.frame_end = frames
    rw.substeps_per_frame = 20
    rw.solver_iterations = 20
    kit.select_only(bowl_obj)
    bpy.ops.rigidbody.object_add(type="PASSIVE")
    bowl_obj.rigid_body.collision_shape = "MESH"
    bowl_obj.rigid_body.collision_margin = 0.0005
    for p in pieces:
        kit.select_only(p)
        bpy.ops.rigidbody.object_add(type="ACTIVE")
        rb = p.rigid_body
        rb.collision_shape = "CONVEX_HULL"
        rb.collision_margin = 0.0004
        rb.friction = 0.9
        rb.restitution = 0.05
        rb.linear_damping = 0.3
        rb.angular_damping = 0.4
        rb.mass = 0.02
    for f in range(1, frames + 1):
        sc.frame_set(f)
    mats = {p.name: p.matrix_world.copy() for p in pieces}
    for p in pieces + [bowl_obj]:
        kit.select_only(p)
        bpy.ops.rigidbody.object_remove()
    kept = []
    for p in pieces:
        p.matrix_world = mats[p.name]
        t = p.matrix_world.translation
        # anything that bounced out of the bowl goes in the bin
        if math.hypot(t.x, t.y) > 0.08 or t.z < 0.004:
            for c in list(p.children):
                bpy.data.objects.remove(c)
            bpy.data.objects.remove(p)
        else:
            kept.append(p)
    sc.frame_set(1)
    return kept


def build(seed=4, n_chicken=26, n_chile=14):
    rng = random.Random(seed)
    root = bpy.data.objects.new("ChickenRoot", None)
    bpy.context.scene.collection.objects.link(root)
    bw = bowl(glossy_black())
    gm, cm, stm = glaze_material(), chile_material(), stem_material()
    # chicken is dropped into the bowl; chiles are laid on top afterwards (dropped, long thin
    # chiles wedge themselves upright between the pieces)
    kinds = ["chicken"] * n_chicken
    pieces = []
    for i, kind in enumerate(kinds):
        o = nugget(f"Chicken{i}", gm, rng)
        ang = rng.uniform(0, math.tau)
        rad = rng.uniform(0, 0.04)
        o.location = (rad * math.cos(ang), rad * math.sin(ang), 0.03 + i * 0.006)
        if kind == "chile":
            # chiles land lying down, mostly on top of the pile
            o.location.z += 0.06
            o.rotation_euler = (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, math.tau))
        else:
            o.rotation_euler = (rng.uniform(0, math.tau), rng.uniform(0, math.tau), rng.uniform(0, math.tau))
        pieces.append(o)
    bpy.context.view_layer.update()
    pieces = drop(pieces, bw)
    pieces += lay_chiles(pieces, n_chile, cm, stm, rng)
    objs = [bw] + pieces
    objs.append(sesame_on(pieces, sesame_material(), rng))
    objs.append(scallions_on(pieces, scallion_material(), rng))
    for o in objs:
        if o.parent is None:
            o.parent = root
    return root, objs


def lay_chiles(pieces, n, mat, stem_mat, rng):
    """Dried chiles resting on top of the pile, following its surface."""
    deps = bpy.context.evaluated_depsgraph_get()
    out = []
    tries = 0
    while len(out) < n and tries < n * 30:
        tries += 1
        a = rng.uniform(0, math.tau)
        r = 0.05 * math.sqrt(rng.random())
        x, y = r * math.cos(a), r * math.sin(a)
        hit, loc, nrm, _i, ob, _m = bpy.context.scene.ray_cast(deps, Vector((x, y, 0.4)), Vector((0, 0, -1)))
        if not hit or ob not in pieces:
            continue
        o = chile(f"Chile{len(out)}", mat, stem_mat, rng)
        yaw = rng.uniform(0, math.tau)
        o.rotation_euler = (rng.uniform(-0.25, 0.25), rng.uniform(-0.35, 0.05), yaw)
        # centre the chile (about 2 cm along its length) over the hit point
        o.location = (x - 0.022 * math.cos(yaw), y - 0.022 * math.sin(yaw), loc.z + 0.003)
        out.append(o)
    return out


def _top_hits(pieces, rng, count, spread=0.06):
    deps = bpy.context.evaluated_depsgraph_get()
    hits = []
    for _ in range(count * 6):
        if len(hits) >= count:
            break
        x, y = rng.uniform(-spread, spread), rng.uniform(-spread, spread)
        res = bpy.context.scene.ray_cast(deps, Vector((x, y, 0.3)), Vector((0, 0, -1)))
        if res[0] and res[4] in pieces and res[2].z > 0.3:
            hits.append((res[1], res[2]))
    return hits


def sesame_on(pieces, mat, rng, count=140):
    bm = bmesh.new()
    for loc, nrm in _top_hits(pieces, rng, count):
        res = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.001)
        q = nrm.to_track_quat("Z", "Y")
        yaw = rng.uniform(0, math.tau)
        for v in res["verts"]:
            c = Vector((v.co.x * 1.6, v.co.y * 1.0, v.co.z * 0.45))
            c.rotate(__import__("mathutils").Euler((0, 0, yaw)))
            c.rotate(q)
            v.co = loc + nrm * 0.0004 + c
    me = bpy.data.meshes.new("Sesame")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("Sesame", me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    return o


def scallions_on(pieces, mat, rng, count=14):
    bm = bmesh.new()
    for loc, nrm in _top_hits(pieces, rng, count, spread=0.05):
        res = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=0.0022, radius2=0.0022, depth=0.0018)
        inner = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=0.0017, radius2=0.0017, depth=0.0018)
        q = nrm.to_track_quat("Z", "Y")
        tilt = __import__("mathutils").Euler((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 0))
        for v in res["verts"] + inner["verts"]:
            c = v.co.copy()
            c.rotate(tilt)
            c.rotate(q)
            v.co = loc + nrm * 0.0014 + c
    me = bpy.data.meshes.new("Scallion")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("Scallion", me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    sol = o.modifiers.new("t", "SOLIDIFY")
    sol.thickness = 0.0004
    return o
