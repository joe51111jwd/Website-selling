// Scrolling: native everywhere; on desktop with a mouse or trackpad, Lenis smooths the wheel so
// scroll-scrubbed scenes glide (it still moves the real window scroll, so position: sticky,
// useScroll and the Stage all just work). Off on touch and for reduced motion.

import Lenis from "lenis";
import { reducedMotion, sceneY } from "../three/stage/store";

let lenis: Lenis | null = null;

export function startSmoothScroll() {
  if (lenis || reducedMotion || !window.matchMedia("(pointer: fine)").matches) return () => {};
  lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3.2), wheelMultiplier: 0.95, autoRaf: true, anchors: false });
  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

/** Stop the page from scrolling (while the intro plays or a popup is open). */
export function lockScroll(on: boolean) {
  document.documentElement.classList.toggle("scroll-locked", on);
  if (!lenis) return;
  if (on) lenis.stop();
  else lenis.start();
}

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
  scrollToScene(href.slice(1));
  history.replaceState(null, "", href);
}
