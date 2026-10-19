import { Icon, money, pct } from "../kit";
import { costCodes, featuredProject as P } from "../data";
import { ProjectPage } from "./ProjectDetail";
import "./CostCodes.css";

// W3b Project detail → Cost Codes (Andrew: "click the 'Cost Code' tab on the project page. It'll
// show a breakdown of project financials by cost code against the bid"). The same Gen C project
// page with the Cost Codes tab open: each code's budget from the bid, what's been spent on it,
// what's left and how much of the budget is used, then the totals, which are the page's own
// numbers (the budget cards' budgets and the Expenses card).

const total = {
  budget: costCodes.reduce((a, c) => a + c.budget, 0),
  spent: Math.round(costCodes.reduce((a, c) => a + c.spent, 0) * 100) / 100,
};
const used = (spent: number, budget: number) => (budget === 0 ? 0 : (spent / budget) * 100);

if (import.meta.env.DEV) {
  const bid = P.labor.budget + P.materials.budget + P.equipment.budget + P.other.budget + P.changeOrderBucket.budget;
  if (total.budget !== bid || total.spent !== P.expenses) console.warn("[cost codes] totals ≠ the project's", total, bid, P.expenses);
}

function Used({ spent, budget }: { spent: number; budget: number }) {
  const u = used(spent, budget);
  const over = u > 100;
  return (
    <span className={`sccc-used${over ? " is-over" : ""}`}>
      <span className="sccc-bar">
        <i style={{ width: `${Math.min(100, u)}%` }} />
      </span>
      <b>{pct(Math.round(u * 100) / 100)}</b>
    </span>
  );
}

export default function CostCodes() {
  return (
    <ProjectPage tab="Cost Codes">
      <div className="sccc">
        <div className="sccc-tr sccc-tr--head">
          <div>Cost code</div>
          <div>Budget</div>
          <div>Spent</div>
          <div>Remaining</div>
          <div>
            Budget used <Icon name="sort" size={13} stroke={1.6} />
          </div>
        </div>
        {costCodes.map((c) => (
          <div key={c.code} className="sccc-tr">
            <div className="sccc-code">
              <span className="sccc-num">{c.code}</span>
              <span className="sc-trunc">{c.name}</span>
            </div>
            <div>{money(c.budget)}</div>
            <div>{money(c.spent)}</div>
            <div className={c.spent > c.budget ? "sccc-neg" : undefined}>{money(c.budget - c.spent)}</div>
            <div>
              <Used spent={c.spent} budget={c.budget} />
            </div>
          </div>
        ))}
        <div className="sccc-tr sccc-tr--total">
          <div>Total vs. bid</div>
          <div>{money(total.budget)}</div>
          <div>{money(total.spent)}</div>
          <div>{money(total.budget - total.spent)}</div>
          <div>
            <Used spent={total.spent} budget={total.budget} />
          </div>
        </div>
      </div>
    </ProjectPage>
  );
}
