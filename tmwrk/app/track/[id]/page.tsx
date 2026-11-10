import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Area } from "@/components/Spark";
import { link } from "@/lib/email";
import { PLATFORM_LABEL, UNIT, type Platform } from "@/lib/types";
import { dashboard, full, pctFmt } from "@/lib/view";

export const dynamic = "force-dynamic";
const COLOR: Record<Platform, string> = { spotify: "#1ed760", tiktok: "#ff2d55" };

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await dashboard();
  const r = d.rows.find((x) => x.track.id === id);
  if (!r) notFound();
  const alerts = d.alerts.filter((a) => a.trackId === id);
  return (
    <Shell here="">
      <p className="crumbs"><Link href="/">Dashboard</Link> / {r.artist.name}</p>
      <h1 className="page-title">{r.track.title} {r.track.year && <small>({r.track.year})</small>}</h1>
      <p className="lede">{r.artist.name}{r.track.isrc && <> · ISRC {r.track.isrc}</>}</p>
      {(["tiktok", "spotify"] as Platform[]).map((pl) => {
        const s = r.signals[pl];
        return (
          <section key={pl} className={`panel panel--${pl}`}>
            <header>
              <h2>{PLATFORM_LABEL[pl]} <span>{UNIT[pl]} per day, last 30 days</span></h2>
              <div className="panel__nums">
                <span><b>{full(s.level)}</b> today</span>
                <span><b>{full(s.baseline)}</b> {d.thresholds.window}-day average</span>
                <span className={s.pct >= 0 ? "up" : "down"}><b>{pctFmt(s.pct)}</b></span>
                <a href={link(r.track, pl)} target="_blank" rel="noopener" className="btn btn--ghost">Open on {PLATFORM_LABEL[pl]} ↗</a>
              </div>
            </header>
            <Area days={s.days} color={COLOR[pl]} alerts={alerts.filter((a) => a.platform === pl).map((a) => a.date)} label={`${PLATFORM_LABEL[pl]} daily activity`} />
          </section>
        );
      })}
      <section className="panel">
        <h2>Alerts for this track</h2>
        {alerts.length ? (
          <ol className="list">
            {alerts.map((a) => (
              <li key={a.id}><b>{a.date}</b> {PLATFORM_LABEL[a.platform]}: {full(a.level)} in 24h vs {full(a.baseline)}/day ({pctFmt(a.pct)}){a.simulated && " · simulated"}</li>
            ))}
          </ol>
        ) : <p className="muted">None yet.</p>}
      </section>
    </Shell>
  );
}
