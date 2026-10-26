"""Page layers for the closed loop (render/closed.py) and the proof (film frames).

  python3 scripts/make_closed_assets.py render/out/closed render/out/clseq render/out/seq

Writes public/closed/ (Quality's block and shadows, the panorama, the footer seal, the proof
pictures; every name carries a content hash, so they cache forever), the sequence's last two
frames (cut from the panorama, so the hand-off is seamless), and src/closed.json. Then pack the
sequence:
  python3 scripts/pack_frames.py render/out/clseq public/closed/hi --width 1600 --quality 78 --per 25
  python3 scripts/pack_frames.py render/out/clseq public/closed/lo --width 480 --quality 60 --per 50
"""
import hashlib
import json
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "closed"
closed, seq, film = (Path(a) for a in sys.argv[1:4])
OUT.mkdir(parents=True, exist_ok=True)
for f in OUT.glob("*.webp"):
    f.unlink()


def save(im, stem, **kw):
    b = BytesIO()
    im.save(b, "WEBP", **kw)
    data = b.getvalue()
    name = f"{stem}-{hashlib.sha1(data).hexdigest()[:8]}.webp"
    (OUT / name).write_bytes(data)
    return name


geo = json.loads((closed / "closed_geo.json").read_text())
FW, FH = geo["frame"]

# 1. the panorama's middle is frame 50; it ends the sequence, so scrubbing hands over without a seam
pano = Image.open(closed / "pano.png").convert("RGB")
px = pano.width / (2.05 * FW)  # panorama pixels per frame-50 pixel (1 at full size)
mid = pano.crop((round(0.95 * FW * px), round(0.25 * FH * px), round(1.95 * FW * px), round(1.25 * FH * px))).resize((FW, FH), Image.LANCZOS)
for n in (49, 50):
    mid.save(seq / f"c{n:04d}.png")

# one paper colour for the seams: the floor where the film ends and where this begins
f340 = np.asarray(Image.open(film / "f0340.png").convert("RGB"), dtype=np.float32)
pa = np.asarray(pano, dtype=np.float32)
w = f340.shape[1]
samples = [f340[-8:, round(0.2 * w) : round(0.8 * w)].reshape(-1, 3), pa[:6].reshape(-1, 3), pa[-6:].reshape(-1, 3)]
seam = np.concatenate(samples).mean(axis=0)
geo["seam"] = "#%02x%02x%02x" % tuple(int(round(v)) for v in seam)

# the panorama's ends darken towards the edge of the light; fade them into the paper so the slide to the
# book never shows where the picture stops (frame 50, cut above, is untouched)
smooth = lambda t: (lambda c: c * c * c * (c * (6 * c - 15) + 10))(np.clip(t, 0, 1))  # noqa: E731
H, W = pa.shape[:2]
xs, ys = np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32)
left = smooth(xs / (0.5 * FW * px))  # stops short of the book
right = smooth((W - 1 - xs) / (0.06 * FW * px))
top = smooth(ys / (0.2 * FH * px))
bottom = smooth((H - 1 - ys) / (0.2 * FH * px))
keep = np.outer(top * bottom, left * right)[..., None]
pano = Image.fromarray(np.round(pa * keep + seam * (1 - keep)).astype(np.uint8), "RGB")
files = {"pano": save(pano, "pano", quality=80, method=6)}

# 2. Quality: the block and its two shadows, each cropped to what it covers
layers = {}
for name in ("q_block", "q_shd_rest", "q_shd_lift"):
    im = Image.open(closed / f"{name}.png").convert("RGBA")
    if im.size != (FW, FH):
        im = im.resize((FW, FH), Image.LANCZOS)
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > (2 if name == "q_block" else 10))  # shadows fade out over the whole floor
    l, t, r, b = max(0, xs.min() - 8), max(0, ys.min() - 8), min(FW, xs.max() + 9), min(FH, ys.max() + 9)
    crop = im.crop((l, t, r, b))
    if name != "q_block":
        # feather the edges so a shadow never ends in a visible rectangle
        arr = np.asarray(crop, dtype=np.float32).copy()
        h, w = arr.shape[:2]
        ramp = lambda n: np.clip(np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * 0.12), 0, 1)  # noqa: E731
        arr[..., 3] *= np.outer(ramp(h), ramp(w))
        crop = Image.fromarray(arr.astype(np.uint8), "RGBA")
    files[name] = save(crop, name, lossless=True, quality=90, method=6)
    layers[name] = [round(l / FW, 5), round(t / FH, 5), round((r - l) / FW, 5), round((b - t) / FH, 5)]

# 3. the footer's seal: the closed ring (Quality in place, the hairline drawn), feathered round
ring = mid.convert("RGBA")
for name in ("q_shd_rest", "q_block"):
    im = Image.open(closed / f"{name}.png").convert("RGBA").resize((FW, FH), Image.LANCZOS)
    ring = Image.alpha_composite(ring, im)
cx, cy = geo["ringC"][0] * FW, geo["ringC"][1] * FH
rx, ry = geo["hair"]["rx"] * FW, geo["hair"]["ry"] * FH
d = ImageDraw.Draw(ring)
d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=(23, 20, 15, 255), width=2)
half = round(ry + 20)
seal = ring.crop((round(cx - half), round(cy - half), round(cx + half), round(cy + half)))
yy, xx = np.mgrid[0 : seal.height, 0 : seal.width]
rr = np.hypot(xx - seal.width / 2, yy - seal.height / 2) / (seal.width / 2)
mask = np.clip((1 - rr) / 0.06, 0, 1)
alpha = (np.asarray(seal)[..., 3] * mask).astype(np.uint8)
seal.putalpha(Image.fromarray(alpha))
files["seal"] = save(seal.resize((480, 480), Image.LANCZOS), "seal", quality=86, method=6)

# 4. the proof: the film's crooked needle (40 people) and the finished building (12), same camera
for key, n in (("needle", 105), ("building", 340)):
    im = Image.open(film / f"f{n:04d}.png").convert("RGB")
    files[f"proof_{key}_d"] = save(im, f"proof_{key}_d", quality=78, method=6)
    crop = im.crop((round(0.33 * im.width), 0, round(0.80 * im.width), im.height)).resize((600, 800), Image.LANCZOS)
    files[f"proof_{key}_m"] = save(crop, f"proof_{key}_m", quality=78, method=6)

geo["layers"] = layers
geo["files"] = files
geo["sequence"] = 50
(ROOT / "src" / "closed.json").write_text(json.dumps(geo, indent=1) + "\n")
print("seam", geo["seam"], "files", len(files))
