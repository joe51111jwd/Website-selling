# The hardcover with the three blocks beside it. Run: blender -b -P book.py -- --w 1500 --h 1500 --samples 128 --out out/book.png
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scene_setup import *  # noqa: E402,F403

# ================= the book still =================
def box(name, size, loc, mats, uv_face_tex=None):
    """box with per-face materials: mats = {'front','back','left','right','top','bottom'}"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    keys = ["front", "back", "left", "right", "top", "bottom"]
    for k in keys:
        ob.data.materials.append(mats[k])
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    uvl = bm.loops.layers.uv.new("UVMap") if not bm.loops.layers.uv else bm.loops.layers.uv[0]
    for f in bm.faces:
        n = f.normal
        if n.y < -0.5: k = "front"
        elif n.y > 0.5: k = "back"
        elif n.x < -0.5: k = "left"
        elif n.x > 0.5: k = "right"
        elif n.z > 0.5: k = "top"
        else: k = "bottom"
        f.material_index = keys.index(k)
        if abs(n.z) > 0.5:
            ax, ay = Vector((1, 0, 0)), Vector((0, 1, 0))
        else:
            ay = Vector((0, 0, 1))
            ax = ay.cross(n).normalized()
        pts = [(l.vert.co.dot(ax), l.vert.co.dot(ay)) for l in f.loops]
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        for l, (u, v) in zip(f.loops, pts):
            l[uvl].uv = ((u - min(xs)) / (max(xs) - min(xs) or 1), (v - min(ys)) / (max(ys) - min(ys) or 1))
    bm.to_mesh(ob.data)
    bm.free()
    bev = ob.modifiers.new("bevel", "BEVEL")
    bev.width = 0.008
    bev.segments = 2
    bev.harden_normals = True
    bpy.ops.object.shade_smooth()
    ob.location = loc
    return ob

def tex_mat(name, image, rough=0.4, coat=0.0, colour=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    if image:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = img(image)
        t.extension = "EXTEND"
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    else:
        b.inputs["Base Color"].default_value = srgb(colour)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.3
    return m

COVER = os.path.join(TEX, "cover.jpg")
cov = bpy.data.images.load(COVER)
cover_m = bpy.data.materials.new("cover")
cover_m.use_nodes = True
cb = cover_m.node_tree.nodes["Principled BSDF"]
ct = cover_m.node_tree.nodes.new("ShaderNodeTexImage")
ct.image = cov
ct.extension = "EXTEND"
cover_m.node_tree.links.new(ct.outputs["Color"], cb.inputs["Base Color"])
cb.inputs["Roughness"].default_value = 0.42
cb.inputs["Coat Weight"].default_value = 0.25
cb.inputs["Coat Roughness"].default_value = 0.22
board = tex_mat("board", None, 0.6, 0.1, "#efe9dc")
spine_m = tex_mat("spine", "spine.png", 0.45, 0.2)
pages = tex_mat("pages", "pages.png", 0.85)

W, Hh, T = 2.0, 3.0, 0.38
book = []
book.append(box("front_board", (W, 0.03, Hh), (0, -T / 2 + 0.015, 0),
                {"front": cover_m, "back": board, "left": board, "right": board, "top": board, "bottom": board}))
book.append(box("back_board", (W, 0.03, Hh), (0, T / 2 - 0.015, 0),
                {"front": board, "back": board, "left": board, "right": board, "top": board, "bottom": board}))
book.append(box("spine_board", (0.03, T, Hh), (-W / 2 + 0.015, 0, 0),
                {"front": board, "back": board, "left": spine_m, "right": board, "top": board, "bottom": board}))
book.append(box("page_block", (W - 0.07, T - 0.06, Hh - 0.08), (0.02, 0, 0),
                {"front": pages, "back": pages, "left": pages, "right": pages, "top": pages, "bottom": pages}))
rig = bpy.data.objects.new("book", None)
scene.collection.objects.link(rig)
for o in book:
    o.parent = rig
rig.location = (-0.9, 0.2, Hh / 2 + 0.002)
rig.rotation_euler = (0, 0, math.radians(-26))

# the three blocks stand beside the book, as on the cover
for ob, (x, y, z, yaw) in zip(blocks, [(1.05, -0.75, 0.5, -14), (0.99, -0.7, 1.5, -10), (1.1, -0.78, 2.5, -16)]):
    sc = 0.62
    ob.scale = (sc, sc, sc)
    ob.location = (x, y, z * sc)
    ob.rotation_euler = (0, 0, math.radians(yaw))

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam_d.lens = 92
cam.location = (4.4, -13.0, 2.9)
look = Vector((0.05, 0, 1.45))
cam.rotation_euler = (look - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
cam_d.dof.use_dof = True
cam_d.dof.focus_distance = (Vector(cam.location) - Vector((-0.5, 0, 1.5))).length
cam_d.dof.aperture_fstop = 5.0
area("key", (-6, -7, 7), (0, 0, 1.4), 7, 1700)
area("fill", (8, -4, 2.5), (0, 0, 1.2), 9, 380, "#f2f4ff")
area("rim", (2, 6, 7), (0, 0, 2.5), 4, 700)
area("wall", (0, 4, 9), (0, 14, 4), 14, 1500, "#fbf6ee")

r = scene.render
r.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = int(opt["samples"])
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
r.resolution_x = int(opt["w"])
r.resolution_y = int(opt["h"])
r.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = -0.75
r.image_settings.file_format = "PNG"
r.filepath = opt["out"]
bpy.ops.render.render(write_still=True)
print("wrote", opt["out"])
