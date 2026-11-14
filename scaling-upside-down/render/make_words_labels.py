# The stamps for the words film's blocks (words_film.py), in the hero planks' face (Anton), each drawn to its
# block's front face so the words are not stretched. Run from render/: python3 make_words_labels.py
#   the rush: ALWAYS over LAUNCHING / HIRING / ADDING (L1993), on raw-wood planks 2 m x 1 m
#   the cycle: SIDEWAYS FOR / STABILIZATION, DOWN FOR / PRUNING, UP FOR / GROWTH (L3316, L3317, L3315), on slabs
#   2.4 m x 1 m painted in the cover's colours, every line the same size (the longest sets it)
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")
FACE = os.path.join(HERE, "fonts", "anton.ttf")
PX = 600  # texture pixels per metre of face
TRACK = 0.04  # letter spacing, a share of the font size


def font_for_cap(cap_px):
    """the Anton size whose capital H is cap_px tall"""
    size = int(cap_px * 1.6)
    while size > 8:
        f = ImageFont.truetype(FACE, size)
        b = f.getbbox("H")
        if b[3] - b[1] <= cap_px:
            return f
        size -= 1
    raise SystemExit(cap_px)


def line_w(d, f, text):
    return sum(d.textlength(ch, font=f) for ch in text) + TRACK * f.size * (len(text) - 1)


def max_cap(text, max_w_px, cap_px):
    """the largest cap (up to cap_px) at which text fits max_w_px"""
    d = ImageDraw.Draw(Image.new("L", (8, 8)))
    while cap_px > 8:
        if line_w(d, font_for_cap(cap_px), text) <= max_w_px:
            return cap_px
        cap_px -= 1
    raise SystemExit(text)


def stamp(name, w_m, h_m, lines, caps_m, gap_m):
    """lines centred on a w_m x h_m face, each with its cap height (m), gap_m between them"""
    W, H = round(w_m * PX), round(h_m * PX)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    caps = [round(c * PX) for c in caps_m]
    total = sum(caps) + round(gap_m * PX) * (len(lines) - 1)
    y = (H - total) / 2
    for text, cap in zip(lines, caps):
        f = font_for_cap(cap)
        x = (W - line_w(d, f, text)) / 2
        off = f.getbbox("H")[1]
        for ch in text:
            d.text((x, y - off), ch, font=f, fill=(255, 255, 255, 255))
            x += d.textlength(ch, font=f) + TRACK * f.size
        y += cap + gap_m * PX
    im.save(os.path.join(TEX, name))
    return caps


# the rush planks: ALWAYS small over the word
for k, word in (("launching", "LAUNCHING"), ("hiring", "HIRING"), ("adding", "ADDING")):
    cap = min(0.42, max_cap(word, 2.0 * PX * 0.84, round(0.42 * PX)) / PX)
    stamp(f"w_{k}.png", 2.0, 1.0, ["ALWAYS", word], [0.16, cap], 0.17)

# the cycle's slabs
SLABS = {"side": ["SIDEWAYS FOR", "STABILIZATION"], "down": ["DOWN FOR", "PRUNING"], "up": ["UP FOR", "GROWTH"]}
SW, SH = 2.4, 1.0
cap = min(max_cap(t, SW * PX * 0.86, round(0.34 * PX)) for ls in SLABS.values() for t in ls) / PX
for k, ls in SLABS.items():
    stamp(f"w_{k}.png", SW, SH, ls, [cap, cap], cap * 0.36)
print("words labels written to", TEX, "- the slabs' cap", round(cap, 3), "m")
