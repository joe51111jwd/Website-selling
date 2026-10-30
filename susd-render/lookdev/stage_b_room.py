"""Staging (b): a flooded concrete room.

The sentence [M 696] is three lines of stand-off letters fixed to the back wall of a
board-formed concrete room, above a raised concrete ledge (the ground the words stand on).
The room is flooded; the camera stands above the water near the front, looking a few
degrees down at the wall, so the water in front mirrors the words. Daylight comes from a
roof slot along the back wall (sun or overcast sky), grazing the wall and the letters.

Run:
  blender -b -P lookdev/stage_b_room.py -- --w 720 --h 450 --samples 32 --level below --out lookdev/b/b_test.png
Options:
  --level    below | touch | over | high | drown | <metres above floor>
  --letters  dark | light | bronze
  --key      sun | sky        (sun through the roof slot, or overcast sky in the slot)
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import lib_lookdev as L

A = L.args(dict(w=720, h=450, samples=32, threshold=0.02, level='below', letters='dark', key='sun',
                post=True, out='lookdev/b/b_test.png', font='LibreFranklin-Black.ttf', focal=55.0,
                fstop=5.6, look='AgX - Medium High Contrast', exposure=0.0, guiding=False, save='',
                density=3.2, label='b', sun=9.0, sunel=71.0, sunaz=196.0, sky=1.0, camy=-7.6, camz=1.45,
                caustic=0.6, ripple=0.065, hdri=0.35, standoff=0.012, camx=0.3, lookz=0.0, streak=False, lead=1.10, rscale=0.9, wave=0.10, film=0.12, scatter=0.0))

sc = L.reset()
L.render_setup(sc, A['w'], A['h'], A['samples'], threshold=A['threshold'], look=A['look'],
               exposure=A['exposure'], guiding=A['guiding'], transmission=8, glossy=3)

# ---------------------------------------------------------------- room (metres)
RX = 3.6            # half width
RD = 9.0            # depth (towards the camera, -Y)
RH = 4.2            # ceiling height
SLOT = 1.25         # roof slot width along the back wall
LEDGE_D, LEDGE_H = 0.70, 0.40

lvl = L.level_empty(0.0)
font = L.load_font(A['font'])

m_wall = L.pbr('BoardConcrete', 'concrete_wall_004', scale=0.42, tint=(0.80, 0.85, 0.88),
               normal_strength=1.0, level_obj=lvl, wet_band=0.10, wet_dark=0.5)
m_side = L.pbr('SideConcrete', 'concrete_wall_008', scale=0.35, tint=(0.70, 0.73, 0.75),
               normal_strength=0.9, level_obj=lvl, wet_band=0.10, wet_dark=0.5)
m_floor = L.pbr('FloorConcrete', 'concrete_floor_worn_001', scale=0.4, tint=(0.40, 0.40, 0.38),
                normal_strength=0.8)
m_ledge = L.pbr('LedgeConcrete', 'concrete_wall_008', scale=0.5, tint=(0.62, 0.65, 0.67),
                normal_strength=0.8, level_obj=lvl, wet_band=0.05, wet_dark=0.55)
paint = dict(dark=(0.085, 0.095, 0.09), light=(0.86, 0.84, 0.79), bronze=(0.30, 0.22, 0.14))[A['letters']]
m_letters = L.paint_mat('LetterPaint', paint, rough=0.45, rough_var=0.22, coat=0.1, level_obj=lvl,
                        rough_scale=1.2)
if A['letters'] == 'bronze':
    b = m_letters.node_tree.nodes['Principled BSDF']
    b.inputs['Metallic'].default_value = 1.0

# walls, floor, ceiling with a slot over the back wall
L.box('backwall', -RX - 0.3, RX + 0.3, 0.0, 0.3, -0.3, RH + 0.3, m_wall)
if A['streak']:
    # a slit window in the left wall near the back corner: the sun comes through it
    WY0, WY1, WZ0, WZ1 = -1.05, -0.72, 0.35, 3.6
    L.box('leftwall_a', -RX - 0.3, -RX, -RD, WY0, -0.3, RH + 0.3, m_side)
    L.box('leftwall_b', -RX - 0.3, -RX, WY1, 0.0, -0.3, RH + 0.3, m_side)
    L.box('leftwall_lo', -RX - 0.3, -RX, WY0, WY1, -0.3, WZ0, m_side)
    L.box('leftwall_hi', -RX - 0.3, -RX, WY0, WY1, WZ1, RH + 0.3, m_side)
else:
    L.box('leftwall', -RX - 0.3, -RX, -RD, 0.0, -0.3, RH + 0.3, m_side)
L.box('rightwall', RX, RX + 0.3, -RD, 0.0, -0.3, RH + 0.3, m_side)
L.box('floor', -RX, RX, -RD, 0.0, -0.3, 0.0, m_floor)
L.box('ceiling', -RX - 0.3, RX + 0.3, -RD, -SLOT, RH, RH + 0.35, m_side)
L.box('frontwall', -RX - 0.3, RX + 0.3, -RD - 0.3, -RD, -0.3, RH + 0.3, m_side)
L.box('ledge', -RX, RX, -LEDGE_D, 0.0, 0.0, LEDGE_H, m_ledge, bevel=0.01)

# ---------------------------------------------------------------- type on the wall
size = 0.3
lines = [L.build_line(t, font, size, depth=0.03, bevel=0.004, name=f'line{i}', mat=m_letters)
         for i, t in enumerate(L.SENTENCE)]                     # i=0 top line
widest = max(L.bounds(o)[1] - L.bounds(o)[0] for o in lines)
k = 2.75 / widest
for o in lines:
    for v in o.data.vertices:
        v.co.x *= k; v.co.z *= k
desc = -min(L.bounds(o)[2] for o in lines)
asc = max(L.bounds(o)[3] for o in lines)
pitch = (asc + desc) * A['lead']
base0 = LEDGE_H + 0.45 + desc                                    # bottom line baseline
for i, o in enumerate(lines):
    o.location = (0, -A['standoff'], base0 + (2 - i) * pitch)   # stand-off from the wall
bottom_of_words = base0 - desc
top_of_words = base0 + 2 * pitch + asc
levels = dict(below=bottom_of_words - 0.30, touch=bottom_of_words + 0.01, over=base0 + asc * 0.45,
              high=base0 + pitch + asc * 0.5, drown=top_of_words + 0.15)
level = levels.get(A['level'])
level = float(A['level']) if level is None else level
lvl.location.z = level

m_water = L.water_mat('Water', tint_lin=(0.20, 0.52, 0.25), density=A['density'], ripple=A['ripple'],
                      ripple_scale=A['rscale'], caustic=A['caustic'], caustic_scale=2.2, wave_mix=A['wave'],
                      film=A['film'], scatter=A['scatter'], scatter_color=(0.30, 0.62, 0.36))
if A['scatter'] > 0:
    sc.cycles.volume_bounces = 1
    sc.cycles.volume_step_rate = 4.0
water = L.water_box('water', -RX + 0.001, RX - 0.001, -RD + 0.001, -0.001, 0.001, level, m_water,
                    meniscus=0.004, men_w=0.004, walls=('y1',))

# ---------------------------------------------------------------- light
if A['key'] == 'sun' or A['streak']:
    # sun high and in front of the wall, falling through the roof slot and grazing down it
    L.sun_light('Sun', A['sunel'], A['sunaz'], A['sun'], angle_deg=0.8, kelvin=5300)
# the slot itself as sky: soft top light (overcast key, or skylight fill under the sun)
sky_e = A['sky'] * (900 if A['key'] == 'sky' else 220)
slot = L.area_light('SlotSky', (0, -SLOT / 2, RH + 0.32), (0, -SLOT / 2, 0), RX * 2, SLOT, sky_e,
                    kelvin=7000, spread=150)
L.world_hdri(sc, 'kloofendal_overcast', strength=A['hdri'], rot_z_deg=40)

# ---------------------------------------------------------------- camera
look_z = A['lookz'] if A['lookz'] else bottom_of_words - 0.25     # fixed for every water level
L.camera((A['camx'], A['camy'], A['camz']), (0.0, 0.0, look_z), focal=A['focal'], fstop=A['fstop'],
         focus=abs(A['camy']))

if A['post']:
    L.post(sc, grain=0.07, vignette=0.22, dispersion=0.004, glare=0.12)

print('LEVEL', round(level, 3), 'WORDS', round(bottom_of_words, 3), round(top_of_words, 3), 'PITCH', round(pitch, 3))
if A['save']:
    L.save_blend(A['save'])
L.render(sc, A['out'], A['label'], dict(staging='b_room', level=A['level'], letters=A['letters'], key=A['key'],
                                        focal=A['focal'], fstop=A['fstop']))
