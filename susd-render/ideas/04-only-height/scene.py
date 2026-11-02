"""Idea 4, Only Height: an architect's model of a slim office tower, photographed on a workbench at
blue hour. Each floor is one person; each lit window is one pathway.

  python3 tools/render_idle.py blender -b -P ideas/04-only-height/scene.py -- \
      --state first|key --camera desktop|phone --w 1440 --h 900 --samples 24 --out out/ideas/04-only-height/x.png

--state first = 8 people: 8 office floors, 48 windows, 28 lit (8 x 7 / 2 pathways).
--state key   = 13 people: 13 floors, 78 windows, all 78 lit (13 x 12 / 2 = 78 = 6 x 13), and the tower
                leans under its load: the foot crushes into the plot on one side and lifts on the other.
--n overrides the team size; --lean the lean in degrees; --border x0,x1,y0,y1 renders a crop.

Why six windows a floor: pathways n(n-1)/2 and windows 6n meet at n = 13. Up to twelve people there is a
dark window left for every pathway; at thirteen the last one lights and there is no room for the next.

The stand-in: the 09 entry's other production route is "a physical model photographed (2 to 3 weeks and a
model maker)". This scene is built as that model would be: grey board strips glued floor by floor (each
floor a separate module, set by hand, so each sits a fraction of a millimetre off the one below), a clear
acrylic sheet behind the strips, and behind each window a shallow room cell of white card whose back wall
is a tracing-paper diffuser over an LED; a grey card plot on a plywood baseboard with the maker's pencil
set-out, a steel rule left on the base. The room lights are off; the light is the blue-hour sky through
the window behind the bench, the model's own windows, and a white bounce card off to the camera's left.

Finals (NOTES.md): --samples 28 desktop, 20 phone; every other default is the tuned value.

Scene (metres; Blender Z up, bench top at z=0, camera on -Y looking +Y with true verticals):
  tower foot at TOWER_XY on the plot (top z=PLOT_TOP), turned YAW so its 4-bay front and 2-bay side both show
  back wall 2.33 m behind the model with a two-casement window; a hand-set blue-hour sky gradient (looking
  east, away from the sunset) sampled through a portal; dark rooftops outside
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'lookdev'))
import lib_lookdev as lib

A = lib.args(dict(state='first', camera='desktop', w=640, h=400, samples=12, out='out/ideas/04-only-height/test.png',
                  n=0, exposure=0.8, look='AgX - Medium High Contrast', sky=0.7,
                  pane=0.5, fill=12.0, fstop=4.0, lean=-1.0, yaw=32.0, grain=0.07, seed=7, border='', lens=85.0,
                  dist=0.0, camz=0.0, zc=0.0, xfrac=0.0, save='', wallcol=0.42, rule=1, board=0.48, k0=2400.0, k1=3400.0))
# review: board was 0.20 sRGB, which card_mat turns into 0.033 linear (05-RENDER-PIPELINE pitfall 6), so the
# 'grey board' rendered as black card. 0.48 is greyboard (tests/t14). The two desktop finals were rendered at 0.20.

# ----------------------------------------------------------------------------- the model's dimensions
BAY, PW, T = 0.026, 0.004, 0.0025          # bay pitch, pier width, card thickness
NBF, NBS = 4, 2                             # bays on the front and on the side: 6 windows a floor
W, D = NBF * BAY + PW, NBS * BAY + PW       # 0.108 x 0.056 footprint
FH, SP = 0.044, 0.013                       # floor height, spandrel band
LH = 0.050                                  # the lobby
PANE_IN, CORE_IN = 0.0035, 0.005            # diffuser and core set back from the outer face
TOWER_XY = (0.17, 0.07)
PLOT_TOP = 0.0215
PLOT = (-0.13, 0.29, -0.07, 0.17)            # x0, x1, y0, y1 (420 x 240 mm card)
WALL_Y = 2.40

STATE_N = {'first': 8, 'key': 13}
N = A['n'] or STATE_N[A['state']]
LEAN = A['lean'] if A['lean'] >= 0 else (6.5 if A['state'] == 'key' else 0.0)


def pathways(n):
    return n * (n - 1) // 2


def lit_windows(n):
    """The P(n) windows with the lowest keys among the floors that exist. Monotone in n (proof: a window lit
    at n has rank <= P(n) + 6 among n+1 floors, and P(n+1) = P(n) + n >= P(n) + 6 once n >= 6)."""
    rnd = random.Random(11)
    keys = {(f, s): rnd.random() for f in range(20) for s in range(6)}
    cand = sorted((keys[(f, s)], f, s) for f in range(n) for s in range(6))
    return {(f, s) for _, f, s in cand[:min(pathways(n), len(cand))]}


# ----------------------------------------------------------------------------- materials

def node(nt, kind, **inp):
    n = nt.nodes.new(kind)
    for k, v in inp.items():
        n.inputs[k].default_value = v
    return n


def card_mat(name, col, rough=0.82, var=0.08, fibre=0.06, dust=0.0):
    """Mountboard: flat colour with a faint mottle, fine fibre bump, matte. dust > 0 adds pale specks on
    upward faces."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mot = node(nt, 'ShaderNodeTexNoise', Scale=60.0, Detail=4.0)
    lib.link(nt, tc.outputs['Object'], mot.inputs['Vector'])
    mr = node(nt, 'ShaderNodeMapRange', **{'To Min': 1 - var, 'To Max': 1 + var})
    lib.link(nt, mot.outputs['Fac'], mr.inputs['Value'])
    c = lib.srgb_to_lin(col)
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MULTIPLY'); f_.default_value = 1.0
    a_.default_value = (*c, 1)
    cm = nt.nodes.new('ShaderNodeCombineColor')
    for k in ('Red', 'Green', 'Blue'):
        lib.link(nt, mr.outputs['Result'], cm.inputs[k])
    lib.link(nt, cm.outputs['Color'], b_)
    col_s = r_
    if dust > 0:
        dn = node(nt, 'ShaderNodeTexNoise', Scale=2600.0, Detail=1.0)
        lib.link(nt, tc.outputs['Object'], dn.inputs['Vector'])
        dm = node(nt, 'ShaderNodeMapRange', **{'From Min': 0.70, 'From Max': 0.76, 'To Max': dust})
        lib.link(nt, dn.outputs['Fac'], dm.inputs['Value'])
        geo = nt.nodes.new('ShaderNodeNewGeometry')
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); lib.link(nt, geo.outputs['Normal'], sep.inputs['Vector'])
        up = node(nt, 'ShaderNodeMapRange', **{'From Min': 0.6, 'From Max': 0.95})
        lib.link(nt, sep.outputs['Z'], up.inputs['Value'])
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        lib.link(nt, dm.outputs['Result'], mul.inputs[0]); lib.link(nt, up.outputs['Result'], mul.inputs[1])
        dx, f2, a2, b2, r2 = lib.mix(nt, 'RGBA', 'MIX')
        lib.link(nt, mul.outputs[0], f2); lib.link(nt, col_s, a2); b2.default_value = (0.55, 0.54, 0.52, 1)
        col_s = r2
    lib.link(nt, col_s, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.35
    fb = node(nt, 'ShaderNodeTexNoise', Scale=1800.0, Detail=3.0)
    lib.link(nt, tc.outputs['Object'], fb.inputs['Vector'])
    bump = node(nt, 'ShaderNodeBump', Strength=fibre, Distance=0.0002)
    lib.link(nt, fb.outputs['Fac'], bump.inputs['Height'])
    lib.link(nt, bump.outputs['Normal'], b.inputs['Normal'])
    return m


def pane_mat():
    """The back wall of each window's room cell: tracing paper over an LED. Face attributes from the mesh:
    lit (0/1), lum (this LED's brightness), warm (0 = 2750 K, 1 = 3600 K). Unlit, it is dark card. Lit, it
    glows brighter towards the head, where the LED sits, with a paper mottle."""
    m = bpy.data.materials.new('Diffuser'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.9
    b.inputs['Specular IOR Level'].default_value = 0.3
    out = nt.nodes['Material Output']
    at = {}
    for k in ('lit', 'lum', 'warm'):
        a = nt.nodes.new('ShaderNodeAttribute'); a.attribute_type = 'GEOMETRY'; a.attribute_name = k
        at[k] = a.outputs['Fac']
    bc, f0, a0, b0, r0 = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, at['lit'], f0); a0.default_value = (0.030, 0.031, 0.033, 1); b0.default_value = (0.75, 0.72, 0.66, 1)
    lib.link(nt, r0, b.inputs['Base Color'])
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); lib.link(nt, tc.outputs['UV'], sep.inputs['Vector'])
    grad = node(nt, 'ShaderNodeMapRange', **{'To Min': 0.62, 'To Max': 1.15})
    lib.link(nt, sep.outputs['Y'], grad.inputs['Value'])
    paper = node(nt, 'ShaderNodeTexNoise', Scale=700.0, Detail=5.0)
    lib.link(nt, tc.outputs['Object'], paper.inputs['Vector'])
    pm = node(nt, 'ShaderNodeMapRange', **{'To Min': 0.88, 'To Max': 1.12})
    lib.link(nt, paper.outputs['Fac'], pm.inputs['Value'])
    prod = None
    for sock in (grad.outputs['Result'], pm.outputs['Result'], at['lum'], at['lit']):
        if prod is None:
            prod = sock; continue
        mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'
        lib.link(nt, prod, mm.inputs[0]); lib.link(nt, sock, mm.inputs[1]); prod = mm.outputs[0]
    m4 = nt.nodes.new('ShaderNodeMath'); m4.operation = 'MULTIPLY'
    lib.link(nt, prod, m4.inputs[0]); m4.inputs[1].default_value = A['pane']
    cx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, at['warm'], f_)
    a_.default_value = (*lib.kelvin_rgb(A['k0']), 1); b_.default_value = (*lib.kelvin_rgb(A['k1']), 1)
    em = nt.nodes.new('ShaderNodeEmission')
    lib.link(nt, r_, em.inputs['Color']); lib.link(nt, m4.outputs[0], em.inputs['Strength'])
    add = nt.nodes.new('ShaderNodeAddShader')
    lib.link(nt, b.outputs['BSDF'], add.inputs[0]); lib.link(nt, em.outputs['Emission'], add.inputs[1])
    lib.link(nt, add.outputs['Shader'], out.inputs['Surface'])
    return m


def acrylic_mat():
    """Thin clear acrylic glazing: a Fresnel reflection over a straight-through transparent layer (a sheet
    2 mm thick shifts the view by a fraction of a millimetre, so no refraction is modelled)."""
    m = bpy.data.materials.new('Acrylic'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (0.94, 0.95, 0.95, 1)
    gl = nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.04
    fr = nt.nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.49
    mx = nt.nodes.new('ShaderNodeMixShader')
    lib.link(nt, fr.outputs['Fac'], mx.inputs['Fac'])
    lib.link(nt, tr.outputs['BSDF'], mx.inputs[1]); lib.link(nt, gl.outputs['BSDF'], mx.inputs[2])
    lib.link(nt, mx.outputs['Shader'], out.inputs['Surface'])
    return m


def brass_mat():
    m = bpy.data.materials.new('Brass'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lib.srgb_to_lin((0.62, 0.50, 0.30)), 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = 0.38
    return m


def plot_mat():
    """Light grey card with the maker's pencil set-out (graphite: darker and a little glossy) and dust."""
    m = card_mat('PlotCard', (0.60, 0.60, 0.585), rough=0.86, var=0.05, dust=0.45)
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    base = b.inputs['Base Color'].links[0].from_socket
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    x0, x1, y0, y1 = PLOT
    mp.inputs['Scale'].default_value = (1 / (x1 - x0), 1 / (y1 - y0), 1)
    mp.inputs['Location'].default_value = (-x0 / (x1 - x0), -y0 / (y1 - y0), 0)
    lib.link(nt, tc.outputs['Object'], mp.inputs['Vector'])
    im = nt.nodes.new('ShaderNodeTexImage')
    im.image = bpy.data.images.load(os.path.join(HERE, 'tex', 'plot_pencil.png'), check_existing=True)
    im.image.colorspace_settings.name = 'Non-Color'
    im.extension = 'CLIP'
    lib.link(nt, mp.outputs['Vector'], im.inputs['Vector'])
    g = node(nt, 'ShaderNodeMapRange', **{'To Max': 0.55})
    lib.link(nt, im.outputs['Color'], g.inputs['Value'])
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, g.outputs['Result'], f_); lib.link(nt, base, a_); b_.default_value = (0.05, 0.05, 0.055, 1)
    lib.link(nt, r_, b.inputs['Base Color'])
    rr = node(nt, 'ShaderNodeMapRange', **{'To Min': 0.86, 'To Max': 0.5})
    lib.link(nt, g.outputs['Result'], rr.inputs['Value'])
    lib.link(nt, rr.outputs['Result'], b.inputs['Roughness'])
    return m


def ply_mat():
    """Plywood edge: 1.8 mm plies, long grain and end grain alternating, thin glue lines, a little noise."""
    m = bpy.data.materials.new('PlyEdge'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); lib.link(nt, tc.outputs['Object'], sep.inputs['Vector'])
    nz = node(nt, 'ShaderNodeTexNoise', Scale=40.0, Detail=3.0)
    lib.link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    wob = nt.nodes.new('ShaderNodeMath'); wob.operation = 'MULTIPLY_ADD'
    lib.link(nt, nz.outputs['Fac'], wob.inputs[0]); wob.inputs[1].default_value = 0.0004
    lib.link(nt, sep.outputs['Z'], wob.inputs[2])
    sc_ = nt.nodes.new('ShaderNodeMath'); sc_.operation = 'DIVIDE'
    lib.link(nt, wob.outputs[0], sc_.inputs[0]); sc_.inputs[1].default_value = 0.0036
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; lib.link(nt, sc_.outputs[0], fr.inputs[0])
    st = nt.nodes.new('ShaderNodeMath'); st.operation = 'GREATER_THAN'
    lib.link(nt, fr.outputs[0], st.inputs[0]); st.inputs[1].default_value = 0.5
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, st.outputs[0], f_)
    a_.default_value = (*lib.srgb_to_lin((0.66, 0.53, 0.37)), 1); b_.default_value = (*lib.srgb_to_lin((0.50, 0.38, 0.25)), 1)
    lib.link(nt, r_, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.78
    return m


def rule_mat():
    m = bpy.data.materials.new('Rule'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / 0.30, 1 / 0.025, 1)
    lib.link(nt, tc.outputs['Object'], mp.inputs['Vector'])
    im = nt.nodes.new('ShaderNodeTexImage')
    im.image = bpy.data.images.load(os.path.join(HERE, 'tex', 'rule.png'), check_existing=True)
    im.image.colorspace_settings.name = 'Non-Color'; im.extension = 'CLIP'
    lib.link(nt, mp.outputs['Vector'], im.inputs['Vector'])
    mx, f_, a_, b_, r_ = lib.mix(nt, 'RGBA', 'MIX')
    lib.link(nt, im.outputs['Color'], f_)
    a_.default_value = (*lib.srgb_to_lin((0.60, 0.60, 0.58)), 1); b_.default_value = (0.02, 0.02, 0.02, 1)
    lib.link(nt, r_, b.inputs['Base Color'])
    met = node(nt, 'ShaderNodeMapRange', **{'To Min': 1.0, 'To Max': 0.0})
    lib.link(nt, im.outputs['Color'], met.inputs['Value']); lib.link(nt, met.outputs['Result'], b.inputs['Metallic'])
    sc_ = nt.nodes.new('ShaderNodeMapping'); sc_.inputs['Scale'].default_value = (4.0, 400.0, 1.0)
    lib.link(nt, tc.outputs['Object'], sc_.inputs['Vector'])
    br = node(nt, 'ShaderNodeTexNoise', Scale=6.0, Detail=2.0)
    lib.link(nt, sc_.outputs['Vector'], br.inputs['Vector'])
    rr = node(nt, 'ShaderNodeMapRange', **{'To Min': 0.24, 'To Max': 0.40})
    lib.link(nt, br.outputs['Fac'], rr.inputs['Value']); lib.link(nt, rr.outputs['Result'], b.inputs['Roughness'])
    return m


# ----------------------------------------------------------------------------- mesh building

class MB:
    """bmesh builder: boxes and window quads with material index and face attributes."""
    def __init__(self):
        self.bm = bmesh.new()
        self.L = {k: self.bm.faces.layers.float.new(k) for k in ('lit', 'lum', 'warm')}
        self.uv = self.bm.loops.layers.uv.new('UVMap')

    def box(self, x0, x1, y0, y1, z0, z1, mi=0):
        X, Y, Z = (x0, x1), (y0, y1), (z0, z1)
        v = [self.bm.verts.new((X[i & 1], Y[(i >> 1) & 1], Z[(i >> 2) & 1])) for i in range(8)]
        for q in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)):
            f = self.bm.faces.new([v[i] for i in q]); f.material_index = mi
            for lp, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
                lp[self.uv].uv = uv

    def quad(self, pts, mi, lit=0.0, lum=1.0, warm=0.0):
        v = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(v); f.material_index = mi
        f[self.L['lit']] = lit; f[self.L['lum']] = lum; f[self.L['warm']] = warm
        for lp, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            lp[self.uv].uv = uv

    def cyl(self, x, y, z0, z1, r, mi, segs=12):
        ret = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r,
                                    depth=z1 - z0, matrix=Matrix.Translation((x, y, (z0 + z1) / 2)))
        for f in {f for v in ret['verts'] for f in v.link_faces}:
            f.material_index = mi

    def obj(self, name, mats):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me); self.bm.free()
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        for m in mats:
            me.materials.append(m)
        return ob


# material slots in every tower module
CARD, CORE, PANE, BRASS, CELL, GLAZE = 0, 1, 2, 3, 4, 5
CD = 0.011                                   # room-cell depth behind the outer face


def floor_module(f, lit, rnd):
    """One office floor, z 0..FH in tower coordinates. The front (-y, 4 bays) and the left side (-x, 2 bays)
    are a frame of card strips (spandrel band, piers, a slim centre mullion per window) over one acrylic
    sheet; behind each window is a shallow room cell (white card floor, ceiling and partitions) whose back
    wall is the LED diffuser. The corner bays share one corner room. Back and right faces are blank card."""
    mb = MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    mb.box(x0, x1, y0, y0 + T, 0, SP, CARD)                        # front spandrel
    mb.box(x0, x0 + T, y0, y1, 0, SP, CARD)                        # side spandrel
    for k in range(NBF + 1):
        a = x0 + k * BAY
        mb.box(a, a + PW, y0, y0 + T, SP, FH, CARD)
        if k < NBF:
            c = a + PW + (BAY - PW) / 2
            mb.box(c - 0.0005, c + 0.0005, y0 + 0.0008, y0 + T, SP, FH, CARD)     # mullion
    for k in range(NBS + 1):
        a = y0 + k * BAY
        mb.box(x0, x0 + T, a, a + PW, SP, FH, CARD)
        if k < NBS:
            c = a + PW + (BAY - PW) / 2
            mb.box(x0 + 0.0008, x0 + T, c - 0.0005, c + 0.0005, SP, FH, CARD)
    mb.box(x0, x1, y1 - T, y1, 0, FH, CARD)                        # back
    mb.box(x1 - T, x1, y0, y1, 0, FH, CARD)                        # right
    # glazing, just behind the strips
    g = T + 0.0004
    mb.quad([(x0 + T, y0 + g, SP), (x1 - T, y0 + g, SP), (x1 - T, y0 + g, FH), (x0 + T, y0 + g, FH)], GLAZE)
    mb.quad([(x0 + g, y1 - T, SP), (x0 + g, y0 + T, SP), (x0 + g, y0 + T, FH), (x0 + g, y1 - T, FH)], GLAZE)
    # floor and ceiling of the room cells, and the dark core behind them
    mb.box(x0 + T, x1 - T, y0 + T, y1 - T, SP - 0.0012, SP, CELL)
    mb.box(x0 + T, x1 - T, y0 + T, y1 - T, FH - 0.0012, FH, CELL)
    mb.box(x0 + T, x1 - T, y0 + T, y1 - T, 0, SP - 0.0012, CORE)
    mb.box(x0 + CD + 0.0003, x1 - T, y0 + CD + 0.0003, y1 - T, SP, FH - 0.0012, CORE)
    # partitions between cells (none at the corner, which is one room)
    for k in range(2, NBF + 1):
        a = x0 + k * BAY + PW / 2
        mb.box(a - 0.0004, a + 0.0004, y0 + T, y0 + CD, SP, FH - 0.0012, CELL)
    for k in range(2, NBS + 1):
        a = y0 + k * BAY + PW / 2
        mb.box(x0 + T, x0 + CD, a - 0.0004, a + 0.0004, SP, FH - 0.0012, CELL)
    a = x0 + BAY + PW / 2                                           # between corner room and bay 1
    mb.box(a - 0.0004, a + 0.0004, y0 + T, y0 + CD, SP, FH - 0.0012, CELL)
    a = y0 + BAY + PW / 2
    mb.box(x0 + T, x0 + CD, a - 0.0004, a + 0.0004, SP, FH - 0.0012, CELL)
    # the LED diffusers on the cells' back walls
    zb, zt = SP, FH - 0.0012
    for b in range(NBF):                                            # front windows, slots 0..3
        a = x0 + b * BAY + (CD if b == 0 else PW / 2)
        c = x0 + (b + 1) * BAY + PW / 2
        y = y0 + CD
        on = (f, b) in lit
        mb.quad([(a, y, zb), (c, y, zb), (c, y, zt), (a, y, zt)], PANE, float(on), rnd.uniform(0.45, 1.2), rnd.random() ** 1.6)
    for b in range(NBS):                                            # side windows, slots 4..5
        a = y0 + b * BAY + (CD if b == 0 else PW / 2)
        c = y0 + (b + 1) * BAY + PW / 2
        x = x0 + CD
        on = (f, NBF + b) in lit
        mb.quad([(x, c, zb), (x, a, zb), (x, a, zt), (x, c, zt)], PANE, float(on), rnd.uniform(0.45, 1.2), rnd.random() ** 1.6)
    return mb


def lobby_module():
    mb = MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    c, gi = 0.006, 0.006                                            # corner column, glass set-back
    for (a, b) in ((x0, y0), (x1 - c, y0), (x0, y1 - c), (x1 - c, y1 - c)):
        mb.box(a, a + c, b, b + c, 0, LH, CARD)
    mb.box(x0, x1, y0, y0 + T, LH - 0.008, LH, CARD)               # fascia
    mb.box(x0, x0 + T, y0, y1, LH - 0.008, LH, CARD)
    mb.box(x0, x1, y1 - T, y1, 0, LH, CARD)
    mb.box(x1 - T, x1, y0, y1, 0, LH, CARD)
    mb.box(x0 + gi, x1 - T, y0 + gi, y1 - T, 0, LH - 0.008, CORE)  # the dark lobby behind its glass
    yg, xg, zt = y0 + gi - 0.0006, x0 + gi - 0.0006, LH - 0.008
    mb.quad([(x0 + c, yg, 0), (x1 - c, yg, 0), (x1 - c, yg, zt), (x0 + c, yg, zt)], GLAZE)
    mb.quad([(xg, y1 - c, 0), (xg, y0 + c, 0), (xg, y0 + c, zt), (xg, y1 - c, zt)], GLAZE)
    # the front door: a frame of two thin strips and a head, standing proud of the glass, and a canopy
    dx, dw, dh, y = 0.004, 0.018, 0.028, y0 + gi
    for a in (dx - dw / 2 - 0.0015, dx + dw / 2):
        mb.box(a, a + 0.0015, y - 0.0012, y, 0, dh, CARD)
    mb.box(dx - dw / 2 - 0.0015, dx + dw / 2 + 0.0015, y - 0.0012, y, dh, dh + 0.0015, CARD)
    mb.box(dx - 0.02, dx + 0.02, y0 - 0.010, y0 + 0.004, dh + 0.004, dh + 0.0062, CARD)
    return mb


def roof_module():
    mb = MB()
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    mb.box(x0, x1, y0, y1, 0, 0.003, CARD)
    t2 = 0.002
    mb.box(x0, x1, y0, y0 + t2, 0.003, 0.008, CARD)
    mb.box(x0, x1, y1 - t2, y1, 0.003, 0.008, CARD)
    mb.box(x0, x0 + t2, y0, y1, 0.003, 0.008, CARD)
    mb.box(x1 - t2, x1, y0, y1, 0.003, 0.008, CARD)
    mb.box(-0.022, 0.040, -0.012, 0.022, 0.003, 0.021, CORE)      # plant room
    mb.box(-0.018, 0.004, -0.008, 0.016, 0.021, 0.026, CARD)      # its roof plant
    mb.cyl(-0.040, 0.012, 0.003, 0.075, 0.0007, BRASS)              # antenna, brass rod
    mb.cyl(-0.034, -0.006, 0.003, 0.046, 0.0005, BRASS)
    return mb


def rz(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Z')


def build_tower(mats):
    rnd = random.Random(5)
    lit = lit_windows(N)
    base = Matrix.Translation((TOWER_XY[0], TOWER_XY[1], PLOT_TOP)) @ rz(A['yaw'])
    # the pivot: the foot corner furthest right in the picture, sunk 2 mm into the plot when leaning
    corners = [base @ Vector((sx * W / 2, sy * D / 2, 0)) for sx in (-1, 1) for sy in (-1, 1)]
    pv = max(corners, key=lambda p: p.x)
    sink = 0.004 if LEAN > 0 else 0.0
    lean = (Matrix.Translation((pv.x, pv.y, pv.z - sink)) @ Matrix.Rotation(math.radians(LEAN), 4, 'Y')
            @ Matrix.Translation(-pv))
    obs = []
    z = 0.0
    mods = [('lobby', lobby_module(), LH)]
    for f in range(N):
        mods.append((f'floor{f + 1:02d}', floor_module(f, lit, rnd), FH))
    mods.append(('roof', roof_module(), 0.0))
    for name, mb, h in mods:
        ob = mb.obj('Tower_' + name, mats)
        # set by hand: each module sits a fraction of a millimetre off the one below
        j = Matrix.Translation((rnd.uniform(-0.0006, 0.0006), rnd.uniform(-0.0006, 0.0006), 0)) @ \
            rz(rnd.uniform(-0.45, 0.45)) @ Matrix.Rotation(rnd.uniform(-0.002, 0.002), 4, 'X')
        if name == 'lobby':
            j = Matrix.Identity(4)
        ob.matrix_world = lean @ base @ Matrix.Translation((0, 0, z)) @ j
        z += h
        obs.append(ob)
    print(f'TOWER n={N} floors={N} windows={6 * N} pathways={pathways(N)} lit={len(lit)} height_mm={1000 * (z + 0.026):.0f}')
    return pv, lit


def damage(pv, mats):
    """The foot crushing into the plot at the pivot corner: torn gaps in the card running out towards the
    camera and the right, flakes of the plot card prised up around the foot (their torn edges show the
    pale core), and crumbs of board. Nothing on the far side, which lifts clear."""
    rnd = random.Random(23)
    for i in range(5):
        ang = math.radians(rnd.uniform(-115, 15))                  # -90 = towards the camera
        L = rnd.uniform(0.015, 0.050)
        w = rnd.uniform(0.0012, 0.0024)
        mb2 = MB()
        mb2.box(0, L, -w / 2, w / 2, -0.0019, 0.00012, 1)          # the dark gap
        mb2.box(0, L * 0.92, w / 2, w / 2 + 0.0004, -0.0004, 0.00025, 2)   # torn pale lips
        mb2.box(0, L * 0.85, -w / 2 - 0.0004, -w / 2, -0.0004, 0.00025, 2)
        ob = mb2.obj(f'crack{i}', [mats['card'], mats['core'], mats['core_white']])
        ob.matrix_world = Matrix.Translation((pv.x - 0.002, pv.y + 0.002, PLOT_TOP)) @ rz(math.degrees(ang))
    for i in range(5):
        mb2 = MB()
        mb2.box(0, rnd.uniform(0.007, 0.014), -0.003, 0.003, -0.0012, 0.0004, 0)
        ob = mb2.obj(f'flake{i}', [mats['plot']])
        a = math.radians(rnd.uniform(-150, 40))
        r = rnd.uniform(0.004, 0.010)
        ob.matrix_world = (Matrix.Translation((pv.x + r * math.cos(a), pv.y + r * math.sin(a), PLOT_TOP))
                           @ rz(math.degrees(a) + rnd.uniform(-25, 25)) @ Matrix.Rotation(math.radians(rnd.uniform(-34, -14)), 4, 'Y'))
    for i in range(14):
        s = rnd.uniform(0.0009, 0.0030)
        mb2 = MB()
        mb2.box(-s / 2, s / 2, -s * 0.4, s * 0.4, 0, s * 0.45, 0)
        ob = mb2.obj(f'crumb{i}', [mats['card'] if i % 3 else mats['core_white']])
        r = rnd.uniform(0.008, 0.045); a = math.radians(rnd.uniform(-130, 30))
        ob.matrix_world = Matrix.Translation((pv.x + r * math.cos(a), pv.y + r * math.sin(a), PLOT_TOP)) @ rz(rnd.uniform(0, 360))


# ----------------------------------------------------------------------------- the bench and the room

def build_room(mats):
    # bench (worn table top) running to the window wall
    tbl = lib.box('Bench', -3.0, 3.0, -1.4, WALL_Y, -0.045, 0.0,
                  lib.pbr('BenchWood', 'wood_table_worn', scale=0.55, tint=(0.55, 0.52, 0.50), rough_add=0.05))
    # baseboard: 18 mm plywood, grey card glued on top, the plot card on that
    bx0, bx1, by0, by1 = -0.40, 0.36, -0.25, 0.24
    lib.box('Baseboard', bx0, bx1, by0, by1, 0.0, 0.018, mats['ply'], bevel=0.0006)
    lib.box('BaseCard', bx0 + 0.0004, bx1 - 0.0004, by0 + 0.0004, by1 - 0.0004, 0.018, 0.0195, mats['basecard'])
    x0, x1, y0, y1 = PLOT
    lib.box('Plot', x0, x1, y0, y1, 0.0195, PLOT_TOP, mats['plot'])
    if A['rule']:
        mb = MB(); mb.box(0, 0.30, 0, 0.025, 0, 0.0009, 0)
        r = mb.obj('Rule', [mats['rule']])
        r.matrix_world = Matrix.Translation((-0.36, -0.215, 0.0195)) @ rz(4.0)
    # walls, ceiling, floor: a closed room so the window is the only daylight
    wall = lib.pbr('Wall', 'painted_plaster_wall', scale=0.45, tint=(A['wallcol'], A['wallcol'] * 1.04, A['wallcol'] * 1.12))
    wx0, wx1, wz0, wz1 = 0.0, 1.55, 0.12, 1.75                     # window opening
    lib.box('WallL', -3.0, wx0, WALL_Y, WALL_Y + 0.12, -0.8, 2.2, wall)
    lib.box('WallR', wx1, 3.0, WALL_Y, WALL_Y + 0.12, -0.8, 2.2, wall)
    lib.box('WallBelow', wx0, wx1, WALL_Y, WALL_Y + 0.12, -0.8, wz0, wall)
    lib.box('WallAbove', wx0, wx1, WALL_Y, WALL_Y + 0.12, wz1, 2.2, wall)
    lib.box('SideL', -3.1, -3.0, -4.2, WALL_Y + 0.12, -0.8, 2.2, wall)
    lib.box('SideR', 3.0, 3.1, -4.2, WALL_Y + 0.12, -0.8, 2.2, wall)
    lib.box('Ceiling', -3.1, 3.1, -4.2, WALL_Y + 0.12, 2.2, 2.3, wall)
    lib.box('Floor', -3.1, 3.1, -4.2, WALL_Y + 0.12, -0.9, -0.8, wall)
    lib.box('Back', -3.1, 3.1, -4.3, -4.2, -0.8, 2.2, wall)
    # window: painted timber frame, one mullion (two tall casements), a sill
    fr = mats['frame']
    fw, fd = 0.055, 0.07
    yf = WALL_Y + 0.02
    lib.box('FrameL', wx0, wx0 + fw, yf, yf + fd, wz0, wz1, fr)
    lib.box('FrameR', wx1 - fw, wx1, yf, yf + fd, wz0, wz1, fr)
    lib.box('FrameT', wx0, wx1, yf, yf + fd, wz1 - fw, wz1, fr)
    lib.box('FrameB', wx0, wx1, yf, yf + fd, wz0, wz0 + fw, fr)
    xm = (wx0 + wx1) / 2
    lib.box('Mullion', xm - 0.022, xm + 0.022, yf + 0.01, yf + fd - 0.01, wz0, wz1, fr)
    lib.box('Sill', wx0 - 0.05, wx1 + 0.05, WALL_Y - 0.06, WALL_Y + 0.03, wz0 - 0.03, wz0, fr, bevel=0.004)
    # portal so the sky is sampled through the opening
    ld = bpy.data.lights.new('Portal', 'AREA'); ld.shape = 'RECTANGLE'
    ld.size, ld.size_y = wx1 - wx0, wz1 - wz0
    ld.cycles.is_portal = True
    po = bpy.data.objects.new('Portal', ld); bpy.context.scene.collection.objects.link(po)
    po.location = (xm, WALL_Y + 0.13, (wz0 + wz1) / 2)
    po.rotation_euler = (math.radians(-90), 0, 0)                  # -Z of the light points into the room (-Y)
    # outside: dark rooftops a street away, below and around the eye line
    rnd = random.Random(3)
    dark = mats['roofs']
    x = -40.0
    while x < 60:
        wdt = rnd.uniform(5, 14)
        y = rnd.uniform(28, 70)
        top = rnd.uniform(-7.0, -1.0) + (0.0 if rnd.random() > 0.25 else rnd.uniform(2.0, 5.5))
        lib.box('Roof', x, x + wdt, y, y + rnd.uniform(8, 20), -20, top, dark)
        x += wdt + rnd.uniform(0.0, 2.0)
    if A['fill'] > 0:   # white card bounce off to the camera's left (as a model photographer would set)
        lib.area_light('Bounce', (-1.2, -1.0, 0.7), (TOWER_XY[0], TOWER_XY[1], 0.25), 1.0, 1.0, A['fill'], kelvin=8000)


def world_sky(sc):
    """Blue hour, looking east, away from the sunset: the earth's shadow lies on the horizon as a soft
    slate band, with the sky deepening to blue above it. Colour by elevation (sine of the view ray's
    angle), from the colours of dusk photographs; below the horizon the ground is near black.
    (Nishita was tried first: with the sun below the horizon it only darkens to brown, never to blue.)"""
    w = bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); lib.link(nt, tc.outputs['Generated'], sep.inputs['Vector'])
    mr = node(nt, 'ShaderNodeMapRange', **{'From Min': -0.1, 'From Max': 0.6})
    lib.link(nt, sep.outputs['Z'], mr.inputs['Value'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    stops = [(0.000, (0.004, 0.004, 0.005)),      # ground, -6 deg
             (0.135, (0.010, 0.011, 0.014)),
             (0.143, (0.135, 0.130, 0.160)),      # horizon haze, a touch warm
             (0.170, (0.105, 0.125, 0.190)),      # earth-shadow slate, ~1.5 deg
             (0.240, (0.080, 0.110, 0.220)),      # ~6 deg
             (0.420, (0.040, 0.065, 0.170)),      # ~18 deg
             (1.000, (0.012, 0.022, 0.075))]      # zenith
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*stops[0][1], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*stops[-1][1], 1)
    for pos, col in stops[1:-1]:
        e = cr.elements.new(pos); e.color = (*col, 1)
    lib.link(nt, mr.outputs['Result'], ramp.inputs['Fac'])
    lib.link(nt, ramp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = A['sky']
    lib.link(nt, bg.outputs['Background'], out.inputs['Surface'])


# ----------------------------------------------------------------------------- main

def main():
    sc = lib.reset()
    lib.render_setup(sc, A['w'], A['h'], A['samples'], threshold=0.02, look=A['look'], exposure=A['exposure'],
                     transmission=4, diffuse=3, glossy=3, clamp_indirect=6.0, seed=A['seed'])
    world_sky(sc)
    mats = dict(card=card_mat('Board', (A['board'],) * 3, rough=0.84, var=0.06, dust=0.25),
                cell=card_mat('CellCard', (0.80, 0.79, 0.76), rough=0.9, var=0.03),
                glaze=acrylic_mat(),
                core=card_mat('Core', (0.035, 0.036, 0.038), rough=0.9),
                core_white=card_mat('BoardCore', (0.78, 0.77, 0.74), rough=0.9),
                pane=pane_mat(), brass=brass_mat(), plot=plot_mat(),
                basecard=card_mat('BaseCard', (0.33, 0.335, 0.34), rough=0.85, var=0.05, dust=0.5),
                ply=ply_mat(), rule=rule_mat(),
                frame=lib.simple_mat('Frame', (0.20, 0.205, 0.21), rough=0.55),
                roofs=lib.simple_mat('Rooftops', (0.035, 0.035, 0.04), rough=0.9))
    pv, lit = build_tower([mats['card'], mats['core'], mats['pane'], mats['brass'], mats['cell'], mats['glaze']])
    if LEAN > 0:
        damage(pv, mats)
    build_room(mats)

    # camera: true verticals (level, with lens shift), 85 mm, focused on the tower's front corner
    phone = A['camera'] == 'phone'
    lens = A['lens']
    dist = A['dist'] or (2.6 if phone else 3.3)
    camz = A['camz'] or 0.32
    zc = A['zc'] or (0.328 if phone else 0.313)
    xfrac = A['xfrac'] or (0.64 if phone else 0.665)
    span = dist * 36.0 / lens                                       # the frame's long side at the tower
    fw = span * (A['w'] / A['h'] if phone else 1.0)                 # frame width at the tower
    cx = TOWER_XY[0] - (xfrac - 0.5) * fw
    cy = TOWER_XY[1] - dist
    cam = lib.camera((cx, cy, camz), (cx, TOWER_XY[1], camz), focal=lens, fstop=A['fstop'],
                     focus=dist - D / 2, shift_y=(zc - camz) / span)
    if phone:
        cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 36.0
    lib.post(sc, grain=A['grain'], vignette=0.20, dispersion=0.003, glare=0.12, seed=A['seed'])
    if A['border']:
        x0, x1, y0, y1 = (float(v) for v in A['border'].split(','))
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x, sc.render.border_min_y, sc.render.border_max_y = x0, x1, y0, y1
    if A['save']:
        lib.save_blend(A['save'])
    lib.render(sc, os.path.join(ROOT, A['out']), f"04-only-height {A['state']} {A['camera']}",
               extra=dict(n=N, pathways=pathways(N), lit=len(lit), lean=LEAN))


main()
