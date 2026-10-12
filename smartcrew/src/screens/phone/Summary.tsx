// M5 · Weekly summary (Gen C mock: vercel-module-labor-payroll-mobile.png). Marcus Bell's week of
// Oct 5–11, 2026: Mon–Wed collapsed, Thu expanded to its jobsite and tasks. The mock's location
// placeholder becomes the jobsite, and the generic "Task" rows become the activity codes he logged.
import type { ReactNode } from "react";
import { PhoneShell, Icon, hm, hrsMins } from "../kit";
import { weekSummary, type SummaryDay } from "../data";
import "./Summary.css";

/** Feather-style check-circle with the tick running out of the ring (Submit Timecard). */
function CheckCircleOut({ size = 20 }: { size?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  );
}

/** "06:40 > 16:00" with the start time greyed out. */
function Span({ start, end, small = false }: { start: string; end: string; small?: boolean }) {
  return (
    <span className={small ? "ps-span ps-span--sm" : "ps-span"}>
      <span className="ps-span-from">{start}</span>
      <Icon name="chevronRight" size={small ? 14 : 16} stroke={small ? 1.9 : 1.8} />
      <span className="ps-span-to">{end}</span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ps-stat">
      <span className="ps-stat-k">{label}</span>
      <span className="ps-stat-v">{value}</span>
    </div>
  );
}

function CollapsedDay({ day }: { day: SummaryDay }) {
  return (
    <div className="ps-day">
      <span className="ps-dot" />
      <span className="ps-day-dow">{day.dow}</span>
      <div className="ps-day-pill">
        <Icon name="clock" size={23} stroke={1.6} />
        <span className="ps-day-hrs">{hrsMins(day.minutes)}</span>
        <Icon name="chevronRight" size={22} stroke={1.7} className="ps-day-chev" />
      </div>
    </div>
  );
}

function ExpandedDay({ day }: { day: SummaryDay }) {
  return (
    <div className="ps-open">
      <div className="ps-open-head">
        <span className="ps-dot" />
        <span className="ps-open-dow">{day.dow}</span>
        <span className="ps-open-date">{day.label}</span>
        <span className="ps-open-total">{hm(day.minutes)}</span>
        <Icon name="chevronDown" size={22} stroke={1.7} className="ps-open-chev" />
      </div>
      <div className="ps-site">
        <div className="ps-site-head">
          <div>
            <div className="ps-site-name">{day.location}</div>
            <Span start={day.in} end={day.out} />
          </div>
          <span className="ps-site-btn">
            <Icon name="chevronDown" size={22} stroke={1.8} />
          </span>
        </div>
        <div className="ps-site-rule" />
        {day.tasks.map((t) => (
          <div className="ps-task" key={t.start}>
            <div className="ps-task-row">
              <span className="ps-task-check">
                <Icon name="check" size={11} stroke={2.6} />
              </span>
              <span className="ps-task-name">{t.activity}</span>
              <Icon name="edit" size={20} stroke={1.6} className="ps-task-edit" />
              <Span start={t.start} end={t.end} small />
            </div>
            <div className="ps-chip">
              Equipment: <b>{t.equipment ?? "None"}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Summary() {
  const { days, total, overtime, averageDaily } = weekSummary;
  const open = days[days.length - 1];
  return (
    <PhoneShell tab="Summary">
      <div className="ps-title">Weekly summary</div>

      <div className="ps-week">
        <div className="ps-week-head">
          <Icon name="calendar" size={22} stroke={1.55} />
          <span>This Week</span>
        </div>
        <div className="ps-stats">
          <Stat label="Total hours" value={hm(total)} />
          <Stat label="Overtime" value={hm(overtime)} />
          <Stat label="Average daily" value={hm(averageDaily)} />
        </div>
        <div className="ps-submit">
          <CheckCircleOut size={20} />
          Submit Timecard
        </div>
      </div>

      <div className="ps-days">
        <span className="ps-line" />
        {days.slice(0, -1).map((d) => (
          <CollapsedDay key={d.date} day={d} />
        ))}
        <ExpandedDay day={open} />
      </div>
    </PhoneShell>
  );
}
