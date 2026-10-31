#!/usr/bin/env python3
"""Comparison sheets for docs/05: the sample ladder (100% crops) and the full-size stagings."""
import os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(ROOT)
F = ImageFont.truetype('assets/fonts/LibreFranklin-ExtraBold.ttf', 16)

def ladder():
    files = [('16 samples', 'lookdev/full/c_lock_1440_s16.png'), ('32 samples', 'lookdev/full/c_lock_1440_s32.png'),
             ('64 samples', 'lookdev/full/c_lock_1440_s64.png')]
    if not all(os.path.exists(f) for _, f in files):
        return
    boxes = [('letters', (560, 300, 960, 500)), ('water', (900, 600, 1300, 800)), ('concrete', (420, 40, 820, 240))]
    cw, ch = 400, 200
    s = Image.new('RGB', (len(files) * (cw + 8) + 8, len(boxes) * (ch + 8) + 30), (18, 18, 18))
    d = ImageDraw.Draw(s)
    for j, (lab, f) in enumerate(files):
        im = Image.open(f).convert('RGB')
        d.text((8 + j * (cw + 8), 6), lab, fill=(235, 235, 235), font=F)
        for i, (_, b) in enumerate(boxes):
            s.paste(im.crop(b), (8 + j * (cw + 8), 30 + i * (ch + 8)))
    s.save('lookdev/sheets/sample_ladder.png', optimize=True); print('sample_ladder.png', s.size)

def stagings():
    files = [('(a) tank', 'lookdev/full/a_tank_1440_s32.png'), ('(b) flooded room', 'lookdev/full/b_room_1440_s32.png'),
             ('(c) lock wall', 'lookdev/full/c_lock_1440_s32.png'), ('(c-window) drowned, through the gallery glass', 'lookdev/full/c_window_1440_s32.png')]
    files = [x for x in files if os.path.exists(x[1])]
    tw, th = 720, 450
    s = Image.new('RGB', (2 * (tw + 8) + 8, ((len(files) + 1) // 2) * (th + 30) + 8), (18, 18, 18))
    d = ImageDraw.Draw(s)
    for k, (lab, f) in enumerate(files):
        x = 8 + (k % 2) * (tw + 8); y = 8 + (k // 2) * (th + 30)
        d.text((x, y + 2), lab, fill=(235, 235, 235), font=F)
        s.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + 24))
    s.save('lookdev/sheets/stagings_full.png', optimize=True); print('stagings_full.png', s.size)

ladder(); stagings()
