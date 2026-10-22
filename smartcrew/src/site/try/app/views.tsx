// The crew app's screens for Try it, as live DOM: Home (Ready to clock in? / Currently working on,
// with Today · Entries · Week), Jobsites, Docs (the report forms), Summary, Profile, and what they
// open (a jobsite, a report, a day, an entry, the camera, the day-off request, the crew). Every
// control does something; demo data is Cedar Ridge Earthworks (src/screens/data.ts).
//
// Classic is the limited app (LIMITED; Andrew's comment-mode note, Oct 21: "I love being able to
// click on it. but want to limit how deep into the app people can go"), rebuilt on the updated app
// (Andrew, Oct 21: "lets redo this one based on mobile now"; "On the messaging tab, there's Messages
// and Announcements. We can make announcements viewable too"): its bar is Home, Projects, Reports,
// Messages, Support. Every tab works at its top level; each report row opens a short form that
// submits; one project opens (Hwy 9, with its field note history and docs) and one chat (Dirt Crew);
// posts open in place to read. Anything deeper shows but is off (B's `off`).

import type { ButtonHTMLAttributes, Dispatch, ReactNode } from "react";
import { Icon, timer, hm, type IconName } from "../../../screens/kit";
import { announcements, crew, crewById, crewMessages, dailyReports, dotForm, fieldNotes, haulingForm, jobFiles, me, phoneWeek, projects, reportsMenu, TODAY, weekSummary, type SummaryDay } from "../../../screens/data";
import { CLASSIC } from "../../../lib/look";
import { ChatGlyph } from "../../../screens/phone/Messages";
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
  TABS_LIMITED,
  TRY_JOB,
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

/** The limited app (classic): see the note at the top. */
export const LIMITED = CLASSIC;

/**
 * Every control on the phone: a real button, with the plain cursor (no ring round it). `off`: it
 * shows but doesn't take a tap or the focus (the limited app; TryApp swallows its clicks).
 */
export function B({ children, className, off, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { off?: boolean }) {
  return (
    <button
      type="button"
      data-cursor="hide"
      className={off ? `${className ?? ""} is-off` : className}
      {...rest}
      {...(off ? { "data-off": "", "aria-disabled": true, tabIndex: -1 } : null)}
    >
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

/** "Oct 9" / "2026", as the updated app's headers have it. */
function HeadDate() {
  return (
    <span className="ca-chats-date">
      <b>{TODAY.monthDay.replace(" 0", " ")}</b>
      <span>{TODAY.year}</span>
    </span>
  );
}

/** The updated app's round header buttons: the camera works; the bell, settings and + show only. */
function Rounds({ c, keys }: { c: Ctx; keys: ("plus" | "bell" | "camera" | "settings")[] }) {
  const label = { plus: "New project", bell: "Notifications", camera: "Take a jobsite photo", settings: "Settings" };
  return (
    <>
      {keys.map((k) => (
        <B key={k} className="ca-round ca-press" off={k !== "camera"} aria-label={label[k]} onClick={() => c.d({ t: "push", route: { k: "camera" } })}>
          <Icon name={k} size={19} stroke={1.7} />
        </B>
      ))}
    </>
  );
}

/** A tab's header in the updated app: big title, round buttons, the date (Reports stacks them). */
function TabHead({ c, title, keys = ["bell", "camera", "settings"], date = true, stack }: { c: Ctx; title: string; keys?: ("plus" | "bell" | "camera" | "settings")[]; date?: boolean; stack?: boolean }) {
  if (stack)
    return (
      <div className="ca-tabhead ca-tabhead--stack">
        <h3>{title}</h3>
        <div className="ca-tabhead-row">
          <Rounds c={c} keys={keys} />
          {date && <HeadDate />}
        </div>
      </div>
    );
  return (
    <div className="ca-chats-head ca-tabhead">
      <h3>{title}</h3>
      <Rounds c={c} keys={keys} />
      {date && <HeadDate />}
    </div>
  );
}

/** Two halves to pick between (Projects · Schedule, Posts · Chats). */
function Toggle<T extends string>({ items, value, onPick }: { items: { v: T; label: ReactNode; aria?: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="ca-chats-seg" role="tablist">
      {items.map((it) => (
        <B key={it.v} role="tab" aria-selected={value === it.v} aria-label={it.aria} className={value === it.v ? "is-on" : ""} onClick={() => onPick(it.v)}>
          {it.label}
        </B>
      ))}
    </div>
  );
}

export function DayHeader({ c }: { c: Ctx }) {
  if (LIMITED)
    return (
      <div className="pc-head ca-dayhead">
        <span className="pc-head-day">{TODAY.weekday}</span>
        <span className="ca-dayhead-btns">
          <Rounds c={c} keys={["camera", "bell", "settings"]} />
        </span>
        <HeadDate />
      </div>
    );
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
  tapMe,
}: {
  c: Ctx;
  ghost: boolean;
  breathe?: boolean;
  tapMe?: boolean;
}) {
  const { s, d } = c;
  return (
    <div className="pc-ready tp-ready">
      <div className="pc-ready-q">Ready to clock in?</div>
      <B
        className={`pc-clockin tp-clockin${ghost ? " is-ghost" : ""}${breathe ? " is-breathe" : ""}${tapMe ? " is-tapme" : ""}`}
        onClick={() => c.clockIn()}
        aria-label={TRY_IT.clockIn}
      >
        <Stopwatch size={22} stroke={1.7} />
        <span className="pc-clockin-label">{LIMITED ? "Clock in" : "Clock In"}</span>
        <span className="tp-ghost" aria-hidden="true" />
      </B>
      <B className="pc-dayoff ca-press" onClick={() => d({ t: "push", route: { k: "dayoff" } })}>
        <Icon name={s.dayOff ? "calendarCheck" : "calendarOff"} size={21} stroke={1.55} />
        <span>{s.dayOff ? `Day off asked · ${NEXT_WEEK.find((n) => n.iso === s.dayOff)?.label}` : LIMITED ? "Off Day" : "Request day off"}</span>
      </B>
      {s.lastShift !== null && <p className="ca-last">Last shift today · {timer(s.lastShift)}</p>}
    </div>
  );
}

/** The limited Home's toggle under the week strip (the updated app): Today · this week. */
export function HomeSeg({ c }: { c: Ctx }) {
  const today = c.s.day === TODAY.iso && c.s.seg !== "Week";
  return (
    <div className="pc-seg ca-homeseg" role="tablist" aria-label="Today or this week">
      <B role="tab" aria-selected={today} className={today ? "is-on" : ""} onClick={() => {
        c.d({ t: "day", iso: TODAY.iso });
        c.d({ t: "seg", seg: "Today" });
      }}>
        Today
      </B>
      <B role="tab" aria-selected={!today && c.s.seg === "Week"} className={!today && c.s.seg === "Week" ? "is-on" : ""} onClick={() => {
        c.d({ t: "day", iso: TODAY.iso });
        c.d({ t: "seg", seg: "Week" });
      }}>
        Oct 5th - 11th
      </B>
    </div>
  );
}

export function Working({ c }: { c: Ctx }) {
  const { s, d, secs } = c;
  // the limited app: the toggle above is the updated app's Today · week; today's logged tasks sit
  // under the card once Log & Switch has closed one
  if (LIMITED)
    return (
      <div className="ca-working">
        <WorkCard c={c} />
        {s.entries.length > 0 && (
          <>
            <div className="ca-sec">Logged today</div>
            <Entries c={c} />
          </>
        )}
        <span className="sr-only">Total today {timer(secs)}</span>
      </div>
    );
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
        <B key={i} className="ca-li" off={LIMITED} onClick={() => c.d({ t: "push", route: { k: "entry", i } })}>
          <span className={`ca-dot${e.running ? " is-live" : ""}`} />
          <span className="ca-li-main">
            <b>{e.activity}</b>
            <span>
              {projectName(e.projectId)} · {e.from} – {e.to}
            </span>
          </span>
          <span className="ca-li-v">{timer(e.secs).slice(0, 7)}</span>
          {!LIMITED && <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />}
        </B>
      ))}
    </div>
  );
}

export function WeekList({ c }: { c: Ctx }) {
  const todayMin = Math.floor(todaySecs(c) / 60);
  const days = [...weekSummary.days.map((d) => ({ date: d.date, dow: d.dow, min: d.minutes })), { date: TODAY.iso, dow: "FRI", min: todayMin }];
  const total = days.reduce((a, d) => a + d.min, 0);
  return (
    <div className="ca-list ca-card">
      {days.map((d) => (
        <B key={d.date} className="ca-li" off={LIMITED} onClick={() => c.d({ t: "push", route: { k: "day", date: d.date } })}>
          <span className="ca-li-dow">{d.dow}</span>
          <span className="ca-bar">
            <i style={{ transform: `scaleX(${Math.min(1, d.min / 600).toFixed(3)})` }} />
          </span>
          <span className="ca-li-v">{hm(d.min)}</span>
          {!LIMITED && <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />}
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
          const off = LIMITED && p.id !== TRY_JOB;
          return (
            <B key={p.id} className={`ca-li${off ? " is-dim" : ""}`} off={off} onClick={() => c.d({ t: "push", route: { k: "job", id: p.id } })}>
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
              {!off && <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />}
            </B>
          );
        })}
      </div>
    </>
  );
}

/** The limited app's one jobsite: its field note history (newest first) and its docs. Rows don't open. */
function JobHistory({ id }: { id: string }) {
  const notes = [
    ...fieldNotes.filter((n) => n.projectId === id).map((n) => ({ who: n.crewId, when: n.time, text: n.text, photos: n.photos })),
    ...dailyReports
      .filter((r) => r.projectId === id && !fieldNotes.some((n) => n.projectId === id && n.text === r.note))
      .map((r) => ({ who: r.byId, when: `${shortDate(r.date)}, 2026 · ${r.submitted ?? "today"}`, text: r.note, photos: r.photos })),
  ];
  return (
    <>
      <div className="ca-sec">Field notes</div>
      <div className="ca-card ca-notes">
        {notes.map((n, i) => (
          <div key={i} className="ca-fnote">
            <div className="ca-fnote-top">
              <b>{crewById(n.who).name}</b>
              <span>{n.when}</span>
            </div>
            <p>{n.text}</p>
            <span className="ca-fnote-ph">
              <Icon name="camera" size={14} stroke={1.7} /> {n.photos} photos
            </span>
          </div>
        ))}
      </div>
      <div className="ca-sec">Docs</div>
      <div className="ca-card ca-list">
        {jobFiles.slice(0, 6).map((f) => (
          <div key={f.id} className="ca-li ca-li--static">
            <span className={`ca-file ca-file--${f.kind}`}>{f.kind === "pdf" ? "PDF" : f.kind === "image" ? "JPG" : "XLS"}</span>
            <span className="ca-li-main">
              <b>{f.name}</b>
              <span>
                {f.folder} · {f.date} · {f.size}
              </span>
            </span>
          </div>
        ))}
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
      {LIMITED && id === TRY_JOB && <JobHistory id={id} />}
    </>
  );
}

// ── Projects (the limited app) ──────────────────────────────────────────

// The updated app's Projects tab (Oct 21): Projects · Schedule, a search field, one card per job with
// its status and Get directions. Hwy 9 opens; the rest show, dimmed. A finished job shows as Ended.
const PROJECTS = [...inProgress, ...projects.filter((p) => p.status === "Completed").slice(0, 1)];

export function Projects({ c }: { c: Ctx }) {
  const tab = c.s.sub.projects;
  return (
    <>
      <TabHead c={c} title={tab} keys={tab === "Projects" ? ["plus", "bell", "camera", "settings"] : ["bell", "camera", "settings"]} date={false} />
      <Toggle
        items={[
          { v: "Projects" as const, label: "Projects" },
          { v: "Schedule" as const, label: "Schedule" },
        ]}
        value={tab}
        onPick={(v) => c.d({ t: "sub", k: "projects", v })}
      />
      {tab === "Projects" ? (
        <div className="ca-fade">
          <div className="ca-search" aria-hidden="true">
            <Icon name="search" size={19} stroke={1.8} />
            <span>Search projects…</span>
          </div>
          {PROJECTS.map((p) => {
            const open = p.id === TRY_JOB;
            const ended = p.status === "Completed";
            const here = c.on && c.s.task.projectId === p.id;
            return (
              <div key={p.id} className={`ca-pcard${open ? "" : " is-dim"}`}>
                <B className="ca-pcard-main" off={!open} onClick={() => c.d({ t: "push", route: { k: "job", id: p.id } })}>
                  <span className="ca-li-main">
                    <b>{p.name}</b>
                    <span>{p.number}</span>
                  </span>
                  <span className="ca-pcard-chev" aria-hidden="true">
                    <Icon name={open ? "chevronRight" : "chevronDown"} size={17} stroke={1.9} />
                  </span>
                </B>
                <div className="ca-pcard-foot">
                  <span className={`ca-status${ended ? " is-ended" : ""}`}>{ended ? "Ended" : `In progress (${p.progress}%)`}</span>
                  {here && <span className="ca-pill">Here</span>}
                  <B className="ca-dir ca-press" onClick={() => c.toast(`Directions to ${p.name} sent to Maps`)}>
                    Get directions
                  </B>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ca-fade">
          <div className="ca-sec">Next week · {me.crew}</div>
          <div className="ca-card ca-list">
            {NEXT_WEEK.map((n, i) => (
              <div key={n.iso} className="ca-li ca-li--static">
                <span className="ca-li-dow">{n.dow.toUpperCase()}</span>
                <span className="ca-li-main">
                  <b>{i < 3 ? "Hwy 9 Culvert Replacement" : "Riverside Storm Sewer"}</b>
                  <span>
                    {n.label} · 6:30 AM · {i < 3 ? "Pipe Laying" : "Backfill & Compaction"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Reports (the limited app) ───────────────────────────────────────────

// The updated app's Reports tab (Oct 21), in its groups and order, each row with its line under it.
// Every row opens a short form that submits (Request Time Off is the day-off form, Documents a list).
const Asterisk = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M12 7.5v9M8.1 9.75l7.8 4.5M15.9 9.75l-7.8 4.5" />
  </svg>
);
type RRow = { label: string; sub: string; icon: IconName | "asterisk" };
export const REPORT_GROUPS: { group: string; rows: RRow[] }[] = [
  { group: "Supervisor", rows: [{ label: "Daily Report", sub: "Manage daily records", icon: "file" }] },
  {
    group: "Operations",
    rows: [
      { label: "Incident Report", sub: "Report incidents, injuries, and damage", icon: "asterisk" },
      { label: "Field Report", sub: "Capture field notes, photos, and project updates", icon: "camera" },
      { label: "Equipment Hours", sub: "Add equipment hours to a project without a clock-in or timecard", icon: "wrench" },
      { label: "Change order", sub: "Request and budget additional project work", icon: "fileText" },
      { label: "Scheduling", sub: "View and manage scheduled tasks", icon: "calendarOff" },
      { label: "Request Time Off", sub: "Submit and track time off requests", icon: "calendarOff" },
      { label: "Documents", sub: "Access company and project documents", icon: "file" },
    ],
  },
  {
    group: "Equipment",
    rows: [
      { label: "Equipment Inspection", sub: "Complete DOT and daily equipment inspections", icon: "clipboard" },
      { label: "Service Request", sub: "Log equipment maintenance and repairs", icon: "fileText" },
      { label: "Service Records", sub: "Record completed maintenance and repairs", icon: "wrench" },
      { label: "Fuel Log Report", sub: "Track fuel, road use, and connected meter readings by equipment", icon: "archive" },
    ],
  },
  {
    group: "Materials & Hauling",
    rows: [
      { label: "Hauling Log Report", sub: "Track material transportation details", icon: "truck" },
      { label: "Receipts Report", sub: "Track material purchases for projects", icon: "archive" },
      { label: "Materials Used Report", sub: "Track material usage on job sites", icon: "archive" },
    ],
  },
  {
    group: "Safety",
    rows: [
      { label: "Daily JSA", sub: "Job Safety Analysis", icon: "clipboard" },
      { label: "Toolbox Talk", sub: "Safety meeting record", icon: "file" },
    ],
  },
];

export function Reports({ c }: { c: Ctx }) {
  return (
    <>
      <TabHead c={c} title="Reports" stack />
      {REPORT_GROUPS.map((g) => (
        <section key={g.group} aria-label={g.group}>
          <div className="ca-rgroup">{g.group}</div>
          <div className="ca-list ca-rlist">
            {g.rows.map((r) => (
              <B
                key={r.label}
                className="ca-li ca-rrow"
                onClick={() => c.d({ t: "push", route: r.label === "Request Time Off" ? { k: "dayoff" } : { k: "report", label: r.label } })}
              >
                <span className="ca-ic">{r.icon === "asterisk" ? <Asterisk /> : <Icon name={r.icon} size={20} stroke={1.6} />}</span>
                <span className="ca-li-main ca-rrow-main">
                  <b>{r.label}</b>
                  <span>{r.sub}</span>
                </span>
                {c.s.sent.includes(r.label) && <span className="ca-pill">Sent</span>}
                <Icon name="chevronRight" size={17} stroke={1.9} className="ca-chev" />
              </B>
            ))}
          </div>
        </section>
      ))}
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
    case "Daily Report":
      return { rows: [["Date", TODAY.label], ["Project", job], ["Crew on site", "4 · Pipe Crew"], ["Weather", "52°F, overcast, dry"], ["Work done", "Second 24in RCP section set; bedding stone placed"], ["Photos", "4 attached"]], submit: "Submit daily report", done: "Daily report sent to the office" };
    case "Field Report":
      return { rows: [["Project", job], ["Note", "West ditch silt fence fixed; rip-rap staged at the outlet"], ["Photos", "3 attached"]], submit: "Save field report", done: `Field report saved to ${job}` };
    case "Equipment Hours":
      return { rows: [["Equipment", eq], ["Project", job], ["Hours", "3.5"], ["Operator", me.name]], submit: "Add hours", done: `3.5 hours added to ${eq}` };
    case "Change order":
      return { rows: [["Project", job], ["Work", "Extra 40 ft of 24in RCP at the outlet"], ["Why", "Ditch grade deeper than the plans"], ["Estimate", "$6,850"]], submit: "Send change order", done: `Change order sent to ${crewById("c15").name}` };
    case "Fuel Log Report":
      return { rows: [["Equipment", eq], ["Fuel", "48.2 gal diesel"], ["Hour meter", "5,126"], ["Road use", "Off-road (dyed)"]], submit: "Save fuel log", done: "Fuel log saved" };
    case "Daily JSA":
      return { rows: [["Project", job], ["Task", "Pipe laying in an 8 ft trench"], ["Hazards", "Cave-in, swing radius, traffic"], ["Controls", "Trench box, spotter, flaggers"], ["Crew signed", "4 of 4"]], submit: "Sign and submit", done: "Daily JSA signed and filed" };
    case "Toolbox Talk":
      return { rows: [["Topic", "Trench safety"], ["Led by", me.name], ["Signed in", "6 people"], ["Length", "15 min"]], submit: "Save talk", done: "Toolbox talk recorded" };
    case "Service Request":
      return { rows: [["Equipment", eq], ["Urgency", "Medium"], ["Issue", "Cab door latch sticking"]], submit: "Send request", done: "Service request sent to the shop" };
    case "Service Records":
    case "Add Service Records":
      return { rows: [["Equipment", eq], ["Service", "Greased all fittings, checked fluids"], ["Hour meter", "5,120"]], submit: "Save record", done: "Service record saved" };
    case "Hauling Log Report":
      return { rows: [["Date", haulingForm.date], ["Truck", haulingForm.equipment], ["Project", `#${haulingForm.projectNumber} · ${haulingForm.projectCategory}`], ["Type", haulingForm.type], ["From", haulingForm.location], ["Notes", haulingForm.notes]], submit: "Submit log", done: "Hauling log sent" };
    case "Receipts Report":
      return { rows: [["Vendor", "Cedar Ridge Hardware"], ["Category", "Small tools"], ["Amount", "$84.37"], ["Project", job], ["Photo", "Receipt attached"]], submit: "Submit receipt", done: "Receipt sent to the office" };
    case "Service Queue":
      return { rows: [["CAT D6 Dozer", "Doing · High"], ["Bomag BW213 Roller", "To do · High"], ["Mack Granite #1102", "To do · Medium"], ["CAT 320 Excavator", "To do · Low"]], submit: "Got it", done: "Service queue checked" };
    case "Materials Used Report":
    case "Field Usage Report":
      return { rows: [["Project", job], ["Material", "Select fill"], ["Quantity", "6 loads · 99 t"], ["Used for", "Trench backfill"]], submit: "Submit usage", done: "Field usage sent" };
    case "Equipment Inspection":
    case "DOT Inspection Report":
      // the updated app's Equipment Inspection form (James's screenshots, Oct 21; screens/phone/Dot.tsx)
      return { rows: [["Inspection type", "DOT Inspection"], ["Equipment", "Mack Granite #1102"], ["Hours / Miles", `${dotForm.mileage} mi`], ["Brakes, steering, lights, tires…", "12 of 12 OK"]], submit: "Submit", done: "DOT inspection filed" };
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
  if (label === "Documents")
    return (
      <>
        <Head title="Reports" onBack={() => c.d({ t: "pop" })} />
        <Title sub="Company and project documents">Documents</Title>
        <div className="ca-card ca-list">
          {jobFiles.slice(0, 7).map((f) => (
            <div key={f.id} className="ca-li ca-li--static">
              <span className={`ca-file ca-file--${f.kind}`}>{f.kind === "pdf" ? "PDF" : f.kind === "image" ? "JPG" : "XLS"}</span>
              <span className="ca-li-main">
                <b>{f.name}</b>
                <span>
                  {f.folder} · {f.date} · {f.size}
                </span>
              </span>
            </div>
          ))}
        </div>
      </>
    );
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
      <Head title={c.s.tab === "Reports" ? "Reports" : "Home"} onBack={() => c.d({ t: "pop" })} />
      <Title sub="Your foreman gets it right away">{LIMITED ? "Request Time Off" : "Request day off"}</Title>
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
          c.d({ t: "sent", label: LIMITED ? "Request Time Off" : "Day Off Request" });
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
          <B key={d.date} className="ca-li" off={LIMITED} onClick={() => c.d({ t: "push", route: { k: "day", date: d.date } })}>
            <span className="ca-li-dow">{d.dow}</span>
            <span className="ca-li-main">
              <b>{hm(d.minutes)}</b>
              <span>{d.location}</span>
            </span>
            {!LIMITED && <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />}
          </B>
        ))}
        <B className="ca-li" off={LIMITED} onClick={() => c.d({ t: "push", route: { k: "day", date: TODAY.iso } })}>
          <span className="ca-li-dow">FRI</span>
          <span className="ca-li-main">
            <b>{c.on ? timer(c.secs).slice(0, 7) : c.s.entries.length ? "Logged" : "Not yet"}</b>
            <span>{c.on ? "On the clock now" : "Today"}</span>
          </span>
          {!LIMITED && <Icon name="chevronRight" size={17} stroke={1.7} className="ca-chev" />}
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

// ── Messages (the limited app) ──────────────────────────────────────────

// The updated app's Messages tab (Oct 21): a Posts · Chats toggle. Posts are the company's
// announcements (Andrew: "We can make announcements viewable too"): each card opens in place to
// read in full. Chats: one row per group chat; Dirt Crew (today's messages, so on top) is the one
// that opens; the rest show but are off. Demo names only.
type ChatRow = { name: string; last: string; when: string; icon: IconName };
const last = crewMessages[crewMessages.length - 1];
const CHAT: ChatRow = { name: "Dirt Crew", last: `${crewById(last.crewId).name.split(" ")[0]}: ${last.text}`, when: last.time, icon: "messaging" };
const CHATS: ChatRow[] = [
  CHAT,
  { name: "General", last: "Elena: luis, its under i-stone ...", when: "Oct 8", icon: "megaphone" },
  { name: "Equipment", last: "Luis: D6 track pins are in. Back Monday.", when: "Oct 7", icon: "messaging" },
  { name: "Pipe Crew", last: "Andre: Laser's set for the next run", when: "Oct 6", icon: "messaging" },
  { name: "Sales", last: "Priya: Image attachment", when: "Sep 30", icon: "messaging" },
  { name: "Management", last: "No messages yet", when: "", icon: "messaging" },
  { name: "Office", last: "No messages yet", when: "", icon: "messaging" },
];

type Post = { id: string; title: string; by: string; when: string; body: string; file?: { name: string; size: string } };
const OFFICE = crewById("c16").name;
// today's post on top, then the office's announcements from the demo data (src/screens/data.ts)
const POSTS: Post[] = [
  {
    id: "an-42",
    title: "Timecards due today by 5 PM",
    by: OFFICE,
    when: "Oct 9, 2026 · 7:10 AM",
    body: "Payroll runs Monday. Check your hours for the week in the app and hit Submit before you leave the yard. If a day looks wrong, message the office and we'll fix it before it goes out.",
  },
  ...announcements.map((a) => ({
    id: a.id,
    title: a.title,
    by: a.id === "an-40" ? crewById("c15").name : OFFICE,
    when: `${a.date} · ${a.time}`,
    body: a.body,
    file: a.attachment && { name: a.attachment.name, size: a.attachment.size },
  })),
];

export function Messages({ c }: { c: Ctx }) {
  const tab = c.s.sub.messages;
  return (
    <>
      <TabHead c={c} title={tab} />
      <Toggle
        items={[
          { v: "Posts" as const, label: <Icon name="megaphone" size={21} stroke={1.7} />, aria: "Posts" },
          { v: "Chats" as const, label: <ChatGlyph size={22} />, aria: "Chats" },
        ]}
        value={tab}
        onPick={(v) => c.d({ t: "sub", k: "messages", v })}
      />
      {tab === "Posts" ? (
        <div className="ca-fade ca-posts">
          {POSTS.map((p) => {
            const open = c.s.read.includes(p.id);
            return (
              <article key={p.id} className={`ca-post${open ? " is-open" : ""}`}>
                <B className="ca-post-main" aria-expanded={open} onClick={() => c.d({ t: "post", id: p.id })}>
                  <b className="ca-post-title">{p.title}</b>
                  <span className="ca-post-by">By {p.by}</span>
                  <span className="ca-post-when">Posted {p.when}</span>
                  <span className="ca-post-body">{p.body}</span>
                  {!open && <span className="ca-post-more">Read more</span>}
                </B>
                {p.file && (
                  <div className="ca-post-file">
                    <span className="ca-file ca-file--pdf">PDF</span>
                    <span className="ca-li-main">
                      <b>{p.file.name}</b>
                      <span>PDF document · {p.file.size}</span>
                    </span>
                    <Icon name="download" size={18} stroke={1.8} className="ca-chev" />
                  </div>
                )}
              </article>
            );
          })}
          <B className="ca-cta ca-fab" off>
            New announcement
          </B>
        </div>
      ) : (
        <div className="ca-fade ca-posts">
          <ul className="ca-chats">
            {CHATS.map((ch) => {
              const off = ch !== CHAT;
              return (
                <li key={ch.name}>
                  <B className={`ca-chat-row${off ? " is-dim" : ""}`} off={off} onClick={() => c.d({ t: "push", route: { k: "chat" } })}>
                    <span className="ca-chat-ic">
                      {ch.icon === "megaphone" ? <Icon name="megaphone" size={21} stroke={1.7} /> : <ChatGlyph size={20} />}
                    </span>
                    <span className="ca-li-main">
                      <b>{ch.name}</b>
                      <span>{ch.last}</span>
                    </span>
                    {ch.when && <span className="ca-chat-when">{ch.when}</span>}
                  </B>
                </li>
              );
            })}
          </ul>
          <B className="ca-cta ca-fab" off>
            New chat
          </B>
        </div>
      )}
    </>
  );
}

// ── Support (the limited app) ───────────────────────────────────────────

// The updated app's Support panel (Oct 21): a help desk with its own bar (Home, Messages, News,
// Roadmap). Each of the four shows; nothing in them opens. The close X goes back to Home.
const HELP = [
  { q: "Tap Reports in the bottom bar, then Equipment Inspection…", when: "2 hours ago" },
  { q: "If you mean a DOT inspection, tap Reports, then…", when: "2 hours ago" },
  { q: "To add a project, log in to SmartCrew on the web…", when: "2 days ago" },
];
const NEWS = [
  { t: "Posts are on the phone", d: "Company announcements now sit next to your chats on the Messages tab.", when: "Oct 20" },
  { t: "Equipment Hours", d: "Add machine hours to a project without a clock-in or a timecard.", when: "Oct 14" },
  { t: "Daily JSA and Toolbox Talks", d: "Safety sign-offs from the Reports tab, filed to the job.", when: "Oct 2" },
];
const ROADMAP = [
  { v: 3, t: "Clock in/out notes on the web", d: "Notes added at clock in or out show up for the office." },
  { v: 2, t: "Longer clock-out notes", d: "Room for a fuller end-of-day write-up." },
  { v: 1, t: "Runtime from meter readings", d: "Project equipment time from start and end meter readings." },
  { v: 1, t: "Date filters for field notes", d: "Pick a date range on a project's field notes and hauling." },
];

export function Support({ c }: { c: Ctx }) {
  const tab = c.s.sub.support;
  const icon: Record<typeof tab, IconName> = { Home: "homeDoor", Messages: "messaging", News: "megaphone", Roadmap: "flag" };
  return (
    <div className={`ca-help ca-help--${tab.toLowerCase()}`}>
      <div className="ca-help-top">
        {tab !== "Home" && <span className="ca-help-title">{tab}</span>}
        <B className="ca-x ca-help-x" aria-label="Close help" onClick={() => c.d({ t: "tab", tab: "Home" })}>
          <Icon name="x" size={22} stroke={1.7} />
        </B>
      </div>
      <div key={tab} className="ca-help-body ca-fade">
        {tab === "Home" && (
          <>
            <span className="ca-help-logo" aria-hidden="true" />
            <p className="ca-help-hi">Hi Marcus 👋</p>
            <h3 className="ca-help-q">How can we help you today?</h3>
            <div className="ca-help-ask" aria-hidden="true">
              <span>Ask me anything</span>
              <Icon name="arrowUpRight" size={17} stroke={2} />
            </div>
            <div className="ca-help-chips">
              <B className="ca-help-chip" off>
                🐞 Report an issue
              </B>
              <B className="ca-help-chip" off>
                💡 Request a feature
              </B>
            </div>
          </>
        )}
        {tab === "Messages" && (
          <div className="ca-list">
            {HELP.map((h) => (
              <B key={h.q} className="ca-li" off>
                <span className="ca-help-av" aria-hidden="true" />
                <span className="ca-li-main">
                  <b>{h.q}</b>
                  <span>SmartCrew Support · {h.when}</span>
                </span>
              </B>
            ))}
          </div>
        )}
        {tab === "News" && (
          <div className="ca-list">
            {NEWS.map((n) => (
              <div key={n.t} className="ca-help-news">
                <span>{n.when}</span>
                <b>{n.t}</b>
                <p>{n.d}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "Roadmap" && (
          <div className="ca-list">
            {ROADMAP.map((r) => (
              <div key={r.t} className="ca-help-road">
                <span className="ca-help-vote" aria-label={`${r.v} votes`}>
                  <Icon name="chevronUp" size={14} stroke={2.2} />
                  {r.v}
                </span>
                <span className="ca-li-main ca-rrow-main">
                  <b>{r.t}</b>
                  <span>{r.d}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <nav className="ca-help-bar" aria-label="Help">
        {(["Home", "Messages", "News", "Roadmap"] as const).map((k) => (
          <B key={k} className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => c.d({ t: "sub", k: "support", v: k })}>
            <Icon name={icon[k]} size={21} stroke={tab === k ? 2.1 : 1.7} />
            <span>{k}</span>
          </B>
        ))}
      </nav>
    </div>
  );
}

function Chat({ c }: { c: Ctx }) {
  return (
    <>
      <Head title="Chats" onBack={() => c.d({ t: "pop" })} />
      <Title sub={`${new Set(crewMessages.map((m) => m.crewId)).size} people`}>{CHAT.name}</Title>
      <div className="ca-chat">
        {crewMessages.map((m) => {
          const mine = m.crewId === me.id;
          return (
            <div key={m.id} className={`ca-bubble${mine ? " is-mine" : ""}`}>
              {!mine && <b>{crewById(m.crewId).name}</b>}
              <p>{m.text}</p>
              <span>{m.time}</span>
            </div>
          );
        })}
      </div>
      <div className="ca-compose" aria-hidden="true">
        <span>Message {CHAT.name}</span>
        <Icon name="send" size={18} stroke={1.7} />
      </div>
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

/** The updated app's Reports glyph: a pulse line in a circle (filled when it's the tab you're on). */
const Pulse = ({ on }: { on: boolean }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9.6" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} />
    <path d="M6.6 13.4l2.7-3.1 2.6 3.2 2.7-3.9 2.8 2.7" stroke={on ? "#fff" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function TabBar({ c }: { c: Ctx }) {
  const icon = (k: Tab, on: boolean): ReactNode => {
    if (k === "Reports") return <Pulse on={on} />;
    if (k === "Messages" && LIMITED) return <ChatGlyph size={25} fill={on} />;
    const name: IconName =
      k === "Home" ? (on ? "homeFill" : "homeDoor") : k === "Jobsites" || k === "Projects" ? "mapPin" : k === "Docs" ? "docs" : k === "Summary" ? (on ? "calendarCheckFill" : "calendarCheck") : k === "Messages" ? "messaging" : k === "Support" ? "headset" : "user";
    return <Icon name={name} size={25} stroke={on && (k === "Projects" || k === "Support") ? 2.1 : 1.6} />;
  };
  return (
    <nav className="sc-tabbar ca-tabbar" aria-label="App tabs">
      {(LIMITED ? TABS_LIMITED : TABS).map((k) => {
        const on = c.s.tab === k;
        const badge = LIMITED && k === "Messages" && !c.s.seenMsgs;
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
              <span className="ca-tab-ic">
                {icon(k, on)}
                {badge && <span className="ca-badge">1</span>}
              </span>
            )}
            <span>
              {k}
              {badge && <span className="sr-only">, 1 new post</span>}
            </span>
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
    case "chat":
      return <Chat c={c} />;
    case "camera":
      return null; // drawn over everything (Camera)
  }
}

export function nowTime() {
  const d = new Date();
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
