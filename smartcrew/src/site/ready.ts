// Two signals about the first screen, so the rest of the page can schedule its own work round it:
//
// - READY: the first screen has landed (the hero's headline, fence and orange button are in
//   place). The desktop's 3D devices start their entrance after it (parked below the fold), and
//   the desktop's Stage and later scenes load 1.2 s after it (App: useAfterEntrance).
// - DONE: the first screen is done: the hero's entrance has played out (settled), or the visitor
//   has started using the page (scroll, touch, wheel, key). Phones mount the later scenes and lay
//   the next screens out ahead (warm-ahead) after it, so none of that work lands in the middle of
//   the entrance as a long task.
//
// The hero marks both (src/site/hero/fence/engine.ts); with reduced motion, at once. Safety timers
// mark them anyway, so nothing downstream can wait forever.

import { useSyncExternalStore } from "react";

let ready = false;
const subs = new Set<() => void>();

/** Mark the page ready (idempotent). */
export function markPageReady() {
  if (ready) return;
  ready = true;
  subs.forEach((f) => f());
  subs.clear();
}

export const isPageReady = () => ready;

/** Run `fn` once the page is ready (now, if it already is). Returns an unsubscribe. */
export function onPageReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  subs.add(fn);
  return () => void subs.delete(fn);
}

export function usePageReady() {
  return useSyncExternalStore(
    (f) => {
      if (ready) return () => {};
      subs.add(f);
      return () => void subs.delete(f);
    },
    () => ready,
    () => false,
  );
}

/** Never wait longer than this for the first screen (a hero that failed, an opening that never handed over). */
const SAFETY_MS = 4500;
if (typeof window !== "undefined") window.setTimeout(markPageReady, SAFETY_MS);

// ─── DONE ───────────────────────────────────────────────────────────────────────────────

let done = false;
const doneSubs = new Set<() => void>();
const INPUTS = ["scroll", "touchstart", "wheel", "keydown", "pointerdown"] as const;

/** Mark the first screen done (idempotent). */
export function markFirstScreenDone() {
  if (done) return;
  done = true;
  if (typeof window !== "undefined") INPUTS.forEach((t) => window.removeEventListener(t, markFirstScreenDone));
  doneSubs.forEach((f) => f());
  doneSubs.clear();
}

export function useFirstScreenDone() {
  return useSyncExternalStore(
    (f) => {
      if (done) return () => {};
      doneSubs.add(f);
      return () => void doneSubs.delete(f);
    },
    () => done,
    () => false,
  );
}

if (typeof window !== "undefined") {
  INPUTS.forEach((t) => window.addEventListener(t, markFirstScreenDone, { passive: true }));
  window.setTimeout(markFirstScreenDone, 9000);
}
