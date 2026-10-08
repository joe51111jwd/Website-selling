# Mezzanine builder (brief §7c house rules + §5.6 grade): source clip -> graded, livery-shifted, glint-
# suppressed, crowd-crushed mezzanine, libx264 -crf 14 yuv420p, silent. Every still, depth, plate, poster
# and web encode is derived from these files, never from the raw clips.
# usage: python -I mezz.py <src> <out.mp4> [--crop x,y,w,h] [--trim a:b] [--livery box:x0,y0,x1,y1|bay]
#        [--glint x0,y0,x1,y1] [--crush depth.npy:farD] [--crushtop y0,y1] [--nograde] [--dump n,n,..:dir]
#        [--maskdump dir]
# Boxes are normalised to the SOURCE frame. Ops run on the full source frame in this order:
# livery -> glint -> grade -> crowd crush -> crop. --trim keeps frames a..b-1.
import sys, os, argparse, subprocess, json
import numpy as np, cv2

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--crop'); ap.add_argument('--trim'); ap.add_argument('--livery'); ap.add_argument('--glint')
ap.add_argument('--crush'); ap.add_argument('--crushtop'); ap.add_argument('--nograde', action='store_true')
ap.add_argument('--visor', help='x0,y0,x1,y1 source px: head box at the first kept frame; tracked, then darkened');
ap.add_argument('--dump'); ap.add_argument('--maskdump'); ap.add_argument('--crf', default='14')
a = ap.parse_args()

SLAB = np.array([10, 11, 11], np.float32) / 255.0   # #0B0B0A in BGR

def bump(h, lo, hi, soft=8.0):
    return np.clip(np.minimum(h - (lo - soft), (hi + soft) - h) / soft, 0, 1)

def grade(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)          # float: H 0..360, S 0..1, V 0..1
    h = hsv[..., 0]
    protect = np.maximum(bump(h, 200, 230), bump(h, 8, 30))
    hsv[..., 1] *= 1.0 - 0.10 * (1.0 - protect)
    f = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    return SLAB + f * (1.0 - SLAB)                      # blacks land on #0B0B0A

class VisorTrack:
    """Template-tracks the head box from frame to frame (search +-90 px) and darkens it under a feathered
    ellipse (x0.35, bright pixels clamped), so a lit visor never reads. Returns the box for QA."""
    def __init__(self, box): self.box = list(box); self.tpl = None
    def __call__(self, f):
        x0, y0, x1, y1 = self.box; w, h = x1 - x0, y1 - y0; H, W = f.shape[:2]
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        if self.tpl is None:
            self.tpl = g[y0:y1, x0:x1].copy()
        else:
            sx0, sy0 = max(0, x0 - 90), max(0, y0 - 90); sx1, sy1 = min(W, x1 + 90), min(H, y1 + 90)
            r = cv2.matchTemplate(g[sy0:sy1, sx0:sx1], self.tpl, cv2.TM_CCOEFF_NORMED)
            _, _, _, (mx, my) = cv2.minMaxLoc(r)
            x0, y0 = sx0 + mx, sy0 + my; x1, y1 = x0 + w, y0 + h; self.box = [x0, y0, x1, y1]
            self.tpl = 0.85 * self.tpl + 0.15 * g[y0:y1, x0:x1]
        m = np.zeros((H, W), np.float32)
        cv2.ellipse(m, ((x0 + x1) / 2, (y0 + y1) / 2), (w * 0.62, h * 0.62), 0, 0, 360, 1.0, -1)
        m = cv2.GaussianBlur(m, (0, 0), 10)[..., None]
        dark = np.minimum(f * 0.35, 0.16)
        return f * (1 - m) + dark * m, self.box

def border_band(shape, rect, th):
    m = np.zeros(shape[:2], np.uint8)
    (x0, y0, x1, y1) = [int(v) for v in rect]
    cv2.rectangle(m, (x0, y0), (x1, y1), 1, int(th))
    return m

def livery(f, roi):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 30) & (hsv[..., 0] <= 78) & (hsv[..., 1] >= 0.22) & (hsv[..., 2] >= 0.16)).astype(np.uint8)
    m &= roi
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.dilate(m, np.ones((3, 3), np.uint8))
    mf = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)
    hsv[..., 1] *= 1.0 - 0.92 * mf
    hsv[..., 2] *= 1.0 - 0.28 * mf
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR), m

def glint(f, box):
    H, W = f.shape[:2]
    x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
    reg = f[y0:y1, x0:x1]
    g = cv2.cvtColor(reg, cv2.COLOR_BGR2GRAY)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    th = g - cv2.morphologyEx(g, cv2.MORPH_OPEN, k)
    m = ((th > 0.16) & (g > 0.42)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        x, y, w, h, ar = st[i]
        if w <= 10 and h <= 10 and ar <= 60: keep[lab == i] = 1
    if keep.any():
        keep = cv2.dilate(keep, np.ones((5, 5), np.uint8))
        kf = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 1.5)[..., None]
        med = cv2.medianBlur((reg * 255).astype(np.uint8), 11).astype(np.float32) / 255.0
        reg[:] = reg * (1 - kf) + med * 0.85 * kf
    return f, int(keep.sum())

cap = cv2.VideoCapture(a.src); fps = cap.get(cv2.CAP_PROP_FPS) or 24
W0, H0 = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
t0, t1 = (map(int, a.trim.split(':')) if a.trim else (0, 10 ** 9))
cx, cy, cw, ch = (map(int, a.crop.split(',')) if a.crop else (0, 0, W0, H0))

roi = None
if a.livery:
    if a.livery == 'bay':
        # D7 border rect from the temporal median; everything inside the bay except a band around the tape
        fr = []; i = 0
        while True:
            ok, f = cap.read()
            if not ok: break
            if i % 6 == 0: fr.append(f)
            i += 1
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        med = np.median(np.stack(fr), axis=0).astype(np.uint8)
        hsv = cv2.cvtColor(med, cv2.COLOR_BGR2HSV)
        ym = ((hsv[..., 0] >= 14) & (hsv[..., 0] <= 36) & (hsv[..., 1] >= 70) & (hsv[..., 2] >= 70)).astype(np.float32)
        def run(p, lo, hi):
            idx = [j for j in range(lo, hi) if p[j] > 0.35]; return (idx[0], idx[-1])
        cs, rs = ym.mean(0), ym.mean(1)
        L, R_ = run(cs, 0, W0 // 3), run(cs, 2 * W0 // 3, W0); T, B = run(rs, 0, H0 // 3), run(rs, 2 * H0 // 3, H0)
        roi = np.zeros((H0, W0), np.uint8); pad = int(0.012 * W0)
        roi[T[1] + pad:B[0] - pad, L[1] + pad:R_[0] - pad] = 1
    else:
        x0, y0, x1, y1 = [float(v) for v in a.livery.split(':', 1)[1].split(',')]
        roi = np.zeros((H0, W0), np.uint8); roi[int(y0 * H0):int(y1 * H0), int(x0 * W0):int(x1 * W0)] = 1
gbox = [float(v) for v in a.glint.split(',')] if a.glint else None
vt = VisorTrack([int(v) for v in a.visor.split(',')]) if a.visor else None
vboxes = []
dep = None
if a.crush:
    p, farD = a.crush.rsplit(':', 1); farD = float(farD)
    dep = np.load(p).astype(np.float32); meta = json.load(open(p[:-4] + '.json')); dstep = meta['step']
dumps = set(); ddir = None
if a.dump:
    ns, ddir = a.dump.split(':', 1); dumps = set(int(v) for v in ns.split(',')); os.makedirs(ddir, exist_ok=True)
if a.maskdump: os.makedirs(a.maskdump, exist_ok=True)

ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{cw}x{ch}', '-r', str(fps), '-i', '-',
                       '-an', '-c:v', 'libx264', '-crf', a.crf, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out],
                      stdin=subprocess.PIPE)
i = 0; prev_m = None; stats = {'frames': 0, 'liveryPx': 0, 'glintPx': 0, 'crushMean': 0.0}
while True:
    ok, f8 = cap.read()
    if not ok or i >= t1: break
    if i < t0: i += 1; continue
    f = f8.astype(np.float32) / 255.0
    if roi is not None:
        f, lm = livery(f, roi); stats['liveryPx'] += int(lm.sum())
        if a.maskdump and i % 24 == 0: cv2.imwrite(f'{a.maskdump}/livery-{i:03d}.png', lm * 255)
    if gbox:
        f, gp = glint(f, gbox); stats['glintPx'] += gp
    if vt is not None:
        f, vb = vt(f); vboxes.append([int(v) for v in vb])
    if not a.nograde: f = grade(f)
    if dep is not None:
        k = i / dstep; k0 = min(int(k), len(dep) - 1); k1 = min(k0 + 1, len(dep) - 1); t = k - int(k)
        d = dep[k0] * (1 - t) + dep[k1] * t
        u = np.clip((farD + 0.08 - d) / 0.08, 0, 1); m = u * u * (3 - 2 * u)
        m = cv2.resize(m, (W0, H0), interpolation=cv2.INTER_LINEAR)
        m = cv2.GaussianBlur(m, (0, 0), 12)            # ~24 px feather
        if a.crushtop:
            y0, y1 = [float(v) for v in a.crushtop.split(',')]
            band = np.clip((y1 * H0 - np.arange(H0)) / max(1, (y1 - y0) * H0), 0, 1)[:, None]
            m = m * band
        m = m if prev_m is None else 0.5 * m + 0.5 * prev_m; prev_m = m
        stats['crushMean'] += float(m.mean())
        f = f * (1 - m[..., None]) + SLAB * m[..., None]
        if a.maskdump and i % 24 == 0: cv2.imwrite(f'{a.maskdump}/crush-{i:03d}.png', (m * 255).astype(np.uint8))
    elif a.crushtop:
        y0, y1 = [float(v) for v in a.crushtop.split(',')]
        band = np.clip((y1 * H0 - np.arange(H0)) / max(1, (y1 - y0) * H0), 0, 1)[:, None, None]
        f = f * (1 - band) + SLAB * band
    out = (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)[cy:cy + ch, cx:cx + cw]
    if i in dumps: cv2.imwrite(f'{ddir}/f{i:03d}.png', out)
    ff.stdin.write(out.tobytes()); stats['frames'] += 1
    i += 1
ff.stdin.close(); ff.wait()
if vboxes: stats['visorBoxes'] = vboxes[::12]
stats['crushMean'] = round(stats['crushMean'] / max(1, stats['frames']), 4)
print(os.path.basename(a.out), json.dumps(stats))
