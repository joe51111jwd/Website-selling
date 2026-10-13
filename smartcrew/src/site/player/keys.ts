// The film's keyboard, like a video player's: Space plays / pauses, ← / → go to the previous /
// next chapter, Esc skips. Only while the film is the thing on screen (`active`), never while
// typing, and never stealing Space from a focused button or link (that presses it).

import type { Player } from "./player";

const typing = (el: EventTarget | null) => !!(el as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");
const control = (el: EventTarget | null) => !!(el as HTMLElement | null)?.closest?.("button, a[href], [role='button'], summary");

export function bindPlayerKeys(p: Player, o: { active: () => boolean; onSkip: () => void; onToggle?: () => void }) {
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || !o.active()) return;
    if (document.querySelector("[role='dialog'][aria-modal='true']")) return; // the popup has the keys
    switch (e.key) {
      case " ":
        if (control(e.target)) return;
        e.preventDefault();
        if (o.onToggle) o.onToggle();
        else p.toggle();
        return;
      case "ArrowRight":
        e.preventDefault();
        p.next();
        return;
      case "ArrowLeft":
        e.preventDefault();
        p.prev();
        return;
      case "Escape":
        if (p.state === "playing") {
          e.preventDefault();
          o.onSkip();
        }
        return;
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
