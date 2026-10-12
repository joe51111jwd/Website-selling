// The update card: the exact row (number, block, toast) that just changed on the office screen,
// as crisp vector DOM in the app's own kit, at ≥ 14 px. Lazy: it pulls the app kit (Inter + the
// scoped app CSS), which the page doesn't need until the One Day scene is near.

import { Cell2, Icon, Kpi, PersonCell, Pill } from "../../screens/kit";
import type { MomentId } from "../../content/moments";
import { DAY2_UI } from "../../content/copy";
import { DAY_DATA, HaulTr, InspectionTr, QueueTr, Toast } from "./states/rows";
import "../../screens/web/Equipment.css";
import "./states/states.css";
import "./card.css";

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ClockInRow() {
  const c = DAY_DATA.clockin;
  return (
    <div className="ddc-row ddc-clockin">
      <PersonCell name={c.name} initials={c.initials} sub={c.role} />
      <span>
        <Pill tone="green">Clocked In</Pill>
      </span>
      <Cell2 main={c.project} sub={`${c.number} · ${c.activity}`} />
      <Cell2 main={c.time} sub="Last clock in" />
    </div>
  );
}

function ProfitCard() {
  const p = DAY_DATA.profit;
  return (
    <div className="ddc-profit">
      <Kpi icon="dollarCircle" label="Profit" value={money(p.to)} sub={<span className="ddc-up">{DAY2_UI.profitSub}</span>} />
    </div>
  );
}

function PlanBlock() {
  const p = DAY_DATA.plan;
  return (
    <div className="ddc-plan">
      <span className="ddc-plan-day">{p.day}</span>
      <span className="ddc-block">
        <span className="ddc-block-l1">
          {p.time}
          <span className="ddc-block-crew">
            <Icon name="user" size={13} stroke={2} />
            {p.crew}
          </span>
        </span>
        <span className="ddc-block-l2">{p.project}</span>
      </span>
    </div>
  );
}

export default function UpdateCardBody({ id }: { id: MomentId }) {
  return (
    <div className="sc ddc">
      {id === "clockin" && <ClockInRow />}
      {id === "pretrip" && <InspectionTr r={DAY_DATA.pretrip} className="ddc-insp" />}
      {id === "load" && <HaulTr r={DAY_DATA.load} className="ddc-haul" />}
      {id === "leak" && <QueueTr r={DAY_DATA.leak} className="ddc-queue" />}
      {id === "profit" && <ProfitCard />}
      {id === "plan" && <PlanBlock />}
      {id === "payroll" && <Toast title={DAY_DATA.payroll.title} meta={DAY_DATA.payroll.meta} time={DAY_DATA.payroll.time} />}
    </div>
  );
}
