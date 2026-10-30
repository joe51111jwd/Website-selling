import { useSyncExternalStore } from 'react';

export function matches(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const PHONE = '(max-width: 700px)';
