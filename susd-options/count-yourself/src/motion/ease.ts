export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInQuad = (t: number) => t * t;
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EASE = {
  outCubic: 'cubic-bezier(.33,1,.68,1)',
  inQuad: 'cubic-bezier(.11,0,.5,0)',
  outQuint: 'cubic-bezier(.22,1,.36,1)',
};
