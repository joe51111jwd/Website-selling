# Cover 15, "Stitched": the title embroidered on linen in a wooden hoop, in satin stitch along the book's own
# letterforms (lettering.py), thousands of single stitches. SCALING in dark thread, UP / SIDE / DOWN in the cover's
# paints. The G is coming undone: its last stitches are loose, and one thread runs out of the hoop to a needle that
# hangs below it. Writes the linen (PNG) and the embroidery (SVG).
#   python3 src/make_stitch.py out/render
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lettering import T, layout  # noqa: E402

out_dir = sys.argv[1]
# "bold": the stand-out version: charcoal linen, cream thread, bright paints, a bigger title, a hoop that runs off the page
BOLD = len(sys.argv) > 2 and sys.argv[2] == "bold"
SUFFIX = "-bold" if BOLD else ""
W, H = 1875, 2775
rng = np.random.default_rng(15)
random.seed(15)
HOOP = (W / 2, 1150, 975) if BOLD else (W / 2, 1180, 760)  # centre x, y, inner radius

# 1. linen: a plain weave, slightly irregular threads, taut and lighter inside the hoop
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
row = rng.normal(0, 1, H).astype(np.float32)
col = rng.normal(0, 1, W).astype(np.float32)
row = np.convolve(row, np.ones(3) / 3, "same")
col = np.convolve(col, np.ones(3) / 3, "same")
weave = 0.5 + 0.5 * np.sin(x * 2 * math.pi / 3.2) * np.sin(y * 2 * math.pi / 3.2)
slub = row[:, None] * 0.6 + col[None, :] * 0.6
base = np.array([44, 41, 37] if BOLD else [231, 222, 205], np.float32)
r = np.sqrt((x - HOOP[0]) ** 2 + (y - HOOP[1]) ** 2)
inside = (r < HOOP[2]).astype(np.float32)
light = 1.0 + 0.035 * inside - 0.05 * np.clip((r - HOOP[2] - 60) / 900, 0, 1)  # outside the hoop, a little slack and shadowed
img = base[None, None, :] * (0.95 + 0.028 * weave[..., None] + 0.022 * slub[..., None]) * light[..., None]
# soft folds in the loose linen outside the hoop
folds = np.sin((x * 0.6 + y) / 140.0 + np.sin(y / 300.0) * 2) * 0.03 * (1 - inside)
img *= (1 + folds)[..., None]
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, f"linen{SUFFIX}.png"))

# 2. the embroidery
svg = []


def resample(pts, step):
    res = [pts[0]]
    acc = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        d = math.hypot(bx - ax, by - ay)
        n = max(1, int(d / step))
        for k in range(1, n + 1):
            res.append((ax + (bx - ax) * k / n, ay + (by - ay) * k / n))
    return res


def satin(pts, weight, colour, shade, start_loose=None, seed=0):
    """satin stitch along a centreline: short stitches across the stroke, slanted, each shaded like a thread.
    From start_loose (fraction along the stroke) on, stitches go loose and sparse: the work coming undone."""
    rnd = random.Random(seed)
    pts = resample(pts, 5.2)
    n = len(pts)
    for k in range(1, n - 1):
        f = k / (n - 1)
        (ax, ay), (bx, by) = pts[k - 1], pts[k + 1]
        tx, ty = bx - ax, by - ay
        L = math.hypot(tx, ty) or 1
        tx, ty = tx / L, ty / L
        nx, ny = -ty, tx
        # slant: each stitch leans 25 degrees along the stroke
        s, c = math.sin(math.radians(25)), math.cos(math.radians(25))
        dx, dy = nx * c + tx * s, ny * c + ty * s
        hw = weight / 2 * rnd.uniform(0.94, 1.04)
        cx, cy = pts[k]
        loose = start_loose is not None and f > start_loose
        if loose:
            if rnd.random() < 0.55:
                continue
            hw *= rnd.uniform(0.6, 1.0)
            cx += rnd.uniform(-4, 4)
            cy += rnd.uniform(2, 9) * (f - start_loose) * 6
        x1, y1, x2, y2 = cx - dx * hw, cy - dy * hw, cx + dx * hw, cy + dy * hw
        # a thread: a darker body and a light sheen along its upper side
        bend = rnd.uniform(-1.5, 1.5)
        mx, my = (x1 + x2) / 2 + tx * bend, (y1 + y2) / 2 + ty * bend
        svg.append(f'<path d="M {x1:.1f} {y1:.1f} Q {mx:.1f} {my:.1f} {x2:.1f} {y2:.1f}" stroke="{colour}" stroke-width="5.6" stroke-linecap="round" fill="none"/>')
        svg.append(f'<path d="M {x1 + tx * 0.9:.1f} {y1 + ty * 0.9:.1f} Q {mx + tx * 0.9:.1f} {my + ty * 0.9:.1f} {x2 + tx * 0.9:.1f} {y2 + ty * 0.9:.1f}" stroke="{shade}" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round" fill="none"/>')


def letters(text, cap, cx, base_y, tracking, colours, loose_letter=None, seed=0):
    strokes, width = layout(text, cap, tracking)
    ox = cx - width / 2
    nth = {}
    exit_pt = None
    for k, (i, ch, p) in enumerate(strokes):
        pts = [(ox + px, base_y - py) for px, py in p]
        colour, shade = colours(i)
        j = nth.get(i, 0)
        nth[i] = j + 1
        loose = None
        if loose_letter is not None and i == loose_letter:
            if j == 0:      # the G's bowl: worked round from the bottom, coming undone at its upper end
                pts = pts[::-1]
                loose = 0.74
                exit_pt = pts[-1]
            else:           # its bar and spur: barely begun
                loose = 0.15
        satin(pts, T * cap * 1.02, colour, shade, loose, seed + k * 13)
    return ox, width, exit_pt


if BOLD:
    INK, INK_HI = "#efe3c8", "#ffffff"   # cream thread on charcoal
    PAINT = {"up": ("#4f9a5e", "#a8dcb0"), "side": ("#f0a62e", "#ffe2a0"), "down": ("#d9473a", "#ffab9f")}
    ox, wd, g_exit = letters("SCALING", 286, HOOP[0], 1170, 0.2, lambda i: (INK, INK_HI), loose_letter=6, seed=1)
else:
    INK, INK_HI = "#26221e", "#8a8178"
    PAINT = {"up": ("#1f4a2b", "#7fae86"), "side": ("#d08a1a", "#f6cf7a"), "down": ("#8f1d18", "#e0776b")}
    ox, wd, g_exit = letters("SCALING", 252, HOOP[0], 1150, 0.2, lambda i: (INK, INK_HI), loose_letter=6, seed=1)
word = {0: "up", 1: "up", 3: "side", 4: "side", 5: "side", 6: "side", 8: "down", 9: "down", 10: "down", 11: "down"}
_ = letters("UP-SIDE-DOWN", 150 if BOLD else 112, HOOP[0], 1500 if BOLD else 1430, 0.2, lambda i: PAINT[word[i]] if i in word else (INK, INK_HI), seed=500)

# the loose thread: out of the G's unravelling end, over the hoop, down to a needle hanging below
gx, gy = g_exit
if BOLD:   # over the hoop at the right and down the page, the needle hanging beside the subtitle
    pts = [(gx, gy), (gx + 90, gy + 30), (gx + 120, gy + 300), (1690, 1700), (1640, 1980), (1700, 2190)]
else:
    pts = [(gx, gy), (gx + 70, gy + 40), (gx + 40, gy + 260), (gx + 120, 1600), (gx + 70, 1900), (gx + 110, 2120)]
d = f"M {pts[0][0]} {pts[0][1]} C {pts[1][0]} {pts[1][1]}, {pts[2][0]} {pts[2][1]}, {pts[3][0]} {pts[3][1]} S {pts[4][0]} {pts[4][1]}, {pts[5][0]} {pts[5][1]}"
svg.append(f'<path d="{d}" stroke="#000" stroke-opacity="0.18" stroke-width="7" fill="none" transform="translate(6 10)" filter="url(#soft)"/>')
svg.append(f'<path d="{d}" stroke="{INK}" stroke-width="5.4" fill="none" stroke-linecap="round"/>')
svg.append(f'<path d="{d}" stroke="{INK_HI}" stroke-opacity="0.5" stroke-width="1.6" fill="none" transform="translate(-1 -1)"/>')
nx_, ny_ = pts[5]
# the needle: steel, with an eye the thread runs through
svg.append(f'<g transform="translate({nx_} {ny_}) rotate(12)">'
           f'<path d="M -9 0 L 9 0 L 2 300 L 0 318 L -2 300 Z" fill="url(#steel)" stroke="#5c6066" stroke-width="1.4"/>'
           f'<ellipse cx="0" cy="22" rx="3.2" ry="12" fill="#e7e0d1" stroke="#5c6066" stroke-width="1.2"/></g>')

# the hoop: two rings of beech, a brass screw at the top
hx, hy, hr = HOOP
hoop = (f'<circle cx="{hx}" cy="{hy}" r="{hr + 36}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="64" filter="url(#soft)" transform="translate(10 16)"/>'
        f'<circle cx="{hx}" cy="{hy}" r="{hr + 30}" fill="none" stroke="url(#beech)" stroke-width="58"/>'
        f'<circle cx="{hx}" cy="{hy}" r="{hr + 3}" fill="none" stroke="#7c5a35" stroke-opacity="0.6" stroke-width="3"/>'
        f'<circle cx="{hx}" cy="{hy}" r="{hr + 57}" fill="none" stroke="#7c5a35" stroke-opacity="0.5" stroke-width="2"/>'
        f'<circle cx="{hx}" cy="{hy}" r="{hr + 30}" fill="none" stroke="#fff3dc" stroke-opacity="0.35" stroke-width="6" stroke-dasharray="900 3000" transform="rotate(-130 {hx} {hy})"/>'
        f'<g transform="translate({hx} {hy - hr - 30})"><rect x="-34" y="-58" width="68" height="40" rx="8" fill="url(#brass)" stroke="#6f5320" stroke-width="2"/>'
        f'<rect x="-14" y="-92" width="28" height="40" rx="5" fill="url(#brass)" stroke="#6f5320" stroke-width="2"/>'
        f'<circle cx="0" cy="-112" r="20" fill="url(#brass)" stroke="#6f5320" stroke-width="2"/></g>')
defs = ('<defs>'
        '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>'
        '<filter id="lift"><feDropShadow dx="1.6" dy="2.4" stdDeviation="1.6" flood-color="#2a1f12" flood-opacity="0.35"/></filter>'
        '<linearGradient id="beech" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2bd86"/><stop offset="0.5" stop-color="#cf9f62"/><stop offset="1" stop-color="#b7834b"/></linearGradient>'
        '<linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d58a"/><stop offset="0.5" stop-color="#c79a3c"/><stop offset="1" stop-color="#8f6a22"/></linearGradient>'
        '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa0a6"/><stop offset="0.45" stop-color="#eef1f3"/><stop offset="1" stop-color="#7c8288"/></linearGradient>'
        '</defs>')
body = defs + hoop + '<g filter="url(#lift)">' + "".join(svg[:-0] if False else svg) + "</g>"
open(os.path.join(out_dir, f"stitch{SUFFIX}.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>')
print("stitches", len(svg) // 2)
