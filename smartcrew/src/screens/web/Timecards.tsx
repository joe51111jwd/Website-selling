import { WebShell, Card, Search, Avatar, Checkbox, Icon, hmPad } from "../kit";
import "./Timecards.css";
import { timecards, timecardWeek, weekDays, crewById, navBadges } from "../data";

// W4 Reports & Analytics → Timecards (Gen C): page tabs with the review badge, week stepper,
// Export PDF, toolbar (Search · Filters · Sort · Weekly review · Yearly review) and the
// Mon–Sun hours grid for the last full week.

/** Rows per page in the timecards grid (page 1 is shown). */
const PAGE_SIZE = 8;
/** Crew member shown with a profile photo instead of a letter avatar (as on the reference). */
const PHOTO_IDS = new Set(["c12"]);

// Filled Material-style glyphs the app uses on this page (the kit only has outline versions).
function FactCheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.6 3h14.8A2.6 2.6 0 0 1 22 5.6v12.8a2.6 2.6 0 0 1-2.6 2.6H4.6A2.6 2.6 0 0 1 2 18.4V5.6A2.6 2.6 0 0 1 4.6 3zm1.9 3.6a1 1 0 0 0 0 2h3.6a1 1 0 0 0 0-2zm0 4.4a1 1 0 0 0 0 2h3.6a1 1 0 0 0 0-2zm0 4.4a1 1 0 0 0 0 2h3.6a1 1 0 0 0 0-2zm12.2-4.9a1 1 0 0 0-1.42-1.4l-3.5 3.53-1.36-1.37a1 1 0 0 0-1.42 1.41l2.07 2.08a1 1 0 0 0 1.42 0z"
      />
    </svg>
  );
}

function PdfIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 6a1 1 0 0 0-1 1v12.6A1.4 1.4 0 0 0 4.4 21H17a1 1 0 0 0 0-2H5V7a1 1 0 0 0-1-1z" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.6 2h11.8A1.6 1.6 0 0 1 22 3.6v11.8a1.6 1.6 0 0 1-1.6 1.6H8.6A1.6 1.6 0 0 1 7 15.4V3.6A1.6 1.6 0 0 1 8.6 2zm1.1 5.3v5h1.1v-1.7h.9a1.65 1.65 0 0 0 0-3.3zm1.1 1h.9a.65.65 0 0 1 0 1.3h-.9zm3-1v5h1.8a1.9 1.9 0 0 0 1.9-1.9v-1.2a1.9 1.9 0 0 0-1.9-1.9zm1.1 1h.7a.8.8 0 0 1 .8.8v1.2a.8.8 0 0 1-.8.8h-.7zm3.2-1v5h1.1v-2h1.5v-1h-1.5v-1h1.7v-1z"
      />
    </svg>
  );
}

/** "◷ 05h 22m" with the orange clock, or the red ⓧ + "-" for a day without time. */
function DayHours({ minutes }: { minutes: number | null }) {
  if (minutes === null || minutes === 0)
    return (
      <span className="sct-hours sct-hours--none">
        <Icon name="xCircleFill" size={21} />
        <span>-</span>
      </span>
    );
  return (
    <span className="sct-hours">
      <Icon name="clock" size={16} stroke={1.75} />
      <span>{hmPad(minutes)}</span>
    </span>
  );
}

export default function Timecards() {
  const rows = timecards
    .map((t) => ({ t, person: crewById(t.crewId) }))
    .sort((a, b) => a.person.name.localeCompare(b.person.name));
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const page = rows.slice(0, PAGE_SIZE);

  return (
    <WebShell active="Reports" contentClassName="sct">
      <div className="sct-head">
        <h1 className="sct-title">Reports &amp; Analytics</h1>
        <div className="sct-tabs">
          <span className="sct-tab is-active">
            Timecards<span className="sct-tab-badge">{navBadges.Reports}</span>
          </span>
          <span className="sct-tab">Payroll</span>
          <span className="sct-tab">Equipment</span>
          <span className="sct-tab">Incidents</span>
        </div>
        <div className="sct-week">
          <span className="sct-week-btn">
            <Icon name="chevronLeft" size={23} stroke={1.6} />
          </span>
          <span className="sct-week-label">{timecardWeek.label}</span>
          <span className="sct-week-btn">
            <Icon name="chevronRight" size={23} stroke={1.6} />
          </span>
        </div>
        <span className="sct-btn sct-export">
          <PdfIcon size={16} />
          Export PDF
        </span>
      </div>

      <Card className="sct-card">
        <div className="sct-toolbar">
          <Search width={195} className="sct-search" />
          <span className="sct-btn">
            <Icon name="filter" size={17} stroke={1.5} />
            Filters
          </span>
          <span className="sct-btn sct-btn--sort">
            <Icon name="sort" size={16} stroke={1.5} />
            Sort
          </span>
          <span className="sct-btn">
            <FactCheckIcon size={16} />
            Weekly review
          </span>
          <span className="sct-btn">
            <FactCheckIcon size={16} />
            Yearly review
          </span>
        </div>

        <table className="sct-table">
          <colgroup>
            <col style={{ width: 56 }} />
            <col style={{ width: 158 }} />
            <col style={{ width: 83.4 }} />
            {weekDays.map((d) => (
              <col key={d} style={{ width: 83.4 }} />
            ))}
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="sct-cb">
                <Checkbox />
              </th>
              <th>Employee</th>
              <th className="is-c">
                Clocked
                <br />
                hours
              </th>
              {weekDays.map((d) => (
                <th key={d} className="is-c">
                  {d}
                </th>
              ))}
              <th className="is-c sct-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {page.map(({ t, person }) => (
              <tr key={t.crewId}>
                <td className="sct-cb">
                  <Checkbox />
                </td>
                <td>
                  <div className="sct-emp">
                    <Avatar name={person.name} single photo={PHOTO_IDS.has(person.id)} size={24} />
                    <span className="sc-trunc">{person.name}</span>
                  </div>
                </td>
                <td className="is-c">
                  <DayHours minutes={t.total} />
                </td>
                {t.days.map((d, i) => (
                  <td key={i} className="is-c">
                    <DayHours minutes={d} />
                  </td>
                ))}
                <td className="is-c sct-actions">
                  <span className="sct-review">Review</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sct-pager">
          <Icon name="chevronLeft" size={30} stroke={1.35} />
          <span>
            Page 1 of {pages}
          </span>
          <Icon name="chevronRight" size={30} stroke={1.35} />
        </div>
      </Card>
    </WebShell>
  );
}
