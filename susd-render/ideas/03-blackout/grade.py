#!/usr/bin/env python3
"""Review pass: the print grade for the three Blackout renders, plus spotting on the two that were
rendered before the slit fix in make_pages.py.

  python3 ideas/03-blackout/grade.py        (reads out/ideas/03-blackout/final_*.png, writes *_graded.png)

What it does, per image, the way a photographer would finish a copy-stand frame:
  1. Shoulder: the paper's highlights roll off instead of clipping (Standard view clips at 1.0,
     which left flat 255 white over 13% of the first desktop frame and erased the cockle there).
  2. Toe: the ink goes from charcoal (about 40-47 sRGB) to ink black (about 24-28), as a camera's
     tone curve would put it. The wet strokes stay darker than the dry ones.
  3. First desktop only: it was re-rendered 0.6 EV darker (exposure -1.5, so the paper keeps its
     detail), gets 0.5 EV back here, and the bright left margin near the window is burned in a
     little (a darkroom burn, at most 0.25 EV), so it competes less with the kept sentence.
  4. Key desktop and phone only (rendered from the old ink texture): spotting. Thin white slits
     inside the ink, at most a few px tall, dark above and below and closed by ink at both ends of
     the row, are filled from the ink above and below, with matching grain. The dry tails at the
     ends of strokes open onto bare paper and are left alone; so are the kept lines.
Nothing else is painted. The raw renders stay as they are.
"""
import json, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'out', 'ideas', '03-blackout')


def to_lin(v):
    v = v / 255.0
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055) * 255.0


def pchip_lut(xs, ys):
    """Monotone cubic (Fritsch-Carlson) through the points, sampled at 0..255."""
    xs, ys = np.asarray(xs, float), np.asarray(ys, float)
    h = np.diff(xs); d = np.diff(ys) / h
    m = np.zeros_like(xs)
    m[1:-1] = np.where(d[:-1] * d[1:] > 0, 3 * (h[:-1] + h[1:]) / ((2 * h[1:] + h[:-1]) / d[:-1] + (h[1:] + 2 * h[:-1]) / d[1:]), 0)
    m[0], m[-1] = d[0], d[-1]
    t = np.arange(256, dtype=float)
    k = np.clip(np.searchsorted(xs, t, side='right') - 1, 0, len(xs) - 2)
    s = (t - xs[k]) / h[k]
    h00, h10, h01, h11 = 2 * s**3 - 3 * s**2 + 1, s**3 - 2 * s**2 + s, -2 * s**3 + 3 * s**2, s**3 - s**2
    return h00 * ys[k] + h10 * h[k] * m[k] + h01 * ys[k + 1] + h11 * h[k] * m[k + 1]


TOE = pchip_lut([0, 16, 32, 48, 64, 96, 128, 192, 255], [0, 9, 18, 30, 46, 84, 123, 192, 255])


def shoulder(x, k=0.78):
    return np.where(x > k, k + (1 - k) * np.tanh((x - k) / (1 - k)), x)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def spot(rgb, protect, K, dark_lt=70.0, allow=None, seed=5):
    """Fill thin bright slits enclosed by ink (see the docstring). rgb float (h, w, 3) sRGB."""
    Lm = rgb.mean(2)
    dark = Lm < dark_lt
    h, w = dark.shape
    big = 10 ** 6
    up = np.full((h, w), big, np.int32); dn = np.full((h, w), big, np.int32)
    for d in range(K, 0, -1):
        up[d:][dark[:-d]] = d
        dn[:-d][dark[d:]] = d
    cand = ~dark & (up + dn - 1 <= K) & ~protect
    if allow is not None:
        cand &= allow
    cols = np.arange(w, dtype=np.int32)[None, :]
    stop = ~cand
    left = np.maximum.accumulate(np.where(stop, cols, -1), axis=1)
    right = np.flip(np.minimum.accumulate(np.flip(np.where(stop, cols, big), 1), axis=1), 1)
    rows = np.arange(h)[:, None]
    l_ok = (left >= 0) & dark[rows, np.clip(left, 0, w - 1)]
    r_ok = (right < big) & dark[rows, np.clip(right, 0, w - 1)]
    fill = cand & l_ok & r_ok
    ys, xs = np.nonzero(fill)
    ya = np.clip(ys - up[ys, xs], 0, h - 1); yb = np.clip(ys + dn[ys, xs], 0, h - 1)
    wa = dn[ys, xs][:, None].astype(float); wb = up[ys, xs][:, None].astype(float)
    val = (rgb[ya, xs] * wa + rgb[yb, xs] * wb) / (wa + wb)
    # grain to match the ink around it
    ink_px = rgb[dark & ~protect]
    sd = float(np.std(ink_px[(ink_px.mean(1) > 15) & (ink_px.mean(1) < 60)].mean(1))) if ink_px.size else 2.0
    rng = np.random.default_rng(seed)
    val = val + rng.normal(0, min(sd, 3.0), (len(ys), 1))
    out = rgb.copy()
    out[ys, xs] = val
    # the soft rows right above and below a filled slit: pull them to their ink neighbours
    edge = np.zeros_like(fill)
    edge[1:] |= fill[:-1]; edge[:-1] |= fill[1:]
    edge &= ~fill & ~protect & (Lm >= 40)
    ey, ex = np.nonzero(edge)
    nb = np.stack([out[np.clip(ey - 2, 0, h - 1), ex], out[np.clip(ey + 2, 0, h - 1), ex]], 0).min(0)
    out[ey, ex] = np.minimum(out[ey, ex], nb + 6)
    return out, int(fill.sum())


def boxes_mask(shape, anchors, pad):
    m = np.zeros(shape, bool)
    for Ln in anchors['lines']:
        x0, y0 = Ln['tl']; x1, y1 = Ln['br']
        m[max(0, int(y0 - pad)):int(y1 + pad), max(0, int(x0 - pad)):int(x1 + pad)] = True
    return m


def grade(name, lift_ev=0.0, burn=None, spot_k=0, allow=None):
    src = os.path.join(OUT, name + '.png')
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(float)
    anc = json.load(open(os.path.join(OUT, name + '.anchors.json')))
    n = 0
    if spot_k:
        prot = boxes_mask(rgb.shape[:2], anc, 10)
        al = allow(rgb.shape[:2]) if allow else None
        rgb, n = spot(rgb, prot, spot_k, allow=al)
    lin = to_lin(rgb) * (2.0 ** lift_ev)
    if burn:
        x = np.arange(rgb.shape[1], dtype=float)[None, :, None]
        x0, x1, ev = burn
        lin = lin * 2.0 ** (-ev * smoothstep(x1, x0, x))
    lin = shoulder(lin)
    s = to_srgb(lin)
    s = TOE[np.clip(np.round(s), 0, 255).astype(int)]
    dst = os.path.join(OUT, name + '_graded.png')
    Image.fromarray(np.clip(np.round(s), 0, 255).astype(np.uint8)).save(dst)
    Lm = s.mean(2)
    print('%-22s spotted %6d px   ink p5 %.0f  paper p99 %.0f  clipped %.2f%%' % (
        name, n, np.percentile(Lm, 5), np.percentile(Lm, 99), 100 * (s.min(2) >= 254).mean()))


if __name__ == '__main__':
    # first desktop: re-rendered at exposure -1.5 (0.6 EV under the earlier -0.9); burn the window-side margin
    grade('final_first_desktop', lift_ev=0.5, burn=(380.0, 640.0, 0.25))
    # key desktop: spot on the page only (the dish and brush sit right of x ~ 960)
    grade('final_key_desktop', spot_k=5, allow=lambda sh: np.pad(np.ones((sh[0], 960), bool), ((0, 0), (0, sh[1] - 960))))
    # phone: spot on the sheet (below the desk band)
    grade('final_first_phone', spot_k=7, allow=lambda sh: np.pad(np.ones((sh[0] - 340, sh[1]), bool), ((340, 0), (0, 0))))
