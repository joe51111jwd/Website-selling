// heroMachine (brief 8.2): the cover's state, as a tiny external store. Owner: A2.
//
//   waiting -> paying-out -> armed -> pulling -> snapped -> film -> frozen -> swinging -> rest
//
// Events: ready, release, autoSnap, filmEnded, filmError, glReady, glFail, skip, reset.
// The controller (CoverStage) drives the visuals; this store only records where we are, so other
// sheets can read it. A-105 (A4) reads heroMachine.get().snappedByUser (brief F9: "you already
// snapped one line of it" only if the visitor really snapped). Safe to import during the prerender.

import { useSyncExternalStore } from 'react';

export type HeroState =
  | 'waiting'
  | 'paying-out'
  | 'armed'
  | 'pulling'
  | 'snapped'
  | 'film'
  | 'frozen'
  | 'swinging'
  | 'rest';

export type HeroEvent =
  | 'ready'
  | 'payoutEnd'
  | 'grab'
  | 'release'
  | 'autoSnap'
  | 'impact'
  | 'filmStart'
  | 'filmEnded'
  | 'filmError'
  | 'glReady'
  | 'glFail'
  | 'swingEnd'
  | 'skip'
  | 'reset';

export interface HeroSnapshot {
  state: HeroState;
  /** true once the visitor snapped the line themselves (pointer, tap, Space or Enter), never for auto-snap */
  snappedByUser: boolean;
  /** number of lines deposited on the slab so far (max 4 kept) */
  deposits: number;
  /** the 3D VIEW is live (GL freeze scene showing) */
  gl: boolean;
}

const INITIAL: HeroSnapshot = { state: 'waiting', snappedByUser: false, deposits: 0, gl: false };

let snap: HeroSnapshot = INITIAL;
const listeners = new Set<() => void>();

function set(next: Partial<HeroSnapshot>) {
  const merged = { ...snap, ...next };
  if (
    merged.state === snap.state &&
    merged.snappedByUser === snap.snappedByUser &&
    merged.deposits === snap.deposits &&
    merged.gl === snap.gl
  )
    return;
  snap = merged;
  listeners.forEach((l) => l());
}

/** Allowed transitions; anything else is ignored (so stray events can't break the sequence). */
const NEXT: Partial<Record<HeroState, Partial<Record<HeroEvent, HeroState>>>> = {
  waiting: { ready: 'paying-out', skip: 'rest', release: 'snapped', autoSnap: 'snapped' },
  'paying-out': { payoutEnd: 'armed', grab: 'pulling', release: 'snapped', autoSnap: 'snapped', skip: 'rest' },
  armed: { grab: 'pulling', release: 'snapped', autoSnap: 'snapped', skip: 'rest' },
  pulling: { release: 'snapped', skip: 'rest' },
  snapped: { impact: 'snapped', filmStart: 'film', filmError: 'frozen', filmEnded: 'frozen', skip: 'rest' },
  film: { filmEnded: 'frozen', filmError: 'frozen', skip: 'rest' },
  frozen: { glReady: 'swinging', glFail: 'rest', swingEnd: 'rest', skip: 'rest', reset: 'armed' },
  swinging: { swingEnd: 'rest', glFail: 'rest', skip: 'rest', reset: 'armed' },
  rest: { reset: 'armed', glReady: 'rest', glFail: 'rest' },
};

export const heroMachine = {
  get(): HeroSnapshot {
    return snap;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Send an event. `byUser` marks a user-initiated release (pointer, tap, key). */
  send(event: HeroEvent, opts: { byUser?: boolean } = {}): HeroState {
    const to = NEXT[snap.state]?.[event];
    if (!to) return snap.state;
    const patch: Partial<HeroSnapshot> = { state: to };
    if (event === 'release' && opts.byUser) patch.snappedByUser = true;
    if (event === 'impact') patch.deposits = Math.min(4, snap.deposits + 1);
    set(patch);
    return to;
  },
  /** Force a state (capture seeks, MOTION toggles). */
  force(state: HeroState, extra: Partial<Omit<HeroSnapshot, 'state'>> = {}) {
    set({ state, ...extra });
  },
  setGl(gl: boolean) {
    set({ gl });
  },
  /** Test/capture helper. */
  resetAll() {
    snap = INITIAL;
    listeners.forEach((l) => l());
  },
};

const getServer = () => INITIAL;

export function useHeroMachine(): HeroSnapshot {
  return useSyncExternalStore(heroMachine.subscribe, heroMachine.get, getServer);
}

export default heroMachine;
