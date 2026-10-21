import { Icon } from "../kit";
import { ProjectPage } from "./ProjectDetail";
import "./CostCodes.css";

// W3b Project detail → Cost Codes, as Andrew sent it from the app (Oct 21: "On the job costing side,
// for budget bids vs actual costs, lets use a shot like this"): the project page with the Cost Codes
// tab open and its table up top. Each code's budget from the bid, the approved hours and labor, the
// equipment and material on it, the variance left, how much of the budget is consumed and the pace;
// then the same rolled up by category, and the project's total. His numbers, as on his screen.

type Pace = number | null; // % ahead, or no pace yet
type Code = { name: string; code: string; budget: number; hours: string; labor: number; equipment: number; material: number; variance: number; consumed: number; pace: Pace };
type Cat = { name: string; budget: number; actual: number; variance: number; consumed: number; pace: Pace };

const CODES: Code[] = [
  { name: "Fine Grading", code: "GRAD", budget: 51667, hours: "164h 0m", labor: 5852, equipment: 20992, material: 0, variance: 24823, consumed: 52.0, pace: 48.0 },
  { name: "Utility Trenching", code: "UTIL", budget: 51667, hours: "163h 0m", labor: 6283, equipment: 25428, material: 940, variance: 19016, consumed: 63.2, pace: 36.8 },
  { name: "Excavation", code: "EXC", budget: 51667, hours: "32h 0m", labor: 1472, equipment: 5376, material: 18.5, variance: 44800.5, consumed: 13.3, pace: 86.7 },
  { name: "Concrete Prep", code: "CONC", budget: 51667, hours: "0h 0m", labor: 0, equipment: 0, material: 41, variance: 51626, consumed: 0.1, pace: 99.9 },
  { name: "Hauling", code: "HAU", budget: 51667, hours: "0h 0m", labor: 0, equipment: 0, material: 0, variance: 51667, consumed: 0.0, pace: null },
  { name: "Mobilization", code: "MOB", budget: 51667, hours: "0h 0m", labor: 0, equipment: 0, material: 0, variance: 51667, consumed: 0.0, pace: null },
];

const CATS: Cat[] = [
  { name: "Concrete", budget: 51667, actual: 41, variance: 51626, consumed: 0.1, pace: 99.9 },
  { name: "Earthwork", budget: 103334, actual: 33710.5, variance: 69623.5, consumed: 32.6, pace: 67.4 },
  { name: "General Conditions", budget: 51667, actual: 0, variance: 51667, consumed: 0.0, pace: null },
  { name: "Trucking", budget: 51667, actual: 0, variance: 51667, consumed: 0.0, pace: null },
  { name: "Underground Utilities", budget: 51667, actual: 32651, variance: 19016, consumed: 63.2, pace: 36.8 },
];
const TOTAL: Cat = { name: "Project Total", budget: 310002, actual: 66402.5, variance: 243599.5, consumed: 21.4, pace: 78.6 };

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PaceCell = ({ p }: { p: Pace }) => (p === null ? <span className="sccx-nopace">No pace</span> : <span className="sccx-ahead">{p.toFixed(1)}% Ahead</span>);
const Info = () => <Icon name="info" size={13} stroke={1.6} />;

export default function CostCodes() {
  return (
    <ProjectPage tab="Cost Codes" bare>
      <div className="sccx">
        <div className="sccx-tr sccx-tr--head">
          <div>Name</div>
          <div>Code</div>
          <div>Budget</div>
          <div>
            Approved Hours <Info />
          </div>
          <div>
            Approved Labor <Info />
          </div>
          <div>Equipment</div>
          <div>Material</div>
          <div>Variance</div>
          <div>Consumed</div>
          <div>
            Pace <Info />
          </div>
        </div>
        {CODES.map((c) => (
          <div key={c.code} className="sccx-tr">
            <div>{c.name}</div>
            <div>
              <span className="sccx-code">{c.code}</span>
            </div>
            <div>{usd(c.budget)}</div>
            <div>{c.hours}</div>
            <div>{usd(c.labor)}</div>
            <div>{usd(c.equipment)}</div>
            <div>{usd(c.material)}</div>
            <div className="sccx-var">{usd(c.variance)}</div>
            <div>{c.consumed.toFixed(1)}%</div>
            <div>
              <PaceCell p={c.pace} />
            </div>
          </div>
        ))}
        <div className="sccx-pager">
          <Icon name="chevronLeft" size={18} stroke={1.6} />
          <span>Page 1 of 1</span>
          <Icon name="chevronRight" size={18} stroke={1.6} />
        </div>

        <div className="sccx-tr sccx-tr--cat sccx-tr--head">
          <div>Category / Total</div>
          <div>Budget</div>
          <div>Actual</div>
          <div>Variance</div>
          <div>Consumed</div>
          <div>Pace</div>
        </div>
        {[...CATS, TOTAL].map((c) => (
          <div key={c.name} className={`sccx-tr sccx-tr--cat${c === TOTAL ? " is-total" : ""}`}>
            <div>{c.name}</div>
            <div>{usd(c.budget)}</div>
            <div>{usd(c.actual)}</div>
            <div>{usd(c.variance)}</div>
            <div>{c.consumed.toFixed(1)}%</div>
            <div>
              <PaceCell p={c.pace} />
            </div>
          </div>
        ))}
      </div>
    </ProjectPage>
  );
}
