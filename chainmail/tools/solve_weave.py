#!/usr/bin/env python3
"""Solve European 4-in-1 weave parameters for the hero chainmail (fx_chainmail_tile.py / chrome.js).

Link at row r, column c: centre (c*SX + (r odd)*SX/2, r*SY, 0); ring of radius RR (wire radius RW)
leaned by TH about its local y axis, then yawed by s*PSI (s = +1 even rows, -1 odd rows).

Constraints for a valid 4-in-1:
  - link (0,0) is topologically linked (|Gauss linking number| = 1) with exactly its 4 diagonal
    neighbours (rows +-1, the two nearest columns), and unlinked with everything else
  - no two wires interpenetrate: centreline distance >= 2*RW + margin for every pair
Objective: the fraction of each ring's crest visible from straight above (closed rings read as rings).

    python3 chainmail/tools/solve_weave.py            # search
    python3 chainmail/tools/solve_weave.py --eval TH PSI SX SY
"""
import sys
import numpy as np

RR, RW, MARGIN = 1.0, 0.18, 0.05
N = int(__import__('os').environ.get('WEAVE_N', 96))
phi = np.linspace(0, 2 * np.pi, N, endpoint=False)


def ring(c, s, TH, PSI):
    x = RR * np.cos(phi) * np.cos(TH)
    y = RR * np.sin(phi)
    z = s * RR * np.cos(phi) * np.sin(TH)
    cp, sp = np.cos(s * PSI), np.sin(s * PSI)
    return np.stack([cp * x - sp * y + c[0], sp * x + cp * y + c[1], z], 1)


def neighbours(SX, SY, TH, PSI):
    out = []
    for r in range(-2, 3):
        odd = r % 2
        s = -1.0 if odd else 1.0
        for c in range(-3, 4):
            if r == 0 and c == 0:
                continue
            cx = c * SX + odd * 0.5 * SX
            if cx * cx + (r * SY) ** 2 > 3.2 ** 2:
                continue
            diag = abs(r) == 1 and c in (-1, 0)
            out.append((ring((cx, r * SY), s, TH, PSI), diag))
    return out


def linking(a, b):
    da = np.roll(a, -1, 0) - a
    db = np.roll(b, -1, 0) - b
    ma = a + 0.5 * da
    mb = b + 0.5 * db
    r = ma[:, None, :] - mb[None, :, :]
    cr = np.cross(da[:, None, :], db[None, :, :])
    return np.sum(np.einsum("ijk,ijk->ij", r, cr) / np.linalg.norm(r, axis=2) ** 3) / (4 * np.pi)


def evaluate(TH, PSI, SX, SY):
    me = ring((0, 0), 1.0, TH, PSI)
    nb = neighbours(SX, SY, TH, PSI)
    mind = 9.0
    ok_link = True
    for pts, diag in nb:
        d = np.min(np.linalg.norm(me[:, None, :] - pts[None, :, :], axis=2))
        mind = min(mind, d)
        if mind < 2 * RW + MARGIN:
            return dict(ok=False, score=-9)
        lk = abs(linking(me, pts))
        if diag and abs(lk - 1) > 0.15:
            ok_link = False
        if not diag and lk > 0.15:
            ok_link = False
    # crest visibility from above
    top = me[:, 2] + RW
    vis = np.ones(N, bool)
    for pts, _ in nb:
        dxy = np.linalg.norm(me[:, None, :2] - pts[None, :, :2], axis=2)
        h = np.where(dxy < RW, pts[None, :, 2] + np.sqrt(np.clip(RW * RW - dxy * dxy, 0, None)), -9)
        vis &= ~(h.max(1) > top)
    hid = ~vis
    run = best_run = 0
    for v in np.concatenate([hid, hid]):
        run = run + 1 if v else 0
        best_run = max(best_run, run)
    maxrun = min(best_run, N) / N
    return dict(ok=ok_link and mind >= 2 * RW + MARGIN, link=ok_link, mind=mind, vis=vis.mean(), maxrun=maxrun,
                score=vis.mean() - 1.5 * maxrun,
                fill=np.pi * RR * RR * np.cos(TH) / (SX * SY))


def main():
    if "--eval" in sys.argv:
        a = [float(v) for v in sys.argv[sys.argv.index("--eval") + 1:][:4]]
        print(evaluate(*a))
        return
    print("current", evaluate(0.80, 0.20, 1.10, 1.20))
    rng = np.random.default_rng(7)
    best = []
    for i in range(20000):
        p = (rng.uniform(0.25, 1.35), rng.uniform(-1.6, 1.6), rng.uniform(0.7, 2.4), rng.uniform(0.6, 2.2))
        e = evaluate(*p)
        if e["ok"]:
            best.append((e["score"], p, e))
    best.sort(key=lambda t: -t[0])
    print(len(best), "valid", flush=True)
    for v, p, e in best[:12]:
        print(np.round(p, 3), {k: round(float(x), 3) for k, x in e.items() if k != "ok"})
    # refine the top few
    for v, p, e in best[:3]:
        p = np.array(p)
        for it in range(400):
            q = p + rng.normal(0, 0.03, 4)
            f = evaluate(*q)
            if f["ok"] and f["score"] >= v:
                v, p = f["score"], q
        print("refined", np.round(p, 3), evaluate(*p))


if __name__ == "__main__":
    main()
