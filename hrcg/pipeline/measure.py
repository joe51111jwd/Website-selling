# D11 asset QA (brief §7d): per-frame visor-glint detection in the head region, yellow tool-livery mask
# area, SSIM seam search (best in/out pair per clip, or "no seam"). Also writes head-region and livery
# contact sheets so a human LOOKS at every flagged frame.
# usage: python -I measure.py <out.json> <contact_dir> <clip.mp4>[:name[:x0,y0,x1,y1 head box][:bay]] ...
#   head box: normalised to the clip frame; omit to use the whole frame.  ':bay' = top-down bay clip
#   (the yellow bay border is excluded from the livery mask). Also usable on stills (png/jpg).
# Glint rule: pixels with luma >= 235 and saturation <= 0.25 inside the head box, counted at 480 px wide,
# minus the clip's own 20th-percentile (static practical lights in the box). A frame is FLAGGED when the
# excess >= 12 px and forms a compact blob; flagged frames are drawn red in the contact sheet.
# Seam rule (brief §7a): SSIM >= 0.97 (luma, 320 px) between out and in, loop length >= 3.0 s, searched over
# in 0..30, out 72..last; additionally the SSIM inside the clip's motion mask must be >= 0.90, so a seam is
# not accepted just because the static background matches.
import sys, os, json
import numpy as np, cv2

def ssim(a, b):
    a = a.astype(np.float32); b = b.astype(np.float32)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    ma, mb = g(a), g(b)
    va, vb, cab = g(a * a) - ma * ma, g(b * b) - mb * mb, g(a * b) - ma * mb
    return ((2 * ma * mb + C1) * (2 * cab + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))

def read(path, w=480):
    if path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        f = cv2.imread(path); h = int(round(f.shape[0] * w / f.shape[1]))
        return [cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA)], 24.0
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 24.0; out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        h = int(round(f.shape[0] * w / f.shape[1]))
        out.append(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA))
    return out, fps

def border_rect(frames):
    """D7: the yellow bay border, from the temporal median (robot occlusion removed). Returns line centres
    (x0, y0, x1, y1) and line thickness, in the frames' pixel space."""
    med = np.median(np.stack(frames[::6]), axis=0).astype(np.uint8)
    hsv = cv2.cvtColor(med, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 14) & (hsv[..., 0] <= 36) & (hsv[..., 1] >= 70) & (hsv[..., 2] >= 70)).astype(np.float32)
    H, W = m.shape
    def runs(proj, lo, hi):
        idx = [i for i in range(lo, hi) if proj[i] > 0.35]
        if not idx: return None
        # the longest contiguous run
        best, cur = [idx[0]], [idx[0]]
        for i in idx[1:]:
            cur = cur + [i] if i == cur[-1] + 1 else [i]
            if len(cur) > len(best): best = cur
        return (best[0] + best[-1]) / 2, len(best)
    cs, rs = m.mean(axis=0), m.mean(axis=1)
    l, r = runs(cs, 0, W // 3), runs(cs, 2 * W // 3, W); t, b = runs(rs, 0, H // 3), runs(rs, 2 * H // 3, H)
    if None in (l, r, t, b): return None
    th = max(l[1], r[1], t[1], b[1])
    return (l[0], t[0], r[0], b[0]), th

def livery_mask(f, bay, rect=None):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 18) & (hsv[..., 0] <= 34) & (hsv[..., 1] >= 110) & (hsv[..., 2] >= 110)).astype(np.uint8)
    if bay and rect:  # exclude a band around the bay's yellow border tape
        (x0, y0, x1, y1), th = rect; b = int(th * 1.5 + 0.015 * f.shape[1])
        band = np.zeros_like(m)
        cv2.rectangle(band, (int(x0), int(y0)), (int(x1), int(y1)), 1, 2 * b)
        m[band > 0] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    area = int(sum(st[i][4] for i in range(1, n) if st[i][4] >= 8))
    return m, area

def main():
    out_json, cdir = sys.argv[1], sys.argv[2]; os.makedirs(cdir, exist_ok=True)
    res = json.load(open(out_json)) if os.path.exists(out_json) else {}
    for arg in sys.argv[3:]:
        parts = arg.split(':'); path = parts[0]
        name = parts[1] if len(parts) > 1 and parts[1] else os.path.splitext(os.path.basename(path))[0]
        box = [float(v) for v in parts[2].split(',')] if len(parts) > 2 and parts[2] else [0, 0, 1, 1]
        bay = len(parts) > 3 and parts[3] == 'bay'
        frames, fps = read(path); H, W = frames[0].shape[:2]
        x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
        rect = border_rect(frames) if bay else None
        counts, blobs, liv = [], [], []
        for f in frames:
            hb = f[y0:y1, x0:x1]; hsv = cv2.cvtColor(hb, cv2.COLOR_BGR2HSV)
            luma = cv2.cvtColor(hb, cv2.COLOR_BGR2GRAY)
            g = ((luma >= 235) & (hsv[..., 1] <= 64)).astype(np.uint8)
            counts.append(int(g.sum()))
            n, lab, st, _ = cv2.connectedComponentsWithStats(g, 8)
            blobs.append(int(max([st[i][4] for i in range(1, n)] or [0])))
            liv.append(livery_mask(f, bay, rect)[1])
        base = float(np.percentile(counts, 20))
        excess = [max(0, c - base) for c in counts]
        flagged = [i for i, e in enumerate(excess) if e >= 12 and blobs[i] >= 6]
        lv = [i for i, a in enumerate(liv) if a >= 25]
        r = {'path': path, 'frames': len(frames), 'fps': fps, 'headBox': box,
             'glint': {'baseline': base, 'maxExcess': float(max(excess)), 'flaggedFrames': flagged},
             'borderRect': ([round(v / W, 5) for v in rect[0]] if rect else None),
             'livery': {'maxArea480': int(max(liv)), 'framesWithLivery': len(lv), 'first': lv[:1], 'last': lv[-1:]}}
        # seams
        if len(frames) > 80:
            g = [cv2.cvtColor(cv2.resize(f, (320, int(320 * H / W))), cv2.COLOR_BGR2GRAY) for f in frames]
            st = np.std(np.stack(g).astype(np.float32), axis=0); mm = st > np.percentile(st, 80)
            best = None
            for i in range(0, 31):
                for o in range(72, len(g)):
                    if (o - i) / fps < 3.0: continue
                    s = ssim(g[o], g[i]); full = float(s.mean()); mot = float(s[mm].mean())
                    if best is None or full + mot > best[2] + best[3]: best = (i, o, full, mot)
            i, o, full, mot = best
            ok = full >= 0.97 and mot >= 0.90
            r['seam'] = {'in': round(i / fps, 4), 'out': round(o / fps, 4), 'inFrame': i, 'outFrame': o,
                         'ssim': round(full, 4), 'ssimMotion': round(mot, 4), 'accepted': ok}
        res[name] = r
        # contact sheet: head crops every 6 frames (flagged in red), plus livery overlay row
        step = max(1, len(frames) // 20); tiles = []
        for k in range(0, len(frames), step):
            t = frames[k][y0:y1, x0:x1].copy(); t = cv2.resize(t, (200, max(1, int(200 * t.shape[0] / max(1, t.shape[1])))))
            col = (0, 0, 255) if k in flagged else (60, 60, 60)
            cv2.rectangle(t, (0, 0), (t.shape[1] - 1, t.shape[0] - 1), col, 3)
            cv2.putText(t, str(k), (4, 14), cv2.FONT_HERSHEY_PLAIN, 1, (255, 255, 255), 1)
            tiles.append(t)
        hmax = max(t.shape[0] for t in tiles); tiles = [cv2.copyMakeBorder(t, 0, hmax - t.shape[0], 0, 0, cv2.BORDER_CONSTANT) for t in tiles]
        rows = [np.hstack(tiles[j:j + 7] + [np.zeros_like(tiles[0])] * (7 - len(tiles[j:j + 7]))) for j in range(0, len(tiles), 7)]
        cv2.imwrite(os.path.join(cdir, f'{name}-head.jpg'), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])
        if lv:
            k = max(range(len(liv)), key=lambda q: liv[q]); f = frames[k].copy(); m, _ = livery_mask(f, bay, rect)
            f[m > 0] = (255, 0, 255); cv2.imwrite(os.path.join(cdir, f'{name}-livery.jpg'), f)
        print(name, json.dumps({k: r[k] for k in ('glint', 'livery')}), json.dumps(r.get('seam')))
    json.dump(res, open(out_json, 'w'), indent=1)

if __name__ == '__main__':
    main()
