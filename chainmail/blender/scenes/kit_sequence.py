"""sequence/####.png — the packing animation, scroll-scrubbed on the site (121 frames, 0..120, 4:3).

Timeline (24 frames per caption step). Every mover is a screen-speed-limited glide: it starts parked
just outside the frame, its leading edge crosses the border slowly (<= 4 % of frame height per frame),
peaks at <= 6 %/frame (hard limit, asserted by --check) and lands with a soft ease + a few mm settle:
   0–24  your product goes in first : empty open base (insert + cobalt lining) -> product f1-20, settle, hold
  24–48  then the goods            : hoodie f14-35 (+ soft squash, settled by f39), cap f19-41 onto it,
                                     tumbler f22-44; the tissue flap folds in over hoodie + cap f31-50
  48–72  a premium spirit          : bottle f48-66, hold
  72–96  and a note                : the card glides in (f~64-86), floats on an air cushion, drops flat f90
  96–120 lid on                    : the lid's edge creeps in at the top from ~f81 (it is big: a calm entry
                                     needs ~25 frames), hovers f106, slips down + settles f109-113; the seal
                                     glides in from the right edge (~f100-110), pressed flat f110-114;
                                     camera push-in f96-114; still hold f115-120
Libs: imported from the frozen snapshot blender/lib_frozen_seq/ (seq_freeze), so every chunk renders the
same geometry as the hero (tools/render_sequence.sh --freeze refreshes it deliberately).
Frame size: 1280x960 (4:3). The BRIEF's manifest row says 1600x1200, but tools/optimize.py publishes the
sequence at 1280 and 720 px wide, so 1280 is the largest size the site ever loads (1600 would cost ~1.6x
render time for pixels that are thrown away).
Look: opaque ink (#0B0B0F) seamless studio with a soft pool of light; the frame border is locked to
exactly #0B0B0F by the compositor so the canvas melts into the site's ink section.

Usage (from chainmail/):
  blender -b --factory-startup -P blender/scenes/kit_sequence.py -- [--frames 0-120] [--preview]
      finals  -> blender/out/sequence/####.png        (1280x960, 36 spp adaptive 0.013, OIDN, fixed seed)
      preview -> blender/previews/sequence/####.png   (40 % res, 32 spp)
  extra flags:
      --test            320x240, 8 spp, no motion blur -> blender/previews/sequence_test/
      --samples N       override samples (default 36; measured on the frozen libs, CPU/4: open-box frames
                        ~90 s (f30/f60), lid closing ~70 s (f100/101), closed hold ~63 s (f116/117);
                        hold frames are bit-identical (fixed seed) -> no OIDN flicker; ~2.9 h total)
      --mb              motion blur on (shutter 0.3; +13 % render time)
      --res WxH         override resolution (tests only)
      --profile         CPU cost of motion blur / bounces / samples on the first --frames frame
      --force           re-render frames that already exist (default: skip complete PNGs -> resumable;
                        frames are written to ####.tmp.png and renamed, truncated PNGs are re-rendered)
      --check           no render: BVH interpenetration test at --frames (every frame by default; pairs
                        where both items are fully outside the frame are skipped) + per-frame screen
                        motion of every mover (% of frame height, 2D); exits 1 if anything fails
      --side            orthographic side/front check renders -> blender/previews/sequence_side/
      --out DIR         write frames somewhere else (e.g. timing tests)
"""
import sys, os, math, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
import seq_freeze                                     # ONE lib snapshot for the hero + every chunk
LIBS = seq_freeze.activate(allow_live="--live-libs" in sys.argv)
from common import *
from mathutils import Vector, Euler, Matrix
import numpy as np
import kit
import common as _c
import sequence_util as su
if LIBS != "LIVE":
    seq_freeze.check_loaded()
print(f"[seq] libs {LIBS}")

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
SAMPLES = int(_arg("--samples", "8" if TEST else "36"))
# motion blur is OFF by default: a scroll-scrubbed canvas is often paused mid-move, where a blurred
# frame just reads soft; it also costs ~13 % per frame. --mb turns it on (shutter 0.3).
MB = "--mb" in FLAGS
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
sc = setup_render(RES[0], RES[1], samples=SAMPLES, transparent=False, motion_blur=MB and not (TEST or SIDE),
                  preview=PREVIEW and not TEST)
c = sc.cycles
if TEST:
    sc.render.resolution_percentage = 100
c.adaptive_threshold = 0.05 if TEST else (0.02 if PREVIEW else 0.013)
c.adaptive_min_samples = 0
c.tile_size = 4096               # one tile: tiled renders reach the compositor un-denoised (see hero)
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
# low, broad "floor bounce" kicker from the front-left: lights ONLY the outer wrap of base + lid (light
# linking, set up once they exist) so the ink walls separate from the ink floor, esp. once the box is shut
L_KICK = area_light("WallKick", T + Vector((-0.55, -1.05, -0.02)), T + Vector((0.0, 0.0, -0.03)), size=1.4,
                    size_y=0.18, energy=16.0, color=(1.0, 0.975, 0.95))
for L in (L_KEY, L_RIM, L_RIM2, L_TOP, L_FILL, L_KICK):
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
K = su.build_kit(number=1, edition=48, puffs=False, log=notes)      # == the hero's kit (same defaults)
su.crumple_lining(K["lining"])
LID, SEAL = su.make_lid(1, 48)
LID_REST = Vector((0.0, 0.0, kit.LID_SEAT_Z + 0.0003))   # resting on the rim (no coplanar faces)
SEAL_REST = LID_REST + Vector(su.SEAL_LOCAL)
SEAL_ROT = math.radians(-7.0)
for n in notes:
    print("[seq] fit:", n)
POOL.light_linking.blocker_collection = link_set("seq_pool_blockers", su.meshes_of(K["base"]), "INCLUDE")
_shells = [o for o in su.meshes_of(K["base"]) + su.meshes_of(LID) if o.name.startswith(("KitBase_shell", "KitLid_shell"))]
L_KICK.light_linking.receiver_collection = link_set("seq_kick_receivers", _shells, "INCLUDE")
L_KICK.light_linking.blocker_collection = link_set("seq_kick_blockers", _shells, "INCLUDE")
# the matte black fleece needs a grazing kicker to read as a hoodie (hood fold, knit, grommets)
RAKE = su.hoodie_pop(K, energy=10.0)
# the floor pool swells a little once the lid is on: a brighter halo behind the closed silhouette
for f, e in ((100, POOL_W), (114, POOL_W * 1.35)):
    pool_d.energy = e
    pool_d.keyframe_insert("energy", frame=f)
pool_d.energy = POOL_W

# remember rest transforms
def rest_of(o):
    return (o.location.copy(), o.rotation_euler.copy(), o.scale.copy())
REST = {k: rest_of(K[k]) for k in ("hoodie", "cap", "product", "tumbler", "bottle", "card")}
REST["lid"] = (LID_REST.copy(), Euler((0, 0, 0)), LID.scale.copy())
REST["seal"] = (SEAL_REST.copy(), Euler((0, 0, SEAL_ROT)), SEAL.scale.copy())

# ------------------------------------------------------------------ camera (drift + push-in, still from f114)
CAM_T = Vector((0.0, 0.035, 0.085))
CAM_LENS = 50.0
CAM_D0 = 1.40
F_STILL = 114                                    # camera + every item at rest from here: f115-120 hold
def cam_pose(f):
    f = min(f, F_STILL)
    u = f / F_STILL
    az = 21.0 - 4.0 * su.smoothstep(0.0, 1.0, u * 0.9 + 0.05)        # slow, calm orbit
    el = 50.0 + 1.5 * su.smoothstep(0.0, 1.0, u)
    push = 1.0 - 0.06 * su.smootherstep(96, F_STILL, f)
    t = CAM_T + Vector((0, 0, 0.012 * su.smootherstep(96, F_STILL, f)))
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
ASPECT = RES[0] / RES[1]

def cam_at(f):
    sc.frame_set(f)
    bpy.context.view_layer.update()
    return cam

# analytic projection at any frame (no frame_set: fast enough to tune every glide numerically)
_CAMQ = {}
def proj(f, P):
    """World points (N,3) -> (N,2) normalized frame coords (x right, y up, 0..1) at frame f."""
    if f not in _CAMQ:
        loc, t = cam_pose(f)
        R = (Vector(t) - loc).to_track_quat("-Z", "Y").to_matrix()
        _CAMQ[f] = (np.array(loc), np.array(R))
    loc, R = _CAMQ[f]
    C = (np.asarray(P) - loc) @ R                  # camera space (x right, y up, -z forward)
    k = (CAM_LENS / 36.0) / np.maximum(-C[:, 2], 1e-6)
    return np.stack([C[:, 0] * k + 0.5, C[:, 1] * k * ASPECT + 0.5], axis=1)

# ------------------------------------------------------------------ tissue flap (built on the final pose)
RIM_Z = kit.BOX_H
WING_T = ((31, 50),)                             # the goods step: folds in over hoodie + cap (glide ease)
# (sequence-only: a smaller tip lead spreads the fold of every column over more of the time -> the
#  tissue tip's screen speed stays under the 6 %/frame limit; the final pose == the hero's)
WING_OPTS_SEQ = {k: dict(v, lead=0.12) for k, v in su.WING_OPTS.items()}
wings = su.make_wings(K, timing=WING_T, frame_after=F_LAST, opts=WING_OPTS_SEQ, only=su.WING_ONLY,
                      ease=lambda u: su.glide(u, a=0.32, d=0.45, v_end=0.03))
for w in wings:
    print(f"[seq] {w.name} f{w.f0}-{w.f1} final bbox z {w.final_lo.z:.4f}..{w.final_hi.z:.4f}")
sc.frame_set(0)

# ------------------------------------------------------------------ item choreography
V_MAX = 0.054     # design target: peak screen speed, fraction of frame height per frame (hard limit 0.06)
V_ENTRY = 0.037   # design target: speed as the item crosses into the frame (hard limit 0.04)

def rot_add(r, d):
    return Euler((r.x + d[0], r.y + d[1], r.z + d[2]), "XYZ")

def clamp_u(u):
    return 0.0 if u < 0 else 1.0 if u > 1 else u

def cam_axes(f):
    loc, t = cam_pose(f)
    R = (Vector(t) - loc).to_track_quat("-Z", "Y").to_matrix()
    return np.array(R.col[0]), np.array(R.col[1])          # world right, world up of the image

def local_pts(obj, rest):
    """Mesh points (+ the 8 corners of their bbox) of obj's hierarchy at its REST pose, in the
    root's local frame -> any frame's world points = M(f) @ these."""
    loc, rot, scl = rest
    obj.location, obj.rotation_euler, obj.scale = loc, rot, scl
    bpy.context.view_layer.update()
    P = su.world_points(obj, max_pts=500, seed=3)
    lo, hi = P.min(axis=0), P.max(axis=0)
    C = np.array([(x, y, z) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
    P = np.concatenate([P, C])
    Mi = np.array(Matrix.LocRotScale(loc, rot, scl).inverted())
    return P @ Mi[:3, :3].T + Mi[:3, 3]

def world_of(Pl, loc, rot, scl):
    scl = scl if scl is not None else (1, 1, 1)
    M = np.array(Matrix.LocRotScale(Vector(loc), rot if isinstance(rot, Euler) else Euler(rot), Vector(scl)))
    return Pl @ M[:3, :3].T + M[:3, 3]

def screen_motion(Pl, fn, frames):
    """Per frame: (max 2D displacement in frame heights since the previous frame, visible?)."""
    out = {}
    prev = None
    for f in frames:
        S = proj(f, world_of(Pl, *fn(f)))
        vis = bool(np.any((S[:, 0] > 0) & (S[:, 0] < 1) & (S[:, 1] > 0) & (S[:, 1] < 1)))
        if prev is not None:
            d = S - prev[0]
            out[f] = (float(np.max(np.hypot(d[:, 0] * ASPECT, d[:, 1]))), vis or prev[1])
        prev = (S, vis)
    return out

def motion_stats(m):
    vis = [(f, v) for f, (v, ok) in m.items() if ok]
    if not vis:
        return 0.0, 0.0, None
    return max(v for _, v in vis), vis[0][1], vis[0][0]

TUNED, ANIM = {}, {}

def tune(name, obj, make_fn, f0_choices):
    """make_fn(f0) -> transform fn(f). Picks the LATEST f0 whose glide stays under V_MAX / V_ENTRY
    (measured on the item's mesh points through the animated camera); keys it."""
    Pl = local_pts(obj, REST[name])
    frames = list(range(F_FIRST, F_LAST + 1))
    best = None
    for f0 in f0_choices:
        fn = make_fn(f0, Pl)
        peak, entry, f_in = motion_stats(screen_motion(Pl, fn, frames))
        best = (f0, fn, peak, entry, f_in)
        if peak <= V_MAX and entry <= V_ENTRY:
            break
    f0, fn, peak, entry, f_in = best
    make_fn(f0, Pl)                                # leave the chosen variant's side tables in place
    su.key_transform(obj, frames, fn)
    TUNED[name] = dict(f0=f0, peak=round(100 * peak, 1), entry=round(100 * entry, 1), first_visible=f_in)
    return f0, fn

def glide_path(name, Pl, f0, f1, base_fn, rot_fn, q_v, far_dir, prof, scl_fn=None, after_fn=None,
               out_margin=0.004, q_max=2.5, n=500):
    """An entrance in the IMAGE PLANE: from the pose base_fn(f) (q = 0) the item first moves
    straight up q_v metres (clear of the box walls / into its pocket), then bends smoothly onto
    far_dir (a direction parallel to the image: no rush toward the lens, no perspective growth), out
    to q_start where it is just fully outside the frame at f0. The screen distance to the pose
    follows prof(u) (a glide that already moves at v0 when it crosses the border). rot_fn(f, k):
    k = 1 far out .. 0 once in the vertical part (tilts straighten before the rim)."""
    far = np.asarray(far_dir, dtype=float); far /= np.linalg.norm(far)
    qs = np.linspace(0.0, q_max, n)
    dq = qs[1] - qs[0]
    up = np.array([0.0, 0.0, 1.0])
    off = np.zeros((n, 3))
    for i in range(1, n):
        w = su.smoothstep(q_v, q_v + 0.12, qs[i])
        d = (1 - w) * up + w * far
        off[i] = off[i - 1] + d / np.linalg.norm(d) * dq
    kq = np.array([su.smoothstep(q_v - 0.01, q_v + 0.16, q) for q in qs])
    ctr = Pl.mean(axis=0)
    def pose(f, q):
        i = min(int(q / dq), n - 2); t_ = q / dq - i
        o = off[i] * (1 - t_) + off[i + 1] * t_
        k = kq[i] * (1 - t_) + kq[i + 1] * t_
        return Vector(base_fn(f)) + Vector(o), rot_fn(f, k), (scl_fn(f) if scl_fn else None)
    # start: just fully outside the frame at f0 AND at every earlier frame it waits there (the
    # camera drifts: a parking spot just outside the f0 frame can peek into the frame-0 frame)
    q_start = 0.0
    for fc in sorted({F_FIRST, f0 // 3, (2 * f0) // 3, f0}):
        for q in np.arange(q_start, q_max, 0.005):
            S = proj(fc, world_of(Pl, *pose(fc, q)))
            if S[:, 0].min() > 1 + out_margin or S[:, 1].min() > 1 + out_margin or S[:, 0].max() < -out_margin:
                q_start = q
                break
    def D(f, q_arr):
        loc0, rot0, _ = pose(f, 0.0)
        c0 = proj(f, np.array([world_of(ctr[None, :], loc0, rot0, None)[0]]))[0]
        C = np.array([np.array(base_fn(f)) + off[min(int(q / dq), n - 1)] for q in q_arr])
        # (bbox-centre offset is translation-invariant: project the moved centre)
        S = proj(f, C + (world_of(ctr[None, :], loc0, rot0, None)[0] - np.array(base_fn(f))))
        return np.hypot((S[:, 0] - c0[0]) * ASPECT, S[:, 1] - c0[1])
    q_grid = qs[qs <= q_start + 1e-9]
    D0 = D(f0, [q_start])[0]
    cache = {}
    def q_of(f):
        if f not in cache:
            u = clamp_u((f - f0) / (f1 - f0))
            target = D0 * (1.0 - prof(u))
            Dq = np.maximum.accumulate(D(f, q_grid))
            cache[f] = float(np.interp(target, Dq + np.arange(len(Dq)) * 1e-9, q_grid))
        return cache[f]
    def fn(f):
        if f > f1 and after_fn is not None:
            return after_fn(f)
        q = q_start if f <= f0 else (q_of(f) if f < f1 else 0.0)
        return pose(f, q)
    ANIM[name] = dict(f1=f1, q_start=round(q_start, 3))
    return fn

def appear(obj, f_enter):
    """Items parked fully outside the frame stay present from frame 0 (an object popping into
    existence just above the frame still changes the bounce light in the box); otherwise shown one
    frame before it enters."""
    out = True
    for f in range(F_FIRST, f_enter + 1):
        sc.frame_set(f)
        lo_, hi_ = su.world_bbox(obj)
        P = su.project(cam, su.bbox_corners(lo_, hi_))
        if any(0.0 < p.x < 1.0 and 0.0 < p.y < 1.0 for p in P) and f < f_enter:
            out = False
            break
    sc.frame_set(F_FIRST)
    if not out:
        su.keep_vis(obj, max(F_FIRST, f_enter - 1))
    if out:
        ANIM.setdefault("present_from_0", []).append(obj.name)

def fade(obj, f0, f1):
    """shadows fade in while the item comes down (none while it hangs outside the frame)"""
    su.shadow_fade(obj, [(max(F_FIRST, f0 - 1), 1.0), (f0 + 0.2 * (f1 - f0), 1.0), (f0 + 0.55 * (f1 - f0), 0.0)])

def lowering(name, obj, f1, tilt_deg=(0, 0, 0), bounce=0.0012, squash=None, side=0.0, v0=0.62):
    """make_fn(f0, Pl): the item comes in from above the frame along the image's up direction
    (side > 0 leans the path toward the image's right), drops straight into its place, touches at
    f1 and settles with a few mm of up-only bounce."""
    loc0, rot0, scl0 = REST[name]
    obj.location, obj.rotation_euler, obj.scale = loc0, rot0, scl0
    bpy.context.view_layer.update()
    zb = su.world_bbox(obj)[0].z
    q_v = max(0.02, RIM_Z + 0.018 - zb)
    tilt = [math.radians(v) for v in tilt_deg]
    def scl_fn(f):
        if squash is None:
            return None
        sz = squash(f)
        bulge = 1.0 + 0.22 * (1.0 - sz)
        return (scl0.x * bulge, scl0.y * bulge, scl0.z * sz)
    def make(f0, Pl):
        r_, u_ = cam_axes((f0 + f1) // 2)
        far = u_ + side * r_
        def after(f):
            u = (f - f1) / 5.0
            dz = 0.0 if u >= 1 else bounce * math.sin(math.pi * u) * (1 - u) ** 0.6
            return loc0 + Vector((0, 0, dz)), rot0.copy(), scl_fn(f)
        fn = glide_path(name, Pl, f0, f1, lambda f: loc0, lambda f, k: rot_add(rot0, [t * k for t in tilt]),
                        q_v, far, lambda u: su.glide(u, a=0.25, d=0.50, v_end=0.06, v0=v0),
                        scl_fn=scl_fn if squash else None, after_fn=after)
        ANIM[name]["q_vertical"] = round(q_v, 3)
        return fn
    return make

def lower_item(name, obj, f1, f0_latest, f0_earliest, **kw):
    f0, fn = tune(name, obj, lowering(name, obj, f1, **kw), range(f0_latest, f0_earliest - 1, -1))
    ANIM[name]["f0"] = f0
    appear(obj, f0)
    fade(obj, f0, f1)
    return f0

HOODIE_F1 = 35
def hoodie_squash(f, f1=HOODIE_F1):
    # descends a touch fuller, compresses on touchdown, recovers to the packed height by f1+4 and
    # never overshoots ABOVE it (the cap lands on it right after)
    if f < f1 - 1:
        return 1.05
    if f < f1 + 1:
        return su.lerp(1.05, 0.965, su.smoothstep(f1 - 1, f1 + 1, f))
    return su.lerp(0.965, 1.0, su.smootherstep(f1 + 1, f1 + 4, f))

lower_item("product", K["product"], 21, 3, 0, tilt_deg=(3.0, -4.0, 9.0), bounce=0.0014, v0=0.5)
lower_item("hoodie", K["hoodie"], HOODIE_F1, 20, 14, tilt_deg=(-2.0, 3.0, -6.0), bounce=0.0, squash=hoodie_squash)
lower_item("cap", K["cap"], 41, 25, 19, tilt_deg=(6.0, -5.0, 12.0), bounce=0.0010)
lower_item("tumbler", K["tumbler"], 44, 28, 22, tilt_deg=(0.0, 0.0, 8.0), bounce=0.0010, side=0.25, v0=0.55)
lower_item("bottle", K["bottle"], 66, 50, 44, tilt_deg=(0.0, 0.0, -7.0), bounce=0.0010, side=0.25)

# --- note card: glides in from the upper right, rides an air cushion, drops flat
CARD = K["card"]
c_loc, c_rot, c_scl = REST["card"]
CARD_FH, CARD_F1 = 86, 90
CUSH = 0.009
def card_make(f0, Pl):
    r_, u_ = cam_axes((f0 + CARD_FH) // 2)
    CARD.location, CARD.rotation_euler = c_loc, c_rot
    bpy.context.view_layer.update()
    q_v = max(0.02, RIM_Z + 0.015 - su.world_bbox(CARD)[0].z)
    def rot_fn(f, k):
        return rot_add(c_rot, (math.radians(-6) * k, math.radians(9) * k, math.radians(28) * k * k))
    def after(f):
        # air cushion: floats, sinks slowly, then the air escapes and it settles
        v = clamp_u((f - CARD_FH) / (CARD_F1 - CARD_FH))
        dz = max(CUSH * (1 - su.ease_in(v, 2.6)) + 0.0007 * math.sin(math.pi * v) * (1 - v), 0.0)
        lat = Vector((0.0012 * math.sin(v * 2.4) * (1 - v), -0.0008 * math.sin(v * 3.1) * (1 - v), 0))
        rot = rot_add(c_rot, (math.radians(0.6) * math.sin(v * 3.3) * (1 - v), 0.0, math.radians(0.8) * (1 - v)))
        if f >= CARD_F1:
            dz, lat, rot = 0.0, Vector(), c_rot.copy()
        return c_loc + lat + Vector((0, 0, dz)), rot, None
    fn = glide_path("card", Pl, f0, CARD_FH, lambda f: c_loc + Vector((0, 0, CUSH)), rot_fn, q_v,
                    u_ + 0.3 * r_, lambda u: su.glide(u, a=0.25, d=0.5, v_end=0.04, v0=0.55), after_fn=after)
    ANIM["card"].update(f_hover=CARD_FH, f1=CARD_F1)
    return fn
CARD_F0, _ = tune("card", CARD, card_make, range(72, 59, -1))
ANIM["card"]["f0"] = CARD_F0
appear(CARD, CARD_F0)
fade(CARD, CARD_F0, CARD_FH)

# --- lid: glides in from the top of the image plane to a hover just over the base, then slips down
#     the last 16 mm + settles (slow-in, quick settle)
LID_FH, LID_F1, LID_SETTLE = 106, 109, 4.0
lid_hover = (RIM_Z + 0.016) - kit.LID_SEAT_Z     # lid rim 16 mm above the base rim
def lid_after(f):
    if f <= LID_F1:
        dz = su.lerp(lid_hover, 0.0, su.ease_in((f - LID_FH) / (LID_F1 - LID_FH), 1.8))
    else:
        u = (f - LID_F1) / LID_SETTLE
        dz = 0.0 if u >= 1 else 0.0016 * math.sin(math.pi * u) * (1 - u)
    return LID_REST + Vector((0, 0, dz)), Euler((0, 0, 0)), None
LID_FN = {}
def lid_make(f0, Pl):
    r_, u_ = cam_axes((f0 + LID_FH) // 2)
    def rot_fn(f, k):
        return Euler((math.radians(-4) * k, math.radians(2.5) * k, math.radians(-6) * k))
    fn = glide_path("lid", Pl, f0, LID_FH, lambda f: LID_REST + Vector((0, 0, lid_hover)), rot_fn, 0.05, u_,
                    lambda u: su.glide(u, a=0.25, d=0.5, v_end=0.08, v0=0.62), after_fn=lid_after)
    LID_FN["fn"] = fn
    ANIM["lid"].update(f_hover=LID_FH, f1=LID_F1)
    return fn
LID_F0, _ = tune("lid", LID, lid_make, range(92, 79, -1))
def lid_dz(f):
    return LID_FN["fn"](f)[0].z - LID_REST.z
ANIM["lid"]["f0"] = LID_F0
appear(LID, LID_F0)
fade(LID, LID_F0, LID_FH)

# --- the cap's soft crown gives under the closing lid only if it is taller than the lid's inner
#     ceiling (the kit-pose cap is not: expected 'none'); measured at the cap's REST pose, scaled
#     about its base
CEIL = kit.CLOSED_H - kit.BOARD                 # inner ceiling height of the seated lid
cap_loc, cap_rot, cap_scl = REST["cap"]
sc.frame_set(F_LAST)
cap_bot0, cap_top0 = (lambda lh: (lh[0].z, lh[1].z))(su.tight_bbox(K["cap"]))
sq_info = []
def cap_s(f):
    ceil = CEIL + lid_dz(f) - 0.0012
    return 1.0 if (f < LID_FH or cap_top0 <= ceil) else max(0.85, (ceil - cap_bot0) / (cap_top0 - cap_bot0))
for f in range(LID_FH, F_LAST + 1):
    if cap_s(f) < 1.0:
        sq_info.append((f, round(cap_s(f), 3)))
if sq_info:
    for f in range(LID_FH - 1, F_LAST + 1):
        s_ = cap_s(f)
        K["cap"].scale = (cap_scl.x, cap_scl.y, cap_scl.z * s_)
        K["cap"].location = (cap_loc.x, cap_loc.y, cap_bot0 + (cap_loc.z - cap_bot0) * s_)   # about its base
        K["cap"].keyframe_insert("scale", frame=f)
        K["cap"].keyframe_insert("location", frame=f)
    su.linear_keys(K["cap"])
ANIM["cap_crown"] = dict(top=round(cap_top0, 4), ceiling=round(CEIL, 4),
                         squash=(sq_info[:1] + sq_info[-1:]) if sq_info else "none (clears the lid)")

# --- seal: a hand brings it in from the RIGHT edge (near its corner: short path) a little above the
#     lid's hover height, rides down with the lid, touches with one edge at f110, pressed flat by f114
SEAL_F1, SEAL_PRESS, SEAL_HOVER = 114, 110, 0.022
def seal_tilt(f, f0):
    u = clamp_u((f - f0) / (SEAL_PRESS - f0))
    w = clamp_u((f - SEAL_PRESS) / (SEAL_F1 - SEAL_PRESS))
    return math.radians(22.0) * (1 - su.smoothstep(0.0, 1.0, w)) * (0.5 + 0.5 * su.smoothstep(0.6, 1.0, u)), w
def seal_make(f0, Pl):
    r_, u_ = cam_axes((f0 + SEAL_PRESS) // 2)
    def base(f):
        a, w = seal_tilt(f, f0)
        R = Euler((a, -0.35 * a, SEAL_ROT)).to_matrix()
        drop = kit.SEAL_D / 2 * math.hypot(R[2][0], R[2][1])       # lowest rim point of the tilted disc
        u = clamp_u((f - f0) / (SEAL_PRESS - f0))
        h = SEAL_HOVER * (1 - su.smoothstep(0.55, 1.0, u)) * (1 - w)
        h = max(h, drop + (0.0002 if a > 1e-4 else 0.0))
        # rides on the lid only once the lid hovers (before that it waits off-frame right at the
        # hover height: following the lid's long glide would drag it through the whole frame)
        return SEAL_REST + Vector((0, 0, (lid_dz(f) if f >= LID_FH else lid_hover) + h))
    def rot_fn(f, k):
        a, w = seal_tilt(f, f0)
        return Euler((a, -0.35 * a, SEAL_ROT + math.radians(18) * k))
    far = r_.copy(); far[2] = 0.0
    fn = glide_path("seal", Pl, f0, SEAL_PRESS, base, rot_fn, 0.0, far + 0.25 * u_,
                    lambda u: su.glide(u, a=0.25, d=0.55, v_end=0.0, v0=0.35),
                    after_fn=lambda f: (base(f), rot_fn(f, 0.0), None))
    ANIM["seal"].update(press=SEAL_PRESS, f1=SEAL_F1)
    return fn
SEAL_F0, _ = tune("seal", SEAL, seal_make, range(102, 89, -1))
ANIM["seal"]["f0"] = SEAL_F0
appear(SEAL, SEAL_F0)
fade(SEAL, SEAL_F0, SEAL_PRESS)
print("[seq] tuned glides (peak / entry % frame height per frame):", TUNED)

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
tamed = su.tame_microbump(name_has=("pulp", "liner", "tissue", "wrap", "card", "paper"))
print(f"[seq] micro-bump tamed on {len(tamed)} materials")
print(f"[seq] matte tissue: {su.matte_tissue()}; tumbler etch moved on {su.tumbler_logo_z()} node(s)")
for w in wings:
    w.obj.cycles.use_motion_blur = False   # per-frame shape keys: crisp paper reads better than smear

# ------------------------------------------------------------------ exact ink border
sc.frame_set(0)
INK_LIN = su.edge_lock(INK, inner=0.50, outer=0.985, p=2.3)
print(f"[seq] build {time.time() - t_start:.1f}s; anim: {ANIM}")

# ------------------------------------------------------------------ modes
def all_movers():
    m = {k: K[k] for k in ("product", "hoodie", "cap", "tumbler", "bottle", "card")}
    m["lid"] = LID
    m["seal"] = SEAL
    for w in wings:
        m[w.name] = w.obj
    return m

V_LIMIT, V_ENTRY_LIMIT = 0.06, 0.04

if CHECK:
    frames = FRAMES if (fr or _arg("--list")) else list(range(F_FIRST, F_LAST + 1))
    movers = all_movers()
    static = {"base": K["base"], "insert": K["insert"], "lining": K["lining"]}
    fails = []
    # ---- screen motion of every mover, evaluated from the baked animation (frame_set), mesh points
    #      + their bbox corners, through the animated camera; only frames where it is (partly) visible
    Pl = {}
    for k, o in movers.items():
        if k.startswith("Wing"):
            continue
        sc.frame_set(F_LAST)
        bpy.context.view_layer.update()
        P = su.world_points(o, max_pts=500, seed=3)
        lo_, hi_ = P.min(axis=0), P.max(axis=0)
        P = np.concatenate([P, [(x, y, z) for x in (lo_[0], hi_[0]) for y in (lo_[1], hi_[1]) for z in (lo_[2], hi_[2])]])
        Mi = np.array(o.matrix_world.inverted())
        Pl[k] = P @ Mi[:3, :3].T + Mi[:3, 3]
    prev, worst, entry = {}, {}, {}
    for f in range(F_FIRST, F_LAST + 1):
        sc.frame_set(f)
        bpy.context.view_layer.update()
        for k, o in movers.items():
            if o.hide_render:
                prev.pop(k, None)
                continue
            if k.startswith("Wing"):
                if not (min(w.f0 for w in wings) - 1 <= f <= max(w.f1 for w in wings) + 1):
                    prev.pop(k, None)
                    continue
                Pw = su.world_points(o, max_pts=800, seed=5)
            else:
                M = np.array(o.matrix_world)
                Pw = Pl[k] @ M[:3, :3].T + M[:3, 3]
            S = proj(f, Pw)
            vis = bool(np.any((S[:, 0] > 0) & (S[:, 0] < 1) & (S[:, 1] > 0) & (S[:, 1] < 1)))
            if k in prev and len(prev[k][0]) == len(S) and (vis or prev[k][1]):
                d = S - prev[k][0]
                v = float(np.max(np.hypot(d[:, 0] * ASPECT, d[:, 1])))
                if v > worst.get(k, (0, 0))[0]:
                    worst[k] = (v, f)
                if k not in entry:
                    entry[k] = (v, f)
            prev[k] = (S, vis)
    print("[check] peak screen speed per mover (% frame height / frame, at frame):",
          {k: (round(100 * v[0], 1), v[1]) for k, v in worst.items()})
    print("[check] speed at the first visible frame (entry):", {k: (round(100 * v[0], 1), v[1]) for k, v in entry.items()})
    for k, (v, f) in worst.items():
        if v > V_LIMIT:
            fails.append(f"speed {k} {100 * v:.1f}% at f{f} > {100 * V_LIMIT:.0f}%")
    for k, (v, f) in entry.items():
        if v > V_ENTRY_LIMIT and not k.startswith("Wing"):
            fails.append(f"entry {k} {100 * v:.1f}% at f{f} > {100 * V_ENTRY_LIMIT:.0f}%")
    # ---- interpenetration (BVH), pairs where BOTH items are fully outside the frame are skipped
    report = []
    for f in frames:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        vis = {k: o for k, o in movers.items() if not o.hide_render}
        onscreen = {}
        for k in list(vis) + list(static):
            o = vis.get(k) or static[k]
            lo_, hi_ = su.world_bbox(o)
            S = proj(f, np.array(su.bbox_corners(lo_, hi_)))
            onscreen[k] = not (S[:, 0].max() < 0 or S[:, 0].min() > 1 or S[:, 1].max() < 0 or S[:, 1].min() > 1)
        names = list(vis)
        bad = []
        bvh, tri = {}, {}
        for k in names + list(static):
            bvh[k], tri[k] = su.group_bvh([vis.get(k) or static[k]], with_tris=True)
        for i, a in enumerate(names):
            for b in names[i + 1:] + list(static):
                if not (onscreen[a] or onscreen[b]):
                    continue                                  # parked off-frame: nobody can see it
                if b == "lining" and a.startswith("Wing"):
                    continue                                  # the flap is a continuation of the lining
                if bvh[a] is None or bvh[b] is None:
                    continue
                ov = bvh[a].overlap(bvh[b])
                if ov:
                    pa = tri[a][[i_ for i_, _ in ov]]
                    lo_, hi_ = pa.min(axis=0), pa.max(axis=0)
                    bad.append(f"{a}x{b}:{len(ov)}[{lo_[0]:.3f},{lo_[1]:.3f},{lo_[2]:.3f}..{hi_[0]:.3f},{hi_[1]:.3f},{hi_[2]:.3f}]")
        # the lib lining's crumple dips into the base floor UNDER the hoodie (unseen): only floor contact
        lb = bvh["lining"].overlap(bvh["base"]) if bvh["lining"] and bvh["base"] else []
        if lb and tri["lining"][[i_ for i_, _ in lb]][:, 2].max() > 0.012:
            bad.append(f"liningxbase above the floor:{len(lb)}")
        print(f"[check] f{f:03d} " + (" ".join(bad) if bad else "clean"))
        report.append((f, bad))
    n_clean = sum(1 for _, b in report if not b)
    print("[check] interpenetration:", n_clean, "/", len(report), "frames clean")
    if n_clean < len(report):
        fails.append(f"{len(report) - n_clean} frames with interpenetration")
    print("[check] fit:", notes)
    print("[check] RESULT:", "PASS" if not fails else "FAIL " + "; ".join(fails))
    sys.exit(1 if fails else 0)

if "--profile" in FLAGS:
    # relative cost of the expensive features on one frame (CPU seconds of this process)
    f = FRAMES[0]
    sc.frame_set(f)
    base = dict(mb=sc.render.use_motion_blur, mx=c.max_bounces, df=c.diffuse_bounces, gl=c.glossy_bounces,
                tr=c.transmission_bounces, sp=c.samples)
    configs = [("baseline", {}), ("no_motion_blur", dict(mb=False)),
               ("bounces_6_1_2_6", dict(mx=6, df=1, gl=2, tr=6)), ("samples_40", dict(sp=40))]
    for name, cfg in configs:
        v = dict(base, **cfg)
        sc.render.use_motion_blur = v["mb"]
        c.max_bounces, c.diffuse_bounces, c.glossy_bounces = v["mx"], v["df"], v["gl"]
        c.transmission_bounces, c.samples = v["tr"], v["sp"]
        c0 = sum(os.times()[:2])
        sc.render.filepath = os.path.join(OUTDIR, f"profile_{name}.png")
        os.makedirs(OUTDIR, exist_ok=True)
        bpy.ops.render.render(write_still=True)
        print(f"[profile] {name}: cpu {sum(os.times()[:2]) - c0:.0f}s")
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

def png_complete(path):
    """True if path is a whole PNG: signature at the start and the IEND chunk at the very end
    (a Blender killed mid-write leaves a truncated file, which must be rendered again)."""
    try:
        if os.path.getsize(path) < 64:
            return False
        with open(path, "rb") as fh:
            head = fh.read(8)
            fh.seek(-12, os.SEEK_END)
            tail = fh.read(12)
        return head == b"\x89PNG\r\n\x1a\n" and tail[4:8] == b"IEND"
    except OSError:
        return False

os.makedirs(OUTDIR, exist_ok=True)
for f in FRAMES:
    out = os.path.join(OUTDIR, f"{f:04d}.png")
    tmp = os.path.join(OUTDIR, f"{f:04d}.tmp.png")
    if not FORCE and os.path.exists(out):
        if png_complete(out):
            print(f"[seq] skip {out}")
            continue
        print(f"[seq] {out} is truncated/corrupt -> re-rendering")
        os.remove(out)
    t0 = time.time(); c0 = sum(os.times()[:2])
    sc.frame_set(f)
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    if not png_complete(tmp):
        raise RuntimeError(f"render of frame {f} did not produce a complete PNG ({tmp})")
    os.replace(tmp, out)                 # atomic: a frame on disk under its final name is always whole
    cpu = sum(os.times()[:2]) - c0
    print(f"[seq] wrote {out} in {time.time() - t0:.1f}s (cpu {cpu:.0f}s = ~{cpu / 4:.0f}s on 4 free cores)")
print(f"[seq] total {time.time() - t_start:.1f}s")
