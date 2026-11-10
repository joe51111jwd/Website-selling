"""QA only (preview): packed_box() with whatever item libs exist (proxies otherwise).
Not a published asset — kit/hero-open.png is rendered in a later phase."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

reset()
setup_render(2400, 1800, samples=256, preview=True)
kit.kit_lighting(scale=1.8, target=(0, 0, 0.08), key=0.9, fill=0.6, hdri_strength=0.25)
shadow_catcher()
kit.packed_box(open=True, number=1)
el, az = math.radians(48), math.radians(18)
tgt, dist, lens = (0.0, 0.03, 0.10), 1.9, 70
loc = (tgt[0] + dist * math.sin(az) * math.cos(el), tgt[1] - dist * math.cos(az) * math.cos(el),
       tgt[2] + dist * math.sin(el))
camera(loc=loc, target=tgt, lens=lens)
render_to("kit/packed-test.png")
