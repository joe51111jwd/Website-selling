#!/usr/bin/env python3
"""Paint a standard enamel water-level staff gauge (the black "E" pattern) as a texture.

  python3 tools/make_staff_gauge.py assets/generated/staff_gauge.png [metres]

2 px per mm, 100 mm wide. Every 10 cm block has an E (1 cm bars every 2 cm) on alternate
sides, decimetre numerals beside it, metre numerals in red. Enamel white is slightly warm,
with faint chips and rust bleed so it does not look printed.
"""
import os, sys, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out = sys.argv[1]
metres = int(sys.argv[2]) if len(sys.argv) > 2 else 3
PX = 2                        # px per mm
W, H = 100 * PX, metres * 1000 * PX
font_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'fonts', 'LibreFranklin-ExtraBold.ttf')
f_dm = ImageFont.truetype(font_path, 34 * PX)
f_m = ImageFont.truetype(font_path, 40 * PX)

img = Image.new('RGB', (W, H), (232, 229, 218))
d = ImageDraw.Draw(img)
black, red = (22, 22, 22), (172, 28, 24)
for dm in range(metres * 10):
    top = H - (dm + 1) * 100 * PX          # block top (y grows downward)
    left = (dm % 2 == 0)
    x0, x1 = (0, 50 * PX) if left else (50 * PX, 100 * PX)
    col = red if (dm + 1) % 10 == 0 else black
    # E: spine on the outer edge of its half, three bars
    spine = (x0, top + 50 * PX, x0 + 10 * PX, top + 100 * PX) if left else (x1 - 10 * PX, top + 50 * PX, x1, top + 100 * PX)
    d.rectangle(spine, fill=col)
    for b in (50, 70, 90):
        d.rectangle((x0, top + b * PX, x1, top + (b + 10) * PX - 1), fill=col)
    # numeral in the other half, centred on the block
    label = str((dm + 1) // 10) if (dm + 1) % 10 == 0 else str((dm + 1) % 10)
    fnt = f_m if (dm + 1) % 10 == 0 else f_dm
    nx0 = 50 * PX if left else 0
    bb = d.textbbox((0, 0), label, font=fnt)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text((nx0 + (50 * PX - tw) / 2 - bb[0], top + 50 * PX - th / 2 - bb[1]), label, font=fnt, fill=col)

# wear: enamel chips (dark, with rust halo) and a faint grime gradient toward the bottom
rnd = random.Random(4)
wear = Image.new('L', (W, H), 0)
wd = ImageDraw.Draw(wear)
for _ in range(metres * 22):
    x, y = rnd.uniform(0, W), rnd.uniform(0, H)
    r = rnd.uniform(0.6, 3.0) * PX
    wd.ellipse((x - r, y - r * rnd.uniform(0.5, 1.2), x + r, y + r), fill=255)
halo = wear.filter(ImageFilter.GaussianBlur(5 * PX))
rust = Image.new('RGB', (W, H), (120, 62, 30))
img = Image.composite(rust, img, halo.point(lambda v: int(v * 0.45)))
img = Image.composite(Image.new('RGB', (W, H), (38, 30, 24)), img, wear)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
img.save(out)
print('wrote', out, img.size)
