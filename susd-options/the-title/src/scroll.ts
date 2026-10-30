// Smooth scrolling: Lenis on desktop only (syncTouch off), driven by the shared rAF loop.
import Lenis from 'lenis';
import { subscribe, wake } from './motion/loop';
import { prefersReduced, isNarrow } from './hooks/useReducedMotion';

let lenis: Lenis | null = null;

export function initScroll() {
  if (prefersReduced() || isNarrow() || window.matchMedia('(hover: none)').matches) return;
  lenis = new Lenis({ syncTouch: false, lerp: 0.1, wheelMultiplier: 1 });
  const kick = () => wake(4);
  ['wheel', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
  subscribe((now) => {
    if (!lenis) return false;
    lenis.raf(now);
    return Boolean(lenis.isScrolling);
  });
  lenis.on('scroll', () => wake(4));
}

export function goTo(target: string | HTMLElement, opts: { instant?: boolean } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const instant = opts.instant || prefersReduced();
  if (lenis) {
    lenis.scrollTo(el, { immediate: instant, duration: 1.4, force: true });
    wake(10);
  } else {
    el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
  }
  if (typeof target === 'string' && target.startsWith('#')) {
    try {
      history.replaceState(null, '', target);
    } catch {
      /* ignore */
    }
  }
}

function scrollToY(y: number) {
  const top = Math.max(0, Math.round(y));
  const instant = prefersReduced();
  if (lenis) {
    lenis.scrollTo(top, { immediate: instant, duration: 1.4, force: true });
    wake(10);
  } else {
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
  }
}

/**
 * Every "Get the Bootloader" and "The book" link lands on its own path (brief S4.5).
 * The file: the email field must be on screen, with as much of the file above it as fits.
 * The book: the top of the paths on desktop (side by side); on phone and tablet, the cover (after the file).
 */
export function goToPath(which: 'file' | 'book') {
  const sec = document.getElementById('paths');
  if (!sec) return;
  const sy = window.scrollY;
  const vh = window.innerHeight;
  const secTop = sec.getBoundingClientRect().top + sy;
  let y = secTop;
  // phone and tablet: the book comes after the file, so land on the cover itself
  if (which === 'book' && window.innerWidth <= 1040) {
    const cover = document.querySelector<HTMLElement>('.path-obj--book');
    if (cover) y = cover.getBoundingClientRect().top + sy - (isNarrow() ? 32 : 72);
  }
  if (which === 'file') {
    const form = document.querySelector<HTMLElement>('.get-form');
    const block = document.querySelector<HTMLElement>(isNarrow() || window.innerWidth <= 1040 ? '.path-obj--file' : '#paths');
    if (form) {
      const formBottom = form.getBoundingClientRect().bottom + sy + 56; // room for the error line and the link
      const blockTop = (block ? block.getBoundingClientRect().top + sy : secTop) - (block?.id === 'paths' ? 0 : 24);
      y = Math.max(formBottom - vh, blockTop);
    }
    // put the caret in the field on desktop (on touch screens that would throw up the keyboard)
    const fine = window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches;
    if (fine) {
      document.querySelector<HTMLInputElement>('#email')?.focus({ preventScroll: true });
    }
  }
  scrollToY(y);
  try {
    history.replaceState(null, '', '#paths');
  } catch {
    /* ignore */
  }
}

export function scrollToInstant(el: HTMLElement) {
  const y = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, y);
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(y, { immediate: true, force: true });
  }
}
