"""goods/longsleeve.png — three retail-folded long sleeves (White / Black / Dust on top); the top one
has its sleeve brought across the front with the open rib cuff on the chest (the brief's "show a sleeve
cuff"); the White and Black ones keep their sleeves tucked away (no second, redundant floor cuff).
blender -b --factory-startup -P blender/scenes/goods_longsleeve.py -- [--preview] [--crop=x0,y0,x1,y1]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import apparel

reset()
setup_render(1600, 1600, samples=256, exposure=apparel.EXPOSURE_TEE)
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 8, 4, 3
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:                                  # house 256 spp; 0.01 noise threshold (OIDN cleans the rest)
    c.adaptive_threshold = 0.01
apparel.studio_apparel(target=(0, 0, 0.04), key=apparel.KEY)

roots = [apparel.folded_tee(c_, long_sleeve=True, seed=s, sleeve=sl)
         for c_, s, sl in (("White", 41, "hidden"), ("Black", 53, "hidden"), ("Dust", 67, "front"))]
apparel.stack(roots, [(0.012, 0.010, 2.5), (0.006, 0.004, -2.0), (-0.002, -0.002, 0.6)], sag=15.0)
apparel.dark_fill([roots[1]], energy=apparel.DARK_FILL)

objs = [m for r in roots for m in r.children_recursive if m.type == "MESH"]
apparel.frame_camera(objs, az_deg=24, el_deg=34, lens=85, pad=apparel.PAD, shadow_grow=apparel.SHADOW_GROW,
                     pad_product=0.106, center="product", nudge=(-0.016, 0.009))
apparel.edge_fade()
out = render_to(apparel.crop_flag("goods/longsleeve.png"))
apparel.alpha_edge_report(out)
apparel.alpha_ring_report(out)
