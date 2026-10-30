// Easing tokens from the brief (§4).
export const EASE = {
  outCubic: 'cubic-bezier(.33,1,.68,1)',
  outQuint: 'cubic-bezier(.22,1,.36,1)',
  slide: 'cubic-bezier(.6,0,.3,1)',
  linear: 'linear',
} as const;

// Proof marks are "ruled": a constant pen speed of 1 px per 1.1 ms.
export const RULED_MS_PER_PX = 1.1;
export const ruledMs = (len: number, cap = 640) => Math.min(cap, Math.max(90, len * RULED_MS_PER_PX));
