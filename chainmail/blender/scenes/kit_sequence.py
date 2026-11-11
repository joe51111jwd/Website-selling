"""sequence/####.png — the packing animation, scroll-scrubbed on the site (121 frames, 0..120, 4:3).

Timeline (24 frames per caption step):
   0–24  your product goes in first : empty open base (insert + cobalt lining) -> product lowers into its pocket
  24–48  then the goods            : hoodie lowers + soft squash, cap onto the hoodie, tumbler into its cradle
  48–72  a premium spirit          : the bottle lowers into its cradle; tissue wings fold in; tissue tufts in
  72–96  and a note                : the note card glides in, floats on an air cushion, drops flat
  96–120 lid on                    : lid descends (slow in, quick settle), seal presses onto the corner,
                                     tiny camera push-in
Look: opaque ink (#0B0B0F) seamless studio with a soft pool of light; the frame border is locked to
exactly #0B0B0F by the compositor so the canvas melts into the site's ink section.

Usage (from chainmail/):
  blender -b --factory-startup -P blender/scenes/kit_sequence.py -- [--frames 0-120] [--preview]
      finals  -> blender/out/sequence/####.png        (1280x960, 128 spp adaptive, OIDN, fixed seed)
      preview -> blender/previews/sequence/####.png   (40 % res, 32 spp)
  extra flags:
      --test            320x240, 8 spp, no motion blur -> blender/previews/sequence_test/
      --samples N       override samples       --res WxH   override resolution
      --force           re-render frames that already exist (default: skip them -> resumable)
      --check           no render: BVH interpenetration test at --frames (every 4th frame by default)
      --side            orthographic side/front check renders -> blender/previews/sequence_side/
      --out DIR         write frames somewhere else (e.g. timing tests)
"""
import sys, os, math, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
from mathutils import Vector, Euler, Matrix
import numpy as np
import kit
import common as _c
import sequence_util as su

# ------------------------------------------------------------------ args
FLAGS = argv_flags()
def _arg(name, default=None):
    if name in FLAGS:
        i = FLAGS.index(name)
        if i + 1 < len(FLAGS):
            return FLAGS[i + 1]
    return default

F_FIRST, F_LAST = 0, 120
fr = _arg("--frames")
if fr:
    a, _, b = fr.partition("-")
    FRAMES = list(range(int(a), int(b or a) + 1))
else:
    FRAMES = list(range(F_FIRST, F_LAST + 1))
if _arg("--list"):
    FRAMES = [int(x) for x in _arg("--list").split(",")]
TEST = "--test" in FLAGS
CHECK = "--check" in FLAGS
SIDE = "--side" in FLAGS
FORCE = "--force" in FLAGS
RES = tuple(int(v) for v in _arg("--res", "320x240" if TEST else "1280x960").split("x"))
SAMPLES = int(_arg("--samples", "8" if TEST else "72"))
if TEST:
    OUTDIR = os.path.join(PREVIEW_DIR, "sequence_test")
elif SIDE:
    OUTDIR = os.path.join(PREVIEW_DIR, "sequence_side")
elif PREVIEW:
    OUTDIR = os.path.join(PREVIEW_DIR, "sequence")
else:
    OUTDIR = os.path.join(OUT_DIR, "sequence")
if _arg("--out"):
    OUTDIR = os.path.abspath(_arg("--out"))

t_start = time.time()
# ------------------------------------------------------------------ render settings
reset()
sc = setup_render(RES[0], RES[1], samples=SAMPLES, transparent=False, motion_blur=not (TEST or SIDE),
                  preview=PREVIEW and not TEST)
c = sc.cycles
if TEST:
    sc.render.resolution_percentage = 100
c.adaptive_threshold = 0.05 if TEST else (0.02 if PREVIEW else 0.015)
c.adaptive_min_samples = 0
c.seed = 7                       # FIXED noise seed: no per-frame noise dance -> no OIDN flicker
c.use_animated_seed = False
c.max_bounces = 8
c.diffuse_bounces = 2
c.glossy_bounces = 3
c.transmission_bounces = 8       # bottle: outer + inner glass wall + liquid, lying = up to 8 interfaces
c.transparent_max_bounces = 8
c.volume_bounces = 0
c.sample_clamp_indirect = 6.0    # kills fireflies from the glass / foil without dulling the look
c.denoising_use_gpu = False
sc.render.use_persistent_data = True
sc.render.motion_blur_shutter = 0.3
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.render.image_settings.color_depth = "8"
sc.render.image_settings.compression = 15
sc.render.dither_intensity = 0.6  # breaks 8-bit banding in the dark floor gradient (±1 code value)
sc.render.fps = 24
sc.frame_start, sc.frame_end = F_FIRST, F_LAST
if TEST:
    c.use_denoising = True
    c.denoising_prefilter = "FAST"

# ------------------------------------------------------------------ studio: ink sweep + light
INK = "ink"
world_hdri("soft", strength=0.12, rotation_deg=40, visible=False, bg_color=INK)

def ink_floor():
    """Seamless ink sweep: floor curving up into a back wall far behind the box."""
    import bmesh
    bm = bmesh.new()
    R, y_c, half_w = 0.9, 2.2, 6.0
    prof = []
    for i in range(40):                       # floor from y=-4 to the cove
        prof.append((-4.0 + (y_c + 4.0) * i / 39, 0.0))
    for i in range(1, 25):                    # cove
        a = (math.pi / 2) * i / 24
        prof.append((y_c + R * math.sin(a), R - R * math.cos(a)))
    for i in range(1, 8):
        prof.append((y_c + R, R + 3.0 * i / 7))
    rows = []
    for x in (-half_w, half_w):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for j in range(len(prof) - 1):
        bm.faces.new((rows[0][j], rows[1][j], rows[1][j + 1], rows[0][j + 1]))
    me = bpy.data.meshes.new("InkSweep")
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("InkSweep", me)
    sc.collection.objects.link(o)
    smooth(o)
    m, nt, b = _c._new_mat("ink_sweep")
    b.inputs["Base Color"].default_value = rgb("#1C1C21")   # dark paper; the far floor falls to ink
    b.inputs["Roughness"].default_value = 0.72
    b.inputs["Specular IOR Level"].default_value = 0.25
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 600.0
    n.inputs["Detail"].default_value = 3.0
    _c._bump(nt, b, n.outputs["Fac"], 0.04, 0.0003)
    o.data.materials.append(m)
    return o

floor_o = ink_floor()
T = Vector((0.0, 0.0, 0.08))
# exposure reference: horizontal bone/insert faces get ~3 W/m2 in total (renders bone as bone)
L_KEY = area_light("Key", T + Vector((-1.55, -1.05, 1.75)), T, size=1.5, size_y=1.1, energy=30,
                   color=(1.0, 0.965, 0.92))
L_RIM = area_light("Rim", T + Vector((1.35, 1.55, 0.75)), T + Vector((0, 0, 0.05)), size=0.25, size_y=1.6,
                   energy=150, color=(0.80, 0.88, 1.0))
L_RIM2 = area_light("RimL", T + Vector((-1.45, 1.35, 0.55)), T + Vector((0, 0, 0.04)), size=0.22, size_y=1.2,
                    energy=60, color=(0.85, 0.9, 1.0))
L_TOP = area_light("TopCard", T + Vector((0.02, 0.02, 1.05)), T, size=0.62, size_y=0.48, energy=2.1,
                   color=(1.0, 0.985, 0.97), spread=100)
L_FILL = area_light("Fill", T + Vector((1.2, -1.9, 0.55)), T, size=1.6, energy=5, color=(1.0, 0.98, 0.96))
L_FILL.data.use_shadow = False
# soft pool of light on the floor around the box (lights ONLY the floor, see light linking below)
pool_d = bpy.data.lights.new("FloorPool", "SPOT")
pool_d.energy = POOL_W = 1150
pool_d.spot_size = math.radians(36)
pool_d.spot_blend = 1.0
pool_d.shadow_soft_size = 0.6
pool_d.color = (1.0, 0.975, 0.95)
POOL = bpy.data.objects.new("FloorPool", pool_d)
sc.collection.objects.link(POOL)
POOL.location = (-0.10, -0.06, 2.3)
look_at(POOL, (0.0, 0.03, 0.0))
for L in (L_KEY, L_RIM, L_RIM2, L_TOP, L_FILL):
    L.visible_camera = False

def link_set(name, objs, state):
    col = bpy.data.collections.new(name)
    for o in objs:
        col.objects.link(o)
    for co in col.collection_objects:
        co.light_linking.link_state = state
    return col
NOT_FLOOR = link_set("seq_not_floor", [floor_o], "EXCLUDE")
ONLY_FLOOR = link_set("seq_only_floor", [floor_o], "INCLUDE")
POOL.light_linking.receiver_collection = ONLY_FLOOR
# (the box's own contact shadow only; set up once the base exists, see below)
for L in (L_KEY, L_RIM, L_RIM2, L_TOP, L_FILL):
    L.light_linking.receiver_collection = NOT_FLOOR

# ------------------------------------------------------------------ the kit at its final packed pose
notes = []
K = su.build_kit(number=1, edition=48, log=notes)
LID, SEAL = su.make_lid(1, 48)
LID_REST = Vector((0.0, 0.0, kit.LID_SEAT_Z + 0.0003))   # resting on the rim (no coplanar faces)
SEAL_REST = LID_REST + Vector(su.SEAL_LOCAL)
SEAL_ROT = math.radians(-7.0)
for n in notes:
    print("[seq] fit:", n)
POOL.light_linking.blocker_collection = link_set("seq_pool_blockers", su.meshes_of(K["base"]), "INCLUDE")

# remember rest transforms
def rest_of(o):
    return (o.location.copy(), o.rotation_euler.copy(), o.scale.copy())
REST = {k: rest_of(K[k]) for k in ("hoodie", "cap", "product", "tumbler", "bottle", "card")}
for i, p in enumerate(K["puffs"]):
    REST[f"puff{i}"] = rest_of(p)

# ------------------------------------------------------------------ camera (drift + push-in)
CAM_T = Vector((0.0, 0.035, 0.085))
CAM_LENS = 50.0
CAM_D0 = 1.40
def cam_pose(f):
    u = f / F_LAST
    az = 21.0 - 4.0 * su.smoothstep(0.0, 1.0, u * 0.9 + 0.05)        # slow, calm orbit
    el = 50.0 + 1.5 * u
    push = 1.0 - 0.06 * su.smootherstep(98, 120, f)
    t = CAM_T + Vector((0, 0, 0.012 * su.smootherstep(98, 120, f)))
    return su.sph_loc(t, az, el, CAM_D0 * push), t
cam = camera(loc=tuple(cam_pose(0)[0]), target=tuple(CAM_T), lens=CAM_LENS)
cam.data.sensor_fit = "HORIZONTAL"
for f in range(F_FIRST, F_LAST + 1):
    loc, t = cam_pose(f)
    cam.location = loc
    look_at(cam, t)
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)
su.linear_keys(cam)

def cam_at(f):
    sc.frame_set(f)
    bpy.context.view_layer.update()
    return cam

# ------------------------------------------------------------------ tissue wings (built on the final pose)
RIM_Z = kit.BOX_H
WING_F0, WING_F1 = 50, 71
wings = su.make_wings(K, timing=((WING_F0, WING_F1 - 2), (WING_F0 + 3, WING_F1)), frame_after=F_LAST)
for w in wings:
    print(f"[seq] {w.name} final bbox z {w.final_lo.z:.4f}..{w.final_hi.z:.4f}")
sc.frame_set(0)

# ------------------------------------------------------------------ item choreography
def rot_add(r, d):
    return Euler((r.x + d[0], r.y + d[1], r.z + d[2]), "XYZ")

def bottom_rest(o):
    return su.world_bbox(o)[0].z

ANIM = {}     # name -> dict(f0, f1, ...) for checks/report

def lower_item(name, obj, f0, f1, tilt_deg=(0, 0, 0), drift=(0.0, 0.0), bounce=0.0012, p=3.0,
               squash=None, hold_after=True):
    """Lower obj vertically from out of frame (at f0) to its rest (touch at f1).
    tilt/drift decay to zero before the item's bottom passes below the box rim."""
    loc0, rot0, scl0 = REST[name]
    zb = bottom_rest(obj)
    cam_at(f0)
    dz0 = su.start_height(cam, obj, margin=0.03)
    # frame by which the item must be aligned: bottom 12 mm above the rim
    f_al = f1
    for f in np.linspace(f0, f1, 400):
        dz = su.drop_z(f, f0, f1, dz0, 0.0, p=p, bounce=0)
        if zb + dz < RIM_Z + 0.012:
            f_al = f
            break
    tilt = [math.radians(v) for v in tilt_deg]
    def fn(f):
        dz = su.drop_z(f, f0, f1, dz0, 0.0, p=p, bounce=bounce)
        k = 1.0 - su.smootherstep(f0, f_al, f)
        loc = loc0 + Vector((drift[0] * k, drift[1] * k, dz))
        rot = rot_add(rot0, [t * k for t in tilt])
        scl = None
        if squash is not None:
            sz = squash(f)
            bulge = 1.0 + 0.22 * (1.0 - sz)
            scl = (scl0.x * bulge, scl0.y * bulge, scl0.z * sz)
        return loc, rot, scl
    frames = list(range(F_FIRST, F_LAST + 1))
    su.key_transform(obj, frames, fn)
    su.keep_vis(obj, max(F_FIRST, f0 - 1) if f0 > F_FIRST else F_FIRST)
    fade(obj, f0, f1)
    ANIM[name] = dict(f0=f0, f1=f1, f_align=round(float(f_al), 1), start_dz=round(dz0, 3))

def fade(obj, f0, f1):
    """shadows fade in while the item comes down (none while it hangs above the frame)"""
    su.shadow_fade(obj, [(max(F_FIRST, f0 - 1), 1.0), (f0 + 0.2 * (f1 - f0), 1.0), (f0 + 0.55 * (f1 - f0), 0.0)])

def hoodie_squash(f, f1=36):
    # descends a touch fuller, compresses on touchdown, recovers to the packed height
    if f < f1 - 1:
        return 1.07
    if f < f1 + 2:
        return su.lerp(1.07, 0.955, su.smoothstep(f1 - 1, f1 + 2, f))
    return 1.0 - 0.045 * math.exp(-(f - f1 - 2) / 2.6) * math.cos((f - f1 - 2) * 0.55)

lower_item("product", K["product"], 2, 16, tilt_deg=(3.0, -4.0, 9.0), drift=(0.0, 0.03), bounce=0.0014)
lower_item("hoodie", K["hoodie"], 24, 36, tilt_deg=(-2.0, 3.0, -6.0), drift=(0.0, 0.035), bounce=0.0,
           squash=hoodie_squash)
lower_item("cap", K["cap"], 31, 45, tilt_deg=(6.0, -5.0, 12.0), drift=(0.0, 0.03), bounce=0.0010)
lower_item("tumbler", K["tumbler"], 35, 48, tilt_deg=(0.0, 0.0, 8.0), drift=(0.0, 0.03), bounce=0.0010)
lower_item("bottle", K["bottle"], 49, 63, tilt_deg=(0.0, 0.0, -7.0), drift=(0.0, 0.03), bounce=0.0010)
for i, (f0, f1) in enumerate(((56, 66), (58, 68), (63, 71))):
    if i < len(K["puffs"]):
        lower_item(f"puff{i}", K["puffs"][i], f0, f1, tilt_deg=(10, -8, 25), drift=(0.0, 0.02), bounce=0.0,
                   p=2.4)

# --- note card: glides in from the upper right, rides an air cushion, drops flat
CARD = K["card"]
c_loc, c_rot, c_scl = REST["card"]
cam_at(73)
c_dz0 = su.start_height(cam, CARD, margin=0.03)
def card_fn(f):
    f0, f_h, f1 = 73, 86, 92
    if f <= f_h:
        u = su.ease_out((f - f0) / (f_h - f0), 3.0)
        dz = su.lerp(c_dz0, 0.009, u)
        k = 1.0 - u
        lat = Vector((0.10 * k * k, 0.05 * k * k, 0.0))
        rot = rot_add(c_rot, (math.radians(-6) * k, math.radians(9) * k, math.radians(28) * k * k))
    else:
        # air cushion: floats, sinks slowly, then the air escapes and it settles
        v = (f - f_h) / (f1 - f_h)
        dz = 0.009 * (1 - su.ease_in(v, 2.6)) + 0.0007 * math.sin(math.pi * v) * (1 - v)
        dz = max(dz, 0.0)
        lat = Vector((0.0012 * math.sin(v * 2.4) * (1 - v), -0.0008 * math.sin(v * 3.1) * (1 - v), 0))
        rot = rot_add(c_rot, (math.radians(0.6) * math.sin(v * 3.3) * (1 - v), 0.0, math.radians(0.8) * (1 - v)))
        if f >= f1:
            dz, lat, rot = 0.0, Vector(), c_rot.copy()
    return c_loc + lat + Vector((0, 0, dz)), rot, None
su.key_transform(CARD, list(range(F_FIRST, F_LAST + 1)), card_fn)
su.keep_vis(CARD, 72)
fade(CARD, 73, 86)
ANIM["card"] = dict(f0=73, f_hover=86, f1=92, start_dz=round(c_dz0, 3))

# --- lid: descends (slow in), aligns over the base, then a quick slip-down + settle
LID_F0, LID_FH, LID_F1 = 96, 105, 108
lid_hover = (RIM_Z + 0.016) - kit.LID_SEAT_Z     # lid rim 16 mm above the base rim
LID.location = LID_REST
bpy.context.view_layer.update()
cam_at(LID_F0)
lid_dz0 = su.start_height(cam, LID, margin=0.02)
def lid_dz(f):
    if f <= LID_FH:
        return su.lerp(lid_dz0, lid_hover, su.ease_out((f - LID_F0) / (LID_FH - LID_F0), 2.6))
    if f <= LID_F1:
        return su.lerp(lid_hover, 0.0, su.ease_in((f - LID_FH) / (LID_F1 - LID_FH), 1.8))
    u = (f - LID_F1) / 4.0
    return 0.0 if u >= 1 else 0.0016 * math.sin(math.pi * u) * (1 - u)
def lid_fn(f):
    dz = lid_dz(f)
    k = 1.0 - su.smootherstep(LID_F0, LID_FH - 1, f)
    return (LID_REST + Vector((-0.02 * k, 0.05 * k, dz)), Euler((math.radians(-4) * k, math.radians(2.5) * k,
            math.radians(-6) * k)), None)
su.key_transform(LID, list(range(F_FIRST, F_LAST + 1)), lid_fn)
su.keep_vis(LID, LID_F0 - 1)
fade(LID, LID_F0, LID_FH)
ANIM["lid"] = dict(f0=LID_F0, f_hover=LID_FH, f1=LID_F1, start_dz=round(lid_dz0, 3))

# --- the cap's soft crown gives under the closing lid (hidden inside the walls by then)
CEIL = kit.CLOSED_H - kit.BOARD                 # inner ceiling height of the seated lid
cap_loc, cap_rot, cap_scl = REST["cap"]
cap_top0 = su.world_bbox(K["cap"])[1].z
cap_bot0 = cap_loc.z
fc = K["cap"].animation_data.action
def cap_scale_fn(f):
    ceil = CEIL + lid_dz(f) - 0.0012
    if f < LID_FH or cap_top0 <= ceil:
        return 1.0
    return max(0.6, (ceil - cap_bot0) / (cap_top0 - cap_bot0))
sq_info = []
for f in range(LID_FH, F_LAST + 1):
    s = cap_scale_fn(f)
    K["cap"].scale = (cap_scl.x, cap_scl.y, cap_scl.z * s)
    K["cap"].keyframe_insert("scale", frame=f)
    if s < 1.0:
        sq_info.append((f, round(s, 3)))
K["cap"].scale = cap_scl
K["cap"].keyframe_insert("scale", frame=LID_FH - 1)
su.linear_keys(K["cap"])
ANIM["cap_crown_squash"] = sq_info[:2] + sq_info[-1:] if sq_info else "none"

# --- seal: comes in from above, tilted, touches with one edge and is pressed flat
SEAL_F0, SEAL_F1 = 108, 115
cam_at(SEAL_F0)
SEAL.location = SEAL_REST
SEAL.rotation_euler = (0, 0, SEAL_ROT)
bpy.context.view_layer.update()
seal_dz0 = su.start_height(cam, SEAL, margin=0.02)
def seal_fn(f):
    u = (f - SEAL_F0) / (SEAL_F1 - SEAL_F0)
    a = math.radians(24.0) * (1 - su.smoothstep(0.45, 1.0, u))          # tilt flattens as it is pressed
    h = su.lerp(seal_dz0, 0.0, su.ease_out(min(u / 0.8, 1.0), 2.4)) if u < 1 else 0.0
    h = max(h, kit.SEAL_D / 2 * math.sin(a) + (0.0002 if a > 1e-4 else 0.0))
    k = 1 - su.smoothstep(0.0, 0.8, u)
    loc = SEAL_REST + Vector((0.03 * k, 0.02 * k, h))
    return loc, Euler((a, -0.35 * a, SEAL_ROT + math.radians(18) * k)), None
su.key_transform(SEAL, list(range(F_FIRST, F_LAST + 1)), seal_fn)
su.keep_vis(SEAL, SEAL_F0 - 1)
fade(SEAL, SEAL_F0, SEAL_F1)
ANIM["seal"] = dict(f0=SEAL_F0, f1=SEAL_F1, start_dz=round(seal_dz0, 3))

# --- foil glint for the chrome wordmark once the lid is on (foil-only light, camera invisible)
loc_end, _ = cam_pose(F_LAST)
kit.foil_glint(tuple(loc_end), (0.0, 0.0, kit.CLOSED_H), dist=1.1, size=(0.7, 0.35), strength=3.0)
try:
    kit.link_kit_lights(no_catcher=(), foil_only=("FoilCard",), flag_seals=(), shadowless=())
except TypeError:
    kit.link_kit_lights()

# ------------------------------------------------------------------ render-cost trims (look-neutral)
# a 3-5 % subsurface weight on paper/pulp is invisible at this size but costs random-walk SSS on
# a third of the frame: drop it (scene-level override, the libs are untouched)
n_sss = 0
for m in bpy.data.materials:
    if m.use_nodes:
        for nd in m.node_tree.nodes:
            if nd.type == "BSDF_PRINCIPLED" and 0.0 < nd.inputs["Subsurface Weight"].default_value <= 0.08 \
                    and not nd.inputs["Subsurface Weight"].links:
                nd.inputs["Subsurface Weight"].default_value = 0.0
                n_sss += 1
print(f"[seq] SSS trimmed on {n_sss} principled nodes")
for w in wings:
    w.obj.cycles.use_motion_blur = False   # per-frame shape keys: crisp paper reads better than smear

# ------------------------------------------------------------------ exact ink border
sc.frame_set(0)
INK_LIN = su.edge_lock(INK, inner=0.50, outer=0.985, p=2.3)
print(f"[seq] build {time.time() - t_start:.1f}s; anim: {ANIM}")

# ------------------------------------------------------------------ modes
def all_movers():
    m = {k: K[k] for k in ("product", "hoodie", "cap", "tumbler", "bottle", "card")}
    for i, p in enumerate(K["puffs"]):
        m[f"puff{i}"] = p
    m["lid"] = LID
    m["seal"] = SEAL
    for w in wings:
        m[w.name] = w.obj
    return m

if CHECK:
    frames = FRAMES if (fr or _arg("--list")) else list(range(0, 121, 4))
    movers = all_movers()
    static = {"base": K["base"], "insert": K["insert"]}
    rigid = ("product", "hoodie", "cap", "tumbler", "bottle", "card", "lid", "seal")
    report = []
    for f in frames:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        vis = {k: o for k, o in movers.items() if not o.hide_render}
        names = list(vis)
        bad = []
        bvh, tri = {}, {}
        for k in names + list(static):
            bvh[k], tri[k] = su.group_bvh([vis.get(k) or static[k]], with_tris=True)
        for i, a in enumerate(names):
            for b in names[i + 1:] + list(static):
                if a.startswith(("puff", "Wing")) and b.startswith(("puff", "Wing")):
                    continue
                if (a.startswith("puff") and b == "insert") or (b.startswith("puff") and a == "insert"):
                    continue
                if bvh[a] is None or bvh[b] is None:
                    continue
                ov = bvh[a].overlap(bvh[b])
                n = len(ov)
                if n:
                    pa = tri[a][[i_ for i_, _ in ov]]
                    lo_, hi_ = pa.min(axis=0), pa.max(axis=0)
                    bad.append(f"{a}x{b}:{n}[{lo_[0]:.3f},{lo_[1]:.3f},{lo_[2]:.3f}..{hi_[0]:.3f},{hi_[1]:.3f},{hi_[2]:.3f}]")
        print(f"[check] f{f:03d} " + (" ".join(bad) if bad else "clean"))
        report.append((f, bad))
    print("[check] done", sum(1 for _, b in report if not b), "/", len(report), "frames clean")
    sys.exit(0)

if SIDE:
    # orthographic front view at box height, base walls hidden so the contents are visible
    for o in su.descendants(K["base"]):
        o.hide_render = True
    sc.use_nodes = False
    for nm, loc, rot in (("front", (0.0, -2.0, 0.12), (math.radians(90), 0, 0)),
                         ("left", (-2.0, 0.0, 0.12), (math.radians(90), 0, math.radians(-90)))):
        cd = bpy.data.cameras.new("Side_" + nm)
        cd.type = "ORTHO"
        cd.ortho_scale = 0.62
        co = bpy.data.objects.new("Side_" + nm, cd)
        sc.collection.objects.link(co)
        co.location = loc
        co.rotation_euler = rot
        sc.camera = co
        sc.render.resolution_x, sc.render.resolution_y = 1000, 640
        sc.render.resolution_percentage = 100
        c.samples = 16
        for f in FRAMES:
            sc.frame_set(f)
            out = os.path.join(OUTDIR, f"{nm}_{f:04d}.png")
            os.makedirs(OUTDIR, exist_ok=True)
            sc.render.filepath = out
            bpy.ops.render.render(write_still=True)
    sys.exit(0)

os.makedirs(OUTDIR, exist_ok=True)
for f in FRAMES:
    out = os.path.join(OUTDIR, f"{f:04d}.png")
    if os.path.exists(out) and not FORCE:
        print(f"[seq] skip {out}")
        continue
    t0 = time.time(); c0 = sum(os.times()[:2])
    sc.frame_set(f)
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    cpu = sum(os.times()[:2]) - c0
    print(f"[seq] wrote {out} in {time.time() - t0:.1f}s (cpu {cpu:.0f}s = ~{cpu / 4:.0f}s on 4 free cores)")
print(f"[seq] total {time.time() - t_start:.1f}s")
