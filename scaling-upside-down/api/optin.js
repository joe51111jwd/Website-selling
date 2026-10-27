// The opt-in: an email address in, the SUSD Bootloader on its way out (the email service sends it).
//
// Connect ONE email service in the Vercel project's environment variables, then redeploy:
//   Kit (ConvertKit):  KIT_API_KEY, KIT_FORM_ID           KIT_FORM_ID must be a double opt-in form whose
//                      incentive email carries the file (new addresses are created "inactive"; that email
//                      confirms them)
//   Mailchimp:         MAILCHIMP_API_KEY (ends in -usNN), MAILCHIMP_LIST_ID
//                      (double opt-in: new addresses are added as "pending" until confirmed)
//   Anything else:     OPTIN_WEBHOOK_URL                  Zapier, Make, a CRM: receives {email, source, at}
// With none set, GET answers {live: false}, the page downloads the file instead, and nothing is stored.
// Optional: a Vercel Firewall rate-limit rule on /api/optin (say 5 requests a minute per IP) slows
// scripted sign-ups; the honeypot only stops bots that fill in the form.
//
// GET  /api/optin                      -> {live}
// POST /api/optin  {email, source, company}   (company is a honeypot; JSON, or a plain form post)
//   JSON: 200 {ok, emailed: true}                  a new sign-up: the service emails the file
//         200 {ok, emailed: false}                 no service connected
//         200 {ok, emailed: false, already: true}  signed up before: the service won't email it again
//         400 {ok: false, error: "email"} | 502 {ok: false, error: "provider"}
//   form: 303 to /appendix#optin-sent, #optin-file (no service), #optin-already, #optin-failed or #optin-error
import { createHash } from "node:crypto";

const env = process.env;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const SOURCES = new Set(["home", "appendix"]);
const BUDGET = 9000; // ms for all the provider calls in one request; the page gives up at 12 s

const service = () => (env.KIT_API_KEY && env.KIT_FORM_ID ? "kit" : env.MAILCHIMP_API_KEY && env.MAILCHIMP_LIST_ID ? "mailchimp" : env.OPTIN_WEBHOOK_URL ? "webhook" : null);

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// throws on any status but 2xx (and `also`); the body is never needed
async function call(what, url, init, signal, also) {
  const r = await fetch(url, { ...init, signal });
  if (!r.ok && r.status !== also) throw new Error(`${what} ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  r.body?.cancel().catch(() => {});
  return r;
}

/** "sent" when the service will email the file, "already" when it won't (signed up before) */
async function subscribe(kind, email, source, referrer, signal) {
  if (kind === "kit") {
    const headers = { "X-Kit-Api-Key": env.KIT_API_KEY, "Content-Type": "application/json", Accept: "application/json" };
    // the subscriber must exist before it can join the form; create (an upsert) leaves an existing one's state alone
    await call("kit subscriber", "https://api.kit.com/v4/subscribers", { method: "POST", headers, body: JSON.stringify({ email_address: email, state: "inactive" }) }, signal);
    // 201: new to the form, so Kit sends the incentive email; 200: on the form already, and Kit won't send it again
    const r = await call("kit form", `https://api.kit.com/v4/forms/${encodeURIComponent(env.KIT_FORM_ID)}/subscribers`, { method: "POST", headers, body: JSON.stringify({ email_address: email, referrer: referrer || source }) }, signal);
    return r.status === 200 ? "already" : "sent";
  }
  if (kind === "mailchimp") {
    const dc = env.MAILCHIMP_API_KEY.split("-").pop();
    const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
    const member = `https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(env.MAILCHIMP_LIST_ID)}/members/${hash}`;
    const headers = { Authorization: `Basic ${Buffer.from(`susd:${env.MAILCHIMP_API_KEY}`).toString("base64")}`, "Content-Type": "application/json" };
    // on the list in any status: an update emails nothing, and their status is not ours to change
    if ((await call("mailchimp member", `${member}?fields=status`, { headers }, signal, 404)).status !== 404) return "already";
    await call("mailchimp", member, { method: "PUT", headers, body: JSON.stringify({ email_address: email, status_if_new: "pending", tags: ["bootloader", `from-${source}`] }) }, signal);
    return "sent";
  }
  // a webhook can't say whether the address is new
  await call("webhook", env.OPTIN_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source, at: new Date().toISOString() }) }, signal);
  return "sent";
}

export default {
  async fetch(req) {
    const kind = service();
    if (req.method === "GET") return json({ live: !!kind });
    if (req.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });

    // a plain HTML form (no JavaScript) posts urlencoded and is sent back to the appendix page
    const isForm = !(req.headers.get("content-type") || "").includes("application/json");
    let data;
    try {
      data = isForm ? Object.fromEntries(await req.formData()) : await req.json();
    } catch {
      data = null;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) data = {}; // JSON null, a number, a list
    const back = (hash) => Response.redirect(new URL(`/appendix#${hash}`, req.url).toString(), 303);
    const email = typeof data.email === "string" ? data.email.trim().slice(0, 254) : "";
    const source = SOURCES.has(data.source) ? data.source : "site";

    // the hidden field was filled: a bot, told it worked
    if (typeof data.company === "string" && data.company.trim()) return isForm ? back("optin-sent") : json({ ok: true, emailed: true });
    if (!EMAIL.test(email)) return isForm ? back("optin-error") : json({ ok: false, error: "email" }, 400);
    if (!kind) return isForm ? back("optin-file") : json({ ok: true, emailed: false });
    let result;
    try {
      result = await subscribe(kind, email, source, req.headers.get("referer"), AbortSignal.timeout(BUDGET));
    } catch (e) {
      console.error("optin", kind, e instanceof Error ? e.message : e);
      return isForm ? back("optin-failed") : json({ ok: false, error: "provider" }, 502);
    }
    if (result === "already") return isForm ? back("optin-already") : json({ ok: true, emailed: false, already: true });
    return isForm ? back("optin-sent") : json({ ok: true, emailed: true });
  },
};
