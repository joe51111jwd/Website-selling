# Cover 11, "Built": the title built from wooden blocks, on a table in low evening sun. SCALING is raw timber, laid up
# block by block from the book's own letterforms (src/lettering.py); its G is caught mid-collapse, blocks in the air.
# In front, UP-SIDE-DOWN in the cover's three paints. The hook: a moment before the fall.
#   blender -b -P built.py -- --wood <dir> --hdr studio.hdr --w 1875 --h 2775 --samples 128 --out built.png
import argparse
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
from lettering import raster  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--wood", required=True)
ap.add_argument("--hdr", required=True)
ap.add_argument("--w", type=int, default=375)
ap.add_argument("--h", type=int, default=555)
ap.add_argument("--samples", type=int, default=24)
ap.add_argument("--out", required=True)
a = ap.parse_args(argv)
A = lambda p: os.path.abspath(p)  # noqa: E731

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = a.samples
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = a.w, a.h
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast"
sc.view_settings.exposure = 0.0
sc.render.image_settings.file_format = "PNG"
random.seed(11)


def srgb(hx):
    hx = hx.lstrip("#")
    c = [int(hx[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - Vector(ob.location)).to_track_quat("-Z", "Y").to_euler()


def wood_tex(nt, mp, fn, colour=True):
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(A(os.path.join(a.wood, fn)), check_existing=True)
    if not colour:
        t.image.colorspace_settings.name = "Non-Color"
    t.projection = "BOX"
    t.projection_blend = 0.2
    nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    return t


MATS = {}


def material(kind, seed):
    """raw timber (tinted warm, as the site's raw-wood planks) or paint over wood (the cover's paints)."""
    key = (kind, seed % 6)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(f"{kind}{seed % 6}")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (seed * 0.37, seed * 0.71, seed * 0.13)
    mp.inputs["Scale"].default_value = (0.9, 0.9, 2.2)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    col = wood_tex(nt, mp, "fine_grained_wood_col_2k.jpg")
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = 0.0
    nt.links.new(col.outputs["Color"], hsv.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    if kind == "raw":
        hsv.inputs["Value"].default_value = 3.0 + 0.5 * random.random()
        mix.inputs[7].default_value = srgb(random.choice(["#e9c493", "#e3b984", "#edcc9f", "#e6bf8c"]))
        b.inputs["Roughness"].default_value = 0.62
    else:
        hsv.inputs["Value"].default_value = 2.1
        mix.inputs[7].default_value = srgb({"up": "#1f4a2b", "side": "#e09a24", "down": "#97201a"}[kind])
        b.inputs["Roughness"].default_value = 0.5
        b.inputs["Coat Weight"].default_value = 0.1
    nt.links.new(hsv.outputs["Color"], mix.inputs[6])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    n = wood_tex(nt, mp, "fine_grained_wood_nor_gl_2k.jpg", False)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.5
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    MATS[key] = m
    return m


BASE = {}


def cube_mesh(size):
    if size in BASE:
        return BASE[size]
    me = bpy.data.meshes.new(f"cube{size}")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=size)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=size * 0.06, segments=3, affect="EDGES", profile=0.5)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(me)
    bm.free()
    BASE[size] = me
    return me


def block(size, loc, rot, mat):
    me = cube_mesh(size).copy()
    me.materials.append(mat)
    ob = bpy.data.objects.new("b", me)
    sc.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


# SCALING: 11 rows of blocks, standing as a wall one block deep
ROWS, C = 10, 0.122
cells, cols = raster("SCALING", ROWS, tracking=0.22)
x_off = -cols * C / 2
g_cells = [(c, r) for i, c, r in cells if i == 6]
g_c0 = min(c for c, r in g_cells)
for i, c, r in cells:
    x, z = x_off + (c + 0.5) * C, (r + 0.5) * C
    jit = (random.uniform(-0.012, 0.012), random.uniform(-0.02, 0.02), 0)
    rot = Euler((0, 0, math.radians(random.uniform(-2.5, 2.5))))
    loc = Vector((x + jit[0], jit[1], z))
    if i == 6:
        # the G tips over as one letter, pivoting on its front-right foot towards the reader; its top course is
        # just breaking away. It still reads as a G: the moment before the fall, not the rubble after it
        t = r / (ROWS - 1)
        pivot = Vector((x_off + (g_c0 + 7) * C, -C * 0.5, 0))
        tilt = Euler((math.radians(-24), math.radians(9), 0))   # forward (towards the reader) and a little sideways
        v = (loc - pivot)
        v.rotate(tilt)
        loc = pivot + v
        rot = Euler((tilt.x, tilt.y, rot.z))
        if t > 0.8 and random.random() < 0.7:   # the top course, coming loose
            loc += Vector((random.uniform(-0.02, 0.18), random.uniform(-0.35, -0.08), random.uniform(-0.05, 0.12)))
            rot = Euler((tilt.x + random.uniform(-0.7, 0.2), tilt.y + random.uniform(-0.5, 0.5), random.uniform(-0.6, 0.6)))
    block(C * 0.97, loc, rot, material("raw", c * 7 + r))
# two that already fell, on the table in front of the G
gx = x_off + (g_c0 + 3) * C
for k in range(2):
    block(C * 0.97, (gx + random.uniform(-0.1, 0.5), random.uniform(-0.9, -0.15), C * 0.485), Euler((0, 0, random.uniform(0, 3.14))), material("raw", 90 + k))

# (UP-SIDE-DOWN is drawn on the cover itself, in the same letterforms, above the scene)
cells2 = []

# the table and the wall behind: warm, plain, and out of focus
tab = bpy.data.materials.new("table")
tab.use_nodes = True
tb = tab.node_tree.nodes["Principled BSDF"]
tb.inputs["Base Color"].default_value = srgb("#b98d62")
tb.inputs["Roughness"].default_value = 0.55
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
bpy.context.active_object.data.materials.append(tab)
wallm = bpy.data.materials.new("wall")
wallm.use_nodes = True
wallm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#e8dccb")
wallm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 2.2, 0), rotation=(math.radians(90), 0, 0))
bpy.context.active_object.data.materials.append(wallm)

w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
env = w.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(A(a.hdr))
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18
w.node_tree.links.new(env.outputs["Color"], w.node_tree.nodes["Background"].inputs["Color"])

# low evening sun from the right and behind: long shadows towards the reader, a warm rim on every block
sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = 10.0
sun_d.color = (1.0, 0.78, 0.52)
sun_d.angle = math.radians(1.2)
sun = bpy.data.objects.new("sun", sun_d)
sc.collection.objects.link(sun)
sun.rotation_euler = Euler((math.radians(70), 0, math.radians(-38)))  # low, from the front left: long shadows back to the wall
fill_d = bpy.data.lights.new("fill", "AREA")
fill_d.size, fill_d.energy, fill_d.color = 8, 160, (0.8, 0.86, 1.0)
fill = bpy.data.objects.new("fill", fill_d)
sc.collection.objects.link(fill)
fill.location = (-6, -9, 5)
look_at(fill, (0, 0, 1.5))

cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 24
cam_d.lens = 19
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 4.0
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
# low and close at the front right: the word runs away into the distance, the G falls towards us
cam.location = (2.6, -8.4, 2.3)
look_at(cam, (0.35, 0.0, 0.62))
foc = bpy.data.objects.new("focus", None)
sc.collection.objects.link(foc)
foc.location = (1.0, -0.2, 0.6)
cam_d.dof.focus_object = foc

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
sc.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out, "blocks:", len(cells) + len(cells2))
