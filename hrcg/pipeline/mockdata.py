# MOCK data files (depth grids, meta, plate, matte, section stills, lines, T7 placeholders) for the
# first build wave. Same formats and paths as the real D1/D3/D5/D9 outputs; values are approximate.
# usage: python -I mockdata.py <tmpdir with f24.png f84.png> <public/media>
import sys, os, json, struct
import numpy as np, cv2
from PIL import Image

T, P = sys.argv[1], sys.argv[2]
S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
KIT = os.path.join(os.path.dirname(P.rstrip('/')), 'kit')
os.makedirs(KIT, exist_ok=True)
D = np.load(S + '/concept/gt-spike/c34-rgbd.npy').astype(np.float32)  # (61,518,910) step 2, near=1
d84, d24 = D[42], D[12]
f84 = cv2.imread(T + '/f84.png'); f24 = cv2.imread(T + '/f24.png')

def save_pair(bgr, base, q=50):
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    im.save(base + '.avif', quality=q, speed=6); im.save(base + '.jpg', quality=82, optimize=True)

def grid(d, cols, rows):
    g = cv2.resize(d, (cols, rows), interpolation=cv2.INTER_AREA)
    return (np.clip(g, 0, 1) * 65535 + .5).astype('<u2')

def meta(frame, cols, rows, w, h, mock=True):
    return {'mock': mock, 'frame': frame, 'w': w, 'h': h,
            'grid': {'cols': cols, 'rows': rows, 'file': 'uint16 little-endian, row-major, top row first, left to right; d = v/65535 (relative inverse depth, near = 1)'},
            'a': 0.15, 'b': 1.6, 'f': 1.2, 'pivotZ': 1.6, 'nearD': 0.75, 'farD': 0.12,
            'yaw': {'auto': 8, 'min': -6, 'max': 10}, 'pitch': {'auto': -2.5, 'min': -3, 'max': 3},
            'dolly': 0.04, 'overscan': 0.12, 'typeLayers': [], 'occlusion': {'yaw0': None, 'rest': None},
            'nearContrast': {'p10': None, 'median': None}}

# hero 16:9
grid(d84, 257, 145).tofile(P + '/hero/hero-depth-169.bin')
json.dump(meta(84, 257, 145, 1920, 1076), open(P + '/hero/hero-meta-169.json', 'w'), indent=1)
plate = (cv2.GaussianBlur(cv2.resize(f84, (960, 538), interpolation=cv2.INTER_AREA), (0, 0), 6) * 0.6).astype(np.uint8)
save_pair(plate, P + '/hero/hero-plate-169', 40)
dm = cv2.resize(d84, (1920, 1076))
a = np.clip((dm - 0.45) / 0.1, 0, 1); a[int(1076 * .62):] = 0
rgba = np.dstack([cv2.cvtColor(f84, cv2.COLOR_BGR2RGB), (a * 255).astype(np.uint8)])
Image.fromarray(rgba, 'RGBA').save(P + '/hero/hero-matte-169.webp', quality=70)
# hero 9:16 (mock: same crop as hero-snap-916 mock, x 480..1085 of the 1920 frame)
x0 = int(480 / 1920 * 910); x1 = int(1085 / 1920 * 910)
d916 = d84[:, x0:x1]
grid(d916, 145, 257).tofile(P + '/hero/hero-depth-916.bin')
json.dump(meta(84, 145, 257, 1076, 1912), open(P + '/hero/hero-meta-916.json', 'w'), indent=1)
c916 = cv2.resize(f84[:, 480:1085], (1076, 1912))
save_pair((cv2.GaussianBlur(cv2.resize(c916, (538, 956)), (0, 0), 6) * 0.6).astype(np.uint8), P + '/hero/hero-plate-916', 40)
a9 = np.clip((cv2.resize(d916, (1076, 1912)) - 0.45) / 0.1, 0, 1); a9[int(1912 * .62):] = 0
Image.fromarray(np.dstack([cv2.cvtColor(c916, cv2.COLOR_BGR2RGB), (a9 * 255).astype(np.uint8)]), 'RGBA').save(P + '/hero/hero-matte-916.webp', quality=70)

# section A-A
save_pair(f24, P + '/section/sec-c34-color', 50)
d8 = cv2.resize(d24, (960, 540), interpolation=cv2.INTER_AREA)
cv2.imwrite(P + '/section/sec-c34-depth.png', (np.clip(d8, 0, 1) * 255 + .5).astype(np.uint8))
dd = cv2.resize(d24, (1920, 1076)); col = f24.astype(np.float32)
slab = np.array([10, 11, 11], np.float32); chalk = np.array([225, 232, 236], np.float32)
pencil = np.array([140, 149, 154], np.float32); blue = np.array([232, 152, 111], np.float32)
q = (dd * 14).astype(np.uint8)
edge = cv2.morphologyEx(q, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
for name, s in (('near', 0.15), ('mid', 0.5), ('far', 0.85)):
    u = 0.85 + (0.15 - 0.85) * s   # nearD -> farD
    w = 0.012
    out = col.copy()
    front = dd > u + w
    draw = (slab * (1 - dd[..., None] ** 1.4) + chalk * dd[..., None] ** 1.4) * .85
    draw[edge] = pencil
    out[front] = draw[front]
    band = 1 - np.clip(np.abs(dd - u) / w, 0, 1)
    out = out * (1 - band[..., None]) + blue * band[..., None]
    save_pair(out.astype(np.uint8), P + '/section/sec-' + name, 50)

# lines (D5 schema; mock = raw spike segments, unmerged, unregistered)
raw = json.load(open(S + '/concept/gt-spike/lines_b44.json'))
segs = [{'id': i + 1, 'a': [round(x1 / 1024, 4), round(y1 / 1024, 4)], 'b': [round(x2 / 1024, 4), round(y2 / 1024, 4)], 'order': i + 1}
        for i, (x1, y1, x2, y2) in enumerate(raw[:15])]
json.dump({'mock': True, 'space': 'normalised 0..1 of the registered plan frame (plan-b44 and plan-b44-260), x right, y down',
           'borderRect': [120 / 1440, 120 / 1440, 1320 / 1440, 1320 / 1440], 'segments': segs,
           'fresh': {'a': segs[0]['a'], 'b': segs[0]['b']}, 'gridlines': []},
          open(P + '/data/lines-b44.json', 'w'), indent=1)
open(P + '/data/trace-t43.svg', 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none" stroke="#9A958C" stroke-width="1.25" vector-effect="non-scaling-stroke"><!-- MOCK --><rect x="560" y="120" width="300" height="400"/></svg>\n')

# T7 placeholder (the real D9 pass replaces these; the pattern itself is already exact)
tag = (np.array(Image.open(S + '/concept/wild-spike/tag36_11_00007.png').convert('L')) < 128)[1:-1, 1:-1]
cells = []
for y in range(8):
    for x in range(8):
        for k in range(2):
            fill = '#0B0B0A' if tag[y, x] else '#ECE8E1'
            cells.append(f'<rect x="{x * 20 + 21}" y="{y * 20 + k * 10 + 20.5}" width="18" height="9" fill="{fill}"/>')
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ECE8E1"/>'
       '<rect x="20" y="20" width="160" height="160" fill="#A8441C"/>' + ''.join(cells) + '</svg>\n')
open(P + '/data/t7-brick.svg', 'w').write(svg); open(KIT + '/hrcg-t7.svg', 'w').write(svg)
json.dump({'mock': True, 'smallestDetectedPx': None, 'printedEdge': {'letter': None, 'a4': None}}, open(P + '/data/t7-proof.json', 'w'))
Image.new('RGB', (1200, 400), (11, 11, 10)).save(P + '/stills/t7-proof.avif', quality=40)
Image.new('RGB', (1200, 400), (11, 11, 10)).save(P + '/stills/t7-proof.jpg', quality=70)
def tiny_pdf(path, w, h):
    content = b'0.925 0.91 0.882 rg 0 0 %d %d re f' % (w, h)
    objs = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Contents 4 0 R >>' % (w, h),
            b'<< /Length %d >>\nstream\n' % len(content) + content + b'\nendstream']
    out = b'%PDF-1.4\n'; offs = []
    for i, o in enumerate(objs):
        offs.append(len(out)); out += b'%d 0 obj\n' % (i + 1) + o + b'\nendobj\n'
    x = len(out); out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1)
    out += b''.join(b'%010d 00000 n \n' % o for o in offs)
    out += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, x)
    open(path, 'wb').write(out)
tiny_pdf(KIT + '/hrcg-t7-letter.pdf', 612, 792); tiny_pdf(KIT + '/hrcg-t7-a4.pdf', 595, 842)
print('mock data ok')
