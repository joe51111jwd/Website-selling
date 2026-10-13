// PHONE MODE: build a scene ahead of its arrival, a piece per idle moment. Scenes after One Day
// skip rendering while off screen (content-visibility: auto, shell.css), so their whole first
// style + layout otherwise lands as ONE task right as they scroll in (Try it's live app UI: ~40 ms
// of first-time text layout at 4x CPU). When the scene comes within ~1.5 screens this counts
// `steps` up, one step per idle moment and never two in the same frame: step 1 marks the scene
// `data-warm` (its phone CSS turns the skip off, so it lays out while still off screen), the next
// steps are for the scene to mount its parts one at a time. With reduced motion it starts at the
// last step.

import { useEffect, useState, type RefObject } from "react";

type Idle = (cb: () => void, opts?: { timeout: number }) => number;
const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useStaged(ref: RefObject<HTMLElement | null>, steps: number, margin = "150% 0px") {
  const [step, setStep] = useState(reduce ? steps : 0);
  useEffect(() => {
    const scene = ref.current?.closest<HTMLElement>(".scene");
    if (!scene || typeof IntersectionObserver === "undefined") {
      setStep(steps);
      return;
    }
    if (reduce) scene.dataset.warm = "";
    const w = window as unknown as {
      requestIdleCallback?: Idle;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    let raf = 0;
    let timer = 0;
    let n = reduce ? steps : 0;
    let dead = false;
    const run = () => {
      if (dead || n >= steps) return;
      n += 1;
      if (n === 1) scene.dataset.warm = "";
      setStep(n);
      // the next step after this one has rendered (rAF → after the frame → idle)
      raf = requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          if (w.requestIdleCallback) idle = w.requestIdleCallback(run, { timeout: 600 });
          else timer = window.setTimeout(run, 40);
        }, 0);
      });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (w.requestIdleCallback) idle = w.requestIdleCallback(run, { timeout: 600 });
        else timer = window.setTimeout(run, 40);
      },
      { rootMargin: margin },
    );
    if (n < steps) io.observe(scene);
    return () => {
      dead = true;
      io.disconnect();
      if (idle) w.cancelIdleCallback?.(idle);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [ref, steps, margin]);
  return step;
}
