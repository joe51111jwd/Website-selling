import Link from "next/link";
import { Shell } from "@/components/Shell";
import { collect } from "@/lib/collect";
import { link } from "@/lib/email";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { PLATFORM_LABEL, type Alert, type Platform, type Thresholds } from "@/lib/types";
import { STATUS_LABEL, alertLine, clock, dashboard, daysOver, per, progress, times, type Row } from "@/lib/view";

export const dynamic = "force-dynamic";

const UNIT: Record<Platform, string> = { spotify: "streams", tiktok: "creations" };
const other = (p: Platform): Platform => (p === "tiktok" ? "spotify" : "tiktok");
const day = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
const ddmm = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).toUpperCase();

export default async function Home() {
  if (provider().simulated && (await store().isEmpty())) await collect();
  const d = await dashboard();
  const t = d.thresholds;
  const today = d.latestDay;
  const todays = d.alerts.filter((a) => a.date === today).sort((a, b) => b.pct - a.pct);
  const watching = d.rows.filter((r) => r.status === "rising" || r.status === "held");
  const byArtist = [...new Map(d.rows.map((r) => [r.artist.id, r.artist])).values()].map((a) => ({ a, rows: d.rows.filter((r) => r.artist.id === a.id) }));
  let n = 0;
  const sec = () => <i className="sec__n">{String(++n).padStart(2, "0")}</i>;

  return (
    <Shell here="/">
      <div className="meta">
        <span>{today ? day(today) : "No data yet"}</span>
        <span>{d.lastOk ? `Checked ${clock(d.lastOk.at)}` : "Not checked yet"}</span>
        <span>{d.rows.length} tracks | {byArtist.length} artists</span>
        <span>{todays.length} {todays.length === 1 ? "alert" : "alerts"} today</span>
      </div>

      <section className="sec">
        <h2 className="sec__h"><span>{sec()}Today</span></h2>
        {todays.length ? todays.map((a) => {
          const r = d.rows.find((x) => x.track.id === a.trackId);
          return r ? <AlertBlock key={a.id} a={a} r={r} t={t} /> : null;
        }) : <Quiet rows={d.rows} t={t} />}
      </section>

      {watching.length > 0 && (
        <section className="sec">
          <h2 className="sec__h"><span>{sec()}Watching</span></h2>
          <ul className="lines">
            {watching.map((r) => {
              const p = (["tiktok", "spotify"] as Platform[]).find((x) => r.signals[x].status === r.status)!;
              const s = r.signals[p];
              return (
                <li key={r.track.id}>
                  <Link href={`/track/${r.track.id}`} className="line">
                    <span className="line__who"><b>{r.artist.name}</b> | {r.track.title}</span>
                    <span className="line__what">
                      {PLATFORM_LABEL[p]}: {per(s.level)} {UNIT[p]} | Usual {per(s.baseline)}/day | {r.status === "held" ? "Still over the line, already emailed" : `Alerts at ${per(alertLine(s, t))}`}
                    </span>
                    <span className="line__x">{times(s.level, s.baseline)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="sec">
        <h2 className="sec__h"><span>{sec()}Roster</span></h2>
        <div className="roster">
          <div className="roster__head" aria-hidden="true">
            <span>Track</span><span>Spotify / day</span><span /><span>TikTok / day</span><span /><span>Status</span>
          </div>
          {byArtist.map(({ a, rows }) => (
            <div key={a.id} className="artist">
              <h3 className="artist__name">{a.name}</h3>
              {rows.map((r) => <TrackRow key={r.track.id} r={r} />)}
            </div>
          ))}
          {!d.rows.length && <p className="none">No tracks yet. <Link href="/tracks">Add the first one.</Link></p>}
        </div>
      </section>

      <section className="sec">
        <h2 className="sec__h"><span>{sec()}Alert log</span> <Link href="/outbox">Emails</Link></h2>
        <div className="log">
          <div className="log__row log__head" aria-hidden="true"><span>Date</span><span>Artist | Track</span><span>Platform</span><span>Activity</span><span>Baseline</span><span>Change</span></div>
          {d.alerts.slice(0, 10).map((a) => {
            const r = d.rows.find((x) => x.track.id === a.trackId);
            return (
              <Link key={a.id} href={`/track/${a.trackId}`} className="log__row">
                <span>{ddmm(a.date)}</span>
                <span><b>{r?.artist.name}</b> | {r?.track.title ?? a.trackId}</span>
                <span>{PLATFORM_LABEL[a.platform]}</span>
                <span>{per(a.level)}</span>
                <span>{per(a.baseline)}/day</span>
                <span><b>+{per(a.pct)}%</b></span>
              </Link>
            );
          })}
          {!d.alerts.length && <p className="none">Nothing yet. The first alert lands here and in the team&apos;s inbox.</p>}
        </div>
      </section>
    </Shell>
  );
}

function AlertBlock({ a, r, t }: { a: Alert; r: Row; t: Thresholds }) {
  const s = r.signals[a.platform];
  const o = r.signals[other(a.platform)];
  const k = daysOver(s, t);
  const oRatio = o.baseline > 0 ? o.level / o.baseline : 1;
  const oWord = oRatio > 1.25 ? "also up" : oRatio < 0.75 ? "down" : "flat";
  return (
    <article className="alert">
      <p className="alert__kicker">Music activity alert | {r.artist.name} | {r.track.title}{r.track.year ? ` (${r.track.year})` : ""}</p>
      <div className="alert__grid">
        <p className="alert__x">{times(a.level, a.baseline)}</p>
        <dl className="alert__facts">
          <div><dt>{PLATFORM_LABEL[a.platform]}</dt><dd>{per(a.level)} new {UNIT[a.platform]} in 24 hours</dd></div>
          <div><dt>Baseline</dt><dd>{per(a.baseline)}/day</dd></div>
          <div><dt>Change</dt><dd>+{per(a.change)} {UNIT[a.platform]} / +{per(a.pct)}%</dd></div>
          <div><dt>{PLATFORM_LABEL[o.platform]}</dt><dd>{per(o.level)} {o.platform === "tiktok" ? "creations" : "streams"} | {oWord}</dd></div>
          <div><dt>Over the line</dt><dd>{k <= 1 ? "Day 1" : `Day ${k}`}</dd></div>
        </dl>
      </div>
      <div className="alert__act">
        <a href={link(r.track, a.platform)} target="_blank" rel="noopener" className="act">Action: {a.platform === "tiktok" ? "Review sound" : "Review track"} ↗</a>
        <Link href={`/track/${r.track.id}`} className="act act--ghost">30 days →</Link>
      </div>
    </article>
  );
}

function Quiet({ rows, t }: { rows: Row[]; t: Thresholds }) {
  if (!rows.length) return <p className="quiet">No tracks yet. <Link href="/tracks">Add up to 20 songs</Link> and the morning check starts watching them.</p>;
  const held = rows.find((r) => r.status === "held");
  const close = rows
    .flatMap((r) => (["tiktok", "spotify"] as Platform[]).filter((p) => r.signals[p].status !== "held").map((p) => ({ r, p, x: progress(r.signals[p], t) })))
    .sort((a, b) => b.x - a.x)[0];
  const cs = close?.r.signals[close.p];
  return (
    <div className="quiet">
      <p className="quiet__big">{held ? "No new alerts." : "Nothing crossed the line."}</p>
      <p>
        {held ? `${held.artist.name} | ${held.track.title} is still over the line and was already emailed.` : "No email went out this morning."}
        {close && cs && close.x > 0.3 && ` Closest: ${close.r.artist.name} | ${close.r.track.title} on ${PLATFORM_LABEL[close.p]}, ${per(cs.level)} against an alert line of ${per(alertLine(cs, t))}.`}
      </p>
    </div>
  );
}

function TrackRow({ r }: { r: Row }) {
  const cell = (p: Platform) => {
    const s = r.signals[p];
    const hot = s.status === "spike" || s.status === "held" || s.status === "rising";
    const off = s.baseline > 0 && Math.abs(s.level / s.baseline - 1) >= 0.25;
    return (
      <>
        <span className={`num ${hot ? "num--hot" : ""}`}><em className="m">{PLATFORM_LABEL[p]}</em>{s.status === "waiting" ? "–" : per(s.level)}</span>
        <span className={`x ${hot ? "x--hot" : ""}`}>{s.status !== "waiting" && (hot || off) ? times(s.level, s.baseline) : ""}</span>
      </>
    );
  };
  return (
    <Link href={`/track/${r.track.id}`} className={`trk trk--${r.status}`}>
      <span className="trk__name">{r.track.title}{r.track.year ? <i> {r.track.year}</i> : null}</span>
      {cell("spotify")}
      {cell("tiktok")}
      <span className={`tag tag--${r.status}`}>{STATUS_LABEL[r.status]}</span>
    </Link>
  );
}
