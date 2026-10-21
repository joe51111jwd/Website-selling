// Your number: the crew slider's glide (James, Oct 21: "a smooth slow speed up animation where you
// just go from 0 to 15 … so it illustrates to the user that you're supposed to slide it"). The
// first time the crew comes into view the slider runs from 0 up to the preset crew (./calc.ts
// PRESET): slow at first, speeding up, then a soft landing. The thumb moves continuously and a hard
// hat appears as each whole person is passed. Once per page view; never with reduced motion. The
// visitor's first input on the slider ends it where it is and they take over.

import { useCallback, useEffect, useRef, useState } from "react";
import { reducedMotion } from "../../three/stage/store";

/** The glide runs: the crew starts from 0 and glides to the preset (else it starts at the preset). */
export const GLIDE = typeof window !== "undefined" && !reducedMotion && typeof IntersectionObserver !== "undefined";

/** After the crew arrives, so its empty slots have begun to ripple in first. */
const DELAY_MS = 350;
const GLIDE_MS = 2000;

/** cubic-bezier(0.65, 0, 0.45, 1): a slow start, speeding up, then a short soft landing on the number. */
const X1 = 0.65;
const X2 = 0.45;
const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
function ease(t: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const s = (lo + hi) / 2;
    if (bez(X1, X2, s) < t) lo = s;
    else hi = s;
  }
  return bez(0, 1, (lo + hi) / 2);
}

/**
 * The glide for one slider. `to`: the crew to glide to (null: no glide). `start`: the crew has
 * arrived. `onValue`: each whole crew as it is passed (the parent's state, so the formula and the
 * meter follow; it is not the visitor's input). Returns the thumb's position while it moves
 * (0 to `to`, fractional; null otherwise), whether the glide is under way (the meter waits for it
 * as for a drag), and `stop`, for the visitor's first input.
 */
export function useGlide(to: number | null, start: boolean, onValue: (v: number) => void) {
  const [x, setX] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const phase = useRef<"wait" | "run" | "done">(to == null ? "done" : "wait");
  const raf = useRef(0);
  const timer = useRef(0);
  const last = useRef(0);
  const cb = useRef(onValue);
  cb.current = onValue;

  const end = useCallback(() => {
    phase.current = "done";
    cancelAnimationFrame(raf.current);
    window.clearTimeout(timer.current);
    setX(null);
    setRunning(false);
  }, []);
  const stop = useCallback(() => {
    if (phase.current !== "done") end();
  }, [end]);

  useEffect(() => {
    if (!start || to == null || phase.current !== "wait") return;
    phase.current = "run";
    setRunning(true);
    timer.current = window.setTimeout(() => {
      const t0 = performance.now();
      const frame = (now: number) => {
        if (phase.current !== "run") return;
        const t = Math.min(1, (now - t0) / GLIDE_MS);
        const v = ease(t) * to;
        const whole = t >= 1 ? to : Math.round(v);
        if (whole !== last.current) {
          last.current = whole;
          cb.current(whole);
        }
        if (t >= 1) return end();
        setX(v);
        raf.current = requestAnimationFrame(frame);
      };
      raf.current = requestAnimationFrame(frame);
    }, DELAY_MS);
  }, [start, to, end]);

  // unmounted mid-glide: land on the crew it was going to, never a partial one
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer.current);
      if (phase.current === "run" && to != null) cb.current(to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { x, running, stop };
}
