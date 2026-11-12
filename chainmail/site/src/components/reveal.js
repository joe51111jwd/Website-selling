// Scroll reveals:
//  [data-reveal="lines"]  split-line masked rise (headlines)
//  [data-reveal="up"]     fade + rise
//  [data-reveal="wipe"]   clip-path mask wipe (images / panels)
//  [data-reveal="stagger"] children fade-up in sequence
//  [data-parallax="0.12"] scrubbed y drift (renders)
import { gsap, ScrollTrigger, SplitText, reduced } from './motion.js';

export function splitLines(el, { delay = 0, stagger = 0.08, duration = 1.1, trigger = true, start = 'top 88%', aria = 'auto' } = {}) {
  let tween;
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    aria,
    onSplit(self) {
      tween = gsap.from(self.lines, {
        yPercent: 110,
        rotate: 2.5,
        transformOrigin: '0% 100%',
        duration,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: trigger ? { trigger: el, start, once: true } : undefined,
      });
      return tween;
    },
  });
  el.classList.add('is-split');
  return tween;
}

export function initReveals(root = document) {
  // keyboard focus landing inside a not-yet-revealed block shows it at once
  root.addEventListener('focusin', (e) => {
    const r = e.target.closest?.('[data-reveal="up"], [data-reveal="stagger"]');
    if (!r) return;
    gsap.to(r.dataset.reveal === 'stagger' ? r.children : r, { opacity: 1, y: 0, duration: 0.3, overwrite: true });
  });
  if (reduced) {
    root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }
  root.querySelectorAll('[data-reveal="lines"]').forEach((el) => splitLines(el, { delay: Number(el.dataset.delay || 0) }));

  root.querySelectorAll('[data-reveal="up"]').forEach((el) => {
    // opacity, not autoAlpha: a visibility:hidden pre-state would make links/buttons inside unreachable by Tab
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: Number(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  root.querySelectorAll('[data-reveal="wipe"]').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: Number(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  root.querySelectorAll('[data-reveal="stagger"]').forEach((el) => {
    gsap.fromTo(el.children, { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax || 0.1);
    gsap.fromTo(el, { yPercent: amt * 100 }, {
      yPercent: -amt * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

export { ScrollTrigger };
