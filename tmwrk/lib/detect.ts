// Spike detection. Pure functions, no I/O: the daily job and the tests both call these.
//
// Providers give cumulative totals (streams to date, videos to date), and not always every day (TikTok
// counts refresh every one to two days). So totals become a per-day rate first: the gain between two
// readings spread evenly over the days between them. Then each day's rate is compared with the average
// rate of the `window` days before it. A day is a spike when it clears BOTH the percentage and the absolute
// bar. Spotify and TikTok are judged separately, so either one can fire on its own.

import type { Alert, Platform, Snapshot, Thresholds } from "./types";

export type Day = { date: string; rate: number };

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(d + "T00:00:00Z");
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** cumulative readings → per-day activity, filling gaps evenly */
export function dailyRates(snaps: Pick<Snapshot, "date" | "total">[]): Day[] {
  const s = [...snaps].sort((a, b) => a.date.localeCompare(b.date));
  const out: Day[] = [];
  for (let i = 1; i < s.length; i++) {
    const span = Math.round((toMs(s[i].date) - toMs(s[i - 1].date)) / DAY);
    if (span <= 0) continue;
    // a total that goes down is a provider correction: count it as no activity, not negative
    const rate = Math.max(0, s[i].total - s[i - 1].total) / span;
    for (let k = span - 1; k >= 0; k--) out.push({ date: isoDay(toMs(s[i].date) - k * DAY), rate });
  }
  return out;
}

export type Reading = {
  date: string;
  level: number;
  baseline: number;
  change: number;
  pct: number;
  spike: boolean;
  /** enough history to judge */
  ready: boolean;
};

export function judge(days: Day[], i: number, platform: Platform, t: Thresholds): Reading {
  const d = days[i];
  const prior = days.slice(Math.max(0, i - t.window), i);
  const ready = prior.length >= Math.min(t.window, 4);
  const mean = prior.length ? prior.reduce((a, b) => a + b.rate, 0) / prior.length : 0;
  // with enough history, a spike and its fade shouldn't become the new "usual": take the lower of the
  // 7-day mean and the 28-day median
  const long = days.slice(Math.max(0, i - 28), i).map((d) => d.rate).sort((a, b) => a - b);
  const median = long.length ? long[Math.floor(long.length / 2)] : 0;
  const raw = long.length >= 14 ? Math.min(mean, median) : mean;
  const baseline = Math.max(raw, t.baselineFloor[platform]);
  const change = d.rate - raw;
  const pct = (d.rate / baseline - 1) * 100;
  const spike = ready && pct >= t.minPct && change >= t.minAbs[platform];
  return { date: d.date, level: d.rate, baseline: raw, change, pct, spike, ready };
}

/** the newest day's reading for one track on one platform */
export function latest(snaps: Snapshot[], platform: Platform, t: Thresholds): Reading | null {
  const days = dailyRates(snaps.filter((s) => s.platform === platform));
  if (!days.length) return null;
  return judge(days, days.length - 1, platform, t);
}

/**
 * Should this reading send an email? Not if this exact event (track, platform, day) was already sent, and not
 * if the same spike is still running at about the level we last alerted (cooldown), unless it has grown.
 */
export function shouldAlert(r: Reading, previous: Pick<Alert, "date" | "level">[], t: Thresholds) {
  if (!r.spike) return false;
  if (previous.some((p) => p.date === r.date)) return false;
  const recent = previous
    .filter((p) => (toMs(r.date) - toMs(p.date)) / DAY <= t.cooldownDays && p.date < r.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (recent && r.level < recent.level * (1 + t.escalatePct / 100)) return false;
  return true;
}

/** the last n days of activity, for sparklines */
export function trend(snaps: Snapshot[], platform: Platform, n = 7) {
  return dailyRates(snaps.filter((s) => s.platform === platform)).slice(-n);
}
