"""The 900° film: real steak scans under a broiler, scrubbed by scroll on the site.

    blender -b -P models/film.py -- [--w 1280 --h 800 --samples 64] [--only 30] [--from 1 --to 96]

Three photogrammetry scans (models/sources.json) take turns on a dark pass, lit from above like a
Chicago broiler: the raw rib steak, the same cut seared, then sliced to show the pink. Each change
happens inside a flash of broiler heat, while the camera keeps moving. Frames go to
models/out/film/####.png; --only N renders one frame to models/out/film/test_N.png for look-dev.
Resumable: frames already on disk are skipped.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
OUT = os.path.join(HERE, "out", "film")
N = 96
CHAR = (0.0045, 0.0032, 0.0024)  # the site's --char, linear


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return {a[i].lstrip("-"): a[i + 1] for i in range(0, len(a) - 1, 2)}


A = args()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
cy = sc.cycles
cy.device = "CPU"
cy.samples = int(A.get("samples", 64))
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.03
cy.use_denoising = True
cy.denoiser = "OPENIMAGEDENOISE"
cy.max_bounces = 4
cy.diffuse_bounces = 2
cy.glossy_bounces = 2
cy.caustics_reflective = cy.caustics_refractive = False
sc.render.resolution_x = int(A.get("w", 1280))
sc.render.resolution_y = int(A.get("h", 800))
sc.render.film_transparent = False
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.exposure = 0.0
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.render.use_persistent_data = True
sc.frame_start, sc.frame_end = 1, N
sc["glow"] = 0.78

# ------------------------------------------------------------------ world: studio fill, dark to camera and reflections
w = bpy.data.worlds.new("world")
sc.world = w
w.use_nodes = True
nt = w.node_tree
bg = nt.nodes["Background"]
env = nt.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(os.path.join(CACHE, "studio_small_09.exr"))
lit = nt.nodes.new("ShaderNodeBackground")
lit.inputs[1].default_value = 0.22
nt.links.new(env.outputs[0], lit.inputs[0])
dark = nt.nodes.new("ShaderNodeBackground")
dark.inputs[0].default_value = (*CHAR, 1)
path = nt.nodes.new("ShaderNodeLightPath")
mix = nt.nodes.new("ShaderNodeMixShader")
# the studio only fills the shadows; the camera and every reflection see a dark kitchen
seen = nt.nodes.new("ShaderNodeMath")
seen.operation = "MAXIMUM"
nt.links.new(path.outputs["Is Camera Ray"], seen.inputs[0])
nt.links.new(path.outputs["Is Glossy Ray"], seen.inputs[1])
nt.links.new(seen.outputs[0], mix.inputs[0])
nt.links.new(lit.outputs[0], mix.inputs[1])
nt.links.new(dark.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], nt.nodes["World Output"].inputs[0])
nt.nodes.remove(bg)

# ------------------------------------------------------------------ the pass: dark steel, a little worn
bpy.ops.mesh.primitive_plane_add(size=12)
floor = bpy.context.object
m = bpy.data.materials.new("pass")
m.use_nodes = True
p = m.node_tree.nodes["Principled BSDF"]
p.inputs["Base Color"].default_value = (0.010, 0.0085, 0.0075, 1)
p.inputs["Metallic"].default_value = 0.0
p.inputs["Roughness"].default_value = 0.9
# at a grazing angle any sheen mirrors the rim light into a glowing floor; matte it is
p.inputs["Specular IOR Level"].default_value = 0.0
tex = m.node_tree.nodes.new("ShaderNodeTexNoise")
tex.inputs["Scale"].default_value = 60
tex.inputs["Detail"].default_value = 8
ramp = m.node_tree.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.35
ramp.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1)
ramp.color_ramp.elements[1].position = 0.75
ramp.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1)
m.node_tree.links.new(tex.outputs[0], ramp.inputs[0])
m.node_tree.links.new(ramp.outputs[0], p.inputs["Roughness"])
floor.data.materials.append(m)


# ------------------------------------------------------------------ the scans
def relight(mt):
    """Scans come in unlit: an emission of the photographed colour, which is what makes them look real.
    Keep most of that, and add a lit layer on top so the broiler's heat and highlights land on the
    meat. Both follow the scene's `glow`, which flares with the broiler."""
    if not mt or not mt.use_nodes or mt.get("relit"):
        return
    nt = mt.node_tree
    tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
    emit = next((n for n in nt.nodes if n.type == "EMISSION"), None)
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    if tex:
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    elif emit:
        bsdf.inputs["Base Color"].default_value = emit.inputs["Color"].default_value
    bsdf.inputs["Roughness"].default_value = 0.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.5
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(emit.outputs[0], add.inputs[0])
    nt.links.new(bsdf.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs["Surface"])
    d = emit.inputs["Strength"].driver_add("default_value").driver
    d.type = "SCRIPTED"
    v = d.variables.new()
    v.name = "glow"
    v.type = "SINGLE_PROP"
    v.targets[0].id_type = "SCENE"
    v.targets[0].id = sc
    v.targets[0].data_path = '["glow"]'
    d.expression = "glow"
    mt["relit"] = True


def load(name, size, yaw):
    """Import a scan, sit it on the pass, scale its footprint to `size` metres. Returns its root."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(CACHE, name + ".glb"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector((min(v.x for v in pts), min(v.y for v in pts), min(v.z for v in pts)))
    hi = Vector((max(v.x for v in pts), max(v.y for v in pts), max(v.z for v in pts)))
    root = bpy.data.objects.new(name, None)
    sc.collection.objects.link(root)
    pivot = bpy.data.objects.new(name + "_in", None)
    sc.collection.objects.link(pivot)
    pivot.parent = root
    for o in new:
        if o.parent is None:
            o.parent = pivot
    k = size / max(hi.x - lo.x, hi.y - lo.y)
    pivot.scale = (k, k, k)
    pivot.location = (-(lo.x + hi.x) / 2 * k, -(lo.y + hi.y) / 2 * k, -lo.z * k)
    root.rotation_euler.z = math.radians(yaw)
    # scans come in unlit (an emission of the photographed colour); relight them as real surfaces so
    # the broiler actually lands on the meat
    for o in meshes:
        for slot in o.material_slots:
            relight(slot.material)
    root["meshes"] = [o.name for o in meshes]
    return root, meshes


raw, raw_m = load("raw", 0.46, 8)
seared, seared_m = load("seared", 0.5, -12)
sliced, sliced_m = load("sliced", 0.42, 20)

# which scan is on the pass, by frame
SHOTS = [(raw_m, 1, 36), (seared_m, 37, 66), (sliced_m, 67, N)]
for meshes, a, b in SHOTS:
    for o in meshes:
        for f, hide in ((1, not (a <= 1 <= b)), (a - 1, True), (a, False), (b, False), (b + 1, True)):
            if 1 <= f <= N + 1:
                o.hide_render = hide
                o.keyframe_insert("hide_render", frame=f)
        for fc in (o.animation_data.action.fcurves if o.animation_data else []):
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"


# ------------------------------------------------------------------ light: a broiler overhead
def area(name, loc, target, size, energy, color, size_y=None):
    l = bpy.data.lights.new(name, "AREA")
    l.energy = energy
    l.color = color
    if size_y:
        l.shape = "RECTANGLE"
        l.size, l.size_y = size, size_y
    else:
        l.size = size
    o = bpy.data.objects.new(name, l)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return l


broiler = area("broiler", (0, 0.05, 0.85), (0, 0, 0), 0.9, 9, (1.0, 0.58, 0.28), size_y=0.5)
area("key", (-0.9, -0.8, 0.55), (0, 0, 0.05), 0.7, 2.5, (1.0, 0.86, 0.72))
area("rim", (0.7, 0.9, 0.35), (0, 0, 0.05), 0.6, 5, (1.0, 0.62, 0.34))


def flash(peak, rise, fall, top):
    """Broiler heat: from the resting level up to `top` at `peak`, back down."""
    return [(peak - rise, None), (peak, top), (peak + fall, None)]


base = 9.0
heat = {1: base, 28: base * 2.2}
for f, v in flash(36.5, 7, 8, 260):
    heat[round(f)] = v
for f, v in flash(66.5, 5, 7, 150):
    heat[round(f)] = v
heat[N] = base * 1.2
for f in sorted(heat):
    v = heat[f]
    if v is None:
        v = base * (2.2 if f < 40 else 1.4)
    broiler.energy = v
    broiler.keyframe_insert("energy", frame=f)
    # the photographed colour brightens with the heat too, so the flash reads on the meat
    sc["glow"] = 0.78 * (1 + 0.9 * (v / base - 1) / (260 / base - 1))
    sc.keyframe_insert('["glow"]', frame=f)

# ------------------------------------------------------------------ camera: keeps moving through the cuts
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 58
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 3.2
cam = bpy.data.objects.new("cam", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam


def ease(t):
    return t * t * (3 - 2 * t)


# (frame, yaw deg, elevation deg, distance m, look-at height)
KEYS = [
    (1, -62, 26, 1.05, 0.05),
    (36, -28, 20, 0.74, 0.05),
    (37, -24, 20, 0.76, 0.05),
    (66, 18, 16, 0.6, 0.06),
    (67, 26, 40, 0.95, 0.02),
    (N, 62, 58, 0.78, 0.02),
]


def pose(f):
    for (f0, *a), (f1, *b) in zip(KEYS, KEYS[1:]):
        if f0 <= f <= f1:
            t = ease((f - f0) / max(1, f1 - f0))
            return [x + (y - x) * t for x, y in zip(a, b)]
    return KEYS[-1][1:]


for f in range(1, N + 1):
    yaw, elev, dist, look = pose(f)
    yr, er = math.radians(yaw), math.radians(elev)
    loc = Vector((dist * math.cos(er) * math.sin(yr), -dist * math.cos(er) * math.cos(yr), dist * math.sin(er)))
    cam.location = loc
    cam.rotation_euler = (Vector((0, 0, look)) - loc).to_track_quat("-Z", "Y").to_euler()
    cam_data.dof.focus_distance = (Vector((0, 0, look)) - loc).length
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)
    cam_data.dof.keyframe_insert("focus_distance", frame=f)

# ------------------------------------------------------------------ render
os.makedirs(OUT, exist_ok=True)
if "only" in A:
    f = int(A["only"])
    sc.frame_set(f)
    sc.render.filepath = os.path.join(OUT, f"test_{f}.png")
    bpy.ops.render.render(write_still=True)
else:
    for f in range(int(A.get("from", 1)), int(A.get("to", N)) + 1):
        path = os.path.join(OUT, f"{f:04d}.png")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            continue
        open(path, "wb").close()  # claim it, so a second runner skips it
        sc.frame_set(f)
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print("frame", f, flush=True)
