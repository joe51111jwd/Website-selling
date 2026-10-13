// Holding the page still while a film plays, so the visitor's own scrolling never fights it.
//
//   const hold = holdPage({ y: () => sceneTop, onExit: (dir) => … });
//   hold.engage();   // glide there (~0.7 s, eased) and hold
//   hold.release();  // hand the page back
//
// While held:
//  · downward input is absorbed: the wheel, a trackpad's swipe and its inertia, a finger's swipe,
//    Page Down / ↓ / Space / End. Nothing moves, nothing jumps (and smooth scrolling never sees it);
//  · a CLEAR upward scroll lets go (`onExit("up")`) and carries on scrolling: a wheel notch up, a
//    deliberate trackpad or finger swipe up (small jitters don't count), Page Up / ↑ / Home;
//  · any other move of the page (the scrollbar dragged, an in-page link, find-in-page, a script)
//    is the visitor's: the hold lets go at once (`onExit("away")`), never pulls back.
// The page's own controls (buttons, links) keep working: only scrolling is held.

import { cancelGlide, glideTo, gliding } from "../scroll";

export type HoldExit = "up" | "away";

/** Wheel deltas in px (lines and pages normalised). */
function wheelPx(e: WheelEvent) {
  const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
  return { x: e.deltaX * k, y: e.deltaY * k };
}

/** How far up (px of wheel / swipe, within a short burst) counts as a clear upward scroll. */
const UP_WHEEL = 60;
const UP_TOUCH = 36;
/** A burst: upward input separated by less than this is added up. */
const BURST_MS = 320;

const isField = (el: EventTarget | null) => {
  const e = el as HTMLElement | null;
  if (!e || !e.closest) return false;
  return !!e.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']");
};
const isControl = (el: EventTarget | null) => {
  const e = el as HTMLElement | null;
  return !!e?.closest?.("button, a[href], [role='button'], [role='slider'], summary");
};

export type Hold = {
  /** Glide to the hold position, then hold it. `done` runs when the glide has landed. */
  engage(done?: () => void): void;
  release(): void;
  readonly held: boolean;
};

export function holdPage(o: { y: () => number | null; onExit: (dir: HoldExit) => void; glideMs?: number }): Hold {
  let held = false;
  let holdY = 0;
  let up = 0;
  let upAt = 0;
  let touchY: number | null = null;
  let landing = false;

  const exit = (dir: HoldExit) => {
    if (!held) return;
    release();
    o.onExit(dir);
  };

  const onWheel = (e: WheelEvent) => {
    if (!held || e.ctrlKey) return; // pinch-zoom stays the browser's
    const d = wheelPx(e);
    const t = performance.now();
    if (d.y < 0 && Math.abs(d.y) >= Math.abs(d.x)) {
      if (t - upAt > BURST_MS) up = 0;
      upAt = t;
      up += -d.y;
      if (up >= UP_WHEEL && !landing) {
        // a clear scroll up: let go, and let this event scroll the page
        exit("up");
        return;
      }
    } else if (d.y > 0) up = 0;
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchStart = (e: TouchEvent) => {
    if (!held || e.touches.length !== 1) return;
    touchY = e.touches[0].clientY;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!held || touchY === null || e.touches.length !== 1) return;
    const dy = e.touches[0].clientY - touchY;
    if (dy > UP_TOUCH && !landing) {
      // the finger pulls the page down: an upward scroll
      touchY = null;
      exit("up");
      return;
    }
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  };
  const onTouchEnd = () => (touchY = null);

  const onKey = (e: KeyboardEvent) => {
    if (!held || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isField(e.target)) return;
    switch (e.key) {
      case "PageUp":
      case "ArrowUp":
      case "Home":
        if (!landing) exit("up");
        return;
      case "PageDown":
      case "ArrowDown":
      case "End":
        e.preventDefault();
        return;
      case " ":
        // Space on a button presses it; elsewhere it would scroll the page
        if (!isControl(e.target)) e.preventDefault();
        return;
    }
  };

  const onScroll = () => {
    if (!held || landing || gliding()) return;
    const y = window.scrollY;
    if (Math.abs(y - holdY) > 4) exit(y < holdY ? "up" : "away");
  };

  const opts = { capture: true, passive: false } as const;
  function listen(on: boolean) {
    const f = on ? window.addEventListener.bind(window) : window.removeEventListener.bind(window);
    f("wheel", onWheel as EventListener, opts);
    f("touchstart", onTouchStart as EventListener, { capture: true, passive: true });
    f("touchmove", onTouchMove as EventListener, opts);
    f("touchend", onTouchEnd as EventListener, { capture: true, passive: true });
    f("keydown", onKey as EventListener, { capture: false });
    f("scroll", onScroll, { passive: true });
  }

  function release() {
    if (!held) return;
    held = false;
    landing = false;
    touchY = null;
    up = 0;
    if (gliding()) cancelGlide();
    listen(false);
  }

  return {
    get held() {
      return held;
    },
    engage(done) {
      const y = o.y();
      if (y === null) return;
      holdY = Math.round(y);
      if (!held) {
        held = true;
        listen(true);
      }
      landing = true;
      glideTo(holdY, o.glideMs ?? 700, () => {
        landing = false;
        // where the page actually came to rest (a rounding px) is the place we hold
        holdY = Math.round(window.scrollY);
        done?.();
      });
    },
    release,
  };
}
