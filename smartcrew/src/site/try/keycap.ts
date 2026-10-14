// The primary CTA's one-time attention cue in Try it and Your number: a keycap press, not a ring
// (scratchpad design/v2/scroll/SCROLL_SHOTS.md §0, "What replaces the button ring"). The first
// time the button is fully on screen and actually visible, it sinks 2 px onto its lip and comes
// back while its arrow slides 4 px right and back: 360 ms, --ease-calm, once. Same gating as the
// shared cue: desktop only (on phones the in-scene buttons sit still; the hero's and the sticky
// bar's buttons carry the page's one cue), nothing with reduced motion.
// The shared cue (../ui/cue.ts) still draws the old dashed ring; SceneCta opts out of it
// (cue={false}) and plays this instead. When cue.ts becomes this press, SceneCta can drop it.

import { reducedMotion } from "../../three/stage/store";
import { isPhone } from "../phone";
import "./keycap.css";

const HALF = 180;

/** Press the cap once (two class flips; the transitions are in keycap.css). Returns a cancel. */
export function pressKeycap(b: HTMLElement) {
  b.classList.add("kc-run", "kc-down");
  const t1 = window.setTimeout(() => b.classList.remove("kc-down"), HALF);
  const t2 = window.setTimeout(() => b.classList.remove("kc-run"), HALF * 2 + 40);
  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    b.classList.remove("kc-run", "kc-down");
  };
}

/** The buttons (by their source) that have had their press: once per page view, even if remounted. */
const played = new Set<string>();

/**
 * Watch `b` and press it once, the first time it is fully on screen and visible (once per `key`
 * per page view: Try it's button remounts after each clock-in). Returns a cleanup.
 */
export function keycapOnce(b: HTMLElement, key: string) {
  if (played.has(key) || reducedMotion || isPhone() || typeof IntersectionObserver === "undefined") return () => {};
  let cancel: (() => void) | null = null;
  let poll = 0;
  let done = false;
  const shown = () =>
    !b.closest("[inert]") &&
    (typeof b.checkVisibility !== "function" || b.checkVisibility({ opacityProperty: true, visibilityProperty: true })) &&
    parseFloat(getComputedStyle(b).opacity || "1") > 0.6;
  const tryPlay = () => {
    if (done || !shown()) return;
    done = true;
    played.add(key);
    io.disconnect();
    window.clearInterval(poll);
    cancel = pressKeycap(b);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      window.clearInterval(poll);
      if (!e.isIntersecting || done) return;
      // a beat after it is fully in (it may still be fading in); checked while it stays on screen
      poll = window.setInterval(tryPlay, 320);
    },
    { threshold: 0.98 },
  );
  io.observe(b);
  return () => {
    io.disconnect();
    window.clearInterval(poll);
    cancel?.();
  };
}
