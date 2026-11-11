"""goods/tumbler.png — four 25 oz tumblers (Matte Black, Primrose, Lavender, Dune):
two front, two back, the front-right one with its flip handle up.
   --close : tight camera on the lid + etched logo (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import vessels

CLOSE = "--close" in argv_flags()
reset()
setup_render(1600, 1600, samples=256)
c = bpy.context.scene.cycles
c.max_bounces = 8
c.glossy_bounces = 4
c.transmission_bounces = 4
c.diffuse_bounces = 3
if not PREVIEW:
    c.adaptive_threshold = 0.012
    c.time_limit = 340

studio("soft", key=1.0, hdri_strength=0.32, scale=0.62, target=(0, 0, 0.13))
bpy.data.objects["Rim"].data.use_shadow = False   # house rule: rim lights edges, no smudge
shadow_catcher()

el, az = math.radians(24), math.radians(24)
# (color, x, y, extra rotation deg, lid open)
# positions in camera-aligned (u across, v depth) coordinates: a zigzag back/front/back/front
LAYOUT = [
    ("Lavender",    -0.092,  0.050, -8, False),
    ("Matte Black", -0.046, -0.046,  3, False),
    ("Dune",         0.012,  0.058, 10, False),
    ("Primrose",     0.064, -0.030, -14, True),
]
for color, u, v, rz, open_ in LAYOUT:
    t = vessels.tumbler(color, lid_open=open_)
    t.location = (u * math.cos(az) - v * math.sin(az), u * math.sin(az) + v * math.cos(az), 0)
    t.rotation_euler = (0, 0, az + math.radians(rz))

if CLOSE:
    tgt, dist, lens = (0.068, 0.000, 0.262), 0.30, 100
    el2 = math.radians(34)
    loc = (tgt[0] + dist * math.sin(az) * math.cos(el2), tgt[1] - dist * math.cos(az) * math.cos(el2),
           tgt[2] + dist * math.sin(el2))
else:
    tgt, dist, lens = (-0.010, 0.005, 0.128), 1.03, 85
    loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
           tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
render_to("goods/tumbler_close.png" if CLOSE else "goods/tumbler.png")
