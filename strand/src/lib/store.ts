import { useSyncExternalStore } from "react";

// One small store for the UI: what's open, what's hovered, what's in the queue.

export type QueueItem = { id: string; slug: string; filament: string; size: "S" | "M" | "L" };

type State = {
  inspect: string | null; // product slug open in the inspector
  hover: string | null; // station hovered on the page
  queue: QueueItem[];
  queueOpen: boolean;
  ready: boolean; // preloader finished
};

const KEY = "strand-queue";
const load = (): QueueItem[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

let state: State = { inspect: null, hover: null, queue: load(), queueOpen: false, ready: false };
const subs = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    if (patch.queue) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state.queue));
      } catch {
        /* private mode: the queue just won't persist */
      }
    }
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
};

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => pick(state), () => pick(state));
}

export function addToQueue(item: Omit<QueueItem, "id">, open = true) {
  store.set({ queue: [...state.queue, { ...item, id: Math.random().toString(36).slice(2, 9) }], queueOpen: open || state.queueOpen });
}

export function removeFromQueue(id: string) {
  store.set({ queue: state.queue.filter((q) => q.id !== id) });
}

// The inspector is a hash route (#/p/<slug>) so it can be linked and closed with Back.
// Opening from the page pushes one history entry; switching pieces inside replaces it,
// and closing steps back, so Back never reopens what was just closed.
let pushed = false;

// history can be off-limits (sandboxed frames); the inspector still works without the URL
const nav = (fn: () => void) => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};

export function openInspector(slug: string) {
  const url = `#/p/${slug}`;
  if (location.hash !== url) {
    if (state.inspect) nav(() => history.replaceState(null, "", url));
    else pushed = nav(() => history.pushState(null, "", url));
  }
  store.set({ inspect: slug });
}

export function closeInspector() {
  store.set({ inspect: null });
  if (!location.hash.startsWith("#/p/")) return;
  if (pushed) {
    pushed = false;
    nav(() => history.back());
  } else nav(() => history.replaceState(null, "", location.pathname + location.search));
}

export function syncFromHash() {
  const m = location.hash.match(/^#\/p\/([\w-]+)/);
  if (!m) pushed = false;
  store.set({ inspect: m ? m[1] : null });
}
