"""Images for the desk at the end of the page (the copy "stamp").

  python3 scripts/make_flatlay_assets.py render/tex                  # prints, grain masks, fallback faces
  python3 scripts/make_flatlay_assets.py render/tex render/out/flatlay  # + the flat-lay render layers

The prints are ink impressions of the cover blocks' faces: the paint is printed, the letters are
knocked out to paper, and the edges break up a little, like a rubber stamp. The render layers
(blocks, their shadows, the props) come from render/flatlay.py and all share one camera, so every
layer is a full frame and they line up to the pixel.
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = PUB / "flatlay"
INK = {"up": "#2b5a37", "side": "#b98320", "down": "#b2322a"}


def rgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def periodic_noise(n, scale, seed):
    """Tileable noise in 0..1: random phases in the frequency domain, low-passed around `scale` px."""
    rng = np.random.default_rng(seed)
    f = np.fft.fftfreq(n)
    fx, fy = np.meshgrid(f, f)
    r = np.sqrt(fx**2 + fy**2)
    amp = np.exp(-((r * scale) ** 2))
    amp[0, 0] = 0
    spec = amp * np.exp(2j * np.pi * rng.random((n, n)))
    a = np.real(np.fft.ifft2(spec))
    return (a - a.min()) / (a.max() - a.min())


def fbm(n, seed, octaves=(48, 16, 6, 2)):
    acc, w = np.zeros((n, n)), 0.0
    for i, s in enumerate(octaves):
        k = 0.5**i
        acc += k * periodic_noise(n, s, seed + i)
        w += k
    acc /= w
    return (acc - acc.min()) / (acc.max() - acc.min())


def otsu(lum):
    hist, _ = np.histogram(lum, bins=256, range=(0, 256))
    p = hist / hist.sum()
    omega, mu = np.cumsum(p), np.cumsum(p * np.arange(256))
    between = (mu[-1] * omega - mu) ** 2 / np.maximum(omega * (1 - omega), 1e-12)
    return int(np.argmax(between))


def make_print(key, tex, size=384, seed=0):
    face = Image.open(tex / f"face_{key}.png").convert("RGB").resize((size, size), Image.LANCZOS)
    a = np.asarray(face, dtype=np.float32)
    lum = a @ np.array([0.299, 0.587, 0.114])
    t = otsu(lum)
    dark = lum < t
    # the paint is whichever side of the threshold covers more of the face (SIDE has dark letters on yellow)
    paint = dark if dark.mean() > 0.5 else ~dark
    alpha = paint * (0.80 + 0.20 * fbm(size, seed, (14, 5, 2)))
    alpha[periodic_noise(size, 1.2, seed + 9) > 0.93] = 0  # speckle dropout
    # broken edge: the stamp bites unevenly within 3% of the border
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.minimum.reduce([xx, yy, size - 1 - xx, size - 1 - yy]).astype(np.float32)
    edge = size * 0.03
    bite = edge * (0.25 + 0.75 * periodic_noise(size, 10, seed + 17)) + 1.5 * (periodic_noise(size, 1.5, seed + 23) - 0.5)
    alpha[d < bite] = 0
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    im = Image.new("RGBA", (size, size), rgb(INK[key]) + (0,))
    im.putalpha(al)
    im.save(OUT / f"print_{key}.webp", quality=80, method=6)


def make_masks():
    n = 256
    grain = periodic_noise(n, 1.5, 41)
    holes = periodic_noise(n, 2.2, 43) > 0.86
    a = np.clip(0.92 + 0.16 * (grain - 0.5), 0, 1)
    a[holes] = 0.25
    im = Image.new("RGBA", (n, n), (255, 255, 255, 0))
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    im.save(ROOT / "src" / "assets" / "ink-grain.webp", quality=90, method=6)

    n = 160
    g = periodic_noise(n, 1.1, 51)
    im = Image.new("RGBA", (n, n), (23, 20, 15, 0))
    im.putalpha(Image.fromarray((g * 10).astype(np.uint8)))
    im.save(ROOT / "src" / "assets" / "table-grain.webp", quality=90, method=6)


def make_fallback_faces(tex):
    for key in INK:
        Image.open(tex / f"face_{key}.png").convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"face_{key}.webp", quality=84, method=6)


def feather(im, frac, gain=1.0):
    """fade a layer's alpha to nothing at its edges, so a shadow never ends in a visible rectangle"""
    a = np.asarray(im, dtype=np.float32).copy()
    h, w = a.shape[:2]
    def ramp(n):
        x = np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * frac)
        x = np.clip(x, 0, 1)
        return x * x * (3 - 2 * x)
    a[..., 3] *= np.outer(ramp(h), ramp(w)) * gain
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def make_render_layers(src):
    """The flat-lay render (render/flatlay.py) → web sizes."""
    def save(im, name, w, q):
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}.webp", quality=q, method=6)

    for key in INK:
        blk = Image.open(src / f"blk_{key}.png").convert("RGBA")
        for w in (1280, 820):
            save(blk, f"blk_{key}_{w}", w, 86)
            soft = blk.filter(ImageFilter.GaussianBlur(blk.width * 0.011))
            save(soft, f"blk_{key}_blur_{w}", w, 72)
        for kind in ("rest", "lift"):
            # three of these overlap on the page, so each is a little lighter than the render
            save(feather(Image.open(src / f"shd_{key}_{kind}.png").convert("RGBA"), 0.18, 0.82), f"shd_{key}_{kind}", 800, 70)
    for prop in ("leads", "hire12"):
        im = Image.open(src / f"prop_{prop}.png").convert("RGBA").resize((800, 800), Image.LANCZOS)
        save(feather(im.filter(ImageFilter.GaussianBlur(14)), 0.16), f"prop_{prop}", 420, 72)
    meta = json.loads((src / "flatlay.json").read_text())
    (ROOT / "src" / "flatlay.json").write_text(json.dumps(meta, indent=2) + "\n")


if __name__ == "__main__":
    tex = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for i, key in enumerate(INK):
        make_print(key, tex, seed=11 + i * 7)
    make_masks()
    make_fallback_faces(tex)
    if len(sys.argv) > 2:
        make_render_layers(Path(sys.argv[2]))
    print("ok", sorted(p.name for p in OUT.iterdir()))
