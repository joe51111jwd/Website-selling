// What each item of Watch it work shows: its icon (the app's own outline set) and the two app
// screens the devices switch to (a web screen on the laptop, a phone screen on the phone), from
// the recreated screens in src/screens. Several items share a screen where no closer one exists.
// The two office-mobile pages (src/screens/phone/Office*) are the office app's phone layout, the
// spec sheet's (not in the registry); everything else is src/screens/registry.ts. Where a newer
// screen fits better (daily reports, safety, files, one machine's records) it is named first,
// with the older one it replaces as the fallback, so the section never points at a missing screen.

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { screenById } from "../../screens/registry";
import type { IconName } from "../../screens/kit/Icon";
import type { WatchTabId } from "../../content/watch";

const OWN: Record<string, () => Promise<{ default: ComponentType }>> = {
  "phone-office-plan": () => import("../../screens/phone/OfficePlan"),
  "phone-office-job": () => import("../../screens/phone/OfficeJob"),
};

const loader = (id: string) => OWN[id] ?? screenById(id)?.load;

/** The first of these screens that exists (the last one is the fallback). */
const pick = (...ids: string[]) => ids.find((id) => !!loader(id)) ?? ids[ids.length - 1];

export type Shot = { icon: IconName; web: string; phone: string };

export const SHOTS: Record<WatchTabId, Record<string, Shot>> = {
  // the crew's day: the crew app on the phone, what it lands in on the office laptop
  day: {
    plan: { icon: "calendar", web: "web-project-detail", phone: "phone-home" },
    clockin: { icon: "clock", web: "web-dashboard", phone: "phone-working" },
    inspect: { icon: "clipboardCheck", web: "web-equipment", phone: "phone-dot" },
    loads: { icon: "dumpTruck", web: "web-materials", phone: "phone-hauling" },
    chat: { icon: "messaging", web: "web-messaging", phone: "phone-working" },
    change: { icon: "fileText", web: "web-project-detail", phone: "phone-reports" },
    breakdown: { icon: "wrench", web: "web-service-queue", phone: "phone-reports" },
    report: { icon: "camera", web: pick("web-daily-reports", "web-project-detail"), phone: "phone-reports" },
    clockout: { icon: "logout", web: "web-timecards", phone: "phone-summary" },
  },
  // the admins' week: the office app, with the crew's phone where the plan reaches it
  week: {
    scheduling: { icon: "calendar", web: "web-scheduling", phone: "phone-office-plan" },
    // Andrew's comment-mode notes, Oct 20: "Show a push notification on mobile and the messaging
    // dispatch side on web", "Show change order screen on web", "Show add a project screen on
    // mobile", "Show Add Service Record on mobile", "Show project page on web"
    dispatch: { icon: "send", web: "web-messaging", phone: "phone-push" },
    crew: { icon: "users", web: "web-dashboard", phone: "phone-office-plan" },
    changes: { icon: "fileText", web: "web-project-changeorders", phone: "phone-office-job" },
    bids: { icon: "pipeline", web: "web-pipeline", phone: "phone-add-project" },
    shop: { icon: "wrench", web: "web-service-queue", phone: "phone-add-service" },
    projects: { icon: "projects", web: "web-project-detail", phone: "phone-office-job" },
    payroll: { icon: "cash", web: "web-timecards", phone: "phone-summary" },
    pto: { icon: "calendarOff", web: "web-scheduling", phone: "phone-home" },
  },
  // the owners' results: job costing first
  results: {
    costing: { icon: "trendingUp", web: "web-project-detail", phone: "phone-office-job" },
    materials: { icon: "receipt", web: "web-materials", phone: "phone-hauling" },
    fleet: { icon: "equipment", web: pick("web-machine", "web-equipment"), phone: "phone-dot" },
    pipeline: { icon: "pipeline", web: "web-pipeline", phone: "phone-office-job" },
    pto: { icon: "calendarOff", web: "web-scheduling", phone: "phone-home" },
    safety: { icon: "shieldCheck", web: pick("web-safety", "web-messaging"), phone: "phone-reports" },
    docs: { icon: "docs", web: pick("web-files", "web-project-detail"), phone: "phone-reports" },
  },
};

const FALLBACK: Shot = { icon: "dot", web: "web-dashboard", phone: "phone-home" };
export const shotFor = (tab: WatchTabId, id: string): Shot => SHOTS[tab][id] ?? FALLBACK;

const comps = new Map<string, LazyExoticComponent<ComponentType>>();
/** The screen's component (one lazy component per id, reused), or null for an unknown id. */
export function screenComp(id: string) {
  let c = comps.get(id);
  if (!c) {
    const load = loader(id);
    if (!load) return null;
    c = lazy(load);
    comps.set(id, c);
  }
  return c;
}

const warmed = new Map<string, Promise<unknown>>();
/** Fetch a screen's code ahead of mounting it (resolves when it's there, or failed). */
export function warmScreen(id: string) {
  let p = warmed.get(id);
  if (!p) {
    p = (loader(id)?.() ?? Promise.resolve()).catch(() => undefined);
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
