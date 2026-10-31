"""Staging (c): the lock wall. My own idea, built from the pieces staging (b) taught.

An outdoor canal-lock chamber in daylight. The sentence [M 696] is three lines of stand-off
letters fixed to the weathered in-situ concrete of the far wall, above a cast landing step
(the ground the words stand on; Side raises it). Beside the words: an enamel E-pattern staff
gauge (the real instrument for reading a water level, painted by tools/make_staff_gauge.py)
and a recessed steel ladder (rungs every 0.3 m: an honest scale cue). Below an earlier
high-water mark the wall carries a silt/algae stain, so the wall records where the water has
been ("each cycle starts higher" leaves visible rings). The water surface is real geometry
(Ocean modifier, light wind chop), so the waterline on the wall is irregular, not ruled.
The camera stands on the opposite coping, about 9 m away, looking a little down.

The extra realism cue this staging adds: low sun reflecting off the chop paints a moving
band of light on the wall just above the water (fake: a gobo spot at the sun's mirror point).

Run:
  blender -b -P lookdev/stage_c_lock.py -- --w 720 --h 450 --samples 32 --level over --out lookdev/c/c_test.png
Options:
  --level    below | touch | over | high | drown | <metres above the lock floor>
  --hw       earlier high-water mark (metres; 0 = none)
  --letters  dark | white | cast
  --wallcaustics 1/0   reflected sun shimmer above the waterline
  --time     ocean time (seconds) - animate this for live water
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
import lib_lookdev as L

A = L.args(dict(w=720, h=450, samples=32, threshold=0.02, level='over', letters='dark', post=True,
                out='lookdev/c/c_test.png', font='LibreFranklin-Black.ttf', focal=50.0, fstop=8.0,
                look='AgX - Medium High Contrast', exposure=0.8, guiding=False, save='', density=1.0,
                label='c', sun=4.5, sunel=42.0, sunaz=250.0, hdri=1.0, hdri_rot=150.0, camx=0.35,
                camy=-8.4, camz=3.0, lookz=0.0, hw=2.45, wallcaustics=True, wc=0.5, time=2.0,
                wind=2.2, wscale=0.07, chop=0.5, ripple=0.03, caustic=0.8, scatter=0.08, standoff=0.03,
                ledge=0.70, width=4.1, seq='', ldepth=0.035, sunangle=0.55, window=False, wd=0.8))
if A['window']:
    # c-window: the same lock wall seen from a dry observation gallery through a glass wall in the
    # water (the over-under split of staging a, at architectural scale). Camera at eye level.
    # glass 0.8 m in front of the wall: with the eye above the water, refraction hides a band of wall
    # just under the surface whose height grows with the glass-to-wall gap (2.2 m hid ~16 cm, c16).
    for k_, v_ in dict(camy=-A['wd'] - 6.0, camz=1.65, focal=50.0, fstop=5.6, width=3.4, chop=0.0,
                       sunel=70.0, sunaz=235.0, density=0.9, scatter=0.04, sun=4.5, hdri=1.4,
                       wallcaustics=False, standoff=0.0, ldepth=0.02, exposure=1.1, sunangle=3.0).items():
        if ('--' + k_) not in sys.argv:
            A[k_] = v_

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=A['threshold'], look=A['look'],
               exposure=A['exposure'], guiding=A['guiding'], transmission=8, glossy=3)

# ---------------------------------------------------------------- dimensions (metres)
LX = 10.0          # half length of the visible chamber
LW = 10.0          # chamber width (far wall y=0, near wall y=-LW)
WALL_H = 5.6
LEDGE_D = 0.55

lvl = L.level_empty(0.0)
hw = bpy.data.objects.new('HighWater', None)
hw.location = (0, 0, A['hw'] if A['hw'] > 0 else -50)
sc.collection.objects.link(hw)
font = L.load_font(A['font'])

m_wall = L.pbr('LockWall', 'concrete_wall_007', scale=0.36, tint=(0.92, 0.92, 0.90), normal_strength=1.0,
               level_obj=lvl, wet_band=0.12, wet_dark=0.5)
L.add_stain(m_wall, hw, mul_srgb=(0.80, 0.80, 0.66), band=0.30, rough=0.55, amount=0.5, scale=1.6)
m_ledge = L.pbr('Landing', 'concrete_wall_008', scale=0.5, tint=(0.78, 0.78, 0.76), normal_strength=0.9,
                level_obj=lvl, wet_band=0.06, wet_dark=0.55)
L.add_stain(m_ledge, hw, mul_srgb=(0.78, 0.78, 0.64), band=0.20, rough=0.5, amount=0.7, scale=2.0)
m_coping = L.pbr('Coping', 'precast_concrete_wall', scale=0.6, tint=(0.75, 0.74, 0.72), normal_strength=0.8)
m_floor = L.pbr('LockFloor', 'concrete_floor_worn_001', scale=0.3, tint=(0.35, 0.36, 0.30))
m_steel = L.paint_mat('LadderSteel', (0.16, 0.17, 0.16), rough=0.5, rough_aid='rusty_metal_02', rough_scale=4.0,
                      rough_var=0.3, level_obj=lvl, wet_band=0.04)
L.add_stain(m_steel, hw, mul_srgb=(0.62, 0.50, 0.40), band=0.10, rough=0.6, amount=0.7, scale=5.0)

paint = dict(dark=(0.075, 0.085, 0.08), white=(0.84, 0.84, 0.82), cast=(1, 1, 1))[A['letters']]
if A['letters'] == 'cast':
    m_letters = L.pbr('CastLetters', 'concrete_wall_008', scale=1.2, tint=(1.05, 1.05, 1.03), normal_strength=0.7,
                      level_obj=lvl, wet_band=0.05, wet_dark=0.55)
else:
    m_letters = L.paint_mat('LetterPaint', paint, rough=0.48, rough_var=0.22, coat=0.05, level_obj=lvl,
                            rough_scale=1.2, wet_band=0.04)
L.add_stain(m_letters, hw, mul_srgb=(0.85, 0.85, 0.72), band=0.25, rough=0.5, amount=0.5, scale=1.6)

# ---------------------------------------------------------------- the chamber
L.box('farwall', -LX - 2, LX + 2, 0.0, 0.8, -0.5, WALL_H, m_wall)
L.box('coping_far', -LX - 2, LX + 2, -0.18, 0.8, WALL_H, WALL_H + 0.28, m_coping, bevel=0.01)
if not A['window']:
    L.box('nearwall', -LX - 2, LX + 2, -LW - 0.8, -LW, -0.5, WALL_H, m_wall)
else:
    # gallery: 40 mm laminated glass wall standing on the lock floor, a dark room behind it
    WD = A['wd']
    m_glass = L.glass_mat('GalleryGlass', tint=(0.90, 0.965, 0.94), ior=1.52, shadow_trick=True)
    L.box('glass', -LX - 2, LX + 2, -WD - 0.04, -WD, -0.5, 3.4, m_glass)
    m_gal = L.pbr('GalleryPaint', 'painted_plaster_wall', scale=0.6, tint=(0.10, 0.105, 0.10), normal_strength=0.5)
    L.box('gal_ceiling', -LX - 2, LX + 2, -9.0, -WD - 0.04, 3.4, 3.75, m_gal)
    L.box('gal_back', -LX - 2, LX + 2, -9.3, -9.0, -0.5, 3.75, m_gal)
    L.box('gal_floor', -LX - 2, LX + 2, -9.0, -WD - 0.04, -0.5, 0.0, m_gal)
    L.box('mullion_l', -2.95, -2.87, -WD - 0.12, -WD - 0.04, -0.5, 3.4, m_gal)
    L.box('mullion_r', 2.87, 2.95, -WD - 0.12, -WD - 0.04, -0.5, 3.4, m_gal)
L.box('floor', -LX - 2, LX + 2, -LW, 0.0, -0.5, 0.0, m_floor)
L.box('end_l', -LX - 2.6, -LX - 2, -LW, 0.0, -0.5, WALL_H, m_wall)
L.box('end_r', LX + 2, LX + 2.6, -LW, 0.0, -0.5, WALL_H, m_wall)
L.box('landing', -2.6, 2.6, -LEDGE_D, 0.0, 0.0, A['ledge'], m_ledge, bevel=0.012)

# ---------------------------------------------------------------- type on the wall
size = 0.3
lines = [L.build_line(t, font, size, depth=A['ldepth'], bevel=min(0.004, A['ldepth'] * 0.2), name=f'line{i}', mat=m_letters)
         for i, t in enumerate(L.SENTENCE)]                     # i=0 top line
widest = max(L.bounds(o)[1] - L.bounds(o)[0] for o in lines)
k = A['width'] / widest
for o in lines:
    for v in o.data.vertices:
        v.co.x *= k; v.co.z *= k
desc = -min(L.bounds(o)[2] for o in lines)
asc = max(L.bounds(o)[3] for o in lines)
pitch = (asc + desc) * 1.08
base0 = A['ledge'] + 0.38 + desc
standoff = 0.0 if A['letters'] == 'cast' else A['standoff']
for i, o in enumerate(lines):
    o.location = (0, -standoff - A['ldepth'], base0 + (2 - i) * pitch)   # front face is at local y=0
bottom_of_words = base0 - desc
top_of_words = base0 + 2 * pitch + asc
levels = dict(below=A['ledge'] - 0.25, touch=bottom_of_words + 0.02, over=base0 + asc * 0.45,
              high=base0 + pitch + asc * 0.5, drown=top_of_words + 0.25)
level = levels.get(A['level'])
level = float(A['level']) if level is None else level
lvl.location.z = level

# ---------------------------------------------------------------- staff gauge (enamel plate, 3 m)
def uv_plane(name, x0, x1, z0, z1, y, mat):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new((x0, y, z0)), bm.verts.new((x1, y, z0)), bm.verts.new((x1, y, z1)), bm.verts.new((x0, y, z1))]
    f = bm.faces.new(vs)
    for loop, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop[uv].uv = c
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    if me.polygons[0].normal.y > 0:
        me.flip_normals()
    return L.obj_from_mesh(name, me, mat)

gauge_img = os.path.join(L.ROOT, 'assets', 'generated', 'staff_gauge.png')
m_gauge = bpy.data.materials.new('EnamelGauge'); m_gauge.use_nodes = True
nt = m_gauge.node_tree; bsdf = nt.nodes['Principled BSDF']
ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = bpy.data.images.load(gauge_img); ti.interpolation = 'Cubic'
L.link(nt, ti.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.22
bsdf.inputs['Coat Weight'].default_value = 0.4
bsdf.inputs['Coat Roughness'].default_value = 0.12
L.add_stain(m_gauge, hw, mul_srgb=(0.78, 0.80, 0.66), band=0.08, rough=0.35, amount=0.45, scale=4.0)
GX = A['width'] / 2 + 0.55
uv_plane('gauge', GX - 0.06, GX + 0.06, 0.0, 3.0, -0.022, m_gauge)
L.box('gauge_backer', GX - 0.075, GX + 0.075, -0.02, 0.0, -0.02, 3.02, m_steel)

# ---------------------------------------------------------------- ladder (left)
LXC = -A['width'] / 2 - 0.75
# surface-mounted: two rails on brackets, rungs every 0.3 m
for sx in (-0.23, 0.23):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.024, depth=WALL_H + 0.2, location=(LXC + sx, -0.16, WALL_H / 2 - 0.05),
                                        vertices=20)
    o = bpy.context.object; o.data.materials.append(m_steel); bpy.ops.object.shade_smooth()
z = 0.3
while z < WALL_H:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.46, location=(LXC, -0.16, z), vertices=16,
                                        rotation=(0, math.pi / 2, 0))
    o = bpy.context.object; o.data.materials.append(m_steel); bpy.ops.object.shade_smooth()
    z += 0.3
for zb in (0.6, 2.4, 4.2):
    for sx in (-0.23, 0.23):
        L.box('bracket', LXC + sx - 0.02, LXC + sx + 0.02, -0.16, 0.0, zb - 0.03, zb + 0.03, m_steel)

# ---------------------------------------------------------------- water: real geometry waves
m_water = L.water_mat('Water', tint_lin=(0.22, 0.50, 0.26), density=A['density'], ripple=A['ripple'],
                      ripple_scale=3.0, caustic=A['caustic'], caustic_scale=2.6, wave_mix=0.1,
                      film=0.08, scatter=A['scatter'], scatter_color=(0.30, 0.55, 0.34))
if A['scatter'] > 0:
    sc.cycles.volume_bounces = 1
    sc.cycles.volume_step_rate = 4.0
y_near = (-A['wd'] - 0.002) if A['window'] else (-LW - 0.05)   # window: overlap the glass by 2 mm


def make_water(z, t):
    return L.ocean_water('water', -LX - 2.05, LX + 2.05, y_near, 0.05, 0.002, z, m_water,
                         spacing=0.05, spatial=12, resolution=12, wind=A['wind'], scale=A['wscale'],
                         chop=A['chop'], direction_deg=80, time=t)


water = make_water(level, A['time'])

# ---------------------------------------------------------------- light
sun = L.sun_light('Sun', A['sunel'], A['sunaz'], A['sun'], angle_deg=A['sunangle'], kelvin=5000)
L.world_hdri(sc, 'kloofendal_48d_partly_cloudy_puresky', strength=A['hdri'], rot_z_deg=A['hdri_rot'], clamp=6.0)

if A['wallcaustics']:
    # Sun glitter thrown onto the wall by the chop. Real reflective caustics are far too slow on
    # CPU, so we fake them with a projector: a low spot just above the water in front of the wall,
    # a narrow cone widened sideways by object scale (scaled spot = elliptical cone), projecting a
    # caustic web stretched sideways (aspect) into wavy lines.
    # (Tried first, c06/c07: a spot at the sun's mirror point BELOW the water, aimed up. The landing
    # step blocked it, and with shadow linking it threw a soft diagonal fan, not a band.)
    aimp = Vector((0.0, 0.0, level + 0.20))
    pos = Vector((-0.8, -A['wd'] * 0.6 if A['window'] else -3.2, level + 0.03))
    sp = L.spot_light('SunGlitter', tuple(pos), tuple(aimp), 700 * A['wc'], size=0.005, angle=13, blend=0.9,
                      kelvin=5000)
    sp.scale = (12.0, 1.0, 1.0)
    L.gobo_caustics(sp, scale=26.0, sharpness=3.0, w=A['time'] * 0.35, strength_mul=1.0, aspect=0.10)
    sp.visible_glossy = False
    sp.visible_transmission = False
    # Shadow linking: for this light only the things standing proud of the wall cast shadows.
    # (The light stands in for a reflection AT the water plane, so nothing below it may block it.)
    blockers = bpy.data.collections.new('GlitterBlockers')
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.startswith(('line', 'Cylinder', 'bracket', 'gauge')):
            blockers.objects.link(o)
    sp.light_linking.blocker_collection = blockers

# ---------------------------------------------------------------- camera
look_z = A['lookz'] if A['lookz'] else bottom_of_words + (0.75 if A['window'] else 0.55)
L.camera((A['camx'], A['camy'], A['camz']), (0.0, 0.0, look_z), focal=A['focal'], fstop=A['fstop'],
         focus=(Vector((0, 0, look_z)) - Vector((A['camx'], A['camy'], A['camz']))).length)

if A['post']:
    L.post(sc, grain=0.07, vignette=0.22, dispersion=0.004, glare=0.12)

print('LEVEL', round(level, 3), 'WORDS', round(bottom_of_words, 3), round(top_of_words, 3), 'PITCH', round(pitch, 3),
      'GAUGE_X', round(GX, 2))
if A['save']:
    L.save_blend(A['save'])
meta = dict(staging='c_window' if A['window'] else 'c_lock', level=A['level'], letters=A['letters'],
            wallcaustics=A['wallcaustics'], focal=A['focal'], fstop=A['fstop'])
if not A['seq']:
    L.render(sc, A['out'], A['label'], meta)
else:
    # Sequence timing test: one Blender session, persistent data on, the water level changes per
    # frame (as in the scroll story). Each frame: move the level empty (wet band, glitter), rebuild
    # the baked ocean mesh at the new height and a slightly later ocean time, render.
    zs = [float(v) for v in A['seq'].split(',')]
    base, ext_ = os.path.splitext(A['out'])
    for fi, z in enumerate(zs):
        sc.frame_set(fi + 1)
        lvl.location.z = z
        old = bpy.data.objects['water']; me_ = old.data
        bpy.data.objects.remove(old); bpy.data.meshes.remove(me_)
        make_water(z, A['time'] + fi * 0.04)
        if A['wallcaustics']:
            sp.location = (-0.8, -A['wd'] * 0.6 if A['window'] else -3.2, z + 0.03)
            L.aim(sp, (0.0, 0.0, z + 0.20))
        if A['post']:
            L.post(sc, grain=0.07, vignette=0.22, dispersion=0.004, glare=0.12)   # re-seeds the grain shift
        meta.update(level=round(z, 3), seq_frame=fi + 1, seq_len=len(zs))
        L.render(sc, f'{base}_{fi + 1:03d}{ext_}', A['label'], meta)
