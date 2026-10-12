// The exact rows One Day's updates land as, drawn with the recreated app's own kit. The same
// components draw the row inside the laptop's state screens (./web.tsx, shot to textures) and
// the crisp vector update card next to the laptop (../UpdateCard.tsx), so the two never differ.
// Demo data: src/screens/data.ts (Cedar Ridge Earthworks, Fri Oct 9 2026) plus the few records
// the day itself creates, below.

import type { ReactNode } from "react";
import { Avatar, Icon, Pill, Cell2, PersonCell } from "../../../screens/kit";

// ─── the records the day creates ─────────────────────────────────────────────
export const DAY_DATA = {
  clockin: { name: "Marcus Bell", initials: "MB", role: "Foreman", project: "Hwy 9 Culvert Replacement", number: "#2417", activity: "Pipe Laying", equipment: "CAT 320 Excavator", date: "Oct 9, 2026", time: "6:42 AM" },
  pretrip: { operator: "Tomás Ortega", date: "9 October 2026; 06:55 AM", checklist: "DOT", reading: "211,640", maintenance: "Unlinked", status: "Approved" },
  load: { ticket: "#14", time: "9:20 AM", truck: "Mack Granite #1102", driver: "Tomás Ortega", project: "Riverside Storm Sewer", number: "#2409", type: "Import", material: "Select fill", qty: "12 yd³", from: "Hollis Sand & Gravel" },
  leak: { equipment: "CAT D6 Dozer", issue: "Left track tension low, idler seeping oil", by: "Dale Hendricks", updated: "Oct 9 2026, 4:12 PM", urgency: "High", status: "Todo" },
  profit: { from: 53611.75, to: 57731.75, today: 4120 },
  plan: { day: "Mon 12", time: "7:00 AM - 3:30 PM", crew: 4, project: "Hwy 9 Culvert Replacement" },
  payroll: { title: "Payroll report ready for QuickBooks", meta: "Sep 28 – Oct 4 · 14 timecards approved", time: "now" },
} as const;

// ─── dashboard: Clock Ins row ───────────────────────────────────────────────
export function ClockInCells() {
  const c = DAY_DATA.clockin;
  return {
    employee: <PersonCell name={c.name} initials={c.initials} sub={c.role} />,
    status: <Pill tone="green">Clocked In</Pill>,
    project: <Cell2 main={c.project} sub={c.number} />,
    activity: c.activity,
    equipment: c.equipment,
    last: <Cell2 main={c.date} sub={c.time} />,
  };
}

// ─── equipment detail: Inspections row ──────────────────────────────────────
export type InspectionRow = { operator: string; date: string; checklist: string; reading: string; maintenance: string; status: string };

export function InspectionTr({ r, className }: { r: InspectionRow; className?: string }) {
  return (
    <div className={`sce-tr dds-insp-tr${className ? ` ${className}` : ""}`}>
      <div className="sce-td is-left">
        <div className="sce-person">
          <Avatar name={r.operator} single size={23.5} style={{ fontSize: 11.5 }} />
          <span className="sc-trunc">{r.operator}</span>
        </div>
      </div>
      <div className="sce-td">
        <span className="sce-date">{r.date}</span>
      </div>
      <div className="sce-td">{r.checklist}</div>
      <div className="sce-td sc-num">{r.reading}</div>
      <div className="sce-td">{r.maintenance}</div>
      <div className="sce-td">
        <span className={`sce-status sce-status--${r.status === "Approved" ? "Done" : "Todo"}`}>
          <span className="sce-status-dot" />
          {r.status}
          <Icon name="chevronDown" size={15} stroke={1.8} />
        </span>
      </div>
    </div>
  );
}

// ─── materials: Hauling row ─────────────────────────────────────────────────
export type HaulRow = { ticket: string; time: string; truck: string; driver: string; project: string; type: string; material: string; qty: string; from: string };

export function HaulTr({ r, className }: { r: HaulRow; className?: string }) {
  return (
    <div className={`dds-haul-tr${className ? ` ${className}` : ""}`}>
      <span className="dds-haul-ticket sc-num">{r.ticket}</span>
      <span className="sc-num">{r.time}</span>
      <span className="sc-trunc">{r.truck}</span>
      <span className="sc-trunc">{r.project}</span>
      <span>
        <span className={`dds-haul-type dds-haul-type--${r.type}`}>{r.type}</span>
      </span>
      <span className="sc-trunc">{r.material}</span>
      <span className="dds-haul-qty sc-num">{r.qty}</span>
      <span className="sc-trunc dds-muted">{r.from}</span>
    </div>
  );
}

// ─── equipment: Service Queue row ───────────────────────────────────────────
export type QueueRow = { equipment: string; issue: string; by: string; updated: string; urgency: string; status: string };

export function QueueTr({ r, className }: { r: QueueRow; className?: string }) {
  return (
    <div className={`sce-tr sce-tr--q${className ? ` ${className}` : ""}`}>
      <div className="sce-td is-left">
        <div className="sce-eq-txt">
          <span className="sce-eq-name sc-trunc">{r.equipment}</span>
          <span className="sce-eq-sub sc-trunc">{r.issue}</span>
        </div>
      </div>
      <div className="sce-td is-left">
        <div className="sce-person">
          <Avatar name={r.by} single size={23.5} style={{ fontSize: 11.5 }} />
          <span className="sc-trunc">{r.by}</span>
        </div>
      </div>
      <div className="sce-td">
        <span className="sce-date">{r.updated}</span>
      </div>
      <div className="sce-td">
        <span className={`sce-urg sce-urg--${r.urgency}`}>{r.urgency}</span>
      </div>
      <div className="sce-td">
        <span className={`sce-status sce-status--${r.status}`}>
          <span className="sce-status-dot" />
          {r.status}
          <Icon name="chevronDown" size={15} stroke={1.8} />
        </span>
      </div>
    </div>
  );
}

// ─── a toast in the app's style (Friday) ────────────────────────────────────
export function Toast({ title, meta, time }: { title: ReactNode; meta: ReactNode; time?: ReactNode }) {
  return (
    <div className="dds-toast">
      <span className="dds-toast-ok">
        <Icon name="check" size={17} stroke={2.4} />
      </span>
      <span className="dds-toast-txt">
        <b>{title}</b>
        <span>{meta}</span>
      </span>
      {time && <span className="dds-toast-time">{time}</span>}
    </div>
  );
}
