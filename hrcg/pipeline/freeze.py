# D1 / D2 hero freeze (brief §4.1, §7d; from gt-spike/proof.py + rgbd.py).
# Input: the LAST frame of each encoded hero-snap web file (AV1 and H.264), decoded to PNG.
# Output (into <outdir>, suffix 169 or 916):
#   hero-depth-<s>.bin   Uint16 LE vertex grid (257x145 or 145x257), row-major, top row first; d = v/65535, near = 1
#   hero-still-<s>-{av1,h264}.{avif,jpg}, hero-plate-<s>.{avif,jpg}, hero-matte-<s>.webp, hero-meta-<s>.json
#   <qadir>/limit-<s>-*.png (nine limit poses + rest), occlusion/contrast overlays
# Gates (binding): FAR bite 3-10% at yaw 0 and <=15% at rest; NEAR >=3:1 on >=90% of glyph pixels;
# no exposed frame edge in the nine limit-pose renders. The FAR block may move +-0.03, NEAR +-0.05.
# usage: python -I freeze.py <av1.png> <h264.png> <outdir> <qadir> <169|916> [--analyse] [--a A --b B]
#   --analyse: only measure (used on the mezzanine frame before R3, to decide NEAR darkening).
import sys, os, json, math, argparse
import numpy as np, cv2, onnxruntime as ort
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('av1'); ap.add_argument('h264'); ap.add_argument('outdir'); ap.add_argument('qadir'); ap.add_argument('suffix')
ap.add_argument('--analyse', action='store_true'); ap.add_argument('--a', type=float); ap.add_argument('--b', type=float)
ap.add_argument('--frame', type=int, default=84); ap.add_argument('--darken', help='json of the NEAR darkening baked by R3 (recorded in meta)')
A = ap.parse_args()
S = '/tmp/claude-0/-home-user/a462cba4-955f-5044-9e19-3a11e18ef1bf/scratchpad'
FONT = S + '/a5tmp/fonts/bs-h1.ttf'
MODEL = S + '/concept/wild-spike/da2s.onnx'
os.makedirs(A.outdir, exist_ok=True); os.makedirs(A.qadir, exist_ok=True)
SUF = A.suffix; PH = SUF == '916'

bgr = cv2.imread(A.av1); H, W = bgr.shape[:2]
rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

# ---------- depth (DA2-S, once, on the AV1 frame) ----------
IW, IH = (728, 1288) if PH else (1288, 728)
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(MODEL, so, providers=['CPUExecutionProvider'])
x = cv2.resize(rgb, (IW, IH), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
raw = sess.run(None, {'pixel_values': x})[0][0]
lo, hi = np.percentile(raw, 1), np.percentile(raw, 99.5)
d0 = np.clip((raw - lo) / (hi - lo), 0, 1).astype(np.float32)
dup = cv2.resize(d0, (W, H), interpolation=cv2.INTER_LINEAR)
guide = (rgb.astype(np.float32) / 255.).mean(axis=2)
d = np.clip(cv2.ximgproc.guidedFilter(guide, dup, 8, 1e-3), 0, 1)  # guided-filter upsample

COLS, ROWS = (145, 257) if PH else (257, 145)
gx = (np.arange(COLS) / (COLS - 1) * (W - 1)).astype(np.float32)
gy = (np.arange(ROWS) / (ROWS - 1) * (H - 1)).astype(np.float32)
mx, my = np.meshgrid(gx, gy)
grid = cv2.remap(d, mx, my, cv2.INTER_LINEAR)
# the GL mesh interpolates linearly between vertices: the depth the viewer sees is the grid, upsampled
dmesh = cv2.resize(grid, (W, H), interpolation=cv2.INTER_LINEAR)

# ---------- camera model (brief §4.1) ----------
f = 1.2
a = A.a if A.a is not None else 0.15
b = A.b if A.b is not None else 1.6
def zof(dd): return 1.0 / (a + b * dd)
ASP = H / W                      # ndc y range is [-ASP, ASP]
Z_FAR_T, Z_NEAR_T = 2.6, 1.05    # type planes
D_FAR_T = (1 / Z_FAR_T - a) / b
if PH and A.a is None:
    # Phone (D2): 07 is smaller and farther in the 9:16 take, so with the desktop mapping its shoulder sits
    # BEHIND the FAR plane (no bite possible). Put the FAR plane "just behind 07's shoulder" as on desktop:
    # the FAR depth threshold = 0.85 x 07's upper-body depth (Otsu split of the upper frame), a from it.
    up = d[int(H * 0.2):int(H * 0.55), int(W * 0.2):int(W * 0.85)]
    thr, _ = cv2.threshold((up * 255).astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    rob = up[up > thr / 255.]
    D_FAR_T = float(0.85 * np.percentile(rob, 30))
    a = 1 / Z_FAR_T - D_FAR_T * b

# robot region: what is nearer than the FAR plane in the upper part of the frame
font_px = (0.075 if PH else 0.131) * H
ft = ImageFont.truetype(FONT, int(round(font_px)))
cap = 0.8 * font_px; step = 0.86 * font_px

def layout(far_dx=0.0, far_dy=0.0, near_dx=0.0, near_dy=0.0):
    """Exactly where CoverStage (A2) draws the H1 (requests/A2-3): two tight stacks at line-height .86;
    FAR hangs from its first cap-top, NEAR stands on the chalk line (BUILD?'s baseline 0.005 above it),
    NEAR's right edge at 0.885 (16:9) / 0.865 (9:16) so the chalk box and control point clear the "?"."""
    if PH:
        fx, nx = 0.08 + far_dx, 0.865 + near_dx
        fb1 = (0.10 + far_dy) * H + cap; nb2 = (0.775 + near_dy) * H
    else:
        fx, nx = 0.12 + far_dx, 0.885 + near_dx
        fb1 = (0.14 + far_dy) * H + cap; nb2 = (0.755 + near_dy) * H
    far = [('WHAT CAN A', fx * W, fb1, 'ls'), ('HUMANOID', fx * W, fb1 + step, 'ls')]
    near = [('ACTUALLY', nx * W, nb2 - step, 'rs'), ('BUILD?', nx * W, nb2, 'rs')]
    return far, near

def raster(lines, scale=1):
    im = Image.new('L', (W * scale, H * scale), 0); dr = ImageDraw.Draw(im)
    fs = ImageFont.truetype(FONT, int(round(font_px * scale)))
    for t, x0, y0, anc in lines:
        # letter-spacing -0.005em: shift each glyph by its cumulative tracking (kerning on via raqm)
        tr = -0.005 * font_px * scale; total = tr * (len(t) - 1)
        xs_ = x0 * scale - (total if anc == 'rs' else 0)
        pen = 0.0
        for k_, ch_ in enumerate(t):
            pre = fs.getlength(t[:k_], features=['kern']) if k_ else 0.0
            dr.text((xs_ + pre + tr * k_ - (fs.getlength(t, features=['kern']) if anc == 'rs' else 0), y0 * scale), ch_, fill=255, font=fs, anchor='ls')
    m = np.array(im) > 127
    return m if scale == 1 else cv2.resize(m.astype(np.uint8), (W, H), interpolation=cv2.INTER_AREA) > 0

def occl_yaw0(farm):
    return float((dmesh[farm] > D_FAR_T).mean())

# ---------- CPU renderer (z-buffered point splat, same geometry as the GL scene) ----------
RS = 0.5 if not PH else 0.5                          # render at half the frame resolution
rw, rh = int(W * RS), int(H * RS)
def mesh_points(step_px=1):
    ys, xs = np.mgrid[0:H:step_px, 0:W:step_px]
    u = (xs + .5) / W * 2 - 1; v = ((ys + .5) / H * 2 - 1) * ASP
    z = zof(dmesh[ys, xs])
    return np.stack([u * z / f, v * z / f, z], -1).reshape(-1, 3), rgb[ys, xs].reshape(-1, 3), (ys, xs)

def stretch_mask():
    z = zof(dmesh); gy_, gx_ = np.gradient(z)
    return (np.abs(gx_) + np.abs(gy_)) / z            # per source pixel, ~fwidth(vZ)/vZ at yaw 0 scale

def plane_points(mask, zt):
    ys, xs = np.nonzero(mask)
    u = (xs + .5) / W * 2 - 1; v = ((ys + .5) / H * 2 - 1) * ASP
    return np.stack([u * zt / f, v * zt / f, np.full(u.shape, zt)], -1)

def xform(P, yaw, pitch, dolly, pivot):
    ay, ap_ = math.radians(yaw), math.radians(pitch)
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2] - pivot
    X2 = X * math.cos(ay) + Z * math.sin(ay); Z2 = -X * math.sin(ay) + Z * math.cos(ay)
    Y2 = Y * math.cos(ap_) - Z2 * math.sin(ap_); Z3 = Y * math.sin(ap_) + Z2 * math.cos(ap_)
    return X2, Y2, Z3 + pivot * (1 - dolly)

def project(X, Y, Z):
    px = (X / Z * f + 1) / 2 * rw; py = (Y / Z * f / ASP + 1) / 2 * rh
    return px, py

def render(yaw, pitch, dolly, pivot, plate_img, plate_z, plate_scale, farm=None, nearm=None, k_override=None):
    P, C, _ = mesh_points(2)
    st = stretch_mask()[::2, ::2].reshape(-1)
    k = min(1.0, (abs(yaw) + abs(pitch)) / 0.5) if k_override is None else k_override
    keep = ~(st * k > 0.06) if k > 0 else np.ones(len(P), bool)
    img = np.zeros((rh, rw, 3), np.float32); zb = np.full((rh, rw), 1e9, np.float32)
    cover = np.zeros((rh, rw), np.uint8)   # 1 = plate, 2 = mesh
    # plate: a quad at plate_z, sized plate_scale x the frame-matched size, textured with plate_img
    pz = plate_z; hw, hh = pz / f * plate_scale, pz / f * ASP * plate_scale
    gyp, gxp = np.mgrid[0:rh:1, 0:rw:1]
    # inverse-map each output pixel onto the plate plane (ray-plane intersection after inverse rotation)
    ay, ap_ = math.radians(yaw), math.radians(pitch)
    dx = (gxp + .5) / rw * 2 - 1; dyv = ((gyp + .5) / rh * 2 - 1) * ASP
    cam = np.array([0, 0, pivot * dolly], np.float32)  # camera moved toward pivot == points moved away
    # rays in camera space: (dx/f, dy/f, 1); transform to world by inverse rotation about pivot
    rx, ry, rz = dx / f, dyv / f, np.ones_like(dx)
    # inverse pitch then inverse yaw
    ry2 = ry * math.cos(ap_) + rz * math.sin(ap_); rz2 = -ry * math.sin(ap_) + rz * math.cos(ap_)
    rx3 = rx * math.cos(ay) - rz2 * math.sin(ay); rz3 = rx * math.sin(ay) + rz2 * math.cos(ay)
    # camera origin in world: inverse of xform applied to (0,0,0)
    oz = -pivot * (1 - dolly); ox = 0.0; oy = 0.0
    oy2 = oy * math.cos(ap_) + oz * math.sin(ap_); oz2 = -oy * math.sin(ap_) + oz * math.cos(ap_)
    ox3 = ox * math.cos(ay) - oz2 * math.sin(ay); oz3 = ox * math.sin(ay) + oz2 * math.cos(ay)
    ox3, oy3, oz3 = ox3, oy2, oz3 + pivot
    t = (pz - oz3) / rz3
    wx, wy = ox3 + t * rx3, oy3 + t * ry2
    pu = (wx / hw + 1) / 2; pv = (wy / hh + 1) / 2
    inside = (pu >= 0) & (pu <= 1) & (pv >= 0) & (pv <= 1) & (t > 0)
    ph, pw = plate_img.shape[:2]
    sx = np.clip(pu * (pw - 1), 0, pw - 1).astype(np.int32); sy = np.clip(pv * (ph - 1), 0, ph - 1).astype(np.int32)
    img[inside] = plate_img[sy[inside], sx[inside]]; cover[inside] = 1
    zplate = np.where(inside, t, 1e9).astype(np.float32)
    zb = np.minimum(zb, zplate)
    def splat(Pp, Cc, s, tag=2, zbuf=zb, tgt=img, cov=cover, color=None):
        X, Y, Z = xform(Pp, yaw, pitch, dolly, pivot)
        px, py = project(X, Y, Z)
        o = np.argsort(-Z)
        for ddx in range(s):
            for ddy in range(s):
                xi = (px[o] + ddx - s / 2).astype(np.int32); yi = (py[o] + ddy - s / 2).astype(np.int32)
                ok = (xi >= 0) & (xi < rw) & (yi >= 0) & (yi < rh) & (Z[o] > 0.05)
                xi, yi, zz = xi[ok], yi[ok], Z[o][ok]
                front = zz <= zbuf[yi, xi] + 1e-6
                xi, yi, zz = xi[front], yi[front], zz[front]
                tgt[yi, xi] = (color if color is not None else Cc[o][ok][front])
                zbuf[yi, xi] = zz
                if cov is not None: cov[yi, xi] = tag
    splat(P[keep], C[keep].astype(np.float32), 2)
    res = {'img': img, 'cover': cover}
    if farm is not None:
        # FAR text: z-tested against the mesh (visible fraction); NEAR: rendered last, never occluded
        zb_mesh = zb.copy()
        T = plane_points(farm, Z_FAR_T)
        X, Y, Z = xform(T, yaw, pitch, dolly, pivot); px, py = project(X, Y, Z)
        xi = np.clip(px.astype(np.int32), 0, rw - 1); yi = np.clip(py.astype(np.int32), 0, rh - 1)
        vis = Z <= zb_mesh[yi, xi] + 1e-6
        res['farOccl'] = float(1 - vis.mean())
        img[yi[vis], xi[vis]] = (236, 232, 225)
        if nearm is not None:
            T = plane_points(nearm, Z_NEAR_T)
            X, Y, Z = xform(T, yaw, pitch, dolly, pivot); px, py = project(X, Y, Z)
            xi = np.clip(px.astype(np.int32), 0, rw - 1); yi = np.clip(py.astype(np.int32), 0, rh - 1)
            img[yi, xi] = (240, 106, 44)
    # the mesh's outer edge (end of the 12% overscan ring) projected: the frame edge
    X, Y, Z = xform(ring_border(50), yaw, pitch, dolly, pivot); px, py = project(X, Y, Z)
    res['border'] = np.stack([px, py], 1)
    return res

OS = 0.12   # A2's mesh carries a 12% overscan ring (edge-clamped depth and UV); its OUTER edge is the frame edge
def ring_border(n=60):
    pts = []
    us = [-OS + (1 + 2 * OS) * i / n for i in range(n + 1)]
    for (uu, vv) in [(u_, -OS) for u_ in us] + [(1 + OS, v_) for v_ in us] + [(u_, 1 + OS) for u_ in us] + [(-OS, v_) for v_ in us]:
        cx_, cy_ = min(max(uu, 0), 1), min(max(vv, 0), 1)
        z = zof(dmesh[int(cy_ * (H - 1)), int(cx_ * (W - 1))])
        pts.append([(uu * 2 - 1) * z / f, (vv * 2 - 1) * ASP * z / f, z])
    return np.array(pts)

def lum(c8):
    c = c8.astype(np.float32) / 255.
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722

L_OR = float(lum(np.array([[240, 106, 44]], np.uint8))[0])
def near_contrast(nearm, img_rgb):
    Lb = lum(img_rgb)[nearm]
    cr = (np.maximum(L_OR, Lb) + .05) / (np.minimum(L_OR, Lb) + .05)
    return float((cr >= 3).mean()), float(np.percentile(cr, 10)), float(np.median(cr))

# ---------- type layout search (gates 1 + 2) ----------
best = None
# desktop: the brief allows the FAR block +-0.03 in x or y. Phone: "A5 sets the bite window as on desktop";
# 07 stands lower in the 9:16 take, so the FAR block may also come down to +0.06 (block bottom ~0.28).
DYS = np.arange(-0.03, 0.0601 if PH else 0.0301, 0.005)
for dy in DYS:
    for dx in np.arange(-0.03, 0.0301, 0.005):
        far, _ = layout(dx, dy)
        o = occl_yaw0(raster(far))
        score = abs(o - 0.065) + 0.02 * (abs(dx) + abs(dy)) / 0.03
        if best is None or score < best[0]: best = (score, dx, dy, o)
_, fdx, fdy = best[:3]
if abs(fdx) < 1e-9 and abs(fdy) < 1e-9: pass
# start values first if they already pass
far0, _ = layout(0, 0); o0 = occl_yaw0(raster(far0))
if 0.03 <= o0 <= 0.10: fdx, fdy = 0.0, 0.0
nbest = None
# NEAR may move +-0.05 per the brief, but never right (the 16:10 viewport crops ~4.5% per side) and never
# down (the sub and the hint sit at y 0.80); so the search is left/up only.
for dy in np.arange(-0.05, 0.0001, 0.01):
    for dx in np.arange(-0.05, 0.0001, 0.01):
        _, near = layout(fdx, fdy, dx, dy)
        frac, p10, med = near_contrast(raster(near), rgb)
        sc = frac - 0.002 * (abs(dx) + abs(dy)) / 0.01
        if nbest is None or sc > nbest[0]: nbest = (sc, dx, dy, frac, p10, med)
_, n0 = layout(fdx, fdy, 0, 0); f0 = near_contrast(raster(n0), rgb)
# take a shift only if it alone passes the gate; otherwise stay put and let R3 darken under the box
ndx, ndy = (nbest[1], nbest[2]) if (f0[0] < 0.90 and nbest[3] >= 0.90) else (0.0, 0.0)
far, near = layout(fdx, fdy, ndx, ndy)
farm, nearm = raster(far), raster(near)
occ0 = occl_yaw0(farm)
nfrac, np10, nmed = near_contrast(nearm, rgb)

# NEAR box (for R3's darkening if the contrast gate still fails)
ys, xs = np.nonzero(nearm); nbox = [float(xs.min() / W), float(ys.min() / H), float(xs.max() / W), float(ys.max() / H)]
need = None
if nfrac < 0.90:
    # how much linear darkening under the (feathered) NEAR box would pass the gate: target the 10th pct
    Lb = lum(rgb)[nearm]; q = np.percentile(Lb, 90)          # 90% of pixels must be <= L_OR/3 - .0333
    target = (L_OR + .05) / 3 - .05
    need = float(min(1.0, max(0.0, 1 - target / max(q, 1e-6))))  # fraction of linear light to remove

robot = (d > D_FAR_T)
pivot_region = robot.copy(); pivot_region[int(H * (0.55 if not PH else 0.45)):] = False
pivotZ = float(np.median(zof(d[pivot_region]))) if pivot_region.sum() > 500 else 1.6
nearD, farD = float(np.percentile(d, 99.5)), float(np.percentile(d, 2))

report = {'suffix': SUF, 'a': a, 'b': b, 'f': f, 'D_FAR_T': round(D_FAR_T, 4), 'pivotZ': round(pivotZ, 4),
          'far': {'dx': round(float(fdx), 3), 'dy': round(float(fdy), 3), 'occlYaw0': round(occ0, 4), 'startOccl': round(o0, 4)},
          'near': {'dx': round(float(ndx), 3), 'dy': round(float(ndy), 3), 'passFrac': round(nfrac, 4), 'p10': round(np10, 3), 'median': round(nmed, 3),
                   'box': [round(v, 4) for v in nbox], 'startPassFrac': round(f0[0], 4), 'darkenNeeded': need}}
if A.analyse:
    ov = rgb.copy(); ov[farm] = (236, 232, 225); ov[nearm] = (240, 106, 44)
    ov[farm & (dmesh > D_FAR_T)] = (255, 0, 255)
    cv2.imwrite(f'{A.qadir}/analyse-{SUF}.jpg', cv2.cvtColor(ov, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(json.dumps(report, indent=1)); sys.exit(0)

# ---------- depth mapping tune (limit poses) ----------
# The brief's start values (a 0.15, b 1.6) put the near floor at z 0.57 and the haze at z 6.8, so pitch +-3 deg
# about 07's chest swings the frame's own bottom/top edge into view. A5 may tune a, b: keep the FAR plane's
# depth threshold (so the bite is unchanged), lower b until no frame edge enters the inner 88% (the 6%
# feathered mask) at any limit pose.
yaws_ = (-6, 0, 6) if PH else (-6, 0, 10); pitches_ = (-3, 0, 3)
def border_intrusions(a_, b_):
    global a, b
    a, b = a_, b_
    bpts = ring_border()
    piv = float(np.median(zof(d[pivot_region]))) if pivot_region.sum() > 500 else 1.6
    worst = 0
    for yw in yaws_:
        for pt in pitches_:
            X, Y, Z = xform(bpts, yw, pt, 0.04, piv); px, py = project(X, Y, Z)
            ins = (px > 0) & (px < rw) & (py > 0) & (py < rh)   # the ring's outer edge inside the frame box
            worst += int(ins.sum())
    return worst, piv
tune = []
a0, b0 = a, b
for bb in (1.6, 1.4, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5):
    aa = (1 / Z_FAR_T) - D_FAR_T * bb
    wv, pv = border_intrusions(aa, bb)
    tune.append({'a': round(aa, 4), 'b': bb, 'edgePointsInside': wv, 'pivotZ': round(pv, 3)})
    if wv == 0: break
if A.a is not None or A.b is not None: a, b = a0, b0
else: a, b = tune[-1]['a'], tune[-1]['b']
pivotZ = float(np.median(zof(d[pivot_region]))) if pivot_region.sum() > 500 else 1.6
print('depth mapping tune:', json.dumps(tune))

# ---------- outputs ----------
import io
def save_fit(im, path, kb, fmt='AVIF', qs=(70, 64, 58, 52, 46, 40, 34, 28), **kw):
    for q in qs:
        b = io.BytesIO(); im.save(b, fmt, quality=q, **kw)
        if b.tell() <= kb * 1000: break
    open(path, 'wb').write(b.getvalue()); return q, b.tell()
sizes = {}
(np.clip(grid, 0, 1) * 65535 + .5).astype('<u2').tofile(f'{A.outdir}/hero-depth-{SUF}.bin')
for tag, path in (('av1', A.av1), ('h264', A.h264)):
    im = Image.open(path).convert('RGB')
    sizes[f'still-{tag}'] = save_fit(im, f'{A.outdir}/hero-still-{SUF}-{tag}.avif', 220, qs=(90, 86, 82, 78, 74, 70, 64, 58), speed=4)
    sizes[f'still-{tag}-jpg'] = save_fit(im, f'{A.outdir}/hero-still-{SUF}-{tag}.jpg', 450, 'JPEG', qs=(84, 80, 76, 72, 68), optimize=True, progressive=True)
# plate: near region inpainted (Telea), blur 6, x0.6, at half size
pw_, ph_ = (538, 956) if PH else (960, 538)
small = cv2.resize(bgr, (pw_, ph_), interpolation=cv2.INTER_AREA)
nearreg = cv2.resize((d > farD + 0.12).astype(np.uint8), (pw_, ph_), interpolation=cv2.INTER_NEAREST)
nearreg = cv2.dilate(nearreg, np.ones((9, 9), np.uint8))
inp = cv2.inpaint(small, nearreg * 255, 8, cv2.INPAINT_TELEA)
plate = (cv2.GaussianBlur(inp, (0, 0), 6).astype(np.float32) * 0.6).astype(np.uint8)
sizes['plate'] = save_fit(Image.fromarray(cv2.cvtColor(plate, cv2.COLOR_BGR2RGB)), f'{A.outdir}/hero-plate-{SUF}.avif', 60, speed=4)
Image.fromarray(cv2.cvtColor(plate, cv2.COLOR_BGR2RGB)).save(f'{A.outdir}/hero-plate-{SUF}.jpg', quality=78)
# near-matte: exactly the pixels the mesh puts in front of the FAR plane at yaw 0, top part of the frame
alpha = (dmesh > D_FAR_T).astype(np.float32)
alpha[int(H * (0.62 if not PH else 0.45)):] = 0
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
rgba = np.dstack([rgb, (alpha * 255 + .5).astype(np.uint8)]); rgba[alpha < 0.004, :3] = 0
sizes['matte'] = save_fit(Image.fromarray(rgba, 'RGBA'), f'{A.outdir}/hero-matte-{SUF}.webp', 120, 'WEBP', qs=(82, 74, 66, 58, 50, 42), method=6)
cssocc = float((alpha[farm] > 0.5).mean())

# limit poses
plate_rgb = cv2.cvtColor(plate, cv2.COLOR_BGR2RGB).astype(np.float32)
plate_z = (1 / a) * 1.06          # as A2's FreezeScene: plate at 1.06/a, 1.5x the frame-matched size
yaws = (-6, 0, 6) if PH else (-6, 0, 10)
pitches = (-3, 0, 3)
# plate scale: smallest that covers the frame box in every limit pose
plate_scale = 1.5
for sc in ([1.5] + list(np.arange(1.55, 2.51, 0.05))):
    ok = True
    for yw in yaws:
        for pt in pitches:
            r = render(yw, pt, 0.04, pivotZ, plate_rgb, plate_z, sc)
            if (r['cover'] == 0).any(): ok = False; break
        if not ok: break
    if ok: plate_scale = float(round(sc, 2)); break
inner = 0.06   # the 6% feathered edge mask: the frame's own edge must stay outside the inner 88%
limits = []
for yw in yaws:
    for pt in pitches:
        r = render(yw, pt, 0.04, pivotZ, plate_rgb, plate_z, plate_scale, farm, nearm)
        bx = r['border']; x0i, x1i, y0i, y1i = inner * rw, (1 - inner) * rw, inner * rh, (1 - inner) * rh
        inside = (bx[:, 0] > 0) & (bx[:, 0] < rw) & (bx[:, 1] > 0) & (bx[:, 1] < rh)   # ring edge inside the frame box
        uncovered = int((r['cover'] == 0).sum())
        img = np.clip(r['img'], 0, 255).astype(np.uint8).copy()
        img[r['cover'] == 0] = (255, 0, 255)
        cv2.rectangle(img, (int(x0i), int(y0i)), (int(x1i), int(y1i)), (111, 152, 232), 1)
        for p in bx.astype(np.int32):
            if 0 <= p[0] < rw and 0 <= p[1] < rh: cv2.circle(img, (int(p[0]), int(p[1])), 1, (255, 0, 0) if True else 0, -1)
        cv2.putText(img, f'yaw {yw:+d} pitch {pt:+d}  uncovered {uncovered}  edge-in {int(inside.sum())}', (10, rh - 12), cv2.FONT_HERSHEY_PLAIN, 1.1, (236, 232, 225), 1)
        fn = f'{A.qadir}/limit-{SUF}-y{yw:+d}-p{pt:+d}.png'
        cv2.imwrite(fn, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        limits.append({'yaw': yw, 'pitch': pt, 'uncoveredPx': uncovered, 'edgeInside': int(inside.sum()), 'farOccl': round(r['farOccl'], 4), 'png': fn})
ryaw, rpitch = (6, -2.5) if PH else (8, -2.5)
rr = render(ryaw, rpitch, 0.04, pivotZ, plate_rgb, plate_z, plate_scale, farm, nearm)
cv2.imwrite(f'{A.qadir}/rest-{SUF}.png', cv2.cvtColor(np.clip(rr['img'], 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
r0 = render(0, 0, 0.0, pivotZ, plate_rgb, plate_z, plate_scale, farm, nearm)
cv2.imwrite(f'{A.qadir}/yaw0-{SUF}.png', cv2.cvtColor(np.clip(r0['img'], 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))

def lines_meta(lines, zt, plane):
    out = []
    for t, x0, y0, anc in lines:
        bb = ft.getbbox(t, anchor=anc)
        out.append({'text': t, 'plane': plane, 'z': zt, 'anchor': {'ls': 'left-baseline', 'rs': 'right-baseline'}[anc],
                    'x': round(x0 / W, 5), 'baseline': round(y0 / H, 5), 'fontPx': round(font_px, 2), 'fontPxFrac': round(font_px / H, 5),
                    'box': [round((x0 + bb[0]) / W, 5), round((y0 + bb[1]) / H, 5), round((x0 + bb[2]) / W, 5), round((y0 + bb[3]) / H, 5)]})
    return out
meta = {'frame': A.frame, 'w': W, 'h': H, 'mock': False,
        'grid': {'cols': COLS, 'rows': ROWS, 'file': 'uint16 little-endian, row-major, top row first, left to right; d = v/65535 (relative inverse depth, near = 1)'},
        'a': a, 'b': b, 'f': f, 'pivotZ': round(pivotZ, 4), 'nearD': round(nearD, 4), 'farD': round(farD, 4),
        'yaw': ({'auto': 6, 'min': -6, 'max': 6} if PH else {'auto': 8, 'min': -6, 'max': 10}),
        'pitch': {'auto': -2.5, 'min': -3, 'max': 3}, 'dolly': 0.04, 'overscan': 0.12,
        'plate': {'z': round(plate_z, 4), 'scale': plate_scale, 'note': 'as A2 FreezeScene: quad at z = 1.06/a, size = scale x the frame-matched size at that depth; the smallest scale (>= 1.5) that leaves no uncovered pixel in any limit pose'},
        'limitPoseRule': 'mesh with A2s 12% overscan ring (edge-clamped); FAIL if the ring outer edge enters the frame box or any pixel is uncovered (no mesh, no plate)',
        'stretchDiscard': {'threshold': 0.06, 'rampDeg': 0.5},
        'typeLayers': lines_meta(far, Z_FAR_T, 'FAR') + lines_meta(near, Z_NEAR_T, 'NEAR'),
        'typeLayerShift': {'far': [report['far']['dx'], report['far']['dy']], 'near': [report['near']['dx'], report['near']['dy']]},
        'occlusion': {'yaw0': round(occ0, 4), 'rest': round(rr['farOccl'], 4), 'cssMatte': round(cssocc, 4), 'window': [0.03, 0.10], 'restMax': 0.15},
        'nearContrast': {'p10': round(np10, 3), 'median': round(nmed, 3), 'passFrac': round(nfrac, 4), 'gate': '>=3:1 on >=90%'},
        'nearDarken': json.loads(A.darken) if A.darken else None,
        'depthMappingTune': tune,
        'limitPoses': limits, 'encodes': {k: {'q': v[0], 'bytes': v[1]} for k, v in sizes.items()}}
g1 = 0.03 <= occ0 <= 0.10 and rr['farOccl'] <= 0.15
g2 = nfrac >= 0.90
g3 = all(l['uncoveredPx'] == 0 and l['edgeInside'] == 0 for l in limits)
meta['gates'] = {'occlusion': g1, 'nearContrast': g2, 'limitPoses': g3}
json.dump(meta, open(f'{A.outdir}/hero-meta-{SUF}.json', 'w'), indent=1)
print(json.dumps({'gates': meta['gates'], 'occlusion': meta['occlusion'], 'nearContrast': meta['nearContrast'], 'plate': meta['plate'],
                  'shift': meta['typeLayerShift'], 'limits': [(l['yaw'], l['pitch'], l['uncoveredPx'], l['edgeInside'], l['farOccl']) for l in limits]}, indent=1))
