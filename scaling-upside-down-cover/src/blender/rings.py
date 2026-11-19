# Direction 7, "Tree rings": the log slice from make_rings.py, photographed from straight above on a chalk table
# (an orthographic flat lay), lit low from the upper left so the latewood ridges and the saw marks catch the light.
# The slice is set large and low right, so it runs off the page; the cover's HTML writes the title in the space left.
#   blender -b -P rings.py -- --tex ../tex --hdr studio.hdr --w 1875 --h 2775 --samples 128 --out rings.png
# Writes <out>.json too: where the slice's pith and radius land on the picture, in pixels.
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--tex", required=True)
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
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


# layout, in the picture's pixels: the slice's diameter and where its centre sits
PX_PER_UNIT = 1100.0           # the slice has radius 1 unit = 1100 px: 2200 px across, wider than the page
CENTRE_PX = (1330.0, 2150.0)   # low and right: it runs off the right edge and the foot, below the title
THICK = 0.22                   # how far the slice stands off the table (its thickness)

# the slice: a 2 x 2 plane carrying the end-grain texture (its alpha cuts the round), raised off the table
bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0, 0, THICK))
face = bpy.context.active_object
m = bpy.data.materials.new("endgrain")
m.use_nodes = True
nt = m.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Roughness"].default_value = 0.62
t = nt.nodes.new("ShaderNodeTexImage")
t.image = bpy.data.images.load(A(os.path.join(a.tex, "rings.png")))
t.interpolation = "Cubic"
nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
hb = nt.nodes.new("ShaderNodeTexImage")
hb.image = bpy.data.images.load(A(os.path.join(a.tex, "rings_bump.png")))
hb.image.colorspace_settings.name = "Non-Color"
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.35
bump.inputs["Distance"].default_value = 0.004
nt.links.new(hb.outputs["Color"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
face.data.materials.append(m)

# the table: chalk, matte
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
tab = bpy.data.materials.new("chalk")
tab.use_nodes = True
tab.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#f1ede6")
tab.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
bpy.context.active_object.data.materials.append(tab)

w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
env = w.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(A(a.hdr))
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.12
w.node_tree.links.new(env.outputs["Color"], w.node_tree.nodes["Background"].inputs["Color"])


def area(name, loc, size, power, colour=(1.0, 0.96, 0.9)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.size, ld.energy, ld.color = size, power, colour
    ob = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, (0, 0, 0))


area("key", (-6.0, 5.0, 4.0), 2.5, 820)               # low, from the upper left: it rakes across the grain
area("fill", (5.0, -3.0, 8.0), 9.0, 330, (0.94, 0.96, 1.0))

# the camera, straight down, framed so the slice's centre lands on CENTRE_PX
cam_d = bpy.data.cameras.new("cam")
cam_d.type = "ORTHO"
H_UNITS = a.h / (PX_PER_UNIT * a.h / 2775.0)  # the picture's height in units, at any render size
cam_d.ortho_scale = max(H_UNITS, H_UNITS * a.w / a.h)
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
px = PX_PER_UNIT * a.h / 2775.0
cx_px, cy_px = CENTRE_PX[0] * a.w / 1875.0, CENTRE_PX[1] * a.h / 2775.0
cam.location = ((a.w / 2 - cx_px) / px, (cy_px - a.h / 2) / px, 10)
cam.rotation_euler = (0, 0, 0)

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
sc.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
json.dump({"w": 1875, "h": 2775, "centre": CENTRE_PX, "px_per_unit": PX_PER_UNIT}, open(A(a.out).rsplit(".", 1)[0] + ".json", "w"))
print("wrote", a.out)
