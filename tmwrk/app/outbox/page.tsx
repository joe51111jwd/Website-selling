import { Shell } from "@/components/Shell";
import { store } from "@/lib/store";
import { ago } from "@/lib/view";

export const dynamic = "force-dynamic";

export default async function Outbox({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const mail = await store().outbox();
  const open = mail.find((x) => x.id === m) ?? mail[0];
  return (
    <Shell here="/outbox">
      <h1 className="page-title">Alerts sent</h1>
      <p className="lede">
        {process.env.RESEND_API_KEY ? "Copies of emails that were written but not sent (no recipients set)." : "No email service is connected yet, so alerts are kept here instead of sent. This is exactly what the team will receive."}
      </p>
      {mail.length ? (
        <div className="outbox">
          <ol>
            {mail.map((x) => (
              <li key={x.id} aria-current={x.id === open?.id ? "true" : undefined}>
                <a href={`/outbox?m=${encodeURIComponent(x.id)}`}><b>{x.subject}</b><span>{ago(x.at)}</span></a>
              </li>
            ))}
          </ol>
          {open && <iframe title={open.subject} srcDoc={open.html} sandbox="" />}
        </div>
      ) : <p className="muted">Nothing yet.</p>}
    </Shell>
  );
}
