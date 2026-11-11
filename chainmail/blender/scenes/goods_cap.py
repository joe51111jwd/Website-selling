"""goods/cap.png — two unstructured dad caps: Black 3/4 front, White behind, turned to show the strap.
blender -b --factory-startup -P blender/scenes/goods_cap.py -- [--preview] [--close] [--closeback]"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import numpy as np
import accessories as acc

FL = argv_flags()
CLOSE = "--close" in FL
reset()
setup_render(1600, 1600, samples=256, exposure=0.0)   # Khronos PBR Neutral: true swatches, no exposure hack
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 8, 3, 3
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:
    c.adaptive_threshold = 0.012
studio("soft", key=0.75, hdri_strength=float(os.environ.get("HDRI", "0.25")), rotation_deg=30, target=(0, 0, 0.05), scale=0.45)
key = bpy.data.objects["Key"]
key.data.size = key.data.size_y = 0.55
key.location = (-0.85, -0.70, 1.25)
look_at(key, (0, 0, 0.05))
key.data.energy *= float(os.environ.get("KEYK", "1.1"))
bpy.data.objects["Rim"].data.use_shadow = False
bpy.data.objects["Top"].data.energy *= float(os.environ.get("TOPK", "0.4"))
fill = bpy.data.objects["Fill"]
fill.data.energy *= float(os.environ.get("FILLK", "0.6"))
acc.neutral_world(0.3)
shadow_catcher()

WZ = float(os.environ.get("WZ", "162")); BZ = float(os.environ.get("BZ", "-26"))
WX, WY = float(os.environ.get("WX", "-0.02")), float(os.environ.get("WY", "0.29"))
white = acc.cap("White")
white.rotation_euler.z += math.radians(WZ)
white.location = (WX, WY, white.location.z)
# the White cap shows its back: its front embroidery is on the far side, and at this turn only a
# 2 px sliver of a glyph grazes the crown silhouette (reads as stray text) -> keep it out of camera
for o in white.children_recursive:
    if o.name.startswith("CapEmbroidery"):
        o.visible_camera = False
black = acc.cap("Black")
black.rotation_euler.z += math.radians(BZ)
black.location = (-0.03, -0.03, black.location.z)
bpy.context.view_layer.update()
P_ = acc._all_mesh_points(black, 3); print('CAPDIM', P_.max(0) - P_.min(0))

# soft low bounce card front-right, light-linked to the Black cap only: lifts the crushed bill and
# crown out of the toe (stitch rows + twill read) without touching albedo, the White cap or the shadow
bfe = float(os.environ.get("BFILL", "1.15"))
if bfe > 0:
    bc = Vector(((P_.min(0) + P_.max(0)) / 2).tolist())
    bf = area_light("BlackFill", bc + Vector(tuple(map(float, os.environ.get("BFLOC", "0.45,-0.60,0.38").split(",")))), bc,
                    size=0.9, size_y=0.6,
                    energy=key.data.energy * bfe * 0.30, color=(1.0, 0.99, 0.98))
    bf.data.use_shadow = False
    bf.visible_camera = False
    lc = bpy.data.collections.new("black_cap_receivers")
    for o in black.children_recursive:
        if o.type == "MESH" and not o.name.startswith("CapEmbroidery"):   # satin keeps its true cobalt
            lc.objects.link(o)
    bf.light_linking.receiver_collection = lc

if "--closeback" in FL:
    cam = acc.frame_camera([white], az_deg=14, el_deg=31, lens=100, pad=0.0)
    cam.data.lens = 125
    bpy.context.scene.render.resolution_percentage = 50 if PREVIEW else 100
    render_to("goods/cap_closeback.png")
elif CLOSE:
    cam = acc.frame_camera([black], az_deg=10, el_deg=26, lens=100, pad=0.0)
    cam.data.lens = 300
    bpy.context.scene.render.resolution_percentage = 50 if PREVIEW else 100
    render_to("goods/cap_close.png")
else:
    pts = np.vstack([acc._all_mesh_points(o, 3) for o in (black, white)] +
                    [acc.shadow_footprint([black, white], stride=8)])
    acc.frame_camera(pts, az_deg=16, el_deg=31, lens=85, pad=0.075)
    if os.environ.get("CROP"):                     # detail check: full-res border render of a region
        x0, x1, y0, y1 = map(float, os.environ["CROP"].split(","))
        r = bpy.context.scene.render
        r.resolution_percentage = 100
        r.use_border = True; r.use_crop_to_border = True
        r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = x0, x1, y0, y1
        render_to("goods/cap_crop.png")
        raise SystemExit
    out = render_to("goods/cap.png")
    print("BORDER_ALPHA raw", acc.border_alpha(out))
    acc.fade_border(out)
    print("BORDER_ALPHA", acc.border_alpha(out))
