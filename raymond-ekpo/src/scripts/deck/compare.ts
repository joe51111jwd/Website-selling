// Before and after, divided by a rod of glass you drag across the slide. The rod bends both
// versions where they meet. A hidden range input carries the position for keyboards and screen
// readers. When its slide comes up, the rod sweeps in once to show it can be moved.
import { rodLens } from './lens';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function compares() {
  document.querySelectorAll<HTMLElement>('[data-rodcompare]').forEach((cmp) => {
    const frame = cmp.querySelector<HTMLElement>('.rc-frame')!;
    const range = cmp.querySelector<HTMLInputElement>('.rc-range')!;
    const rod = cmp.querySelector<HTMLElement>('.rc-rod')!;
    let pos = Number(range.value);
    let raf = 0;

    const set = (v: number) => {
      pos = Math.min(100, Math.max(0, v));
      range.value = String(Math.round(pos));
      cmp.style.setProperty('--pos', `${pos}%`);
      cmp.classList.toggle('is-after', pos < 50);
    };
    const fromX = (x: number) => {
      const r = frame.getBoundingClientRect();
      set(((x - r.left) / r.width) * 100);
    };

    let dragging = false;
    frame.addEventListener('pointerdown', (e) => {
      dragging = true;
      cancelAnimationFrame(raf);
      frame.setPointerCapture(e.pointerId);
      cmp.classList.add('is-dragging');
      fromX(e.clientX);
    });
    frame.addEventListener('pointermove', (e) => dragging && fromX(e.clientX));
    const up = () => {
      dragging = false;
      cmp.classList.remove('is-dragging');
    };
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);
    range.addEventListener('input', () => set(Number(range.value)));

    const lens = () => rodLens(rod);
    new ResizeObserver(lens).observe(rod);

    // the first time its slide comes up, sweep the rod in from the right
    const slide = cmp.closest('.d-slide');
    let shown = false;
    slide?.addEventListener('slideenter', () => {
      lens();
      if (shown || still) return;
      shown = true;
      const t0 = performance.now();
      const from = 88;
      const to = Number(range.value);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0 - 450) / 1100);
        if (t > 0) set(from + (to - from) * (1 - Math.pow(1 - t, 3)));
        else set(from);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    set(pos);
  });
}
