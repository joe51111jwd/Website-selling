# D7 bay registration: measure the yellow bay border of each graded bay mezzanine (temporal median, line
# centres), scale each clip per axis so the border lands on 120..1320 of a 1440² frame, re-measure, and
# write the registered 1440² mezzanines (libx264 crf 14) + pipeline/out/rects.json (normalised, registered).
# usage: python -I register.py <mezz_dir> <out_dir> b40 b41 b42 b43 b44
import sys, os, json, subprocess
import numpy as np, cv2

MZ, OUTD = sys.argv[1], sys.argv[2]; names = sys.argv[3:]
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUTD, exist_ok=True)
T0, T1 = 120, 1320

def frames(path, every=6):
    cap = cv2.VideoCapture(path); out = []; i = 0
    while True:
        ok, f = cap.read()
        if not ok: break
        if i % every == 0: out.append(f)
        i += 1
    return out

def border(fr):
    med = np.median(np.stack(fr), axis=0).astype(np.uint8)
    hsv = cv2.cvtColor(med, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 14) & (hsv[..., 0] <= 36) & (hsv[..., 1] >= 70) & (hsv[..., 2] >= 60)).astype(np.float32)
    H, W = m.shape
    def run(p, lo, hi):
        idx = [i for i in range(lo, hi) if p[i] > 0.35]
        best, cur = [idx[0]], [idx[0]]
        for i in idx[1:]:
            cur = cur + [i] if i == cur[-1] + 1 else [i]
            if len(cur) > len(best): best = cur
        return (best[0] + best[-1]) / 2.0, len(best)
    cs, rs = m.mean(0), m.mean(1)
    l, r = run(cs, 0, W // 3), run(cs, 2 * W // 3, W); t, b = run(rs, 0, H // 3), run(rs, 2 * H // 3, H)
    return [l[0], t[0], r[0], b[0]], max(l[1], r[1], t[1], b[1])

res = {}; src = {}
for n in names:
    path = f'{MZ}/{n}.mp4'
    (l, t, r, b), th = border(frames(path))
    sx, sy = (T1 - T0) / (r - l), (T1 - T0) / (b - t)
    W2, H2 = int(round(1440 * sx)), int(round(1440 * sy))
    ox, oy = T0 - l * sx, T0 - t * sy           # where the scaled frame's origin lands
    P = 600
    vf = (f'scale={W2}:{H2}:flags=lanczos,pad={W2 + 2 * P}:{H2 + 2 * P}:{P}:{P}:color=0x0B0B0A,'
          f'crop=1440:1440:{int(round(P - ox))}:{int(round(P - oy))}')
    out = f'{OUTD}/{n}.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', path, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True)
    (l2, t2, r2, b2), _ = border(frames(out))
    err = max(abs(l2 - T0), abs(t2 - T0), abs(r2 - T1), abs(b2 - T1))
    src[n] = {'srcRect': [round(v, 1) for v in (l, t, r, b)], 'scale': [round(sx, 5), round(sy, 5)], 'offset': [round(ox, 2), round(oy, 2)],
              'registeredRect': [round(v, 1) for v in (l2, t2, r2, b2)], 'maxErrPx': round(err, 2), 'pass': err <= 4}
    res['plan-' + n] = [round(v / 1440, 5) for v in (l2, t2, r2, b2)]
    print(n, json.dumps(src[n]))
os.makedirs(R + '/pipeline/out', exist_ok=True)
old = json.load(open(R + '/pipeline/out/rects.json')) if os.path.exists(R + '/pipeline/out/rects.json') else {}
old.update(res); json.dump(old, open(R + '/pipeline/out/rects.json', 'w'), indent=1)
oldq = json.load(open(R + '/pipeline/out/registration.json')) if os.path.exists(R + '/pipeline/out/registration.json') else {}
oldq.update(src); json.dump(oldq, open(R + '/pipeline/out/registration.json', 'w'), indent=1)
