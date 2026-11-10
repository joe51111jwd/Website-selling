"""kit/lid-top.png — orthographic top-down lid tile (no seal; the site overlays numbers).
Lid fills ~84% of the frame width, transparent background, same light as closed.png."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

reset()
setup_render(1200, 1200, samples=256)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=1.5, target=(0, 0, 0.08), key=0.8, fill=0.5, hdri_strength=0.2)
# no shadow catcher: a clean tile for the 48-up edition grid
kit.closed_box(number=None)
camera(loc=(0, 0, 3.0), target=(0, 0, 0), ortho_scale=kit.LID_W / 0.84)
render_to("kit/lid-top.png")
