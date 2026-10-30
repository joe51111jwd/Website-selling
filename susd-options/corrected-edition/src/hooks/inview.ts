import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls onEnter once, the first time the element is at least `ratio` visible.
 * Visibility is measured against the smaller of the element and the viewport, so tall
 * phone sheets still count as "in view". `holdMs` requires it to stay visible that long.
 */
export function useInViewOnce(
  ref: RefObject<Element>,
  ratio: number,
  onEnter: () => void,
  opts: { enabled?: boolean; holdMs?: number } = {},
) {
  const cb = useRef(onEnter);
  cb.current = onEnter;
  const enabled = opts.enabled ?? true;
  const holdMs = opts.holdMs ?? 0;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let fired = false;
    let timer = 0;
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const base = Math.min(e.boundingClientRect.height, window.innerHeight) || 1;
          const vis = e.intersectionRect.height / base;
          if (vis >= ratio) {
            if (!timer && !fired) {
              timer = window.setTimeout(() => {
                fired = true;
                io.disconnect();
                cb.current();
              }, holdMs);
            }
          } else if (timer) {
            clearTimeout(timer);
            timer = 0;
          }
        }
      },
      { threshold: thresholds },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [ref, ratio, enabled, holdMs]);
}

/** Reports whether the element currently intersects the viewport (for the phone bar). */
export function useInViewState(ref: RefObject<Element>, cb: (visible: boolean, entry: IntersectionObserverEntry) => void, rootMargin = '0px') {
  const fn = useRef(cb);
  fn.current = cb;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => fn.current(e.isIntersecting, e)), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
