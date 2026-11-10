"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, issue, passwordOk } from "@/lib/auth";
import { collect } from "@/lib/collect";
import { compose, send } from "@/lib/email";
import { provider } from "@/lib/providers";
import { simulate } from "@/lib/providers/demo";
import { latest } from "@/lib/detect";
import { store } from "@/lib/store";
import { DEFAULT_THRESHOLDS, type Alert, type Thresholds } from "@/lib/types";

export async function login(_: unknown, form: FormData) {
  if (!passwordOk(String(form.get("password") ?? ""))) return { error: "That's not it." };
  const c = await issue();
  (await cookies()).set(COOKIE, c.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: c.maxAge, path: "/" });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function runNow() {
  await collect();
  revalidatePath("/", "layout");
}

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** an ISRC, a Spotify track link/URI/id: whichever was pasted */
function parseId(raw: string) {
  const s = raw.trim();
  const sp = s.match(/(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/) ?? s.match(/^([A-Za-z0-9]{22})$/);
  if (sp) return { spotifyId: sp[1] };
  const isrc = s.replace(/-/g, "").toUpperCase();
  if (/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc)) return { isrc };
  return null;
}

export async function addTrack(_: unknown, form: FormData) {
  const s = store();
  const title = String(form.get("title") ?? "").trim();
  let artistId = String(form.get("artist") ?? "");
  const newArtist = String(form.get("newArtist") ?? "").trim();
  if (newArtist) {
    artistId = slug(newArtist);
    await s.upsertArtist({ id: artistId, name: newArtist });
  }
  if (!title || !artistId) return { error: "A title and an artist, please." };
  const tracks = await s.tracks();
  if (tracks.length >= 20) return { error: "The MVP watches up to 20 tracks. Remove one first." };
  const id = parseId(String(form.get("id") ?? ""));
  if (!id) return { error: "Paste an ISRC (e.g. USUM71703861) or a Spotify track link." };
  const p = provider();
  let found;
  try {
    found = await p.resolve(id);
  } catch (e) {
    return { error: `${p.name}: ${(e as Error).message}` };
  }
  if (!found) return { error: `${p.name} doesn't know that song yet. Check the ISRC or link.` };
  const year = Number(form.get("year")) || undefined;
  const tiktok = String(form.get("tiktok") ?? "").trim() || undefined;
  await s.upsertTrack({ id: `${artistId}-${slug(title)}`, artistId, title, year, ...id, tiktokSoundUrl: tiktok, providerId: found.providerId, addedAt: new Date().toISOString() });
  revalidatePath("/", "layout");
  return { ok: `Watching “${title}”. It fills in on the next run.` };
}

export async function removeTrack(form: FormData) {
  await store().removeTrack(String(form.get("id")));
  revalidatePath("/", "layout");
}

export async function saveThresholds(_: unknown, form: FormData) {
  const num = (k: string, d: number) => {
    const v = Number(form.get(k));
    return Number.isFinite(v) && v >= 0 ? v : d;
  };
  const D = DEFAULT_THRESHOLDS;
  const t: Thresholds = {
    minPct: num("minPct", D.minPct),
    minAbs: { spotify: num("minAbsSpotify", D.minAbs.spotify), tiktok: num("minAbsTiktok", D.minAbs.tiktok) },
    baselineFloor: { spotify: num("floorSpotify", D.baselineFloor.spotify), tiktok: num("floorTiktok", D.baselineFloor.tiktok) },
    window: Math.max(3, Math.min(28, Math.round(num("window", D.window)))),
    cooldownDays: Math.round(num("cooldownDays", D.cooldownDays)),
    escalatePct: num("escalatePct", D.escalatePct),
  };
  await store().setThresholds(t);
  revalidatePath("/", "layout");
  return { ok: "Saved. The next run uses these." };
}

/** The brief's success test, on demand: the simulated DRAMA TikTok spike, emailed for real. */
export async function sendTestAlert() {
  const today = new Date().toISOString().slice(0, 10);
  const sim = simulate(today);
  const track = sim.tracks.find((t) => t.id === "drama-2017")!;
  const r = latest(sim.snapshots.filter((x) => x.trackId === track.id), "tiktok", DEFAULT_THRESHOLDS)!;
  const a: Alert = { id: `test:${Date.now()}`, trackId: track.id, platform: "tiktok", date: r.date, level: r.level, baseline: r.baseline,
    change: r.change, pct: r.pct, sentAt: new Date().toISOString(), delivered: "outbox", simulated: true };
  await send(compose(a, track, sim.artists[0]), a.id);
  revalidatePath("/outbox");
  redirect("/outbox");
}
