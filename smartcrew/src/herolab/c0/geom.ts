// Geometry for the fence, the walkers and the rings.

import type { Pt } from "./topo";

export type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * A hand-staked geofence round a box: six stakes, pointed ends `point` px out left and right,
 * `clear` px off the box, a little irregular (seeded) so it reads staked, not drawn by a computer.
 */
export function hexFence(b: Box, o: { clear: [number, number]; point: number; inset?: number; jitter?: number }): Pt[] {
  const [cx, cy] = o.clear;
  const x0 = b.x0 - cx;
  const x1 = b.x1 + cx;
  const y0 = b.y0 - cy;
  const y1 = b.y1 + cy;
  const ym = (y0 + y1) / 2;
  const a = o.inset ?? 8;
  const j = o.jitter ?? 1;
  return [
    [x0 - o.point, ym + 2 * j],
    [x0 + a - 3 * j, y0 + 1 * j],
    [x1 - a + 2 * j, y0 - 2 * j],
    [x1 + o.point + 2 * j, ym - 1 * j],
    [x1 - a + 5 * j, y1 + 1 * j],
    [x0 + a - 2 * j, y1 + 2 * j],
  ];
}

export const polyPoints = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
export const polyPath = (p: Pt[]) => `M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

export function perimeter(p: Pt[]) {
  let l = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    l += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return l;
}

export function inside(p: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export function bbox(p: Pt[]): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of p) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Point on a cubic Bézier. */
function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** A walk: a chain of cubic segments, sampled by arc length. */
export class Walk {
  private pts: Pt[] = [];
  private acc: number[] = [];
  constructor(segs: [Pt, Pt, Pt, Pt][]) {
    for (const s of segs) {
      for (let i = this.pts.length ? 1 : 0; i <= 64; i++) this.pts.push(bez(s[0], s[1], s[2], s[3], i / 64));
    }
    let l = 0;
    this.acc.push(0);
    for (let i = 1; i < this.pts.length; i++) {
      l += Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1]);
      this.acc.push(l);
    }
  }
  get length() {
    return this.acc[this.acc.length - 1];
  }
  /** point at arc-length fraction u ∈ [0, 1] */
  at(u: number): Pt {
    const L = this.length * Math.max(0, Math.min(1, u));
    let lo = 0;
    let hi = this.acc.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (this.acc[m] < L) lo = m;
      else hi = m;
    }
    const t = (L - this.acc[lo]) / (this.acc[hi] - this.acc[lo] || 1);
    const a = this.pts[lo];
    const b = this.pts[hi];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  /** fraction (by arc length) where the walk first enters polygon `p` */
  entry(p: Pt[]) {
    for (let i = 0; i <= 200; i++) {
      const [x, y] = this.at(i / 200);
      if (inside(p, x, y)) return i / 200;
    }
    return 1;
  }
}

/** easeOutCubic-ish walk: brisk in, settles at the stake */
export const walkEase = (t: number) => 1 - Math.pow(1 - t, 2.4);
/** Inverse of walkEase (time at which the eased progress reaches u). */
export const walkEaseInv = (u: number) => 1 - Math.pow(1 - u, 1 / 2.4);

/** Transform keyframes for a walk (compositor-only translate), progress eased by walkEase. */
export function walkFrames(w: Walk, n = 28, half = 13): Keyframe[] {
  const out: Keyframe[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = w.at(walkEase(i / n));
    out.push({ transform: `translate(${(x - half).toFixed(1)}px, ${(y - half).toFixed(1)}px)`, offset: i / n });
  }
  return out;
}

/** Damped spring step (semi-implicit Euler), for the fence's stakes. */
export function springTo(x: number, v: number, target: number, dt: number, k = 170, c = 20): [number, number] {
  const a = k * (target - x) - c * v;
  v += a * dt;
  x += v * dt;
  return [x, v];
}
