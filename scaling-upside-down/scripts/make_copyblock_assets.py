"""The closed loop's COPY button: a painted block from render/closed.py (--shot copyblock).

  python3 scripts/make_copyblock_assets.py render/out/copyblock render/fonts/playfair_black.ttf

Writes public/cb/ (the block in red and in green, its shadow at rest and lifted, each at two sizes,
and the stamp font: Playfair Display Black with lining figures, cut to the alphabet and digits;
every name carries a content hash, so they cache forever) and src/copyblock.json (where the face
and the layers sit, as fractions of the block's outline). The page stamps the words itself.
"""
import hashlib
import json
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "cb"
src, font_path = Path(sys.argv[1]), Path(sys.argv[2])
staged = {}  # nothing is written until every check has passed


def save(data, stem, ext):
    name = f"{stem}-{hashlib.sha1(data).hexdigest()[:8]}.{ext}"
    staged[name] = data
    return name


def webp(im, stem, **kw):
    b = BytesIO()
    im.save(b, "WEBP", method=6, **kw)
    return save(b.getvalue(), stem, "webp")


geo = json.loads((src / "cb_geo.json").read_text())
BW, BH = geo["frame"]
k = geo["shdScale"]
red = Image.open(src / "cb_red.png").convert("RGBA")
green = Image.open(src / "cb_green.png").convert("RGBA")
assert red.size == (BW, BH) and green.size == (BW, BH)

# 1. the outline (paint alpha > 128) and the top face (the projected top, inset by the bevel)
a = np.asarray(red)[..., 3]
ys, xs = np.nonzero(a > 128)
sl, st, sr, sb = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
sw, sh = sr - sl, sb - st
top = np.array(geo["top"]) * [BW, BH]
px_per_unit = (top[:, 0].max() - top[:, 0].min()) / geo["size"][0]
bev = geo["bevel"] * px_per_unit
fl, ft, fr, fb = top[:, 0].min() + bev, top[:, 1].min() + bev, top[:, 0].max() - bev, top[:, 1].max() - bev
box = lambda l, t, r, b: [round((l - sl) / sw, 5), round((t - st) / sh, 5), round((r - l) / sw, 5), round((b - t) / sh, 5)]  # noqa: E731
face = box(fl, ft, fr, fb)
faceH = fb - ft

# 2. the shadows, brought up to the paint's pixel density (the field is k x as wide at half the density)
ox, oy = (k - 1) / 2 * BW, (k - 1) / 2 * BH


def shadow(name):
    im = Image.open(src / name).convert("RGBA")
    return np.asarray(im.resize((round(k * BW), round(k * BH)), Image.LANCZOS), dtype=np.float32).copy()


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


# the floor's shadow spreads far (and north, into the words above); keep what reads as this block's own
H2, W2 = round(k * BH), round(k * BW)
yy, xx = np.mgrid[0:H2, 0:W2].astype(np.float32)
L, T, R, B = sl + ox, st + oy, sr + ox, sb + oy
fy = np.where(yy < T, 1 - smoothstep((T - yy) / (0.25 * faceH)), np.where(yy > B, 1 - smoothstep((yy - B) / (0.30 * faceH)), 1))
fx = np.where(xx < L, 1 - smoothstep((L - xx) / (0.6 * faceH)), np.where(xx > R, 1 - smoothstep((xx - R) / (0.6 * faceH)), 1))
mask = fx * fy

shd = {}
cent = {}
for key in ("rest", "lift"):
    arr = shadow(f"cb_shd_{key}.png")
    arr[..., 3] *= mask
    al = arr[..., 3]
    ys2, xs2 = np.nonzero(al > 3)
    l2, t2, r2, b2 = max(0, xs2.min() - 8), max(0, ys2.min() - 8), min(W2, xs2.max() + 9), min(H2, ys2.max() + 9)
    crop = arr[t2:b2, l2:r2].copy()
    h, w = crop.shape[:2]
    ramp = lambda n: np.clip(np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * 0.12), 0, 1)  # noqa: E731
    crop[..., 3] *= np.outer(ramp(h), ramp(w))
    wsum = al.sum()
    cent[key] = ((al * xx).sum() / wsum, (al * yy).sum() / wsum)
    shd[key] = (Image.fromarray(np.round(crop).astype(np.uint8), "RGBA"), box(l2 - ox, t2 - oy, r2 - ox, b2 - oy))
drift = [round((cent["lift"][0] - cent["rest"][0]) / sw, 5), round((cent["lift"][1] - cent["rest"][1]) / sh, 5)]
# both shadows share one crop box, so the page can crossfade them in one place
lb = shd["lift"][1]
rb = shd["rest"][1]
union = [min(lb[0], rb[0]), min(lb[1], rb[1])]
union += [max(lb[0] + lb[2], rb[0] + rb[2]) - union[0], max(lb[1] + lb[3], rb[1] + rb[3]) - union[1]]


def to_union(im, b):
    full_w, full_h = round(union[2] * sw), round(union[3] * sh)
    canvas = Image.new("RGBA", (full_w, full_h), (0, 0, 0, 0))
    canvas.paste(im, (round((b[0] - union[0]) * sw), round((b[1] - union[1]) * sh)))
    return canvas


shd_imgs = {key: to_union(*shd[key]) for key in shd}

# 3. the paint, cropped to what it covers
pa = np.asarray(red)[..., 3]
ys3, xs3 = np.nonzero(pa > 2)
pl, pt, pr, pb = max(0, xs3.min() - 8), max(0, ys3.min() - 8), min(BW, xs3.max() + 9), min(BH, ys3.max() + 9)
block = box(pl, pt, pr, pb)

files = {}
for name, im in (("red", red), ("green", green)):
    crop = im.crop((pl, pt, pr, pb))
    for suffix, target in (("", 1100), ("_m", 640)):
        s = target / sw
        files[name + suffix] = webp(crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS), f"cb_{name}{suffix}", quality=88, alpha_quality=90)
for key, im in shd_imgs.items():
    s = 550 / sw
    files[key] = webp(im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS), f"cb_shd_{key}", quality=80, alpha_quality=80)


# 4. gates: the stamp must read on both paints, and the red must be Quality's own red
def face_mean(im):
    arr = np.asarray(im.convert("RGB"), dtype=np.float32)
    w, h = fr - fl, fb - ft
    return arr[round(ft + 0.1 * h) : round(fb - 0.1 * h), round(fl + 0.1 * w) : round(fr - 0.1 * w)].reshape(-1, 3).mean(0)


def lum(c):
    c = np.asarray(c) / 255
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


ink = np.array([241, 230, 207])
contrast = {}
means = {}
for name, im in (("red", red), ("green", green)):
    m = face_mean(im)
    means[name] = m
    seen = 0.94 * ink + 0.06 * m
    hi, lo = sorted((lum(seen), lum(m)), reverse=True)
    contrast[name] = round((hi + 0.05) / (lo + 0.05), 2)
closed = json.loads((ROOT / "src" / "closed.json").read_text())
q = np.asarray(Image.open(ROOT / "public" / "closed" / closed["files"]["q_block"]).convert("RGBA"), dtype=np.float32)
h, w = q.shape[:2]
qc = q[round(0.3 * h) : round(0.7 * h), round(0.3 * w) : round(0.7 * w)].reshape(-1, 4)
qc = qc[(qc[:, 3] > 250) & (qc[:, 0] - qc[:, 1] > 60)][:, :3]  # Quality's paint, not its letters
q_mean = qc.mean(0)
print("face red", means["red"].round(), "Quality", q_mean.round(), "green", means["green"].round(), "contrast", contrast)
ok = min(contrast.values()) >= 3.0 and np.abs(means["red"] - q_mean).max() <= 12
if not ok:
    sys.exit("gate failed: the stamp would not read, or the red is not Quality's")

# 5. the stamp font: Playfair Display Black, lining figures by default, only what the block says
from fontTools import subset  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402

f = TTFont(font_path, recalcTimestamp=False)  # the source's own date, so the same font hashes the same
names = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
for table in f["cmap"].tables:
    if table.isUnicode():
        for i, n in enumerate(names):
            if 0x30 + i in table.cmap and f"{n}.lf" in f.getGlyphOrder():
                table.cmap[0x30 + i] = f"{n}.lf"
upm = f["head"].unitsPerEm
slot = round(f["hmtx"]["zero.lf"][0] / upm, 4)
comma = round(f["hmtx"]["comma"][0] / upm, 4)
for rec in f["name"].names:
    if rec.nameID in (1, 4, 16):
        rec.string = "SUSD Stamp"
    elif rec.nameID == 6:
        rec.string = "SUSDStamp-Black"
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["kern"]
opts.name_IDs = [0, 1, 4, 6, 13, 14, 16]
sub = subset.Subsetter(opts)
sub.populate(text="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.·…:'’!?-@ ")  # every word a block may say
sub.subset(f)
b = BytesIO()
f.flavor = "woff2"
f.save(b)
files["font"] = save(b.getvalue(), "stamp", "woff2")

out = {
    "bodyAR": round(sh / sw, 5),
    "faceAR": round(faceH / sw, 5),
    "face": face,
    "block": block,
    "shd": [round(v, 5) for v in union],
    "drift": drift,
    "slot": slot,
    "comma": comma,
    "contrast": contrast,
    "files": files,
}
OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*"):
    old.unlink()
for name, data in staged.items():
    (OUT / name).write_bytes(data)
(ROOT / "src" / "copyblock.json").write_text(json.dumps(out, indent=1) + "\n")
print(json.dumps({k: v for k, v in out.items() if k != "files"}), "files", len(files))
