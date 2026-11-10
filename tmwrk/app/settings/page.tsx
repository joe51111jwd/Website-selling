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
        <p style={{ marginBottom: 20 }}>
          It gets at least <b>{t.minPct}%</b> more than its usual (the average of its last {t.window} days), <b>and</b> at least{" "}
          <b>{t.minAbs.tiktok.toLocaleString("en-US")}</b> more TikTok videos or <b>{t.minAbs.spotify.toLocaleString("en-US")}</b> more Spotify streams in a day.
          The second rule stops tiny songs from firing on noise.
        </p>
        <ThresholdsForm t={t} />
      </section>

      <h2 className="label">Daily check</h2>
      <div className="list">
        {runs.map((r) => (
          <div key={r.at} className="arow">
            <span className="arow__when">{shortDate(r.at.slice(0, 10))}</span>
            <span className="arow__what">
              <b>{r.ok ? "Ran" : "Failed"}</b> at {clock(r.at)}
              <span>{r.snapshots} readings from {r.source} · {r.alerts} {r.alerts === 1 ? "alert" : "alerts"}{r.error ? ` · ${r.error}` : ""}</span>
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
        The test alert is the brief&apos;s test case: an older DRAMA song at 1,000 new TikTok videos in a day against a usual 50, while Spotify stays flat.
      </p>

      <h2 className="label" id="setup">Setup</h2>
      <dl className="list kv">
        <div><dt>Alert emails go to</dt><dd>{to.length ? to.join(", ") : <span className="warn">No one yet. Set ALERT_TO.</span>}</dd></div>
        <div><dt>Email sending</dt><dd>{process.env.RESEND_API_KEY ? "Resend" : <span className="warn">Not connected. Alerts are kept under Emails until RESEND_API_KEY is set.</span>}</dd></div>
        <div><dt>Data</dt><dd>{p.simulated ? <span className="warn">Demo data. Add SOUNDCHARTS_APP_ID and SOUNDCHARTS_API_KEY for real numbers.</span> : p.name}</dd></div>
        <div><dt>Storage</dt><dd>{process.env.DATABASE_URL ? "Postgres" : "Local file (resets on redeploy until DATABASE_URL is set)"}</dd></div>
        <div><dt>Schedule</dt><dd>Once a day at 13:17 UTC</dd></div>
      </dl>
    </Shell>
  );
}
