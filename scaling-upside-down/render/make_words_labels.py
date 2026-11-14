# The stamps for the words film's planks (words_film.py), in the hero planks' face (Anton), each drawn to its
# plank's front face so the words are not stretched. Run from render/: python3 make_words_labels.py
#   the rush: ALWAYS over LAUNCHING / HIRING / ADDING (L1993), on 2 x 1 m planks
#   the cycle: SIDEWAYS FOR STABILIZATION, DOWN FOR PRUNING, UP FOR GROWTH (L3315-L3317), one line each
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")
FACE = os.path.join(HERE, "fonts", "anton.ttf")
PX = 600  # texture pixels per metre of face


def fitted(d, text, max_w, cap, track):
    size = int(cap * 1.7)
    while size > 8:
        f = ImageFont.truetype(FACE, size)
        w = sum(d.textlength(ch, font=f) for ch in text) + track * size * (len(text) - 1)
        b = f.getbbox("H")
        if w <= max_w and b[3] - b[1] <= cap:
            return f, w, b[3] - b[1]
        size -= 2
    raise SystemExit(text)


def stamp(name, w_m, h_m, lines, caps, track=0.04, gap=0.32, pad=0.07):
    """lines centred on the face; caps: each line's cap height as a share of the face height"""
    W, H = round(w_m * PX), round(h_m * PX)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rows = [fitted(d, t, W * (1 - 2 * pad), H * c, track) for t, c in zip(lines, caps)]
    total = sum(c for _, _, c in rows) + gap * H * caps[-1] * (len(rows) - 1)
    y = (H - total) / 2
    for t, (f, w, c) in zip(lines, rows):
        x = (W - w) / 2
        off = f.getbbox("H")[1]
        for ch in t:
            d.text((x, y - off), ch, font=f, fill=(255, 255, 255, 255))
            x += d.textlength(ch, font=f) + track * f.size
        y += c + gap * H * caps[-1]
    im.save(os.path.join(TEX, name))


for k, word in (("launching", "LAUNCHING"), ("hiring", "HIRING"), ("adding", "ADDING")):
    stamp(f"w_{k}.png", 2.0, 1.0, ["ALWAYS", word], [0.16, 0.42], gap=0.42, pad=0.08)
stamp("w_side.png", 4.9, 0.62, ["SIDEWAYS FOR STABILIZATION"], [0.5], pad=0.05)
stamp("w_down.png", 3.4, 0.62, ["DOWN FOR PRUNING"], [0.5], pad=0.06)
stamp("w_up.png", 2.9, 0.62, ["UP FOR GROWTH"], [0.5], pad=0.07)
print("words labels written to", TEX)
