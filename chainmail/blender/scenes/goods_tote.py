"""goods/tote.png — three bull denim totes (Black / Natural / White) standing in a slightly overlapping row.
blender -b --factory-startup -P blender/scenes/goods_tote.py -- [--preview] [--close] (BAG=0|1|2)"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from common import *
import numpy as np
import accessories as acc

CLOSE = "--close" in argv_flags()
reset()
setup_render(1600, 1600, samples=256, exposure=0.0)   # Khronos PBR Neutral: true swatches, no exposure hack
c = bpy.context.scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 3, 2
c.transmission_bounces, c.transparent_max_bounces = 2, 4
if not PREVIEW:
    c.adaptive_threshold = 0.01
studio("soft", key=0.8, hdri_strength=float(os.environ.get("HDRI", "0.25")), rotation_deg=30, target=(0, 0, 0.25), scale=0.9)
key = bpy.data.objects["Key"]
key.data.size = key.data.size_y = 1.1
key.location = tuple(map(float, os.environ.get("KEYLOC", "-1.25,-1.15,2.6").split(",")))
key.data.energy *= float(os.environ.get("KEYK", "0.80"))
look_at(key, (0, 0, 0.25))
key.data.color = (1.0, 0.995, 0.99)                # neutral key: White must read white, not cream
bpy.data.objects["Fill"].data.color = (1.0, 1.0, 1.0)
bpy.data.objects["Fill"].data.energy *= float(os.environ.get("FILLK", "0.45"))
bpy.data.objects["Top"].data.energy *= float(os.environ.get("TOPK", "0.4"))
bpy.data.objects["Rim"].data.use_shadow = False
acc.neutral_world(0.3)
shadow_catcher()

bags = []
# diagonal row receding to the back-left; Black turned a little more to camera so its print reads
BX, BY = map(float, os.environ.get("BLACKXY", "-0.585,0.42").split(","))
for col, (x, y, rz) in (("Black", (BX, BY, -2)), ("Natural", (-0.09, 0.11, -16)),
                        ("White", (0.26, -0.11, -24))):
    t = acc.tote(col)
    t.rotation_euler.z = math.radians(rz)
    t.location.x += x
    t.location.y += y
    bags.append(t)
bpy.context.view_layer.update()

# soft bounce card front-right, light-linked to the Black tote's cloth only (body, handles, hem,
# stitches; NOT the ToteInk print film, so the cobalt keeps its value): lifts the black denim out
# of the PBR Neutral toe so its twill and seams read, without touching albedo, the global key or
# the Natural / White bags. Camera-invisible, casts no shadow.
bfe = float(os.environ.get("BFILL", "0.8"))
if bfe > 0:
    blk = bags[0]
    Pb_ = acc._all_mesh_points(blk, 6)
    bc = Vector(((Pb_.min(0) + Pb_.max(0)) / 2).tolist())
    bf = area_light("BlackFill", bc + Vector(tuple(map(float, os.environ.get("BFLOC", "0.55,-0.85,0.10").split(",")))),
                    bc, size=1.0, size_y=0.8, energy=key.data.energy * bfe * 0.35,
                    color=tuple(map(float, os.environ.get("BFCOL", "0.955,0.975,1.0").split(","))))
    bf.data.use_shadow = False
    bf.visible_camera = False
    lc = bpy.data.collections.new("black_tote_receivers")
    for o in blk.children_recursive:
        if o.type == "MESH" and not o.name.startswith("ToteInk"):
            lc.objects.link(o)
    bf.light_linking.receiver_collection = lc

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
    # shadow footprint from the bag bodies only: the thin handles cast faint, fully diffused
    # shadows that fade_border() feathers anyway; including them over-pads the frame
    sh = acc.shadow_footprint(bags, stride=10, soft=0.3, zmax=0.42)
    pts = np.vstack([acc._all_mesh_points(o, 4) for o in bags] + [sh])
    cam = acc.frame_camera(pts, az_deg=24, el_deg=29, lens=85, pad=0.075)
    # frame_camera centres product + cast shadow; the shadow trails far to the right, which shoved the
    # bags left. Re-centre the bags themselves (lens shift) and zoom out a touch so the shadow's tail
    # runs into the long right-hand fade instead of a hard cut.
    from bpy_extras.object_utils import world_to_camera_view
    prod = np.vstack([acc._all_mesh_points(o, 6) for o in bags])
    us = np.array([world_to_camera_view(bpy.context.scene, cam, Vector(p_)).x for p_ in prod[::5]])
    pc = (us.min() + us.max()) / 2
    fk = float(os.environ.get("FRAMEK", "0.92")); tcx = float(os.environ.get("TCX", "0.485"))
    cam.data.lens *= fk
    cam.data.shift_x = 0.5 + (pc - 0.5) * fk - tcx
    if os.environ.get("CROP"):                     # detail check: full-res border render of a region
        x0, x1, y0, y1 = map(float, os.environ["CROP"].split(","))
        r = bpy.context.scene.render
        r.resolution_percentage = 100
        r.use_border = True; r.use_crop_to_border = True
        r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = x0, x1, y0, y1
        render_to("goods/tote_crop.png")
        raise SystemExit
    out = render_to("goods/tote.png")
    print("BORDER_ALPHA raw", acc.border_alpha(out))
    acc.fade_border(out, right_px=int(os.environ.get("RFADE", "220")))
    print("BORDER_ALPHA", acc.border_alpha(out))
