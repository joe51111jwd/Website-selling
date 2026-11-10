"""kit/closed.png — the closed rigid box, 3/4, foil wordmark, seal no. 01/48.
   --close : tight detail camera on the lid corner (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

CLOSE = "--close" in argv_flags()
reset()
setup_render(1600, 1600, samples=256)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=1.5, target=(0, 0, 0.08), key=0.8, fill=0.5, hdri_strength=0.2)
shadow_catcher()
kit.closed_box(number=1, edition=48)

el, az = math.radians(31), math.radians(34)
if CLOSE:
    tgt, dist, lens = (0.12, -0.08, 0.13), 0.75, 100
else:
    tgt, dist, lens = (0.0, 0.0, 0.07), 1.62, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
render_to("kit/closed_close.png" if CLOSE else "kit/closed.png")
