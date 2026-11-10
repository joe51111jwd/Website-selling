/* Shared requestAnimationFrame loop.
   Every effect registers a tick(); the loop only runs while at least one
   subscriber is active and the document is visible. */

const subs = new Set();
let raf = 0;
let last = 0;
let started = false;

function frame(now) {
  raf = 0;
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
  last = now;
  let any = false;
  for (const s of subs) {
    if (s.active()) {
      any = true;
      s.tick(now / 1000, dt);
    }
  }
  if (any && !document.hidden) raf = requestAnimationFrame(frame);
  else last = 0;
}

export function wake() {
  if (!raf && !document.hidden && started) raf = requestAnimationFrame(frame);
}

export function subscribe(sub) {
  subs.add(sub);
  wake();
  return () => subs.delete(sub);
}

function onVis() {
  if (document.hidden) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  } else wake();
}

export function startLoop() {
  if (started) return;
  started = true;
  document.addEventListener('visibilitychange', onVis);
  wake();
}

export function stopLoop() {
  started = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  subs.clear();
  document.removeEventListener('visibilitychange', onVis);
}
