// POST /api/lead: a finished sign-up (the popup's "Pick my time") goes to Andrew's Close.com as a lead,
// with the Facebook ad it came from, and pings him on Slack and his phone. Andrew (by text, Oct 21):
// "when a company enters their info, that needs to fire off a few things: 1) Data needs to push to
// Close.com. Lead data. it should also have all the Facebook click data … 2) I need the ability to
// shoot off some alerts to slack and to my cell phone for every time a new lead comes in the door.
// Ideally we just code this all manually."
//
// A Vercel function (api/ under the project's root directory), Web-standard signature. Everything it
// talks to is switched on by the project's environment, server side only, and anything missing is
// simply skipped:
//   CLOSE_API_KEY        Close → Settings → Developer → API keys. The lead, its contact, and a note
//                        with the rest. Ad fields land in the contact's (or lead's) custom fields whose
//                        names match (fbclid, fbc, fbp, ad_id, ad_name, adset_id, adset_name,
//                        campaign_id, campaign_name, utm_source…), looked up by name, so Andrew's
//                        existing fields fill in as they are; his lead fields Company Size and Lead
//                        Source (Facebook for an ad click, else Website) too.
//   SLACK_WEBHOOK_URL    a Slack incoming webhook (https://hooks.slack.com/services/…) for the channel.
//   phone, either one:
//     NTFY_TOPIC         a push to the free ntfy app (ntfy.sh), subscribed to this topic. Make it long
//                        and random: anyone who knows the topic can read it.
//     TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM + ALERT_SMS_TO   a text message (E.164 numbers).
//   LEADS_DRY_RUN=1      sends nothing anywhere; the answer says what would have gone.
//
// Never sent anywhere, whatever the environment: test leads (an example.com / .test email, or a 555
// number like the e2e checks use), and any call with ?dry=1, which answers with exactly what would be
// sent (Close's field list is read to show the mapping; nothing is written). Every lead is also kept
// in the private Blob store as leads/<lead_id>.json, which stops a second "Pick my time" on the same
// form from making a second Close lead or a second alert (it adds a note to the first lead instead),
// and keeps the lead even if Close is down.
//
// Only same-origin posts are taken (the page's own form), a few per visitor per ten minutes. Upstream
// error bodies and keys never go back to the browser.

import { get, put } from "@vercel/blob";

declare const process: { env: Record<string, string | undefined> };

const CLOSE = "https://api.close.com/api/v1";
const TIMEOUT = 8000;
const MAX_BODY = 16_000;

/** The ad fields Andrew listed (his Close lead's FIELDS panel) plus the UTM tags, as the page captures them. */
const AD_FIELDS = [
  "fbclid",
  "fb_lead_id",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "placement",
  "site_source_name",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbc",
  "fbp",
  "angle",
] as const;

type Env = {
  close?: string;
  slack?: string;
  ntfy?: string;
  twilio?: { sid: string; token: string; from: string; to: string };
};

function env(): Env {
  const e = process.env;
  const t = e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_FROM && e.ALERT_SMS_TO;
  return {
    close: e.CLOSE_API_KEY || undefined,
    slack: e.SLACK_WEBHOOK_URL || undefined,
    ntfy: e.NTFY_TOPIC || undefined,
    twilio: t ? { sid: e.TWILIO_ACCOUNT_SID!, token: e.TWILIO_AUTH_TOKEN!, from: e.TWILIO_FROM!, to: e.ALERT_SMS_TO! } : undefined,
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ─── the lead, as the page sends it (src/lib/lead.ts Lead) ──────────────────

export type In = {
  lead_id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  size: string;
  sms: boolean;
  intent: string;
  source: string;
  in_app: boolean;
  submitted_at: string;
  estimate?: { crew: number; minutes: number; rate: number; days: number; annual: number };
  ad: Partial<Record<(typeof AD_FIELDS)[number], string>>;
  landing_url: string;
  landing_ts: string;
  referrer: string;
  page: string;
  user_agent: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function readLead(b: Record<string, unknown>): In | null {
  const a = (b.attribution && typeof b.attribution === "object" ? b.attribution : {}) as Record<string, unknown>;
  const d = str(b.phone_e164) || str(b.phone);
  const digits = d.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const lead: In = {
    lead_id: str(b.lead_id, 60),
    company: str(b.company, 120),
    name: str(b.name, 120),
    email: str(b.email, 200),
    phone: digits.length === 10 ? `+1${digits}` : "",
    size: str(b.size, 20),
    sms: b.sms === true,
    intent: str(b.intent, 20),
    source: str(b.source, 40),
    in_app: b.in_app === true,
    submitted_at: str(b.submitted_at, 40) || new Date().toISOString(),
    ad: {},
    landing_url: str(a.landing_url, 1000),
    landing_ts: str(a.landing_ts, 40),
    referrer: str(a.referrer, 500),
    page: str(b.page, 300),
    user_agent: str(b.user_agent, 400),
  };
  for (const k of AD_FIELDS) {
    const v = str(a[k], 500);
    if (v) lead.ad[k] = v;
  }
  const e = b.estimate as Record<string, unknown> | undefined;
  if (e && typeof e === "object" && [e.crew, e.minutes, e.rate, e.days, e.annual].every((n) => typeof n === "number" && Number.isFinite(n)))
    lead.estimate = { crew: e.crew as number, minutes: e.minutes as number, rate: e.rate as number, days: e.days as number, annual: e.annual as number };
  const ok =
    /^[A-Za-z0-9-]{6,60}$/.test(lead.lead_id) && lead.company.length >= 2 && lead.name.length >= 2 && EMAIL_RE.test(lead.email) && !!lead.phone;
  return ok ? lead : null;
}

/** The e2e checks' and our own made-up leads: never sent anywhere. */
export function isTest(l: In) {
  const domain = l.email.toLowerCase().split("@")[1] ?? "";
  const fakeDomain = /(^|\.)example\.(com|org|net)$/.test(domain) || /\.(test|invalid|example|localhost)$/.test(domain);
  const n = l.phone.slice(2);
  const fakePhone = n.slice(3, 6) === "555" || /^(\d)\1{9}$/.test(n);
  return fakeDomain || fakePhone;
}

// ─── Close ──────────────────────────────────────────────────────────────────

/** A custom field on Close's lead or contact (Andrew keeps the ad fields on the contact). */
type CloseField = { id: string; name: string; type: string; choices?: string[]; accepts_multiple_values?: boolean; on: "lead" | "contact" };

const auth = (key: string) => `Basic ${btoa(`${key}:`)}`;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function call(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
}

async function closeFields(key: string): Promise<CloseField[]> {
  const out: CloseField[] = [];
  for (const on of ["lead", "contact"] as const)
    for (let skip = 0; skip < 1000; skip += 100) {
      const r = await call(`${CLOSE}/custom_field/${on}/?_limit=100&_skip=${skip}`, { headers: { authorization: auth(key) } });
      if (!r.ok) throw new Error(`close fields ${r.status}`);
      const page = (await r.json()) as { data?: Omit<CloseField, "on">[]; has_more?: boolean };
      out.push(...(page.data ?? []).map((f) => ({ ...f, on })));
      if (!page.has_more) break;
    }
  return out;
}

/** Other names a Close field might carry for the same thing (matched without case, spaces or punctuation). */
const ALIASES: Record<string, string[]> = {
  size: ["companysize", "crewsize", "employees", "numberofemployees", "employeecount", "teamsize"],
  landing_url: ["landingpage", "landingurl"],
  referrer: ["referrer", "referer"],
  source: ["entrysource", "formsource"],
  lead_source: ["leadsource"],
};

/** Andrew's "Lead Source" choices include Facebook and Website: a click from his ads is Facebook. */
export const leadSource = (l: In) =>
  l.ad.fbclid || l.ad.ad_id || l.ad.campaign_id || /^(facebook|fb|ig|instagram|meta)/i.test(l.ad.utm_source ?? "") ? "Facebook" : "Website";

/** Our values → Close's "custom.cf_…" keys, for the fields Andrew's Close has; the rest go in the note. */
export function mapFields(l: In, fields: CloseField[]) {
  const values: Record<string, string> = { ...l.ad };
  if (l.size) values.size = l.size;
  if (l.landing_url) values.landing_url = l.landing_url;
  if (l.referrer) values.referrer = l.referrer;
  values.lead_source = leadSource(l);
  // contact fields first: that's where Andrew's Close keeps fbclid, ad_id, campaign_name…
  const byName = new Map<string, CloseField>();
  for (const f of [...fields].sort((a, b) => (a.on === b.on ? 0 : a.on === "contact" ? -1 : 1))) if (!byName.has(norm(f.name))) byName.set(norm(f.name), f);
  const custom: Record<string, string | number> = {};
  const contact: Record<string, string | number> = {};
  const mapped: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    const f = [k, ...(ALIASES[k] ?? [])].map((n) => byName.get(norm(n))).find(Boolean);
    if (!f) continue;
    let value: string | number | undefined;
    if (f.type === "text" || f.type === "textarea" || f.type === "url") value = v;
    else if (f.type === "number") value = Number.isFinite(Number(v)) ? Number(v) : undefined;
    else if (f.type === "choices") value = f.choices?.find((c) => norm(c) === norm(v));
    if (value === undefined) continue;
    (f.on === "contact" ? contact : custom)[`custom.${f.id}`] = f.accepts_multiple_values ? ([value] as unknown as string) : value;
    mapped[k] = `${f.on}: ${f.name}`;
  }
  return { custom, contact, mapped };
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function noteText(l: In) {
  const lines = [
    `New lead from the SmartCrew website (${l.intent === "demo" ? "book a demo" : "Try SmartCrew"}).`,
    "",
    `Company: ${l.company}`,
    `Employees: ${l.size || "not given"}`,
    `Name: ${l.name}`,
    `Email: ${l.email}`,
    `Cell: ${l.phone}`,
    `Text reminders OK: ${l.sms ? "yes" : "no"}`,
    `Button they clicked: ${l.source || "unknown"}`,
    `Submitted: ${l.submitted_at}`,
  ];
  if (l.estimate) {
    const e = l.estimate;
    lines.push(`Their calculator estimate: ${e.crew} people × ${e.minutes} min a day × $${e.rate}/hr ≈ ${money(e.annual)} a year in loose time`);
  }
  if (Object.keys(l.ad).length) {
    lines.push("", "Ad / click data:");
    for (const [k, v] of Object.entries(l.ad)) lines.push(`${k}: ${v}`);
  } else lines.push("", "Ad / click data: none (not from a tagged ad link)");
  lines.push("", `Landing page: ${l.landing_url || "unknown"}`, `Referrer: ${l.referrer || "none"}`, `In Facebook/Instagram app: ${l.in_app ? "yes" : "no"}`);
  lines.push(`Website lead id: ${l.lead_id}`);
  return lines.join("\n");
}

type Custom = Record<string, string | number>;

export function closeLeadBody(l: In, custom: Custom = {}, contact: Custom = {}) {
  return {
    name: l.company,
    contacts: [{ name: l.name, emails: [{ email: l.email, type: "office" }], phones: [{ phone: l.phone, type: "mobile" }], ...contact }],
    ...custom,
  };
}

async function toClose(key: string, l: In): Promise<{ id?: string; mapped: Record<string, string>; status: string }> {
  let fields: CloseField[] = [];
  try {
    fields = await closeFields(key);
  } catch {
    /* no field list: the lead still goes in, the ad data rides in the note */
  }
  const { custom, contact, mapped } = mapFields(l, fields);
  const post = (body: unknown) =>
    call(`${CLOSE}/lead/`, { method: "POST", headers: { authorization: auth(key), "content-type": "application/json" }, body: JSON.stringify(body) });
  let r = await post(closeLeadBody(l, custom, contact));
  let used = mapped;
  if (r.status === 400 && Object.keys({ ...custom, ...contact }).length) {
    // a field Close won't take as typed: make the lead without them, everything is in the note anyway
    r = await post(closeLeadBody(l));
    used = {};
  }
  if (!r.ok) return { mapped: used, status: `failed-${r.status}` };
  const id = ((await r.json()) as { id?: string }).id;
  if (id) {
    await call(`${CLOSE}/activity/note/`, {
      method: "POST",
      headers: { authorization: auth(key), "content-type": "application/json" },
      body: JSON.stringify({ lead_id: id, note: noteText(l) }),
    }).catch(() => undefined);
  }
  return { id, mapped: used, status: "created" };
}

async function closeNote(key: string, id: string, note: string) {
  const r = await call(`${CLOSE}/activity/note/`, {
    method: "POST",
    headers: { authorization: auth(key), "content-type": "application/json" },
    body: JSON.stringify({ lead_id: id, note }),
  });
  return r.ok ? "noted" : `failed-${r.status}`;
}

// ─── alerts ─────────────────────────────────────────────────────────────────

const adLine = (l: In) => {
  const a = l.ad;
  const parts = [a.campaign_name, a.adset_name, a.ad_name].filter(Boolean);
  if (parts.length) return parts.join(" › ");
  if (a.utm_source || a.fbclid) return a.utm_source ? `${a.utm_source}${a.utm_campaign ? ` / ${a.utm_campaign}` : ""}` : "Facebook click (no ad name tags)";
  return "No ad data (direct or untagged link)";
};

export function alertText(l: In, closeUrl?: string) {
  return [
    `New SmartCrew lead: ${l.company} (${l.size || "?"} employees)`,
    `${l.name} · ${l.phone} · ${l.email}`,
    `Ad: ${adLine(l)}`,
    closeUrl ? `Close: ${closeUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function slackBody(l: In, closeUrl?: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fields = [
    `*Company*\n${esc(l.company)}`,
    `*Employees*\n${esc(l.size || "not given")}`,
    `*Name*\n${esc(l.name)}`,
    `*Cell*\n<tel:${l.phone}|${l.phone}>`,
    `*Email*\n${esc(l.email)}`,
    `*Ad*\n${esc(adLine(l))}`,
  ];
  return {
    text: alertText(l, closeUrl),
    blocks: [
      { type: "header", text: { type: "plain_text", text: `New lead: ${l.company}`.slice(0, 150) } },
      { type: "section", fields: fields.map((t) => ({ type: "mrkdwn", text: t })) },
      ...(closeUrl ? [{ type: "section", text: { type: "mrkdwn", text: `<${closeUrl}|Open in Close>` } }] : []),
    ],
  };
}

async function toSlack(url: string, l: In, closeUrl?: string) {
  const r = await call(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(slackBody(l, closeUrl)) });
  return r.ok ? "sent" : `failed-${r.status}`;
}

async function toNtfy(topic: string, l: In, closeUrl?: string) {
  const headers: Record<string, string> = { title: `New lead: ${l.company}`.replace(/[^\x20-\x7e]/g, ""), priority: "high", tags: "moneybag" };
  if (closeUrl) headers.click = closeUrl;
  const r = await call(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: "POST", headers, body: alertText(l) });
  return r.ok ? "sent" : `failed-${r.status}`;
}

async function toSms(t: NonNullable<Env["twilio"]>, l: In, closeUrl?: string) {
  const body = new URLSearchParams({ To: t.to, From: t.from, Body: alertText(l, closeUrl).slice(0, 600) });
  const r = await call(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(t.sid)}/Messages.json`, {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${t.sid}:${t.token}`)}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  return r.ok ? "sent" : `failed-${r.status}`;
}

// ─── the record in Blob (dedupe + backup) ───────────────────────────────────

type Kept = { lead: In; close_id?: string; at: string };
const keptPath = (id: string) => `leads/${id}.json`;
const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function readKept(id: string): Promise<Kept | null> {
  if (!hasBlob()) return null;
  try {
    const got = await get(keptPath(id), { access: "private", useCache: false });
    if (!got || got.statusCode !== 200) return null;
    return JSON.parse(await new Response(got.stream).text()) as Kept;
  } catch {
    return null;
  }
}

async function keep(k: Kept, overwrite: boolean) {
  if (!hasBlob()) return true;
  try {
    await put(keptPath(k.lead.lead_id), JSON.stringify(k), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: overwrite });
    return true;
  } catch {
    return false; // already there (a second post of the same form beat us to it), or Blob is down
  }
}

// ─── the gate ───────────────────────────────────────────────────────────────

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (limited(ip)) return json({ ok: false, error: "slow-down" }, 429);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "bad-request" }, 400);
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "bad-request" }, 400);
  }
  const lead = body && typeof body === "object" ? readLead(body) : null;
  if (!lead) return json({ ok: false, error: "bad-request" }, 400);

  const e = env();
  const dryAsked = new URL(request.url).searchParams.get("dry") === "1";
  const test = isTest(lead);
  if (dryAsked || test || process.env.LEADS_DRY_RUN === "1") {
    let mapped: Record<string, string> = {};
    if (e.close && dryAsked) mapped = mapFields(lead, await closeFields(e.close).catch(() => [])).mapped;
    // (closeLeadBody below leaves the custom fields out: the dry answer names them instead)
    return json({
      ok: true,
      dry: true,
      why: dryAsked ? "dry=1" : test ? "test lead" : "LEADS_DRY_RUN",
      would: {
        close: e.close ? { lead: closeLeadBody(lead), custom_fields: mapped, note: noteText(lead) } : "no CLOSE_API_KEY",
        slack: e.slack ? slackBody(lead) : "no SLACK_WEBHOOK_URL",
        phone: e.twilio ? { sms: alertText(lead) } : e.ntfy ? { push: alertText(lead) } : "no phone alert set up",
      },
    });
  }

  // the same form sent twice (back, fix a typo, "Pick my time" again): one lead, one alert
  if (!(await keep({ lead, at: new Date().toISOString() }, false))) {
    const prev = await readKept(lead.lead_id);
    if (prev) {
      const changed = (["company", "size", "name", "email", "phone"] as const).filter((k) => prev.lead[k] !== lead[k]);
      let close = "unchanged";
      if (changed.length && e.close && prev.close_id)
        close = await closeNote(e.close, prev.close_id, `They sent the website form again with changes:\n${changed.map((k) => `${k}: ${prev.lead[k]} → ${lead[k]}`).join("\n")}`).catch(() => "failed");
      return json({ ok: true, repeat: true, close });
    }
  }

  const out: Record<string, string> = {};
  let closeId: string | undefined;
  if (e.close) {
    const c = await toClose(e.close, lead).catch(() => ({ id: undefined, status: "failed", mapped: {} }));
    closeId = c.id;
    out.close = c.status;
    if (closeId) await keep({ lead, close_id: closeId, at: new Date().toISOString() }, true);
  } else out.close = "off";
  const closeUrl = closeId ? `https://app.close.com/lead/${closeId}/` : undefined;
  const [slack, phone] = await Promise.all([
    e.slack ? toSlack(e.slack, lead, closeUrl).catch(() => "failed") : "off",
    e.twilio ? toSms(e.twilio, lead, closeUrl).catch(() => "failed") : e.ntfy ? toNtfy(e.ntfy, lead, closeUrl).catch(() => "failed") : "off",
  ]);
  out.slack = slack;
  out.phone = phone;
  return json({ ok: true, ...out });
}
