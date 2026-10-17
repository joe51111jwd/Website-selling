import { config } from "../config";
import { LOOK } from "./look";

// Meta Pixel, GA4 and Microsoft Clarity, each loaded only when its ID is set in config.ts. Every
// event is also re-dispatched on window as "smartcrew:track" so QA scripts (and a future CAPI relay)
// can see it.

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

export type TrackData = Record<string, string | number | boolean | undefined>;
export type StandardEvent = "Lead" | "Schedule" | "ViewContent" | "InitiateCheckout";

let started = false;

export function startTracking() {
  if (started) return;
  started = true;
  if (config.metaPixelId) {
    const f = function (...args: unknown[]) {
      if (f.callMethod) f.callMethod(...args);
      else f.queue!.push(args);
    } as Fbq;
    f.queue = [];
    f.loaded = true;
    f.version = "2.0";
    f.push = f;
    window.fbq = window._fbq = f;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", config.metaPixelId);
    window.fbq("track", "PageView");
  }
  if (config.gaId) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => window.dataLayer!.push(args);
    window.gtag("js", new Date());
    window.gtag("config", config.gaId);
  }
  if (config.clarityId) {
    // Clarity's own loader: queue calls until the tag arrives
    const c = function (...args: unknown[]) {
      (c.q = c.q || []).push(args);
    } as NonNullable<Window["clarity"]>;
    window.clarity = window.clarity || c;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${config.clarityId}`;
    document.head.appendChild(s);
    // so heatmaps and recordings can be split by look (classic vs glass)
    window.clarity("set", "look", LOOK);
  }
}

const clean = (d: TrackData) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== ""));

function echo(event: string, data: TrackData, eventID?: string) {
  try {
    window.dispatchEvent(new CustomEvent("smartcrew:track", { detail: { event, data, eventID } }));
  } catch {
    /* old browsers without CustomEvent constructor */
  }
}

/**
 * A standard Meta event (Lead, Schedule, ViewContent…) mirrored to GA4. Pass `eventID` (the lead id
 * or the Cal.com booking uid) so a server-side Conversions API event can be deduplicated against it.
 */
export function track(event: StandardEvent, data: TrackData = {}, eventID?: string) {
  const d = clean(data);
  if (eventID) window.fbq?.("track", event, d, { eventID });
  else window.fbq?.("track", event, d);
  window.gtag?.("event", event.toLowerCase(), eventID ? { ...d, event_id: eventID } : d);
  window.clarity?.("event", event);
  echo(event, d, eventID);
}

/** A funnel step that isn't a Meta standard event (popup_open, step_complete…). */
export function trackCustom(name: string, data: TrackData = {}) {
  const d = clean(data);
  window.fbq?.("trackCustom", name, d);
  window.gtag?.("event", name, d);
  // Clarity events carry a name only: recordings can be filtered by "popup_open", "Lead" and so on
  window.clarity?.("event", name);
  echo(name, d);
}
