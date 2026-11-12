// Shared motion setup: GSAP + ScrollTrigger + Lenis smooth scroll (skipped for reduced motion).
import { gsap, reduced } from './gsap-core.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export let lenis = null;

export function initMotion() {
  if (reduced) {
    document.documentElement.classList.add('reduced');
    return null;
  }
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Smooth in-page anchor navigation that respects the fixed nav. */
export function bindAnchors(root = document) {
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    // the pinned process section: go to where the pin starts (its top at 0), not 72px short of it
    const pin = id === '#made' ? ScrollTrigger.getAll().find((t) => t.pin && t.trigger === target) : null;
    if (pin) {
      if (lenis) lenis.scrollTo(pin.start + 1, { duration: 1.4 });
      else window.scrollTo({ top: pin.start + 1, behavior: reduced ? 'auto' : 'smooth' });
    } else if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4 }); // Lenis already honours html scroll-padding-top (--nav-h)
    } else {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
    history.replaceState(null, '', id);
    if (target.tabIndex < 0 && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

export { gsap, reduced, ScrollTrigger, SplitText };
