# Graded stills (brief §5.6, §7a, §7e): slab texture + hero grounds, A-300 portrait and empty bay, A-301
# material crops, the plan-cut still. Same grade as the mezzanines (blacks on #0B0B0A, saturation -10% with
# chalk blue and orange protected). AVIF + JPEG, each fitted to its §7e budget.
# usage: python -I stills.py
import os, json, io
import numpy as np, cv2
from PIL import Image

S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
M = S + '/media'; N = M + '/new'
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = R + '/public/media'
SLAB = np.array([10, 11, 11], np.float32) / 255.0

def bump(h, lo, hi, soft=8.0): return np.clip(np.minimum(h - (lo - soft), (hi + soft) - h) / soft, 0, 1)
def grade(bgr8):
    f = bgr8.astype(np.float32) / 255.
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV); h = hsv[..., 0]
    hsv[..., 1] *= 1.0 - 0.10 * (1.0 - np.maximum(bump(h, 200, 230), bump(h, 8, 30)))
    f = SLAB + cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR) * (1 - SLAB)
    return (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8)
def exposure(bgr8, k):
    c = bgr8.astype(np.float32) / 255.; lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4) * k
    s = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(np.maximum(lin, 1e-8), 1 / 2.4) - 0.055)
    return (np.clip(s, 0, 1) * 255 + .5).astype(np.uint8)
def save(bgr8, base, budget_kb, jq=82):
    im = Image.fromarray(cv2.cvtColor(bgr8, cv2.COLOR_BGR2RGB))
    for q in (70, 64, 58, 52, 46, 40, 34, 28, 22):
        b = io.BytesIO(); im.save(b, 'AVIF', quality=q, speed=4)
        if b.tell() <= budget_kb * 1000: break
    open(base + '.avif', 'wb').write(b.getvalue())
    for jqq in (jq, 76, 70, 64, 58):
        bj = io.BytesIO(); im.save(bj, 'JPEG', quality=jqq, optimize=True, progressive=True)
        if bj.tell() <= budget_kb * 2500: break   # JPEG fallback: allowed ~2.5x the AVIF budget
    open(base + '.jpg', 'wb').write(bj.getvalue())
    return {'avifQ': q, 'avif': len(b.getvalue()), 'jpgQ': jqq, 'jpg': len(bj.getvalue()), 'budgetKB': budget_kb}
def fitsq(img, cx, cy, side, out):
    h, w = img.shape[:2]; side = min(side, w, h)
    x0 = int(np.clip(cx - side / 2, 0, w - side)); y0 = int(np.clip(cy - side / 2, 0, h - side))
    return cv2.resize(img[y0:y0 + side, x0:x0 + side], (out, out), interpolation=cv2.INTER_AREA)

rep = {}
ld14 = cv2.imread(M + '/lookdev/ld14.png')                      # 1024² seamless concrete
# clean tile (A1, A4-2): inpaint ld14's faint orange survey ticks so the site-wide tiled ground has no marks
_h = cv2.cvtColor(ld14, cv2.COLOR_BGR2HSV)
_m = ((_h[..., 0] <= 22) & (_h[..., 1] >= 70) & (_h[..., 2] >= 50)).astype(np.uint8)
_m = cv2.dilate(_m, np.ones((7, 7), np.uint8))
ld14 = cv2.inpaint(ld14, _m * 255, 6, cv2.INPAINT_TELEA)
tile = lambda w, h: np.tile(ld14, (h // 1024 + 1, w // 1024 + 1, 1))[:h, :w]
# tex-slab ships at FULL exposure: A1 tiles it site-wide multiplied by rgb(31 31 30) (≈12%). The hero
# grounds are pre-multiplied by exactly that (sRGB multiply, as CSS does) so the frame box matches the page.
MUL = np.array([30, 31, 31], np.float32) / 255.                   # BGR of rgb(31 31 30)
mul = lambda im: (im.astype(np.float32) * MUL + .5).astype(np.uint8)
rep['tex-slab'] = save(grade(ld14), P + '/tex/tex-slab', 120)
rep['hero-ground-169'] = save(mul(grade(tile(1920, 1076))), P + '/hero/hero-ground-169', 60)
rep['hero-ground-916'] = save(mul(grade(tile(1076, 1912))), P + '/hero/hero-ground-916', 70)
rep['ref21-portrait'] = save(cv2.resize(grade(cv2.imread(M + '/lookdev/ref21.png')), (800, 800), interpolation=cv2.INTER_AREA), P + '/stills/ref21-portrait', 100)
rep['bay-empty'] = save(cv2.resize(grade(cv2.imread(N + '/N02.png')), (1080, 1080), interpolation=cv2.INTER_AREA), P + '/stills/bay-empty', 120)
# material crops (2048² sources): centred on the subject, no robot
MAT = {1: (1038, 1000, 1300), 2: (560, 960, 1420), 3: (1113, 1113, 1100), 4: (1011, 1036, 1100), 5: (1075, 1062, 1200)}
for k, (cx, cy, side) in MAT.items():
    rep[f'mat-{k}'] = save(fitsq(grade(cv2.imread(N + f'/N07-{k}.png')), cx, cy, side, 1080), P + f'/stills/mat-{k}', 120)
# plan-cut still: registered b44 at 2.60 s (frame 62)
cap = cv2.VideoCapture(S + '/a5tmp/reg/b44.mp4'); cap.set(cv2.CAP_PROP_POS_FRAMES, 62); ok, f62 = cap.read()
rep['plan-b44-260'] = save(f62, P + '/plans/plan-b44-260', 180)
json.dump(rep, open(R + '/pipeline/out/stills.json', 'w'), indent=1)
print(json.dumps(rep, indent=1))
