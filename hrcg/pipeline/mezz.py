# Mezzanine builder (brief §7c house rules + §5.6 grade): source clip -> graded, livery-shifted, glint-
# suppressed, crowd-crushed mezzanine, libx264 -crf 14 yuv420p, silent. Every still, depth, plate, poster
# and web encode is derived from these files, never from the raw clips.
# usage: python -I mezz.py <src> <out.mp4> [--crop x,y,w,h] [--trim a:b] [--livery box:x0,y0,x1,y1|bay]
#        [--glint x0,y0,x1,y1] [--crush depth.npy:farD] [--crushtop y0,y1] [--nograde] [--dump n,n,..:dir]
#        [--maskdump dir] [--crushmode 2] [--studs x0]
# --crushmode 2 (FIXLIST-1 F-009 / F-047): keep the near side (07, the board, the set) whole: its depth matte is
#   eroded 3 px (the lit haze rim goes with the background) and feathered OUTWARD only (σ 1.5 px), the
#   background is crushed fully to #0B0B0A in linear light, and the clip's own grain is re-added there.
# --livery2 RULES (FIXLIST-1 F-048 / F-049): orange/red power-tool bodies -> graphite inside per-clip, per-frame-range
#   ROIs, so 07's own orange shoulder pads stay untouched. RULES = rule|rule|..., rule = key=value;... with
#   hue=lo-hi (degrees, may wrap: 345-15), box=x0,y0,x1,y1 (normalised source), frames=a-b, nopads (exclude 07's
#   pads: large compact 15-30 deg blobs, grown 9 px), label (also smudge bright unsaturated label pixels inside the
#   tool's own extent, e.g. the b41 battery label).
# --smudge x0,y0,x1,y1[;...] (F-049): blur generated pseudo-lettering inside fixed source boxes (feathered ellipse),
#   e.g. the c34 tape-housing face; runs after the livery shift, before the grade.
# --studs x0: (c31) everything behind the stud plane right of x0 (normalised): gap columns between studs (dark in
#   the clip's temporal median) are crushed wherever a pixel is darker than the steel, warm, or a small light.
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
ap.add_argument('--crushmode', type=int, default=1); ap.add_argument('--studs', type=float); ap.add_argument('--livery2'); ap.add_argument('--smudge')
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
        cv2.ellipse(m, (int((x0 + x1) / 2), int((y0 + y1) / 2)), (int(w * 0.62), int(h * 0.62)), 0, 0, 360, 1.0, -1)
        m = cv2.GaussianBlur(m, (0, 0), 10)[..., None]
        dark = np.minimum(f * 0.35, 0.16)
        return f * (1 - m) + dark * m, self.box

def border_band(shape, rect, th):
    m = np.zeros(shape[:2], np.uint8)
    (x0, y0, x1, y1) = [int(v) for v in rect]
    cv2.rectangle(m, (x0, y0), (x1, y1), 1, int(th))
    return m

LOOSE = False
def livery(f, roi):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    if LOOSE:   # a tight ROI box around one known tool: also catch the shadowed / dust-lit (low-sat, 20-30 deg) yellow
        m = ((hsv[..., 0] >= 22) & (hsv[..., 0] <= 80) & (hsv[..., 1] >= 0.12) & (hsv[..., 2] >= 0.08)).astype(np.uint8)
    else:
        m = ((hsv[..., 0] >= 30) & (hsv[..., 0] <= 78) & (hsv[..., 1] >= 0.22) & (hsv[..., 2] >= 0.16)).astype(np.uint8)
    m &= roi
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    if LOOSE:
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(m, 8)
        Hh, Ww = m.shape
        # keep the tool (body + blade); drop specks and the long thin orange floor marking running through the box
        m = np.isin(lab_, [i for i in range(1, n_) if st_[i, 4] >= 40 and not (st_[i, 2] >= 0.12 * Ww and st_[i, 3] <= 0.035 * Hh)]).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5) if LOOSE else (3, 3), np.uint8))
    mf = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)
    hsv[..., 1] *= 1.0 - (0.97 if LOOSE else 0.92) * mf
    hsv[..., 2] *= 1.0 - 0.28 * mf
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR), m

def parse_rules(spec):
    out = []
    for r in spec.split('|'):
        d = {}
        for kv in r.split(';'):
            if not kv: continue
            k, _, v = kv.partition('=')
            d[k] = v if v else True
        lo, hi = [float(x) for x in d['hue'].split('-')]
        out.append({'hue': (lo, hi), 'box': [float(x) for x in d['box'].split(',')],
                    'frames': [int(x) for x in d['frames'].split('-')] if 'frames' in d else [0, 10 ** 9],
                    'nopads': 'nopads' in d, 'label': 'label' in d})
    return out
def livery2(f, rules, i):
    H, W = f.shape[:2]; hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV); h, sa, va = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    tot = np.zeros((H, W), np.uint8); pads = None; lab_m = np.zeros((H, W), np.uint8)
    for r in rules:
        if not (r['frames'][0] <= i <= r['frames'][1]): continue
        lo, hi = r['hue']
        hm = ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
        m = (hm & (sa >= 0.30) & (va >= 0.12)).astype(np.uint8)
        x0, y0, x1, y1 = r['box']; bx = np.zeros_like(m); bx[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = 1; m &= bx
        if r['nopads']:
            if pads is None:
                pm = ((h >= 15) & (h <= 30) & (sa >= 0.45) & (va >= 0.25)).astype(np.uint8)
                pm = cv2.morphologyEx(pm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
                n_, lb_, st_, _ = cv2.connectedComponentsWithStats(pm, 8)
                big = [j for j in range(1, n_) if st_[j, 4] >= 0.0015 * W * H and st_[j, 4] >= 0.45 * st_[j, 2] * st_[j, 3]]
                pads = cv2.dilate(np.isin(lb_, big).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
            m &= (1 - pads)
        n_, lb_, st_, _ = cv2.connectedComponentsWithStats(m, 8)
        m = np.isin(lb_, [j for j in range(1, n_) if st_[j, 4] >= 20]).astype(np.uint8)
        tot |= m
        if r['label'] and m.any():
            ext = cv2.dilate(m, np.ones((25, 25), np.uint8)) & bx
            lab_m |= (ext.astype(bool) & (sa < 0.22) & (va > 0.55)).astype(np.uint8)
    if tot.any():
        mm = cv2.dilate(tot, np.ones((3, 3), np.uint8)); mf = cv2.GaussianBlur(mm.astype(np.float32), (0, 0), 1.6)
        hsv[..., 1] *= 1.0 - 0.97 * mf; hsv[..., 2] *= 1.0 - 0.28 * mf
        f = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    if lab_m.any():   # pseudo-text label: smudge to the surrounding tone (heavy local blur, darkened)
        lm = cv2.GaussianBlur(cv2.dilate(lab_m, np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 2.0)[..., None]
        bl = cv2.GaussianBlur(f, (0, 0), 9) * 0.8
        f = f * (1 - lm) + bl * lm
    return f, tot, lab_m

def glint(f, box):
    """Tracked-by-detection visor fix: small, bright, WHITE (unsaturated) points inside the head path box are
    found per frame with a top-hat and replaced by a darkened median of their surroundings.
    box = x0,y0,x1,y1[,maxsize px]."""
    H, W = f.shape[:2]
    ms = int(box[4]) if len(box) > 4 else 10
    x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
    reg = f[y0:y1, x0:x1]
    g = cv2.cvtColor(reg, cv2.COLOR_BGR2GRAY)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    th = g - cv2.morphologyEx(g, cv2.MORPH_OPEN, k)
    sat = cv2.cvtColor(reg, cv2.COLOR_BGR2HSV)[..., 1]
    m = ((th > 0.16) & (g > 0.42) & (sat < 0.3)).astype(np.uint8)   # white points only (blue dust is saturated)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        x, y, w, h, ar = st[i]
        if w <= ms and h <= ms and ar <= ms * ms * 0.6: keep[lab == i] = 1
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
        LOOSE = True
        x0, y0, x1, y1 = [float(v) for v in a.livery.split(':', 1)[1].split(',')]
        roi = np.zeros((H0, W0), np.uint8); roi[int(y0 * H0):int(y1 * H0), int(x0 * W0):int(x1 * W0)] = 1
gbox = [float(v) for v in a.glint.split(',')] if a.glint else None
RULES2 = parse_rules(a.livery2) if a.livery2 else None
SMUDGE = [[float(v) for v in b.split(',')] for b in a.smudge.split(';')] if a.smudge else []
def smudge(f, boxes):
    H, W = f.shape[:2]
    for x0, y0, x1, y1 in boxes:
        m = np.zeros((H, W), np.float32)
        cv2.ellipse(m, (int((x0 + x1) / 2 * W), int((y0 + y1) / 2 * H)), (int((x1 - x0) / 2 * W), int((y1 - y0) / 2 * H)), 0, 0, 360, 1.0, -1)
        m = cv2.GaussianBlur(m, (0, 0), 3)[..., None]
        f = f * (1 - m) + cv2.GaussianBlur(f, (0, 0), 6) * m
    return f
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

def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def srgb(l): return np.where(l <= 0.0031308, l * 12.92, 1.055 * np.power(np.maximum(l, 1e-8), 1 / 2.4) - 0.055)
GRAIN = None; GAPCOLS = None
if a.crush and a.crushmode == 2:
    # the clip's grain: high-pass std in its darkest flat areas (frame 0), re-added in the crushed background
    ok, g0 = cap.read(); cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    g0 = g0.astype(np.float32) / 255.; gy0 = cv2.cvtColor(g0, cv2.COLOR_BGR2GRAY)
    hp = gy0 - cv2.GaussianBlur(gy0, (0, 0), 1.5); flat = (cv2.GaussianBlur(gy0, (0, 0), 3) < 0.08)
    GRAIN = float(np.clip(hp[flat].std() if flat.sum() > 1000 else 0.006, 0.002, 0.02))
    if a.studs is not None:
        fr_ = []; k_ = 0
        while True:
            ok, f_ = cap.read()
            if not ok: break
            if k_ % 8 == 0: fr_.append(cv2.cvtColor(f_, cv2.COLOR_BGR2GRAY))
            k_ += 1
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        colmed = np.median(np.median(np.stack(fr_), 0)[int(0.1 * H0):int(0.9 * H0)], 0)   # per-column temporal median
        GAPCOLS = (colmed < 35) & (np.arange(W0) >= int(a.studs * W0))
        GAPCOLS = cv2.dilate(GAPCOLS.astype(np.uint8)[None], np.ones((1, 9), np.uint8))[0] > 0

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
    if SMUDGE: f = smudge(f, SMUDGE)
    if RULES2:
        f, lm2, lab2 = livery2(f, RULES2, i); stats['liveryPx'] += int(lm2.sum()); stats['labelPx'] = stats.get('labelPx', 0) + int(lab2.sum())
        if a.maskdump and i % 8 == 0: cv2.imwrite(f'{a.maskdump}/livery2-{i:03d}.png', np.maximum(lm2 * 255, lab2 * 128))
    if gbox:
        f, gp = glint(f, gbox); stats['glintPx'] += gp
    if vt is not None:
        f, vb = vt(f); vboxes.append([int(v) for v in vb])
    if not a.nograde: f = grade(f)
    if dep is not None and a.crushmode == 2:
        k = i / dstep; k0 = min(int(k), len(dep) - 1); k1 = min(k0 + 1, len(dep) - 1); t = k - int(k)
        d = cv2.resize(dep[k0] * (1 - t) + dep[k1] * t, (W0, H0), interpolation=cv2.INTER_LINEAR)
        u = np.clip((d - farD) / 0.08, 0, 1); near = u * u * (3 - 2 * u)           # 1 = near side (07, board, set)
        core = (near > 0.5).astype(np.uint8)
        core = cv2.erode(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))  # 3 px: the haze rim is background
        if GAPCOLS is not None:   # behind the stud plane: gaps between studs (darker than steel, warm, or small lights)
            g8 = (cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) * 255).astype(np.uint8); hsv_ = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
            warm = ((hsv_[..., 0] <= 45) | (hsv_[..., 0] >= 330)) & (hsv_[..., 1] > 0.22) & (hsv_[..., 2] > 0.12)
            bright = (g8 > 150).astype(np.uint8); nb, lb, sb, _ = cv2.connectedComponentsWithStats(bright, 8)
            small = np.isin(lb, [j for j in range(1, nb) if sb[j, 4] < 600])
            gap = ((g8 < 60) | warm | small) & GAPCOLS[None, :]
            gap = cv2.morphologyEx(gap.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
            core[gap > 0] = 0
        keep = np.maximum(cv2.GaussianBlur(core.astype(np.float32), (0, 0), 1.5), core.astype(np.float32))  # outward only
        keep = keep if prev_m is None else 0.5 * keep + 0.5 * prev_m; prev_m = keep
        stats['crushMean'] += float(1 - keep.mean())
        rng = np.random.default_rng(i)
        bg = SLAB[None, None, :] + rng.normal(0, GRAIN, (H0, W0, 1)).astype(np.float32)
        kk = keep[..., None]
        f = srgb(kk * lin(np.clip(f, 0, 1)) + (1 - kk) * lin(np.clip(bg, 0, 1))).astype(np.float32)
        if a.maskdump and i % 24 == 0: cv2.imwrite(f'{a.maskdump}/keep-{i:03d}.png', (keep * 255).astype(np.uint8))
    elif dep is not None:
        k = i / dstep; k0 = min(int(k), len(dep) - 1); k1 = min(k0 + 1, len(dep) - 1); t = k - int(k)
        d = dep[k0] * (1 - t) + dep[k1] * t
        u = np.clip((farD + 0.08 - d) / 0.08, 0, 1); m = u * u * (3 - 2 * u)
        m = cv2.resize(m, (W0, H0), interpolation=cv2.INTER_LINEAR)
        # grow the crush 10 px into the subject before feathering, so the feather never leaves a bright
        # un-crushed rim of background haze around 07 (that read as a glow)
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
        m = cv2.GaussianBlur(m, (0, 0), 6)             # ~24 px feather (2.5 sigma each side)
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
if GRAIN is not None: stats['grain'] = round(GRAIN, 4); stats['crushMode'] = 2
stats['crushMean'] = round(stats['crushMean'] / max(1, stats['frames']), 4)
print(os.path.basename(a.out), json.dumps(stats))
