// One scroll loop for the whole page. Each section that moves with the scroll is registered here and
// gets its progress as a CSS variable (--p, 0 to 1), so the motion itself lives in the CSS.
//
//   "pin":  a tall section with a sticky stage inside: 0 when its top reaches the top of the screen,
//           1 when its bottom reaches the bottom.
//   "view": an ordinary block: 0 as its top comes up from the bottom of the screen, 1 when its middle
//           reaches the middle of the screen.

type Mode = "pin" | "view";
type Entry = { el: HTMLElement; mode: Mode; last: number; cb?: (p: number) => void };

const entries = new Set<Entry>();
let raf = 0;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function measure() {
  raf = 0;
  const vh = window.innerHeight;
  for (const e of entries) {
    const r = e.el.getBoundingClientRect();
    let p: number;
    if (e.mode === "pin") {
      const span = r.height - vh;
      p = span > 0 ? clamp(-r.top / span) : r.top <= 0 ? 1 : 0;
    } else {
      p = clamp((vh - r.top) / (vh / 2 + r.height / 2));
    }
    if (Math.abs(p - e.last) < 0.0005) continue;
    e.last = p;
    e.el.style.setProperty("--p", p.toFixed(4));
    e.cb?.(p);
  }
}

export const requestMeasure = () => {
  if (!raf) raf = requestAnimationFrame(measure);
};

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener("scroll", requestMeasure, { passive: true });
  window.addEventListener("resize", requestMeasure);
}

/** follow an element's scroll progress; returns the cleanup */
export function track(el: HTMLElement, mode: Mode, cb?: (p: number) => void): () => void {
  wire();
  const e: Entry = { el, mode, last: -1, cb };
  entries.add(e);
  requestMeasure();
  return () => entries.delete(e);
}
