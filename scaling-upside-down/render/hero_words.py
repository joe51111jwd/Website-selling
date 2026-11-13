# The hero's words, carried by blocks (James, 13 Nov: "use the blocks to show all the text needed").
# Planks stamped with the book's words are set down on the same table as the cover stack, in the
# story's hero shot (story.py, frame 28: the picture the opening lands on), and rendered as
# transparent layers, each with its shadow on the table, so the page lays them over that picture.
#
#   blender -b -P hero_words.py -- --mode calib --w 800 --h 500 --samples 8 --out out/hero/calib.png
#   blender -b -P hero_words.py -- --mode layers --w 2000 --h 1250 --over 0.3 --samples 64 --out out/hero
#   blender -b -P hero_words.py -- --mode look --w 800 --h 500 --samples 16 --out out/hero/look.png
#
# calib: the cover stack alone, painted flat, to check it lands on the hero frame's own blocks.
# look:  everything opaque on the paper (a quick look at the arrangement).
# layers: words.png (SCALING and the two lines, with their shadows), join_obj.png (the red plank alone) and
#         join_shadow.png (its shadow alone), plus layout.json: where each plank's stamped face
#         sits in the picture (0-1), for the page's links and its fallbacks.
# The stamps are drawn by make_hero_labels.py into tex/ first.
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403
from mathutils import Vector  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

MODE = opt.get("mode", "layers")

# ---------- the hero shot (story.py, frame 28) ----------
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

area("key", (-9, -10, 16), (1, 0, 6), 10, 6500)
area("fill", (14, -8, 6), (1, 0, 5), 12, 1800, "#f2f4ff")
area("rim", (3, 9, 18), (1, 0, 8), 6, 1800)
area("wall", (0, 6, 16), (0, 15, 6), 18, 900, "#fbf6ee")
area("top", (-4, -6, 26), (0, 0, 14), 8, 2600)

r = scene.render
r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 6
# --over: picture added below the hero frame (a share of its height), same camera with the lens shifted
# down, so the frame's own rows are unchanged and the table in front of the stack continues under them
OVER = float(opt.get("over", "0"))
r.resolution_x = int(opt["w"])
r.resolution_y = round(int(opt["h"]) * (1 + OVER))
cam_d.sensor_fit = "HORIZONTAL"
cam_d.shift_y = -(int(opt["h"]) * OVER / 2) / int(opt["w"])
r.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -1.05
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"

cyc = scene.objects["cyc"]

# ---------- materials for stamped planks ----------
def stamped(name, base, label, ink, ink_rough=0.4):
    """base material (a raw wood or paint material) with a stamp printed on its front face (label's alpha)"""
    m = base.copy()
    m.name = name
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    col_link = bsdf.inputs["Base Color"].links[0]
    col_from = col_link.from_socket
    lt = nt.nodes.new("ShaderNodeTexImage")
    lt.image = img(label)
    lt.extension = "CLIP"
    lt.interpolation = "Cubic"
    uv = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(uv.outputs["UV"], lt.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(lt.outputs["Alpha"], mix.inputs["Factor"])
    nt.links.new(col_from, mix.inputs["A"])
    mix.inputs["B"].default_value = srgb(ink)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    rough_link = bsdf.inputs["Roughness"].links[0]
    rmix = nt.nodes.new("ShaderNodeMix")
    nt.links.new(lt.outputs["Alpha"], rmix.inputs["Factor"])
    nt.links.new(rough_link.from_socket, rmix.inputs["A"])
    rmix.inputs["B"].default_value = ink_rough
    nt.links.new(rmix.outputs["Result"], bsdf.inputs["Roughness"])
    return m

def flat(name, hexcol):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb(hexcol)
    return m

wood = raw_wood_material("plank_wood", seed=0.7)
red = paint_material("cta_red", "#97201a")

def plank(name, label, ink, base, loc, yaw, w, h, d):
    """a block w wide, d deep and h tall standing on the table (loc is its foot's centre), its front face
    (the -y side before the yaw) stamped with label"""
    front = stamped(f"{name}_front", base, label, ink) if label else base
    ob = block(name, (loc[0], loc[1], loc[2] + h / 2), math.radians(yaw), front, base, size=h, depth=d, width=w)
    # a thin plank's bevel follows its smallest side, not its height
    ob.modifiers["bevel"].width = 0.035 * min(w, h, d) * 2.2
    return ob

# ---------- the arrangement ----------
# The cover stack is about x -0.5..0.5, y -0.5..0.5, z 0..3 (1 m blocks). The camera is front right
# (x +8.8, y -13.4): a face turned +33 degrees looks straight at it. Sizes are the planks' (w, h, d)
# and the stamps (make_hero_labels.py) are drawn to the same shapes.
PLANKS = {
    # the title's first word, standing beside the stack as on the cover
    "scaling": dict(label="hero_scaling.png", ink="#17130f", base=wood, loc=(-0.98, 0.02, 0.0), yaw=8.0, w=0.66, h=3.0, d=0.6),
    # who wrote it and who it is for: two long planks, one laid on the other, in front of the cover and
    # low enough that the camera still sees all of DOWN over them
    "book": dict(label="hero_book.png", ink="#17130f", base=wood, loc=(1.72, -3.15, 0.28), yaw=24.0, w=2.3, h=0.28, d=0.42),
    "founders": dict(label="hero_founders.png", ink="#17130f", base=wood, loc=(1.67, -3.23, 0.0), yaw=26.0, w=2.5, h=0.28, d=0.5),
    # the one button: red, further forward and lower, so the camera sees the two lines over it
    "join": dict(label="hero_join.png", ink="#f1e7d2", base=red, loc=(2.85, -4.75, 0.0), yaw=28.0, w=2.35, h=0.27, d=0.48),
}
obs = {k: plank(k, **v) for k, v in PLANKS.items()}
stack = [scene.objects[k] for k in ("down", "side", "up")]

def faces_in_picture():
    """each plank's stamped (front) face corners in the picture, 0-1 from the top left"""
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for k, ob in obs.items():
        p = PLANKS[k]
        w, h, d = p["w"], p["h"], p["d"]
        mw = ob.matrix_world
        corners = [mw @ Vector((sx * w / 2, -d / 2, sz * h / 2)) for sx, sz in ((-1, 1), (1, 1), (1, -1), (-1, -1))]
        pts = []
        for c in corners:
            v = world_to_camera_view(scene, cam, c)
            pts.append([round(v.x, 5), round(1 - v.y, 5)])
        out[k] = pts
    return out

out = opt["out"]
if MODE == "calib":
    for k, ob in zip(("down", "side", "up"), stack):
        ob.data.materials.clear()
        ob.data.materials.append(flat(f"{k}_flat", {"down": "#ff00ff", "side": "#00ffff", "up": "#ffff00"}[k]))
    for ob in obs.values():
        ob.hide_render = True
    scene.cycles.use_denoising = False
    r.filepath = out
    bpy.ops.render.render(write_still=True)
    print("CALIB DONE", flush=True)
elif MODE == "look":
    r.filepath = out
    bpy.ops.render.render(write_still=True)
    print("LOOK DONE", flush=True)
else:
    os.makedirs(out, exist_ok=True)
    r.film_transparent = True
    # the planks stand in front of the focus: a little more depth of field keeps their words crisp (the
    # stack itself is not in these layers, so its own softness is the hero frame's)
    cam_d.dof.aperture_fstop = 9.0
    # the table and the cover stack are already in the hero frame, with the stack's own shadow: here they only
    # take the planks' shadows (the stack casts none, or the frame's would be doubled)
    cyc.is_shadow_catcher = True
    for ob in stack:
        ob.is_shadow_catcher = True
        ob.visible_shadow = False
    only = set(opt.get("only", "words,join_obj,join_shadow").split(","))
    def render_layer(name):
        if name not in only:
            return
        r.filepath = os.path.join(out, f"{name}.png")
        bpy.ops.render.render(write_still=True)
        print("LAYER", name, flush=True)
    # the title page: SCALING beside the stack and the two lines, with their shadows on the table and the stack
    for k, ob in obs.items():
        ob.hide_render = k not in ("scaling", "book", "founders")
    render_layer("words")
    # the button in two layers, so the page can set it down last and lift it under the pointer:
    # the plank alone (the table still lights it, but takes no shadow) ...
    for k, ob in obs.items():
        ob.hide_render = k != "join"
    cyc.is_shadow_catcher = False
    cyc.visible_camera = False
    for ob in stack:
        ob.visible_camera = False
    render_layer("join_obj")
    # ... and its shadow alone: the table takes it again, the plank seen only by the light
    cyc.is_shadow_catcher = True
    cyc.visible_camera = True
    obs["join"].visible_camera = False
    obs["join"].visible_glossy = False
    obs["join"].visible_transmission = False
    render_layer("join_shadow")
    obs["join"].visible_camera = True
    obs["join"].visible_glossy = True
    with open(os.path.join(out, "layout.json"), "w") as fh:
        # w × h: these layers; frame_h: the hero frame's own height inside them (the rest is the overscan below)
        json.dump({"w": r.resolution_x, "h": r.resolution_y, "frame_h": int(opt["h"]), "faces": faces_in_picture()}, fh, indent=1)
    print("LAYERS DONE", flush=True)
