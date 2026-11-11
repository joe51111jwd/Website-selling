"""kit/hero-open.png — THE hero image: the fully packed kit, lid off and leaning against the
back of the base (shifted right so its chrome wordmark and the cobalt "no. 01/48" seal both
read), high 3/4 view into the box. Transparent PNG with its own soft contact shadow.

Same assembly as the packing sequence's last packed frame (sequence_util.build_kit + the folded
tissue wings), so the hero and the animation show one and the same kit.

Usage (from chainmail/):
  blender -b --factory-startup -P blender/scenes/kit_hero_open.py -- [--preview] [--samples N]
      --check   : no render, BVH interpenetration report for every pair of parts
      --ortho   : orthographic top + front + side QA renders -> blender/previews/kit/hero-open_*.png
                  (--views top,side to pick)
      --crop X,Y,W,H : render only that pixel region of the full-res frame (100 % QA crops)

Round 3: libs from the frozen snapshot (blender/lib_frozen_seq, == every sequence chunk). Black hoodie +
White cap (the cap yawed 70 deg in the bay's front-left corner: brim visible past the front wall, logo to
camera, the hood + drawcord grommets of the hoodie read behind it; a grazing hoodie-only rake light brings
out the fleece), one matte crumpled tissue flap (no back flap: the hood stays visible), the lining's wall
edge broken by a wave + creases, tissue materials matte paper (rough 0.82, spec 0.18, no sheen, 15 %
translucent), the card pushed to the far ends of tumbler + bottle and the tumbler's etched mark staged
in front of it, so the label and 'your logo' both read. --check is BVH-exact incl. the lining.
"""
import sys, os, math, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
import seq_freeze                                     # the hero + every sequence chunk use ONE lib snapshot
LIBS = seq_freeze.activate(allow_live="--live-libs" in sys.argv)
from common import *
from mathutils import Vector, Euler, Matrix
import numpy as np
import kit
import sequence_util as su
if LIBS != "LIVE":
    seq_freeze.check_loaded()
print(f"[hero] libs {LIBS}")

FL = argv_flags()
def _arg(name, default=None):
    return FL[FL.index(name) + 1] if name in FL and FL.index(name) + 1 < len(FL) else default
CHECK = "--check" in FL
ORTHO = "--ortho" in FL
SAMPLES = int(_arg("--samples", "256"))

t0 = time.time()
reset()
sc = setup_render(2400, 1800, samples=SAMPLES, transparent=True)
c = sc.cycles
c.max_bounces = 12
c.diffuse_bounces = 3
c.glossy_bounces = 4
c.transmission_bounces = 12      # lying bottle: glass wall x2 + liquid + glass x2 ... keep the aqua glass clear
c.transparent_max_bounces = 12
c.volume_bounces = 1
c.sample_clamp_indirect = 8.0
c.adaptive_threshold = 0.02 if PREVIEW else 0.008
c.seed = 3
# ONE render tile: with Cycles auto-tiling (default 2048 px tiles -> 2 tiles at 2400 px) the compositor
# (cutout_edge_fade) receives the NOT-denoised combined pass -> per-pixel salt-and-pepper noise in the
# round-1 final (measured: high-pass std 22.9 tiled vs 6.4 single tile at the same spp).
c.tile_size = 4096

# ------------------------------------------------------------------ the kit (final packed pose)
notes = []
_cap = [float(v) for v in _arg("--cap", ",".join(str(v) for v in su.HERO_CAP)).split(",")]
_card = [float(v) for v in _arg("--card", ",".join(str(v) for v in su.CARD_POSE)).split(",")]
K = su.build_kit(number=1, edition=48, puffs=False, log=notes, cap_xy=(_cap[0], None if _cap[1] > 9 else _cap[1]),
                 cap_rot=_cap[2], cap_depth=_cap[3] or None, card_pose=tuple(_card))
# hero == sequence: one tissue flap (left wall) folded in over the hoodie margin with a crumpled,
# curled free edge; the back of the bay stays open so the hood + drawcords of the hoodie read
if "--nocrumple" not in FL:
    su.crumple_lining(K["lining"])
wings = su.make_wings(K, timing=None, opts=su.WING_OPTS, only=su.WING_ONLY)
for n in notes:
    print("[hero] fit:", n)

# ------------------------------------------------------------------ the lid, leaning on the back rim
ALPHA = math.radians(9.0)          # lean from vertical (top toward the box, physically resting on the rim)
X_SHIFT = 0.135                    # slid right so the seal (lower-right corner of the leaning lid) shows
LID = kit.lid(1, 48)
LID.rotation_euler = (math.pi / 2 + ALPHA, 0.0, 0.0)
LID.location = (0.0, 0.0, 0.0)
bpy.context.view_layer.update()
lo, hi = kit.world_bbox(LID)
R = LID.rotation_euler.to_matrix()
face_off = R @ Vector((0, 0, kit.LID_H))            # top (foil) face point, relative to the origin
n_face = R @ Vector((0, 0, 1))                      # (0, -cos a, -sin a)
z_loc = -lo.z + 0.0002                              # its lower edge stands on the floor
# the face plane must touch the base's back rim edge (bevelled corner) from behind
q = Vector((0.0, kit.BOX_D / 2 - 0.0005, kit.BOX_H - 0.0005))
p0z = z_loc + face_off.z
y_loc = q.y + math.tan(ALPHA) * (q.z - p0z) - face_off.y + 0.0006
LID.location = (X_SHIFT, y_loc, z_loc)
bpy.context.view_layer.update()
print(f"[hero] lid lean {math.degrees(ALPHA):.1f}° at y={y_loc:.4f} z={z_loc:.4f}")

# ------------------------------------------------------------------ camera: high 3/4, ~8 % padding
EL, AZ, LENS = 46.0, 21.0, 70.0
cam = su.sph_camera((0.0, 0.0, 0.1), AZ, EL, 2.0, LENS)
cam.data.sensor_fit = "HORIZONTAL"

def frame_points():
    """real silhouette samples (AABB corners of the leaning lid would over-pad the frame)"""
    pts = []
    for r in (K["base"], LID, K["cap"], K["product"]):
        pts += [tuple(p) for p in su.world_points(r, max_pts=5000)]
    # + a hair of floor for the contact shadow (cutout_edge_fade fades the rest before the border)
    for x, y in ((-0.256, -0.186), (0.258, -0.186)):
        pts.append((x, y, 0.0))
    return pts

def fit(cam, pts, pad=0.08, iters=12):
    aspect = sc.render.resolution_y / sc.render.resolution_x
    t = Vector((0.0, 0.05, 0.12))
    d = 2.0
    for _ in range(iters):
        cam.location = su.sph_loc(t, AZ, EL, d)
        look_at(cam, t)
        bpy.context.view_layer.update()
        P = su.project(cam, pts)
        xs = [p.x for p in P]; ys = [p.y for p in P]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        span = max((max(xs) - min(xs)) / (1 - 2 * pad), (max(ys) - min(ys)) / (1 - 2 * pad))
        # shift the target by the centre error (view width at the target distance)
        w = 2 * d * math.tan(cam.data.angle_x / 2) if hasattr(cam.data, "angle_x") else d * 36 / LENS
        M = cam.matrix_world.to_3x3()
        t = t + M @ Vector(((cx - 0.5) * w, (cy - 0.5) * w * aspect, 0.0))
        d *= span
    return t, d

FP = frame_points()
T, D = fit(cam, FP)
_P = su.project(cam, FP)
print("[hero] silhouette padding L%.3f R%.3f B%.3f T%.3f" % (min(p.x for p in _P), 1 - max(p.x for p in _P),
                                                         min(p.y for p in _P), 1 - max(p.y for p in _P)))
print(f"[hero] camera target {tuple(round(v, 3) for v in T)} dist {D:.3f}")
cam_loc = Vector(cam.location)

# ------------------------------------------------------------------ light: house kit rig + a top card into the box
kit.kit_lighting(scale=1.8, target=(0.02, 0.05, 0.12), key=0.85, fill=0.55, hdri_strength=0.22, top=0.7,
                 rim=1.0, contact=1.0)
TOPC = area_light("TopCard", Vector((-0.02, -0.02, 1.05)), Vector((0.0, 0.0, 0.05)), size=0.55, size_y=0.42,
                  energy=2.6, color=(1.0, 0.985, 0.97), spread=100)
TOPC.visible_camera = False
RAKE = su.hoodie_pop(K, energy=float(_arg("--rake", "10")))
# the leaning foil face mirrors the bone insert below/in front of it; a soft camera-invisible glint
# card on that mirror path gives the chrome a clean bright sweep (foil-only via light linking)
p_face = Vector(LID.location) + face_off + R @ Vector((0, 0.02, 0))
i_dir = (p_face - cam_loc).normalized()
r_dir = (i_dir - 2 * i_dir.dot(n_face) * n_face).normalized()
kit.glint_strip("FoilGlint_hero", p_face + r_dir * 0.85, p_face, size=(0.9, 0.4), strength=3.2, gradient=True)
cat = shadow_catcher(size=12)
cat.visible_glossy = False          # the floor must not mirror in the soft-touch / foil
try:
    kit.link_kit_lights(no_catcher=("Key", "Top", "Rim", "Fill", "FoilCard", "TopCard"),
                        flag_seals=("Top", "TopCard"), shadowless=("Fill",))
except TypeError:
    kit.link_kit_lights()

if CHECK:
    parts = {k: K[k] for k in ("base", "insert", "lining", "hoodie", "cap", "product", "tumbler", "bottle", "card")}
    for i, p in enumerate(K["puffs"]):
        parts[f"puff{i}"] = p
    for w in wings:
        parts[w.name] = w.obj
    parts["lid"] = LID
    names = list(parts)
    bvh, tri = {}, {}
    for k, v in parts.items():
        bvh[k], tri[k] = su.group_bvh([v], with_tris=True)
    bad = 0
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            if a.startswith(("puff", "Wing")) and b.startswith(("puff", "Wing")):
                continue
            if {a, b} & {"insert"} and (a.startswith("puff") or b.startswith("puff")):
                continue
            if {a, b} in ({"lining", "insert"}, {"lining", "base"}) or ({a, b} & {"lining"} and (a.startswith("Wing") or b.startswith("Wing"))):
                continue                       # lib tissue's crumple dips into the floor under the hoodie (unseen)
            ov = bvh[a].overlap(bvh[b]) if bvh[a] and bvh[b] else []
            n = len(ov)
            if n:
                bad += 1
                pa = tri[a][[i_ for i_, _ in ov]]
                print(f"[hero-check] {a} x {b}: {n} at {np.round(pa.min(axis=0), 3)}..{np.round(pa.max(axis=0), 3)}")
    lo_, hi_ = kit.world_bbox(LID)
    print(f"[hero-check] lid bbox {tuple(round(v, 4) for v in lo_)} {tuple(round(v, 4) for v in hi_)}")
    print(f"[hero-check] {'clean' if not bad else str(bad) + ' touching pairs'}")
    sys.exit(0)

tamed = su.tame_microbump(name_has=("pulp", "liner", "tissue", "wrap", "card", "paper"))
print(f"[hero] micro-bump tamed on {len(tamed)} materials: {[t[0] for t in tamed]}")
print(f"[hero] matte tissue: {su.matte_tissue()}; tumbler etch moved on {su.tumbler_logo_z()} node(s)")
if _arg("--pct"):
    sc.render.resolution_percentage = int(_arg("--pct"))

if ORTHO:
    VIEWS = _arg("--views", "top,front,side").split(",")
    sc.render.film_transparent = False
    sc.use_nodes = False
    world_hdri("soft", 0.8, visible=False, bg_color="fog")
    for nm, loc, rot, scale in (("top", (0.03, 0.08, 3.0), (0, 0, 0), 0.95),
                                ("front", (0.03, -3.0, 0.16), (math.radians(90), 0, 0), 0.95),
                                ("side", (3.0, 0.08, 0.16), (math.radians(90), 0, math.radians(90)), 0.75)):
        if nm not in VIEWS:
            continue
        cd = bpy.data.cameras.new("QA_" + nm); cd.type = "ORTHO"; cd.ortho_scale = scale
        co = bpy.data.objects.new("QA_" + nm, cd); sc.collection.objects.link(co)
        co.location = loc; co.rotation_euler = rot
        sc.camera = co
        sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1200, 900, 100
        c.samples = 16
        out = os.path.join(PREVIEW_DIR, "kit", f"hero-open_{nm}.png")
        sc.render.filepath = out
        bpy.ops.render.render(write_still=True)
    sys.exit(0)

kit.cutout_edge_fade(inner=0.84, outer=0.985)
CROP = _arg("--crop")
if CROP:
    x, y, w, h = (int(v) for v in CROP.split(","))
    W, H = sc.render.resolution_x, sc.render.resolution_y
    sc.render.resolution_percentage = 100
    sc.render.use_border = True
    sc.render.use_crop_to_border = True
    sc.render.border_min_x, sc.render.border_max_x = x / W, (x + w) / W
    sc.render.border_min_y, sc.render.border_max_y = 1 - (y + h) / H, 1 - y / H
    if "--keepcomp" not in FL:
        sc.use_nodes = False
    if _arg("--tile"):
        c.tile_size = int(_arg("--tile"))
    sc.render.filepath = os.path.join(PREVIEW_DIR, "kit", f"hero-open_crop_{x}_{y}{'_comp' if '--keepcomp' in FL else ''}{'_t' + _arg('--tile') if _arg('--tile') else ''}.png")
    bpy.ops.render.render(write_still=True)
    sys.exit(0)
print(f"[hero] build {time.time() - t0:.1f}s")
render_to("kit/hero-open.png")
print(f"[hero] total {time.time() - t0:.1f}s")
