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
ap.add_argument('--crop'); ap.add_argument('--darken'); ap.add_argument('--av1crf', default='36'); ap.add_argument('--h264crf', default='23')
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
    m = np.zeros((H, W), np.float32)
    cx, cy = (x0 + x1) / 2 * W, (y0 + y1) / 2 * H; ax, ay = (x1 - x0) / 2 * W * 1.15, (y1 - y0) / 2 * H * 1.25
    cv2.ellipse(m, (int(cx), int(cy)), (int(ax), int(ay)), 0, 0, 360, 1.0, -1)
    m = cv2.GaussianBlur(m, (0, 0), max(W, H) * 0.03)
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
subprocess.run(base + ['-c:v', 'libsvtav1', '-preset', '6', '-crf', A.av1crf, '-g', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', A.out + '.av1.mp4'], input=raw, check=True)
subprocess.run(base + ['-c:v', 'libx264', '-preset', 'slow', '-crf', A.h264crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', A.out + '.h264.mp4'], input=raw, check=True)
cv2.imwrite(f'{A.pngdir}/src-last.png', frames[-1])
for c in ('av1', 'h264'):
    p = f'{A.pngdir}/last-{c}.png'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{A.out}.{c}.mp4', '-vf', f'select=eq(n\\,{len(frames) - 1})', '-frames:v', '1', p], check=True)
last = Image.open(f'{A.pngdir}/last-av1.png').convert('RGB')
last.save(A.out + '.poster.avif', quality=55, speed=4); last.save(A.out + '.poster.jpg', quality=82, optimize=True, progressive=True)
sz = {c: os.path.getsize(f'{A.out}.{c}.mp4') for c in ('av1', 'h264')}
print(json.dumps({'out': A.out, 'frames': len(frames), 'size': [W, H], 'bytes': sz}))
