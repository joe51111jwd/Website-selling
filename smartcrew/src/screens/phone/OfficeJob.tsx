// Job costing in the office app's mobile layout (402 × 874): the web job detail page
// (../web/ProjectDetail.tsx) stacked for a phone. Same job, same numbers: Hwy 9 Culvert
// Replacement's profit to date (revenue − expenses), four of its budget cards and the Labor tab's
// hours by person (the same split as the web page, so the totals agree).
// Layout boxes the spec sheet points at (src/site/specsheet/tour.ts): the profit card
// [20, 196, 362, 112], the change orders card [206, 436, 176, 88], the first labor row
// [20, 576, 362, 46].

import { Icon, money, pct, hm } from "../kit";
import { featuredProject as P, crewById, type Bucket } from "../data";
import { OfficeMobile } from "./OfficeMobile";

// the web page's Labor tab split (ProjectDetail.tsx LABOR_SPLIT): hours to date per person
const LABOR_SPLIT: { id: string; share: number }[] = [
  { id: "c01", share: 0.262 },
  { id: "c02", share: 0.255 },
  { id: "c06", share: 0.243 },
];
const laborRows = LABOR_SPLIT.map((r) => ({ person: crewById(r.id), total: Math.round(P.laborMinutes * r.share) }));

function Card({ title, b }: { title: string; b: Bucket }) {
  return (
    <div className="om-bcard">
      <span className="om-bcard-t">{title}</span>
      <span className="om-bcard-row">
        <span>Spent</span>
        <b className="sc-num">{money(b.spent)}</b>
      </span>
      <span className="om-bcard-row">
        <span>Net</span>
        <b className="sc-num">
          {money(b.net)} <i className={b.pct > 100 ? "is-over" : undefined}>{pct(b.pct)}</i>
        </b>
      </span>
    </div>
  );
}

export default function OfficeJob() {
  return (
    <OfficeMobile tab="Projects">
      <span className="om-back">
        <Icon name="chevronLeft" size={17} stroke={1.8} />
        Projects
      </span>
      <h1 className="om-title">{P.name}</h1>
      <div className="om-meta">
        <span className="sc-num">{P.number}</span>
        <span className="om-status">{P.status}</span>
      </div>

      <div className="om-profit">
        <span className="om-profit-k">
          <Icon name="dollarCircle" size={18} stroke={1.6} />
          Profit
        </span>
        <span className="om-profit-v sc-num">{money(P.profit)}</span>
        <span className="om-profit-sub">
          <span>
            Revenue <b className="sc-num">{money(P.revenue)}</b>
          </span>
          <span>
            Expenses <b className="sc-num">{money(P.expenses)}</b>
          </span>
        </span>
      </div>

      <div className="om-grid">
        <Card title="Labor" b={P.labor} />
        <Card title="Materials" b={P.materials} />
        <Card title="Equipment" b={P.equipment} />
        <Card title="Change orders" b={P.changeOrderBucket} />
      </div>

      <div className="om-h">
        <span>Labor</span>
        <span>Total hours</span>
      </div>
      <div className="om-list">
        {laborRows.map(({ person, total }) => (
          <div className="om-li" key={person.id}>
            <span className="om-av">{person.name[0]}</span>
            <span className="om-li-name">{person.name}</span>
            <span className="om-li-v sc-num">{hm(total)}</span>
          </div>
        ))}
      </div>
    </OfficeMobile>
  );
}
