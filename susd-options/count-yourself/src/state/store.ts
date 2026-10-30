import { useSyncExternalStore } from 'react';
import { clampN } from '../zones';

export type Source = 'init' | 'intro' | 'user' | 'bar' | 'button' | 'skip';
export type Origin = { x: number; y: number };
export type Change = { n: number; prev: number; from: Source; origin?: Origin; seq: number };

export type State = {
  n: number;
  /** boot: before the intro starts; intro: the scripted count; ready: the visitor is in charge. */
  phase: 'boot' | 'intro' | 'ready';
  /** The "Past twelve, something breaks." stamp during the intro. */
  stamp: boolean;
  change: Change;
  /** Bumps to ask the window caret to blink twice. */
  caret: number;
  /** True while the hero is out of view (the chip shows). */
  heroGone: boolean;
  /** True once the visitor has set a number themselves (or opened a ?team= link). */
  touched: boolean;
};

let state: State = {
  n: 8,
  phase: 'boot',
  stamp: false,
  change: { n: 8, prev: 8, from: 'init', seq: 0 },
  caret: 0,
  heroGone: false,
  touched: false,
};
const subs = new Set<() => void>();
let seq = 0;

export const getState = () => state;
export function setState(patch: Partial<State>) {
  const prevPhase = state.phase;
  state = { ...state, ...patch };
  if (state.phase !== prevPhase && typeof document !== 'undefined') document.documentElement.dataset.phase = state.phase;
  subs.forEach((f) => f());
}
export function subscribe(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

const BY_VISITOR: Source[] = ['user', 'bar', 'button'];

export function setN(raw: number, from: Source = 'user', origin?: Origin) {
  const n = clampN(raw);
  const touched = state.touched || BY_VISITOR.includes(from);
  if (n === state.n && from !== 'init') {
    if (touched !== state.touched) setState({ touched });
    return;
  }
  setState({ n, touched, change: { n, prev: state.n, from, origin, seq: ++seq } });
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}
