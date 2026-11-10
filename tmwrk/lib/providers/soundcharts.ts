// Soundcharts (https://developers.soundcharts.com). One endpoint covers both signals:
//   GET /api/v2/song/{uuid}/audience/spotify  → cumulative Spotify streams, refreshed daily
//   GET /api/v2/song/{uuid}/audience/tiktok   → cumulative TikTok video count (creations)
// Each response has items[].date and items[].plots[] {identifier, value}, one plot per platform id linked
// to the song. A song can carry several Spotify ids that repeat the same total, so Spotify counts each
// distinct value once; TikTok has one plot per sound, and the song's total is their sum.
// Starter plan ($50/mo, 10k calls) covers 20 tracks × 2 calls a day with room for backfills.

import type { Platform, Track } from "../types";
import type { Provider, Reading } from "./index";

const BASE = process.env.SOUNDCHARTS_BASE ?? "https://customer.api.soundcharts.com";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "x-app-id": process.env.SOUNDCHARTS_APP_ID!, "x-api-key": process.env.SOUNDCHARTS_API_KEY! },
    cache: "no-store",
  });
  if (res.status === 404) throw Object.assign(new Error(`Soundcharts: not found ${path}`), { status: 404 });
  if (!res.ok) throw new Error(`Soundcharts ${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

type SongObj = { object?: { uuid: string; name?: string; creditName?: string } };
type Audience = { items?: { date: string; plots?: { identifier: string; value: number }[] }[] };

export const soundcharts: Provider = {
  name: "Soundcharts",
  simulated: false,

  async resolve({ isrc, spotifyId }) {
    const path = isrc ? `/api/v2.25/song/by-isrc/${encodeURIComponent(isrc)}` : spotifyId ? `/api/v2.25/song/by-platform/spotify/${encodeURIComponent(spotifyId)}` : null;
    if (!path) return null;
    try {
      const r = await get<SongObj>(path);
      return r.object ? { providerId: r.object.uuid, title: r.object.name, artist: r.object.creditName } : null;
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async series(track: Track, platform: Platform, start: string, end: string): Promise<Reading[]> {
    if (!track.providerId) throw new Error(`${track.title}: no Soundcharts id yet (add it by ISRC or Spotify link)`);
    const r = await get<Audience>(`/api/v2/song/${track.providerId}/audience/${platform}?startDate=${start}&endDate=${end}`);
    const out: Reading[] = [];
    for (const it of r.items ?? []) {
      const values = (it.plots ?? []).map((p) => p.value).filter((v) => Number.isFinite(v));
      if (!values.length) continue;
      const total = platform === "spotify" ? [...new Set(values)].reduce((a, b) => a + b, 0) : values.reduce((a, b) => a + b, 0);
      out.push({ date: it.date.slice(0, 10), total });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  },
};
