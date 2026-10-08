// sheetStore: { current, visited } (brief 8.2, 4.3). Owner: A1.
// An IntersectionObserver on each sheet's [data-sheet] element with rootMargin -50% 0px -50% 0px
// sets `current` (the sheet crossing mid-viewport) and adds it to `visited`.

import { useSyncExternalStore } from 'react';
import { createStore, isBrowser } from './store';

export interface SheetState {
  current: string;
  visited: ReadonlySet<string>;
}

const SERVER: SheetState = { current: 'A-000', visited: new Set<string>() };
const store = createStore<SheetState>(SERVER);

let io: IntersectionObserver | null = null;
const elToId = new WeakMap<Element, string>();
const registered = new Map<string, Set<Element>>();

function ensureIO(): IntersectionObserver | null {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') return null;
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = elToId.get(e.target);
        if (id) sheetStore.setCurrent(id);
      }
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  );
  return io;
}

export const sheetStore = {
  get(): SheetState {
    return store.get();
  },
  subscribe(listener: () => void) {
    return store.subscribe(listener);
  },
  /** Set the current sheet (and mark it visited). Stage owners may call this directly. */
  setCurrent(id: string) {
    const s = store.get();
    if (s.current === id && s.visited.has(id)) return;
    const visited = s.visited.has(id) ? s.visited : new Set([...s.visited, id]);
    store.set({ current: id, visited });
  },
  markVisited(id: string) {
    const s = store.get();
    if (s.visited.has(id)) return;
    store.set({ current: s.current, visited: new Set([...s.visited, id]) });
  },
  /**
   * Observe an element as sheet `id`. Returns an unregister fn. <SheetTag> calls this with its
   * closest [data-sheet] ancestor; the app shell also registers every [data-sheet] on mount.
   */
  register(id: string, el: Element | null): () => void {
    if (!el) return () => {};
    const obs = ensureIO();
    if (!obs) return () => {};
    if (elToId.get(el) === id) return () => {};
    elToId.set(el, id);
    let set = registered.get(id);
    if (!set) registered.set(id, (set = new Set()));
    set.add(el);
    obs.observe(el);
    return () => {
      obs.unobserve(el);
      elToId.delete(el);
      set?.delete(el);
    };
  },
  /** Register every [data-sheet] element under root (idempotent). */
  scan(root: ParentNode = document) {
    if (!isBrowser) return;
    root.querySelectorAll<HTMLElement>('[data-sheet]').forEach((el) => {
      const id = el.dataset.sheet;
      if (id) sheetStore.register(id, el);
    });
  },
  /** The primary element registered for a sheet id (first registered), if any. */
  elementOf(id: string): Element | null {
    const set = registered.get(id);
    if (set && set.size) return set.values().next().value ?? null;
    if (!isBrowser) return null;
    return document.querySelector(`[data-sheet="${id}"]`);
  },
};

const getServer = () => SERVER;

export function useSheet(): SheetState {
  return useSyncExternalStore(sheetStore.subscribe, sheetStore.get, getServer);
}
