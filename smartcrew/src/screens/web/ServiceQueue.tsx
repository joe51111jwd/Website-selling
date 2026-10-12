import { Icon, Segmented, Avatar } from "../kit";
import { serviceQueue, equipmentById, crewById, type ServiceItem } from "../data";
import { EquipmentPage } from "./Equipment";
import "./Equipment.css";

// W6 Equipment → Service Queue, rebuilt in Gen C. The only capture is Gen B (video frame
// v062: Equipment · Employee · Updated · Urgency · Status, Low/Medium/High urgency, Todo/Doing/Done
// status, List View / Board View). Cells follow the Gen C inspections table on
// vercel-module-dot-compliance-web.png: letter avatar, grey date pill, "● Pending ▾" select.

const COLS = ["Equipment", "Employee", "Updated", "Urgency", "Status"];

function Row({ item }: { item: ServiceItem }) {
  const eq = equipmentById(item.equipmentId);
  const who = crewById(item.crewId);
  return (
    <div className="sce-tr sce-tr--q">
      <div className="sce-td is-left">
        <div className="sce-eq-txt">
          <span className="sce-eq-name sc-trunc">{eq.name}</span>
          <span className="sce-eq-sub sc-trunc">{item.issue}</span>
        </div>
      </div>
      <div className="sce-td is-left">
        <div className="sce-person">
          <Avatar name={who.name} single size={23.5} style={{ fontSize: 11.5 }} />
          <span className="sc-trunc">{who.name}</span>
        </div>
      </div>
      <div className="sce-td">
        <span className="sce-date">{item.updated}</span>
      </div>
      <div className="sce-td">
        <span className={`sce-urg sce-urg--${item.urgency}`}>{item.urgency}</span>
      </div>
      <div className="sce-td">
        <span className={`sce-status sce-status--${item.status}`}>
          <span className="sce-status-dot" />
          {item.status}
          <Icon name="chevronDown" size={15} stroke={1.8} />
        </span>
      </div>
    </div>
  );
}

export default function ServiceQueue() {
  return (
    <EquipmentPage tab="Service Queue" headExtra={<Segmented className="sce-views" items={["List View", "Board View"]} value="List View" />}>
      <div className="sce-q">
        <div className="sce-tr sce-tr--head">
          {COLS.map((c, i) => (
            <div key={c} className={`sce-td${i < 2 ? " is-left" : ""}`}>
              {c}
            </div>
          ))}
        </div>
        {serviceQueue.map((it) => (
          <Row key={it.id} item={it} />
        ))}
      </div>
    </EquipmentPage>
  );
}
