# D11 on what SHIPS: every AV1 web file in the manifest, every frame. Visor check = compact, bright, WHITE
# top-hat points inside the head path box (the same detector the mezzanine glint pass uses, so a leftover
# lit visor point shows up); livery check = yellow tool-tape area (bay border excluded for plans). Writes
# pipeline/out/assets-shipped.json and a contact sheet per video (5 frames + head crops) to <sheet_dir>.
# usage: python -I qa_shipped.py <sheet_dir>
import os, sys, json, subprocess
import numpy as np, cv2

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
man = json.load(open(R + '/src/media/manifest.json'))['media']
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
res = {}
for id, e in man.items():
    if e['kind'] != 'video': continue
    src = R + '/public/' + e['sources'][0]['src']
    # decode the AV1 file with the system ffmpeg (OpenCV's bundled build has no software AV1 decoder)
    W, H = e['w'], e['h']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    frames = list(np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)); box = HEAD.get(id); plan = id.startswith('plan-') or id.startswith('arena')
    pts, liv = [], []
    for f in frames:
        if box:
            x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
            pts.append(tophat_points(f[y0:y1, x0:x1]))
        liv.append(livery(f, plan))
    res[id] = {'frames': len(frames), 'size': [W, H], 'visorPointsMax': max(pts) if pts else None,
               'visorFramesWithPoints': int(sum(1 for p in pts if p > 0)) if pts else None,
               'liveryMaxPx': int(max(liv)), 'liveryFrames': int(sum(1 for a in liv if a >= 25))}
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
json.dump(res, open(R + '/pipeline/out/assets-shipped.json', 'w'), indent=1)
