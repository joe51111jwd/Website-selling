import "./Scheduling.css";
import { WebShell, Segmented, Button, Icon } from "../kit";
import { projectById, scheduleMonth, TODAY } from "../data";

// W9 Scheduling (Gen C), after vercel-module-scheduling.png: Calendar · Timeline, Month · Week ·
// Day, "‹ October 2026 ›", "+ Add Schedule", and a Mon-first month grid of blue schedule blocks.
//
// The month grid shows at most two blocks per day (a third would not fit the fixed row height),
// so this screen keeps its own month plan: one entry per crew assignment, varied across the
// projects, crews and start times that data.ts already defines. Weekends are mostly empty and
// show the app's "No schedules" chip. Today (Fri Oct 9) gets the grey "today" fill.

type Slot = { projectId: string; start: string; end: string; crew: number };

const T = {
  hwy9: { projectId: "p2417", start: "7:00 AM", end: "3:30 PM", crew: 4 },
  hwy9Set: { projectId: "p2417", start: "6:30 AM", end: "3:00 PM", crew: 6 }, // culvert setting day (lane closure)
  maple: { projectId: "p2422", start: "7:00 AM", end: "4:00 PM", crew: 3 },
  river: { projectId: "p2409", start: "6:30 AM", end: "3:00 PM", crew: 2 },
  cr14: { projectId: "p2425", start: "7:00 AM", end: "3:30 PM", crew: 2 },
  lot7: { projectId: "p2431", start: "7:30 AM", end: "4:00 PM", crew: 2 },
  oak: { projectId: "p2419", start: "8:00 AM", end: "4:30 PM", crew: 1 },
  elm: { projectId: "p2430", start: "12:30 PM", end: "5:00 PM", crew: 1 },
  kessler: { projectId: "p2433", start: "7:30 AM", end: "4:00 PM", crew: 2 },
  millbrook: { projectId: "p2428", start: "7:00 AM", end: "3:30 PM", crew: 3 },
} satisfies Record<string, Slot>;

/** Day-of-grid (0 = Mon Sep 28) → slots. Days not listed show "No schedules". */
const PLAN: Record<number, Slot[]> = {
  // Sep 28 – Oct 4
  0: [T.river, T.hwy9],
  1: [T.hwy9, T.lot7],
  2: [T.maple, T.cr14],
  3: [T.river, T.hwy9],
  4: [T.maple, T.lot7],
  5: [T.oak],
  // Oct 5 – 11
  7: [T.hwy9, T.elm],
  8: [T.river, T.maple],
  9: [T.hwy9, T.lot7],
  10: [T.hwy9Set, T.cr14],
  11: [T.hwy9, T.maple],
  // Oct 12 – 18
  14: [T.river, T.hwy9],
  15: [T.lot7, T.oak],
  16: [T.hwy9, T.elm],
  17: [T.maple, T.cr14],
  18: [T.hwy9, T.lot7],
  // Oct 19 – 25
  21: [T.river, T.kessler],
  22: [T.hwy9, T.maple],
  23: [T.river, T.kessler],
  24: [T.hwy9, T.cr14],
  25: [T.river, T.maple],
  // Oct 26 – Nov 1
  28: [T.millbrook, T.hwy9],
  29: [T.kessler, T.maple],
  30: [T.millbrook, T.hwy9],
  31: [T.kessler, T.cr14],
  32: [T.millbrook, T.hwy9],
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n));
}

/** Small solid person glyph used on the blocks ("👤 4"). */
function PersonSolid() {
  return (
    <svg className="scsched-person" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="3.1" r="2.55" fill="currentColor" />
      <path d="M1.2 11.2c0-2.6 2.15-4.35 4.8-4.35s4.8 1.75 4.8 4.35z" fill="currentColor" />
    </svg>
  );
}

/** Calendar with an ✕ (the "No schedules" chip icon). */
function CalendarX() {
  return (
    <svg className="sc-icon scsched-calx" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.6" y="4.8" width="16.8" height="15.8" rx="2.4" />
      <path d="M3.6 9.4h16.8M8 2.9v3.4M16 2.9v3.4M10 12.6l4 4M14 12.6l-4 4" />
    </svg>
  );
}

const minutes = (t: string) => {
  const [hm, ap] = t.split(" ");
  const [h, m] = hm.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
};

export default function Scheduling() {
  const days = Array.from({ length: scheduleMonth.weeks * 7 }, (_, i) => {
    const dt = addDays(scheduleMonth.gridStart, i);
    const iso = dt.toISOString().slice(0, 10);
    const slots = [...(PLAN[i] ?? [])].sort((a, b) => minutes(a.start) - minutes(b.start));
    return { i, iso, day: dt.getUTCDate(), inMonth: dt.getUTCMonth() + 1 === scheduleMonth.month, today: iso === TODAY.iso, slots };
  });

  return (
    <WebShell
      active="Scheduling"
      title="Scheduling"
      contentClassName="scsched-page"
      actions={
        <>
          <Segmented items={["Calendar", "Timeline"]} value="Calendar" className="scsched-seg" />
          <Segmented items={["Month", "Week", "Day"]} value="Month" className="scsched-seg" />
          <div className="scsched-nav">
            <span className="scsched-nav-btn">
              <Icon name="chevronLeft" size={17} stroke={2} />
            </span>
            <span className="scsched-nav-label">{scheduleMonth.label}</span>
            <span className="scsched-nav-btn">
              <Icon name="chevronRight" size={17} stroke={2} />
            </span>
          </div>
          <Button variant="primary" icon="plus" className="scsched-add">
            Add Schedule
          </Button>
        </>
      }
    >
      <div className="scsched-cal">
        <div className="scsched-dow">
          {DOW.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="scsched-grid">
          {days.map((d) => (
            <div key={d.iso} className={`scsched-cell${d.today ? " is-today" : ""}${d.inMonth ? "" : " is-out"}`}>
              <span className="scsched-date">{d.day}</span>
              {d.slots.length === 0 ? (
                <div className="scsched-empty">
                  <div className="scsched-l1">
                    <span className="sc-trunc">No schedules</span>
                    <CalendarX />
                  </div>
                  <div className="scsched-l2 sc-trunc">Click to add a schedule</div>
                </div>
              ) : (
                d.slots.map((s, k) => (
                  <div key={k} className="scsched-block">
                    <div className="scsched-l1">
                      <span className="sc-trunc">
                        {s.start} - {s.end}
                      </span>
                      <span className="scsched-crew">
                        <PersonSolid />
                        {s.crew}
                      </span>
                    </div>
                    <div className="scsched-l2 sc-trunc">{projectById(s.projectId).name}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </WebShell>
  );
}
