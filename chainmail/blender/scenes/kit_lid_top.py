"""kit/lid-top.png — orthographic top-down lid tile (no seal; the site overlays numbers).
Lid fills ~84% of the frame width, transparent background, same light as closed.png."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import kit

reset()
setup_render(1200, 1200, samples=256)
kit.kit_render_budget(samples=112, threshold=0.015)
kit.kit_lighting(scale=1.5, target=(0, 0, 0.08), key=0.8, fill=0.5, hdri_strength=0.2, top=0.8, foil=0.0,
                 contact=0.0)
# Top light nudged toward -X/+Y so the 1.2 mm bevel on two lid edges catches a fine highlight
top = bpy.data.objects["Top"]
top.location.x -= 0.3
top.location.y += 0.3
look_at(top, (0, 0, kit.CLOSED_H))
# no shadow catcher: a clean tile for the 48-up edition grid
kit.closed_box(number=None)
camera(loc=(0, 0, 3.0), target=(0, 0, 0), ortho_scale=kit.LID_W / 0.84)
# top-down the mirror foil sees straight up: a tilted gradient card overhead gives it a
# chrome sweep from one end of the wordmark to the other (camera-invisible, foil-only)
g = kit.glint_strip("FoilGlint_top", (0.0, 0.0, 0.62), (0.0, 0.0, kit.CLOSED_H), size=(0.42, 0.2),
                    strength=1.2, gradient=True)
g.rotation_euler.y += math.radians(9)
# soft sheen card for the soft-touch top (wrap shells only), offset so the sheen falls off across the lid
area_light("WrapSheen_top", (-0.5, 0.45, 1.6), (0.0, 0.0, kit.CLOSED_H), size=1.4, energy=14,
           color=(0.97, 0.98, 1.0))
# low grazing card from upper-left (wrap shells only): the flat ink top stays dark (its
# diffuse is ~0), only the bevelled lid edges facing it pick up a fine highlight
area_light("WrapSheen_edge", (-1.2, 1.1, 0.42), (0.0, 0.0, kit.CLOSED_H), size=0.5, energy=120,
           color=(0.97, 0.98, 1.0))
kit.link_kit_lights()
render_to("kit/lid-top.png")
