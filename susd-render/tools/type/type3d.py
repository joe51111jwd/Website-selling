"""Render one candidate face in the lookdev flooded-room staging (lookdev/stage_b_room.py)
without touching lookdev/renders.jsonl (that log belongs to the lookdev pass).

  blender -b -P tools/type/type3d.py -- --font /abs/font.otf --out docs/type/specimens/3d/x.png --level over ...
All arguments are passed straight to stage_b_room.py.
"""
import os, sys, time, runpy
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOOKDEV = os.path.join(ROOT, 'lookdev')
sys.path.insert(0, LOOKDEV)
import bpy
import lib_lookdev as L


def render(sc, out_png, label, extra=None):
    os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)
    sc.render.filepath = os.path.abspath(out_png)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER_SECONDS', round(time.time() - t0, 1), out_png)


L.render = render
os.chdir(ROOT)
runpy.run_path(os.path.join(LOOKDEV, 'stage_b_room.py'), run_name='__main__')
