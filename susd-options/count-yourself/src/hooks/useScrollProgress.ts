import { useEffect, useState, type RefObject } from 'react';

/**
 * Progress of a tall section through the viewport: 0 when its top meets the top of the viewport,
 * 1 when its bottom meets the bottom. Reports only whether progress has passed `mark`, so React
 * re-renders once per crossing, not every scroll frame.
 */
export function usePassed(ref: RefObject<HTMLElement>, mark: number, enabled = true): boolean {
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? -r.top / span : r.top < 0 ? 1 : 0;
      setPassed(p >= mark);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, mark, enabled]);
  return passed;
}
