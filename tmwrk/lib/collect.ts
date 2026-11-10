// The daily job: pull the last 30 days for every track on both platforms, store them, judge the newest
// day, and email anything that crossed a threshold. Run by Vercel Cron (/api/cron), the "Run now" button,
// or `npm run collect`.

import { isoDay, latest, shouldAlert, dailyRates, judge } from "./detect";
import { compose, send } from "./email";
import { provider } from "./providers";
import { DEMO_ARTISTS, DEMO_TRACKS, simulate } from "./providers/demo";
import { store } from "./store";
import { PLATFORMS, type Alert, type RunLog, type Snapshot } from "./types";

export async function collect(opts: { today?: string } = {}): Promise<RunLog> {
  const s = store(), p = provider();
  const today = opts.today ?? isoDay(Date.now());
  const start = isoDay(Date.parse(today + "T00:00:00Z") - 30 * 86_400_000);
  const run: RunLog = { at: new Date().toISOString(), ok: true, source: p.name, simulated: p.simulated, snapshots: 0, alerts: 0 };
  const errors: string[] = [];
  try {
    if (p.simulated && (await s.isEmpty())) await seedDemo(today);
    const [tracks, artists, t] = await Promise.all([s.tracks(), s.artists(), s.thresholds()]);
    for (const track of tracks) {
      const artist = artists.find((a) => a.id === track.artistId) ?? { id: track.artistId, name: track.artistId };
      for (const platform of PLATFORMS) {
        try {
          const rows = await p.series(track, platform, start, today);
          const snaps: Snapshot[] = rows.map((r) => ({ trackId: track.id, platform, date: r.date, total: r.total }));
          await s.putSnapshots(snaps);
          run.snapshots += snaps.length;
          const all = (await s.snapshots({ trackId: track.id, since: start })).filter((x) => x.platform === platform);
          const r = latest(all, platform, t);
          if (!r) continue;
          const prev = await s.alerts({ trackId: track.id, platform, limit: 20 });
          if (!shouldAlert(r, prev, t)) continue;
          const a: Alert = {
            id: `${track.id}:${platform}:${r.date}`, trackId: track.id, platform, date: r.date,
            level: r.level, baseline: r.baseline, change: r.change, pct: r.pct,
            sentAt: new Date().toISOString(), delivered: "outbox", simulated: p.simulated,
          };
          a.delivered = await send(compose(a, track, artist), a.id);
          await s.putAlert(a);
          run.alerts++;
        } catch (e) {
          errors.push(`${track.title} / ${platform}: ${(e as Error).message}`);
        }
      }
    }
  } catch (e) {
    errors.push((e as Error).message);
  }
  if (errors.length) { run.ok = errors.length < 3 && run.snapshots > 0; run.error = errors.slice(0, 5).join("; "); }
  await s.putRun(run);
  return run;
}

/**
 * First run with no provider: load the simulated roster and replay the last two weeks through the same
 * detector, so the dashboard opens with a history (alerts marked simulated, none of them emailed).
 */
export async function seedDemo(today: string) {
  const s = store();
  const sim = simulate(today);
  for (const a of DEMO_ARTISTS) await s.upsertArtist(a);
  for (const t of DEMO_TRACKS) await s.upsertTrack(t);
  await s.putSnapshots(sim.snapshots);
  const t = await s.thresholds();
  for (const track of DEMO_TRACKS) {
    for (const platform of PLATFORMS) {
      const days = dailyRates(sim.snapshots.filter((x) => x.trackId === track.id && x.platform === platform));
      const sent: Alert[] = [];
      for (let i = days.length - 14; i < days.length - 1; i++) {
        const r = judge(days, i, platform, t);
        if (!shouldAlert(r, sent, t)) continue;
        const a: Alert = { id: `${track.id}:${platform}:${r.date}`, trackId: track.id, platform, date: r.date, level: r.level, baseline: r.baseline,
          change: r.change, pct: r.pct, sentAt: new Date(Date.parse(r.date + "T07:05:00Z")).toISOString(), delivered: "outbox", simulated: true };
        sent.push(a);
        await s.putAlert(a);
      }
    }
  }
}
