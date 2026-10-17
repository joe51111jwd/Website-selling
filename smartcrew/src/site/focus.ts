// The focus look (src/lib/look.ts): one point at a time. The section that fills most of the screen
// is "in focus" (section.scene.is-focus); src/styles/focus.css lets the others go quiet round it.
// Nothing is hidden or disabled: a quiet section is only dimmed, and it still takes taps.
//
// Sections mount late (src/App.tsx), so the list is re-read (once a frame at most) whenever the page's
// DOM gains nodes. The footer never goes quiet: it is the page's last word, often shorter than half a
// screen, and would otherwise never win.

const SEEN = new Map<Element, number>();
let current: Element | null = null;

function pick() {
  let best: Element | null = null;
  let most = 0;
  for (const [el, px] of SEEN) {
    if (px > most) {
      most = px;
      best = el;
    }
  }
  if (!best || best === current) return;
  current?.classList.remove("is-focus");
  best.classList.add("is-focus");
  current = best;
  document.documentElement.dataset.focus = (best as HTMLElement).dataset.scene ?? "";
}

// html[data-focus] (the section's id) is only set once a section has won, so the first paint is
// never dimmed.
export function startFocus() {
  // one step per 5% of a section's height: enough to follow the scroll without a callback per pixel
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) SEEN.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
      pick();
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  );
  const watched = new WeakSet<Element>();
  let queued = 0;
  const scan = () => {
    queued = 0;
    document.querySelectorAll("main.site section.scene").forEach((el) => {
      if (watched.has(el) || el.id === "footer") return;
      watched.add(el);
      io.observe(el);
    });
  };
  scan();
  new MutationObserver(() => (queued ||= requestAnimationFrame(scan))).observe(document.getElementById("root") ?? document.body, {
    childList: true,
    subtree: true,
  });
}
