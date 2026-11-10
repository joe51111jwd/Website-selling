import { Shell } from "@/components/Shell";
import { store } from "@/lib/store";
import { ago } from "@/lib/view";
import { EmailFrame } from "@/components/EmailFrame";

export const dynamic = "force-dynamic";

export default async function Emails({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const mail = await store().outbox();
  const open = mail.find((x) => x.id === m) ?? mail[0];
  return (
    <Shell here="/outbox">
      <header className="head">
        <div>
          <h1>Emails</h1>
          <p className="head__sub">
            {process.env.RESEND_API_KEY ? "Alerts written while no one was on the list." : "Email isn't connected yet, so alerts are kept here. This is exactly what the team will get."}
          </p>
        </div>
      </header>
      {mail.length ? (
        <div className="mail">
          <ol className="list">
            {mail.map((x) => (
              <li key={x.id} aria-current={x.id === open?.id ? "true" : undefined}>
                <a href={`/outbox?m=${encodeURIComponent(x.id)}`}><b>{x.subject.replace(/^\[Demo\] /, "")}</b><span>{ago(x.at)}</span></a>
              </li>
            ))}
          </ol>
          {open && <EmailFrame key={open.id} title={open.subject} html={open.html} />}
        </div>
      ) : (
        <div className="list"><p className="empty">No emails yet.</p></div>
      )}
    </Shell>
  );
}
