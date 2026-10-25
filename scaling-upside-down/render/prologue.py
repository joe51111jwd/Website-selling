# The opening: before the story, the cover's three blocks lie face up in a row, seen from above
# (UP SIDE DOWN reads straight off the table). As the visitor scrolls they stand up and stack into
# the cover, while the camera cranes down to the hero shot. Its last frame is the story's frame 28.
# Run (after story.py saved foundation.blend):
#   blender -b foundation.blend -P prologue.py -- --out out/proseq/p --samples 18 [--proxy 1] [--frames 4.5,5,5.5]
import math
import sys

import bpy
from mathutils import Euler, Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
opt = {"out": "out/proseq/p", "w": "1600", "h": "1000", "samples": "18", "proxy": "0", "frames": ""}
opt.update({argv[i].lstrip("-"): argv[i + 1] for i in range(0, len(argv) - 1, 2)})

HERO = 28  # the story frame the opening lands on
END = 56  # the opening's last frame, identical to HERO
sc = bpy.context.scene

# ---- freeze the story at its hero frame: every object keeps that pose, nothing else moves ----
sc.frame_set(HERO)
frozen = {o.name: (o.matrix_world.copy(), o.hide_render) for o in sc.objects}
cam = sc.objects["cam"]
aim, focus = sc.objects["aim"], sc.objects["focus"]
hero_lens, hero_fstop = cam.data.lens, cam.data.dof.aperture_fstop
for o in sc.objects:
    o.animation_data_clear()
    o.matrix_world, o.hide_render = frozen[o.name]
cam.data.animation_data_clear()
cam.data.lens, cam.data.dof.aperture_fstop = hero_lens, hero_fstop

blocks = {k: sc.objects[k] for k in ("up", "side", "down")}
final = {k: (o.location.copy(), o.rotation_quaternion.copy()) for k, o in blocks.items()}


def ease(t):  # smootherstep
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


# ---- the blocks: face up in a row, then up, upright, over, and down into the stack ----
FACE_UP = Euler((math.radians(-90), 0, 0)).to_quaternion()  # the painted face (-Y) turned to the sky
ROW = {"up": (-1.04, 0.0, -1.2), "side": (0.0, 0.015, 0.8), "down": (1.04, -0.01, -0.6)}  # x, y, yaw


def flat(k):
    x, y, yaw = ROW[k]
    return Vector((x, y, 0.5)), Euler((0, 0, math.radians(yaw))).to_quaternion() @ FACE_UP


def key(ob, f, loc, quat):
    ob.location = loc
    ob.rotation_quaternion = quat
    ob.keyframe_insert("location", frame=f)
    ob.keyframe_insert("rotation_quaternion", frame=f)


def path(k, f):
    """where block k is at frame f: a hand-timed path (Side clears the middle first, Up passes
    over the top, Down slides in under them as the base, then Side and Up come down onto it)"""
    p0, q0 = flat(k)
    p1, q1 = final[k]
    if k == "side":  # straight up over its own spot, standing up on the way, then over and down
        rise = Vector((p0.x, p0.y, 2.2))
        hover = Vector((p1.x, p1.y, 2.2))  # just clear of Down sliding in underneath
        if f <= 4:
            return p0, q0
        if f <= 17:
            t = ease((f - 4) / 13)
            return p0.lerp(rise, t), q0.slerp(q1, t)
        if f <= 25:  # the small drift onto the stack's line happens while Up is above it
            return rise.lerp(hover, ease((f - 17) / 8)), q1
        if f <= 33:
            t = (f - 25) / 8
            t = t * t  # falls into place
            return hover.lerp(p1, t), q1
    elif k == "up":  # rises clear of Side, stands up, then crosses over to the top of the stack
        high = Vector((p0.x, p0.y, 3.35))
        hover = Vector((p1.x, p1.y, 3.35))
        if f <= 7:
            return p0, q0
        if f <= 18:
            t = ease((f - 7) / 11)
            return p0.lerp(high, t), q0.slerp(q1, t)
        if f <= 26:
            return high.lerp(hover, ease((f - 18) / 8)), q1
        if f <= 31:
            return hover, q1
        if f <= 40:
            t = (f - 31) / 9
            t = t * t
            return hover.lerp(p1, t), q1
    else:  # down: tips up where it lies, then slides under the others as the base
        lift = Vector((p0.x, p0.y, 1.0))
        if f <= 9:
            return p0, q0
        if f <= 17:
            t = ease((f - 9) / 8)
            return p0.lerp(lift, t), q0.slerp(q1, t * t)  # the turn lags the lift, so no edge digs into the table
        if f <= 26:
            t = ease((f - 17) / 9)
            p = lift.lerp(p1, t)
            return p, q1
    # settle: a small bounce after landing
    land = {"side": 33, "up": 40, "down": 26}[k]
    if f == land + 1 and k != "down":
        return p1 + Vector((0, 0, 0.04)), q1
    return p1, q1


for k, ob in blocks.items():
    ob.rotation_mode = "QUATERNION"
    for f in range(1, END + 1):
        loc, quat = path(k, f)
        key(ob, f, loc, quat)
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# ---- the camera: from straight above the row to the hero shot, on a sphere around the aim ----
hero_cam, hero_aim, hero_focus = cam.location.copy(), aim.location.copy(), focus.location.copy()
off = hero_cam - hero_aim
d1 = off.length
e1 = math.asin(off.z / d1)
a1 = math.atan2(off.y, off.x)
aim0 = Vector((0, 0, 1.0))
d0, e0, a0, lens0 = 11.5, math.radians(80), math.radians(-90), 70.0  # the row fills about half the frame
for f in range(1, END + 1):
    t = ease((f - 5) / 41)  # frames 5-46, then the hero holds
    # mid-move the blocks are in the air: look a little higher and stand a little further back
    bump = math.sin(math.pi * t)
    a_ = aim0.lerp(hero_aim, t) + Vector((0, 0, 0.9 * bump))
    d, e, az = lerp(d0, d1, t) * (1 + 0.16 * bump), lerp(e0, e1, t), lerp(a0, a1, t)
    cam.location = a_ + d * Vector((math.cos(e) * math.cos(az), math.cos(e) * math.sin(az), math.sin(e)))
    aim.location = a_
    focus.location = Vector((0, 0, 1.0)).lerp(hero_focus, t)
    cam.data.lens = lerp(lens0, hero_lens, t)
    cam.data.dof.aperture_fstop = lerp(8.0, hero_fstop, t)
    for ob, p in ((cam, "location"), (aim, "location"), (focus, "location")):
        ob.keyframe_insert(p, frame=f)
    cam.data.keyframe_insert("lens", frame=f)
    cam.data.keyframe_insert("dof.aperture_fstop", frame=f)

# ---- render ----
r = sc.render
sc.frame_start, sc.frame_end = 1, END - 1
r.resolution_x, r.resolution_y = int(opt["w"]), int(opt["h"])
sc.cycles.samples = int(opt["samples"])
sc.cycles.adaptive_threshold = 0.03
r.use_motion_blur = opt["proxy"] != "1"
r.motion_blur_shutter = 0.5
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
# Frames 1-45, plus the half-frames between them (pNNNNh.png) so scrolling through the opening is
# as smooth as video. From frame 46 on nothing moves: the picture is the story's own frame 28.
frames = [float(v) for v in opt["frames"].split(",") if v] or [n / 2 for n in range(2, 91)]
for fr in frames:
    whole = int(fr)
    sc.frame_set(whole, subframe=fr - whole)
    r.filepath = f"{opt['out']}{whole:04d}{'h' if fr > whole else ''}.png"
    bpy.ops.render.render(write_still=True)
print("PROLOGUE DONE", flush=True)
