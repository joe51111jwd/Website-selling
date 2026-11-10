import { Shell } from "@/components/Shell";
import { ThresholdsForm } from "@/components/Forms";
import { Submit } from "@/components/Submit";
import { sendTestAlert } from "@/app/actions";
import { recipients } from "@/lib/email";
import { provider } from "@/lib/providers";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const t = await store().thresholds();
  const to = recipients();
  const p = provider();
  return (
    <Shell here="/settings">
      <h1 className="page-title">Settings</h1>
      <div className="two">
        <section className="panel">
          <h2>When to alert</h2>
          <p className="muted">Spotify and TikTok are judged separately. A day has to clear both bars to count.</p>
          <ThresholdsForm t={t} />
        </section>
        <section className="panel">
          <h2>Where alerts go</h2>
          <dl className="kv">
            <dt>Recipients</dt><dd>{to.length ? to.join(", ") : <span className="warn">None set (ALERT_TO)</span>}</dd>
            <dt>Email</dt><dd>{process.env.RESEND_API_KEY ? "Resend" : <span className="warn">No RESEND_API_KEY: alerts go to “Alerts sent” only</span>}</dd>
            <dt>Data</dt><dd>{p.simulated ? <span className="warn">Simulated (no SOUNDCHARTS_APP_ID / SOUNDCHARTS_API_KEY)</span> : p.name}</dd>
            <dt>Storage</dt><dd>{process.env.DATABASE_URL ? "Postgres" : "Local file"}</dd>
            <dt>Schedule</dt><dd>Daily, 13:17 UTC (vercel.json)</dd>
          </dl>
          <h2>Success test</h2>
          <p className="muted">Sends the brief&apos;s test case, marked simulated: an older DRAMA track at 1,000 new TikTok videos in 24 hours against a 50/day baseline, while Spotify stays flat.</p>
          <form action={sendTestAlert}><Submit pending="Sending…">Send the test alert</Submit></form>
        </section>
      </div>
    </Shell>
  );
}
