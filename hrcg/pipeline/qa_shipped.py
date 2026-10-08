# D11 on what SHIPS: every AV1 web file in the manifest, every frame. Visor check = compact, bright, WHITE
# top-hat points inside the head path box (the same detector the mezzanine glint pass uses, so a leftover
# lit visor point shows up); livery check = yellow tool-tape area (bay border excluded for plans). Writes
# pipeline/out/assets-shipped.json and a contact sheet per video (5 frames + head crops) to <sheet_dir>.
# FIXLIST-1: also (F-048) orange/red power-tool livery inside each plan clip's tool ROIs (07's pads excluded, as in
# mezz.py --livery2), (F-009) a contact sheet of every 12th frame per clip (<id>-every12.jpg, for the manual crowd
# sign-off), and (F-010) the og image, X card and THE SET posters/stills: yellow tape livery and red tool livery.
# usage: python -I qa_shipped.py <sheet_dir> [id ...]
import os, sys, json, subprocess
import numpy as np, cv2

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
man = json.load(open(R + '/pipeline/out/manifest-qa.json'))['media']   # F-045: the full manifest (kind, bytes) lives here
HEAD = {  # head path boxes, normalised to the SHIPPED frame (None = no head in frame)
    'hero-snap-169': [0.3, 0.0, 0.66, 0.32], 'hero-snap-916': [0.3, 0.12, 0.7, 0.4],
    'el-c30': [0.34, 0.0, 0.54, 0.33], 'el-c30-m': [0.3, 0.0, 0.75, 0.26], 'el-c32': [0.38, 0.0, 0.66, 0.3],
}
def tophat_points(reg):
    f = reg.astype(np.float32) / 255.
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); sat = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)[..., 1]
    th = g - cv2.morphologyEx(g, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    m = ((th > 0.16) & (g > 0.42) & (sat < 0.3)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    return sum(1 for i in range(1, n) if st[i, 2] <= 10 and st[i, 3] <= 10 and st[i, 4] >= 3)
def livery(f, plan):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 18) & (hsv[..., 0] <= 34) & (hsv[..., 1] >= 110) & (hsv[..., 2] >= 110)).astype(np.uint8)
    if plan:   # registered plans: the yellow border tape is at 120..1320/1440; drop a band around it
        H, W = m.shape; b0, b1, bw = int(0.0833 * W), int(0.9167 * W), int(0.035 * W)
        band = np.zeros_like(m); cv2.rectangle(band, (b0, b0), (b1, b1), 1, 2 * bw); m[band > 0] = 0
        m[:int(0.06 * H)] = 0; m[int(0.94 * H):] = 0; m[:, :int(0.06 * W)] = 0; m[:, int(0.94 * W):] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    return int(sum(st[i, 4] for i in range(1, n) if st[i, 4] >= 12))
# tool ROIs on the SHIPPED (registered) plan frame, normalised, a little larger than the mezz.py --livery2 boxes
# (registration moves a bay by a few %); hue in degrees; frames in source frames (plans keep the frame count)
TOOLS = {
    'b41': [((8, 32), (0.10, 0.56, 0.29, 0.84), (0, 87)), ((8, 32), (0.28, 0.48, 0.64, 0.69), (84, 97)), ((8, 32), (0.46, 0.22, 0.78, 0.66), (94, 120))],
    'b42': [((345, 15), (0.04, 0.04, 0.96, 0.96), (0, 120))],
    'b43': [((345, 15), (0.66, 0.26, 0.92, 0.50), (0, 120))],
}
def tool_livery(f, rules, i):
    hsv = cv2.cvtColor(f.astype(np.float32) / 255., cv2.COLOR_BGR2HSV); h, sa, va = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    H, W = h.shape; tot = 0
    pm = ((h >= 15) & (h <= 30) & (sa >= 0.45) & (va >= 0.25)).astype(np.uint8)
    pm = cv2.morphologyEx(pm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n_, lb_, st_, _ = cv2.connectedComponentsWithStats(pm, 8)
    pads = cv2.dilate(np.isin(lb_, [j for j in range(1, n_) if st_[j, 4] >= 0.0015 * W * H and st_[j, 4] >= 0.45 * st_[j, 2] * st_[j, 3]]).astype(np.uint8),
                      cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
    for (lo, hi), (x0, y0, x1, y1), (a, b) in rules:
        if not (a <= i <= b): continue
        hm = ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
        m = (hm & (sa >= 0.40) & (va >= 0.18)).astype(np.uint8) & (1 - pads)
        bx = np.zeros_like(m); bx[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = 1; m &= bx
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        tot += int(sum(st[j, 4] for j in range(1, n) if st[j, 4] >= 25 * (W * H) / (1440 * 1440)))
    return tot
def red_px(f):
    hsv = cv2.cvtColor(f.astype(np.float32) / 255., cv2.COLOR_BGR2HSV); h, sa, va = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m = (((h >= 345) | (h <= 12)) & (sa >= 0.45) & (va >= 0.25)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    return int(sum(st[j, 4] for j in range(1, n) if st[j, 4] >= 40))
ONLY = set(sys.argv[2:])
res = json.load(open(R + '/pipeline/out/assets-shipped.json')) if ONLY and os.path.exists(R + '/pipeline/out/assets-shipped.json') else {}
for id, e in man.items():
    if e['kind'] != 'video': continue
    if ONLY and id not in ONLY: continue
    src = R + '/public/' + e['sources'][0]['src']
    # decode the AV1 file with the system ffmpeg (OpenCV's bundled build has no software AV1 decoder)
    W, H = e['w'], e['h']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    frames = list(np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)); box = HEAD.get(id); plan = id.startswith('plan-') or id.startswith('arena')
    pts, liv, tl = [], [], []
    trules = TOOLS.get(id.split('-')[1]) if id.startswith('plan-') else None
    for k_, f in enumerate(frames):
        if box:
            x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
            pts.append(tophat_points(f[y0:y1, x0:x1]))
        liv.append(livery(f, plan))
        if trules: tl.append(tool_livery(f, trules, k_))
    res[id] = {'frames': len(frames), 'size': [W, H], 'visorPointsMax': max(pts) if pts else None,
               'visorFramesWithPoints': int(sum(1 for p in pts if p > 0)) if pts else None,
               'liveryMaxPx': int(max(liv)), 'liveryFrames': int(sum(1 for a in liv if a >= 25)),
               'toolLiveryMaxPx': int(max(tl)) if tl else None, 'toolLiveryFrames': int(sum(1 for a in tl if a >= 60)) if tl else None}
    # F-009: every 12th frame, for the manual crowd / brickwork / tool sign-off
    ev = list(range(0, len(frames), 12)); th2 = 150
    ts = [cv2.putText(cv2.resize(frames[k], (int(th2 * W / H), th2)), f'f{k}', (4, 14), cv2.FONT_HERSHEY_PLAIN, 1.0, (225, 232, 236), 1) for k in ev]
    per = 6; rows_ = [np.hstack(ts[k:k + per] + [np.zeros_like(ts[0])] * (per - len(ts[k:k + per]))) for k in range(0, len(ts), per)]
    cv2.imwrite(f'{OUT}/{id}-every12.jpg', np.vstack(rows_), [cv2.IMWRITE_JPEG_QUALITY, 80])
    idx = sorted({0, len(frames) // 4, len(frames) // 2, 3 * len(frames) // 4, len(frames) - 1})
    th = 180; tiles = []
    for k in idx:
        t = cv2.resize(frames[k], (int(th * W / H), th)); cv2.putText(t, f'{id} f{k}', (6, 16), cv2.FONT_HERSHEY_PLAIN, 1.0, (225, 232, 236), 1)
        tiles.append(t)
    row = np.hstack(tiles)
    if box:
        crops = []
        for k in idx:
            x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
            c = frames[k][y0:y1, x0:x1]; crops.append(cv2.resize(c, (int(140 * c.shape[1] / c.shape[0]), 140)))
        crow = np.hstack(crops)
        pad = np.zeros((140, max(0, row.shape[1] - crow.shape[1]), 3), np.uint8)
        row = np.vstack([row, np.hstack([crow, pad])[:, :row.shape[1]]])
    cv2.imwrite(f'{OUT}/{id}.jpg', row, [cv2.IMWRITE_JPEG_QUALITY, 80])
    print(id, json.dumps(res[id]))
# F-010: the social cards and THE SET's posters / stills (whatever is on disk), yellow tape + red tool livery
stills = {}
FILM = R + '/film'
cands = [R + '/public/media/og/og-image.jpg', R + '/public/media/film/the-set-169.poster.jpg',
         FILM + '/deliver/og-image-1200x630.png', FILM + '/deliver/x-card-1600x900.jpg',
         FILM + '/deliver/the-set-169-poster.jpg', FILM + '/deliver/the-set-916-poster.jpg', FILM + '/deliver/the-set-11-poster.jpg']
import glob
cands += sorted(glob.glob(FILM + '/public/stills/*.png'))
for pth in cands:
    if not os.path.exists(pth): continue
    im = cv2.imread(pth)
    if im is None: continue
    y = livery(im, False) * (1440 * 1440) / (im.shape[0] * im.shape[1])
    stills[os.path.relpath(pth, R)] = {'yellowPx': int(livery(im, False)), 'redPx': red_px(im), 'liveryFrames': int(livery(im, False) >= 25 or red_px(im) >= 200)}
res['_stills'] = stills
res['_summary'] = {'liveryFrames': int(sum(v.get('liveryFrames') or 0 for k, v in res.items() if not k.startswith('_')) + sum(v['liveryFrames'] for v in stills.values())),
                   'toolLiveryFrames': int(sum(v.get('toolLiveryFrames') or 0 for k, v in res.items() if not k.startswith('_')))}
print('_stills', json.dumps(stills)); print('_summary', json.dumps(res['_summary']))
json.dump(res, open(R + '/pipeline/out/assets-shipped.json', 'w'), indent=1)
