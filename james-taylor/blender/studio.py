"""The set every dish sits on: a dark food-photography studio, warm like a room lit by a fire.

Transparent film (the site composites the dishes on its own near-black), a shadow catcher under the
props, a big soft backlight for the glisten, a warm low kicker that reads as firelight, and a
small hard spec light for sparkle.
"""
import math
import os

import bpy

import kit

WARM = (1.0, 0.72, 0.46)
FIRE = (1.0, 0.62, 0.32)
NEUTRAL = (1.0, 0.9, 0.8)


def lights(scale=1.0, fire=0.5, key=1.0, key_pos=(-0.85, 0.45, 0.75)):
    """Lights aimed at a dish of ~0.25 m sitting at the origin."""
    s = scale
    kit.area("Key", tuple(v * s for v in key_pos), (0, 0, 0.02), size=0.7 * s, power=55 * key * s * s, color=NEUTRAL)
    kit.area("Fill", (0.2 * s, -1.1 * s, 0.35 * s), (0, 0, 0.03), size=1.2 * s, power=5 * s * s, color=NEUTRAL)
    kit.area("Spec", (0.65 * s, 0.55 * s, 0.6 * s), (0, 0, 0.03), size=0.18 * s, power=14 * s * s, color=WARM)
    kit.area("Fire", (-0.7 * s, -0.35 * s, 0.06 * s), (0, 0, 0.04), size=0.5 * s, size_y=0.12 * s,
             power=16 * fire * s * s, color=FIRE)


def board(name="Board", z=0.0, scale=1.0, rot=0.0):
    """Poly Haven's wooden cutting board (0.45 x 0.25 m)."""
    blend = os.path.join(kit.CACHE, "models", "wooden_cutting_board", "wooden_cutting_board_2k.blend")
    o = kit.append_object(blend, "wooden_cutting_board")
    o.name = name
    o.scale = (scale, scale, scale)
    o.rotation_euler = (0, 0, rot)
    bpy.context.view_layer.update()
    # sit its underside on z
    zs = [(o.matrix_world @ v.co).z for v in o.data.vertices]
    o.location.z += z - min(zs)
    bpy.context.view_layer.update()
    top = max((o.matrix_world @ v.co).z for v in o.data.vertices)
    return o, top


def board_top_at(board_obj, x, y):
    """Height of the board's top surface at (x, y)."""
    deps = bpy.context.evaluated_depsgraph_get()
    from mathutils import Vector
    hit, loc, *_ = bpy.context.scene.ray_cast(deps, Vector((x, y, 1.0)), Vector((0, 0, -1)))
    return loc.z if hit else 0.0


def stoneware(name="Stoneware", color="#1b1a19", rough=0.55):
    m, nt, b = kit.new_mat(name)
    obj = kit.tex_coord(nt)
    n = kit.noise(nt, obj, 900, 3, 0.6)
    speck = kit.ramp(nt, [(0.6, kit.rgb(color)), (0.72, kit.rgb("#3b3834"))], (-500, 0))
    kit.link(nt, n, speck, "Fac", "Fac")
    kit.link(nt, speck, b, 0, "Base Color")
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.35
    bm = kit.bump(nt, n.outputs["Fac"], 0.12, 0.0005)
    kit.link(nt, bm, b, 0, "Normal")
    return m


def porcelain(name="Porcelain", color="#efe9df"):
    m, nt, b = kit.new_mat(name)
    b.inputs["Base Color"].default_value = kit.rgb(color)
    b.inputs["Roughness"].default_value = 0.08
    b.inputs["Subsurface Weight"].default_value = 0.15
    b.inputs["Subsurface Scale"].default_value = 0.002
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.03
    return m


def plate(radius=0.14, rim=0.03, depth=0.012, mat=None, name="Plate", oval=1.0, segs=96):
    """A lathe-turned plate: foot, well, curved rim. oval>1 stretches it along x."""
    prof = [
        (0.0, 0.004), (radius * 0.55, 0.004), (radius * 0.6, 0.0), (radius * 0.66, 0.0),
        (radius - rim, depth * 0.35), (radius - rim * 0.4, depth * 0.85), (radius, depth),
        (radius + 0.002, depth - 0.0015), (radius - rim * 0.35, depth - 0.0045),
        (radius - rim, depth * 0.35 - 0.004), (radius * 0.66, -0.0005 + 0.004 + 0.0035),
        (0.0, 0.0075),
    ]
    verts, faces = [], []
    P = len(prof)
    for i in range(segs):
        a = i / segs * math.tau
        c, s = math.cos(a), math.sin(a)
        for r, z in prof:
            verts.append((r * c * oval, r * s, z))
    for i in range(segs):
        for p in range(P):
            a0 = i * P + p
            a1 = ((i + 1) % segs) * P + p
            b0 = i * P + (p + 1) % P
            b1 = ((i + 1) % segs) * P + (p + 1) % P
            faces.append((a0, a1, b1, b0))
    o = kit.mesh_obj(name, verts, faces, mat)
    sub = o.modifiers.new("s", "SUBSURF")
    sub.levels = sub.render_levels = 2
    return o


def round_board(radius=0.16, thick=0.022, tone=0.55, name="RoundBoard"):
    """A round walnut-toned serving board: Poly Haven's kitchen_wood, mapped in object space and
    darkened toward walnut. Returns (object, top z)."""
    blend = os.path.join(kit.CACHE, "tex", "kitchen_wood", "kitchen_wood_2k.blend")
    mat = kit.append(blend, "materials", "kitchen_wood").copy()
    mat.name = name + "Wood"
    nt = mat.node_tree
    tc = next(n for n in nt.nodes if n.type == "TEX_COORD")
    mp = next(n for n in nt.nodes if n.type == "MAPPING")
    for l in list(mp.inputs["Vector"].links):
        nt.links.remove(l)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    mp.inputs["Scale"].default_value = (2.6, 2.6, 2.6)
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    src = bsdf.inputs["Base Color"].links[0].from_socket
    mul = kit.mix_rgb(nt, 1.0, src, (tone * 0.95, tone * 0.78, tone * 0.62, 1), "MULTIPLY", (bsdf.location.x - 250, bsdf.location.y))
    nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])
    for n in [n for n in nt.nodes if n.type == "DISPLACEMENT"]:
        nt.nodes.remove(n)
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=radius, depth=thick, location=(0, 0, thick / 2))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    bev = o.modifiers.new("bevel", "BEVEL")
    bev.width = 0.004
    bev.segments = 4
    for p in o.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return o, thick
