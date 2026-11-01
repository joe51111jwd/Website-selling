# The hero's hardcover: render/book.py --solo 1 renders the book alone, its shadow on a transparent
# table. This keeps the book and the shadow under it, fades the shadow out before the crop's edge,
# and writes the page's two sizes (WebP with alpha) and src/book.json.
#   python3 scripts/make_book_assets.py render/out/hero_book.png   (and public/og.jpg, from render/out/book.png)
import hashlib, io, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "render", "out", "hero_book.png")
im = Image.open(src).convert("RGBA")
a = np.asarray(im, dtype=np.float32)
alpha = a[..., 3] / 255.0
H, W = alpha.shape

# the book itself: nearly opaque pixels
solid = alpha > 0.9
ys, xs = np.nonzero(solid)
bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
bw, bh = bx1 - bx0, by1 - by0
# the shadow lies on the table round the book's foot: keep it inside a soft ellipse there
cx, cy = (bx0 + bx1) / 2, by1
yy, xx = np.mgrid[0:H, 0:W]
d = ((xx - cx) / (0.78 * bw)) ** 2 + ((yy - cy) / (0.2 * bh)) ** 2
keep = np.clip((1.0 - d) / 0.6, 0, 1)
keep = keep * keep * (3 - 2 * keep)
alpha = np.where(solid, alpha, alpha * keep)
alpha[: max(0, by0 - 2)] *= 0  # nothing above the book
out = a.copy()
out[..., 3] = np.clip(alpha * 255, 0, 255)

# crop: the book, and the shadow wherever it still shows
ys, xs = np.nonzero(out[..., 3] > 6)
pad = 8
x0, x1 = max(0, xs.min() - pad), min(W, xs.max() + pad)
y0, y1 = max(0, ys.min() - pad), min(H, ys.max() + pad)
img = Image.fromarray(out.astype(np.uint8), "RGBA").crop((x0, y0, x1, y1))

os.makedirs(os.path.join(ROOT, "public", "book"), exist_ok=True)
files = {}
for w in (480, 960):
    h = round(img.height * w / img.width)
    buf = io.BytesIO()
    img.resize((w, h), Image.LANCZOS).save(buf, "WEBP", quality=88, method=6, exact=True)
    data = buf.getvalue()
    name = f"hardcover-{w}-{hashlib.sha1(data).hexdigest()[:8]}.webp"
    for old in os.listdir(os.path.join(ROOT, "public", "book")):
        if old.startswith(f"hardcover-{w}-") and old != name:
            os.remove(os.path.join(ROOT, "public", "book", old))
    open(os.path.join(ROOT, "public", "book", name), "wb").write(data)
    files[str(w)] = name
meta = {"files": files, "w": img.width, "h": img.height, "book": [round((bx0 - x0) / img.width, 4), round((by0 - y0) / img.height, 4), round(bw / img.width, 4), round(bh / img.height, 4)]}
json.dump(meta, open(os.path.join(ROOT, "src", "book.json"), "w"), indent=1)
print(meta)

# the link preview (og.jpg, 1200x630): book.py's own still, the hardcover with the blocks beside it
# (render/out/book.png), its backdrop continued at the sides to the preview's shape
still = os.path.join(ROOT, "render", "out", "book.png")
if os.path.exists(still):
    full = Image.open(still).convert("RGB")
    band = full.crop((0, round(full.height / 6), full.width, round(full.height * 0.847)))
    w = round(band.height * 1200 / 630)
    pad = (w - band.width) // 2
    canvas = Image.new("RGB", (w, band.height))
    canvas.paste(band.crop((0, 0, 1, band.height)).resize((pad, band.height)), (0, 0))
    canvas.paste(band, (pad, 0))
    canvas.paste(band.crop((band.width - 1, 0, band.width, band.height)).resize((w - pad - band.width, band.height)), (pad + band.width, 0))
    canvas.resize((1200, 630), Image.LANCZOS).save(os.path.join(ROOT, "public", "og.jpg"), quality=86, optimize=True)
    print("og.jpg from", still)
