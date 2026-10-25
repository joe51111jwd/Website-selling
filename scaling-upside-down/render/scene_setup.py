# Shared studio for the story and the book shot: backdrop, wood and paint materials,
# lights, and the three cover blocks. story.py and book.py import this first.
import bpy, bmesh, math, random, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = {"w": "1920", "h": "1200", "samples": "128", "out": "out.png", "frame": "60", "preview": "0"}
for i in range(0, len(argv), 2):
    opt[argv[i].lstrip("-")] = argv[i + 1]
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)

def img(name, colour=True):
    im = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    if not colour:
        im.colorspace_settings.name = "Non-Color"
    return im

# ---------- materials ----------
def wood_nodes(nt, prefix, scale=1.0, rot=0.0):
    """texture coordinate -> mapping shared by the wood maps"""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    mp.inputs["Rotation"].default_value = (0, 0, rot)
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
    def tex(name, colour=True):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = img(f"{prefix}_{name}.jpg", colour)
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t
    return tex

def normal_from(nt, tex, strength):
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = strength
    nt.links.new(tex.outputs["Color"], nm.inputs["Color"])
    return nm

def paint_material(name, hexcol, face_image=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex = wood_nodes(nt, "fine_grained_wood", 1.0, math.pi / 2)
    grain = tex("diff")
    nor = tex("nor", False)
    rough = tex("rough", False)
    # paint over wood: tint the grain so it shows faintly through the colour
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(grain.outputs["Color"], bw.inputs["Color"])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.15
    ramp.inputs["From Max"].default_value = 0.6
    ramp.inputs["To Min"].default_value = 0.82
    ramp.inputs["To Max"].default_value = 1.08
    nt.links.new(bw.outputs["Val"], ramp.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    if face_image:
        ft = nt.nodes.new("ShaderNodeTexImage")
        ft.image = img(face_image)
        ft.extension = "EXTEND"
        uv = nt.nodes.new("ShaderNodeTexCoord")
        nt.links.new(uv.outputs["UV"], ft.inputs["Vector"])
        nt.links.new(ft.outputs["Color"], mul.inputs["A"])
        # the photo already carries the grain, so keep the multiply gentle
        ramp.inputs["To Min"].default_value = 0.94
        ramp.inputs["To Max"].default_value = 1.03
    else:
        mul.inputs["A"].default_value = srgb(hexcol)
    comb = nt.nodes.new("ShaderNodeCombineColor")
    for k in ("Red", "Green", "Blue"):
        nt.links.new(ramp.outputs["Result"], comb.inputs[k])
    nt.links.new(comb.outputs["Color"], mul.inputs["B"])
    nt.links.new(mul.outputs["Result"], bsdf.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = 0.42
    rr.inputs["To Max"].default_value = 0.68
    nt.links.new(rough.outputs["Color"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
    nt.links.new(normal_from(nt, nor, 0.55).outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Coat Weight"].default_value = 0.12
    bsdf.inputs["Coat Roughness"].default_value = 0.35
    return m

def raw_wood_material(name, label=None, seed=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex = wood_nodes(nt, "ash_veneer", 0.55, seed)
    diff = tex("diff")
    rough = tex("rough", False)
    nor = tex("nor", False)
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Value"].default_value = 0.98
    hsv.inputs["Saturation"].default_value = 1.4
    nt.links.new(diff.outputs["Color"], hsv.inputs["Color"])
    warm = nt.nodes.new("ShaderNodeMix")
    warm.data_type = "RGBA"
    warm.blend_type = "MULTIPLY"
    warm.inputs["Factor"].default_value = 1.0
    nt.links.new(hsv.outputs["Color"], warm.inputs["A"])
    warm.inputs["B"].default_value = srgb("#e9c493")
    col = warm.outputs["Result"]
    rough_out = rough.outputs["Color"]
    if label:
        lt = nt.nodes.new("ShaderNodeTexImage")
        lt.image = img(label)
        lt.extension = "CLIP"
        uv = nt.nodes.new("ShaderNodeTexCoord")
        nt.links.new(uv.outputs["UV"], lt.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        nt.links.new(lt.outputs["Alpha"], mix.inputs["Factor"])
        nt.links.new(col, mix.inputs["A"])
        mix.inputs["B"].default_value = srgb("#17130f")
        col = mix.outputs["Result"]
        rmix = nt.nodes.new("ShaderNodeMix")
        nt.links.new(lt.outputs["Alpha"], rmix.inputs["Factor"])
        nt.links.new(rough.outputs["Color"], rmix.inputs["A"])
        rmix.inputs["B"].default_value = 0.35
        rough_out = rmix.outputs["Result"]
    nt.links.new(col, bsdf.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = 0.45
    rr.inputs["To Max"].default_value = 0.8
    nt.links.new(rough_out, rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
    nt.links.new(normal_from(nt, nor, 0.7).outputs["Normal"], bsdf.inputs["Normal"])
    return m

# ---------- geometry ----------
def block(name, loc, rot_z, front_mat, other_mat, size=1.0, depth=1.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size, depth, size)
    bpy.ops.object.transform_apply(scale=True)
    me = ob.data
    me.materials.append(front_mat)
    me.materials.append(other_mat)
    bm = bmesh.new()
    bm.from_mesh(me)
    uvl = bm.loops.layers.uv.new("UVMap") if not bm.loops.layers.uv else bm.loops.layers.uv[0]
    for f in bm.faces:
        n = f.normal
        # face-local axes so each face shows its whole texture upright
        if abs(n.z) > 0.5:
            ax, ay = Vector((1, 0, 0)), Vector((0, 1, 0))
        else:
            ay = Vector((0, 0, 1))
            ax = ay.cross(n).normalized()
        pts = [(l.vert.co.dot(ax), l.vert.co.dot(ay)) for l in f.loops]
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        for l, (u, v) in zip(f.loops, pts):
            l[uvl].uv = ((u - min(xs)) / (max(xs) - min(xs)), (v - min(ys)) / (max(ys) - min(ys)))
        f.material_index = 0 if n.y < -0.5 else 1
    bm.to_mesh(me)
    bm.free()
    bev = ob.modifiers.new("bevel", "BEVEL")
    bev.width = 0.035 * size
    bev.segments = 4
    bev.harden_normals = True
    bpy.ops.object.shade_smooth()
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_z)
    return ob

def backdrop():
    # cyclorama: floor that bends up into a wall, extruded along x
    r = 7.0
    prof = [(-14 + i * (22 / 29), 0.0) for i in range(30)]
    for i in range(1, 25):
        a = (math.pi / 2) * i / 24
        prof.append((8 + r * math.sin(a), r - r * math.cos(a)))
    for i in range(1, 12):
        prof.append((8 + r, r + i * 2.0))
    verts, faces = [], []
    xs = [-40, -20, 0, 20, 40]
    for x in xs:
        for (y, z) in prof:
            verts.append((x, y, z))
    n = len(prof)
    for xi in range(len(xs) - 1):
        for pi in range(n - 1):
            a = xi * n + pi
            faces.append((a, a + 1, a + n + 1, a + n))
    me = bpy.data.meshes.new("cyc")
    me.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new("cyc", me)
    scene.collection.objects.link(ob)
    m = bpy.data.materials.new("paper")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb("#f3ede2")
    b.inputs["Roughness"].default_value = 0.92
    me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    return ob

# ---------- world, lights, render ----------
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = img("studio.hdr")
bg = world.node_tree.nodes["Background"]
bg.inputs["Strength"].default_value = 0.55
world.node_tree.links.new(env.outputs["Color"], bg.inputs["Color"])

def area(name, loc, target, size, power, colour="#fff4e6"):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "DISK"
    ld.size = size
    ld.energy = power
    ld.color = srgb(colour)[:3]
    ob = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob

backdrop()
paints = {
    "up": paint_material("up_paint", "#1f4a2b"),
    "side": paint_material("side_paint", "#e09a24"),
    "down": paint_material("down_paint", "#97201a"),
}
faces = {k: paint_material(f"{k}_face", "#000000", f"face_{k}.png") for k in paints}

S = 1.0  # block size
cover = [  # bottom to top: (key, x offset, y offset, yaw)
    ("down", 0.03, 0.0, math.radians(-2.5)),
    ("side", -0.06, 0.02, math.radians(1.8)),
    ("up", 0.02, -0.01, math.radians(-1.2)),
]
blocks = []
z = S / 2
for key, dx, dy, yaw in cover:
    blocks.append(block(key, (dx, dy, z), yaw, faces[key], paints[key]))
    z += S
