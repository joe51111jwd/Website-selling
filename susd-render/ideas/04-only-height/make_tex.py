#!/usr/bin/env python3
"""Printed and drawn surfaces for idea 4 (Only Height), drawn here so nothing is generated.

  python3 ideas/04-only-height/make_tex.py

tex/rule.png         a 300 mm steel rule's engraving (white = engraved), 10 px per mm, 3000 x 250
tex/plot_pencil.png  the plot card's pencil work (white = graphite), 5 px per mm, 2100 x 1200:
                     the site boundary set out in dashes, two grid lines and a few dimension ticks,
                     the way a model maker marks a plot before gluing anything down
"""
import os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'tex')
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(ROOT, 'docs', 'type', 'system', 'B612-Regular.ttf')


def rule():
    k = 10                                   # px per mm
    W, H = 300 * k, 25 * k
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, int(3.2 * k))
    for mm in range(0, 301):
        x = mm * k + k // 2 if mm < 300 else W - 3
        L = 6 if mm % 10 == 0 else (4 if mm % 5 == 0 else 2.5)
        d.line([(x, 0), (x, int(L * k))], fill=255, width=2)
        if mm % 10 == 0 and 0 < mm < 300:
            s = str(mm // 10)
            tw = d.textlength(s, font=f)
            d.text((x - tw / 2, 6.6 * k), s, font=f, fill=255)
    # the half-mm scale on the far edge, as on an engineer's rule
    for hm in range(0, 600):
        x = hm * k // 2 + k // 2
        L = 3 if hm % 10 == 0 else 1.6
        d.line([(x, H - 1), (x, H - int(L * k))], fill=255, width=1)
    im.save(os.path.join(OUT, 'rule.png'))


def plot_pencil():
    k = 5
    W, H = 420 * k, 240 * k                  # the plot card is 420 x 240 mm
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    rnd = random.Random(4)

    def wob(p0, p1, width, val, dash=None):
        # a hand-ruled line: straight, slightly uneven pressure, optional dashes
        (x0, y0), (x1, y1) = p0, p1
        n = 160
        for i in range(n):
            if dash and (i // dash[0]) % 2 == 1:
                continue
            a, b = i / n, (i + 1) / n
            v = int(val * (0.75 + 0.25 * rnd.random()))
            d.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)],
                   fill=v, width=width)

    m = 9 * k                                 # boundary set 9 mm in from the card edge
    wob((m, m), (W - m, m), 2, 150, dash=(6, 0))
    wob((W - m, m), (W - m, H - m), 2, 150, dash=(6, 0))
    wob((W - m, H - m), (m, H - m), 2, 150, dash=(6, 0))
    wob((m, H - m), (m, m), 2, 150, dash=(6, 0))
    # two faint grid lines and their overruns
    wob((-10, 120 * k), (W + 10, 121 * k), 1, 90)
    wob((210 * k, -10), (209 * k, H + 10), 1, 90)
    # dimension ticks along the front edge
    for x in (m, 210 * k, W - m):
        wob((x - 8, H - m + 26), (x + 8, H - m + 10), 2, 140)
    wob((m, H - m + 18), (W - m, H - m + 18), 1, 110)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(os.path.join(OUT, 'plot_pencil.png'))


if __name__ == '__main__':
    rule()
    plot_pencil()
    print('wrote', os.listdir(OUT))
