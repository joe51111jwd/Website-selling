#!/usr/bin/env python3
"""Pack the baked chainmail passes into the hero shader's tile.

    blender/out/fx/chainmail_{normal,ao,coverage}.png  ->  site/public/fx/chainmail-tile.webp

R,G = shading normal x,y (n*0.5+0.5, world = tile frame), B = ambient occlusion, A = wire coverage.
Rows are flipped so the first row is the tile's y-min: WebGL then puts v=0 at y=0 without UNPACK_FLIP_Y.
Lossless WebP: the channels are data, so no lossy codec (and no premultiplication) may touch them.

    python3 chainmail/tools/pack_chainmail_tile.py [--width 768] [--src fx]
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
args = sys.argv[1:]
width = int(args[args.index("--width") + 1]) if "--width" in args else 768
src = args[args.index("--src") + 1] if "--src" in args else "fx"
SRC = os.path.join(ROOT, "blender", "out", src)
DST = os.path.join(ROOT, "site", "public", "fx", "chainmail-tile.webp")


def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, f"chainmail_{name}.png"))).astype(np.float64)
    return a / (65535.0 if a.max() > 255 else 255.0)


n = load("normal")[..., :3]
ao = load("ao")[..., 0]
cov = load("coverage")[..., 0]
# coverage-weighted normal at wire edges: the floor normal (0,0,1) mixed in by the pixel filter would
# flatten the rim; the shader already blends wire and floor by coverage
nv = n * 2.0 - 1.0
rgba = np.dstack([nv[..., 0] * 0.5 + 0.5, nv[..., 1] * 0.5 + 0.5, ao, cov])
rgba = np.flipud(rgba)
im = Image.fromarray(np.clip(np.round(rgba * 255.0), 0, 255).astype(np.uint8), "RGBA")
h = round(im.height * width / im.width)
if width != im.width:
    im = im.resize((width, h), Image.LANCZOS)
os.makedirs(os.path.dirname(DST), exist_ok=True)
im.save(DST, "WEBP", lossless=True, quality=100, method=6, exact=True)
print(f"wrote {DST}  {im.width}x{im.height}  {os.path.getsize(DST) / 1024:.0f} KB")
