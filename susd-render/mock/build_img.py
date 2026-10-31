#!/usr/bin/env python3
"""Copy the rendered stills into the mock as JPEGs (the site will pack WebP/AVIF tiers; brief 7.8).

    python3 mock/build_img.py            # every out/stills/*.png -> mock/img/*.jpg (quality 88, 4:4:4)
"""
import os, glob
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.makedirs(os.path.join(ROOT, 'mock', 'img'), exist_ok=True)
for p in sorted(glob.glob(os.path.join(ROOT, 'out', 'stills', '[dp][0-9][0-9]_*.png'))):
    out = os.path.join(ROOT, 'mock', 'img', os.path.splitext(os.path.basename(p))[0] + '.jpg')
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(p):
        continue
    # the masters are 16-bit PNG (review round 1); Pillow reads them as 8-bit RGB, enough for a JPEG preview
    Image.open(p).convert('RGB').save(out, quality=88, subsampling=0, optimize=True)
    print(os.path.relpath(out, ROOT), os.path.getsize(out) // 1024, 'KB')
