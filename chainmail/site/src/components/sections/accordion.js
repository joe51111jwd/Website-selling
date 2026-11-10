// FAQ accordion: buttons with aria-expanded controlling region panels; animated height.
import { gsap, reduced } from '../motion.js';

export function initAccordion(root = document) {
  root.querySelectorAll('[data-accordion]').forEach((acc) => {
    acc.addEventListener('click', (e) => {
      const btn = e.target.closest('.acc__btn');
      if (!btn) return;
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.acc').classList.toggle('is-open', open);
      if (reduced) { panel.hidden = !open; return; }
      if (open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'expo.out' });
        gsap.fromTo(panel.firstElementChild, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', delay: 0.05 });
      } else {
        gsap.to(panel, { height: 0, duration: 0.45, ease: 'expo.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height' }); } });
      }
    });
  });
}
