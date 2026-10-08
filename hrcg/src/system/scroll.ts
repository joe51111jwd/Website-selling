// One passive scroll + resize dispatcher shared by every stage (brief 8.3: no scroll listeners
// that read layout; no React state per frame). Lenis drives window scroll natively, so native
// scroll events fire with or without Lenis. Owner: A1.

import { isBrowser } from './store';

type Fn = () => void;
const scrollFns = new Set<Fn>();
const resizeFns = new Set<Fn>();
let bound = false;

function bind() {
  if (bound || !isBrowser) return;
  bound = true;
  window.addEventListener('scroll', () => scrollFns.forEach((f) => f()), { passive: true });
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => resizeFns.forEach((f) => f()));
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', onResize);
  document.fonts?.ready.then(onResize).catch(() => {});
  // layout shifts above a stage move it without a window resize
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(document.documentElement);
  }
}

/** Called on every scroll event. Read window.scrollY only. */
export function onScroll(fn: Fn): () => void {
  bind();
  scrollFns.add(fn);
  return () => {
    scrollFns.delete(fn);
  };
}

/** Called (rAF-throttled) on resize, load, fonts.ready and document size changes. Re-measure here. */
export function onLayout(fn: Fn): () => void {
  bind();
  resizeFns.add(fn);
  return () => {
    resizeFns.delete(fn);
  };
}
