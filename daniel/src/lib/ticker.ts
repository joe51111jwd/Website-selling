import Lenis from "lenis";

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

/** Smooth scroll for the whole page. It honours prefers-reduced-motion on its own. */
export const lenis = new Lenis({ lerp: 0.09, autoRaf: false, stopInertiaOnNavigate: true });

if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;

/** Scroll speed in px per frame, eased so effects driven by it don't twitch. */
export const scroll = { velocity: 0 };

type Tick = (time: number, delta: number) => void;
const ticks = new Set<Tick>();

/** Run something every frame, after the scroll position has updated. */
export function onTick(fn: Tick) {
  ticks.add(fn);
  return () => {
    ticks.delete(fn);
  };
}

let last = performance.now();
function frame(time: number) {
  const delta = Math.min(time - last, 64);
  last = time;
  lenis.raf(time);
  scroll.velocity += (lenis.velocity - scroll.velocity) * 0.14;
  if (Math.abs(scroll.velocity) < 0.01) scroll.velocity = 0;
  ticks.forEach((fn) => fn(time, delta));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/** Jump to the top without smoothing, e.g. behind a page transition. */
export function resetScroll() {
  lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutExpo = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

/** The house curve, for motion's `ease`. */
export const ease = [0.22, 1, 0.36, 1] as const;
export const easeCurtain = [0.76, 0, 0.24, 1] as const;
