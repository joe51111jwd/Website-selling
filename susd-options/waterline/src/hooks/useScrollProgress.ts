// Scroll progress of a tall section with a sticky stage: 0 when the stage first sticks, 1 when it lets go.
// Works from cached document offsets so nothing reads layout per frame.
export type SectionBox = { top: number; height: number };

export function measureBox(el: HTMLElement, scrollY: number): SectionBox {
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
}

export function stickyProgress(box: SectionBox, scrollY: number, V: number) {
  const travel = Math.max(1, box.height - V);
  return Math.min(1, Math.max(0, (scrollY - box.top) / travel));
}

// The sticky stage's top edge in viewport px (0 while stuck, negative once it scrolls away).
export function stickyTop(box: SectionBox, scrollY: number, V: number) {
  const local = box.top - scrollY;
  return local + Math.min(Math.max(scrollY - box.top, 0), Math.max(0, box.height - V));
}
