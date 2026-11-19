# Paint the three cover blocks' textures: the paint over wood grain, and the stamped word on the front face.
#   python3 make_faces.py <wood_diffuse.jpg> <out_dir> <fonts_dir>
# Writes face_{up,side,down}.png (the front, with the stamp) and paint_{up,side,down}.png (the other sides).
# The paints are the site's (render/scene_setup.py), so the cover and the website are the same objects.
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

wood_path, out, fonts = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)

PAINT = {"up": "#1f4a2b", "side": "#e09a24", "down": "#97201a"}
STAMP = "#f1e6cf"  # the site's stamp cream (styles.css .cb-face)
INK_ON_SIDE = "#1c1a17"  # the mockup prints SIDE in black on the ochre: kept, it reads better than cream on yellow
WORD = {"up": "UP", "side": "SIDE", "down": "DOWN"}
# block front faces, width:height (blender units in blocks.py: the same numbers)
SIZE = {"up": (1.30, 1.0), "side": (1.36, 1.0), "down": (1.42, 1.0)}
PX = 1100  # pixels per unit

wood = Image.open(wood_path).convert("L")


def grain(w, h, seed):
    g = wood.rotate(90 * (seed % 2), expand=True)
    g = ImageOps.fit(g, (w, h), centering=((seed * 0.37) % 1, (seed * 0.61) % 1))
    g = ImageOps.autocontrast(g, cutoff=2)
    return g


def paint(key, w, h, seed):
    base = Image.new("RGB", (w, h), PAINT[key])
    g = grain(w, h, seed)
    # the grain shows faintly through the paint: a multiply between 0.82 and 1.06
    lo, hi = (0.88, 1.04) if key == "side" else (0.82, 1.06)
    lut = [int(255 * min(1.0, (lo + (hi - lo) * i / 255) / hi)) for i in range(256)]
    m = g.point(lut).convert("RGB")
    p = ImageChops.multiply(base, m)
    p = ImageEnhance.Brightness(p).enhance(hi)
    # worn edges: the paint is a touch lighter where hands have rubbed it
    edge = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(edge)
    bw = int(min(w, h) * 0.035)
    d.rectangle([0, 0, w - 1, h - 1], outline=255, width=bw)
    edge = edge.filter(ImageFilter.GaussianBlur(bw * 0.8))
    light = ImageEnhance.Brightness(p).enhance(1.12)
    return Image.composite(light, p, edge)


def common_size(h):
    fp = os.path.join(fonts, "PlayfairDisplay-Black.ttf")
    w = int(SIZE["down"][0] * PX)
    size = int(h * 0.58)
    while True:
        l, t, r, b = ImageFont.truetype(fp, size).getbbox("DOWN")
        if (b - t) <= h * 0.50 and (r - l) <= w * 0.86:
            return size
        size -= 2


def stamp(img, key):
    w, h = img.size
    word = WORD[key]
    font_path = os.path.join(fonts, "PlayfairDisplay-Black.ttf")
    # one type size for all three (the size at which DOWN fills 86% of its face): one voice, like a set of stamps
    f = ImageFont.truetype(font_path, common_size(h))
    l, t, r, b = f.getbbox(word)
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    x = (w - (r - l)) / 2 - l
    y = (h - (b - t)) / 2 - t
    d.text((x, y), word, font=f, fill=255)
    # a stamp, not a print: the ink skips a little where the grain is raised
    g = grain(w, h, 7).filter(ImageFilter.GaussianBlur(1.2))
    skip = g.point(lambda v: 255 if v > 40 else int(v * 6))
    mask = ImageChops.multiply(mask, skip).filter(ImageFilter.GaussianBlur(0.9))
    ink = Image.new("RGB", (w, h), INK_ON_SIDE if key == "side" else STAMP)
    return Image.composite(ink, img, mask)


for i, key in enumerate(["up", "side", "down"]):
    fw, fh = SIZE[key]
    w, h = int(fw * PX), int(fh * PX)
    face = stamp(paint(key, w, h, i + 1), key)
    face.save(os.path.join(out, f"face_{key}.png"))
    paint(key, 1400, 1400, i + 11).save(os.path.join(out, f"paint_{key}.png"))
    print(key, face.size)
