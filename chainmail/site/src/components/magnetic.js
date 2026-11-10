// Magnetic pull for primary buttons (fine pointers only, off for reduced motion).
import { gsap } from 'gsap';

export function magnetic(root = document, { strength = 0.32, reach = 28 } = {}) {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('[data-magnetic]:not([data-mag-bound])').forEach((el) => {
    el.setAttribute('data-mag-bound', '');
    const inner = el.querySelector('.btn__label') || null;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const ixTo = inner && gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'power3.out' });
    const iyTo = inner && gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'power3.out' });
    let active = false;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const inside = Math.abs(dx) < r.width / 2 + reach && Math.abs(dy) < r.height / 2 + reach;
      if (inside) {
        active = true;
        xTo(dx * strength); yTo(dy * strength);
        if (inner) { ixTo(dx * strength * 0.35); iyTo(dy * strength * 0.35); }
      } else if (active) {
        active = false;
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
  });
}
