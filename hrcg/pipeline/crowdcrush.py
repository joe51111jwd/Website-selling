# D4 crowd crush, stage 1: per-frame monocular depth (Depth Anything V2 Small, ONNX, CPU) at 518 px input,
# stabilised over the clip (least-squares scale/shift to the clip median + EMA, as gt-spike/rgbd.py).
# Output: <out>.npy float16 (frames, 518, W518) relative inverse depth 0..1 (near = 1), sampled every
# <step> frames (mezz.py interpolates between samples), plus <out>.jpg preview strip (frames 0 / mid / last).
# The mask itself (smoothstep(farD + 0.08, farD, d), feathered 24 px, temporally smoothed) is applied in
# mezz.py, with farD chosen per clip after looking at the preview.
# usage: python -I crowdcrush.py <clip.mp4> <out_base> [step=2] [model=da2s.onnx]
import sys, time, json
import numpy as np, cv2, onnxruntime as ort

clip, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 2
model = sys.argv[4] if len(sys.argv) > 4 else '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad/concept/wild-spike/da2s.onnx'
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(model, so, providers=['CPUExecutionProvider'])
cap = cv2.VideoCapture(clip); frames = []; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    if i % step == 0: frames.append(f)
    i += 1
nframes = i
h0, w0 = frames[0].shape[:2]
H = 518; W = int(round(w0 / h0 * H / 14)) * 14
mean, std = np.array([0.485, 0.456, 0.406]), np.array([0.229, 0.224, 0.225])
raw = []; t0 = time.time()
for f in frames:
    x = cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2RGB), (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.
    x = ((x - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)
    raw.append(sess.run(None, {'pixel_values': x})[0][0])
dt = (time.time() - t0) / len(frames)
raw = np.stack(raw)
ref = np.median(raw, axis=0); al = []
for d in raw:
    A = np.stack([d.ravel(), np.ones(d.size)], 1); s, b = np.linalg.lstsq(A, ref.ravel(), rcond=None)[0]; al.append(d * s + b)
al = np.stack(al); lo, hi = np.percentile(al, 1), np.percentile(al, 99.5)
stab = np.clip((al - lo) / (hi - lo), 0, 1)
ema = stab.copy()
for k in range(1, len(ema)): ema[k] = 0.6 * stab[k] + 0.4 * ema[k - 1]
np.save(out + '.npy', ema.astype(np.float16))
json.dump({'clip': clip, 'step': step, 'frames': nframes, 'samples': len(frames), 'size': [W, H], 'sec_per_frame': round(dt, 2)}, open(out + '.json', 'w'))
# preview: colour | depth for first / middle / last sample, with iso lines every 0.05
tiles = []
for k in (0, len(frames) // 2, len(frames) - 1):
    c = cv2.resize(frames[k], (W // 2, H // 2)); d = cv2.resize(ema[k], (W // 2, H // 2))
    g = cv2.applyColorMap((d * 255).astype(np.uint8), cv2.COLORMAP_TURBO)
    q = (d * 20).astype(np.uint8); e = cv2.morphologyEx(q, cv2.MORPH_GRADIENT, np.ones((2, 2), np.uint8)) > 0
    g[e] = (255, 255, 255)
    tiles.append(np.hstack([c, g]))
cv2.imwrite(out + '.jpg', np.vstack(tiles), [cv2.IMWRITE_JPEG_QUALITY, 82])
print(clip, len(frames), 'samples', round(dt, 2), 's/frame')
