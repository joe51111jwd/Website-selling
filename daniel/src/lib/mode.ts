import { flushSync } from "react-dom";
import { createStore, useStore } from "./store";
import { reducedMotion } from "./ticker";
import { stage } from "./gl/stage";

/**
 * Structure mode turns the whole site into its own blueprint: the grid shows,
 * every block gets outlined and labelled, and every picture becomes a line
 * drawing. Toggled from the nav, or with the S key.
 */
export const structure = createStore(false);
export const useStructure = () => useStore(structure);

function apply(on: boolean, instant: boolean) {
  document.documentElement.dataset.mode = on ? "structure" : "surface";
  stage.setStructure(on, instant);
  flushSync(() => structure.set(on));
}

export function toggleStructure(origin?: { x: number; y: number }) {
  const on = !structure.get();
  const x = origin?.x ?? window.innerWidth - 80;
  const y = origin?.y ?? 40;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

  if (!doc.startViewTransition || reducedMotion) {
    apply(on, reducedMotion);
    return;
  }
  // a circle of the new mode grows out of the switch
  const transition = doc.startViewTransition(() => apply(on, true));
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 950, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}

window.addEventListener("keydown", (e) => {
  if (e.key !== "s" && e.key !== "S") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement;
  if (t.closest("input, textarea, select, [contenteditable]")) return;
  toggleStructure();
});
