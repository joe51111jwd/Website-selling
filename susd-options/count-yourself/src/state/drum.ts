import { Spring } from '../motion/spring';
import { wake } from '../motion/loop';
import { getState, subscribe } from './store';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

/** The hero drum's continuous value (a spring toward the integer n) and its 14 → 15 jolt (degrees). */
export const drum = {
  n: new Spring(getState().n, 380, 28),
  jolt: new Spring(0, 1600, 56),
  /** True while the intro drives the drum's position directly (the spring is not stepped). */
  scripted: false,
};

let lastN = getState().n;
subscribe(() => {
  const { n, change } = getState();
  if (n === lastN) return;
  lastN = n;
  // During the intro the store follows the drum (not the other way round).
  if (change.from === 'intro' && drum.scripted) return;
  if (prefersReducedMotion()) drum.n.jump(n);
  else drum.n.target = n;
  wake();
});

/** One small kick (a 6° overshoot), only at 14 → 15. */
export function jolt() {
  if (prefersReducedMotion()) return;
  drum.jolt.x = 6;
  drum.jolt.v = 0;
  wake();
}
