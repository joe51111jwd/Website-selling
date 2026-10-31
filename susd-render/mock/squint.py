#!/usr/bin/env python3
"""The squint test, measured the way the art review measured it (02-AI-TELLS checklist 1).

    python3 mock/squint.py out/mock/desktop-hero.png [more screenshots ...]

Blurs the screenshot as a squint does (Gaussian, sigma 12 px at 1440 wide; scaled with the width), takes the 8-bit
grey of the blurred image, and compares the brightest blurred point inside the rendered sentence's box (from the
page's data-words, the still's anchors) with the brightest blurred point anywhere else (a button, a caption, a
reflection). Pass: the sentence is brighter. Round 3 failed it: the blurred `Get it free` button 175, the sentence 147.
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
pages = json.load(open(os.path.join(ROOT, 'out', 'mock', 'shots.json')))
for shot in sys.argv[1:]:
    im = Image.open(shot).convert('RGB')
    w, h = im.size
    css_w = w / 2 if os.path.basename(shot).startswith('phone') else w        # phone shots are @2x
    G = np.asarray(im.filter(ImageFilter.GaussianBlur(12 * w / css_w * css_w / 1440 if css_w >= 1000 else 12 * w / css_w * 390 / 1440 * 2)).convert('L')).astype(float)
    t = open(os.path.join(ROOT, 'mock', pages[os.path.basename(shot)])).read()
    m = re.search(('data-pwords' if h > w else 'data-words') + r'="([^"]+)"', t) or re.search(r'data-words="([^"]+)"', t)
    x0, y0, x1, y1 = (float(v) for v in m.group(1).split(','))
    X0, Y0, X1, Y1 = int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)
    s_max = G[Y0:Y1, X0:X1].max()
    mask = np.ones_like(G, bool); mask[max(0, Y0 - 12):Y1 + 12, max(0, X0 - 12):X1 + 12] = False
    e = np.where(mask, G, 0); iy, ix = np.unravel_index(np.argmax(e), e.shape)
    print(f'{os.path.basename(shot):26s} sentence {s_max:5.0f}   brightest elsewhere {e.max():5.0f} at ({ix * 1440 / w if css_w >= 1000 else ix / 2:.0f}, '
          f'{iy * (900 / h) if css_w >= 1000 else iy / 2:.0f}) css px   {"PASS" if s_max > e.max() else "FAIL"}')
