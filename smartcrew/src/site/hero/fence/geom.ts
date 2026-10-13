// Geometry for the hero's fence, the crew's walks and the springs (no DOM).

export type Pt = [number, number];
export type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * A hand-staked geofence round a box: six stakes (an opening's fence hands over stake to stake,
 * ./opening.ts), pointed ends `point` px out left and right, `clear` px off the box, a
 * little irregular so it reads staked, not drawn by a computer. Order: left point, top-left,
 * top-right, right point, bottom-right, bottom-left.
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
    [x1 - a + 2 * j, y0 - 1 * j],
    [x1 + o.point + 2 * j, ym - 1 * j],
    [x1 - a + 4 * j, y1 + 1 * j],
    [x0 + a - 2 * j, y1 + 1 * j],
  ];
}

export const polyPoints = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
export const polyPath = (p: Pt[]) => `M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

export function inside(p: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
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
      for (let i = this.pts.length ? 1 : 0; i <= 48; i++) this.pts.push(bez(s[0], s[1], s[2], s[3], i / 48));
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
    for (let i = 0; i <= 160; i++) {
      const [x, y] = this.at(i / 160);
      if (inside(p, x, y)) return i / 160;
    }
    return 1;
  }
}

/** Brisk in, settles at the stake. */
export const walkEase = (t: number) => 1 - Math.pow(1 - t, 2.4);
/** Inverse of walkEase (time at which the eased progress reaches u). */
export const walkEaseInv = (u: number) => 1 - Math.pow(1 - u, 1 / 2.4);

/** Transform keyframes for a walk (compositor-only translate), progress eased by walkEase. */
export function walkFrames(w: Walk, n = 24, half = 13): Keyframe[] {
  const out: Keyframe[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = w.at(walkEase(i / n));
    out.push({ transform: `translate(${(x - half).toFixed(1)}px, ${(y - half).toFixed(1)}px)`, offset: i / n });
  }
  return out;
}

/**
 * A damped spring from 0 to 1 (k 170, c 19: a touch of overshoot, the stakes' and the button's
 * spring), sampled once into a table: `SPRING(seconds)`.
 */
export const SPRING = (() => {
  const out: number[] = [];
  let x = 0;
  let v = 0;
  const dt = 1 / 240;
  for (let i = 0; i <= 240 * 1.4; i++) {
    if (i % 4 === 0) out.push(x);
    const a = 170 * (1 - x) - 19 * v;
    v += a * dt;
    x += v * dt;
  }
  return (t: number) => {
    const s = Math.max(0, Math.min(1.4, t)) * 60;
    const i = Math.floor(s);
    const f = s - i;
    return i >= out.length - 1 ? 1 : out[i] + (out[i + 1] - out[i]) * f;
  };
})();

/**
 * WAAPI keyframes that follow SPRING for `sec` seconds of spring time (play them over any
 * duration: a faster move plays the same curve faster). Linear between samples, so no `linear()`
 * easing is needed.
 */
export function springFrames(sec: number, at: (p: number) => Keyframe, n = 14): Keyframe[] {
  const out: Keyframe[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ ...at(i === n ? 1 : SPRING(t * sec)), offset: t });
  }
  return out;
}
