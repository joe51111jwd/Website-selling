# R1 PLATES + R2 ARENA (brief §7c) and the web encodes (§7e): every site video cut from the graded
# mezzanines, AV1 (SVT, +faststart) first and H.264 fallback, each tried from the best quality CRF up until it
# fits its §7e byte budget; poster (first frame) as AVIF + JPEG. Seams: a clip loops only when
# pipeline/out/seams.json (D11, measured on the mezzanine) has an accepted seam; the loop is then encoded
# with a 12-frame crossfade at the seam. Everything else plays once and holds its last frame.
# usage: python -I plates.py [id ...]
import sys, os, json, subprocess
import numpy as np, cv2
from PIL import Image

S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
MZ, REG = S + '/a5tmp/mezz', S + '/a5tmp/reg'
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = R + '/public/media'
TMP = S + '/a5tmp/plates'; os.makedirs(TMP, exist_ok=True)
seams = json.load(open(R + '/pipeline/out/seams.json')) if os.path.exists(R + '/pipeline/out/seams.json') else {}
MB = 1e6
AV1_CRF = [34, 36, 38, 40, 42, 44, 46]
H264_CRF = [23, 24, 26, 28, 30]

#      id            dir             source              ffmpeg -vf (on the mezzanine)                       budget AV1, H.264 (MB)  seamOf
PLATES = [
    ('el-c30',     'perspectives', MZ + '/n09r.mp4', 'crop=1920:804:0:40',                                 0.50, 1.00, 'n09r'),
    ('el-c30-m',   'perspectives', MZ + '/n09r.mp4', 'crop=861:1076:330:0,scale=1080:1350:flags=lanczos',  0.45, 1.00, 'n09r'),
    ('el-c31',     'perspectives', MZ + '/c31.mp4',  'crop=861:1076:1059:0,scale=1080:1350:flags=lanczos', 0.50, 1.00, None),
    ('el-c32',     'perspectives', MZ + '/c32.mp4',  None,                                                  0.50, 1.00, None),
    ('el-c33',     'perspectives', MZ + '/c33.mp4',  'crop=1920:804:0:272',                                0.50, 1.00, None),
    ('det-v0',     'details',      MZ + '/v0.mp4',   'trim=end_frame=84,setpts=PTS-STARTPTS,crop=1076:1076:{v0x}:0', 0.30, 0.60, None),
    ('det-n03',    'details',      MZ + '/n03.mp4',  'crop=1076:1076:638:0',                               0.30, 0.60, None),
    ('det-n04',    'details',      MZ + '/n04.mp4',  'crop=1076:1076:383:0',                               0.30, 0.60, None),
] + [(f'plan-{b}', 'plans', f'{REG}/{b}.mp4', 'scale=1080:1080:flags=lanczos', 0.45, 0.90, f'reg-{b}') for b in ('b40', 'b41', 'b42', 'b43', 'b44')] \
  + [(f'plan-{b}-m', 'plans', f'{REG}/{b}.mp4', 'scale=720:720:flags=lanczos', 0.27, 0.90, f'reg-{b}') for b in ('b40', 'b41', 'b42', 'b43', 'b44')]
CFG = json.load(open(R + '/pipeline/out/plates-cfg.json')) if os.path.exists(R + '/pipeline/out/plates-cfg.json') else {}

def read_frames(src, vf):
    """Decode the mezzanine through the crop/scale filter into raw BGR frames."""
    pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], capture_output=True, text=True)
    cmd = ['ffmpeg', '-v', 'error', '-i', src] + (['-vf', vf] if vf else []) + ['-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
    # probe output size by decoding one frame through the same filter
    one = subprocess.run(['ffmpeg', '-v', 'error', '-i', src] + (['-vf', vf] if vf else []) + ['-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    im = cv2.imdecode(np.frombuffer(one, np.uint8), cv2.IMREAD_COLOR); h, w = im.shape[:2]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (w * h * 3)
    return np.frombuffer(raw, np.uint8).reshape(n, h, w, 3), w, h

def seam_loop(fr, seam):
    a, b = seam['inFrame'], seam['outFrame']; X = 12
    body = list(fr[a + X:b - X + 1])
    tail = [cv2.addWeighted(fr[b - X + 1 + k], 1 - (k + 1) / (X + 1), fr[a + k + 1], (k + 1) / (X + 1), 0) for k in range(X)]
    return np.stack(body + tail)

def encode(fr, w, h, out, codec, crf):
    base = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', '24', '-i', '-', '-an', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    if codec == 'av1': args = ['-c:v', 'libsvtav1', '-preset', '8', '-crf', str(crf), '-g', '120']
    else: args = ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf)]
    subprocess.run(base + args + [out], input=fr.tobytes(), check=True)
    return os.path.getsize(out)

def fit(fr, w, h, out, codec, budget):
    ladder = AV1_CRF if codec == 'av1' else H264_CRF
    for crf in ladder:
        sz = encode(fr, w, h, out, codec, crf)
        if sz <= budget * MB: return crf, sz, True
    return crf, sz, False

def poster(fr, base):
    im = Image.fromarray(cv2.cvtColor(fr[0], cv2.COLOR_BGR2RGB))
    im.save(base + '.poster.avif', quality=55, speed=4); im.save(base + '.poster.jpg', quality=80, optimize=True, progressive=True)

def arena(phone=False):
    """R2: bays 01-04 from the registered plan mezzanines, one row, slot 05 left black. Bays 350², gaps 35
    (phone 200², gaps 20). No seams -> each bay plays once from its phase offset and holds its last frame."""
    bay, gap = (200, 20) if phone else (350, 35)
    W = 5 * bay + 4 * gap
    offs = [0.0, 0.4, 0.8, 1.2]
    clips = []
    for k, b in enumerate(('b40', 'b41', 'b42', 'b43')):
        fr, _, _ = read_frames(f'{REG}/{b}.mp4', f'scale={bay}:{bay}:flags=lanczos')
        o = int(round(offs[k] * 24)); seq = list(fr[o:]) + [fr[-1]] * o
        clips.append(np.stack(seq[:121]))
    out = np.zeros((121, bay, W, 3), np.uint8); out[:] = (10, 11, 11)
    for k in range(4): out[:, :, k * (bay + gap):k * (bay + gap) + bay] = clips[k]
    return out, W, bay

def run(ids):
    report = json.load(open(R + '/pipeline/out/plates.json')) if os.path.exists(R + '/pipeline/out/plates.json') else {}
    jobs = [p for p in PLATES if not ids or p[0] in ids]
    for (pid, d, src, vf, b1, b2, seamkey) in jobs:
        vf = vf.format(**CFG) if vf else vf
        fr, w, h = read_frames(src, vf)
        seam = seams.get(seamkey) if seamkey else None
        if seam and seam.get('accepted'): fr = seam_loop(fr, seam)
        base = f'{P}/{d}/{pid}'
        c1 = fit(fr, w, h, base + '.av1.mp4', 'av1', b1); c2 = fit(fr, w, h, base + '.h264.mp4', 'h264', b2)
        poster(fr, base)
        report[pid] = {'src': os.path.basename(src), 'vf': vf, 'size': [w, h], 'frames': len(fr), 'loop': bool(seam and seam.get('accepted')),
                       'av1': {'crf': c1[0], 'bytes': c1[1], 'withinBudget': c1[2], 'budgetMB': b1},
                       'h264': {'crf': c2[0], 'bytes': c2[1], 'withinBudget': c2[2], 'budgetMB': b2}}
        print(pid, json.dumps(report[pid]))
    for phone in (False, True):
        pid = 'arena-0104' + ('-m' if phone else '')
        if ids and pid not in ids: continue
        fr, w, h = arena(phone)
        base = f'{P}/arena/{pid}'
        c1 = fit(fr, w, h, base + '.av1.mp4', 'av1', 0.4 if not phone else 0.25)
        c2 = fit(fr, w, h, base + '.h264.mp4', 'h264', 0.8 if not phone else 0.5)
        poster(fr, base)
        if not phone:   # arena-poster: the strip's first frame + b44's last frame (registered) in slot 05
            b44, _, _ = read_frames(f'{REG}/b44.mp4', f'scale={h}:{h}:flags=lanczos')
            pf = fr[0].copy(); pf[:, 4 * (h + h // 10):4 * (h + h // 10) + h] = b44[-1]
            im = Image.fromarray(cv2.cvtColor(pf, cv2.COLOR_BGR2RGB))
            im.save(f'{P}/arena/arena-poster.avif', quality=60, speed=4); im.save(f'{P}/arena/arena-poster.jpg', quality=84, optimize=True)
        report[pid] = {'size': [w, h], 'av1': {'crf': c1[0], 'bytes': c1[1], 'withinBudget': c1[2]}, 'h264': {'crf': c2[0], 'bytes': c2[1], 'withinBudget': c2[2]}}
        print(pid, json.dumps(report[pid]))
    json.dump(report, open(R + '/pipeline/out/plates.json', 'w'), indent=1)

if __name__ == '__main__':
    run(sys.argv[1:])
