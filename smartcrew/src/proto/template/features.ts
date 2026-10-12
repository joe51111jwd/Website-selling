// Every SmartCrew feature on the page, once, in the four outcome groups of DOSSIER §3.
// Copy: plain paraphrases of GREEN/AMBER lines in research/features/TRUTH.md (source in `src`).
// `confirm: true` = Andrew has not confirmed it’s live (LV/V-only). Shown with a dashed
// "Andrew to confirm" mark and never with a screen (PLAYBOOK S5 rule 4).
// T2a (battery) and T2b (no data shared) live in the crew section instead, so each appears once.

import { featuredProject, dashboard, equipmentById } from "../../screens/data";
import { money, hm } from "../../screens/kit/format";

export type Side = "Crew app" | "Office" | "Crew app and office";

/** Native-pixel window of a registry screen: left/top of the crop and its width (web only). */
export type Focus = { x: number; y: number; w?: number };

/** A plan-sheet callout pointing at real data in the screen (native px). */
export type Callout = { x: number; y: number; label: string; side?: "left" | "right" | "above" | "below" };

export type Feature = {
  id: string;
  name: string;
  line: string;
  side: Side;
  screen?: string;
  focus?: Focus;
  callout?: Callout;
  src: string;
  confirm?: boolean;
  /** GREEN feature with no recreated screen yet. */
  noScreen?: boolean;
};

export type Group = {
  id: "profit" | "hours" | "fleet" | "office";
  name: string;
  short: string;
  /** the group’s promise, verbatim or near-verbatim from the source */
  promise: string;
  features: Feature[];
};

const p = featuredProject;
const cat320 = equipmentById("CAT-320-01");

export const GROUPS: Group[] = [
  {
    id: "profit",
    name: "Job profit",
    short: "Job profit",
    promise: "Real-time profit metrics on every job, every day.",
    features: [
      {
        id: "M1",
        name: "Profit on every job, every day",
        line: "Up-to-date margins across labor, equipment and materials for every job, so you can fix problems before they cost you.",
        side: "Office",
        screen: "web-project-detail",
        focus: { x: 140, y: 108, w: 900 },
        callout: { x: 668, y: 436, label: `Profit to date on ${p.number}: ${money(p.profit, { cents: false })}`, side: "below" },
        src: "L",
      },
      {
        id: "M2",
        name: "Subs, extras and change orders",
        line: "Log subs, extras and change orders as they happen, and see what each one has cost.",
        side: "Crew app and office",
        screen: "web-project-detail",
        focus: { x: 520, y: 380, w: 900 },
        callout: { x: 1284, y: 497, label: "Change orders: budget, spent and net", side: "above" },
        src: "L",
      },
      {
        id: "M3",
        name: "Every billable hour captured",
        line: "Every labor and equipment hour lands on its job, so nothing gets missed and everything gets paid.",
        side: "Office",
        screen: "web-project-detail",
        focus: { x: 140, y: 470, w: 960 },
        callout: { x: 878, y: 764, label: "Hours per person, on this job", side: "above" },
        src: "L",
      },
      {
        id: "M7",
        name: "All your jobs on one board",
        line: "Every job by status, with revenue, expenses and profit, on a board and a map.",
        side: "Office",
        screen: "web-projects",
        focus: { x: 300, y: 70, w: 960 },
        src: "SS",
      },
      {
        id: "M5",
        name: "The owner’s dashboard",
        line: "Labor, material and equipment costs, hours and overtime across your jobs, live.",
        side: "Office",
        screen: "web-dashboard",
        focus: { x: 320, y: 96, w: 920 },
        callout: { x: 470, y: 218, label: `Labor cost across jobs: ${money(dashboard.laborExpense, { cents: false })}`, side: "below" },
        src: "V-tab, SS",
      },
      {
        id: "M6",
        name: "Reports you can export",
        line: "Weekly and yearly reviews of hours and costs, exported as a PDF.",
        side: "Office",
        screen: "web-timecards",
        focus: { x: 520, y: 92, w: 920 },
        callout: { x: 1348, y: 135, label: "Export PDF", side: "below" },
        src: "V-tab, SS",
      },
      {
        id: "H1",
        name: "Material orders and deliveries",
        line: "One-click logging shows what’s ordered, delivered or delayed, so jobs stay on schedule.",
        side: "Office",
        screen: "web-materials",
        focus: { x: 330, y: 100, w: 1100 },
        callout: { x: 1238, y: 403, label: "Paid or not paid, per order", side: "left" },
        src: "L",
      },
      {
        id: "H2",
        name: "Field usage and receipts",
        line: "The crew logs what they used on the job and adds the receipt.",
        side: "Crew app and office",
        screen: "web-materials",
        focus: { x: 330, y: 250, w: 900 },
        callout: { x: 620, y: 296, label: "Field usage and receipts tabs", side: "below" },
        src: "V-tab",
      },
      {
        id: "H5",
        name: "Supplier and vendor list",
        line: "Your suppliers in one list, tied to every order.",
        side: "Office",
        screen: "web-materials",
        focus: { x: 330, y: 300, w: 900 },
        callout: { x: 508, y: 391, label: "Vendor on each order", side: "right" },
        src: "LV, SS",
      },
    ],
  },
  {
    id: "hours",
    name: "Hours and payroll",
    short: "Hours",
    promise: "Timecards that log themselves.",
    features: [
      { id: "T1", name: "Clock in and out with one tap", line: "Clocking in and out is one tap on the phone the crew already carries.", side: "Crew app", screen: "phone-home", focus: { x: 0, y: 150 }, callout: { x: 262, y: 440, label: "One tap", side: "right" }, src: "L" },
      {
        id: "T2",
        name: "GPS clocks them in at the job",
        line: "Optional geofencing logs hours when the crew arrives, so timecards fill themselves out.",
        side: "Crew app",
        screen: "phone-working",
        focus: { x: 0, y: 170 },
        src: "L (optional per LV)",
      },
      { id: "T3", name: "A cost code on every hour", line: "Every hour gets an activity code, so you see exactly where time and money go.", side: "Crew app", screen: "phone-select-task", focus: { x: 0, y: 300 }, callout: { x: 300, y: 645, label: "Activity code", side: "above" }, src: "L" },
      { id: "T4", name: "Machine hours at clock-in", line: "The operator picks the machine when he clocks in, and its hours go on the job.", side: "Crew app", screen: "phone-select-task", focus: { x: 0, y: 340 }, callout: { x: 300, y: 740, label: "The machine", side: "above" }, src: "L, V-tab" },
      { id: "T5", name: "Timecards sent in every day", line: "Time is tracked daily and submitted automatically. No late entries, no guessing from memory.", side: "Crew app and office", screen: "phone-summary", focus: { x: 0, y: 40 }, callout: { x: 336, y: 296, label: "Submit Timecard", side: "below" }, src: "L" },
      { id: "T6", name: "Time-off requests", line: "Your guys request a day off from the app, and you approve it from the office.", side: "Crew app and office", screen: "phone-home", focus: { x: 0, y: 250 }, callout: { x: 290, y: 605, label: "Request day off", side: "above" }, src: "L" },
      { id: "T7", name: "Prevailing wage hours", line: "Activity code hours tracked by jurisdiction for prevailing wage jobs, without the manual entry.", side: "Office", noScreen: true, src: "L" },
      {
        id: "T8",
        name: "Employee profiles",
        line: "Each person’s role, crew and hours in one place.",
        side: "Office",
        screen: "web-dashboard",
        focus: { x: 320, y: 570, w: 920 },
        callout: { x: 436, y: 746, label: "Name and role", side: "above" },
        src: "V-tab, SS",
      },
      {
        id: "T9",
        name: "Attendance, late days and no-shows",
        line: "See who’s on site, who’s late and who’s pulling weight. Spot patterns in sick days and no-shows.",
        side: "Office",
        screen: "web-timecards",
        focus: { x: 330, y: 230, w: 1100 },
        callout: { x: 848, y: 636, label: "No clock-in Wednesday", side: "above" },
        src: "L",
      },
      {
        id: "T10",
        name: "Who’s on site right now",
        line: "Who clocked in, where, on which job and which machine, as it happens.",
        side: "Office",
        screen: "web-dashboard",
        focus: { x: 540, y: 160, w: 900 },
        callout: { x: 622, y: 734, label: "Clocked in 6:42 AM", side: "above" },
        src: "L, SS",
      },
      {
        id: "T11",
        name: "Overtime hours",
        line: "Overtime adds up per person and per job, so it never surprises you on payday.",
        side: "Office",
        screen: "web-dashboard",
        focus: { x: 320, y: 260, w: 920 },
        callout: { x: 708, y: 408, label: `Overtime this period: ${hm(dashboard.otMinutes)}`, side: "below" },
        src: "SS",
      },
      { id: "T2c", name: "Missed clock-out flags", line: "A flag when someone forgets to clock out.", side: "Office", confirm: true, src: "V-tab only" },
      {
        id: "M4",
        name: "QuickBooks payroll",
        line: "From crew hours to payroll without the Friday scramble. QuickBooks integration for payroll.",
        side: "Office",
        screen: "web-timecards",
        focus: { x: 330, y: 92, w: 1000 },
        callout: { x: 866, y: 135, label: "Payroll report", side: "below" },
        src: "V-tab, L (AMBER wording)",
      },
    ],
  },
  {
    id: "fleet",
    name: "Fleet, hauling and safety",
    short: "Fleet",
    promise: "Treat every machine like the profit center it is.",
    features: [
      {
        id: "E1",
        name: "Every machine’s rate and hours",
        line: "Each machine’s hour rate and hours, so you know what it costs on every job.",
        side: "Office",
        screen: "web-equipment",
        focus: { x: 330, y: 330, w: 1100 },
        callout: { x: 1070, y: 687, label: `${cat320.name}: ${money(cat320.hourRate, { cents: false })} an hour`, side: "left" },
        src: "L, V-tab, SS",
      },
      {
        id: "E2",
        name: "Service records and the shop queue",
        line: "Every repair and shop work order in one place, with the full history.",
        side: "Office",
        screen: "web-service-queue",
        focus: { x: 330, y: 92, w: 1100 },
        callout: { x: 678, y: 194, label: "Service Queue", side: "below" },
        src: "L, SS",
      },
      { id: "E3", name: "Repair requests from the cab", line: "The operator sends a service request from his phone in one tap.", side: "Crew app", screen: "phone-reports", focus: { x: 0, y: 0 }, callout: { x: 300, y: 221, label: "Service Request", side: "right" }, src: "L" },
      { id: "E4", name: "DOT pre-trip inspections", line: "Audit-ready DOT logs without the paper nightmare.", side: "Crew app and office", screen: "phone-dot", focus: { x: 0, y: 0 }, callout: { x: 280, y: 413, label: "Defects, yes or no", side: "above" }, src: "V-tab, L" },
      { id: "E5", name: "Accident and incident reports", line: "Accident and incident reports go in from the job, with one tap.", side: "Crew app", screen: "phone-reports", focus: { x: 0, y: 60 }, callout: { x: 300, y: 151, label: "Incident Report", side: "right" }, src: "L" },
      {
        id: "E6",
        name: "Safety records you can search",
        line: "Incidents and safety records, digitized and easy to search.",
        side: "Crew app and office",
        screen: "web-timecards",
        focus: { x: 520, y: 92, w: 920 },
        callout: { x: 1040, y: 135, label: "Incidents", side: "below" },
        src: "L",
      },
      { id: "E7", name: "JSAs and toolbox talks", line: "Job safety analyses and toolbox talks, signed on the job.", side: "Crew app", confirm: true, src: "LV only" },
      { id: "H3", name: "Hauling logs and tickets", line: "Loads logged from the cab instead of a paper ticket folder.", side: "Crew app", screen: "phone-hauling", focus: { x: 0, y: 60 }, src: "L, SS" },
      { id: "H4", name: "Fuel records", line: "Fuel logged per machine and per job.", side: "Crew app and office", confirm: true, src: "LV only" },
    ],
  },
  {
    id: "office",
    name: "Office and sales",
    short: "Office",
    promise: "Assign crews, jobs and equipment without the morning scramble.",
    features: [
      { id: "S1", name: "Crew and equipment schedule", line: "Assign crews, jobs and machines without the morning scramble, and the plan shows up on their phones.", side: "Crew app and office", screen: "web-scheduling", focus: { x: 330, y: 92, w: 1100 }, src: "L, V-tab, SS" },
      {
        id: "C1",
        name: "Daily reports and field notes",
        line: "Notes and photos from the job reach the office the same day.",
        side: "Crew app and office",
        screen: "web-dashboard",
        focus: { x: 320, y: 360, w: 920 },
        callout: { x: 706, y: 504, label: `${dashboard.fieldNotes} field notes with photos`, side: "below" },
        src: "L, SS",
      },
      {
        id: "C2",
        name: "Project docs in your pocket",
        line: "Field notes, project files and reports, organized and open on any phone.",
        side: "Crew app and office",
        screen: "web-project-detail",
        focus: { x: 140, y: 560, w: 960 },
        callout: { x: 766, y: 661, label: "Documents for this job", side: "below" },
        src: "L",
      },
      { id: "C3", name: "Crew messages and announcements", line: "Announcements and crew messages in the same app they clock in with.", side: "Crew app and office", screen: "web-messaging", focus: { x: 330, y: 92, w: 1100 }, src: "L, LV" },
      { id: "G1", name: "Sales pipeline and customers", line: "Leads, customers and deals in one pipeline.", side: "Office", screen: "web-pipeline", focus: { x: 330, y: 92, w: 1100 }, src: "V-tab, LV, SS" },
      {
        id: "G2",
        name: "Bids built on real job costs",
        line: "Use real job data to build sharper bids without cutting into profit.",
        side: "Office",
        screen: "web-project-detail",
        focus: { x: 140, y: 380, w: 960 },
        callout: { x: 296, y: 596, label: "What labor really cost on this job", side: "above" },
        src: "L",
      },
      { id: "G3", name: "Won bids become jobs", line: "A won bid turns into a job without typing it in twice.", side: "Office", confirm: true, src: "V-tab only" },
    ],
  },
];

export const ALL_FEATURES = GROUPS.flatMap((g) => g.features);
export const FEATURE_COUNT = ALL_FEATURES.length;
