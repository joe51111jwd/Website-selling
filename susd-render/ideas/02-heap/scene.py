"""Idea 2, The Heap: a small office where every hire dumps its new cables on a pile by the desk.

One cable per coordination pathway (n(n-1)/2). One white mug on the shelf per person.
  first: 8 people (8 mugs), 28 cables in a knee-high heap beside the desk
  key:   15 people (15 mugs), 105 cables: the chair is buried, the desk is going under

This is the Blender stand-in for the real thing the idea calls for (a locked-off stop-motion shoot
of real patch cables in a real room). Same seed in both states, so the first 28 cables of `key`
are exactly the 28 of `first`: the pile only ever grows, as it would on a locked camera.

  python3 tools/render_idle.py blender -b -P ideas/02-heap/scene.py -- \
      --state first --camera desktop --w 640 --h 400 --samples 12 --out out/ideas/02-heap/t01.png

Units are metres. Blender Z-up; the back wall's face is the plane y = 0, the room runs to -y.
"""
import bpy, bmesh, math, os, sys, random
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'lookdev'))
import lib_lookdev as L

A = L.args(dict(state='first', camera='desktop', w=640, h=400, samples=12, out='out/ideas/02-heap/test.png',
                seed=11, exposure=-0.15, sun=24.0, window=260.0, world=0.5, fstop=4.0, label='heap',
                grain=0.07, wall='slate', look='AgX - Medium High Contrast', dry=False, sunel=31.0, sunaz=262.0,
                review=True, dump='', people=0))
# --review 1 (default since the review pass): cables 29-105 drape over edges, loops of a dropped coil slide
# apart, and some later cables land on the founder's chair. Cables 1-28 take the exact code path they had, so
# `first` is unchanged. --review 0 reproduces the builder's key heap. --dump X.json writes the cable polylines.
if not os.path.isabs(A['out']):
    A['out'] = os.path.join(ROOT, A['out'])

# Heap site (scroll frames): --people N (1..15) renders any team size on the same locked camera, and
# --state tidy is the last beat: 15 mugs, the floor clear, the cables bundled into three trunks to a rack.
TIDY = A['state'] == 'tidy'
if A['people'] > 0:
    PEOPLE = max(1, min(15, A['people']))
    A['state'] = 'p%02d' % PEOPLE
else:
    PEOPLE = 8 if A['state'] == 'first' else 15
CABLES = PEOPLE * (PEOPLE - 1) // 2          # 28 or 105: one cable per pair of people
R_CABLE = 0.0034                             # Cat6 patch cable, ~6.8 mm jacket

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=0.03, look=A['look'], exposure=A['exposure'],
               transmission=6, diffuse=3, glossy=3, clamp_indirect=3.0, seed=7)

# ----------------------------------------------------------------------------- layout (metres)
ROOM_X = (-2.4, 2.4)
ROOM_Y = (-5.0, 0.0)
CEIL = 2.7
DESK = dict(x0=0.45, x1=1.95, y0=-0.76, y1=-0.04, top=0.745, th=0.030)
CHAIR = dict(cx=1.02, cy=-1.10, rot=-10.0, w=0.42, d=0.40, seat=0.46, back=0.86)
SHELF = dict(x0=0.22, x1=2.30, z=1.30, d=0.19, th=0.026)
MUG_X0, MUG_STEP = 0.28, 0.128
PILE = (-0.12, -1.02)                        # the heap beside the desk


# ----------------------------------------------------------------------------- materials
def wall_mat():
    tint = {'slate': (0.085, 0.097, 0.104), 'olive': (0.095, 0.098, 0.080)}[A['wall']]
    m = L.pbr('Wall', 'painted_plaster_wall', scale=0.45, tint=tint, rough_add=0.10, normal_strength=1.1,
              bump=0.35, coords='Object')
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    src = b.inputs['Base Color'].links[0].from_socket
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6
    nz.inputs['Detail'].default_value = 6.0; nz.inputs['Roughness'].default_value = 0.55
    L.link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.80; mr.inputs['To Max'].default_value = 1.18
    L.link(nt, nz.outputs['Fac'], mr.inputs['Value'])
    mx, f_, a_, b_, r_ = L.mix(nt, 'RGBA', 'MULTIPLY'); f_.default_value = 1.0
    L.link(nt, src, a_); L.link(nt, mr.outputs['Result'], b_); L.link(nt, r_, b.inputs['Base Color'])
    return m


def ceramic(name, srgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*L.srgb_to_lin(srgb), 1)
    b.inputs['Roughness'].default_value = 0.07
    b.inputs['Subsurface Weight'].default_value = 0.06
    b.inputs['Subsurface Radius'].default_value = (0.004, 0.004, 0.003)
    return m


def pvc(name, srgb, rough=0.40):
    """Satin PVC jacket: flat colour, roughness broken up by fine noise, faint extrusion ripple."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*L.srgb_to_lin(srgb), 1)
    b.inputs['Specular IOR Level'].default_value = 0.45
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60.0
    nz.inputs['Detail'].default_value = 4.0
    L.link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = rough - 0.08; mr.inputs['To Max'].default_value = rough + 0.10
    L.link(nt, nz.outputs['Fac'], mr.inputs['Value']); L.link(nt, mr.outputs['Result'], b.inputs['Roughness'])
    # dust: the older cables in the heap have sat on a floor
    return m


def plug_mat():
    m = bpy.data.materials.new('PlugPC'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.85, 0.86, 0.85, 1)
    b.inputs['Roughness'].default_value = 0.22
    b.inputs['Transmission Weight'].default_value = 0.7
    b.inputs['IOR'].default_value = 1.58
    return m


MAT = {}
MAT['wall'] = wall_mat()
MAT['skirt'] = L.paint_mat('Skirting', (0.17, 0.19, 0.20) if A['wall'] == 'slate' else (0.19, 0.20, 0.16), rough=0.32)
MAT['floor'] = L.pbr('Floor', 'wood_floor', scale=0.42, tint=(0.78, 0.70, 0.62), rough_add=0.04, normal_strength=0.8)
MAT['ceil'] = L.simple_mat('Ceiling', (0.80, 0.80, 0.78), rough=0.9)
MAT['oak'] = L.pbr('Oak', 'oak_veneer_01', scale=0.9, rough_add=-0.04, normal_strength=0.5)
MAT['oak_end'] = L.pbr('OakChair', 'oak_veneer_01', scale=1.4, tint=(0.82, 0.78, 0.72), rough_add=0.0, normal_strength=0.5)
MAT['steel'] = L.paint_mat('PowderCoat', (0.045, 0.047, 0.05), rough=0.48, rough_var=0.2)
MAT['alu'] = L.simple_mat('Aluminium', (0.78, 0.78, 0.80), rough=0.32, metallic=1.0)
MAT['book'] = L.simple_mat('NotebookCover', (0.07, 0.07, 0.075), rough=0.7)
MAT['paper'] = L.simple_mat('Paper', (0.86, 0.85, 0.82), rough=0.85)
MAT['mug'] = ceramic('MugWhite', (0.90, 0.90, 0.88))
MAT['mug2'] = ceramic('MugOffWhite', (0.88, 0.86, 0.80))
MAT['plug'] = plug_mat()
MAT['plate'] = L.simple_mat('OutletPlate', (0.86, 0.85, 0.82), rough=0.35)
MAT['rubber'] = L.simple_mat('Rubber', (0.04, 0.04, 0.04), rough=0.55)
# Cable colours: the older pathways in shop-floor neutrals, the newest hire's batch in patch blue.
CAB = {
    'grey': pvc('CableGrey', (0.56, 0.57, 0.56)),
    'grey2': pvc('CableGreyDark', (0.40, 0.41, 0.41)),
    'white': pvc('CableWhite', (0.84, 0.84, 0.81), rough=0.36),
    'black': pvc('CableBlack', (0.05, 0.05, 0.055), rough=0.34),
    'new': pvc('CableBlue', (0.09, 0.27, 0.62), rough=0.34),
}


# ----------------------------------------------------------------------------- room
def room():
    x0, x1 = ROOM_X
    L.box('BackWall', x0 - 0.2, x1 + 0.2, 0.0, 0.15, -0.05, CEIL + 0.1, MAT['wall'])
    L.box('Skirting', x0, x1, -0.016, 0.0, 0.0, 0.095, MAT['skirt'], bevel=0.003)
    L.box('Floor', x0 - 0.2, x1 + 0.2, ROOM_Y[0], 0.15, -0.05, 0.0, MAT['floor'])
    L.box('Ceiling', x0 - 0.2, x1 + 0.2, ROOM_Y[0], 0.15, CEIL, CEIL + 0.08, MAT['ceil'])
    L.box('RightWall', x1, x1 + 0.12, ROOM_Y[0], 0.15, 0.0, CEIL, MAT['wall'])
    L.box('FrontWall', x0 - 0.2, x1 + 0.2, ROOM_Y[0] - 0.12, ROOM_Y[0], 0.0, CEIL, MAT['ceil'])
    # left wall with a window opening (y -2.35..-0.40, z 0.85..2.30); the window itself is out of frame
    wy0, wy1, wz0, wz1 = -2.35, -0.40, 0.85, 2.30
    lw = x0 - 0.14
    L.box('LW_back', lw, x0, wy1, 0.15, 0.0, CEIL, MAT['wall'])
    L.box('LW_front', lw, x0, ROOM_Y[0], wy0, 0.0, CEIL, MAT['wall'])
    L.box('LW_low', lw, x0, wy0, wy1, 0.0, wz0, MAT['wall'])
    L.box('LW_high', lw, x0, wy0, wy1, wz1, CEIL, MAT['wall'])
    # window frame and glazing bars: they cut the sun into panes on the floor
    fm = MAT['ceil']
    L.box('Mullion', lw + 0.02, x0 - 0.04, (wy0 + wy1) / 2 - 0.025, (wy0 + wy1) / 2 + 0.025, wz0, wz1, fm)
    L.box('Transom', lw + 0.02, x0 - 0.04, wy0, wy1, 1.70 - 0.025, 1.70 + 0.025, fm)
    return (wy0, wy1, wz0, wz1, x0)


def desk():
    d = DESK
    L.box('DeskTop', d['x0'], d['x1'], d['y0'], d['y1'], d['top'] - d['th'], d['top'], MAT['oak'], bevel=0.003)
    t = 0.04
    for (x, y) in [(d['x0'] + 0.03, d['y0'] + 0.03), (d['x1'] - 0.03 - t, d['y0'] + 0.03),
                   (d['x0'] + 0.03, d['y1'] - 0.03 - t), (d['x1'] - 0.03 - t, d['y1'] - 0.03 - t)]:
        L.box('DeskLeg', x, x + t, y, y + t, 0.0, d['top'] - d['th'], MAT['steel'], bevel=0.002)
    z1 = d['top'] - d['th']
    L.box('ApronF', d['x0'] + 0.03, d['x1'] - 0.03, d['y0'] + 0.03, d['y0'] + 0.05, z1 - 0.06, z1, MAT['steel'], bevel=0.001)
    L.box('ApronB', d['x0'] + 0.03, d['x1'] - 0.03, d['y1'] - 0.05, d['y1'] - 0.03, z1 - 0.06, z1, MAT['steel'], bevel=0.001)
    # on the desk: a closed laptop and a notebook
    lap = L.box('Laptop', -0.152, 0.152, -0.106, 0.106, 0.0, 0.0156, MAT['alu'], bevel=0.005)
    lap.location = (1.42, -0.40, d['top']); lap.rotation_euler.z = math.radians(-7)
    nb = L.box('Notebook', -0.074, 0.074, -0.105, 0.105, 0.0, 0.013, MAT['book'], bevel=0.0015)
    nb.location = (0.98, -0.47, d['top']); nb.rotation_euler.z = math.radians(11)
    pg = L.box('NotebookPages', -0.071, 0.071, -0.102, 0.102, 0.0015, 0.0115, MAT['paper'])
    pg.location = nb.location; pg.rotation_euler = nb.rotation_euler; pg.location.x += 0.002


def socket():
    """A duplex wall outlet by the skirting, something plugged in, the lead running off under the desk."""
    x, z = 0.27, 0.33
    L.box('OutletPlate', x - 0.035, x + 0.035, -0.006, 0.0, z - 0.057, z + 0.057, MAT['plate'], bevel=0.0015)
    for dz in (-0.0195, 0.0195):
        L.box('OutletFace', x - 0.017, x + 0.017, -0.009, -0.006, z + dz - 0.0165, z + dz + 0.0165, MAT['plate'], bevel=0.003)
    L.box('PlugHead', x - 0.016, x + 0.016, -0.034, -0.009, z - 0.0195 - 0.020, z - 0.0195 + 0.018, MAT['rubber'], bevel=0.004)
    pts = [Vector((x, -0.030, z - 0.04))]
    for k in range(1, 12):                       # the lead drops in a soft curve to the floor
        t = k / 11
        pts.append(Vector((x + 0.03 * t, -0.030 - 0.03 * t, (z - 0.04) * (1 - t) ** 1.6 + 0.003 * t)))
    for k in range(1, 30):                       # then along the floor, under the desk
        t = k / 29
        pts.append(Vector((x + 0.03 + 0.62 * t, -0.06 - 0.22 * math.sin(t * 2.4), 0.0028)))
    cu = bpy.data.curves.new('Lead', 'CURVE'); cu.dimensions = '3D'
    cu.bevel_mode = 'ROUND'; cu.bevel_depth = 0.0026; cu.bevel_resolution = 2
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p.x, p.y, p.z, 1.0)
    sp.order_u = 3; sp.use_endpoint_u = True; sp.use_smooth = True
    ob = bpy.data.objects.new('Lead', cu); sc.collection.objects.link(ob); cu.materials.append(MAT['rubber'])


def chair():
    c = CHAIR
    parts = []
    hw, hd, s = c['w'] / 2, c['d'] / 2, c['seat']
    t = 0.032
    parts.append(L.box('Seat', -hw, hw, -hd, hd, s - 0.022, s, MAT['oak_end'], bevel=0.003))
    for (x, y) in [(-hw + 0.01, -hd + 0.01), (hw - 0.01 - t, -hd + 0.01)]:     # front legs (desk side, +y)
        parts.append(L.box('ChairLegF', x, x + t, -y - t, -y, 0.0, s - 0.022, MAT['oak_end'], bevel=0.002))
    for x in (-hw + 0.01, hw - 0.01 - t):                                      # back legs run up into the back
        parts.append(L.box('ChairLegB', x, x + t, -hd + 0.01, -hd + 0.01 + t, 0.0, c['back'], MAT['oak_end'], bevel=0.002))
    parts.append(L.box('BackRail', -hw + 0.01, hw - 0.01, -hd + 0.012, -hd + 0.012 + 0.022, c['back'] - 0.085, c['back'] - 0.005, MAT['oak_end'], bevel=0.003))
    parts.append(L.box('MidRail', -hw + 0.04, hw - 0.04, -hd + 0.016, -hd + 0.016 + 0.018, s + 0.12, s + 0.15, MAT['oak_end'], bevel=0.002))
    parts.append(L.box('Stretcher', -hw + 0.03, hw - 0.03, -0.01, 0.01, 0.16, 0.185, MAT['oak_end'], bevel=0.002))
    piv = bpy.data.objects.new('Chair', None); sc.collection.objects.link(piv)
    for p in parts:
        p.parent = piv
    piv.location = (c['cx'], c['cy'], 0.0)
    piv.rotation_euler.z = math.radians(c['rot'])
    return piv


def shelf():
    s = SHELF
    L.box('Shelf', s['x0'], s['x1'], -s['d'], 0.0, s['z'] - s['th'], s['z'], MAT['oak'], bevel=0.002)
    for x in (s['x0'] + 0.22, s['x1'] - 0.22):
        L.box('BracketV', x - 0.015, x + 0.015, -0.004, 0.0, s['z'] - s['th'] - 0.16, s['z'] - s['th'], MAT['steel'], bevel=0.0008)
        L.box('BracketH', x - 0.015, x + 0.015, -s['d'] + 0.03, 0.0, s['z'] - s['th'] - 0.004, s['z'] - s['th'], MAT['steel'], bevel=0.0008)


def mug_mesh():
    """A plain glazed mug turned from a profile (r, z), 82 mm across, 96 mm tall."""
    prof = [(0.0, 0.0075), (0.030, 0.0078), (0.0352, 0.0105), (0.0362, 0.030), (0.0368, 0.092),
            (0.0378, 0.0958), (0.0394, 0.0966), (0.0408, 0.0952), (0.0411, 0.090), (0.0410, 0.010),
            (0.0402, 0.0025), (0.0385, 0.0), (0.030, 0.0), (0.0, 0.0006)]
    bm = bmesh.new()
    seg = 40
    rings = []
    for k in range(seg):
        a = 2 * math.pi * k / seg
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for (r, z) in prof])
    for k in range(seg):
        r0, r1 = rings[k], rings[(k + 1) % seg]
        for i in range(len(prof) - 1):
            try:
                bm.faces.new((r0[i], r1[i], r1[i + 1], r0[i + 1]))
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('Mug'); bm.to_mesh(me); bm.free()
    L._sharp_by_angle(me, 70)
    # handle: an oval-section loop off the side
    hb = bmesh.new()
    pts = []
    for i in range(25):
        t = i / 24.0
        a = -math.pi / 2 + math.pi * t
        pts.append((0.040 + 0.026 * math.cos(a), 0.0, 0.054 + 0.031 * math.sin(a)))
    ring_n = 10
    loops = []
    for i, p in enumerate(pts):
        if i == 0:
            tng = Vector(pts[1]) - Vector(pts[0])
        elif i == len(pts) - 1:
            tng = Vector(pts[-1]) - Vector(pts[-2])
        else:
            tng = Vector(pts[i + 1]) - Vector(pts[i - 1])
        tng.normalize()
        side = Vector((0, 1, 0)); nrm = tng.cross(side).normalized()
        ring = []
        for k in range(ring_n):
            a = 2 * math.pi * k / ring_n
            off = side * (0.0055 * math.cos(a)) + nrm * (0.0038 * math.sin(a))
            ring.append(hb.verts.new(Vector(p) + off))
        loops.append(ring)
    for i in range(len(loops) - 1):
        for k in range(ring_n):
            hb.faces.new((loops[i][k], loops[i][(k + 1) % ring_n], loops[i + 1][(k + 1) % ring_n], loops[i + 1][k]))
    hme = bpy.data.meshes.new('MugHandle'); hb.to_mesh(hme); hb.free()
    for f in hme.polygons:
        f.use_smooth = True
    return me, hme


def mugs(n):
    me, hme = mug_mesh()
    for f in me.polygons:
        f.use_smooth = True
    rnd = random.Random(5)
    for i in range(n):
        x = MUG_X0 + MUG_STEP * i + rnd.uniform(-0.008, 0.008)
        y = -SHELF['d'] * 0.5 + rnd.uniform(-0.012, 0.012)
        m = MAT['mug2'] if i in (3, 10) else MAT['mug']
        ob = bpy.data.objects.new(f'Mug{i}', me.copy()); sc.collection.objects.link(ob)
        ob.data.materials.append(m)
        hd = bpy.data.objects.new(f'MugH{i}', hme); sc.collection.objects.link(hd)
        hd.data.materials.clear(); hd.data.materials.append(MAT['mug'])
        hd.parent = ob
        ob.location = (x, y, SHELF['z'])
        # handles mostly to the right, as people put mugs back, never quite the same
        ob.rotation_euler.z = math.radians(rnd.choice([-35, -20, -5, 10, 25, 150, 175]) + rnd.uniform(-8, 8))


# ----------------------------------------------------------------------------- the heap
G = 0.01
HX0, HX1, HY0, HY1 = ROOM_X[0] + 0.05, ROOM_X[1] - 0.05, -3.6, -0.006
NX, NY = int((HX1 - HX0) / G), int((HY1 - HY0) / G)
Hf = np.zeros((NX, NY), dtype=np.float32)


def cell(x, y):
    i = int((x - HX0) / G); j = int((y - HY0) / G)
    return min(max(i, 1), NX - 2), min(max(j, 1), NY - 2)


def rect(x0, x1, y0, y1, z):
    i0, j0 = cell(x0, y0); i1, j1 = cell(x1, y1)
    Hf[i0:i1 + 1, j0:j1 + 1] = np.maximum(Hf[i0:i1 + 1, j0:j1 + 1], z)


def oriented_rect(cx, cy, rot, x0, x1, y0, y1, z):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    xs = np.arange(x0, x1, G * 0.7); ys = np.arange(y0, y1, G * 0.7)
    for lx in xs:
        for ly in ys:
            i, j = cell(cx + c * lx - s * ly, cy + s * lx + c * ly)
            Hf[i, j] = max(Hf[i, j], z)


def terrain():
    d = DESK
    rect(d['x0'], d['x1'], d['y0'], d['y1'], d['top'])
    c = CHAIR
    hw, hd = c['w'] / 2, c['d'] / 2
    oriented_rect(c['cx'], c['cy'], c['rot'], -hw, hw, -hd + 0.03, hd, c['seat'])
    oriented_rect(c['cx'], c['cy'], c['rot'], -hw + 0.01, hw - 0.01, -hd + 0.0, -hd + 0.035, c['back'])


def t_at(x, y):
    i, j = cell(x, y)
    return float(Hf[i - 1:i + 2, j - 1:j + 2].max())


def inside(x, y):
    return HX0 + 0.03 < x < HX1 - 0.03 and HY0 + 0.03 < y < HY1 - 0.012


def stamp(P):
    if NEWCAB[0]:                               # review: a hanging length is not a surface to lie on
        A_ = np.array(P)
        dz = np.abs(np.gradient(A_[:, 2])); dxy = np.hypot(np.gradient(A_[:, 0]), np.gradient(A_[:, 1]))
        keep = ~((dz > 2.0 * dxy) & (A_[:, 2] > np.array([t_at(p[0], p[1]) for p in P]) + 0.03))
        P = [p for p, k in zip(P, keep) if k]
    for (x, y, z) in P:
        i, j = cell(x, y)
        top = z + R_CABLE * 0.9
        blk = Hf[i - 1:i + 2, j - 1:j + 2]
        np.maximum(blk, top, out=blk)


def slide(c, rng, steps=40):
    """Move a drop point downhill until the local slope is under the angle of repose (~32 deg)."""
    x, y = c
    for _ in range(steps):
        e = 0.12
        gx = (t_at(x + e, y) - t_at(x - e, y)) / (2 * e)
        gy = (t_at(x, y + e) - t_at(x, y - e)) / (2 * e)
        g = math.hypot(gx, gy)
        if g < 0.50:
            break
        x -= 0.03 * gx / g + rng.normal(0, 0.006)
        y -= 0.03 * gy / g + rng.normal(0, 0.006)
        x = min(max(x, HX0 + 0.3), HX1 - 0.3); y = min(max(y, HY0 + 0.3), HY1 - 0.15)
    return (x, y)


NEWCAB = [False]                             # review: True while building a cable past the first 28


def drape(pts, x, y, z, th, rng, ds):
    """Review: how a patch cable goes over a real edge. It rolls over the edge on a bend of a few cm,
    hangs with the bow and sideways wave its coil memory gives it (never a plumb line), and meets
    the floor (or whatever is under it) on a J, then runs on. Appends to pts; returns the end."""
    ux, uy = math.cos(th), math.sin(th)
    vx, vy = -uy, ux
    rb = rng.uniform(0.025, 0.05)                # bend over the edge
    bow = rng.uniform(-0.008, 0.08)              # the hanging length bows out (coil memory)
    la = rng.uniform(0.012, 0.06); per = rng.uniform(0.30, 0.85); ph = rng.uniform(0, 2 * math.pi)
    rj = rng.uniform(0.06, 0.15)                 # the J at the bottom
    x0, y0, z0 = x, y, z
    nb = max(3, int(0.5 * math.pi * rb / ds))
    for k in range(1, nb + 1):                   # over the edge: a quarter turn
        a = 0.5 * math.pi * k / nb
        pts.append((x0 + ux * rb * math.sin(a), y0 + uy * rb * math.sin(a), z0 - rb * (1 - math.cos(a))))
    zt = z0 - rb
    H = max(zt - t_at(x0 + ux * (rb + 0.05), y0 + uy * (rb + 0.05)), 0.05)
    px, py, zz = pts[-1]
    d = 0.0
    while True:
        d += ds
        f = min(d / H, 1.0)
        o = rb + bow * math.sin(math.pi * f) * (1 + 0.6 * f)
        lat = la * (math.sin(2 * math.pi * d / per + ph) - math.sin(ph)) * min(1.0, d / 0.12)
        qx, qy, qz = x0 + ux * o + vx * lat, y0 + uy * o + vy * lat, zt - d
        if not inside(qx, qy):
            break
        if qz <= t_at(qx, qy) + R_CABLE + rj:
            break
        px, py, zz = qx, qy, qz
        pts.append((px, py, zz))
    fl = t_at(px, py) + R_CABLE
    rje = max(min(rj, zz - fl), 0.012)
    nj = max(3, int(0.5 * math.pi * rje / ds))
    qx, qy, qz = px, py, zz
    for k in range(1, nj + 1):                   # the J: from hanging to lying, along the heading
        a = 0.5 * math.pi * k / nj
        cx, cy = px + ux * rje * (1 - math.cos(a)), py + uy * rje * (1 - math.cos(a))
        if not inside(cx, cy):
            break
        qx, qy = cx, cy
        qz = max(zz - rje * math.sin(a), t_at(qx, qy) + R_CABLE)
        pts.append((qx, qy, qz))
    return qx, qy, qz


def walk(start, heading, length, rng, ds=0.012, curl=4.0, home=None, home_r=0.5, z0=None):
    """A cable end lying where it falls: wanders in XY with smooth random curvature, follows the
    surface, and hangs straight down off any edge instead of bridging through the air."""
    x, y = start
    z = t_at(x, y) + R_CABLE if z0 is None else z0
    th = heading
    k = 0.0
    pts = []
    n = int(length / ds)
    for s in range(n):
        k += rng.normal(0, 0.9) * 0.35 - k * 0.08
        steer = 0.0
        if home is not None:
            dx, dy = home[0] - x, home[1] - y
            dist = math.hypot(dx, dy)
            if dist > home_r:
                want = math.atan2(dy, dx)
                diff = (want - th + math.pi) % (2 * math.pi) - math.pi
                steer = 0.6 * diff
        th += (k * curl + steer) * ds
        nx_, ny_ = x + math.cos(th) * ds, y + math.sin(th) * ds
        if not inside(nx_, ny_):
            th += math.pi * 0.6
            continue
        t = t_at(nx_, ny_) + R_CABLE
        if t > z + 0.04:                        # a step up (desk, chair, a coil): cables don't climb
            th += rng.choice([-1.0, 1.0]) * rng.uniform(0.8, 1.6)
            continue
        if NEWCAB[0] and t < z - 0.10:           # review: a real drop (desk, chair, heap side): drape
            x, y, z = drape(pts, x, y, z, th, rng, ds)
            continue
        if t < z - ds * 1.2:                    # an edge: hang, with a little sway
            sx, sy = 0.0, 0.0
            while z - ds > t:
                z -= ds
                sx = 0.85 * sx + rng.normal(0, 0.12) * ds; sy = 0.85 * sy + rng.normal(0, 0.12) * ds
                x += math.cos(th) * ds * 0.10 + sx; y += math.sin(th) * ds * 0.10 + sy
                pts.append((x, y, z))
            z = t
            x, y = nx_, ny_
        else:
            x, y, z = nx_, ny_, max(t, z - ds * 0.9)
        pts.append((x, y, z))
    return pts


def smooth(P, it=8):
    """Round off corners (a cable has bending stiffness), never letting it sink into what is under it."""
    a = np.array(P, dtype=np.float64)
    for _ in range(it):
        a[1:-1] = 0.5 * a[1:-1] + 0.25 * (a[:-2] + a[2:])
        for i in range(1, len(a) - 1):
            f = t_at(a[i, 0], a[i, 1]) + R_CABLE
            if a[i, 2] < f:
                a[i, 2] = f
    return [tuple(map(float, p)) for p in a]


def relax(P, floor, it=60, g=0.00015):
    z = np.array([p[2] for p in P]); f = np.array(floor)
    for _ in range(it):
        z[1:-1] = np.maximum(f[1:-1], 0.5 * (z[:-2] + z[2:]) - g)
    return [(p[0], p[1], float(zz)) for p, zz in zip(P, z)]


def coil(center, rng):
    """A new cable as it comes out of the box: a loose coil of 3-7 loops, dropped, one or two loops
    sprung, both ends trailing out with their plugs."""
    R = rng.uniform(0.14, 0.21)
    if NEWCAB[0] and math.hypot(center[0] - CHAIR['cx'], center[1] - CHAIR['cy']) < 0.16:
        R = 0.09 + (R - 0.14) * 0.6               # review: a shorter cable's coil, small enough to stay on the seat
    loops = int(rng.integers(3, 7))
    ell = rng.uniform(0.0, 0.22)
    rot = rng.uniform(0, 2 * math.pi)
    ds = 0.013
    n = int(2 * math.pi * R * loops / ds)
    phi = np.linspace(0, 2 * math.pi * loops, n)
    u = phi / (2 * math.pi)
    p1, p2, p3, p4 = rng.uniform(0, 6.28, 4)
    dr = 0.011 * np.sin(2 * math.pi * u * 0.41 + p1) + 0.006 * np.sin(2 * math.pi * u * 1.37 + p2)
    dz = 0.010 * np.sin(2 * math.pi * u * 0.53 + p3) + 0.004 * np.sin(3 * phi + p4)
    sprung = np.zeros_like(u)
    for _ in range(int(rng.integers(0, 3))):
        k0 = rng.uniform(0, loops - 1)
        sprung += 0.35 * np.exp(-((u - k0 - 0.5) / 0.32) ** 2)
    rr = R * (1 + 0.04 * np.sin(2 * phi + p2) + sprung) + dr
    lx = rr * np.cos(phi) * (1 + ell); ly = rr * np.sin(phi) * (1 - ell)
    if NEWCAB[0]:                                # review: a dropped coil's loops slide apart, not concentric hoops
        ao = rng.uniform(0.012, 0.045); fq = rng.uniform(0.12, 0.32); q1, q2 = rng.uniform(0, 6.28, 2)
        lx = lx + ao * np.sin(2 * math.pi * u * fq + q1); ly = ly + ao * np.sin(2 * math.pi * u * fq + q2)
    c, s = math.cos(rot), math.sin(rot)
    X = center[0] + c * lx - s * ly; Y = center[1] + s * lx + c * ly
    if not all(inside(a, b) for a, b in zip(X, Y)):
        return None
    t = np.array([t_at(a, b) for a, b in zip(X, Y)])
    if t.max() - t.min() > 0.36:
        return 'steep'
    # rest the ring under gravity: of all tilts, the one that puts its centre lowest while no point
    # sinks into what is under it (a rigid ring settles onto three supports)
    dx, dy = X - center[0], Y - center[1]
    need = t + R_CABLE - dz
    def best(bs, cs):
        B, C = np.meshgrid(bs, cs, indexing='ij'); B = B.ravel(); C = C.ravel()
        a = (need[None, :] - B[:, None] * dx[None, :] - C[:, None] * dy[None, :]).max(1)
        k = int(np.argmin(a))
        return B[k], C[k], a[k]
    b, c_, a0 = best(np.linspace(-0.9, 0.9, 31), np.linspace(-0.9, 0.9, 31))
    b, c_, a0 = best(np.linspace(b - 0.06, b + 0.06, 13), np.linspace(c_ - 0.06, c_ + 0.06, 13))
    zc = a0 + b * dx + c_ * dy + dz
    floor = np.maximum(t + R_CABLE, zc - 0.012)
    ring = relax([(a, b, z) for a, b, z in zip(X, Y, zc)], floor, it=25, g=0.0002)
    # trailing ends
    h0 = math.atan2(ring[1][1] - ring[0][1], ring[1][0] - ring[0][0]) + math.pi
    h1 = math.atan2(ring[-1][1] - ring[-2][1], ring[-1][0] - ring[-2][0])
    tail0 = walk(ring[0][:2], h0 + rng.normal(0, 0.4), rng.uniform(0.10, 0.55), rng, z0=ring[0][2],
                 home=center, home_r=0.75)
    tail1 = walk(ring[-1][:2], h1 + rng.normal(0, 0.4), rng.uniform(0.20, 0.85), rng, z0=ring[-1][2],
                 home=center, home_r=0.9)
    return tail0[::-1] + ring + tail1


def tangle(center, rng):
    """A cable already pulled loose: a meander that stays roughly where it was dropped."""
    th = rng.uniform(0, 2 * math.pi)
    P = walk(center, th, rng.uniform(1.8, 4.5), rng, curl=7.0, home=center, home_r=rng.uniform(0.18, 0.35))
    if len(P) < 10:
        return None
    floor = [t_at(p[0], p[1]) + R_CABLE for p in P]
    return relax(P, floor, it=40)


def target(i, rng):
    """Where cable i is dropped. The first 28 go on the pile beside the desk; past that, people
    start dropping them wherever there is room: the chair, the desk, further out."""
    if i < 28:
        return (PILE[0] + rng.normal(0, 0.21), PILE[1] + rng.normal(0, 0.15))
    r = rng.uniform()
    if A['review'] and r < 0.05:   # review: onto the founder's chair, so in key the seat is taken
        return (CHAIR['cx'] + rng.normal(0, 0.035), CHAIR['cy'] + rng.normal(0, 0.035))
    if r < 0.36:      # against the desk front and round the chair: the heap rises where people sit
        return (CHAIR['cx'] - 0.15 + rng.normal(0, 0.36), CHAIR['cy'] + 0.05 + rng.normal(0, 0.22))
    if r < 0.60:
        return (rng.uniform(DESK['x0'] + 0.2, DESK['x1'] - 0.15), rng.uniform(DESK['y0'] + 0.12, DESK['y1'] - 0.12))
    if r < 0.86:
        return (PILE[0] + 0.1 + rng.normal(0, 0.30), PILE[1] + rng.normal(0, 0.22))
    return (rng.uniform(-1.5, 1.9), rng.uniform(-1.8, -1.2))


def build_heap(n):
    terrain()
    cables = []
    for i in range(n):
        rng = np.random.default_rng(A['seed'] * 1000 + i)
        NEWCAB[0] = bool(A['review']) and i >= 28
        kind = 'coil' if rng.uniform() < (0.86 if i < 28 else 0.74) else 'tangle'
        P = None
        for attempt in range(30):
            c = slide(target(i, rng), rng)
            P = coil(c, rng) if kind == 'coil' else tangle(c, rng)
            if P == 'steep':
                P = None
                if attempt > 12:
                    kind = 'tangle'
                continue
            if P is not None and len(P) > 10:
                break
        if P is None or P == 'steep':
            continue
        P = smooth(P)
        stamp(P)
        cables.append(P)
    return cables


def batch_of(i):
    """Cable i belongs to hire k: hire 2 brings 1 cable, hire 3 brings 2, ... hire k brings k-1."""
    k, total = 2, 0
    while total + (k - 1) <= i:
        total += k - 1; k += 1
    return k


def cable_objects(cables):
    groups = {}
    rnd = random.Random(3)
    neutral = ['grey'] * 5 + ['grey2'] * 2 + ['white'] * 3 + ['black'] * 2
    hire_col = {}
    for i, P in enumerate(cables):
        k = batch_of(i)
        if k == PEOPLE:
            col = 'new'
        else:
            col = hire_col.setdefault((k, i % 3), rnd.choice(neutral))
        groups.setdefault(col, []).append(P)
    for col, Ps in groups.items():
        cu = bpy.data.curves.new('Cables_' + col, 'CURVE')
        cu.dimensions = '3D'
        cu.bevel_mode = 'ROUND'
        cu.bevel_depth = R_CABLE
        cu.bevel_resolution = 2
        cu.use_fill_caps = True
        for P in Ps:
            sp = cu.splines.new('POLY')
            sp.points.add(len(P) - 1)
            flat = []
            for p in P:
                flat += [p[0], p[1], p[2], 1.0]
            sp.points.foreach_set('co', flat)
            sp.use_smooth = True
        ob = bpy.data.objects.new('Cables_' + col, cu)
        sc.collection.objects.link(ob)
        cu.materials.append(CAB[col])
        plugs(Ps, CAB[col])


def plugs(Ps, boot_mat):
    """An RJ45 plug with a snagless boot on both ends of every cable."""
    bm_body = bmesh.new(); bm_boot = bmesh.new()
    for P in Ps:
        for end in (0, -1):
            p = Vector(P[end])
            q = Vector(P[end + 1] if end == 0 else P[end - 1])
            d = p - q
            d.z = 0.0
            if d.length < 1e-6:
                continue
            d.normalize()
            side = Vector((-d.y, d.x, 0.0))
            up = Vector((0, 0, 1))
            boot_c = p + d * 0.010
            body_c = p + d * 0.030
            zb = max(t_at(body_c.x, body_c.y), p.z - R_CABLE) + 0.0043
            body_c.z = zb
            boot_c.z = (p.z + zb) / 2
            for bm, c, hl, hw, hh in ((bm_boot, boot_c, 0.011, 0.0052, 0.0050), (bm_body, body_c, 0.0105, 0.0058, 0.0042)):
                vs = []
                for sx in (-1, 1):
                    for sy in (-1, 1):
                        for sz in (-1, 1):
                            vs.append(bm.verts.new(c + d * (sx * hl) + side * (sy * hw) + up * (sz * hh)))
                idx = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
                for f in idx:
                    bm.faces.new([vs[i] for i in f])
    for bm, nm, m in ((bm_body, 'PlugBodies', MAT['plug']), (bm_boot, 'PlugBoots', boot_mat)):
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.0012, segments=2, affect='EDGES', profile=0.5)
        me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
        for f in me.polygons:
            f.use_smooth = True
        L.obj_from_mesh(nm + boot_mat.name, me, m)


# ----------------------------------------------------------------------------- the tidy last beat
RACK = dict(x0=-0.36, x1=0.16, z0=0.42, z1=0.72, d=0.15)     # small wall-mounted cabinet left of the socket
PANEL = dict(rows=(0.635, 0.585), cols=10, face=-0.130)      # 2 x 10 ports, oversized a touch so they read
EMPTY = (0, 7)                                               # (row, col) of the one empty port: top row
TRUNK_R = 0.0173                                             # 19 strands, hex packed


def _seg(out, q, ds):
    p = out[-1]
    n = max(1, int((q - p).length / ds))
    for k in range(1, n + 1):
        out.append(p.lerp(q, k / n))


def corner_path(corners, r=0.07, ds=0.008):
    """A polyline through the corner points with each corner rounded (a bundle bends on a radius)."""
    C = [Vector(c) for c in corners]
    out = [C[0].copy()]
    for i in range(1, len(C) - 1):
        a, b, c = C[i - 1], C[i], C[i + 1]
        din = (b - a); lin = din.length; din.normalize()
        dout = (c - b); lout = dout.length; dout.normalize()
        rr = min(r, lin * 0.5, lout * 0.5)
        p0 = b - din * rr; p2 = b + dout * rr
        _seg(out, p0, ds)
        n = max(4, int(2.2 * rr / ds))
        for k in range(1, n + 1):
            t = k / n
            out.append((1 - t) ** 2 * p0 + 2 * (1 - t) * t * b + t * t * p2)
    _seg(out, C[-1], ds)
    return out


def frames(P):
    """Parallel-transport frames, so the strands keep their places round the bends (no twisting)."""
    T = []
    for i in range(len(P)):
        a = P[max(i - 1, 0)]; b = P[min(i + 1, len(P) - 1)]
        T.append((b - a).normalized())
    ref = Vector((1, 0, 0)) if abs(T[0].x) < 0.9 else Vector((0, 0, 1))
    n = (ref - T[0] * ref.dot(T[0])).normalized()
    N = []
    for i in range(len(P)):
        if i > 0:
            ax = T[i - 1].cross(T[i])
            if ax.length > 1e-9:
                n = Matrix.Rotation(T[i - 1].angle(T[i]), 3, ax.normalized()) @ n
            n = (n - T[i] * n.dot(T[i])).normalized()
        N.append(n.copy())
    return T, N, [T[i].cross(N[i]) for i in range(len(P))]


def hex19(s):
    o = [(0.0, 0.0)]
    for k in range(6):
        a = math.radians(60 * k); o.append((s * math.cos(a), s * math.sin(a)))
    for k in range(6):
        a = math.radians(60 * k); o.append((2 * s * math.cos(a), 2 * s * math.sin(a)))
        a = math.radians(60 * k + 30); o.append((s * math.sqrt(3) * math.cos(a), s * math.sqrt(3) * math.sin(a)))
    return o


def curve_obj(name, polys, mat, radius=R_CABLE, cyclic=False):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_mode = 'ROUND'; cu.bevel_depth = radius; cu.bevel_resolution = 2; cu.use_fill_caps = True
    for P in polys:
        sp = cu.splines.new('POLY'); sp.points.add(len(P) - 1)
        flat = []
        for p in P:
            flat += [p[0], p[1], p[2], 1.0]
        sp.points.foreach_set('co', flat)
        sp.use_smooth = True; sp.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(name, cu); sc.collection.objects.link(ob); cu.materials.append(mat)
    return ob


def tidy():
    """The same room, tidied: the 105 cables gathered into three velcro-tied trunks that come out of a
    cable tray under the desk, run along the skirting and up the wall into a small rack, where every
    port is full except one."""
    rnd = random.Random(21)
    neutral = ['grey'] * 4 + ['grey2'] * 3 + ['white'] * 2 + ['black'] * 3
    pick = lambda: 'new' if rnd.random() < 14 / 105 else rnd.choice(neutral)
    strands = {}
    r = RACK
    # cabinet: dark powder-coat box, open at the front
    L.box('RackBack', r['x0'], r['x1'], -0.012, 0.0, r['z0'], r['z1'], MAT['steel'])
    L.box('RackTop', r['x0'], r['x1'], -r['d'], 0.0, r['z1'] - 0.012, r['z1'], MAT['steel'], bevel=0.002)
    L.box('RackBottom', r['x0'], r['x1'], -r['d'], 0.0, r['z0'], r['z0'] + 0.012, MAT['steel'], bevel=0.002)
    for x in (r['x0'], r['x1'] - 0.012):
        L.box('RackSide', x, x + 0.012, -r['d'], 0.0, r['z0'], r['z1'], MAT['steel'], bevel=0.002)
    px0, px1 = r['x0'] + 0.03, r['x1'] - 0.03
    L.box('PatchPanel', px0, px1, PANEL['face'], PANEL['face'] + 0.006, 0.556, 0.664, MAT['panel'], bevel=0.0015)
    L.box('CableManager', px0, px1, -0.142, -0.012, 0.470, 0.530, MAT['steel'], bevel=0.002)
    L.box('ManagerLip', px0, px1, -0.146, -0.138, 0.470, 0.545, MAT['rubber'], bevel=0.001)
    pitch = (px1 - px0 - 0.03) / PANEL['cols']
    holes = bmesh.new(); bodies = bmesh.new(); boots = {}
    def cube(bm, x0, x1, y0, y1, z0, z1):
        vs = [bm.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
        for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
            bm.faces.new([vs[i] for i in f])
    fy = PANEL['face']
    port_xyz = {}
    for ri, zr in enumerate(PANEL['rows']):
        for ci in range(PANEL['cols']):
            x = px0 + 0.015 + pitch * (ci + 0.5)
            port_xyz[(ri, ci)] = (x, fy - 0.002, zr)
            cube(holes, x - 0.0085, x + 0.0085, fy - 0.0012, fy + 0.0005, zr - 0.0072, zr + 0.0072)
            if (ri, ci) == EMPTY:
                continue
            col = pick()
            while col == 'black':                    # a black boot reads as a second empty port
                col = pick()
            cube(bodies, x - 0.0072, x + 0.0072, fy - 0.016, fy - 0.001, zr - 0.0058, zr + 0.0050)
            cube(boots.setdefault(col, bmesh.new()), x - 0.0080, x + 0.0080, fy - 0.036, fy - 0.015, zr - 0.0068, zr + 0.0062)
            # the patch lead drops from the boot into the cable manager: top row in front of the bottom row
            out = -0.072 if ri == 0 else -0.050
            xm = x + rnd.uniform(-0.006, 0.006)
            P = corner_path([(x, fy - 0.034, zr - 0.001), (x, fy + out, zr - 0.006), (xm, fy + out + 0.004, 0.548),
                             (xm, -0.11, 0.515)], r=0.03, ds=0.004)
            strands.setdefault(col, []).append(P)
    for bm, nm, m in [(holes, 'PortHoles', MAT['rubber']), (bodies, 'PortPlugs', MAT['plug'])] + \
                     [(b, 'Boots_' + c, CAB[c]) for c, b in boots.items()]:
        me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
        L.obj_from_mesh(nm, me, m)
    # cable tray hung under the back of the desk (hidden by the desk top and apron from the camera)
    L.box('DeskTray', 0.70, 1.80, -0.23, -0.02, 0.575, 0.585, MAT['steel'])
    L.box('DeskTrayF', 0.70, 1.80, -0.23, -0.222, 0.575, 0.625, MAT['steel'])
    # three trunks: up out of the tray, down behind the desk, along the skirting, up the wall into the rack
    yw = -0.036
    plan = [(-0.02, yw, 1.66), (-0.12, -0.152, 1.26), (-0.22, -0.198, 0.86)]   # (wall x, floor y, desk-end x)
    offs = hex19(2 * R_CABLE * 1.02)
    ties = []
    trunk_mid = []
    for k, (xw, yf, xe) in enumerate(plan):
        zf = TRUNK_R
        cn = [(xw, yw, r['z0'] + 0.06), (xw, yw, zf)]
        if abs(yf - yw) > 1e-6:
            cn.append((xw, yf, zf))
        cn += [(xe, yf, zf), (xe, yf, 0.60)]
        C = corner_path(cn, r=0.075, ds=0.008)
        T, N, B = frames(C)
        cols = [pick() for _ in offs]
        arc = np.concatenate([[0.0], np.cumsum([(C[i] - C[i - 1]).length for i in range(1, len(C))])])
        tw = 2 * math.pi * arc / 0.55                    # a loose lay: the strands spiral once per 55 cm
        for (a, b), col in zip(offs, cols):
            a += rnd.uniform(-0.0004, 0.0004); b += rnd.uniform(-0.0004, 0.0004)
            P = []
            for i in range(len(C)):
                ca, sa = math.cos(tw[i]), math.sin(tw[i])
                P.append(tuple(C[i] + N[i] * (a * ca - b * sa) + B[i] * (a * sa + b * ca)))
            strands.setdefault(col, []).append(P)
        # velcro ties every ~22 cm on the straight runs
        acc = 0.0; last = -1.0
        for i in range(1, len(C) - 1):
            acc += (C[i] - C[i - 1]).length
            straight = T[i - 1].dot(T[i + 1]) > 0.9995
            if straight and acc - last > 0.22 and acc > 0.10:
                last = acc
                ring = [tuple(C[i] + (N[i] * math.cos(t) + B[i] * math.sin(t)) * (TRUNK_R + 0.0018))
                        for t in np.linspace(0, 2 * math.pi, 28, endpoint=False)]
                ties.append(ring)
        trunk_mid.append(C[len(C) // 2])
    for col, Ps in strands.items():
        curve_obj('Tidy_' + col, Ps, CAB[col])
    curve_obj('VelcroTies', ties, MAT['rubber'], radius=0.0024, cyclic=True)
    e = port_xyz[EMPTY]
    return dict(rack=((px0 + px1) / 2, PANEL['face'] - 0.02, (PANEL['rows'][0] + PANEL['rows'][1]) / 2),
                rack_port=e, rack_left=(r['x0'], -r['d'], (r['z0'] + r['z1']) / 2),
                trunks=(0.30, -0.10, TRUNK_R * 2))


# ----------------------------------------------------------------------------- build
win = room()
desk()
chair()
shelf()
socket()
mugs(PEOPLE)
if TIDY:
    MAT['panel'] = L.simple_mat('PanelFace', (0.74, 0.75, 0.76), rough=0.38)
    cables = []
    TIDY_PTS = tidy()
else:
    cables = build_heap(CABLES)
    cable_objects(cables)
print('HEAP cables', len(cables), 'max height', float(Hf.max()))

# ----------------------------------------------------------------------------- light
# One light idea: late-morning daylight through the window on the left. Skylight from the opening
# (an area light filling the window, as a portal would), a low sun cut into panes by the glazing bars,
# and the open front of the set lit by an overcast sky (the room behind the photographer).
wy0, wy1, wz0, wz1, wx = win
sky = L.area_light('WindowSky', (wx + 0.02, (wy0 + wy1) / 2, (wz0 + wz1) / 2), (wx + 3, (wy0 + wy1) / 2 + 0.3, 1.1),
                   wy1 - wy0, wz1 - wz0, A['window'], kelvin=7200)
if A['sun'] > 0:
    L.sun_light('Sun', A['sunel'], A['sunaz'], A['sun'], angle_deg=1.0, kelvin=5300)
L.world_hdri(sc, 'kloofendal_overcast', strength=A['world'], rot_z_deg=40.0)

# ----------------------------------------------------------------------------- camera
if A['camera'] == 'desktop':
    cam = L.camera((0.10, -4.35, 1.52), (0.10, 0.0, 1.52), focal=35.0, fstop=A['fstop'], focus=3.45)
    cam.data.shift_y = -0.235
elif A['camera'] == 'phonesite':
    # heap site phone frames: from further left and back, panned harder, so all 15 mugs stay in frame
    cam = L.camera((-1.40, -3.0, 1.45), (0.75, 0.0, 1.45), focal=27.0, fstop=A['fstop'], focus=2.6)
    cam.data.sensor_fit = 'AUTO'
    cam.data.shift_y = -0.30
else:
    # a phone held level a step to the left, turned toward the desk (pan only: verticals stay true)
    cam = L.camera((-0.50, -3.0, 1.45), (0.45, 0.0, 1.45), focal=26.0, fstop=A['fstop'], focus=2.05)
    cam.data.sensor_fit = 'AUTO'
    cam.data.shift_y = -0.26

# anchors for the HTML layer: where things land in the frame (0..1 from the top-left)
from bpy_extras.object_utils import world_to_camera_view
import json
allp = np.array([p for P in cables for p in P]).reshape(-1, 3)
near = allp[np.hypot(allp[:, 0] - PILE[0], allp[:, 1] - PILE[1]) < 0.55]
htop = near[np.argmax(near[:, 2])] if len(near) else np.array([PILE[0], PILE[1], 0.2])
lastx = MUG_X0 + MUG_STEP * (PEOPLE - 1)
pts = {
    'mugs_left': (MUG_X0 - 0.045, -SHELF['d'] / 2, SHELF['z'] + 0.05),
    'mugs_right': (lastx + 0.045, -SHELF['d'] / 2, SHELF['z'] + 0.05),
    'mugs_top': ((MUG_X0 + lastx) / 2, -SHELF['d'] / 2, SHELF['z'] + 0.097),
    'shelf_under': (SHELF['x0'], 0.0, SHELF['z'] - 0.2),
    'heap_top': tuple(map(float, htop)),
    'heap_left': (PILE[0] - 0.55, PILE[1], 0.05),
    'floor_wall_left': (-1.8, 0.0, 0.0),
    'desk_top': (1.2, -0.4, DESK['top']),
    'desk_left_top': (DESK['x0'], DESK['y0'], DESK['top']),
}
if TIDY:
    pts['heap_top'] = (PILE[0], PILE[1], 0.0)                # where the pile was: bare floor now
    pts.update(TIDY_PTS)
bpy.context.view_layer.update()
anch = {}
for k, v in pts.items():
    co = world_to_camera_view(sc, cam, Vector(v))
    x, y = 0.5 + (co.x - 0.5) * 1.012, 0.5 + ((1 - co.y) - 0.5) * 1.012     # post() crops 1.2 % (lens hood)
    anch[k] = [round(x, 4), round(y, 4)]
os.makedirs(os.path.dirname(A['out']), exist_ok=True)
with open(os.path.splitext(A['out'])[0] + '.anchors.json', 'w') as f:
    json.dump(dict(state=A['state'], camera=A['camera'], people=PEOPLE, cables=CABLES if TIDY else len(cables),
                   anchors=anch), f, indent=1)
print('ANCHORS', anch)

if A['dump']:
    with open(A['dump'], 'w') as f:
        json.dump(dict(cables=[[list(map(lambda v: round(v, 4), p)) for p in P] for P in cables],
                       hf=dict(x0=HX0, y0=HY0, g=G)), f)
    print('DUMP', A['dump'], len(cables))
if A['dry']:
    dg = bpy.context.evaluated_depsgraph_get()
    sun = bpy.data.objects.get('Sun')
    if sun:
        dvec = (sun.matrix_world.to_3x3() @ Vector((0, 0, -1))).normalized()
        print('SUN travel dir', tuple(round(v, 3) for v in dvec))
        for fx, fy in [(-0.6, -1.3), (-0.3, -1.6), (0.2, -1.4), (0.6, -1.2), (1.2, -1.6), (-0.9, -0.5)]:
            o = Vector((fx, fy, 0.01))
            hit, loc, nrm, idx, ob, mat = sc.ray_cast(dg, o, -dvec)
            print('floor', fx, fy, 'toward sun hits', ob.name if hit else None, tuple(round(v, 2) for v in loc) if hit else '')
    sys.exit(0)
L.post(sc, grain=A['grain'], vignette=0.22, dispersion=0.003, glare=0.08, seed=A['seed'])
L.render(sc, A['out'], A['label'], extra=dict(idea='02-heap', state=A['state'], camera=A['camera'],
                                                people=PEOPLE, cables=len(cables)))
