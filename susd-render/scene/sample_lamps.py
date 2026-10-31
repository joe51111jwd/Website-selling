#!/usr/bin/env python3
"""Sample the lock signal's red (Redline still) and green (Oxygen still) from the rendered light, for the
Redline and Oxygen equations (review round 1: "colour it with the measured red of the lit signal lamp, not
salmon"). The glow on the wall and water around the lamp is measured (its median hue and saturation among the
saturated pixels); the colour is then lifted in lightness, keeping that hue, until cream-free text in it reads at
4.5:1 or better on the dark water it sits on.

    python3 scene/sample_lamps.py out/stills/d05_redline_K6.png out/stills/d12_oxygen_K16.png
"""
import colorsys, json, os, sys
import numpy as np
from PIL import Image


def rel(c):
    c = np.asarray(c, np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def sample(png, want):
    im = np.asarray(Image.open(png).convert('RGB')).astype(np.float64)
    an = json.load(open(os.path.splitext(png)[0] + '.anchors.json'))
    h, w = im.shape[:2]
    x, y = an['signalXY']
    r = int(0.09 * w)
    x0, x1, y0, y1 = max(0, int(x * w) - r), min(w, int(x * w) + r), max(0, int(y * h) - r), min(h, int(y * h) + 3 * r)
    px = im[y0:y1, x0:x1].reshape(-1, 3) / 255.0
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in px[::3]])
    if want == 'red':
        m = ((hsv[:, 0] < 0.06) | (hsv[:, 0] > 0.95)) & (hsv[:, 1] > 0.45) & (hsv[:, 2] > 0.25)
    else:
        m = (hsv[:, 0] > 0.30) & (hsv[:, 0] < 0.52) & (hsv[:, 1] > 0.35) & (hsv[:, 2] > 0.25)
    if m.sum() < 20:
        return None
    hh = float(np.median(hsv[m, 0])); ss = float(np.median(hsv[m, 1]))
    bg = (13, 17, 16)
    for v in np.linspace(0.5, 1.0, 101):
        rgb = [round(c * 255) for c in colorsys.hsv_to_rgb(hh, min(ss, 0.78), v)]
        if (rel(rgb) + 0.05) / (rel(bg) + 0.05) >= 7.0:
            break
    return '#%02X%02X%02X' % tuple(rgb), dict(hue=round(hh * 360, 1), sat=round(ss, 2), n=int(m.sum()))


if __name__ == '__main__':
    for png, want in zip(sys.argv[1:], ('red', 'green')):
        print(png, want, sample(png, want))
