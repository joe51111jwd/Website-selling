// Contour generator for the hero ground. The copy column is a landform: an elevation field built
// from the signed distance to the measured text boxes (and the geofence), plus a seeded fBm
// terrain further out. Marching squares turns it into iso-lines, which are joined, simplified and
// smoothed (Catmull-Rom to cubic Béziers) into two static SVG paths (minor + index contours).
// Runs once per layout (after fonts load, and on resize); ~3–8 ms on a laptop.

export type Rect = { x: number; y: number; w: number; h: number; r?: number };
export type Pt = [number, number];

export type TopoInput = {
  W: number;
  H: number;
  /** grid step in px */
  step: number;
  /** landform: the union of these (rounded) boxes and polygons is the plateau */
  rects: Rect[];
  polys?: Pt[][];
  /** smooth-union radius (px): rounds the inner steps of the terraces */
  blend?: number;
  /** first contour this far from the landform (px) */
  first?: number;
  /** falloff length (px): contour spacing widens with distance */
  falloff?: number;
  /** terrain: fBm amplitude in contour levels far from the landform, and near it (the wobble) */
  amp?: number;
  wobble?: number;
  /** terrain wavelength (px) */
  scale?: number;
  seed?: number;
  /** every n-th level is an index contour */
  major?: number;
  /** levels to draw: from -1 down to -levels */
  levels?: number;
  /** a regional tilt (levels across the width), so the far terrain is not symmetric */
  tilt?: [number, number];
  /** extra bumps: hills (+) and hollows (-) in levels at x, y with radius r */
  bumps?: { x: number; y: number; r: number; h: number }[];
  /** no landform: pure terrain (the night map) */
  terrainOnly?: boolean;
};

export type TopoOut = { minor: string; major: string; field: (x: number, y: number) => number };

// ── noise ─────────────────────────────────────────────────────────────────────────────

function hash(ix: number, iy: number, seed: number) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h & 0xffff) / 0xffff;
}
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
function vnoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1;
}
function fbm(x: number, y: number, seed: number) {
  // rotate each octave so the grid never shows
  let s = 0;
  let a = 0.62;
  let f = 1;
  for (let o = 0; o < 3; o++) {
    const c = Math.cos(o * 1.1);
    const sn = Math.sin(o * 1.1);
    s += a * vnoise((x * c - y * sn) * f + o * 17.3, (x * sn + y * c) * f - o * 9.1, seed + o * 101);
    f *= 2.07;
    a *= 0.48;
  }
  return s;
}

// ── distance ──────────────────────────────────────────────────────────────────────────

function sdRect(px: number, py: number, r: Rect) {
  const rr = Math.min(r.r ?? 10, r.w / 2, r.h / 2);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const qx = Math.abs(px - cx) - (r.w / 2 - rr);
  const qy = Math.abs(py - cy) - (r.h / 2 - rr);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
}
function sdPoly(px: number, py: number, v: Pt[]) {
  let d = Infinity;
  let s = 1;
  for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
    const [ax, ay] = v[i];
    const [bx, by] = v[j];
    const ex = bx - ax;
    const ey = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
    const c1 = py >= ay;
    const c2 = py < by;
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * d;
}
function smin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── the field ─────────────────────────────────────────────────────────────────────────

export function makeField(o: TopoInput) {
  const first = o.first ?? 18;
  const L = o.falloff ?? 110;
  // −A(1 − e^(−first/L)) = −1: the first contour sits `first` px off the landform
  const A = 1 / (1 - Math.exp(-first / L));
  const amp = o.amp ?? 2.4;
  const wob = o.wobble ?? 0.22;
  const sc = 1 / (o.scale ?? 300);
  const seed = o.seed ?? 7;
  const blend = o.blend ?? 26;
  const tilt = o.tilt ?? [0, 0];
  const bumps = o.bumps ?? [];
  return (x: number, y: number) => {
    let e: number;
    let near = 1;
    if (o.terrainOnly) {
      e = -3.5;
    } else {
      let d = Infinity;
      for (const r of o.rects) d = smin(d, sdRect(x, y, r), blend);
      for (const p of o.polys ?? []) d = smin(d, sdPoly(x, y, p), blend);
      e = d <= 0 ? 0 : -A * (1 - Math.exp(-d / L));
      near = smooth(26, 300, d);
    }
    const n = fbm(x * sc, y * sc, seed);
    e += n * (wob + (amp - wob) * near);
    e += ((x / o.W - 0.5) * tilt[0] + (y / o.H - 0.5) * tilt[1]) * near;
    for (const b of bumps) {
      const q = ((x - b.x) ** 2 + (y - b.y) ** 2) / (b.r * b.r);
      e += b.h * Math.exp(-q) * near;
    }
    return e;
  };
}

// ── marching squares ──────────────────────────────────────────────────────────────────

export function contours(o: TopoInput): TopoOut {
  const f = makeField(o);
  const s = o.step;
  // one cell of margin past every edge, so lines run off the page instead of ending at it
  const nx = Math.ceil(o.W / s) + 3;
  const ny = Math.ceil(o.H / s) + 3;
  const x0 = -s;
  const y0 = -s;
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = f(x0 + i * s, y0 + j * s);

  const levels = o.levels ?? 14;
  const major = o.major ?? 4;
  let minor = "";
  let maj = "";
  for (let k = 1; k <= levels; k++) {
    const lv = -k;
    const lines = trace(v, nx, ny, lv, x0, y0, s);
    let d = "";
    for (const pl of lines) {
      const simp = rdp(pl.pts, 0.45);
      if (simp.length < 3 && !pl.closed) continue;
      if (pl.closed && length(simp) < s * 7) continue; // specks
      d += curve(simp, pl.closed);
    }
    if (k % major === 0) maj += d;
    else minor += d;
  }
  return { minor, major: maj, field: f };
}

type Poly = { pts: Pt[]; closed: boolean };

function trace(v: Float32Array, nx: number, ny: number, lv: number, x0: number, y0: number, s: number): Poly[] {
  // edge ids: horizontal edge (i,j)→(i+1,j) = 2*(j*nx+i); vertical (i,j)→(i,j+1) = 2*(j*nx+i)+1
  const pos = new Map<number, Pt>();
  const adj = new Map<number, number[]>();
  const at = (i: number, j: number) => v[j * nx + i];
  const cross = (e: number): Pt => {
    let p = pos.get(e);
    if (p) return p;
    const base = e >> 1;
    const i = base % nx;
    const j = (base / nx) | 0;
    const a = at(i, j);
    let b: number;
    let x: number;
    let y: number;
    if ((e & 1) === 0) {
      b = at(i + 1, j);
      const t = (lv - a) / (b - a);
      x = x0 + (i + t) * s;
      y = y0 + j * s;
    } else {
      b = at(i, j + 1);
      const t = (lv - a) / (b - a);
      x = x0 + i * s;
      y = y0 + (j + t) * s;
    }
    p = [x, y];
    pos.set(e, p);
    return p;
  };
  const link = (a: number, b: number) => {
    cross(a);
    cross(b);
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = at(i, j) > lv ? 1 : 0;
      const tr = at(i + 1, j) > lv ? 1 : 0;
      const br = at(i + 1, j + 1) > lv ? 1 : 0;
      const bl = at(i, j + 1) > lv ? 1 : 0;
      const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (c === 0 || c === 15) continue;
      const T = 2 * (j * nx + i);
      const B = 2 * ((j + 1) * nx + i);
      const Lf = 2 * (j * nx + i) + 1;
      const R = 2 * (j * nx + i + 1) + 1;
      switch (c) {
        case 1: case 14: link(Lf, B); break;
        case 2: case 13: link(B, R); break;
        case 3: case 12: link(Lf, R); break;
        case 4: case 11: link(T, R); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(Lf, T); break;
        case 5: case 10: {
          const mid = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 > lv ? 1 : 0;
          if ((c === 5) === (mid === 1)) {
            link(Lf, T);
            link(B, R);
          } else {
            link(Lf, B);
            link(T, R);
          }
          break;
        }
      }
    }
  }
  const seen = new Set<number>();
  const out: Poly[] = [];
  const walk = (start: number) => {
    const pts: Pt[] = [pos.get(start)!];
    seen.add(start);
    let prev = -1;
    let cur = start;
    for (;;) {
      const nb = adj.get(cur)!;
      const next = nb.find((n) => n !== prev && !seen.has(n));
      if (next === undefined) {
        const closed = nb.includes(start) && pts.length > 2 && prev !== start;
        return { pts, closed };
      }
      seen.add(next);
      pts.push(pos.get(next)!);
      prev = cur;
      cur = next;
    }
  };
  // open chains first (start from their ends), then loops
  for (const [e, nb] of adj) if (nb.length === 1 && !seen.has(e)) out.push(walk(e));
  for (const e of adj.keys()) if (!seen.has(e)) out.push(walk(e));
  return out;
}

// ── shaping ───────────────────────────────────────────────────────────────────────────

function length(p: Pt[]) {
  let l = 0;
  for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return l;
}

function rdp(p: Pt[], eps: number): Pt[] {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const st: [number, number][] = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop()!;
    const [ax, ay] = p[a];
    const [bx, by] = p[b];
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy) || 1;
    let md = 0;
    let mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L;
      if (d > md) {
        md = d;
        mi = i;
      }
    }
    if (md > eps && mi > 0) {
      keep[mi] = 1;
      st.push([a, mi], [mi, b]);
    }
  }
  return p.filter((_, i) => keep[i]);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the points, as cubic Béziers. */
export function curve(p: Pt[], closed: boolean): string {
  const n = p.length;
  if (n < 2) return "";
  const get = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}
