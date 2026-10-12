// Whether the hero's CTA has scrolled out of view: the header's CTA and the phone's sticky bar
// appear only then, so two primary buttons are never on screen together.

import { useSyncExternalStore } from "react";

let gone = false;
const subs = new Set<() => void>();
let io: IntersectionObserver | null = null;

/** The hero calls this with its CTA element. */
export function watchHeroCta(el: HTMLElement | null) {
  io?.disconnect();
  if (!el) return;
  io = new IntersectionObserver(
    ([e]) => {
      // gone once it has left through the top (not while it's still below the fold)
      const next = !e.isIntersecting && e.boundingClientRect.top < 0;
      if (next !== gone) {
        gone = next;
        subs.forEach((f) => f());
      }
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
