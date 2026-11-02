"""Idea 1, Redline: a worn engine-room instrument panel with two analogue gauges under glass.

  python3 tools/render_idle.py blender -b -P ideas/01-redline/scene.py -- \
      --state first|key --camera desktop|phone --w 1440 --h 900 --samples 24 --out out/ideas/01-redline/x.png

Left gauge, COORDINATION: pathways n(n-1)/2 on a linear 0..120 dial, a long tick per hire, red from 72.
Right gauge, CAPACITY: people 0..22. --state first = 8 people (28 pathways), key = 13 people (78).
--n overrides the team size.

The stand-in for the real production in the 09 entry ("buy a real used gauge, print our own dial
faces, shoot each needle position on a locked camera"): the faces are printed artwork
(make_dials.py), the needles are separate objects turned by code, the camera is locked.

Scene (metres; Blender Z up, panel front on y=0, camera on -Y):
  painted steel panel (Poly Haven green_metal_rust, greyed), holes cut for the gauge cases
  two flange-mounted gauges: black bezel worn to steel on the lip, glass with dust and smudges,
  printed dial recessed 5.5 mm behind the panel, white needles 3.5 mm above the dial
  engraved laminate label plates under each gauge, slotted screws
  one light idea: a big mullioned window to the left of the photographer (four area panes, so the
  glass shows a real window reflection), plus a dim warehouse HDRI for fill
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'lookdev'))
import lib_lookdev as lib

A = lib.args(dict(state='first', camera='desktop', w=640, h=400, samples=12, out='out/ideas/01-redline/test.png',
                  n=0, exposure=0.0, win=1.0, hdri=0.25, yaw=16.0, fstop=5.6, look='AgX - Base Contrast',
                  grain=0.07, sat=0.45, val=0.62, seed=7, save=''))

MM = 0.001
GAP = 0.215                      # gauge centre to centre
GAUGES = {'L': (0.0, 0.0), 'R': (GAP, 0.0)}
VMAX = {'L': 120.0, 'R': 22.0}


# ----------------------------------------------------------------------------- geometry helpers

def lathe(name, prof, segs=160, mat=None, wear=None):
    """Spin a profile [(r_mm, h_mm)] about the gauge axis (Y; h = height towards the camera, y = -h).
    Air is on the RIGHT of the direction of travel in (r, h); faces are wound to face the air.
    wear: optional per-profile-point floats stored as the 'wear' point attribute (edge wear mask)."""
    bm = bmesh.new()
    rows = []
    for (r, h) in prof:
        row = []
        for j in range(segs):
            p = 2 * math.pi * j / segs
            row.append(bm.verts.new((r * MM * math.cos(p), -h * MM, r * MM * math.sin(p))))
        rows.append(row)
    for i in range(len(prof) - 1):
        (r0, h0), (r1, h1) = prof[i], prof[i + 1]
        dr, dh = r1 - r0, h1 - h0
        for j in range(segs):
            k = (j + 1) % segs
            vs = (rows[i][j], rows[i + 1][j], rows[i + 1][k], rows[i][k])
            if len({v.index for v in vs}) < 4 and r0 == 0 and r1 == 0:
                continue
            try:
                f = bm.faces.new(vs)
            except ValueError:
                continue
            f.normal_update()
            p = 2 * math.pi * (j + 0.5) / segs
            radial = Vector((math.cos(p), 0, math.sin(p)))
            expect = radial * dh + Vector((0, -1, 0)) * (-dr)     # right of travel: (dh, -dr)
            if f.normal.dot(expect) < 0:
                f.normal_flip()
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-7)
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    lib._sharp_by_angle(me, 40)
    if wear is not None:
        at = me.attributes.new('wear', 'FLOAT', 'POINT')
        nseg = segs
        # vertex order after remove_doubles is preserved for non-merged rows; map by radius/height
        prof_w = {(round(r, 4), round(h, 4)): w for (r, h), w in zip(prof, wear)}
        for v in me.vertices:
            r = math.hypot(v.co.x, v.co.z) / MM
            h = -v.co.y / MM
            best = min(prof_w.items(), key=lambda kv: (kv[0][0] - r) ** 2 + (kv[0][1] - h) ** 2)
            at.data[v.index].value = best[1]
    return lib.obj_from_mesh(name, me, mat)


def disc_uv(name, r, h, mat, segs=256):
    """Flat printed disc facing the camera at height h (mm), UV 0..1 across its diameter."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    c = bm.verts.new((0, -h * MM, 0))
    ring = [bm.verts.new((r * MM * math.cos(2 * math.pi * j / segs), -h * MM, r * MM * math.sin(2 * math.pi * j / segs)))
            for j in range(segs)]
    for j in range(segs):
        f = bm.faces.new((c, ring[(j + 1) % segs], ring[j]))
        f.normal_update()
        if f.normal.y > 0:
            f.normal_flip()
        for lp in f.loops:
            lp[uv].uv = (lp.vert.co.x / (2 * r * MM) + 0.5, lp.vert.co.z / (2 * r * MM) + 0.5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return lib.obj_from_mesh(name, me, mat)


def prism(name, outline, h0, h1, mat):
    """Extrude a 2D outline [(x_mm, z_mm)] between heights h0..h1 (mm towards the camera)."""
    bm = bmesh.new()
    lo = [bm.verts.new((x * MM, -h0 * MM, z * MM)) for x, z in outline]
    hi = [bm.verts.new((x * MM, -h1 * MM, z * MM)) for x, z in outline]
    bm.faces.new(hi)
    bm.faces.new(lo[::-1])
    n = len(outline)
    for i in range(n):
        bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return lib.obj_from_mesh(name, me, mat)


def circle_pts(r, n=48, cx=0.0, cz=0.0):
    return [(cx + r * math.cos(2 * math.pi * i / n), cz + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def place(ob, x, z, y=0.0):
    ob.location = (x, y, z)
    return ob


# ----------------------------------------------------------------------------- materials

def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def panel_mat():
    """Poly Haven green_metal_rust (CC0), greyed towards machinery grey-green, with grime in the
    corners (AO) so the bezels sit in the paint rather than on it."""
    m = lib.pbr('Panel', 'green_metal_rust', scale=1.0, normal_strength=0.8, bump=0.25, specular=0.45)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    src = bsdf.inputs['Base Color'].links[0].from_socket
    hsv = node(nt, 'ShaderNodeHueSaturation', Saturation=A['sat'], Value=A['val'], Fac=1.0)
    hsv.inputs['Hue'].default_value = 0.52
    lib.link(nt, src, hsv.inputs['Color'])
    ao = nt.nodes.new('ShaderNodeAmbientOcclusion')
    ao.samples = 8
    ao.inputs['Distance'].default_value = 0.012
    mr = node(nt, 'ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0.2; mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value = 0.55; mr.inputs['To Max'].default_value = 1.0
    lib.link(nt, ao.outputs['AO'], mr.inputs['Value'])
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MULTIPLY')
    f_.default_value = 1.0
    lib.link(nt, hsv.outputs['Color'], a_)
    cm = nt.nodes.new('ShaderNodeCombineColor')
    for k in ('Red', 'Green', 'Blue'):
        lib.link(nt, mr.outputs['Result'], cm.inputs[k])
    lib.link(nt, cm.outputs['Color'], b_)
    lib.link(nt, r_, bsdf.inputs['Base Color'])
    # satin paint, not chalk: pull the scanned roughness towards 0.5
    rs = bsdf.inputs['Roughness'].links[0].from_socket
    rr = node(nt, 'ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = 0.38; rr.inputs['To Max'].default_value = 0.72
    lib.link(nt, rs, rr.inputs['Value'])
    lib.link(nt, rr.outputs['Result'], bsdf.inputs['Roughness'])
    return m


def dust_on_top(nt, base_col_socket, bsdf, amount=0.35):
    """Grey dust on faces that point up (normal z > 0.35), broken up by noise."""
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    lib.link(nt, geo.outputs['Normal'], sep.inputs['Vector'])
    up = node(nt, 'ShaderNodeMapRange')
    up.inputs['From Min'].default_value = 0.35; up.inputs['From Max'].default_value = 0.9
    lib.link(nt, sep.outputs['Z'], up.inputs['Value'])
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 180.0; nz.inputs['Detail'].default_value = 6.0
    lib.link(nt, geo.outputs['Position'], nz.inputs['Vector'])
    k = node(nt, 'ShaderNodeMapRange')
    k.inputs['From Min'].default_value = 0.42; k.inputs['From Max'].default_value = 0.62
    k.inputs['To Max'].default_value = amount
    lib.link(nt, nz.outputs['Fac'], k.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    lib.link(nt, up.outputs['Result'], mul.inputs[0]); lib.link(nt, k.outputs['Result'], mul.inputs[1])
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, mul.outputs[0], f_); lib.link(nt, base_col_socket, a_)
    b_.default_value = (*lib.srgb_to_lin((0.42, 0.41, 0.38)), 1)
    lib.link(nt, r_, bsdf.inputs['Base Color'])
    return mul.outputs[0]


def bezel_mat():
    """Black satin paint over steel; the paint is worn through on the lip (profile 'wear' attribute
    times noise), dust on the upper arc."""
    m = bpy.data.materials.new('Bezel')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'wear'
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 90.0; nz.inputs['Detail'].default_value = 8.0; nz.inputs['Roughness'].default_value = 0.7
    lib.link(nt, geo.outputs['Position'], nz.inputs['Vector'])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    lib.link(nt, at.outputs['Fac'], mul.inputs[0]); lib.link(nt, nz.outputs['Fac'], mul.inputs[1])
    th = node(nt, 'ShaderNodeMapRange')
    th.inputs['From Min'].default_value = 0.40; th.inputs['From Max'].default_value = 0.47
    lib.link(nt, mul.outputs[0], th.inputs['Value'])
    wear = th.outputs['Result']
    mc, f_, a_, b_, col = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, wear, f_)
    a_.default_value = (*lib.srgb_to_lin((0.075, 0.075, 0.072)), 1)
    b_.default_value = (*lib.srgb_to_lin((0.62, 0.60, 0.56)), 1)
    lib.link(nt, wear, bsdf.inputs['Metallic'])
    # paint roughness from the scanned metal plate map, 0.32..0.5
    rm = lib._img(nt, lib._maps('metal_plate')['rough'], True)
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (6, 6, 6)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    lib.link(nt, tc.outputs['Object'], mp.inputs['Vector']); lib.link(nt, mp.outputs['Vector'], rm.inputs['Vector'])
    rr = node(nt, 'ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = 0.30; rr.inputs['To Max'].default_value = 0.52
    lib.link(nt, rm.outputs['Color'], rr.inputs['Value'])
    mr, f2, a2, b2, rough = lib.mix(nt, 'FLOAT')
    lib.link(nt, wear, f2); lib.link(nt, rr.outputs['Result'], a2); b2.default_value = 0.28
    lib.link(nt, rough, bsdf.inputs['Roughness'])
    dust_on_top(nt, col, bsdf, amount=0.45)
    return m


def steel_mat(name='Steel', col=(0.30, 0.29, 0.27), rough=0.42):
    m = lib.simple_mat(name, col, rough=rough, metallic=1.0)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 600.0
    rr = node(nt, 'ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = rough - 0.12; rr.inputs['To Max'].default_value = rough + 0.15
    lib.link(nt, nz.outputs['Fac'], rr.inputs['Value'])
    lib.link(nt, rr.outputs['Result'], bsdf.inputs['Roughness'])
    return m


def glass_mat():
    """Instrument glass: clear, a little dust and a smudge or two (roughness), shadow rays pass."""
    m = bpy.data.materials.new('GaugeGlass')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs['IOR'].default_value = 1.52
    bsdf.inputs['Base Color'].default_value = (0.97, 0.985, 0.975, 1)
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sm = nt.nodes.new('ShaderNodeTexNoise')
    sm.inputs['Scale'].default_value = 22.0; sm.inputs['Detail'].default_value = 4.0; sm.inputs['Roughness'].default_value = 0.6
    lib.link(nt, geo.outputs['Position'], sm.inputs['Vector'])
    rr = node(nt, 'ShaderNodeMapRange')
    rr.inputs['From Min'].default_value = 0.5; rr.inputs['From Max'].default_value = 0.75
    rr.inputs['To Min'].default_value = 0.012; rr.inputs['To Max'].default_value = 0.10
    lib.link(nt, sm.outputs['Fac'], rr.inputs['Value'])
    lib.link(nt, rr.outputs['Result'], bsdf.inputs['Roughness'])
    # dust specks: small voronoi dots, faint
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 900.0
    lib.link(nt, geo.outputs['Position'], vo.inputs['Vector'])
    dm = node(nt, 'ShaderNodeMapRange')
    dm.inputs['From Min'].default_value = 0.10; dm.inputs['From Max'].default_value = 0.0
    lib.link(nt, vo.outputs['Distance'], dm.inputs['Value'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40.0
    lib.link(nt, geo.outputs['Position'], nz.inputs['Vector'])
    gate = node(nt, 'ShaderNodeMapRange')
    gate.inputs['From Min'].default_value = 0.5; gate.inputs['From Max'].default_value = 0.62
    lib.link(nt, nz.outputs['Fac'], gate.inputs['Value'])
    dmul = nt.nodes.new('ShaderNodeMath'); dmul.operation = 'MULTIPLY'
    lib.link(nt, dm.outputs['Result'], dmul.inputs[0]); lib.link(nt, gate.outputs['Result'], dmul.inputs[1])
    haze = nt.nodes.new('ShaderNodeMath'); haze.operation = 'MULTIPLY_ADD'
    lib.link(nt, gate.outputs['Result'], haze.inputs[0]); haze.inputs[1].default_value = 0.04
    lib.link(nt, dmul.outputs[0], haze.inputs[2])
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
    dif.inputs['Color'].default_value = (*lib.srgb_to_lin((0.55, 0.54, 0.5)), 1)
    ms = nt.nodes.new('ShaderNodeMixShader')
    lib.link(nt, haze.outputs[0], ms.inputs['Fac'])
    lib.link(nt, bsdf.outputs['BSDF'], ms.inputs[1]); lib.link(nt, dif.outputs['BSDF'], ms.inputs[2])
    out = nt.nodes['Material Output']
    lib.link(nt, ms.outputs['Shader'], out.inputs['Surface'])
    lib.shadow_transparent(m, tint=(0.96, 0.975, 0.965))
    return m


def dial_mat(name, png):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tx = nt.nodes.new('ShaderNodeTexImage')
    tx.image = bpy.data.images.load(os.path.join(HERE, 'tex', png))
    tx.interpolation = 'Cubic'
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    lib.link(nt, uv.outputs['UV'], tx.inputs['Vector'])
    lib.link(nt, tx.outputs['Color'], bsdf.inputs['Base Color'])
    # printed ink is a touch smoother than the matte face
    bw = nt.nodes.new('ShaderNodeRGBToBW')
    lib.link(nt, tx.outputs['Color'], bw.inputs['Color'])
    rr = node(nt, 'ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = 0.72; rr.inputs['To Max'].default_value = 0.5
    lib.link(nt, bw.outputs['Val'], rr.inputs['Value'])
    lib.link(nt, rr.outputs['Result'], bsdf.inputs['Roughness'])
    bsdf.inputs['Specular IOR Level'].default_value = 0.35
    return m


def plate_mat(name, png):
    m = dial_mat(name, png)
    return m


# ----------------------------------------------------------------------------- build

def build_gauge(key, mats):
    cx, cz = GAUGES[key]
    # flange + bezel + case wall, as one lathe; wear high on the lip
    prof = [(98.0, 0.0), (98.0, 1.4), (97.0, 2.0), (90.0, 2.0), (88.6, 2.8), (88.0, 6.0), (87.0, 9.2), (85.2, 11.0),
            (82.5, 11.8), (79.5, 11.6), (77.4, 10.7), (76.4, 9.4), (76.0, 8.6), (76.0, 0.0), (76.0, -6.0)]
    wear = [0.0, 0.4, 0.7, 0.2, 0.5, 0.25, 0.6, 0.95, 1.0, 0.85, 0.75, 0.55, 0.1, 0.0, 0.0]
    bz = place(lathe(f'Bezel{key}', prof, mat=mats['bezel'], wear=wear), cx, cz)
    face = place(disc_uv(f'Dial{key}', 75.95, -5.5, mats['dial' + key]), cx, cz)
    # glass: 2.4 mm thick disc sitting under the lip
    gl = place(lathe(f'Glass{key}', [(0.0, 6.0), (75.95, 6.0), (75.95, 8.4), (0.0, 8.4)], segs=160, mat=mats['glass']), cx, cz)
    # needle: tapered blade + tail + counterweight, 0.5 mm thick, 3.5 mm above the dial (h = -2.0)
    n = team()
    val = n * (n - 1) / 2 if key == 'L' else float(n)
    val += A_JITTER[key]
    th = math.radians(-135.0 + 270.0 * val / VMAX[key])
    d = (math.sin(th), math.cos(th)); p = (math.cos(th), -math.sin(th))
    def at(u, v):
        return (u * d[0] + v * p[0], u * d[1] + v * p[1])
    blade = [at(-15.0, -1.3), at(0.0, -1.75), at(63.5, -0.38), at(64.2, 0.0), at(63.5, 0.38), at(0.0, 1.75), at(-15.0, 1.3)]
    nd = place(prism(f'Needle{key}', blade, -2.3, -1.8, mats['needle']), cx, cz)
    cw = place(prism(f'Counter{key}', [at(-17.0 + x, z) for x, z in circle_pts(4.3, 40)], -2.3, -1.8, mats['needle']), cx, cz)
    hub = place(lathe(f'Hub{key}', [(0.0, -5.5), (5.2, -5.5), (5.2, -2.6), (4.6, -1.2), (3.2, -0.6), (0.0, -0.4)], segs=64,
                      mat=mats['hub']), cx, cz)
    # three flange screws
    for a in (35.0, 155.0, 275.0):
        r = 93.5
        sx, sz = cx + r * MM * math.sin(math.radians(a)), cz + r * MM * math.cos(math.radians(a))
        screw(f'Screw{key}{int(a)}', sx, sz, 2.0, 3.0, mats, slot_deg=(a * 7.3 + 20) % 180)
    # label plate under the gauge, two tiny screws
    py = -0.0
    plate(f'Plate{key}', cx, cz - 0.123, mats['plate' + key], mats)
    return bz, face, gl, nd, cw, hub


A_JITTER = {'L': 0.0, 'R': 0.0}


def screw(name, x, z, h0, r, mats, slot_deg=0.0):
    hd = place(lathe(name, [(0.0, h0), (r, h0), (r * 0.96, h0 + 0.5), (r * 0.8, h0 + 1.25), (r * 0.42, h0 + 1.7), (0.0, h0 + 1.8)],
                     segs=40, mat=mats['screw']), x, z)
    a = math.radians(slot_deg)
    L, W = r * 1.9, r * 0.27
    pts = [(-L / 2, -W / 2), (L / 2, -W / 2), (L / 2, W / 2), (-L / 2, W / 2)]
    pts = [(u * math.cos(a) - v * math.sin(a), u * math.sin(a) + v * math.cos(a)) for u, v in pts]
    sl = place(prism(name + '_slot', pts, h0 + 0.6, h0 + 1.86, mats['slot']), x, z)
    return hd


def plate(name, x, z, mat, mats):
    w, hgt, t = 0.072, 0.018, 0.0016
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w; v.co.z *= hgt; v.co.y = -t if v.co.y < 0 else 0.0
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.0004, segments=2, affect='EDGES', profile=0.5)
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for lp in f.loops:
            lp[uv].uv = (lp.vert.co.x / w + 0.5, lp.vert.co.z / hgt + 0.5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    lib._sharp_by_angle(me, 40)
    ob = place(lib.obj_from_mesh(name, me, mat), x, z)
    for sx in (-0.0305, 0.0305):
        screw(name + f'_s{sx:+.3f}', x + sx, z, 1.6, 1.5, mats, slot_deg=(sx * 9000 + 40) % 180)
    return ob


def team():
    if A['n'] > 0:
        return A['n']
    return {'first': 8, 'key': 13}[A['state']]


def build_panel(mats):
    """Steel panel 4 mm thick, holes cut for the two gauge cases (exact boolean)."""
    pan = lib.box('Panel', -1.1, 1.3, 0.0, 0.004, -0.7, 0.8, mat=mats['panel'])
    for key, (cx, cz) in GAUGES.items():
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=128, radius1=0.0778, radius2=0.0778, depth=0.05)
        bmesh.ops.rotate(bm, verts=bm.verts[:], cent=(0, 0, 0), matrix=__import__('mathutils').Matrix.Rotation(math.pi / 2, 3, 'X'))
        me = bpy.data.meshes.new('cut' + key)
        bm.to_mesh(me); bm.free()
        cut = lib.obj_from_mesh('cut' + key, me)
        cut.location = (cx, 0.0, cz)
        md = pan.modifiers.new('cut' + key, 'BOOLEAN')
        md.operation = 'DIFFERENCE'; md.solver = 'EXACT'; md.object = cut
    dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(pan.evaluated_get(dg))
    pan.modifiers.clear()
    old = pan.data
    pan.data = me2
    bpy.data.meshes.remove(old)
    for key in GAUGES:
        bpy.data.objects.remove(bpy.data.objects['cut' + key])
    return pan


def main():
    sc = lib.reset()
    lib.render_setup(sc, A['w'], A['h'], A['samples'], threshold=0.02, look=A['look'], exposure=A['exposure'],
                     transmission=8, diffuse=3, glossy=4, seed=A['seed'])
    sc.cycles.caustics_refractive = False
    lib.world_hdri(sc, 'empty_warehouse_01', strength=A['hdri'], rot_z_deg=200.0)
    mats = dict(panel=panel_mat(), bezel=bezel_mat(), glass=glass_mat(),
                dialL=dial_mat('DialL', 'dial_coordination.png'), dialR=dial_mat('DialR', 'dial_capacity.png'),
                plateL=plate_mat('PlateL', 'plate_coordination.png'), plateR=plate_mat('PlateR', 'plate_capacity.png'),
                needle=lib.paint_mat('NeedlePaint', (0.90, 0.885, 0.85), rough=0.48),
                hub=lib.paint_mat('HubPaint', (0.06, 0.06, 0.06), rough=0.32),
                screw=steel_mat('Screw', (0.36, 0.35, 0.33), rough=0.45),
                slot=lib.simple_mat('Slot', (0.03, 0.03, 0.03), rough=0.7))
    # a needle never sits exactly on its mark
    A_JITTER['L'] = {'first': 0.4, 'key': 0.9}.get(A['state'], 0.0)
    A_JITTER['R'] = {'first': -0.06, 'key': 0.05}.get(A['state'], 0.0)
    build_panel(mats)
    for k in GAUGES:
        build_gauge(k, mats)

    # one light idea: a big four-pane window to the left of the photographer, a little above
    wx, wy, wz = -1.25, -1.75, 0.55
    look_at = (0.05, 0.0, 0.0)
    pw, ph, gap = 0.62, 0.78, 0.07
    for i, dx in enumerate((-(pw + gap) / 2, (pw + gap) / 2)):
        for j, dz in enumerate((-(ph + gap) / 2, (ph + gap) / 2)):
            # panes sit on one plane facing look_at
            L = lib.area_light(f'Pane{i}{j}', (0, 0, 0), look_at, pw, ph, 900.0 * A['win'], kelvin=6200, spread=160)
            base = Vector((wx, wy, wz))
            fwd = (Vector(look_at) - base).normalized()
            right = fwd.cross(Vector((0, 0, 1))).normalized()
            up = right.cross(fwd).normalized()
            L.location = base + right * dx + up * dz
            lib.aim(L, Vector(look_at) + right * dx + up * dz)

    # camera: locked off, square-on verticals, yawed so the panel recedes to the left
    if A['camera'] == 'desktop':
        tx, tz, frame_w, lens = -0.030, 0.052, 0.66, 85.0
    else:
        tx, tz, frame_w, lens = 0.018, 0.040, 0.29, 85.0
    d = frame_w * lens / 36.0
    yaw = math.radians(A['yaw'])
    cam_loc = (tx + d * math.sin(yaw), -d * math.cos(yaw), tz)
    cam = lib.camera(cam_loc, (tx, 0.0, tz), focal=lens, fstop=A['fstop'],
                     focus=(Vector(cam_loc) - Vector((0.0, -0.012, 0.0))).length)
    lib.post(sc, grain=A['grain'], vignette=0.20, dispersion=0.003, glare=0.10, seed=A['seed'])
    if A['save']:
        lib.save_blend(A['save'])
    lib.render(sc, A['out'], f"redline_{A['state']}_{A['camera']}", extra=dict(idea='01-redline', team=team()))


main()
