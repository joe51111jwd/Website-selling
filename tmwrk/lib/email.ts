// The alert email, matching the brief's example:
//   MUSIC ACTIVITY ALERT | DRAMA | [Track Name]
//   TikTok: 1,000 new creations in 24 hours | Baseline: 50/day
//   Change: +950 creations / +1,900% | Action: Review sound
// Sent through Resend (RESEND_API_KEY). Without a key it lands in the outbox, viewable in the dashboard.

import type { Alert, Artist, Platform, Track } from "./types";
import { PLATFORM_LABEL } from "./types";
import { store } from "./store";

const n = (x: number) => Math.round(x).toLocaleString("en-US");
const unitShort: Record<Platform, string> = { spotify: "streams", tiktok: "creations" };
const action: Record<Platform, string> = { spotify: "Review track", tiktok: "Review sound" };

export function link(t: Track, p: Platform) {
  if (p === "tiktok") return t.tiktokSoundUrl || `https://www.tiktok.com/search?q=${encodeURIComponent(t.title)}`;
  return t.spotifyId ? `https://open.spotify.com/track/${t.spotifyId}` : `https://open.spotify.com/search/${encodeURIComponent(t.title)}`;
}

export function compose(a: Alert, t: Track, artist: Artist, appUrl = process.env.APP_URL ?? "") {
  const P = PLATFORM_LABEL[a.platform];
  const sim = a.simulated ? "[SIMULATED] " : "";
  const subject = `${sim}MUSIC ACTIVITY ALERT | ${artist.name} | ${t.title}`;
  const lines = [
    `${P}: ${n(a.level)} new ${unitShort[a.platform]} in 24 hours | Baseline: ${n(a.baseline)}/day`,
    `Change: +${n(a.change)} ${unitShort[a.platform]} / +${n(a.pct)}% | Action: ${action[a.platform]}`,
  ];
  const text = [
    subject, "", ...lines, "",
    `Artist: ${artist.name}`, `Track: ${t.title}${t.year ? ` (${t.year})` : ""}`, `Platform: ${P}`, `Day: ${a.date}`,
    `${P} link: ${link(t, a.platform)}`, appUrl ? `Dashboard: ${appUrl}` : "",
    a.simulated ? "\nThese numbers are simulated: no data provider is connected yet." : "",
  ].filter(Boolean).join("\n");
  const accent = a.platform === "tiktok" ? "#ff2d55" : "#1ed760";
  const html = `<!doctype html><html><body style="margin:0;background:#0d0d0f;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#f2f0ea">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border-collapse:collapse"><tr><td>
    ${a.simulated ? `<p style="margin:0 0 12px;padding:8px 12px;background:#3a3000;color:#ffd84a;font-size:12px;letter-spacing:.08em">SIMULATED DATA · no provider connected</p>` : ""}
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.16em;color:#8a877e">MUSIC ACTIVITY ALERT · ${artist.name.toUpperCase()}</p>
    <h1 style="margin:0 0 18px;font-size:30px;line-height:1.1;font-weight:700">${t.title}${t.year ? ` <span style="color:#8a877e;font-weight:400">(${t.year})</span>` : ""}</h1>
    <table role="presentation" width="100%" style="border-collapse:collapse;background:#17171b;border-left:4px solid ${accent}">
      <tr><td style="padding:18px 20px">
        <p style="margin:0;font-size:12px;letter-spacing:.12em;color:${accent}">${P.toUpperCase()}</p>
        <p style="margin:6px 0 2px;font-size:40px;font-weight:700;line-height:1">${n(a.level)}</p>
        <p style="margin:0;color:#b9b5aa">new ${unitShort[a.platform]} in 24 hours</p>
      </td><td style="padding:18px 20px;text-align:right;vertical-align:bottom">
        <p style="margin:0;font-size:28px;font-weight:700;color:${accent}">+${n(a.pct)}%</p>
        <p style="margin:2px 0 0;color:#b9b5aa">+${n(a.change)} vs ${n(a.baseline)}/day</p>
      </td></tr></table>
    <p style="margin:18px 0;color:#d6d2c6;line-height:1.5">${lines.join("<br>")}</p>
    <a href="${link(t, a.platform)}" style="display:inline-block;padding:12px 18px;background:${accent};color:#0d0d0f;text-decoration:none;font-weight:700">${action[a.platform]} →</a>
    ${appUrl ? `<a href="${appUrl}" style="display:inline-block;margin-left:12px;color:#b9b5aa">Open dashboard</a>` : ""}
    <p style="margin:28px 0 0;font-size:11px;color:#6a675f">TMWRK Roster Intelligence · ${a.date} · one email per event, no repeats while it holds.</p>
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
