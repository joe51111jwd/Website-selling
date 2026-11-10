"""goods/longsleeve.png — three retail-folded long sleeves (White / Black / Dust on top), rib cuff peeking out.
blender -b --factory-startup -P blender/scenes/goods_longsleeve.py -- [--preview]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import apparel

reset()
setup_render(1600, 1600, samples=128, exposure=0.15)
c = bpy.context.scene.cycles                     # cloth needs few bounces; keeps the final < ~6 min
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 2, 2
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:
    c.adaptive_threshold = 0.012
studio("soft", key=0.6, hdri_strength=0.35, rotation_deg=30, target=(0, 0, 0.04), scale=0.45)
key = bpy.data.objects["Key"]                    # smaller, lower key: rakes the folds
key.data.size = key.data.size_y = 0.45
key.location = (-1.26, -0.45, 1.08)
key.data.energy *= 1.35
bpy.data.objects["Top"].data.energy *= 0.4
look_at(key, (0, 0, 0.04))
for n in ("Rim",):                               # rim lights the cloth but leaves no grey smudge
    bpy.data.objects[n].data.use_shadow = False
shadow_catcher()

roots = [apparel.folded_tee(c, long_sleeve=True, seed=s) for c, s in (("White", 41), ("Black", 53), ("Dust", 67))]
apparel.stack(roots, [(0.026, 0.032, 8.0), (0.013, 0.015, -4.5), (-0.002, -0.002, 1.0)], sag=1.5)

objs = [m for r in roots for m in r.children_recursive if m.type == "MESH"]
apparel.frame_camera(objs, az_deg=24, el_deg=34, lens=85, pad=0.075)
render_to("goods/longsleeve.png")
