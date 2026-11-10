"""kit/note-card.png — 5x7 in bone cotton note card, letterpress placeholder, slight angle.
   --close : raking close-up of the impression (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

CLOSE = "--close" in argv_flags()
reset()
setup_render(1200, 1200, samples=256, exposure=0.55)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=0.6, target=(0, 0, 0.0), key=1.0, fill=0.5, hdri_strength=0.25, foil=0.0)
# low raking light from the left: reveals the letterpress impression and the cotton tooth
area_light("Rake", (-0.55, 0.05, 0.16), (0, 0, 0), size=0.35, size_y=0.6, energy=9, color=(1.0, 0.97, 0.92))
shadow_catcher()
c = kit.note_card(text=("untitled", "(your logo here)"), number=1, edition=48)
c.rotation_euler = (0, 0, math.radians(-9))
el, az = math.radians(64), math.radians(8)
if CLOSE:
    tgt, dist, lens = (0.0, 0.025, 0.0), 0.30, 100
else:
    tgt, dist, lens = (0.0, -0.002, 0.0), 0.60, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
render_to("kit/note-card_close.png" if CLOSE else "kit/note-card.png")
