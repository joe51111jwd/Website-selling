# The UP / SIDE / DOWN stack for the cover (direction A): a real Cycles render on a transparent film with a
# shadow catcher, so the cover's HTML lays it on the flat paper colour with its own contact shadow.
#   blender -b -P blocks.py -- --tex ../tex --wood <dir with fine_grained_wood_*_2k.jpg> --hdr <studio.hdr>
#           --w 1400 --h 2000 --samples 256 --out ../../out/render/blocks.png
# Paints and stamps come from make_faces.py. Wood and HDRI are Poly Haven CC0 (fine_grained_wood, studio_small_09).
import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--tex", required=True)
ap.add_argument("--wood", required=True)
ap.add_argument("--hdr", required=True)
ap.add_argument("--w", type=int, default=700)
ap.add_argument("--h", type=int, default=1000)
ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--out", required=True)
ap.add_argument("--view", default="front", choices=["front", "three"])
a = ap.parse_args(argv)
A = lambda p: os.path.abspath(p)  # noqa: E731

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = a.w, a.h
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"  # the paints are sRGB swatches: keep them true
scene.view_settings.exposure = -0.35
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "16"


def image(path, colour=True):
    im = bpy.data.images.load(A(path), check_existing=True)
    if not colour:
        im.colorspace_settings.name = "Non-Color"
    return im


def material(name, colour_img, box):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.58
    bsdf.inputs["Coat Weight"].default_value = 0.08  # a thin satin varnish over the paint
    bsdf.inputs["Coat Roughness"].default_value = 0.35
    tc = nt.nodes.new("ShaderNodeTexCoord")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = image(colour_img)
    if box:
        t.projection = "BOX"
        t.projection_blend = 0.15
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (0.7, 0.7, 0.7)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    else:
        nt.links.new(tc.outputs["UV"], t.inputs["Vector"])
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    # the wood's own relief, faint, through the paint
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = image(os.path.join(a.wood, "fine_grained_wood_nor_gl_2k.jpg"), colour=False)
    n.projection = "BOX"
    mp2 = nt.nodes.new("ShaderNodeMapping")
    mp2.inputs["Scale"].default_value = (0.7, 0.7, 0.7)
    nt.links.new(tc.outputs["Object"], mp2.inputs["Vector"])
    nt.links.new(mp2.outputs["Vector"], n.inputs["Vector"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.35
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def block(key, w, h, d, loc, yaw):
    me = bpy.data.meshes.new(key)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z = (v.co.z + 0.5) * h
    bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=0.028, segments=5, affect="EDGES", profile=0.5)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        f.smooth = True
        n = f.normal
        if n.y < -0.97:  # the front face: the stamped word
            f.material_index = 1
            for lp in f.loops:
                lp[uv].uv = ((lp.vert.co.x + w / 2) / w, lp.vert.co.z / h)
        else:
            f.material_index = 0
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(key, me)
    scene.collection.objects.link(ob)
    me.materials.append(material(f"{key}_paint", os.path.join(a.tex, f"paint_{key}.png"), True))
    me.materials.append(material(f"{key}_face", os.path.join(a.tex, f"face_{key}.png"), False))
    ob.location = loc
    ob.rotation_euler = (0, 0, math.radians(yaw))
    # weighted normals keep the bevels soft without bending the flat faces
    mod = ob.modifiers.new("wn", "WEIGHTED_NORMAL")
    mod.keep_sharp = True
    return ob


# bottom to top, as on the cover: hand-stacked, each a hair off true (key, width, x, y, yaw)
H, D = 1.0, 1.0
stack = [("down", 1.42, 0.0, 0.0, 0.0), ("side", 1.36, -0.035, 0.02, -2.2), ("up", 1.30, 0.03, -0.01, 1.6)]
for i, (k, w, x, y, yaw) in enumerate(stack):
    block(k, w, H, D, (x, y, i * H), yaw)

# the table: catches the shadow only, so the cover's paper colour shows through
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
floor = bpy.context.active_object
floor.is_shadow_catcher = True

# light: the studio HDRI, faint, and a large soft key from the upper left, a fill from the right
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = image(a.hdr)
bg = world.node_tree.nodes["Background"]
bg.inputs["Strength"].default_value = 0.30
world.node_tree.links.new(env.outputs["Color"], bg.inputs["Color"])
world.cycles_visibility.diffuse = False  # the HDRI only gives the paint its sheen; it must not darken the table into a horizon


def look_at(ob, target):
    d = Vector(target) - Vector(ob.location)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def area(name, loc, size, power, colour=(1.0, 0.96, 0.9), shadow=True):
    ld = bpy.data.lights.new(name, "AREA")
    ld.use_shadow = shadow
    ld.size = size
    ld.energy = power
    ld.color = colour
    ob = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, (0, 0, 1.4))
    return ob


area("key", (-6.0, -7.0, 8.0), 4.0, 2600)
area("fill", (8.0, -6.0, 6.0), 8.0, 700, (0.9, 0.94, 1.0), shadow=False)  # no second shadow on the table
area("rim", (-3.0, 7.0, 7.0), 3.0, 600)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 36
if a.view == "front":
    cam.location = (-1.6, -15.0, 3.4)
    cam_d.lens = 132
    aim = (0.0, 0.0, 1.55)
else:
    cam.location = (-6.5, -12.0, 5.0)
    cam_d.lens = 120
    aim = (0.0, 0.0, 1.5)
look_at(cam, aim)

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
scene.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
