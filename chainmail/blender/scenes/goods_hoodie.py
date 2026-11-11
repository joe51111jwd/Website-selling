"""goods/hoodie.png — three retail-folded hoodies (Cement / White / Black on top), fanned stack. The middle
(White) hoodie shows an empty rib cuff peeking out of its right fold, lying collapsed (plies touching, mouth
a dark slit) on the Cement hoodie below; waistband rib on every front fold.
blender -b --factory-startup -P blender/scenes/goods_hoodie.py -- [--preview] [--crop=x0,y0,x1,y1]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import apparel

reset()
setup_render(1600, 1600, samples=256, exposure=apparel.EXPOSURE_HOODIE)
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 8, 4, 3
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:                                  # house 256 spp; 0.01 noise threshold (OIDN cleans the rest)
    c.adaptive_threshold = 0.01
apparel.studio_apparel(target=(0, 0, 0.06), key=apparel.KEY)

roots = [apparel.folded_hoodie(c_, seed=s, cuff=cf) for c_, s, cf in (("Cement", 5, False), ("White", 17, "long"),
                                                                     ("Black", 29, False))]
apparel.stack(roots, [(0.060, 0.020, 3.5), (0.026, 0.006, -2.5), (-0.010, -0.004, 1.0)], sag=8.0)
apparel.dark_fill([roots[2]], energy=apparel.DARK_FILL_FLEECE)
# second, low frontal card for the Black hoodie's -Y waist fold (rib waistband)
apparel.dark_fill([roots[2]], energy=apparel.DARK_FILL_FRONT, offset=(0.1, -1.2, 0.25), size=1.0)
apparel.logo_fill(roots, energy=apparel.LOGO_FILL)

objs = [m for r in roots for m in r.children_recursive if m.type == "MESH"]
apparel.frame_camera(objs, az_deg=24, el_deg=34, lens=85, pad=apparel.PAD, shadow_grow=apparel.SHADOW_GROW,
                     pad_product=0.09, center="product", nudge=(-0.005, 0.006))
apparel.edge_fade()
out = render_to(apparel.crop_flag("goods/hoodie.png"))
apparel.alpha_edge_report(out)
apparel.alpha_ring_report(out)
