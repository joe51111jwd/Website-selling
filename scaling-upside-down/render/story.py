# The scroll story, 340 frames: too fast, it falls over, the twelve systems become the
# foundation, and it builds higher than before. Saves foundation.blend (render it with
# render.sh). Run: blender -b -P story.py -- --w 1600 --h 1000 --samples 18
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403

# ================= act one: too fast, then it falls over =================
# 1-28 the cover blocks drop in (hero). 30-88 the founder piles hires and tools on, faster
# and faster; past Hire #12 every rushed block lands further off-centre. 89-104 the column
# strains. 105 it is handed to physics and goes over: the part past twelve first, then the rest.
from mathutils import Euler, Quaternion, Matrix

scene.render.fps = 24
scene.frame_start = 1
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"

RUSH_STARTS = [30, 37, 43, 49, 54, 59, 63, 67, 70, 73, 76, 78, 80, 82]
HANDOFF = 107
PHYS_END = 146
RETIME = 2  # 1 m blocks fall in slow motion: simulate at real speed and keep every 2nd frame

def q_yaw(deg):
    return Euler((0, 0, math.radians(deg))).to_quaternion()

def q_turn(z_deg, y_deg=0.0):
    return Euler((0, math.radians(y_deg), math.radians(z_deg))).to_quaternion()

def setkey(ob, f, loc=None, quat=None, interp="BEZIER", easing="AUTO"):
    paths = []
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
        paths.append("location")
    if quat is not None:
        ob.rotation_quaternion = quat
        ob.keyframe_insert("rotation_quaternion", frame=f)
        paths.append("rotation_quaternion")
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path in paths:
            for kp in fc.keyframe_points:
                if abs(kp.co.x - f) < 0.01:
                    kp.interpolation = interp
                    if easing != "AUTO":
                        kp.easing = easing

def drop(ob, target, yaw, start, fall=8, height=5.5, spin=8.0):
    """hidden above until start, then falls, lands, small bounce, settles"""
    tx, ty, tz = target
    setkey(ob, 1, (tx, ty, tz + 80), q_yaw(yaw + spin), "CONSTANT")
    setkey(ob, start, (tx, ty, tz + height), q_yaw(yaw + spin), "QUAD", "EASE_IN")
    setkey(ob, start + fall, (tx, ty, tz), q_yaw(yaw), "QUAD", "EASE_OUT")
    setkey(ob, start + fall + 2, (tx, ty, tz + 0.06), q_yaw(yaw), "QUAD", "EASE_IN")
    setkey(ob, start + fall + 4, (tx, ty, tz), q_yaw(yaw))

def rush(ob, target, yaw, start, i):
    """the first few are placed; the later ones are thrown on from the left and skid into place"""
    tx, ty, tz = target
    if i < 5:
        setkey(ob, 1, (tx, ty, tz + 80), q_yaw(yaw + 10), "CONSTANT")
        setkey(ob, start, (tx, ty, tz + 4.5), q_yaw(yaw + 10), "QUAD", "EASE_IN")
        setkey(ob, start + 6, (tx, ty, tz), q_yaw(yaw), "QUAD", "EASE_OUT")
        setkey(ob, start + 8, (tx, ty, tz + 0.03), q_yaw(yaw))
        setkey(ob, start + 10, (tx, ty, tz), q_yaw(yaw))
        return
    rnd = random.Random(i * 7 + 3)
    sz, sy = rnd.uniform(15, 35) * rnd.choice((-1, 1)), rnd.uniform(10, 20)
    flight = 6 if i < 8 else 5
    setkey(ob, 1, (tx - 3.0, ty + 0.6, tz + 80), q_turn(yaw + sz, sy), "CONSTANT")
    setkey(ob, start, (tx - 3.0, ty + 0.6, tz + 2.4), q_turn(yaw + sz, sy), "LINEAR")
    setkey(ob, start + flight // 2, (tx - 1.2, ty + 0.2, tz + 1.4), q_turn(yaw + sz * 0.4, sy * 0.5))
    setkey(ob, start + flight, (tx - 0.1, ty, tz), q_yaw(yaw - 2), "QUAD", "EASE_OUT")
    setkey(ob, start + flight + 3, (tx, ty, tz), q_yaw(yaw))

# --- the cover blocks drop in ---
base = blocks[:]
base_yaw = [-2.5, 1.8, -1.2]
for i, ob in enumerate(base):
    ob.rotation_mode = "QUATERNION"
    drop(ob, tuple(ob.location), base_yaw[i], 2 + i * 6)

# --- what a founder piles on ---
LAB = ["hire6", "slack", "hire9", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet"]
random.seed(11)
labeled, rest = [], {}
x = 0.0
for i, k in enumerate(LAB):
    mat = raw_wood_material(f"wood_{k}", f"label_{k}.png", seed=random.random() * 3)
    plain = raw_wood_material(f"woodp_{k}", None, seed=random.random() * 3)
    # square-ish up to Hire #12; past twelve every rushed block lands further off
    x += (0.045 if i < 8 else 0.07 * (1 + (i - 8) * 0.45)) + random.uniform(-0.004, 0.004)
    yaw = random.uniform(-4, 4) * (1 + i / 13)
    pos = (x, random.uniform(-0.03, 0.03), 3.5 + i)
    ob = block(k, pos, 0, mat, plain)
    ob.rotation_mode = "QUATERNION"
    rush(ob, pos, yaw, RUSH_STARTS[i], i)
    rest[k] = (pos, yaw)
    labeled.append(ob)

# --- strain: the column shivers and bends further the higher you go ---
PUSH = 1.6
for i, ob in enumerate(labeled):
    (px, py, pz), yaw = rest[ob.name]
    h = (i + 1) / 14
    setkey(ob, HANDOFF - 14, (px, py, pz), q_yaw(yaw))  # after the last rushed block skids in (90)
    setkey(ob, HANDOFF - 10, (px + PUSH * 0.25 * h * h, py, pz), q_yaw(yaw + 0.8))
    setkey(ob, HANDOFF - 6, (px + PUSH * 0.12 * h * h, py, pz), q_yaw(yaw - 0.4))
    setkey(ob, HANDOFF - 1, (px + PUSH * h * h, py, pz), q_yaw(yaw + 1.5))

# --- the falling column's base kicks the first two rushed blocks off the cover stack ---
KICK = HANDOFF + 14
for ob in labeled[:2]:
    (px, py, pz), yaw = rest[ob.name]
    lean = PUSH * ((labeled.index(ob) + 1) / 14) ** 2
    setkey(ob, KICK - 4, (px + lean, py, pz), q_yaw(yaw + 1.5))
    setkey(ob, KICK - 1, (px - 0.62, py - 0.05, pz + 0.02), q_turn(yaw - 6, -4), "QUAD", "EASE_IN")

# --- the fall: everything piled on is handed to physics; the cover blocks stand ---
bpy.ops.rigidbody.world_add()
rw = scene.rigidbody_world
rw.substeps_per_frame = 20
rw.solver_iterations = 30
SIM_END = HANDOFF + (PHYS_END - HANDOFF) * RETIME
rw.point_cache.frame_start = 1
rw.point_cache.frame_end = SIM_END + 2
bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "floor_rb"
floor.hide_render = True
bpy.ops.rigidbody.object_add()
floor.rigid_body.type = "PASSIVE"
floor.rigid_body.friction = 0.7
phys = base + labeled
for ob in phys:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.rigidbody.object_add()
    rb = ob.rigid_body
    rb.collision_shape = "BOX"
    rb.friction = 0.35
    rb.restitution = 0.08
    rb.mass = 1.0
    rb.collision_margin = 0.002
    rb.kinematic = True
    if ob in labeled:
        hf = KICK if ob in labeled[:2] else HANDOFF
        ob.keyframe_insert("rigid_body.kinematic", frame=hf - 1)
        rb.kinematic = False
        ob.keyframe_insert("rigid_body.kinematic", frame=hf)

baked = {ob.name: {} for ob in phys}
for f in range(1, SIM_END + 1):
    scene.frame_set(f)
    if f >= HANDOFF and (f - HANDOFF) % RETIME == 0:
        out_f = HANDOFF + (f - HANDOFF) // RETIME
        for ob in phys:
            baked[ob.name][out_f] = ob.matrix_world.copy()

# drop the simulation and keep its motion as plain keyframes
for ob in phys:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.rigidbody.object_remove()
    act = ob.animation_data.action
    for fc in [fc for fc in act.fcurves if fc.data_path.startswith("rigid_body")]:
        act.fcurves.remove(fc)
bpy.ops.object.select_all(action="DESELECT")
floor.select_set(True)
bpy.context.view_layer.objects.active = floor
bpy.ops.rigidbody.object_remove()
bpy.ops.rigidbody.world_remove()
bpy.data.objects.remove(floor)

final = {}
for ob in labeled:
    prev = None
    for f in range(HANDOFF, PHYS_END + 1):
        loc, quat, _ = baked[ob.name][f].decompose()
        if prev is not None and prev.dot(quat) < 0:
            quat = -quat
        setkey(ob, f, tuple(loc), quat, "LINEAR")
        prev = quat
    final[ob.name] = (tuple(loc), prev)
for ob in base:
    loc, quat, _ = ob.matrix_world.decompose()
    final[ob.name] = (tuple(loc), quat)
print("ACT1 wreckage", {k: tuple(round(c, 2) for c in v[0]) for k, v in final.items()})

# ================= act two helpers: how a deliberate builder moves blocks =================
# Rushed blocks were thrown. Foundation blocks are set: square, slow in, no bounce.
SQUARE = Quaternion((1, 0, 0, 0))

def pose_at(ob, f):
    scene.frame_set(f)
    loc, q, _ = ob.matrix_world.decompose()
    return tuple(loc), q

def set_down(ob, target, start, dur=7, lift=0.6, yaw=0.0, frm=None):
    """lift from where it lies, carry, and lower square onto its spot"""
    tx, ty, tz = target
    (fx, fy, fz), fq = frm if frm else pose_at(ob, start)
    up = max(fz, tz) + lift
    setkey(ob, start, (fx, fy, fz), fq)
    setkey(ob, start + max(2, dur // 3), (fx + (tx - fx) * 0.25, fy + (ty - fy) * 0.25, up), SQUARE.slerp(fq, 0.4), "SINE", "EASE_IN_OUT")
    setkey(ob, start + dur - 2, (tx, ty, tz + 0.12), q_yaw(yaw), "SINE", "EASE_OUT")
    setkey(ob, start + dur, (tx, ty, tz), q_yaw(yaw))

def slide_in(ob, target, start, dur=8, frm_dx=-6.0, yaw=0.0):
    """enter along the floor from the side and stop square in place (Scaling Sideways)"""
    tx, ty, tz = target
    setkey(ob, 1, (tx + frm_dx, ty, tz + 80), q_yaw(yaw), "CONSTANT")
    setkey(ob, start, (tx + frm_dx, ty, tz), q_yaw(yaw), "SINE", "EASE_OUT")
    setkey(ob, start + dur, (tx, ty, tz), q_yaw(yaw))

def lower_in(ob, target, start, dur=6, height=2.0, yaw=0.0):
    """lowered straight down from above frame and seated without a bounce"""
    tx, ty, tz = target
    setkey(ob, 1, (tx, ty, tz + 80), q_yaw(yaw), "CONSTANT")
    setkey(ob, start, (tx, ty, tz + height), q_yaw(yaw), "SINE", "EASE_OUT")
    setkey(ob, start + dur, (tx, ty, tz), q_yaw(yaw))

def clear_out(ob, start, dur=10, to=(0.0, -9.0, 0.0), spin=25.0):
    """dead weight leaves: lifted a little and pulled out of frame"""
    (fx, fy, fz), fq = pose_at(ob, start)
    setkey(ob, start, (fx, fy, fz), fq, "QUAD", "EASE_IN")
    setkey(ob, start + dur, (fx + to[0], fy + to[1], fz + to[2] + 0.2), fq @ q_yaw(spin))

# ================= act two: the foundation, then it builds =================
# 146-147 wreckage hold. 148-156 clear the footprint. 157-199 SIDE: the twelve systems
# (Chapter 10) arrive in mirror pairs and widen the cover into three coloured courses.
# 200-220 DOWN: the dead weight leaves, the rest is gathered. 221-318 UP: the same team goes
# back on, on top of the systems, and the structure keeps rising past where the rush fell.
END = 340
scene.frame_end = END

def world_at(anchor, dx, dz=0.0, yaw_deg=None):
    """a spot dx blocks along the anchor block's own x axis (so seams stay tight)"""
    loc, q = final[anchor.name]
    yaw = q.to_euler().z if yaw_deg is None else math.radians(yaw_deg)
    return (loc[0] + math.cos(yaw) * dx * 1.003, loc[1] + math.sin(yaw) * dx * 1.003, loc[2] + dz), math.degrees(yaw)

down_b, side_b, up_b = base
SYS = {  # course anchor -> (x=-2, x=-1, x=+1, x=+2), paint
    "down": (down_b, ["profit", "risk", "efficiency", "quality"], "#97201a"),
    "side": (side_b, ["roles", "systematize", "tech", "fulfillment"], "#e09a24"),
    "up": (up_b, ["content", "leads", "conversion", "retention"], "#1f4a2b"),
}
systems = {}
for course, (anchor, keys, hexcol) in SYS.items():
    other = paint_material(f"sysp_{course}", hexcol)
    for key, dx in zip(keys, (-2, -1, 1, 2)):
        front = paint_material(f"sys_{key}", hexcol, f"sys_{key}.png")
        ob = block(key, (0, 0, 80), 0, front, other)
        ob.rotation_mode = "QUATERNION"
        pos, yaw = world_at(anchor, dx)
        rnd = random.Random(sum(map(ord, key)))  # same jitter on every run
        pos = (pos[0] + rnd.uniform(-0.004, 0.004), pos[1] + rnd.uniform(-0.004, 0.004), pos[2])
        systems[key] = (ob, pos, yaw + rnd.uniform(-0.5, 0.5), dx)

# --- 148-156: anything that came to rest where the foundation goes is set aside, square ---
others = {o.name: final[o.name][0] for o in labeled}
def free_spot(cands, taken):
    for c in cands:
        if all(math.hypot(c[0] - p[0], c[1] - p[1]) > 1.25 for p in taken):
            return c
    return cands[-1]
# each goes to its own side (never across the cover stack), behind the line of the foundation
spots_r = [(5.4 + 1.3 * k, 1.7 + 0.3 * (k % 2), 0.5) for k in range(8)]
spots_l = [(-5.4 - 1.3 * k, 1.7 + 0.3 * (k % 2), 0.5) for k in range(8)]
for ob in labeled:
    (x, y, z), q = final[ob.name]
    if abs(x) <= 4.4 and -1.6 <= y <= 1.2:
        taken = [p for n, p in others.items() if n != ob.name]
        tgt = free_spot(spots_r if x >= 0 else spots_l, taken)
        yaw = random.uniform(-6, 6)
        set_down(ob, tgt, 148, dur=8, lift=0.4, yaw=yaw, frm=final[ob.name])
        others[ob.name] = tgt
        final[ob.name] = (tgt, q_yaw(yaw))
        print("set aside", ob.name, "->", tgt)

# --- 157-199 SIDE: the twelve systems, in mirror pairs, inner first, bottom course first ---
PAIRS = [("risk", "efficiency"), ("profit", "quality"), ("systematize", "tech"), ("roles", "fulfillment"), ("leads", "conversion"), ("content", "retention")]
for n, pair in enumerate(PAIRS):
    s = 157 + 7 * n
    for key in pair:
        ob, (tx, ty, tz), yaw, dx = systems[key]
        out = 0.35 if dx > 0 else -0.35
        setkey(ob, 1, (tx + out, ty, tz + 80), q_yaw(yaw), "CONSTANT")
        setkey(ob, s, (tx + out, ty, tz + 1.8), q_yaw(yaw), "SINE", "EASE_OUT")
        setkey(ob, s + 4, (tx + out, ty, tz + 0.02), q_yaw(yaw), "SINE", "EASE_IN_OUT")
        setkey(ob, s + 7, (tx, ty, tz), q_yaw(yaw), "SINE", "EASE_OUT")

# --- 200-220 DOWN: dead weight leaves toward the lens; what stays is gathered ---
JUNK = [("agency", 200), ("apps", 204), ("burn", 208), ("meet", 211), ("hire15", 213)]
CAM_P = Vector((11.0, -20.0, 10.0))
for name, s in JUNK:
    ob = next(o for o in labeled if o.name == name)
    (x, y, z), q = final[name]
    d = Vector((CAM_P.x - x, CAM_P.y - y, 0)).normalized() * 13
    setkey(ob, s - 1, (x, y, z), q)
    setkey(ob, s + 1, (x, y, z + 0.15), q, "QUAD", "EASE_IN")
    setkey(ob, s + 8, (x + d.x, y + d.y, z + 0.15), q @ q_yaw(random.uniform(-30, 30)))
    # and then it is gone from the set, not lying in front of the closing shot
    for flag, f in ((False, s + 8), (True, s + 9)):
        ob.hide_render = flag
        ob.keyframe_insert("hide_render", frame=f)
KEEP = ["hire6", "slack", "hire9", "crm", "ops", "hire12", "sops", "ai", "sku"]
row = [(5.2 + 1.25 * (k % 5), -1.3 - 1.35 * (k // 5), 0.5) for k in range(9)]  # clear of the foundation's front
for k, name in enumerate(KEEP):
    ob = next(o for o in labeled if o.name == name)
    s = 201 + k * 2
    yaw = random.uniform(-3, 3)
    set_down(ob, row[k], s, dur=14, lift=0.25, yaw=yaw, frm=final[name])
    final[name] = (row[k], q_yaw(yaw))

# --- 221-318 UP: the team goes back on, on the systems; then the structure keeps rising ---
TOWER = [["hire6", "slack", "hire9"], ["crm", "ops", "hire12"], ["sops", "ai", "sku"]]
for c, names in enumerate(TOWER):
    for j, name in enumerate(names):
        ob = next(o for o in labeled if o.name == name)
        tgt, yaw = world_at(up_b, j - 1, dz=1.0 + c)
        s = 221 + (c * 3 + j) * 5
        set_down(ob, tgt, s, dur=9, lift=0.5, yaw=yaw + random.uniform(-0.6, 0.6), frm=final[name])

plains = [raw_wood_material(f"woodn_{k}", None, seed=0.4 + k * 0.53) for k in range(6)]
grown = []
for c in range(9):  # courses k6..k14
    for j in range(3):
        m = plains[(c * 3 + j) % 6]
        ob = block(f"grow_{c}_{j}", (0, 0, 80), 0, m, m)
        ob.rotation_mode = "QUATERNION"
        tgt, yaw = world_at(up_b, j - 1, dz=4.0 + c)
        lower_in(ob, tgt, 268 + c * 4 + j, dur=3, height=2.2, yaw=yaw + random.uniform(-0.6, 0.6))
        grown.append(ob)
for c in range(4):  # spire k15..k18
    m = plains[c % 6]
    ob = block(f"spire_{c}", (0, 0, 80), 0, m, m)
    ob.rotation_mode = "QUATERNION"
    tgt, yaw = world_at(up_b, 0, dz=13.0 + c)
    lower_in(ob, tgt, 305 + c * 3, dur=3, height=2.0, yaw=yaw + random.uniform(-0.8, 0.8))
    grown.append(ob)
TOP = final[up_b.name][0][2] + 16.5  # top face of the spire (k18)
print("ACT2 top of structure", round(TOP, 2))

# ================= camera =================
# The rush camera lags behind the tower and lands on a fixed wide shot W. The wreckage shot G
# reacts late, like an operator. The rebuild is shot from above (P) and cranes back down to W,
# so the last frame is the strain frame's exact picture: a crooked needle then, a building now.
cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
aim = bpy.data.objects.new("aim", None)
scene.collection.objects.link(aim)
focus = bpy.data.objects.new("focus", None)
scene.collection.objects.link(focus)
con = cam.constraints.new("TRACK_TO")
con.target = aim
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"
cam_d.dof.use_dof = True
cam_d.dof.focus_object = focus
cam_d.sensor_width = 36

W = ((14.4, -30.8, 3.5), (-2.8, 0, 9.5), 35)
G = ((13.0, -22.5, 5.0), (2.8, -0.4, 1.0), 35)  # close enough that the wreckage reads as blocks, not crumbs
P = ((11.0, -20.0, 10.0), (-1.2, 0.3, 1.5), 40)
Pin = (tuple(P[0][i] + (P[1][i] - P[0][i]) * 0.03 for i in range(3)), P[1], 40)
SHOTS = [  # frame, (camera, aim, lens), focus, fstop
    (1, ((9.4, -14.4, 3.3), (-1.25, 0, 1.3), 78), (0, 0, 1.5), 4.0),
    (28, ((8.8, -13.4, 3.1), (-1.25, 0, 1.3), 78), (0, 0, 1.5), 4.0),
    (34, ((8.8, -13.4, 3.1), (-1.25, 0, 1.3), 78), (0, 0, 1.6), 4.0),
    (50, ((10.0, -18.5, 3.3), (-1.6, 0, 3.4), 60), (0.1, 0, 3.4), 4.4),
    (66, ((11.6, -23.5, 3.4), (-2.2, 0, 5.4), 48), (0.2, 0, 5.4), 4.8),
    (80, ((13.2, -28.0, 3.5), (-2.6, 0, 7.4), 40), (0.3, 0, 7.4), 5.2),
    (92, W, (0.4, 0, 8.5), 5.6),
    (118, W, (0.6, 0, 8.0), 5.6),
    (146, G, (2.5, -0.5, 1.2), 6.0),
    (147, G, (2.5, -0.5, 1.2), 6.0),
    (170, P, (0, 0, 1.4), 6.0),
    (199, P, (0, 0, 1.4), 6.0),
    (220, Pin, (0, 0, 1.4), 6.0),
    (236, ((11.6, -21.5, 9.0), (-1.4, 0.2, 2.4), 40), (0, 0, 2.2), 6.0),
    (252, ((12.2, -23.2, 8.0), (-1.7, 0.1, 3.0), 39), (0, 0, 3.0), 6.0),
    (267, ((12.8, -25.0, 7.0), (-2.0, 0.0, 3.6), 38), (0, 0, 3.6), 6.0),
    (284, ((13.4, -27.2, 5.6), (-2.3, 0, 5.4), 37), (0, 0, 5.4), 6.0),
    (300, ((13.9, -29.2, 4.4), (-2.6, 0, 7.4), 36), (0.2, 0, 7.4), 6.0),
    (318, W, (0.3, 0, 8.0), 6.0),
    (340, W, (0.3, 0, 8.0), 6.0),
]
for f, (c, a, lens), fo, fs in SHOTS:
    cam.location = c
    cam.keyframe_insert("location", frame=f)
    aim.location = a
    aim.keyframe_insert("location", frame=f)
    focus.location = fo
    focus.keyframe_insert("location", frame=f)
    cam_d.lens = lens
    cam_d.keyframe_insert("lens", frame=f)
    cam_d.dof.aperture_fstop = fs
    cam_d.keyframe_insert("dof.aperture_fstop", frame=f)
# camera moves ease in and out, except the lagging rush pull-back, which keeps going
for ob in (cam, aim, focus):
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"

# ================= lights + render =================
area("key", (-9, -10, 16), (1, 0, 6), 10, 6500)
area("fill", (14, -8, 6), (1, 0, 5), 12, 1800, "#f2f4ff")
area("rim", (3, 9, 18), (1, 0, 8), 6, 1800)
area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")
area("top", (-4, -6, 26), (0, 0, 14), 8, 2600)  # the finished building is taller than anything before it

r = scene.render
r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.03
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 6
r.use_persistent_data = True
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100
r.use_motion_blur = False
r.motion_blur_shutter = 0.5
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -1.05
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, opt.get("blend", "foundation.blend")))
print("saved", opt.get("blend", "foundation.blend"), flush=True)
if opt.get("frames"):
    for f in [int(v) for v in opt["frames"].split(",")]:
        scene.frame_set(f)
        r.filepath = f"{opt['out']}_{f:03d}.png"
        bpy.ops.render.render(write_still=True)
    print("STILLS DONE", flush=True)
