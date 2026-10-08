// prefs: { motion } (brief 8.2, 4.3 MOTION toggle). Owner: A1.
// The head script decides the first-paint state (the `rm` class); this store reads it after
// hydration, so React's first render stays state-agnostic (server snapshot = motion on).

import { useSyncExternalStore } from 'react';
import { createStore, isBrowser } from './store';
import { MOTION_STORAGE_KEY } from './headScript';

export interface Prefs {
  motion: boolean;
}

const SERVER: Prefs = { motion: true };

function readInitial(): Prefs {
  if (!isBrowser) return SERVER;
  return { motion: !document.documentElement.classList.contains('rm') };
}

const store = createStore<Prefs>(SERVER);
let started = false;

function hasStoredChoice(): boolean {
  try {
    const v = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return v === 'on' || v === 'off';
  } catch {
    return false;
  }
}

function start() {
  if (started || !isBrowser) return;
  started = true;
  store.set(readInitial());
  // Follow the OS setting live, unless the visitor made an explicit choice.
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', () => {
      if (!hasStoredChoice()) applyMotion(!mq.matches, false);
    });
  } catch {
    /* old browsers */
  }
}

type AnchorFn = () => (() => void) | void;
let anchorKeeper: AnchorFn | null = null;

/** Registered by the app shell: records the reader's sheet anchor and returns a restore fn. */
export function setMotionAnchorKeeper(fn: AnchorFn | null) {
  anchorKeeper = fn;
}

function applyMotion(on: boolean, persist: boolean) {
  const restore = anchorKeeper ? anchorKeeper() : undefined;
  document.documentElement.classList.toggle('rm', !on);
  if (persist) {
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode: preference lasts for this page only */
    }
  }
  store.set({ motion: on });
  if (restore) {
    // after React and layout settle (stages switch between pinned and static)
    requestAnimationFrame(() => requestAnimationFrame(() => restore()));
  }
}

export const prefsStore = {
  get(): Prefs {
    start();
    return store.get();
  },
  subscribe(listener: () => void) {
    start();
    return store.subscribe(listener);
  },
  /** MOTION toggle. Persists (try/catch), mirrors the `rm` class, keeps the reader on the same sheet. */
  setMotion(on: boolean) {
    start();
    if (store.get().motion === on) return;
    applyMotion(on, true);
  },
  toggleMotion() {
    prefsStore.setMotion(!prefsStore.get().motion);
  },
};

const getServer = () => SERVER;

/** { motion } — false under prefers-reduced-motion (no stored choice) or MOTION OFF. */
export function usePrefs(): Prefs {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.get, getServer);
}

/** Non-React read, for effects and engines. */
export function motionEnabled(): boolean {
  return prefsStore.get().motion;
}
