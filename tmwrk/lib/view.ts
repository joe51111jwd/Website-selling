// Everything the dashboard shows, worked out in one place from the store.

import { dailyRates, judge, type Day } from "./detect";
import { provider } from "./providers";
import { store } from "./store";
import { PLATFORMS, type Alert, type Artist, type Platform, type Thresholds, type Track } from "./types";

export type Status = "spike" | "rising" | "quiet" | "cooling" | "waiting";

export type Signal = {
  platform: Platform;
  days: Day[]; // last 30
  level: number;
  baseline: number;
  pct: number;
  status: Status;
};

export type Row = { track: Track; artist: Artist; signals: Record<Platform, Signal>; lastAlert?: Alert; status: Status; catalogAge: number | null };

function signal(days: Day[], platform: Platform, t: Thresholds, alerts: Alert[]): Signal {
  if (days.length < 2) return { platform, days, level: 0, baseline: 0, pct: 0, status: "waiting" };
  const r = judge(days, days.length - 1, platform, t);
  const recent = alerts.find((a) => a.platform === platform && (Date.parse(days[days.length - 1].date) - Date.parse(a.date)) / 86_400_000 <= 4);
  const status: Status = !r.ready ? "waiting" : r.spike ? "spike" : r.pct >= t.minPct * 0.35 ? "rising" : recent ? "cooling" : "quiet";
  return { platform, days: days.slice(-30), level: r.level, baseline: r.baseline, pct: r.pct, status };
}

const rank: Record<Status, number> = { spike: 0, rising: 1, cooling: 2, quiet: 3, waiting: 4 };

export async function dashboard() {
  const s = store();
  const p = provider();
  const [tracks, artists, snaps, alerts, runs, t] = await Promise.all([s.tracks(), s.artists(), s.snapshots(), s.alerts({ limit: 60 }), s.runs(10), s.thresholds()]);
  const thisYear = new Date().getUTCFullYear();
  const rows: Row[] = tracks.map((track) => {
    const mine = snaps.filter((x) => x.trackId === track.id);
    const ta = alerts.filter((a) => a.trackId === track.id);
    const signals = Object.fromEntries(
      PLATFORMS.map((pl) => [pl, signal(dailyRates(mine.filter((x) => x.platform === pl)), pl, t, ta)]),
    ) as Record<Platform, Signal>;
    const status = PLATFORMS.map((pl) => signals[pl].status).sort((a, b) => rank[a] - rank[b])[0];
    return {
      track,
      artist: artists.find((a) => a.id === track.artistId) ?? { id: track.artistId, name: track.artistId },
      signals,
      lastAlert: ta[0],
      status,
      catalogAge: track.year ? thisYear - track.year : null,
    };
  });
  rows.sort((a, b) => rank[a.status] - rank[b.status] || a.artist.name.localeCompare(b.artist.name) || (a.track.year ?? 0) - (b.track.year ?? 0));
  const lastOk = runs.find((r) => r.ok);
  const latestDay = snaps.reduce((m, x) => (x.date > m ? x.date : m), "");
  return { rows, alerts, runs, lastOk, latestDay, thresholds: t, source: p.name, simulated: p.simulated || alerts.some((a) => a.simulated), artists };
}

export const fmt = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M";
  if (a >= 1e4) return Math.round(n / 1e3) + "K";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
};
export const full = (n: number) => Math.round(n).toLocaleString("en-US");
export const pctFmt = (p: number) => `${p >= 0 ? "+" : "−"}${Math.abs(Math.round(p)).toLocaleString("en-US")}%`;

export function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

// ----- small helpers for the screens -----

export const STATUS_LABEL: Record<Status, string> = {
  spike: "Alert",
  rising: "Rising",
  cooling: "Easing off",
  quiet: "Normal",
  waiting: "Collecting data",
};

/** how many times its usual a reading is (1 decimal under 10, whole above) */
export function times(level: number, baseline: number) {
  if (baseline <= 0) return level > 0 ? "new" : "–";
  const x = level / baseline;
  return x >= 10 ? `${Math.round(x)}×` : `${x.toFixed(1)}×`;
}

export const per = (n: number) => Math.round(n).toLocaleString("en-US");

export function shortDate(iso: string, today?: string) {
  if (today && iso === today) return "Today";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function longDate(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}

/** days in a row the newest readings have stayed over the alert line */
export function daysOver(s: Signal, t: Thresholds) {
  let n = 0;
  for (let i = s.days.length - 1; i >= 0; i--) {
    const r = judge(s.days, i, s.platform, t);
    if (!r.spike) break;
    n++;
  }
  return n;
}

/** the daily level that would trigger an alert, from the same rules the detector uses (rounded up) */
export function alertLine(s: Signal, t: Thresholds) {
  const base = Math.max(s.baseline, t.baselineFloor[s.platform]);
  return Math.ceil(Math.max(base * (1 + t.minPct / 100), s.baseline + t.minAbs[s.platform]));
}
