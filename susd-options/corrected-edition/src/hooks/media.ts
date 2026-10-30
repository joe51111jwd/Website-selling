import { useEffect, useState } from 'react';
import { isSoftwareRenderer } from './gpu';

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
// Phone and portrait tablet use the compact (stacked, full-bleed sheet) layout.
export const COMPACT_QUERY = ['(max-width:900px)', '(orientation:portrait) and (max-width:1100px)'].join(', ');

export const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;
export const isReduced = () => mq(REDUCED_QUERY);
export const MOTION = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('motion') === '1';
/**
 * Calm: reduced motion, or a software renderer. Intros are skipped; sheets start settled.
 * ?motion=1 forces full motion on a software renderer (for judging the intro in screenshots).
 */
export const isCalm = () => isReduced() || (!MOTION && isSoftwareRenderer());
export const isCompact = () => mq(COMPACT_QUERY);

export function useMedia(q: string) {
  const [m, setM] = useState(() => mq(q));
  useEffect(() => {
    const l = window.matchMedia(q);
    const on = () => setM(l.matches);
    on();
    l.addEventListener('change', on);
    return () => l.removeEventListener('change', on);
  }, [q]);
  return m;
}

export const useReducedMotion = () => useMedia(REDUCED_QUERY);
export const useCompact = () => useMedia(COMPACT_QUERY);
