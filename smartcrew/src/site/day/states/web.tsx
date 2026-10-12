// One Day's office states that the recreated web screens don't have, built from the same kit:
// the truck's inspections (equipment detail → Inspections, after vercel-module-dot-compliance-web),
// the day's hauling tickets (Materials → Hauling) and the shop queue with the D6 request just in.
// Shot to public/renders/day-s/web-d-*.webp (1440×900 @2x). Each has the new record as its top
// row; the Stage hides that row until the update lands (./overlays in ../life.ts).

import { WebShell, Icon, Kpi, Segmented, type IconName } from "../../../screens/kit";
import { EquipmentPage } from "../../../screens/web/Equipment";
import { serviceQueue, equipmentById, crewById } from "../../../screens/data";
import { DAY_DATA, HaulTr, InspectionTr, QueueTr, type HaulRow, type InspectionRow, type QueueRow } from "./rows";
import "../../../screens/web/Equipment.css";
import "./states.css";

// ─── equipment detail: Mack Granite #1102 → Inspections ─────────────────────
const truck = equipmentById("1102-MACK-GU713");

function Info({ icon, k, v }: { icon: IconName; k: string; v: string }) {
  return (
    <div className="dds-info">
      <Icon name={icon} size={16} stroke={1.5} />
      <span className="dds-info-k">{k}</span>
      <span className="dds-info-v">{v}</span>
    </div>
  );
}

export const INSPECTIONS: InspectionRow[] = [
  DAY_DATA.pretrip,
  { operator: "Tomás Ortega", date: "8 October 2026; 06:11 AM", checklist: "DOT", reading: "211,488", maintenance: "Unlinked", status: "Approved" },
  { operator: "Tomás Ortega", date: "7 October 2026; 06:09 AM", checklist: "DOT", reading: "211,327", maintenance: "Unlinked", status: "Approved" },
  { operator: "Tomás Ortega", date: "6 October 2026; 06:14 AM", checklist: "DOT", reading: "211,160", maintenance: "Linked", status: "Approved" },
  { operator: "Gabe Moreno", date: "5 October 2026; 06:02 AM", checklist: "DOT", reading: "210,996", maintenance: "Unlinked", status: "Approved" },
  { operator: "Tomás Ortega", date: "2 October 2026; 06:20 AM", checklist: "DOT", reading: "210,842", maintenance: "Unlinked", status: "Approved" },
];

export function WebInspections() {
  return (
    <WebShell active="Equipment" collapsed contentClassName="dds-eqd">
      <div className="dds-eqd-head">
        <span className="dds-back">
          <Icon name="chevronLeft" size={17} stroke={1.8} />
          Back
        </span>
        <span className="dds-eqd-ico">
          <Icon name="dumpTruck" size={22} stroke={1.6} />
        </span>
        <span className="dds-eqd-name">
          <b>{truck.name}</b>
          <span>ID {truck.id}</span>
        </span>
        <span className="dds-eqd-btn dds-eqd-btn--del">
          <Icon name="trash" size={16} stroke={1.7} />
          Delete
        </span>
        <span className="dds-eqd-btn">
          <Icon name="edit" size={16} stroke={1.7} />
          Edit
        </span>
      </div>
      <div className="dds-eqd-cards">
        <div className="dds-eqd-card">
          <Info icon="tag" k="Equipment ID" v={truck.id} />
          <Info icon="calendar" k="Year" v={String(truck.year)} />
          <Info icon="truck" k="Make" v={truck.make} />
          <Info icon="layers" k="Model" v={truck.model} />
          <Info icon="wrench" k="Category" v={truck.category} />
        </div>
        <div className="dds-eqd-card">
          <Info icon="dollar" k="Hourly Rate" v="$115.00" />
          <Info icon="clock" k="Hours" v="247h 10m" />
          <Info icon="gauge" k="Mileage" v={truck.reading.toLocaleString("en-US")} />
          <Info icon="calendarCheck" k="Last Service" v="Aug 21, 2026" />
          <Info icon="calendar" k="Next Service" v="Oct 21, 2026" />
        </div>
        <div className="dds-eqd-card dds-eqd-notes">
          <b>Notes</b>
          <span>Air dryer purge valve: check at next service.</span>
        </div>
      </div>
      <div className="sce-card dds-eqd-table">
        <div className="sce-toolbar">
          <div className="sce-tabs-clip">
            <div className="sce-tabs">
              {["Hours Log", "Service Records", "Documents", "Inspections"].map((t) => (
                <span key={t} className={`sce-tab${t === "Inspections" ? " is-active" : ""}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="sce-search">
            <Icon name="search" size={18} stroke={2} />
            <span>Search inspections</span>
          </div>
          <span className="sce-btn sce-btn--sort">
            <Icon name="sort" size={13} stroke={1.75} />
            Sort
          </span>
        </div>
        <div className="sce-tr sce-tr--head dds-insp-tr">
          {["Operator", "Date", "Checklist", "Reading", "Maintenance", "Status"].map((c, i) => (
            <div key={c} className={`sce-td${i === 0 ? " is-left" : ""}`}>
              {c}
            </div>
          ))}
        </div>
        {INSPECTIONS.map((r, i) => (
          <InspectionTr key={i} r={r} className={i === 0 ? "dds-new" : undefined} />
        ))}
      </div>
    </WebShell>
  );
}

// ─── materials: today's hauling tickets ─────────────────────────────────────
const H = DAY_DATA.load;
const riv = { truck: "Mack Granite #1102", driver: "Tomás Ortega", project: "Riverside Storm Sewer", type: "Import", material: "Select fill", qty: "12 yd³", from: "Hollis Sand & Gravel" };
const cr14 = { truck: "Mack Granite #1101", driver: "Colin Brennan", project: "County Rd 14 Widening", type: "Export", material: "Topsoil", qty: "12 yd³", from: "Cedar Ridge yard" };
const hwy9 = { truck: "Mack Granite #1103", driver: "Gabe Moreno", project: "Hwy 9 Culvert Replacement", type: "Import", material: "Rip-rap, Class III", qty: "10 yd³", from: "North Star Pit 2" };

export const HAULS: HaulRow[] = [
  { ticket: H.ticket, time: H.time, ...riv },
  { ticket: "#13", time: "9:08 AM", ...cr14 },
  { ticket: "#12", time: "9:02 AM", ...riv },
  { ticket: "#11", time: "8:47 AM", ...hwy9 },
  { ticket: "#10", time: "8:41 AM", ...cr14 },
  { ticket: "#9", time: "8:36 AM", ...riv },
  { ticket: "#8", time: "8:12 AM", ...riv },
  { ticket: "#7", time: "8:05 AM", ...hwy9 },
  { ticket: "#6", time: "7:58 AM", ...cr14 },
];

export function WebHauling() {
  return (
    <WebShell active="Materials" title="Materials" actions={<Segmented items={["Day", "Week", "Month", "All"]} value="Day" size="sm" />}>
      <div className="dds-haul-kpis">
        <Kpi icon="truck" label="Loads today" value="14" well={false} />
        <Kpi icon="box" label="Yards hauled" value="168 yd³" well={false} />
        <Kpi icon="download" label="Imported" value="9 loads" well={false} />
        <Kpi icon="upload" label="Exported" value="5 loads" well={false} />
      </div>
      <div className="sce-card dds-haul-card">
        <div className="sce-toolbar">
          <div className="sce-tabs-clip">
            <div className="sce-tabs">
              {["Orders", "Field Usage", "Hauling", "Receipts"].map((t) => (
                <span key={t} className={`sce-tab${t === "Hauling" ? " is-active" : ""}`}>
                  {t}
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
            <Icon name="plus" size={18} stroke={2} />
            Add
          </span>
        </div>
        <div className="dds-haul-tr dds-haul-tr--head">
          {["Ticket", "Time", "Truck", "Project", "Type", "Material", "Quantity", "From"].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {HAULS.map((r, i) => (
          <HaulTr key={r.ticket} r={r} className={i === 0 ? "dds-new" : undefined} />
        ))}
      </div>
    </WebShell>
  );
}

// ─── equipment: service queue, the D6 request on top ────────────────────────
export const QUEUE: QueueRow[] = [
  DAY_DATA.leak,
  ...serviceQueue.slice(1).map((it) => ({
    equipment: equipmentById(it.equipmentId).name,
    issue: it.issue,
    by: crewById(it.crewId).name,
    updated: it.updated,
    urgency: it.urgency,
    status: it.status,
  })),
];

export function WebQueue() {
  return (
    <EquipmentPage tab="Service Queue" headExtra={<Segmented className="sce-views" items={["List View", "Board View"]} value="List View" />}>
      <div className="sce-q">
        <div className="sce-tr sce-tr--head">
          {["Equipment", "Employee", "Updated", "Urgency", "Status"].map((c, i) => (
            <div key={c} className={`sce-td${i < 2 ? " is-left" : ""}`}>
              {c}
            </div>
          ))}
        </div>
        {QUEUE.map((r, i) => (
          <QueueTr key={i} r={r} className={i === 0 ? "dds-new" : undefined} />
        ))}
      </div>
    </EquipmentPage>
  );
}
