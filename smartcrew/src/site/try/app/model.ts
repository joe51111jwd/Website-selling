// The crew app's little state machine (Try it): which tab, what is pushed on top of it, the
// running task, breaks, today's logged entries, the "Select task and project" sheet, and the few
// settings a crew member can flip. Clocked in / out itself comes from ../clock.ts (the page's
// copy and the self demo follow it); this keeps everything else. Pure: no timers, no DOM.

import { currentActivity, phoneWeek, taskOptions, TODAY, weekSummary } from "../../../screens/data";

export type Tab = "Home" | "Jobsites" | "Docs" | "Summary" | "Profile";
export const TABS: Tab[] = ["Home", "Jobsites", "Docs", "Summary", "Profile"];

export type Route =
  | { k: "job"; id: string }
  | { k: "report"; label: string }
  | { k: "day"; date: string }
  | { k: "entry"; i: number }
  | { k: "camera" }
  | { k: "dayoff" }
  | { k: "crew" };

export type Task = { projectId: string; activity: string; equipmentId: string };
export type Field = keyof Task;
/** A finished stretch of work today (`secs` excludes breaks). */
export type Entry = Task & { from: string; to: string; secs: number };
export type Seg = "Today" | "Entries" | "Week";

export type State = {
  tab: Tab;
  stack: Route[];
  /** the week strip's selected day (iso) */
  day: string;
  seg: Seg;
  task: Task;
  /** total clocked seconds when the current task started */
  taskAt: number;
  taskFrom: string;
  /** total clocked seconds when the current break started (null: working) */
  breakAt: number | null;
  /** break seconds inside the current task */
  breakSecs: number;
  entries: Entry[];
  sheet: { draft: Task; pick: Field | null; closing: boolean } | null;
  toast: { text: string; n: number } | null;
  dayOff: string | null;
  timecard: boolean;
  notify: boolean;
  spanish: boolean;
  photos: number;
  sent: string[];
  /** length of the last finished shift, seconds */
  lastShift: number | null;
};

export const DEFAULT_TASK: Task = {
  projectId: currentActivity.projectId,
  activity: currentActivity.activity,
  equipmentId: currentActivity.equipmentId,
};

export const initial: State = {
  tab: "Home",
  stack: [],
  day: TODAY.iso,
  seg: "Today",
  task: DEFAULT_TASK,
  taskAt: 0,
  taskFrom: "",
  breakAt: null,
  breakSecs: 0,
  entries: [],
  sheet: null,
  toast: null,
  dayOff: null,
  timecard: false,
  notify: true,
  spanish: false,
  photos: 0,
  sent: [],
  lastShift: null,
};

export type Action =
  | { t: "tab"; tab: Tab }
  | { t: "push"; route: Route }
  | { t: "pop" }
  | { t: "day"; iso: string }
  | { t: "seg"; seg: Seg }
  | { t: "shiftStart"; time: string; task?: Task }
  | { t: "shiftEnd"; secs: number; time: string }
  | { t: "break"; secs: number }
  | { t: "sheet"; open: boolean }
  | { t: "sheetGone" }
  | { t: "pick"; field: Field | null }
  | { t: "choose"; field: Field; value: string }
  | { t: "switch"; secs: number; time: string; task?: Task }
  | { t: "toast"; text: string }
  | { t: "toastGone"; n: number }
  | { t: "dayOff"; iso: string }
  | { t: "timecard" }
  | { t: "notify" }
  | { t: "spanish" }
  | { t: "photo" }
  | { t: "sent"; label: string };

/** Seconds on the current task right now (breaks don't count). */
export function taskSecs(s: State, secs: number) {
  const onBreak = s.breakAt === null ? 0 : secs - s.breakAt;
  return Math.max(0, secs - s.taskAt - s.breakSecs - onBreak);
}

function close(s: State, task: Task, secs: number, time: string): Entry | null {
  const worked = taskSecs(s, secs);
  if (!s.taskFrom) return null;
  return { ...task, from: s.taskFrom, to: time, secs: worked };
}

let toasts = 0;

export function reduce(s: State, a: Action): State {
  switch (a.t) {
    case "tab":
      // tapping the tab you're on goes back to its top
      return { ...s, tab: a.tab, stack: [], sheet: null };
    case "push":
      return { ...s, stack: [...s.stack, a.route] };
    case "pop":
      return { ...s, stack: s.stack.slice(0, -1) };
    case "day":
      return { ...s, day: a.iso };
    case "seg":
      return { ...s, seg: a.seg };
    case "shiftStart":
      return {
        ...s,
        task: a.task ?? s.task,
        taskAt: 0,
        taskFrom: a.time,
        breakAt: null,
        breakSecs: 0,
        seg: "Today",
        day: TODAY.iso,
      };
    case "shiftEnd": {
      const e = close(s, s.task, a.secs, a.time);
      return {
        ...s,
        entries: e ? [...s.entries, e] : s.entries,
        taskFrom: "",
        breakAt: null,
        breakSecs: 0,
        sheet: null,
        lastShift: a.secs,
        seg: "Today",
      };
    }
    case "break":
      return s.breakAt === null ? { ...s, breakAt: a.secs } : { ...s, breakAt: null, breakSecs: s.breakSecs + (a.secs - s.breakAt) };
    case "sheet":
      if (a.open) return { ...s, sheet: { draft: s.task, pick: null, closing: false } };
      return s.sheet ? { ...s, sheet: { ...s.sheet, closing: true } } : s;
    case "sheetGone":
      return s.sheet?.closing ? { ...s, sheet: null } : s;
    case "pick":
      return s.sheet ? { ...s, sheet: { ...s.sheet, pick: a.field } } : s;
    case "choose":
      return s.sheet ? { ...s, sheet: { ...s.sheet, pick: null, draft: { ...s.sheet.draft, [a.field]: a.value } } } : s;
    case "switch": {
      const next = a.task ?? s.sheet?.draft ?? s.task;
      const e = close(s, s.task, a.secs, a.time);
      return {
        ...s,
        entries: e ? [...s.entries, e] : s.entries,
        task: next,
        taskAt: a.secs,
        taskFrom: a.time,
        breakAt: null,
        breakSecs: 0,
        sheet: s.sheet ? { ...s.sheet, closing: true } : null,
        seg: "Today",
      };
    }
    case "toast":
      return { ...s, toast: { text: a.text, n: ++toasts } };
    case "toastGone":
      return s.toast?.n === a.n ? { ...s, toast: null } : s;
    case "dayOff":
      return { ...s, dayOff: a.iso };
    case "timecard":
      return { ...s, timecard: !s.timecard };
    case "notify":
      return { ...s, notify: !s.notify };
    case "spanish":
      return { ...s, spanish: !s.spanish };
    case "photo":
      return { ...s, photos: s.photos + 1 };
    case "sent":
      return { ...s, sent: s.sent.includes(a.label) ? s.sent : [...s.sent, a.label] };
  }
}

// ── lookups ──────────────────────────────────────────────────────────────

export const projectName = (id: string) => taskOptions.projects.find((p) => p.id === id)?.name ?? id;
export const projectCode = (id: string) => taskOptions.projects.find((p) => p.id === id)?.code ?? "";
export const equipmentName = (id: string) => taskOptions.equipment.find((e) => e.id === id)?.name ?? id;

export const OPTIONS: Record<Field, { value: string; label: string; sub?: string }[]> = {
  projectId: taskOptions.projects.map((p) => ({ value: p.id, label: p.name, sub: p.code })),
  activity: taskOptions.activityCodes.map((a) => ({ value: a, label: a })),
  equipmentId: taskOptions.equipment.map((e) => ({ value: e.id, label: e.name })),
};

export const FIELD_LABEL: Record<Field, string> = { projectId: "Project", activity: "Activity code", equipmentId: "Equipment" };

export const fieldValue = (t: Task, f: Field) => (f === "projectId" ? projectName(t.projectId) : f === "equipmentId" ? equipmentName(t.equipmentId) : t.activity);

/** The week strip's day (from data) by iso. */
export const weekDay = (iso: string) => phoneWeek.find((d) => d.date === iso);
/** A finished day of this week (Mon–Thu) by iso. */
export const summaryDay = (iso: string) => weekSummary.days.find((d) => d.date === iso);

const LONG: Record<string, string> = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
export const longDay = (label: string) => LONG[label] ?? label;
/** "2026-10-08" → "Oct 8" */
export const shortDate = (iso: string) => `Oct ${Number(iso.slice(8, 10))}`;

/** Next week's workdays, for the day-off request. */
export const NEXT_WEEK = [
  { iso: "2026-10-12", dow: "Mon", label: "Oct 12" },
  { iso: "2026-10-13", dow: "Tue", label: "Oct 13" },
  { iso: "2026-10-14", dow: "Wed", label: "Oct 14" },
  { iso: "2026-10-15", dow: "Thu", label: "Oct 15" },
  { iso: "2026-10-16", dow: "Fri", label: "Oct 16" },
];
