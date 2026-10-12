import type { ReactNode } from "react";
import { WebShell, Icon, Badge, money, hmPad } from "../kit";
import { equipment, equipmentIdUsage, navBadges } from "../data";
import "./Equipment.css";

// W5 Equipment list (Gen C), after vercel-module-equipment-management-web.png.
// The header, tab strip and toolbar are shared with W6 (ServiceQueue.tsx).

export const EQUIPMENT_TABS = ["Equipment", "Attachments", "Categories", "Service Queue", "Service Records"] as const;
export type EquipmentTab = (typeof EQUIPMENT_TABS)[number];

// Material glyphs for the row action tiles (the app draws these with Material Icons, not the
// outline set used elsewhere). Local because the kit icons are stroke-only.
const MPATH = {
  edit: "M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z",
  delete: "M7 21q-.82 0-1.41-.59T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .82-.59 1.41T17 21H7zM17 6H7v13h10V6zM9 17h2V8H9v9zm4 0h2V8h-2v9z",
} as const;

export function MIcon({ name, size }: { name: keyof typeof MPATH; size: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={MPATH[name]} />
    </svg>
  );
}

/** Page header ("Equipment" … chip) + the card with the tab strip and toolbar. */
export function EquipmentPage({ tab, headExtra, children }: { tab: EquipmentTab; headExtra?: ReactNode; children: ReactNode }) {
  return (
    <WebShell active="Equipment" contentClassName="sce">
      <div className="sce-head">
        <h1 className="sce-title">Equipment</h1>
        {headExtra}
        <span className="sce-chip sc-num">
          {equipmentIdUsage.used}/{equipmentIdUsage.limit} Equipment IDs
        </span>
      </div>
      <div className="sce-card">
        <div className="sce-toolbar">
          <div className="sce-tabs-clip">
            <div className="sce-tabs">
              {EQUIPMENT_TABS.map((t) => (
                <span key={t} className={`sce-tab${t === tab ? " is-active" : ""}`}>
                  {t}
                  {t === "Service Queue" && <Badge>{navBadges.Equipment}</Badge>}
                </span>
              ))}
            </div>
          </div>
          <div className="sce-search">
            <Icon name="search" size={18} stroke={2} />
            <span>Search</span>
          </div>
          <span className="sce-btn sce-btn--filters">
            <Icon name="filter" size={18} stroke={1.5} />
            Filters
          </span>
          <span className="sce-btn sce-btn--sort">
            <Icon name="sort" size={13} stroke={1.75} />
            Sort
          </span>
          <span className="sce-btn sce-btn--add">
            <Icon name="plus" size={15} stroke={2} />
            Add
          </span>
        </div>
        {children}
      </div>
    </WebShell>
  );
}

const COLS: { label: string; left?: boolean }[] = [
  { label: "Equipment ID", left: true },
  { label: "Year" },
  { label: "Make", left: true },
  { label: "Model", left: true },
  { label: "Category" },
  { label: "Hour Rate" },
  { label: "Hours" },
  { label: "Action" },
];

const rows = [...equipment].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export default function Equipment() {
  return (
    <EquipmentPage tab="Equipment">
      <div className="sce-tr sce-tr--head">
        {COLS.map((c) => (
          <div key={c.label} className={`sce-td${c.left ? " is-left" : ""}`}>
            {c.label}
          </div>
        ))}
      </div>
      {rows.map((e) => (
        <div key={e.id} className="sce-tr">
          <div className="sce-td is-left is-wrap">{e.id}</div>
          <div className="sce-td">{e.year}</div>
          <div className="sce-td is-left sc-trunc">{e.make}</div>
          <div className="sce-td is-left is-wrap">{e.model}</div>
          <div className="sce-td">{e.category}</div>
          <div className="sce-td">{money(e.hourRate)}</div>
          <div className="sce-td">{hmPad(e.minutes)}</div>
          <div className="sce-td is-act">
            <span className="sce-act">
              <MIcon name="edit" size={13.5} />
            </span>
            <span className="sce-act sce-act--del">
              <MIcon name="delete" size={13} />
            </span>
            <Icon name="chevronRight" size={22} stroke={1.5} className="sce-go" />
          </div>
        </div>
      ))}
    </EquipmentPage>
  );
}
