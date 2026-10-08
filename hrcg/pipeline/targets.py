# D9 control target T7 (brief §5.5, §7d; from gt-spike/lockup.py). AprilTag tag36h11 ID 7, exported from the
# exact pattern, never redrawn: 8x8 SQUARE cells, each two stacked stretchers (2:1), so cells and tag are
# square (128 bricks); stack bond; rust joints at 10% of brick height; one-cell chalk quiet zone.
# Outputs: public/media/data/t7-brick.svg, public/kit/hrcg-t7.svg, public/kit/hrcg-t7-{letter,a4}.pdf,
#          public/media/stills/t7-proof.{avif,jpg}, public/media/data/t7-proof.json
# Check: pupil_apriltags must detect ID 7 in every exported file (SVG rasterised by our own rect parser,
# PDFs rasterised by pdftoppm) with a square quad (side ratio 1 +- 0.02). Exit 1 on failure.
# usage: python -I targets.py [--check-only]
import os, sys, re, json, subprocess, tempfile
import numpy as np, cv2
from PIL import Image, ImageDraw
from pupil_apriltags import Detector

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
TAG = S + '/concept/wild-spike/tag36_11_00007.png'
FONT = S + '/a5tmp/fonts/archivo-label.ttf'
DARK, CHALK, RUST = '#0B0B0A', '#ECE8E1', '#A8441C'
CHECK_ONLY = '--check-only' in sys.argv

g = (np.array(Image.open(TAG).convert('L')) < 128)[1:-1, 1:-1]     # 8x8: black border + 6x6 data
assert g.shape == (8, 8) and g[0].all() and g[-1].all() and g[:, 0].all() and g[:, -1].all()

# geometry in units where one cell = 100; panel = 10 cells (quiet zone of one cell all round)
C = 100.0
HB = C / 2 / 1.1            # brick height
J = 0.1 * HB                # joint = 10% of brick height
def bricks():
    out = []
    for y in range(8):
        for x in range(8):
            for k in range(2):
                x0 = (x + 1) * C + J / 2; y0 = (y + 1) * C + k * (C / 2) + J / 2
                out.append((x0, y0, C - J, C / 2 - J, DARK if g[y, x] else CHALK))
    return out
B = bricks(); assert len(B) == 128

def svg(title_comment=''):
    r = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" shape-rendering="crispEdges">',
         '<title>Control target T7: AprilTag tag36h11 ID 7 laid as 128 bricks in stack bond</title>',
         f'<!-- HRCG-2027 (planned). Control target T7. AprilTag family tag36h11, ID 7. 8x8 square cells of two stacked stretchers; rust joints; one-cell chalk quiet zone. A test target for developers, not a rule of the Games. {title_comment} -->',
         f'<rect x="0" y="0" width="1000" height="1000" fill="{CHALK}"/>',
         f'<rect x="100" y="100" width="800" height="800" fill="{RUST}"/>']
    for (x, y, w, h, c) in B:
        r.append(f'<rect x="{x:.3f}" y="{y:.3f}" width="{w:.3f}" height="{h:.3f}" fill="{c}"/>')
    r.append('</svg>')
    return '\n'.join(r) + '\n'

def raster_svg(text, px):
    """Rasterise our own rect-only SVG (supersampled 4x)."""
    vb = 1000.0; ss = 4; s = px * ss / vb
    im = Image.new('RGB', (px * ss, px * ss), 'white'); d = ImageDraw.Draw(im)
    for m in re.finditer(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9A-Fa-f]{6})"', text):
        x, y, w, h = (float(v) * s for v in m.groups()[:4])
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=m.group(5))
    return np.array(im.resize((px, px), Image.LANCZOS))

# The brick joints (rust lines through every cell) split the dark border into separate bricks; at large
# render sizes the detector needs its standard pre-blur (quad_sigma) to bridge them, as it would on a real
# camera image. Each check tries the default settings first, then quad_sigma 1.2 and 3.0; the setting that
# found the tag is recorded with the result.
DETS = [('default', Detector(families='tag36h11')), ('quad_sigma=1.2', Detector(families='tag36h11', quad_sigma=1.2, quad_decimate=1.0)),
        ('quad_sigma=3.0', Detector(families='tag36h11', quad_sigma=3.0, quad_decimate=1.0))]
def detect(rgb):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    for name, det in DETS:
        res = [r for r in det.detect(gray) if r.tag_id == 7]
        if res: break
    else:
        return None
    c = res[0].corners; sides = [np.linalg.norm(c[i] - c[(i + 1) % 4]) for i in range(4)]
    return {'corners': c.tolist(), 'sideRatio': float(max(sides) / min(sides)), 'sidePx': float(np.mean(sides)), 'detector': name}

def warp_blur(rgb):
    h, w = rgb.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]]); dst = np.float32([[w * .06, h * .1], [w * .95, 0], [w * .88, h], [0, h * .86]])
    out = cv2.warpPerspective(rgb, cv2.getPerspectiveTransform(src, dst), (w, h), borderValue=(11, 11, 10))
    return cv2.GaussianBlur(out, (5, 5), 1.4)

SVG = svg()
if not CHECK_ONLY:
    open(R + '/public/media/data/t7-brick.svg', 'w').write(SVG)
    open(R + '/public/kit/hrcg-t7.svg', 'w').write(svg('Printable vector master.'))

# ---------- PDFs (vector, matplotlib, TrueType embedded) ----------
TAG_EDGE_MM = 150.0                       # the 8x8 tag square (black border edge), identical on both papers
CELL_MM = TAG_EDGE_MM / 8
def pdf(path, paper_mm, label):
    import matplotlib; matplotlib.use('pdf')
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    from matplotlib.patches import Rectangle
    matplotlib.rcParams['pdf.fonttype'] = 42
    font_manager.fontManager.addfont(FONT)
    fp = font_manager.FontProperties(fname=FONT)
    W, H = paper_mm
    fig = plt.figure(figsize=(W / 25.4, H / 25.4))
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis('off')
    panel = CELL_MM * 10; ox = (W - panel) / 2; oy = 22.0
    k = CELL_MM / C
    ax.add_patch(Rectangle((ox, oy), panel, panel, color=CHALK, lw=0))
    ax.add_patch(Rectangle((ox + C * k, oy + C * k), 8 * C * k, 8 * C * k, color=RUST, lw=0))
    for (x, y, w, h, c) in B:
        ax.add_patch(Rectangle((ox + x * k, oy + y * k), w * k, h * k, color=c, lw=0))
    ty = oy + panel + 10
    edge_in = TAG_EDGE_MM / 25.4
    lines = ['HRCG-2027 · PLANNED · CONTROL TARGET T7',
             'APRILTAG FAMILY TAG36H11 · ID 7 · 128 BRICKS IN STACK BOND',
             f'PRINT AT 100% · TAG EDGE {TAG_EDGE_MM / 10:.1f} CM ({edge_in:.2f} IN), OUTER EDGE OF THE DARK BORDER',
             'A TEST TARGET FOR DEVELOPERS, NOT A RULE OF THE GAMES.',
             f'{label}']
    for i, t in enumerate(lines):
        ax.text(ox, ty + i * 6.2, t, fontproperties=fp, fontsize=9 if i < 4 else 7, color='#0B0B0A', va='top')
    fig.savefig(path); plt.close(fig)
    return f'{TAG_EDGE_MM / 10:.1f} CM ({edge_in:.2f} IN)'
if not CHECK_ONLY:
    edge_txt = pdf(R + '/public/kit/hrcg-t7-letter.pdf', (215.9, 279.4), 'US LETTER')
    pdf(R + '/public/kit/hrcg-t7-a4.pdf', (210.0, 297.0), 'A4')

# ---------- checks ----------
results = {}; ok = True
for name, path in (('t7-brick.svg', R + '/public/media/data/t7-brick.svg'), ('hrcg-t7.svg', R + '/public/kit/hrcg-t7.svg')):
    txt = open(path).read()
    for px in (1000, 400, 200, 120):   # four scales (brief §5.5)
        r = detect(raster_svg(txt, px)); results[f'{name}@{px}'] = r and {'sideRatio': round(r['sideRatio'], 4), 'detector': r['detector']}
        ok &= bool(r) and abs(r['sideRatio'] - 1) <= 0.02
    r = detect(warp_blur(raster_svg(txt, 600))); results[f'{name}@600 warped+blur'] = r and {'sideRatio': round(r['sideRatio'], 4), 'detector': r['detector']}
    ok &= bool(r)
with tempfile.TemporaryDirectory() as td:
    for name in ('hrcg-t7-letter.pdf', 'hrcg-t7-a4.pdf'):
        subprocess.run(['pdftoppm', '-r', '100', '-png', '-singlefile', R + '/public/kit/' + name, td + '/p'], check=True)
        im = np.array(Image.open(td + '/p.png').convert('RGB'))
        r = detect(im); results[name + '@100dpi'] = r and {'sideRatio': round(r['sideRatio'], 4), 'sidePx': round(r['sidePx'], 1), 'detector': r['detector']}
        ok &= bool(r) and abs(r['sideRatio'] - 1) <= 0.02
        if r:   # printed tag edge measured back from the raster: px / dpi * 25.4
            results[name + ' measuredEdgeMm'] = round(r['sidePx'] / 100 * 25.4, 1)

# proof strip: flat / warped + blurred / smallest detected, quads drawn
flat = raster_svg(SVG, 380)
wb = warp_blur(raster_svg(SVG, 380))
smallest = None
for px in range(120, 12, -2):
    im = raster_svg(SVG, px)
    r = detect(im)
    if r: smallest = (px, im, r)
    else: break
tag_px = smallest[2]['sidePx']               # width of the detected tag square in px
panel_px = smallest[0]
def draw(im, r, label):
    im = cv2.cvtColor(im, cv2.COLOR_RGB2BGR).copy()
    if r:
        c = np.array(r['corners'], np.int32); cv2.polylines(im, [c], True, (232, 152, 111), 2)
    return im
tiles = []
for im, lab in ((flat, 'flat'), (wb, 'warped')):
    tiles.append(draw(im, detect(im), lab))
sm = cv2.resize(cv2.cvtColor(smallest[1], cv2.COLOR_RGB2BGR), (smallest[0], smallest[0]), interpolation=cv2.INTER_NEAREST)
canvas = np.full((380, 380, 3), (10, 11, 11), np.uint8)
big = cv2.resize(sm, (smallest[0] * 3, smallest[0] * 3), interpolation=cv2.INTER_NEAREST)
o = (380 - big.shape[0]) // 2; canvas[o:o + big.shape[0], o:o + big.shape[1]] = big
c = (np.array(smallest[2]['corners']) * 3 + o).astype(np.int32); cv2.polylines(canvas, [c], True, (232, 152, 111), 2)
tiles.append(canvas)
pad = lambda t: cv2.copyMakeBorder(t, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=(10, 11, 11))
strip = np.hstack([pad(t) for t in tiles])
strip = cv2.resize(strip, (1200, 400), interpolation=cv2.INTER_AREA)
if not CHECK_ONLY:
    rgb = cv2.cvtColor(strip, cv2.COLOR_BGR2RGB)
    Image.fromarray(rgb).save(R + '/public/media/stills/t7-proof.avif', quality=60, speed=4)
    Image.fromarray(rgb).save(R + '/public/media/stills/t7-proof.jpg', quality=85)
    json.dump({'family': 'tag36h11', 'id': 7, 'bricks': 128, 'detector': 'pupil_apriltags (open-source AprilTag library)',
               'renders': ['flat', 'warped + blurred', 'smallest detected'],
               'smallestDetectedPx': int(round(tag_px)), 'smallestDetectedPanelPx': panel_px,
               'smallestLabel': f'{int(round(tag_px))} PX WIDE',
               'printedEdge': {'letter': edge_txt, 'a4': edge_txt, 'mm': TAG_EDGE_MM},
               'checks': results, 'pass': bool(ok)}, open(R + '/public/media/data/t7-proof.json', 'w'), indent=1)
print(json.dumps({'pass': bool(ok), 'smallestTagPx': round(tag_px, 1), 'checks': results}, indent=1))
sys.exit(0 if ok else 1)
