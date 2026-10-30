"""Render a type specimen PNG with the book's own words.

Usage:
  python3 -I tools/type/specimen.py <font file> <out.png> "<label>" "<meta line>" [--caps]

What a sheet shows, top to bottom:
  1. the thesis in sentence case, as an HTML headline would set it      [M 696]
  2. the thesis in capitals, as 3D letters would be built
  3. the title, "Scaling Up-Side-Down" (the hyphens are the argument)    [BL 795]
  4. "Past twelve, something breaks." and the Step 0 question            [M 3509] [BL 310]
  5. the pathway numerals the water level follows (8 = 28 ... 15 = 105)  [BL 5112-5130]
  6. the same question at 16 px, the size of a label
  7. WATER TEST: one word cut by a waterline; below it the letters are
     displaced, blurred and tinted the way refraction treats them. Hairlines and
     tight counters disappear here first, so it is a cheap proxy for "will this
     face still read as an object standing in water".
"""
import sys, math, pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1600, 2400
BG = (231, 233, 229)      # neutral cool paper for documentation, not a site colour
INK = (20, 21, 22)
DIM = (96, 100, 102)
WATER = (24, 52, 56)
HERE = pathlib.Path(__file__).resolve().parents[2]
META_FONT = HERE / "docs/type/fonts/b612/B612Mono-Regular.ttf"

THESIS = "Every hire compounds complexity before it compounds capacity."
TITLE = "Scaling Up-Side-Down"
LINE3 = "Past twelve, something breaks."
LINE4 = "How many people are on your team?"
NUMS = "8 = 28   12 = 66   13 = 78   15 = 105"


def font(path, size):
    return ImageFont.truetype(str(path), size)


def wrap(draw, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def fit_size(draw, path, text, width, max_lines, start, lo=20):
    s = start
    while s > lo:
        f = font(path, s)
        if len(wrap(draw, text, f, width)) <= max_lines:
            return f
        s -= 2
    return font(path, lo)


def block(draw, y, text, f, x=60, width=W - 120, lead=1.08, color=INK):
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * lead)
    for line in wrap(draw, text, f, width):
        draw.text((x, y), line, font=f, fill=color)
        y += lh
    return y


def water_test(path, word, w=W, h=330):
    """Word standing in water: top dry, bottom refracted."""
    panel = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(panel)
    size = 240
    f = font(path, size)
    while d.textlength(word, font=f) > w - 160 and size > 60:
        size -= 6
        f = font(path, size)
    bbox = d.textbbox((0, 0), word, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x0 = (w - tw) // 2 - bbox[0]
    y0 = (h - th) // 2 - bbox[1] - 10
    letters = Image.new("L", (w, h), 0)
    ImageDraw.Draw(letters).text((x0, y0), word, font=f, fill=255)
    wl = (h - th) // 2 + int(th * 0.52)            # waterline at ~half the cap height
    # dry part
    dry = Image.new("RGB", (w, h), BG)
    dry.paste(INK, (0, 0, w, h), letters)
    # wet part: refraction (row displacement + slight vertical squash), blur, tint
    src = letters.load()
    wet_mask = Image.new("L", (w, h), 0)
    dst = wet_mask.load()
    for y in range(wl, h):
        sy = wl + int((y - wl) * 1.08)              # apparent depth is shallower
        if sy >= h:
            continue
        dx = 7 * math.sin(y / 9.0) + 3 * math.sin(y / 3.1 + 1.7)
        for x in range(w):
            sx = int(x + dx)
            if 0 <= sx < w:
                dst[x, y] = src[sx, sy]
    wet_mask = wet_mask.filter(ImageFilter.GaussianBlur(1.6))
    wet = Image.new("RGB", (w, h), WATER)
    glyph_wet = tuple(int(0.55 * a + 0.45 * b) for a, b in zip((200, 214, 206), WATER))
    wet.paste(glyph_wet, (0, 0, w, h), wet_mask)
    out = dry.copy()
    out.paste(wet.crop((0, wl, w, h)), (0, wl))
    dd = ImageDraw.Draw(out)
    dd.line([(0, wl), (w, wl)], fill=(170, 190, 186), width=2)
    mf = font(META_FONT, 15)
    dd.text((60, 14), "WATER TEST  dry above, refracted below", font=mf, fill=DIM)
    return out


def main():
    fpath, out, label, meta = sys.argv[1:5]
    caps_only = "--caps" in sys.argv
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    mf = font(META_FONT, 17)
    d.text((60, 30), label.upper(), font=font(META_FONT, 22), fill=INK)
    d.text((60, 62), meta, font=mf, fill=DIM)
    d.line([(60, 96), (W - 60, 96)], fill=(190, 194, 190), width=1)
    y = 120
    if not caps_only:
        f = fit_size(d, fpath, THESIS, W - 120, 3, 112)
        y = block(d, y, THESIS, f) + 18
    f = fit_size(d, fpath, THESIS.upper(), W - 120, 3, 96 if not caps_only else 112)
    y = block(d, y, THESIS.upper(), f, lead=1.02) + 22
    t = TITLE if not caps_only else TITLE.upper()
    f = fit_size(d, fpath, t, W - 120, 1, 150)
    y = block(d, y, t, f) + 10
    f = font(fpath, 58)
    l3 = LINE3 if not caps_only else LINE3.upper()
    l4 = LINE4 if not caps_only else LINE4.upper()
    y = block(d, y, l3, f) + 4
    f = fit_size(d, fpath, l4, W - 120, 1, 58)
    y = block(d, y, l4, f) + 8
    f = font(fpath, 58)
    y = block(d, y, NUMS, f) + 10
    f = font(fpath, 16)
    d.text((60, y), "16 px:  " + l4 + "   " + NUMS, font=f, fill=INK)
    y += 34
    wt = water_test(fpath, "CAPACITY")
    canvas = Image.new("RGB", (W, y + 10 + wt.height), BG)
    canvas.paste(img.crop((0, 0, W, min(y + 10, H))), (0, 0))
    canvas.paste(wt, (0, y + 10))
    canvas.save(out, optimize=True)
    img = canvas
    print("wrote", out, img.size)


if __name__ == "__main__":
    main()
