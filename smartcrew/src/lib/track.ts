import { config } from "../config";
import { attribution } from "./lead";
import { LOOK } from "./look";

// Meta Pixel, GA4, Microsoft Clarity, Mouseflow and Crisp chat, each loaded only when its ID is set in
// config.ts, and only on the real site (liveSite: never a *.vercel.app preview or a test host). Every
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
    _mfq?: unknown[];
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
  }
}

/** The real site: https, and not a preview (*.vercel.app) or a local/test host. Andrew's tags load
 *  only here, so our test visits never reach his ad account, recordings or chat inbox. */
export function liveSite(): boolean {
  const h = location.hostname;
  return location.protocol === "https:" && !!h && !/(^|\.)vercel\.app$|^localhost$|^127\.|^0\.0\.0\.0$|^\[?::1\]?$/.test(h);
}

export type TrackData = Record<string, string | number | boolean | undefined>;
export type StandardEvent = "Lead" | "Schedule" | "ViewContent" | "InitiateCheckout";

let started = false;

export function startTracking() {
  if (started) return;
  started = true;
  if (!liveSite()) return;
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
  if (config.clarityId) startClarity(config.clarityId);
  // Mouseflow's recordings start with the page (its own snippet, deferred)
  if (config.mouseflowId) {
    window._mfq = window._mfq || [];
    const s = document.createElement("script");
    s.defer = true;
    s.src = `https://cdn.mouseflow.com/projects/${config.mouseflowId}.js`;
    document.head.appendChild(s);
  }
  // Crisp's chat bubble waits until the first screen is done, so it never slows it down
  if (config.crispId) {
    const id = config.crispId;
    const go = () => startCrisp(id);
    if (document.readyState === "complete") window.setTimeout(go, 3000);
    else window.addEventListener("load", () => window.setTimeout(go, 3000), { once: true });
  }
}

let chatHidden = false;

function startCrisp(id: string) {
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = id;
  if (chatHidden) window.$crisp.push(["do", "chat:hide"]);
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://client.crisp.chat/l.js";
  document.head.appendChild(s);
}

/** Hide Crisp's bubble while the sign-up popup is open (on phones it would sit over its buttons). */
export function hideChat(hide: boolean) {
  chatHidden = hide;
  window.$crisp?.push(["do", hide ? "chat:hide" : "chat:show"]);
}

/**
 * Microsoft Clarity, tagged so its recordings line up with the click simulator's page model (which
 * splits the page by section id): which look, which ad, how far down by section, and which button
 * in which section was tapped.
 */
function startClarity(id: string) {
  // Clarity's own loader: queue calls until the tag arrives
  const c = function (...args: unknown[]) {
    (c.q = c.q || []).push(args);
  } as NonNullable<Window["clarity"]>;
  window.clarity = window.clarity || c;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${id}`;
  document.head.appendChild(s);
  const clarity = window.clarity;

  // the look (classic, glass or focus) and the ad, so heatmaps can be split by either
  clarity("set", "look", LOOK);
  const q = new URLSearchParams(location.search);
  const kept = attribution();
  for (const k of ["utm_source", "utm_campaign", "utm_content"] as const) {
    const v = q.get(k) || kept[k];
    if (v) clarity("set", k, v.slice(0, 255));
  }

  // how far down, by section: "reach_<id>" the first time a section crosses the middle of the
  // screen (pixel scroll depth varies too much by phone to compare)
  const reached = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const sid = (e.target as HTMLElement).id;
        if (!e.isIntersecting || reached.has(sid)) continue;
        reached.add(sid);
        clarity("event", `reach_${sid}`);
      }
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  const watched = new WeakSet<Element>();
  let queued = 0;
  const scan = () => {
    queued = 0;
    document.querySelectorAll("section.scene[id]").forEach((el) => {
      if (watched.has(el)) return;
      watched.add(el);
      io.observe(el);
    });
  };
  scan();
  new MutationObserver(() => (queued ||= requestAnimationFrame(scan))).observe(document.body, { childList: true, subtree: true });

  // every trial button and demo link, by where it was tapped: cta_trial:top, cta_trial:sticky,
  // cta_demo:faq… (the tap is seen on its way down, then named when the popup is asked for)
  let zone = "page";
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      zone = t.closest(".sticky-bar") ? "sticky" : t.closest("header") ? "header" : t.closest("section[id]")?.id || "page";
    },
    true,
  );
  window.addEventListener("smartcrew:signup", (e) => {
    const intent = (e as CustomEvent<{ intent?: string }>).detail?.intent ?? "trial";
    clarity("event", `cta_${intent}:${zone}`);
  });
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
  // Clarity events carry a name only: recordings can be filtered by "popup_open", "Lead" and so on;
  // a step rides in the name (step_complete_1, step_complete_2)
  window.clarity?.("event", d.step !== undefined ? `${name}_${d.step}` : name);
  echo(name, d);
}
