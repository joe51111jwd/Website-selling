# D6 task-drawing trace (brief §3.7, §7d): the paper drawing taped to the floor in b43, traced to polylines.
# Traced from the REGISTERED b43 mezzanine (temporal median, so 07 never occludes it) rather than the 1024²
# t43 start still, so the trace is in exactly the plan frame the page shows it over (D6 gate: within 3 px).
# Paper = the largest bright, unsaturated region (as wild-spike/seg.py); lines = dark strokes on it,
# thinned and simplified. Output: public/media/data/trace-t43.svg (viewBox 0 0 1000 1000 = the registered
# plan frame), pencil weight, non-scaling strokes; QA overlay + residual.
# usage: python -I trace_t43.py <registered b43.mp4> <out.svg> <qa.jpg>
import sys, json
import numpy as np, cv2

src, OUT, QA = sys.argv[1], sys.argv[2], sys.argv[3]
cap = cv2.VideoCapture(src); fr = []; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    if i % 4 == 0: fr.append(f)
    i += 1
med = np.median(np.stack(fr), axis=0).astype(np.uint8); first = fr[0]
N = med.shape[0]
hsv = cv2.cvtColor(med, cv2.COLOR_BGR2HSV); g = cv2.cvtColor(med, cv2.COLOR_BGR2GRAY)
paper = ((hsv[..., 1] < 45) & (hsv[..., 2] > 150)).astype(np.uint8)
paper = cv2.morphologyEx(paper, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(paper, 8)
k = 1 + int(np.argmax(st[1:, 4])); x, y, w, h, _ = st[k]
pm = (lab == k).astype(np.uint8); pm = cv2.erode(pm, np.ones((9, 9), np.uint8))      # stay off the paper edge
# dark strokes relative to the local paper tone
bg = cv2.medianBlur(g, 31)
strokes = ((bg.astype(np.int16) - g.astype(np.int16)) > 28).astype(np.uint8) & pm
strokes = cv2.morphologyEx(strokes, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(strokes, 8)
keep = np.zeros_like(strokes)
for j in range(1, n2):
    if st2[j, 4] >= 60 and max(st2[j, 2], st2[j, 3]) >= 30: keep[lab2 == j] = 1     # drop specks and glyph-sized marks
keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
keep = (cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 1.5) > 0.5).astype(np.uint8)
skel = cv2.ximgproc.thinning(keep * 255)
cs, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
polys = []
for c in cs:
    if cv2.arcLength(c, False) < 60: continue
    a = cv2.approxPolyDP(c, 2.2, False).reshape(-1, 2)
    polys.append(a)
# residual: distance from every stroke pixel to the traced polylines (in plan px)
dr = np.zeros_like(g); [cv2.polylines(dr, [p.astype(np.int32)], False, 255, 1) for p in polys]
dist = cv2.distanceTransform(255 - dr, cv2.DIST_L2, 3)
res = dist[skel > 0]
p90 = float(np.percentile(res, 90)) if len(res) else 99.0
S1 = 1000.0 / N
paths = []
for p in polys:
    pts = ' '.join(f'{px * S1:.1f},{py * S1:.1f}' for px, py in p)
    paths.append(f'<polyline points="{pts}"/>')
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none" stroke="#9A958C" stroke-width="1.25" '
       'stroke-linecap="round" stroke-linejoin="round">\n<title>Task drawing traced from concept footage</title>\n'
       f'<g vector-effect="non-scaling-stroke" style="vector-effect:non-scaling-stroke">\n' + '\n'.join(paths) + '\n</g>\n</svg>\n')
svg = svg.replace('<polyline ', '<polyline vector-effect="non-scaling-stroke" ')
open(OUT, 'w').write(svg)
vis = (first * 0.5).astype(np.uint8)
for p in polys: cv2.polylines(vis, [p.astype(np.int32)], False, (232, 152, 111), 2)
crop = lambda im: im[max(0, y - 40):y + h + 40, max(0, x - 40):x + w + 40]
cv2.imwrite(QA, np.hstack([crop(first), crop(vis)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
print(json.dumps({'paperBox': [round(v / N, 4) for v in (x, y, x + w, y + h)], 'polylines': len(polys), 'residualP90px': round(p90, 2), 'gate3px': p90 <= 3, 'bytes': len(svg)}))
