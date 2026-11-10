import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Seismo } from "@/components/Seismo";
import { Spark } from "@/components/Spark";
import { collect } from "@/lib/collect";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { PLATFORM_LABEL, UNIT, type Platform } from "@/lib/types";
import { ago, dashboard, fmt, full, pctFmt, type Row } from "@/lib/view";

export const dynamic = "force-dynamic";

const COLOR: Record<Platform, string> = { spotify: "var(--spotify)", tiktok: "var(--tiktok)" };
const LABEL = { spike: "Spike", rising: "Rising", cooling: "Cooling", quiet: "Quiet", waiting: "Collecting" } as const;

export default async function Page() {
  // first visit with no provider: load the simulated roster so there is something to see
  if (provider().simulated && (await store().isEmpty())) await collect();
  const d = await dashboard();
  const hot = d.rows.filter((r) => r.status === "spike");
  const rising = d.rows.filter((r) => r.status === "rising");
  const today = d.alerts.filter((a) => a.date === d.latestDay);
  const lead = today[0] ?? d.alerts[0];
  const leadRow = lead && d.rows.find((r) => r.track.id === lead.trackId);

  return (
    <Shell here="/">
      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">{d.latestDay ? new Date(d.latestDay + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Today"}</p>
          <h1>
            {hot.length ? (
              <><em>{hot.length === 1 ? "One track" : `${hot.length} tracks`}</em> {hot.length === 1 ? "is" : "are"} moving.</>
            ) : rising.length ? (
              <>{rising.length === 1 ? "One track" : `${rising.length} tracks`} warming up.</>
            ) : (
              <>All quiet.</>
            )}
          </h1>
          <p className="lede">
            Watching {d.rows.length} tracks from {new Set(d.rows.map((r) => r.artist.id)).size} artists on Spotify and TikTok, against each
            one&apos;s own last {d.thresholds.window} days. Either platform can sound the alarm on its own.
          </p>
        </div>
        {lead && leadRow && (
          <Link href={`/track/${lead.trackId}`} className={`flash flash--${lead.platform}`}>
            <span className="flash__k">{lead.date === d.latestDay ? "Alert today" : `Last alert · ${lead.date}`}{lead.simulated && " · simulated"}</span>
            <span className="flash__who">{leadRow.artist.name}</span>
            <span className="flash__title">{leadRow.track.title}{leadRow.track.year && <small> ({leadRow.track.year})</small>}</span>
            <span className="flash__big">{full(lead.level)}</span>
            <span className="flash__unit">{PLATFORM_LABEL[lead.platform]} {UNIT[lead.platform]} in 24 hours</span>
            <span className="flash__row">
              <b>{pctFmt(lead.pct)}</b>
              <span>+{full(lead.change)} vs {full(lead.baseline)}/day baseline</span>
            </span>
          </Link>
        )}
      </section>

      <Seismo rows={d.rows} />
      <p className="seismo__cap"><span>30 days, every track, measured against its own normal.</span><span><i className="dot dot--spotify" />Spotify <i className="dot dot--tiktok" />TikTok</span></p>

      <div className="grid">
        <section className="board" aria-label="Watched tracks">
          <header className="board__head">
            <span>Track</span><span>Spotify · streams / day</span><span>TikTok · new videos / day</span><span>Status</span>
          </header>
          {d.rows.map((r) => <TrackRow key={r.track.id} r={r} />)}
          {!d.rows.length && <p className="empty">No tracks yet. <Link href="/tracks">Add the first one</Link>.</p>}
        </section>

        <aside className="feed" aria-label="Recent alerts">
          <h2>Recent alerts</h2>
          <ol>
            {d.alerts.slice(0, 8).map((a) => {
              const r = d.rows.find((x) => x.track.id === a.trackId);
              return (
                <li key={a.id} className={`alert alert--${a.platform}`}>
                  <Link href={`/track/${a.trackId}`}>
                    <span className="alert__meta">{a.date} · {PLATFORM_LABEL[a.platform]}{a.simulated && " · sim"}</span>
                    <span className="alert__t">{r?.artist.name} — {r?.track.title ?? a.trackId}</span>
                    <span className="alert__n">{full(a.level)} {a.platform === "tiktok" ? "creations" : "streams"} · <b>{pctFmt(a.pct)}</b></span>
                  </Link>
                </li>
              );
            })}
            {!d.alerts.length && <li className="muted">Nothing yet. The first spike lands here and in your inbox.</li>}
          </ol>
          <h2>Runs</h2>
          <ul className="runs">
            {d.runs.slice(0, 5).map((r) => (
              <li key={r.at} className={r.ok ? "" : "bad"} title={r.error}>
                <span>{ago(r.at)}</span><span>{r.source}</span><span>{r.snapshots} readings · {r.alerts} alerts</span>
              </li>
            ))}
          </ul>
          <p className="rules">
            A spike is <b>{pctFmt(d.thresholds.minPct)}</b> over the {d.thresholds.window}-day average <i>and</i> at least{" "}
            <b>{full(d.thresholds.minAbs.tiktok)}</b> more TikTok videos or <b>{full(d.thresholds.minAbs.spotify)}</b> more Spotify streams a day.{" "}
            <Link href="/settings">Change</Link>
          </p>
        </aside>
      </div>
    </Shell>
  );
}

function TrackRow({ r }: { r: Row }) {
  return (
    <Link href={`/track/${r.track.id}`} className={`row row--${r.status}`}>
      <span className="row__name">
        <b>{r.track.title}</b>
        <span>{r.artist.name}{r.track.year ? ` · ${r.track.year}` : ""}{r.catalogAge !== null && r.catalogAge >= 3 && <em className="tag">back catalog</em>}</span>
      </span>
      {(["spotify", "tiktok"] as Platform[]).map((pl) => {
        const s = r.signals[pl];
        const hot = s.status === "spike";
        return (
          <span key={pl} className={`sig sig--${pl} ${hot ? "sig--hot" : ""}`}>
            <span className="sig__mob">{PLATFORM_LABEL[pl]}</span>
            <span className="sig__n">{fmt(s.level)}</span>
            <span className={`sig__pct ${s.pct >= 0 ? "up" : "down"}`}>{s.status === "waiting" ? "—" : pctFmt(s.pct)}</span>
            <Spark days={s.days} baseline={s.baseline} color={COLOR[pl]} hot={hot} />
          </span>
        );
      })}
      <span className={`chip chip--${r.status}`}>{LABEL[r.status]}</span>
    </Link>
  );
}
