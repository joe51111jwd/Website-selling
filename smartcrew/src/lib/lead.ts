import { config } from "../config";
import { isSize, type Estimate, type Intent, type Size } from "../signup/contract";

// The trial form's data: validated step by step, posted to the webhook after every step (so
// Andrew can follow up with anyone who stops halfway; config.leadWebhook empty = nothing is sent),
// and carried to /book in sessionStorage so his calendar opens already filled in. Email and phone
// never go in a URL.

/** What the visitor types, step by step: 1 employees + company · 2 name + work email + cell phone. */
export type Draft = {
  size?: Size;
  company: string;
  name: string;
  email: string;
  phone: string;
  /** Text reminders. Unticked by default: texts only with an explicit yes. */
  sms: boolean;
};

export const EMPTY_DRAFT: Draft = { company: "", name: "", email: "", phone: "", sms: false };

export type Field = "size" | "company" | "name" | "email" | "phone";
export type Errors = Partial<Record<Field, string>>;

/** Ad attribution, captured on the landing URL before anything can change it. */
export type Attribution = {
  angle?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  landing_url?: string;
  landing_ts?: string;
  referrer?: string;
};

/** "start": step 1 done (size + company) · "complete": step 2 done (name, email, phone): the lead. */
export type Stage = "start" | "complete";

/** The lead as it is posted and handed to /book. */
export type Lead = Draft & {
  lead_id: string;
  intent: Intent;
  /** Which button opened the popup (hero, sticky, calculator…). */
  source: string;
  stage: Stage;
  first: string;
  phone_e164?: string;
  estimate?: Estimate;
  attribution: Attribution;
  in_app: boolean;
  submitted_at?: string;
};

// ─── validation ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const digits = (v: string) => v.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

export function check(field: Field, d: Draft, intent: Intent = "trial"): string | undefined {
  switch (field) {
    case "size":
      return d.size ? undefined : "Pick how many employees you have.";
    case "company":
      return d.company.trim().length >= 2 ? undefined : intent === "demo" ? "Add your company name." : "Add your company name. Andrew sets up your trial under it.";
    case "name":
      return d.name.trim().length >= 2 ? undefined : "Add your name.";
    case "email":
      if (!d.email.trim()) return "Add your work email.";
      return EMAIL_RE.test(d.email.trim()) ? undefined : "That email looks off. Check for a typo?";
    case "phone":
      if (!d.phone.trim()) return "Add your cell number.";
      return digits(d.phone).length === 10 ? undefined : "Enter a 10-digit number.";
  }
}

export const STEP_FIELDS: Field[][] = [["size", "company"], ["name", "email", "phone"]];
/** The popup's last step (0-based): finishing it is the lead. */
export const LAST_STEP = STEP_FIELDS.length - 1;

export function validateStep(step: number, d: Draft, intent: Intent = "trial"): Errors {
  const e: Errors = {};
  for (const f of STEP_FIELDS[step] ?? []) {
    const msg = check(f, d, intent);
    if (msg) e[f] = msg;
  }
  return e;
}

const DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "comcast.net", "live.com", "msn.com", "att.net", "sbcglobal.net", "verizon.net", "mail.com", "ymail.com", "me.com", "protonmail.com", "bellsouth.net", "charter.net"];
const TLD_FIX: Record<string, string> = { con: "com", cmo: "com", ocm: "com", comm: "com", cm: "com", om: "com", vom: "com", xom: "com", nte: "net", ner: "net", nett: "net" };

/** Edit distance where swapping two neighbours counts as one edit ("gmial" → "gmail" = 1). */
function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}

/** "name@gmial.con" → "name@gmail.com"; null when it looks fine. Free-mail domains are never blocked. */
export function emailTypo(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)\.([a-z]{2,})$/);
  if (!m) return null;
  const [, user, host, tld] = m;
  const domain = `${host}.${tld}`;
  if (DOMAINS.includes(domain)) return null;
  const fixedTld = TLD_FIX[tld] ?? tld;
  let best: string | null = null;
  let bestD = 99;
  for (const d of DOMAINS) {
    const [h, t] = [d.slice(0, d.lastIndexOf(".")), d.slice(d.lastIndexOf(".") + 1)];
    const dist = distance(host, h) + (t === fixedTld ? 0 : host === h ? 1 : 3);
    if (dist < bestD) [best, bestD] = [d, dist];
  }
  if (best && bestD > 0 && bestD <= (host.length >= 6 ? 2 : 1)) return `${user}@${best}`;
  if (fixedTld !== tld) return `${user}@${host}.${fixedTld}`;
  return null;
}

/** (555) 123-4567 as you type; leaves anything that isn't a US number alone. */
export function formatPhone(v: string) {
  const d = v.replace(/\D/g, "");
  if (v.trim().startsWith("+") && !v.trim().startsWith("+1")) return v;
  const n = (d.length === 11 && d[0] === "1" ? d.slice(1) : d).slice(0, 10);
  if (n.length < 4) return n;
  if (n.length < 7) return `(${n.slice(0, 3)}) ${n.slice(3)}`;
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}

/** +15155550123, or undefined when it isn't a 10-digit US/CA number. */
export function toE164(v: string) {
  const d = digits(v);
  return d.length === 10 ? `+1${d}` : undefined;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

// ─── storage (every read and write survives private mode) ───────────────────

const ATTR_KEY = "sc_attr";
// v2: the two-step form with the new size buckets (a v1 save from the three-step form is ignored)
const PROGRESS_KEY = "sc_signup_v2";
const LEAD_KEY = "sc_lead";
const BOOKING_KEY = "sc_booking";

function readJSON<T>(store: () => Storage, key: string): T | null {
  try {
    const raw = store().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(store: () => Storage, key: string, value: unknown) {
  try {
    store().setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage full: the flow still works, it just won't resume */
  }
}
const session = () => window.sessionStorage;
const local = () => window.localStorage;

function cookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

const ATTR_PARAMS = ["angle", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

/**
 * Call once on landing. Keeps the ad's fbclid/utm/angle for the whole session (the URL can change
 * as the visitor moves around) and sets Meta's first-party _fbc cookie when the pixel isn't there
 * to do it, so the click survives to the lead and the booking.
 */
export function captureAttribution() {
  const prev = readJSON<Attribution>(session, ATTR_KEY) ?? {};
  const q = new URLSearchParams(location.search);
  const fresh: Attribution = {};
  for (const k of ATTR_PARAMS) {
    const v = q.get(k);
    if (v) fresh[k] = v.slice(0, 500);
  }
  const hasFresh = Object.keys(fresh).length > 0;
  const next: Attribution = hasFresh ? { ...prev, ...fresh } : prev;
  if (!next.landing_url || hasFresh) {
    next.landing_url = location.href.split("#")[0].slice(0, 1000);
    next.landing_ts = new Date().toISOString();
    next.referrer = document.referrer.slice(0, 500) || undefined;
  }
  if (fresh.fbclid) {
    const fbc = `fb.1.${Date.now()}.${fresh.fbclid}`;
    next.fbc = fbc;
    if (!cookie("_fbc")) {
      try {
        document.cookie = `_fbc=${encodeURIComponent(fbc)}; max-age=${90 * 864e2}; path=/; SameSite=Lax`;
      } catch {
        /* cookies blocked */
      }
    }
  }
  writeJSON(session, ATTR_KEY, next);
  return next;
}

export function attribution(): Attribution {
  const a = readJSON<Attribution>(session, ATTR_KEY) ?? {};
  return { ...a, fbc: cookie("_fbc") ?? a.fbc, fbp: cookie("_fbp") ?? a.fbp };
}

export type Progress = {
  lead_id: string;
  intent: Intent;
  step: number;
  draft: Draft;
  estimate?: Estimate;
  submitted?: boolean;
  ts: number;
};

export function loadProgress(): Progress | null {
  const p = readJSON<Progress>(session, PROGRESS_KEY);
  if (!p?.draft) return null;
  if (p.draft.size !== undefined && !isSize(p.draft.size)) p.draft = { ...p.draft, size: undefined };
  return { ...p, step: Math.min(Math.max(p.step | 0, 0), LAST_STEP) };
}
export const saveProgress = (p: Omit<Progress, "ts">) => writeJSON(session, PROGRESS_KEY, { ...p, ts: Date.now() });

export function newLeadId() {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const inApp = () => /FBAN|FBAV|Instagram/i.test(navigator.userAgent);

export function buildLead(p: { lead_id: string; intent: Intent; source: string; stage: Stage; draft: Draft; estimate?: Estimate }): Lead {
  const d = p.draft;
  return {
    ...d,
    company: d.company.trim(),
    name: d.name.trim(),
    email: d.email.trim(),
    lead_id: p.lead_id,
    intent: p.intent,
    source: p.source,
    stage: p.stage,
    first: firstName(d.name),
    phone_e164: toE164(d.phone),
    estimate: p.estimate,
    attribution: attribution(),
    in_app: inApp(),
    submitted_at: p.stage === "complete" ? new Date().toISOString() : undefined,
  };
}

/** One flat form body; also carries smartcrewhq.com's old field names so existing Zaps keep working. */
function formBody(l: Lead) {
  const f: Record<string, string | undefined> = {
    stage: l.stage,
    lead_id: l.lead_id,
    intent: l.intent,
    entry_source: l.source,
    company: l.company,
    crew_size: l.size,
    name: l.name,
    first_name: l.first,
    email: l.email || undefined,
    phone: l.phone_e164 ?? (l.phone || undefined),
    sms_consent: l.stage === "complete" ? String(l.sms) : undefined,
    calc_crew: l.estimate ? String(l.estimate.crew) : undefined,
    calc_minutes: l.estimate ? String(l.estimate.minutes) : undefined,
    calc_rate: l.estimate ? String(l.estimate.rate) : undefined,
    calc_days: l.estimate ? String(l.estimate.days) : undefined,
    calc_annual: l.estimate ? String(Math.round(l.estimate.annual)) : undefined,
    ...l.attribution,
    in_app: String(l.in_app),
    page: location.href.split("?")[0],
    user_agent: navigator.userAgent,
    submitted_at: l.submitted_at ?? new Date().toISOString(),
    // the live site's field names
    Name: l.name || undefined,
    Email: l.email || undefined,
    Phone: l.phone_e164 ?? (l.phone || undefined),
    "Company-Name": l.company || undefined,
    "Company-Size": l.size,
  };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "") body.append(k, v);
  return body;
}

/** Post one stage to the webhook. Fire-and-forget; `keepalive` lets it finish after the page changes. */
export function postStage(l: Lead): Promise<void> {
  if (!config.leadWebhook) return Promise.resolve();
  return fetch(config.leadWebhook, { method: "POST", body: formBody(l), keepalive: true, mode: "no-cors" })
    .then(() => undefined)
    .catch(() => undefined);
}

/** Hand the finished lead to /book (same tab, sessionStorage; nothing personal in the URL). */
export const saveForBooking = (l: Lead) => writeJSON(session, LEAD_KEY, l);

export function savedLead(): Lead | null {
  return readJSON<Lead>(session, LEAD_KEY);
}

export type Booking = { uid?: string; start: string; end?: string; title?: string; lead_id?: string };

export const saveBooking = (b: Booking) => writeJSON(local, BOOKING_KEY, b);

/** A booking made on this device that hasn't happened yet. */
export function savedBooking(): Booking | null {
  const b = readJSON<Booking>(local, BOOKING_KEY);
  return b && Date.parse(b.end ?? b.start) > Date.now() ? b : null;
}
