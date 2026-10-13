// Whether a scene's own primary CTA is on screen right now. The header's CTA (laptops) and the
// phone's sticky bar step aside while one is, so two primary buttons are never on screen together.
// Every <Cta> registers itself (src/site/ui/Cta.tsx) unless it is the header's or the bar's.
//
// "On screen" = any part of it inside the viewport, not inside an [inert] subtree, and actually
// visible (a scene may keep its CTA mounted at opacity 0 until its beat). Any part, not most of
// it: the header's button hides the moment a scene's button peeks in at the bottom, and the
// phone's bar (which covers the bottom 64 px) slides away before the scene's button can show
// above it. An IntersectionObserver keeps the candidates cheap; a short poll covers CTAs that fade
// in without a scroll (Try it's "That's the whole training." appears on a tap).
//
// Two scene CTAs can't be on screen together either: a CTA inside a container marked with
// usePrimaryElsewhere() (the FAQ's close) waits, hidden, while another scene's CTA is on screen
// (the offer's, right above it), and counts as "on screen" for the header and the bar meanwhile,
// so neither flashes in during the hand-over.

import { useSyncExternalStore } from "react";
import { isPhoneLite } from "../phone";

const els = new Set<HTMLElement>();
const near = new Set<HTMLElement>();
const subs = new Set<() => void>();
let inView = false;
/** The CTAs actually showing right now (for usePrimaryElsewhere). */
let shown: HTMLElement[] = [];
const shownSubs = new Set<() => void>();
/** Marks a container whose CTA waits while another scene's CTA is on screen. */
const HELD = "data-cta-held";
let io: IntersectionObserver | null = null;
let poll = 0;
let raf = 0;
let listening = false;

function onScreen(el: HTMLElement, top: number, bottom: number) {
  if (!el.isConnected || el.closest("[inert]")) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  return r.bottom > top && r.top < bottom;
}

function opaque(el: HTMLElement) {
  if (typeof el.checkVisibility === "function" && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
  // fading in or out: count it from half opacity (walks up a few levels only)
  let n: HTMLElement | null = el;
  for (let i = 0; n && i < 6; i++, n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.5) return false;
  return true;
}

function headerH() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
}

function check() {
  raf = 0;
  const bottom = window.innerHeight;
  const under = headerH();
  let next = false;
  const now: HTMLElement[] = [];
  for (const el of near) {
    if (!onScreen(el, 0, bottom)) continue;
    if (opaque(el)) {
      next = true;
      // a button sliding away under the frosted header no longer holds another one back
      if (el.getBoundingClientRect().bottom > under) now.push(el);
    }
    // waiting for its turn, or fading in after it: still a scene CTA on screen as far as the
    // header and the bar go (so neither flashes in during the hand-over)
    else if (el.closest(`[${HELD}]`)) next = true;
  }
  if (next !== inView) {
    inView = next;
    subs.forEach((f) => f());
  }
  if (now.length !== shown.length || now.some((e, i) => e !== shown[i])) {
    shown = now;
    shownSubs.forEach((f) => f());
  }
}

let throttle = 0;
function schedule() {
  // PHONE MODE: no per-frame layout reads while scrolling; look at most every 120 ms
  if (isPhoneLite()) {
    if (!throttle && !raf) throttle = window.setTimeout(() => ((throttle = 0), (raf = requestAnimationFrame(check))), 120);
    return;
  }
  if (!raf) raf = requestAnimationFrame(check);
}

function syncPoll() {
  const want = near.size > 0;
  if (want && !poll) poll = window.setInterval(schedule, 300);
  if (!want && poll) {
    window.clearInterval(poll);
    poll = 0;
  }
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? near.add(e.target as HTMLElement) : near.delete(e.target as HTMLElement)));
      syncPoll();
      schedule();
    },
    { threshold: 0 },
  );
  els.forEach((el) => io!.observe(el));
}

/** Track a scene's primary CTA element. Returns the unregister function. */
export function watchPrimary(el: HTMLElement) {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return () => {};
  els.add(el);
  listen();
  io!.observe(el);
  return () => {
    els.delete(el);
    near.delete(el);
    io?.unobserve(el);
    syncPoll();
    schedule();
  };
}

/** True while a scene's own primary CTA is on screen. */
export function usePrimaryInView() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => inView,
    () => false,
  );
}

/**
 * True while a scene CTA outside `container` is showing. Put the result on the container as
 * data-cta-held={held} (and hide it in CSS): its own CTA then waits for the other one to leave
 * the screen, so two orange buttons never show together.
 */
export function usePrimaryElsewhere(container: { current: HTMLElement | null }) {
  return useSyncExternalStore(
    (f) => (shownSubs.add(f), () => void shownSubs.delete(f)),
    () => {
      const c = container.current;
      return shown.some((el) => !c || !c.contains(el));
    },
    () => false,
  );
}
