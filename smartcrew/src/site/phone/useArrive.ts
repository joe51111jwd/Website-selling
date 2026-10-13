// Trigger-once on arrival (PHONE MODE): a scene's animation plays the first time it is on
// screen, then stays in its end state. One IntersectionObserver callback per threshold
// crossing: nothing runs per frame and nothing reads layout while scrolling.
//
//   const [ref, arrived] = useArrive<HTMLElement>();            // ≥ 50% of the element on screen
//   const [ref, arrived] = useArrive<HTMLElement>({ amount: 0.3 });
//   <section ref={ref} data-arrived={arrived || undefined}>…
//
// With prefers-reduced-motion it reports arrived at once (show the end state, no animation).

import { useCallback, useEffect, useRef, useState } from "react";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type ArriveOptions = {
  /** Fraction of the element (or of the viewport, for elements taller than it) that must show. */
  amount?: number;
  /** Shrink/grow the viewport for the test (IntersectionObserver rootMargin). */
  margin?: string;
  /** Report leaving too (false again once off screen). Default: once, stays true. */
  repeat?: boolean;
};

export function useArrive<T extends Element>({ amount = 0.5, margin = "0px", repeat = false }: ArriveOptions = {}) {
  const [arrived, setArrived] = useState(reduce);
  const node = useRef<T | null>(null);
  const io = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (el: T | null) => {
      io.current?.disconnect();
      io.current = null;
      node.current = el;
      if (!el || (reduce && !repeat) || typeof IntersectionObserver === "undefined") return;
      io.current = new IntersectionObserver(
        ([e]) => {
          const vh = e.rootBounds?.height || window.innerHeight;
          // tall elements can never be `amount` visible: count against the viewport instead
          const seen = e.isIntersecting && (e.intersectionRatio >= amount - 0.001 || e.intersectionRect.height >= vh * amount - 1);
          if (seen) {
            setArrived(true);
            if (!repeat) {
              io.current?.disconnect();
              io.current = null;
            }
          } else if (repeat) setArrived(false);
        },
        { threshold: [0, amount, Math.min(1, amount + 0.25)], rootMargin: margin },
      );
      io.current.observe(el);
    },
    [amount, margin, repeat],
  );

  useEffect(() => () => io.current?.disconnect(), []);
  return [ref, arrived] as const;
}

/** Run timed steps once `go` turns true: returns the current step (0 before, then 1..n). */
export function useSteps(go: boolean, delays: number[]) {
  const [step, setStep] = useState(reduce && go ? delays.length : 0);
  const key = delays.join(",");
  useEffect(() => {
    if (!go) return;
    if (reduce) {
      setStep(delays.length);
      return;
    }
    const ts = delays.map((d, i) => window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), d));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, key]);
  return step;
}
