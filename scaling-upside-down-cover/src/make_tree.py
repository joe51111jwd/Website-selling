# Cover 12, "Grown": a botanical plate. One trunk rises out of the ground and branches into the letters of SCALING,
# drawn from the book's own letterforms (lettering.py) as living wood: tapered, a little crooked, with twigs and
# leaves. Green leaves where it grows, ochre where it holds, a few red ones falling. The G has been pruned: its
# overgrown shoot is sawn off clean (the pale cut face shows) and lies on the ground. Writes an SVG art layer.
#   python3 src/make_tree.py out/render/tree.svg
import math
import random
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from lettering import T, layout  # noqa: E402

random.seed(12)
W, H = 1875, 2775
BARK, BARK2 = "#3a2a1d", "#5a4330"
LEAF = ["#4d7a3a", "#5f8f45", "#7aa356", "#3f6a33"]
OCHRE = ["#d9952a", "#c98a1c", "#e2ac4a"]
RED = ["#97201a", "#b23a2a"]
out = []

# the crown: SCALING across the top, letters 360 px tall
CAP = 300
strokes, width = layout("SCALING", CAP, 0.20)
ox = (W - width) / 2
BASE = 1010  # the crown's baseline, in page y (its letters rise from here to BASE - CAP)


def P(x, y):
    """lettering coords (y up from the baseline) -> page coords (y down)"""
    return (ox + x, BASE - y)


def resample(pts, step):
    out_ = [pts[0]]
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        d = math.hypot(bx - ax, by - ay)
        n = max(1, int(d / step))
        for k in range(1, n + 1):
            out_.append((ax + (bx - ax) * k / n, ay + (by - ay) * k / n))
    return out_


def wobble(pts, amp, seed):
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(3)]
    res = []
    for i, (x, y) in enumerate(pts):
        t = i / max(1, len(pts) - 1)
        dx = amp * (math.sin(t * 7 + ph[0]) * 0.6 + math.sin(t * 17 + ph[1]) * 0.3)
        dy = amp * (math.sin(t * 9 + ph[2]) * 0.6)
        res.append((x + dx, y + dy))
    return res


def branch(pts, w0, w1, colour=BARK, seed=0, wob=3.0):
    """a tapered branch along pts (page coords), width w0 at the start to w1 at the end"""
    pts = wobble(resample(pts, 6), wob, seed)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, ty) or 1
        nx, ny = -ty / n, tx / n
        t = i / max(1, len(pts) - 1)
        w = (w0 + (w1 - w0) * t) / 2
        L.append((x + nx * w, y + ny * w))
        R.append((x - nx * w, y - ny * w))
    poly = L + R[::-1]
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in poly) + " Z"
    out.append(f'<path d="{d}" fill="{colour}"/>')
    # light from the upper left: a paler streak down one side gives the wood its roundness
    hi = [(x + (lx - x) * 0.55, y + (ly - y) * 0.55) for (x, y), (lx, ly) in zip(pts, L)]
    hl = [(x + (lx - x) * 0.92, y + (ly - y) * 0.92) for (x, y), (lx, ly) in zip(pts, L)]
    dh = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in hi) + " L " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in hl[::-1]) + " Z"
    out.append(f'<path d="{dh}" fill="#8a6a4a" fill-opacity="0.55"/>')
    # bark: a few fine dark lines along the branch (local texture only)
    for k in range(2):
        off = (k - 0.5) * 0.45
        line = [(x + (lx - x) * off, y + (ly - y) * off) for (x, y), (lx, ly) in zip(pts, L)]
        dd = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in line[::2])
        out.append(f'<path d="{dd}" fill="none" stroke="#1f160f" stroke-opacity="0.35" stroke-width="1.6"/>')
    return pts


def leaf(x, y, ang, size, colour, op=1.0):
    # an almond leaf with a midrib
    s = size
    d = f"M 0 0 C {s*0.35} {-s*0.32} {s*0.75} {-s*0.28} {s} 0 C {s*0.75} {s*0.28} {s*0.35} {s*0.32} 0 0 Z"
    out.append(f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})" opacity="{op}"><path d="{d}" fill="{colour}"/>'
               f'<path d="M {s*0.06} 0 L {s*0.92} 0" stroke="#1f2a14" stroke-opacity="0.35" stroke-width="1.4"/></g>')


def twig(x, y, ang, length, leaves, palette, seed):
    rnd = random.Random(seed)
    pts = [(x, y)]
    a = ang
    for k in range(4):
        a += rnd.uniform(-18, 18)
        x += math.cos(math.radians(a)) * length / 4
        y += math.sin(math.radians(a)) * length / 4
        pts.append((x, y))
    branch(pts, 7, 2.2, BARK2, seed, 0.6)
    for k in range(leaves):
        px, py = pts[min(len(pts) - 1, 1 + k * 3 // max(1, leaves))]
        leaf(px, py, a + rnd.uniform(-70, 70), rnd.uniform(38, 58), rnd.choice(palette))


# 1. the trunk: from the ground up to a fork under the crown, then a limb to the foot of every letter
ground = 2240
trunk_top = (W / 2 + 10, 1420)
roots_from = (W / 2 - 6, ground)
foot = {}
for i, ch, p in strokes:
    # the lowest point of each letter's strokes, where its limb arrives
    pp = [P(x, y) for x, y in p]
    low = max(pp, key=lambda q: q[1])
    if i not in foot or low[1] > foot[i][1]:
        foot[i] = low
branch([roots_from, (W / 2 - 2, 1900), (W / 2 + 14, 1600), trunk_top], 104, 50, BARK, 1, 6)
# roots
for k, (dx, dy) in enumerate([(-260, 40), (-150, 70), (130, 60), (280, 34), (-40, 80)]):
    branch([(W / 2 + dx * 0.15, ground - 30), (W / 2 + dx * 0.55, ground + dy * 0.4), (W / 2 + dx, ground + dy)], 34, 4, BARK, 40 + k, 2)
for i, (fx, fy) in foot.items():
    tx, ty = trunk_top
    c1 = (tx + (fx - tx) * 0.45, ty - 30)
    c2 = (fx - (fx - tx) * 0.05, fy + (ty - fy) * 0.45)
    curve = [((1 - u) ** 3 * tx + 3 * (1 - u) ** 2 * u * c1[0] + 3 * (1 - u) * u * u * c2[0] + u ** 3 * fx,
              (1 - u) ** 3 * ty + 3 * (1 - u) ** 2 * u * c1[1] + 3 * (1 - u) * u * u * c2[1] + u ** 3 * (fy + 6)) for u in [k / 30 for k in range(31)]]
    branch(curve, 40 - abs(i - 3) * 4, T * CAP * 0.95, BARK, 10 + i, 3)

# 2. the letters, as living wood (thick where they meet their limb, thinner at the tips)
tips = []
for i, ch, p in strokes:
    pp = [P(x, y) for x, y in p]
    # start each stroke from the end nearest its letter's foot, so it tapers outward like growth
    if math.hypot(pp[0][0] - foot[i][0], pp[0][1] - foot[i][1]) > math.hypot(pp[-1][0] - foot[i][0], pp[-1][1] - foot[i][1]):
        pp = pp[::-1]
    branch(pp, T * CAP * 1.05, T * CAP * 0.62, BARK, 100 + i * 7 + len(pp), 2.5)
    tips.append((i, pp))

# 3. the pruning: a wild shoot had grown out of the G, up and away past the edge of the plate. It has been sawn off
#    clean at the G (a pale cut face on the stub), and lies on the ground, its leaves turning
g_pts = [P(x, y) for i, ch, p in strokes if i == 6 for x, y in p]
gx_r = max(x for x, y in g_pts)
gy_t = min(y for x, y in g_pts)
stub0 = (gx_r - T * CAP * 0.5, gy_t + T * CAP * 0.5)
stub1 = (stub0[0] + 38, stub0[1] - 44)
branch([stub0, stub1], T * CAP * 0.7, T * CAP * 0.6, BARK, 77, 0.5)
ang = math.degrees(math.atan2(stub1[1] - stub0[1], stub1[0] - stub0[0]))
out.append(f'<ellipse cx="{stub1[0]:.1f}" cy="{stub1[1]:.1f}" rx="{T * CAP * 0.32:.1f}" ry="{T * CAP * 0.2:.1f}" fill="#e8cfa4" stroke="{BARK}" stroke-width="4" transform="rotate({ang + 90:.1f} {stub1[0]:.1f} {stub1[1]:.1f})"/>')
out.append(f'<ellipse cx="{stub1[0]:.1f}" cy="{stub1[1]:.1f}" rx="{T * CAP * 0.12:.1f}" ry="{T * CAP * 0.07:.1f}" fill="none" stroke="#b98a55" stroke-width="2" transform="rotate({ang + 90:.1f} {stub1[0]:.1f} {stub1[1]:.1f})"/>')
# the cut shoot on the ground: long, crooked, still leafy, wilting
rnd = random.Random(31)
sx, sy = W / 2 + 260, ground - 16
shoot = [(sx, sy)]
a_ = -8
for k in range(14):
    a_ += rnd.uniform(-14, 10)
    sx += 34 * math.cos(math.radians(a_))
    sy += 34 * math.sin(math.radians(a_)) * 0.35
    shoot.append((sx, min(sy, ground - 10)))
fallen = [shoot]
branch(shoot, T * CAP * 0.62, 6, BARK2, 301, 1)
fe = shoot[0]
out.append(f'<ellipse cx="{fe[0]:.1f}" cy="{fe[1]:.1f}" rx="{T * CAP * 0.2:.1f}" ry="{T * CAP * 0.3:.1f}" fill="#e8cfa4" stroke="{BARK2}" stroke-width="4"/>')

# 4. leaves: green on the growing letters, ochre where it steadies, a few red ones falling; the fallen G's leaves wilt
for i, pp in tips:
    rnd = random.Random(500 + i)
    n = 9 + rnd.randint(0, 4)
    for k in range(n):
        x, y = pp[int(rnd.uniform(0.25, 1.0) * (len(pp) - 1))]
        palette = LEAF if rnd.random() < 0.72 else OCHRE
        twig(x, y, rnd.choice([-160, -120, -90, -60, -20, 10]) + rnd.uniform(-20, 20), rnd.uniform(60, 120), 4, palette, 600 + i * 17 + k)
for k, q in enumerate(fallen):
    for j in range(5):
        x, y = q[int((j + 1) / 6 * (len(q) - 1))]
        twig(x, y, -120 + j * 30, 60, 3, OCHRE + RED, 900 + k * 7 + j)
# falling leaves, drifting down between the crown and the ground
for k in range(9):
    x = random.uniform(380, 1500)
    y = random.uniform(1150, 2150)
    leaf(x, y, random.uniform(0, 360), random.uniform(28, 40), random.choice(RED + OCHRE), 0.92)

# 5. UP-SIDE-DOWN, grown as twigs above the crown: green leaves on UP, ochre on SIDE, and DOWN letting a red leaf go
CAP2 = 128
s2, w2 = layout("UP-SIDE-DOWN", CAP2, 0.2)
ox2, base2 = (W - w2) / 2, 470
word = {0: "up", 1: "up", 3: "side", 4: "side", 5: "side", 6: "side", 8: "down", 9: "down", 10: "down", 11: "down"}
pal = {"up": LEAF, "side": OCHRE, "down": RED}
for k, (i, ch, p) in enumerate(s2):
    pp = [(ox2 + x, base2 - y) for x, y in p]
    branch(pp, T * CAP2 * 1.0, T * CAP2 * 0.7, BARK, 1000 + k, 1.2)
    w_ = word.get(i)
    if w_:
        rnd = random.Random(2000 + k)
        for j in range(2 if w_ != "down" else 1):
            x, y = pp[int(rnd.uniform(0.2, 0.95) * (len(pp) - 1))]
            leaf(x, y, rnd.uniform(-160, -20), rnd.uniform(26, 34), rnd.choice(pal[w_]))
# the red leaf DOWN lets go, mid-air below the word
leaf(ox2 + w2 * 0.86, base2 + 70, 35, 34, RED[0])

# the ground: a single drawn line, a little uneven, as in a plate
gpts = [(160 + k * 31.5, ground + 4 * math.sin(k * 0.7) + random.uniform(-2, 2)) for k in range(50)]
out.insert(0, '<path d="M ' + " L ".join(f"{x:.1f} {y:.1f}" for x, y in gpts) + f'" fill="none" stroke="{BARK}" stroke-width="4" stroke-linecap="round"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(out) + "</svg>"
open(sys.argv[1], "w").write(svg)
print("crown width", round(width), "elements", len(out))
