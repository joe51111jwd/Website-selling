# Graded stills (brief §5.6, §7a, §7e): slab texture + hero grounds, A-300 portrait and empty bay, A-301
# material crops, the plan-cut still. Same grade as the mezzanines (blacks on #0B0B0A, saturation -10% with
# chalk blue and orange protected). AVIF + JPEG, each fitted to its §7e budget.
# usage: python -I stills.py [--only id,id] [--ghost 0.12]
#   --only: rebuild just these ids (e.g. --only hero-ground-169,hero-ground-916); the report is merged.
#   --ghost: opacity of the pre-snap ghost baked into the hero grounds (FIXLIST-1 §8 H-2b), default 0.12.
import os, sys, json, io, subprocess
import numpy as np, cv2
from PIL import Image

ARGV = sys.argv[1:]
def opt(name, default):
    return ARGV[ARGV.index(name) + 1] if name in ARGV else default
ONLY = set(x for x in opt('--only', '').split(',') if x)
def want(k): return not ONLY or k in ONLY
GHOST = float(opt('--ghost', '0.12'))

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

def film_frame(path, n, crop=None):
    """frame n of a video, decoded with the system ffmpeg (BGR uint8)"""
    vf = f'select=eq(n\\,{n})' + (f',crop={crop}' if crop else '')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', vf, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                         capture_output=True, check=True).stdout
    return cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
def near_darken(bgr8, dk):
    """the hero film's NEAR darkening (hero.py), so a ghost cut from the mezzanine matches the film's look"""
    H, W = bgr8.shape[:2]; x0, y0, x1, y1 = dk['box']; amt = dk['linearLightRemoved']
    m = np.zeros((H, W), np.float32); mg = 0.03 * max(W, H)
    cv2.ellipse(m, (int((x0 + x1) / 2 * W), int((y0 + y1) / 2 * H)), (int((x1 - x0) / 2 * W * 1.18 + mg), int((y1 - y0) / 2 * H * 1.35 + mg)), 0, 0, 360, 1.0, -1)
    sig = max(W, H) * 0.045
    m = cv2.GaussianBlur(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(sig * 2.5) | 1, int(sig * 2.5) | 1))), (0, 0), sig)
    m = (m / m.max())[..., None]
    c = bgr8.astype(np.float32) / 255.; lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4) * (1 - amt * m)
    s_ = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(np.maximum(lin, 1e-8), 1 / 2.4) - 0.055)
    return (np.clip(s_, 0, 1) * 255 + .5).astype(np.uint8)
# H-2b (director, FIXLIST-1 §8): the A-000 ground carries a faint PRE-SNAP GHOST of the same film, so the first
# paint is not an empty slab and the film rises out of it. 16:9: c34 frame 60 = the hero film's FIRST frame
# (decoded from the shipped AV1 file, so the film starts exactly where the ghost is). 9:16: the hero film starts at
# N01b frame 76, after the snap (dust already up), so the ghost is N01b frame 48: 07 crouched, holding the line taut,
# same static camera and the same 1076x1912 crop at y 6, with the film's NEAR darkening applied. Blend: the graded
# frame at GHOST opacity over the slab ground (sRGB "normal" blend, as a CSS layer at that opacity would be).
GHOST_SRC = {
    'hero-ground-169': dict(kind='film', path=P + '/hero/hero-snap-169.av1.mp4', n=0, src='c34 frame 60 (hero-snap-169 frame 0)'),
    'hero-ground-916': dict(kind='mezz', path=S + '/a5tmp/mezz/n01b.mp4', n=48, crop='1076:1912:0:6', meta=P + '/hero/hero-meta-916.json',
                            src='N01b frame 48 (pre-snap; the 9:16 film starts at N01b frame 76)'),
}
def ghost_ground(gid, ground):
    g = GHOST_SRC[gid]
    if g['kind'] == 'film':
        fr = film_frame(g['path'], g['n'])
    else:
        fr = near_darken(film_frame(g['path'], g['n'], g['crop']), json.load(open(g['meta']))['nearDarken'])
    assert fr.shape == ground.shape, (fr.shape, ground.shape)
    out = ground.astype(np.float32) * (1 - GHOST) + fr.astype(np.float32) * GHOST
    return (np.clip(out, 0, 255) + .5).astype(np.uint8), fr

rep = {}
_rp = R + '/pipeline/out/stills.json'
if ONLY and os.path.exists(_rp): rep = json.load(open(_rp))
ld14 = cv2.imread(M + '/lookdev/ld14.png')                      # 1024² seamless concrete
# clean tile (A1, A4-2): inpaint ld14's faint orange survey ticks so the site-wide tiled ground has no marks
_lab = cv2.cvtColor(ld14, cv2.COLOR_BGR2LAB).astype(np.float32)
_a, _b = _lab[..., 1] - 128, _lab[..., 2] - 128
_m = ((_a > 5) | (np.hypot(_a, _b) > 9)).astype(np.uint8)          # chromatic (orange/pink) marks
_m = cv2.morphologyEx(_m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
_n, _lb, _st, _ = cv2.connectedComponentsWithStats(_m, 8)
_m = np.isin(_lb, [i for i in range(1, _n) if _st[i, 4] >= 30]).astype(np.uint8)   # ticks, not specks
_m = cv2.dilate(_m, np.ones((11, 11), np.uint8))
ld14 = cv2.inpaint(ld14, _m * 255, 6, cv2.INPAINT_TELEA)
tile = lambda w, h: np.tile(ld14, (h // 1024 + 1, w // 1024 + 1, 1))[:h, :w]
# tex-slab ships at FULL exposure: A1 tiles it site-wide multiplied by rgb(31 31 30) (≈12%). The hero
# grounds are pre-multiplied by exactly that (sRGB multiply, as CSS does) so the frame box matches the page.
MUL = np.array([30, 31, 31], np.float32) / 255.                   # BGR of rgb(31 31 30)
mul = lambda im: (im.astype(np.float32) * MUL + .5).astype(np.uint8)
if want('tex-slab'): rep['tex-slab'] = save(grade(ld14), P + '/tex/tex-slab', 120)
for gid, (gw, gh) in (('hero-ground-169', (1920, 1076)), ('hero-ground-916', (1076, 1912))):
    if not want(gid): continue
    base = mul(grade(tile(gw, gh)))
    gimg, gfr = ghost_ground(gid, base)
    rep[gid] = save(gimg, P + '/hero/' + gid, 60)          # H-2b: <= 60 kB AVIF each (was 60 / 70)
    rep[gid]['ghost'] = {'source': GHOST_SRC[gid]['src'], 'opacity': GHOST, 'blend': 'sRGB normal over the slab ground'}
    if os.environ.get('STILLS_QA'):
        cv2.imwrite(os.environ['STILLS_QA'] + f'/{gid}-ghost.png', gimg); cv2.imwrite(os.environ['STILLS_QA'] + f'/{gid}-slab.png', base)
if want('ref21-portrait'): rep['ref21-portrait'] = save(cv2.resize(grade(cv2.imread(M + '/lookdev/ref21.png')), (800, 800), interpolation=cv2.INTER_AREA), P + '/stills/ref21-portrait', 100)
if want('bay-empty'): rep['bay-empty'] = save(cv2.resize(grade(cv2.imread(N + '/N02.png')), (1080, 1080), interpolation=cv2.INTER_AREA), P + '/stills/bay-empty', 120)
# material crops (2048² sources): centred on the subject, no robot
MAT = {1: (1038, 1000, 1300), 2: (560, 960, 1420), 3: (1113, 1113, 1100), 4: (1011, 1036, 1100), 5: (1075, 1062, 1200)}
for k, (cx, cy, side) in MAT.items():
    if not want(f'mat-{k}'): continue
    rep[f'mat-{k}'] = save(fitsq(grade(cv2.imread(N + f'/N07-{k}.png')), cx, cy, side, 1080), P + f'/stills/mat-{k}', 120)
# plan-cut still: registered b44 at 2.60 s (frame 62)
if want('plan-b44-260'):
    cap = cv2.VideoCapture(S + '/a5tmp/reg/b44.mp4'); cap.set(cv2.CAP_PROP_POS_FRAMES, 62); ok, f62 = cap.read()
    rep['plan-b44-260'] = save(f62, P + '/plans/plan-b44-260', 180)
json.dump(rep, open(R + '/pipeline/out/stills.json', 'w'), indent=1)
print(json.dumps(rep, indent=1))
