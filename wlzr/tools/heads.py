"""Blender scene for the four WLZR.TV heads (placeholder heads, real devices).

Each head wears the device for one desktop app: Videos (visor + video screen), Music (speaker helmet +
round LCD), Merch (LED glasses whose lenses are screens) and Tour (visor with a dates screen). Screens
render as holdouts (transparent holes), so the live HTML sits *under* the picture and the bezel frames it.

Run with Blender's Python (the `bpy` wheel works):
    python tools/heads.py -- <head.glb> <outdir> <variant> [samples]
Writes <variant>_raw.png (beauty, film-transparent), <variant>_led.png (LEDs only) and <variant>.json
(screen corners and speaker centres, in render pixels). tools/post.py tints, crops and packs them.

The head is Lee Perry-Smith's scan (CC BY 3.0, Infinite-Realities), shipped with three.js. It stands in
for the members' cut-outs until the band's own art lands.
"""
import bpy, bmesh, sys, json, math
from mathutils import Vector, Euler, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT, VARIANT = argv[0], argv[1], argv[2]
SAMPLES = int(argv[3]) if len(argv) > 3 else 96
W, H = 1000, 1100

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB)
for o in list(sc.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)
head = [o for o in sc.objects if o.type == "MESH"][0]
head.name = "head"
for p in head.data.polygons:
    p.use_smooth = True

def skin_material():
    """The scan's own colour and normal maps (they sit next to the .glb)."""
    import os
    d = os.path.dirname(GLB)
    m = bpy.data.materials.new("skin"); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    col = nt.nodes.new("ShaderNodeTexImage"); col.image = bpy.data.images.load(os.path.join(d, "Map-COL.jpg"))
    nrm = nt.nodes.new("ShaderNodeTexImage"); nrm.image = bpy.data.images.load(os.path.join(d, "Infinite-Level_02_Tangent_SmoothUV.jpg"))
    nrm.image.colorspace_settings.name = "Non-Color"
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.8
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(nrm.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.42
    b.inputs["Specular IOR Level"].default_value = 0.6
    return m

head.data.materials.clear(); head.data.materials.append(skin_material())

rig = bpy.data.objects.new("rig", None)
sc.collection.objects.link(rig)
head.parent = rig

LEDS, SCREENS, MARKS = [], {}, {}

# ---------- materials ----------
def mat(name, base=0.5, metal=0.0, rough=0.3, coat=0.0, emit=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (base, base, base, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.05
    if emit:
        b.inputs["Emission Color"].default_value = (1, 1, 1, 1)
        b.inputs["Emission Strength"].default_value = emit
    return m

SHELL = lambda: mat("shell", 0.62, 0.0, 0.22, 1.0)
CHROME = lambda: mat("chrome", 0.9, 1.0, 0.07)
RUBBER = lambda: mat("rubber", 0.035, 0.0, 0.55)
LENS = lambda: mat("lens", 0.02, 0.0, 0.04, 1.0)
CONE = lambda: mat("cone", 0.06, 0.0, 0.35, 0.6)
LED = lambda: mat("led", 1.0, 0.0, 0.3, 0.0, 5.0)

def finish(o, m, bevel=0.0, solid=0.0, sub=0, smooth=True, led=False):
    o.data.materials.clear()
    o.data.materials.append(m)
    if solid:
        s = o.modifiers.new("solid", "SOLIDIFY"); s.thickness = solid; s.offset = 0
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 4; b.limit_method = "ANGLE"
    if sub:
        s = o.modifiers.new("sub", "SUBSURF"); s.levels = sub; s.render_levels = sub
    if smooth and o.type == "MESH":
        for p in o.data.polygons:
            p.use_smooth = True
    o.parent = rig
    if led:
        LEDS.append(o)
    return o

def active():
    return bpy.context.active_object

# ---------- primitives ----------
C = Vector((-0.06, -0.2, 2.3))  # skull centre

def band(rx, ry, z0, z1, arc=None, tilt=0.0, m=None, solid=0.12, bevel=0.04, cy=C.y, verts=96):
    """Elliptical band around the head. arc=(a0,a1) in degrees keeps only that part (0 = front, -y)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1, depth=z1 - z0, end_fill_type="NOTHING",
                                        location=(C.x, cy, (z0 + z1) / 2))
    o = active()
    o.scale = (rx, ry, 1)
    bpy.ops.object.transform_apply(scale=True)
    if arc:
        bm = bmesh.new(); bm.from_mesh(o.data)
        dead = []
        for v in bm.verts:
            a = math.degrees(math.atan2(v.co.x, -v.co.y))
            if not (arc[0] - 0.01 <= a <= arc[1] + 0.01):
                dead.append(v)
        bmesh.ops.delete(bm, geom=dead, context="VERTS")
        bm.to_mesh(o.data); bm.free()
    o.rotation_euler = (math.radians(tilt), 0, 0)
    return finish(o, m or SHELL(), bevel=bevel, solid=solid, sub=1)

def box(loc, size, rot=(0, 0, 0), m=None, bevel=0.15, sub=2, led=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(r) for r in rot])
    o = active(); o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m or SHELL(), bevel=bevel, sub=sub, led=led)

def cyl(loc, r, depth, rot=(0, 0, 0), m=None, bevel=0.05, verts=64, sub=0, fill="NGON"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, end_fill_type=fill, location=loc,
                                        rotation=[math.radians(x) for x in rot])
    return finish(active(), m or SHELL(), bevel=bevel, sub=sub)

def torus(loc, R, r, rot=(0, 0, 0), m=None, led=False):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=72, minor_segments=16,
                                     location=loc, rotation=[math.radians(x) for x in rot])
    return finish(active(), m or SHELL(), led=led)

def sphere(loc, r, scale=(1, 1, 1), m=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=r, location=loc)
    o = active(); o.scale = scale
    return finish(o, m or SHELL())

def cone(loc, r1, r2, depth, rot, m=None):
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=r1, radius2=r2, depth=depth, end_fill_type="NOTHING",
                                    location=loc, rotation=[math.radians(x) for x in rot])
    return finish(active(), m or CONE(), solid=0.02)

def screen(name, center, w, h, rot=(90, 0, 0), round_=False):
    """A holdout rectangle (or disc). Its four corners go to the JSON, TL TR BR BL as seen from the front."""
    if round_:
        bpy.ops.mesh.primitive_circle_add(vertices=64, radius=w / 2, fill_type="NGON", location=center,
                                          rotation=[math.radians(x) for x in rot])
    else:
        bpy.ops.mesh.primitive_plane_add(size=1, location=center, rotation=[math.radians(x) for x in rot])
        active().scale = (w, h, 1)
        bpy.ops.object.transform_apply(scale=True)
    o = active(); o.name = "screen_" + name; o.parent = rig
    o.is_holdout = True
    # local corners: plane lies in XY before rotation; +Y local is "up" after rot (90,0,0) facing -y
    M = Matrix.Translation(Vector(center)) @ Euler([math.radians(x) for x in rot]).to_matrix().to_4x4()
    SCREENS[name] = {"m": M, "w": w, "h": h, "round": round_}
    return o

def strip(points, r=0.025, closed=True):
    """An LED line through 3D points."""
    cu = bpy.data.curves.new("strip", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new("POLY"); sp.points.add(len(points) - 1)
    for p, q in zip(sp.points, points):
        p.co = (*q, 1)
    sp.use_cyclic_u = closed
    o = bpy.data.objects.new("strip", cu); sc.collection.objects.link(o)
    o.data.materials.append(LED()); o.parent = rig; LEDS.append(o)
    return o

def rrect(cx, cy, cz, w, h, r, rot):
    """Rounded-rectangle points in a plane facing -y, rotated by rot (deg) about the centre."""
    pts = []
    for (qx, qz, a0) in [(w/2 - r, h/2 - r, 0), (-w/2 + r, h/2 - r, 90), (-w/2 + r, -h/2 + r, 180), (w/2 - r, -h/2 + r, 270)]:
        for i in range(7):
            a = math.radians(a0 + i * 15)
            pts.append(Vector((qx + r * math.cos(a), 0, qz + r * math.sin(a))))
    R = Euler([math.radians(x) for x in rot]).to_matrix()
    return [tuple(Vector((cx, cy, cz)) + R @ p) for p in pts]

def glasses(z=1.42, front=-2.47, m=None, lens=None, h=0.42):
    # a wraparound shade: front arc of a band, lens material, thin brow bar on top
    ry = abs(front - C.y)
    band(1.98, ry, z - h / 2, z + h / 2, arc=(-78, 78), m=lens or LENS(), solid=0.05, bevel=0.0)
    band(2.0, ry + 0.03, z + h / 2 - 0.02, z + h / 2 + 0.07, arc=(-82, 82), m=m or SHELL(), solid=0.07, bevel=0.02)

# ---------- devices ----------
def video():
    # visor band + a pill-shaped screen pod over the brow, a d-pad dial on the right, cup on the left
    band(1.78, 2.06, 2.05, 2.9, tilt=-4, solid=0.14)
    box((C.x, -2.42, 2.55), (2.75, 0.7, 1.25), rot=(-6, 0, 0), bevel=0.3, sub=2)
    box((C.x, -2.5, 2.55), (2.45, 0.6, 1.02), rot=(-6, 0, 0), m=RUBBER(), bevel=0.22, sub=2)
    screen("video", (C.x, -2.815, 2.56), 2.08, 0.8, rot=(90 - 6, 0, 0))
    strip(rrect(C.x, -2.82, 2.13, 1.5, 0.05, 0.02, (-6, 0, 0)), r=0.018)  # progress bar glow
    # dial
    cyl((1.86, -0.9, 2.45), 0.55, 0.32, rot=(0, 90, -22), bevel=0.1)
    cyl((2.03, -0.97, 2.45), 0.36, 0.12, rot=(0, 90, -22), m=RUBBER(), bevel=0.04)
    torus((2.05, -0.98, 2.45), 0.36, 0.035, rot=(0, 90, -22), led=True)
    sphere((2.1, -1.0, 2.45), 0.13, m=CHROME())
    # left cup + grille
    cyl((-1.95, -0.1, 1.45), 0.62, 0.36, rot=(0, 90, 8), bevel=0.12)
    for i in range(5):
        cyl((-2.14, -0.1 - 0.42 + i * 0.21, 1.45), 0.05, 0.06, rot=(0, 90, 0), m=RUBBER(), bevel=0.0, verts=16)
    glasses(m=SHELL(), h=0.46)

def music():
    # a speaker helmet: a dome, four drivers, ribs, and a round red-LCD pod on the forehead
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1, location=(C.x, -0.2, 2.2))
    o = active(); o.scale = (1.86, 2.2, 1.95); bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 2.0 + 0.12 * max(0, -v.co.y - 0.4)], context="VERTS")
    bm.to_mesh(o.data); bm.free()
    finish(o, SHELL(), solid=0.13, bevel=0.03, sub=1)
    def driver(loc, r, rot):
        cyl(loc, r * 1.12, 0.5, rot=rot, bevel=0.12)
        R = Euler([math.radians(x) for x in rot]).to_matrix(); n = R @ Vector((0, 0, 1))
        p = Vector(loc) + n * 0.26
        torus(tuple(p), r * 0.98, 0.07, rot=rot, m=CHROME())
        cone(tuple(p - n * 0.12), r * 0.92, r * 0.3, 0.25, rot=rot)
        sphere(tuple(p - n * 0.05), r * 0.28, m=RUBBER())
        torus(tuple(p + n * 0.02), r * 1.12, 0.03, rot=rot, led=True)
        return tuple(p)
    MARKS["speakers"] = [
        driver((1.95, -0.55, 1.75), 0.78, (0, 90, -38)),
        driver((-2.07, -0.55, 1.75), 0.78, (0, -90, 38)),
        driver((1.3, -1.2, 3.55), 0.55, (-38, 52, 0)),
        driver((-1.42, -1.2, 3.55), 0.55, (-38, -52, 0)),
    ]
    # ribs between drivers
    for s in (1, -1):
        torus((C.x + s * 1.15, -0.4, 2.75), 1.3, 0.06, rot=(70, s * 40, 0))
    # LCD pod
    pod = Vector((C.x, -2.12, 3.08)); n = Vector((0, -math.sin(math.radians(70)), math.cos(math.radians(70))))
    cyl(tuple(pod), 0.9, 0.5, rot=(70, 0, 0), bevel=0.14)
    torus(tuple(pod + n * 0.27), 0.76, 0.05, rot=(70, 0, 0), m=CHROME())
    screen("music", tuple(pod + n * 0.275), 1.4, 1.4, rot=(70, 0, 0), round_=True)
    # side LED bars
    for s in (1, -1):
        strip([(s * 1.55, -1.45, 2.55), (s * 1.3, -1.75, 2.9)], r=0.03, closed=False)

def merch():
    # LED goggles: two lens screens in housings that wrap a little, bridge, temples, forehead chip
    for s in (1, -1):
        x, yaw = s * 0.82, -s * 14
        box((x, -2.32, 1.42), (1.5, 0.42, 0.95), rot=(0, 0, yaw), bevel=0.16, sub=2)
        box((x, -2.4, 1.42), (1.32, 0.34, 0.8), rot=(0, 0, yaw), m=RUBBER(), bevel=0.12, sub=2)
        R = Euler((0, 0, math.radians(yaw))).to_matrix()
        c = Vector((x, -2.32, 1.42)) + R @ Vector((0, -0.215, 0))
        name = "lensR" if s > 0 else "lensL"   # lensL is on the viewer's left
        screen(name, tuple(c + R @ Vector((0, -0.065, 0))), 1.12, 0.62, rot=(90, 0, yaw))
        strip(rrect(*(c + R @ Vector((0, -0.02, 0))), 1.24, 0.74, 0.12, (0, 0, yaw)), r=0.03)
        box((s * 1.72, -0.7, 1.55), (0.14, 2.6, 0.22), m=SHELL(), bevel=0.06, sub=1)
        strip([(s * 1.8, -1.6, 1.62), (s * 1.8, -0.4, 1.62)], r=0.025, closed=False)
    box((C.x, -2.55, 1.5), (0.4, 0.3, 0.22), bevel=0.08, sub=1)
    box((C.x, -2.18, 2.45), (0.9, 0.3, 0.32), rot=(-12, 0, 0), bevel=0.1, sub=2)
    for i in range(3):
        sphere((C.x - 0.24 + i * 0.24, -2.34, 2.45), 0.05, m=LED()); LEDS.append(active())

def tour():
    # a full helmet shell, a big visor pod carrying the dates screen, a top rail with a lit tab, vents, mirror shades
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1, location=(C.x, -0.15, 2.15))
    o = active(); o.scale = (1.9, 2.22, 2.0); bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 1.85 + 0.25 * max(0, -v.co.y - 0.2)], context="VERTS")
    bm.to_mesh(o.data); bm.free()
    finish(o, SHELL(), solid=0.14, bevel=0.03, sub=1)
    box((C.x, -2.32, 2.72), (3.2, 0.6, 1.42), rot=(-12, 0, 0), bevel=0.36, sub=2)
    box((C.x, -2.44, 2.72), (2.92, 0.5, 1.18), rot=(-12, 0, 0), m=RUBBER(), bevel=0.26, sub=2)
    screen("tour", (C.x, -2.705, 2.75), 2.55, 0.98, rot=(90 - 12, 0, 0))
    # rail over the crown with a lit tab
    torus((C.x, -0.2, 2.2), 2.05, 0.09, rot=(0, 90, 0))
    box((C.x, -1.55, 3.85), (0.9, 0.5, 0.32), rot=(-48, 0, 0), bevel=0.12, sub=2)
    strip(rrect(C.x, -1.76, 3.98, 0.62, 0.14, 0.06, (-48, 0, 0)), r=0.022)
    for s in (1, -1):
        for i in range(4):
            box((s * (1.55 + i * 0.07), -1.5 + i * 0.32, 3.0 - i * 0.02), (0.1, 0.22, 0.5), rot=(0, s * 20, -s * 32),
                m=RUBBER(), bevel=0.04, sub=1)
        cyl((s * 1.92, -0.25, 1.55), 0.5, 0.3, rot=(0, s * 90, -s * 6), bevel=0.1)
        torus((s * 2.08, -0.25, 1.55), 0.34, 0.03, rot=(0, s * 90, -s * 6), led=True)
    glasses(m=SHELL(), lens=CHROME(), h=0.5)

VARIANTS = {
    # device, head rotation (x tilt, y roll, z yaw) in degrees
    "video": (video, (4, 0, 14)),
    "music": (music, (-2, -5, -10)),
    "merch": (merch, (3, 3, -16)),
    "tour": (tour, (0, 4, 18)),
}
make, rot = VARIANTS[VARIANT]
make()
rig.rotation_euler = [math.radians(r) for r in rot]

# neck cut: a holdout slab under a plane from below the chin (front) up to the skull base (back)
ang = math.atan2(0.85, 3.9)
bpy.ops.mesh.primitive_cube_add(size=1)
cut = active(); cut.scale = (9, 9, 6); cut.rotation_euler = (ang, 0, 0); cut.is_holdout = True
n = Vector((0, -math.sin(ang), math.cos(ang)))
cut.location = Vector((C.x, -0.45, -0.56)) - n * 3
cut.parent = rig

# ---------- light, camera ----------
def area(name, loc, size, power, target=(0, -0.5, 1.8), visible=False):
    L = bpy.data.lights.new(name, "AREA"); L.size = size; L.energy = power
    o = bpy.data.objects.new(name, L); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    o.visible_glossy = True
    return o

area("key", (-7, -9, 8), 5, 1800)
area("rimL", (-7, 6, 3.5), 3, 2600)
area("rimR", (7, 6, 4.5), 3, 2600)
area("fill", (8, -9, 0), 6, 260)
area("top", (0, -3, 12), 8, 500)

world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.03, 0.03, 0.035, 1)
bg.inputs["Strength"].default_value = 1
# a bright card above-front for chrome and gloss to catch
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, -6, 9), rotation=(math.radians(-35), 0, 0))
card = active(); cm = bpy.data.materials.new("card"); cm.use_nodes = True
nb = cm.node_tree.nodes; nb.remove(nb["Principled BSDF"])
em = nb.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 3
cm.node_tree.links.new(em.outputs[0], nb["Material Output"].inputs[0]); card.data.materials.append(cm)
card.visible_camera = False; card.visible_diffuse = False; card.visible_shadow = False

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 60; cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 24
cam.location = (0, -18.5, 1.2)
cam.rotation_euler = (Vector((0, 0, 1.9)) - cam.location).to_track_quat("-Z", "Y").to_euler()

r = sc.render
r.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
r.resolution_x, r.resolution_y = W, H; r.film_transparent = True
r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"

bpy.context.view_layer.update()

def px(p):
    v = world_to_camera_view(sc, cam, p)
    return [round(v.x * W, 2), round((1 - v.y) * H, 2)]

data = {"w": W, "h": H, "screens": {}, "marks": {}}
for name, s in SCREENS.items():
    M = rig.matrix_world @ s["m"]
    w, h = s["w"], s["h"]
    corners = [(-w/2, h/2), (w/2, h/2), (w/2, -h/2), (-w/2, -h/2)]  # TL TR BR BL (local +y = up)
    data["screens"][name] = {"quad": [px(M @ Vector((x, y, 0))) for x, y in corners], "round": s["round"]}
for k, pts in MARKS.items():
    data["marks"][k] = [px(rig.matrix_world @ Vector(p)) for p in pts]
json.dump(data, open(f"{OUT}/{VARIANT}.json", "w"), indent=1)

r.filepath = f"{OUT}/{VARIANT}_raw.png"
bpy.ops.render.render(write_still=True)

# LED pass: everything but the LEDs becomes a holdout
for o in sc.objects:
    if o.type in ("MESH", "CURVE") and o not in LEDS and o is not card:
        o.is_holdout = True
sc.cycles.samples = 24
r.filepath = f"{OUT}/{VARIANT}_led.png"
bpy.ops.render.render(write_still=True)
