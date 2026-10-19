import type { ReactNode } from "react";
import { WebShell, Icon, type IconName, Kpi, MapPanel, Segmented, Button, money, pct, hm } from "../kit";
import { featuredProject as P, crewById, type Bucket } from "../data";
import "./ProjectDetail.css";

// W3 Project detail = real-time job costing. Only the Gen B video build shows this page
// (frames v050 / v052), so it is rebuilt here in Gen C: the collapsed sidebar and the
// Back / Delete / Edit header of the Gen C equipment-detail page, the info grid on a #F5F5F5
// card with hairline rows, Revenue / Expenses / Profit, the five budget cards and the
// Labor tab. ProjectPage is the page with any tab open (./CostCodes.tsx opens Cost Codes).

// ── Labor tab rows: hours to date on this job, split across the crew that worked it. ──
// Totals add up exactly to the project's labor hours (laborMinutes) and OT (otMinutes).
const LABOR_SPLIT: { id: string; share: number; ot: number }[] = [
  { id: "c01", share: 0.262, ot: 0.27 },
  { id: "c02", share: 0.255, ot: 0.26 },
  { id: "c06", share: 0.243, ot: 0.25 },
  { id: "c05", share: 0.205, ot: 0.19 },
  { id: "c14", share: 0.035, ot: 0.03 },
];
const laborRows = (() => {
  let leftT = P.laborMinutes;
  let leftO = P.otMinutes;
  return LABOR_SPLIT.map((r, i) => {
    const last = i === LABOR_SPLIT.length - 1;
    const total = last ? leftT : Math.round(P.laborMinutes * r.share);
    const ot = last ? leftO : Math.round(P.otMinutes * r.ot);
    leftT -= total;
    leftO -= ot;
    return { person: crewById(r.id), total, ot, regular: total - ot };
  });
})();

// Material-style glyphs for the header buttons (the app draws these with Material Icons).
const MPATH = {
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  delete: "M7 21q-.82 0-1.41-.59T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .82-.59 1.41T17 21H7zM17 6H7v13h10V6zM9 17h2V8H9v9zm4 0h2V8h-2v9z",
};
function MIcon({ name, size }: { name: keyof typeof MPATH; size: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={MPATH[name]} />
    </svg>
  );
}

function InfoCell({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="scpd-cell">
      <Icon name={icon} size={16} stroke={1.5} />
      <span className="scpd-label">{label}</span>
      <span className="scpd-value">{children}</span>
    </div>
  );
}

function BudgetCard({ title, b }: { title: string; b: Bucket }) {
  return (
    <div className="scpd-bcard">
      <div className="scpd-btitle">{title}</div>
      <div className="scpd-brow">
        <span>Budget</span>
        <span className="scpd-bchip">{money(b.budget)}</span>
      </div>
      <div className="scpd-brow">
        <span>Spent</span>
        <span className="scpd-bchip">{money(b.spent)}</span>
      </div>
      <div className="scpd-brow scpd-brow--net">
        <span>Net</span>
        <span className="scpd-net">
          <b>{money(b.net)}</b>
          <i className={b.pct > 100 ? "is-over" : undefined}>{pct(b.pct)}</i>
        </span>
      </div>
    </div>
  );
}

export const PROJECT_TABS = ["Labor", "Materials", "Equipment", "Cost Codes", "Change Orders", "Other Expenses", "Documents", "Field Notes"] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number];

export default function ProjectDetail() {
  return <ProjectPage tab="Labor" />;
}

/** The project page with `tab` open: its table under the tab strip (the Labor table by default). */
export function ProjectPage({ tab, children }: { tab: ProjectTab; children?: ReactNode }) {
  return (
    <WebShell active="Projects" collapsed contentClassName="scp">
      {/* header */}
      <div className="scpd-head">
        <span className="scpd-back">
          <Icon name="chevronLeft" size={20} stroke={1.7} />
          Back
        </span>
        <h1 className="scpd-title">{P.name}</h1>
        <span className="scpd-hbtn scpd-hbtn--del">
          <MIcon name="delete" size={13.5} />
          Delete
        </span>
        <span className="scpd-hbtn">
          <MIcon name="edit" size={13.5} />
          Edit
        </span>
      </div>

      {/* info + money | map */}
      <div className="scpd-top">
        <div className="scpd-left">
          <div className="scpd-info">
            <div className="scpd-irow">
              <InfoCell icon="info" label="ID">
                {P.number}
              </InfoCell>
              <InfoCell icon="target" label="Status">
                <span className="scpd-status">{P.status}</span>
              </InfoCell>
            </div>
            <div className="scpd-irow">
              <InfoCell icon="calendar" label="Start date">
                {P.startDate}
              </InfoCell>
              <InfoCell icon="calendarOff" label="End date">
                {P.endDate}
              </InfoCell>
            </div>
            <div className="scpd-irow">
              <InfoCell icon="refresh" label="Working days">
                {P.workingDays.done}/{P.workingDays.total}
              </InfoCell>
              <InfoCell icon="checkCircle" label="Progress">
                {P.progress}%
              </InfoCell>
            </div>
            <div className="scpd-irow">
              <InfoCell icon="briefcase" label="Company">
                {P.client}
              </InfoCell>
            </div>
            <div className="scpd-irow">
              <InfoCell icon="mapPin" label="Location">
                {P.address}
              </InfoCell>
            </div>
          </div>
          <div className="scpd-kpis">
            <Kpi icon="cash" label="Revenue" value={money(P.revenue)} />
            <Kpi icon="trendingUp" label="Expenses" value={money(P.expenses)} />
            <Kpi icon="dollarCircle" label="Profit" value={money(P.profit)} />
          </div>
        </div>
        <MapPanel width={621.5} height={286} center={{ x: 700, y: 285 }} zoom={0.72} marker={P.map} controls="move" />
      </div>

      {/* budget vs spent per bucket */}
      <div className="scpd-budgets">
        <BudgetCard title="Labor" b={P.labor} />
        <BudgetCard title="Materials" b={P.materials} />
        <BudgetCard title="Equipment" b={P.equipment} />
        <BudgetCard title="Other" b={P.other} />
        <BudgetCard title="Change orders" b={P.changeOrderBucket} />
      </div>

      {/* tabs + the tab's table */}
      <div className="scpd-card">
        <div className="scpd-toolbar">
          <Segmented items={[...PROJECT_TABS]} value={tab} />
          <Button icon="filter" className="scpd-tbtn">
            Filters
          </Button>
          <Button icon="sort" className="scpd-tbtn">
            Sort
          </Button>
        </div>
        {children ?? <LaborTable />}
      </div>
    </WebShell>
  );
}

function LaborTable() {
  return (
    <>
      <div className="scpd-tr scpd-tr--head">
        <div>Employee</div>
        <div>Role</div>
        <div>Total hours</div>
        <div>
          Regular hours <Icon name="sort" size={13} stroke={1.6} />
        </div>
        <div>
          Overtime hours <Icon name="sort" size={13} stroke={1.6} />
        </div>
      </div>
      {laborRows.map((r) => (
        <div key={r.person.id} className="scpd-tr">
          <div className="scpd-emp">
            <span className="scpd-av">{r.person.name[0]}</span>
            <span className="sc-trunc">{r.person.name}</span>
          </div>
          <div>
            <span className="scpd-role">{r.person.role}</span>
          </div>
          <div>{hm(r.total)}</div>
          <div>{hm(r.regular)}</div>
          <div>{hm(r.ot)}</div>
        </div>
      ))}
    </>
  );
}
