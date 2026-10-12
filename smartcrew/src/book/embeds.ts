import { config } from "../config";
import type { Booking, Lead } from "../lib/lead";

// Third-party embeds on /book, loaded the way their vendors ship them: Cal.com's inline embed
// (Andrew's calendar, prefilled from the popup) and Vidalytics (Andrew's walkthrough video, as on
// smartcrewhq.com/demo). Nothing personal ever goes in a URL; prefill goes through Cal's config.

// ─── Cal.com ─────────────────────────────────────────────────────────────────

type CalFn = ((...args: unknown[]) => void) & { ns: Record<string, (...args: unknown[]) => void>; loaded?: boolean; q?: unknown[] };
declare global {
  interface Window {
    Cal?: CalFn;
  }
}

/** Cal.com's own loader snippet (embed-snippet), typed. Queues calls until embed.js arrives. */
function calSnippet(): CalFn {
  const w = window as unknown as Record<string, unknown> & Window;
  if (!w.Cal) {
    const A = "https://app.cal.com/embed/embed.js";
    const L = "init";
    const push = (a: { q: unknown[] }, ar: unknown) => a.q.push(ar);
    const cal = function (...ar: unknown[]) {
      const c = w.Cal as CalFn & { q: unknown[] };
      if (!c.loaded) {
        c.ns = {};
        c.q = c.q || [];
        document.head.appendChild(document.createElement("script")).src = A;
        c.loaded = true;
      }
      if (ar[0] === L) {
        const api = function (...args: unknown[]) {
          push(api as unknown as { q: unknown[] }, args);
        } as unknown as ((...args: unknown[]) => void) & { q: unknown[] };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          c.ns[namespace] = c.ns[namespace] || api;
          push(c.ns[namespace] as unknown as { q: unknown[] }, ar);
          push(c, ["initNamespace", namespace]);
        } else push(c, ar);
        return;
      }
      push(c, ar);
    } as unknown as CalFn;
    w.Cal = cal;
  }
  return w.Cal!;
}

/** "6–20" → "6-20" for Cal's plain text question. */
const plain = (s?: string) => s?.replace(/–/g, "-");

export function calPrefill(lead: Lead | null): Record<string, string> {
  if (!lead) return {};
  const a = lead.attribution ?? {};
  const est = lead.estimate;
  const c: Record<string, string | undefined> = {
    name: lead.name,
    email: lead.email,
    attendeePhoneNumber: lead.phone_e164,
    // Cal's own SMS-reminder field only when the visitor ticked our consent box
    smsReminderNumber: lead.sms ? lead.phone_e164 : undefined,
    // Andrew's booking questions, by identifier (verified on his event 2026-10-12). His "notes"
    // field is the "What tech are you currently using?" question, so it is left for him to answer.
    companyname: lead.company,
    crewsize: plain(lead.size),
    // his hidden attribution fields
    fbclid: a.fbclid,
    fbc: a.fbc,
    fbp: a.fbp,
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    utm_content: a.utm_content,
    utm_term: a.utm_term,
    // stored on the booking, read back by the webhook
    "metadata[lead_id]": lead.lead_id,
    "metadata[intent]": lead.intent,
    "metadata[angle]": a.angle,
    "metadata[estimate]": est
      ? `$${Math.round(est.annual).toLocaleString("en-US")}/yr (${est.crew} people x ${est.minutes} min/day x ${est.days} days x $${est.rate}/hr)`
      : undefined,
  };
  return Object.fromEntries(Object.entries(c).filter((e): e is [string, string] => !!e[1]));
}

type CalHandlers = {
  onReady: () => void;
  onBooked: (b: Booking) => void;
  onFailed: () => void;
  onViewed?: () => void;
};

/** The booking Cal reports, from either event version (bookingSuccessfulV2 or the older one). */
function parseBooking(detail: unknown): Booking | null {
  const data = ((detail as { data?: Record<string, unknown> })?.data ?? {}) as Record<string, unknown>;
  const b = ((data.booking as Record<string, unknown>) ?? data) as Record<string, unknown>;
  const start = (b.startTime ?? data.startTime ?? data.date) as string | undefined;
  if (!start) return null;
  return {
    uid: (b.uid ?? data.uid) as string | undefined,
    start: new Date(start).toISOString(),
    end: (b.endTime ?? data.endTime) ? new Date((b.endTime ?? data.endTime) as string).toISOString() : undefined,
    title: (b.title ?? data.title) as string | undefined,
  };
}

let calMounted = false;

/** Mount Andrew's calendar inline into `el`. Safe to call twice (React StrictMode). */
export function mountCal(el: HTMLElement, lead: Lead | null, h: CalHandlers) {
  if (calMounted) return;
  calMounted = true;
  const Cal = calSnippet();
  const ns = "bk";
  Cal("init", ns, { origin: "https://app.cal.com" });
  // blocked or offline: say so now instead of waiting on the timeout
  document.querySelector<HTMLScriptElement>('script[src="https://app.cal.com/embed/embed.js"]')?.addEventListener("error", () => h.onFailed(), { once: true });
  const api = Cal.ns[ns];
  api("inline", {
    elementOrSelector: el,
    calLink: config.calLink,
    layout: "month_view",
    config: { layout: "month_view", theme: "light", ...calPrefill(lead) },
  });
  api("ui", {
    theme: "light",
    layout: "month_view",
    hideEventTypeDetails: true,
    // CSS variables don't cross into the iframe: literal colours from tokens.css
    cssVarsPerTheme: {
      light: { "cal-brand": "#1d1a16", "cal-brand-emphasis": "#3b332b", "cal-brand-text": "#ffffff", "cal-border-booker": "#e8dfd5", "cal-border-booker-width": "1px" },
      dark: { "cal-brand": "#ffffff", "cal-brand-text": "#1d1a16" },
    },
  });
  let done = false;
  const booked = (e: { detail: unknown }) => {
    if (done) return;
    const b = parseBooking(e.detail);
    if (!b) return;
    done = true;
    h.onBooked(b);
  };
  api("on", { action: "bookingSuccessfulV2", callback: booked });
  api("on", { action: "bookingSuccessful", callback: booked });
  api("on", { action: "linkReady", callback: () => h.onReady() });
  api("on", { action: "linkFailed", callback: () => h.onFailed() });
  api("on", { action: "bookerViewed", callback: () => h.onViewed?.() });
}

// ─── Vidalytics ──────────────────────────────────────────────────────────────

let vidMounted = false;

/** Vidalytics' standard embed loader, as on smartcrewhq.com/demo, for the container already on the page. */
export function mountVidalytics(embedId: string, onError?: () => void) {
  if (vidMounted) return;
  vidMounted = true;
  const base = `https://fast.vidalytics.com/embeds/${config.vidalytics.account}/${embedId}/`;
  const containerId = `vidalytics_embed_${embedId}`;
  /* eslint-disable */
  (function (v: any, i: Document, d: string, a: string, l: string, y?: any, t?: any, c?: any, s?: any) {
    y = "_" + d.toLowerCase();
    c = d + "L";
    if (!v[d]) v[d] = {};
    if (!v[c]) v[c] = {};
    if (!v[y]) v[y] = {};
    const vl = "Loader";
    let vli = v[y][vl];
    let vsl = v[c][vl + "Script"];
    const ve = "Embed";
    if (!vsl) {
      vsl = function (u: string, cb: () => void) {
        if (t) {
          cb();
          return;
        }
        s = i.createElement("script");
        s.type = "text/javascript";
        s.async = 1;
        s.src = u;
        s.onload = function () {
          cb();
        };
        s.onerror = function () {
          onError?.();
        };
        i.getElementsByTagName("head")[0].appendChild(s);
      };
    }
    vsl(l + "loader.min.js", function () {
      if (!vli) {
        const vlc = v[c][vl];
        vli = new vlc();
      }
      vli.loadScript(l + "player.min.js", function () {
        const vec = v[d][ve];
        t = new vec();
        t.run(a);
      });
    });
  })(window, document, "Vidalytics", containerId, base);
  /* eslint-enable */
}
