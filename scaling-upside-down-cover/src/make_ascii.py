# The cover's block stack as text, for direction 8 ("software as a book"): every character cell samples the real
# Blender render (out/render/blocks_front.png). Density comes from brightness, colour from the paint, so the
# cream stamps read as words carved out of the characters. Writes a JS file the cover loads.
#   python3 src/make_ascii.py out/render/blocks_front.png out/render/ascii.js --cols 92
import argparse
import json

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--cols", type=int, default=92)
ap.add_argument("--aspect", type=float, default=0.6 / 1.0)  # mono cell: 0.6 em wide, 1.0 em tall (line-height 1)
a = ap.parse_args()

im = Image.open(a.src).convert("RGBA")
arr = np.asarray(im).astype(np.float32) / 255
alpha = arr[..., 3]
# crop to the stack and its shadow, with a margin
ys, xs = np.where(alpha > 0.06)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int((x1 - x0) * 0.04)
x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
crop = arr[y0:y1, x0:x1]
cw = (x1 - x0) / a.cols
ch = cw / a.aspect
rows = int((y1 - y0) / ch)

RAMP = " .:-=+*o#%@"  # light to dense: on a chalk ground, dark paint gets the densest characters
lines = []
for r in range(rows):
    runs, cur, cur_col = [], "", None
    for c in range(a.cols):
        cell = crop[int(r * ch) : int((r + 1) * ch), int(c * cw) : int((c + 1) * cw)]
        al = cell[..., 3].mean()
        if al < 0.08:
            chr_, col = " ", None
        else:
            rgb = (cell[..., :3] * cell[..., 3:4]).sum((0, 1)) / max(cell[..., 3].sum(), 1e-6)
            lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
            if al > 0.9:   # paint: a floor of density so even the light ochre stays solid, shading on top
                dens = float(np.clip(0.42 + (0.72 - lum) * 0.85, 0.36, 1.0))
            else:          # the shadow: as dark as it is
                dens = (1 - lum) * min(1.0, al * 1.6)
            # the cream stamps become clean gaps, so UP / SIDE / DOWN read as words cut out of the paint
            sat = rgb.max() - rgb.min()
            if al > 0.9 and lum > 0.62 and sat < 0.22:
                dens = 0
            chr_ = RAMP[int(np.clip(dens, 0, 0.999) * len(RAMP))]
            if al < 0.9:  # the shadow on the table: graphite, not paint
                col = "#9b958c"
            else:
                # the book's own paints, exactly: the nearest of the three (or the ink of SIDE's stamp); the
                # characters carry the light and shade, the colour stays the system's
                pal = {"#1f4a2b": (0.20, 0.36, 0.24), "#c98a1c": (0.86, 0.62, 0.22), "#97201a": (0.62, 0.22, 0.18), "#1c1a17": (0.18, 0.16, 0.14)}
                col = min(pal, key=lambda k: sum((rgb[i] - pal[k][i]) ** 2 for i in range(3)))
        # merge into runs of one colour (quantised, so neighbouring cells share a span)
        q = col
        if q != cur_col and cur:
            runs.append([cur, cur_col])
            cur = ""
        cur += chr_
        cur_col = q
    runs.append([cur, cur_col])
    lines.append(runs)
open(a.out, "w").write("window.ASCII = " + json.dumps({"cols": a.cols, "rows": rows, "lines": lines}) + ";\n")
print(a.cols, "x", rows)
