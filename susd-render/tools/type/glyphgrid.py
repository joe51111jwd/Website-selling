"""Big glyph grid for close inspection: python3 -I glyphgrid.py font.otf out.png "ABC..." [size]"""
import sys
from PIL import Image, ImageDraw, ImageFont
fp, out, chars = sys.argv[1], sys.argv[2], sys.argv[3]
size = int(sys.argv[4]) if len(sys.argv) > 4 else 260
f = ImageFont.truetype(fp, size)
cols = 8
cw, ch = int(size * 1.05), int(size * 1.25)
rows = (len(chars) + cols - 1) // cols
img = Image.new("RGB", (cols * cw, rows * ch), (240, 240, 236))
d = ImageDraw.Draw(img)
asc = f.getmetrics()[0]
for i, c in enumerate(chars):
    x, y = (i % cols) * cw, (i // cols) * ch
    base = y + int(size * 1.0)
    d.line([(x, base), (x + cw, base)], fill=(200, 120, 120))
    cap = base - int(size * 0.7)
    d.line([(x, cap), (x + cw, cap)], fill=(120, 160, 200))
    d.text((x + 20, base), c, font=f, fill=(15, 15, 15), anchor="ls")
img.save(out)
