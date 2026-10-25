# The desk at the end of the page: the cover's UP / SIDE / DOWN blocks lying face up in a row,
# seen from above, in layers the site stacks back together (each block, its shadow at rest and
# lifted, and two out-of-focus props). Every pass uses the same camera, so the layers line up.
# Run: blender -b -P flatlay.py -- --outdir out/flatlay [--w 1600 --h 800 --samples 128 --proxy 0]
# Then: python3 scripts/make_flatlay_assets.py render/tex render/out/flatlay
import json
import os
import sys
from math import cos, radians, sin

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
# the shared studio, without its backdrop or the cover stack (this is a top-down shot on a transparent floor)
_src = open(os.path.join(HERE, "scene_setup.py")).read()
exec(compile(_src[: _src.index("\nbackdrop()\n")], "scene_setup.py", "exec"))

o = {"outdir": "out/flatlay", "w": "1600", "h": "800", "samples": "128", "proxy": "0"}
_argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
o.update({_argv[i].lstrip("-"): _argv[i + 1] for i in range(0, len(_argv) - 1, 2)})
OUT = os.path.join(HERE, o["outdir"])
os.makedirs(OUT, exist_ok=True)
PROXY = o["proxy"] == "1"

paints = {
    "up": paint_material("up_paint", "#1f4a2b"),  # noqa: F821
    "side": paint_material("side_paint", "#e09a24"),  # noqa: F821
    "down": paint_material("down_paint", "#97201a"),  # noqa: F821
}
faces = {k: paint_material(f"{k}_face", "#000000", f"face_{k}.png") for k in paints}  # noqa: F821

# the painted face (-Y) turned to face up, letters' top toward +Y (the top of the frame)
blocks = {}
for key, x, y, yaw in [("up", -1.04, 0, -1.2), ("side", 0, 0.015, 0.8), ("down", 1.04, -0.01, -0.6)]:
    ob = block(key, (x, y, 0.5), 0, faces[key], paints[key])  # noqa: F821
    ob.rotation_euler = (radians(-90), 0, radians(yaw))
    blocks[key] = ob

# the props that bleed off the desk's edges
leads = block("leads", (0, 0, 0.5 + 1.2), 0, paint_material("leads_face", "#000000", "sys_leads.png"), paints["up"])  # noqa: F821
leads.rotation_euler = (radians(-90), 0, radians(18))
wood = raw_wood_material("hire12_wood", seed=0.7)  # noqa: F821
hire12 = block("hire12", (0, 0, 0.5 + 1.2), 0, raw_wood_material("hire12_face", label="label_hire12.png", seed=0.7), wood)  # noqa: F821
hire12.rotation_euler = (radians(-90), 0, radians(-12))
props = {"leads": leads, "hire12": hire12}

# a floor that only catches shadows; the page's paper shows through
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "floor"
paper = bpy.data.materials.new("paper")
paper.use_nodes = True
pb = paper.node_tree.nodes["Principled BSDF"]
pb.inputs["Base Color"].default_value = srgb("#f3ede2")  # noqa: F821
pb.inputs["Roughness"].default_value = 0.92
floor.data.materials.append(paper)


def camera(name, target, dist, elev=78, lens=100):
    cd = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cd)
    scene.collection.objects.link(cam)  # noqa: F821
    cd.lens = lens
    cd.sensor_fit = "HORIZONTAL"
    cd.sensor_width = 36
    t = Vector(target)
    cam.location = t + dist * Vector((0, -cos(radians(elev)), sin(radians(elev))))
    cam.rotation_euler = (t - cam.location).to_track_quat("-Z", "Y").to_euler()
    cd.dof.use_dof = True
    cd.dof.focus_distance = dist
    cd.dof.aperture_fstop = 8
    return cam


# perspective, not orthographic, so a sliver of side grain and the bevel show
cam = camera("cam", (0, 0, 1.0), 10.95)
cam_prop = camera("cam_prop", (0, 0, 2.2), 1.6 * 100 / 36)

area("key", (-2.2, 2.4, 9.6), (0, 0, 0.5), 5.0, 1500)  # noqa: F821  upper left: shadows fall down-right
area("fill", (6, -5, 3.5), (0, 0, 0.5), 8, 220, "#f2f4ff")  # noqa: F821

r = scene.render  # noqa: F821
r.engine = "CYCLES"
scene.cycles.device = "CPU"  # noqa: F821
scene.cycles.use_adaptive_sampling = True  # noqa: F821
scene.cycles.use_denoising = True  # noqa: F821
scene.cycles.denoiser = "OPENIMAGEDENOISE"  # noqa: F821
scene.view_settings.view_transform = "Standard"  # noqa: F821
scene.view_settings.look = "Medium Contrast"  # noqa: F821
scene.view_settings.exposure = -0.75  # noqa: F821
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"


def show(only, floor_mode, cam_ob, lifted=None):
    """only: objects the camera sees; floor_mode: 'paper' | 'catcher' | 'bounce' (unseen, still bounces light)"""
    for ob in list(blocks.values()) + list(props.values()):
        ob.hide_render = ob not in only and ob is not lifted
        ob.visible_camera = ob in only
    floor.hide_render = False
    floor.is_shadow_catcher = floor_mode == "catcher"
    floor.visible_camera = floor_mode != "bounce"
    r.film_transparent = floor_mode != "paper"
    scene.camera = cam_ob  # noqa: F821


def shoot(name, w, h, samples):
    r.resolution_x, r.resolution_y = w, h
    scene.cycles.samples = samples  # noqa: F821
    r.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("wrote", r.filepath)


W, H, N = int(o["w"]), int(o["h"]), int(o["samples"])
if PROXY:
    show(list(blocks.values()), "paper", cam)
    shoot("proxy.png", 400, 200, 8)
    show([hire12], "paper", cam_prop)
    shoot("proxy_hire12.png", 200, 200, 8)
else:
    for key, ob in blocks.items():
        show([ob], "bounce", cam)
        shoot(f"blk_{key}.png", W, H, N)
        # shadows alone are smooth after denoising, so they need fewer samples
        show([], "catcher", cam, lifted=ob)
        shoot(f"shd_{key}_rest.png", W, H, max(32, N // 2))
        ob.location.z += 0.6
        shoot(f"shd_{key}_lift.png", W, H, max(32, N // 2))
        ob.location.z -= 0.6
    for key, ob in props.items():
        show([ob], "catcher", cam_prop)
        shoot(f"prop_{key}.png", 800, 800, max(32, N // 4))  # blurred on the page anyway

# where each block's top face lands in the frame, in % (y down), for the page
r.resolution_x, r.resolution_y = W, H
bpy.context.view_layer.update()
geo = {"frame": [W, H], "render": True, "blocks": {}}
for key, ob in blocks.items():
    pts = [world_to_camera_view(scene, cam, ob.matrix_world @ Vector((sx * 0.5, -0.5, sz * 0.5))) for sx in (-1, 1) for sz in (-1, 1)]  # noqa: F821
    xs = [p.x * 100 for p in pts]
    ys = [(1 - p.y) * 100 for p in pts]
    l, t = min(xs), min(ys)
    geo["blocks"][key] = {"box": [round(l, 2), round(t, 2), round(max(xs) - l, 2), round(max(ys) - t, 2)], "c": [round(sum(xs) / 4, 2), round(sum(ys) / 4, 2)]}
with open(os.path.join(OUT, "flatlay.json"), "w") as f:
    json.dump(geo, f, indent=2)
print(json.dumps(geo))
