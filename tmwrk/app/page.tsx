import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { collect } from "@/lib/collect";
import { link } from "@/lib/email";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { PLATFORM_LABEL, type Alert, type Platform, type Thresholds } from "@/lib/types";
import { STATUS_LABEL, alertLine, clock, dashboard, daysOver, longDate, per, shortDate, times, type Row } from "@/lib/view";

export const dynamic = "force-dynamic";

const UNIT: Record<Platform, string> = { spotify: "streams", tiktok: "new videos" };
const other = (p: Platform): Platform => (p === "tiktok" ? "spotify" : "tiktok");

export default async function Home({ searchParams }: { searchParams: Promise<{ artist?: string }> }) {
  const { artist } = await searchParams;
  // first visit with no provider: load the demo roster so there is something to look at
  if (provider().simulated && (await store().isEmpty())) await collect();
  const d = await dashboard();
  const today = d.latestDay;
  const todays = d.alerts.filter((a) => a.date === today).sort((a, b) => b.pct - a.pct);
  const rising = d.rows.filter((r) => r.status === "rising");
  const artists = [...new Map(d.rows.map((r) => [r.artist.id, r.artist])).values()];
  const rows = artist ? d.rows.filter((r) => r.artist.id === artist) : d.rows;
  const readings = d.rows.length * 2;

  return (
    <Shell here="/">
      <header className="head">
        <div>
          <h1>{today ? longDate(today) : "Today"}</h1>
          <p className="head__sub">{d.lastOk ? `Checked at ${clock(d.lastOk.at)}` : "Waiting for the first check"}</p>
        </div>
        <div className="stats" aria-label="Today">
          <span><b>{d.rows.length}</b> tracks</span>
          <span><b>{todays.length}</b> {todays.length === 1 ? "alert" : "alerts"} today</span>
          <span><b>{readings}</b> readings</span>
        </div>
      </header>

      {todays.length ? (
        todays.slice(0, 3).map((a) => {
          const r = d.rows.find((x) => x.track.id === a.trackId);
          return r ? <AlertCard key={a.id} a={a} r={r} t={d.thresholds} /> : null;
        })
      ) : (
        <Quiet rows={d.rows} />
      )}

      {rising.length > 0 && (
        <>
          <h2 className="label">Worth watching</h2>
          <div className="list">
            {rising.map((r) => {
              const pl = (["tiktok", "spotify"] as Platform[]).find((p) => r.signals[p].status === "rising")!;
              const s = r.signals[pl];
              return (
                <Link key={r.track.id} href={`/track/${r.track.id}`} className="arow">
                  <span className="arow__when"><span className="status"><i className="dot dot--rising" />Rising</span></span>
                  <span className="arow__what">
                    <b>{r.track.title}</b> · {r.artist.name}
                    <span>{PLATFORM_LABEL[pl]}: {per(s.level)} {UNIT[pl]} a day, usually {per(s.baseline)}. An alert goes out at {per(alertLine(s, d.thresholds))}.</span>
                  </span>
                  <span className="arow__x">{times(s.level, s.baseline)}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <h2 className="label">Recent alerts <Link href="/outbox">See the emails</Link></h2>
      <div className="list">
        {d.alerts.slice(0, 8).map((a) => {
          const r = d.rows.find((x) => x.track.id === a.trackId);
          return (
            <Link key={a.id} href={`/track/${a.trackId}`} className="arow">
              <span className="arow__when">{shortDate(a.date, today)}</span>
              <span className="arow__what">
                <b>{r?.track.title ?? a.trackId}</b>{r && <> · {r.artist.name}</>}
                <span>
                  <i className={`dot dot--${a.platform}`} /> {PLATFORM_LABEL[a.platform]}: {per(a.level)} {UNIT[a.platform]} in a day, usually {per(a.baseline)}
                </span>
              </span>
              <span className="arow__x">{times(a.level, a.baseline)}</span>
            </Link>
          );
        })}
        {!d.alerts.length && <p className="empty">No alerts yet. When a track crosses the line, it shows up here and the team gets an email.</p>}
      </div>

      <h2 className="label">Tracks</h2>
      <nav className="tabs" aria-label="Filter by artist">
        <Link href="/" aria-current={!artist ? "page" : undefined}>All</Link>
        {artists.map((a) => (
          <Link key={a.id} href={`/?artist=${a.id}`} aria-current={artist === a.id ? "page" : undefined}>{a.name}</Link>
        ))}
      </nav>
      <div className="list">
        <div className="trow trow--head" aria-hidden="true">
          <span>Track</span><span>Spotify streams a day</span><span>TikTok new videos a day</span><span>Status</span>
        </div>
        {rows.map((r) => <TrackRow key={r.track.id} r={r} />)}
        {!rows.length && <p className="empty">No tracks yet. <Link href="/tracks" className="btn--text">Add one</Link></p>}
      </div>
    </Shell>
  );
}

function AlertCard({ a, r, t }: { a: Alert; r: Row; t: Thresholds }) {
  const s = r.signals[a.platform];
  const o = r.signals[other(a.platform)];
  const n = daysOver(s, t);
  const otherMoved = o.baseline > 0 && Math.abs(o.level / o.baseline - 1) > 0.25;
  return (
    <section className="hero">
      <p className="hero__meta">
        <i className={`dot dot--${a.platform}`} />
        {PLATFORM_LABEL[a.platform]} alert · {n <= 1 ? "first day over the line" : `${n} days over the line`}
      </p>
      <h2>
        <em>{r.track.title}</em> by {r.artist.name} is at {times(a.level, a.baseline)} its usual on {PLATFORM_LABEL[a.platform]}.
      </h2>
      <p>
        <b>{per(a.level)}</b> {a.platform === "tiktok" ? "new TikTok videos used the sound" : "Spotify streams"} in the last 24 hours. It usually gets about <b>{per(a.baseline)}</b> a day.{" "}
        {PLATFORM_LABEL[o.platform]} {otherMoved ? `is moving too: ${per(o.level)} ${UNIT[o.platform]}, ${times(o.level, o.baseline)} its usual.` : `hasn't moved: ${per(o.level)} ${UNIT[o.platform]}, against a usual ${per(o.baseline)}.`}
      </p>
      <div className="btns">
        <a className="btn" href={link(r.track, a.platform)} target="_blank" rel="noopener">
          {a.platform === "tiktok" ? "Open the sound on TikTok" : "Open on Spotify"} <Icon name="ext" size={15} />
        </a>
        <Link className="btn btn--soft" href={`/track/${r.track.id}`}>See the last 30 days</Link>
      </div>
    </section>
  );
}

function Quiet({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return (
      <section className="hero hero--quiet">
        <h2>Add the songs you want watched.</h2>
        <p>Paste an ISRC or a Spotify link for up to 20 tracks. Each morning the check reads their Spotify streams and new TikTok videos, and emails the team when one jumps.</p>
        <div className="btns"><Link className="btn" href="/tracks">Add a track</Link></div>
      </section>
    );
  }
  const close = rows
    .flatMap((r) => (["tiktok", "spotify"] as Platform[]).map((p) => ({ r, p, x: r.signals[p].baseline ? r.signals[p].level / r.signals[p].baseline : 0 })))
    .sort((a, b) => b.x - a.x)[0];
  return (
    <section className="hero hero--quiet">
      <h2>Nothing crossed the line today.</h2>
      <p>
        No alert went out this morning.
        {close && close.x > 1.15 && <> The closest was <b>{close.r.track.title}</b> by {close.r.artist.name} on {PLATFORM_LABEL[close.p]}, at {times(close.r.signals[close.p].level, close.r.signals[close.p].baseline)} its usual.</>}
      </p>
    </section>
  );
}

function TrackRow({ r }: { r: Row }) {
  return (
    <Link href={`/track/${r.track.id}`} className="trow">
      <span className="trow__name">
        <b>{r.track.title}</b>
        <span>{r.artist.name}{r.track.year ? ` · ${r.track.year}` : ""}</span>
      </span>
      {(["spotify", "tiktok"] as Platform[]).map((p) => {
        const s = r.signals[p];
        const hot = s.status === "spike" || s.status === "rising";
        return (
          <span key={p} className={`num ${hot ? "num--hot" : ""}`}>
            <span className="mob">{PLATFORM_LABEL[p]}</span>
            <b>{s.status === "waiting" ? "–" : per(s.level)}</b>
            <i>{s.status === "waiting" ? "" : times(s.level, s.baseline)}</i>
          </span>
        );
      })}
      <span className={`status status--${r.status}`}><i className={`dot dot--${r.status}`} />{STATUS_LABEL[r.status]}</span>
    </Link>
  );
}
