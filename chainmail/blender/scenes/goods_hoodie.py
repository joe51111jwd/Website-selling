"""goods/hoodie.png — three retail-folded hoodies (Cement / White / Black on top), fanned stack.
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

roots = [apparel.folded_hoodie(c_, seed=s) for c_, s in (("Cement", 5), ("White", 17), ("Black", 29))]
apparel.stack(roots, [(0.040, 0.014, 3.0), (0.020, 0.007, -2.0), (-0.002, -0.002, 0.5)], sag=8.0)

objs = [m for r in roots for m in r.children_recursive if m.type == "MESH"]
apparel.frame_camera(objs, az_deg=24, el_deg=34, lens=85, pad=0.075, shadow_grow=(0.01, 0.04))
apparel.edge_fade()
out = render_to(apparel.crop_flag("goods/hoodie.png"))
apparel.alpha_edge_report(out)
