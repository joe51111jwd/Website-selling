"""goods/tote.png — three bull denim totes (Black / Natural / White) standing in a slightly overlapping row.
blender -b --factory-startup -P blender/scenes/goods_tote.py -- [--preview] [--close] (BAG=0|1|2)"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import numpy as np
import accessories as acc

CLOSE = "--close" in argv_flags()
reset()
setup_render(1600, 1600, samples=128, exposure=0.85)
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 3, 2
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:
    c.adaptive_threshold = 0.015
studio("soft", key=0.8, hdri_strength=0.35, rotation_deg=30, target=(0, 0, 0.25), scale=0.9)
key = bpy.data.objects["Key"]
key.data.size = key.data.size_y = 1.1
key.location = (-1.0, -1.25, 2.9)
key.data.energy *= 1.4
look_at(key, (0, 0, 0.25))
bpy.data.objects["Fill"].data.energy *= 0.9
bpy.data.objects["Top"].data.energy *= 0.6
bpy.data.objects["Rim"].data.use_shadow = False
shadow_catcher()

bags = []
# diagonal row receding to the back-left; Black turned a little more to camera so its print reads
for col, (x, y, rz) in (("Black", (-0.46, 0.35, -2)), ("Natural", (-0.09, 0.11, -16)),
                        ("White", (0.26, -0.11, -24))):
    t = acc.tote(col)
    t.rotation_euler.z = math.radians(rz)
    t.location.x += x
    t.location.y += y
    bags.append(t)
bpy.context.view_layer.update()

if CLOSE:
    bag = bags[int(os.environ.get("BAG", "1"))]
    if os.environ.get("RIM"):
        body = [o for o in bag.children if o.name.startswith("ToteBody")][0]
        P = acc._all_mesh_points(body, 2)
        P = P[P[:, 2] > P[:, 2].max() - 0.09]
        cam = acc.frame_camera(P, az_deg=24, el_deg=29, lens=100, pad=0.02)
    else:
        cam = acc.frame_camera([bag], az_deg=24, el_deg=29, lens=100, pad=0.0)
        cam.data.lens = float(os.environ.get("LENS", "260"))
    bpy.context.scene.render.resolution_percentage = 50 if PREVIEW else 100
    render_to("goods/tote_close.png")
else:
    pts = np.vstack([acc._all_mesh_points(o, 4) for o in bags] + [acc.shadow_footprint(bags, stride=10)])
    acc.frame_camera(pts, az_deg=24, el_deg=29, lens=85, pad=0.075)
    out = render_to("goods/tote.png")
    print("BORDER_ALPHA raw", acc.border_alpha(out))
    acc.fade_border(out)
    print("BORDER_ALPHA", acc.border_alpha(out))
