// Shared motion setup: GSAP + ScrollTrigger + Lenis smooth scroll (skipped for reduced motion).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const offset = id === '#top' || id === '#main' ? 0 : -8;
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
    if (target.tabIndex < 0 && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

export { gsap, ScrollTrigger, SplitText };
