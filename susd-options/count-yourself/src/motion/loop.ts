// One requestAnimationFrame loop for the whole page. Tickers return true while they still need frames;
// the loop sleeps when nothing is moving and when the tab is hidden.
export type Tick = (dt: number, now: number) => boolean | void;

const ticks = new Set<Tick>();
// Drivers run before every other ticker in a frame (the scripted intro writes the drum's position
// before the drum renders it).
const drivers = new Set<Tick>();
let raf = 0;
let last = 0;
let hidden = typeof document !== 'undefined' ? document.hidden : false;

function frame(now: number) {
  raf = 0;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  last = now;
  let active = false;
  for (const t of Array.from(drivers)) if (t(dt, now)) active = true;
  for (const t of Array.from(ticks)) if (t(dt, now)) active = true;
  if (active && !hidden) raf = requestAnimationFrame(frame);
  else last = 0;
}

export function wake() {
  if (!raf && !hidden) {
    last = 0;
    raf = requestAnimationFrame(frame);
  }
}

export function addTick(t: Tick, driver = false): () => void {
  const set = driver ? drivers : ticks;
  set.add(t);
  wake();
  return () => {
    set.delete(t);
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else wake();
  });
}
