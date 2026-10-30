// The pointer-driven light (brief §4.2). --lx and --ly lie in [-1, 1] and follow the pointer
// relative to the viewport centre, lerped at 0.08 per frame. On touch devices they drift on a
// slow Lissajous (period 14 s, amplitude 0.35) while a lit element is on screen.
import { subscribe, wake } from '../motion/loop';
import { prefersReduced } from './useReducedMotion';

const els = new Set<HTMLElement>();
const visible = new Set<HTMLElement>();
let lx = -0.35, ly = -0.55, tx = -0.35, ty = -0.55;
let started = false;
let io: IntersectionObserver | null = null;
const touchOnly = () => window.matchMedia('(hover: none)').matches;
export const pointerListeners = new Set<() => void>();

function write() {
  (visible.size ? visible : els).forEach((el) => {
    el.style.setProperty('--lx', lx.toFixed(4));
    el.style.setProperty('--ly', ly.toFixed(4));
  });
}

function start() {
  if (started) return;
  started = true;
  io = new IntersectionObserver((es) =>
    es.forEach((e) => {
      const el = e.target as HTMLElement;
      if (e.isIntersecting) {
        visible.add(el);
        el.style.setProperty('--lx', lx.toFixed(4));
        el.style.setProperty('--ly', ly.toFixed(4));
      } else visible.delete(el);
    }),
  );
  els.forEach((el) => io!.observe(el));
  if (prefersReduced()) {
    write();
    return;
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      pointerListeners.forEach((f) => f());
      wake();
    },
    { passive: true },
  );
  const drift = touchOnly();
  let frameN = 0;
  subscribe((now) => {
    if (drift && visible.size) {
      const t = (now / 14000) * Math.PI * 2;
      tx = -0.2 + 0.35 * Math.sin(t);
      ty = -0.3 + 0.35 * Math.sin(2 * t + 0.6);
    }
    const dx = tx - lx, dy = ty - ly;
    if (Math.abs(dx) < 0.0015 && Math.abs(dy) < 0.0015) return drift && visible.size > 0;
    lx += dx * 0.08;
    ly += dy * 0.08;
    // touch drift is slow and sub-pixel: ~15 updates a second is plenty
    if (!drift || (frameN++ & 3) === 0) write();
    return true;
  });
  write();
}

export function registerLight(el: HTMLElement) {
  els.add(el);
  el.style.setProperty('--lx', lx.toFixed(4));
  el.style.setProperty('--ly', ly.toFixed(4));
  io?.observe(el);
  start();
  return () => {
    els.delete(el);
    visible.delete(el);
    io?.unobserve(el);
  };
}
