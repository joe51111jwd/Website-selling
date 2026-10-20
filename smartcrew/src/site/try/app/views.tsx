// The crew app's screens for Try it, as live DOM: Home (Ready to clock in? / Currently working on,
// with Today · Entries · Week), Jobsites, Docs (the report forms), Summary, Profile, and what they
// open (a jobsite, a report, a day, an entry, the camera, the day-off request, the crew). Every
// control does something; demo data is Cedar Ridge Earthworks (src/screens/data.ts).

import type { ButtonHTMLAttributes, Dispatch, ReactNode } from "react";
import { Icon, timer, hm, type IconName } from "../../../screens/kit";
import { crew, crewById, dotForm, haulingForm, me, phoneWeek, projects, reportsMenu, TODAY, weekSummary, type SummaryDay } from "../../../screens/data";
import { Stopwatch } from "../../../screens/phone/ClockParts";
import { TRY_IT } from "../../../content/copy";
import {
  equipmentName,
  FIELD_LABEL,
  fieldValue,
  longDay,
  NEXT_WEEK,
  OPTIONS,
  projectCode,
  projectName,
  shortDate,
  summaryDay,
  TABS,
  taskSecs,
  type Action,
  type Entry,
  type Field,
  type Route,
  type State,
  type Tab,
  type Task,
} from "./model";

export type Ctx = {
  s: State;
  d: Dispatch<Action>;
  on: boolean;
  secs: number;
  /** clock in (optionally on another task: a jobsite's "Clock in here") */
  clockIn: (task?: Task) => void;
  clockOut: () => void;
  toast: (text: string) => void;
};

/** Every control on the phone: a real button, with the plain cursor (no ring round it). */
export function B({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" data-cursor="hide" className={className} {...rest}>
      {children}
    </button>
  );
}

function Head({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="ca-rhead">
      <B className="ca-back" onClick={onBack} aria-label="Back">
        <Icon name="chevronLeft" size={22} stroke={2} />
        <span>Back</span>
      </B>
      <span className="ca-rhead-title">{title}</span>
      <span className="ca-rhead-right">{right}</span>
    </div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="ca-title">
      <h3>{children}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="ca-kv">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────

export function DayHeader({ c }: { c: Ctx }) {
  return (
    <div className="pc-head">
      <span className="pc-head-day">{TODAY.weekday}</span>
      {/* no blue dot after the day (Andrew's comment-mode note, Oct 20: "Cut blue dot") */}
      <B className="pc-head-cam ca-press" onClick={() => c.d({ t: "push", route: { k: "camera" } })} aria-label="Take a jobsite photo">
        <Icon name="camera" size={24} stroke={1.6} />
      </B>
      <span className="pc-head-date">
        <span>{TODAY.monthDay}</span>
        <span className="pc-head-year">{TODAY.year}</span>
      </span>
    </div>
  );
}

export function WeekStrip({ c }: { c: Ctx }) {
  const { s, d, on, toast } = c;
  return (
    <div className="pc-week" role="group" aria-label="This week">
      {phoneWeek.map((w) => {
        const sel = w.date === s.day;
        const mark = w.today ? (on || s.entries.length ? "check" : null) : w.mark;
        const cls = sel ? " is-today" : w.mark === "lock" ? " is-locked" : "";
        return (
          <B
            key={w.date}
            className={`pc-tile ca-press${cls}`}
            aria-pressed={sel}
            aria-label={`${longDay(w.label)} ${shortDate(w.date)}`}
            onClick={() => {
              if (w.mark === "lock") toast(`${longDay(w.label)} isn't open yet`);
              else d({ t: "day", iso: w.date });
            }}
          >
            <span className="pc-tile-num">{w.day}</span>
            <span className="pc-tile-dow">{w.label}</span>
            <span className="pc-tile-mark">
              {mark === "check" && <Icon name="check" size={15} stroke={2.3} className="pc-mark pc-mark--check" />}
              {mark === "lock" && <Icon name="lock" size={14} stroke={1.9} className="pc-mark pc-mark--lock" />}
            </span>
          </B>
        );
      })}
    </div>
  );
}

export function Ready({
  c,
  ghost,
  breathe,
}: {
  c: Ctx;
  ghost: boolean;
  breathe?: boolean;
}) {
  const { s, d } = c;
  return (
    <div className="pc-ready tp-ready">
      <div className="pc-ready-q">Ready to clock in?</div>
      <B
        className={`pc-clockin tp-clockin${ghost ? " is-ghost" : ""}${breathe ? " is-breathe" : ""}`}
        onClick={() => c.clockIn()}
        aria-label={TRY_IT.clockIn}
      >
        <Stopwatch size={22} stroke={1.7} />
        <span className="pc-clockin-label">Clock In</span>
        <span className="tp-ghost" aria-hidden="true" />
      </B>
      <B className="pc-dayoff ca-press" onClick={() => d({ t: "push", route: { k: "dayoff" } })}>
        <Icon name={s.dayOff ? "calendarCheck" : "calendarOff"} size={21} stroke={1.55} />
        <span>{s.dayOff ? `Day off asked · ${NEXT_WEEK.find((n) => n.iso === s.dayOff)?.label}` : "Request day off"}</span>
      </B>
      {s.lastShift !== null && <p className="ca-last">Last shift today · {timer(s.lastShift)}</p>}
    </div>
  );
}

export function Working({ c }: { c: Ctx }) {
  const { s, d, secs } = c;
  return (
    <div className="ca-working">
      <div className="pc-seg" role="tablist" aria-label="Today, entries or week">
        {(["Today", "Entries", "Week"] as const).map((k) => (
          <B key={k} role="tab" aria-selected={s.seg === k} className={s.seg === k ? "is-on" : ""} onClick={() => d({ t: "seg", seg: k })}>
            {k}
          </B>
        ))}
      </div>
      <div key={s.seg} className="ca-fade">
        {s.seg === "Today" ? <WorkCard c={c} /> : s.seg === "Entries" ? <Entries c={c} /> : <WeekList c={c} />}
      </div>
      <span className="sr-only">Total today {timer(secs)}</span>
    </div>
  );
}

function WorkCard({ c }: { c: Ctx }) {
  const { s, d, secs } = c;
  const onBreak = s.breakAt !== null;
  const t = s.task;
  const open = (f: Field) => {
    d({ t: "sheet", open: true });
    d({ t: "pick", field: f });
  };
  return (
    <div className="pc-work tp-work">
      <div className="pc-work-title">{onBreak ? "On break" : "Currently working on"}</div>
      <div className="pc-task">
        <div className={`pc-timer${onBreak ? " is-break" : ""}`}>{onBreak ? timer(secs - (s.breakAt ?? 0)) : timer(taskSecs(s, secs))}</div>
        <div className="pc-rows">
          {(["projectId", "activity", "equipmentId"] as Field[]).map((f) => (
            <B key={f} className="pc-row ca-row-btn" onClick={() => open(f)} aria-label={`Change ${FIELD_LABEL[f]}: ${fieldValue(t, f)}`}>
              <span className="pc-row-k">{FIELD_LABEL[f]}</span>
              <span className="pc-row-v">{fieldValue(t, f)}</span>
            </B>
          ))}
        </div>
        <div className="pc-btns">
          <B className={`pc-btn tp-break ca-press${onBreak ? " is-break" : ""}`} onClick={() => {
            d({ t: "break", secs });
            c.toast(onBreak ? "Back to work · break logged" : "Break started · the task timer pauses");
          }}>
            <Icon name={onBreak ? "play" : "coffee"} size={19} stroke={1.6} />
            {onBreak ? "End break" : "Break"}
          </B>
          <B className="pc-btn pc-btn--dark ca-press" onClick={() => d({ t: "sheet", open: true })}>
            <Icon name="save" size={18} stroke={1.6} />
            Log &amp; Switch
          </B>
        </div>
      </div>
      <div className="pc-work-rule" />
      <div className="pc-total">
        <span>
          <span className="pc-total-k">Total hours</span>
          <span className="pc-total-v">{timer(secs)}</span>
        </span>
        <B className="pc-btn pc-btn--pink tp-clockout ca-press" onClick={c.clockOut}>
          <Stopwatch size={21} stroke={1.8} />
          Clock Out
        </B>
      </div>
    </div>
  );
}

/** Seconds worked today (logged entries + the running task; breaks don't count). */
const todaySecs = (c: Ctx) => todayRows(c.s, c.secs, c.on).reduce((a, e) => a + e.secs, 0);

/** Today's entries: the finished ones and the one running. */
function todayRows(s: State, secs: number, on: boolean) {
  const rows: (Entry & { running?: boolean })[] = [...s.entries];
  if (on) rows.push({ ...s.task, from: s.taskFrom, to: "now", secs: taskSecs(s, secs), running: true });
  return rows;
}

function Entries({ c }: { c: Ctx }) {
  const rows = todayRows(c.s, c.secs, c.on);
  return (
    <div className="ca-list ca-card">
      {rows.map((e, i) => (
        <B key={i} className="ca-li" onClick={() => c.d({ t: "push", route: { k: "entry", i } })}>
          <span className={`ca-dot${e.running ? " is-live" : ""}`} />
          <span className="ca-li-main">
            <b>{e.activity}</b>
            <span>
              {projectName(e.projectId)} · {e.from} – {e.to}
            </span>
          </span>
          <span className="ca-li-v">{timer(e.secs).slice(0, 7)}</span>
          <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
        </B>
      ))}
    </div>
  );
}

function WeekList({ c }: { c: Ctx }) {
  const todayMin = Math.floor(todaySecs(c) / 60);
  const days = [...weekSummary.days.map((d) => ({ date: d.date, dow: d.dow, min: d.minutes })), { date: TODAY.iso, dow: "FRI", min: todayMin }];
  const total = days.reduce((a, d) => a + d.min, 0);
  return (
    <div className="ca-list ca-card">
      {days.map((d) => (
        <B key={d.date} className="ca-li" onClick={() => c.d({ t: "push", route: { k: "day", date: d.date } })}>
          <span className="ca-li-dow">{d.dow}</span>
          <span className="ca-bar">
            <i style={{ transform: `scaleX(${Math.min(1, d.min / 600).toFixed(3)})` }} />
          </span>
          <span className="ca-li-v">{hm(d.min)}</span>
          <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
        </B>
      ))}
      <div className="ca-li ca-li--total">
        <span className="ca-li-main">
          <b>This week</b>
        </span>
        <span className="ca-li-v">{hm(total)}</span>
      </div>
    </div>
  );
}

/** A finished day: jobsite, in → out, and the tasks logged. */
function DayCard({ day }: { day: SummaryDay }) {
  return (
    <div className="ca-card ca-day">
      <div className="ca-day-head">
        <span>
          <b>
            {longDay(day.dow)} · {day.label}
          </b>
          <span>{day.location}</span>
        </span>
        <span className="ca-day-total">{hm(day.minutes)}</span>
      </div>
      <div className="ca-day-span">
        Clocked in {day.in} <Icon name="chevronRight" size={14} stroke={1.9} /> out {day.out}
      </div>
      {day.tasks.map((t) => (
        <div key={t.start} className="ca-task">
          <span className="ca-check">
            <Icon name="check" size={11} stroke={2.6} />
          </span>
          <span className="ca-li-main">
            <b>{t.activity}</b>
            <span>
              {t.start} – {t.end} · {t.equipment ?? "No equipment"}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TodayCard({ c }: { c: Ctx }) {
  const rows = todayRows(c.s, c.secs, c.on);
  return (
    <div className="ca-card ca-day">
      <div className="ca-day-head">
        <span>
          <b>Friday · Oct 9</b>
          <span>{c.on ? projectName(c.s.task.projectId) : "Today"}</span>
        </span>
        <span className="ca-day-total">{c.on ? timer(c.secs).slice(0, 7) : rows.length ? "Done" : "—"}</span>
      </div>
      {rows.length === 0 && <p className="ca-empty">Nothing logged yet today. Clock in on Home.</p>}
      {rows.map((e, i) => (
        <div key={i} className="ca-task">
          <span className={`ca-check${e.running ? " is-live" : ""}`}>
            <Icon name={e.running ? "play" : "check"} size={11} stroke={2.6} />
          </span>
          <span className="ca-li-main">
            <b>{e.activity}</b>
            <span>
              {e.from} – {e.to} · {equipmentName(e.equipmentId)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Home when a past day is picked on the week strip. */
export function PastDay({ c }: { c: Ctx }) {
  const day = summaryDay(c.s.day);
  return (
    <div className="ca-past ca-fade">
      {day && <DayCard day={day} />}
      <B className="ca-ghostbtn ca-press" onClick={() => c.d({ t: "day", iso: TODAY.iso })}>
        Back to today
      </B>
    </div>
  );
}

// ── Jobsites ─────────────────────────────────────────────────────────────

const inProgress = projects.filter((p) => p.status === "In Progress");
const town = (address: string) => address.split(",").slice(-2, -1)[0]?.trim() ?? "";

export function Jobsites({ c }: { c: Ctx }) {
  return (
    <>
      <Title sub={`${inProgress.length} active jobs`}>Jobsites</Title>
      <div className="ca-list">
        {inProgress.map((p) => {
          const here = c.on && c.s.task.projectId === p.id;
          return (
            <B key={p.id} className="ca-li" onClick={() => c.d({ t: "push", route: { k: "job", id: p.id } })}>
              <span className="ca-ic">
                <Icon name="mapPin" size={20} stroke={1.7} />
              </span>
              <span className="ca-li-main">
                <b>{p.name}</b>
                <span>
                  JOB-{p.number.slice(1)} · {town(p.address)}
                </span>
              </span>
              {here && <span className="ca-pill">Here</span>}
              <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
            </B>
          );
        })}
      </div>
    </>
  );
}

function Job({ c, id }: { c: Ctx; id: string }) {
  const p = projects.find((x) => x.id === id)!;
  const here = c.on && c.s.task.projectId === id;
  const foreman = p.foremanId ? crewById(p.foremanId).name : "—";
  return (
    <>
      <Head title={`JOB-${p.number.slice(1)}`} onBack={() => c.d({ t: "pop" })} />
      <Title sub={p.address}>{p.name}</Title>
      <div className="ca-card ca-kvs">
        <Row k="Client" v={p.client} />
        <Row k="Foreman" v={foreman} />
        <Row k="Crew" v={`${p.crewIds.length} people`} />
        <Row k="Working days" v={`${p.workingDays.done} of ${p.workingDays.total}`} />
        <div className="ca-progress">
          <span>
            Progress <b>{p.progress}%</b>
          </span>
          <span className="ca-bar">
            <i style={{ transform: `scaleX(${p.progress / 100})` }} />
          </span>
        </div>
      </div>
      {here ? (
        <div className="ca-note">
          <Icon name="checkCircle" size={18} stroke={1.8} /> You're clocked in here
        </div>
      ) : (
        <B
          className="ca-cta ca-press"
          onClick={() => {
            const task = { ...c.s.task, projectId: id };
            if (c.on) {
              c.d({ t: "switch", secs: c.secs, time: nowTime(), task });
              c.toast(`Switched to ${p.name}`);
            } else c.clockIn(task);
            c.d({ t: "tab", tab: "Home" });
          }}
        >
          <Stopwatch size={19} stroke={1.8} />
          {c.on ? "Switch to this job" : "Clock in here"}
        </B>
      )}
      <B className="ca-ghostbtn ca-press" onClick={() => c.toast(`Directions to ${town(p.address)} sent to Maps`)}>
        <Icon name="location" size={18} stroke={1.7} /> Directions
      </B>
    </>
  );
}

// ── Docs ─────────────────────────────────────────────────────────────────

const RICON: Record<string, IconName> = {
  "Incident Report": "alert",
  "Service Request": "fileText",
  "Add Service Records": "wrench",
  "Hauling Log Report": "truck",
  "Receipts Report": "receipt",
  "Service Queue": "clock",
  "Field Usage Report": "box",
  "DOT Inspection Report": "clipboard",
  Scheduling: "calendar",
  "Day Off Request": "calendarOff",
};

export function Docs({ c }: { c: Ctx }) {
  return (
    <>
      <Title>Reports</Title>
      <div className="ca-list">
        {reportsMenu.map(({ label }) => (
          <B
            key={label}
            className="ca-li"
            onClick={() => c.d({ t: "push", route: label === "Day Off Request" ? { k: "dayoff" } : { k: "report", label } })}
          >
            <span className="ca-ic">
              <Icon name={RICON[label] ?? "fileText"} size={20} stroke={1.6} />
            </span>
            <span className="ca-li-main">
              <b>{label}</b>
            </span>
            {c.s.sent.includes(label) && <span className="ca-pill">Sent</span>}
            <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
          </B>
        ))}
      </div>
    </>
  );
}

function formFor(label: string, t: Task): { rows: [string, string][]; submit: string; done: string } {
  const job = projectName(t.projectId);
  const eq = equipmentName(t.equipmentId);
  switch (label) {
    case "Incident Report":
      return { rows: [["Date", TODAY.label], ["Project", job], ["Type", "Near miss"], ["What happened", "Trench box shifted after rain; area coned off, nobody hurt."]], submit: "Submit report", done: "Incident report sent to the office" };
    case "Service Request":
      return { rows: [["Equipment", eq], ["Urgency", "Medium"], ["Issue", "Cab door latch sticking"]], submit: "Send request", done: "Service request sent to the shop" };
    case "Add Service Records":
      return { rows: [["Equipment", eq], ["Service", "Greased all fittings, checked fluids"], ["Hour meter", "5,120"]], submit: "Save record", done: "Service record saved" };
    case "Hauling Log Report":
      return { rows: [["Date", haulingForm.date], ["Truck", haulingForm.equipment], ["Project", `#${haulingForm.projectNumber} · ${haulingForm.projectCategory}`], ["Type", haulingForm.type], ["From", haulingForm.location], ["Notes", haulingForm.notes]], submit: "Submit log", done: "Hauling log sent" };
    case "Receipts Report":
      return { rows: [["Vendor", "Cedar Ridge Hardware"], ["Category", "Small tools"], ["Amount", "$84.37"], ["Project", job], ["Photo", "Receipt attached"]], submit: "Submit receipt", done: "Receipt sent to the office" };
    case "Service Queue":
      return { rows: [["CAT D6 Dozer", "Doing · High"], ["Bomag BW213 Roller", "To do · High"], ["Mack Granite #1102", "To do · Medium"], ["CAT 320 Excavator", "To do · Low"]], submit: "Got it", done: "Service queue checked" };
    case "Field Usage Report":
      return { rows: [["Project", job], ["Material", "Select fill"], ["Quantity", "6 loads · 99 t"], ["Used for", "Trench backfill"]], submit: "Submit usage", done: "Field usage sent" };
    case "DOT Inspection Report":
      return { rows: [["Truck", dotForm.truck], ["Mileage", dotForm.mileage], ["Trailer", dotForm.trailer], ["Defects", dotForm.defectNote]], submit: "Sign & submit", done: "DOT inspection filed" };
    case "Scheduling":
      return {
        rows: NEXT_WEEK.map((n, i) => [`${n.dow} ${n.label}`, `${i < 3 ? "Hwy 9 Culvert" : "Riverside Storm Sewer"} · 6:30 AM`]),
        submit: "Got it",
        done: "Schedule confirmed",
      };
    default:
      return { rows: [["Date", TODAY.label]], submit: "Submit", done: `${label} sent` };
  }
}

function Report({ c, label }: { c: Ctx; label: string }) {
  const f = formFor(label, c.s.task);
  return (
    <>
      <Head title="Reports" onBack={() => c.d({ t: "pop" })} />
      <Title sub={`${me.name} · ${TODAY.label}`}>{label}</Title>
      <div className="ca-card ca-kvs">
        {f.rows.map(([k, v]) => (
          <Row key={k} k={k} v={v} />
        ))}
      </div>
      <B
        className="ca-cta ca-press"
        onClick={() => {
          c.d({ t: "sent", label });
          c.d({ t: "pop" });
          c.toast(f.done);
        }}
      >
        {f.submit}
      </B>
    </>
  );
}

function DayOff({ c }: { c: Ctx }) {
  const pick = c.s.dayOff ?? NEXT_WEEK[0].iso;
  return (
    <>
      <Head title="Home" onBack={() => c.d({ t: "pop" })} />
      <Title sub="Your foreman gets it right away">Request day off</Title>
      <div className="ca-chips" role="group" aria-label="Pick a day">
        {NEXT_WEEK.map((n) => (
          <B key={n.iso} className={`ca-chip${pick === n.iso ? " is-on" : ""}`} aria-pressed={pick === n.iso} onClick={() => c.d({ t: "dayOff", iso: n.iso })}>
            <b>{n.dow}</b>
            <span>{n.label}</span>
          </B>
        ))}
      </div>
      <div className="ca-card ca-kvs">
        <Row k="Type" v="Personal" />
        <Row k="Crew" v={me.crew} />
        <Row k="Goes to" v={crewById("c15").name} />
      </div>
      <B
        className="ca-cta ca-press"
        onClick={() => {
          c.d({ t: "dayOff", iso: pick });
          c.d({ t: "sent", label: "Day Off Request" });
          c.d({ t: "pop" });
          c.toast(`Day off asked for ${NEXT_WEEK.find((n) => n.iso === pick)?.dow} ${NEXT_WEEK.find((n) => n.iso === pick)?.label}`);
        }}
      >
        Send request
      </B>
    </>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────

export function Summary({ c }: { c: Ctx }) {
  const { total, overtime, averageDaily, days } = weekSummary;
  const today = Math.floor(todaySecs(c) / 60);
  return (
    <>
      <Title>Weekly summary</Title>
      <div className="ca-card ca-week">
        <div className="ca-week-head">
          <Icon name="calendar" size={20} stroke={1.6} /> This week · {TODAY.weekLabel}
        </div>
        <div className="ca-stats">
          <span>
            <small>Total hours</small>
            <b>{hm(total + today)}</b>
          </span>
          <span>
            <small>Overtime</small>
            <b>{hm(overtime)}</b>
          </span>
          <span>
            <small>Avg daily</small>
            <b>{hm(averageDaily)}</b>
          </span>
        </div>
        <B
          className={`ca-cta ca-press${c.s.timecard ? " is-done" : ""}`}
          onClick={() => {
            c.d({ t: "timecard" });
            c.toast(c.s.timecard ? "Timecard pulled back to edit" : "Timecard sent for approval");
          }}
        >
          <Icon name={c.s.timecard ? "checkCircleFill" : "checkCircle"} size={19} stroke={1.8} />
          {c.s.timecard ? "Timecard submitted" : "Submit timecard"}
        </B>
      </div>
      <div className="ca-list">
        {days.map((d) => (
          <B key={d.date} className="ca-li" onClick={() => c.d({ t: "push", route: { k: "day", date: d.date } })}>
            <span className="ca-li-dow">{d.dow}</span>
            <span className="ca-li-main">
              <b>{hm(d.minutes)}</b>
              <span>{d.location}</span>
            </span>
            <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
          </B>
        ))}
        <B className="ca-li" onClick={() => c.d({ t: "push", route: { k: "day", date: TODAY.iso } })}>
          <span className="ca-li-dow">FRI</span>
          <span className="ca-li-main">
            <b>{c.on ? timer(c.secs).slice(0, 7) : c.s.entries.length ? "Logged" : "Not yet"}</b>
            <span>{c.on ? "On the clock now" : "Today"}</span>
          </span>
          <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
        </B>
      </div>
    </>
  );
}

function Day({ c, date }: { c: Ctx; date: string }) {
  const day = summaryDay(date);
  return (
    <>
      <Head title={c.s.tab === "Summary" ? "Summary" : "Home"} onBack={() => c.d({ t: "pop" })} />
      <Title>{date === TODAY.iso ? "Today" : `${longDay(day?.dow ?? "")}, ${shortDate(date)}`}</Title>
      {day ? <DayCard day={day} /> : <TodayCard c={c} />}
    </>
  );
}

function EntryView({ c, i }: { c: Ctx; i: number }) {
  const rows = todayRows(c.s, c.secs, c.on);
  const e = rows[i] ?? rows[rows.length - 1];
  return (
    <>
      <Head title="Entries" onBack={() => c.d({ t: "pop" })} />
      {e ? (
        <>
          <Title sub={e.running ? "Running now" : "Logged"}>{e.activity}</Title>
          <div className="ca-card ca-kvs">
            <Row k="Project" v={projectName(e.projectId)} />
            <Row k="Job" v={projectCode(e.projectId)} />
            <Row k="Equipment" v={equipmentName(e.equipmentId)} />
            <Row k="Started" v={e.from} />
            <Row k="Ended" v={e.to} />
            <Row k="Time" v={timer(e.secs)} />
            <Row k="Location" v="Inside the jobsite" />
          </div>
          {e.running ? (
            <B
              className="ca-cta ca-press"
              onClick={() => {
                c.d({ t: "pop" });
                c.d({ t: "sheet", open: true });
              }}
            >
              <Icon name="save" size={18} stroke={1.6} /> Log &amp; Switch
            </B>
          ) : (
            <B className="ca-ghostbtn ca-press" onClick={() => c.toast("Edit sent to your foreman to approve")}>
              <Icon name="edit" size={18} stroke={1.6} /> Ask to edit
            </B>
          )}
        </>
      ) : (
        <p className="ca-empty">Nothing logged yet.</p>
      )}
    </>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────

function Switch({ on }: { on: boolean }) {
  return <span className={`ca-switch${on ? " is-on" : ""}`} aria-hidden="true" />;
}

export function Profile({ c }: { c: Ctx }) {
  const { s, d, toast } = c;
  return (
    <>
      <div className="ca-me">
        <span className="ca-avatar">{me.initials}</span>
        <span>
          <b>{me.name}</b>
          <span>
            {me.role} · {me.crew}
          </span>
        </span>
      </div>
      <div className="ca-list">
        <B className="ca-li" onClick={() => d({ t: "push", route: { k: "crew" } })}>
          <span className="ca-ic">
            <Icon name="users" size={20} stroke={1.6} />
          </span>
          <span className="ca-li-main">
            <b>My crew</b>
          </span>
          <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
        </B>
        <B
          className="ca-li"
          role="switch"
          aria-checked={s.notify}
          onClick={() => {
            d({ t: "notify" });
            toast(s.notify ? "Reminders off" : "Reminders on: clock-in and break nudges");
          }}
        >
          <span className="ca-ic">
            <Icon name="bell" size={20} stroke={1.6} />
          </span>
          <span className="ca-li-main">
            <b>Reminders</b>
          </span>
          <Switch on={s.notify} />
        </B>
        <B
          className="ca-li"
          role="switch"
          aria-checked={s.spanish}
          onClick={() => {
            d({ t: "spanish" });
            toast(s.spanish ? "Language: English" : "Idioma: Español");
          }}
        >
          <span className="ca-ic">
            <Icon name="flag" size={20} stroke={1.6} />
          </span>
          <span className="ca-li-main">
            <b>Español</b>
          </span>
          <Switch on={s.spanish} />
        </B>
        <B className="ca-li" onClick={() => toast(`Office: ${crewById("c16").name} · ${crewById("c16").phone}`)}>
          <span className="ca-ic">
            <Icon name="phone" size={20} stroke={1.6} />
          </span>
          <span className="ca-li-main">
            <b>Call the office</b>
          </span>
          <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />
        </B>
        <B className="ca-li" onClick={() => toast("This demo phone stays signed in")}>
          <span className="ca-ic">
            <Icon name="logout" size={20} stroke={1.6} />
          </span>
          <span className="ca-li-main">
            <b>Sign out</b>
          </span>
        </B>
      </div>
    </>
  );
}

function Crew({ c }: { c: Ctx }) {
  const mine = crew.filter((m) => m.crew === me.crew);
  return (
    <>
      <Head title="Profile" onBack={() => c.d({ t: "pop" })} />
      <Title sub={`${mine.length} people`}>{me.crew}</Title>
      <div className="ca-list">
        {mine.map((m) => (
          <B key={m.id} className="ca-li" onClick={() => c.toast(`${m.name} · ${m.phone}`)}>
            <span className="ca-avatar ca-avatar--sm">{m.initials}</span>
            <span className="ca-li-main">
              <b>{m.name}</b>
              <span>{m.role}</span>
            </span>
            <Icon name="phone" size={17} stroke={1.7} className="ca-chev" />
          </B>
        ))}
      </div>
    </>
  );
}

// ── overlays ─────────────────────────────────────────────────────────────

export function Camera({ c }: { c: Ctx }) {
  return (
    <div className="ca-cam ca-fade">
      <div className="ca-cam-top">
        <B className="ca-cam-x" aria-label="Close camera" onClick={() => c.d({ t: "pop" })}>
          <Icon name="x" size={22} stroke={2} />
        </B>
        <span>Jobsite photo · {projectName(c.s.task.projectId)}</span>
      </div>
      <div className="ca-cam-view" aria-hidden="true">
        <span className="ca-cam-grid" />
      </div>
      <div className="ca-cam-bar">
        <span className="ca-cam-count">{c.s.photos ? `${c.s.photos} today` : ""}</span>
        <B
          className="ca-shutter"
          aria-label="Take photo"
          onClick={() => {
            c.d({ t: "photo" });
            c.d({ t: "pop" });
            c.toast(`Photo saved to ${projectName(c.s.task.projectId)}`);
          }}
        />
        <span className="ca-cam-count" />
      </div>
    </div>
  );
}

export function Sheet({ c }: { c: Ctx }) {
  const { s, d } = c;
  const sh = s.sheet!;
  const close = () => d({ t: "sheet", open: false });
  return (
    <>
      <div className={`pc-scrim ca-scrim${sh.closing ? " is-out" : ""}`} onClick={close} aria-hidden="true" />
      <div className={`pc-sheet ca-sheet${sh.closing ? " is-out" : ""}`} role="dialog" aria-label="Select task and project">
        {sh.pick === null ? (
          <>
            <div className="pc-sheet-head">
              <span className="pc-sheet-title">Select task and project</span>
              <B className="ca-x" aria-label="Close" onClick={close}>
                <Icon name="x" size={22} stroke={1.6} />
              </B>
            </div>
            {(["projectId", "activity", "equipmentId"] as Field[]).map((f) => (
              <div key={f}>
                <span className="pc-sel-label">{FIELD_LABEL[f]}</span>
                <B className="pc-sel ca-sel" onClick={() => d({ t: "pick", field: f })}>
                  <span>{fieldValue(sh.draft, f)}</span>
                  <Icon name="chevronDown" size={18} stroke={2} />
                </B>
              </div>
            ))}
            <div className="pc-sheet-btns">
              <B className="pc-sheet-cancel" onClick={close}>
                Cancel
              </B>
              <B
                className="pc-sheet-start"
                onClick={() => {
                  const same = JSON.stringify(sh.draft) === JSON.stringify(s.task);
                  if (same) {
                    close();
                    c.toast("Same task: still running");
                    return;
                  }
                  d({ t: "switch", secs: c.secs, time: nowTime() });
                  c.toast(`Logged. Now on ${sh.draft.activity}`);
                }}
              >
                Start
              </B>
            </div>
          </>
        ) : (
          <>
            <div className="pc-sheet-head">
              <B className="ca-back" onClick={() => d({ t: "pick", field: null })} aria-label="Back">
                <Icon name="chevronLeft" size={22} stroke={2} />
                <span className="pc-sheet-title">{FIELD_LABEL[sh.pick]}</span>
              </B>
              <B className="ca-x" aria-label="Close" onClick={close}>
                <Icon name="x" size={22} stroke={1.6} />
              </B>
            </div>
            <div className="ca-opts">
              {OPTIONS[sh.pick].map((o) => {
                const on = sh.draft[sh.pick!] === o.value;
                return (
                  <B key={o.value} className={`ca-opt${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => d({ t: "choose", field: sh.pick!, value: o.value })}>
                    <span>
                      {o.label}
                      {o.sub && <small>{o.sub}</small>}
                    </span>
                    {on && <Icon name="check" size={18} stroke={2.2} />}
                  </B>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function TabBar({ c }: { c: Ctx }) {
  const icon = (k: Tab, on: boolean): IconName =>
    k === "Home" ? (on ? "homeFill" : "homeDoor") : k === "Jobsites" ? "mapPin" : k === "Docs" ? "docs" : k === "Summary" ? (on ? "calendarCheckFill" : "calendarCheck") : "user";
  return (
    <nav className="sc-tabbar ca-tabbar" aria-label="App tabs">
      {TABS.map((k) => {
        const on = c.s.tab === k;
        return (
          <B key={k} className={`sc-tab${on ? " is-active" : ""}`} aria-current={on ? "page" : undefined} onClick={() => c.d({ t: "tab", tab: k })}>
            {k === "Profile" ? (
              <span className="sc-tab-avatar">
                <svg viewBox="0 0 25 25" width="25" height="25" aria-hidden="true">
                  <circle cx="12.5" cy="10" r="4.6" fill="#7d7066" />
                  <path d="M3.6 25c.9-5.1 4.4-8 8.9-8s8 2.9 8.9 8z" fill="#5e534b" />
                </svg>
              </span>
            ) : (
              <Icon name={icon(k, on)} size={25} stroke={1.6} />
            )}
            <span>{k}</span>
          </B>
        );
      })}
      <span className="sc-homebar" />
    </nav>
  );
}

/** A pushed screen on top of the current tab. */
export function RouteView({ c, r }: { c: Ctx; r: Route }) {
  switch (r.k) {
    case "job":
      return <Job c={c} id={r.id} />;
    case "report":
      return <Report c={c} label={r.label} />;
    case "day":
      return <Day c={c} date={r.date} />;
    case "entry":
      return <EntryView c={c} i={r.i} />;
    case "dayoff":
      return <DayOff c={c} />;
    case "crew":
      return <Crew c={c} />;
    case "camera":
      return null; // drawn over everything (Camera)
  }
}

export function nowTime() {
  const d = new Date();
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
