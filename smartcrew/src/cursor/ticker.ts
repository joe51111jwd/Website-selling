// One requestAnimationFrame loop for the cursor and the magnets. Each task reads layout first
// (all tasks), then writes (all tasks), so a frame never interleaves reads and writes. The loop
// sleeps as soon as no task reports motion, and anything that changes input calls wake().

export type Task = {
  /** Layout reads only (getBoundingClientRect, getAttribute, elementFromPoint). */
  read?: (now: number) => void;
  /** Style writes only. Return true while still moving, to keep the loop running. */
  write: (dt: number, now: number) => boolean;
};

const tasks = new Set<Task>();
let raf = 0;
let last = 0;

function frame(now: number) {
  raf = 0;
  // first frame after a sleep runs at a nominal 60 Hz step; long stalls are clamped
  const dt = last ? Math.min((now - last) / 1000, 1 / 24) : 1 / 60;
  last = now;
  for (const t of tasks) t.read?.(now);
  let busy = false;
  for (const t of tasks) if (t.write(dt, now)) busy = true;
  if (busy) raf = requestAnimationFrame(frame);
  else last = 0;
}

export function wake() {
  if (!raf && tasks.size) raf = requestAnimationFrame(frame);
}

export function addTask(t: Task) {
  tasks.add(t);
  wake();
  return () => {
    tasks.delete(t);
    if (!tasks.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  };
}
