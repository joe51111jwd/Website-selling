// Small helpers shared by A4's sheets (A-104, A-105, A-200). Owner: A4.
// Everything here is safe in the prerender: no window access at module scope or during render.

import { useEffect, useState, type RefObject } from 'react';
import { usePrefs } from '../../system/prefs';

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** true after the first client effect (React's first render stays state-agnostic, brief 8.3a). */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/**
 * "Live" = hydrated and motion allowed. Stages render their static end-state composition until then
 * (that is also the no-JS and reduced-motion composition), so nothing ever depends on JS to be read.
 */
export function useLive(): boolean {
  const mounted = useMounted();
  const { motion } = usePrefs();
  return mounted && motion;
}

/** Element content-box width, updated on resize only (never per scroll frame). 0 until measured. */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => setW(Math.round(el.clientWidth));
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** Reactive media query (false on the server and during hydration). */
export function useMediaQuery(query: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setM(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [query]);
  return m;
}

/** Mix two #rrggbb colours (sRGB, fine for line tints). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), t));
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
}

/** Palette as literals for places CSS variables cannot reach (SVG attribute tweening, GL). Mirrors tokens.css. */
export const PAL = {
  slabBlack: '#0b0b0a',
  slab: '#23221f',
  pencil: '#9a958c',
  chalk: '#ece8e1',
  chalkBlue: '#6f98e8',
  orange: '#f06a2c',
  bay: '#c9a23a',
} as const;

/** Wait for n animation frames (capture seeks). */
export function frames(n = 2): Promise<void> {
  return new Promise((res) => {
    const step = (k: number) => (k <= 0 ? res() : requestAnimationFrame(() => step(k - 1)));
    step(n);
  });
}

/**
 * Print-in (brief 3.2, 6): puts data-printed on the element once it arrives (IntersectionObserver), so
 * every .print-in inside prints in (opacity, 200 ms). No re-render. Under .no-js / .rm text is simply there.
 */
export function usePrinted(ref: RefObject<HTMLElement | null>, rootMargin = '0px 0px -20% 0px') {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-printed', '');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute('data-printed', '');
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
