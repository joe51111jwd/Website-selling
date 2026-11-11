"""spirits/lineup.png — all seven 750 ml bottles in a row (2400x1400), heights rising to
the tallest in the centre, each with its own transmission-only back card (glowing core)
and strip rims both sides so every glass edge carries a clean light line.
Transparent background + shadow catcher.
   --close : crop camera on the centre three (preview QA only)."""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "lib"))
sys.path.insert(0, HERE)
from common import *
import vessels
import spirits_bottle as sb

CLOSE = "--close" in argv_flags()
ORDER = ["manojo", "johnnie-black", "jameson", "maestro-dobel", "kettle-one", "four-roses", "casamigos"]
PITCH = 0.122
# extra rotation (deg) so square/faceted bottles show two faces; round ones face the camera
# (the square scotch at 45 deg: both faces transmit the liquid, see spirits_bottle.SPIN)
ROT = {"johnnie-black": -45, "casamigos": -26, "maestro-dobel": 15}

reset()
sb.glass_render_settings()
s = bpy.context.scene
s.render.resolution_x, s.render.resolution_y = 2400, 1400
c = s.cycles
c.max_bounces = 20
c.transmission_bounces = 20
c.glossy_bounces = 6
c.transparent_max_bounces = 24
if not PREVIEW:
    c.adaptive_threshold = 0.01
    c.time_limit = 0         # no cap (round 2: a ceiling left the heels short of 512 spp)
studio("soft", key=1.0, hdri_strength=0.30, scale=1.15, target=(0, 0, 0.16))
# dark-field edge lines: two tall glossy/transmission-only strips at +-65 deg behind the row
sb.edge_strips((0.0, 0.0), 0.0, dist=1.05, zc=0.20, strength=5.0)
for o in bpy.data.objects:
    if o.name.startswith("Edge"):
        o.scale = (0.07, 1.4, 1)
bpy.data.objects["Rim"].data.use_shadow = False   # house rule: rim lights edges, no smudge
sb.aim_key((0, 0, 0.16), 0.0, 1.15)               # same steeper, more frontal key as the singles
sc = shadow_catcher()
sc.visible_transmission = False
sc.visible_glossy = False                          # caps/glass mirror the dark studio, not a white floor

n = len(ORDER)
for i, kind in enumerate(ORDER):
    x = (i - (n - 1) / 2) * PITCH
    y = 0.018 * abs(i - (n - 1) / 2) ** 1.3 * -1 + 0.03      # gentle arc: centre a touch back
    b = vessels.bottle(kind)
    b.location = (x, y, 0)
    b.rotation_euler = (0, 0, math.radians(ROT.get(kind, 0)))
    vessels.contact_occluder(b, kind)
    st, px, wrap = sb.BACKLIGHT[kind]
    if wrap:
        sb.wrap_card((x, y, 0.13), 0.0, sb.SCOTCH_LOBES, radius=0.064, height=0.70, strength=st * 1.05, name=f"WrapCard_{kind}")
    elif st > 0:
        # card width = pitch so neighbours abut; scale the falloff to keep the same core width
        pxw = max(0.35, px * (PITCH / 2 / 0.3) ** 2 * 1.6)
        sb.backlight_card((x, y, 0.13), 0.0, width=PITCH * 0.999, height=0.76, dist=0.17,
                          strength=st * 1.05, px=pxw, name=f"BackCard_{kind}")

# the catcher should record only direct shadows: hide the glassware from diffuse
# rays so indirect floor<->glass paths don't leave blotchy, denoised alpha patches
for o in bpy.data.objects:
    if o.type == "MESH" and o.name != sc.name and not o.name.startswith(("BackCard", "WrapCard", "Edge")):
        o.visible_diffuse = False

el = math.radians(13)    # low hero angle for the row (singles: 18 deg, goods: 30 deg)
if CLOSE:
    tgt, dist, lens = (0.0, 0.0, 0.2), 0.75, 85
else:
    tgt, dist, lens = (0.0, 0.0, 0.170), 1.92, 70
camera(loc=(tgt[0], tgt[1] - dist * math.cos(el), tgt[2] + dist * math.sin(el)), target=tgt, lens=lens)
if sb.CROP:
    import common
    common.PREVIEW = True     # QA crop (--crop x0,y0,x1,y1 [--spp N]) -> previews/, never out/
    out = render_to("spirits/lineup_crop.png")
else:
    out = render_to("spirits/lineup_close.png" if CLOSE else "spirits/lineup.png")
if not (CLOSE or sb.CROP):
    vessels.fade_alpha_edges(out, margin=(0.07, 0.07), edge=(0.006, 0.006))
