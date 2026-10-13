// Herolab c1 · offsetting a road's centreline into its two edge hairlines (no paper-coloured
// knock-out stroke, which would show as a white band while the ground is still warming).

import type { Pt } from "./geometry";

/** Sample an absolute M/L/C path (the intro's road) into points. */
export function samplePath(d: string, perCubic = 20): Pt[] {
  const tok = d.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cmd = "M";
  let cur: Pt = [0, 0];
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[MLC]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "M" || cmd === "L") {
      cur = [num(), num()];
      out.push(cur);
    } else if (cmd === "C") {
      const p1: Pt = [num(), num()];
      const p2: Pt = [num(), num()];
      const p3: Pt = [num(), num()];
      const p0 = cur;
      for (let k = 1; k <= perCubic; k++) {
        const t = k / perCubic;
        const a = (1 - t) ** 3;
        const b = 3 * (1 - t) ** 2 * t;
        const c = 3 * (1 - t) * t * t;
        const e = t ** 3;
        out.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
      }
      cur = p3;
    }
  }
  return out;
}

/** Catmull-Rom through a few control points, for the hand-drawn county road and creek. */
export function smooth(pts: Pt[], per = 10): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    for (let k = 1; k <= per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/** The polyline offset sideways by `o` (px), with averaged normals at the joints. */
export function offset(pts: Pt[], o: number): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * o, p[1] + (dx / l) * o] as Pt;
  });
}

export const toPoints = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
