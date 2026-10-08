# D3 SECTION A-A still (brief §4.2, §7d): the cleanest pre-snap frame of c34 near frame 24 (no dust),
# depth (DA2-S once, guided upsample), and the three no-GL stills rendered with EXACTLY the slice shader's
# formula from the 8-bit depth the GPU will sample.
# Outputs (public/media/section): sec-c34-color.{avif,jpg} 1920x1076, sec-c34-depth.png 960x540 8-bit
# (near = 255), sec-{near,mid,far}.{avif,jpg}, sec-c34-meta.json {frame, nearD, farD, w, levels, s, colours}.
# usage: python -I section.py <c34 mezzanine.mp4> <outdir> <qadir>
import sys, os, json
import numpy as np, cv2, onnxruntime as ort
from PIL import Image

src, OUT, QA = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True); os.makedirs(QA, exist_ok=True)
S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
cap = cv2.VideoCapture(src); frames = {}; i = 0
while True:
    ok, f = cap.read()
    if not ok or i > 30: break
    if i >= 18: frames[i] = f
    i += 1
def score(f):
    s = cv2.resize(f, (480, 269)); hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
    dust = ((hsv[..., 0] >= 100) & (hsv[..., 0] <= 118) & (hsv[..., 1] >= 60) & (hsv[..., 2] >= 90))
    dust[200:] = False                               # ignore the chalk line on the floor (bottom band)
    sharp = cv2.Laplacian(cv2.cvtColor(s, cv2.COLOR_BGR2GRAY), cv2.CV_32F).var()
    return float(sharp) - 4.0 * float(dust.sum()), int(dust.sum()), float(sharp)
scores = {k: score(v) for k, v in frames.items()}
best = max(scores, key=lambda k: scores[k][0])
bgr = frames[best]; H, W = bgr.shape[:2]; rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(S + '/concept/wild-spike/da2s.onnx', so, providers=['CPUExecutionProvider'])
x = cv2.resize(rgb, (1288, 728), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
raw = sess.run(None, {'pixel_values': x})[0][0]
lo, hi = np.percentile(raw, 1), np.percentile(raw, 99.5)
d = np.clip((raw - lo) / (hi - lo), 0, 1).astype(np.float32)
d = np.clip(cv2.ximgproc.guidedFilter(rgb.mean(2).astype(np.float32) / 255., cv2.resize(d, (W, H)), 8, 1e-3), 0, 1)
# Contours must read on 07 AND the floor (D3 acceptance). Raw relative depth spends most of its range on the
# near floor (07 sits in a narrow 0.25-0.4 band, ~2 contour levels). Monotonic remap: background (Otsu split)
# linearly into 0..0.12, foreground equalised (CDF) into 0.12..1, so the 14 levels spread over 07 and the floor.
# Order is preserved, so near/far and the slice sweep are unchanged in meaning (relative, no units).
# Otsu on the lower 70% of values only: the full-range split lands between the near floor and everything else;
# restricted, it lands in the gap between the haze/background and 07
sub = d[d < np.percentile(d, 70)]
thr, _ = cv2.threshold((sub * 255).astype(np.uint8).reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU); thr /= 255.
fg = d > thr
vals = np.sort(d[fg].ravel()); ranks = np.searchsorted(vals, d, side='right') / max(1, len(vals))
d = np.where(fg, 0.12 + 0.88 * ranks, d / max(thr, 1e-6) * 0.12).astype(np.float32)
d = cv2.GaussianBlur(d, (0, 0), 1.0)
d8 = (cv2.resize(d, (960, 540), interpolation=cv2.INTER_AREA) * 255 + .5).astype(np.uint8)
cv2.imwrite(f'{OUT}/sec-c34-depth.png', d8, [cv2.IMWRITE_PNG_COMPRESSION, 9])
Image.fromarray(rgb).save(f'{OUT}/sec-c34-color.avif', quality=58, speed=4)
Image.fromarray(rgb).save(f'{OUT}/sec-c34-color.jpg', quality=82, optimize=True, progressive=True)

# what the shader samples: the 8-bit texture, LinearFilter
dd = cv2.resize(d8.astype(np.float32) / 255., (W, H), interpolation=cv2.INTER_LINEAR)
nearD, farD = float(np.percentile(dd, 99)), float(np.percentile(dd, 8))
w = 0.012; LEV = 14
def hexc(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.
SLAB, CHALK, PENCIL, BLUE = hexc('#0B0B0A'), hexc('#ECE8E1'), hexc('#9A958C'), hexc('#6F98E8')
still = rgb.astype(np.float32) / 255.
q = dd * LEV
gx, gy = np.gradient(q); fw = np.abs(gx) + np.abs(gy) + 1e-6
contour = np.clip(1 - np.abs(q - np.round(q)) / fw, 0, 1)
def slice_img(s):
    u = nearD + (farD - nearD) * s
    draw = (SLAB * (1 - dd[..., None] ** 1.4) + CHALK * dd[..., None] ** 1.4) * .85 + PENCIL * contour[..., None]
    col = np.where((dd > u + w)[..., None], draw, still)
    t = np.clip(np.abs(dd - u) / w, 0, 1); band = 1 - t * t * (3 - 2 * t)
    col = col * (1 - band[..., None]) + BLUE * band[..., None]
    return (np.clip(col, 0, 1) * 255 + .5).astype(np.uint8)
S_ = {'near': 0.1, 'mid': 0.5, 'far': 0.9}   # A4-3: s = 0.1 / 0.5 / 0.9
for k, s in S_.items():
    im = Image.fromarray(slice_img(s))
    im.save(f'{OUT}/sec-{k}.avif', quality=55, speed=4); im.save(f'{OUT}/sec-{k}.jpg', quality=80, optimize=True, progressive=True)
meta = {'frame': int(best), 'candidates': {str(k): {'dustPx480': v[1], 'sharpness': round(v[2], 1)} for k, v in scores.items()},
        'depth': {'file': 'sec-c34-depth.png', 'w': 960, 'h': 540, 'encoding': '8-bit single channel, relative inverse depth, near = 255; sample with LinearFilter + NoColorSpace',
                  'remap': 'monotonic: background (Otsu) linear into 0..0.12, foreground rank-equalised into 0.12..1 (spreads contour levels over 07 and the floor)'},
        'nearD': round(nearD, 4), 'farD': round(farD, 4), 'w': w, 'levels': LEV,
        'uSlice': 'mix(nearD, farD, s); s = 0 at the camera end of the chalk line, 1 at the robot end',
        'stills': {k: {'s': s} for k, s in S_.items()},
        'colours': {'slabBlack': '#0B0B0A', 'chalk': '#ECE8E1', 'pencil': '#9A958C', 'chalkBlue': '#6F98E8'}}
json.dump(meta, open(f'{OUT}/sec-c34-meta.json', 'w'), indent=1)
sheet = np.vstack([np.hstack([cv2.resize(bgr, (640, 359)), cv2.resize(cv2.applyColorMap(d8, cv2.COLORMAP_BONE), (640, 359))]),
                   np.hstack([cv2.resize(cv2.cvtColor(slice_img(0.1), cv2.COLOR_RGB2BGR), (640, 359)), cv2.resize(cv2.cvtColor(slice_img(0.9), cv2.COLOR_RGB2BGR), (640, 359))])])
cv2.imwrite(f'{QA}/section-sheet.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
print(json.dumps({'bgThreshold': round(float(thr), 4), 'fgFrac': round(float(fg.mean()), 3), 'frame': int(best), 'nearD': meta['nearD'], 'farD': meta['farD'], 'scores': {k: v[:2] for k, v in scores.items()}}))
