# Round 4: cover 13 ("the mirror one") made photoreal. A thick wall with the title cut right through it (the refined
# stencil letters from src/make_cutouts.py, traced into clean outlines), low sun behind it, and the same words laid
# across the floor upside down by the light. Three art-directed variants:
#   a  warm limewash wall and oiled oak boards, golden hour, a courtyard under an evening sky
#   b  board-formed concrete and terrazzo, cool morning light
#   c  a dark gallery: charcoal plaster, polished dark concrete, one hazy shaft of gold
#   blender -b -P light2.py -- --variant a --cut ../../out/render/cutouts.json --wood ../../assets \
#           --w 2700 --h 3996 --samples 160 --out ../../out/render/light2-a.png
# Units are metres. The wall's room-side face is the plane y=0; the sun is behind it (+y).
import argparse
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--variant", default="a", choices=["a", "b", "c"])
ap.add_argument("--cut", required=True)
ap.add_argument("--wood", required=True)
ap.add_argument("--w", type=int, default=450)
ap.add_argument("--h", type=int, default=666)
ap.add_argument("--samples", type=int, default=24)
ap.add_argument("--haze", type=float, default=-1, help="override the haze density (0 = none)")
ap.add_argument("--out", required=True)
a = ap.parse_args(argv)
A = lambda p: os.path.abspath(p)  # noqa: E731
V = a.variant

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = a.samples
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.012
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 3
sc.cycles.volume_bounces = 1
sc.cycles.volume_step_rate = 3.0
sc.cycles.volume_max_steps = 96
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = a.w, a.h
sc.view_settings.view_transform = "AgX"
VT = os.environ.get("VT", "AgX|AgX - Punchy").split("|")
sc.view_settings.view_transform = VT[0]
sc.view_settings.look = VT[1]
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_depth = "16"


def srgb(hx):
    hx = hx.lstrip("#")
    c = [int(hx[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - Vector(ob.location)).to_track_quat("-Z", "Y").to_euler()


def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


# ---------------------------------------------------------------- the title, as clean cut solids
WALL_T = {"a": 0.14, "b": 0.16, "c": 0.14}[V]   # thick enough that the cut's depth shows, thin enough for the light
CUT = json.load(open(A(a.cut)))
CAP1, CAP2, GAP = 0.92, 0.43, 0.30
BASE2 = 0.78                     # UP-SIDE-DOWN's baseline above the floor
BASE1 = BASE2 + CAP2 + GAP       # SCALING's


def cutter(text, cap, base):
    d = CUT[text]
    off = -(d["x0"] + d["width"] / 2)  # centred on x=0
    bm = bmesh.new()
    y0, y1 = -0.2, WALL_T + 0.2
    for poly in d["polys"]:
        pts = [((x + off) * cap, (y) * cap + base) for x, y in poly]
        front = [bm.verts.new((x, y0, z)) for x, z in pts]
        back = [bm.verts.new((x, y1, z)) for x, z in pts]
        bm.faces.new(front)
        bm.faces.new(back[::-1])
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((front[i], front[j], back[j], back[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("cut_" + text)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("cut_" + text, me)
    sc.collection.objects.link(ob)
    return ob


bpy.ops.mesh.primitive_cube_add(size=1, location=(0, WALL_T / 2, 3.0))
wall = bpy.context.active_object
wall.scale = (16, WALL_T, 6)
bpy.ops.object.transform_apply(scale=True)
for c in (cutter("SCALING", CAP1, BASE1), cutter("UP-SIDE-DOWN", CAP2, BASE2)):
    m = wall.modifiers.new("cut", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.solver = "EXACT"
    m.object = c
    bpy.context.view_layer.objects.active = wall
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(c)
for f in wall.data.polygons:
    f.use_smooth = False

# ---------------------------------------------------------------- materials


def wall_material():
    m = bpy.data.materials.new("wall")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = node(nt, "ShaderNodeTexCoord")
    # every cut edge catches a sliver of light: a 5 mm rounded arris, done in the shader
    bev = node(nt, "ShaderNodeBevel", Radius=0.005)
    bev.samples = 8
    if V == "a":   # limewash: soft clouds of warmer and paler wash, brush marks, a fine sandy tooth
        clouds = node(nt, "ShaderNodeTexNoise", Scale=0.85, Detail=5.0, Roughness=0.62, Distortion=0.15)
        nt.links.new(tc.outputs["Object"], clouds.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.3
        ramp.color_ramp.elements[0].color = srgb("#e6d2b2")
        ramp.color_ramp.elements[1].position = 0.75
        ramp.color_ramp.elements[1].color = srgb("#f7ead2")
        nt.links.new(clouds.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.93
        brush = node(nt, "ShaderNodeTexNoise", Scale=7.0, Detail=10.0, Roughness=0.7, Distortion=1.4)
        sand = node(nt, "ShaderNodeTexNoise", Scale=900.0, Detail=2.0)
        for n_ in (brush, sand):
            nt.links.new(tc.outputs["Object"], n_.inputs["Vector"])
        mixh = node(nt, "ShaderNodeMath")
        mixh.operation = "MULTIPLY_ADD"
        mixh.inputs[1].default_value = 0.35
        nt.links.new(sand.outputs["Fac"], mixh.inputs[0])
        nt.links.new(brush.outputs["Fac"], mixh.inputs[2])
        height, strength = mixh.outputs["Value"], 0.45
    elif V == "b":  # board-formed concrete: horizontal boards 15 cm tall, each a shade apart, grain pressed in
        boards = nt.nodes.new("ShaderNodeTexBrick")
        boards.inputs["Scale"].default_value = 1.0
        boards.inputs["Mortar Size"].default_value = 0.0025
        boards.inputs["Brick Width"].default_value = 9.0
        boards.inputs["Row Height"].default_value = 0.16
        boards.offset = 0.5
        boards.inputs["Bias"].default_value = 0.0
        boards.inputs["Color1"].default_value = srgb("#bdb6ac")
        boards.inputs["Color2"].default_value = srgb("#b0a99f")
        boards.inputs["Mortar"].default_value = srgb("#9a938a")
        mp = node(nt, "ShaderNodeMapping")
        mp.inputs["Rotation"].default_value = (math.radians(90), 0, 0)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], boards.inputs["Vector"])
        mottle = node(nt, "ShaderNodeTexNoise", Scale=2.5, Detail=8.0, Roughness=0.6)
        nt.links.new(tc.outputs["Object"], mottle.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "OVERLAY"
        mix.inputs["Factor"].default_value = 0.35
        nt.links.new(boards.outputs["Color"], mix.inputs[6])
        nt.links.new(mottle.outputs["Color"], mix.inputs[7])
        nt.links.new(mix.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.85
        grain = nt.nodes.new("ShaderNodeTexImage")
        grain.image = bpy.data.images.load(A(os.path.join(a.wood, "fine_grained_wood_col_2k.jpg")), check_existing=True)
        grain.image.colorspace_settings.name = "Non-Color"
        grain.projection = "BOX"
        mp2 = node(nt, "ShaderNodeMapping")
        mp2.inputs["Scale"].default_value = (0.35, 0.35, 2.2)
        nt.links.new(tc.outputs["Object"], mp2.inputs["Vector"])
        nt.links.new(mp2.outputs["Vector"], grain.inputs["Vector"])
        pits = node(nt, "ShaderNodeTexVoronoi", Scale=60.0)
        nt.links.new(tc.outputs["Object"], pits.inputs["Vector"])
        pitm = node(nt, "ShaderNodeMath")
        pitm.operation = "GREATER_THAN"
        pitm.inputs[1].default_value = 0.035
        nt.links.new(pits.outputs["Distance"], pitm.inputs[0])
        hmix = node(nt, "ShaderNodeMath")
        hmix.operation = "MULTIPLY_ADD"
        hmix.inputs[1].default_value = 0.4
        nt.links.new(grain.outputs["Color"], hmix.inputs[0])
        nt.links.new(pitm.outputs["Value"], hmix.inputs[2])
        hm2 = node(nt, "ShaderNodeMath")
        hm2.operation = "ADD"
        nt.links.new(hmix.outputs["Value"], hm2.inputs[0])
        nt.links.new(boards.outputs["Fac"], hm2.inputs[1])
        height, strength = hm2.outputs["Value"], 0.22
    else:           # gallery plaster: deep warm charcoal, a fine trowelled sheen
        b.inputs["Base Color"].default_value = srgb("#24201d")
        b.inputs["Roughness"].default_value = 0.62
        trowel = node(nt, "ShaderNodeTexNoise", Scale=3.0, Detail=12.0, Roughness=0.72, Distortion=0.8)
        nt.links.new(tc.outputs["Object"], trowel.inputs["Vector"])
        rr = node(nt, "ShaderNodeMapRange")
        rr.inputs["To Min"].default_value = 0.45
        rr.inputs["To Max"].default_value = 0.78
        nt.links.new(trowel.outputs["Fac"], rr.inputs["Value"])
        nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
        height, strength = trowel.outputs["Fac"], 0.08
    bump = node(nt, "ShaderNodeBump", Strength=strength, Distance=0.003)
    nt.links.new(height, bump.inputs["Height"])
    nt.links.new(bev.outputs["Normal"], bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def floor_material():
    m = bpy.data.materials.new("floor")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = node(nt, "ShaderNodeTexCoord")
    if V == "a":   # oiled oak boards, 18 cm wide, running towards the wall, staggered ends
        boards = nt.nodes.new("ShaderNodeTexBrick")
        boards.inputs["Scale"].default_value = 1.0
        boards.inputs["Mortar Size"].default_value = 0.0045
        boards.inputs["Brick Width"].default_value = 2.1
        boards.inputs["Row Height"].default_value = 0.18
        boards.offset = 0.41
        boards.inputs["Color1"].default_value = (1, 1, 1, 1)
        boards.inputs["Color2"].default_value = (0.62, 0.62, 0.62, 1)
        boards.inputs["Mortar"].default_value = (0.08, 0.08, 0.08, 1)
        mp = node(nt, "ShaderNodeMapping")
        mp.inputs["Rotation"].default_value = (0, 0, math.radians(90))
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], boards.inputs["Vector"])
        wood = nt.nodes.new("ShaderNodeTexImage")
        wood.image = bpy.data.images.load(A(os.path.join(a.wood, "fine_grained_wood_col_2k.jpg")), check_existing=True)
        mp2 = node(nt, "ShaderNodeMapping")
        mp2.inputs["Scale"].default_value = (0.9, 0.22, 0.9)
        nt.links.new(tc.outputs["Object"], mp2.inputs["Vector"])
        nt.links.new(mp2.outputs["Vector"], wood.inputs["Vector"])
        tint = nt.nodes.new("ShaderNodeMix")
        tint.data_type = "RGBA"
        tint.blend_type = "MULTIPLY"
        tint.inputs["Factor"].default_value = 1.0
        tint.inputs[7].default_value = srgb("#e3ab70")
        nt.links.new(wood.outputs["Color"], tint.inputs[6])
        per = nt.nodes.new("ShaderNodeMix")
        per.data_type = "RGBA"
        per.blend_type = "MULTIPLY"
        per.inputs["Factor"].default_value = 1.0
        nt.links.new(tint.outputs[2], per.inputs[6])
        nt.links.new(boards.outputs["Color"], per.inputs[7])
        nt.links.new(per.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.34
        b.inputs["Coat Weight"].default_value = 0.25
        b.inputs["Coat Roughness"].default_value = 0.22
        bump = node(nt, "ShaderNodeBump", Strength=0.6, Distance=0.003)
        nt.links.new(boards.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    elif V == "b":  # terrazzo: pale ground with chips, a few in the book's three paints, honed and polished
        b.inputs["Base Color"].default_value = srgb("#d9d3c9")
        chips = node(nt, "ShaderNodeTexVoronoi", Scale=13.0, Randomness=1.0)
        nt.links.new(tc.outputs["Object"], chips.inputs["Vector"])
        size = node(nt, "ShaderNodeMath")
        size.operation = "LESS_THAN"
        size.inputs[1].default_value = 0.34
        nt.links.new(chips.outputs["Distance"], size.inputs[0])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        cols = [("#7b746b", 0.0), ("#efe9df", 0.3), ("#1f4a2b", 0.52), ("#b8b0a4", 0.6), ("#e09a24", 0.78), ("#97201a", 0.88), ("#5c564f", 0.94)]
        ramp.color_ramp.elements[0].color = srgb(cols[0][0])
        ramp.color_ramp.elements[1].position = cols[1][1]
        ramp.color_ramp.elements[1].color = srgb(cols[1][0])
        for hx, pos in cols[2:]:
            e = ramp.color_ramp.elements.new(pos)
            e.color = srgb(hx)
        nt.links.new(chips.outputs["Color"], ramp.inputs["Fac"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        nt.links.new(size.outputs["Value"], mix.inputs["Factor"])
        mix.inputs[6].default_value = srgb("#d9d3c9")
        nt.links.new(ramp.outputs["Color"], mix.inputs[7])
        fine = node(nt, "ShaderNodeTexNoise", Scale=400.0, Detail=2.0)
        nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])
        mix2 = nt.nodes.new("ShaderNodeMix")
        mix2.data_type = "RGBA"
        mix2.blend_type = "OVERLAY"
        mix2.inputs["Factor"].default_value = 0.2
        nt.links.new(mix.outputs[2], mix2.inputs[6])
        nt.links.new(fine.outputs["Color"], mix2.inputs[7])
        nt.links.new(mix2.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.22
    else:           # polished dark concrete: soft reflections, faint cloudy trowel marks
        clouds = node(nt, "ShaderNodeTexNoise", Scale=1.2, Detail=8.0, Roughness=0.6)
        nt.links.new(tc.outputs["Object"], clouds.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = srgb("#1b1917")
        ramp.color_ramp.elements[1].color = srgb("#34302c")
        nt.links.new(clouds.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        rr = node(nt, "ShaderNodeMapRange")
        rr.inputs["To Min"].default_value = 0.10
        rr.inputs["To Max"].default_value = 0.26
        nt.links.new(clouds.outputs["Fac"], rr.inputs["Value"])
        nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
    return m


wall.data.materials.append(wall_material())
# the floor runs from under the wall towards the camera only: behind the wall there is nothing but light
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -19.9, 0))
floor = bpy.context.active_object
floor.scale = (60, 40, 1)
bpy.ops.object.transform_apply(scale=True)
floor.data.materials.append(floor_material())

# ---------------------------------------------------------------- what you see through the letters
# a glowing backdrop a few metres behind the wall: seen only by the camera (through the cut), it lights nothing
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 4.0, 3.0), rotation=(math.radians(90), 0, 0))
glow = bpy.context.active_object
glow.scale = (30, 8, 1)
gm = bpy.data.materials.new("glow")
gm.use_nodes = True
gt = gm.node_tree
gt.nodes.remove(gt.nodes["Principled BSDF"])
em = gt.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = {"a": 4.5, "b": 4.0, "c": 6.0}[V]
gtc = gt.nodes.new("ShaderNodeTexCoord")
sep = gt.nodes.new("ShaderNodeSeparateXYZ")
gt.links.new(gtc.outputs["Generated"], sep.inputs["Vector"])
gr = gt.nodes.new("ShaderNodeValToRGB")
low, high = {"a": ("#ffad3a", "#fff0c4"), "b": ("#fff1dc", "#dfe9f2"), "c": ("#ff8a30", "#ffd590")}[V]
gr.color_ramp.elements[0].color = srgb(low)
gr.color_ramp.elements[1].color = srgb(high)
gt.links.new(sep.outputs["Y"], gr.inputs["Fac"])
gt.links.new(gr.outputs["Color"], em.inputs["Color"])
gt.links.new(em.outputs["Emission"], gt.nodes["Material Output"].inputs["Surface"])
glow.data.materials.append(gm)
for attr in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter", "visible_shadow"):
    setattr(glow, attr, False)

# ---------------------------------------------------------------- sky, sun, haze
SUN = {  # elevation, azimuth offset (deg, 0 = straight behind the wall), colour, strength, angle (deg)
    "a": (25.0, 0.0, (1.0, 0.56, 0.26), 4.2, 0.55),
    "b": (28.0, 5.0, (1.0, 0.95, 0.88), 7.0, 0.5),
    "c": (26.0, -3.0, (1.0, 0.70, 0.40), 18.0, 0.45),
}[V]
elev, azim, scol, sstr, sang = SUN
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
wn = w.node_tree
sky = wn.nodes.new("ShaderNodeTexSky")
sky.sky_type = "NISHITA"
sky.sun_disc = False
# the sky is set lower than the sun lamp: the glow seen through the letters is the gold of a later hour
sky.sun_elevation = math.radians({"a": 7.0, "b": 16.0, "c": 3.0}[V])
sky.sun_rotation = math.radians(90 + azim)   # behind the wall (+y)
sky.altitude = 120
sky.air_density = {"a": 1.6, "b": 1.0, "c": 1.4}[V]
sky.dust_density = {"a": 2.5, "b": 0.8, "c": 2.0}[V]
wn.links.new(sky.outputs["Color"], wn.nodes["Background"].inputs["Color"])
wn.nodes["Background"].inputs["Strength"].default_value = {"a": 0.16, "b": 0.30, "c": 0.6}[V]

sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = sstr
sun_d.color = scol
sun_d.angle = math.radians(sang)
sun = bpy.data.objects.new("sun", sun_d)
sc.collection.objects.link(sun)
# the light travels towards -y (into the room) and down
d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)) * -1, -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), -math.sin(math.radians(elev))))
sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

# the room: every variant is an interior now, so the only light inside is the sun through the letters, plus (in a
# and b) one soft window off to the left that rakes across the title wall and shows its material
room = wall.data.materials[0] if V in "ab" else None
if V == "c":
    room = bpy.data.materials.new("room")
    room.use_nodes = True
    room.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#1d1a18")
    room.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
for loc, rot, sc_ in [((-7.5, -12, 3), (0, math.radians(90), 0), (12, 30, 1)), ((7.5, -12, 3), (0, math.radians(90), 0), (12, 30, 1)),
                      ((0, -12, 6.0), (0, 0, 0), (16, 30, 1)), ((0, -24, 3), (math.radians(90), 0, 0), (16, 12, 1))]:
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    pl = bpy.context.active_object
    pl.scale = sc_
    pl.data.materials.append(room)
if V in "ab":
    wd = bpy.data.lights.new("window", "AREA")
    wd.shape = "RECTANGLE"
    wd.size, wd.size_y = 2.6, 2.2
    wd.energy = {"a": 2000, "b": 650}[V]
    wd.color = {"a": (1.0, 0.94, 0.86), "b": (0.86, 0.92, 1.0)}[V]
    wo = bpy.data.objects.new("window", wd)
    sc.collection.objects.link(wo)
    wo.location = (-7.3, -3.2, 2.9)
    look_at(wo, (2.5, 0.0, 1.8))

haze = a.haze if a.haze >= 0 else {"a": 0.006, "b": 0.004, "c": 0.02}[V]
if haze > 0:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -6.5, 3.0))
    box = bpy.context.active_object
    box.scale = (14.5, 12.8, 5.98)
    vm = bpy.data.materials.new("haze")
    vm.use_nodes = True
    vt = vm.node_tree
    vt.nodes.remove(vt.nodes["Principled BSDF"])
    vol = vt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = haze
    vol.inputs["Anisotropy"].default_value = 0.55   # forward scattering: the shafts glow towards the camera
    vol.inputs["Color"].default_value = srgb("#f4e3cc")
    vt.links.new(vol.outputs["Volume"], vt.nodes["Material Output"].inputs["Volume"])
    box.data.materials.append(vm)
    box.visible_shadow = False

# ---------------------------------------------------------------- camera
cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "VERTICAL"
cam_d.sensor_height = 24
cam_d.lens = 29
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
cam.location = (0.0, -11.6, 2.95)
look_at(cam, (0.0, -2.5, 1.22))
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 16   # a gentle falloff only: the light on the floor is the subject, it must stay crisp
foc = bpy.data.objects.new("focus", None)
sc.collection.objects.link(foc)
foc.location = (0, 0, BASE1)
cam_d.dof.focus_object = foc

os.makedirs(os.path.dirname(A(a.out)), exist_ok=True)
sc.render.filepath = A(a.out)
bpy.ops.render.render(write_still=True)
print("wrote", a.out)
