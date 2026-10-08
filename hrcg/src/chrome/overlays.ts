// Open/close state for the chrome overlays (INDEX dialog, phone title-block sheet, THE SET).
// Overlays carry data-lenis-prevent and stop Lenis while open (brief 4.3). Owner: A1.

import { useSyncExternalStore } from 'react';
import { createStore } from '../system/store';
import { lockScroll, unlockScroll } from '../system/lenis';

export type OverlayId = 'index' | 'title-sheet' | 'the-set';

const store = createStore<OverlayId | null>(null);
let returnFocus: HTMLElement | null = null;

export const overlays = {
  get: () => store.get(),
  subscribe: store.subscribe,
  open(id: OverlayId, trigger?: HTMLElement | null) {
    returnFocus = trigger ?? (document.activeElement as HTMLElement | null);
    const prev = store.get();
    if (prev) unlockScroll(`overlay:${prev}`);
    lockScroll(`overlay:${id}`);
    store.set(id);
  },
  close(opts: { restoreFocus?: boolean } = {}) {
    const prev = store.get();
    if (!prev) return;
    unlockScroll(`overlay:${prev}`);
    store.set(null);
    if (opts.restoreFocus !== false && returnFocus && document.contains(returnFocus)) {
      returnFocus.focus({ preventScroll: true });
    }
    returnFocus = null;
  },
};

const server = () => null;

export function useOverlay(): OverlayId | null {
  return useSyncExternalStore(overlays.subscribe, overlays.get, server);
}

/** Open INDEX (header link, phone bar). Exported for other agents' "index" links. */
export function openIndex(trigger?: HTMLElement | null) {
  overlays.open('index', trigger);
}
