"""PLIMSOLL: the custom display face for Scaling Up-Side-Down.

Design principle (docs/03-TYPE.md, section 3):
  The stress is turned on its Side. Every stroke is drawn by ONE rectangular nib,
  WEB wide and FLANGE tall, moved without rotating (Noordzij's "translation").
  So a stroke that travels Up comes out thin (the nib's narrow side), a stroke
  that travels Side comes out heavy (its tall side), and a brace that travels on
  a diagonal comes out in between. Ordinary type is the opposite: its verticals
  are the heavy strokes, the axis "everyone obsesses over" [BL 808]. Here the
  horizontals carry the weight, like the flanges of a steel section that has to
  hold load: "It has weight. It can hold load." [BL 814]

  Construction is exact, not sampled: a rectangle swept along a Bezier segment
  that is monotone in x and y is bounded by two translated copies of that segment
  (offset by two opposite corners of the nib) plus straight nib edges, so every
  outline is clean cubics and lines with points at the extremes.

Build:   python3 -I tools/type/build_plimsoll.py
Output:  docs/type/custom/Plimsoll-Heavy.otf, Plimsoll-Heavy.woff2, Plimsoll-Heavy.ufo
"""
import math, pathlib, shutil
from pathops import Path, op, PathOp
import ufoLib2
from fontTools.pens.roundingPen import RoundingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.bezierTools import splitCubicAtT
import ufo2ft
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "type" / "custom"

# ----------------------------------------------------------------- parameters
CAP = 700          # cap height
SX = 0.93          # every glyph is drawn wide and then narrowed by SX (keeps it off the "wide grotesk" trend)
WEB_T = 82         # weight of strokes that travel Up (verticals), after narrowing
WEB = WEB_T / SX   # ... as drawn before narrowing
FLANGE = 160       # weight of strokes that travel Side (horizontals): about 2 x WEB_T
MIDF = 142         # middle bars, a touch lighter (optical)
BRACE = 122        # target thickness of diagonals (Down)
OS = 12            # overshoot of rounds
N = 2.35           # superellipse exponent of the skeleton of rounds
UPM = 1000
ASC, DESC = 820, -200
NIB = (WEB, FLANGE)
NIBM = (WEB, MIDF)

# ----------------------------------------------------------------- path utils
BIG = 5000


def rect(x0, y0, x1, y1):
    p = Path()
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.close()
    return p


def poly(pts):
    p = Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    p.close()
    return p


def U(*ps):
    ps = [p for p in ps if p is not None]
    out = ps[0]
    for q in ps[1:]:
        out = op(out, q, PathOp.UNION)
    return op(out, out, PathOp.UNION)


def Dif(a, *bs):
    for b in bs:
        a = op(a, b, PathOp.DIFFERENCE)
    return a


def Int(a, b):
    return op(a, b, PathOp.INTERSECTION)


def band(p, y0=0, y1=CAP):
    return Int(p, rect(-BIG, y0, BIG, y1))


def transform(p, m):
    q = Path()
    p.draw(TransformPen(q.getPen(), m))
    return op(q, q, PathOp.UNION)


# ----------------------------------------------------------------- nib sweep
def _sign(v, eps=1e-6):
    return 0 if abs(v) < eps else (1 if v > 0 else -1)


def _sweep_line(p0, p1, nib):
    w, h = nib[0] / 2, nib[1] / 2
    sx, sy = _sign(p1[0] - p0[0]), _sign(p1[1] - p0[1])
    if sx == 0 or sy == 0:
        x0, x1 = sorted((p0[0], p1[0]))
        y0, y1 = sorted((p0[1], p1[1]))
        return rect(x0 - w, y0 - h, x1 + w, y1 + h)
    return _sweep_cubic(p0, p0, p1, p1, nib)


def _sweep_cubic(p0, c1, c2, p1, nib):
    """Exact Minkowski sum of a rectangle with a cubic monotone in x and y."""
    w, h = nib[0] / 2, nib[1] / 2
    sx, sy = _sign(p1[0] - p0[0]), _sign(p1[1] - p0[1])
    if sx == 0 or sy == 0:
        return _sweep_line(p0, p1, nib) if (sx == 0 and sy == 0) else _sweep_flat(p0, c1, c2, p1, nib)
    cl = (-sy * w, sx * h)            # corner that leads on the left side
    cr = (sy * w, -sx * h)            # corner that leads on the right side
    far = (sx * w, sy * h)
    back = (-sx * w, -sy * h)
    T = lambda p, c: (p[0] + c[0], p[1] + c[1])
    q = Path()
    q.moveTo(*T(p0, cl))
    q.cubicTo(*T(c1, cl), *T(c2, cl), *T(p1, cl))
    q.lineTo(*T(p1, far))
    q.lineTo(*T(p1, cr))
    q.cubicTo(*T(c2, cr), *T(c1, cr), *T(p0, cr))
    q.lineTo(*T(p0, back))
    q.close()
    return q


def _sweep_flat(p0, c1, c2, p1, nib):
    # a curve whose ends share x or y: split it in the middle (each half is monotone)
    a, b = splitCubicAtT(p0, c1, c2, p1, 0.5)
    return U(_sweep_cubic(*a, nib), _sweep_cubic(*b, nib))


def _monotone_pieces(p0, c1, c2, p1):
    ts = []
    for i in (0, 1):
        a = -p0[i] + 3 * c1[i] - 3 * c2[i] + p1[i]
        b = 2 * (p0[i] - 2 * c1[i] + c2[i])
        c = c1[i] - p0[i]
        # derivative/3 = a t^2 + b t + c
        if abs(a) < 1e-9:
            if abs(b) > 1e-9:
                ts.append(-c / b)
        else:
            disc = b * b - 4 * a * c
            if disc >= 0:
                r = math.sqrt(disc)
                ts += [(-b + r) / (2 * a), (-b - r) / (2 * a)]
    ts = sorted(t for t in ts if 1e-4 < t < 1 - 1e-4)
    return splitCubicAtT(p0, c1, c2, p1, *ts) if ts else [(p0, c1, c2, p1)]


class Pen:
    """Skeleton pen: moveTo / lineTo / curveTo / arc, each stroke swept with a nib."""

    def __init__(self, nib=NIB):
        self.nib = nib
        self.parts = []
        self.cur = None

    def move(self, x, y):
        self.cur = (x, y)
        return self

    def line(self, x, y, nib=None):
        nib = nib or self.nib
        self.parts.append(_sweep_line(self.cur, (x, y), nib))
        self.cur = (x, y)
        return self

    def curve(self, c1, c2, p, nib=None):
        nib = nib or self.nib
        for seg in _monotone_pieces(self.cur, c1, c2, p):
            self.parts.append(_sweep_cubic(*seg, nib))
        self.cur = p
        return self

    def arc(self, cx, cy, rx, ry, a, b, n=N, nib=None):
        """Superellipse arc. a, b in quarter units: 0 right, 1 top, 2 left, 3 bottom,
        4 right again (and so on). a < b runs counter-clockwise, a > b clockwise."""
        segs = arc_segments(cx, cy, rx, ry, a, b, n)
        if self.cur is None:
            self.cur = segs[0][0]
        elif math.dist(self.cur, segs[0][0]) > 0.5:
            self.line(*segs[0][0], nib=nib)
        for s in segs:
            self.curve(s[1], s[2], s[3], nib=nib)
        return self

    def path(self):
        return U(*self.parts)


def quarter(cx, cy, rx, ry, i, n=N):
    k = (2 ** (-1 / n) - 0.5) / 0.375
    i %= 4
    if i == 0:
        return ((cx + rx, cy), (cx + rx, cy + k * ry), (cx + k * rx, cy + ry), (cx, cy + ry))
    if i == 1:
        return ((cx, cy + ry), (cx - k * rx, cy + ry), (cx - rx, cy + k * ry), (cx - rx, cy))
    if i == 2:
        return ((cx - rx, cy), (cx - rx, cy - k * ry), (cx - k * rx, cy - ry), (cx, cy - ry))
    return ((cx, cy - ry), (cx + k * rx, cy - ry), (cx + rx, cy - k * ry), (cx + rx, cy))


def _sub(seg, t0, t1):
    if t0 <= 0 and t1 >= 1:
        return seg
    if t0 <= 0:
        return splitCubicAtT(*seg, t1)[0]
    if t1 >= 1:
        return splitCubicAtT(*seg, t0)[1]
    return splitCubicAtT(*seg, t0, t1)[1]


def arc_segments(cx, cy, rx, ry, a, b, n=N):
    rev = a > b
    lo, hi = (b, a) if rev else (a, b)
    segs = []
    i = math.floor(lo)
    while i < hi - 1e-9:
        t0 = max(lo - i, 0)
        t1 = min(hi - i, 1)
        if t1 - t0 > 1e-6:
            segs.append(_sub(quarter(cx, cy, rx, ry, i, n), t0, t1))
        i += 1
    if rev:
        segs = [tuple(reversed(s)) for s in reversed(segs)]
    return segs


def brace_nib(p0, p1, t=BRACE, aspect=(88, 112)):
    """Nib scaled so a straight brace from p0 to p1 is t thick (perpendicular)."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    nx, ny = abs(dy) / L, abs(dx) / L
    s = t / (nx * aspect[0] + ny * aspect[1])
    return (aspect[0] * s, aspect[1] * s)


def brace(p0, p1, t=BRACE):
    """A diagonal from p0 to p1, extended past both ends so it can be trimmed flat."""
    nib = brace_nib(p0, p1, t)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    e = 260 / L
    a = (p0[0] - dx * e, p0[1] - dy * e)
    b = (p1[0] + dx * e, p1[1] + dy * e)
    return _sweep_line(a, b, nib)


def brace_hw(p0, p1, t=BRACE):
    """Horizontal half-width of a brace (its edges are the centre line +- this)."""
    nw, nh = brace_nib(p0, p1, t)
    return nw / 2 + nh / 2 * abs(p1[0] - p0[0]) / abs(p1[1] - p0[1])


def above_line(p0, p1):
    """Half-plane above the infinite line through p0 and p1."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    a = (p0[0] - dx * 50, p0[1] - dy * 50)
    b = (p0[0] + dx * 50, p0[1] + dy * 50)
    left, right = (a, b) if a[0] < b[0] else (b, a)
    return poly([left, right, (right[0], BIG), (left[0], BIG)])


def x_at(p0, p1, y):
    return p0[0] + (p1[0] - p0[0]) * (y - p0[1]) / (p1[1] - p0[1])


# ----------------------------------------------------------------- glyph table
G = {}            # name -> (unicodes, path, lsb, rsb)
w2, h2 = WEB / 2, FLANGE / 2
TOP, BOT = CAP - h2, h2                 # skeleton y of top and bottom flanges
MIDY = 356                              # skeleton y of middle bars


def narrow(p):
    return None if p is None else transform(p, (SX, 0, 0, 1, 0, 0))


def glyph(name, uni, lsb, rsb):
    def deco(fn):
        G[name] = (uni, narrow(fn()), lsb, rsb)
        return fn
    return deco


def stem(x, y0=0, y1=CAP, w=WEB):
    return rect(x, y0, x + w, y1)


def bar(x0, x1, yc, t=FLANGE):
    return rect(x0, yc - t / 2, x1, yc + t / 2)


def round_box(x0, x1, y0=-OS, y1=CAP + OS):
    """Skeleton ellipse (cx, cy, rx, ry) whose swept outline fills the box."""
    return ((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0 - WEB) / 2, (y1 - y0 - FLANGE) / 2)


# --- straight capitals -------------------------------------------------------
@glyph("H", [0x48], 62, 62)
def _H():
    w = 540
    return U(stem(0), stem(w - WEB), bar(0, w, MIDY, MIDF))


@glyph("I", [0x49], 40, 40)
def _I():
    # an I-beam: two flanges and a web
    w = 290
    return U(stem(w / 2 - w2), bar(0, w, TOP), bar(0, w, BOT))


@glyph("E", [0x45], 62, 34)
def _E():
    return U(stem(0), bar(0, 436, TOP), bar(0, 404, MIDY, MIDF), bar(0, 450, BOT))


@glyph("F", [0x46], 62, 30)
def _F():
    return U(stem(0), bar(0, 436, TOP), bar(0, 404, MIDY - 14, MIDF))


@glyph("L", [0x4C], 62, 22)
def _L():
    return U(stem(0), bar(0, 430, BOT))


@glyph("T", [0x54], 20, 20)
def _T():
    w = 520
    return U(bar(0, w, TOP), stem(w / 2 - w2))


# --- rounds -------------------------------------------------------------------
NO, NI = 2.2, 2.6   # superellipse exponents: outer contour, counter (squarer inside)


def se(x0, y0, x1, y1, n=NO):
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    k = (2 ** (-1 / n) - 0.5) / 0.375
    p = Path()
    p.moveTo(x1, cy)
    p.cubicTo(x1, cy + k * ry, cx + k * rx, y1, cx, y1)
    p.cubicTo(cx - k * rx, y1, x0, cy + k * ry, x0, cy)
    p.cubicTo(x0, cy - k * ry, cx - k * rx, y0, cx, y0)
    p.cubicTo(cx + k * rx, y0, x1, cy - k * ry, x1, cy)
    p.close()
    return p


def ring(x0, y0, x1, y1, tb=FLANGE, tt=FLANGE, tl=WEB, tr=WEB):
    """A round whose sides are web-thin and whose top and bottom are flange-thick:
    the same rule as the straight strokes, so the contrast is one system."""
    return Dif(se(x0, y0, x1, y1, NO), se(x0 + tl, y0 + tb, x1 - tr, y1 - tt, NI))


def right_bowl(x0, xr, y0, y1, rx, tb=FLANGE, tt=FLANGE):
    """Flat top and bottom from x0, turning through the right half of a ring."""
    cx = xr - rx
    r = Int(ring(xr - 2 * rx, y0, xr, y1, tb, tt), rect(cx, -BIG, BIG, BIG))
    return U(r, rect(x0, y0, cx + 1, y0 + tb), rect(x0, y1 - tt, cx + 1, y1))


@glyph("O", [0x4F], 42, 42)
def _O():
    return ring(0, -OS, 630, CAP + OS)


@glyph("Q", [0x51], 42, -36)
def _Q():
    # the tail is a brace (Down) that crosses the bowl and overhangs the next letter
    o = ring(0, -OS, 630, CAP + OS)
    tail = band(brace((410, 170), (640, -50), BRACE), -96, 230)
    tail = Dif(tail, se(WEB, -OS + FLANGE, 630 - WEB, CAP + OS - FLANGE, NI))
    return U(o, tail)


@glyph("C", [0x43], 42, 30)
def _C():
    w = 626
    return Dif(ring(0, -OS, w, CAP + OS), rect(w * 0.81, -BIG, BIG, BIG))


@glyph("G", [0x47], 42, 54)
def _G():
    w = 632
    yb = 300
    o = Dif(ring(0, -OS, w, CAP + OS), rect(w * 0.80, yb + MIDF / 2, BIG, BIG))
    return U(o, bar(w * 0.50, w, yb, MIDF))


@glyph("D", [0x44], 62, 42)
def _D():
    return U(stem(0), right_bowl(0, 604, 0, CAP, 380))


@glyph("P", [0x50], 62, 34)
def _P():
    y0 = MIDY - MIDF / 2 - 26
    return U(stem(0), right_bowl(0, 548, y0, CAP, 250, tb=MIDF))


@glyph("R", [0x52], 62, 16)
def _R():
    y0 = MIDY - MIDF / 2 - 20
    b = right_bowl(0, 540, y0, CAP, 246, tb=MIDF)
    leg = band(brace((300, y0 + MIDF / 2), (556, -10)), 0, y0 + 20)
    leg = Int(leg, rect(250, -BIG, 600, BIG))
    return U(stem(0), b, leg)


@glyph("B", [0x42], 62, 42)
def _B():
    ym = MIDY + 8
    up = right_bowl(0, 532, ym - MIDF / 2, CAP, 232, tb=MIDF)
    lo = right_bowl(0, 572, 0, ym + MIDF / 2, 254, tt=MIDF)
    return U(stem(0), up, lo)


@glyph("U", [0x55], 62, 62)
def _U():
    w = 580
    cy = 300
    bowl = Int(ring(0, -OS, w, 2 * cy + OS), rect(-BIG, -BIG, BIG, cy))
    return U(bowl, stem(0, cy - 1, CAP), stem(w - WEB, cy - 1, CAP))


@glyph("J", [0x4A], 24, 62)
def _J():
    w = 480
    cy = 286
    bowl = Int(ring(0, -OS, w, 2 * cy + OS), rect(w * 0.16, -BIG, BIG, cy))
    return U(bowl, stem(w - WEB, cy - 1, CAP), bar(w - WEB - 160, w, TOP))


@glyph("S", [0x53], 40, 40)
def _S():
    w = 560
    top, bot = CAP + OS, -OS
    ys, ts = 378, FLANGE - 8           # spine centre and thickness
    inset = 18                         # upper bowl is narrower
    up = ring(inset, ys - ts / 2, w - inset, top, tb=ts)
    lo = ring(0, bot, w, ys + ts / 2, tt=ts)
    cx = w / 2
    cyu = (ys - ts / 2 + top) / 2
    cyl = (bot + ys + ts / 2) / 2
    up = Dif(up, rect(cx, -BIG, BIG, cyu))                 # lower-right quarter goes
    up = Dif(up, rect(w * 0.80, cyu - 1, BIG, BIG))        # upper terminal, cut upright
    lo = Dif(lo, rect(-BIG, cyl, cx, BIG))                 # upper-left quarter goes
    lo = Dif(lo, rect(-BIG, -BIG, w * 0.19, cyl + 1))      # lower terminal, cut upright
    return U(up, lo)


# --- diagonals ----------------------------------------------------------------
@glyph("A", [0x41], 16, 16)
def _A():
    w = 640
    c = w / 2
    apex_y = CAP
    l0, l1 = (60, 0), (c - 8, apex_y)
    r0, r1 = (w - 60, 0), (c + 8, apex_y)
    body = band(U(brace(l0, l1), brace(r0, r1)))
    body = Int(body, rect(0, -BIG, w, BIG))
    yb = 214
    xl = x_at(l0, l1, yb) - 20
    xr = x_at(r0, r1, yb) + 20
    return U(body, bar(xl, xr, yb, MIDF))


@glyph("V", [0x56], 16, 16)
def _V():
    w = 620
    c = w / 2
    body = band(U(brace((c - 8, 0), (58, CAP)), brace((c + 8, 0), (w - 58, CAP))))
    return Int(body, rect(0, -BIG, w, BIG))


@glyph("W", [0x57], 14, 14)
def _W():
    w = 920
    t = BRACE * 0.94
    q = w / 4
    hm = CAP * 0.80                      # the middle apex stops short of the cap line
    s = [brace((q - 6, 0), (50, CAP), t), brace((q + 6, 0), (w / 2 - 8, hm), t),
         brace((3 * q - 6, 0), (w / 2 + 8, hm), t), brace((3 * q + 6, 0), (w - 50, CAP), t)]
    body = band(U(*s), 0, CAP)
    body = Dif(body, rect(q + 60, hm, 3 * q - 60, BIG))
    return Int(body, rect(0, -BIG, w, BIG))


@glyph("X", [0x58], 16, 16)
def _X():
    w = 600
    body = band(U(brace((54, 0), (w - 54, CAP)), brace((w - 54, 0), (54, CAP))))
    return Int(body, rect(0, -BIG, w, BIG))


@glyph("Y", [0x59], 16, 16)
def _Y():
    w = 610
    c = w / 2
    yj = 300
    pl0, pl1 = (c - 2, yj), (52, CAP)
    pr0, pr1 = (c + 2, yj), (w - 52, CAP)
    la = Int(brace(pl0, pl1), rect(-BIG, -BIG, c + w2, BIG))
    ra = Int(brace(pr0, pr1), rect(c - w2, -BIG, BIG, BIG))
    arms = band(U(la, ra), 0, CAP)
    arms = Int(arms, rect(0, -BIG, w, BIG))
    # below the point where the outer edges of the arms meet the stem's edges,
    # only the stem's column survives, so arm and web join without shoulders
    hw = brace_hw(pl0, pl1)
    e0, e1 = (c - 2 - hw, yj), (52 - hw, CAP)
    ye = e0[1] + (c - w2 - e0[0]) * (e1[1] - e0[1]) / (e1[0] - e0[0])
    arms = Dif(arms, rect(-BIG, -BIG, c - w2, ye), rect(c + w2, -BIG, BIG, ye))
    return U(arms, stem(c - w2, 0, yj + 40))


@glyph("K", [0x4B], 62, 16)
def _K():
    w = 566
    a0, a1 = (WEB - 30, 236), (w - 56, CAP)
    arm = band(brace(a0, a1), 100, CAP)
    # the leg starts on the arm's centre line and is cut away above it
    yl = 352
    l0 = (x_at(a0, a1, yl), yl)
    leg = band(brace(l0, (w - 50, 0)), 0, CAP)
    leg = Dif(leg, above_line(a0, a1))
    body = Int(U(arm, leg), rect(WEB - 4, -BIG, w, BIG))
    return U(stem(0), body)


@glyph("N", [0x4E], 62, 62)
def _N():
    w = 580
    d = band(brace((w - WEB + 4, 0), (WEB - 4, CAP)))
    d = Int(d, rect(0, -BIG, w, BIG))
    return U(stem(0), stem(w - WEB), d)


@glyph("M", [0x4D], 62, 62)
def _M():
    w = 744
    c = w / 2
    t = BRACE * 0.94
    d = band(U(brace((c - 4, 0), (WEB - 14, CAP), t), brace((c + 4, 0), (w - WEB + 14, CAP), t)))
    d = Int(d, rect(0, -BIG, w, BIG))
    return U(stem(0), stem(w - WEB), d)


@glyph("Z", [0x5A], 28, 28)
def _Z():
    w = 530
    d = band(brace((44, BOT - 20), (w - 44, TOP + 20)), FLANGE - 2, CAP - FLANGE + 2)
    return U(bar(6, w - 10, TOP), bar(0, w, BOT), Int(d, rect(0, -BIG, w, BIG)))


# ----------------------------------------------------------------- figures
FIG = 530   # tabular advance: readouts that change on scroll do not jitter


def fig(name, uni):
    def deco(fn):
        p = narrow(fn())
        b = p.bounds
        w = b[2] - b[0]
        lsb = (FIG - w) / 2
        G[name] = (uni, transform(p, (1, 0, 0, 1, -b[0], 0)), lsb, FIG - w - lsb)
        return fn
    return deco


@fig("zero", [0x30])
def _0():
    return ring(0, -OS, 486, CAP + OS)


@fig("one", [0x31])
def _1():
    c = 210
    return U(stem(c - w2), rect(c - w2 - 128, CAP - MIDF, c, CAP), bar(56, 364, BOT))


@fig("two", [0x32])
def _2():
    w = 486
    y0 = 292
    top = CAP + OS
    outer = se(0, y0, w, top, NO)
    inner = se(WEB, y0 + MIDF, w - WEB, top - FLANGE, NI)
    r = Dif(outer, inner)
    cx, cy = w / 2, (y0 + top) / 2
    hook = U(Int(r, rect(w * 0.20, cy, BIG, BIG)), Int(r, rect(w - WEB - 40, cy - 90, BIG, cy + 1)))
    d0, d1 = (66, FLANGE - 40), (w - 64, cy - 10)
    d = band(brace(d0, d1), FLANGE - 2, top)
    d = Int(d, U(outer, rect(-BIG, -BIG, BIG, cy - 40)))
    d = Dif(d, inner)
    d = Int(d, rect(0, -BIG, w, BIG))
    return U(hook, d, bar(0, w, BOT))


@fig("three", [0x33])
def _3():
    w = 476
    ym = 380
    up = ring(26, ym - MIDF / 2, w - 24, CAP + OS, tb=MIDF)
    lo = ring(0, -OS, w, ym + MIDF / 2, tt=MIDF)
    cxu, cyu = (26 + w - 24) / 2, (ym - MIDF / 2 + CAP + OS) / 2
    cxl, cyl = w / 2, (-OS + ym + MIDF / 2) / 2
    up = Dif(up, rect(-BIG, -BIG, cxu, cyu))                  # lower-left quarter goes
    up = Dif(up, rect(-BIG, cyu - 1, w * 0.20, BIG))          # upper terminal
    lo = Dif(lo, rect(-BIG, cyl, cxl, BIG))                   # upper-left quarter goes
    lo = Dif(lo, rect(-BIG, -BIG, w * 0.18, cyl + 1))         # lower terminal
    mid = bar(w * 0.30, cxl + 2, ym, MIDF)
    return U(up, lo, mid)


@fig("four", [0x34])
def _4():
    w = 510
    xs = 336
    yb = 200
    p0, p1 = (0, yb + MIDF / 2), (xs + WEB, CAP)
    hw = brace_hw(p0, p1)
    d0, d1 = (p0[0] + hw, p0[1]), (p1[0] - hw, p1[1])
    d = band(brace(d0, d1), yb, CAP)
    d = Int(d, rect(0, -BIG, xs + WEB, BIG))
    return U(stem(xs), bar(0, w, yb, MIDF), d)


@fig("five", [0x35])
def _5():
    w = 482
    yt = 460
    top = yt + MIDF / 2 + 6
    r = ring(0, -OS, w, top, tt=MIDF)
    cx, cy = w / 2, (-OS + top) / 2
    bowl = U(Int(r, rect(cx, -BIG, BIG, BIG)), Int(r, rect(w * 0.18, -BIG, cx + 1, cy)))
    return U(bowl, rect(40, top - MIDF, cx + 1, top), stem(40, top - MIDF, CAP), bar(40, w - 8, TOP))


@fig("six", [0x36])
def _6():
    w = 492
    yt = 474
    bowl = ring(0, -OS, w, yt, tt=MIDF)
    cyb = (-OS + yt) / 2
    top = CAP + OS
    # the upper stroke shares the bowl's left tangent at the bowl's centre height
    big = ring(0, 2 * cyb - top, w * 1.02, top)
    arc = Int(big, rect(-BIG, cyb, w * 0.80, BIG))
    return U(bowl, arc)


@fig("nine", [0x39])
def _9():
    p = _6()
    b = p.bounds
    return transform(p, (-1, 0, 0, -1, b[2] + b[0], CAP))


@fig("seven", [0x37])
def _7():
    w = 476
    d = band(brace((150, -20), (w - 40, TOP + 30)), 0, CAP - FLANGE + 2)
    d = Int(d, rect(0, -BIG, w, BIG))
    return U(bar(0, w, TOP), d)


@fig("eight", [0x38])
def _8():
    w = 496
    ym = 386
    return U(ring(30, ym - MIDF / 2, w - 30, CAP + OS, tb=MIDF), ring(0, -OS, w, ym + MIDF / 2, tt=MIDF))


# ----------------------------------------------------------------- punctuation
DOTW = 132      # one touch of the nib, moved a little Side: 132 x 150


def dot(x=0, y=0):
    return rect(x, y, x + DOTW, y + FLANGE)


@glyph("period", [0x2E], 52, 52)
def _period():
    return dot()


@glyph("comma", [0x2C], 52, 40)
def _comma():
    tail = Int(brace((DOTW - 30, 60), (DOTW - 110, -170), 96), rect(-BIG, -170, DOTW, 80))
    return U(dot(), tail)


@glyph("colon", [0x3A], 52, 52)
def _colon():
    return U(dot(), dot(0, 450))


@glyph("semicolon", [0x3B], 52, 40)
def _semicolon():
    return U(_comma(), dot(0, 450))


@glyph("hyphen", [0x2D, 0x2010], 36, 36)
def _hyphen():
    # the hyphen is pure Side: one flange, the joint of Up-Side-Down
    return bar(0, 290, MIDY - 6)


@glyph("endash", [0x2013], 30, 30)
def _endash():
    return bar(0, 520, MIDY - 6, MIDF)


@glyph("emdash", [0x2014], 0, 0)
def _emdash():
    return bar(0, 1000, MIDY - 6, MIDF)


@glyph("quoteright", [0x2019, 0x27], 54, 54)
def _quoteright():
    tail = Int(brace((DOTW - 30, CAP - 90), (DOTW - 100, CAP - 300), 92), rect(-BIG, CAP - 300, DOTW, CAP - 60))
    return U(rect(0, CAP - FLANGE, DOTW, CAP), tail)


@glyph("quoteleft", [0x2018], 54, 54)
def _quoteleft():
    p = _quoteright()
    b = p.bounds
    return transform(p, (-1, 0, 0, -1, b[0] + b[2], b[1] + b[3]))


@glyph("exclam", [0x21], 58, 58)
def _exclam():
    c = DOTW / 2
    s = rect(c - w2, 240, c + w2, CAP)
    return U(dot(), s)


@glyph("question", [0x3F], 34, 40)
def _question():
    w = 446
    y0 = 300
    r = ring(0, y0, w, CAP + OS, tb=MIDF)
    cx, cy = w / 2, (y0 + CAP + OS) / 2
    hook = U(Int(r, rect(w * 0.20, cy, BIG, BIG)), Int(r, rect(cx - w2, -BIG, BIG, cy + 1)))
    s = stem(cx - w2, 250, y0 + MIDF)
    return U(hook, s, dot(cx - DOTW / 2, 0))


@glyph("slash", [0x2F], 12, 12)
def _slash():
    w = 380
    return Int(band(brace((40, -60), (w - 40, CAP + 60), BRACE * 0.9), -60, CAP + 60), rect(0, -BIG, w, BIG))


@glyph("equal", [0x3D], 42, 42)
def _equal():
    w, g = 470, 72
    return U(bar(0, w, MIDY - 6 + g / 2 + MIDF / 2, MIDF), bar(0, w, MIDY - 6 - g / 2 - MIDF / 2, MIDF))


@glyph("plus", [0x2B], 42, 42)
def _plus():
    w = 470
    return U(bar(0, w, MIDY - 6, MIDF), rect(w / 2 - w2, MIDY - 6 - w / 2, w / 2 + w2, MIDY - 6 + w / 2))


@glyph("greater", [0x3E], 46, 46)
def _greater():
    w = 440
    y = MIDY - 6
    a = brace((0, y + 200), (w, y), BRACE)
    b = brace((0, y - 200), (w, y), BRACE)
    p = U(a, b)
    p = Int(p, rect(0, y - 270, w, y + 270))
    # flat right point
    return Dif(p, rect(w - 10, -BIG, BIG, BIG))


@glyph("less", [0x3C], 46, 46)
def _less():
    p = _greater()
    b = p.bounds
    return transform(p, (-1, 0, 0, 1, b[0] + b[2], 0))


@glyph("periodcentered", [0xB7], 52, 52)
def _periodcentered():
    return rect(0, MIDY - 6 - FLANGE / 2, DOTW, MIDY - 6 + FLANGE / 2)


@glyph("bracketleft", [0x5B, 0x28], 60, 20)
def _bracketleft():
    # a channel section: one web, two flanges (also used for the parenthesis)
    return U(rect(0, -110, WEB, CAP + 50), rect(0, -110, 230, -110 + FLANGE), rect(0, CAP + 50 - FLANGE, 230, CAP + 50))


@glyph("bracketright", [0x5D, 0x29], 20, 60)
def _bracketright():
    p = _bracketleft()
    b = p.bounds
    return transform(p, (-1, 0, 0, 1, b[0] + b[2], 0))


@glyph("quotedbl", [0x22, 0x201C, 0x201D], 54, 54)
def _quotedbl():
    return U(rect(0, CAP - 230, WEB, CAP), rect(WEB + 70, CAP - 230, 2 * WEB + 70, CAP))


@glyph("space", [0x20], 0, 0)
def _space():
    return None


# ----------------------------------------------------------------- build
KERN = [
    ("A", "V", -52), ("A", "W", -40), ("A", "Y", -60), ("A", "T", -50),
    ("V", "A", -52), ("W", "A", -40), ("Y", "A", -60), ("T", "A", -50),
    ("L", "T", -64), ("L", "V", -54), ("L", "W", -40), ("L", "Y", -64), ("L", "quoteright", -80),
    ("P", "A", -44), ("F", "A", -36), ("P", "period", -90), ("F", "period", -80),
    ("T", "period", -70), ("V", "period", -70), ("W", "period", -50), ("Y", "period", -80),
    ("T", "comma", -70), ("V", "comma", -70), ("Y", "comma", -80),
    ("T", "O", -16), ("O", "T", -16), ("T", "C", -16), ("O", "A", -20), ("A", "O", -20),
    ("O", "V", -16), ("V", "O", -16), ("O", "Y", -24), ("Y", "O", -24), ("O", "X", -14), ("X", "O", -14),
    ("D", "A", -20), ("A", "C", -18), ("A", "G", -18), ("A", "Q", -18),
    ("hyphen", "T", -30), ("T", "hyphen", -30), ("hyphen", "S", -8),
    ("K", "O", -22), ("R", "Y", -22), ("R", "V", -18), ("R", "T", -14),
    ("C", "I", 8), ("E", "X", 0), ("L", "E", 0), ("one", "one", -24),
]


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    ufo = ufoLib2.Font()
    info = ufo.info
    info.familyName = "Plimsoll"
    info.styleName = "Heavy"
    info.styleMapFamilyName = "Plimsoll Heavy"
    info.styleMapStyleName = "regular"
    info.openTypeNamePreferredFamilyName = "Plimsoll"
    info.openTypeNamePreferredSubfamilyName = "Heavy"
    info.openTypeOS2WeightClass = 800
    info.versionMajor, info.versionMinor = 0, 900
    info.unitsPerEm = UPM
    info.capHeight = CAP
    info.xHeight = CAP
    info.ascender = ASC
    info.descender = DESC
    info.openTypeHheaAscender = ASC + 60
    info.openTypeHheaDescender = DESC - 40
    info.openTypeHheaLineGap = 0
    info.openTypeOS2TypoAscender = ASC
    info.openTypeOS2TypoDescender = DESC
    info.openTypeOS2TypoLineGap = 200
    info.openTypeOS2WinAscent = ASC + 60
    info.openTypeOS2WinDescent = -DESC + 40
    info.copyright = "Copyright 2026 the Scaling Up-Side-Down homepage project."
    info.openTypeNameDesigner = "SUSD homepage project, drawn in code (fontTools, skia-pathops, ufo2ft)"
    info.openTypeNameDescription = ("Caps-only display face with its stress turned on its Side: one "
                                    "rectangular nib, thin when it travels Up, heavy when it travels Side.")
    info.openTypeNameLicense = ("Licensed under the SIL Open Font License, Version 1.1. "
                                "This license is available with a FAQ at: https://openfontlicense.org")
    info.openTypeNameLicenseURL = "https://openfontlicense.org"
    info.postscriptFontName = "Plimsoll-Heavy"
    info.postscriptUnderlinePosition = -120
    info.postscriptUnderlineThickness = 60
    info.openTypeOS2Type = []

    nd = ufo.newGlyph(".notdef")
    nd.width = 500
    Dif(rect(50, 0, 450, CAP), rect(50 + WEB, FLANGE, 450 - WEB, CAP - FLANGE)).draw(RoundingPen(nd.getPen()))

    for name, (uni, p, lsb, rsb) in G.items():
        g = ufo.newGlyph(name)
        g.unicodes = list(uni)
        if p is None:
            g.width = 240
            continue
        b = p.bounds
        q = transform(p, (1, 0, 0, 1, lsb - b[0], 0))
        q.draw(RoundingPen(g.getPen()))
        g.width = round(lsb + (b[2] - b[0]) + rsb)

    # caps-only: lowercase letters map to the capitals
    for c in range(ord("a"), ord("z") + 1):
        up = chr(c).upper()
        if up in ufo:
            ufo[up].unicodes = ufo[up].unicodes + [c]

    fea = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "feature kern {"]
    fea += [f"  pos {a} {b} {v};" for a, b, v in KERN if a in ufo and b in ufo and v]
    fea.append("} kern;")
    ufo.features.text = "\n".join(fea) + "\n"

    ufo_path = OUT / "Plimsoll-Heavy.ufo"
    if ufo_path.exists():
        shutil.rmtree(ufo_path)
    ufo.save(ufo_path)
    otf = ufo2ft.compileOTF(ufo, removeOverlaps=False, optimizeCFF=1)
    otf_path = OUT / "Plimsoll-Heavy.otf"
    otf.save(otf_path)
    f = TTFont(otf_path)
    f.flavor = "woff2"
    f.save(OUT / "Plimsoll-Heavy.woff2")
    print("built", otf_path, "glyphs:", len(ufo))


if __name__ == "__main__":
    build()
