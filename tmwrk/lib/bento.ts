// Everything the bento home shows, as plain data (it is handed to a client component).

import { PLATFORM_LABEL, type Platform } from "./types";
import { alertLine, clock, daysOver, longDate, progress, shortDate, times, type Row, type dashboard } from "./view";

type D = Awaited<ReturnType<typeof dashboard>>;

export type Feature = {
  id: string; title: string; artist: string; year?: number;
  platform: Platform; platformLabel: string;
  kind: "alert" | "held" | "rising" | "closest";
  level: number; usual: number; line: number; times: string; pct: number;
  daysOver: number; last7Over: boolean[];
  series: number[]; seriesDates: string[];
  other: { label: string; level: number; usual: number };
  link: string;
};

export type Bento = {
  today: string; todayLong: string; checkedAt: string | null; simulated: boolean;
  features: Feature[];
  rings: { title: string; platform: string; p: number }[];
  alerts: { id: string; trackId: string; title: string; platform: Platform; level: number; times: string; when: string }[];
  tracks: { id: string; title: string; artist: string; artistId: string; status: string; platform: string; p: number; times: string; hot: boolean }[];
  artists: { id: string; name: string }[];
  week: { label: string; day: number; date: string; today: boolean; alerts: number }[];
  weekTitle: string;
  rule: Record<Platform, { times: string; extra: number }>;
  count: number;
};

const ORDER: Record<string, number> = { spike: 0, held: 1, rising: 2 };

export function bento(d: D, links: (r: Row, p: Platform) => string): Bento {
  const t = d.thresholds;
  const today = d.latestDay || new Date().toISOString().slice(0, 10);
  const feat = (r: Row, p: Platform, kind: Feature["kind"]): Feature => {
    const s = r.signals[p], o = r.signals[p === "tiktok" ? "spotify" : "tiktok"];
    const last7 = s.days.slice(-7).map((_, i, arr) => {
      const idx = s.days.length - arr.length + i;
      const base = s.days.slice(Math.max(0, idx - t.window), idx);
      const u = base.length ? base.reduce((a, b) => a + b.rate, 0) / base.length : 0;
      return u > 0 && s.days[idx].rate >= alertLine({ ...s, baseline: u }, t);
    });
    return {
      id: r.track.id, title: r.track.title, artist: r.artist.name, year: r.track.year,
      platform: p, platformLabel: PLATFORM_LABEL[p], kind,
      level: Math.round(s.level), usual: Math.round(s.baseline), line: alertLine(s, t), times: times(s.level, s.baseline),
      pct: s.baseline > 0 ? Math.round((s.level / s.baseline - 1) * 100) : 0,
      daysOver: daysOver(s, t), last7Over: last7,
      series: s.days.map((x) => Math.round(x.rate)), seriesDates: s.days.map((x) => x.date),
      other: { label: PLATFORM_LABEL[o.platform], level: Math.round(o.level), usual: Math.round(o.baseline) },
      link: links(r, p),
    };
  };
  const pairs = d.rows.flatMap((r) => (["tiktok", "spotify"] as Platform[]).map((p) => ({ r, p, s: r.signals[p] })));
  const hot = pairs.filter((x) => x.s.status in ORDER).sort((a, b) => ORDER[a.s.status] - ORDER[b.s.status] || progress(b.s, t) - progress(a.s, t));
  let features = hot.map((x) => feat(x.r, x.p, x.s.status === "spike" ? "alert" : (x.s.status as "held" | "rising")));
  if (!features.length && pairs.length) {
    const c = [...pairs].sort((a, b) => progress(b.s, t) - progress(a.s, t))[0];
    features = [feat(c.r, c.p, "closest")];
  }
  const rings = [...pairs].sort((a, b) => progress(b.s, t) - progress(a.s, t)).slice(0, 3)
    .map((x) => ({ title: x.r.track.title, platform: PLATFORM_LABEL[x.p], p: Math.max(0, progress(x.s, t)) }));
  const name = (id: string) => d.rows.find((r) => r.track.id === id)?.track.title ?? id;
  // the Monday-start week containing today
  const t0 = Date.parse(today + "T12:00:00Z"), dow = (new Date(t0).getUTCDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(t0 + (i - dow) * 86_400_000).toISOString().slice(0, 10);
    return { label: "MTWTFSS"[i], day: Number(date.slice(8)), date, today: date === today, alerts: d.alerts.filter((a) => a.date === date).length };
  });
  const jan1 = Date.UTC(new Date(t0).getUTCFullYear(), 0, 1);
  const weekNo = Math.ceil(((t0 - jan1) / 86_400_000 + new Date(jan1).getUTCDay() + 1) / 7);
  return {
    today, todayLong: longDate(today), checkedAt: d.lastOk ? clock(d.lastOk.at).replace(" UTC", "") : null, simulated: d.simulated,
    features,
    rings,
    alerts: d.alerts.slice(0, 6).map((a) => ({ id: a.id, trackId: a.trackId, title: name(a.trackId), platform: a.platform, level: Math.round(a.level), times: times(a.level, a.baseline), when: shortDate(a.date, today) })),
    tracks: d.rows.map((r) => {
      const best = (["tiktok", "spotify"] as Platform[]).map((p) => ({ p, s: r.signals[p] })).sort((a, b) => progress(b.s, t) - progress(a.s, t))[0];
      return { id: r.track.id, title: r.track.title, artist: r.artist.name, artistId: r.artist.id, status: r.status, platform: PLATFORM_LABEL[best.p],
        p: Math.max(0, Math.min(1, progress(best.s, t))), times: times(best.s.level, best.s.baseline), hot: ["spike", "held", "rising"].includes(r.status) };
    }),
    artists: [...new Map(d.rows.map((r) => [r.artist.id, { id: r.artist.id, name: r.artist.name }])).values()],
    week,
    weekTitle: `${new Date(t0).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })} · Week ${weekNo}`,
    rule: {
      tiktok: { times: `${(1 + t.minPct / 100).toFixed(1).replace(/\.0$/, "")}×`, extra: t.minAbs.tiktok },
      spotify: { times: `${(1 + t.minPct / 100).toFixed(1).replace(/\.0$/, "")}×`, extra: t.minAbs.spotify },
    },
    count: d.rows.length,
  };
}
