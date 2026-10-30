"""Shared look-dev helpers for the Waterline renders (Blender 4.5 LTS, Cycles on CPU).

Every staging script imports this module. Units are metres. Blender is Z-up:
X runs left-right, Y runs away from the camera (depth, Michael's Down axis), Z is up.

Main pieces
  args()          command-line options after `--`
  reset()         empty scene
  render_setup()  Cycles CPU, adaptive sampling, OIDN, light paths, AgX
  pbr()           Poly Haven scanned material (diff/rough/nor/disp), box-mapped, with a wet band
  build_line()    one line of the sentence as real bevelled geometry
  water_box()     a closed water body whose top has a real meniscus where it meets walls
  water_mat()     IOR 1.333 water, ripple bump on the top only, green volume absorption
  glass_mat()     tank glass (low-iron, green edge), optionally transparent to shadow rays
  camera()        real lens: focal length, f-stop, focus distance
  post()          compositor: lens dispersion, soft glare, vignette, grain plate
  render()        renders, times it, appends a row to lookdev/renders.jsonl
"""
import bpy, bmesh, math, os, sys, time, json, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
PH = os.path.join(ROOT, 'assets', 'polyhaven')
FONTS = os.path.join(ROOT, 'assets', 'fonts')

# Cover green #2B5A37 (sRGB) and the colour we let the water transmit.
COVER_GREEN_SRGB = (0x2B / 255, 0x5A / 255, 0x37 / 255)

SENTENCE = ['Every hire compounds', 'complexity before it', 'compounds capacity.']  # [M 696]


# ----------------------------------------------------------------------------- args

def args(defaults):
    """Parse `-- --key value` pairs into a dict, typed by the defaults."""
    out = dict(defaults)
    if '--' in sys.argv:
        a = sys.argv[sys.argv.index('--') + 1:]
        i = 0
        while i < len(a):
            k = a[i].lstrip('-')
            v = a[i + 1] if i + 1 < len(a) else '1'
            if k in out and isinstance(out[k], bool):
                out[k] = v.lower() in ('1', 'true', 'yes', 'on')
            elif k in out and isinstance(out[k], int):
                out[k] = int(v)
            elif k in out and isinstance(out[k], float):
                out[k] = float(v)
            else:
                out[k] = v
            i += 2
    return out


def srgb_to_lin(c):
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ----------------------------------------------------------------------------- scene

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    return sc


def render_setup(sc, w, h, samples, threshold=0.02, look='AgX - Base Contrast', exposure=0.0,
                 transmission=12, diffuse=3, glossy=4, clamp_indirect=4.0, refr_caustics=False,
                 guiding=False, denoise=True, seed=7):
    c = sc.cycles
    sc.render.engine = 'CYCLES'
    c.device = 'CPU'
    c.samples = samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = threshold
    c.use_denoising = denoise
    c.denoiser = 'OPENIMAGEDENOISE'
    c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    c.denoising_prefilter = 'ACCURATE'
    try:
        c.denoising_quality = 'HIGH'
    except Exception:
        pass
    c.max_bounces = 24
    c.diffuse_bounces = diffuse
    c.glossy_bounces = glossy
    c.transmission_bounces = transmission
    c.transparent_max_bounces = 24
    c.volume_bounces = 0
    c.caustics_reflective = False
    c.caustics_refractive = refr_caustics
    c.blur_glossy = 1.0
    c.sample_clamp_direct = 0.0
    c.sample_clamp_indirect = clamp_indirect
    c.use_guiding = guiding
    c.seed = seed
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.use_persistent_data = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = look
    sc.view_settings.exposure = exposure
    sc.render.film_transparent = False


def world_hdri(sc, name, strength=1.0, rot_z_deg=0.0, camera_bg=None, clamp=0.0):
    """HDRI lighting. camera_bg: an RGB the camera sees instead of the HDRI (None = HDRI)."""
    w = bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(PH, 'hdri', name + '_2k.hdr'))
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value[2] = math.radians(rot_z_deg)
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    col = env.outputs['Color']
    if clamp > 0:   # remove the HDRI's own sun disc so a sun lamp can own the shadows
        mn = nt.nodes.new('ShaderNodeMix'); mn.data_type = 'RGBA'; mn.blend_type = 'DARKEN'
        ins = {x.identifier: x for x in mn.inputs}; outs = {x.identifier: x for x in mn.outputs}
        ins['Factor_Float'].default_value = 1.0
        nt.links.new(col, ins['A_Color']); ins['B_Color'].default_value = (clamp, clamp, clamp, 1)
        col = outs['Result_Color']
    nt.links.new(col, bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    if camera_bg is None:
        nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    else:
        bg2 = nt.nodes.new('ShaderNodeBackground')
        bg2.inputs['Color'].default_value = (*camera_bg, 1)
        lp = nt.nodes.new('ShaderNodeLightPath')
        mix = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
        nt.links.new(bg.outputs['Background'], mix.inputs[1])
        nt.links.new(bg2.outputs['Background'], mix.inputs[2])
        nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return w


def link(nt, a, b):
    nt.links.new(a, b)


def mix(nt, data_type='RGBA', blend='MIX'):
    """ShaderNodeMix with its typed sockets resolved by identifier. (inputs['A'] would pick
    the FLOAT socket whatever the data type, silently breaking colour/vector mixes.)"""
    n = nt.nodes.new('ShaderNodeMix')
    n.data_type = data_type
    if data_type == 'RGBA':
        n.blend_type = blend
    suf = {'RGBA': 'Color', 'FLOAT': 'Float', 'VECTOR': 'Vector'}[data_type]
    ins = {s.identifier: s for s in n.inputs}
    outs = {s.identifier: s for s in n.outputs}
    fac = ins['Factor_Float'] if data_type != 'VECTOR' else ins['Factor_Float']
    return n, fac, ins['A_' + suf], ins['B_' + suf], outs['Result_' + suf]


# ----------------------------------------------------------------------------- materials

def _img(nt, path, non_color):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = bpy.data.images.load(path, check_existing=True)
    if non_color:
        n.image.colorspace_settings.name = 'Non-Color'
    n.projection = 'BOX'
    n.projection_blend = 0.25
    n.interpolation = 'Cubic'
    return n


def _maps(aid):
    d = os.path.join(PH, aid)
    f = {}
    for k in ('diff', 'rough', 'nor_gl', 'disp', 'ao'):
        p = os.path.join(d, f'{aid}_{k}_2k.jpg')
        if os.path.exists(p):
            f[k] = p
    return f


def wet_mask(nt, level_obj, band=0.04, edge_noise=0.5):
    """Returns a socket: 1 below the water / in the wet band above it, 0 when dry.
    Height above the water comes from the level empty's object space, so the band
    follows the water with no drivers."""
    tc = nt.nodes.new('ShaderNodeTexCoord')
    tc.object = level_obj
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    link(nt, tc.outputs['Object'], sep.inputs['Vector'])
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 9.0
    noise.inputs['Detail'].default_value = 6.0
    tco = nt.nodes.new('ShaderNodeTexCoord')
    link(nt, tco.outputs['Object'], noise.inputs['Vector'])
    # z_eff = z - band * edge_noise * (noise - 0.5)
    sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
    link(nt, noise.outputs['Fac'], sub.inputs[0]); sub.inputs[1].default_value = 0.5
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    link(nt, sub.outputs[0], mul.inputs[0]); mul.inputs[1].default_value = band * edge_noise * 2
    zeff = nt.nodes.new('ShaderNodeMath'); zeff.operation = 'SUBTRACT'
    link(nt, sep.outputs['Z'], zeff.inputs[0]); link(nt, mul.outputs[0], zeff.inputs[1])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.interpolation_type = 'SMOOTHSTEP'
    mr.inputs['From Min'].default_value = band
    mr.inputs['From Max'].default_value = 0.0
    link(nt, zeff.outputs[0], mr.inputs['Value'])
    return mr.outputs['Result']


def pbr(name, aid, scale=1.0, tint=(1, 1, 1), rough_add=0.0, rough_mul=1.0, normal_strength=1.0,
        bump=0.0, level_obj=None, wet_band=0.04, wet_dark=0.55, specular=0.5, coords='Object'):
    """Poly Haven scanned material, box-projected in object coordinates (metres * scale)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Specular IOR Level'].default_value = specular
    f = _maps(aid)
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    if coords == 'World':
        geo = nt.nodes.new('ShaderNodeNewGeometry')
        link(nt, geo.outputs['Position'], mp.inputs['Vector'])
    else:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        link(nt, tc.outputs[coords], mp.inputs['Vector'])
    diff = _img(nt, f['diff'], False)
    link(nt, mp.outputs['Vector'], diff.inputs['Vector'])
    col = diff.outputs['Color']
    if tint != (1, 1, 1):
        mt, f_, a_, b_, r_ = mix(nt, 'RGBA', 'MULTIPLY')
        f_.default_value = 1.0
        link(nt, col, a_); b_.default_value = (*tint, 1)
        col = r_
    rough = None
    if 'rough' in f:
        r = _img(nt, f['rough'], True)
        link(nt, mp.outputs['Vector'], r.inputs['Vector'])
        ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'
        link(nt, r.outputs['Color'], ma.inputs[0]); ma.inputs[1].default_value = rough_mul
        ma.inputs[2].default_value = rough_add
        rough = ma.outputs[0]
    normal = None
    if 'nor_gl' in f:
        n = _img(nt, f['nor_gl'], True)
        link(nt, mp.outputs['Vector'], n.inputs['Vector'])
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = normal_strength
        link(nt, n.outputs['Color'], nm.inputs['Color'])
        normal = nm.outputs['Normal']
    if bump > 0 and 'disp' in f:
        d = _img(nt, f['disp'], True)
        link(nt, mp.outputs['Vector'], d.inputs['Vector'])
        b = nt.nodes.new('ShaderNodeBump')
        b.inputs['Strength'].default_value = bump
        b.inputs['Distance'].default_value = 0.01
        link(nt, d.outputs['Color'], b.inputs['Height'])
        if normal is not None:
            link(nt, normal, b.inputs['Normal'])
        normal = b.outputs['Normal']
    if level_obj is not None:
        wet = wet_mask(nt, level_obj, band=wet_band)
        # darker, glossier when wet
        dk, f_, a_, b_, r_ = mix(nt, 'RGBA', 'MULTIPLY')
        link(nt, wet, f_); link(nt, col, a_)
        b_.default_value = (wet_dark, wet_dark, wet_dark * 1.02, 1)
        col = r_
        if rough is not None:
            rm, f_, a_, b_, r_ = mix(nt, 'FLOAT')
            link(nt, wet, f_); link(nt, rough, a_)
            b_.default_value = 0.18
            rough = r_
    link(nt, col, bsdf.inputs['Base Color'])
    if rough is not None:
        link(nt, rough, bsdf.inputs['Roughness'])
    if normal is not None:
        link(nt, normal, bsdf.inputs['Normal'])
    return m


def add_stain(m, hw_obj, color_srgb=(0.11, 0.13, 0.08), band=0.25, rough=0.35, amount=0.85, scale=3.0):
    """Tide staining: below the high-water empty the surface carries algae/silt, with a
    ragged upper edge. Inserted in front of the Principled base colour and roughness."""
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    base_link = bsdf.inputs['Base Color'].links[0].from_socket if bsdf.inputs['Base Color'].links else None
    rough_link = bsdf.inputs['Roughness'].links[0].from_socket if bsdf.inputs['Roughness'].links else None
    tc = nt.nodes.new('ShaderNodeTexCoord'); tc.object = hw_obj
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, tc.outputs['Object'], sep.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 10.0; nz.inputs['Roughness'].default_value = 0.65
    geo = nt.nodes.new('ShaderNodeNewGeometry'); link(nt, geo.outputs['Position'], nz.inputs['Vector'])
    # streaks run down: stretch the noise vertically
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 1.0, 0.25)
    link(nt, geo.outputs['Position'], mp.inputs['Vector']); link(nt, mp.outputs['Vector'], nz.inputs['Vector'])
    off = nt.nodes.new('ShaderNodeMath'); off.operation = 'MULTIPLY_ADD'
    link(nt, nz.outputs['Fac'], off.inputs[0]); off.inputs[1].default_value = band * 2; off.inputs[2].default_value = -band
    zz = nt.nodes.new('ShaderNodeMath'); zz.operation = 'ADD'
    link(nt, sep.outputs['Z'], zz.inputs[0]); link(nt, off.outputs[0], zz.inputs[1])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'
    mr.inputs['From Min'].default_value = 0.05; mr.inputs['From Max'].default_value = -0.15
    mr.inputs['To Max'].default_value = amount
    link(nt, zz.outputs[0], mr.inputs['Value'])
    mx, f_, a_, b_, r_ = mix(nt, 'RGBA', 'MULTIPLY')
    link(nt, mr.outputs['Result'], f_)
    if base_link is not None:
        link(nt, base_link, a_)
    else:
        a_.default_value = bsdf.inputs['Base Color'].default_value
    b_.default_value = (*srgb_to_lin(color_srgb), 1)
    # multiply darkens AND tints: scale the stain colour up so it reads as a tint, not black
    b_.default_value = tuple(min(1.0, v * 3.2) for v in b_.default_value[:3]) + (1,)
    link(nt, r_, bsdf.inputs['Base Color'])
    if rough_link is not None:
        rm, f2, a2, b2, r2 = mix(nt, 'FLOAT')
        link(nt, mr.outputs['Result'], f2); link(nt, rough_link, a2); b2.default_value = rough
        link(nt, r2, bsdf.inputs['Roughness'])
    return m


def paint_mat(name, color_srgb, rough=0.42, rough_aid='metal_plate', rough_scale=3.0, rough_var=0.18,
              coat=0.0, level_obj=None, wet_band=0.02):
    """Satin enamel paint over metal: flat colour, scanned roughness breakup, tiny orange peel."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    col = srgb_to_lin(color_srgb)
    bsdf.inputs['Base Color'].default_value = (*col, 1)
    bsdf.inputs['Coat Weight'].default_value = coat
    bsdf.inputs['Coat Roughness'].default_value = 0.08
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (rough_scale,) * 3
    link(nt, tc.outputs['Object'], mp.inputs['Vector'])
    f = _maps(rough_aid)
    r = _img(nt, f['rough'], True)
    link(nt, mp.outputs['Vector'], r.inputs['Vector'])
    ma = nt.nodes.new('ShaderNodeMapRange')
    link(nt, r.outputs['Color'], ma.inputs['Value'])
    ma.inputs['To Min'].default_value = rough - rough_var / 2
    ma.inputs['To Max'].default_value = rough + rough_var / 2
    rough_s = ma.outputs['Result']
    # orange peel: very fine noise bump
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 900.0
    nz.inputs['Detail'].default_value = 2.0
    link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    b = nt.nodes.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = 0.04
    b.inputs['Distance'].default_value = 0.001
    link(nt, nz.outputs['Fac'], b.inputs['Height'])
    link(nt, b.outputs['Normal'], bsdf.inputs['Normal'])
    base = bsdf.inputs['Base Color']
    if level_obj is not None:
        wet = wet_mask(nt, level_obj, band=wet_band)
        dk, f_, a_, b_, r_ = mix(nt, 'RGBA', 'MULTIPLY')
        link(nt, wet, f_); a_.default_value = (*col, 1)
        b_.default_value = (0.8, 0.8, 0.8, 1)
        link(nt, r_, base)
        rm, f_, a_, b_, r_ = mix(nt, 'FLOAT')
        link(nt, wet, f_); link(nt, rough_s, a_)
        b_.default_value = 0.12
        rough_s = r_
    link(nt, rough_s, bsdf.inputs['Roughness'])
    return m


def shadow_transparent(m, tint=(1, 1, 1), color_socket=None):
    """Shadow rays pass through this material (cheap stand-in for refracted direct light).
    color_socket: optional texture that modulates what passes (used for surface caustics)."""
    nt = m.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    surf = out.inputs['Surface'].links[0].from_socket
    lp = nt.nodes.new('ShaderNodeLightPath')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = (*tint, 1)
    if color_socket is not None:
        link(nt, color_socket, tr.inputs['Color'])
    mix = nt.nodes.new('ShaderNodeMixShader')
    link(nt, lp.outputs['Is Shadow Ray'], mix.inputs['Fac'])
    link(nt, surf, mix.inputs[1])
    link(nt, tr.outputs['BSDF'], mix.inputs[2])
    link(nt, mix.outputs['Shader'], out.inputs['Surface'])
    return m


def water_mat(name='Water', tint_lin=None, density=3.0, ripple=0.06, ripple_scale=6.0, roughness=0.0,
              shadow_trick=True, w_phase=0.0, scatter=0.0, scatter_color=(0.55, 0.85, 0.65),
              caustic=0.0, caustic_scale=22.0, wave_mix=0.35, film=0.0, film_scale=1.5):
    """caustic > 0: the surface's shadow-ray transmission becomes a caustic web (mean ~1),
    so light crossing the surface paints moving caustics on whatever is underwater, and
    only there. Strength 1 = web lines about 3x the mean, troughs about 0.45."""
    """Water: transmission, IOR 1.333, ripple bump on upward faces only, green absorption."""
    if tint_lin is None:
        g = srgb_to_lin(COVER_GREEN_SRGB)
        mx = max(g)
        tint_lin = tuple(0.12 + 0.86 * v / mx for v in g)   # ~ (0.30, 0.98, 0.44): transmits green
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs['IOR'].default_value = 1.333
    bsdf.inputs['Roughness'].default_value = roughness
    if film > 0:   # dust film / scum patches: the reflection goes soft in places, as real still water does
        tcf = nt.nodes.new('ShaderNodeTexCoord')
        fn = nt.nodes.new('ShaderNodeTexNoise')
        fn.inputs['Scale'].default_value = film_scale
        fn.inputs['Detail'].default_value = 8.0
        fn.inputs['Roughness'].default_value = 0.6
        link(nt, tcf.outputs['Object'], fn.inputs['Vector'])
        fr = nt.nodes.new('ShaderNodeMapRange')
        fr.interpolation_type = 'SMOOTHSTEP'
        fr.inputs['From Min'].default_value = 0.52; fr.inputs['From Max'].default_value = 0.68
        fr.inputs['To Min'].default_value = roughness; fr.inputs['To Max'].default_value = film
        link(nt, fn.outputs['Fac'], fr.inputs['Value'])
        link(nt, fr.outputs['Result'], bsdf.inputs['Roughness'])
    # ripples: two octaves of noise, 4D so they can be animated with W
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.noise_dimensions = '4D'
    n1.inputs['Scale'].default_value = ripple_scale
    n1.inputs['Detail'].default_value = 3.0
    n1.inputs['Roughness'].default_value = 0.45
    n1.inputs['W'].default_value = w_phase
    link(nt, tc.outputs['Object'], n1.inputs['Vector'])
    n2 = nt.nodes.new('ShaderNodeTexWave'); n2.wave_type = 'BANDS'; n2.bands_direction = 'DIAGONAL'
    n2.inputs['Scale'].default_value = ripple_scale * 2.2
    n2.inputs['Distortion'].default_value = 6.0
    n2.inputs['Detail'].default_value = 2.0
    n2.inputs['Phase Offset'].default_value = w_phase * 6.0
    link(nt, tc.outputs['Object'], n2.inputs['Vector'])
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    link(nt, n1.outputs['Fac'], add.inputs[0])
    mw = nt.nodes.new('ShaderNodeMath'); mw.operation = 'MULTIPLY'
    link(nt, n2.outputs['Fac'], mw.inputs[0]); mw.inputs[1].default_value = wave_mix
    link(nt, mw.outputs[0], add.inputs[1])
    # only on faces pointing up (the surface), never on the faces against glass or walls
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    link(nt, geo.outputs['True Normal'], sep.inputs['Vector'])
    up = nt.nodes.new('ShaderNodeMapRange')
    up.inputs['From Min'].default_value = 0.6; up.inputs['From Max'].default_value = 0.95
    link(nt, sep.outputs['Z'], up.inputs['Value'])
    st = nt.nodes.new('ShaderNodeMath'); st.operation = 'MULTIPLY'
    link(nt, up.outputs['Result'], st.inputs[0]); st.inputs[1].default_value = ripple
    b = nt.nodes.new('ShaderNodeBump')
    b.inputs['Distance'].default_value = 0.02
    link(nt, st.outputs[0], b.inputs['Strength'])
    link(nt, add.outputs[0], b.inputs['Height'])
    link(nt, b.outputs['Normal'], bsdf.inputs['Normal'])
    # volume
    out = nt.nodes['Material Output']
    va = nt.nodes.new('ShaderNodeVolumeAbsorption')
    va.inputs['Color'].default_value = (*tint_lin, 1)
    va.inputs['Density'].default_value = density
    vol = va.outputs['Volume']
    if scatter > 0:   # suspended particles: a little in-scatter so depth reads as haze, not as black
        vs = nt.nodes.new('ShaderNodeVolumeScatter')
        vs.inputs['Color'].default_value = (*scatter_color, 1)
        vs.inputs['Density'].default_value = scatter
        vs.inputs['Anisotropy'].default_value = 0.55
        av = nt.nodes.new('ShaderNodeAddShader')
        link(nt, va.outputs['Volume'], av.inputs[0]); link(nt, vs.outputs['Volume'], av.inputs[1])
        vol = av.outputs['Shader']
    link(nt, vol, out.inputs['Volume'])
    if shadow_trick:
        csock = None
        if caustic > 0:
            wp = nt.nodes.new('ShaderNodeTexNoise'); wp.noise_dimensions = '4D'
            wp.inputs['Scale'].default_value = caustic_scale * 0.18
            wp.inputs['W'].default_value = w_phase
            link(nt, tc.outputs['Object'], wp.inputs['Vector'])
            mv, f_, a_, b_, r_ = mix(nt, 'VECTOR'); f_.default_value = 0.22
            link(nt, tc.outputs['Object'], a_); link(nt, wp.outputs['Color'], b_)
            vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.voronoi_dimensions = '4D'
            vo.feature = 'DISTANCE_TO_EDGE'
            vo.inputs['Scale'].default_value = caustic_scale
            vo.inputs['W'].default_value = w_phase * 0.5
            link(nt, r_, vo.inputs['Vector'])
            iv = nt.nodes.new('ShaderNodeMapRange')
            iv.inputs['From Min'].default_value = 0.0; iv.inputs['From Max'].default_value = 0.16
            iv.inputs['To Min'].default_value = 1.0; iv.inputs['To Max'].default_value = 0.0
            link(nt, vo.outputs['Distance'], iv.inputs['Value'])
            pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'
            link(nt, iv.outputs['Result'], pw.inputs[0]); pw.inputs[1].default_value = 3.0
            # value = 0.45 + 2.6*web  (mean ~1), blended toward 1 by (1-caustic) and on non-up faces
            ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'
            link(nt, pw.outputs[0], ma.inputs[0]); ma.inputs[1].default_value = 2.6; ma.inputs[2].default_value = 0.45
            amt = nt.nodes.new('ShaderNodeMath'); amt.operation = 'MULTIPLY'
            link(nt, up.outputs['Result'], amt.inputs[0]); amt.inputs[1].default_value = min(caustic, 1.0)
            mf, f2, a2, b2, r2 = mix(nt, 'FLOAT')
            link(nt, amt.outputs[0], f2); a2.default_value = 1.0; link(nt, ma.outputs[0], b2)
            csock = r2
        shadow_transparent(m, color_socket=csock)
    m['ripple_nodes'] = [n1.name, n2.name]
    return m


def glass_mat(name='Glass', tint=(0.93, 0.975, 0.955), ior=1.52, shadow_trick=True):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    g = nt.nodes.new('ShaderNodeBsdfGlass')
    g.inputs['Color'].default_value = (*tint, 1)
    g.inputs['IOR'].default_value = ior
    g.inputs['Roughness'].default_value = 0.0
    link(nt, g.outputs['BSDF'], nt.nodes['Material Output'].inputs['Surface'])
    if shadow_trick:
        shadow_transparent(m, tint=(0.97, 0.99, 0.98))
    return m


def simple_mat(name, color_srgb, rough=0.5, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_to_lin(color_srgb), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metallic
    return m


# ----------------------------------------------------------------------------- geometry

def obj_from_mesh(name, me, mat=None):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat is not None:
        me.materials.append(mat)
    return ob


def box(name, xmin, xmax, ymin, ymax, zmin, zmax, mat=None, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = xmin if v.co.x < 0 else xmax
        v.co.y = ymin if v.co.y < 0 else ymax
        v.co.z = zmin if v.co.z < 0 else zmax
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=3, affect='EDGES', profile=0.5)
    for f in bm.faces:
        f.smooth = bevel > 0
    bm.to_mesh(me)
    bm.free()
    if bevel > 0:
        _sharp_by_angle(me, 50)
    return obj_from_mesh(name, me, mat)


def _sharp_by_angle(me, deg):
    bm = bmesh.new()
    bm.from_mesh(me)
    lim = math.radians(deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0) > lim:
            e.smooth = False
    bm.to_mesh(me)
    bm.free()


def load_font(fname):
    return bpy.data.fonts.load(os.path.join(FONTS, fname), check_existing=True)


def build_line(text, font, size, depth, bevel, name='line', align='CENTER', tracking=0.0, mat=None):
    """One line of type as a mesh standing up in the XZ plane, front face towards -Y,
    baseline on z=0, back face on y=0 (so it can be mounted on a wall at y=0)."""
    cu = bpy.data.curves.new(name, type='FONT')
    cu.body = text
    cu.font = font
    cu.size = size
    cu.align_x = align
    cu.space_character = 1.0 + tracking
    cu.extrude = max(depth / 2 - bevel, 0.0001)
    cu.bevel_depth = bevel
    cu.bevel_resolution = 3
    cu.resolution_u = 6
    tmp = bpy.data.objects.new(name + '_tmp', cu)
    bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    # stand it up: text Y -> world Z, text +Z (front) -> world -Y
    for v in me.vertices:
        x, y, z = v.co
        v.co = Vector((x, -z + depth / 2, y))
    me.update()
    _sharp_by_angle(me, 32)
    ob = obj_from_mesh(name, me, mat)
    return ob


def bounds(ob):
    xs = [v.co.x for v in ob.data.vertices]
    zs = [v.co.z for v in ob.data.vertices]
    return min(xs), max(xs), min(zs), max(zs)


def _graded(a, b, edge, fine=0.0006, coarse=0.03):
    """Coordinates from a to b, very fine within `edge` of both ends (for the meniscus)."""
    pts = [a]
    x = a
    while x < b:
        d = min(x - a, b - x)
        step = fine if d < edge else min(coarse, fine + (d - edge) * 0.5)
        x = min(b, x + step)
        pts.append(x)
    return pts


def water_box(name, xmin, xmax, ymin, ymax, zbot, ztop, mat, meniscus=0.003, men_w=0.0025,
              walls=('x0', 'x1', 'y0', 'y1')):
    """Closed water body. Its top rises by `meniscus` where it meets the listed walls,
    with a decay length of `men_w` (water wets glass and concrete: a concave meniscus)."""
    edge = men_w * 5
    xs = _graded(xmin, xmax, edge)
    ys = _graded(ymin, ymax, edge)
    bm = bmesh.new()
    grid = []
    for j, y in enumerate(ys):
        row = []
        for i, x in enumerate(xs):
            h = 0.0
            if 'x0' in walls: h += math.exp(-(x - xmin) / men_w)
            if 'x1' in walls: h += math.exp(-(xmax - x) / men_w)
            if 'y0' in walls: h += math.exp(-(y - ymin) / men_w)
            if 'y1' in walls: h += math.exp(-(ymax - y) / men_w)
            row.append(bm.verts.new((x, y, ztop + meniscus * min(h, 1.3))))
        grid.append(row)
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    # sides and bottom
    ring = [grid[0][i] for i in range(len(xs))] + [grid[j][-1] for j in range(1, len(ys))] + \
           [grid[-1][i] for i in range(len(xs) - 2, -1, -1)] + [grid[j][0] for j in range(len(ys) - 2, 0, -1)]
    low = [bm.verts.new((v.co.x, v.co.y, zbot)) for v in ring]
    n = len(ring)
    for k in range(n):
        bm.faces.new((ring[k], low[k], low[(k + 1) % n], ring[(k + 1) % n]))
    bm.faces.new(low[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    _sharp_by_angle(me, 60)
    return obj_from_mesh(name, me, mat)


def level_empty(z):
    e = bpy.data.objects.new('WaterLevel', None)
    e.location = (0, 0, z)
    bpy.context.scene.collection.objects.link(e)
    return e


# ----------------------------------------------------------------------------- lights & camera

def area_light(name, loc, look_at, size_x, size_y, energy, kelvin=5600, spread=180, shape='RECTANGLE'):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = shape
    ld.size, ld.size_y = size_x, size_y
    ld.energy = energy
    ld.spread = math.radians(spread)
    ld.color = kelvin_rgb(kelvin)
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    aim(ob, look_at)
    return ob


def spot_light(name, loc, look_at, energy, size=0.05, angle=40, blend=0.3, kelvin=5600):
    ld = bpy.data.lights.new(name, 'SPOT')
    ld.energy = energy
    ld.shadow_soft_size = size
    ld.spot_size = math.radians(angle)
    ld.spot_blend = blend
    ld.color = kelvin_rgb(kelvin)
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    aim(ob, look_at)
    return ob


def sun_light(name, elev_deg, azim_deg, strength, angle_deg=0.6, kelvin=5000):
    ld = bpy.data.lights.new(name, 'SUN')
    ld.energy = strength
    ld.angle = math.radians(angle_deg)
    ld.color = kelvin_rgb(kelvin)
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    el, az = math.radians(elev_deg), math.radians(azim_deg)
    d = Vector((math.cos(el) * math.sin(az), math.cos(el) * math.cos(az), math.sin(el)))  # towards the sun
    ob.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    return ob


def gobo_caustics(light_ob, scale=14.0, sharpness=3.0, w=0.0, strength_mul=1.0):
    """Projected caustic pattern on a spot light (fake caustics, ~free to render).
    Ray direction in light space -> planar projection -> Voronoi edge web."""
    ld = light_ob.data
    ld.use_nodes = True
    nt = ld.node_tree
    em = nt.nodes['Emission']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    link(nt, tc.outputs['Normal'], sep.inputs['Vector'])
    dx = nt.nodes.new('ShaderNodeMath'); dx.operation = 'DIVIDE'
    dy = nt.nodes.new('ShaderNodeMath'); dy.operation = 'DIVIDE'
    link(nt, sep.outputs['X'], dx.inputs[0]); link(nt, sep.outputs['Z'], dx.inputs[1])
    link(nt, sep.outputs['Y'], dy.inputs[0]); link(nt, sep.outputs['Z'], dy.inputs[1])
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    link(nt, dx.outputs[0], comb.inputs['X']); link(nt, dy.outputs[0], comb.inputs['Y'])
    # warp, then voronoi distance-to-edge => bright web lines like pool caustics
    warp = nt.nodes.new('ShaderNodeTexNoise'); warp.noise_dimensions = '4D'
    warp.inputs['Scale'].default_value = scale * 0.25
    warp.inputs['W'].default_value = w
    link(nt, comb.outputs['Vector'], warp.inputs['Vector'])
    mixv, f_, a_, b_, r_ = mix(nt, 'VECTOR')
    f_.default_value = 0.25
    link(nt, comb.outputs['Vector'], a_); link(nt, warp.outputs['Color'], b_)
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.voronoi_dimensions = '4D'
    vor.feature = 'DISTANCE_TO_EDGE'
    vor.inputs['Scale'].default_value = scale
    vor.inputs['W'].default_value = w * 0.6
    link(nt, r_, vor.inputs['Vector'])
    # bright where distance is small
    inv = nt.nodes.new('ShaderNodeMapRange')
    inv.inputs['From Min'].default_value = 0.0; inv.inputs['From Max'].default_value = 0.12
    inv.inputs['To Min'].default_value = 1.0; inv.inputs['To Max'].default_value = 0.0
    link(nt, vor.outputs['Distance'], inv.inputs['Value'])
    pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'
    link(nt, inv.outputs['Result'], pw.inputs[0]); pw.inputs[1].default_value = sharpness
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY_ADD'
    link(nt, pw.outputs[0], mul.inputs[0]); mul.inputs[1].default_value = 3.0 * strength_mul
    mul.inputs[2].default_value = 0.35 * strength_mul
    link(nt, mul.outputs[0], em.inputs['Strength'])
    return light_ob


def kelvin_rgb(k):
    """Approximate blackbody colour (Tanner Helland fit), normalised, linear-ish."""
    t = k / 100.0
    r = 255 if t <= 66 else 329.698727446 * ((t - 60) ** -0.1332047592)
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * ((t - 60) ** -0.0755148492)
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    c = [max(0, min(255, v)) / 255 for v in (r, g, b)]
    return tuple(srgb_to_lin(c))


def aim(ob, target):
    d = Vector(target) - Vector(ob.location)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def camera(loc, look_at, focal=70.0, fstop=8.0, focus=None, sensor=36.0, shift_y=0.0):
    cd = bpy.data.cameras.new('Camera')
    cd.lens = focal
    cd.sensor_width = sensor
    cd.sensor_fit = 'HORIZONTAL'
    cd.shift_y = shift_y
    cd.dof.use_dof = fstop > 0
    cd.dof.aperture_fstop = max(fstop, 0.5)
    cd.dof.aperture_blades = 7
    cd.dof.aperture_rotation = math.radians(12)
    cd.dof.focus_distance = focus if focus else (Vector(look_at) - Vector(loc)).length
    cd.clip_start = 0.05
    ob = bpy.data.objects.new('Camera', cd)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    aim(ob, look_at)
    bpy.context.scene.camera = ob
    return ob


# ----------------------------------------------------------------------------- post

def _grain_plate(w, h, seed=1):
    import numpy as np
    name = f'grain_{w}x{h}_{seed}'
    if name in bpy.data.images:
        return bpy.data.images[name]
    rng = np.random.default_rng(seed)
    n = rng.normal(0.0, 1.0, (h, w)).astype(np.float32)
    # soften: film grain clumps over ~1.5 px
    k = np.array([0.25, 0.5, 0.25], dtype=np.float32)
    n = np.apply_along_axis(lambda r: np.convolve(r, k, mode='same'), 1, n)
    n = np.apply_along_axis(lambda c: np.convolve(c, k, mode='same'), 0, n)
    n = n / (n.std() + 1e-6)
    v = 0.5 + 0.18 * n
    img = bpy.data.images.new(name, w, h, float_buffer=True, is_data=True)
    px = np.ones((h, w, 4), dtype=np.float32)
    px[..., 0] = px[..., 1] = px[..., 2] = v
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def _vignette_plate(w, h, strength):
    import numpy as np
    name = f'vignette_{w}x{h}_{strength:.3f}'
    if name in bpy.data.images:
        return bpy.data.images[name]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2) * (h / w) ** 0.5
    r2 = (nx * nx + ny * ny) / (1 + (h / w))
    v = (1.0 - strength * np.clip(r2, 0, 1.5) ** 1.15).astype(np.float32)
    img = bpy.data.images.new(name, w, h, float_buffer=True, is_data=True)
    px = np.ones((h, w, 4), dtype=np.float32)
    px[..., 0] = px[..., 1] = px[..., 2] = v
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def _set(node, attr, sock, val):
    if hasattr(node, attr):
        try:
            setattr(node, attr, val)
            return
        except Exception:
            pass
    if sock in node.inputs:
        node.inputs[sock].default_value = val


def post(sc, grain=0.10, vignette=0.28, dispersion=0.004, glare=0.15, seed=1):
    """Compositor finishing, the way a photograph would be finished:
    lens dispersion (lateral CA at the edges), faint halation on hot highlights,
    a soft optical vignette, and a fixed grain plate (shifted per frame)."""
    sc.use_nodes = True
    nt = sc.node_tree
    nt.nodes.clear()
    rl = nt.nodes.new('CompositorNodeRLayers')
    comp = nt.nodes.new('CompositorNodeComposite')
    cur = rl.outputs['Image']
    if glare > 0:
        gl = nt.nodes.new('CompositorNodeGlare')
        _set(gl, 'glare_type', 'Type', 'FOG_GLOW')
        _set(gl, 'quality', 'Quality', 'MEDIUM')
        _set(gl, 'threshold', 'Threshold', 1.2)
        _set(gl, 'size', 'Size', 8)
        _set(gl, 'mix', 'Mix', -1.0 + glare)  # -1 = image only
        if 'Strength' in gl.inputs:
            gl.inputs['Strength'].default_value = glare
        link(nt, cur, gl.inputs['Image'])
        cur = gl.outputs['Image']
    if dispersion > 0:
        ld = nt.nodes.new('CompositorNodeLensdist')
        _set(ld, 'use_fit', 'Fit', True)
        if 'Dispersion' in ld.inputs:
            ld.inputs['Dispersion'].default_value = dispersion
        if 'Distortion' in ld.inputs:
            ld.inputs['Distortion'].default_value = 0.0
        link(nt, cur, ld.inputs['Image'])
        cur = ld.outputs['Image']
    if vignette > 0:
        # optical vignette as a precomputed plate: cos^4-like falloff, no visible edge
        vi = nt.nodes.new('CompositorNodeImage')
        vi.image = _vignette_plate(sc.render.resolution_x, sc.render.resolution_y, vignette)
        mm = nt.nodes.new('CompositorNodeMixRGB'); mm.blend_type = 'MULTIPLY'
        mm.inputs['Fac'].default_value = 1.0
        link(nt, cur, mm.inputs[1]); link(nt, vi.outputs['Image'], mm.inputs[2])
        cur = mm.outputs['Image']
    if grain > 0:
        w, h = sc.render.resolution_x, sc.render.resolution_y
        gi = nt.nodes.new('CompositorNodeImage')
        gi.image = _grain_plate(w, h, seed)
        tr = nt.nodes.new('CompositorNodeTranslate')
        _set(tr, 'wrap_axis', 'Wrap', 'BOTH')
        rnd = random.Random(sc.frame_current * 7919 + seed)
        tr.inputs['X'].default_value = rnd.randint(0, w)
        tr.inputs['Y'].default_value = rnd.randint(0, h)
        link(nt, gi.outputs['Image'], tr.inputs['Image'])
        mo = nt.nodes.new('CompositorNodeMixRGB'); mo.blend_type = 'OVERLAY'
        mo.inputs['Fac'].default_value = grain
        link(nt, cur, mo.inputs[1]); link(nt, tr.outputs['Image'], mo.inputs[2])
        cur = mo.outputs['Image']
    link(nt, cur, comp.inputs['Image'])
    return nt


# ----------------------------------------------------------------------------- render

def render(sc, out_png, label, extra=None):
    os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)
    sc.render.filepath = os.path.abspath(out_png)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    dt = round(time.time() - t0, 1)
    row = dict(label=label, out=os.path.relpath(os.path.abspath(out_png), ROOT), seconds=dt,
               w=sc.render.resolution_x, h=sc.render.resolution_y, samples=sc.cycles.samples,
               threshold=sc.cycles.adaptive_threshold, look=sc.view_settings.look,
               blender=bpy.app.version_string, when=time.strftime('%Y-%m-%d %H:%M:%S'))
    if extra:
        row.update(extra)
    with open(os.path.join(HERE, 'renders.jsonl'), 'a') as f:
        f.write(json.dumps(row) + '\n')
    print('RENDER_SECONDS', dt, out_png)
    return dt


def save_blend(path):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(path), compress=True)
