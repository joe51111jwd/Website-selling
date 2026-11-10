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
  const subject = `${demo}MUSIC ACTIVITY ALERT | ${artist.name} | ${t.title} | ${P} ${mult}`;
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

  const F = "font-family:Arial,'Helvetica Neue',Helvetica,sans-serif";
  const cap = "font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase";
  const unit = a.platform === "tiktok" ? "creations" : "streams";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:9px 0;border-bottom:1px solid #33323a;color:#8d8c94;${cap};width:38%">${k}</td><td style="padding:9px 0;border-bottom:1px solid #33323a;font-size:15px;font-weight:600;color:#ffffff">${v}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:28px 12px;background:#f4f3ee;${F};color:#141317">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;border-collapse:collapse"><tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid #141317"><tr>
    <td style="padding:0 0 10px;font-size:19px;font-weight:700">TMWRK</td>
    <td style="padding:0 0 10px;text-align:right;${cap};color:#4a4a4a">Roster Intelligence | ${day}</td>
  </tr></table>
  ${a.simulated ? `<p style="margin:0;padding:8px 0;border-bottom:1px dashed #8b8a83;${cap};color:#57564f">Demo data | No data provider connected | These numbers are simulated</p>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin-top:18px;background:#141317;border-radius:6px"><tr><td style="padding:22px 22px 20px;color:#ffffff">
    <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:#b9b8bf">Music activity alert | ${esc(artist.name)} | ${esc(t.title)}</p>
    <p style="margin:16px 0 14px;font-size:84px;line-height:.85;font-weight:700;letter-spacing:-4px">${mult}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #33323a">
      ${row(P, `${n(a.level)} new ${unit} in 24 hours`)}
      ${row("Baseline", `${n(a.baseline)}/day (last ${rules.window} days)`)}
      ${row("Change", `+${n(a.change)} ${unit} / +${n(a.pct)}%`)}
      ${other ? row(PLATFORM_LABEL[other.platform], `${n(other.level)} ${other.platform === "tiktok" ? "creations" : "streams"} | usual ${n(other.baseline)}`) : ""}
    </table>
    <p style="margin:20px 0 0"><a href="${link(t, a.platform)}" style="display:inline-block;padding:12px 16px;background:#3358eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700">Action: ${action[a.platform]} &rarr;</a>${appUrl ? ` <a href="${appUrl}/track/${t.id}" style="display:inline-block;margin-left:6px;padding:11px 15px;border:1px solid #4a4950;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700">30 days &rarr;</a>` : ""}</p>
  </td></tr></table>
  ${otherLine ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#4a4a4a">${otherLine}</p>` : ""}
  <p style="margin:18px 0 0;padding-top:10px;border-top:1px solid #141317;${cap};color:#57564f">One email per track and platform per day | No repeat for ${rules.cooldownDays} days unless it grows ${rules.escalatePct}% | Never miss a moment.</p>
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
