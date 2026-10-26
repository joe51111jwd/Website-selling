export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A mouse or trackpad: pieces can be picked up. On touch, a drag is a scroll. */
export const finePointer = () => window.matchMedia("(pointer: fine)").matches;

// The hero's first image can land before the preloader starts listening (it's preloaded), so the
// signal is remembered as well as sent.
let heroReady = false;
export function markHeroReady() {
  heroReady = true;
  window.dispatchEvent(new Event("hero:ready"));
}
export const isHeroReady = () => heroReady;
