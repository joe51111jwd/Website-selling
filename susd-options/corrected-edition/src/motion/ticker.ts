// The page's one requestAnimationFrame loop. Subscribers return true to keep running.
// The loop stops when nothing is moving and pauses while the tab is hidden.
type Sub = (now: number) => boolean;
const subs = new Set<Sub>();
let raf = 0;

function frame(now: number) {
  raf = 0;
  for (const s of Array.from(subs)) {
    if (!s(now)) subs.delete(s);
  }
  if (subs.size && !document.hidden) raf = requestAnimationFrame(frame);
}

export function tick(fn: Sub): () => void {
  subs.add(fn);
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  return () => {
    subs.delete(fn);
  };
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  } else if (subs.size && !raf) {
    raf = requestAnimationFrame(frame);
  }
});
