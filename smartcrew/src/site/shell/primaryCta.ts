// Whether a scene's own primary CTA is on screen right now. The header's CTA (laptops) and the
// phone's sticky bar step aside while one is, so two primary buttons are never on screen together.
// Every <Cta> registers itself (src/site/ui/Cta.tsx) unless it is the header's or the bar's.
//
// "On screen" = inside the viewport below the header, not inside an [inert] subtree, and actually
// visible (a scene may keep its CTA mounted at opacity 0 until its beat). An IntersectionObserver
// keeps the candidates cheap; a short poll covers CTAs that fade in without a scroll (Try it's
// "That's the whole training." appears on a tap).

import { useSyncExternalStore } from "react";

const els = new Set<HTMLElement>();
const near = new Set<HTMLElement>();
const subs = new Set<() => void>();
let inView = false;
let io: IntersectionObserver | null = null;
let poll = 0;
let raf = 0;
let listening = false;

function headerH() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
}

function visible(el: HTMLElement, top: number, bottom: number) {
  if (!el.isConnected || el.closest("[inert]")) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  // most of it between the header and the bottom edge
  if (r.top + r.height * 0.5 < top || r.bottom - r.height * 0.5 > bottom) return false;
  if (typeof el.checkVisibility === "function" && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
  // fading in or out: count it from half opacity (walks up a few levels only)
  let n: HTMLElement | null = el;
  for (let i = 0; n && i < 6; i++, n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.5) return false;
  return true;
}

function check() {
  raf = 0;
  const top = headerH();
  const bottom = window.innerHeight;
  let next = false;
  for (const el of near) if (visible(el, top, bottom)) next = true;
  if (next !== inView) {
    inView = next;
    subs.forEach((f) => f());
  }
}

function schedule() {
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
