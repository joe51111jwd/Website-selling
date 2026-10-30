"""Construction diagram for Plimsoll: the three stroke kinds measured on real outlines."""
import sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONT = ROOT / "docs/type/custom/Plimsoll-Heavy.otf"
OUT = ROOT / "docs/type/custom/Plimsoll-construction.png"
META = ROOT / "docs/type/fonts/b612/B612-Regular.ttf"


class Flat(BasePen):
    def __init__(self, gs):
        super().__init__(gs); self.contours = []; self.cur = []
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        for i in range(1, 17):
            t = i / 16; m = 1 - t
            self.cur.append((m**3*p0[0]+3*m*m*t*a[0]+3*m*t*t*b[0]+t**3*c[0],
                             m**3*p0[1]+3*m*m*t*a[1]+3*m*t*t*b[1]+t**3*c[1]))
    def _closePath(self): self.contours.append(self.cur); self.cur = []


f = TTFont(FONT)
gs = f.getGlyphSet()
cmap = f.getBestCmap()
S = 0.42                      # px per font unit
W, H = 2000, 760
img = Image.new("RGB", (W, H), (234, 235, 231))
d = ImageDraw.Draw(img)
ink, up, side, down = (20, 20, 20), (43, 90, 55), (176, 120, 20), (170, 40, 30)
mf = ImageFont.truetype(str(META), 22)
sf = ImageFont.truetype(str(META), 18)
base = 560


def draw_glyph(ch, x0):
    gname = cmap[ord(ch)]
    pen = Flat(gs)
    gs[gname].draw(pen)
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    # even-odd fill via XOR of each contour
    for c in pen.contours:
        m2 = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m2).polygon([(x0 + x * S, base - y * S) for x, y in c], fill=255)
        mask = Image.fromarray(__import__("numpy").bitwise_xor(__import__("numpy").array(mask), __import__("numpy").array(m2)))
    img.paste(ink, (0, 0, W, H), mask)
    return gs[gname].width * S


def dim_h(x0, x1, y, label, col):
    d.line([(x0, y), (x1, y)], fill=col, width=3)
    for x in (x0, x1):
        d.line([(x, y - 12), (x, y + 12)], fill=col, width=3)
    d.text(((x0 + x1) / 2, y + 16), label, font=sf, fill=col, anchor="ma")


def dim_v(x, y0, y1, label, col, left=False):
    d.line([(x, y0), (x, y1)], fill=col, width=3)
    for y in (y0, y1):
        d.line([(x - 12, y), (x + 12, y)], fill=col, width=3)
    d.text((x + (-16 if left else 16), (y0 + y1) / 2), label, font=sf, fill=col, anchor="rm" if left else "lm")


x = 250
xs = {}
for ch in "EOAIS-":
    xs[ch] = x
    x += draw_glyph(ch, x) + 70
# E: web and flanges (E's lsb is 62 units, stem 82 units)
ex = xs["E"] + 62 * S
dim_h(ex, ex + 82 * S, base + 40, "web 82  (Up)", up)
dim_v(ex - 30, base, base - 160 * S, "flange 160  (Side)", side, left=True)
# O: sides thin, top thick
ox = xs["O"]
dim_v(ox + 300 * S, base - (700 + 12) * S, base - (700 + 12 - 160) * S, "160", side)
# A: brace
d.text((xs["A"] + 40, base + 40), "brace 122  (Down)", font=sf, fill=down)
d.text((xs["I"] - 10, base + 40), "an I-beam", font=sf, fill=ink)
d.text((xs["-"] - 10, base + 40), "the hyphen is one flange", font=sf, fill=side)
d.text((90, 40), "PLIMSOLL  the stress turned on its Side", font=mf, fill=ink)
d.text((90, 76), "Up strokes are the thinnest, Side strokes the heaviest, Down braces in between. "
       "Ordinary type is the other way round.", font=sf, fill=(90, 90, 90))
d.line([(60, base), (W - 60, base)], fill=(200, 140, 140), width=1)
d.line([(60, base - 700 * S), (W - 60, base - 700 * S)], fill=(140, 160, 200), width=1)
img.save(OUT)
print("wrote", OUT)
