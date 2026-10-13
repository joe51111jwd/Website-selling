// t0 · "Grade the Pad": the hero's ground as a grading plan. Pure math, no DOM (it runs in a worker,
// ./terrain.worker.ts, and in Node for offline studies).
//
// - The land: one believable landform per viewport, seeded and fixed (the same land on every
//   visit): low-frequency, domain-warped simplex (3 octaves, gain 0.35), a ridge spur from the
//   uphill side, Willow Creek's drainage across the downhill side (its contours V upstream), and a
//   regional fall. It scales with the viewport, so 1440×660 and 1280×600 show the same land.
// - The grade: the copy sits on a level pad at PAD_EL. A tight cut slope (2:1) on the uphill side
//   and a wider fill slope (3:1) downhill, both daylighting into the natural ground with a soft
//   crease (polynomial smooth min/max). Where the ground is already at grade there is no slope:
//   that asymmetry is what keeps the pad from reading as a frame.
// - The plan: marching squares → joined polylines → Chaikin ×2 → Douglas–Peucker, split into
//   natural / proposed (G) and existing (E, inside the grading limits) runs, a few index labels set
//   along calm stretches, top facing uphill.
//
// Elevations are in feet; the contour interval is 1 ft; every 5th line is an index contour.

export type Mode = "desk" | "phone";
export type Rect = { x: number; y: number; w: number; h: number };
export type Pad = Rect & { r: number };
export type Pt = [number, number];

export const PAD_EL = 1240.5;
export const INTERVAL = 1;
export const MAJOR = 5;

// ─── noise ───────────────────────────────────────────────────────────────────────────────

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GX = [1, -1, 1, -1, 1, -1, 0, 0];
const GY = [1, 1, -1, -1, 0, 0, 1, -1];
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

/** 2D simplex noise (Gustavson), seeded; about −1…1. */
export function makeSimplex(seed: number) {
  const rnd = mulberry(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return (xin: number, yin: number) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = perm[ii + perm[jj]] & 7;
      t0 *= t0;
      n += t0 * t0 * (GX[g] * x0 + GY[g] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = perm[ii + i1 + perm[jj + j1]] & 7;
      t1 *= t1;
      n += t1 * t1 * (GX[g] * x1 + GY[g] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = perm[ii + 1 + perm[jj + 1]] & 7;
      t2 *= t2;
      n += t2 * t2 * (GX[g] * x2 + GY[g] * y2);
    }
    return 70 * n;
  };
}

// ─── the land ────────────────────────────────────────────────────────────────────────────

/** A spine (ridge or drainage) as a cubic Bézier in viewport fractions (x/W, y/H). */
type Bez = [Pt, Pt, Pt, Pt];

export type Land = {
  seed: number;
  /** noise wavelength scale, as a fraction of the reference size (desk: W; phone: H) */
  scale: number;
  amp: number;
  warp: number;
  /** regional fall in ft across the viewport (positive: higher at left / top) */
  fallX: number;
  fallY: number;
  drain: { bez: Bez; depth: number; width: number; floor: number; fall: number };
  ridge: { bez: Bez; height: number; width: number };
};

/**
 * Desktop: the ground falls to the south-east, so the pad's cut is deepest at its top-left corner
 * and its fill at the bottom-right, with balance points at the other two corners (the slopes
 * taper: it reads as earthwork, not a frame). A ridge spur comes down from the north-west (the
 * cut side); Willow Creek cuts in from the east and runs south (the fill side), so the pass grades
 * from cut into fill, the way a dozer moves dirt.
 */
export const LAND_DESK: Land = {
  seed: 11,
  scale: 0.9,
  amp: 2.8,
  warp: 0.85,
  fallX: 12,
  fallY: 11,
  drain: {
    bez: [
      [1.08, 0.42],
      [0.95, 0.6],
      [0.93, 0.82],
      [0.86, 1.12],
    ],
    depth: 7,
    width: 0.11,
    floor: 12,
    fall: 3,
  },
  ridge: {
    bez: [
      [-0.04, -0.06],
      [0.06, 0.1],
      [0.12, 0.24],
      [0.2, 0.42],
    ],
    height: 4,
    width: 0.1,
  },
};

/**
 * Phones (portrait): the ground falls to the south-east, so the cut tapers along the top edge and
 * the fill peels off line by line along the bottom (a straight full-width bundle reads as ruled
 * paper). A spur comes in from the north-west; a side drainage cuts in at the bottom right.
 */
export const LAND_PHONE: Land = {
  seed: 11,
  scale: 1.1,
  amp: 2.6,
  warp: 0.85,
  fallX: 11,
  fallY: 7,
  drain: {
    bez: [
      [0.95, 1.15],
      [0.8, 0.95],
      [0.82, 0.82],
      [1.12, 0.68],
    ],
    depth: 5,
    width: 0.12,
    floor: 9,
    fall: 2,
  },
  ridge: {
    bez: [
      [-0.12, -0.04],
      [0.1, 0.04],
      [0.22, 0.12],
      [0.4, 0.22],
    ],
    height: 3,
    width: 0.14,
  },
};

function bezPts(b: Bez, W: number, H: number, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const c1 = 3 * u * u * t;
    const c2 = 3 * u * t * t;
    const d = t * t * t;
    out.push([(a * b[0][0] + c1 * b[1][0] + c2 * b[2][0] + d * b[3][0]) * W, (a * b[0][1] + c1 * b[1][1] + c2 * b[2][1] + d * b[3][1]) * H]);
  }
  return out;
}

/** A polyline flattened for fast distance queries (no allocation per query). */
type Spine = { xy: Float64Array; len: Float64Array; total: number; n: number };
function spine(pl: Pt[]): Spine {
  const xy = new Float64Array(pl.length * 2);
  const len = new Float64Array(pl.length);
  pl.forEach((p, i) => {
    xy[2 * i] = p[0];
    xy[2 * i + 1] = p[1];
    if (i) len[i] = len[i - 1] + Math.hypot(p[0] - pl[i - 1][0], p[1] - pl[i - 1][1]);
  });
  return { xy, len, total: len[len.length - 1] || 1, n: pl.length };
}
/** how far along the spine (0…1) the last polyDist query's nearest point was */
let alongT = 0;
/** Distance from (px, py) to a spine; sets alongT. */
function polyDist(px: number, py: number, s: Spine): number {
  let best = Infinity;
  let bt = 0;
  const xy = s.xy;
  for (let i = 1; i < s.n; i++) {
    const ax = xy[2 * i - 2];
    const ay = xy[2 * i - 1];
    const ex = xy[2 * i] - ax;
    const ey = xy[2 * i + 1] - ay;
    const L2 = ex * ex + ey * ey || 1;
    let t = ((px - ax) * ex + (py - ay) * ey) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - ax - ex * t;
    const dy = py - ay - ey * t;
    const d = dx * dx + dy * dy;
    if (d < best) {
      best = d;
      bt = i - 1 + t;
    }
  }
  const i = Math.floor(bt);
  const f = bt - i;
  alongT = (s.len[i] + f * ((s.len[Math.min(i + 1, s.n - 1)] || s.len[i]) - s.len[i])) / s.total;
  return Math.sqrt(best);
}

/** The existing ground E(x, y) in ft (before the balance shift), for a W×H viewport. */
export function makeLand(W: number, H: number, mode: Mode) {
  const L = mode === "phone" ? LAND_PHONE : LAND_DESK;
  const S = (mode === "phone" ? H : W) * L.scale;
  const n1 = makeSimplex(L.seed);
  const n2 = makeSimplex(L.seed + 7);
  const n3 = makeSimplex(L.seed + 19);
  const fbm = (x: number, y: number, nz: (x: number, y: number) => number) => {
    let s = 0;
    let a = 0.6;
    let f = 1;
    for (let k = 0; k < 3; k++) {
      s += a * nz(x * f + k * 13.1, y * f - k * 7.7);
      f *= 2.03;
      a *= 0.35;
    }
    return s;
  };
  const ref = mode === "phone" ? H : W; // spine widths are fractions of this
  const dr = spine(bezPts(L.drain.bez, W, H));
  const rg = spine(bezPts(L.ridge.bez, W, H));
  const dw = L.drain.width * ref;
  const rw = L.ridge.width * ref;
  const floor2 = L.drain.floor * L.drain.floor;
  return (x: number, y: number) => {
    const u = x / S;
    const v = y / S;
    const qx = fbm(u * 1.1, v * 1.1, n2);
    const qy = fbm(u * 1.1 + 5.2, v * 1.1 + 1.3, n3);
    let e = L.amp * fbm(u * 1.4 + L.warp * qx, v * 1.4 + L.warp * qy, n1);
    e += L.fallX * (0.5 - x / W) + L.fallY * (0.5 - y / H);
    // Willow Creek: a V section with a rounded floor, falling downstream
    const dd = polyDist(x, y, dr);
    const dt = alongT;
    const ds = Math.sqrt(dd * dd + floor2);
    const k = 1 - ds / dw;
    if (k > 0) e -= L.drain.depth * Math.pow(k, 1.35);
    e -= L.drain.fall * dt * Math.max(0, 1 - dd / (dw * 1.8));
    // the ridge spur
    const rd = polyDist(x, y, rg);
    if (rd < 3.2 * rw) e += L.ridge.height * Math.exp(-(rd / rw) * (rd / rw));
    return e;
  };
}

// ─── grids ───────────────────────────────────────────────────────────────────────────────

/** A sampled field: value at (x0 + i·step, y0 + j·step), row-major. */
export type Grid = { x0: number; y0: number; step: number; nx: number; ny: number; v: Float32Array };

function sampleGrid(f: (x: number, y: number) => number, x0: number, y0: number, step: number, nx: number, ny: number): Grid {
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = f(x0 + i * step, y0 + j * step);
  return { x0, y0, step, nx, ny, v };
}

/** Catmull-Rom upsample by an integer factor (separable). */
function upsample(g: Grid, k: number): Grid {
  const nx = (g.nx - 1) * k + 1;
  const ny = (g.ny - 1) * k + 1;
  const w: number[][] = [];
  for (let s = 0; s < k; s++) {
    const t = s / k;
    const t2 = t * t;
    const t3 = t2 * t;
    w.push([(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2]);
  }
  const cl = (i: number, n: number) => (i < 0 ? 0 : i >= n ? n - 1 : i);
  // rows
  const tmp = new Float32Array(nx * g.ny);
  for (let j = 0; j < g.ny; j++) {
    const r = j * g.nx;
    for (let i = 0; i < nx; i++) {
      const c = Math.min(Math.floor(i / k), g.nx - 2);
      const s = i - c * k;
      const ww = s === k ? [0, 0, 1, 0] : w[s];
      tmp[j * nx + i] = ww[0] * g.v[r + cl(c - 1, g.nx)] + ww[1] * g.v[r + c] + ww[2] * g.v[r + cl(c + 1, g.nx)] + ww[3] * g.v[r + cl(c + 2, g.nx)];
    }
  }
  // columns
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const c = Math.min(Math.floor(j / k), g.ny - 2);
    const s = j - c * k;
    const ww = s === k ? [0, 0, 1, 0] : w[s];
    const r0 = cl(c - 1, g.ny) * nx;
    const r1 = c * nx;
    const r2 = cl(c + 1, g.ny) * nx;
    const r3 = cl(c + 2, g.ny) * nx;
    for (let i = 0; i < nx; i++) v[j * nx + i] = ww[0] * tmp[r0 + i] + ww[1] * tmp[r1 + i] + ww[2] * tmp[r2 + i] + ww[3] * tmp[r3 + i];
  }
  return { x0: g.x0, y0: g.y0, step: g.step / k, nx, ny, v };
}

/** Every k-th sample of a grid. */
function subsample(g: Grid, k: number): Grid {
  const nx = Math.floor((g.nx - 1) / k) + 1;
  const ny = Math.floor((g.ny - 1) / k) + 1;
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = g.v[j * k * g.nx + i * k];
  return { x0: g.x0, y0: g.y0, step: g.step * k, nx, ny, v };
}

export type Field = {
  W: number;
  H: number;
  mode: Mode;
  /** E on the fine grid (desk: 2 px; the shader's texture) */
  fine: Grid;
  /** E on the contouring grid (desk: 4 px; phone: 3 px) */
  cg: Grid;
};

const COARSE = { desk: 8, phone: 6 };
const FINE_K = { desk: 4, phone: 2 }; // desk 2 px, phone 3 px
const CONTOUR_K = { desk: 2, phone: 1 }; // of the fine grid: desk 4 px, phone 3 px

/**
 * E for a viewport: sampled on a coarse grid (the land is low-frequency), Catmull-Rom upsampled,
 * then shifted so the expected copy block sits at grade balance (as much cut as fill round it).
 */
export function buildField(W: number, H: number, mode: Mode): Field {
  const E = makeLand(W, H, mode);
  const c = COARSE[mode];
  const m = 3 * c;
  const coarse = sampleGrid(E, -m, -m, c, Math.ceil((W + 2 * m) / c) + 1, Math.ceil((H + 2 * m) / c) + 1);
  // the balance shift: the mean over where the copy will sit
  const bx = mode === "phone" ? [0.04, 0.96] : [0.3, 0.7];
  const by = mode === "phone" ? [0.12, 0.74] : [0.12, 0.88];
  let s = 0;
  let n = 0;
  for (let j = 0; j < coarse.ny; j++)
    for (let i = 0; i < coarse.nx; i++) {
      const x = coarse.x0 + i * c;
      const y = coarse.y0 + j * c;
      if (x >= bx[0] * W && x <= bx[1] * W && y >= by[0] * H && y <= by[1] * H) {
        s += coarse.v[j * coarse.nx + i];
        n++;
      }
    }
  const shift = PAD_EL - s / Math.max(1, n);
  for (let i = 0; i < coarse.v.length; i++) coarse.v[i] += shift;
  const fine = upsample(coarse, FINE_K[mode]);
  const cg = subsample(fine, CONTOUR_K[mode]);
  return { W, H, mode, fine, cg };
}

/** The shader's texture: (E − PAD_EL, ∂E/∂x, ∂E/∂y, 0) per fine-grid sample, RGBA32F. */
export function fieldTexture(f: Field): Float32Array {
  const g = f.fine;
  const out = new Float32Array(g.nx * g.ny * 4);
  const s2 = 2 * g.step;
  for (let j = 0; j < g.ny; j++)
    for (let i = 0; i < g.nx; i++) {
      const k = j * g.nx + i;
      const l = g.v[j * g.nx + Math.max(0, i - 1)];
      const r = g.v[j * g.nx + Math.min(g.nx - 1, i + 1)];
      const u = g.v[Math.max(0, j - 1) * g.nx + i];
      const d = g.v[Math.min(g.ny - 1, j + 1) * g.nx + i];
      out[k * 4] = g.v[k] - PAD_EL;
      out[k * 4 + 1] = (r - l) / s2;
      out[k * 4 + 2] = (d - u) / s2;
    }
  return out;
}

// ─── the grade ───────────────────────────────────────────────────────────────────────────

export type Grade = {
  pad: Pad;
  /** cut and fill slopes, ft per CSS px (2:1 and 3:1 at the plan's scale) */
  cut: number;
  fill: number;
  /** softness of the daylight crease, ft */
  k: number;
};

/** Signed distance to a rounded rectangle (negative inside). */
export function sdPad(px: number, py: number, p: Pad) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const r = Math.min(p.r, p.w / 2, p.h / 2);
  const qx = Math.abs(px - cx) - (p.w / 2 - r);
  const qy = Math.abs(py - cy) - (p.h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

/** The graded surface at a point, from the existing ground e there. */
export function graded(e: number, d: number, g: Grade) {
  if (d <= 0) return PAD_EL;
  const rel = e - PAD_EL;
  const hi = g.cut * d;
  const lo = -g.fill * d;
  const a = smin(rel, hi, g.k);
  return PAD_EL - smin(-a, -lo, g.k);
}

/** Slopes for a viewport: the plan's scale follows the viewport, so the land and the grade scale together. */
export function gradeFor(W: number, mode: Mode, pad: Pad): Grade {
  const ref = mode === "phone" ? 1 : 1440 / Math.max(900, W);
  return { pad, cut: 0.15 * ref, fill: 0.09 * ref, k: 1.1 };
}

// ─── contours ────────────────────────────────────────────────────────────────────────────

export type Line = { pts: Pt[]; closed: boolean };
export type Level = { level: number; index: boolean; lines: Line[] };

/** Marching squares over a grid at every integer level in range; joined polylines per level. */
export function contourGrid(g: Grid, levels?: [number, number]): Level[] {
  const { nx, ny, v, x0, y0, step } = g;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < v.length; i++) {
    if (v[i] < lo) lo = v[i];
    if (v[i] > hi) hi = v[i];
  }
  const L0 = Math.ceil(levels ? Math.max(lo, levels[0]) : lo);
  const L1 = Math.floor(levels ? Math.min(hi, levels[1]) : hi);
  const nL = Math.max(0, L1 - L0 + 1);
  // segments per level: [edgeKeyA, edgeKeyB] and the points on those edges
  const segs: number[][] = Array.from({ length: nL }, () => []);
  // edge keys: horizontal edge (i,j)-(i+1,j): 2·(j·nx+i); vertical (i,j)-(i,j+1): 2·(j·nx+i)+1
  const ptOf = (key: number, level: number): Pt => {
    const base = key >> 1;
    const i = base % nx;
    const j = (base - i) / nx;
    const a = v[base];
    if (key & 1) {
      const b = v[base + nx];
      const t = (level - a) / (b - a);
      return [x0 + i * step, y0 + (j + t) * step];
    }
    const b = v[base + 1];
    const t = (level - a) / (b - a);
    return [x0 + (i + t) * step, y0 + j * step];
  };
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i;
      const a = v[k];
      const b = v[k + 1];
      const c = v[k + nx + 1];
      const d = v[k + nx];
      let mn = a;
      let mx = a;
      if (b < mn) mn = b;
      if (b > mx) mx = b;
      if (c < mn) mn = c;
      if (c > mx) mx = c;
      if (d < mn) mn = d;
      if (d > mx) mx = d;
      const la = Math.max(L0, Math.ceil(mn));
      const lb = Math.min(L1, Math.floor(mx));
      if (la > lb) continue;
      const eT = 2 * k;
      const eB = 2 * (k + nx);
      const eL = 2 * k + 1;
      const eR = 2 * (k + 1) + 1;
      for (let L = la; L <= lb; L++) {
        // a value exactly on a level counts as above it
        const idx = (a >= L ? 8 : 0) | (b >= L ? 4 : 0) | (c >= L ? 2 : 0) | (d >= L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const S = segs[L - L0];
        switch (idx) {
          case 1:
          case 14:
            S.push(eL, eB);
            break;
          case 2:
          case 13:
            S.push(eB, eR);
            break;
          case 3:
          case 12:
            S.push(eL, eR);
            break;
          case 4:
          case 11:
            S.push(eT, eR);
            break;
          case 6:
          case 9:
            S.push(eT, eB);
            break;
          case 7:
          case 8:
            S.push(eL, eT);
            break;
          case 5:
          case 10: {
            const ctr = (a + b + c + d) / 4 >= L;
            if ((idx === 5) === ctr) S.push(eL, eT, eB, eR);
            else S.push(eL, eB, eT, eR);
            break;
          }
        }
      }
    }
  const out: Level[] = [];
  // per edge key: the (up to two) segments touching it, +1 (0 = none); reset per level
  const nk = 2 * nx * ny;
  const e1 = new Int32Array(nk);
  const e2 = new Int32Array(nk);
  for (let li = 0; li < nL; li++) {
    const level = L0 + li;
    const S = segs[li];
    const ns = S.length / 2;
    const used = new Uint8Array(ns);
    for (let s = 0; s < ns; s++)
      for (let q = 0; q < 2; q++) {
        const key = S[2 * s + q];
        if (!e1[key]) e1[key] = s + 1;
        else e2[key] = s + 1;
      }
    const other = (key: number) => {
      const a = e1[key] - 1;
      if (a >= 0 && !used[a]) return a;
      const b = e2[key] - 1;
      if (b >= 0 && !used[b]) return b;
      return -1;
    };
    const lines: Line[] = [];
    for (let s = 0; s < ns; s++) {
      if (used[s]) continue;
      used[s] = 1;
      const walk = (start: number, push: (k: number) => void) => {
        let key = start;
        for (;;) {
          const cand = other(key);
          if (cand < 0) return key;
          used[cand] = 1;
          const nk2 = S[2 * cand] === key ? S[2 * cand + 1] : S[2 * cand];
          push(nk2);
          key = nk2;
        }
      };
      const k0 = S[2 * s];
      const k1 = S[2 * s + 1];
      const tail: number[] = [];
      const head: number[] = [];
      const tk = walk(k1, (k) => tail.push(k));
      const hk = walk(k0, (k) => head.push(k));
      const all = [...head.reverse(), k0, k1, ...tail];
      const closed = tk === hk && all.length > 3;
      const pts = (closed ? all.slice(0, -1) : all).map((key) => ptOf(key, level));
      lines.push({ pts, closed });
    }
    for (let s = 0; s < ns; s++) {
      e1[S[2 * s]] = 0;
      e1[S[2 * s + 1]] = 0;
      e2[S[2 * s]] = 0;
      e2[S[2 * s + 1]] = 0;
    }
    out.push({ level, index: ((level % MAJOR) + MAJOR) % MAJOR === 0, lines });
  }
  return out;
}

export function chaikin(pts: Pt[], closed: boolean, it = 2): Pt[] {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q: Pt[] = [];
    const n = p.length;
    if (n < 3) return p;
    if (!closed) q.push(p[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i];
      const b = p[(i + 1) % n];
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    if (!closed) q.push(p[n - 1]);
    p = q;
  }
  return p;
}

export function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let md = 0;
    let mi = -1;
    const ax = pts[a][0];
    const ay = pts[a][1];
    const ex = pts[b][0] - ax;
    const ey = pts[b][1] - ay;
    const L = Math.hypot(ex, ey) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * ey - (pts[i][1] - ay) * ex) / L;
      if (d > md) {
        md = d;
        mi = i;
      }
    }
    if (md > eps) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

export function plen(p: Pt[]) {
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return s;
}

/** Bilinear sample of a grid (clamped). */
export function sample(g: Grid, x: number, y: number) {
  let fx = (x - g.x0) / g.step;
  let fy = (y - g.y0) / g.step;
  fx = fx < 0 ? 0 : fx > g.nx - 1.001 ? g.nx - 1.001 : fx;
  fy = fy < 0 ? 0 : fy > g.ny - 1.001 ? g.ny - 1.001 : fy;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const tx = fx - i;
  const ty = fy - j;
  const k = j * g.nx + i;
  const a = g.v[k];
  const b = g.v[k + 1];
  const c = g.v[k + g.nx];
  const d = g.v[k + g.nx + 1];
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

// ─── the plan ────────────────────────────────────────────────────────────────────────────

export type Run = { pts: Pt[]; index: boolean; level: number };

export type Label = { x: number; y: number; a: number; t: string };

export type PlanIn = {
  W: number;
  H: number;
  mode: Mode;
  pad: Pad;
  /** boxes labels keep clear of (the copy, the header, the foot row), CSS px */
  keep: Rect[];
  /** labels wanted (desk 4, phone 0) */
  labels: number;
};

export type Plan = {
  /** G contours outside the grading limits (natural ground), split intermediate / index */
  natural: Run[];
  /** G contours inside the limits (the proposed cut and fill slopes) */
  proposed: Run[];
  /** E contours inside the limits (the existing ground, dashed): on the pad, and under the slopes */
  existingPad: Run[];
  existingSlope: Run[];
  /** the grading limits' extent (where G ≠ E) */
  limits: Rect;
  labels: Label[];
  grade: Grade;
};

const LIM = 0.04; // ft: graded differs from existing by more than this → inside the grading limits

/**
 * Split polylines into runs by a per-vertex class (a run keeps its boundary vertex on both sides,
 * so neighbouring runs meet). Short slivers are dropped.
 */
function splitRuns(lines: Line[], cls: (p: Pt) => number, index: boolean, level: number, minLen: number): Map<number, Run[]> {
  const out = new Map<number, Run[]>();
  const add = (c: number, pts: Pt[]) => {
    if (pts.length < 2 || plen(pts) < minLen) return;
    const l = out.get(c);
    const r = { pts, index, level };
    if (l) l.push(r);
    else out.set(c, [r]);
  };
  for (const ln of lines) {
    const pts = ln.closed ? [...ln.pts, ln.pts[0]] : ln.pts;
    if (pts.length < 2) continue;
    const cs = pts.map(cls);
    // a closed line that changes class: start the walk at a class change so no run wraps
    let start = 0;
    if (ln.closed) {
      const ch = cs.findIndex((c, i) => i > 0 && c !== cs[i - 1]);
      if (ch < 0) {
        add(cs[0], pts);
        continue;
      }
      start = ch;
    }
    const n = pts.length - (ln.closed ? 1 : 0);
    const order = ln.closed ? Array.from({ length: n + 1 }, (_, i) => (start + i) % n) : pts.map((_, i) => i);
    let cur: Pt[] = [pts[order[0]]];
    let cc = cs[order[0]];
    for (let q = 1; q < order.length; q++) {
      const i = order[q];
      const p = pts[i];
      if (cs[i] !== cc) {
        // the boundary: halfway between the two vertices
        const pp = cur[cur.length - 1];
        const mid: Pt = [(pp[0] + p[0]) / 2, (pp[1] + p[1]) / 2];
        cur.push(mid);
        add(cc, cur);
        cur = [mid, p];
        cc = cs[i];
      } else cur.push(p);
    }
    add(cc, cur);
  }
  return out;
}

/** Each run smoothed on its own (Chaikin ×2 keeps a run's endpoints, so neighbouring runs still meet) and simplified. */
function finish(runs: Run[], eps: number): Run[] {
  return runs.map((r) => ({ ...r, pts: rdp(chaikin(r.pts, false, 2), eps) }));
}

export function buildPlan(f: Field, o: PlanIn): Plan {
  const g = f.cg;
  const grade = gradeFor(o.W, o.mode, o.pad);
  // G and the pad distance on the contouring grid
  const G = new Float32Array(g.v.length);
  const D = new Float32Array(g.v.length);
  let lx0 = Infinity;
  let ly0 = Infinity;
  let lx1 = -Infinity;
  let ly1 = -Infinity;
  for (let j = 0; j < g.ny; j++)
    for (let i = 0; i < g.nx; i++) {
      const k = j * g.nx + i;
      const x = g.x0 + i * g.step;
      const y = g.y0 + j * g.step;
      const d = sdPad(x, y, o.pad);
      D[k] = d;
      G[k] = graded(g.v[k], d, grade);
      if (Math.abs(G[k] - g.v[k]) > LIM) {
        if (x < lx0) lx0 = x;
        if (x > lx1) lx1 = x;
        if (y < ly0) ly0 = y;
        if (y > ly1) ly1 = y;
      }
    }
  const gG: Grid = { ...g, v: G };
  const gD: Grid = { ...g, v: D };
  const eps = o.mode === "phone" ? 0.3 : 0.32;
  const minLen = g.step * 3;
  const long = (lv: Level[]) => lv.map((l) => ({ ...l, lines: l.lines.filter((q) => plen(q.pts) > minLen) }));
  const cG = long(contourGrid(gG));
  const cE = long(contourGrid(g));
  const inLim = (p: Pt) => Math.abs(sample(gG, p[0], p[1]) - sample(g, p[0], p[1])) > LIM;

  const natural: Run[] = [];
  const proposed: Run[] = [];
  for (const lv of cG) {
    const m = splitRuns(lv.lines, (p) => (inLim(p) ? 1 : 0), lv.index, lv.level, 4);
    natural.push(...finish(m.get(0) || [], eps));
    proposed.push(...finish(m.get(1) || [], eps));
  }
  const existingPad: Run[] = [];
  const existingSlope: Run[] = [];
  for (const lv of cE) {
    // 0: natural (drawn by the G layer), 1: under the slopes, 2: on the pad
    const m = splitRuns(lv.lines, (p) => (sample(gD, p[0], p[1]) <= 0 ? 2 : inLim(p) ? 1 : 0), lv.index, lv.level, 4);
    existingSlope.push(...finish(m.get(1) || [], eps * 1.6));
    existingPad.push(...finish(m.get(2) || [], eps * 1.6));
  }
  const limits = lx0 <= lx1 ? { x: lx0, y: ly0, w: lx1 - lx0, h: ly1 - ly0 } : { x: 0, y: 0, w: 0, h: 0 };
  const labels = o.labels > 0 ? placeLabels(natural, gG, o) : [];
  return { natural, proposed, existingPad, existingSlope, limits, labels, grade };
}

// ─── labels ──────────────────────────────────────────────────────────────────────────────

/**
 * Index labels along calm stretches of natural ground: upright, top of the figures facing uphill,
 * ≥ 240 px apart, clear of the copy, the header and the foot row, never by the viewport edge.
 */
function placeLabels(runs: Run[], G: Grid, o: PlanIn): Label[] {
  const out: Label[] = [];
  const placed: Pt[] = [];
  const grad = (x: number, y: number): Pt => [(sample(G, x + 2, y) - sample(G, x - 2, y)) / 4, (sample(G, x, y + 2) - sample(G, x, y - 2)) / 4];
  const half = 22; // half the label's length along the line
  const cands: { p: Pt; a: number; t: string; score: number }[] = [];
  for (const r of runs) {
    if (!r.index) continue;
    const L = plen(r.pts);
    if (L < 140) continue;
    // resample the run at 4 px so "±k points" is a length
    const rs = resample(r.pts, 4);
    for (let i = 10; i < rs.length - 10; i += 3) {
      const p = rs[i];
      if (p[0] < 46 || p[0] > o.W - 46 || p[1] < 40 || p[1] > o.H - 24) continue;
      if (o.keep.some((k) => p[0] > k.x - 34 && p[0] < k.x + k.w + 34 && p[1] > k.y - 16 && p[1] < k.y + k.h + 16)) continue;
      if (sdPad(p[0], p[1], o.pad) < 70) continue;
      const a0 = Math.atan2(rs[i + 1][1] - rs[i - 1][1], rs[i + 1][0] - rs[i - 1][0]);
      // calm: the direction turns ≤ ~12° over the label's length either side
      const k = Math.ceil(half / 4) + 1;
      const aL = Math.atan2(rs[i][1] - rs[i - k][1], rs[i][0] - rs[i - k][0]);
      const aR = Math.atan2(rs[i + k][1] - rs[i][1], rs[i + k][0] - rs[i][0]);
      const turn = Math.abs(angDiff(aL, aR));
      if (turn > 0.24) continue;
      let ang = a0;
      if (ang > Math.PI / 2) ang -= Math.PI;
      if (ang < -Math.PI / 2) ang += Math.PI;
      if (Math.abs(ang) > 1.05) continue; // too steep to read upright
      const gr = grad(p[0], p[1]);
      const upx = Math.sin(ang);
      const upy = -Math.cos(ang);
      if (gr[0] * upx + gr[1] * upy <= 0) continue; // the figures would face downhill
      // neighbouring lines must be clear of the label's halo
      const gm = Math.hypot(gr[0], gr[1]) || 1e-6;
      if (1 / gm < 11) continue;
      cands.push({ p, a: (ang * 180) / Math.PI, t: r.level.toLocaleString("en-US"), score: turn + Math.abs(ang) * 0.3 });
    }
  }
  cands.sort((a, b) => a.score - b.score);
  for (const c of cands) {
    if (placed.some((q) => Math.hypot(q[0] - c.p[0], q[1] - c.p[1]) < 220)) continue;
    // one label per level and side reads as a plan, not a pattern
    if (out.some((l) => l.t === c.t && Math.sign(l.x - o.W / 2) === Math.sign(c.p[0] - o.W / 2))) continue;
    placed.push(c.p);
    out.push({ x: c.p[0], y: c.p[1], a: c.a, t: c.t });
    if (out.length >= o.labels) break;
  }
  return out;
}

function angDiff(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = step - acc;
    while (t <= L) {
      out.push([a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L]);
      t += step;
    }
    acc = L - (t - step);
  }
  return out;
}

// ─── SVG path data ───────────────────────────────────────────────────────────────────────

const num = (n: number) => {
  const r = Math.round(n * 10) / 10;
  const s = r.toFixed(1).replace(/\.0$/, "");
  return s.replace(/^(-?)0\./, "$1.");
};

/** Compact path data: absolute move, relative lines, 0.1 px. */
export function pathD(runs: Run[]): string {
  let d = "";
  for (const r of runs) {
    const pts = r.pts;
    if (pts.length < 2) continue;
    let px = Math.round(pts[0][0] * 10) / 10;
    let py = Math.round(pts[0][1] * 10) / 10;
    let seg = "";
    for (let i = 1; i < pts.length; i++) {
      const x = Math.round(pts[i][0] * 10) / 10;
      const y = Math.round(pts[i][1] * 10) / 10;
      const dx = x - px;
      const dy = y - py;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) continue;
      const sx = num(dx);
      const sy = num(dy);
      seg += (seg === "" || sx.startsWith("-") ? "" : " ") + sx + (sy.startsWith("-") ? "" : " ") + sy;
      px = x;
      py = y;
    }
    // a run that rounds to a single point draws nothing (and "M x y l" alone is invalid path data)
    if (seg) d += `M${num(Math.round(pts[0][0] * 10) / 10)} ${num(Math.round(pts[0][1] * 10) / 10)}l${seg}`;
  }
  return d;
}

/** Runs split exactly at a rectangle's edges: the parts inside and the parts outside. */
export function splitByRect(runs: Run[], r: Rect): { inside: Run[]; outside: Run[] } {
  const inside: Run[] = [];
  const outside: Run[] = [];
  const x1 = r.x + r.w;
  const y1 = r.y + r.h;
  const isIn = (p: Pt) => p[0] >= r.x && p[0] <= x1 && p[1] >= r.y && p[1] <= y1;
  // where the segment a→b (one end in, one out) crosses the rectangle's boundary
  const cross = (a: Pt, b: Pt): Pt => {
    let lo = 0;
    let hi = 1;
    const ain = isIn(a);
    for (let k = 0; k < 18; k++) {
      const m = (lo + hi) / 2;
      const p: Pt = [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
      if (isIn(p) === ain) lo = m;
      else hi = m;
    }
    const m = (lo + hi) / 2;
    return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
  };
  for (const run of runs) {
    let cur: Pt[] = [run.pts[0]];
    let cin = isIn(run.pts[0]);
    const flush = () => {
      if (cur.length > 1) (cin ? inside : outside).push({ pts: cur, index: run.index, level: run.level });
    };
    for (let i = 1; i < run.pts.length; i++) {
      const p = run.pts[i];
      const pin = isIn(p);
      if (pin !== cin) {
        const c = cross(cur[cur.length - 1], p);
        cur.push(c);
        flush();
        cur = [c, p];
        cin = pin;
      } else cur.push(p);
    }
    flush();
  }
  return { inside, outside };
}
