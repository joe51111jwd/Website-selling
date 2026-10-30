// One requestAnimationFrame loop for the whole page.
// Subscribers return true while they still need frames; the loop sleeps when nobody does,
// and while the tab is hidden. Anything that starts moving calls wake().
// There is never more than one pending frame: wake() during a frame only extends the run.
export type Tick = (now: number, dt: number) => boolean | void;

const subs = new Set<Tick>();
let raf = 0;
let last = 0;
let keepFrames = 0;
let inFrame = false;

function request() {
  if (!raf && !inFrame && !document.hidden) raf = requestAnimationFrame(frame);
}

function frame(now: number) {
  raf = 0;
  inFrame = true;
  const dt = Math.min(64, last ? now - last : 16.7);
  last = now;
  let busy = false;
  for (const fn of Array.from(subs)) {
    try {
      if (fn(now, dt)) busy = true;
    } catch (err) {
      console.warn(err);
    }
  }
  if (keepFrames > 0) {
    keepFrames--;
    busy = true;
  }
  inFrame = false;
  if (busy) request();
  else last = 0;
}

export function wake(frames = 2) {
  keepFrames = Math.max(keepFrames, frames);
  request();
}

export function subscribe(fn: Tick): () => void {
  subs.add(fn);
  wake();
  return () => {
    subs.delete(fn);
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else wake();
  });
}
