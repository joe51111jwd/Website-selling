import { useEffect, useState, type RefObject } from 'react';

/** True while at least `threshold` of the element is visible. */
export function useInView(ref: RefObject<Element>, threshold = 0, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= threshold - 0.001), {
      threshold: [0, threshold].filter((v, i, a) => a.indexOf(v) === i),
      rootMargin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
  return inView;
}

/** Becomes true the first time the element is `threshold` visible, then stays true. */
export function useSeen(ref: RefObject<Element>, threshold = 0.3): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= threshold - 0.001) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: [threshold] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, seen]);
  return seen;
}
