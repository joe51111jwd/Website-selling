# Round 4 (#13 refined): the title's letters as clean, cuttable outlines.
# 1. Draw the book's letterforms (lettering.py) refined for cutting: optical kerning, round letters overshooting
#    the cap and baseline, one even stroke weight, and stencil bridges designed into the letters (a bridge is
#    physically needed wherever a stroke closes a loop: the counters of A, D, O and P would otherwise fall out).
# 2. Render that drawing large in Chromium (true miter joins), trace its edges into polygons, simplify them.
# Writes out/render/cutouts.json: for each line of the title, its pieces as polygons in cap-height units (y up),
# plus a proof SVG/PNG of the refined letters.
#   python3 src/make_cutouts.py out/render
import json
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lettering import LETTERS as BASE_LETTERS, T, arc  # noqa: E402

out_dir = sys.argv[1]
CAP_PX = 640          # cap height in the traced drawing
WEIGHT = T * 1.12     # a touch heavier than the drawn covers: these are windows, they must let light through
BRIDGE = WEIGHT * 0.34  # every bridge the same width

# optical kerning, in cap-height units (added to the base tracking), for the two lines of the title only
KERN = {
    "SC": -0.015, "CA": -0.075, "AL": -0.045, "LI": -0.075, "IN": -0.005, "NG": -0.01,
    "UP": -0.01, "P-": -0.07, "-S": -0.03, "SI": -0.005, "ID": 0.0, "DE": -0.01, "E-": -0.075, "-D": -0.02,
    "DO": -0.025, "OW": -0.055, "WN": -0.055,
}
TRACK = {"SCALING": 0.15, "UP-SIDE-DOWN": 0.13}
ROUND = set("OCGS")  # overshoot: round letters run 2.5% past the cap line and the baseline, so they look as tall
h = WEIGHT / 2
hs = T / 2  # where the skeletons sit (their own inset)

# refinements for cutting: N as three strokes (square tops, clipped flat), G with a spur that meets its bowl
LETTERS = dict(BASE_LETTERS)
w_ = 0.72
LETTERS["N"] = (w_, [[(hs, -0.1), (hs, 1.1)], [(w_ - hs, -0.1), (w_ - hs, 1.1)], [(hs, 1.0), (w_ - hs, 0.0)]])
w_ = 0.74
LETTERS["G"] = (w_, [arc(w_ / 2, 0.5, w_ / 2 - hs, 0.5 - hs, 40, 340), [(w_ - hs, 0.47), (w_ - hs, 0.33)], [(w_ * 0.54, 0.47), (w_ - hs + WEIGHT / 2, 0.47)]])
w_ = 1.02
LETTERS["W"] = (w_, [[(hs * 0.6, 1.1), (w_ * 0.25, hs * 0.6), (w_ * 0.5, 0.72), (w_ * 0.75, hs * 0.6), (w_ - hs * 0.6, 1.1)]])
w_ = 0.90  # A: wider, its crossbar lower, so the counter opens up at this weight; feet and apex clipped flat
LETTERS["A"] = (w_, [[(0.0, -0.12), (w_ / 2, 1.12), (w_, -0.12)], [(w_ * 0.22, 0.29), (w_ * 0.78, 0.29)]])
w_ = 0.56
LETTERS["L"] = (w_, [[(hs, 1.1), (hs, hs), (w_, hs)]])
w_ = T
LETTERS["I"] = (w_, [[(hs, -0.1), (hs, 1.1)]])
w_ = 0.68
U_ = BASE_LETTERS["U"][1][0]
LETTERS["U"] = (w_, [[(U_[0][0], 1.1)] + U_[1:-1] + [(U_[-1][0], 1.1)]])


def bridges(ch, w):
    """designed stencil bridges for a letter: (x, y, angle of the stroke there in degrees), in letter units"""
    if ch == "O":
        return [(w / 2, 1 - T / 2, 0), (w / 2, T / 2, 0)]            # top and bottom, on the axis
    sx = T / 2 + WEIGHT / 2 + BRIDGE / 2   # flush with the stem: the bowl stands free of it, as a stencil cut does
    if ch == "D":
        return [(sx, 1 - T / 2, 0), (sx, T / 2, 0)]     # where the bowl leaves the stem, top and bottom
    if ch == "P":
        return [(sx, 1 - T / 2, 0), (sx, 0.47, 0)]      # the same, at the bowl's two joins
    if ch == "A":
        # a split apex: the two legs meet flat at the cap line and a bridge parts them (the classic stencil A)
        return [(w / 2, 0.9, 0, 2.2)]
    return []


def layout(text):
    """letters placed with kerning; returns [(char, x, width)] and total width"""
    x, res = 0.0, []
    for i, ch in enumerate(text):
        w = LETTERS[ch][0]
        res.append((ch, x, w))
        x += w + TRACK[text] + (KERN.get(text[i:i + 2], 0.0) if i + 1 < len(text) else 0.0)
    return res, x - TRACK[text]


def svg_for(text):
    placed, width = layout(text)
    pad = 0.3
    Wpx = (width + 2 * pad) * CAP_PX
    Hpx = (1 + 2 * pad) * CAP_PX
    paths, rpaths, rects = [], [], []
    for ch, x0, w in placed:
        for poly in LETTERS[ch][1]:
            pts = []
            for px, py in poly:
                if ch in ROUND:
                    py = 0.5 + (py - 0.5) * 1.025
                pts.append(((pad + x0 + px) * CAP_PX, (pad + 1 - py) * CAP_PX))
            closed = math.dist(pts[0], pts[-1]) < 1e-6
            d = "M " + " L ".join(f"{a:.2f} {b:.2f}" for a, b in (pts[:-1] if closed else pts)) + (" Z" if closed else "")
            (rpaths if ch in ROUND else paths).append(f'<path d="{d}"/>')
        for br in bridges(ch, w):
            bx, by, ang = br[:3]
            ln = br[3] if len(br) > 3 else 2.2
            cx, cy = (pad + x0 + bx) * CAP_PX, (pad + 1 - by) * CAP_PX
            bw, bl = BRIDGE * CAP_PX, WEIGHT * ln * CAP_PX
            rects.append(f'<rect x="{cx - bw / 2:.2f}" y="{cy - bl / 2:.2f}" width="{bw:.2f}" height="{bl:.2f}" '
                         f'transform="rotate({ang} {cx:.2f} {cy:.2f})"/>')
    top, base = pad * CAP_PX, (pad + 1) * CAP_PX
    o = 0.025 * CAP_PX * 0.5 + 0.004 * CAP_PX
    clip = (f'<clipPath id="flat"><rect x="0" y="{top:.2f}" width="{Wpx:.0f}" height="{base - top:.2f}"/></clipPath>'
            f'<clipPath id="round"><rect x="0" y="{top - o:.2f}" width="{Wpx:.0f}" height="{base - top + 2 * o:.2f}"/></clipPath>')
    st = f'fill="none" stroke="#fff" stroke-width="{WEIGHT * CAP_PX:.2f}" stroke-linejoin="miter" stroke-miterlimit="1.9" stroke-linecap="butt"'
    body = (f'<defs>{clip}</defs><rect width="100%" height="100%" fill="#000"/>'
            f'<g {st} clip-path="url(#flat)">{"".join(paths)}</g>'
            f'<g {st} clip-path="url(#round)">{"".join(rpaths)}</g>'
            f'<g fill="#000">{"".join(rects)}</g>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{Wpx:.0f}" height="{Hpx:.0f}">{body}</svg>', Wpx, Hpx, pad


def trace(mask):
    """pixel-edge contour following: every inside pixel's sides that face outside, chained into closed loops
    (clockwise in image coordinates for outlines, anticlockwise for holes)."""
    m = np.pad(mask, 1)
    H, W = m.shape
    nxt = {}
    ins = m[1:-1, 1:-1]
    rr, cc = np.nonzero(ins)
    rr, cc = rr + 1, cc + 1
    for r, c in zip(rr.tolist(), cc.tolist()):
        if not m[r - 1, c]:
            nxt.setdefault((c, r), []).append((c + 1, r))
        if not m[r, c + 1]:
            nxt.setdefault((c + 1, r), []).append((c + 1, r + 1))
        if not m[r + 1, c]:
            nxt.setdefault((c + 1, r + 1), []).append((c, r + 1))
        if not m[r, c - 1]:
            nxt.setdefault((c, r + 1), []).append((c, r))
    loops = []
    while nxt:
        start = next(iter(nxt))
        loop, p = [start], start
        while True:
            q = nxt[p].pop()
            if not nxt[p]:
                del nxt[p]
            if q == start:
                break
            loop.append(q)
            p = q
            if p not in nxt:
                break
        loops.append([(x - 1, y - 1) for x, y in loop])
    return loops


def simplify(pts, tol):
    """Douglas-Peucker on a closed loop"""
    pts = np.asarray(pts, float)
    # split the loop at its two most distant points so each half is an open polyline
    i0 = 0
    i1 = int(np.argmax(((pts - pts[0]) ** 2).sum(1)))
    def dp(a):
        if len(a) < 3:
            return a
        s, e = a[0], a[-1]
        v = e - s
        n = np.hypot(*v) or 1.0
        w_ = a - s
        d = np.abs(v[0] * w_[:, 1] - v[1] * w_[:, 0]) / n
        k = int(np.argmax(d))
        if d[k] > tol:
            return np.vstack([dp(a[: k + 1])[:-1], dp(a[k:])])
        return np.vstack([s, e])
    first = dp(pts[i0 : i1 + 1])
    second = dp(np.vstack([pts[i1:], pts[:1]]))
    return np.vstack([first[:-1], second[:-1]])


def area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


result = {}
for text in ("SCALING", "UP-SIDE-DOWN"):
    svg, Wpx, Hpx, pad = svg_for(text)
    svg_path = os.path.join(out_dir, f"cut-{text}.svg")
    png_path = os.path.join(out_dir, f"cut-{text}.png")
    open(svg_path, "w").write(svg)
    subprocess.run(["node", "-e", f"""
const {{chromium}} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage({{viewport: {{width: {int(Wpx)}, height: {int(Hpx)}}}}});
await p.goto('file://{os.path.abspath(svg_path)}'); await p.screenshot({{path: '{os.path.abspath(png_path)}'}}); await b.close(); }})();
"""], check=True)
    mask = np.asarray(Image.open(png_path).convert("L")) > 127
    loops = trace(mask)
    polys = []
    for lp in loops:
        if len(lp) < 12:
            continue
        sp = simplify(lp, 0.6)
        a = area(sp)
        if a <= 0:  # a hole (anticlockwise in image coordinates): should not exist with the bridges in place
            print(f"warning: {text} has a hole of {abs(a):.0f} px^2 at {sp[0]}")
            continue
        # to cap-height units, y up, origin at the line's left end on the baseline
        poly = [((x / CAP_PX) - pad, (pad + 1) - (y / CAP_PX)) for x, y in sp]
        polys.append(poly)
    xs = [p[0] for poly in polys for p in poly]
    result[text] = {"width": max(xs) - min(xs), "x0": min(xs), "polys": polys}
    print(text, "pieces", len(polys), "points", sum(len(p) for p in polys), f"width {result[text]['width']:.3f} cap")
json.dump(result, open(os.path.join(out_dir, "cutouts.json"), "w"))
