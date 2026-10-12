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

const DEMO_AFTER = 4000;
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
 * Runs the self demo once: after the scene has been settled on screen for 4 s with nobody
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

/**
 * Whether the scene's sticky stage is pinned and filling the viewport (the 3D phone has arrived
 * and holds still), recomputed on scroll and resize. `settleMs` waits for the Stage's spring.
 */
export function usePinned(id: string, settleMs = 260) {
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    let raf = 0;
    let timer = 0;
    let last = false;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const now = r.top <= 1 && r.bottom >= window.innerHeight - 1;
      if (now === last) return;
      last = now;
      window.clearTimeout(timer);
      if (now) timer = window.setTimeout(() => setPinned(true), settleMs);
      else setPinned(false);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [id, settleMs]);
  return pinned;
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
