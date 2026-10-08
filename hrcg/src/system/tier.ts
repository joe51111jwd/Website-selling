// tier: { gl, lite } (brief 8.2). Owner: A1.
//   gl   WebGL2 available (and not ?gl=0)
//   lite pointer coarse, width < 768, (navigator.deviceMemory ?? 4) < 4, or saveData (or ?lite=1)
// Runtime demotion (the hero's frame-time monitor) can only turn flags OFF.
// Server snapshot is { gl: false, lite: false }; real values arrive after hydration.

import { useSyncExternalStore } from 'react';
import { createStore, isBrowser, queryParam } from './store';

export interface Tier {
  gl: boolean;
  lite: boolean;
}

const SERVER: Tier = { gl: false, lite: false };
const store = createStore<Tier>(SERVER);
let started = false;

function detectGL(): boolean {
  if (queryParam('gl') === '0') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    // free the probe context at once: one WebGL context at a time (H9)
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectLite(): boolean {
  if (queryParam('lite') === '1') return true;
  if (queryParam('lite') === '0') return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  let coarse = false;
  try {
    coarse = window.matchMedia('(pointer: coarse)').matches;
  } catch {
    /* ignore */
  }
  return (
    coarse || window.innerWidth < 768 || (nav.deviceMemory ?? 4) < 4 || nav.connection?.saveData === true
  );
}

function start() {
  if (started || !isBrowser) return;
  started = true;
  store.set({ gl: detectGL(), lite: detectLite() });
}

let demotedLite = false;

export const tierStore = {
  get(): Tier {
    start();
    return store.get();
  },
  subscribe(listener: () => void) {
    start();
    return store.subscribe(listener);
  },
  /** Demote at runtime: demote({ gl: false }) or demote({ lite: true }). Never promotes gl. */
  demote(flags: Partial<Tier>) {
    start();
    const cur = store.get();
    const next: Tier = {
      gl: flags.gl === false ? false : cur.gl,
      lite: flags.lite === true ? true : cur.lite,
    };
    if (flags.lite === true) demotedLite = true;
    if (next.gl !== cur.gl || next.lite !== cur.lite) store.set(next);
  },
  /** Re-evaluate lite on resize (crossing 768 px), unless the hero demoted it. */
  refresh() {
    if (!isBrowser || demotedLite) return;
    const lite = detectLite();
    const cur = store.get();
    if (lite !== cur.lite) store.set({ ...cur, lite });
  },
};

const getServer = () => SERVER;

export function useTier(): Tier {
  return useSyncExternalStore(tierStore.subscribe, tierStore.get, getServer);
}
