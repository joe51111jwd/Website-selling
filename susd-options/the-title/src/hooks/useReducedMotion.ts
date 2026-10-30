import { useEffect, useState } from 'react';

const q = () => window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReduced = () => typeof window !== 'undefined' && q().matches;

export function useReducedMotion() {
  const [reduced, set] = useState(prefersReduced);
  useEffect(() => {
    const m = q();
    const on = () => set(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Any media query as React state. */
export function useMedia(query: string) {
  const [v, set] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => set(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return v;
}

/** Tablets and portrait screens set the hero title stacked, like the cover (a one-line title there is a thin strip). */
export const STACK_QUERY = '(max-width: 900px), (max-aspect-ratio: 1/1)';

const narrowQ = () => window.matchMedia('(max-width: 700px)');
export const isNarrow = () => typeof window !== 'undefined' && narrowQ().matches;

/** true at a width of 700 px or less (stacked title, no sticky stages) */
export function useNarrow() {
  const [n, set] = useState(isNarrow);
  useEffect(() => {
    const m = narrowQ();
    const on = () => set(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return n;
}
