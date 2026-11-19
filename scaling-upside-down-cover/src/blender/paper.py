# Cover 14, "Window": a sheet of cream paper with the title cut through it (the book's own letterforms, heavier,
# stencil-bridged so the counters hold), and behind it a layered paper landscape at sunset: hills that climb, level
# off and dip, again and again, in the book's paints. Up, Side, Down as a horizon. You see the world only through
# the letters: a glimpse that makes you want to look in.
#   blender -b -P paper.py -- --w 1875 --h 2775 --samples 128 --out paper.png
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
sc.render.image_settings.file_format = "PNG"


def srgb(hx):
    hx = hx.lstrip("#")
    c = [int(hx[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - Vector(ob.location)).to_track_quat("-Z", "Y").to_euler()


def paper_mat(name, hx, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(hx)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Subsurface Weight"].default_value = 0.12  # paper lets a little light through
    b.inputs["Subsurface Radius"].default_value = (0.05, 0.04, 0.03)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 140
    noise.inputs["Detail"].default_value = 10
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


SHEET_T = 0.03
BRIDGE = {"O": [(0, 0.0), (0, 0.5)], "D": [(0, 0.62)], "P": [(0, 0.66)], "A": [(1, 0.5)]}


def cutters(text, cap, z0, tracking, weight):
    strokes, width = layout(text, cap, tracking)
    bm = bmesh.new()
    wgt = weight * cap
    bridge_w = wgt * 0.38
    nth = {}
    for i, ch, p in strokes:
        k = nth.get(i, 0)
        nth[i] = k + 1
        fine = [p[0]]
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            n = max(1, int(math.hypot(bx - ax, by - ay) / (wgt * 0.2)))
            fine += [(ax + (bx - ax) * j / n, ay + (by - ay) * j / n) for j in range(1, n + 1)]
        segs = list(zip(fine, fine[1:]))
        total = sum(math.hypot(b[0] - a_[0], b[1] - a_[1]) for a_, b in segs)
        gaps = [f * total for (sk, f) in BRIDGE.get(ch, []) if sk == k]
        run = 0.0
        for (ax, ay), (bx, by) in segs:
            L = math.hypot(bx - ax, by - ay)
            mid = run + L / 2
            run += L
            if any(min(abs(mid - g), abs(mid - g - total), abs(mid - g + total)) < bridge_w / 2 + L / 2 for g in gaps):
                continue
            ang = math.atan2(by - ay, bx - ax)
            ext = L * 0.25 + wgt * 0.02
            cx, cz = (ax + bx) / 2 - width / 2, (ay + by) / 2 + z0
            for v in bmesh.ops.create_cube(bm, size=1.0)["verts"]:
                v.co.x *= L + ext
                v.co.y *= SHEET_T * 6
                v.co.z *= wgt
                x, z = v.co.x, v.co.z
                v.co.x = cx + x * math.cos(ang) - z * math.sin(ang)
                v.co.z = cz + x * math.sin(ang) + z * math.cos(ang)
    me = bpy.data.meshes.new("cut")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("cut", me)
    sc.collection.objects.link(ob)
    return ob


# the front sheet, with the title cut through it
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 4.0))
sheet = bpy.context.active_object
sheet.scale = (14, SHEET_T, 12)
bpy.ops.object.transform_apply(scale=True)
WGT = T * 1.45  # heavier than the drawn letters: these are windows, they must let the world through
for c in (cutters("SCALING", 1.2, 3.75, 0.2, WGT), cutters("UP-SIDE-DOWN", 0.58, 2.7, 0.18, WGT)):
    mod = sheet.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.use_self = True
    mod.object = c
    bpy.context.view_layer.objects.active = sheet
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(c)
# and a round window above the title, with the sun in it
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=1.32, depth=SHEET_T * 8, location=(0, 0, 7.05), rotation=(math.radians(90), 0, 0))
port = bpy.context.active_object
mod = sheet.modifiers.new("port", "BOOLEAN")
mod.operation = "DIFFERENCE"
mod.solver = "EXACT"
mod.object = port
bpy.context.view_layer.objects.active = sheet
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(port)
sheet.data.materials.append(paper_mat("cream", "#f1e8d8"))


def hills(name, y, base_z, amp, phase, colour, period=3.2):
    """a paper layer whose top edge climbs, levels and dips (up, side, down), repeating; built as thin strips"""
    bm = bmesh.new()
    xs = [-8 + k * 0.05 for k in range(321)]

    def top(x):
        u = ((x + phase) / period) % 1.0
        cyc = math.floor((x + phase) / period)
        if u < 0.42:   # up
            h = (u / 0.42) ** 1.2
        elif u < 0.78:  # side
            h = 1.0
        else:           # down, a short way
            h = 1.0 - 0.35 * (u - 0.78) / 0.22
        return base_z + amp * (h * 0.75 + 0.25 * cyc * 0.12) + 0.04 * math.sin(x * 3.1 + phase)

    prev = None
    for x in xs:
        z = top(x)
        v0 = bm.verts.new((x, y, -1))
        v1 = bm.verts.new((x, y, z))
        if prev:
            bm.faces.new((prev[0], v0, v1, prev[1]))
        prev = (v0, v1)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    sol = ob.modifiers.new("t", "SOLIDIFY")
    sol.thickness = SHEET_T
    me.materials.append(paper_mat(name, colour))
    return ob


# layers, back to front: the far ridges catch the sunset, the near ones are deeper in colour
hills("far", 2.6, 3.9, 0.95, 0.9, "#f0a868")
hills("ochre", 2.0, 3.4, 1.0, 2.1, "#e09a24")
hills("red", 1.4, 2.85, 1.0, 0.2, "#a8321f")
hills("green", 0.8, 2.2, 1.05, 1.6, "#2c5a37")

# the sky: a warm glow behind everything, with a low sun
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 3.4, 4), rotation=(math.radians(90), 0, 0))
sky = bpy.context.active_object
sm = bpy.data.materials.new("sky")
sm.use_nodes = True
nt = sm.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
outn = nt.nodes.new("ShaderNodeOutputMaterial")
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 2.2
grad_tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(grad_tc.outputs["Object"], sep.inputs["Vector"])
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.44
ramp.color_ramp.elements[0].color = srgb("#ff9a45")
ramp.color_ramp.elements[1].position = 0.72
ramp.color_ramp.elements[1].color = srgb("#a94a55")
mapn = nt.nodes.new("ShaderNodeMapRange")
mapn.inputs["From Min"].default_value = -12
mapn.inputs["From Max"].default_value = 12
nt.links.new(sep.outputs["Y"], mapn.inputs["Value"])  # the plane's local Y is world Z after the rotation
nt.links.new(mapn.outputs["Result"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
nt.links.new(em.outputs["Emission"], outn.inputs["Surface"])
sky.data.materials.append(sm)
# the sun: a bright disc low in the sky, between the far ridges
bpy.ops.mesh.primitive_circle_add(vertices=64, radius=0.62, fill_type="NGON", location=(-0.3, 3.3, 6.55), rotation=(math.radians(90), 0, 0))
sun_disc = bpy.context.active_object
sdm = bpy.data.materials.new("sun")
sdm.use_nodes = True
sdm.node_tree.nodes.remove(sdm.node_tree.nodes["Principled BSDF"])
e2 = sdm.node_tree.nodes.new("ShaderNodeEmission")
e2.inputs["Color"].default_value = srgb("#fff2d6")
e2.inputs["Strength"].default_value = 6.0
sdm.node_tree.links.new(e2.outputs["Emission"], sdm.node_tree.nodes["Material Output"].inputs["Surface"])
sun_disc.data.materials.append(sdm)

# light: warm from inside the diorama (the low sun), and a soft room light on the front sheet
inner = bpy.data.lights.new("inner", "AREA")
inner.size, inner.energy, inner.color = 4, 900, (1.0, 0.78, 0.5)
io = bpy.data.objects.new("inner", inner)
sc.collection.objects.link(io)
io.location = (-0.3, 3.1, 6.3)
look_at(io, (0, 0.5, 2.5))
front = bpy.data.lights.new("front", "AREA")
front.size, front.energy, front.color = 12, 2600, (1.0, 0.9, 0.78)
fo = bpy.data.objects.new("front", front)
sc.collection.objects.link(fo)
fo.location = (-5, -9, 9)
look_at(fo, (0, 0, 4))
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#2a2018")
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3

cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 24
cam_d.lens = 31
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
cam.location = (-0.6, -14.0, 5.0)  # a little left and above: you look in, down and across through the letters
look_at(cam, (0.0, 0.0, 4.3))

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
sc.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
