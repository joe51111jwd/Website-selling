"""Sour Orange Pie: orange custard, vanilla cookie crust, crème chantilly. One slice, plated.

The slice is a wedge of a 23 cm pie: a crumb crust shell with a raised rim, a custard filling with a
glossy set top, and a piped rosette of chantilly with a curl of zest.
"""
import math
import random

import bpy

import kit
import studio

R = 0.115          # pie radius
ANG = math.radians(42)  # slice angle
T_CRUST = 0.006
H_FILL = 0.03


def wedge(name, mat_top, mat_side, r0, r1, z0, z1, ang=ANG, segs=24, rings=10, bulge=0.0, seed=1):
    """A closed wedge between radius r0..r1 (r0 = 0 for a solid point), heights z0..z1.
    Faces on the top get mat_top (index 0), the rest mat_side (index 1)."""
    rng = random.Random(seed)
    r0 = max(r0, 0.0008)  # a blunt tip instead of a point, so no face collapses
    verts, faces, mats = [], [], []

    def V(r, a, z):
        verts.append((r * math.cos(a), r * math.sin(a), z))
        return len(verts) - 1

    a0, a1 = -ang / 2, ang / 2
    grid_top, grid_bot = [], []
    for k in range(rings + 1):
        r = r0 + (r1 - r0) * k / rings
        row_t, row_b = [], []
        for i in range(segs + 1):
            a = a0 + (a1 - a0) * i / segs
            dz = bulge * math.sin(math.pi * k / rings) * 0.6 + rng.uniform(-0.0002, 0.0002)
            row_t.append(V(r, a, z1 + dz))
            row_b.append(V(r, a, z0))
        grid_top.append(row_t)
        grid_bot.append(row_b)
    for k in range(rings):
        for i in range(segs):
            faces.append((grid_top[k][i], grid_top[k + 1][i], grid_top[k + 1][i + 1], grid_top[k][i + 1]))
            mats.append(0)
            faces.append((grid_bot[k][i + 1], grid_bot[k + 1][i + 1], grid_bot[k + 1][i], grid_bot[k][i]))
            mats.append(1)
    # sides: two cut faces (constant angle), outer arc, inner arc
    for k in range(rings):
        faces.append((grid_bot[k][0], grid_bot[k + 1][0], grid_top[k + 1][0], grid_top[k][0]))
        mats.append(1)
        faces.append((grid_top[k][segs], grid_top[k + 1][segs], grid_bot[k + 1][segs], grid_bot[k][segs]))
        mats.append(1)
    for i in range(segs):
        faces.append((grid_bot[rings][i], grid_bot[rings][i + 1], grid_top[rings][i + 1], grid_top[rings][i]))
        mats.append(1)
        faces.append((grid_top[0][i], grid_top[0][i + 1], grid_bot[0][i + 1], grid_bot[0][i]))
        mats.append(1)
    o = kit.mesh_obj(name, verts, faces, mat_top)
    o.data.materials.append(mat_side)
    for p, m in zip(o.data.polygons, mats):
        p.material_index = m
    kit.select_only(o)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-6)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    return o


def rosette(name, mat, turns=2.4, r0=0.015, h=0.026, points=8, seed=3):
    """Chantilly piped through a star tip: a star-shaped bevel swept up a shrinking spiral."""
    prof = bpy.data.curves.new(name + "_tip", "CURVE")
    prof.dimensions = "2D"
    sp = prof.splines.new("POLY")
    n = points * 2
    sp.points.add(n - 1)
    for i in range(n):
        a = i / n * math.tau
        rr = 1.0 if i % 2 == 0 else 0.72
        sp.points[i].co = (rr * math.cos(a), rr * math.sin(a), 0, 1)
    sp.use_cyclic_u = True
    tip = bpy.data.objects.new(name + "_tip", prof)
    bpy.context.scene.collection.objects.link(tip)
    tip.hide_render = True
    tip.hide_viewport = True

    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_mode = "OBJECT"
    cu.bevel_object = tip
    cu.use_fill_caps = True
    cu.resolution_u = 6
    path = cu.splines.new("NURBS")
    steps = int(turns * 16)
    path.points.add(steps)
    for i in range(steps + 1):
        u = i / steps
        a = u * turns * math.tau
        rr = r0 * (1 - u) ** 0.9
        z = h * (u ** 0.85) * 0.75
        p = path.points[i]
        p.co = (rr * math.cos(a), rr * math.sin(a), z + 0.004, 1)
        p.radius = 0.0085 * (1 - u * 0.7)
    path.use_endpoint_u = True
    path.order_u = 4
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o


def zest(name, mat, seed=5):
    rng = random.Random(seed)
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.extrude = 0.0011
    cu.bevel_depth = 0.0003
    for k in range(3):
        sp = cu.splines.new("NURBS")
        sp.points.add(7)
        base = (rng.uniform(-0.004, 0.004), rng.uniform(-0.004, 0.004))
        for i in range(8):
            u = i / 7
            a = u * math.tau * 0.9 + k
            sp.points[i].co = (base[0] + 0.004 * math.cos(a) * (1 - u * 0.4), base[1] + 0.004 * math.sin(a), u * 0.004, 1)
        sp.order_u = 3
        sp.use_endpoint_u = True
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o


# ---------------------------------------------------------------- materials

def crust_material():
    m, nt, b = kit.new_mat("CookieCrust")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1200, 0))
    obj = tc.outputs["Object"]
    vor = kit.node(nt, "ShaderNodeTexVoronoi", (-1000, -200), Scale=700.0)
    nt.links.new(obj, vor.inputs["Vector"])
    n = kit.noise(nt, obj, 120, 5, 0.65, (-1000, 100))
    col = kit.ramp(nt, [(0.3, kit.rgb("#7a4416")), (0.5, kit.rgb("#a86a2a")), (0.7, kit.rgb("#cc9450"))], (-700, 100))
    kit.link(nt, n, col, "Fac", "Fac")
    crumbs = kit.ramp(nt, [(0.0, (0.6, 0.55, 0.5, 1)), (0.4, (1, 1, 1, 1))], (-700, -200))
    kit.link(nt, vor, crumbs, "Distance", "Fac")
    c2 = kit.mix_rgb(nt, 1.0, col.outputs[0], crumbs.outputs[0], "MULTIPLY", (-400, 0))
    kit.link(nt, c2, b, 2, "Base Color")
    b.inputs["Roughness"].default_value = 0.7
    b.inputs["Subsurface Weight"].default_value = 0.15
    b.inputs["Subsurface Scale"].default_value = 0.001
    h = kit.math_node(nt, "MULTIPLY_ADD", vor.outputs["Distance"], 1.0, (-400, -300))
    kit.link(nt, n, h, "Fac", 2)
    bm = kit.bump(nt, h.outputs[0], 1.0, 0.0012, (-150, -400))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def custard_top_material():
    m, nt, b = kit.new_mat("CustardTop")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1000, 0))
    n = kit.noise(nt, tc.outputs["Object"], 40, 3, 0.5, (-800, 0))
    col = kit.ramp(nt, [(0.3, kit.rgb("#f2a62c")), (0.7, kit.rgb("#f7bc4a"))], (-500, 0))
    kit.link(nt, n, col, "Fac", "Fac")
    kit.link(nt, col, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = 0.25
    b.inputs["Subsurface Weight"].default_value = 0.5
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.4)
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 0.5
    b.inputs["Coat Roughness"].default_value = 0.08
    bm = kit.bump(nt, n.outputs["Fac"], 0.05, 0.001, (-200, -300))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def custard_cut_material():
    m, nt, b = kit.new_mat("CustardCut")
    tc = kit.node(nt, "ShaderNodeTexCoord", (-1000, 0))
    n = kit.noise(nt, tc.outputs["Object"], 500, 2, 0.5, (-800, 0))
    b.inputs["Base Color"].default_value = kit.rgb("#f8c460")
    b.inputs["Roughness"].default_value = 0.45
    b.inputs["Subsurface Weight"].default_value = 0.5
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.45)
    b.inputs["Subsurface Scale"].default_value = 0.002
    bm = kit.bump(nt, n.outputs["Fac"], 0.08, 0.0005, (-200, -300))
    kit.link(nt, bm, b, 0, "Normal")
    return m


def chantilly_material():
    m, nt, b = kit.new_mat("Chantilly")
    b.inputs["Base Color"].default_value = kit.rgb("#f7f1e6")
    b.inputs["Roughness"].default_value = 0.5
    b.inputs["Subsurface Weight"].default_value = 1.0
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.95, 0.85)
    b.inputs["Subsurface Scale"].default_value = 0.004
    b.inputs["Sheen Weight"].default_value = 0.3
    return m


def zest_material():
    m, nt, b = kit.new_mat("Zest")
    b.inputs["Base Color"].default_value = kit.rgb("#f08a0c")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Subsurface Weight"].default_value = 0.2
    b.inputs["Subsurface Scale"].default_value = 0.002
    return m


def build(plate_mat=None):
    root = bpy.data.objects.new("PieRoot", None)
    bpy.context.scene.collection.objects.link(root)
    plate = studio.plate(radius=0.1, rim=0.02, depth=0.011, mat=plate_mat or studio.porcelain(), name="Plate")
    plate.parent = root
    floor = 0.0076
    cm, ctop, ccut = crust_material(), custard_top_material(), custard_cut_material()
    slice_grp = bpy.data.objects.new("Slice", None)
    bpy.context.scene.collection.objects.link(slice_grp)
    slice_grp.parent = root
    # the slice's point sits near the plate centre, back edge away from camera
    slice_grp.location = (-0.055, 0.0, floor)
    base = wedge("CrustBase", cm, cm, 0.0, R, 0.0, T_CRUST, seed=1)
    rim_ = wedge("CrustRim", cm, cm, R - 0.006, R + 0.001, 0.0, T_CRUST + H_FILL + 0.0035, rings=3, bulge=0.002, seed=2)
    fill = wedge("Filling", ctop, ccut, 0.0, R - 0.006, T_CRUST, T_CRUST + H_FILL, bulge=0.0015, seed=3)
    for o in (base, rim_, fill):
        o.parent = slice_grp
        bev = o.modifiers.new("bev", "BEVEL")
        bev.width = 0.0008
        bev.segments = 2
    ro = rosette("Chantilly", chantilly_material())
    ro.parent = slice_grp
    ro.location = (R * 0.62, 0.0, T_CRUST + H_FILL)
    z = zest("Zest", zest_material())
    z.parent = slice_grp
    z.location = (R * 0.62 + 0.002, 0.003, T_CRUST + H_FILL + 0.021)
    z.rotation_euler = (0.5, 0.2, 0.8)
    return root, [plate, base, rim_, fill, ro, z]
