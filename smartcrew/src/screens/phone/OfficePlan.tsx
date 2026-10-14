// Scheduling in the office app's mobile layout (402 × 874): the web month view
// (../web/Scheduling.tsx) as one day for a phone. Monday, Oct 12 (the day the office plans in One
// Day's 5:30 PM moment): every crew's block from the same schedule data, earliest first, in the
// web view's blue. The bottom bar carries the office app's sections (Messaging, Pipeline).
// Layout boxes the spec sheet points at (src/site/specsheet/tour.ts): the first block
// [20, 236, 362, 74]; the Messaging and Pipeline tabs in the bottom bar (y 761 – 874).

import { Icon } from "../kit";
import { scheduleBlocks } from "../data";
import { OfficeMobile } from "./OfficeMobile";

const DAY = "2026-10-12";
const DAYS = [
  { n: 12, d: "Mon" },
  { n: 13, d: "Tue" },
  { n: 14, d: "Wed" },
  { n: 15, d: "Thu" },
  { n: 16, d: "Fri" },
];

const toMin = (t: string) => {
  const [hm, ap] = t.split(" ");
  const [h, m] = hm.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};
const blocks = scheduleBlocks.filter((b) => b.date === DAY).sort((a, b) => toMin(a.start) - toMin(b.start));

export default function OfficePlan() {
  return (
    <OfficeMobile tab="Scheduling">
      <div className="om-plan-head">
        <h1 className="om-title om-title--big">Scheduling</h1>
        <span className="om-month">October 2026</span>
      </div>
      <div className="om-days">
        {DAYS.map((x, i) => (
          <span key={x.n} className={`om-day${i === 0 ? " is-on" : ""}`}>
            <b className="sc-num">{x.n}</b>
            <span>{x.d}</span>
          </span>
        ))}
      </div>
      <div className="om-blocks">
        {blocks.map((b) => (
          <div className="om-block" key={b.id}>
            <span className="om-block-t">
              <span className="sc-num">
                {b.start} – {b.end}
              </span>
              <span className="om-block-crew">
                <Icon name="user" size={14} stroke={2} />
                {b.crewIds.length}
              </span>
            </span>
            <span className="om-block-p">{b.title}</span>
            <span className="om-block-a">{b.activity}</span>
          </div>
        ))}
      </div>
    </OfficeMobile>
  );
}
