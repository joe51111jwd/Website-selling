// Easing tokens from the brief (cubic-bezier solved numerically) plus helpers.
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
}
export type Ease = (t: number) => number;
export const easeOutCubic: Ease = bezier(0.33, 1, 0.68, 1);
export const easeOutQuint: Ease = bezier(0.22, 1, 0.36, 1);
export const easeInCubic: Ease = bezier(0.32, 0, 0.67, 0);
export const easeInOutCubic: Ease = bezier(0.65, 0, 0.35, 1);
export const linear: Ease = (t) => t;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of v through [a, b] */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
