import Lenis from "lenis";

export const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smooth scroll. The WebGL loop drives it (see World), so the page and the 3D line move
// on the same frame and never drift apart.
export const lenis = new Lenis({
  autoRaf: false,
  lerp: reducedMotion ? 1 : 0.11,
  smoothWheel: !reducedMotion,
});

// When the WebGL loop is paused (inspector open) or missing, keep Lenis ticking on its own.
let fallback = 0;
let lastDriven = 0;
export const markDriven = () => (lastDriven = performance.now());
function tick(t: number) {
  if (t - lastDriven > 80) lenis.raf(t);
  fallback = requestAnimationFrame(tick);
}
fallback = requestAnimationFrame(tick);
export const stopFallback = () => cancelAnimationFrame(fallback);

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) lenis.scrollTo(el, { offset: -20, duration: reducedMotion ? 0 : 1.6 });
}
