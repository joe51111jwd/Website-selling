// useStageProgress(ref, opts?) -> MotionValue<number> 0..1 (brief 6, 8.3). Owner: A1.
// Reads window.scrollY only on scroll (Lenis drives native scroll); element rects are cached and
// re-measured on resize, load, fonts.ready and document size changes. Never re-renders React.
//
// Pass the TALL wrapper (not the sticky child). Default range: 'top top' -> 'bottom bottom',
// i.e. 0 when the wrapper's top meets the viewport top, 1 when its bottom meets the viewport bottom.
// Under reduced motion / MOTION OFF the value is pinned to `reduced` (default 1 = end state).

import { useEffect, useState, type RefObject } from 'react';
import { motionValue, type MotionValue } from 'motion/react';
import { onLayout, onScroll } from './scroll';
import { prefsStore } from './prefs';

export type Edge = 'top' | 'center' | 'bottom';
/** '<element edge> <viewport edge>', like 'top top' or 'bottom bottom'. */
export type EdgePair = `${Edge} ${Edge}`;

export interface StageProgressOptions {
  start?: EdgePair;
  end?: EdgePair;
  /** Value under reduced motion / MOTION OFF. Default 1. Pass null to keep tracking scroll. */
  reduced?: number | null;
}

const F: Record<Edge, number> = { top: 0, center: 0.5, bottom: 1 };

function parse(pair: EdgePair): [number, number] {
  const [a, b] = pair.split(' ') as [Edge, Edge];
  return [F[a] ?? 0, F[b] ?? 0];
}

export function useStageProgress(
  ref: RefObject<HTMLElement | null>,
  opts: StageProgressOptions = {},
): MotionValue<number> {
  const [mv] = useState(() => motionValue(0));
  const start = opts.start ?? 'top top';
  const end = opts.end ?? 'bottom bottom';
  const reduced = opts.reduced === undefined ? 1 : opts.reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const [se, sv] = parse(start);
    const [ee, ev] = parse(end);
    let startY = 0;
    let endY = 1;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const vh = window.innerHeight;
      startY = top + r.height * se - vh * sv;
      endY = top + r.height * ee - vh * ev;
      update();
    };
    const update = () => {
      if (reduced !== null && !prefsStore.get().motion) {
        if (mv.get() !== reduced) mv.set(reduced);
        return;
      }
      const span = endY - startY;
      const p = span <= 0 ? (window.scrollY >= endY ? 1 : 0) : (window.scrollY - startY) / span;
      mv.set(p < 0 ? 0 : p > 1 ? 1 : p);
    };

    measure();
    const offS = onScroll(update);
    const offL = onLayout(measure);
    const offP = prefsStore.subscribe(() => requestAnimationFrame(measure));
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => {
      offS();
      offL();
      offP();
      ro?.disconnect();
    };
  }, [ref, mv, start, end, reduced]);

  return mv;
}
