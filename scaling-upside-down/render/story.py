# The scroll story: 300 frames. Run: blender -b -P story.py -- --w 1600 --h 1000 --samples 18 --render 0
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403

# ================= the story animation =================
# 1-28 intro drop, 32-121 growth, 124-140 sway, 141-188 physics collapse (baked),
# 190-216 Side (align), 218-266 Down (prune), 268-279 Up (one block lands), 280-300 final framing.
from mathutils import Euler, Quaternion, Matrix

END = 300
HANDOFF = 141
PHYS_END = 188
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = END
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"

def q_yaw(deg):
    return Euler((0, 0, math.radians(deg))).to_quaternion()

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

# --- base three: drop in on load ---
base = blocks[:]
base_yaw = [-2.5, 1.8, -1.2]
for i, ob in enumerate(base):
    ob.rotation_mode = "QUATERNION"
    drop(ob, tuple(ob.location), base_yaw[i], 2 + i * 6)

# --- the labelled blocks a founder keeps adding ---
LAB = ["hire6", "slack", "hire9", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet"]
random.seed(11)
labeled = []
start_pos = {}
for i, k in enumerate(LAB):
    mat = raw_wood_material(f"wood_{k}", f"label_{k}.png", seed=random.random() * 3)
    plain = raw_wood_material(f"woodp_{k}", None, seed=random.random() * 3)
    yaw = random.uniform(-6, 6)
    pos = (random.uniform(-0.035, 0.035), random.uniform(-0.04, 0.04), 3.5 + i)
    ob = block(k, pos, 0, mat, plain)
    ob.rotation_mode = "QUATERNION"
    drop(ob, pos, yaw, 32 + i * 6, fall=7, height=6.0, spin=random.uniform(-10, 10))
    start_pos[k] = (pos, yaw)
    labeled.append(ob)

# --- sway: the tower up to hire #12 shivers, everything past twelve leans out ---
lean = 0.0
for i, ob in enumerate(labeled):
    (x, y, z), yaw = start_pos[ob.name]
    if i < 8:
        setkey(ob, 124, (x, y, z), q_yaw(yaw))
        setkey(ob, 130, (x + 0.025, y, z), q_yaw(yaw + 0.6))
        setkey(ob, 136, (x - 0.02, y, z), q_yaw(yaw - 0.4))
        setkey(ob, 140, (x, y, z), q_yaw(yaw))
    else:
        lean += 0.3 + (i - 8) * 0.04
        setkey(ob, 124, (x, y, z), q_yaw(yaw))
        setkey(ob, 131, (x + lean * 0.55, y, z), q_yaw(yaw + 1.5))
        setkey(ob, 135, (x + lean * 0.42, y, z), q_yaw(yaw + 0.5))
        setkey(ob, 140, (x + lean, y, z), q_yaw(yaw + 2.0))

# --- physics from HANDOFF: kinematic until then ---
bpy.ops.rigidbody.world_add()
rw = scene.rigidbody_world
rw.substeps_per_frame = 20
rw.solver_iterations = 30
rw.point_cache.frame_start = 1
# 1 m blocks fall in slow motion, so simulate at real speed and keep every 2nd frame
RETIME = 2
SIM_END = HANDOFF + (PHYS_END - HANDOFF) * RETIME
rw.point_cache.frame_end = SIM_END + 2
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
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
    rb.friction = 0.45
    rb.restitution = 0.08
    rb.mass = 1.0
    rb.collision_margin = 0.002
    rb.kinematic = True
    # twelve holds; only the blocks past twelve are handed to physics
    if ob in labeled[8:]:
        ob.keyframe_insert("rigid_body.kinematic", frame=HANDOFF - 1)
        rb.kinematic = False
        ob.keyframe_insert("rigid_body.kinematic", frame=HANDOFF)

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
for ob in phys:
    prev = None
    for f in range(HANDOFF, PHYS_END + 1):
        loc, quat, _ = baked[ob.name][f].decompose()
        if prev is not None and prev.dot(quat) < 0:
            quat = -quat
        setkey(ob, f, tuple(loc), quat, "LINEAR")
        prev = quat
    final[ob.name] = (tuple(loc), prev)

# which blocks are still standing in the stack
order = base + labeled
standing, fallen = [], []
for lvl, ob in enumerate(order):
    (x, y, z), _ = final[ob.name]
    if abs(z - (lvl + 0.5)) < 0.3 and math.hypot(x, y) < 1.4:
        standing.append(ob)
    else:
        fallen.append(ob)
print("standing", [o.name for o in standing])
print("fallen", [o.name for o in fallen])
print("fallen z", [round(final[o.name][0][2], 2) for o in fallen])

# --- SIDE: everything still standing slides into alignment ---
level = {}
for lvl, ob in enumerate(standing):
    loc, q = final[ob.name]
    s = 190 + int(lvl * 1.4)
    setkey(ob, PHYS_END + 1, loc, q)
    setkey(ob, s, loc, q)
    setkey(ob, s + 12, (0.0, 0.0, lvl + 0.5), Quaternion((1, 0, 0, 0)))
    level[ob.name] = lvl
for ob in fallen:
    loc, q = final[ob.name]
    setkey(ob, PHYS_END + 1, loc, q)

# --- DOWN: clear the wreckage, pull the blocks that don't belong ---
for j, ob in enumerate(sorted(fallen, key=lambda o: final[o.name][0][0])):
    (x, y, z), q = final[ob.name]
    s = 218 + j * 2
    setkey(ob, s, (x, y, z), q, "QUAD", "EASE_IN")
    setkey(ob, s + 14, (x + 18, y - 3, z), q @ q_yaw(random.uniform(-40, 40)))

stack = [o for o in standing]
def pull(name, start):
    """slide a block out to the left, then the blocks above settle down one level"""
    ob = next(o for o in stack if o.name == name)
    i = stack.index(ob)
    z = i + 0.5
    setkey(ob, start, (0.0, 0.0, z), Quaternion((1, 0, 0, 0)), "QUAD", "EASE_IN")
    setkey(ob, start + 12, (-26.0, -0.4, z), q_yaw(-8))
    for above in stack[i + 1:]:
        za = stack.index(above) + 0.5
        setkey(above, start + 10, (0.0, 0.0, za), Quaternion((1, 0, 0, 0)), "QUAD", "EASE_IN")
        setkey(above, start + 16, (0.0, 0.0, za - 1), Quaternion((1, 0, 0, 0)), "QUAD", "EASE_OUT")
        setkey(above, start + 18, (0.0, 0.0, za - 1 + 0.04), Quaternion((1, 0, 0, 0)))
        setkey(above, start + 20, (0.0, 0.0, za - 1), Quaternion((1, 0, 0, 0)))
    stack.remove(ob)

if any(o.name == "agency" for o in stack):
    pull("agency", 226)
if any(o.name == "apps" for o in stack):
    pull("apps", 247)

# --- UP: one new block, on a structure that can hold it ---
sysmat = raw_wood_material("wood_systems", "label_systems.png", seed=1.3)
sysplain = raw_wood_material("woodp_systems", None, seed=2.1)
sysb = block("systems", (0, 0, 80), 0, sysmat, sysplain)
sysb.rotation_mode = "QUATERNION"
top = len(stack) + 0.5
drop(sysb, (0.0, 0.0, top), 0.0, 268, fall=7, height=6.0, spin=6)
print("final stack", [o.name for o in stack] + ["systems"])

# ================= camera =================
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

ztop = len(stack) + 1.0
SHOTS = [  # frame, camera, aim, focus, lens, fstop
    (1, (9.4, -14.4, 3.3), (-1.25, 0, 1.3), (0, 0, 1.5), 78, 4.0),
    (28, (8.8, -13.4, 3.1), (-1.25, 0, 1.3), (0, 0, 1.5), 78, 4.0),
    (34, (8.8, -13.4, 3.1), (-1.25, 0, 1.3), (0, 0, 1.6), 78, 4.0),
    (46, (9.2, -15.8, 3.6), (-0.6, 0, 2.6), (0, 0, 2.8), 66, 4.0),
    (58, (9.6, -18.0, 4.3), (-0.1, 0, 3.8), (0, 0, 4.0), 57, 4.4),
    (72, (10.0, -21.0, 5.0), (0.4, 0, 5.0), (0, 0, 5.2), 50, 4.8),
    (90, (10.6, -25.0, 6.0), (1.2, 0, 6.6), (0, 0, 6.6), 43, 5.2),
    (114, (12.0, -30.5, 7.4), (2.3, 0, 8.4), (0.3, 0, 8.4), 36, 5.6),
    (124, (12.0, -30.5, 7.6), (2.6, 0, 9.0), (0.5, 0, 8.4), 36, 5.6),
    (188, (12.4, -31.0, 7.0), (3.4, 0, 7.4), (2.0, 0, 6.0), 36, 5.6),
    (206, (10.5, -25.0, 5.8), (1.0, 0, 6.0), (0, 0, 6.0), 46, 5.6),
    (262, (10.0, -24.6, 5.6), (0.6, 0, 5.6), (0, 0, 5.4), 48, 5.6),
    (300, (10.2, -28.8, 5.9), (-2.9, 0, ztop * 0.5), (0, 0, ztop * 0.5), 50, 5.0),
]
for f, c, a, fo, lens, fs in SHOTS:
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

# ================= lights + render =================
area("key", (-9, -10, 16), (1, 0, 6), 10, 6500)
area("fill", (14, -8, 6), (1, 0, 5), 12, 1800, "#f2f4ff")
area("rim", (3, 9, 18), (1, 0, 8), 6, 1800)
area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")

r = scene.render
r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 6
r.use_persistent_data = True
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100
r.use_motion_blur = opt.get("blur", "0") == "1"
r.motion_blur_shutter = 0.35
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -1.05
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, opt.get("blend", "story.blend")))
print("saved story.blend")
if opt.get("render", "1") == "1":
    scene.frame_start = int(opt.get("fs", "1"))
    scene.frame_end = int(opt.get("fe", str(END)))
    scene.frame_step = int(opt.get("step", "1"))
    bpy.ops.render.render(animation=True)
