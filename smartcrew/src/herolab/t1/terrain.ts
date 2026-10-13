// t1 · "The Site Model": the land, the grade and the plan, cut into the sheets of a laser-cut site
// model. Pure math, no DOM (it runs in ./terrain.worker.ts, and in Node for offline studies).
//
// - The land: one believable landform per viewport, seeded and fixed (the same land on every
//   visit): low-frequency, domain-warped simplex fBm, a ridge spur from the left, Willow Creek's
//   drainage down the right (its contours V upstream) and a regional fall to the south-east. It
//   scales with the viewport, so 1440×660 and 1280×600 show the same land.
// - The grade: the copy sits on a level pad at PAD_EL. A tight cut slope uphill and a wider fill
//   slope downhill, both daylighting into the natural ground with a soft crease (smooth min/max);
//   where the ground is already at grade there is no slope, which keeps the pad from reading as a
//   frame.
// - The model: one sheet per index interval (5 ft). Sheet k is the region at or above its index
//   level; its edge IS that index contour, and the four intermediates of its band are printed on
//   it. Flat and seen from above, the stack is exactly the plan.
// - The plan: marching squares → joined polylines → Chaikin ×2 → Douglas–Peucker, each run tagged
//   natural or proposed (inside the grading limits), a few index labels set along calm stretches,
//   top facing uphill.
//
// Elevations are in feet; the contour interval is 1 ft; every 5th line is an index contour.

export type Rect = { x: number; y: number; w: number; h: number };
export type Pad = Rect & { r: number };
/** x0, y0, x1, y1 */
export type Box = [number, number, number, number];

export const INTERVAL = 1;
export const MAJOR = 5;
export const PAD_EL = 1240.5;

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
function makeSimplex(seed: number) {
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
    const j1 = x0 > y0 ? 0 : 1;
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

type Land = {
  /** noise wavelength scale, px at the reference width */
  S: number;
  ref: number;
  amp: number;
  fall: number;
  /** the creek: depth, half-width (× S), fall downstream */
  vd: number;
  vw: number;
  vfall: number;
  /** the ridge spur: height, half-width (× S) */
  rh: number;
  rw: number;
  /** the regional fall's share that runs north → south (the rest runs west → east) */
  fy: number;
  gain: number;
  warp: number;
  seed: number;
  /** cut and fill slopes (ft per px) and the daylight crease (ft) */
  cut: number;
  fill: number;
  tie: number;
  /** grid step (px) */
  step: number;
  /** Douglas–Peucker tolerance (px) */
  eps: number;
  /** closed loops shorter than this (px) are dropped: a map's tiny islands read as random shapes */
  minLoop: number;
};

const DESK: Land = { S: 1200, ref: 1440, amp: 3, fall: 14, vd: 10, vw: 0.3, vfall: 4, rh: 8, rw: 0.2, fy: 0.2, gain: 0.4, warp: 0.8, seed: 11, cut: 0.12, fill: 0.07, tie: 0.5, step: 7, eps: 0.4, minLoop: 220 };
const PHONE: Land = { S: 744, ref: 390, amp: 4, fall: 16, vd: 7, vw: 0.34, vfall: 3, rh: 6, rw: 0.22, fy: 0.3, gain: 0.35, warp: 0.8, seed: 11, cut: 0.14, fill: 0.08, tie: 0.5, step: 6, eps: 0.45, minLoop: 160 };

export type LandOver = Partial<Land>;
/** the land for a layout, with optional lab overrides (?t1Land=fall:20,cut:.1) */
export const landFor = (phone: boolean, over?: LandOver): Land => (over && Object.keys(over).length ? { ...(phone ? PHONE : DESK), ...over } : phone ? PHONE : DESK);

function bez(p0: number[], p1: number[], p2: number[], p3: number[], n: number) {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]);
  }
  return out;
}

/** distance from (px, py) to a polyline (flat xy array), and how far along it (0…1) the nearest point is */
function distPl(px: number, py: number, pl: number[], cum: number[], total: number): [number, number] {
  let best = Infinity;
  let bt = 0;
  for (let i = 2; i < pl.length; i += 2) {
    const ax = pl[i - 2];
    const ay = pl[i - 1];
    const ex = pl[i] - ax;
    const ey = pl[i + 1] - ay;
    const L2 = ex * ex + ey * ey;
    let t = ((px - ax) * ex + (py - ay) * ey) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - ax - ex * t;
    const dy = py - ay - ey * t;
    const d = dx * dx + dy * dy;
    if (d < best) {
      best = d;
      bt = cum[(i >> 1) - 1] + t * (cum[i >> 1] - cum[(i >> 1) - 1]);
    }
  }
  return [Math.sqrt(best), bt / total];
}

function cumLen(pl: number[]) {
  const c = [0];
  for (let i = 2; i < pl.length; i += 2) c.push(c[c.length - 1] + Math.hypot(pl[i] - pl[i - 2], pl[i + 1] - pl[i - 1]));
  return c;
}

/** The natural ground (ft, before the pad offset), for a W×H hero whose first screen is `Hv` tall. */
function makeLand(W: number, Hv: number, o: Land) {
  const S = o.S * (W / o.ref);
  const n1 = makeSimplex(o.seed);
  const n2 = makeSimplex(o.seed + 7);
  const n3 = makeSimplex(o.seed + 19);
  const fbm = (x: number, y: number, nz: (a: number, b: number) => number) => {
    let s = 0;
    let a = 0.6;
    let f = 1;
    for (let k = 0; k < 3; k++) {
      s += a * nz(x * f + k * 13.1, y * f - k * 7.7);
      f *= 2.03;
      a *= o.gain;
    }
    return s;
  };
  const H = Hv;
  // Willow Creek: enters top right, leaves bottom right of centre; the ridge spur from the left
  const dr = bez([W * 1.05, -H * 0.05], [W * 0.78, H * 0.35], [W * 0.95, H * 0.75], [W * 0.62, H * 1.08], 40);
  const rg = bez([-W * 0.05, H * 0.15], [W * 0.18, H * 0.25], [W * 0.22, H * 0.7], [W * 0.38, H * 1.05], 40);
  const drc = cumLen(dr);
  const rgc = cumLen(rg);
  const drT = drc[drc.length - 1];
  const rgT = rgc[rgc.length - 1];
  const wv = o.vw * S;
  const rw = o.rw * S;
  /** the warped noise (low frequency: sampled on a coarse grid) */
  const noise = (x: number, y: number) => {
    const u = x / S;
    const v = y / S;
    const qx = fbm(u * 1.1, v * 1.1, n2);
    const qy = fbm(u * 1.1 + 5.2, v * 1.1 + 1.3, n3);
    return o.amp * fbm(u * 1.4 + o.warp * qx, v * 1.4 + o.warp * qy, n1);
  };
  /** the landforms: the regional fall, the creek and the ridge (exact, on the fine grid) */
  const shape = (x: number, y: number) => {
    let e = o.fall * ((0.5 - y / H) * o.fy + (0.5 - x / W) * (1 - o.fy));
    const [dd, dt] = distPl(x, y, dr, drc, drT);
    // a V with a rounded bottom (marching squares kinks on a crease)
    const ds = Math.sqrt(dd * dd + 400);
    const vv = Math.max(0, 1 - ds / wv);
    e -= o.vd * Math.pow(vv, 1.35) * (0.6 + 0.4 * (1 - dt));
    e -= o.vfall * dt * Math.max(0, 1 - dd / (wv * 1.6));
    const [rd] = distPl(x, y, rg, rgc, rgT);
    e += o.rh * Math.exp(-((rd / rw) * (rd / rw)));
    return e;
  };
  return { noise, shape };
}

// ─── the field grid ──────────────────────────────────────────────────────────────────────

/** m: how far the model runs past the hero on every side (px): phones see the whole site model first, then the camera dives onto the pad */
export type Field = { W: number; H: number; Hv: number; m: number; phone: boolean; land: Land; step: number; x0: number; y0: number; nx: number; ny: number; E: Float32Array };

/** Sample the natural ground on a grid two steps past every edge of the W×H hero. */
export function buildField(W: number, H: number, Hv: number, phone: boolean, m = 0, over?: LandOver): Field {
  const o = landFor(phone, over);
  const { noise, shape } = makeLand(W, Hv, o);
  const step = o.step;
  const x0 = -m - 2 * step;
  const y0 = -m - 2 * step;
  const nx = Math.ceil((W + 2 * m + 4 * step) / step) + 1;
  const ny = Math.ceil((H + 2 * m + 4 * step) / step) + 1;
  // the noise on a grid 3× coarser, bilinear in between (its wavelength is ~1,000 px)
  const c = 3;
  const cx = Math.ceil((nx - 1) / c) + 1;
  const cy = Math.ceil((ny - 1) / c) + 1;
  const N = new Float32Array(cx * cy);
  for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) N[j * cx + i] = noise(x0 + i * c * step, y0 + j * c * step);
  const E = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const gj = j / c;
    const j0 = Math.min(cy - 2, Math.floor(gj));
    const ty = gj - j0;
    for (let i = 0; i < nx; i++) {
      const gi = i / c;
      const i0 = Math.min(cx - 2, Math.floor(gi));
      const tx = gi - i0;
      const a = N[j0 * cx + i0];
      const b = N[j0 * cx + i0 + 1];
      const d = N[(j0 + 1) * cx + i0];
      const e = N[(j0 + 1) * cx + i0 + 1];
      const n = a + (b - a) * tx + (d - a) * ty + (a - b - d + e) * tx * ty;
      E[j * nx + i] = n + shape(x0 + i * step, y0 + j * step);
    }
  }
  return { W, H, Hv, m, phone, land: o, step, x0, y0, nx, ny, E };
}

// ─── the grade ───────────────────────────────────────────────────────────────────────────

function sdRound(px: number, py: number, r: Pad) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rr = Math.min(r.r, r.w / 2, r.h / 2);
  const qx = Math.abs(px - cx) - (r.w / 2 - rr);
  const qy = Math.abs(py - cy) - (r.h / 2 - rr);
  const mx = qx > 0 ? qx : 0;
  const my = qy > 0 ? qy : 0;
  return Math.sqrt(mx * mx + my * my) + Math.min(Math.max(qx, qy), 0) - rr;
}

function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

// ─── marching squares ────────────────────────────────────────────────────────────────────

type Grid = { v: Float32Array; nx: number; ny: number; x0: number; y0: number; s: number };

/** Reusable buffers, keyed by grid size (edges are numbered 2 per vertex: horizontal, vertical). */
class Tracer {
  px: Float32Array;
  py: Float32Array;
  stamp: Int32Array;
  l0: Int32Array;
  l1: Int32Array;
  lstamp: Int32Array;
  cur = 0;
  segA: number[] = [];
  segB: number[] = [];
  g: Grid;
  private cv: Float32Array | null = null;
  /** the grid with its outermost ring at −∞ (every line closes round the frame) */
  closedValues() {
    if (this.cv) return this.cv;
    const { v, nx, ny } = this.g;
    const c = new Float32Array(v);
    for (let i = 0; i < nx; i++) {
      c[i] = -1e9;
      c[(ny - 1) * nx + i] = -1e9;
    }
    for (let j = 0; j < ny; j++) {
      c[j * nx] = -1e9;
      c[j * nx + nx - 1] = -1e9;
    }
    return (this.cv = c);
  }
  /** cells by the integer levels they span (counting sort): each level visits only its own cells */
  private bStart: Int32Array | null = null;
  private bCells: Int32Array | null = null;
  private bBase = 0;
  private border: Int32Array | null = null;
  bucketize(base: number, top: number, bias: number) {
    const { v, nx, ny } = this.g;
    const nL = top - base + 1;
    const count = new Int32Array(nL + 1);
    const nc = (nx - 1) * (ny - 1);
    const lo = new Int16Array(nc);
    const hi = new Int16Array(nc);
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = v[j * nx + i];
        const b = v[j * nx + i + 1];
        const c = v[(j + 1) * nx + i + 1];
        const d = v[(j + 1) * nx + i];
        const mn = Math.min(a, b, c, d);
        const mx = Math.max(a, b, c, d);
        // level L (tested as L + bias) crosses the cell if mn < L + bias <= mx
        const l0 = Math.max(base, Math.ceil(mn - bias));
        const l1 = Math.min(top, Math.floor(mx - bias));
        const k = j * (nx - 1) + i;
        lo[k] = l0 - base;
        hi[k] = l1 - base;
        for (let L = l0; L <= l1; L++) count[L - base + 1]++;
      }
    }
    for (let L = 1; L <= nL; L++) count[L] += count[L - 1];
    const cells = new Int32Array(count[nL]);
    const fillAt = count.slice(0, nL);
    for (let k = 0; k < nc; k++) for (let L = lo[k]; L <= hi[k]; L++) cells[fillAt[L]++] = k;
    this.bStart = count;
    this.bCells = cells;
    this.bBase = base;
    const br: number[] = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) if (i === 0 || j === 0 || i === nx - 2 || j === ny - 2) br.push(j * (nx - 1) + i);
    this.border = Int32Array.from(br);
  }
  constructor(g: Grid) {
    this.g = g;
    const n = g.nx * g.ny * 2;
    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.stamp = new Int32Array(n);
    this.l0 = new Int32Array(n);
    this.l1 = new Int32Array(n);
    this.lstamp = new Int32Array(n);
  }

  /** Lines of the level set v = L (flat xy arrays). `closed`: the outermost ring counts as −∞, so every line closes round the frame (the sheets' outlines). */
  trace(L: number, closed: boolean, all = false): { pts: number[]; closed: boolean }[] {
    const { v, nx, ny, x0, y0, s } = this.g;
    const st = ++this.cur;
    const segA = (this.segA = [] as number[]);
    const segB = (this.segB = [] as number[]);
    const vv = closed ? this.closedValues() : v;
    const val = (i: number, j: number) => vv[j * nx + i];
    const pt = (e: number) => {
      if (this.stamp[e] === st) return;
      this.stamp[e] = st;
      const vert = e & 1;
      const vi = e >> 1;
      const i = vi % nx;
      const j = (vi / nx) | 0;
      const a = val(i, j);
      const b = vert ? val(i, j + 1) : val(i + 1, j);
      const t = (L - a) / (b - a);
      this.px[e] = x0 + (i + (vert ? 0 : t)) * s;
      this.py[e] = y0 + (j + (vert ? t : 0)) * s;
    };
    const add = (e1: number, e2: number) => {
      pt(e1);
      pt(e2);
      const n = segA.length;
      segA.push(e1);
      segB.push(e2);
      if (this.lstamp[e1] !== st) {
        this.lstamp[e1] = st;
        this.l0[e1] = n;
        this.l1[e1] = -1;
      } else this.l1[e1] = n;
      if (this.lstamp[e2] !== st) {
        this.lstamp[e2] = st;
        this.l0[e2] = n;
        this.l1[e2] = -1;
      } else this.l1[e2] = n;
    };
    // the cells this level crosses (and, for an outline, every cell on the frame)
    const li = Math.round(L) - this.bBase;
    const from = this.bStart && li >= 0 && li < this.bStart.length - 1 ? this.bStart[li] : 0;
    const to = this.bStart && li >= 0 && li < this.bStart.length - 1 ? this.bStart[li + 1] : 0;
    const extra = closed && this.border ? this.border.length : 0;
    const visit = (k: number) => {
      {
        const i = k % (nx - 1);
        const j = (k / (nx - 1)) | 0;
        const a = val(i, j);
        const b = val(i + 1, j);
        const c = val(i + 1, j + 1);
        const d = val(i, j + 1);
        const idx = (a >= L ? 8 : 0) | (b >= L ? 4 : 0) | (c >= L ? 2 : 0) | (d >= L ? 1 : 0);
        if (idx === 0 || idx === 15) return;
        const T = (j * nx + i) * 2;
        const R = (j * nx + i + 1) * 2 + 1;
        const B = ((j + 1) * nx + i) * 2;
        const Lf = (j * nx + i) * 2 + 1;
        switch (idx) {
          case 1:
          case 14:
            add(Lf, B);
            break;
          case 2:
          case 13:
            add(B, R);
            break;
          case 3:
          case 12:
            add(Lf, R);
            break;
          case 4:
          case 11:
            add(T, R);
            break;
          case 6:
          case 9:
            add(T, B);
            break;
          case 7:
          case 8:
            add(Lf, T);
            break;
          case 5:
          case 10: {
            const hi = (a + b + c + d) / 4 >= L;
            if ((idx === 5) === hi) {
              add(Lf, T);
              add(B, R);
            } else {
              add(Lf, B);
              add(T, R);
            }
            break;
          }
        }
      }
    };
    if (this.bCells && !all) {
      const seen = closed ? new Uint8Array((nx - 1) * (ny - 1)) : null;
      for (let q = from; q < to; q++) {
        const k = this.bCells[q];
        if (seen) seen[k] = 1;
        visit(k);
      }
      for (let q = 0; q < extra; q++) if (!seen![this.border![q]]) visit(this.border![q]);
    } else for (let k = 0; k < (nx - 1) * (ny - 1); k++) visit(k);
    // join the segments into polylines
    const used = new Uint8Array(segA.length);
    const lines: { pts: number[]; closed: boolean }[] = [];
    const other = (e: number, seg: number) => (this.l0[e] === seg ? this.l1[e] : this.l0[e]);
    for (let n = 0; n < segA.length; n++) {
      if (used[n]) continue;
      used[n] = 1;
      const fwd: number[] = [segA[n], segB[n]];
      // forward from B
      let seg = n;
      let e = segB[n];
      let isClosed = false;
      for (;;) {
        const m = other(e, seg);
        if (m < 0 || used[m]) break;
        used[m] = 1;
        const ne = segA[m] === e ? segB[m] : segA[m];
        seg = m;
        e = ne;
        if (e === fwd[0]) {
          isClosed = true;
          break;
        }
        fwd.push(e);
      }
      if (!isClosed) {
        // backward from A
        const back: number[] = [];
        seg = n;
        e = segA[n];
        for (;;) {
          const m = other(e, seg);
          if (m < 0 || used[m]) break;
          used[m] = 1;
          const ne = segA[m] === e ? segB[m] : segA[m];
          seg = m;
          e = ne;
          back.push(e);
        }
        if (back.length) fwd.unshift(...back.reverse());
      }
      const pts: number[] = [];
      for (const ed of fwd) pts.push(this.px[ed], this.py[ed]);
      lines.push({ pts, closed: isClosed });
    }
    return lines;
  }
}

// ─── smoothing and simplification ────────────────────────────────────────────────────────

function chaikin(p: number[], closed: boolean, it = 2) {
  for (let k = 0; k < it; k++) {
    const n = p.length >> 1;
    const q: number[] = [];
    if (!closed) q.push(p[0], p[1]);
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const ax = p[2 * i];
      const ay = p[2 * i + 1];
      const j = (i + 1) % n;
      const bx = p[2 * j];
      const by = p[2 * j + 1];
      q.push(0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by, 0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by);
    }
    if (!closed) q.push(p[2 * n - 2], p[2 * n - 1]);
    p = q;
  }
  return p;
}

function rdp(p: number[], eps: number) {
  const n = p.length >> 1;
  if (n < 3) return p;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: number[] = [0, n - 1];
  while (stack.length) {
    const b = stack.pop()!;
    const a = stack.pop()!;
    const ax = p[2 * a];
    const ay = p[2 * a + 1];
    const ex = p[2 * b] - ax;
    const ey = p[2 * b + 1] - ay;
    const L = Math.hypot(ex, ey) || 1;
    let md = 0;
    let mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((p[2 * i] - ax) * ey - (p[2 * i + 1] - ay) * ex) / L;
      if (d > md) {
        md = d;
        mi = i;
      }
    }
    if (md > eps) {
      keep[mi] = 1;
      stack.push(a, mi, mi, b);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(p[2 * i], p[2 * i + 1]);
  return out;
}

function plen(p: number[]) {
  let s = 0;
  for (let i = 2; i < p.length; i += 2) {
    const dx = p[i] - p[i - 2];
    const dy = p[i + 1] - p[i - 1];
    s += Math.sqrt(dx * dx + dy * dy);
  }
  return s;
}

// ─── path encoding: absolute M, then relative l at 0.1 px ───────────────────────────────

const num = (n: number) => {
  // n is an integer count of 0.1 px
  const neg = n < 0;
  const a = Math.abs(n);
  const int = (a / 10) | 0;
  const dec = a % 10;
  const s = dec ? (int ? `${int}.${dec}` : `.${dec}`) : `${int}`;
  return neg ? `-${s}` : s;
};

/** Append an SVG path for a polyline (flat xy) to `out`; returns out. */
function enc(pts: number[], closed: boolean): string {
  let px = Math.round(pts[0] * 10);
  let py = Math.round(pts[1] * 10);
  let d = `M${num(px)} ${num(py)}l`;
  let first = true;
  for (let i = 2; i < pts.length; i += 2) {
    const x = Math.round(pts[i] * 10);
    const y = Math.round(pts[i + 1] * 10);
    const dx = x - px;
    const dy = y - py;
    if (!dx && !dy) continue;
    const sx = num(dx);
    const sy = num(dy);
    d += (first || sx[0] === "-" ? "" : " ") + sx + (sy[0] === "-" ? "" : " ") + sy;
    first = false;
    px = x;
    py = y;
  }
  return d + (closed ? "z" : "");
}

// ─── the plan and the model ──────────────────────────────────────────────────────────────

/** natural/proposed × minor/index, and the same within NEAR px of the pad ("…n": drawn lighter, so nothing buzzes against the type) */
export type InkKey = "nm" | "ni" | "pm" | "pi" | "nmn" | "nin" | "pmn" | "pin";
export type Ink = Partial<Record<InkKey, string>>;
export const INK_KEYS: InkKey[] = ["nm", "pm", "ni", "pi", "nmn", "pmn", "nin", "pin"];
export type Sheet = {
  /** the sheet's index level (ft) */
  level: number;
  /** its outline (closed round the frame), for the paper; evenodd */
  fill: string;
  fillBox: Box;
  /** its band's lines: natural/proposed × minor/index */
  ink: Ink;
  inkBox: Box;
};
export type Label = { x: number; y: number; a: number; t: string };
export type Plan = {
  sheets: Sheet[];
  /** the sheet the pad (and the copy) sits on */
  padSheet: number;
  labels: Label[];
  /** the pad elevation note's anchor (desktop), inside the pad's lower-right corner */
  padEl: number;
  stats: { levels: number; inkBytes: number; fillBytes: number; ms: number };
  /** per index/minor level, the polylines (for the cursor's contour readout): level, flat xy */
  lines: { level: number; pts: number[] }[];
};

/**
 * pads: the level pad as a union of rounded boxes (the copy's blocks: a narrower top over a wider
 * base reads as an engineered pad with an apron, not a frame); blend: the union's fillet (px).
 */
export type PlanIn = {
  pads: Pad[];
  blend: number;
  /** labels stay clear of these */
  keep: Rect[];
  /** lines inside these step back like the lines near the pad (the header band, the foot row) */
  quiet: Rect[];
  labels: number;
  labelGap: number;
};

const bilin = (v: Float32Array, f: Field, x: number, y: number) => {
  const gx = (x - f.x0) / f.step;
  const gy = (y - f.y0) / f.step;
  const i = Math.max(0, Math.min(f.nx - 2, Math.floor(gx)));
  const j = Math.max(0, Math.min(f.ny - 2, Math.floor(gy)));
  const tx = gx - i;
  const ty = gy - j;
  const a = v[j * f.nx + i];
  const b = v[j * f.nx + i + 1];
  const c = v[(j + 1) * f.nx + i + 1];
  const d = v[(j + 1) * f.nx + i];
  return a + (b - a) * tx + (d - a) * ty + (a - b - d + c) * tx * ty;
};

const fmtEl = (n: number) => n.toLocaleString("en-US");

export function buildPlan(f: Field, o: PlanIn): Plan {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const land = f.land;
  const { nx, ny, step, x0, y0, W, H, m: mg } = f;
  const pads = o.pads;
  // the pad's centroid (area-weighted) is set at PAD_EL: half cut, half fill
  let ax = 0;
  let ay = 0;
  let aa = 0;
  for (const q of pads) {
    ax += (q.x + q.w / 2) * q.w * q.h;
    ay += (q.y + q.h / 2) * q.w * q.h;
    aa += q.w * q.h;
  }
  const off = PAD_EL - bilin(f.E, f, ax / aa, ay / aa);
  const sdPad = (x: number, y: number) => {
    let d = sdRound(x, y, pads[0]);
    for (let i = 1; i < pads.length; i++) d = smin(d, sdRound(x, y, pads[i]), o.blend);
    return d;
  };
  // existing (G) and graded (P) ground
  const G = new Float32Array(nx * ny);
  const P = new Float32Array(nx * ny);
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const x = x0 + i * step;
      const y = y0 + j * step;
      const e = f.E[k] + off;
      G[k] = e;
      const d = sdPad(x, y);
      let p: number;
      if (d <= 0) p = PAD_EL;
      else if (e > PAD_EL) p = smin(e, PAD_EL + land.cut * d, land.tie);
      else p = -smin(-e, -(PAD_EL - land.fill * d), land.tie);
      P[k] = p;
      if (x >= -mg && x <= W + mg && y >= -mg && y <= H + mg) {
        if (p < lo) lo = p;
        if (p > hi) hi = p;
      }
    }
  }
  const grid: Grid = { v: P, nx, ny, x0, y0, s: step };
  const tr = new Tracer(grid);
  const IDX = INTERVAL * MAJOR;
  const base = Math.floor(lo / IDX) * IDX;
  tr.bucketize(base, Math.ceil(hi) + 1, 1e-3);
  const nSheets = Math.floor((hi - base) / IDX) + 1;
  const near = f.phone ? 30 : 44;
  const inQuiet = (x: number, y: number) => o.quiet.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  const disturbed = (x: number, y: number) => Math.abs(bilin(P, f, x, y) - bilin(G, f, x, y)) > 0.12;
  const interior = (p: number[]) => {
    for (let i = 0; i < p.length; i += 2) if (p[i] < -mg || p[i + 1] < -mg || p[i] > W + mg || p[i + 1] > H + mg) return false;
    return true;
  };
  const inView = (x: number, y: number) => x > -mg - step && x < W + mg + step && y > -mg - step && y < H + mg + step;

  /** a sheet's outline: the level's lines closed round the frame (evenodd), small islands dropped */
  const outline = (L: number, all: boolean) => {
    let d = "";
    const box: Box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const l of tr.trace(L, true, all)) {
      let pts = chaikin(l.pts, l.closed);
      pts = rdp(pts, land.eps);
      if (pts.length < 6 || plen(pts) < step * 3) continue;
      // a small island or pit (a closed loop clear of the frame): dropped here and from the ink alike
      if (l.closed && interior(pts) && plen(pts) < land.minLoop) continue;
      for (let i = 0; i < pts.length; i += 2) {
        box[0] = Math.min(box[0], pts[i]);
        box[1] = Math.min(box[1], pts[i + 1]);
        box[2] = Math.max(box[2], pts[i]);
        box[3] = Math.max(box[3], pts[i + 1]);
      }
      d += enc(pts, true);
    }
    return { d, box };
  };
  const sheets: Sheet[] = [];
  const allLines: { level: number; pts: number[] }[] = [];
  const natIndex: { level: number; pts: number[] }[] = [];
  const proIndex: { level: number; pts: number[] }[] = [];
  let inkBytes = 0;
  let fillBytes = 0;
  for (let k = 0; k < nSheets; k++) {
    const Lk = base + k * IDX;
    // the sheet's outline: the index contour, closed round the frame
    let fill = "";
    const fb: Box = [Infinity, Infinity, -Infinity, -Infinity];
    if (k === 0) {
      // the base board: the whole frame
      const a = -mg - step;
      fill = `M${a} ${a}H${W + mg + step}V${H + mg + step}H${a}z`;
      fb[0] = a;
      fb[1] = a;
      fb[2] = W + mg + step;
      fb[3] = H + mg + step;
    } else {
      const o1 = outline(Lk + 1e-3, false);
      fill = o1.d;
      for (let i = 0; i < 4; i++) fb[i] = o1.box[i];
    }
    // the band's lines: the index contour (the sheet's edge) and its four intermediates
    const ink: Ink = {};
    const ib: Box = [Infinity, Infinity, -Infinity, -Infinity];
    for (let m = 0; m < MAJOR; m++) {
      const L = Lk + m * INTERVAL;
      if (L < lo || L > hi) continue;
      const index = m === 0;
      for (const l of tr.trace(L + 1e-3, false)) {
        let pts = chaikin(l.pts, l.closed);
        pts = rdp(pts, land.eps);
        if (pts.length < 4 || plen(pts) < step * 4) continue;
        if (l.closed && plen(pts) < land.minLoop) continue;
        // runs: natural / proposed, clipped to the view (+1 step)
        let run: number[] = [];
        let runCls = 0;
        const flush = () => {
          if (run.length >= 4) {
            const runPro = runCls & 2;
            const key = ((runPro ? "p" : "n") + (index ? "i" : "m") + (runCls & 1 ? "n" : "")) as InkKey;
            ink[key] = (ink[key] ?? "") + enc(run, false);
            for (let i = 0; i < run.length; i += 2) {
              ib[0] = Math.min(ib[0], run[i]);
              ib[1] = Math.min(ib[1], run[i + 1]);
              ib[2] = Math.max(ib[2], run[i]);
              ib[3] = Math.max(ib[3], run[i + 1]);
            }
            allLines.push({ level: L, pts: run });
            if (index) (runPro ? proIndex : natIndex).push({ level: L, pts: run });
          }
          run = [];
        };
        const n = pts.length >> 1;
        const closedLoop = l.closed;
        for (let i = 0; i <= n - (closedLoop ? 0 : 1); i++) {
          const ii = i % n;
          const x = pts[2 * ii];
          const y = pts[2 * ii + 1];
          if (!inView(x, y)) {
            if (run.length) {
              run.push(x, y);
              flush();
            }
            continue;
          }
          const cls = (disturbed(x, y) ? 2 : 0) | (sdPad(x, y) < near || inQuiet(x, y) ? 1 : 0);
          if (run.length && cls !== runCls) {
            run.push(x, y);
            flush();
          }
          if (!run.length) {
            runCls = cls;
            // carry the previous point so runs join without a gap
            if (i > 0) {
              const pi = (ii - 1 + n) % n;
              run.push(pts[2 * pi], pts[2 * pi + 1]);
            }
          }
          run.push(x, y);
        }
        flush();
      }
    }
    for (const s of Object.values(ink)) inkBytes += s!.length;
    fillBytes += fill.length;
    sheets.push({ level: Lk, fill, fillBox: fb, ink, inkBox: ib });
  }

  // labels go on the natural ground first; a grading plan labels its proposed index contours too
  const labels = placeLabels(natIndex, proIndex, P, f, o);
  const padSheet = Math.floor((PAD_EL - base) / IDX);
  const ms = (typeof performance !== "undefined" ? performance.now() : 0) - t0;
  return { sheets, padSheet, labels, padEl: PAD_EL, stats: { levels: Math.round(hi - lo), inkBytes, fillBytes, ms }, lines: allLines };
}

// ─── labels: along calm stretches of natural index lines, top facing uphill ─────────────

function placeLabels(nat: { level: number; pts: number[] }[], pro: { level: number; pts: number[] }[], P: Float32Array, f: Field, o: PlanIn): Label[] {
  const out: Label[] = [];
  const placed: number[][] = [];
  const g = (x: number, y: number): [number, number] => [(bilin(P, f, x + 2, y) - bilin(P, f, x - 2, y)) / 4, (bilin(P, f, x, y + 2) - bilin(P, f, x, y - 2)) / 4];
  // longest first: a label on a line that runs a long way reads as the map's own
  const byLen = (ls: { level: number; pts: number[] }[]) => ls.map((l) => ({ l, len: plen(l.pts) })).sort((a, b) => b.len - a.len);
  const lines = [...byLen(nat), ...byLen(pro)].map((e) => e.l);
  const order = lines.map((_, i) => ({ i }));
  for (const { i } of order) {
    const l = lines[i];
    const pts = l.pts;
    const n = pts.length >> 1;
    const L = plen(pts);
    if (L < 160 || n < 3) continue;
    // resample at ~6 px for a steady tangent
    const cum: number[] = [0];
    for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]));
    const at = (s: number): [number, number] => {
      let k = 1;
      while (k < n - 1 && cum[k] < s) k++;
      const t = (s - cum[k - 1]) / (cum[k] - cum[k - 1] || 1);
      return [pts[2 * k - 2] + (pts[2 * k] - pts[2 * k - 2]) * t, pts[2 * k - 1] + (pts[2 * k + 1] - pts[2 * k - 1]) * t];
    };
    for (const frac of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
      const s = L * frac;
      if (s < 40 || s > L - 40) continue;
      const p = at(s);
      const a = at(s - 18);
      const b = at(s + 18);
      const c = at(s - 34);
      const d = at(s + 34);
      const [x, y] = p;
      if (x < 40 || y < 70 || x > f.W - 40 || y > f.Hv - 30) continue;
      if (o.keep.some((r) => x > r.x - 26 && x < r.x + r.w + 26 && y > r.y - 18 && y < r.y + r.h + 18)) continue;
      if (placed.some((q) => Math.hypot(q[0] - x, q[1] - y) < o.labelGap)) continue;
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const ang2 = Math.atan2(d[1] - c[1], d[0] - c[0]);
      let da = Math.abs(ang2 - ang);
      if (da > Math.PI) da = 2 * Math.PI - da;
      if (da > 0.22) continue; // not a calm stretch
      if (ang > Math.PI / 2) ang -= Math.PI;
      if (ang < -Math.PI / 2) ang += Math.PI;
      if (Math.abs(ang) > 1.45) continue; // past vertical: it would read upside down
      const gr = g(x, y);
      const upx = Math.sin(ang);
      const upy = -Math.cos(ang);
      if (gr[0] * upx + gr[1] * upy <= 0) continue; // it would read downhill
      placed.push([x, y]);
      out.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, a: Math.round((ang * 180) / Math.PI * 10) / 10, t: fmtEl(l.level) });
      break;
    }
    if (out.length >= o.labels) break;
  }
  return out;
}
