// The four easings (brief 6). No others. Owner: A1.
//   SNAP   physics: damped sine, zeta 0.12, omega 2*pi*9 Hz. The chalk string only.
//   DRAW   cubic-bezier(.65, 0, .35, 1), 500-900 ms. Line pay-out, gridline bubbles, traced lines, A-200 grid.
//   SETTLE cubic-bezier(.16, 1, .3, 1), 600-1200 ms. Camera arrivals, entrances, ink-in, HOLD docking.
//   TICK   steps(4), 120 ms. The strip's SHEET cell only.

export type Bezier = [number, number, number, number];

export const DRAW: Bezier = [0.65, 0, 0.35, 1];
export const SETTLE: Bezier = [0.16, 1, 0.3, 1];

export const CSS_EASE = {
  draw: 'cubic-bezier(.65, 0, .35, 1)',
  settle: 'cubic-bezier(.16, 1, .3, 1)',
  tick: 'steps(4)',
} as const;

/** Durations in ms (brief 6). */
export const DURATION = {
  drawMin: 500,
  drawMax: 900,
  settleMin: 600,
  settleMax: 1200,
  tick: 120,
  stagger: 120,
  inkIn: 400,
  printIn: 200,
  hover: 150,
} as const;

/** Physics constants for SNAP. */
export const SNAP_ZETA = 0.12;
export const SNAP_OMEGA = 2 * Math.PI * 9;

/**
 * SNAP displacement at time t (s) for initial amplitude A: y = A * e^(-zeta*omega*t) * sin(omega*t).
 * (Brief 4.1 writes the release as a damped sine; impact fires at the first zero-crossing, t = pi/omega.)
 */
export function snap(t: number, amplitude = 1, zeta = SNAP_ZETA, omega = SNAP_OMEGA): number {
  if (t <= 0) return 0;
  return amplitude * Math.exp(-zeta * omega * t) * Math.sin(omega * t);
}

/** Time of SNAP's first zero-crossing after release (impact). */
export const SNAP_IMPACT_T = Math.PI / SNAP_OMEGA;

/** Solve a CSS cubic-bezier for x in [0,1] -> y. Newton + bisection, accurate to ~1e-6. */
export function cubicBezier([x1, y1, x2, y2]: Bezier): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (hi - lo > 1e-6) {
      const v = sampleX(t);
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

export const drawEase = cubicBezier(DRAW);
export const settleEase = cubicBezier(SETTLE);

/** TICK: steps(4) (jump-end). */
export function tickEase(x: number, steps = 4): number {
  if (x >= 1) return 1;
  if (x <= 0) return 0;
  return Math.floor(x * steps) / steps;
}

/** Frame-rate-independent damp: x += (target - x) * (1 - e^(-lambda*dt)). Brief 4.1 rig, lambda = 4. */
export function damp(x: number, target: number, lambda: number, dt: number): number {
  return x + (target - x) * (1 - Math.exp(-lambda * dt));
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Map v from [a,b] to [0,1], clamped. Handy for stage beats: segment(p, 0.10, 0.40). */
export function segment(v: number, a: number, b: number): number {
  return b === a ? (v >= b ? 1 : 0) : clamp01((v - a) / (b - a));
}
