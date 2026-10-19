import type { ReactNode } from "react";
import { WebShell, Icon, Segmented, type IconName, money, num, hm, dateShort } from "../kit";
import { equipmentById, machine, serviceQueue, crewById } from "../data";
import { MIcon } from "./Equipment";
import "./ProjectDetail.css";
import "./Machine.css";

// W13 Equipment → one machine, Service Records tab, after the Gen C equipment-detail page in
// Andrew's doc (Bobcat S76: Back · name and ID · Delete / Edit, the facts card, the rates and
// hours card, Notes, then Hours Log · Service Records · Documents · Inspections and the records
// table). Ours is the CAT D6 from the service queue's first row, its demo record in data.ts.

const E = equipmentById(machine.equipmentId);
/** its open request in the service queue (not in the log until it's done) */
const openItem = serviceQueue.find((q) => q.equipmentId === machine.equipmentId && q.status !== "Done");
const yearCost = machine.log.filter((r) => r.date.startsWith("2026")).reduce((a, r) => a + r.cost, 0);

function Fact({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="scmd-row">
      <Icon name={icon} size={16} stroke={1.5} />
      <span className="scmd-label">{label}</span>
      <span className="scmd-value">{children}</span>
    </div>
  );
}

const COLS = ["Date", "Work done", "Service type", "Hour meter", "Time to complete", "Cost", "Provider", "Action"];

export default function Machine() {
  return (
    <WebShell active="Equipment" collapsed contentClassName="scmd">
      <div className="scpd-head">
        <span className="scpd-back">
          <Icon name="chevronLeft" size={20} stroke={1.7} />
          Back
        </span>
        <span className="scmd-av">
          <Icon name="equipment" size={19} stroke={1.6} />
        </span>
        <div className="scmd-name">
          <h1>{E.name}</h1>
          <span>ID: {E.id}</span>
        </div>
        <span className="scpd-hbtn scpd-hbtn--del">
          <MIcon name="delete" size={13} />
          Delete
        </span>
        <span className="scpd-hbtn">
          <MIcon name="edit" size={13.5} />
          Edit
        </span>
      </div>

      <div className="scmd-top">
        <div className="scmd-card">
          <Fact icon="hash" label="Equipment ID">
            {E.id}
          </Fact>
          <Fact icon="calendar" label="Year">
            {E.year}
          </Fact>
          <Fact icon="tag" label="Make">
            {E.make}
          </Fact>
          <Fact icon="equipment" label="Model">
            {E.model}
          </Fact>
          <Fact icon="info" label="VIN / SN">
            {machine.serial}
          </Fact>
          <Fact icon="layers" label="Category">
            {E.category}
          </Fact>
          <Fact icon="target" label="Status">
            <span className="scmd-status">
              <i />
              {E.status}
            </span>
          </Fact>
          <Fact icon="clock" label="Hours this season">
            {hm(E.minutes)}
          </Fact>
        </div>
        <div className="scmd-card">
          <Fact icon="dollar" label="Purchase price">
            {money(E.purchasePrice)}
          </Fact>
          <Fact icon="dollarCircle" label="Billable rate">
            {money(E.hourRate)}/hr
          </Fact>
          <Fact icon="receipt" label="Cost rate">
            {money(machine.costRate)}/hr
          </Fact>
          <Fact icon="gauge" label="Hour meter">
            {num(E.reading)} hrs
          </Fact>
          <Fact icon="wrench" label="Last service">
            {dateShort(E.lastService)}
          </Fact>
          <Fact icon="calendarCheck" label="Next service">
            {dateShort(E.nextService)}
          </Fact>
          <Fact icon="cash" label="Service cost, 2026">
            {money(yearCost)}
          </Fact>
        </div>
        <div className="scmd-card scmd-notes">
          <span className="scmd-notes-h">Notes</span>
          <p>{machine.notes}</p>
          {openItem && (
            <div className="scmd-open">
              <span className="scmd-open-h">
                <Icon name="wrench" size={14} stroke={1.7} />
                Open in the Service Queue
              </span>
              <span className="scmd-open-t">{openItem.issue}</span>
              <span className="scmd-open-s">
                <span className={`sce-urg sce-urg--${openItem.urgency}`}>{openItem.urgency}</span>
                <span className={`sce-status sce-status--${openItem.status} scmd-open-st`}>
                  <span className="sce-status-dot" />
                  {openItem.status}
                </span>
                <span className="scmd-open-by">
                  {crewById(openItem.crewId).name} · {openItem.updated}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="scpd-card scmd-log">
        <div className="scpd-toolbar">
          <Segmented items={["Hours Log", "Service Records", "Documents", "Inspections"]} value="Service Records" />
          <span className="scmd-add">
            <Icon name="plus" size={15} stroke={2} />
            Add Service Record
          </span>
        </div>
        <div className="scmd-tr scmd-tr--head">
          {COLS.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
        {machine.log.map((r) => (
          <div key={r.date} className="scmd-tr">
            <div>{dateShort(r.date)}</div>
            <div className="sc-trunc">{r.work}</div>
            <div>
              <span className={`scmd-type scmd-type--${r.type}`}>{r.type}</span>
            </div>
            <div>{num(r.meter)} hrs</div>
            <div>{hm(r.took)}</div>
            <div>{money(r.cost)}</div>
            <div className="sc-trunc">{r.provider}</div>
            <div className="scmd-acts">
              <span className="sce-act">
                <MIcon name="edit" size={13.5} />
              </span>
              <span className="sce-act sce-act--del">
                <MIcon name="delete" size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </WebShell>
  );
}
