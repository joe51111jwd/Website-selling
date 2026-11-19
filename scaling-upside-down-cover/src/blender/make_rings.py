# The end grain of a log slice for direction 7, "Tree rings": growth years (wide rings), steady years (even,
# medium rings) and lean years (tight, dark rings), in cycles from the pith out. Up, Side and Down are how real
# things grow. Writes the face texture, its bump map, and rings.json (where each band sits, as a fraction of the
# slice's radius) so the cover can point at real rings.
#   python3 make_rings.py <out_dir>
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
N = 4096
rng = np.random.default_rng(7)

# the life of the tree, pith outward: (phase, number of rings, ring width in arbitrary units)
CYCLE = [("up", 4, 1.55), ("side", 4, 0.95), ("down", 2, 0.42)]
LIFE = [("up", 3, 1.9)] + CYCLE * 4 + [("up", 2, 1.4)]
widths, phases = [], []
for ph, n, w in LIFE:
    for _ in range(n):
        widths.append(w * rng.uniform(0.88, 1.12))
        phases.append(ph)
edges = np.cumsum([0.0] + widths)
BARK = 0.055  # bark, as a fraction of the radius
scale = (1.0 - BARK) / edges[-1]
edges = edges * scale  # ring boundaries as fractions of the full radius

# polar coordinates with a slightly eccentric pith and wobbly, non-circular rings (real wood is never round)
y, x = np.mgrid[0:N, 0:N].astype(np.float32)
cx, cy = N * 0.515, N * 0.49
dx, dy = (x - cx) / (N / 2), (y - cy) / (N / 2)
r = np.sqrt(dx * dx + dy * dy)
th = np.arctan2(dy, dx)
wob = np.zeros_like(r)
for k, amp in [(2, 0.018), (3, 0.010), (5, 0.006), (9, 0.003)]:
    wob += amp * np.sin(k * th + rng.uniform(0, 6.28)) * np.clip(r * 1.4, 0, 1)
# and a 2D warp, so rings meander locally the way real growth does
def smooth_noise(n, cells):
    g = rng.normal(0, 1, (cells, cells)).astype(np.float32)
    return np.array(Image.fromarray(g).resize((n, n), Image.BICUBIC))
warp = smooth_noise(N, 9) * 0.010 + smooth_noise(N, 31) * 0.0035
rr = r * (1 + wob) + warp * np.clip(r * 2, 0, 1)

# position inside each ring: 0 at its start (earlywood), 1 at its end (latewood)
idx = np.clip(np.searchsorted(edges, rr) - 1, 0, len(widths) - 1)
start, end = edges[idx], edges[idx + 1]
t = np.clip((rr - start) / np.maximum(end - start, 1e-6), 0, 1)
lean = np.array([1.0 if p == "down" else 0.0 for p in phases], dtype=np.float32)[idx]

# colour: pale earlywood, a sharp darker latewood band at each ring's end; lean years are darker overall
early = np.array([233, 208, 168], np.float32)
late = np.array([176, 128, 78], np.float32)
leanc = np.array([150, 104, 62], np.float32)
# each ring's latewood is its own: some bold, some faint
lw = rng.uniform(0.55, 1.0, len(widths)).astype(np.float32)[idx]
band = (np.clip((t - 0.70) / 0.24, 0, 1) ** 1.5) * lw
col = early * (1 - band[..., None]) + late * band[..., None]
col = col * (1 - 0.35 * lean[..., None]) + leanc * 0.35 * lean[..., None]
# fine radial rays and saw-cut texture
ray = (np.sin(th * 900 + rr * 40) * 0.5 + 0.5) ** 30
saw = np.sin((x * 0.6 + y * 0.12) * 0.09) * 0.5 + 0.5
noise = rng.normal(0, 1, (N // 4, N // 4)).astype(np.float32)
noise = np.array(Image.fromarray(noise).resize((N, N), Image.BICUBIC))
shade = 1 + 0.035 * noise + 0.03 * saw - 0.05 * ray
col = col * shade[..., None]
# a drying check (crack) running out from the pith, as real slices have
crack_th = 0.65
dth = np.abs(np.angle(np.exp(1j * (th - crack_th))))
crack = (dth < (0.002 + 0.035 * np.clip(r - 0.05, 0, 1) ** 1.3)) & (r > 0.05) & (r < 0.66)
col[crack] *= 0.28

# bark
bark_in = 1 - BARK * (1 + 0.22 * smooth_noise(N, 90))   # uneven bark
bark = rr > bark_in
barkc = np.array([92, 66, 46], np.float32) * (0.75 + 0.5 * np.clip(noise[bark] * 0.5 + 0.5, 0, 1))[..., None]
col[bark] = barkc
edge = 1.0 + 0.005 * smooth_noise(N, 120)
alpha = (rr <= edge).astype(np.float32) * 255

img = np.dstack([np.clip(col, 0, 255), alpha]).astype(np.uint8)
Image.fromarray(img, "RGBA").save(os.path.join(out, "rings.png"))
# bump: latewood stands proud (it is harder), the crack sinks, bark is rough
h = 0.5 + 0.25 * band - 0.6 * crack + 0.1 * noise * bark - 0.05 * ray
Image.fromarray(np.clip(h * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)).save(os.path.join(out, "rings_bump.png"))

# the bands, for the cover's annotations: first ring of each phase run, as a fraction of the radius
bands, i = [], 0
for ph, n, w in LIFE:
    bands.append({"phase": ph, "r0": float(edges[i]), "r1": float(edges[i + n])})
    i += n
json.dump({"pith": [cx / N, cy / N], "bark": BARK, "bands": bands}, open(os.path.join(out, "rings.json"), "w"), indent=1)
print(len(widths), "rings")
