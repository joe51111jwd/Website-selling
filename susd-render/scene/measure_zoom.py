#!/usr/bin/env python3
"""Measure how much the compositor finish zooms the frame (lens Fit for the lateral colour, then a 1.2 % crop),
so scene/waterline.py can render a frame that much larger and its anchors stay exact (review round 1).

    python3 scene/measure_zoom.py          # two 480x300 renders (one Blender at a time), then a scale search

waterline.py already enlarges the frame by its ZOOM constant when the finish is on, so with the right constant
the finished frame and the --nopost frame line up (s = 1). Otherwise the true zoom is ZOOM x s.
"""
import os, re, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'out', 'test3')
os.makedirs(OUT, exist_ok=True)
common = ['--state', 'hero', '--w', '480', '--h', '300', '--samples', '16', '--depth', '8',
          '--grain', '0', '--vignette', '0', '--glare', '0']
for name, extra in (('zoom_post', []), ('zoom_nopost', ['--nopost', '1'])):
    f = os.path.join(OUT, name + '.png')
    subprocess.run(['python3', os.path.join(ROOT, 'tools', 'render_idle.py'), 'blender', '-b', '-P',
                    os.path.join(ROOT, 'scene', 'waterline.py'), '--', *common, *extra, '--out', f],
                   cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
a = np.asarray(Image.open(os.path.join(OUT, 'zoom_post.png')).convert('L'), np.float32)
b = Image.open(os.path.join(OUT, 'zoom_nopost.png')).convert('L')
w, h = b.size
best = None
for s in np.arange(0.97, 1.03, 0.0005):
    bw, bh = round(w * s), round(h * s)
    r = np.asarray(b.resize((bw, bh), Image.LANCZOS), np.float32)
    x0, y0 = (bw - w) // 2, (bh - h) // 2
    if s >= 1:
        r = r[y0:y0 + h, x0:x0 + w]
        aa = a
    else:
        aa = a[-y0:-y0 + bh, -x0:-x0 + bw]
    m = 40   # ignore the borders (the lateral colour fringes there)
    e = float(np.mean((aa[m:-m, m:-m] - r[m:-m, m:-m]) ** 2))
    if best is None or e < best[1]:
        best = (s, e)
src = open(os.path.join(ROOT, 'scene', 'waterline.py')).read()
Z = float(re.search(r'^ZOOM = ([0-9.]+)', src, re.M).group(1))
print(f'residual scale s = {best[0]:.4f} (mse {best[1]:.2f}); ZOOM in waterline.py = {Z}; true zoom = {Z * best[0]:.4f}')
