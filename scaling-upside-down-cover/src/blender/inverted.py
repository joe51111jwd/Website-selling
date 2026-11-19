# Direction E, "The Trap": raw-wood blocks stacked as an upside-down pyramid, one block at the bottom carrying
# everything above it. Scaling upside down, as an object. A full-frame render (dark set), with room at the top for
# the title, which the cover's HTML sets over it.
#   blender -b -P inverted.py -- --wood <dir> --hdr studio.hdr --w 1875 --h 2775 --samples 128 --out e.png
import argparse
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

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
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = a.w, a.h
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 1.1
scene.render.image_settings.file_format = "PNG"


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def wood_mat(name, seed):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (seed * 0.37, seed * 0.71, seed * 0.13)
    mp.inputs["Rotation"].default_value = (0, 0, seed * 0.9)
    mp.inputs["Scale"].default_value = (0.22, 0.22, 0.6)  # long grain, along each block
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(fn, colour=True):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(A(os.path.join(a.wood, fn)), check_existing=True)
        if not colour:
            t.image.colorspace_settings.name = "Non-Color"
        t.projection = "BOX"
        t.projection_blend = 0.2
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    col = tex("fine_grained_wood_col_2k.jpg")
    # pale raw timber, tinted warm as the site's raw-wood planks are (render/scene_setup.py: #e9c493);
    # each block a slightly different cut and tone
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = 0.0
    hsv.inputs["Value"].default_value = 1.7 + 0.3 * random.random()
    nt.links.new(col.outputs["Color"], hsv.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    warm = random.choice(["#e9c493", "#e3b984", "#edcc9f"])
    mix.inputs[7].default_value = srgb(warm)
    nt.links.new(hsv.outputs["Color"], mix.inputs[6])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    r = tex("fine_grained_wood_rough_2k.jpg", False)
    nt.links.new(r.outputs["Color"], b.inputs["Roughness"])
    n = tex("fine_grained_wood_nor_gl_2k.jpg", False)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.6
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def block(name, w, h, d, loc, yaw, seed):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z = (v.co.z + 0.5) * h
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.022, segments=4, affect="EDGES", profile=0.5)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    me.materials.append(wood_mat(name + "_m", seed))
    ob.location = loc
    ob.rotation_euler = (0, 0, math.radians(yaw))
    ob.modifiers.new("wn", "WEIGHTED_NORMAL").keep_sharp = True
    return ob


random.seed(12)
BW, BH, BD = 1.18, 0.78, 0.92
ROWS = 5  # 1 block at the bottom, 5 on top: everything resting on one
root = bpy.data.objects.new("tower", None)
scene.collection.objects.link(root)
for r in range(ROWS):
    n = r + 1
    for i in range(n):
        x = (i - (n - 1) / 2) * (BW + 0.015) + random.uniform(-0.03, 0.03)
        y = random.uniform(-0.04, 0.04)
        ob = block(f"b{r}_{i}", BW, BH, BD, (x, y, r * BH), random.uniform(-2.5, 2.5), r * 7 + i)
        ob.parent = root
root.rotation_euler = (0, math.radians(-1.6), math.radians(4))  # a hair off true: it is about to go

# the set: a dark seamless sweep
mat = bpy.data.materials.new("set")
mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#12100d")
mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
bpy.context.active_object.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 14, 0), rotation=(math.radians(90), 0, 0))
bpy.context.active_object.data.materials.append(mat)

world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(A(a.hdr))
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.08
world.node_tree.links.new(env.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])


def area(name, loc, size, power, target, colour=(1.0, 0.93, 0.84)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.size, ld.energy, ld.color = size, power, colour
    ob = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)


mid = (0, 0, 2.0)
area("key", (-7, -9, 9), 3.5, 7000, mid)                      # one warm, fairly hard key: drama, long shadow
area("rim", (5, 6, 6), 2.5, 900, mid, (0.85, 0.9, 1.0))
area("fill", (6, -8, 3), 8.0, 400, mid, (0.85, 0.9, 1.0))
area("wall", (0, 4, 8), 6.0, 160, (0, 14, 3))                   # a faint glow on the wall behind the tower

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 36
cam_d.lens = 70
cam.location = (-9.5, -24.0, 7.5)
look_at(cam, (0, 0, 3.9))   # aimed above the tower: it sits low, the title gets the dark sky
os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
scene.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
