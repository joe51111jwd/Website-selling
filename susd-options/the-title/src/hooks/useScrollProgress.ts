// Scroll progress for tall sections with a sticky stage (brief §3). p = 0 when the section top reaches
// lead × the viewport height, p = 1 when its bottom reaches the viewport bottom.
// Each section's document top and height are measured only when layout changes (resize, or the page
// growing or shrinking), never per frame: the shared rAF loop computes p from window.scrollY alone, so it
// never forces a layout after other subscribers have written styles in the same frame.
import { useEffect, useRef } from 'react';
import { subscribe, wake } from '../motion/loop';

type Fn = (p: number) => void;
type Entry = { el: HTMLElement; fn: Fn; last: number; lead: number; top: number; h: number };
const entries = new Set<Entry>();
let dirty = true;
let stale = true;
let installed = false;

function measure() {
  const sy = window.scrollY;
  entries.forEach((e) => {
    const r = e.el.getBoundingClientRect();
    e.top = r.top + sy;
    e.h = r.height;
  });
  stale = false;
}

function install() {
  if (installed) return;
  installed = true;
  const mark = () => {
    dirty = true;
    wake();
  };
  const restale = () => {
    stale = true;
    mark();
  };
  window.addEventListener('scroll', mark, { passive: true });
  window.addEventListener('resize', restale);
  // fonts, fitted titles and revealed blocks change the page height: re-measure then (not per frame)
  new ResizeObserver(restale).observe(document.body);
  subscribe(() => {
    if (!dirty) return false;
    dirty = false;
    if (stale) measure();
    const vh = window.innerHeight;
    const sy = window.scrollY;
    entries.forEach((e) => {
      const top = e.top - sy;
      // lead > 0 starts the progress early: p = 0 when the top is at lead × the viewport height
      const pre = e.lead * vh;
      const span = e.h - vh + pre;
      let p = top <= 0 ? 1 : 0;
      if (span > 0) p = Math.min(1, Math.max(0, (pre - top) / span));
      if (p !== e.last) {
        e.last = p;
        e.fn(p);
      }
    });
    return false;
  });
}

export function useScrollProgress(ref: React.RefObject<HTMLElement>, fn: Fn, enabled = true, lead = 0) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    if (!enabled || !ref.current) return;
    install();
    const e: Entry = { el: ref.current, fn: (p: number) => cb.current(p), last: -1, lead, top: 0, h: 0 };
    entries.add(e);
    stale = true;
    dirty = true;
    wake();
    return () => {
      entries.delete(e);
    };
  }, [ref, enabled, lead]);
}
