// One shared password for the team (DASHBOARD_PASSWORD). Logging in sets a signed, http-only cookie for 30
// days. Web Crypto only, so the same code runs in the proxy and in route handlers.

export const COOKIE = "tmwrk_session";
const DAYS = 30;

const enc = new TextEncoder();
const secret = () => process.env.SESSION_SECRET || `tmwrk:${process.env.DASHBOARD_PASSWORD ?? "demo"}`;

async function hmac(msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function issue() {
  const exp = Date.now() + DAYS * 86_400_000;
  return { value: `${exp}.${await hmac(String(exp))}`, maxAge: DAYS * 86_400 };
}

export async function valid(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const want = await hmac(exp);
  if (want.length !== sig.length) return false;
  let d = 0;
  for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return d === 0;
}

export function passwordOk(input: string) {
  // With no password set, the password is "demo" while the data is simulated (nothing real to protect, so a
  // preview deploy just works). Once Soundcharts keys are in, DASHBOARD_PASSWORD is required.
  const live = Boolean(process.env.SOUNDCHARTS_APP_ID && process.env.SOUNDCHARTS_API_KEY);
  const want = process.env.DASHBOARD_PASSWORD || (live ? null : "demo");
  if (!want) return false;
  if (want.length !== input.length) return false;
  let d = 0;
  for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ input.charCodeAt(i);
  return d === 0;
}
