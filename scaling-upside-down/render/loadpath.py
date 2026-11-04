# "Load Path": the focus version's film (/focus). An architect's massing model on a stone site board,
# shot like model photography in low raking sun. No words anywhere: the picture tells it.
#
# Act one, the trap: a modest white block (the cover's three tiers) is grown by doing everything at once:
# volumes dropped on top, annexes slid in from the sides, a piece pulled away, all overlapping and all
# white. It goes top-heavy, leans, racks and falls. The wreckage is cleared into the board.
# Act two, the cycle: a concrete raft and core go in first. Then the tower is built in three separate
# moves, again and again, each with one colour and one direction, and only that move on screen:
#   UP    green: storeys grow up out of the tower's top, following the core (it sways a little)
#   SIDE  ochre: walls slide in level from both sides and lock on; the sway snaps plumb
#   DOWN  red:   the annex that came up with the growth is lowered away into the ground
# Colour marks only the work being done: a piece settles to white once it is in place, so the finished
# building is all plaster and stone. Three cycles; the third climbs out through the exact frame the first
# tower fell in, and the camera pulls back to the whole tower, far taller, plumb.
#
#   blender -b -P loadpath.py -- --blend loadpath.blend                       build and save the scene
#   blender -b -P loadpath.py -- --frames 1,80,130,200 --w 800 --h 500 --samples 16 --out out/lpb/b
#   (then render_loadpath.sh renders the saved scene's frames into out/lseq)
import bpy, math, sys, random
from mathutils import Vector, Matrix, Quaternion, Euler

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default
W, H = int(arg("--w", "1600")), int(arg("--h", "1000"))
SAMPLES = int(arg("--samples", "12"))
BLEND = arg("--blend", "")
OUT = arg("--out", "")
FRAMES = [int(f) for f in arg("--frames", "").split(",") if f]
THREADS = int(arg("--threads", "0"))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
random.seed(7)

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

# ================================================================ materials
PLASTER, UPC, SIDEC, DOWNC = "#ece6db", "#28503a", "#a07a34", "#8e3228"

def mineral(name, hexcol, rough=0.88, bump=0.03, mottle=0.03, scale=38.0, reveals=0.0, phase=False):
    """Cast plaster / concrete / stone: matte, faint mottling, fine pitted bump. reveals: storey lines
    every that many units up the object (a building, not a box). phase: the object's colour (red, green
    and blue channels, 0-1) tints it toward the Up, Side and Down pigments: colour marks the work being done."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = 0.3
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = 6.0
    nz.inputs["Roughness"].default_value = 0.6
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.4
    ramp.inputs["From Max"].default_value = 0.7
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Value"])
    # a per-object value shift (no two casts are quite the same)
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    jit = nt.nodes.new("ShaderNodeMapRange")
    jit.inputs["To Min"].default_value = 0.97
    jit.inputs["To Max"].default_value = 1.02
    nt.links.new(oi.outputs["Random"], jit.inputs["Value"])

    def mottled(hexc):
        base = srgb(hexc)
        dark = tuple(c * (1 - mottle * 3) for c in base[:3]) + (1.0,)
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs[6].default_value = base
        mix.inputs[7].default_value = dark
        nt.links.new(ramp.outputs["Result"], mix.inputs["Factor"])
        return mix.outputs[2]

    col = mottled(hexcol)
    if phase:
        sepc = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(oi.outputs["Color"], sepc.inputs["Color"])
        for ch, hexc in ((0, UPC), (1, SIDEC), (2, DOWNC)):
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            nt.links.new(sepc.outputs[ch], mix.inputs["Factor"])
            nt.links.new(col, mix.inputs[6])
            nt.links.new(mottled(hexc), mix.inputs[7])
            col = mix.outputs[2]
    if reveals:
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["Object"], sep.inputs[0])
        mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 1 / reveals
        nt.links.new(sep.outputs[2], mul.inputs[0])
        pp = nt.nodes.new("ShaderNodeMath"); pp.operation = "PINGPONG"; pp.inputs[1].default_value = 0.5
        nt.links.new(mul.outputs[0], pp.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.03
        nt.links.new(pp.outputs[0], lt.inputs[0])
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        gs = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(geo.outputs["Normal"], gs.inputs[0])
        ab = nt.nodes.new("ShaderNodeMath"); ab.operation = "ABSOLUTE"
        nt.links.new(gs.outputs[2], ab.inputs[0])
        vert = nt.nodes.new("ShaderNodeMath"); vert.operation = "LESS_THAN"; vert.inputs[1].default_value = 0.5
        nt.links.new(ab.outputs[0], vert.inputs[0])
        k = nt.nodes.new("ShaderNodeMath"); k.operation = "MULTIPLY"
        nt.links.new(lt.outputs[0], k.inputs[0]); nt.links.new(vert.outputs[0], k.inputs[1])
        k2 = nt.nodes.new("ShaderNodeMath"); k2.operation = "MULTIPLY"; k2.inputs[1].default_value = 0.3
        nt.links.new(k.outputs[0], k2.inputs[0])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
        nt.links.new(k2.outputs[0], mix.inputs["Factor"])
        nt.links.new(col, mix.inputs[6])
        mix.inputs[7].default_value = srgb("#8a8174")
        col = mix.outputs[2]
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    nt.links.new(col, hsv.inputs["Color"])
    nt.links.new(jit.outputs["Result"], hsv.inputs["Value"])
    nt.links.new(hsv.outputs["Color"], b.inputs["Base Color"])
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = scale * 9
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = bump
    bm.inputs["Distance"].default_value = 0.002
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"; add.inputs[1].default_value = 0.3
    nt.links.new(vor.outputs["Distance"], add.inputs[0])
    nt.links.new(nz.outputs["Fac"], add.inputs[2])
    nt.links.new(add.outputs["Value"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m

STOREY = 0.36
M = {
    "plaster": mineral("plaster", PLASTER, reveals=0.12, phase=True),
    "concrete": mineral("concrete", "#c8c1b5", rough=0.9, bump=0.05, mottle=0.05, scale=22),
}

def boxmesh(name, size, bottom=True):
    sx, sy, sz = size[0] / 2, size[1] / 2, size[2]
    z0, z1 = (0, sz) if bottom else (-sz / 2, sz / 2)
    v = [(-sx, -sy, z0), (sx, -sy, z0), (sx, sy, z0), (-sx, sy, z0), (-sx, -sy, z1), (sx, -sy, z1), (sx, sy, z1), (-sx, sy, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    return me

def block(name, size, loc, mat="plaster", bevel=0.007, yaw=0.0, parent=None, bottom=True):
    """a cast volume, its origin at the middle of its underside (or its centre: physics needs that)"""
    me = boxmesh(name, size, bottom)
    me.materials.append(M[mat])
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = Euler((0, 0, math.radians(yaw))).to_quaternion()
    if parent:
        ob.parent = parent
    if bevel:
        md = ob.modifiers.new("bev", "BEVEL")
        md.width = bevel
        md.segments = 3
        md.limit_method = "ANGLE"
    ob.color = (0, 0, 0, 1)  # no tint
    return ob

def key(ob, f, loc=None, quat=None, scale=None, interp="BEZIER", ease="AUTO"):
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
    if quat is not None:
        ob.rotation_quaternion = quat
        ob.keyframe_insert("rotation_quaternion", frame=f)
    if scale is not None:
        ob.scale = scale
        ob.keyframe_insert("scale", frame=f)
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            if kp.co[0] == f:
                kp.interpolation = interp
                if interp != "BEZIER" and interp != "LINEAR" and interp != "CONSTANT":
                    kp.easing = ease

TINT = {"tu": 0, "ts": 1, "td": 2}
def tint(ob, prop, f, v, interp="LINEAR"):
    i = TINT[prop]
    c = list(ob.color)
    c[i] = v
    ob.color = c
    ob.keyframe_insert("color", index=i, frame=f)
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path == "color" and fc.array_index == i:
            for kp in fc.keyframe_points:
                if kp.co[0] == f:
                    kp.interpolation = interp

def widen(ob, f_on, f_off, by=1.012):
    """ob's footprint `by` wider from f_on to f_off (its x and y scale, stepped, not eased)"""
    for fc in list(ob.animation_data.action.fcurves):
        if fc.data_path == "scale" and fc.array_index in (0, 1):
            ob.animation_data.action.fcurves.remove(fc)
    for fr, v in ((f_on, by), (f_off, 1.0)):
        for i in (0, 1):
            ob.scale[i] = v
            ob.keyframe_insert("scale", index=i, frame=fr)
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path == "scale" and fc.array_index in (0, 1):
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"

def show(ob, f_on=None, f_off=None):
    """hidden before f_on and from f_off on"""
    if f_on is not None:
        ob.hide_render = True
        ob.keyframe_insert("hide_render", frame=f_on - 1)
        ob.hide_render = False
        ob.keyframe_insert("hide_render", frame=f_on)
    if f_off is not None:
        ob.hide_render = False
        ob.keyframe_insert("hide_render", frame=f_off - 1)
        ob.hide_render = True
        ob.keyframe_insert("hide_render", frame=f_off)
        if f_on is None:
            ob.hide_render = False
    for fc in (ob.animation_data.action.fcurves if ob.animation_data else []):
        if fc.data_path == "hide_render":
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"

Q0 = Quaternion((1, 0, 0, 0))
def q_y(deg):
    return Euler((0, math.radians(deg), 0)).to_quaternion()

# ================================================================ the set
def sweep():
    r = 6.0
    prof = [(-60 + i * (66 / 24), 0.0) for i in range(25)]
    for i in range(1, 25):
        a = (math.pi / 2) * i / 24
        prof.append((6 + r * math.sin(a), r - r * math.cos(a)))
    for i in range(1, 14):
        prof.append((6 + r, r + i * 3.0))
    verts, faces = [], []
    xs = [-80, -30, -10, 0, 10, 30, 80]
    for x in xs:
        for (y, z) in prof:
            verts.append((x, y, z))
    n = len(prof)
    for xi in range(len(xs) - 1):
        for pi in range(n - 1):
            a = xi * n + pi
            faces.append((a, a + 1, a + n + 1, a + n))
    me = bpy.data.meshes.new("sweep")
    me.from_pydata(verts, [], faces)
    m = bpy.data.materials.new("paper")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb("#efe7da")
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Specular IOR Level"].default_value = 0.15
    me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("sweep", me)
    scene.collection.objects.link(ob)
sweep()

PT = 0.16  # the board's top
BOARD = (7.6, 6.6)
def grid_stone():
    m = mineral("gridstone", "#c4baab", rough=0.72, bump=0.012, mottle=0.035, scale=5)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    src = b.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    def line(axis):
        mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 1 / 0.45
        nt.links.new(sep.outputs[axis], mul.inputs[0])
        fr = nt.nodes.new("ShaderNodeMath"); fr.operation = "PINGPONG"; fr.inputs[1].default_value = 0.5
        nt.links.new(mul.outputs[0], fr.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.01
        nt.links.new(fr.outputs[0], lt.inputs[0])
        return lt
    mx = nt.nodes.new("ShaderNodeMath"); mx.operation = "MAXIMUM"
    nt.links.new(line(0).outputs[0], mx.inputs[0]); nt.links.new(line(1).outputs[0], mx.inputs[1])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], nz.inputs[0])
    top = nt.nodes.new("ShaderNodeMath"); top.operation = "GREATER_THAN"; top.inputs[1].default_value = 0.9
    nt.links.new(nz.outputs[2], top.inputs[0])
    k = nt.nodes.new("ShaderNodeMath"); k.operation = "MULTIPLY"
    nt.links.new(mx.outputs[0], k.inputs[0]); nt.links.new(top.outputs[0], k.inputs[1])
    k2 = nt.nodes.new("ShaderNodeMath"); k2.operation = "MULTIPLY"; k2.inputs[1].default_value = 0.18
    nt.links.new(k.outputs[0], k2.inputs[0])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(k2.outputs[0], mix.inputs["Factor"])
    nt.links.new(src, mix.inputs[6])
    mix.inputs[7].default_value = srgb("#6d6458")
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    return m
M["gridstone"] = grid_stone()
board = block("board", (BOARD[0], BOARD[1], PT), (0.4, -0.7, 0), "gridstone", bevel=0.01)

# light: a low, hard-ish sun from front-left (long shadows back and right), a cool area fill, a warm world
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#e6ddcf")
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.26
sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = 5.0
sun_d.angle = math.radians(1.4)
sun_d.color = srgb("#fff1dc")[:3]
sun = bpy.data.objects.new("sun", sun_d)
scene.collection.objects.link(sun)
sun.rotation_euler = Vector((0.6, 0.68, -0.33)).normalized().to_track_quat("-Z", "Y").to_euler()
fill_d = bpy.data.lights.new("fill", "AREA")
fill_d.shape = "DISK"
fill_d.size = 10
fill_d.energy = 160
fill_d.color = srgb("#e9eef5")[:3]
fill = bpy.data.objects.new("fill", fill_d)
scene.collection.objects.link(fill)
fill.location = (8, -7, 5)
fill.rotation_euler = (Vector((0, 0, 1.8)) - fill.location).to_track_quat("-Z", "Y").to_euler()

# ================================================================ act one: the trap (all at once, all white)
pile_piv = bpy.data.objects.new("pile_pivot", None)  # the heel the pile leans and tips over
scene.collection.objects.link(pile_piv)
HEEL = 0.37
pile_piv.location = (HEEL, 0, PT)
pile_piv.rotation_mode = "QUATERNION"

LEVELS = [  # (w, d, h, dx, dy, yaw) the cover's three tiers, then everything piled on (chunky masses)
    (0.74, 0.70, 0.32, 0.00, 0.00, 0.0), (0.72, 0.70, 0.32, 0.012, -0.01, 2.5), (0.73, 0.69, 0.32, -0.008, 0.012, -1.5),
    (0.90, 0.84, 0.36, 0.08, 0.02, 0.0), (1.04, 0.92, 0.42, 0.18, -0.03, 1.2), (1.18, 0.98, 0.36, 0.30, 0.02, -1.0),
    (1.32, 1.04, 0.42, 0.42, -0.02, 1.5), (1.46, 1.10, 0.36, 0.54, 0.03, -1.0),
]
DROP_AT = [None, None, None, 17, 27, 37, 48, 59]  # when each piled volume lands (drops over 7 frames)
pile = []
z = 0.0
for i, (w, d, h, dx, dy, yaw) in enumerate(LEVELS):
    zc = z + h / 2
    ob = block(f"pile{i}", (w, d, h), (dx - HEEL, dy, zc), yaw=yaw, parent=pile_piv, bottom=False)
    ob["seat"] = (dx - HEEL, dy, zc)
    if DROP_AT[i]:
        land = DROP_AT[i]
        q = ob.rotation_quaternion.copy()
        show(ob, f_on=land - 7)
        key(ob, land - 7, loc=(dx - HEEL - 0.05, dy, zc + 0.9), quat=q)
        key(ob, land, loc=(dx - HEEL, dy, zc), quat=q)
    pile.append((ob, z, h, w, d, dx, dy))
    z += h
PILE_TOP = z

# annexes bolted on from the sides, overlapping the drops (and one pulled away again): all at once
ANNEX = [  # (level, side, w, d, h, in at, out at)
    (1, 1, 0.36, 0.46, 0.24, 21, None), (3, -1, 0.34, 0.52, 0.28, 31, None), (2, -1, 0.30, 0.44, 0.24, 33, 46),
    (4, 1, 0.48, 0.44, 0.36, 41, None), (6, 1, 0.56, 0.60, 0.30, 52, None), (5, -1, 0.30, 0.50, 0.28, 56, None),
]
annexes = []
for j, (lv, side, aw, ad, ah, f_in, f_out) in enumerate(ANNEX):
    ob0, z0, h0, w0, d0, dx0, dy0 = pile[lv]
    ax = dx0 + side * (w0 / 2 + aw / 2 + 0.003) - HEEL
    ay = dy0 + (0.12 if j % 2 else -0.1)
    az = z0 + h0 - ah / 2
    ob = block(f"annex{j}", (aw, ad, ah), (ax, ay, az), parent=pile_piv, bottom=False)
    show(ob, f_on=f_in - 6)
    key(ob, f_in - 6, loc=(ax + side * 1.6, ay, az), quat=Q0)
    key(ob, f_in, loc=(ax, ay, az), quat=Q0)
    if f_out:  # pulled back out and away, while more goes on
        key(ob, f_out, loc=(ax, ay, az))
        key(ob, f_out + 7, loc=(ax + side * 1.8, ay, az - 0.4))
        show(ob, f_off=f_out + 8)
    annexes.append(ob)

# the lean: creeping as weight goes on, then past the balance point
LEAN = [(1, 0.0), (20, 0.0), (40, 1.4), (60, 3.6), (70, 5.0), (80, 7.2)]
for f, deg in LEAN:
    key(pile_piv, f, quat=q_y(deg))
# then it goes: over the heel, slowly at first, faster (a falling body), as one piece
HINGE = [(83, 8.6), (85, 10.6), (87, 13.6), (89, 18.0), (91, 24.0)]
for f, deg in HINGE:
    key(pile_piv, f, quat=q_y(deg), interp="LINEAR")
HANDOFF = 92  # physics from here: it breaks up as it lands
# as it goes, the pieces splay apart (each slides out and twists a little more the higher it sits), so
# physics carries them on separately and they land as rubble, not as a stack on its side
rng = random.Random(11)
splayed = [(ob, i) for i, (ob, *_r) in enumerate(pile) if i >= 2]  # (the annexes stay bolted on: far from the heel, they would be flung)
for ob, i in splayed:
    q0 = ob.rotation_quaternion.copy()
    l0 = Vector(ob.location)
    key(ob, 84, loc=tuple(l0), quat=q0)
    k = min(i, 9) / 9
    tw = Euler((0, 0, math.radians(rng.uniform(-14, 14)) * k)).to_quaternion()  # (a twist about the vertical only: stacked slabs never overlap)
    key(ob, HANDOFF, loc=(l0.x + 0.12 * k + rng.uniform(-0.03, 0.03), l0.y + rng.uniform(-0.18, 0.18) * k, l0.z + 0.03 * k), quat=q0 @ tw, interp="LINEAR")

# racking before it goes: each storey shears a little further out of square
for i, (ob, z0, h, w, d, dx, dy) in enumerate(pile):
    if i == 0:
        continue
    sx, sy, sz = ob["seat"]
    key(ob, 66, loc=(sx, sy, sz))
    key(ob, 80, loc=(sx + 0.006 * i, sy, sz))

# ---- bake act one into world space, then hand everything to physics for the fall ----
act1 = [p[0] for p in pile] + [a for a in annexes if a.name != "annex2"]
gone = [a for a in annexes if a.name == "annex2"]
world_m = {ob.name: {} for ob in act1 + gone}
for f in range(1, HANDOFF + 1):
    scene.frame_set(f)
    for ob in act1 + gone:
        world_m[ob.name][f] = ob.matrix_world.copy()
for ob in act1 + gone:
    vis = {}
    if ob.animation_data and ob.animation_data.action:
        for fc in [fc for fc in ob.animation_data.action.fcurves if fc.data_path != "hide_render"]:
            ob.animation_data.action.fcurves.remove(fc)
    ob.parent = None
    ob.matrix_parent_inverse = Matrix()
    prev = None
    for f in range(1, HANDOFF + 1):
        loc, q, _ = world_m[ob.name][f].decompose()
        if prev is not None and prev.dot(q) < 0:
            q = -q
        ob.location = loc
        ob.rotation_quaternion = q
        ob.keyframe_insert("location", frame=f)
        ob.keyframe_insert("rotation_quaternion", frame=f)
        prev = q
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path != "hide_render":
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

bpy.ops.rigidbody.world_add()
rw = scene.rigidbody_world
rw.substeps_per_frame = 30
rw.solver_iterations = 40
rw.time_scale = 0.85  # heavy: a little slower than life, no bounce
SIM_END = HANDOFF + 50
rw.point_cache.frame_start = 1
rw.point_cache.frame_end = SIM_END + 2

def make_rb(ob, kind="ACTIVE"):
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.rigidbody.object_add()
    rb = ob.rigid_body
    rb.type = kind
    rb.collision_shape = "BOX"
    rb.friction = 0.4
    rb.restitution = 0.0
    rb.collision_margin = 0.001
    return rb

ground = block("ground_rb", (60, 60, 0.2), (0, 0, -0.1), bevel=0, bottom=False)
ground.hide_render = True
make_rb(ground, "PASSIVE").friction = 1.0
board_rb = block("board_rb", (BOARD[0], BOARD[1], PT), (0.4, -0.7, PT / 2), bevel=0, bottom=False)
board_rb.hide_render = True
make_rb(board_rb, "PASSIVE").friction = 1.0
for ob in act1:
    rb = make_rb(ob)
    dims = ob.dimensions
    rb.mass = dims.x * dims.y * dims.z * 10
    rb.linear_damping = 0.06
    rb.angular_damping = 0.22
    rb.kinematic = True
    ob.keyframe_insert("rigid_body.kinematic", frame=HANDOFF - 1)
    rb.kinematic = False
    ob.keyframe_insert("rigid_body.kinematic", frame=HANDOFF)

baked = {ob.name: {} for ob in act1}
for f in range(1, SIM_END + 1):
    scene.frame_set(f)
    if f >= HANDOFF:
        for ob in act1:
            baked[ob.name][f] = ob.matrix_world.copy()
for ob in act1 + [ground, board_rb]:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.rigidbody.object_remove()
    if ob.animation_data and ob.animation_data.action:
        for fc in [fc for fc in ob.animation_data.action.fcurves if fc.data_path.startswith("rigid_body")]:
            ob.animation_data.action.fcurves.remove(fc)
bpy.ops.rigidbody.world_remove()
bpy.data.objects.remove(ground)
bpy.data.objects.remove(board_rb)

rest = {}
for ob in act1:
    prev = None
    for f in range(HANDOFF, SIM_END + 1):
        loc, q, _ = baked[ob.name][f].decompose()
        if prev is not None and prev.dot(q) < 0:
            q = -q
        ob.location = loc
        ob.rotation_quaternion = q
        ob.keyframe_insert("location", frame=f)
        ob.keyframe_insert("rotation_quaternion", frame=f)
        prev = q
    for fc in ob.animation_data.action.fcurves:
        if fc.data_path in ("location", "rotation_quaternion"):
            for kp in fc.keyframe_points:
                if kp.co[0] >= HANDOFF:
                    kp.interpolation = "LINEAR"
    rest[ob.name] = (loc.copy(), q.copy())
print("ACT1 rest", {k: tuple(round(c, 2) for c in v[0]) for k, v in rest.items()})

# ---- the site is cleared: the wreckage goes down into the board, the grid clean again ----
CLEAR = SIM_END + 6  # 147
order = sorted(act1, key=lambda o: -rest[o.name][0].x)
for k, ob in enumerate(order):
    loc, q = rest[ob.name]
    s = CLEAR + k  # staggered
    key(ob, s, loc=tuple(loc), quat=q)
    key(ob, s + 12, loc=(loc.x, loc.y, loc.z - 1.4), quat=q)
    show(ob, f_off=s + 13)
CLEAR_END = CLEAR + len(order) + 13  # ~174

# ================================================================ act two: the cycle (one move at a time)
RAFT = (2.3, 2.0, 0.07)
raft = block("raft", RAFT, (0, 0, PT - RAFT[2] - 0.01), "concrete", bevel=0.005)
F_RAFT = CLEAR_END - 4
key(raft, F_RAFT, loc=(0, 0, PT - RAFT[2] - 0.01))
key(raft, F_RAFT + 8, loc=(0, 0, PT))
RT = PT + RAFT[2]  # the raft's top
SW = 0.92           # the tower's footprint (each cycle steps back a little)
CORE = 0.34
N_PER = 4           # storeys a cycle
TMAX = 1.0          # how strongly a piece at work takes its phase's colour
CYCLES = 3

towers = []         # per cycle: its pivot (the sway), storeys, core segment, walls, annex
f = F_RAFT + 10
TL = {}             # the timeline, for the page and the camera
for c in range(CYCLES):
    fast = [1.0, 0.72, 0.56][c]
    base = RT + c * N_PER * STOREY
    SW = [0.92, 0.8, 0.68][c]
    piv = bpy.data.objects.new(f"cycle{c}", None)
    scene.collection.objects.link(piv)
    piv.location = (0, 0, base)
    piv.rotation_mode = "QUATERNION"
    # the core leads: it climbs ahead of the floors
    core = block(f"core{c}", (CORE, CORE, N_PER * STOREY + 0.22), (0, 0, 0), "concrete", bevel=0.004, parent=piv)
    core.scale = (1, 1, 0.001)
    dc = round(8 * fast)
    show(core, f_on=f)
    key(core, f, scale=(1, 1, 0.001))
    key(core, f + dc, scale=(1, 1, 1))
    f += dc + 1
    TL[f"core{c}"] = f
    # UP: storeys grow out of the top, green while they grow, then settle to white
    up0 = f
    du = max(3, round(6 * fast))
    storeys = []
    for s in range(N_PER):
        st = block(f"storey{c}_{s}", (SW, SW, STOREY), (0, 0, s * STOREY), bevel=0.007, parent=piv)
        st.scale = (1, 1, 0.001)
        show(st, f_on=f)
        tint(st, "tu", f, TMAX)
        key(st, f, scale=(1, 1, 0.001))
        key(st, f + du, scale=(1, 1, 1))
        storeys.append(st)
        f += du
    # the core below stands 0.22 up into this one's foot. Until the first storey hides the joint this one is
    # a hair wider, or their side faces meet and shade each other black
    if c:
        widen(core, f_on=up0 - dc - 1, f_off=up0 + du + 1)
    # the phase's growth stays green until the phase is done, then settles to white together
    for st in storeys:
        tint(st, "tu", f + 1, TMAX)
        tint(st, "tu", f + 5, 0.0)
    # the annex that comes up with the growth (bolted onto the front of the third storey)
    side = 1 if c % 2 == 0 else -1
    ax, ay, az = side * 0.12, -(SW / 2 + 0.172), 2 * STOREY + 0.03
    an = block(f"bolt{c}", (0.5, 0.34, 0.3), (ax, ay, az), bevel=0.006, parent=piv)
    an.scale = (1, 1, 0.001)
    fa = up0 + 2 * du
    # it first renders two frames after its growth starts: at fa it is a paper-thin plate floating
    # over a storey that has not reached it yet, which renders as a black sheet with a hard shadow
    show(an, f_on=fa + 2)
    tint(an, "tu", fa, TMAX)
    key(an, fa, scale=(1, 1, 0.001))
    key(an, fa + du, scale=(1, 1, 1))
    tint(an, "tu", f + 1, TMAX)
    tint(an, "tu", f + 5, 0.0)
    # the sway: the new part leans a little as it grows (nothing is holding it sideways yet)
    key(piv, up0, quat=Q0)
    key(piv, f, quat=q_y(-1.3 * side))
    TL[f"up{c}"] = (up0, f)
    f += round(5 * fast)  # a still beat
    # SIDE: walls slide in level from both sides and lock on; the sway snaps plumb
    s0 = f
    ds = max(5, round(10 * fast))
    walls = []
    for k, sx in enumerate((-1, 1)):
        wh = N_PER * STOREY
        wx = sx * (SW / 2 + 0.11)
        far = 3.4 + 1.9 * c  # out of the frame
        wl = block(f"wall{c}_{k}", (0.22, 0.64, wh), (wx + sx * far, 0.0, base), bevel=0.008)
        show(wl, f_on=s0)
        tint(wl, "ts", s0, TMAX)
        key(wl, s0, loc=(wx + sx * far, 0.0, base))
        key(wl, s0 + ds, loc=(wx, 0.0, base))
        tint(wl, "ts", s0 + ds + 2, TMAX)
        tint(wl, "ts", s0 + ds + 6, 0.0)
        walls.append(wl)
    key(piv, s0 + ds - 2, quat=q_y(-1.3 * side))
    key(piv, s0 + ds + 1, quat=q_y(0.15 * side))
    key(piv, s0 + ds + 3, quat=Q0)
    f = s0 + ds + round(6 * fast)
    TL[f"side{c}"] = (s0, s0 + ds)
    # DOWN: the annex turns red and is lowered straight down beside the tower, into the ground
    # (the cycle is plumb again by now, so its frame is the world's, moved up to its base)
    d0 = f
    dd = max(6, round(12 * fast))
    tint(an, "td", d0 - 1, 0.0)
    tint(an, "td", d0 + 2, TMAX)
    key(an, d0 + 1, loc=(ax, ay, az))
    key(an, d0 + 4, loc=(ax, ay - 0.14, az))
    key(an, d0 + 4 + dd, loc=(ax, ay - 0.14, PT - 0.5 - base))
    show(an, f_on=fa + 2, f_off=d0 + 5 + dd)
    f = d0 + 4 + dd + round(6 * fast)
    TL[f"down{c}"] = (d0, d0 + 4 + dd)
    towers.append((piv, storeys, core, walls, an))

# the crown: the core tops out flush with a roof slab
roof = block("roof", (SW + 0.04, SW + 0.04, 0.06), (0, 0, RT + CYCLES * N_PER * STOREY), "concrete", bevel=0.004)
roof.scale = (1, 1, 0.001)
show(roof, f_on=f)
key(roof, f, scale=(1, 1, 0.001))
key(roof, f + 4, scale=(1, 1, 1))
f += 6
TOP = RT + CYCLES * N_PER * STOREY + 0.06
END = f + 26
TL["end"] = END
print("TIMELINE", TL, "END", END, "pile top", PILE_TOP, "tower top", TOP)

# ================================================================ camera: level, framed by shift, locked off during each move
cam_d = bpy.data.cameras.new("cam")
cam_d.sensor_fit = "HORIZONTAL"
cam_d.sensor_width = 36
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam.rotation_mode = "XYZ"

def shot(f, dist, tz, tx=0.2, lens=60, az=-13.5, eye=1.0, interp="BEZIER"):
    """the camera `dist` from (tx, 0) at azimuth az (degrees, from the front), its eye `eye` up, level,
    with the frame's centre shifted to height tz"""
    a = math.radians(az)
    cx, cy = tx + dist * math.sin(a), -dist * math.cos(a)
    cam.location = (cx, cy, eye)
    cam.rotation_euler = (math.radians(90), 0, a)
    cam_d.lens = lens
    cam_d.shift_y = (tz - eye) / dist * lens / 36
    cam_d.shift_x = 0
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)
    cam_d.keyframe_insert("lens", frame=f)
    cam_d.keyframe_insert("shift_y", frame=f)

A = dict(dist=11.6, tz=1.55, tx=0.35)       # act one's lock-off: the pile at its peak, and its fall
shot(1, dist=7.4, tz=0.62, tx=0.0)          # the opening block alone
shot(14, dist=7.4, tz=0.62, tx=0.0)
shot(60, **A)                                # craning out as it is piled higher
shot(HANDOFF, **A)                           # to the brink, locked off
shot(HANDOFF + 14, dist=13.2, tz=1.05, tx=1.55)  # it falls to the right: the camera follows it down and out
shot(CLEAR, dist=13.2, tz=0.95, tx=1.6)      # the wreckage, whole and centred
shot(F_RAFT, dist=9.0, tz=0.75, tx=0.0)      # the cleared site and the raft
c1 = TL["up0"][0]
shot(c1 - 6, dist=8.6, tz=1.05, tx=0.0)      # cycle one, locked off
shot(TL["down0"][1] + 1, dist=8.6, tz=1.05, tx=0.0)
shot(TL["up1"][0] - 2, dist=11.6, tz=1.6, tx=0.0)   # cycle two
shot(TL["down1"][1] + 1, dist=11.6, tz=1.6, tx=0.0)
shot(TL["up2"][0] - 2, **dict(A, tx=0.0))  # cycle three grows up out of act one's own frame
shot(TL["up2"][1] + 2, **dict(A, tx=0.0))
shot(TL["side2"][0] - 1, dist=15.8, tz=2.42, tx=0.0)  # pulled back for the last moves
shot(TL["down2"][1] + 2, dist=15.8, tz=2.42, tx=0.0)
shot(END - 8, dist=15.8, tz=2.42, tx=0.0, eye=1.0)   # the whole tower, plumb, its long shadow
shot(END, dist=15.8, tz=2.42, tx=0.0, eye=1.0)

scene.frame_start, scene.frame_end = 1, END
scene["timeline"] = str(TL)

# ================================================================ render settings
r = scene.render
r.engine = "CYCLES"
r.resolution_x, r.resolution_y = W, H
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.film_transparent = False
c = scene.cycles
c.device = "CPU"
c.samples = SAMPLES
c.use_adaptive_sampling = True
c.adaptive_threshold = 0.03
c.use_denoising = True
c.denoiser = "OPENIMAGEDENOISE"
c.max_bounces = 6
c.diffuse_bounces = 3
c.glossy_bounces = 2
c.transmission_bounces = 0
c.volume_bounces = 0
c.caustics_reflective = False
c.caustics_refractive = False
if THREADS:
    r.threads_mode = "FIXED"
    r.threads = THREADS
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0

if BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//" + BLEND) if BLEND.startswith("//") else BLEND)
    print("SAVED", BLEND)
for fr in FRAMES:
    scene.frame_set(fr)
    r.filepath = f"{OUT}{fr:04d}.png"
    bpy.ops.render.render(write_still=True)
    print("WROTE", r.filepath)
