# Measure where the blocks sit in a transparent render (their solid pixels, not the shadow), so the cover can
# align type to them. Writes <render>.js with window.BLOCKS = {w, h, x0, y0, x1, y1}.
#   python3 src/measure_render.py out/render/blocks_front.png
import json
import sys

from PIL import Image

p = sys.argv[1]
im = Image.open(p)
a = im.getchannel("A")
# the stack is opaque; its shadow on the catcher is at most about 60% alpha
solid = a.point(lambda v: 255 if v > 245 else 0)
x0, y0, x1, y1 = solid.getbbox()
info = {"w": im.width, "h": im.height, "x0": x0, "y0": y0, "x1": x1, "y1": y1}
open(p.rsplit(".", 1)[0] + ".js", "w").write("window.BLOCKS = " + json.dumps(info) + ";\n")
print(info)
