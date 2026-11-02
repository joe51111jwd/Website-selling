#!/usr/bin/env python3
"""The squint test (02-AI-TELLS checklist 1), as mock/squint.py measures it: blur the screenshot like a squint
(Gaussian sigma 12 CSS px at 1440 wide, scaled for the phone), then compare the brightest blurred point inside
Michael's line with the brightest blurred point anywhere else. Pass: his line is brighter.

    python3 ideas/01-redline/mock/squint.py      (reads visuals/_png/*.png and boxes.json from shoot.cjs)
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'visuals', '_png')
boxes = json.load(open(os.path.join(D, 'boxes.json')))
for name, b in boxes.items():
    im = Image.open(os.path.join(D, name)).convert('RGB')
    w, h = im.size
    k = w / b['css'][0]                                   # device pixels per CSS px
    sigma = 12 * k * (b['css'][0] / 1440 if b['css'][0] < 1000 else 1)
    G = np.asarray(im.filter(ImageFilter.GaussianBlur(sigma)).convert('L')).astype(float)
    x0, y0, x1, y1 = (int(v * k) for v in b['words'])
    s = G[y0:y1, x0:x1].max()
    pad = int(12 * k)
    m = np.ones_like(G, bool); m[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = False
    e = np.where(m, G, 0); iy, ix = np.unravel_index(np.argmax(e), e.shape)
    print(f'{name:28s} line {s:5.0f}   brightest elsewhere {e.max():5.0f} at ({ix / k:.0f}, {iy / k:.0f}) css px   '
          f'{"PASS" if s > e.max() else "FAIL"}')
