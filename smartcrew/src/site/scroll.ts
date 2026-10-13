// Scrolling: native everywhere; on desktop with a mouse or trackpad, Lenis smooths the wheel so
// scroll-scrubbed scenes glide (it still moves the real window scroll, so position: sticky,
// useScroll and the Stage all just work). Off on touch, on phones (App never starts it there; it
// is a lazy chunk, so phones don't download it) and for reduced motion.

import type Lenis from "lenis";
import { reducedMotion, sceneY } from "../three/stage/store";

let lenis: Lenis | null = null;
let starting = false;

export function startSmoothScroll() {
  if (lenis || starting || reducedMotion || !window.matchMedia("(pointer: fine)").matches) return () => {};
  starting = true;
  let stopped = false;
  import("lenis")
    .then(({ default: L }) => {
      starting = false;
      if (stopped || lenis) return;
      lenis = new L({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3.2), wheelMultiplier: 0.95, autoRaf: true, anchors: false });
      if (document.documentElement.classList.contains("scroll-locked")) lenis.stop();
    })
    .catch(() => (starting = false));
  return () => {
    stopped = true;
    lenis?.destroy();
    lenis = null;
  };
}

/** Stop the page from scrolling (while a popup is open). */
export function lockScroll(on: boolean) {
  document.documentElement.classList.toggle("scroll-locked", on);
  if (!lenis) return;
  if (on) lenis.stop();
  else lenis.start();
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let glideRaf = 0;
let glideDone: (() => void) | null = null;

/**
 * Glide the page to `y` on its own, on a clock (an eased ~0.7 s move, the same on a wheel, a
 * trackpad or a finger), then call `done`. The visitor's own wheel input can't bend it (Lenis
 * locks itself for the move; callers that hold the page absorb input anyway). Reduced motion: at
 * once.
 */
export function glideTo(y: number, ms = 700, done?: () => void) {
  cancelGlide();
  const top = Math.max(0, Math.round(y));
  const end = () => {
    glideRaf = 0;
    const d = glideDone;
    glideDone = null;
    d?.();
  };
  glideDone = done ?? null;
  if (reducedMotion || Math.abs(top - window.scrollY) < 1) {
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: "auto" });
    end();
    return;
  }
  if (lenis) {
    lenis.scrollTo(top, { duration: ms / 1000, easing: easeInOut, force: true, lock: true, onComplete: end });
    return;
  }
  const from = window.scrollY;
  const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    window.scrollTo({ top: from + (top - from) * easeInOut(k), behavior: "auto" });
    if (k < 1) glideRaf = requestAnimationFrame(step);
    else end();
  };
  glideRaf = requestAnimationFrame(step);
}

/** Stop a glide in flight (its `done` doesn't run). */
export function cancelGlide() {
  cancelAnimationFrame(glideRaf);
  if (lenis && glideDone) {
    // stop Lenis's own move where it is (stop() resets it; the popup's lock stays as it was)
    lenis.stop();
    if (!document.documentElement.classList.contains("scroll-locked")) lenis.start();
  }
  glideRaf = 0;
  glideDone = null;
}

/** A glide is running. */
export const gliding = () => glideDone !== null || glideRaf !== 0;

export function scrollToY(y: number, opts: { instant?: boolean } = {}) {
  const top = Math.max(0, y);
  if (lenis && !opts.instant) lenis.scrollTo(top, { duration: Math.min(2.2, 0.8 + Math.abs(top - window.scrollY) / 4000) });
  else window.scrollTo({ top, behavior: opts.instant || reducedMotion ? "auto" : "smooth" });
}

/** Scroll to a scene, at a point of its progress (0 = its top). */
export function scrollToScene(id: string, at = 0, opts: { instant?: boolean } = {}) {
  const y = sceneY(id, at);
  if (y !== null) scrollToY(y, opts);
  else document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}

/** In-page links (#day, #faq) go through scrollToScene. */
export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href");
  if (!href?.startsWith("#") || href.length < 2) return;
  e.preventDefault();
  const id = href.slice(1);
  history.replaceState(null, "", href);
  // the scenes after One Day mount after the first screen (App, src/site/ready.ts): a click that
  // comes before its scene is in the page waits for it (up to 3 s), then scrolls there
  let tries = 0;
  const go = () => {
    if (document.getElementById(id)) requestAnimationFrame(() => scrollToScene(id));
    else if (++tries < 30) window.setTimeout(go, 100);
  };
  go();
}
