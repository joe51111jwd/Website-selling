# Draw a word in the book's own letterforms (lettering.py) as an SVG, each word of UP-SIDE-DOWN in its paint.
#   python3 src/make_word.py "UP-SIDE-DOWN" out.svg --height 150 [--weight 0.19] [--style ink|paint] [--ink #1c1a17]
# style "paint": UP green, SIDE ochre, DOWN red, the hyphens in ink. Writes the SVG at its natural width.
import argparse

from lettering import T, layout, svg_paths

ap = argparse.ArgumentParser()
ap.add_argument("text")
ap.add_argument("out")
ap.add_argument("--height", type=float, default=150)
ap.add_argument("--weight", type=float, default=T)
ap.add_argument("--tracking", type=float, default=0.16)
ap.add_argument("--style", default="paint")
ap.add_argument("--ink", default="#1c1a17")
ap.add_argument("--paints", default="#1f4a2b,#e09a24,#97201a")
a = ap.parse_args()

up, side, down = a.paints.split(",")
H = a.height
pad = a.weight * H
strokes, width = layout(a.text, H, a.tracking)
W = width + 2 * pad
Ht = H + 2 * pad
# which word each letter belongs to (for UP-SIDE-DOWN): count hyphens
# a leading word before a space (SCALING in "SCALING UP-SIDE-DOWN") stays in ink
lead = a.text.index(" ") if " " in a.text else -1
word, colour_of = 0, {}
for i, ch in enumerate(a.text):
    if ch == "-" or i <= lead:
        colour_of[i] = a.ink
        word += 1 if ch == "-" else 0
    else:
        colour_of[i] = [up, side, down][min(word, 2)] if a.style == "paint" else a.ink
body = ""
for i, ch, d in svg_paths(strokes, Ht, 1.0, pad, pad):
    body += f'<path d="{d}" fill="none" stroke="{colour_of[i]}" stroke-width="{a.weight * H:.2f}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="1.6"/>'
open(a.out, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.1f}" height="{Ht:.1f}" viewBox="0 0 {W:.1f} {Ht:.1f}">{body}</svg>')
print(f"{W:.0f} x {Ht:.0f}")
