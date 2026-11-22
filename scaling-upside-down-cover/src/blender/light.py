# Cover 13, "Light": the title cut through a thick plaster wall, stencil-fashion (bridges hold the counters of A, D,
# O and P, as a real cut would need), in the book's own letterforms. Low sun behind the wall pours through the
# letters and lays them across the floor, upside down. The room shows the trap: the same words, scaling upside down.
#   blender -b -P light.py -- --wood <dir> --w 1875 --h 2775 --samples 128 --out light.png
import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
from lettering import T, layout  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--wood", required=True)
ap.add_argument("--w", type=int, default=375)
ap.add_argument("--h", type=int, default=555)
ap.add_argument("--samples", type=int, default=24)
ap.add_argument("--out", required=True)
ap.add_argument("--bold", type=int, default=0, help="1: the stand-out version (dark wall, blazing light, title filling the width)")
a = ap.parse_args(argv)
A = lambda p: os.path.abspath(p)  # noqa: E731

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = a.samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = a.w, a.h
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.image_settings.file_format = "PNG"


def srgb(hx):
    hx = hx.lstrip("#")
    c = [int(hx[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - Vector(ob.location)).to_track_quat("-Z", "Y").to_euler()


WALL_T = 0.07   # a thin screen: a thick wall would shade the horizontal strokes from the sun
# stencil bridges: (letter, which stroke, fraction along it) -> leave a gap there
BRIDGE = {"O": [(0, 0.0), (0, 0.5)], "D": [(0, 0.62)], "P": [(0, 0.66)], "A": [(1, 0.5)]}


def cutters(text, cap, z0, tracking):
    """boxes along every stroke of the text (centred on x=0), skipping the stencil bridges"""
    strokes, width = layout(text, cap, tracking)
    bm = bmesh.new()
    wgt = T * cap
    bridge_w = wgt * 0.55
    stroke_no = {}
    for i, ch, p in strokes:
        k = stroke_no.get(i, 0)
        stroke_no[i] = k + 1
        # resample long strokes into short pieces, so a bridge removes only a bridge's width, not a whole stroke
        fine = [p[0]]
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            n = max(1, int(math.hypot(bx - ax, by - ay) / (wgt * 0.25)))
            fine += [(ax + (bx - ax) * j / n, ay + (by - ay) * j / n) for j in range(1, n + 1)]
        segs = list(zip(fine, fine[1:]))
        total = sum(math.hypot(b[0] - a_[0], b[1] - a_[1]) for a_, b in segs)
        gaps = [f * total for (sk, f) in BRIDGE.get(ch, []) if sk == k]
        run = 0.0
        for (ax, ay), (bx, by) in segs:
            L = math.hypot(bx - ax, by - ay)
            mid = run + L / 2
            run += L
            # a stencil bridge: leave this bit of the stroke uncut (distance along the stroke, wrapping for an O)
            if any(min(abs(mid - g), abs(mid - g - total), abs(mid - g + total)) < bridge_w / 2 + L / 2 for g in gaps):
                continue
            ang = math.atan2(by - ay, bx - ax)
            # straight strokes get a little extra length so their joints close; arcs (many short segments) barely any
            ext = L * 0.25 + wgt * 0.02
            cx, cy = (ax + bx) / 2 - width / 2, (ay + by) / 2 + z0
            res = bmesh.ops.create_cube(bm, size=1.0)
            vs = res["verts"]
            for v in vs:
                v.co.x *= (L + ext)
                v.co.y *= WALL_T * 3
                v.co.z *= wgt
                x, z = v.co.x, v.co.z
                v.co.x = cx + x * math.cos(ang) - z * math.sin(ang)
                v.co.z = cy + x * math.sin(ang) + z * math.cos(ang)
    me = bpy.data.meshes.new("cut_" + text)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("cut_" + text, me)
    sc.collection.objects.link(ob)
    return ob


# the wall
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, WALL_T / 2, 4.5))
wall = bpy.context.active_object
wall.scale = (24, WALL_T, 9)
bpy.ops.object.transform_apply(scale=True)
if a.bold:
    c1 = cutters("SCALING", 1.24, 3.8, 0.2)
    c2 = cutters("UP-SIDE-DOWN", 0.62, 2.85, 0.18)
else:
    c1 = cutters("SCALING", 1.0, 4.05, 0.22)
    c2 = cutters("UP-SIDE-DOWN", 0.5, 3.2, 0.2)
for c in (c1, c2):
    mod = wall.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.use_self = True
    mod.object = c
    bpy.context.view_layer.objects.active = wall
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(c)

plaster = bpy.data.materials.new("plaster")
plaster.use_nodes = True
nt = plaster.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = srgb("#2a1f18" if a.bold else "#e9dfd0")
b.inputs["Roughness"].default_value = 0.92
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 60
noise.inputs["Detail"].default_value = 8
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.12
nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
wall.data.materials.append(plaster)

# the floor: warm boards
floor_m = bpy.data.materials.new("floor")
floor_m.use_nodes = True
nt = floor_m.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Roughness"].default_value = 0.42
tc = nt.nodes.new("ShaderNodeTexCoord")
mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Scale"].default_value = (0.12, 0.6, 0.12)
nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
t = nt.nodes.new("ShaderNodeTexImage")
t.image = bpy.data.images.load(A(os.path.join(a.wood, "fine_grained_wood_col_2k.jpg")))
nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
mix = nt.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.blend_type = "MULTIPLY"
mix.inputs["Factor"].default_value = 1.0
mix.inputs[7].default_value = srgb("#c9925a")
nt.links.new(t.outputs["Color"], mix.inputs[6])
nt.links.new(mix.outputs[2], b.inputs["Base Color"])
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, -20, 0))
bpy.context.active_object.data.materials.append(floor_m)
# side walls and a ceiling keep the room a room (dim, warm bounce)
for loc, rot in [((-6.5, -10, 4.5), (0, math.radians(90), 0)), ((6.5, -10, 4.5), (0, math.radians(90), 0)), ((0, -10, 9.0), (0, 0, 0))]:
    bpy.ops.mesh.primitive_plane_add(size=30, location=loc, rotation=rot)
    bpy.context.active_object.data.materials.append(plaster)

# outside: a bright warm sky (seen through the letters) and a low afternoon sun
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#ff9640" if a.bold else "#ffd9a0")
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 3.2 if a.bold else 1.4
sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = 26.0 if a.bold else 14.0
sun_d.color = (1.0, 0.66, 0.34) if a.bold else (1.0, 0.80, 0.55)
sun_d.angle = math.radians(0.6)
sun = bpy.data.objects.new("sun", sun_d)
sc.collection.objects.link(sun)
sun.rotation_euler = Euler((math.radians(-50), 0, math.radians(0)))  # from behind the wall, down into the room

cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 24
cam_d.lens = 24
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
cam.location = (0.0, -11.4, 5.9)
look_at(cam, (0.0, -2.6, 2.05))
# a soft warm fill from the room side, so the plaster reads as plaster, not as a hole
fl = bpy.data.lights.new("fill", "AREA")
fl.size, fl.energy, fl.color = 10, (60 if a.bold else 420), (1.0, 0.84, 0.66)
flo = bpy.data.objects.new("fill", fl)
sc.collection.objects.link(flo)
flo.location = (2.5, -11, 6.5)
look_at(flo, (0, 0, 3.5))

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
sc.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
