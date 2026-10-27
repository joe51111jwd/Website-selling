// Getting the Bootloader: by email when an email service is connected (api/optin.js), otherwise the
// file itself, downloaded from the click. The Bootloader is a file to upload, not text to paste.
const BASE = import.meta.env.BASE_URL;
export const FILE_URL = `${BASE}bootloader.md`;
export const FILE_NAME = "SUSD-Bootloader.md";
export const APPENDIX_URL = `${BASE}appendix`;
const API = `${BASE}api/optin`;

let live: Promise<boolean> | null = null;
/** whether an email service is connected; asked once, and "no" if the function can't be reached */
export function optinLive(): Promise<boolean> {
  live ??= fetch(API, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? (r.json() as Promise<{ live?: boolean }>) : { live: false }))
    .then(
      (d) => !!d.live,
      () => false,
    );
  return live;
}

export const validEmail = (s: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s.trim());

/** rejects with Error("email") for an address the server won't take, Error("send") for anything else */
export async function sendOptin(email: string, source: "home" | "appendix"): Promise<{ emailed: boolean }> {
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
  const d = (await r.json().catch(() => ({}))) as { emailed?: boolean };
  return { emailed: !!d.emailed };
}

/** start the file's download; call it inside the click, so every browser allows it */
export function downloadFile() {
  const a = document.createElement("a");
  a.href = FILE_URL;
  a.download = FILE_NAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
