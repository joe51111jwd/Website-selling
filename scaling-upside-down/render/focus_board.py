# The focus film's storyboard: one block moves at a time and carries its own words.
#   blender -b -P focus_board.py -- --shot launch --w 1280 --h 800 --samples 40 --out out/board/launch.png
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403

rnd = random.Random(7)
shot = opt.get("shot", "launch")
down_b, side_b, up_b = blocks  # the cover's three, bottom to top
cover = {"down": down_b, "side": side_b, "up": up_b}

def wood(name, label=None, loc=(0, 0, 0), rot=(0, 0, 0), width=None):
    ob = block(name, loc, 0, raw_wood_material(f"w_{name}", f"label_{label}.png" if label else None, seed=rnd.random() * 3), raw_wood_material(f"wp_{name}", None, seed=rnd.random() * 3), width=width)
    ob.rotation_euler = tuple(math.radians(a) for a in rot)
    return ob

SYS = {
    "down": (["profit", "risk", "efficiency", "quality"], "#97201a", 0.5),
    "side": (["roles", "systematize", "tech", "fulfillment"], "#e09a24", 1.5),
    "up": (["content", "leads", "conversion", "retention"], "#1f4a2b", 2.5),
}
def course(name, dx_shift=0.0, only=None):
    keys, hexcol, z = SYS[name]
    other = paint_material(f"sysp_{name}", hexcol)
    for key, dx in zip(keys, (-2, -1, 1, 2)):
        if only and key not in only:
            continue
        block(key, (dx * 1.0 + dx_shift, 0, z), math.radians(rnd.uniform(-0.6, 0.6)), paint_material(f"sys_{key}", hexcol, f"sys_{key}.png"), other)

def place_cover(order=("down", "side", "up"), flip=False, x=0.0):
    for i, k in enumerate(order):
        ob = cover[k]
        ob.location = (x + rnd.uniform(-0.03, 0.03), rnd.uniform(-0.02, 0.02), 0.5 + i)
        ob.rotation_euler = (0, math.pi if flip else 0, math.radians(rnd.uniform(-2.5, 2.5)))

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
def frame(loc, aim, lens, focus=None, fstop=6.0):
    cam.location = loc
    cam.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam_d.lens = lens
    cam_d.dof.use_dof = True
    cam_d.dof.focus_distance = (Vector(loc) - Vector(focus or aim)).length
    cam_d.dof.aperture_fstop = fstop

if shot == "launch":  # Always launching. Always hiring. Always adding. The words land one by one
    place_cover()
    wood("launching", "f_launching", (0.03, 0.0, 3.5), (0, 0, 1.6), width=2)
    wood("hiring", "f_hiring", (-0.07, 0.02, 4.5), (0, 0, -2.4), width=2)
    wood("adding", "f_adding", (0.16, -0.06, 6.05), (3, -6, 4), width=2)
    frame((3.2, -15.5, 4.9), (0.05, 0, 4.85), 70, (0.1, 0, 5.6), 9)
elif shot == "rush":  # faster and faster, crooked past twelve: the newest block is the subject
    place_cover()
    labels = ["hire6", "slack", "hire9", "crm", "ops", "sops", "hire12", "ai", "sku", "hire15", "apps", "meet"]
    x = 0.0
    for i, lab in enumerate(labels):
        x += 0.02 + 0.012 * i
        top = i == len(labels) - 1
        z = 3.5 + i + (1.4 if top else 0)
        wood(lab, lab, (x + (0.25 if top else 0), rnd.uniform(-0.04, 0.04), z), (rnd.uniform(-1, 1) * (0.4 + i * 0.2), (i * 0.35) + (9 if top else 0), rnd.uniform(-9, 9)))
    frame((9.0, -27, 13.2), (x, 0, 13.0), 64, (x, 0, 15.0), 10)
elif shot == "upside":  # it falls; the cover's blocks land upside down
    place_cover(("up", "side", "down"), flip=True)
    labels = ["hire6", "slack", "hire9", "crm", "ops", "sops", "hire12", "ai", "sku", "hire15", "apps", "meet", "agency"]
    for i, lab in enumerate(labels):
        a = -2.6 + i * 0.42 + rnd.uniform(-0.15, 0.15)
        r = 2.0 + rnd.uniform(0, 3.2)
        wood(lab, lab if i % 2 == 0 else None, (r * math.cos(a) * 1.3, 0.8 + r * math.sin(a) * 0.9 + 1.2, 0.5), (rnd.choice([0, 90, 180, 270]), 0, rnd.uniform(0, 360)))
    frame((5.0, -13.5, 2.7), (0, 0, 1.55), 60, (0, 0, 1.6), 3.2)
elif shot == "side":  # Sideways for stabilization: a whole course slides in
    place_cover()
    course("down")
    course("side", dx_shift=-3.2)
    frame((2.2, -15.5, 2.9), (-1.0, 0, 1.4), 54, (-2.0, 0, 1.5), 7)
elif shot == "down":  # Down for pruning: what doesn't hold goes over the edge
    place_cover()
    for c in ("down", "side", "up"):
        course(c)
    wood("t1", None, (-1, 0, 3.5), (0, 0, 2)); wood("t2", None, (0, 0, 3.5), (0, 0, -1.5))
    wood("slack", "slack", (3.0, -0.1, 3.2), (0, 28, 12))
    wood("apps", "apps", (3.6, -0.3, 1.6), (12, 62, -20))
    wood("agency", "agency", (2.0, 0.05, 3.55), (0, 6, 4))
    frame((7.5, -16, 4.6), (1.6, 0, 2.6), 52, (2.4, 0, 2.8), 7)
elif shot == "up":  # Up for growth: the team goes back on, square, on the systems
    place_cover()
    for c in ("down", "side", "up"):
        course(c)
    n = 0
    for lv in range(7):
        for dx in (-1, 0, 1):
            top = lv == 6 and dx == 1
            wood(f"b{n}", ["hire6", "hire9", "hire12", "crm", "ops", "sops", None, None][n % 8] if dx == 0 and lv in (1, 3, 5) else None,
                 (dx, rnd.uniform(-0.01, 0.01), 3.5 + lv + (1.1 if top else 0)), (0, 0, rnd.uniform(-1.2, 1.2)))
            n += 1
    frame((9.0, -27, 7.4), (0.2, 0, 6.2), 46, (0.6, 0, 7.0), 9)
elif shot == "repeat":  # Up. Side. Down. Repeat. Each block makes its own move
    up_b.location = (-1.45, 0, 1.75); up_b.rotation_euler = (0, 0, math.radians(-3))
    side_b.location = (0.35, 0, 0.5); side_b.rotation_euler = (0, 0, math.radians(2))
    down_b.location = (1.85, 0, 0.5); down_b.rotation_euler = (math.radians(-9), 0, math.radians(-2))
    frame((0.6, -15.5, 2.4), (0.2, 0, 0.95), 52, (0.2, 0, 1.0), 9)

area("key", (-9, -10, 16), (1, 0, 4), 10, 6500)
area("fill", (14, -8, 6), (1, 0, 4), 12, 1800, "#f2f4ff")
area("rim", (3, 9, 18), (1, 0, 6), 6, 1800)
area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")
area("top", (-4, -6, 26), (0, 0, 12), 8, 2600)

r = scene.render
r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -1.05
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
bpy.ops.render.render(write_still=True)
print("wrote", opt["out"], flush=True)
