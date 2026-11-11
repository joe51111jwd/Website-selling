"""kit/product.png — the "your product" stand-in: two slim cans in a printed sleeve.
   --close : tight camera on the can tops (preview QA only)."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

CLOSE = "--close" in argv_flags()
reset()
setup_render(1200, 1200, samples=256)
kit.kit_render_budget(samples=256, threshold=0.01)
kit.kit_lighting(scale=0.55, target=(0, 0, 0.07), key=0.58, fill=0.45, hdri_strength=0.25, foil=0.0, top=1.3)
shadow_catcher()
kit.your_product()
el, az = math.radians(24), math.radians(28)
if CLOSE:
    tgt, dist, lens = (0.0, 0.0, 0.12), 0.32, 100
else:
    tgt, dist, lens = (0.0, 0.0, 0.066), 0.50, 85
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
kit.link_kit_lights()
if not CLOSE:
    kit.cutout_edge_fade()
render_to("kit/product_close.png" if CLOSE else "kit/product.png")
