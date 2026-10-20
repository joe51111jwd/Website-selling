import { Pill, money } from "../kit";
import { featuredProject as P } from "../data";
import { ProjectPage } from "./ProjectDetail";
import "./CostCodes.css";

// Project detail → Change Orders (Watch it work, Change Orders: "Review, price, approve, and track
// change orders from start to finish"; Andrew's comment-mode note, Oct 20: "Show change order screen
// on web"). The same project page with the Change Orders tab open: the job's change orders from the
// data (number, what, date, price to the client, cost budget, status), then the totals. Rows use
// the Cost Codes table's metrics (sccc-).

const total = { amount: P.changeOrders.reduce((a, c) => a + c.amount, 0), cost: P.changeOrders.reduce((a, c) => a + c.costBudget, 0) };
const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function ChangeOrders() {
  return (
    <ProjectPage tab="Change Orders">
      <div className="sccc">
        <div className="sccc-tr sccc-tr--head sccc-tr--co">
          <div>Change order</div>
          <div>Date</div>
          <div>Price</div>
          <div>Cost budget</div>
          <div>Status</div>
        </div>
        {P.changeOrders.map((c) => (
          <div key={c.no} className="sccc-tr sccc-tr--co">
            <div className="sccc-code">
              <span className="sccc-num">{c.no}</span>
              <span className="sc-trunc">{c.title}</span>
            </div>
            <div>{date(c.date)}</div>
            <div>{money(c.amount)}</div>
            <div>{money(c.costBudget)}</div>
            <div>
              <Pill tone={c.status === "Approved" ? "green" : "orange"} dot>
                {c.status}
              </Pill>
            </div>
          </div>
        ))}
        <div className="sccc-tr sccc-tr--total sccc-tr--co">
          <div>Total</div>
          <div />
          <div>{money(total.amount)}</div>
          <div>{money(total.cost)}</div>
          <div />
        </div>
      </div>
    </ProjectPage>
  );
}
