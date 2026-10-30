// A small keyframe scheduler and tween runner on the shared rAF loop.
import { subscribe, wake } from './loop';
import { type Ease, linear } from './ease';

interface Job {
  start: number; // ms, loop time
  dur: number;
  ease: Ease;
  update?: (v: number) => void;
  done?: () => void;
  cancelled?: boolean;
  started?: boolean;
}

const jobs = new Set<Job>();
let clock = 0;
let unsub: (() => void) | null = null;

function ensure() {
  if (!unsub) {
    unsub = subscribe((now) => {
      clock = now;
      for (const j of Array.from(jobs)) {
        if (j.cancelled) {
          jobs.delete(j);
          continue;
        }
        if (now < j.start) continue;
        const p = j.dur <= 0 ? 1 : Math.min(1, (now - j.start) / j.dur);
        j.started = true;
        j.update?.(j.ease(p));
        if (p >= 1) {
          jobs.delete(j);
          j.done?.();
        }
      }
      return jobs.size > 0;
    });
  }
  wake();
}

export interface Handle {
  cancel(): void;
}

export function now() {
  return clock || performance.now();
}

/** Tween 0..1 (eased) over dur ms after delay ms. */
export function tween(dur: number, update: (v: number) => void, opts: { delay?: number; ease?: Ease; done?: () => void } = {}): Handle {
  const j: Job = { start: performance.now() + (opts.delay ?? 0), dur, ease: opts.ease ?? linear, update, done: opts.done };
  jobs.add(j);
  ensure();
  return { cancel: () => (j.cancelled = true) };
}

/** Run fn after ms on the loop clock. */
export function after(ms: number, fn: () => void): Handle {
  return tween(0, () => {}, { delay: ms, done: fn });
}

/** A group of timers that can be cancelled together. */
export class Timeline {
  private handles: Handle[] = [];
  at(ms: number, fn: () => void) {
    this.handles.push(after(ms, fn));
    return this;
  }
  tween(dur: number, update: (v: number) => void, opts: { delay?: number; ease?: Ease; done?: () => void } = {}) {
    this.handles.push(tween(dur, update, opts));
    return this;
  }
  cancel() {
    this.handles.forEach((h) => h.cancel());
    this.handles = [];
  }
}
