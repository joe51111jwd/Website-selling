// The click-through's gentle auto-advance (SPEC_BRIEF.md): once the app has booted it waits for
// the visitor; if nobody touches it, it walks on by itself, spot by spot, page by page, group by
// group, round and round. It runs only while the section is on screen. The moment the visitor
// does anything with it (a click, a tap, a key, a pointer resting on the app) it holds still, and
// picks up again after a quiet spell; the pause button stops it for good (play starts it again).
// One timer at a time, nothing per frame. Reduced motion: never starts (ready stays false).

import { useCallback, useEffect, useRef, useState } from "react";

export type Pos = { g: number; p: number; s: number };

type Opts = {
  /** Booted and allowed to move (false with reduced motion). */
  ready: boolean;
  /** The section is on screen. */
  visible: boolean;
  /** Something sits on top (the "show everything" list). */
  blocked: boolean;
  /** shape[g][p] = how many spots page p of group g has. */
  shape: number[][];
  /** ms a spot stays named before the next one. */
  dwell: number;
  /** ms the first spot waits for the visitor after the boot. */
  firstWait: number;
  /** ms of quiet after an interaction before it walks on again. */
  resume: number;
};

export function step(shape: number[][], { g, p, s }: Pos): { pos: Pos; kind: "spot" | "page" | "group" } {
  if (s + 1 < shape[g][p]) return { pos: { g, p, s: s + 1 }, kind: "spot" };
  if (p + 1 < shape[g].length) return { pos: { g, p: p + 1, s: 0 }, kind: "page" };
  return { pos: { g: (g + 1) % shape.length, p: 0, s: 0 }, kind: "group" };
}

export function useTour({ ready, visible, blocked, shape, dwell, firstWait, resume }: Opts) {
  const [pos, setPos] = useState<Pos>({ g: 0, p: 0, s: 0 });
  const [stopped, setStopped] = useState(false); // the pause button
  const [held, setHeld] = useState(false); // a recent interaction / the pointer on the app
  const [beat, setBeat] = useState(0); // bumps on every automatic step (keys the progress line)
  const started = useRef(false);
  const lastKind = useRef<"spot" | "page" | "group">("group");
  const hovering = useRef(false);
  const holdT = useRef(0);

  const release = useCallback((ms: number) => {
    window.clearTimeout(holdT.current);
    holdT.current = window.setTimeout(() => !hovering.current && setHeld(false), ms);
  }, []);

  /** The visitor did something: hold, then walk on after the quiet spell. */
  const poke = useCallback(() => {
    setHeld(true);
    release(resume);
  }, [release, resume]);

  /** The pointer rests on the app: hold while it's there, walk on soon after it leaves. */
  const hover = useCallback(
    (on: boolean) => {
      if (hovering.current === on) return;
      hovering.current = on;
      if (on) {
        window.clearTimeout(holdT.current);
        setHeld(true);
      } else release(Math.min(resume, 3200));
    },
    [release, resume],
  );

  /** Go somewhere because the visitor asked. */
  const go = useCallback(
    (next: Pos) => {
      lastKind.current = "spot";
      setPos(next);
      poke();
    },
    [poke],
  );

  const toggle = useCallback(() => {
    setStopped((s) => {
      if (s) {
        window.clearTimeout(holdT.current);
        setHeld(false);
        started.current = true;
      }
      return !s;
    });
  }, []);

  const running = ready && visible && !blocked && !stopped && !held;
  if (import.meta.env.DEV) (window as unknown as { __specTour?: unknown }).__specTour = { pos, ready, visible, blocked, stopped, held, running, t: Math.round(performance.now()) };

  // the next automatic step: a spot is named for `dwell` (longer after a new page or group, whose
  // screen takes a moment to come in); the very first waits `firstWait` for the visitor
  const wait = !started.current ? firstWait : dwell + (lastKind.current === "spot" ? 0 : 700);
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      started.current = true;
      setPos((p) => {
        const n = step(shape, p);
        lastKind.current = n.kind;
        return n.pos;
      });
      setBeat((b) => b + 1);
    }, wait);
    return () => window.clearTimeout(t);
    // pos and beat re-arm the timer after every step
  }, [running, wait, pos, beat, shape]);

  useEffect(() => () => window.clearTimeout(holdT.current), []);

  return { pos, go, poke, hover, toggle, stopped, running, wait, beat };
}
