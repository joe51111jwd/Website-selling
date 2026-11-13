# The stamps for the hero's planks (hero_words.py): each the shape of its plank's front face, the
# words in its alpha. Run from render/: python3 make_hero_labels.py
#   SCALING: the cover's word, set like the cover (a heavy condensed sans, reading upward)
#   the rest in the same face, so the planks read as one title page
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")
FONTS = os.path.join(HERE, "fonts")
PX = 1100  # texture pixels per metre of face

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def fit_line(d, text, face, max_w, max_h, track=0.0):
    """the largest size at which text (with tracking, a share of the size) fits max_w × max_h (cap height)"""
    size = int(max_h * 1.6)
    while size > 8:
        f = font(face, size)
        w = sum(d.textlength(ch, font=f) for ch in text) + track * size * (len(text) - 1)
        bbox = f.getbbox("H")
        cap = bbox[3] - bbox[1]
        if w <= max_w and cap <= max_h:
            return f, w, cap
        size -= 2
    raise SystemExit(f"cannot fit {text!r}")

def draw_line(d, text, f, x, y_cap_top, track):
    """draw text letter by letter (for tracking), its cap height starting at y_cap_top"""
    off = f.getbbox("H")[1]
    size = f.size
    for ch in text:
        d.text((x, y_cap_top - off), ch, font=f, fill=(255, 255, 255, 255))
        x += d.textlength(ch, font=f) + track * size

def stamp(name, w_m, h_m, lines, face, cap_share, track=0.0, gap_share=0.5, pad_share=0.1):
    """lines of text centred on a face w_m × h_m metres; cap_share: each line's cap height as a share of the face height"""
    W, H = round(w_m * PX), round(h_m * PX)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    n = len(lines)
    cap_h = H * cap_share
    max_w = W * (1 - 2 * pad_share)
    fitted = [fit_line(d, t, face, max_w, cap_h, track) for t in lines]
    cap = min(c for _, _, c in fitted)
    fitted = [fit_line(d, t, face, max_w, cap, track) for t in lines]
    gap = cap * gap_share
    total = n * cap + (n - 1) * gap
    y = (H - total) / 2
    for t, (f, w, c) in zip(lines, fitted):
        draw_line(d, t, f, (W - w) / 2, y, track)
        y += cap + gap
    im.save(os.path.join(TEX, name))
    return im

# SCALING: drawn across a canvas the face's height long, then turned to read upward (as on the cover).
# The word fills the plank's upper two thirds: its foot stands behind the two lines in front of it
sc = stamp("_scaling_flat.png", 2.0, 0.66, ["SCALING"], "anton.ttf", 0.64, track=0.02, pad_share=0.04)
full = Image.new("RGBA", (round(3.0 * PX), sc.height), (0, 0, 0, 0))
full.paste(sc, (full.width - sc.width - round(0.08 * PX), 0))
full.rotate(90, expand=True).save(os.path.join(TEX, "hero_scaling.png"))
os.remove(os.path.join(TEX, "_scaling_flat.png"))

# the rest in the cover's face too, so the words read as one title page at a phone's size
stamp("hero_book.png", 2.3, 0.28, ["A BOOK BY MICHAEL WENTZ"], "anton.ttf", 0.58, track=0.05, pad_share=0.05)
stamp("hero_founders.png", 2.5, 0.28, ["FOR BOOTSTRAPPED FOUNDERS"], "anton.ttf", 0.58, track=0.05, pad_share=0.05)
stamp("hero_join.png", 2.35, 0.27, ["JOIN THE FIRST-EDITION LIST"], "anton.ttf", 0.56, track=0.05, pad_share=0.06)
print("hero labels written to", TEX)
