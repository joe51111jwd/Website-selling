"""kit/note-card.png — 5x7 in bone cotton note card, letterpress placeholder, slight angle.
   --close : raking close-up of the impression (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

CLOSE = "--close" in argv_flags()
reset()
setup_render(1200, 1200, samples=256, exposure=-0.05)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=0.6, target=(0, 0, 0.0), key=1.0, fill=0.5, hdri_strength=0.25, foil=0.0)
# raking light from the upper left (~25 deg): reveals the letterpress impression and the
# cotton tooth, and lays a soft 2-4 mm shadow along the card's right and bottom edges
el_r, az_r, d_r = math.radians(25), math.radians(150), 0.62
area_light("Rake", (d_r * math.cos(el_r) * math.cos(az_r), d_r * math.cos(el_r) * math.sin(az_r), d_r * math.sin(el_r)),
           (0, 0, 0), size=0.15, energy=7, color=(1.0, 0.97, 0.92))
bpy.data.objects["Rim"].data.color = (1.0, 0.99, 0.97)   # neutral rim: keep the cream stock warm
shadow_catcher()
c = kit.note_card(text=("untitled", "(your logo here)"), number=1, edition=48, curl=0.0016)
c.rotation_euler = (0, 0, math.radians(-9))
el, az = math.radians(64), math.radians(8)
if CLOSE:
    tgt, dist, lens = (0.0, 0.025, 0.0), 0.30, 100
else:
    tgt, dist, lens = (0.0, -0.002, 0.0), 0.60, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
kit.link_kit_lights(flag_seals=())
# low kicker from camera-right, linked to the card only: lets the 0.8 mm cobalt-painted
# edge read blue on the shaded right side too (grazing on the face, so the top barely changes)
kick = area_light("EdgeKick", (0.45, -0.16, 0.012), (0, 0, 0.0004), size=0.25, size_y=0.04, energy=2.5)
kick.light_linking.receiver_collection = kit._collection("kit_card_only", [c], "INCLUDE")
if not CLOSE:
    kit.cutout_edge_fade()
render_to("kit/note-card_close.png" if CLOSE else "kit/note-card.png")
