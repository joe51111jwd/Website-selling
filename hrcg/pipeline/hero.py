# R3 hero snap film (brief §7c): frames a..b (inclusive) of a graded mezzanine; the last frame is the freeze
# frame. Optional feathered NEAR darkening (D1 contrast gate fallback, baked into the film so film, stills
# and GL stay identical). Encodes AV1 (first) + H.264 per §7e, poster = last frame, and decodes the LAST
# frame of each encoded file to PNG for D1.
# usage: python -I hero.py <mezz.mp4> <a> <b> <out_base> <png_dir> [--crop x,y,w,h]
#        [--darken x0,y0,x1,y1,amount]  (box normalised to the output frame; amount = fraction of LINEAR light removed at the centre)
#        [--av1crf 36] [--h264crf 23]
import sys, os, argparse, subprocess, json
import numpy as np, cv2
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('a', type=int); ap.add_argument('b', type=int); ap.add_argument('out'); ap.add_argument('pngdir')
ap.add_argument('--crop'); ap.add_argument('--darken'); ap.add_argument('--av1crf', default='34'); ap.add_argument('--h264crf', default='23')
A = ap.parse_args(); os.makedirs(A.pngdir, exist_ok=True); os.makedirs(os.path.dirname(A.out), exist_ok=True)

cap = cv2.VideoCapture(A.src); frames = []; i = 0
while True:
    ok, f = cap.read()
    if not ok or i > A.b: break
    if i >= A.a: frames.append(f)
    i += 1
if A.crop:
    x, y, w, h = map(int, A.crop.split(',')); frames = [f[y:y + h, x:x + w] for f in frames]
H, W = frames[0].shape[:2]
if A.darken:
    x0, y0, x1, y1, amt = map(float, A.darken.split(','))
    # flat over the NEAR box (+2% margin) so every glyph pixel gets the full amount, feathered outside it
    m = np.zeros((H, W), np.float32); mg = 0.02 * W
    cv2.rectangle(m, (int(x0 * W - mg), int(y0 * H - mg)), (int(x1 * W + mg), int(y1 * H + mg)), 1.0, -1)
    sig = max(W, H) * 0.025
    m = cv2.GaussianBlur(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(sig * 2.5) | 1, int(sig * 2.5) | 1))), (0, 0), sig)
    m = (m / m.max())[..., None]
    def dk(f):
        c = f.astype(np.float32) / 255.
        lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
        lin *= 1 - amt * m
        s = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(np.maximum(lin, 1e-8), 1 / 2.4) - 0.055)
        return (np.clip(s, 0, 1) * 255 + .5).astype(np.uint8)
    frames = [dk(f) for f in frames]
raw = b''.join(f.tobytes() for f in frames)
base = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', '24', '-i', '-', '-an']
# §7e budget: 0.25 MB AV1 / 0.5 MB H.264 for the 25-frame film; best quality CRF that fits
crfs = {}
for crf in [int(A.av1crf)] + [c for c in (36, 38, 40, 42, 44, 46, 48) if c > int(A.av1crf)]:
    subprocess.run(base + ['-c:v', 'libsvtav1', '-preset', '6', '-crf', str(crf), '-g', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', A.out + '.av1.mp4'], input=raw, check=True)
    crfs['av1'] = crf
    if os.path.getsize(A.out + '.av1.mp4') <= 250_000: break
for crf in [int(A.h264crf)] + [c for c in (24, 26, 28, 30, 32) if c > int(A.h264crf)]:
    subprocess.run(base + ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', A.out + '.h264.mp4'], input=raw, check=True)
    crfs['h264'] = crf
    if os.path.getsize(A.out + '.h264.mp4') <= 500_000: break
cv2.imwrite(f'{A.pngdir}/src-last.png', frames[-1])
for c in ('av1', 'h264'):
    p = f'{A.pngdir}/last-{c}.png'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{A.out}.{c}.mp4', '-vf', f'select=eq(n\\,{len(frames) - 1})', '-frames:v', '1', p], check=True)
last = Image.open(f'{A.pngdir}/last-av1.png').convert('RGB')
last.save(A.out + '.poster.avif', quality=55, speed=4); last.save(A.out + '.poster.jpg', quality=82, optimize=True, progressive=True)
sz = {c: os.path.getsize(f'{A.out}.{c}.mp4') for c in ('av1', 'h264')}
print(json.dumps({'out': A.out, 'frames': len(frames), 'size': [W, H], 'bytes': sz, 'crf': crfs}))
