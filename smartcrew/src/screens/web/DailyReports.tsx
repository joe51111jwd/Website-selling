import { WebShell, Icon, Avatar, Select, hm, weekday, dateShort } from "../kit";
import { dailyReports, dailyReportDetail as D, projectById, crewById, equipmentById, type DailyReport } from "../data";
import { SitePhoto } from "./SitePhoto";
import "./DailyReports.css";

// W14 Reports → Daily Reports: what each job got done, by day. Left, the reports of today (still
// open) and yesterday (sent to the office at the end of the day); right, the open one: the
// day's production, the foreman's notes, the photos from the field, and the crew's and the
// machines' hours. Drawn in the Gen C manner of the other web screens (no capture of this page).

const open = dailyReports.find((r) => r.id === D.id)!;
const days = [...new Set(dailyReports.map((r) => r.date))];
const crewMinutes = D.crew.reduce((a, c) => a + c.minutes, 0);
const machineMinutes = D.equipment.reduce((a, e) => a + e.minutes, 0);

/** The kit has no weather glyph: a cloud in its stroke style. */
function Cloud() {
  return (
    <svg className="sc-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18.5h10.2a4.3 4.3 0 0 0 .6-8.56A6 6 0 0 0 6.3 11.2 3.65 3.65 0 0 0 7 18.5z" />
    </svg>
  );
}

function Status({ r }: { r: DailyReport }) {
  return r.submitted ? <span className="scdr-st scdr-st--sent">Submitted</span> : <span className="scdr-st scdr-st--open">In progress</span>;
}

function Row({ r }: { r: DailyReport }) {
  const p = projectById(r.projectId);
  return (
    <div className={`scdr-item${r.id === D.id ? " is-on" : ""}`}>
      <div className="scdr-item-top">
        <span className="scdr-item-name sc-trunc">{p.name}</span>
        <Status r={r} />
      </div>
      <div className="scdr-item-sub">
        <span>{crewById(r.byId).name}</span>
        <i />
        <span>{r.crew} crew</span>
        <i />
        <span className="scdr-item-ph">
          <Icon name="camera" size={13} stroke={1.7} />
          {r.photos}
        </span>
        {r.submitted && <span className="scdr-item-at">{r.submitted}</span>}
      </div>
    </div>
  );
}

export default function DailyReports() {
  const p = projectById(open.projectId);
  const by = crewById(open.byId);
  return (
    <WebShell active="Reports" contentClassName="scdr">
      <div className="scdr-head">
        <h1 className="scdr-title">Daily Reports</h1>
        <Select value="All Projects" width={170} className="scdr-sel" />
        <span className="scdr-btn">
          <Icon name="exportPdf" size={16} stroke={1.6} />
          Export PDF
        </span>
      </div>

      <div className="scdr-body">
        <div className="scdr-list">
          {days.map((d, i) => (
            <div key={d} className="scdr-day">
              <p className="scdr-day-h">
                {i === 0 ? "Today · " : ""}
                {weekday(d)}, {dateShort(d)}
              </p>
              {dailyReports
                .filter((r) => r.date === d)
                .map((r) => (
                  <Row key={r.id} r={r} />
                ))}
            </div>
          ))}
        </div>

        <div className="scdr-doc">
          <div className="scdr-doc-head">
            <div>
              <h2 className="scdr-doc-title">{p.name}</h2>
              <p className="scdr-doc-sub">
                {p.number} · {weekday(open.date)}, {dateShort(open.date)}
              </p>
            </div>
            <span className="scdr-sent">
              <Icon name="checkCircle" size={16} stroke={1.8} />
              Sent to the office {open.submitted}
            </span>
          </div>

          <div className="scdr-meta">
            <span className="scdr-chip">
              <Avatar name={by.name} size={20} style={{ fontSize: 9 }} />
              {by.name}, {by.role}
            </span>
            <span className="scdr-chip">
              <Cloud />
              {D.weather}
            </span>
            <span className="scdr-chip">
              <Icon name="users" size={15} stroke={1.7} />
              {D.crew.length} crew · {hm(crewMinutes)}
            </span>
            <span className="scdr-chip">
              <Icon name="equipment" size={15} stroke={1.7} />
              {D.equipment.length} machines · {hm(machineMinutes)}
            </span>
          </div>

          <div className="scdr-grid">
            <section className="scdr-sec scdr-prod">
              <h3>Production</h3>
              {D.production.map((x) => (
                <div key={x.item} className="scdr-prod-row">
                  <span>{x.item}</span>
                  <b>{x.qty}</b>
                </div>
              ))}
            </section>
            <section className="scdr-sec scdr-notes">
              <h3>Field notes</h3>
              <p>{open.note}</p>
            </section>
          </div>

          <section className="scdr-sec">
            <h3>
              Photos <span className="scdr-n">{open.photos}</span>
            </h3>
            <div className="scdr-photos">
              {Array.from({ length: open.photos }, (_, i) => (
                <SitePhoto key={i} n={i} className="scdr-photo" />
              ))}
            </div>
          </section>

          <div className="scdr-grid">
            <section className="scdr-sec">
              <h3>Crew</h3>
              {D.crew.map((c) => {
                const m = crewById(c.crewId);
                return (
                  <div key={c.crewId} className="scdr-line">
                    <Avatar name={m.name} size={22} style={{ fontSize: 9.5 }} />
                    <span className="sc-trunc">{m.name}</span>
                    <b>{hm(c.minutes)}</b>
                  </div>
                );
              })}
            </section>
            <section className="scdr-sec">
              <h3>Equipment</h3>
              {D.equipment.map((e) => (
                <div key={e.equipmentId} className="scdr-line">
                  <span className="scdr-eq">
                    <Icon name="equipment" size={13} stroke={1.7} />
                  </span>
                  <span className="sc-trunc">{equipmentById(e.equipmentId).name}</span>
                  <b>{hm(e.minutes)}</b>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </WebShell>
  );
}
