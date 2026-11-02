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
                seed=11, exposure=0.0, sun=3.2, window=900.0, world=0.25, fstop=5.6, label='heap',
                grain=0.07, wall='slate', look='AgX - Medium High Contrast'))
if not os.path.isabs(A['out']):
    A['out'] = os.path.join(ROOT, A['out'])

PEOPLE = 8 if A['state'] == 'first' else 15
CABLES = PEOPLE * (PEOPLE - 1) // 2          # 28 or 105: one cable per pair of people
R_CABLE = 0.0034                             # Cat6 patch cable, ~6.8 mm jacket

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=0.03, look=A['look'], exposure=A['exposure'],
               transmission=6, diffuse=3, glossy=3, clamp_indirect=3.0, seed=7)

# ----------------------------------------------------------------------------- layout (metres)
ROOM_X = (-2.4, 2.4)
ROOM_Y = (-5.2, 0.0)
CEIL = 2.7
DESK = dict(x0=0.45, x1=1.95, y0=-0.76, y1=-0.04, top=0.745, th=0.030)
CHAIR = dict(cx=1.02, cy=-1.10, rot=-10.0, w=0.42, d=0.40, seat=0.46, back=0.86)
SHELF = dict(x0=0.22, x1=2.30, z=1.30, d=0.19, th=0.026)
MUG_X0, MUG_STEP = 0.32, 0.132
PILE = (-0.12, -1.02)                        # the heap beside the desk


# ----------------------------------------------------------------------------- materials
def wall_mat():
    tint = {'slate': (0.050, 0.060, 0.066), 'olive': (0.060, 0.064, 0.050)}[A['wall']]
    m = L.pbr('Wall', 'painted_plaster_wall', scale=0.45, tint=tint, rough_add=0.08, normal_strength=0.6,
              bump=0.15, coords='Object')
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
MAT['floor'] = L.pbr('Floor', 'wood_floor', scale=0.42, rough_add=0.02, normal_strength=0.8)
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
    # left wall with a window opening (y -3.1..-1.0, z 0.85..2.30); the window itself is out of frame
    wy0, wy1, wz0, wz1 = -3.1, -1.0, 0.85, 2.30
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
        if g < 0.62:
            break
        x -= 0.03 * gx / g + rng.normal(0, 0.006)
        y -= 0.03 * gy / g + rng.normal(0, 0.006)
        x = min(max(x, HX0 + 0.3), HX1 - 0.3); y = min(max(y, HY0 + 0.3), HY1 - 0.15)
    return (x, y)


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
        if t < z - ds * 1.2:                    # an edge: hang
            while z - ds > t:
                z -= ds
                x += math.cos(th) * ds * 0.08; y += math.sin(th) * ds * 0.08
                pts.append((x, y, z))
            z = t
            x, y = nx_, ny_
        else:
            x, y, z = nx_, ny_, max(t, z - ds * 0.9)
        pts.append((x, y, z))
    return pts


def relax(P, floor, it=60, g=0.00015):
    z = np.array([p[2] for p in P]); f = np.array(floor)
    for _ in range(it):
        z[1:-1] = np.maximum(f[1:-1], 0.5 * (z[:-2] + z[2:]) - g)
    return [(p[0], p[1], float(zz)) for p, zz in zip(P, z)]


def coil(center, rng):
    """A new cable as it comes out of the box: a loose coil of 3-7 loops, dropped, one or two loops
    sprung, both ends trailing out with their plugs."""
    R = rng.uniform(0.14, 0.21)
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
    c, s = math.cos(rot), math.sin(rot)
    X = center[0] + c * lx - s * ly; Y = center[1] + s * lx + c * ly
    if not all(inside(a, b) for a, b in zip(X, Y)):
        return None
    t = np.array([t_at(a, b) for a, b in zip(X, Y)])
    if t.max() - t.min() > 0.30:
        return 'steep'
    # rest the ring on what is under it: least-squares tilt, then up until nothing sinks
    M = np.stack([np.ones_like(X), X - center[0], Y - center[1]], 1)
    coef, *_ = np.linalg.lstsq(M, t, rcond=None)
    plane = M @ coef
    zc = plane + dz
    off = np.max(t + R_CABLE - zc)
    zc = zc + off
    floor = np.maximum(t + R_CABLE, zc - 0.012)
    ring = relax([(a, b, z) for a, b, z in zip(X, Y, zc)], floor, it=25, g=0.0002)
    # trailing ends
    h0 = math.atan2(ring[1][1] - ring[0][1], ring[1][0] - ring[0][0]) + math.pi
    h1 = math.atan2(ring[-1][1] - ring[-2][1], ring[-1][0] - ring[-2][0])
    tail0 = walk(ring[0][:2], h0 + rng.normal(0, 0.4), rng.uniform(0.15, 0.9), rng, z0=ring[0][2],
                 home=center, home_r=0.75)
    tail1 = walk(ring[-1][:2], h1 + rng.normal(0, 0.4), rng.uniform(0.25, 1.3), rng, z0=ring[-1][2],
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
        return (PILE[0] + rng.normal(0, 0.20), PILE[1] + rng.normal(0, 0.16))
    r = rng.uniform()
    if r < 0.40:
        return (PILE[0] + 0.25 + rng.normal(0, 0.38), PILE[1] - 0.05 + rng.normal(0, 0.28))
    if r < 0.64:
        return (rng.uniform(DESK['x0'] + 0.2, DESK['x1'] - 0.15), rng.uniform(DESK['y0'] + 0.12, DESK['y1'] - 0.12))
    if r < 0.82:
        return (CHAIR['cx'] + rng.normal(0, 0.12), CHAIR['cy'] + rng.normal(0, 0.10))
    return (rng.uniform(-1.6, 1.9), rng.uniform(-1.9, -1.2))


def build_heap(n):
    terrain()
    cables = []
    for i in range(n):
        rng = np.random.default_rng(A['seed'] * 1000 + i)
        kind = 'coil' if rng.uniform() < (0.78 if i < 28 else 0.70) else 'tangle'
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


# ----------------------------------------------------------------------------- build
win = room()
desk()
chair()
shelf()
mugs(PEOPLE)
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
    L.sun_light('Sun', 27.0, 243.0, A['sun'], angle_deg=1.2, kelvin=5200)
L.world_hdri(sc, 'kloofendal_overcast', strength=A['world'], rot_z_deg=40.0)

# ----------------------------------------------------------------------------- camera
if A['camera'] == 'desktop':
    cam = L.camera((0.10, -4.35, 1.52), (0.10, 0.0, 1.52), focal=35.0, fstop=A['fstop'], focus=3.45)
    cam.data.shift_y = -0.235
else:
    cam = L.camera((0.36, -3.35, 1.45), (0.36, 0.0, 1.45), focal=26.0, fstop=A['fstop'], focus=2.55)
    cam.data.sensor_fit = 'AUTO'
    cam.data.shift_y = -0.245

L.post(sc, grain=A['grain'], vignette=0.22, dispersion=0.003, glare=0.08, seed=A['seed'])
L.render(sc, A['out'], A['label'], extra=dict(idea='02-heap', state=A['state'], camera=A['camera'],
                                                people=PEOPLE, cables=len(cables)))
