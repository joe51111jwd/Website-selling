// Tiny external store for useSyncExternalStore (brief 8.2: no state library).
// Owner: A1.

export interface Store<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/** Read a query flag on the client (false during SSR). `?gl=0` -> queryFlag('gl') === '0' */
export function queryParam(name: string): string | null {
  if (!isBrowser) return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}
