"""v0.9 against v1.0 on the glyphs the v1.0 pass changed (docs/03-TYPE.md, section 3.4).
python3 -I tools/type/before_after.py <v0.9.otf> <v1.0.otf> <out.png>"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
old, new, out = sys.argv[1:4]
ROOT = pathlib.Path(__file__).resolve().parents[2]
META = ImageFont.truetype(str(ROOT / "docs/type/fonts/b612/B612-Regular.ttf"), 22)
SET = "2345 69 GJZR?"
SET2 = "‘’“”()  –  — ⦵"
W, size = 1900, 190
img = Image.new("RGB", (W, 1040), (236, 237, 233))
d = ImageDraw.Draw(img)
y = 24
for lab, fp in (("v0.9", old), ("v1.0", new)):
    f = ImageFont.truetype(fp, size)
    d.text((40, y), lab, font=META, fill=(90, 94, 96))
    d.text((150, y + size), SET, font=f, fill=(18, 18, 18), anchor="ls")
    d.text((150, y + size * 2.25), SET2, font=f, fill=(18, 18, 18), anchor="ls")
    y += int(size * 2.6)
img.save(out)
print(out)
