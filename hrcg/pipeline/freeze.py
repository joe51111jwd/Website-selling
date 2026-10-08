# D1 / D2 hero freeze (brief §4.1, §7d; from gt-spike/proof.py + rgbd.py).
# Input: the LAST frame of each encoded hero-snap web file (AV1 and H.264), decoded to PNG.
# Output (into <outdir>, suffix 169 or 916):
#   hero-depth-<s>.bin   Uint16 LE vertex grid (257x145 or 145x257), row-major, top row first; d = v/65535, near = 1
#   hero-still-<s>-{av1,h264}.{avif,jpg}, hero-plate-<s>.{avif,jpg}, hero-matte-<s>.webp, hero-meta-<s>.json
#   <qadir>/limit-<s>-*.png (nine limit poses + rest), occlusion/contrast overlays
# Gates (binding): FAR bite 3-10% at yaw 0 and <=15% at rest; NEAR >=3:1 on >=90% of glyph pixels;
# no exposed frame edge in the nine limit-pose renders. The FAR block may move +-0.03, NEAR +-0.05.
# FIXLIST-1:
#   F-008  nearer wins: the inverse depth is grey-dilated by a mesh-cell diagonal + 2x DIL + 2 px before meshing, so every
#          depth jump (and the stretched cell across it) lies OUTSIDE the near object; the near-matte is the
#          undilated core + DIL px (feathered; 9:16 feathered wider), i.e. wholly inside the uniformly-near mesh.
#          Limit-pose gate: no visible cell (A2's per-vertex edge alpha 1 - smoothstep(.04,.08,aEdge*k), or the
#          matte) within 3 cells of the matte may stretch more than 2 px past where a rigid copy would sit.
#   F-046  per-glyph FAR occlusion gate: no FAR glyph more than 40% occluded, at yaw 0 (depth and matte) and at
#          rest, at 1280x800, 1440x900 (16:9 frame) and 9:16; bite pixels must not fall in 07's head region.
#          The FAR/NEAR positions are A2's TYPE_LAYOUT (F-022), recorded as typeLayerShift.
# usage: python -I freeze.py <av1.png> <h264.png> <outdir> <qadir> <169|916> [--analyse] [--a A --b B] [--dil 3]
#   --analyse: only measure (used on the mezzanine frame before R3, to decide NEAR darkening).
import sys, os, json, math, argparse
import numpy as np, cv2, onnxruntime as ort
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('av1'); ap.add_argument('h264'); ap.add_argument('outdir'); ap.add_argument('qadir'); ap.add_argument('suffix')
ap.add_argument('--analyse', action='store_true'); ap.add_argument('--a', type=float); ap.add_argument('--b', type=float)
ap.add_argument('--frame', type=int, default=84); ap.add_argument('--darken', help='json of the NEAR darkening baked by R3 (recorded in meta)')
ap.add_argument('--dil', type=float, default=3.0, help='F-008: px the near-matte grows past the depth core (the mesh dilation is one cell + 2x this)')
ap.add_argument('--search', action='store_true', help='pre-F-022 behaviour: search the FAR block position for the bite window')
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
d_raw = np.clip(cv2.ximgproc.guidedFilter(guide, dup, 8, 1e-3), 0, 1)  # guided-filter upsample

COLS, ROWS = (145, 257) if PH else (257, 145)
CELL = max((W - 1) / (COLS - 1), (H - 1) / (ROWS - 1))            # mesh cell size in frame px (~7.5)
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
    upr = d_raw[int(H * 0.2):int(H * 0.55), int(W * 0.2):int(W * 0.85)]
    thr, _ = cv2.threshold((upr * 255).astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    rob = upr[upr > thr / 255.]
    D_FAR_T = float(0.85 * np.percentile(rob, 30))
    a = 1 / Z_FAR_T - D_FAR_T * b

# F-008: nearer wins. (1) Grey-dilate (max filter) the inverse depth by a cell diagonal + 2 x DIL + 2 px: every vertex within
# that distance of a near object takes the near object's depth, so the matte (07's undilated core + DIL px) lies in
# cells whose vertices are all near. (2) Around 07's core, where the depth really jumps (d_max - d_min > SNAP_DD
# within reach), snap the soft depth ramp to a hard step: the dilated near side keeps d_max, the rest takes the
# local far value (min filter). The single cell across the step then carries background texels only and A2's
# per-vertex edge alpha drops it whole, instead of a soft ramp of visible cells that smear background texels.
# Statistics (FAR plane, pivot, near/far percentiles) keep using the undilated d_raw.
DIL_R = int(math.ceil(CELL * math.sqrt(2) + 2 * A.dil + 2))   # a cell's diagonal + the matte's growth and feather tail
SNAP_DD, SNAP_REACH = float(os.environ.get("FREEZE_SNAP_DD", "0.05")), DIL_R + 12
def ell(r): return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
d_max = cv2.dilate(d_raw, ell(DIL_R)); d_min = cv2.erode(d_raw, ell(SNAP_REACH))
core0 = (d_raw > D_FAR_T).astype(np.uint8)
CUT_FRAC = 0.45 if PH else 0.62                   # the matte (and so the snap) covers 07's upper body only;
zone = (cv2.dilate(core0, ell(SNAP_REACH)) > 0) & ((cv2.dilate(d_raw, ell(SNAP_REACH)) - d_min) > SNAP_DD)
zone[int(H * CUT_FRAC) + SNAP_REACH:] = False      # below it the dust and floor keep their soft depth (no tears)
near0 = ((d_raw > (cv2.dilate(d_raw, ell(SNAP_REACH)) + d_min) / 2) | (core0 > 0)).astype(np.uint8)
nearside = cv2.dilate(near0, ell(DIL_R)) > 0
# inside 07's upper body (above the cut), a smooth relief: normalized-convolution blur of the near side, so 07's
# internal steps (arm over torso, head over shoulder) become gentle slopes instead of single stretched cells
top = np.zeros((H, W), bool); top[:int(H * CUT_FRAC) + SNAP_REACH] = True
M = (nearside & top).astype(np.float32); SMOOTH_SIG = 3.0 * CELL
d_relief = cv2.GaussianBlur(d_max * M, (0, 0), SMOOTH_SIG) / np.maximum(cv2.GaussianBlur(M, (0, 0), SMOOTH_SIG), 1e-4)
d = np.where(zone & ~nearside, d_min, np.where(M > 0, d_relief, d_max)).astype(np.float32)
SNAP_PX = int((zone & ~nearside).sum())
gx = (np.arange(COLS) / (COLS - 1) * (W - 1)).astype(np.float32)
gy = (np.arange(ROWS) / (ROWS - 1) * (H - 1)).astype(np.float32)
mx, my = np.meshgrid(gx, gy)
grid = cv2.remap(d, mx, my, cv2.INTER_LINEAR)
def up(g):
    """vertex grid -> frame pixels, exactly as the GL mesh interpolates (vertex i sits at x = i/(COLS-1)*(W-1))"""
    ux, uy = np.meshgrid(np.arange(W, dtype=np.float32) * (COLS - 1) / (W - 1), np.arange(H, dtype=np.float32) * (ROWS - 1) / (H - 1))
    return cv2.remap(g.astype(np.float32), ux, uy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
# the GL mesh interpolates linearly between vertices: the depth the viewer sees is the grid, upsampled
dmesh = up(grid)


# robot region: what is nearer than the FAR plane in the upper part of the frame
font_px = (0.070 if PH else 0.131) * H          # F-022: the 9:16 H1 is 0.070 of the frame height (was 0.075)
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

def raster_glyphs(lines):
    """F-046: one label per glyph (1..n, same placement as raster()); returns (labels, names)"""
    lab = np.zeros((H, W), np.int16); names = []
    fs = ImageFont.truetype(FONT, int(round(font_px)))
    for t, x0, y0, anc in lines:
        tr = -0.005 * font_px; total = tr * (len(t) - 1)
        xs_ = x0 - (total if anc == 'rs' else 0)
        for k_, ch_ in enumerate(t):
            if ch_ == ' ': continue
            im = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(im)
            pre = fs.getlength(t[:k_], features=['kern']) if k_ else 0.0
            dr.text((xs_ + pre + tr * k_ - (fs.getlength(t, features=['kern']) if anc == 'rs' else 0), y0), ch_, fill=255, font=fs, anchor='ls')
            names.append(f'{t}[{k_}]={ch_}'); lab[np.array(im) > 127] = len(names)
    return lab, names

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

# ---------- A2's F-004 material, emulated (per-vertex edge alpha + the matte as the foreground layer) ----------
EDGE_LO, EDGE_HI = 0.04, 0.08
MATTE = None                                          # full-res matte alpha 0..1 (set in the outputs section)
def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
EDGE_NB = int(os.environ.get('FREEZE_EDGE_NB', '8'))
def vertex_edge(nbs=None):
    """aEdge = max(|z_i - z_n|) / z_i over the grid neighbours (edge-clamped), as A2 bakes it per vertex. F-004 says
    four neighbours; with four, a vertex whose only far neighbour is DIAGONAL (a stair-step in the silhouette) keeps
    a small aEdge and the triangle across that diagonal stays visible and stretched. A5 gates with eight (all the
    vertices it shares a triangle with, plus the other diagonal) and asks A2 to bake it that way (requests/A5-fix-2)."""
    nbs = nbs or EDGE_NB
    zg = zof(grid); pd = np.pad(zg, 1, mode='edge')
    nb = [pd[1:-1, :-2], pd[1:-1, 2:], pd[:-2, 1:-1], pd[2:, 1:-1]]
    if nbs == 8: nb += [pd[:-2, :-2], pd[:-2, 2:], pd[2:, :-2], pd[2:, 2:]]
    return np.max([np.abs(zg - n) for n in nb], 0) / zg
def texel_alpha(k):
    a_ = 1 - smoothstep(EDGE_LO, EDGE_HI, up(vertex_edge()) * k)
    return np.maximum(a_, MATTE) if MATTE is not None else a_

def render(yaw, pitch, dolly, pivot, plate_img, plate_z, plate_scale, farlab=None, nearm=None, k_override=None):
    P, C, (ys_, xs_) = mesh_points(2)
    k = min(1.0, (abs(yaw) + abs(pitch)) / 0.5) if k_override is None else k_override
    al = texel_alpha(k)[ys_, xs_].reshape(-1) if k > 0 else np.ones(len(P), np.float32)
    keep = al >= 0.01                                  # discard below 0.01, blend the rest over what is behind
    img = np.zeros((rh, rw, 3), np.float32); zb = np.full((rh, rw), 1e9, np.float32)
    cover = np.zeros((rh, rw), np.uint8)   # 1 = plate, 2 = mesh
    # plate: a quad at plate_z, sized plate_scale x the frame-matched size, textured with plate_img
    pz = plate_z; hw, hh = pz / f * plate_scale, pz / f * ASP * plate_scale
    gyp, gxp = np.mgrid[0:rh:1, 0:rw:1]
    # inverse-map each output pixel onto the plate plane (ray-plane intersection after inverse rotation)
    ay, ap_ = math.radians(yaw), math.radians(pitch)
    dx = (gxp + .5) / rw * 2 - 1; dyv = ((gyp + .5) / rh * 2 - 1) * ASP
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
    mcov = np.zeros((rh, rw), bool)        # where a matte texel (07's foreground layer, alpha >= 0.5) lands
    def splat(Pp, Cc, s, aa, mm, tag=2):
        X, Y, Z = xform(Pp, yaw, pitch, dolly, pivot)
        px, py = project(X, Y, Z)
        o = np.argsort(-Z)
        for ddx in range(s):
            for ddy in range(s):
                xi = (px[o] + ddx - s / 2).astype(np.int32); yi = (py[o] + ddy - s / 2).astype(np.int32)
                ok = (xi >= 0) & (xi < rw) & (yi >= 0) & (yi < rh) & (Z[o] > 0.05)
                xi, yi, zz = xi[ok], yi[ok], Z[o][ok]
                front = zz <= zb[yi, xi] + 1e-6
                xi, yi, zz = xi[front], yi[front], zz[front]
                a_ = aa[o][ok][front][:, None]
                img[yi, xi] = a_ * Cc[o][ok][front] + (1 - a_) * img[yi, xi]
                zb[yi, xi] = zz
                cover[yi, xi] = tag
                mcov[yi, xi] = mm[o][ok][front]
    mt = (MATTE[ys_, xs_].reshape(-1) >= 0.5) if MATTE is not None else np.zeros(len(P), bool)
    splat(P[keep], C[keep].astype(np.float32), 2, al[keep], mt[keep])
    res = {'img': img, 'cover': cover}
    if farlab is not None:
        # FAR text: z-tested against the mesh (depth bite) and, separately, against 07's matte layer (matte bite)
        zb_mesh = zb.copy()
        T = plane_points(farlab > 0, Z_FAR_T); L = farlab[farlab > 0]
        X, Y, Z = xform(T, yaw, pitch, dolly, pivot); px, py = project(X, Y, Z)
        xi = np.clip(px.astype(np.int32), 0, rw - 1); yi = np.clip(py.astype(np.int32), 0, rh - 1)
        vis = Z <= zb_mesh[yi, xi] + 1e-6
        mvis = ~mcov[yi, xi]
        res['farOccl'] = float(1 - vis.mean()); res['farOcclMatte'] = float(1 - mvis.mean())
        n = int(farlab.max()); tot = np.bincount(L, minlength=n + 1)
        res['glyphOccl'] = (1 - np.bincount(L, weights=vis, minlength=n + 1) / np.maximum(tot, 1))[1:]
        res['glyphOcclMatte'] = (1 - np.bincount(L, weights=mvis, minlength=n + 1) / np.maximum(tot, 1))[1:]
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

def stretch_gate(yaw, pitch, dolly, pivot, k=1.0, nbs=None):
    """F-008 gate, per mesh TRIANGLE as A2 indexes them (a-c-b, b-c-d), in full frame px: how far the visible part
    of each triangle stretches past where a rigid copy at its nearer vertex's depth would sit. Visible = where the
    interpolated per-vertex edge alpha is >= 0.1, or the matte is >= 0.1 (07's layer). Offending = visible stretch
    > 2 px in a triangle that is not wholly inside the matte, within 3 cells of the matte, above the matte cut."""
    zg = zof(grid)
    U = ((gx + .5) / W * 2 - 1)[None, :].repeat(ROWS, 0); V = (((gy + .5) / H * 2 - 1) * ASP)[:, None].repeat(COLS, 1)
    PX = gx[None, :].repeat(ROWS, 0); PY = gy[:, None].repeat(COLS, 1)
    def proj(Uq, Vq, Zq):
        Pp = np.stack([(Uq * Zq / f).ravel(), (Vq * Zq / f).ravel(), Zq.ravel()], 1)
        X, Y, Z = xform(Pp, yaw, pitch, dolly, pivot)
        return np.stack([(X / Z * f + 1) / 2 * W, (Y / Z * f / ASP + 1) / 2 * H], 1).reshape(Uq.shape + (2,))
    S0 = proj(U, V, zg)
    ev = vertex_edge(nbs) * k
    E_VIS = EDGE_LO + 0.804 * (EDGE_HI - EDGE_LO)      # 1 - smoothstep(...) = 0.1 here
    ts = np.linspace(0, 1, 9, dtype=np.float32)
    def mfrac(sa, sb):   # fraction of the edge a->b (from either end) on which the matte is >= 0.1
        xs = PX[sa][..., None] + (PX[sb] - PX[sa])[..., None] * ts; ys = PY[sa][..., None] + (PY[sb] - PY[sa])[..., None] * ts
        x0 = np.clip(np.floor(xs).astype(np.int32), 0, W - 2); y0 = np.clip(np.floor(ys).astype(np.int32), 0, H - 2)
        fx_, fy_ = np.clip(xs - x0, 0, 1), np.clip(ys - y0, 0, 1)
        mv = (MATTE[y0, x0] * (1 - fx_) * (1 - fy_) + MATTE[y0, x0 + 1] * fx_ * (1 - fy_) +
              MATTE[y0 + 1, x0] * (1 - fx_) * fy_ + MATTE[y0 + 1, x0 + 1] * fx_ * fy_)
        return (mv >= 0.1).mean(-1), (mv >= 0.5).all(-1)
    def edge(sa, sb):
        za, zb_ = zg[sa], zg[sb]
        zn = np.minimum(za, zb_)
        L = np.linalg.norm(S0[sa] - S0[sb], axis=-1); Lr = np.linalg.norm(proj(U[sa], V[sa], zn) - proj(U[sb], V[sb], zn), axis=-1)
        ex = L - Lr
        ea, eb = ev[sa], ev[sb]; lo, hi = np.minimum(ea, eb), np.maximum(ea, eb)
        fr = np.where(hi <= E_VIS, 1.0, np.where(lo >= E_VIS, 0.0, (E_VIS - lo) / np.maximum(hi - lo, 1e-9)))
        mf, inm = mfrac(sa, sb)
        return ex, ex * np.maximum(fr, mf), inm
    c00, c01 = (slice(0, -1), slice(0, -1)), (slice(0, -1), slice(1, None))
    c10, c11 = (slice(1, None), slice(0, -1)), (slice(1, None), slice(1, None))
    e_ac, v_ac, i_ac = edge(c00, c10); e_ab, v_ab, i_ab = edge(c00, c01); e_cb, v_cb, i_cb = edge(c10, c01)
    e_bd, v_bd, i_bd = edge(c01, c11); e_cd, v_cd, i_cd = edge(c10, c11)
    vis1 = np.max([v_ac, v_ab, v_cb], 0); vis2 = np.max([v_cb, v_bd, v_cd], 0)
    in1 = i_ac & i_ab & i_cb; in2 = i_cb & i_bd & i_cd
    cx = ((np.arange(COLS - 1) + .5) / (COLS - 1) * (W - 1)).astype(int); cy = ((np.arange(ROWS - 1) + .5) / (ROWS - 1) * (H - 1)).astype(int)
    dist = cv2.distanceTransform((MATTE < 0.5).astype(np.uint8), cv2.DIST_L2, 5)[cy][:, cx]
    band = (dist <= 3 * CELL) & (cy[:, None] <= MATTE_CUT - 3 * CELL)
    vis = np.concatenate([vis1, vis2]); inm = np.concatenate([in1, in2]); bnd = np.concatenate([band, band])
    # a STREAK is a visible triangle that spans a depth step (z range >= EDGE_LO, A2's own continuity threshold);
    # smoothly sloped triangles (07's relief, the floor) deform with the view and are geometry, not streaks
    zr1 = np.max([zg[c00], zg[c10], zg[c01]], 0) / np.min([zg[c00], zg[c10], zg[c01]], 0) - 1
    zr2 = np.max([zg[c01], zg[c10], zg[c11]], 0) / np.min([zg[c01], zg[c10], zg[c11]], 0) - 1
    step = np.concatenate([zr1, zr2]) >= EDGE_LO
    vis = np.where(step, vis, 0.0)
    off = bnd & ~inm & (vis > 2.0)
    cen = np.concatenate([(S0[c00] + S0[c10] + S0[c01]) / 3, (S0[c01] + S0[c10] + S0[c11]) / 3])
    out = {'yaw': yaw, 'pitch': pitch, 'aEdgeNeighbours': nbs or EDGE_NB, 'stepTrianglesInBand': int((bnd & step).sum()), 'offendingTriangles': int(off.sum()),
           'maxVisibleStretchPxBand': round(float(vis[bnd & ~inm].max()) if (bnd & ~inm).any() else 0.0, 2),
           'maxVisibleStretchPxInsideMatte': round(float(vis[inm].max()) if inm.any() else 0.0, 2),
           'trianglesInsideMatteOver2px': int((inm & (vis > 2.0)).sum()),
           'maxVisibleStretchPxAnywhereOutsideMatte': round(float(vis[~inm].max()), 2)}
    if os.environ.get('FREEZE_DEBUG') and not nbs:   # source-space map of the offending triangles (QA)
        src_c = np.concatenate([np.stack([(PX[c00] + PX[c10] + PX[c01]) / 3, (PY[c00] + PY[c10] + PY[c01]) / 3], -1),
                                np.stack([(PX[c01] + PX[c10] + PX[c11]) / 3, (PY[c01] + PY[c10] + PY[c11]) / 3], -1)])
        dbg = (bgr // 2).copy()
        cnt_, _ = cv2.findContours((MATTE >= 0.5).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cv2.drawContours(dbg, cnt_, -1, (0, 255, 0), 1)
        for (qx, qy), qv in zip(src_c[off], vis[off]):
            cv2.circle(dbg, (int(qx), int(qy)), 2, (255, 0, 255) if qv > 5 else (0, 200, 255), -1)
        cv2.imwrite(f'{A.qadir}/stretch-src-{SUF}-y{yaw:+g}-p{pitch:+g}.jpg', dbg, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return out, off, cen[off], vis[off]

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

# ---------- type layout (gates 1 + 2) ----------
# F-022 / F-046: the FAR block is where A2's TYPE_LAYOUT puts it (16:9 farLeft 0.105, farCapTop 0.135;
# 9:16 farLeft 0.08, farCapTop 0.13, size 0.070), so the per-glyph gate below checks the shipped layout.
# The old window search still runs and is reported (searchBest) but only moves the block with --search.
F022 = {'169': (-0.015, -0.005), '916': (0.0, 0.03)}[SUF]
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
search_best = {'dx': round(float(best[1]), 3), 'dy': round(float(best[2]), 3), 'occlYaw0': round(float(best[3]), 4)}
if not A.search: fdx, fdy = F022
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

robot = (d_raw > D_FAR_T)
pivot_region = robot.copy(); pivot_region[int(H * (0.55 if not PH else 0.45)):] = False
pivotZ = float(np.median(zof(d_raw[pivot_region]))) if pivot_region.sum() > 500 else 1.6
nearD, farD = float(np.percentile(d_raw, 99.5)), float(np.percentile(d_raw, 2))

report = {'suffix': SUF, 'a': a, 'b': b, 'f': f, 'D_FAR_T': round(D_FAR_T, 4), 'pivotZ': round(pivotZ, 4),
          'far': {'dx': round(float(fdx), 3), 'dy': round(float(fdy), 3), 'occlYaw0': round(occ0, 4), 'startOccl': round(o0, 4), 'searchBest': search_best,
                  'source': 'search' if A.search else 'A2 TYPE_LAYOUT (F-022)'},
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
# near-matte (F-008): 07's undilated depth core (nearer than the FAR plane) grown by DIL px, feathered (9:16 wider,
# it is shown at ~0.36x), top part of the frame with a soft cut. It lies wholly inside the uniformly-near mesh, so
# A2 can draw it as 07's foreground layer with a clean edge at every yaw, and the DOM (CSS) bite uses it as before.
MATTE_CUT = int(H * CUT_FRAC)
mcore = (d_raw > D_FAR_T).astype(np.uint8)
di = int(round(A.dil))
alpha = cv2.dilate(mcore, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * di + 1, 2 * di + 1))).astype(np.float32)
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.6 if PH else 1.2)
alpha *= np.clip((MATTE_CUT - np.arange(H, dtype=np.float32)) / (0.03 * H), 0, 1)[:, None]
MATTE = alpha
rgba = np.dstack([rgb, (alpha * 255 + .5).astype(np.uint8)]); rgba[alpha < 0.004, :3] = 0
sizes['matte'] = save_fit(Image.fromarray(rgba, 'RGBA'), f'{A.outdir}/hero-matte-{SUF}.webp', 120, 'WEBP', qs=(82, 74, 66, 58, 50, 42), method=6)
cssocc = float((alpha[farm] > 0.5).mean())
# the matte must sit in cells whose four vertices all carry near depth (no stretch inside the matte)
_va = vertex_edge(); _cellmax = np.max([_va[:-1, :-1], _va[:-1, 1:], _va[1:, :-1], _va[1:, 1:]], 0)
_cx = ((np.arange(COLS - 1) + .5) / (COLS - 1) * (W - 1)).astype(int); _cy = ((np.arange(ROWS - 1) + .5) / (ROWS - 1) * (H - 1)).astype(int)
_mmax = cv2.dilate(alpha, np.ones((int(math.ceil(CELL)) + 1,) * 2, np.uint8))[_cy][:, _cx]
_core_far = cv2.dilate(mcore, np.ones((int(math.ceil(CELL)) + 1,) * 2, np.uint8))[_cy][:, _cx] == 0   # cell has no core pixel
matte_edge_cells = int(((_mmax >= 0.5) & (_cellmax >= EDGE_LO)).sum())
matte_edge_cells_boundary = int(((_mmax >= 0.5) & (_cellmax >= EDGE_LO) & _core_far).sum())

# F-046: per-glyph FAR occlusion; 07's head region (crown to shoulder line, head columns +20%)
farlab, farnames = raster_glyphs(far)
def head_box():
    c = mcore.copy(); c[MATTE_CUT:] = 0
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats(c, 8)
    m_ = lab_ == (1 + int(np.argmax(st_[1:, 4])))
    rows_ = np.where(m_.any(1))[0]; top = int(rows_.min())
    wid = [int(np.ptp(np.where(m_[y])[0]) + 1) if m_[y].any() else 0 for y in range(top, MATTE_CUT)]
    wh = float(np.median(wid[int(0.01 * H):int(0.05 * H)]))
    sh = next((y for y in range(int(0.03 * H), len(wid)) if wid[y] > 2.4 * wh), len(wid) - 1) + top
    xs_ = np.where(m_[top:top + int(0.05 * H)].any(0))[0]; pad = 0.2 * (xs_.max() - xs_.min())
    return [int(xs_.min() - pad), top, int(xs_.max() + pad), int(sh)]
HEAD = head_box()
def glyph_occl(occluder):
    n = int(farlab.max()); L = farlab[farlab > 0]; o = occluder[farlab > 0]
    return 1 - np.bincount(L, weights=~o, minlength=n + 1)[1:] / np.maximum(np.bincount(L, minlength=n + 1)[1:], 1)
def scaled_glyph_occl(occluder, sc):
    # the same at a displayed frame size (INTER_AREA masks): 1280x800 / 1440x900 show the 16:9 frame at sc
    if sc >= 0.999: return glyph_occl(occluder)
    sz = (int(round(W * sc)), int(round(H * sc))); out = []
    occ_s = cv2.resize(occluder.astype(np.float32), sz, interpolation=cv2.INTER_AREA)
    for g in range(1, int(farlab.max()) + 1):
        gm = cv2.resize((farlab == g).astype(np.float32), sz, interpolation=cv2.INTER_AREA)
        out.append(float((gm * occ_s).sum() / max(gm.sum(), 1e-6)))
    return np.array(out)
yaw0_depth = dmesh > D_FAR_T; yaw0_matte = alpha > 0.5
hx0, hy0, hx1, hy1 = HEAD
headm = np.zeros((H, W), bool); headm[max(0, hy0):hy1, max(0, hx0):hx1] = True
head_bite_px = int(((farlab > 0) & (yaw0_depth | yaw0_matte) & headm).sum())

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
        r = render(yw, pt, 0.04, pivotZ, plate_rgb, plate_z, plate_scale, farlab, nearm)
        sg, offc, offp, offx = stretch_gate(yw, pt, 0.04, pivotZ)
        sg4 = stretch_gate(yw, pt, 0.04, pivotZ, nbs=4)[0]
        bx = r['border']; x0i, x1i, y0i, y1i = inner * rw, (1 - inner) * rw, inner * rh, (1 - inner) * rh
        inside = (bx[:, 0] > 0) & (bx[:, 0] < rw) & (bx[:, 1] > 0) & (bx[:, 1] < rh)   # ring edge inside the frame box
        uncovered = int((r['cover'] == 0).sum())
        img = np.clip(r['img'], 0, 255).astype(np.uint8).copy()
        img[r['cover'] == 0] = (255, 0, 255)
        cv2.rectangle(img, (int(x0i), int(y0i)), (int(x1i), int(y1i)), (111, 152, 232), 1)
        for p in bx.astype(np.int32):
            if 0 <= p[0] < rw and 0 <= p[1] < rh: cv2.circle(img, (int(p[0]), int(p[1])), 1, (255, 0, 0) if True else 0, -1)
        for (qx, qy), qe in zip(offp, offx):   # F-008: offending cells (visible streak > 2 px past the matte)
            cv2.circle(img, (int(qx * RS), int(qy * RS)), max(2, int(qe * RS / 2)), (255, 0, 255), 1)
        cv2.putText(img, f'yaw {yw:+d} pitch {pt:+d}  uncovered {uncovered}  edge-in {int(inside.sum())}  streak>2px tris {sg["offendingTriangles"]} (max {sg["maxVisibleStretchPxBand"]} px)', (10, rh - 12), cv2.FONT_HERSHEY_PLAIN, 1.1, (236, 232, 225), 1)
        fn = f'{A.qadir}/limit-{SUF}-y{yw:+d}-p{pt:+d}.png'
        cv2.imwrite(fn, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        limits.append({'yaw': yw, 'pitch': pt, 'uncoveredPx': uncovered, 'edgeInside': int(inside.sum()), 'farOccl': round(r['farOccl'], 4),
                       'farOcclMatte': round(r['farOcclMatte'], 4), 'glyphOcclMax': round(float(r['glyphOccl'].max()), 4),
                       'stretch': sg, 'stretchWith4Neighbours': {k_: sg4[k_] for k_ in ('offendingTriangles', 'maxVisibleStretchPxBand')}, 'png': fn})
ryaw, rpitch = (6, -2.5) if PH else (8, -2.5)
rr = render(ryaw, rpitch, 0.04, pivotZ, plate_rgb, plate_z, plate_scale, farlab, nearm)
rest_sg = stretch_gate(ryaw, rpitch, 0.04, pivotZ)[0]
if os.environ.get('FREEZE_DEBUG'):
    np.savez_compressed(f'{A.qadir}/debug-{SUF}.npz', grid=grid, d=d, d_raw=d_raw, zone=zone, nearside=nearside, matte=MATTE, a=a, b=b, pivot=pivotZ)
rest_sg4 = stretch_gate(ryaw, rpitch, 0.04, pivotZ, nbs=4)[0]
cv2.imwrite(f'{A.qadir}/rest-{SUF}.png', cv2.cvtColor(np.clip(rr['img'], 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
# F-046 gate: every FAR glyph <= 40% occluded (depth bite and matte bite, yaw 0 and rest; 16:9 also at the 1280x800
# and 1440x900 display sizes), and no bite in the head region. Phone: if the only possible bite is the head, the
# brief's fallback (no FAR occlusion on phones, §2.5 / F-022) is flagged.
SCALES = {'9:16 frame': 1.0} if PH else {'frame 1920': 1.0, '1440x900': max(1440, 900 * W / H) / W, '1280x800': max(1280, 800 * W / H) / W}
gl = []
for gi, nm in enumerate(farnames):
    gl.append({'glyph': nm})
for tag, sc in SCALES.items():
    for key, occ in (('yaw0Depth', yaw0_depth), ('yaw0Matte', yaw0_matte)):
        vals = scaled_glyph_occl(occ, sc)
        for gi in range(len(farnames)): gl[gi][f'{key}@{tag}'] = round(float(vals[gi]), 3)
for gi in range(len(farnames)):
    gl[gi]['restDepth'] = round(float(rr['glyphOccl'][gi]), 3); gl[gi]['restMatte'] = round(float(rr['glyphOcclMatte'][gi]), 3)
gmax = max(max(v for k_, v in g.items() if k_ != 'glyph') for g in gl)
GLYPHS = {'maxPerGlyph': round(gmax, 3), 'limit': 0.40, 'headBox': [round(HEAD[0] / W, 3), round(HEAD[1] / H, 3), round(HEAD[2] / W, 3), round(HEAD[3] / H, 3)],
          'headBitePx': head_bite_px, 'shoulderOnly': head_bite_px == 0, 'pass': gmax <= 0.40 and head_bite_px == 0,
          'bitten': [g['glyph'] for g in gl if max(v for k_, v in g.items() if k_ != 'glyph') > 0.005],
          'phoneFallback': bool(PH and head_bite_px > 0), 'glyphs': gl}
r0 = render(0, 0, 0.0, pivotZ, plate_rgb, plate_z, plate_scale, farlab, nearm)
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
        'stretchDiscard': {'threshold': 0.06, 'rampDeg': 0.5, 'note': 'pre-F-004 per-pixel test; superseded by edgeAlpha'},
        'edgeAlpha': {'aEdge': f'max(|z_i - z_n|) / z_i over the {EDGE_NB} grid neighbours (gate); see requests/A5-fix-2', 'alpha': '1 - smoothstep(0.04, 0.08, aEdge * k)', 'discardBelow': 0.01,
                      'k': 'clamp((|yaw| + |pitch|) / 0.5 deg, 0, 1)', 'foreground': 'hero-matte alpha (07 drawn from the matte at every yaw)'},
        'depthDilation': {'note': 'F-008: inverse depth grey-dilated (nearer wins) before meshing; matte = undilated core (d > farPlaneD) + dil px',
                          'radiusPx': DIL_R, 'cellPx': round(CELL, 2), 'mattePx': A.dil, 'matteFeatherSigmaPx': 1.6 if PH else 1.2,
                          'matteCutY': round(MATTE_CUT / H, 3), 'farPlaneD': round(D_FAR_T, 5),
                          'matteCellsWithEdge': matte_edge_cells, 'matteCellsWithEdgeOnSilhouette': matte_edge_cells_boundary,
                          'snap': {'minJumpD': SNAP_DD, 'reachPx': SNAP_REACH, 'pxSnappedToFar': SNAP_PX, 'reliefSigmaPx': round(SMOOTH_SIG, 1), 'note': 'hard depth step around the upper-body core (above the matte cut); 07 above the cut is a smooth relief'}},
        'typeLayers': lines_meta(far, Z_FAR_T, 'FAR') + lines_meta(near, Z_NEAR_T, 'NEAR'),
        'typeLayerShift': {'far': [report['far']['dx'], report['far']['dy']], 'near': [report['near']['dx'], report['near']['dy']]},
        'occlusion': {'yaw0': round(occ0, 4), 'rest': round(rr['farOccl'], 4), 'cssMatte': round(cssocc, 4), 'restMatte': round(rr['farOcclMatte'], 4),
                      'window': [0.03, 0.10], 'restMax': 0.15},
        'farGlyphs': GLYPHS,
        'nearContrast': {'p10': round(np10, 3), 'median': round(nmed, 3), 'passFrac': round(nfrac, 4), 'gate': '>=3:1 on >=90%'},
        'nearDarken': json.loads(A.darken) if A.darken else None,
        'depthMappingTune': tune,
        'limitPoses': limits, 'encodes': {k: {'q': v[0], 'bytes': v[1]} for k, v in sizes.items()}}
g1 = 0.03 <= occ0 <= 0.10 and rr['farOccl'] <= 0.15
g4 = GLYPHS['pass']
g2 = nfrac >= 0.90
g3 = all(l['uncoveredPx'] == 0 and l['edgeInside'] == 0 for l in limits)
g5 = all(l['stretch']['offendingTriangles'] == 0 for l in limits) and rest_sg['offendingTriangles'] == 0
meta['restStretch'] = rest_sg; meta['restStretchWith4Neighbours'] = rest_sg4
meta['gates'] = {'occlusion': g1, 'nearContrast': g2, 'limitPoses': g3, 'farGlyphs': g4, 'stretchPastMatte': g5}
json.dump(meta, open(f'{A.outdir}/hero-meta-{SUF}.json', 'w'), indent=1)
print(json.dumps({'gates': meta['gates'], 'occlusion': meta['occlusion'], 'nearContrast': meta['nearContrast'], 'plate': meta['plate'],
                  'farGlyphs': {k_: v_ for k_, v_ in GLYPHS.items() if k_ != 'glyphs'}, 'restStretch': rest_sg, 'dilation': meta['depthDilation'],
                  'stretch': [(l['yaw'], l['pitch'], l['stretch']['offendingTriangles'], l['stretch']['maxVisibleStretchPxBand'], l['stretch']['maxVisibleStretchPxInsideMatte']) for l in limits],
                  'shift': meta['typeLayerShift'], 'limits': [(l['yaw'], l['pitch'], l['uncoveredPx'], l['edgeInside'], l['farOccl']) for l in limits]}, indent=1))
