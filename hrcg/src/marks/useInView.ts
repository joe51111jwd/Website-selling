// Small view hooks shared by the marks and A3's sheets. Owner: A3.
// No layout reads per scroll frame: IntersectionObserver only. First render is state-agnostic
// (everything starts "not in view"; CSS shows end states under .no-js / .rm).

import { useEffect, useState, type RefObject } from 'react';

export interface InViewOptions {
  rootMargin?: string;
  threshold?: number;
  /** Stay true once seen (default true). */
  once?: boolean;
}

/** true once the element intersects the viewport (per options). Re-renders at most on change. */
export function useInView(ref: RefObject<Element | null>, opts: InViewOptions = {}): boolean {
  const { rootMargin = '0px 0px -15% 0px', threshold = 0, once = true } = opts;
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            if (once) io.disconnect();
          } else if (!once) setSeen(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return seen;
}

/**
 * Print-in (brief 3.2, 6): returns true when the block arrives. Put `data-printed={printed || undefined}`
 * on the block; every `.print-in` inside then prints in (opacity only, 200 ms; marks.css). Stagger with
 * `style={{ '--d': '120ms' }}`. Under .no-js / .rm / .capture the text is simply there (base.css).
 */
export function usePrintIn(ref: RefObject<Element | null>, opts: InViewOptions = {}): boolean {
  return useInView(ref, { rootMargin: '0px 0px -20% 0px', ...opts });
}

/** Reactive media query (false on the server and during hydration). */
export function useMedia(query: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const apply = () => setM(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [query]);
  return m;
}
