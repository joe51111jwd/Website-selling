// Try it's little state machine, shared by the desktop (3D phone + overlay) and phone (the page
// becomes the app) layouts: ready → clocked in (by the visitor, or by the one-time self demo),
// a running timer, clock out to try again. Plus "is the scene on screen and settled", which gates
// the self demo and the buttons drawn over the 3D phone.

import { useCallback, useEffect, useRef, useState } from "react";
import { trackCustom } from "../../lib/track";
import { reducedMotion } from "../../three/stage/store";

export type ClockBy = "visitor" | "demo";
export type Clock = {
  on: boolean;
  /** performance.now() at clock-in */
  since: number;
  by: ClockBy | null;
  /** the visitor has tapped at least once (no more self demo) */
  touched: boolean;
  /** the self demo has run (it runs once per page view) */
  demoed: boolean;
  /** the ghost tap is on screen (demo about to clock in) */
  ghost: boolean;
};

/** The self demo waits this long, settled and untouched (SCROLL_SHOTS §1: was 4 s). */
const DEMO_AFTER = 3200;
const GHOST_MS = 900;

export function useClock() {
  const [c, set] = useState<Clock>({ on: false, since: 0, by: null, touched: false, demoed: false, ghost: false });
  const ghostTimer = useRef(0);

  const clockIn = useCallback((by: ClockBy) => {
    window.clearTimeout(ghostTimer.current);
    set((s) => (s.on ? s : { ...s, on: true, since: performance.now(), by, ghost: false, touched: s.touched || by === "visitor" }));
    trackCustom("try_clock_in", { by });
  }, []);

  const clockOut = useCallback(() => {
    set((s) => ({ ...s, on: false, by: null, ghost: false, touched: true }));
    trackCustom("try_clock_out");
  }, []);

  /** The demo: a ghost finger presses the button, then it clocks in. */
  const demo = useCallback(() => {
    set((s) => (s.on || s.demoed ? s : { ...s, demoed: true, ghost: !reducedMotion }));
    ghostTimer.current = window.setTimeout(() => clockIn("demo"), reducedMotion ? 0 : GHOST_MS);
  }, [clockIn]);

  /** The visitor is around the phone (pointer moving over it, focus): restart the demo countdown. */
  const [pokes, setPokes] = useState(0);
  const lastPoke = useRef(0);
  const poke = useCallback(() => {
    const now = performance.now();
    if (now - lastPoke.current < 250) return;
    lastPoke.current = now;
    setPokes((n) => n + 1);
  }, []);

  useEffect(() => () => window.clearTimeout(ghostTimer.current), []);
  return { ...c, pokes, clockIn, clockOut, demo, poke };
}

/**
 * Runs the self demo once: after the scene has been settled on screen for 3.2 s with nobody
 * tapping (a pointer moving over the phone restarts the count, so it never fires under a hand).
 */
export function useSelfDemo(clock: ReturnType<typeof useClock>, settled: boolean) {
  const { on, touched, demoed, demo, pokes } = clock;
  useEffect(() => {
    if (!settled || on || touched || demoed) return;
    const t = window.setTimeout(demo, DEMO_AFTER);
    return () => window.clearTimeout(t);
  }, [settled, on, touched, demoed, demo, pokes]);
}

/** Seconds since `since` while `on`, re-rendering once a second. */
export function useElapsed(on: boolean, since: number) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!on) {
      setS(0);
      return;
    }
    let t = 0;
    const tick = () => {
      const e = Math.max(0, Math.floor((performance.now() - since) / 1000));
      setS(e);
      t = window.setTimeout(tick, 1000 - ((performance.now() - since) % 1000) + 8);
    };
    tick();
    return () => window.clearTimeout(t);
  }, [on, since]);
  return s;
}

/** Where a pinned scene's stage is: -1 still coming up from below, 0 pinned (filling the viewport), 1 scrolled past. */
export type StagePhase = -1 | 0 | 1;

/**
 * Whether the scene's sticky stage is pinned and filling the viewport (the 3D phone has arrived
 * and holds still), and which side of it the page is on. Two IntersectionObservers on hairline
 * bands at the viewport's top and bottom edges: the scene covers both while pinned. Nothing runs
 * per scroll event and nothing reads layout. `pinned` waits `settleMs` for the Stage's spring.
 */
export function useStagePhase(id: string, settleMs = 260) {
  const [phase, setPhase] = useState<StagePhase>(-1);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el || typeof IntersectionObserver === "undefined") return;
    let top = false;
    let bottom = false;
    let elTop = 1;
    let last: StagePhase | null = null;
    let timer = 0;
    const update = () => {
      const now: StagePhase = top && bottom ? 0 : elTop > 0 ? -1 : 1;
      if (now === last) return;
      last = now;
      setPhase(now);
      window.clearTimeout(timer);
      if (now === 0) timer = window.setTimeout(() => setPinned(true), settleMs);
      else setPinned(false);
    };
    const band = (margin: string, set: (on: boolean) => void) =>
      new IntersectionObserver(
        (es) => {
          for (const e of es) {
            set(e.isIntersecting);
            elTop = e.boundingClientRect.top;
          }
          update();
        },
        { rootMargin: margin, threshold: 0 },
      );
    const a = band("0px 0px -99.7% 0px", (on) => (top = on));
    const b = band("-99.7% 0px 0px 0px", (on) => (bottom = on));
    a.observe(el);
    b.observe(el);
    return () => {
      a.disconnect();
      b.disconnect();
      window.clearTimeout(timer);
    };
  }, [id, settleMs]);
  return { phase, pinned };
}

/** The visitor's local time, "4:13 PM". */
export function localTime(d = new Date()) {
  try {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    const h = d.getHours();
    return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
}
