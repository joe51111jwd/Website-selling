// SIMULATED DATA. Made-up numbers that exercise the alert logic before a data provider is signed. Every
// screen and email built from it is labelled "Simulated". It plays out the brief's success test: an older
// DRAMA track takes off on TikTok (about 50 new videos a day, then 1,000 in 24 hours) while its Spotify
// streams stay flat. Track names are placeholders until TMWRK picks the twenty.

import { isoDay } from "../detect";
import type { Artist, Platform, Snapshot, Track } from "../types";
import type { Provider, Reading } from "./index";

export const DEMO_ARTISTS: Artist[] = [
  { id: "drama", name: "DRAMA" },
  { id: "major-lazer", name: "Major Lazer" },
  { id: "artist-3", name: "Artist 3 (TBC)" },
];

type Plan = { spotify: number; tiktok: number; events?: { platform: Platform; daysAgo: number; to: number; ramp?: number }[]; tiktokEvery?: number };

const T = (id: string, artistId: string, title: string, year: number, plan: Plan) => ({ track: { id, artistId, title, year, addedAt: "2026-11-01" } as Track, plan });

const CATALOG = [
  T("drama-2017", "drama", "Older single", 2017, { spotify: 6_200, tiktok: 50, events: [{ platform: "tiktok", daysAgo: 0, to: 1_000 }] }),
  T("drama-2019", "drama", "Album cut", 2019, { spotify: 3_100, tiktok: 22 }),
  T("drama-2023", "drama", "Deep cut", 2023, { spotify: 1_900, tiktok: 14, tiktokEvery: 2 }),
  T("drama-2025", "drama", "Recent single", 2025, { spotify: 21_000, tiktok: 140 }),
  T("ml-pon", "major-lazer", "Pon de Floor", 2009, { spotify: 24_000, tiktok: 90, events: [{ platform: "spotify", daysAgo: 4, to: 92_000, ramp: 2 }] }),
  T("ml-lean", "major-lazer", "Lean On", 2015, { spotify: 410_000, tiktok: 600 }),
  T("ml-cold", "major-lazer", "Cold Water", 2016, { spotify: 230_000, tiktok: 380 }),
  T("ml-bubble", "major-lazer", "Bubble Butt", 2013, { spotify: 38_000, tiktok: 180, events: [{ platform: "tiktok", daysAgo: 0, to: 340, ramp: 3 }] }),
  T("ml-light", "major-lazer", "Light It Up", 2015, { spotify: 150_000, tiktok: 260, tiktokEvery: 2 }),
  T("a3-1", "artist-3", "Track one", 2021, { spotify: 9_000, tiktok: 40, events: [{ platform: "tiktok", daysAgo: 9, to: 2_600 }] }),
  T("a3-2", "artist-3", "Track two", 2022, { spotify: 12_500, tiktok: 65 }),
  T("a3-3", "artist-3", "Track three", 2024, { spotify: 5_400, tiktok: 30 }),
];

export const DEMO_TRACKS: Track[] = CATALOG.map((c) => c.track);

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

/** day-by-day activity for one track on one platform, ending today */
function activity(id: string, platform: Platform, plan: Plan, today: string, days: number) {
  const r = rng([...id + platform].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483647 || 1);
  const t0 = Date.parse(today + "T00:00:00Z");
  const base = plan[platform];
  const out: { date: string; rate: number }[] = [];
  for (let k = days - 1; k >= 0; k--) {
    const date = isoDay(t0 - k * 86_400_000);
    const dow = new Date(date).getUTCDay();
    let rate = base * (dow === 5 || dow === 6 ? 1.07 : 1) * (0.94 + r() * 0.12);
    for (const e of plan.events ?? []) {
      if (e.platform !== platform) continue;
      const ramp = e.ramp ?? 1;
      if (k <= e.daysAgo + ramp - 1 && k >= e.daysAgo) {
        const step = (e.daysAgo + ramp - k) / ramp; // 1/ramp .. 1
        rate = base + (e.to - base) * step;
      } else if (k < e.daysAgo) {
        rate = Math.max(base, e.to * 0.55 ** (e.daysAgo - k)); // it fades after
      }
    }
    out.push({ date, rate: Math.round(rate) });
  }
  return out;
}

export function simulate(today = isoDay(Date.now()), days = 45) {
  const snapshots: Snapshot[] = [];
  for (const { track, plan } of CATALOG) {
    for (const platform of ["spotify", "tiktok"] as Platform[]) {
      let total = Math.round(plan[platform] * (2026 - (track.year ?? 2020) + 1) * 300);
      const every = platform === "tiktok" ? plan.tiktokEvery ?? 1 : 1;
      activity(track.id, platform, plan, today, days).forEach((d, i, all) => {
        total += d.rate;
        if (i % every === (all.length - 1) % every) snapshots.push({ trackId: track.id, platform, date: d.date, total });
      });
    }
  }
  return { artists: DEMO_ARTISTS, tracks: DEMO_TRACKS, snapshots };
}

export const demo: Provider = {
  name: "Simulated",
  simulated: true,
  async resolve({ isrc, spotifyId }) {
    return { providerId: `sim-${isrc ?? spotifyId}` };
  },
  async series(track, platform, start, end): Promise<Reading[]> {
    const { snapshots } = simulate(end);
    let rows = snapshots.filter((s) => s.trackId === track.id && s.platform === platform && s.date >= start && s.date <= end);
    if (!rows.length) {
      // a track added by hand: give it a quiet, steady line
      const plan: Plan = { spotify: 4_000, tiktok: 25 };
      let total = 1_000_000;
      rows = activity(track.id, platform, plan, end, 30).map((d) => ({ trackId: track.id, platform, date: d.date, total: (total += d.rate) }));
    }
    return rows.map(({ date, total }) => ({ date, total }));
  },
};
