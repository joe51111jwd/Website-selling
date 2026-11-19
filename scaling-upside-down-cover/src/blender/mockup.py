# A realistic hardcover mockup of a flat cover: case boards with the printed (matte-laminated) wrap on the front
# and spine, a cream page block set in from the boards, standing on a table under a soft studio light.
#   blender -b -P mockup.py -- --front <front.png, trim only> --spine <spine.png> --hdr studio.hdr
#           --w 1600 --h 2000 --samples 160 --out mockup.png [--view three|front]
# Units are inches: 6 x 9 trim, boards 0.125 in larger at head, tail and fore-edge, as a real case binding is.
import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--front", required=True)
ap.add_argument("--spine", required=True)
ap.add_argument("--hdr", required=True)
ap.add_argument("--spine_in", type=float, default=0.9)
ap.add_argument("--w", type=int, default=800)
ap.add_argument("--h", type=int, default=1000)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--view", default="three", choices=["three", "front"])
ap.add_argument("--bg", default="#e9e3d8")
ap.add_argument("--edge", default="#f1ebdf", help="the wrap's colour where it folds over the board edges")
ap.add_argument("--out", required=True)
a = ap.parse_args(argv)
A = lambda p: os.path.abspath(p)  # noqa: E731

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = a.w, a.h
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def img_mat(name, path, rough=0.42):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough  # matte laminate: a soft sheen, no mirror
    b.inputs["Coat Weight"].default_value = 0.0
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(A(path))
    t.interpolation = "Cubic"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    uv = nt.nodes.new("ShaderNodeUVMap")
    nt.links.new(uv.outputs["UV"], t.inputs["Vector"])
    return m


def flat_mat(name, hexcol, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(hexcol)
    b.inputs["Roughness"].default_value = rough
    return m


def pages_mat():
    # the page block's edge: cream, with fine sheet lines along the long direction
    m = bpy.data.materials.new("pages")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.8
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 260
    wave.inputs["Distortion"].default_value = 3.0
    wave.inputs["Detail"].default_value = 4
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = srgb("#e4dccb")
    ramp.color_ramp.elements[1].color = srgb("#f6f1e6")
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def box(name, sx, sy, sz, loc, mats, uv_face=None, bevel=0.012):
    """A box; the face whose normal is uv_face[0] gets material 1 and UVs mapped across it."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=3, affect="EDGES", profile=0.5)
    uvl = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        f.smooth = True
        f.material_index = 0
        if uv_face:
            axis, sign, (ua, va), flip_u = uv_face
            n = f.normal
            comp = {"x": n.x, "y": n.y, "z": n.z}[axis]
            if comp * sign > 0.97:
                f.material_index = 1
                size = {"x": sx, "y": sy, "z": sz}
                for lp in f.loops:
                    co = {"x": lp.vert.co.x, "y": lp.vert.co.y, "z": lp.vert.co.z}
                    u = (co[ua] / size[ua]) + 0.5
                    v = (co[va] / size[va]) + 0.5
                    lp[uvl].uv = (1 - u if flip_u else u, v)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    for m in mats:
        me.materials.append(m)
    ob.location = loc
    ob.modifiers.new("wn", "WEIGHTED_NORMAL").keep_sharp = True
    return ob


# geometry (inches). The book stands on its tail; x = across the front, y = thickness (front board at -y), z = up
BW, BH = 6.125, 9.25      # board: trim 6 x 9 + 0.125 at the fore-edge, head and tail
BT = 0.12                 # board thickness (2.5 mm grey board + wrap)
S = a.spine_in            # spine width
PH, PW = 9.0, 6.0         # page block
inner = S - 2 * BT

case_front = img_mat("front", a.front)
case_spine = img_mat("spine", a.spine)
edge_col = flat_mat("board_edge", a.edge, 0.45)
paper = pages_mat()

# front board, back board, spine piece
box("front_board", BW, BT, BH, (BW / 2, -S / 2 + BT / 2, BH / 2), [edge_col, case_front], ("y", -1, ("x", "z"), False))
box("back_board", BW, BT, BH, (BW / 2, S / 2 - BT / 2, BH / 2), [edge_col])
box("spine", BT, S, BH, (-BT / 2, 0, BH / 2), [edge_col, case_spine], ("x", -1, ("y", "z"), True), bevel=0.02)
# the page block, set in 0.125 from head, tail and fore-edge, hinged at the spine
box("pages", PW - 0.02, inner, PH, (PW / 2 + 0.01, 0, BH / 2), [paper], bevel=0.004)

# rotate the whole book: the spine faces the camera's left
book = [o for o in scene.objects]
root = bpy.data.objects.new("book", None)
scene.collection.objects.link(root)
for o in book:
    o.parent = root
root.rotation_euler = (0, 0, math.radians(30 if a.view == "three" else 0))

# the table and wall: one soft sweep in the background colour
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
floor = bpy.context.active_object
floor.data.materials.append(flat_mat("floor", a.bg, 0.9))
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 18, 0), rotation=(math.radians(90), 0, 0))
wall = bpy.context.active_object
wall.data.materials.append(flat_mat("wall", a.bg, 0.9))

world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(A(a.hdr))
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
world.node_tree.links.new(env.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])


def area(name, loc, size, power, target, colour=(1.0, 0.97, 0.92)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.size = size
    ld.energy = power
    ld.color = colour
    ob = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)


mid = (1.5, -1.5, BH / 2)
area("key", (-14, -16, 22), 14, 4200, mid)
area("fill", (20, -12, 8), 16, 900, mid, (0.92, 0.95, 1.0))
area("top", (2, 4, 30), 10, 1100, mid)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 24
cam_d.lens = 85
if a.view == "three":
    cam.location = (-9.0, -43, 10.5)
    look_at(cam, (1.2, -1.2, 4.4))
else:
    cam.location = (3.06, -46, 6.0)
    look_at(cam, (3.06, 0, 4.62))
cam_d.dof.use_dof = True
cam_d.dof.focus_object = root
cam_d.dof.aperture_fstop = 8

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
scene.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
