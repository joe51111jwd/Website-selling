# The closed loop, after the story: seen from above, the Up / Side / Down row lies buried under
# what AI keeps adding (SOPs, AI tools, apps...). The pile is swept off the table and eleven of the
# twelve painted systems are set down in a ring around the row. The twelfth, Quality, is rendered
# on its own (block and shadows) so the page can drop it into the gap when the prompt is copied.
# The book lies further along the same table, in a wide panorama the page slides across.
#
# Run (after story.py saved foundation.blend):
#   blender -b foundation.blend -P closed.py -- --shot seq --out out/clseq [--frames 1-44] [--blur 1] [--proxy 1]
#   blender -b foundation.blend -P closed.py -- --shot layers --out out/closed
#   blender -b foundation.blend -P closed.py -- --shot pano --out out/closed
# Or all three: ./render_closed.sh. Then see README.md, step 6.
import json
import math
import os
import random
import sys

import bmesh  # noqa: F401  (used by book.py's hardcover)
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Quaternion, Vector  # noqa: F401

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
opt = {"shot": "seq", "out": "out/clseq", "frames": "", "blur": "1", "proxy": "0", "samples": "18"}
opt.update({argv[i].lstrip("-"): argv[i + 1] for i in range(0, len(argv) - 1, 2)})
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")
OUT = os.path.join(HERE, opt["out"])
os.makedirs(OUT, exist_ok=True)
PROXY = opt["proxy"] == "1"
sc = scene = bpy.context.scene


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


def img(name, colour=True):
    im = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    if not colour:
        im.colorspace_settings.name = "Non-Color"
    return im


def q_yaw(deg):
    return Euler((0, 0, math.radians(deg))).to_quaternion()


def ease(t):  # smootherstep
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


# ---- freeze the story's last frame, then clear the table ----
sc.frame_set(340)
frozen = {o.name: o.matrix_world.copy() for o in sc.objects}
for o in sc.objects:
    o.animation_data_clear()
    o.matrix_world = frozen[o.name]
sc.objects["cam"].data.animation_data_clear()
for o in sc.objects:
    if o.type == "MESH" and o.name != "cyc":
        o.hide_render = True
cyc = sc.objects["cyc"]
cam, aim, focus = sc.objects["cam"], sc.objects["aim"], sc.objects["focus"]


def key(ob, f, loc, quat, interp="LINEAR"):
    ob.location = loc
    ob.rotation_quaternion = quat
    ob.keyframe_insert("location", frame=f)
    ob.keyframe_insert("rotation_quaternion", frame=f)
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            if abs(kp.co.x - f) < 0.01:
                kp.interpolation = interp


def show(ob):
    ob.hide_render = False
    ob.rotation_mode = "QUATERNION"
    return ob


# ---- the cover row, face up, exactly as the page opens ----
FACE_UP = Euler((math.radians(-90), 0, 0)).to_quaternion()
ROW = {"up": (-1.04, 0.0, -1.2), "side": (0.0, 0.015, 0.8), "down": (1.04, -0.01, -0.6)}
for k, (x, y, yaw) in ROW.items():
    ob = show(sc.objects[k])
    ob.location = (x, y, 0.5)
    ob.rotation_quaternion = q_yaw(yaw) @ FACE_UP

# ---- the ring: clockwise from 10 o'clock; Quality waits at 9 ----
R = 2.40
ORDER = ["content", "leads", "conversion", "retention", "roles", "systematize", "tech", "fulfillment", "profit", "risk", "efficiency"]
HOURS = dict(zip(ORDER, [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8]))
HOURS["quality"] = 9


def ring_pose(k):
    h = HOURS[k]
    th = math.radians(h * 30)
    yaw = -h * 30 + (180 if 4 <= h <= 8 else 0) + random.Random(sum(map(ord, k))).uniform(-1.2, 1.2)
    return Vector((R * math.sin(th), R * math.cos(th), 0.5)), q_yaw(yaw) @ FACE_UP


# ---- what piles up: copies of the rush blocks, labels up ----
LABELLED = ["sops"] * 4 + ["ai"] * 3 + ["apps", "slack", "crm", "meet", "sku", "agency", "burn", "ops", "hire12", "hire15"]
PLAIN = [f"grow_{i}_{j}" for i in range(3) for j in range(3)]
rng = random.Random(11)
pool = []
for n, src in enumerate(LABELLED + PLAIN):
    ob = sc.objects[src].copy()
    ob.name = f"pile_{n:02d}"
    sc.collection.objects.link(ob)
    ob.animation_data_clear()
    pool.append(show(ob))
rng.shuffle(pool)
# the three lying on the row itself are what AI keeps adding: an SOP, an AI tool, the 43 apps
for src in ("sops", "ai", "apps"):
    ob = next(o for o in pool if o.data == sc.objects[src].data)
    pool.remove(ob)
    pool.append(ob)


def yaw_square():
    # mostly upright so the labels read from above, some quarter turns; footprints stay within 0.64
    return rng.choice((0, 0, 0, 90, -90)) + rng.uniform(-18, 18)


# floor spots around the row, mostly inside the opening shot (x -3.8..2.1, y -1.85..1.85 at the floor)
spots = []
tries = 0
while len(spots) < len(pool) - 3 and tries < 50000:  # three more rest on the row itself
    tries += 1
    p = Vector((rng.uniform(-5.2, 3.6), rng.uniform(-2.8, 2.8), 0.5))
    if abs(p.x) < 2.25 and abs(p.y) < 1.25:
        continue  # clear of the row
    if any((p - q).length < 1.3 for q in spots):
        continue
    spots.append(p)
if len(spots) < len(pool) - 3:
    sys.exit(f"placed only {len(spots)} floor blocks")
# on the row: three, each half off its block, so UP SIDE DOWN still shows underneath
on_row = [Vector((-1.15, 0.42, 1.58)), Vector((0.3, -0.4, 1.58)), Vector((1.3, 0.38, 1.58))]
# six of the floor spots in view (not the nearest few, which bury the row from the start) arrive late
in_view = sorted((i for i, p in enumerate(spots) if -3.8 < p.x < 2.1 and abs(p.y) < 1.85), key=lambda i: (spots[i] - Vector((-0.85, 0, 0.5))).length)
late = set(in_view[4:10])
rest = {}
for i, ob in enumerate(pool):
    if i < len(spots):
        p = spots[i]
        q = q_yaw(yaw_square()) @ FACE_UP
    else:
        p = on_row[i - len(spots)]
        tilt = Euler((math.radians(rng.uniform(-8, 8)), math.radians(rng.uniform(-8, 8)), 0)).to_quaternion()
        q = tilt @ q_yaw(yaw_square()) @ FACE_UP
    rest[ob.name] = (p, q)

# ---- the timeline ----
END = 50
SWEEP0 = 14
for i, ob in enumerate(pool):
    p, q = rest[ob.name]
    ang = (math.degrees(math.atan2(p.x, p.y)) + 360) % 360  # clockwise from 12 o'clock
    start = SWEEP0 + 6 * ((ang - 270) % 360) / 360
    landed = 1
    if i in late:
        s0 = 2 + 2 * sorted(late).index(i)
        key(ob, 1, p + Vector((0, 0, 80)), q_yaw(25) @ q, "CONSTANT")
        key(ob, s0, p + Vector((0, 0, 8.5)), q_yaw(25) @ q, "QUAD")
        key(ob, s0 + 5, p, q, "QUAD")
        key(ob, s0 + 7, p + Vector((0, 0, 0.06)), q, "QUAD")
        key(ob, s0 + 9, p, q)
        landed = s0 + 9
    else:
        key(ob, 1, p, q)
    start = max(start, landed + 2)
    d = Vector((p.x, p.y, 0))
    d = d.normalized() if d.length > 0.2 else Vector((0, -1, 0))
    dist = 10.0  # everything on one ray moves together, so nothing catches up with anything
    spin = rng.uniform(20, 35) * rng.choice((-1, 1))
    key(ob, int(start), p, q, "QUAD")
    for kp in [k for fc in ob.animation_data.action.fcurves for k in fc.keyframe_points if abs(k.co.x - int(start)) < 0.01]:
        kp.easing = "EASE_IN"
    key(ob, int(start) + 9, p + d * dist + Vector((0, 0, 0.2)), q_yaw(spin) @ q)
    ob.hide_render = False
    ob.keyframe_insert("hide_render", frame=1)
    ob.hide_render = True
    ob.keyframe_insert("hide_render", frame=int(start) + 10)
    ob.hide_render = False
for fc in [fc for ob in pool for fc in ob.animation_data.action.fcurves if fc.data_path == "hide_render"]:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"

systems = {}
for k in ORDER + ["quality"]:
    ob = show(sc.objects[k])
    systems[k] = ob
    p, q = ring_pose(k)
    if k == "quality":
        ob.location, ob.rotation_quaternion = p, q
        continue
    s0 = 20 + 2 * ORDER.index(k)
    key(ob, 1, p + Vector((0, 0, 80)), q, "CONSTANT")
    key(ob, s0, p + Vector((0, 0, 9)), q, "SINE")
    for kp in [x for fc in ob.animation_data.action.fcurves for x in fc.keyframe_points if abs(x.co.x - s0) < 0.01]:
        kp.easing = "EASE_OUT"
    key(ob, s0 + 7, p, q)

# ---- the camera: the opening's top-down shot, then up and back over the whole ring ----
cd = cam.data
cd.lens, cd.sensor_fit, cd.sensor_width = 70, "HORIZONTAL", 36
cd.shift_x, cd.shift_y = -0.14, 0.0
AIM = Vector((0, 0, 1.0))
D0, D1, E0, E1 = 11.5, 24.3, math.radians(80), math.radians(88)


def cam_at(f):
    t = ease((f - 14) / 33)
    d, e = D0 + (D1 - D0) * t, E0 + (E1 - E0) * t
    return AIM + d * Vector((0, -math.cos(e), math.sin(e))), 8 + 3 * t


for f in range(1, END + 1):
    loc, fs = cam_at(f)
    cam.location, aim.location, focus.location = loc, AIM, Vector((0, 0, 1.0))
    cd.dof.aperture_fstop = fs
    for ob in (cam, aim, focus):
        ob.keyframe_insert("location", frame=f)
    cd.keyframe_insert("dof.aperture_fstop", frame=f)

# ---- render settings (the film's) ----
r = sc.render
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
sc.cycles.adaptive_threshold = 0.03
r.motion_blur_shutter = 0.5


def shoot(path, w, h, spp, blur=False):
    r.resolution_x, r.resolution_y = w, h
    sc.cycles.samples = spp
    r.use_motion_blur = blur
    r.filepath = path
    bpy.ops.render.render(write_still=True)


def frames_arg(default):
    if not opt["frames"]:
        return default
    a, _, b = opt["frames"].partition("-")
    return list(range(int(a), int(b or a) + 1))


W, H = (400, 250) if PROXY else (1600, 1000)
SPP = 6 if PROXY else int(opt["samples"])
shot = opt["shot"]

if shot in ("seq", "test"):
    systems["quality"].hide_render = True
    r.film_transparent = False
    for f in frames_arg(list(range(1, 49))):
        path = os.path.join(OUT, f"c{f:04d}.png")
        if os.path.exists(path) and not PROXY:
            continue  # a stopped run resumes
        sc.frame_set(f)
        shoot(path, W, H, SPP, blur=opt["blur"] == "1" and not PROXY)

elif shot == "layers":
    # Quality alone, at rest in its gap, and its shadow at rest and lifted (the page scales the
    # block toward the camera between the two). All from the frame-50 camera, full frame, so they register.
    sc.frame_set(END)
    for ob in pool + [systems[k] for k in ORDER] + [sc.objects[k] for k in ROW]:
        ob.hide_render = True
    q = systems["quality"]
    r.film_transparent = True
    cyc.visible_camera = False  # still bounces light
    shoot(os.path.join(OUT, "q_block.png"), W, H, 32 if PROXY else 128)
    cyc.visible_camera = True
    cyc.is_shadow_catcher = True
    q.visible_camera = False
    shoot(os.path.join(OUT, "q_shd_rest.png"), W, H, 16 if PROXY else 64)
    q.location.z += 1.74
    shoot(os.path.join(OUT, "q_shd_lift.png"), W, H, 16 if PROXY else 64)
    q.location.z -= 1.74

elif shot == "pano":
    # the frame-50 camera with a wider sensor: its middle is frame 50, pixel for pixel
    sc.frame_set(END)
    systems["quality"].hide_render = True
    for ob in pool:
        ob.hide_render = True
    # book.py's hardcover, without its scene set-up or the blocks it stands beside
    src = open(os.path.join(HERE, "book.py")).read()
    src = src[src.index("# ================= the book still") : src.index("# the three blocks stand beside the book")]
    exec(compile(src, "book.py", "exec"))
    book = sc.objects["book"]
    book.rotation_euler = (math.radians(-90), 0, math.radians(-5))
    book.scale = (1.82, 1.82, 1.82)
    book.location = (-11.0, 0.0, 0.19 * 1.82 + 0.002)
    r.film_transparent = False
    cd.sensor_width = 36 * 2.05
    cd.shift_x = 0.5 - 2544 / 3280
    pw, ph = (820, 375) if PROXY else (3280, 1500)
    shoot(os.path.join(OUT, "pano.png"), pw, ph, 8 if PROXY else 64)
    cd.sensor_width, cd.shift_x = 36, -0.14

# ---- geometry for the page: where things land in the frame-50 picture, in fractions (y down) ----
if shot in ("layers", "pano") or PROXY:
    sc.frame_set(END)
    r.resolution_x, r.resolution_y = 1600, 1000
    cd.sensor_width, cd.shift_x = 36, -0.14
    bpy.context.view_layer.update()

    def proj(v):
        p = world_to_camera_view(sc, cam, Vector(v))
        return [round(p.x, 4), round(1 - p.y, 4)]

    def corners(ob):
        return [ob.matrix_world @ Vector((sx * 0.5, sy * 0.5, sz * 0.5)) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]

    ring_pts = [c for k in ORDER + ["quality"] for c in corners(systems[k])]
    outer = max(math.hypot(c.x, c.y) for c in ring_pts)
    inner = min(math.hypot(c.x, c.y) for c in ring_pts)
    centre = proj((0, 0, 1.0))
    ex = proj((outer + 0.25, 0, 1.0))[0] - centre[0]
    ey = proj((0, outer + 0.25, 1.0))[1] - centre[1]
    ix = proj((inner - 0.15, 0, 1.0))[0] - centre[0]
    iy = proj((0, inner - 0.15, 1.0))[1] - centre[1]
    qc = [proj(c) for c in corners(systems["quality"])]
    rowc = [proj(c) for k in ROW for c in corners(sc.objects[k])]
    geo = {
        "frame": [1600, 1000],
        "ringC": centre,
        "vp": proj(cam.location + Vector((0, 0, -100))),
        "hair": {"rx": round(abs(ex), 4), "ry": round(abs(ey), 4)},
        "inner": {"rx": round(abs(ix), 4), "ry": round(abs(iy), 4)},
        "row": [min(p[0] for p in rowc), min(p[1] for p in rowc), max(p[0] for p in rowc), max(p[1] for p in rowc)],
        "q": {"box": [min(p[0] for p in qc), min(p[1] for p in qc), max(p[0] for p in qc), max(p[1] for p in qc)]},
        "seamDeg": 270,
        "tagDeg": 30,
        "book": {"c": proj((-11.0, 0, 0.4)), "base": proj((-11.0, -2.73, 0.0))},
    }
    with open(os.path.join(OUT, "closed_geo.json"), "w") as fh:
        json.dump(geo, fh, indent=1)
    print("GEO", json.dumps(geo))
print("CLOSED DONE", shot, flush=True)
