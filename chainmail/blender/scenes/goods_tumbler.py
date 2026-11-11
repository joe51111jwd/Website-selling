"""goods/tumbler.png — four 25 oz tumblers (Matte Black, Primrose, Lavender, Dune):
two front, two back, the front-right one with its flip handle up.
   --close          : tight camera on the lid + etched logo (preview QA only).
   --crop x0,y0,x1,y1 : render only that region of the FINAL frame at full resolution
                      (fractions, origin bottom-left) -> goods/tumbler_crop.png (QA only)
   --spp N          : override the sample count (QA crops)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import vessels

FLAGS = argv_flags()
CLOSE = "--close" in FLAGS
CROP = [float(v) for v in FLAGS[FLAGS.index("--crop") + 1].split(",")] if "--crop" in FLAGS else None
EXPOSURE = -0.40
BLACK_ALBEDO = "#1D2224"
LENS, SHIFT = 98, (-0.050, 0.028)   # ~8-9 % padding around the opaque products
SPP = int(FLAGS[FLAGS.index("--spp") + 1]) if "--spp" in FLAGS else None
reset()
# -0.40 EV: the pastel fronts now take the full key; at 0 EV their lit flanks rendered ~7 L* over the
# catalog swatches (Dune #F0E7D8 vs #D9D3CA). Shadows/alpha are unaffected (catcher ratio).
setup_render(1600, 1600, samples=SPP or 256, preview=False if CROP else None, exposure=EXPOSURE)
c = bpy.context.scene.cycles
c.max_bounces = 8
c.glossy_bounces = 4
c.transmission_bounces = 4
c.diffuse_bounces = 3
if not PREVIEW:
    c.adaptive_threshold = 0.008     # 256 spp; generous safety ceiling only (round-1 340 s cap -> mottling)
    c.time_limit = 0               # no cap: let 256 spp + adaptive 0.008 converge (round-2: caps -> grain)
if CROP:
    s = bpy.context.scene
    s.render.use_border = True
    s.render.use_crop_to_border = True
    s.render.border_min_x, s.render.border_min_y, s.render.border_max_x, s.render.border_max_y = CROP
    s.render.image_settings.color_depth = "8"

studio("soft", key=0.92, hdri_strength=0.32, scale=0.62, target=(0, 0, 0.13))
bpy.data.objects["Rim"].data.use_shadow = False   # house rule: rim lights edges, no smudge
# key stays upper-left (~55 deg left of the lens) but steeper (~62 deg) so the cast shadows stay short and fade out
# well inside the frame, and the lids get more top light
_key = bpy.data.objects["Key"]
_key.location = Vector((0, 0, 0.13)) + Vector((-0.95, -1.55, 3.55)) * 0.62
look_at(_key, (0, 0, 0.13))
# the low fill (~9 deg) throws metre-long faint shadows to the back-left that reach the frame edge
# as a grey haze on the catcher; it only needs to lift the fronts, so it casts no shadow
bpy.data.objects["Fill"].data.use_shadow = False
shadow_catcher()

el, az = math.radians(30), math.radians(24)   # brief product camera: 30-38 deg elevation
# (color, u, v, extra rotation deg, lid open) in camera-aligned coordinates (u across, v depth).
# Staging: the back-middle slot only ever shows the shaded flank between the two front tumblers
# (its key side hides behind the front-left one), so it holds the Matte Black, which reads true in
# shade; the three pastels take the slots that show their key-lit side (round 2: Dune in that slot
# read greige-pink, dE 10-14). Back tumblers are turned so the etched mark is either fully on the
# visible flank (Lavender) or fully turned away (Black) -- never cut off by a front tumbler.
LAYOUT = [
    ("Lavender",    -0.084,  0.062, -34, False),
    ("Matte Black",  0.018,  0.080, 125, False),
    ("Dune",        -0.040, -0.040,   4, False),
    ("Primrose",     0.070, -0.026, -12, True),
]
for color, u, v, rz, open_ in LAYOUT:
    t = vessels.tumbler(color, lid_open=open_)
    t.location = (u * math.cos(az) - v * math.sin(az), u * math.sin(az) + v * math.cos(az), 0)
    t.rotation_euler = (0, 0, az + math.radians(rz))
    # graded shadow-only disc under the heel: opaque well inside the base fillet, feathering to 0 a few
    # mm outside the body silhouette (r 0.0356) -> a soft contact crease, no hard ring (round 2)
    vessels.soft_contact_occluder(t, r_in=0.0325, r_out=0.0412, peak=0.92, z=0.0005, power=1.25)

# the Matte Black flank faces the Primrose and Dune and picks up their warm/pink bounce (round 2 read
# chocolate, R 6 over B): a slightly cool albedo for this shot so the rendered black stays neutral
_bk = bpy.data.materials.get("tumbler_coat_Matte Black")
if _bk:
    _bk.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = rgb(BLACK_ALBEDO)

if CLOSE:
    tgt, dist, lens = (0.068, 0.000, 0.272), 0.34, 100
    el2 = math.radians(34)
    loc = (tgt[0] + dist * math.sin(az) * math.cos(el2), tgt[1] - dist * math.cos(az) * math.cos(el2),
           tgt[2] + dist * math.sin(el2))
else:
    tgt, dist, lens = (0.016, 0.005, 0.136), 1.10, LENS
    loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
           tgt[2] + dist * math.sin(el))
cam = camera(loc=loc, target=tgt, lens=lens)
if not CLOSE:
    # lens shift (no perspective change) recentres the frame on the products' bounding box
    cam.data.shift_x, cam.data.shift_y = SHIFT
if CROP:
    import common
    common.PREVIEW = True            # QA crops go to blender/previews/, never to the published out/
    out = render_to("goods/tumbler_crop.png")
else:
    out = render_to("goods/tumbler_close.png" if CLOSE else "goods/tumbler.png")
    if not CLOSE:
        vessels.fade_alpha_edges(out, margin=0.10)
