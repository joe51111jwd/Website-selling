// FLIP helper: measure, mutate, invert, play (WAAPI). Boxes are in a shared local space
// (offset chains), so a rotated sheet does not skew the deltas.
import { boxWithin, type Box } from '../marks/measure';

export type Snapshot = Map<string, Box>;

/** Records the local box of every [data-w] token inside root. */
export function snapshot(root: HTMLElement): Snapshot {
  const m: Snapshot = new Map();
  root.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => m.set(el.dataset.w!, boxWithin(el, root)));
  return m;
}

/**
 * Plays every [data-w] token from its previous box to where it is now.
 * arcs[w] lifts that token along a quadratic arc (negative = up and over).
 */
export function flipAll(
  root: HTMLElement,
  prev: Snapshot,
  opts: { duration: number; easing: string; delay?: number; arcs?: Record<string, number> },
): Animation[] {
  const out: Animation[] = [];
  root.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => {
    const w = el.dataset.w!;
    const a = prev.get(w);
    if (!a) return;
    const b = boxWithin(el, root);
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const arc = opts.arcs?.[w] ?? 0;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && !arc) return;
    const frames: Keyframe[] = [];
    const steps = arc ? 16 : 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lift = arc * 4 * t * (1 - t);
      frames.push({ transform: `translate(${(dx * (1 - t)).toFixed(2)}px, ${(dy * (1 - t) + lift).toFixed(2)}px)`, offset: t });
    }
    out.push(el.animate(frames, { duration: opts.duration, easing: opts.easing, delay: opts.delay ?? 0, fill: 'backwards' }));
  });
  return out;
}

export const settled = (anims: (Animation | null | undefined)[]) =>
  Promise.all(anims.filter(Boolean).map((a) => a!.finished.catch(() => undefined))).then(() => undefined);
