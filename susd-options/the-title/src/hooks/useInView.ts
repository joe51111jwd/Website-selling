import { useEffect, useRef, useState } from 'react';

/** Visible ratio tracking with IntersectionObserver. Calls back with the current ratio. */
export function observeRatio(el: Element, cb: (ratio: number, entry: IntersectionObserverEntry) => void, thresholds = [0, 0.25, 0.4, 0.5, 0.6, 0.75, 1]) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.intersectionRatio, e)), { threshold: thresholds });
  io.observe(el);
  return () => io.disconnect();
}

/** Becomes true once the element is at least `amount` visible (and stays true). */
export function useInViewOnce<T extends Element>(amount = 0.4) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // tall blocks may never reach `amount` of their own height: count viewport coverage too
          const cover = e.intersectionRect.height / Math.max(1, Math.min(e.boundingClientRect.height, window.innerHeight));
          if (e.isIntersecting && (e.intersectionRatio >= amount || cover >= amount)) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount, seen]);
  return [ref, seen] as const;
}
