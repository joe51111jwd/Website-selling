import { config } from "../config";

// Meta Pixel and GA4, loaded only when their IDs are set in config.ts.

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

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
}

/** A standard Meta event (Lead, Schedule, ViewContent…) mirrored to GA4. */
export function track(event: "Lead" | "Schedule" | "ViewContent" | "InitiateCheckout", data: Record<string, string> = {}) {
  window.fbq?.("track", event, data);
  window.gtag?.("event", event.toLowerCase(), data);
}
