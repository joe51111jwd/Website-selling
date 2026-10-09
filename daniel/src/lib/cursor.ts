import { createStore } from "./store";
import { isTouch, lenis, lerp, onTick } from "./ticker";

/**
 * The cursor is a circle that changes job with what's under it. Over a
 * picture it becomes the X-ray lens (the WebGL shader reads `lens`), over the
 * hero it grows into a big lens that shows how the type is built.
 *
 * Elements opt in with data-cursor="view" | "lens" | "link" | "drag" | "copy"
 * and an optional data-cursor-label.
 */

export type CursorKind = "default" | "link" | "view" | "lens" | "drag" | "copy" | "hidden";

const RADIUS: Record<CursorKind, number> = {
  default: 5,
  link: 26,
  view: 62,
  lens: 150,
  drag: 46,
  copy: 46,
  hidden: 0,
};

/** Where the pointer really is, and where the circle has eased to. */
export const pointer = { x: -400, y: -400, active: false };
export const lens = { x: -400, y: -400, r: 0 };
export const cursorState = createStore<{ kind: CursorKind; label: string }>({ kind: "default", label: "" });

const circle = { x: -400, y: -400, r: 0, vx: 0, vy: 0 };
let el: HTMLElement | null = null;
let forced: CursorKind | null = null;

function read(target: Element | null) {
  if (forced) return;
  const host = target?.closest<HTMLElement>("[data-cursor], a, button, input, textarea, label, [role=button]");
  let kind: CursorKind = "default";
  let label = "";
  if (host) {
    const attr = host.dataset.cursor as CursorKind | undefined;
    if (attr) kind = attr;
    else if (host.matches("input, textarea")) kind = "hidden";
    else kind = "link";
    label = host.dataset.cursorLabel ?? "";
  }
  const cur = cursorState.get();
  if (cur.kind !== kind || cur.label !== label) cursorState.set({ kind, label });
}

/** Re-check what's under the pointer, e.g. after the page changed beneath it. */
export function refreshCursor() {
  if (!pointer.active) return;
  read(document.elementFromPoint(pointer.x, pointer.y));
}

/** Pin the cursor to a kind regardless of what's under it (null to release). */
export function forceCursor(kind: CursorKind | null, label = "") {
  forced = kind;
  if (kind) cursorState.set({ kind, label });
  else refreshCursor();
}

export function attachCursor(node: HTMLElement) {
  el = node;
}

if (!isTouch) {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        circle.x = pointer.x;
        circle.y = pointer.y;
      }
      read(e.target as Element);
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  // things move under a still pointer while scrolling
  lenis.on("scroll", refreshCursor);

  onTick(() => {
    const kind = cursorState.get().kind;
    const target = pointer.active ? RADIUS[kind] : 0;
    const px = circle.x;
    const py = circle.y;
    const follow = kind === "lens" ? 0.14 : kind === "default" || kind === "link" ? 0.32 : 0.2;
    circle.x = lerp(circle.x, pointer.x, follow);
    circle.y = lerp(circle.y, pointer.y, follow);
    circle.vx = circle.x - px;
    circle.vy = circle.y - py;
    circle.r = lerp(circle.r, target, 0.16);

    lens.x = circle.x;
    lens.y = circle.y;
    lens.r = kind === "view" || kind === "lens" ? circle.r : Math.max(0, lens.r - 6);

    if (el) {
      const r = circle.r;
      el.style.transform = `translate3d(${circle.x - r}px, ${circle.y - r}px, 0)`;
      el.style.width = el.style.height = `${r * 2}px`;
    }
  });
}

/** The eased circle, for things that want to move with it. */
export const cursorCircle = circle;
