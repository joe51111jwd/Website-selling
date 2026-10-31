#!/usr/bin/env python3
"""Measure a rendered frame against the brief (7.7) and the round-1 review targets.

    python3 scene/frame_checks.py out/stills/d01_hero_K1.png [more.png ...]

Reads <png> and <png minus .png>.anchors.json. Prints, per frame (relative luminance, sRGB decoded):
  top     95th percentile of the top band (desktop 0-8 %, phone 0-7 %): the brief wants <= 0.15
  caption 95th percentile of the caption zone (desktop x 25-75 %, y 71-91 %; phone y 62-89 %)
  aud     95th percentile under the first screen's audience line (desktop x 4-39 %, y 62-70 %)
  inst    95th percentile under the instrument column (desktop x 75-97 %, y 58-97 %)
  words   90th percentile inside the sentence's box (the dry letters' brightness)
  refl    90th percentile in the mirror image of that box below the waterline (open views, water below
          the words): review round 1 wants refl <= 0.45 x words
  black   share of pixels below 8/255 (review round 1: the drowned frames were 51-72 %)
  floor   the darkest 8-bit value in the bottom 20 % (review: no pixel below 12 in the drowned beats)
"""
import json, os, sys
import numpy as np
from PIL import Image


def lum(a):
    a = a.astype(np.float32) / 255.0
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def box(L, x0, y0, x1, y1):
    h, w = L.shape
    return L[int(y0 * h):max(int(y0 * h) + 1, int(y1 * h)), int(x0 * w):max(int(x0 * w) + 1, int(x1 * w))]


def p(a, q):
    return float(np.percentile(a, q)) if a.size else float('nan')


def check(path):
    im = Image.open(path).convert('RGB')
    rgb = np.asarray(im)
    L = lum(rgb)
    v8 = rgb.max(axis=2)
    an = {}
    aj = os.path.splitext(path)[0] + '.anchors.json'
    if os.path.exists(aj):
        an = json.load(open(aj))
    phone = an.get('layout') == 'phone' or im.height > im.width
    r = dict(file=os.path.basename(path))
    r['top'] = p(box(L, 0, 0, 1, 0.07 if phone else 0.08), 95)
    r['caption'] = p(box(L, 0.05, 0.62, 0.95, 0.89) if phone else box(L, 0.25, 0.71, 0.75, 0.91), 95)
    if not phone:
        r['aud'] = p(box(L, 0.044, 0.62, 0.39, 0.70), 95)
        r['inst'] = p(box(L, 0.75, 0.58, 0.97, 0.97), 95)
    w = an.get('words')
    G = np.asarray(im.convert('L')).astype(np.float32)
    if w:
        r['words'] = p(box(L, *w), 90)
        r['words8'] = p(box(G, *w), 90)
        m = an.get('metres', {})
        if m and m.get('water', 9) < m.get('deck', 0):
            # the water plane at the letters' plane, in frame units; the reflection is the words mirrored
            # about it (the review's measure: 8-bit p90 of the reflection <= 0.45 x the dry words' p90)
            k = an.get('zoom', 1.0)
            wy = w[3] + (m['deck'] + 0.012 - m['water']) / m['frame_h'] * k
            y0, y1 = wy + (wy - w[3]), wy + (wy - w[1])
            if y0 < 0.98:
                r['refl8'] = p(box(G, w[0], y0, w[2], min(1.0, y1)), 90)
                r['refl/words'] = r['refl8'] / max(r['words8'], 1e-6)
        # per line: the letters' p90 against the panel's p25 inside the line's box (contrast ratio)
        m = an.get('metres', {})
        if m.get('cap') and m.get('H'):
            nl = round((m['H'] / m['cap'] - 1) / 1.32) + 1
            fr = m['cap'] / m['H']; pitch = 1.32 * fr
            worst = 9e9
            for i in range(nl):
                y0 = w[1] + (w[3] - w[1]) * (i * pitch)
                y1 = w[1] + (w[3] - w[1]) * (i * pitch + fr)
                b_ = box(L, w[0], y0, w[2], y1)
                worst = min(worst, (p(b_, 90) + 0.05) / (p(b_, 25) + 0.05))
            r['line_contrast_min'] = worst
    r['black'] = float((v8 < 8).mean())
    r['floor'] = int(v8[int(0.8 * v8.shape[0]):].min())
    return r


if __name__ == '__main__':
    for f in sys.argv[1:]:
        r = check(f)
        print(r['file'].ljust(28), '  '.join(f'{k} {v:.3f}' if isinstance(v, float) else f'{k} {v}' for k, v in r.items() if k != 'file'))
