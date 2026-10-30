"""Staging (a): a glass tank seen head-on, an over-under split.

The sentence [M 696] is three lines of painted steel letters fixed to the risers of a
three-step cast-concrete plinth standing inside a rimless glass tank. Water (IOR 1.333,
cover-green absorption) fills the tank to --level. The camera looks straight in through
the front pane, so the waterline crosses the frame: dry letters above, refracted and
tinted letters below, a meniscus where the water climbs the glass.

Run:
  blender -b -P lookdev/stage_a_tank.py -- --w 720 --h 450 --samples 32 --level over --out lookdev/a/a_test.png
Options:
  --level     below | touch | over | high | <metres>   (water height; 'over' crosses line 3)
  --caustics  none | gobo | mnee
  --letters   light | dark
  --post      1/0 (compositor grain, vignette, dispersion, glare)
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import lib_lookdev as L

A = L.args(dict(w=720, h=450, samples=32, threshold=0.02, level='over', caustics='gobo',
                letters='light', post=True, out='lookdev/a/a_test.png', font='LibreFranklin-Black.ttf',
                focal=70.0, fstop=8.0, camz=0.0, look='AgX - Medium High Contrast', exposure=0.0,
                guiding=False, save='', density=4.0, label='a', wall='dark', camx=0.32, win=150.0, top=60.0, scatter=0.0, winx=-2.6, sun=0.0, sunel=55.0, sunaz=-35.0))

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=A['threshold'], look=A['look'],
               exposure=A['exposure'], guiding=A['guiding'], transmission=14)

# ---------------------------------------------------------------- dimensions (metres)
T = 0.012                    # glass thickness
X0, X1 = -0.60, 0.60         # tank interior
Y0, Y1 = 0.0, 0.46
H = 0.66                     # interior height
ZB = 0.15                    # pedestal under the steps
TREAD = 0.075                # depth of each step
PX0, PX1 = -0.52, 0.52       # plinth width
PY0, PY1 = 0.10, 0.42

font = L.load_font(A['font'])
light_letters = A['letters'] == 'light'
paint = (0.86, 0.84, 0.79) if light_letters else (0.10, 0.12, 0.11)

# provisional level for the wet mask; final z set below once the type is measured
lvl = L.level_empty(0.0)

m_letters = L.paint_mat('LetterPaint', paint, rough=0.38, rough_var=0.2, coat=0.15, level_obj=lvl)
m_plinth = L.pbr('CastConcrete', 'concrete_wall_004', scale=1.6, tint=(0.46, 0.46, 0.45),
                 normal_strength=0.8, bump=0.0, level_obj=lvl, wet_band=0.012, wet_dark=0.6)
wall_tint = (0.16, 0.17, 0.165) if A['wall'] == 'dark' else (0.85, 0.85, 0.83)
m_wall = L.pbr('BackWall', 'painted_plaster_wall', scale=0.7, tint=wall_tint, normal_strength=0.6)
m_stand = L.pbr('StandTop', 'concrete_floor_worn_001', scale=0.9, tint=(0.55, 0.55, 0.54), normal_strength=0.7)
m_glass = L.glass_mat('TankGlass', shadow_trick=True)
m_sil = L.simple_mat('Silicone', (0.06, 0.07, 0.07), rough=0.35)

# ---------------------------------------------------------------- type, measured
lines = []
size = 0.07
for i, t in enumerate(reversed(L.SENTENCE)):          # i=0 is the bottom line
    lines.append(L.build_line(t, font, size, depth=0.014, bevel=0.0016, name=f'line{i}', mat=m_letters))
widest = max(L.bounds(o)[1] - L.bounds(o)[0] for o in lines)
k = 0.86 / widest                                       # widest line = 0.86 m
for o in lines:
    for v in o.data.vertices:
        v.co.x *= k; v.co.z *= k
em = size * k
desc = -min(L.bounds(o)[2] for o in lines)              # deepest descender below baseline
asc = max(L.bounds(o)[3] for o in lines)
P = asc + desc + 0.012                                  # riser height = one line
for i, o in enumerate(lines):
    face_y = PY0 + i * TREAD
    o.location = (0, face_y - 0.004, ZB + i * P + desc + 0.006)   # 4 mm stand-off from the riser

# stepped plinth: three overlapping cast blocks
for i in range(3):
    L.box(f'step{i}', PX0, PX1, PY0 + i * TREAD, PY1, 0.0, ZB + (i + 1) * P, m_plinth, bevel=0.004)

top = ZB + 3 * P
levels = dict(below=ZB - 0.035, touch=ZB + desc + 0.004, over=ZB + desc + 0.006 + asc * 0.42,
              high=ZB + 2 * P + desc + asc * 0.5, drown=top + 0.06)
level = levels.get(A['level'], None)
level = float(A['level']) if level is None else level
lvl.location.z = level

# ---------------------------------------------------------------- tank
L.box('glass_bottom', X0, X1, Y0, Y1, -T, 0.0, m_glass)
L.box('glass_front', X0 - T, X1 + T, Y0 - T, Y0, -T, H, m_glass, bevel=0.0012)
L.box('glass_back', X0 - T, X1 + T, Y1, Y1 + T, -T, H, m_glass, bevel=0.0012)
L.box('glass_left', X0 - T, X0, Y0, Y1, -T, H, m_glass, bevel=0.0012)
L.box('glass_right', X1, X1 + T, Y0, Y1, -T, H, m_glass, bevel=0.0012)
for (x, y) in ((X0, Y0), (X1, Y0), (X0, Y1), (X1, Y1)):     # silicone beads in the corners
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0035, depth=H, location=(x, y, H / 2), vertices=12)
    c = bpy.context.object
    c.data.materials.append(m_sil)
    bpy.ops.object.shade_smooth()

GAP = 0.0004
m_water = L.water_mat('Water', tint_lin=(0.14, 0.60, 0.34), density=A['density'], ripple=0.035, ripple_scale=5.0,
                      shadow_trick=(A['caustics'] != 'mnee'), scatter=A['scatter'],
                      caustic=1.0 if A['caustics'] == 'surface' else 0.0, caustic_scale=20.0)
if A['scatter'] > 0:
    sc.cycles.volume_bounces = 1
    sc.cycles.volume_step_rate = 4.0
water = L.water_box('water', X0 + GAP, X1 - GAP, Y0 + GAP, Y1 - GAP, 0.0 + GAP, level, m_water,
                    meniscus=0.0028, men_w=0.0022)

# room: stand top, back wall, floor-to-ceiling dark beyond
L.box('stand', -1.2, 1.2, -0.35, 0.85, -T - 0.06, -T, m_stand, bevel=0.003)
L.box('wall', -4, 4, 1.55, 1.65, -1.5, 3.0, m_wall)
# the room's left wall with a real window opening: daylight arrives through it, so the
# light on the back wall has the window's shape and the mullion's shadow
m_room = L.simple_mat('RoomWall', (0.20, 0.20, 0.19), rough=0.8)
WX = min(-1.4, A['winx'] + 0.7)
L.box('lw_low', WX - 0.1, WX, -3.0, 1.6, -1.5, 0.05, m_room)
L.box('lw_high', WX - 0.1, WX, -3.0, 1.6, 1.45, 3.0, m_room)
L.box('lw_front', WX - 0.1, WX, -3.0, -1.55, 0.05, 1.45, m_room)
L.box('lw_back', WX - 0.1, WX, 0.35, 1.6, 0.05, 1.45, m_room)
L.box('mullion', WX - 0.08, WX - 0.02, -0.62, -0.58, 0.05, 1.45, m_room)
L.box('transom', WX - 0.08, WX - 0.02, -1.55, 0.35, 0.93, 0.97, m_room)

# ---------------------------------------------------------------- light
# aquarium luminaire above the open top: cool, soft, the motivated key for everything in the water
if A['caustics'] == 'gobo':
    top_soft = L.area_light('TankLuminaire', (0, 0.23, H + 0.32), (0, 0.23, 0), 1.1, 0.30, A['top'] * 0.5, kelvin=6800)
    sp = L.spot_light('CausticSpot', (0.15, 0.10, H + 1.4), (0, 0.25, ZB), A['top'] * 1.6, size=0.02, angle=48, blend=0.4,
                      kelvin=6800)
    L.gobo_caustics(sp, scale=9.0, sharpness=2.5, w=0.3)
elif A['caustics'] == 'mnee':
    top_soft = L.area_light('TankLuminaire', (0, 0.23, H + 0.32), (0, 0.23, 0), 1.1, 0.30, A['top'], kelvin=6800)
    top_soft.data.cycles.is_caustics_light = True
    water.cycles.is_caustics_caster = True
    for o in bpy.data.objects:
        if o.name.startswith(('step', 'line', 'glass_bottom')):
            o.cycles.is_caustics_receiver = True
else:
    top_soft = L.area_light('TankLuminaire', (0, 0.23, H + 0.32), (0, 0.23, 0), 1.1, 0.30, A['top'], kelvin=6800)
if A['sun'] > 0:   # late-morning sun through a roof light, from behind-left: crisp shadows, caustics
    L.sun_light('SkylightSun', A['sunel'], A['sunaz'], A['sun'], angle_deg=1.2, kelvin=5200)
# window to camera left: warm daylight, the key on the letter faces and the gradient on the wall
# (sky panel outside the window opening; spread limited so it acts like a window, not a lamp)
L.area_light('Window', (A['winx'], -0.25, 0.85), (0.0, 0.25, 0.25), 1.2, 1.4, A['win'], kelvin=5600, spread=120)
# faint bounce from the room on the right so shadows are not black
L.area_light('Bounce', (2.4, -1.4, 0.4), (0, 0.3, 0.3), 2.0, 1.2, 8, kelvin=4300)
L.world_hdri(sc, 'photo_studio_loft_hall', strength=0.05, rot_z_deg=200)

# ---------------------------------------------------------------- camera
mid = ZB + 1.5 * P + desc
camz = A['camz'] if A['camz'] else top + 0.10
dist = 2.35
L.camera((A['camx'], -dist, camz), (0.0, 0.2, mid - 0.01), focal=A['focal'], fstop=A['fstop'],
         focus=dist + PY0 + TREAD)

if A['post']:
    L.post(sc, grain=0.07, vignette=0.22, dispersion=0.004, glare=0.12)

print('LEVEL', round(level, 4), 'TOP', round(top, 4), 'P', round(P, 4), 'EM', round(em, 4), 'CAMZ', round(camz, 4))
if A['save']:
    L.save_blend(A['save'])
L.render(sc, A['out'], A['label'], dict(staging='a_tank', level=A['level'], caustics=A['caustics'],
                                        letters=A['letters'], focal=A['focal'], fstop=A['fstop']))
