import { WebShell, Icon, Avatar } from "../kit";
import { crewById } from "../data";
import "./Safety.css";
import "./TimeOff.css";

// Workforce › Time Off (Watch it work, The Month's PTO; Andrew's comment-mode note, Oct 21: "Show PTO
// request form on web. Employees > Time Off"). The requests the crew sent from their phones, the
// newest (Elena's, from the phone beside it) waiting on the office. Drawn in the manner of the
// Safety page.

type Req = { id: string; crewId: string; type: string; dates: string; hours: string; sent: string; status: "Pending" | "Approved" | "Denied" };

const REQS: Req[] = [
  { id: "to-31", crewId: "c02", type: "Vacation", dates: "Oct 22 – Oct 23", hours: "20h", sent: "Oct 9, 7:12 AM", status: "Pending" },
  { id: "to-30", crewId: "c09", type: "Personal", dates: "Oct 16", hours: "10h", sent: "Oct 8, 6:40 PM", status: "Pending" },
  { id: "to-29", crewId: "c04", type: "Sick", dates: "Oct 7", hours: "10h", sent: "Oct 7, 5:31 AM", status: "Approved" },
  { id: "to-28", crewId: "c11", type: "Vacation", dates: "Nov 2 – Nov 6", hours: "50h", sent: "Oct 5, 8:02 PM", status: "Approved" },
  { id: "to-27", crewId: "c08", type: "Vacation", dates: "Oct 12 – Oct 13", hours: "20h", sent: "Oct 2, 4:15 PM", status: "Denied" },
  { id: "to-26", crewId: "c13", type: "Personal", dates: "Oct 1", hours: "5h", sent: "Sep 29, 3:48 PM", status: "Approved" },
];

const TONE = { Pending: "Open", Approved: "Complete", Denied: "Denied" } as const;

export default function TimeOff() {
  return (
    <WebShell active="Workforce" contentClassName="scsf scto">
      <div className="scsf-head">
        <h1 className="scsf-title">Workforce</h1>
        <span className="scsf-add">
          <Icon name="plus" size={15} stroke={2} />
          New Request
        </span>
      </div>

      <div className="scsf-card">
        <div className="scsf-toolbar">
          <div className="scsf-tabs">
            {["Employees", "Time Off"].map((t) => (
              <span key={t} className={t === "Time Off" ? "is-active" : undefined}>
                {t}
              </span>
            ))}
          </div>
          <div className="scsf-search">
            <Icon name="search" size={18} stroke={1.7} />
            <span>Search</span>
          </div>
        </div>
        <div className="scsf-tr scto-tr scsf-tr--head">
          {["Employee", "Type", "Dates", "Hours", "Sent", "Status"].map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
        {REQS.map((r) => {
          const who = crewById(r.crewId);
          return (
            <div key={r.id} className="scsf-tr scto-tr">
              <div className="scsf-who">
                <Avatar name={who.name} single size={23.5} style={{ fontSize: 11.5 }} />
                <span className="sc-trunc">{who.name}</span>
              </div>
              <div>{r.type}</div>
              <div>{r.dates}</div>
              <div>{r.hours}</div>
              <div>
                <span className="scsf-date">{r.sent}</span>
              </div>
              <div>
                {r.status === "Pending" ? (
                  <span className="scto-act">
                    <span className="scto-btn scto-btn--ok">Approve</span>
                    <span className="scto-btn">Deny</span>
                  </span>
                ) : (
                  <span className={`scsf-st scsf-st--${TONE[r.status]}`}>
                    <i />
                    {r.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </WebShell>
  );
}
