// Geometry helpers shared by the drafting marks (brief 5.5). Owner: A3.
// Pure functions, no DOM: safe in the prerender and in node scripts.

export type Pt = readonly [number, number];

/** Deterministic PRNG (mulberry32) so speckles and scallops render identically on server and client. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round to 2 decimals for compact, stable path strings. */
export const r2 = (v: number) => Math.round(v * 100) / 100;

/** Polar to cartesian; angle in degrees clockwise from straight up (drafting bearing). */
export function bearing(cx: number, cy: number, radius: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + radius * Math.sin(a), cy - radius * Math.cos(a)];
}

/**
 * Vertices around a w x h rectangle, clockwise from the top-left corner, with every corner a vertex.
 * Segments are shared out per side in proportion to its length (each side gets at least one), so a
 * scalloped cloud and its straight "rect as cubics" twin have the same command structure.
 */
export function rectVertices(w: number, h: number, segments: number, x = 0, y = 0): Pt[] {
  const n = Math.max(4, Math.round(segments));
  const per = 2 * (w + h);
  const raw = [w, h, w, h].map((s) => (s / per) * n);
  const counts = raw.map((v) => Math.max(1, Math.floor(v)));
  let left = n - counts.reduce((a, b) => a + b, 0);
  // hand the remainder to the sides with the largest fractional parts
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k = (k + 1) % 4, left--) counts[order[k]![1]]! += 1;
  for (let k = 0; left < 0; k = (k + 1) % 4) {
    const i = order[3 - k]![1];
    if (counts[i]! > 1) {
      counts[i]! -= 1;
      left++;
    }
  }
  const corners: Pt[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const pts: Pt[] = [];
  for (let s = 0; s < 4; s++) {
    const a = corners[s]!;
    const b = corners[(s + 1) % 4]!;
    const c = counts[s]!;
    for (let i = 0; i < c; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / c, a[1] + ((b[1] - a[1]) * i) / c]);
  }
  return pts;
}

/** A closed path of exactly `segments` straight cubic segments around the rectangle (morph source). */
export function rectCubicPath(w: number, h: number, segments = 24, x = 0, y = 0): string {
  const p = rectVertices(w, h, segments, x, y);
  let d = `M${r2(p[0]![0])} ${r2(p[0]![1])}`;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    const c1 = [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3];
    const c2 = [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3];
    d += `C${r2(c1[0]!)} ${r2(c1[1]!)} ${r2(c2[0]!)} ${r2(c2[1]!)} ${r2(b[0])} ${r2(b[1])}`;
  }
  return `${d}Z`;
}

/**
 * Scalloped HOLD cloud: the same vertices as rectCubicPath, each segment bulged outward into one
 * scallop (one cubic). `bulge` is the scallop height as a fraction of its chord. `jitter` (0..1)
 * varies the scallops a little, deterministically from `seed`, so the cloud reads hand-drawn.
 */
export function cloudPath(
  w: number,
  h: number,
  segments = 24,
  opts: { bulge?: number; jitter?: number; seed?: number; x?: number; y?: number } = {},
): string {
  const { bulge = 0.42, jitter = 0.18, seed = 7, x = 0, y = 0 } = opts;
  const rnd = prng(seed);
  const p = rectVertices(w, h, segments, x, y);
  const cx = x + w / 2;
  const cy = y + h / 2;
  let d = `M${r2(p[0]![0])} ${r2(p[0]![1])}`;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    let nx = dy / len;
    let ny = -dx / len;
    // point the normal away from the centre
    const mx = (a[0] + b[0]) / 2 - cx;
    const my = (a[1] + b[1]) / 2 - cy;
    if (nx * mx + ny * my < 0) {
      nx = -nx;
      ny = -ny;
    }
    const k = len * bulge * (1 + (rnd() - 0.5) * 2 * jitter);
    const t = 0.08 * len;
    const c1 = [a[0] + nx * k - (dx / len) * t, a[1] + ny * k - (dy / len) * t];
    const c2 = [b[0] + nx * k + (dx / len) * t, b[1] + ny * k + (dy / len) * t];
    d += `C${r2(c1[0]!)} ${r2(c1[1]!)} ${r2(c2[0]!)} ${r2(c2[1]!)} ${r2(b[0])} ${r2(b[1])}`;
  }
  return `${d}Z`;
}

/** SVG arc path between two bearings (degrees clockwise from up) on a circle. */
export function arcPath(cx: number, cy: number, radius: number, fromDeg: number, toDeg: number): string {
  const [x0, y0] = bearing(cx, cy, radius, fromDeg);
  const [x1, y1] = bearing(cx, cy, radius, toDeg);
  const sweep = toDeg >= fromDeg ? 1 : 0;
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M${r2(x0)} ${r2(y0)}A${r2(radius)} ${r2(radius)} 0 ${large} ${sweep} ${r2(x1)} ${r2(y1)}`;
}

/**
 * The filled pointer of a view marker or section-cut end: the region between a circle (centre c,
 * radius r) and the two tangents from an apex `d` away along `deg`.
 */
export function pointerPath(cx: number, cy: number, r: number, d: number, deg: number): string {
  const apex = bearing(cx, cy, d, deg);
  const half = (Math.acos(r / d) * 180) / Math.PI;
  const t1 = bearing(cx, cy, r, deg - half);
  const t2 = bearing(cx, cy, r, deg + half);
  return `M${r2(t1[0])} ${r2(t1[1])}L${r2(apex[0])} ${r2(apex[1])}L${r2(t2[0])} ${r2(t2[1])}A${r2(r)} ${r2(r)} 0 0 0 ${r2(t1[0])} ${r2(t1[1])}Z`;
}
