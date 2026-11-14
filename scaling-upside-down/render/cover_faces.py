# The cover blocks' front faces, recovered from the hero frame (the photo they were first cut from,
# make_textures.py's cover_blocks.jpg, is not in the repo). This prints where each block's front face sits in
# the story's frame-28 picture (the page's frame 89), so scripts/recover_faces.py can rectify it into
# tex/face_{up,side,down}.png.
#   blender -b -P cover_faces.py -- --w 1600 --h 1000 --out out/faces/corners.json
#   blender -b -P cover_faces.py -- --w 800 --h 500 --samples 16 --render 1 --out out/faces/check.png   (the stack, with tex/face_*.png)
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403
from mathutils import Vector  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
aim = bpy.data.objects.new("aim", None)
scene.collection.objects.link(aim)
focus = bpy.data.objects.new("focus", None)
scene.collection.objects.link(focus)
con = cam.constraints.new("TRACK_TO")
con.target = aim
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"
cam_d.sensor_width = 36
cam.location = (8.8, -13.4, 3.1)
aim.location = (-1.25, 0, 1.3)
focus.location = (0, 0, 1.5)
cam_d.lens = 78
cam_d.dof.use_dof = True
cam_d.dof.focus_object = focus
cam_d.dof.aperture_fstop = 4.0
r = scene.render
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100
bpy.context.view_layer.update()

if opt.get("render") == "1":
    area("key", (-9, -10, 16), (1, 0, 6), 10, 6500)
    area("fill", (14, -8, 6), (1, 0, 5), 12, 1800, "#f2f4ff")
    area("rim", (3, 9, 18), (1, 0, 8), 6, 1800)
    area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")
    area("top", (-4, -6, 26), (0, 0, 14), 8, 2600)
    r.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = int(opt["samples"])
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium Contrast"
    scene.view_settings.exposure = -1.05
    r.image_settings.file_format = "PNG"
    r.filepath = opt["out"]
    bpy.ops.render.render(write_still=True)
    print("CHECK DONE", flush=True)
else:
    out = {}
    W, H = r.resolution_x, r.resolution_y
    for k in ("up", "side", "down"):
        ob = scene.objects[k]
        mw = ob.matrix_world
        # the front face (local -y), corners top left, bottom left, bottom right, top right (as make_textures.py's quads)
        pts = []
        for sx, sz in ((-1, 1), (-1, -1), (1, -1), (1, 1)):
            v = world_to_camera_view(scene, cam, mw @ Vector((sx * 0.5, -0.5, sz * 0.5)))
            pts.append([round(v.x * W, 2), round((1 - v.y) * H, 2)])
        out[k] = pts
    os.makedirs(os.path.dirname(opt["out"]), exist_ok=True)
    json.dump({"w": W, "h": H, "faces": out}, open(opt["out"], "w"), indent=1)
    print("CORNERS", json.dumps(out), flush=True)
