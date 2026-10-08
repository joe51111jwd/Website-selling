# D5 b44 lines (brief §3.3, §3.8, §7d; from gt-spike/lines.py): extract 07's blue chalk lines from the
# REGISTERED b44 mezzanine at 2.60 s, vectorise and merge them (~15 segments), find the freshly snapped line
# (blue pixels present at 2.60 s that were not there before the snap), order them, and write
# public/media/data/lines-b44.json in the registered plan frame (0..1 of 1440², x right, y down).
# Also checks the plan-cut scale gate: the hero line (0.40 x the rendered frame width) laid on the fresh line
# must upscale the 1440² still <= 1.3x at 1440x900 and <= 1.6x at 1920x1080 (else: shorten the hero line).
# usage: python -I lines.py <registered b44.mp4> <out.json> <qa.jpg>
import sys, json
import numpy as np, cv2

src, OUT, QA = sys.argv[1], sys.argv[2], sys.argv[3]
cap = cv2.VideoCapture(src); fr = {}; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    if i in (24, 36, 62): fr[i] = f
    i += 1
N = 1440
def blue(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] > 95) & (hsv[..., 0] < 128) & (hsv[..., 1] > 50) & (hsv[..., 2] > 70)).astype(np.uint8) * 255
    return cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
m62, m36 = blue(fr[62]), blue(fr[24])
# The chalk dust of the fresh snap and 07's arm defeat a purely automatic pass (Hough and projections both
# return puff stripes and miss faint runs), so the STRUCTURE is curated from the automatic pass and the
# overlay (positions in the registered frame), and every POSITION and EXTENT is then measured from the blue
# mask in a +-14 px band around it (median centreline, gap-closed runs).
CURATED = [  # axis, constant coord, from, to (normalised), name — crew order: perimeter, partition, jamb, fresh
    ('v', 0.166, 0.171, 0.832, 'perimeter west'), ('h', 0.832, 0.166, 0.660, 'perimeter south, west of the door'),
    ('h', 0.832, 0.763, 0.835, 'perimeter south, east of the door'), ('v', 0.835, 0.171, 0.832, 'perimeter east'),
    ('h', 0.171, 0.166, 0.326, 'perimeter north, west'), ('h', 0.171, 0.736, 0.835, 'perimeter north, east'),
    ('h', 0.527, 0.166, 0.290, 'partition, north face'), ('h', 0.552, 0.166, 0.278, 'partition, south face'),
    ('v', 0.290, 0.527, 0.805, 'partition, east face'), ('v', 0.278, 0.552, 0.805, 'partition, west face'),
    ('v', 0.763, 0.725, 0.832, 'door jamb'), ('h', 0.525, 0.388, 0.744, 'fresh line (snapped in the film)')]
mm = m62 > 0
def refine(ax, c, a, b):
    c, a, b = c * N, a * N, b * N; band = 14
    if ax == 'h':
        sub = mm[int(c - band):int(c + band) + 1, max(0, int(a - 40)):int(b + 40)]
        ys_, xs_ = np.nonzero(sub)
        if len(xs_) < 30: return None
        c2 = float(np.median(ys_)) + int(c - band)
        cols = np.zeros(sub.shape[1], bool); cols[np.unique(xs_)] = True
    else:
        sub = mm[max(0, int(a - 40)):int(b + 40), int(c - band):int(c + band) + 1]
        ys_, xs_ = np.nonzero(sub)
        if len(ys_) < 30: return None
        c2 = float(np.median(xs_)) + int(c - band)
        cols = np.zeros(sub.shape[0], bool); cols[np.unique(ys_)] = True
    idx = np.nonzero(cols)[0]
    # gap-closed runs (gaps < 30 px: chalk skips); the segment spans every run of >= 50 px (faint stretches
    # and the part under 07's arm are bridged), isolated specks are ignored
    rs = []; s0 = p0 = idx[0]
    for i_ in list(idx[1:]) + [10 ** 9]:
        if i_ - p0 > 30:
            if p0 - s0 >= 50: rs.append((s0, p0))
            s0 = i_
        p0 = i_
    best = (rs[0][0], rs[-1][1]) if rs else (idx[0], idx[-1])
    off = max(0, int(a - 40))
    return c2, best[0] + off, best[1] + off
out = []
for ax, c, a, b, name in CURATED:
    r = refine(ax, c, a, b)
    if r is None: continue
    c2, a2, b2 = r
    seg = {'axis': ax, 'name': name, 'len': float(b2 - a2)}
    seg['a'], seg['b'] = ([float(a2), c2], [float(b2), c2]) if ax == 'h' else ([c2, float(a2)], [c2, float(b2)])
    out.append(seg)
new = cv2.subtract(m62, cv2.dilate(m36, np.ones((5, 5), np.uint8)))
for s in out:
    n = int(max(abs(s['b'][0] - s['a'][0]), abs(s['b'][1] - s['a'][1])))
    xs = np.linspace(s['a'][0], s['b'][0], n).astype(int); ys = np.linspace(s['a'][1], s['b'][1], n).astype(int)
    band = np.zeros_like(new); cv2.line(band, (int(s['a'][0]), int(s['a'][1])), (int(s['b'][0]), int(s['b'][1])), 255, 9)
    s['freshFrac'] = float((new[band > 0] > 0).sum()) / max(1, float((m62[band > 0] > 0).sum()))
fresh = [s_ for s_ in out if s_['name'].startswith('fresh')][0]
assert fresh['freshFrac'] > 0.2, fresh['freshFrac']   # mostly new at 2.60 s (the taut string lay on the same path before the snap)
# straightness of the fresh line: perpendicular residual of its blue pixels (registration error source)
band = np.zeros_like(m62); cv2.line(band, tuple(int(v) for v in fresh['a']), tuple(int(v) for v in fresh['b']), 255, 15)
ys, xs = np.nonzero((m62 > 0) & (band > 0))
if fresh['axis'] == 'h':
    # centreline: per-column median of the stroke, so the stroke's own width is not counted as error
    cx = np.unique(xs); cy = np.array([np.median(ys[xs == c]) for c in cx])
    p = np.polyfit(cx, cy, 1); res = np.abs(cy - np.polyval(p, cx)); fy = lambda x: float(np.polyval(p, x))
    fa, fb = [fresh['a'][0], fy(fresh['a'][0])], [fresh['b'][0], fy(fresh['b'][0])]
else:
    cy = np.unique(ys); cx = np.array([np.median(xs[ys == c]) for c in cy])
    p = np.polyfit(cy, cx, 1); res = np.abs(cx - np.polyval(p, cy)); fx = lambda y: float(np.polyval(p, y))
    fa, fb = [fx(fresh['a'][1]), fresh['a'][1]], [fx(fresh['b'][1]), fresh['b'][1]]
flen = float(np.hypot(fb[0] - fa[0], fb[1] - fa[1]))
# crew order: perimeter, partition, jamb, then the fresh line (the one 07 snaps in the film)
ordered = out
gx = sorted({round(s['a'][0] / N, 3) for s in out if s['axis'] == 'v'}); gy = sorted({round(s['a'][1] / N, 3) for s in out if s['axis'] == 'h'})
def dedupe(v, tol=0.008):
    o = []
    for x in v:
        if not o or x - o[-1] > tol: o.append(x)
    return o
# plan-cut scale gate
W1440 = 1584.0; W1920 = 1920 * min(max(1920 / 1920, 1080 / 1076), min(1920 / 1920, 1080 / 1076) * 1.10)
s1440, s1920 = 0.40 * W1440 / flen, 0.40 * W1920 / flen
gate = s1440 <= 1.3 and s1920 <= 1.6
rec = min(0.40, 1.3 * flen / W1440, 1.6 * flen / W1920)
doc = {'space': 'normalised 0..1 of the registered plan frame (plan-b44, plan-b44-260; 1440², border at 120..1320), x right, y down',
       'frame': 'b44 at 2.60 s (frame 62), graded, livery-shifted, registered',
       'borderRect': [120 / N, 120 / N, 1320 / N, 1320 / N],
       'segments': [{'id': k + 1, 'order': k + 1, 'axis': s['axis'], 'fresh': s is fresh, 'name': s['name'], 'freshFrac': round(s['freshFrac'], 3),
                     'a': [round(s['a'][0] / N, 4), round(s['a'][1] / N, 4)], 'b': [round(s['b'][0] / N, 4), round(s['b'][1] / N, 4)]} for k, s in enumerate(ordered)],
       'fresh': {'a': [round(fa[0] / N, 5), round(fa[1] / N, 5)], 'b': [round(fb[0] / N, 5), round(fb[1] / N, 5)], 'lengthPx1440': round(flen, 1),
                 'straightnessResidualPx': round(float(np.percentile(res, 90)), 2)},
       'gridlines': {'x': dedupe(gx), 'y': dedupe(gy)},
       'planCut': {'heroLineFrac': 0.40, 'upscale1440x900': round(s1440, 3), 'upscale1920x1080': round(s1920, 3), 'gate': gate,
                   'maxHeroLineFrac': round(rec, 4),
                   'registrationErrorPx1440x900': {'median': round(float(np.median(res)) * s1440, 2), 'p90': round(float(np.percentile(res, 90)) * s1440, 2)}}}
json.dump(doc, open(OUT, 'w'), indent=1)
vis = (fr[62] * 0.45).astype(np.uint8)
for s in ordered:
    cv2.line(vis, tuple(int(v) for v in s['a']), tuple(int(v) for v in s['b']), (232, 152, 111) if s is not fresh else (44, 106, 240), 3)
    cv2.putText(vis, str(ordered.index(s) + 1), (int(s['a'][0]) + 4, int(s['a'][1]) - 6), cv2.FONT_HERSHEY_PLAIN, 1.6, (225, 232, 236), 2)
for x in doc['gridlines']['x']: cv2.line(vis, (int(x * N), 0), (int(x * N), N), (140, 149, 154), 1)
for y in doc['gridlines']['y']: cv2.line(vis, (0, int(y * N)), (N, int(y * N)), (140, 149, 154), 1)
cv2.imwrite(QA, np.hstack([cv2.resize(fr[62], (720, 720)), cv2.resize(vis, (720, 720))]), [cv2.IMWRITE_JPEG_QUALITY, 85])
summary = {'segments': len(ordered), 'fresh': doc['fresh'], 'planCut': doc['planCut'], 'gridlines': doc['gridlines']}
json.dump({'fresh': [doc['fresh']['a'], doc['fresh']['b']]}, open(OUT.replace('lines-b44.json', '') + '../../../pipeline/out/lines-summary.json', 'w'))
print(json.dumps(summary))
