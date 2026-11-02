#!/usr/bin/env python3
"""Pack the three screenshots as the deliverables: JPEG quality 85, each under 450 KB.
    python3 ideas/01-redline/mock/export.py
"""
import os
from PIL import Image
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'visuals')
for n in ('1-first-screen-desktop', '2-key-beat-desktop', '3-first-screen-phone'):
    im = Image.open(os.path.join(D, '_png', n + '.png')).convert('RGB')
    out = os.path.join(D, n + '.jpg')
    im.save(out, 'JPEG', quality=85, optimize=True, progressive=True, subsampling='4:2:0')
    kb = os.path.getsize(out) / 1024
    print(f'{n}.jpg  {im.size[0]}x{im.size[1]}  {kb:.0f} KB  {"OK" if kb < 450 else "OVER 450 KB"}')
