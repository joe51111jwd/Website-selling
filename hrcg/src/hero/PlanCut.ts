// Plan cut and pull-out (brief 3.3 P 0.10-0.75, H8). Owner: A2. Pure math, no DOM.
//
// PLAN CUT: plan-b44-260 (the 1:1 PLAN 05 still at 2.60 s) is placed with a similarity transform so
// b44's freshly snapped line lies exactly on the visitor's deposit (both endpoints, so length,
// angle and position all register). PULL-OUT: the same still FLIPs down into ArenaPlan's bay-05 box
// (getBayRect(5)); the deposits ride along in the same transform, so they stay on b44's line.

import type { Vec } from './ChalkString';

/** The plan element is a BASE x BASE px square; transforms map its px to stage px. */
export const BASE = 1000;

/**
 * b44's fresh line in the plan frame (normalised 0..1, x right, y down), as measured on the delivered
 * plan-b44-260 mock (a2 measure, 2026-10-08). Superseded by the manifest's plan-b44-260.lineEndpoints
 * or lines-b44.json `fresh` once D5 lands (non-mock); see resolveFreshLine().
 */
export const FRESH_FALLBACK: [[number, number], [number, number]] = [
  [0.392, 0.5215],
  [0.735, 0.524],
];

export interface Similarity {
  /** scale, rotation (rad), and the stage position of the plan's centre */
  s: number;
  theta: number;
  cx: number;
  cy: number;
}

/** Similarity that maps plan-normalised fa -> L and fb -> R. */
export function registerLine(fa: [number, number], fb: [number, number], L: Vec, R: Vec): Similarity {
  const vfx = (fb[0] - fa[0]) * BASE;
  const vfy = (fb[1] - fa[1]) * BASE;
  const vdx = R.x - L.x;
  const vdy = R.y - L.y;
  const s = Math.hypot(vdx, vdy) / (Math.hypot(vfx, vfy) || 1);
  const theta = Math.atan2(vdy, vdx) - Math.atan2(vfy, vfx);
  // centre: L + s*Rot(theta)*(centre - fa)
  const ox = (0.5 - fa[0]) * BASE;
  const oy = (0.5 - fa[1]) * BASE;
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  return { s, theta, cx: L.x + s * (c * ox - sn * oy), cy: L.y + s * (sn * ox + c * oy) };
}

/** Similarity that places the plan square exactly on a box (no rotation). */
export function onBox(r: { left: number; top: number; width: number; height: number }): Similarity {
  return { s: r.width / BASE, theta: 0, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

/** Interpolate: centre linear, scale logarithmic (constant perceived speed), rotation linear. */
export function mix(a: Similarity, b: Similarity, e: number): Similarity {
  return {
    s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e),
    theta: a.theta + (b.theta - a.theta) * e,
    cx: a.cx + (b.cx - a.cx) * e,
    cy: a.cy + (b.cy - a.cy) * e,
  };
}

/** CSS matrix() for the BASE square (transform-origin 0 0). */
export function cssMatrix(m: Similarity): string {
  const c = Math.cos(m.theta) * m.s;
  const sn = Math.sin(m.theta) * m.s;
  // x' = c*X - sn*Y + e ; y' = sn*X + c*Y + f, with the square's centre at (cx, cy)
  const e = m.cx - (c * BASE) / 2 + (sn * BASE) / 2;
  const f = m.cy - (sn * BASE) / 2 - (c * BASE) / 2;
  return `matrix(${c.toFixed(6)}, ${sn.toFixed(6)}, ${(-sn).toFixed(6)}, ${c.toFixed(6)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;
}

/** The transform that carries stage px along with the plan: m ∘ m0^-1 (identity when m == m0). */
export function relative(m: Similarity, m0: Similarity): string {
  const k = m.s / m0.s;
  const t = m.theta - m0.theta;
  const c = Math.cos(t) * k;
  const sn = Math.sin(t) * k;
  // p' = m.c + R(t)k (p - m0.c)
  const e = m.cx - (c * m0.cx - sn * m0.cy);
  const f = m.cy - (sn * m0.cx + c * m0.cy);
  return `matrix(${c.toFixed(6)}, ${sn.toFixed(6)}, ${(-sn).toFixed(6)}, ${c.toFixed(6)}, ${e.toFixed(2)}, ${f.toFixed(2)})`;
}

/** Map a plan-normalised point through a similarity (for QA: where does b44's line land?). */
export function apply(m: Similarity, u: number, v: number): Vec {
  const X = (u - 0.5) * BASE;
  const Y = (v - 0.5) * BASE;
  const c = Math.cos(m.theta) * m.s;
  const sn = Math.sin(m.theta) * m.s;
  return { x: m.cx + c * X - sn * Y, y: m.cy + sn * X + c * Y };
}

/**
 * Bay-05 placeholder rect while A3's ArenaPlan is not mounted: one row of five, b = content / 5.4,
 * gap 0.1 b (brief 3.3), on the content column, below the sheet tag and bubbles.
 */
export function placeholderBay(n: number, vw: number, vh: number, margin: number, top: number): DOMRect {
  const content = Math.min(vw - 2 * margin, 1680);
  const left0 = (vw - content) / 2;
  const b = content / 5.4;
  const gap = 0.1 * b;
  const x = left0 + (n - 1) * (b + gap);
  const y = Math.min(top, vh - b - 120);
  return new DOMRect(x, y, b, b);
}
