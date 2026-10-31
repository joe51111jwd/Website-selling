"""Quick proof sheet for the custom face: all glyphs plus the book's lines."""
import sys
from PIL import Image, ImageDraw, ImageFont
font_path, out = sys.argv[1], sys.argv[2]
W = 1800
img = Image.new("RGB", (W, 1500), (236, 237, 233))
d = ImageDraw.Draw(img)
y = 30
for text, size in [("ABCDEFGHIJKLM", 150), ("NOPQRSTUVWXYZ", 150), ("0123456789", 150),
                   (".,:;-–—‘’“”!?/=+<>()[]⦵", 150),
                   ("EVERY HIRE COMPOUNDS", 128), ("COMPLEXITY BEFORE IT", 128), ("COMPOUNDS CAPACITY.", 128),
                   ("SCALING UP-SIDE-DOWN", 128),
                   ("PAST TWELVE, SOMETHING BREAKS.  HOW MANY PEOPLE ARE ON YOUR TEAM?", 40),
                   ("COMPLEXITY > CAPACITY = REDLINE.   8 = 28   12 = 66   13 = 78   15 = 105", 40)]:
    f = ImageFont.truetype(font_path, size)
    d.text((40, y), text, font=f, fill=(18, 18, 18))
    y += int(size * 1.08)
img.crop((0, 0, W, y + 20)).save(out)
print(out)
