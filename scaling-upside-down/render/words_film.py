# The home page's story, told by the blocks alone (James, 14 Nov: "there's still like text along the
# bottom. We have two focuses and that's the problem."). No caption, label or chapter rail sits over it:
# every word is stamped on a block, and each moment has one thing moving.
#
#   28        the hero (story.py's frame 28, the page's frame 89): SCALING stands beside UP / SIDE / DOWN,
#             with the hero's lines and red plank in front (the page lays those over the picture as layers;
#             here they are real, so the film carries straight on from the layers)
#   30-56     three raw-wood planks are thrown on, one at a time: ALWAYS ADDING, ALWAYS HIRING, ALWAYS
#             LAUNCHING (L1993, top down); the camera rises with them and the hero's planks drop out of shot
#   57-106    the rush: hires and tools piled on faster and crooked; the column strains
#   107-146   it falls over (rigid-body physics, baked); SCALING stands, the planks go with the rest
#   then      the footprint is cleared; SCALING and the cover's stack turn upside down together (the
#             book's title, upside down), hold, and are set right; SCALING steps aside
#   SIDE      a yellow slab SIDEWAYS FOR / STABILIZATION (L3316) slides in from the side; then the twelve
#             systems slide in from the sides around the cover
#   DOWN      a red slab DOWN FOR / PRUNING (L3317) is lowered from above; then the dead weight, the three
#             ALWAYS planks with it, leaves toward the lens and what stays is gathered
#   UP        a green slab UP FOR / GROWTH (L3315) rises out of the table; then the same team goes back on,
#             on the systems, and the building keeps rising past where the rush fell
#   end       the wide shot: SCALING beside the finished building, the three slabs in a row in front
#
# The slabs stand in a row in front of the building, left to right in the story's order, each facing the
# camera; the camera pushes in to read each as it arrives, then pulls back for what it starts.
#
#   blender -b -P words_film.py -- --blend words.blend                          (the film, saved)
#   blender -b -P words_film.py -- --act1 1                                     (the fall only: prints the wreckage)
#   blender -b -P words_film.py -- --blend words.blend --frames 54,170,200 --w 800 --h 500 --samples 8 --out out/wb/b
# The stamps come from make_words_labels.py, the hero planks' from make_hero_labels.py, the rush blocks'
# labels and the systems' faces from make_textures.py / make_systems.py (all into tex/).
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403
from mathutils import Euler, Quaternion, Matrix, Vector  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

scene.render.fps = 24
scene.frame_start = 1
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"

RUSH_STARTS = [30, 37, 44, 57, 60, 63, 66, 69, 72, 75, 77, 79, 81, 83]  # the third plank holds the screen alone until 57
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


def key_hidden(ob, f_hide=None, f_show=None):
    """hidden from the render from f_hide on (and/or shown from f_show on)"""
    if f_show is not None:
        ob.hide_render = True
        ob.keyframe_insert("hide_render", frame=1)
        ob.hide_render = False
        ob.keyframe_insert("hide_render", frame=f_show)
    if f_hide is not None:
        ob.hide_render = False
        ob.keyframe_insert("hide_render", frame=f_hide - 1)
        ob.hide_render = True
        ob.keyframe_insert("hide_render", frame=f_hide)
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path == "hide_render":
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"


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


# ---------- stamped blocks (as hero_words.py's) ----------
def stamped(name, base, label, ink, ink_rough=0.4):
    """base material (a raw wood or paint material) with a stamp printed on its front face (label's alpha)"""
    m = base.copy()
    m.name = name
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    col_from = bsdf.inputs["Base Color"].links[0].from_socket
    lt = nt.nodes.new("ShaderNodeTexImage")
    lt.image = img(label)
    lt.extension = "CLIP"
    lt.interpolation = "Cubic"
    uv = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(uv.outputs["UV"], lt.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(lt.outputs["Alpha"], mix.inputs["Factor"])
    nt.links.new(col_from, mix.inputs["A"])
    mix.inputs["B"].default_value = srgb(ink)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    rough_from = bsdf.inputs["Roughness"].links[0].from_socket
    rmix = nt.nodes.new("ShaderNodeMix")
    nt.links.new(lt.outputs["Alpha"], rmix.inputs["Factor"])
    nt.links.new(rough_from, rmix.inputs["A"])
    rmix.inputs["B"].default_value = ink_rough
    nt.links.new(rmix.outputs["Result"], bsdf.inputs["Roughness"])
    return m


def plank(name, label, ink, base, loc, yaw, w, h, d):
    """a block w wide, d deep and h tall standing on the table (loc is its foot's centre), its front face
    (the -y side before the yaw) stamped with label"""
    front = stamped(f"{name}_front", base, label, ink) if label else base
    ob = block(name, (loc[0], loc[1], loc[2] + h / 2), math.radians(yaw), front, base, size=h, depth=d, width=w)
    ob.modifiers["bevel"].width = 0.035 * min(w, h, d) * 2.2
    ob.rotation_mode = "QUATERNION"
    return ob


# ================= the hero's planks, as on the page =================
hero_wood = raw_wood_material("plank_wood", seed=0.7)
hero_red = paint_material("cta_red", "#97201a")
HERO_PLANKS = {
    "scaling": dict(label="hero_scaling.png", ink="#17130f", base=hero_wood, loc=(-0.98, 0.02, 0.0), yaw=8.0, w=0.66, h=3.0, d=0.6),
    "book": dict(label="hero_book.png", ink="#17130f", base=hero_wood, loc=(1.72, -3.15, 0.28), yaw=24.0, w=2.3, h=0.28, d=0.42),
    "founders": dict(label="hero_founders.png", ink="#17130f", base=hero_wood, loc=(1.67, -3.23, 0.0), yaw=26.0, w=2.5, h=0.28, d=0.5),
    "join": dict(label="hero_join.png", ink="#f1e7d2", base=hero_red, loc=(2.85, -4.75, 0.0), yaw=28.0, w=2.35, h=0.27, d=0.48),
}
hp = {k: plank(k, **v) for k, v in HERO_PLANKS.items()}
scaling = hp["scaling"]
setkey(scaling, 1, tuple(scaling.location), scaling.rotation_quaternion)
lines_out = [hp["book"], hp["founders"], hp["join"]]  # leave the shot as the camera rises (hidden once out)

# ================= act one: too fast, then it falls over =================
base = blocks[:]
for ob in base:
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = ob.rotation_euler.to_quaternion()
    setkey(ob, 1, tuple(ob.location), ob.rotation_quaternion)

LAB = ["adding", "hiring", "launching", "crm", "agency", "ops", "apps", "hire12", "sops", "ai", "burn", "sku", "hire15", "meet"]
PLANKS = ("adding", "hiring", "launching")  # bottom to top: the held stack reads top down as L1993 does
PLANK_YAW = {"adding": 6.0, "hiring": 2.5, "launching": 8.0}  # turned a little toward the camera
random.seed(11)
labeled, rest = [], {}
x = 0.0
for i, k in enumerate(LAB):
    label = f"w_{k}.png" if k in PLANKS else f"label_{k}.png"
    mat = raw_wood_material(f"wood_{k}", label, seed=random.random() * 3)
    plain = raw_wood_material(f"woodp_{k}", None, seed=random.random() * 3)
    # square-ish up to Hire #12; past twelve every rushed block lands further off
    x += (0.045 if i < 8 else 0.07 * (1 + (i - 8) * 0.45)) + random.uniform(-0.004, 0.004)
    yaw = random.uniform(-4, 4) * (1 + i / 13)
    if k in PLANKS:
        yaw = PLANK_YAW[k]
    pos = (x, random.uniform(-0.03, 0.03), 3.5 + i)
    ob = block(k, pos, 0, mat, plain, width=2 if k in PLANKS else None)
    ob.rotation_mode = "QUATERNION"
    rush(ob, pos, yaw, RUSH_STARTS[i], i)
    rest[k] = (pos, yaw)
    labeled.append(ob)

# --- strain: the column shivers and bends further the higher you go ---
PUSH = 1.6
for i, ob in enumerate(labeled):
    (px, py, pz), yaw = rest[ob.name]
    h = (i + 1) / 14
    setkey(ob, HANDOFF - 14, (px, py, pz), q_yaw(yaw))
    setkey(ob, HANDOFF - 10, (px + PUSH * 0.25 * h * h, py, pz), q_yaw(yaw + 0.8))
    setkey(ob, HANDOFF - 6, (px + PUSH * 0.12 * h * h, py, pz), q_yaw(yaw - 0.4))
    setkey(ob, HANDOFF - 1, (px + PUSH * h * h, py, pz), q_yaw(yaw + 1.5))

# --- the falling column drags the two bottom planks off the cover stack, toward its fall (away from SCALING) ---
KICK = HANDOFF + 14
for ob in labeled[:2]:
    (px, py, pz), yaw = rest[ob.name]
    lean = PUSH * ((labeled.index(ob) + 1) / 14) ** 2
    setkey(ob, KICK - 4, (px + lean, py, pz), q_yaw(yaw + 1.5))
    setkey(ob, KICK - 1, (px + lean + 0.72, py - 0.06, pz + 0.02), q_turn(yaw + 7, 4), "QUAD", "EASE_IN")

# --- the fall: everything piled on is handed to physics; the cover blocks and SCALING stand ---
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
phys = base + [scaling] + labeled
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
for ob in base + [scaling]:
    loc, quat, _ = ob.matrix_world.decompose()
    final[ob.name] = (tuple(loc), quat)
print("ACT1 wreckage", json.dumps({k: [round(c, 2) for c in v[0]] for k, v in final.items()}), flush=True)
if opt.get("act1") == "1":
    sys.exit(0)

# ================= act two helpers: how a deliberate builder moves blocks =================
SQUARE = Quaternion((1, 0, 0, 0))


def same_side(q, ref):
    """q or -q, whichever is nearer ref (keyed quaternions are blended number by number)"""
    return q if q.dot(ref) >= 0 else -q


def pose_at(ob, f):
    scene.frame_set(f)
    loc, q, _ = ob.matrix_world.decompose()
    return tuple(loc), q


def set_down(ob, target, start, dur=7, lift=0.6, yaw=0.0, frm=None):
    """picked up where it lies, carried at height, and lowered straight down, square, onto its spot"""
    tx, ty, tz = target
    (fx, fy, fz), fq = frm if frm else pose_at(ob, start)
    up = max(fz, tz) + lift
    q1 = same_side(SQUARE.slerp(fq, 0.4), fq)
    q2 = same_side(q_yaw(yaw), q1)
    setkey(ob, start, (fx, fy, fz), fq)
    setkey(ob, start + 2, (fx + (tx - fx) * 0.1, fy + (ty - fy) * 0.1, up), q1, "SINE", "EASE_IN_OUT")
    setkey(ob, start + dur - 3, (tx, ty, up), q2, "SINE", "EASE_IN_OUT")
    setkey(ob, start + dur, (tx, ty, tz), q2)


def lower_in(ob, target, start, dur=6, height=2.0, yaw=0.0):
    """lowered straight down from above frame and seated without a bounce"""
    tx, ty, tz = target
    setkey(ob, 1, (tx, ty, tz + 80), q_yaw(yaw), "CONSTANT")
    setkey(ob, start, (tx, ty, tz + height), q_yaw(yaw), "SINE", "EASE_OUT")
    setkey(ob, start + dur, (tx, ty, tz), q_yaw(yaw))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def world_at(anchor, dx, dz=0.0, yaw_deg=None):
    """a spot dx blocks along the anchor block's own x axis (so seams stay tight)"""
    loc, q = final[anchor.name]
    yaw = q.to_euler().z if yaw_deg is None else math.radians(yaw_deg)
    return (loc[0] + math.cos(yaw) * dx * 1.003, loc[1] + math.sin(yaw) * dx * 1.003, loc[2] + dz), math.degrees(yaw)


# ================= the cycle's slabs: a row in front of the building =================
# Left to right in the story's order, each turned to face the camera (front right), far enough in front
# that the last shot sees the whole foundation over them.
ROW_YAW = 28.0
ROW_AXIS = Vector((math.cos(math.radians(ROW_YAW)), math.sin(math.radians(ROW_YAW)), 0))
ROW_C = Vector((1.6, -6.4, 0))
ROW_STEP = 2.75
SW, SH, SD = 2.4, 1.0, 0.5
PHASE = {  # paint, ink (make_systems.py's), place in the row
    "side": ("#e09a24", "#181410", -1),
    "down": ("#97201a", "#f1e6cf", 0),
    "up": ("#1f4a2b", "#f1e6cf", 1),
}
slabs, slab_at = {}, {}
for k, (paint, ink, n) in PHASE.items():
    p = ROW_C + ROW_AXIS * (ROW_STEP * n)
    slab_at[k] = (p.x, p.y, SH / 2)
    m = paint_material(f"slab_{k}", paint)
    ob = plank(f"slab_{k}", f"w_{k}.png", ink, m, (p.x, p.y, 0.0), ROW_YAW, SW, SH, SD)
    ob.modifiers["bevel"].width = 0.03
    slabs[k] = ob
    setkey(ob, 1, (p.x, p.y, 80.0), q_yaw(ROW_YAW), "CONSTANT")  # off the set until it arrives


def near_row(p, r=2.1):
    return any(math.hypot(p[0] - s[0], p[1] - s[1]) < r for s in slab_at.values())


# where SCALING waits (and ends): beside the foundation, behind the line the left systems slide in on
SCALING_SPOT = (-3.62, 0.95, 1.5)

down_b, side_b, up_b = base
SYS = {
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
        rnd = random.Random(sum(map(ord, key)))
        pos = (pos[0] + rnd.uniform(-0.004, 0.004), pos[1] + rnd.uniform(-0.004, 0.004), pos[2])
        systems[key] = (ob, pos, yaw + rnd.uniform(-0.5, 0.5), dx)

T = {}  # the timeline from here on (printed for the page's scroll keys)

# --- set aside: anything lying where the rest of the film happens is carried off, square, to its own side
# (never across the cover stack), behind the foundation's line; whatever lies on top moves first, and what
# lies by the stack before what lies further off (the stack turns over next).
pivot_xy = ((-1.31 + 0.55) / 2, 0.0)
def in_the_way(p):
    x, y = p[0], p[1]
    # (behind the foundation too: what leaves toward the lens must not cross it)
    return (abs(x) <= 6.0 and -2.0 <= y <= 3.6) or (-4.4 <= x <= 0 and -1.0 <= y <= 1.7) or near_row(p, 2.3) or (-9 <= x <= 8 and -10 <= y <= -2.0)
others = {o.name: final[o.name][0] for o in labeled}
def free_spot(cands, taken):
    for c in cands:
        if all(math.hypot(c[0] - p[0], c[1] - p[1]) > 1.25 for p in taken):
            return c
    return cands[-1]
spots_r = [(5.6 + 1.3 * k, 1.9 + 0.3 * (k % 2), 0.5) for k in range(9)]
spots_l = [(-5.6 - 1.3 * k, 1.9 + 0.3 * (k % 2), 0.5) for k in range(9)]
plank_r = iter([(9.2, 3.3, 0.5), (11.9, 3.7, 0.5), (14.6, 4.1, 0.5)])
plank_l = iter([(-9.2, 3.3, 0.5), (-11.9, 3.7, 0.5), (-14.6, 4.1, 0.5)])
aside = [o for o in labeled if in_the_way(final[o.name][0])]
aside.sort(key=lambda o: (-round(final[o.name][0][2], 1), math.hypot(final[o.name][0][0] - pivot_xy[0], final[o.name][0][1])))
T["aside"] = 148
nth = {1: 0, -1: 0}
near_done = 157
for ob in aside:
    (x, y, z), q = final[ob.name]
    side = 1 if x >= 0 else -1
    k = nth[side]
    nth[side] += 1
    if ob.name in PLANKS:
        tgt = next(plank_r if x >= 0 else plank_l)
    else:
        taken = [p for n, p in others.items() if n != ob.name]
        tgt = free_spot(spots_r if x >= 0 else spots_l, taken)
    yaw = random.uniform(-6, 6)
    s = T["aside"] + 2 * k
    set_down(ob, tgt, s, dur=7, lift=1.5, yaw=yaw, frm=final[ob.name])
    if math.hypot(x - pivot_xy[0], y) < 2.6:
        near_done = max(near_done, s + 7)
    others[ob.name] = tgt
    final[ob.name] = (tgt, q_yaw(yaw))
    print("set aside", ob.name, "->", tgt, "at", s, flush=True)

# --- the flip: SCALING and the cover's stack turn upside down as one piece (the title, upside down),
# hold, and are set right. A rigid turn about their middle, keyed on every frame, lifted just enough that
# their corners clear the table.
T["flip"] = near_done + 1
T["flip_hold"] = T["flip"] + 7
T["flip_back"] = T["flip_hold"] + 2
T["flip_end"] = T["flip_back"] + 7
group = base + [scaling]
pivot = Vector((pivot_xy[0], 0.0, 1.5))
def flip_deg(f):
    if f <= T["flip_hold"]:
        return 180 * ease((f - T["flip"]) / (T["flip_hold"] - T["flip"]))
    if f <= T["flip_back"]:
        return 180.0
    return 180 * (1 - ease((f - T["flip_back"]) / (T["flip_end"] - T["flip_back"])))
for ob in group:
    p0, q0 = Vector(final[ob.name][0]), final[ob.name][1]
    prev = None
    for f in range(T["flip"], T["flip_end"] + 1):
        th = math.radians(flip_deg(f))
        r = Quaternion((0, 1, 0), th)
        p = pivot + r @ (p0 - pivot) + Vector((0, 0, 0.78 * math.sin(th)))
        q = r @ q0
        if prev is not None and prev.dot(q) < 0:
            q = -q
        setkey(ob, f, tuple(p), q, "LINEAR")
        prev = q
    final[ob.name] = (tuple(p0), prev)

# --- SCALING steps aside, sliding on its foot, to where it stands for the rest of the film ---
T["scaling_aside"] = T["flip_end"] + 2
(sx, sy, sz), sq = final["scaling"]
setkey(scaling, T["scaling_aside"], (sx, sy, sz), sq, "SINE", "EASE_IN_OUT")
setkey(scaling, T["scaling_aside"] + 9, SCALING_SPOT, sq)
final["scaling"] = (SCALING_SPOT, sq)

# --- SIDE: the yellow slab slides in from the side along its own length; then the twelve systems, in mirror
# pairs, inner first, bottom course first, slide in from the sides
T["side_slab"] = T["scaling_aside"] + 11
SLIDE_DUR = 12
sp_ = Vector(slab_at["side"])
far = sp_ - ROW_AXIS * 13.0
side_slab = slabs["side"]
setkey(side_slab, T["side_slab"] - 1, (far.x, far.y, 80.0), q_yaw(ROW_YAW), "CONSTANT")
setkey(side_slab, T["side_slab"], (far.x, far.y, far.z), q_yaw(ROW_YAW), "SINE", "EASE_OUT")
setkey(side_slab, T["side_slab"] + SLIDE_DUR, tuple(sp_), q_yaw(ROW_YAW))
T["side_read"] = T["side_slab"] + SLIDE_DUR
T["systems"] = T["side_read"] + 8
PAIRS = [("risk", "efficiency"), ("profit", "quality"), ("systematize", "tech"), ("roles", "fulfillment"), ("leads", "conversion"), ("content", "retention")]
BOTTOM = {"profit", "risk", "efficiency", "quality"}
for n, pair in enumerate(PAIRS):
    s = T["systems"] + 8 * n
    for key in pair:
        ob, (tx, ty, tz), yaw, dx = systems[key]
        if key not in BOTTOM and abs(dx) == 2:
            lower_in(ob, (tx, ty, tz), s + 2, dur=7, height=1.6, yaw=yaw)
            continue
        out = (2.6 if key in BOTTOM else 1.0) * (1 if dx > 0 else -1)
        setkey(ob, 1, (tx + out, ty, tz + 80), q_yaw(yaw), "CONSTANT")
        setkey(ob, s, (tx + out, ty, tz + 1.4), q_yaw(yaw), "SINE", "EASE_OUT")
        setkey(ob, s + 3, (tx + out, ty, tz + 0.02), q_yaw(yaw), "SINE", "EASE_IN_OUT")
        setkey(ob, s + 10, (tx, ty, tz), q_yaw(yaw), "SINE", "EASE_OUT")
T["systems_done"] = T["systems"] + 8 * (len(PAIRS) - 1) + 10

# --- DOWN: the red slab is lowered from above into the middle of the row; then the dead weight (the three
# ALWAYS planks with it) leaves toward the lens, each out on its own side, and what stays is gathered
T["down_slab"] = T["systems_done"] + 9
LOWER_DUR = 11
dp = slab_at["down"]
down_slab = slabs["down"]
setkey(down_slab, T["down_slab"] - 1, (dp[0], dp[1], 80.0), q_yaw(ROW_YAW), "CONSTANT")
setkey(down_slab, T["down_slab"], (dp[0], dp[1], dp[2] + 9.5), q_yaw(ROW_YAW), "SINE", "EASE_OUT")
setkey(down_slab, T["down_slab"] + LOWER_DUR, dp, q_yaw(ROW_YAW))
T["down_read"] = T["down_slab"] + LOWER_DUR
T["junk"] = T["down_read"] + 7
JUNK = ["adding", "hiring", "launching", "agency", "apps", "burn", "meet", "hire15"]
junk = sorted((o for o in labeled if o.name in JUNK), key=lambda o: final[o.name][0][1])  # the nearest the lens first
for k, ob in enumerate(junk):
    s = T["junk"] + k
    (x, y, z), q = final[ob.name]
    d = Vector((0.4 if x >= 0 else -0.4, -1, 0)).normalized() * 15
    setkey(ob, s - 1, (x, y, z), q)
    setkey(ob, s + 1, (x, y, z + 0.6), q, "QUAD", "EASE_IN")
    setkey(ob, s + 8, (x + d.x, y + d.y, z + 0.6), q @ q_yaw(random.uniform(-30, 30)))
    key_hidden(ob, f_hide=s + 9)
    print("down", ob.name, "from", (round(x, 2), round(y, 2)), "at", s, flush=True)
KEEP = ["crm", "ops", "hire12", "sops", "ai", "sku"]
keep_l = sorted((n for n in KEEP if final[n][0][0] < 0), key=lambda n: -final[n][0][0])
keep_r = sorted((n for n in KEEP if final[n][0][0] >= 0), key=lambda n: final[n][0][0])
order = []
for side, names in ((-1, keep_l), (1, keep_r)):
    for k, name in enumerate(names):
        order.append((name, (side * (5.4 + 1.3 * k), -1.5, 0.5)))
T["keep"] = T["junk"] + 8
for k, (name, tgt) in enumerate(order):
    ob = next(o for o in labeled if o.name == name)
    yaw = random.uniform(-3, 3)
    set_down(ob, tgt, T["keep"] + k, dur=8, lift=1.5, yaw=yaw, frm=final[name])
    final[name] = (tgt, q_yaw(yaw))
    print("keep", name, "->", tgt, "at", T["keep"] + k, flush=True)
T["down_done"] = T["keep"] + len(order) - 1 + 8

# --- UP: the green slab rises out of the table at the right of the row; then the team goes back on, on
# the systems, and the structure keeps rising
T["up_slab"] = T["down_done"] + 8
RISE_DUR = 12
upp = slab_at["up"]
up_slab = slabs["up"]
setkey(up_slab, T["up_slab"] - 1, (upp[0], upp[1], -SH / 2 - 0.05), q_yaw(ROW_YAW), "CONSTANT")
setkey(up_slab, T["up_slab"], (upp[0], upp[1], -SH / 2 - 0.05), q_yaw(ROW_YAW), "SINE", "EASE_OUT")
setkey(up_slab, T["up_slab"] + RISE_DUR, upp, q_yaw(ROW_YAW))
T["up_read"] = T["up_slab"] + RISE_DUR
T["team"] = T["up_read"] + 8
TOWER = [["crm", "ops", "hire12"], ["sops", "ai", "sku"]]
for c, names in enumerate(TOWER):
    for j, name in enumerate(names):
        ob = next(o for o in labeled if o.name == name)
        tgt, yaw = world_at(up_b, j - 1, dz=1.0 + c)
        s = T["team"] + (c * 3 + j) * 5
        set_down(ob, tgt, s, dur=9, lift=0.5, yaw=yaw + random.uniform(-0.6, 0.6), frm=final[name])
T["grow"] = T["team"] + 5 * 6 + 3
plains = [raw_wood_material(f"woodn_{k}", None, seed=0.4 + k * 0.53) for k in range(6)]
for c in range(10):  # courses k5..k14
    for j in range(3):
        m = plains[(c * 3 + j) % 6]
        ob = block(f"grow_{c}_{j}", (0, 0, 80), 0, m, m)
        ob.rotation_mode = "QUATERNION"
        tgt, yaw = world_at(up_b, j - 1, dz=3.0 + c)
        lower_in(ob, tgt, T["grow"] + c * 3 + j, dur=3, height=2.2, yaw=yaw + random.uniform(-0.6, 0.6))
T["spire"] = T["grow"] + 32
for c in range(4):  # spire k15..k18
    m = plains[c % 6]
    ob = block(f"spire_{c}", (0, 0, 80), 0, m, m)
    ob.rotation_mode = "QUATERNION"
    tgt, yaw = world_at(up_b, 0, dz=13.0 + c)
    lower_in(ob, tgt, T["spire"] + c * 3, dur=3, height=2.0, yaw=yaw + random.uniform(-0.8, 0.8))
T["end"] = T["spire"] + 3 * 3 + 3 + 8
END = T["end"]
scene.frame_end = END
print("TIMELINE", json.dumps(T), flush=True)

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


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


HERO = ((8.8, -13.4, 3.1), (-1.25, 0, 1.3), 78)
W = ((14.4, -30.8, 3.5), (-2.8, 0, 9.5), 35)
G = ((13.0, -22.5, 5.0), (2.8, -0.4, 1.0), 35)
F = ((7.9, -15.6, 3.0), (-0.4, 0, 1.6), 56)  # SCALING and the stack, for the flip
P = ((11.0, -20.0, 10.0), (-1.2, 0.3, 0.9), 40)  # the foundation and, below it, the row
def on_slab(k, t_cam=0.5, t_aim=1.0):
    """the camera half way down P's line to a slab, looking at it: the slab about a third of the picture, its
    neighbours whole beside it"""
    s = slab_at[k]
    return (lerp3(P[0], s, t_cam), lerp3(P[1], (s[0], s[1], s[2] + 0.12), t_aim), 40)
W_END = ((14.4, -30.8, 9.0), (-2.2, 0, 7.4), 35)
SHOTS = [  # frame, (camera, aim, lens), focus, fstop
    (28, HERO, (0, 0, 1.5), 4.0),
    (30, HERO, (0, 0, 1.5), 4.0),  # the page's layers fade over these first frames: the picture holds still
    (38, ((9.2, -15.0, 4.0), (-0.9, 0, 3.6), 70), (0, 0, 3.6), 5.0),  # the planks: each one framed as it lands
    (45, ((9.5, -16.4, 4.8), (-1.0, 0, 4.6), 64), (0, 0, 4.6), 5.0),
    (52, ((10.0, -18.5, 4.2), (-1.3, 0, 3.2), 64), (0.1, 0, 3.2), 5.0),  # ALWAYS LAUNCHING / HIRING / ADDING
    (56, ((10.0, -18.5, 4.2), (-1.3, 0, 3.2), 64), (0.1, 0, 3.2), 5.0),
    (66, ((11.6, -23.5, 3.4), (-2.2, 0, 5.4), 48), (0.2, 0, 5.4), 4.8),
    (80, ((13.2, -28.0, 3.5), (-2.6, 0, 7.4), 40), (0.3, 0, 7.4), 5.2),
    (92, W, (0.4, 0, 8.5), 5.6),
    (118, W, (0.6, 0, 8.0), 5.6),
    (146, G, (2.5, -0.5, 1.2), 6.0),
    (T["aside"] + 4, G, (2.5, -0.5, 1.2), 6.0),
    (T["flip"], F, (-0.4, 0, 1.5), 5.0),
    (T["flip_end"], F, (-0.4, 0, 1.5), 5.0),
    (T["scaling_aside"] + 4, ((8.6, -17.0, 4.2), (-1.4, 0, 1.4), 50), (-1.6, 0, 1.4), 5.5),
    (T["side_slab"] + 3, on_slab("side", 0.32, 0.7), slab_at["side"], 6.0),
    (T["side_read"], on_slab("side"), slab_at["side"], 6.0),  # SIDEWAYS FOR STABILIZATION
    (T["side_read"] + 2, on_slab("side"), slab_at["side"], 6.0),
    (T["systems"] + 4, P, (0, 0, 1.4), 6.0),
    (T["systems_done"], P, (0, 0, 1.4), 6.0),
    (T["down_slab"] + 2, on_slab("down", 0.32, 0.7), slab_at["down"], 6.0),
    (T["down_read"], on_slab("down"), slab_at["down"], 6.0),  # DOWN FOR PRUNING
    (T["down_read"] + 2, on_slab("down"), slab_at["down"], 6.0),
    (T["junk"] + 3, P, (0, 0, 1.4), 6.0),
    (T["down_done"], P, (0, 0, 1.4), 6.0),
    (T["up_slab"] + 2, on_slab("up", 0.32, 0.7), slab_at["up"], 6.0),
    (T["up_read"], on_slab("up"), slab_at["up"], 6.0),  # UP FOR GROWTH
    (T["up_read"] + 2, on_slab("up"), slab_at["up"], 6.0),
    (T["team"] + 4, P, (0, 0, 1.6), 6.0),
    (T["team"] + 18, ((11.8, -22.2, 9.4), (-1.5, 0.2, 2.6), 39), (0, 0, 2.4), 6.0),
    (T["grow"] + 10, ((12.6, -25.0, 9.2), (-1.8, 0.1, 4.0), 37), (0, 0, 4.0), 6.0),
    (T["grow"] + 24, ((13.6, -28.4, 9.1), (-2.1, 0, 6.0), 36), (0, 0, 6.0), 6.0),
    (T["end"] - 8, W_END, (0.2, 0, 6.5), 6.5),
    (T["end"], W_END, (0.2, 0, 6.5), 6.5),
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
for ob in (cam, aim, focus):
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
for fc in cam_d.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"
        kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"

# --- the hero's lines and red plank leave the shot as the camera rises with the planks: once all of them
# are out of the picture (and they never come back into it), they are taken off the set
r = scene.render
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100

def in_picture(obs):
    for ob in obs:
        for c in ob.bound_box:
            v = world_to_camera_view(scene, cam, ob.matrix_world @ Vector(c))
            if v.z > 0 and -0.02 <= v.x <= 1.02 and -0.02 <= v.y <= 1.02:
                return True
    return False
gone = None
for f in range(29, 60):
    scene.frame_set(f)
    if not in_picture(lines_out):
        gone = f
        break
assert gone is not None, "the hero's lines never leave the picture"
for ob in lines_out:
    key_hidden(ob, f_hide=gone)
print("hero lines out of the picture from", gone, flush=True)

# ================= lights + render =================
area("key", (-9, -10, 16), (1, 0, 6), 10, 6500)
area("fill", (14, -8, 6), (1, 0, 5), 12, 1800, "#f2f4ff")
area("rim", (3, 9, 18), (1, 0, 8), 6, 1800)
area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")
area("top", (-4, -6, 26), (0, 0, 14), 8, 2600)

r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.03
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 6
r.use_persistent_data = True
r.use_motion_blur = False
r.motion_blur_shutter = 0.5
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -1.05
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
json.dump({"timeline": T, "slabs": slab_at, "end": END}, open(os.path.join(HERE, "out", "words_timeline.json"), "w"), indent=1)
if opt.get("blend"):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, opt["blend"]))
    print("saved", opt["blend"], flush=True)
if opt.get("frames"):
    for f in [int(v) for v in opt["frames"].split(",")]:
        scene.frame_set(f)
        r.filepath = f"{opt['out']}_{f:03d}.png"
        bpy.ops.render.render(write_still=True)
    print("STILLS DONE", flush=True)
