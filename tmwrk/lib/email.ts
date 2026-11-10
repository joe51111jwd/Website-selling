// The alert email. The plain-text part keeps the brief's example lines:
//   MUSIC ACTIVITY ALERT | DRAMA | [Track Name]
//   TikTok: 1,000 new creations in 24 hours | Baseline: 50/day
//   Change: +950 creations / +1,900% | Action: Review sound
// Sent through Resend (RESEND_API_KEY). Without a key it lands in the outbox, viewable in the dashboard.

import type { Alert, Artist, Platform, Thresholds, Track } from "./types";
import { otherLine as describeOther } from "./view";
import { PLATFORM_LABEL } from "./types";
import { store } from "./store";

const n = (x: number) => Math.round(x).toLocaleString("en-US");
const unitShort: Record<Platform, string> = { spotify: "streams", tiktok: "creations" };
const action: Record<Platform, string> = { spotify: "Review track", tiktok: "Review sound" };

export function link(t: Track, p: Platform) {
  if (p === "tiktok") return t.tiktokSoundUrl || `https://www.tiktok.com/search?q=${encodeURIComponent(t.title)}`;
  return t.spotifyId ? `https://open.spotify.com/track/${t.spotifyId}` : `https://open.spotify.com/search/${encodeURIComponent(t.title)}`;
}

/** what the other platform did the same day, for one line of context */
export type Other = { platform: Platform; level: number; baseline: number };

const x = (level: number, base: number) => (base > 0 ? (level / base >= 10 ? `${Math.round(level / base)}×` : `${(level / base).toFixed(1)}×`) : "new");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function compose(a: Alert, rules: Thresholds, t: Track, artist: Artist, other?: Other, appUrl = process.env.APP_URL ?? "") {
  const P = PLATFORM_LABEL[a.platform];
  const demo = a.simulated ? "[Demo] " : "";
  const mult = x(a.level, a.baseline);
  const subject = `${demo}${P} alert: ${artist.name}, “${t.title}” at ${mult} its usual`;
  const what = a.platform === "tiktok" ? "new TikTok videos used the sound" : "Spotify streams";
  const day = new Date(a.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const otherLine = other ? describeOther(PLATFORM_LABEL[other.platform], other.level, other.baseline, other.platform === "tiktok" ? "new videos" : "streams") : "";
  // the brief's alert lines, kept word for word in the plain-text part
  const brief = [
    `MUSIC ACTIVITY ALERT | ${artist.name} | ${t.title}`,
    `${P}: ${n(a.level)} new ${unitShort[a.platform]} in 24 hours | Baseline: ${n(a.baseline)}/day`,
    `Change: +${n(a.change)} ${unitShort[a.platform]} / +${n(a.pct)}% | Action: ${action[a.platform]}`,
  ];
  const text = [
    `${t.title} by ${artist.name} is at ${mult} its usual on ${P}.`, "",
    `${n(a.level)} ${what} on ${day}. It usually gets about ${n(a.baseline)} a day.`,
    otherLine, "",
    ...brief, "",
    `${a.platform === "tiktok" ? "Open the sound" : "Open on Spotify"}: ${link(t, a.platform)}`,
    appUrl ? `Last 30 days: ${appUrl}/track/${t.id}` : "",
    a.simulated ? "\nDemo data: no data provider is connected yet, so these numbers are made up." : "",
  ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n");

  const row = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:11px 0;border-top:1px solid #ececea;color:#8c8c84;font-size:14px;width:44%">${k}</td><td style="padding:11px 0;border-top:1px solid #ececea;font-size:14px;color:#1d1d1b;${strong ? "font-weight:600" : ""}">${v}</td></tr>`;
  const sans = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const html = `<!doctype html><html><body style="margin:0;padding:28px 12px;background:#f6f6f4;${sans};color:#1d1d1b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:collapse"><tr><td>
  <p style="margin:0 0 14px 4px;font-size:15px;font-weight:700;letter-spacing:.01em">TMWRK</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border-radius:24px"><tr><td style="padding:28px 28px 26px">
    <p style="margin:0 0 10px;font-size:13px;color:#57574f"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${a.platform === "tiktok" ? "#fe2c55" : "#1db954"};margin-right:6px;vertical-align:1px"></span>${P} alert · ${day}</p>
    <h1 style="margin:0 0 14px;font-weight:600;font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:#141317">${esc(t.title)} by ${esc(artist.name)} is at ${mult} its usual on ${P}.</h1>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:#57574f"><b style="color:#1d1d1b">${n(a.level)}</b> ${what} on ${day}. It usually gets about <b style="color:#1d1d1b">${n(a.baseline)}</b> a day.</p>
    ${otherLine ? `<p style="margin:0;font-size:15px;line-height:1.55;color:#57574f">${otherLine}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 24px">
      ${row("That day", `${n(a.level)} ${a.platform === "tiktok" ? "new videos" : "streams"}`, true)}
      ${row(`Usual (last ${rules.window} days)`, `${n(a.baseline)} a day`)}
      ${row("Change", `+${n(a.change)} a day · ${mult} its usual`)}
      ${other ? row(`${PLATFORM_LABEL[other.platform]} same day`, `${n(other.level)} · usual ${n(other.baseline)}`) : ""}
    </table>
    <a href="${link(t, a.platform)}" style="display:inline-block;padding:11px 18px;background:#3358eb;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600">${a.platform === "tiktok" ? "Open the sound on TikTok" : "Open on Spotify"}</a>
    ${appUrl ? `<a href="${appUrl}/track/${t.id}" style="display:inline-block;margin-left:8px;padding:10px 16px;border:1px solid #e1e1de;color:#1d1d1b;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500">See the last 30 days</a>` : ""}
  </td></tr></table>
  ${a.simulated ? `<p style="margin:14px 4px 0;font-size:12.5px;line-height:1.6;color:#1f3aa8"><span style="background:#c9d4ff;padding:1px 7px;border-radius:5px;margin-right:6px">Demo data</span>These numbers are made up until a data provider is connected.</p>` : ""}
  <p style="margin:12px 4px 0;font-size:12.5px;line-height:1.5;color:#8c8c84">You get at most one email per track and platform per day. A spike that holds at the same level won't email again for ${rules.cooldownDays} days unless it grows another ${rules.escalatePct}%.</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

export function recipients() {
  return (process.env.ALERT_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function send(msg: { subject: string; text: string; html: string }, id: string): Promise<"email" | "outbox"> {
  const to = recipients();
  const key = process.env.RESEND_API_KEY;
  if (key && to.length) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": id.slice(0, 256) },
      body: JSON.stringify({ from: process.env.ALERT_FROM ?? "TMWRK Alerts <alerts@resend.dev>", to, subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return "email";
  }
  await store().putOutbox({ id, at: new Date().toISOString(), to, ...msg });
  return "outbox";
}
