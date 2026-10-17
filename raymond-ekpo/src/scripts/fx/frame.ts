// One place that knows about scrolling: Lenis for smooth scroll, a frame scheduler for
// scroll-linked effects, and helpers to turn an element's position into 0..1 progress.
import Lenis from 'lenis';

export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Updater = () => void;
const updaters = new Set<Updater>();
let queued = false;

const run = () => {
  queued = false;
  updaters.forEach((u) => u());
};

export function schedule() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(run);
  }
}

/** Run `u` on every scroll or resize frame (and once now). */
export function onScroll(u: Updater) {
  updaters.add(u);
  u();
}

addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);

/** For a tall section with a sticky stage: 0 when it reaches the top, 1 when its end leaves the bottom. */
export function pinProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const travel = r.height - innerHeight;
  return travel > 0 ? clamp(-r.top / travel) : r.top < 0 ? 1 : 0;
}

/** For anything: 0 as it enters at the bottom of the screen, 1 as it leaves at the top. */
export function passProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return clamp((innerHeight - r.top) / (innerHeight + r.height));
}

export let lenis: Lenis | null = null;

if (!still) {
  lenis = new Lenis({ lerp: 0.11, autoRaf: true, anchors: { offset: -80 } });
  lenis.on('scroll', schedule);
}

/** Scroll to a position, smoothly when allowed. */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else scrollTo({ top: y });
}
