import Link from "next/link";
import { notFound } from "next/navigation";
import { Bars } from "@/components/Bars";
import { Icon } from "@/components/Icon";
import { Shell } from "@/components/Shell";
import { link } from "@/lib/email";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";
import { STATUS_LABEL, alertLine, dashboard, per, shortDate, times } from "@/lib/view";

export const dynamic = "force-dynamic";

const COLOR: Record<Platform, string> = { spotify: "#3358eb", tiktok: "#3358eb" };
const UNIT: Record<Platform, string> = { spotify: "Spotify streams a day", tiktok: "New TikTok videos a day" };

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await dashboard();
  const r = d.rows.find((x) => x.track.id === id);
  if (!r) notFound();
  const alerts = d.alerts.filter((a) => a.trackId === id);
  return (
    <Shell here="">
      <Link href="/" className="back">← Today</Link>
      <header className="head">
        <div>
          <h1>{r.track.title}</h1>
          <p className="head__sub">{r.artist.name}{r.track.year ? ` · ${r.track.year}` : ""}{r.track.isrc ? ` · ISRC ${r.track.isrc}` : ""}</p>
        </div>
        <div className="btns">
          <a className="btn btn--soft btn--sm" href={link(r.track, "tiktok")} target="_blank" rel="noopener">TikTok <Icon name="ext" size={14} /></a>
          <a className="btn btn--soft btn--sm" href={link(r.track, "spotify")} target="_blank" rel="noopener">Spotify <Icon name="ext" size={14} /></a>
        </div>
      </header>

      <div className="cards">
        {(["tiktok", "spotify"] as Platform[]).map((p) => {
          const s = r.signals[p];
          return (
            <section key={p} className="card">
              <div className="card__top">
                <h2 className="card__title"><i className={`dot dot--${p}`} />{UNIT[p]}</h2>
                <span className={`status status--${s.status}`}><i className={`dot dot--${s.status}`} />{STATUS_LABEL[s.status]}</span>
              </div>
              <div className="figs" style={{ marginBottom: 18 }}>
                <div className="fig"><b>{per(s.level)}</b><span>{s.days.length ? shortDate(s.days[s.days.length - 1].date) : "Latest"}</span></div>
                <div className="fig"><b>{per(s.baseline)}</b><span>Usual ({d.thresholds.window}-day average)</span></div>
                <div className="fig"><b>{times(s.level, s.baseline)}</b><span>Of usual</span></div>
                <div className="fig"><b>{per(alertLine(s, d.thresholds))}</b><span>Alert line</span></div>
              </div>
              <Bars days={s.days} usual={s.baseline} color={COLOR[p]} alerts={alerts.filter((a) => a.platform === p).map((a) => a.date)} label={`${UNIT[p]}, last 30 days`} />
            </section>
          );
        })}
      </div>

      <h2 className="label">Alerts for this track</h2>
      <div className="list">
        {alerts.map((a) => (
          <div key={a.id} className="arow">
            <span className="arow__when">{shortDate(a.date, d.latestDay)}</span>
            <span className="arow__what">
              <b>{PLATFORM_LABEL[a.platform]}</b>
              <span>{per(a.level)} that day, usually {per(a.baseline)}. {a.delivered === "email" ? "Emailed to the team." : "Kept under Emails until email is connected."}</span>
            </span>
            <span className="arow__x">{times(a.level, a.baseline)}</span>
          </div>
        ))}
        {!alerts.length && <p className="empty">This track hasn&apos;t sent an alert yet.</p>}
      </div>
    </Shell>
  );
}
