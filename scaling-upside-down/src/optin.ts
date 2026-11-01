// The first-edition list: one sign-up, and the email service (api/optin.js) sends the SUSD Bootloader
// with the welcome email. The file is never a direct download; until a service is connected the list
// isn't open, and the page says so.
const BASE = import.meta.env.BASE_URL;
export const APPENDIX_URL = `${BASE}appendix`;
const API = `${BASE}api/optin`;

let live: Promise<boolean | null> | null = null;
/** whether an email service is connected: null while unknown. Only an answer is kept; a failed ask is asked again next time. */
export function optinLive(): Promise<boolean | null> {
  if (live) return live;
  const ask: Promise<boolean | null> = fetch(API, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? (r.json() as Promise<{ live?: unknown }>) : null))
    .then(
      (d) => (typeof d?.live === "boolean" ? d.live : null),
      () => null,
    );
  live = ask;
  void ask.then((v) => v === null && live === ask && (live = null));
  return live;
}

export const validEmail = (s: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s.trim());

/** the answer: emailed (a new sign-up: the service sends the Bootloader), `already` on the list, or neither (no service connected) */
export type OptinResult = { emailed: boolean; already?: boolean };

/** rejects with Error("email") for an address the server won't take, Error("send") for anything else.
 *  12 s: the server gives its email service 9 s in all, so it always answers first. */
export async function sendOptin(email: string, source: "home" | "appendix"): Promise<OptinResult> {
  let r: Response;
  try {
    r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: email.trim(), source, company: "" }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("send");
  }
  if (r.status === 400) throw new Error("email");
  if (!r.ok) throw new Error("send");
  const d = (await r.json().catch(() => ({}))) as { emailed?: boolean; already?: boolean };
  return { emailed: !!d.emailed, already: !d.emailed && !!d.already };
}
