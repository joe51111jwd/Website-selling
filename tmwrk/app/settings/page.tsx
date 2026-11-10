import { Shell } from "@/components/Shell";
import { ThresholdsForm } from "@/components/Forms";
import { Submit } from "@/components/Submit";
import { runNow, sendTestAlert } from "@/app/actions";
import { recipients } from "@/lib/email";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";
import { clock, shortDate } from "@/lib/view";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const s = store();
  const [t, runs] = await Promise.all([s.thresholds(), s.runs(6)]);
  const to = recipients();
  const p = provider();
  return (
    <Shell here="/settings">
      <header className="head">
        <div>
          <h1>Alert rules</h1>
          <p className="head__sub">Spotify and TikTok are judged separately. Either one can send an alert.</p>
        </div>
      </header>

      <section className="hero">
        <h2>A track sends an alert when it does both.</h2>
        <p>
          Its day is at least <b>{(1 + t.minPct / 100).toFixed(1).replace(/\.0$/, "")}×</b> its usual (the average of its last {t.window} days), <b>and</b> it beats the usual by at least{" "}
          <b>{t.minAbs.tiktok.toLocaleString("en-US")}</b> new videos on TikTok or <b>{t.minAbs.spotify.toLocaleString("en-US")}</b> streams on Spotify.
          The second rule stops small songs from firing on noise.
        </p>
      </section>
      <section className="card" style={{ marginTop: 12 }}>
        <ThresholdsForm t={t} />
      </section>

      <h2 className="label">Daily check</h2>
      <div className="list">
        {runs.map((r) => (
          <div key={r.at} className="arow">
            <span className="arow__when">{shortDate(r.at.slice(0, 10))}</span>
            <span className="arow__what">
              <b>{r.ok ? "Ran" : "Failed"}</b> at {clock(r.at)}
              <span>{r.snapshots} data points{r.simulated ? " (demo data)" : ` from ${r.source}`} · {r.alerts} {r.alerts === 1 ? "alert" : "alerts"}{r.error ? ` · ${r.error}` : ""}</span>
            </span>
          </div>
        ))}
        {!runs.length && <p className="empty">No checks yet.</p>}
      </div>
      <div className="btns" style={{ marginTop: 12 }}>
        <form action={runNow}><Submit className="btn btn--soft" pending="Checking…">Run the check now</Submit></form>
        <form action={sendTestAlert}><Submit className="btn btn--soft" pending="Sending…">Send a test alert</Submit></form>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
        The test alert is a sample: an older DRAMA song at 1,000 new TikTok videos in a day against a usual 50, with Spotify steady.
      </p>

      <h2 className="label" id="setup">Setup</h2>
      <dl className="list kv">
        <div><dt>Alert emails go to</dt><dd>{to.length ? <><i className="dot dot--ok" />{to.join(", ")}</> : <><i className="dot dot--rising" />No one yet <code>ALERT_TO</code></>}</dd></div>
        <div><dt>Email sending</dt><dd>{process.env.RESEND_API_KEY ? <><i className="dot dot--ok" />Resend</> : <><i className="dot dot--rising" />Not connected, so alerts are kept under Emails <code>RESEND_API_KEY</code></>}</dd></div>
        <div><dt>Data</dt><dd>{p.simulated ? <><i className="dot dot--rising" />Demo data <code>SOUNDCHARTS_APP_ID</code><code>SOUNDCHARTS_API_KEY</code></> : <><i className="dot dot--ok" />{p.name}</>}</dd></div>
        <div><dt>Storage</dt><dd>{process.env.DATABASE_URL ? <><i className="dot dot--ok" />Postgres</> : <><i className="dot dot--rising" />Temporary, resets on redeploy <code>DATABASE_URL</code></>}</dd></div>
        <div><dt>Schedule</dt><dd><i className="dot dot--ok" />Once a day at 13:17 UTC</dd></div>
      </dl>
    </Shell>
  );
}
