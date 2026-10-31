"""Render one candidate face in a lookdev staging without touching lookdev/renders.jsonl
(that log belongs to the lookdev pass).

  blender -b -P tools/type/type3d.py -- --stage c --font /abs/font.otf --out docs/type/specimens/3d/x.png --level touch ...
--stage b = lookdev/stage_b_room.py (flooded room), c = lookdev/stage_c_lock.py (lock wall, default).
Type options handled here (the recommended 3D settings, docs/03-TYPE.md section 5.4):
  --kern 1          apply the font's pair kerning (Blender applies none by itself; tools/type/blender_kern.py)
  --track 0.03      extra tracking, as a fraction of each advance (cu.space_character = 1 + track)
  --capspitch 1.32  re-space the three lines to this multiple of the cap height (caps have no
                    descenders, so the staging's 1.08 x (ascent + descent) packs them too tight)
All other arguments are passed straight to the staging script.
"""
import os, sys, time, runpy
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOOKDEV = os.path.join(ROOT, 'lookdev')
sys.path.insert(0, LOOKDEV)
import bpy
import lib_lookdev as L

stage = 'c'
if '--stage' in sys.argv:
    i = sys.argv.index('--stage')
    stage = sys.argv[i + 1]
    del sys.argv[i:i + 2]
SCRIPT = {'b': 'stage_b_room.py', 'c': 'stage_c_lock.py'}[stage]
OPT = dict(kern=0.0, track=0.0, capspitch=0.0)
for k in list(OPT):
    if '--' + k in sys.argv:
        i = sys.argv.index('--' + k)
        OPT[k] = float(sys.argv[i + 1])
        del sys.argv[i:i + 2]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_kern
from mathutils import Vector


def build_line(text, font, size, depth, bevel, name='line', align='CENTER', tracking=0.0, mat=None):
    """lib_lookdev.build_line with kerning and tracking applied before the curve is meshed."""
    cu = bpy.data.curves.new(name, type='FONT')
    cu.body = text
    cu.font = font
    cu.size = size
    cu.align_x = align
    cu.space_character = 1.0 + tracking + OPT['track']
    if OPT['kern']:
        print('KERN_PAIRS', name, blender_kern.apply(cu, bpy.path.abspath(font.filepath)))
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
    for v in me.vertices:
        x, y, z = v.co
        v.co = Vector((x, -z + depth / 2, y))
    me.update()
    L._sharp_by_angle(me, 32)
    return L.obj_from_mesh(name, me, mat)


if OPT['kern'] or OPT['track']:
    L.build_line = build_line


def respace():
    lines = [bpy.data.objects.get(f'line{i}') for i in range(3)]
    if not OPT['capspitch'] or not all(lines):
        return
    cap = max(L.bounds(o)[3] for o in lines)
    base = lines[2].location.z
    pitch = cap * OPT['capspitch']
    for i, o in enumerate(lines):
        o.location.z = base + (2 - i) * pitch
    print('CAPS_PITCH', round(pitch, 3), 'CAP', round(cap, 3))


def render(sc, out_png, label, extra=None):
    respace()
    os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)
    sc.render.filepath = os.path.abspath(out_png)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER_SECONDS', round(time.time() - t0, 1), out_png)


L.render = render
os.chdir(ROOT)
runpy.run_path(os.path.join(LOOKDEV, SCRIPT), run_name='__main__')
