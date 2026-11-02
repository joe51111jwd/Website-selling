"""Idea 3, Blackout: a printed page lying on a dark table by a window, painted out in black ink
until one sentence of Michael's is left.

  first  the book page (make_pages.py `book`), dry ink: only "Every hire compounds complexity
         before it compounds capacity." [M 696] is left.
  key    the Bootloader page (`boot`), inked down to its first question, "How many people are on
         your team?" [BL 4197]. The last strokes are still wet; the brush lies on its dish.

This is the Blender stand-in for what the 09 entry says would be photographed for real: printed
pages painted out by hand with brush and ink, shot on a copy stand in daylight. The page is real
geometry (it cockles where it took ink), the print and the ink are layered materials driven by
the textures make_pages.py draws, and the light is one window on the left.

  python3 tools/render_idle.py blender -b -P ideas/03-blackout/scene.py -- \
      --state first --camera desktop --w 640 --h 400 --samples 12 --out out/ideas/03-blackout/t01.png

Units are metres. The table top is z = 0; the camera stands on the -y side (the reader's side), so
the page's top edge is at +y.
"""
import bpy, bmesh, math, os, sys, json
import numpy as np
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'lookdev'))
import lib_lookdev as L

A = L.args(dict(state='first', camera='desktop', w=640, h=400, samples=12, out='out/ideas/03-blackout/test.png',
                exposure=-0.9, look='AgX - Medium High Contrast', window=160.0, world=0.35, fstop=0.0,
                tilt=-1.0, dist=-1.0, focal=-1.0, tx=-1.0, ty=-1.0, rot=-99.0, grain=0.06, table='oak',
                brush=-1, label='blackout', winz=0.40, winx=1.15, view='Standard', brot=-74.0, ceil=0.0))
if not os.path.isabs(A['out']):
    A['out'] = os.path.join(ROOT, A['out'])
TEX = os.path.join(HERE, 'tex')
PAGE = 'book' if A['state'] == 'first' else 'boot'
LAY = json.load(open(os.path.join(TEX, PAGE + '_layout.json')))
PW, PH = LAY['page_mm']

# Camera presets: target point on the page (mm from its top-left), tilt from vertical (deg, the
# camera leans back towards the reader), distance (m), lens (mm), and the page's turn on the table.
PRESETS = {
    ('first', 'desktop'): dict(tx=63.0, ty=87.0, tilt=9.0, dist=0.63, focal=85.0, rot=-1.4, fstop=5.6),
    ('first', 'phone'):   dict(tx=103.0, ty=113.0, tilt=7.0, dist=0.71, focal=70.0, rot=-1.4, fstop=5.6),
    ('key', 'desktop'):   dict(tx=160.0, ty=150.0, tilt=14.0, dist=0.62, focal=85.0, rot=1.1, fstop=4.0),
}
CP = dict(PRESETS[(A['state'], A['camera'])])
for k in ('tx', 'ty', 'tilt', 'dist', 'focal', 'rot', 'fstop'):
    if A[k] not in (-1.0, -99.0, 0.0):
        CP[k] = A[k]
BRUSH = (A['state'] == 'key') if A['brush'] < 0 else bool(A['brush'])

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=0.03, look=A['look'], exposure=A['exposure'],
               transmission=4, diffuse=3, glossy=3, clamp_indirect=3.0, seed=7)
if A['view'] != 'AgX':
    sc.view_settings.view_transform = A['view']
    sc.view_settings.look = 'None' if A['view'] == 'Standard' else A['look']

PAGE_Z = 0.0003                    # the sheet rests on another sheet on the table


def page_to_world(xm, ym, z=0.0, rot=None, cx=0.0, cy=0.0):
    """Page mm (from its top-left corner, y down) to world metres, with the page's turn."""
    r = math.radians(CP['rot'] if rot is None else rot)
    x, y = (xm - PW / 2) / 1000.0, (PH / 2 - ym) / 1000.0
    return Vector((cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r), z))


# ----------------------------------------------------------------------------- materials

def img(nt, name, non_color=True, interp='Cubic'):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    if non_color:
        n.image.colorspace_settings.name = 'Non-Color'
    n.interpolation = interp
    n.extension = 'EXTEND'
    return n


def math_node(nt, op, a=None, b=None, c=None, clamp=False):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
    for i, v in enumerate((a, b, c)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            L.link(nt, v, n.inputs[i])
    return n.outputs[0]


def page_mat(name, page, wet_ok=True):
    """Office paper, laser toner, and brush ink over both."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    uv = nt.nodes.new('ShaderNodeUVMap')
    toner = img(nt, page + '_toner.png')
    ink = img(nt, page + '_ink.png')
    for t in (toner, ink):
        L.link(nt, uv.outputs['UV'], t.inputs['Vector'])
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    L.link(nt, ink.outputs['Color'], sep.inputs['Color'])
    cov, thick, wet = sep.outputs['Red'], sep.outputs['Green'], sep.outputs['Blue']
    ton = toner.outputs['Color']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    # paper: bright office white (a touch blue from the brighteners), faint cloudy formation
    form = nt.nodes.new('ShaderNodeTexNoise'); form.inputs['Scale'].default_value = 140.0
    form.inputs['Detail'].default_value = 6.0; form.inputs['Roughness'].default_value = 0.6
    L.link(nt, tc.outputs['Object'], form.inputs['Vector'])
    pr = nt.nodes.new('ShaderNodeMapRange')
    pr.inputs['To Min'].default_value = 0.965; pr.inputs['To Max'].default_value = 1.0
    L.link(nt, form.outputs['Fac'], pr.inputs['Value'])
    paper = nt.nodes.new('ShaderNodeMix'); paper.data_type = 'RGBA'; paper.blend_type = 'MULTIPLY'
    pins = {s.identifier: s for s in paper.inputs}
    pins['Factor_Float'].default_value = 1.0
    pins['A_Color'].default_value = (0.80, 0.81, 0.835, 1)
    L.link(nt, pr.outputs['Result'], pins['B_Color'])
    pcol = {s.identifier: s for s in paper.outputs}['Result_Color']
    # toner: dense black, a little sheen
    mt, f1, a1, b1, r1 = L.mix(nt, 'RGBA'); L.link(nt, ton, f1); L.link(nt, pcol, a1)
    b1.default_value = (0.012, 0.012, 0.013, 1)
    # ink over everything: blacker than toner, the slightest warm-brown in thin passages
    thin = math_node(nt, 'SUBTRACT', 1.0, thick)
    ik, f2, a2, b2, r2 = L.mix(nt, 'RGBA'); L.link(nt, thin, f2)
    a2.default_value = (0.008, 0.008, 0.009, 1); b2.default_value = (0.012, 0.0115, 0.011, 1)
    mi, f3, a3, b3, r3 = L.mix(nt, 'RGBA'); L.link(nt, cov, f3); L.link(nt, r1, a3); L.link(nt, r2, b3)
    L.link(nt, r3, b.inputs['Base Color'])
    # roughness: paper 0.86, toner 0.5, ink 0.55 thin -> 0.30 thick, wet 0.05; ink over toner beads up
    rp, f4, a4, b4, r4 = L.mix(nt, 'FLOAT'); L.link(nt, ton, f4); a4.default_value = 0.86; b4.default_value = 0.70
    ri = nt.nodes.new('ShaderNodeMapRange'); L.link(nt, thick, ri.inputs['Value'])
    ri.inputs['From Min'].default_value = 0.15; ri.inputs['From Max'].default_value = 0.6
    ri.inputs['To Min'].default_value = 0.52; ri.inputs['To Max'].default_value = 0.44
    ri_t = math_node(nt, 'MULTIPLY_ADD', ton, -0.03)
    nt.links.new(ri.outputs['Result'], ri_t.node.inputs[2])
    rink, f5, a5, b5, r5 = L.mix(nt, 'FLOAT'); L.link(nt, cov, f5); L.link(nt, r4, a5); L.link(nt, ri_t, b5)
    rough = r5
    if wet_ok:
        rw, f6, a6, b6, r6 = L.mix(nt, 'FLOAT'); L.link(nt, wet, f6); L.link(nt, rough, a6); b6.default_value = 0.035
        rough = r6
    L.link(nt, rough, b.inputs['Roughness'])
    dark = math_node(nt, 'MAXIMUM', cov, ton)
    sp, f7, a7, b7, r7 = L.mix(nt, 'FLOAT'); L.link(nt, dark, f7); a7.default_value = 0.5; b7.default_value = 0.22
    L.link(nt, r7, b.inputs['Specular IOR Level'])
    # relief: paper tooth (fine), toner a hair proud, ink layer (thickness), wet ink domed
    tooth = nt.nodes.new('ShaderNodeTexNoise'); tooth.inputs['Scale'].default_value = 2600.0
    tooth.inputs['Detail'].default_value = 4.0; tooth.inputs['Roughness'].default_value = 0.7
    L.link(nt, tc.outputs['Object'], tooth.inputs['Vector'])
    h = math_node(nt, 'MULTIPLY', tooth.outputs['Fac'], 0.6)
    ton_vis = math_node(nt, 'MULTIPLY_ADD', cov, -0.8, 1.0)          # toner relief mostly buried under ink
    ton_h = math_node(nt, 'MULTIPLY', ton, ton_vis)
    h = math_node(nt, 'MULTIPLY_ADD', ton_h, 0.08, h)
    h = math_node(nt, 'MULTIPLY_ADD', thick, 1.6, h)
    if wet_ok:
        h = math_node(nt, 'MULTIPLY_ADD', wet, 2.2, h)
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.55
    bump.inputs['Distance'].default_value = 0.00003
    L.link(nt, h, bump.inputs['Height'])
    L.link(nt, bump.outputs['Normal'], b.inputs['Normal'])
    return m


def plain_paper(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.78, 0.79, 0.81, 1)
    b.inputs['Roughness'].default_value = 0.88
    return m


def table_mat():
    if A['table'] == 'oak':      # ebonised oak: the grain still shows in the light from the window
        m = L.pbr('Table', 'oak_veneer_01', scale=1.6, tint=(0.085, 0.075, 0.068), rough_add=0.10,
                  rough_mul=0.9, normal_strength=0.6, coords='Object')
    else:                        # dark grey linoleum
        m = L.pbr('Table', 'painted_plaster_wall', scale=2.0, tint=(0.07, 0.075, 0.08), rough_add=0.2,
                  normal_strength=0.3, coords='Object')
    return m


# ----------------------------------------------------------------------------- the sheet

def sheet(name, page, mat, step_mm=0.75, rot=0.0, off=(0.0, 0.0), z=PAGE_Z, cockle=True):
    ck = np.load(os.path.join(TEX, page + '_cockle.npy')) if cockle else None
    nx, ny = int(PW / step_mm) + 1, int(PH / step_mm) + 1
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    verts = []
    for j in range(ny):
        ym = min(PH, j * step_mm)
        row = []
        for i in range(nx):
            xm = min(PW, i * step_mm)
            hz = 0.0
            if ck is not None:
                cy_, cx_ = min(ck.shape[0] - 1, int(ym * 2)), min(ck.shape[1] - 1, int(xm * 2))
                hz = float(ck[cy_, cx_]) / 1000.0
            p = page_to_world(xm, ym, z + hz, rot=rot, cx=off[0], cy=off[1])
            row.append(bm.verts.new(p))
        verts.append(row)
    bm.verts.ensure_lookup_table()
    for j in range(ny - 1):
        for i in range(nx - 1):
            f = bm.faces.new((verts[j][i], verts[j + 1][i], verts[j + 1][i + 1], verts[j][i + 1]))
            for lp, (ii, jj) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
                lp[uvl].uv = (min(1.0, ii * step_mm / PW), 1.0 - min(1.0, jj * step_mm / PH))
            f.smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:            # normals up
        if f.normal.z < 0:
            f.normal_flip()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = L.obj_from_mesh(name, me, mat)
    so = ob.modifiers.new('thickness', 'SOLIDIFY'); so.thickness = 0.0001; so.offset = -1.0
    return ob


# ----------------------------------------------------------------------------- brush and dish (key)

def lathe(name, prof, segs=96, mat=None):
    """Spin a (r, z) profile about Z."""
    bm = bmesh.new()
    rings = []
    for (r, z) in prof:
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return L.obj_from_mesh(name, me, mat)


def porcelain():
    m = bpy.data.materials.new('Porcelain'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.78, 0.785, 0.79, 1)
    b.inputs['Roughness'].default_value = 0.08
    b.inputs['Subsurface Weight'].default_value = 0.0
    b.inputs['Coat Weight'].default_value = 0.6; b.inputs['Coat Roughness'].default_value = 0.03
    return m


def wet_ink_mat():
    m = bpy.data.materials.new('InkPool'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.006, 0.006, 0.007, 1)
    b.inputs['Roughness'].default_value = 0.02
    b.inputs['Specular IOR Level'].default_value = 0.6
    return m


def bristle_mat():
    """Wet bristles: glossy black, combed into fine lengthwise grooves."""
    m = bpy.data.materials.new('Bristles'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.008, 0.008, 0.009, 1)
    b.inputs['Roughness'].default_value = 0.12
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 900.0, 1.0)
    L.link(nt, tc.outputs['Object'], mp.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexNoise'); wv.inputs['Scale'].default_value = 3.0; wv.inputs['Detail'].default_value = 3.0
    L.link(nt, mp.outputs['Vector'], wv.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.5; bp.inputs['Distance'].default_value = 0.0003
    L.link(nt, wv.outputs['Fac'], bp.inputs['Height'])
    L.link(nt, bp.outputs['Normal'], b.inputs['Normal'])
    return m


def brush_and_dish(dish_xy, brush_rot_deg, k=0.62):
    # a small porcelain mixing dish (about 74 mm across) with a pool of ink
    d = lathe('Dish', [(0.0, 0.0), (0.030, 0.0), (0.040, 0.0018), (0.048, 0.0085), (0.0505, 0.0098),
                       (0.0515, 0.0094), (0.0495, 0.0080), (0.0415, 0.0052), (0.0310, 0.0040), (0.0, 0.0040)],
              mat=porcelain())
    d.location = (dish_xy[0], dish_xy[1], 0.0)
    d.scale = (k, k, 1.0)
    pool = lathe('InkPool', [(0.0, 0.0047), (0.026, 0.0047), (0.0322, 0.0046), (0.0331, 0.0044), (0.0331, 0.0035), (0.0, 0.0035)],
                 mat=wet_ink_mat())
    pool.location = d.location
    pool.scale = (k, k, 1.0)
    # the brush: lacquered birch handle, crimped nickel ferrule, 15 mm flat of wet black bristle
    handle = lathe('Handle', [(0.0, 0.0), (0.0022, 0.0), (0.0034, 0.02), (0.0042, 0.07), (0.0044, 0.11),
                              (0.0040, 0.15), (0.0036, 0.158), (0.0, 0.158)], segs=48)
    # natural birch under clear lacquer, a little grubby: the scanned oak, lightened, at small scale
    hm = L.pbr('Lacquer', 'oak_veneer_01', scale=9.0, tint=(1.0, 0.93, 0.80), rough_add=-0.25, rough_mul=0.6,
               normal_strength=0.3, coords='Object')
    hb = hm.node_tree.nodes['Principled BSDF']
    hb.inputs['Coat Weight'].default_value = 0.6; hb.inputs['Coat Roughness'].default_value = 0.10
    handle.data.materials.append(hm)
    fer = lathe('Ferrule', [(0.0042, 0.0), (0.0046, 0.003), (0.0046, 0.022), (0.0045, 0.024), (0.0, 0.024)], segs=48)
    fm = L.paint_mat('Nickel', (0.72, 0.72, 0.70), rough=0.24, rough_var=0.12)
    fm.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 1.0
    fer.data.materials.append(fm)
    # flatten the ferrule's far end into the flat that holds the bristles
    for v in fer.data.vertices:
        t = max(0.0, (v.co.z - 0.006) / 0.018)
        v.co.x *= 1.0 + 0.75 * t
        v.co.y *= 1.0 - 0.62 * t
    tuft = bpy.data.meshes.new('Tuft')
    bm = bmesh.new()
    # a wedge: 15.5 mm wide at the ferrule, 2.6 mm thick, closing to a chisel edge over 19 mm
    prof = []
    for i in range(13):
        s = i / 12
        prof.append((0.0078 * (1 + 0.07 * s ** 2), 0.0013 * (1 - 0.92 * s ** 1.3), 0.024 + 0.019 * s))   # splays a little at the tip
    rows = []
    for (hw, ht, z) in prof:
        ring = [bm.verts.new((-hw, -ht, z)), bm.verts.new((hw, -ht, z)), bm.verts.new((hw, ht, z)), bm.verts.new((-hw, ht, z))]
        rows.append(ring)
    for i in range(len(rows) - 1):
        for q in range(4):
            bm.faces.new((rows[i][q], rows[i][(q + 1) % 4], rows[i + 1][(q + 1) % 4], rows[i + 1][q]))
    bm.faces.new(rows[-1][::-1]); bm.faces.new(rows[0])
    bm.to_mesh(tuft); bm.free()
    tob = L.obj_from_mesh('Tuft', tuft, bristle_mat())
    sub = tob.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    # ferrule and tuft sit on the handle's thick end (local z 0.156 on); the flat is wide along local y
    for ob in (fer, tob):
        for v in ob.data.vertices:
            v.co.x, v.co.y = v.co.y, v.co.x
            v.co.z += 0.156
    parts = [handle, fer, tob]
    root = bpy.data.objects.new('Brush', None); bpy.context.scene.collection.objects.link(root)
    for p in parts:
        p.parent = root
    # lying with its tail on the table and its ferrule on the dish rim, the wet tip over the ink
    a = math.radians(4.1)
    psi = math.radians(brush_rot_deg)
    D = Vector((-math.cos(a) * math.cos(psi), -math.cos(a) * math.sin(psi), math.sin(a)))
    hd = Vector((D.x, D.y, 0)).normalized()
    C = Vector((dish_xy[0], dish_xy[1], 0.0098 + 0.0046)) - hd * 0.0505 * k
    R = (Matrix.Rotation(psi, 4, 'Z') @ Matrix.Rotation(math.radians(-90) + a, 4, 'Y'))
    root.matrix_world = Matrix.Translation(C - D * 0.170) @ R
    return d, root


# ----------------------------------------------------------------------------- build

table = L.box('Table', -0.8, 0.8, -0.6, 0.6, -0.03, 0.0, table_mat())
under = sheet('Under', PAGE, plain_paper('UnderPaper'), step_mm=6.0, rot=CP['rot'] + 1.1, off=(-0.0042, -0.0030),
              z=0.00012, cockle=False)
page = sheet('Page', PAGE, page_mat('Page', PAGE, wet_ok=(A['state'] == 'key')))

if BRUSH:
    # the dish sits on the table beyond the page's right edge; the brush rests across it
    rp = page_to_world(PW + 41, 112.0)
    dish, brush = brush_and_dish((rp.x, rp.y), A['brot'])

# light: one window, on the left, a little behind; daylight, overcast-bright
win_c = page_to_world(PW * 0.35, PH * 0.42)
L.area_light('Window', (win_c.x - A['winx'], win_c.y + 0.45, A['winz']), (win_c.x, win_c.y, 0.0), 1.1, 1.5,
             A['window'], kelvin=6200)
# the room: a dim grey world (what the wet ink reflects), plus the sky's colour from the window side
w = bpy.data.worlds.new('Room'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.062, 0.064, 0.068, 1)
bg.inputs['Strength'].default_value = A['world']
# a bounce card on the right (a white wall across the room) so the shadow side isn't dead black
L.area_light('Bounce', (win_c.x + 1.8, win_c.y - 0.2, 0.9), (win_c.x, win_c.y, 0.0), 2.0, 1.6, A['window'] * 0.08, kelvin=5200)

if A['ceil'] > 0:
    L.area_light('Ceiling', (win_c.x + 0.2, win_c.y + 0.3, 2.3), (win_c.x + 0.2, win_c.y + 0.3, 0.0), 2.6, 2.0,
                 A['ceil'], kelvin=5600)

# camera
T = page_to_world(CP['tx'], CP['ty'])
tl = math.radians(CP['tilt'])
cam_loc = T + Vector((0.0, -math.sin(tl), math.cos(tl))) * CP['dist']
cam = L.camera(tuple(cam_loc), tuple(T), focal=CP['focal'], fstop=CP['fstop'], sensor=36.0)
cam.data.sensor_fit = 'HORIZONTAL' if A['w'] >= A['h'] else 'VERTICAL'
if A['w'] < A['h']:
    cam.data.sensor_height = 36.0

L.post(sc, grain=A['grain'], vignette=0.24, dispersion=0.003, glare=0.0, seed=3)

# anchors: where the kept lines and the page land in the frame (for the HTML layer)
bpy.context.view_layer.update()
def px(p):
    v = world_to_camera_view(sc, cam, p)
    return [round(v.x * A['w'], 1), round((1 - v.y) * A['h'], 1)]
anch = dict(w=A['w'], h=A['h'], lines=[], page={})
for Ln in LAY['lines']:
    if Ln['keep']:
        anch['lines'].append(dict(text=Ln['text'], tl=px(page_to_world(Ln['x0'], Ln['top'])),
                                  br=px(page_to_world(Ln['x1'], Ln['bot']))))
for nm, (xm, ym) in dict(tl=(0, 0), tr=(PW, 0), bl=(0, PH), br=(PW, PH)).items():
    anch['page'][nm] = px(page_to_world(xm, ym))
# the ink rows just under the kept lines (where the HTML button can sit)
ki = [i for i, Ln in enumerate(LAY['lines']) if Ln['keep']]
nxt = LAY['lines'][ki[-1] + 1] if ki[-1] + 1 < len(LAY['lines']) else None
if nxt:
    anch['next_line'] = dict(tl=px(page_to_world(nxt['x0'], nxt['top'])), br=px(page_to_world(nxt['x1'], nxt['bot'])))
os.makedirs(os.path.dirname(A['out']), exist_ok=True)
json.dump(anch, open(os.path.splitext(A['out'])[0] + '.anchors.json', 'w'), indent=1)

L.render(sc, A['out'], A['label'], extra=dict(idea='03-blackout', state=A['state'], camera=A['camera'], cam=CP))
