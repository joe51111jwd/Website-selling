# Still encoder: any image (or a video frame via ffmpeg upstream) -> AVIF + JPEG pair.
# usage: python -I img.py <in> <out_base> [--size WxH] [--crop x,y,w,h] [--gain g] [--q 55] [--jq 82]
#        [--noavif] [--nojpg] [--gray]
# Writes <out_base>.avif and <out_base>.jpg. Crop is applied before resize. Gain multiplies linear-ish RGB.
import sys, argparse
from PIL import Image, ImageOps
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--size'); ap.add_argument('--crop'); ap.add_argument('--gain', type=float, default=1.0)
ap.add_argument('--q', type=int, default=55); ap.add_argument('--jq', type=int, default=82)
ap.add_argument('--noavif', action='store_true'); ap.add_argument('--nojpg', action='store_true')
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
if a.crop:
    x, y, w, h = map(int, a.crop.split(','))
    im = im.crop((x, y, x + w, y + h))
if a.size:
    w, h = map(int, a.size.lower().split('x'))
    if im.size != (w, h):
        im = ImageOps.fit(im, (w, h), Image.LANCZOS)
if a.gain != 1.0:
    arr = np.asarray(im).astype(np.float32) / 255.0
    lin = arr ** 2.2 * a.gain
    im = Image.fromarray((np.clip(lin, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8))
if not a.noavif:
    im.save(a.out + '.avif', quality=a.q, speed=6)
if not a.nojpg:
    im.save(a.out + '.jpg', quality=a.jq, optimize=True, progressive=True)
print(a.out, im.size)
