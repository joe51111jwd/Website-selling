// The live app screens the click-through shows: the shared ones from src/screens/registry.ts and
// the two office-mobile pages this section adds (src/screens/phone/Office*). One lazy component
// per id, so a screen's code is fetched once and the same component is reused.

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { screenById } from "../../screens/registry";

const OWN: Record<string, () => Promise<{ default: ComponentType }>> = {
  "phone-office-job": () => import("../../screens/phone/OfficeJob"),
  "phone-office-plan": () => import("../../screens/phone/OfficePlan"),
};

const loaders = (id: string) => OWN[id] ?? screenById(id)?.load;

const comps = new Map<string, LazyExoticComponent<ComponentType>>();

export function screenComp(id: string) {
  let c = comps.get(id);
  if (!c) {
    const load = loaders(id);
    if (!load) throw new Error(`spec sheet: no screen ${id}`);
    c = lazy(load);
    comps.set(id, c);
  }
  return c;
}

const warmed = new Map<string, Promise<unknown>>();
/** Fetch a screen's code ahead of showing it (resolves when it's there). */
export function warmScreen(id: string) {
  let p = warmed.get(id);
  if (!p) {
    p = loaders(id)?.() ?? Promise.resolve();
    warmed.set(id, p);
  }
  return p;
}

/** Run `fn` when the main thread is idle (or soon, where requestIdleCallback is missing). */
export function idle(fn: () => void, timeout = 1200) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
  if (w.requestIdleCallback) {
    const h = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(h);
  }
  const t = window.setTimeout(fn, 60);
  return () => window.clearTimeout(t);
}
