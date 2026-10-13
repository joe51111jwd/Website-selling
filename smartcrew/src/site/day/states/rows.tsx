// The exact rows One Day's updates land as, drawn with the recreated app's own kit. The same
// components draw the row inside the laptop's state screens (./web.tsx, shot to textures) and
// the crisp vector update card next to the laptop (../UpdateCard.tsx), so the two never differ.
// Demo data: src/screens/data.ts (Cedar Ridge Earthworks, Fri Oct 9 2026) plus the few records
// the day itself creates, below.

import type { ReactNode } from "react";
import { Avatar, Icon, Pill, Cell2, PersonCell } from "../../../screens/kit";
import { DAY_DATA } from "./data";

export { DAY_DATA };

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
