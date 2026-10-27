// The opt-in: an email address in, the SUSD Bootloader on its way out (the email service sends it).
//
// Connect ONE email service in the Vercel project's environment variables, then redeploy:
//   Kit (ConvertKit):  KIT_API_KEY, KIT_FORM_ID           the form's automation emails the file
//   Mailchimp:         MAILCHIMP_API_KEY (ends in -usNN), MAILCHIMP_LIST_ID
//                      (double opt-in: new addresses are added as "pending" until confirmed)
//   Anything else:     OPTIN_WEBHOOK_URL                  Zapier, Make, a CRM: receives {email, source, at}
// With none set, GET answers {live: false}, the page downloads the file instead, and nothing is stored.
//
// GET  /api/optin                      -> {live}
// POST /api/optin  {email, source, company}   (company is a honeypot; JSON, or a plain form post)
//   JSON: 200 {ok, emailed} | 400 {ok: false, error: "email"} | 502 {ok: false, error: "provider"}
//   form: 303 to /appendix#optin-sent, #optin-file or #optin-error
import { createHash } from "node:crypto";

const env = process.env;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const SOURCES = new Set(["home", "appendix"]);

const service = () => (env.KIT_API_KEY && env.KIT_FORM_ID ? "kit" : env.MAILCHIMP_API_KEY && env.MAILCHIMP_LIST_ID ? "mailchimp" : env.OPTIN_WEBHOOK_URL ? "webhook" : null);

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function call(url, init, what) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`${what} ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  return r;
}

async function subscribe(kind, email, source, referrer) {
  if (kind === "kit") {
    const headers = { "X-Kit-Api-Key": env.KIT_API_KEY, "Content-Type": "application/json", Accept: "application/json" };
    // the subscriber must exist before it can join the form (the create call is an upsert)
    await call("https://api.kit.com/v4/subscribers", { method: "POST", headers, body: JSON.stringify({ email_address: email }) }, "kit subscriber");
    await call(`https://api.kit.com/v4/forms/${encodeURIComponent(env.KIT_FORM_ID)}/subscribers`, { method: "POST", headers, body: JSON.stringify({ email_address: email, referrer: referrer || source }) }, "kit form");
    return;
  }
  if (kind === "mailchimp") {
    const dc = env.MAILCHIMP_API_KEY.split("-").pop();
    const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
    const auth = Buffer.from(`susd:${env.MAILCHIMP_API_KEY}`).toString("base64");
    await call(
      `https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(env.MAILCHIMP_LIST_ID)}/members/${hash}`,
      { method: "PUT", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ email_address: email, status_if_new: "pending", tags: ["bootloader", `from-${source}`] }) },
      "mailchimp",
    );
    return;
  }
  await call(env.OPTIN_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source, at: new Date().toISOString() }) }, "webhook");
}

export default {
  async fetch(req) {
    const kind = service();
    if (req.method === "GET") return json({ live: !!kind });
    if (req.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });

    // a plain HTML form (no JavaScript) posts urlencoded and is sent back to the appendix page
    const isForm = !(req.headers.get("content-type") || "").includes("application/json");
    let data = {};
    try {
      data = isForm ? Object.fromEntries(await req.formData()) : await req.json();
    } catch {
      data = {};
    }
    const back = (hash) => Response.redirect(new URL(`/appendix#${hash}`, req.url).toString(), 303);
    const email = String(data.email ?? "").trim().slice(0, 254);
    const source = SOURCES.has(data.source) ? data.source : "site";

    if (data.company) return isForm ? back("optin-sent") : json({ ok: true, emailed: true }); // the hidden field was filled: a bot
    if (!EMAIL.test(email)) return isForm ? back("optin-error") : json({ ok: false, error: "email" }, 400);
    if (!kind) return isForm ? back("optin-file") : json({ ok: true, emailed: false });
    try {
      await subscribe(kind, email, source, req.headers.get("referer"));
    } catch (e) {
      console.error("optin", kind, e instanceof Error ? e.message : e);
      return isForm ? back("optin-file") : json({ ok: false, error: "provider" }, 502);
    }
    return isForm ? back("optin-sent") : json({ ok: true, emailed: true });
  },
};
