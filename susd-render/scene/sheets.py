#!/usr/bin/env python3
"""Contact sheets in story order (stills and mock screenshots), downscaled so they open quickly.

    python3 scene/sheets.py
Writes out/stills/contact_sheet.png (desktop), out/stills/contact_sheet_phone.png, out/mock/contact_sheet.png and
out/mock/contact_sheet_phone.png. Labels are the file names.
"""
import os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
D = ['d01_hero_K1', 'd15_hire_n10', 'd02_twelve_K2', 'd03_touch_K3', 'd04_under_K5', 'd05_redline_K6', 'd06_turn_K7',
     'd07_side1_K8', 'd08_down1_K9', 'd09_up2_K10', 'd10_side2_K11', 'd11_up3_K13', 'd12_oxygen_K16', 'd13_finale_K16F',
     'd14_drain_K17']
P = ['p01_hero_K1', 'p03_twelve_K2', 'p04_touch_K3', 'p02_under_K5', 'p05_redline_K6', 'p06_turn_K7', 'p07_down1_K9',
     'p08_oxygen_K16', 'p09_finale_K16F']
MD = ['desktop-hero', 'desktop-b2-hire', 'desktop-b2-twelve', 'desktop-b3-touch', 'desktop-b4-under', 'desktop-b5-redline',
      'desktop-b6-turn', 'desktop-b6-side', 'desktop-b7-down', 'desktop-b7-offer', 'desktop-b8-cycle2', 'desktop-b8-repeat',
      'desktop-b9-oxygen', 'desktop-finale']
MP = ['phone-hero', 'phone-b2-twelve', 'phone-b3-touch', 'phone-b4-under', 'phone-b5-redline', 'phone-b6-turn',
      'phone-b7-offer', 'phone-b9-oxygen', 'phone-finale']


def sheet(paths, out, cols, w):
    ims = []
    for p in paths:
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            ims.append((os.path.basename(p), im.resize((w, round(im.height * w / im.width)))))
    if not ims:
        return
    h = max(i.height for _, i in ims)
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * w + (cols + 1) * 8, rows * (h + 22) + 8), (20, 22, 22))
    d = ImageDraw.Draw(S)
    for k, (name, im) in enumerate(ims):
        x = 8 + (k % cols) * (w + 8); y = 8 + (k // cols) * (h + 22)
        S.paste(im, (x, y + 18)); d.text((x, y + 2), name, fill=(220, 220, 210))
    S.save(out, optimize=True)
    print(os.path.relpath(out, ROOT), S.size, len(ims), 'images')


st = os.path.join(ROOT, 'out', 'stills'); mk = os.path.join(ROOT, 'out', 'mock')
sheet([os.path.join(st, n + '.png') for n in D], os.path.join(st, 'contact_sheet.png'), 3, 800)
sheet([os.path.join(st, n + '.png') for n in P], os.path.join(st, 'contact_sheet_phone.png'), 5, 300)
sheet([os.path.join(mk, n + '.png') for n in MD], os.path.join(mk, 'contact_sheet.png'), 3, 720)
sheet([os.path.join(mk, n + '.png') for n in MP], os.path.join(mk, 'contact_sheet_phone.png'), 5, 300)
