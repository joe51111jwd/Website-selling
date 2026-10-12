import { WebShell, Button, Segmented } from "../kit";
import { announcements } from "../data";
import "./Messaging.css";

// W12 Messaging, rebuilt in the Gen C shell from the Gen B capture (frames/v070-web-messaging.jpg):
// title + "Company-wide announcements and updates", Announcements · Crew Messages, and the feed of
// announcement cards (megaphone well, title, "date • time • by login", body, and a grey attachment
// preview with a PDF file icon). The "+ New Announcement" button is our addition: the capture is
// cut off on the right, and every Gen C module puts its black primary action there.

/** Material "campaign" glyph (the app draws this icon with Material Icons, filled). */
function Megaphone() {
  return (
    <svg className="sc-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
    </svg>
  );
}

/** Red outlined PDF file icon shown on the attachment preview. */
function PdfFile() {
  return (
    <svg className="scmsg-pdf" width="92" height="114" viewBox="0 0 92 114" fill="none" aria-hidden="true">
      <path d="M12 3h48.5L89 31.5V101a10 10 0 0 1-10 10H12A10 10 0 0 1 2 101V13A10 10 0 0 1 12 3z" fill="#fff" stroke="#d7262e" strokeWidth="4" strokeLinejoin="round" />
      <path d="M60.5 3v18.5a10 10 0 0 0 10 10H89" stroke="#d7262e" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 44h32M24 54h44M24 64h38" stroke="#d7262e" strokeWidth="3.4" strokeLinecap="round" opacity=".9" />
      <text x="45.5" y="96" textAnchor="middle" fontFamily="'Inter Variable', Inter, system-ui, sans-serif" fontSize="23" fontWeight="700" fill="#d7262e" letterSpacing="-0.5">
        PDF
      </text>
    </svg>
  );
}

export default function Messaging() {
  return (
    <WebShell
      active="Messaging"
      contentClassName="scmsg-page"
      title={
        <span className="scmsg-head">
          <span className="scmsg-title">Messaging</span>
          <span className="scmsg-sub">Company-wide announcements and updates</span>
        </span>
      }
      actions={
        <Button variant="primary" icon="plus" className="scmsg-new">
          New Announcement
        </Button>
      }
    >
      <Segmented items={["Announcements", "Crew Messages"]} value="Announcements" className="scmsg-tabs" />

      <div className="scmsg-feed">
        {announcements.map((a) => (
          <article key={a.id} className="scmsg-card">
            <div className="scmsg-card-head">
              <span className="scmsg-well">
                <Megaphone />
              </span>
              <div className="scmsg-card-titles">
                <div className="scmsg-card-title">{a.title}</div>
                <div className="scmsg-meta">
                  {a.date} • {a.time}
                  <span className="scmsg-dot">•</span>
                  by {a.by}
                </div>
              </div>
            </div>
            <p className="scmsg-body">{a.body}</p>
            {a.attachment && (
              <div className="scmsg-attach">
                <PdfFile />
              </div>
            )}
          </article>
        ))}
      </div>
    </WebShell>
  );
}
