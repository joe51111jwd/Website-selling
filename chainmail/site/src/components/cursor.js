// A restrained custom cursor: only a "drag" chip over the work rail (fine pointers, motion allowed).
import { gsap } from 'gsap';

export function initCursor() {
  const c = document.querySelector('[data-cursor]');
  if (!c || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.querySelectorAll('[data-rail-viewport]').forEach((zone) => {
    zone.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { gsap.set(c, { x: e.clientX, y: e.clientY }); c.classList.add('is-on'); } });
    zone.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    zone.addEventListener('pointerdown', () => c.classList.add('is-down'));
    window.addEventListener('pointerup', () => c.classList.remove('is-down'));
  });
}
