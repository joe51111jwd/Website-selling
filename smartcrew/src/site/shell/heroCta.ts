// Whether the hero's CTA has scrolled out of view: the header's CTA and the phone's sticky bar
// appear only then, so two primary buttons are never on screen together.

import { useSyncExternalStore } from "react";

let gone = false;
/** it has left through the top / One Day's hand-off has faded it out (src/site/day/handoff.ts) */
let left = false;
let faded = false;
const subs = new Set<() => void>();
let io: IntersectionObserver | null = null;

function emit() {
  const next = left || faded;
  if (next === gone) return;
  gone = next;
  subs.forEach((f) => f());
}

/** The hero's button has faded out while still on screen (the scroll hand-off into One Day). */
export function setHeroCtaFaded(on: boolean) {
  if (faded === on) return;
  faded = on;
  emit();
}

/** The hero calls this with its CTA element. */
export function watchHeroCta(el: HTMLElement | null) {
  io?.disconnect();
  if (!el) return;
  io = new IntersectionObserver(
    ([e]) => {
      // gone once it has left through the top (not while it's still below the fold)
      left = !e.isIntersecting && e.boundingClientRect.top < 0;
      emit();
    },
    { threshold: 0 },
  );
  io.observe(el);
}

export function useHeroCtaGone() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => gone,
    () => false,
  );
}
