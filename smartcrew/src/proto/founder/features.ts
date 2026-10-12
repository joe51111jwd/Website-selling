// The sentence index: every SmartCrew feature (INVENTORY.md / DOSSIER §3) as one short, plain
// clause, in the four outcome groups. Each clause names exactly one inventory ID, so each feature
// appears once on the page. T2a (battery) and T2b (privacy) are crew qualities, not features;
// they live in the crew section. G4 (invoicing) is excluded (TRUTH: do not claim).
//
// `focus` is the part of the real screen the stage pans to, in the screen's native CSS px
// (web 1440×900, phone 402×874). `pending` features are Andrew-to-confirm (DOSSIER Q5): they are
// named, marked, and never shown with a screen.

export type GroupId = "hours" | "profit" | "fleet" | "office";
export type Rect = { x: number; y: number; w: number; h: number };

export type Feature = {
  id: string;
  group: GroupId;
  /** the clause as it reads in the paragraph */
  text: string;
  /** what follows the clause in the sentence (punctuation, connective) */
  after: string;
  /** the stage title */
  name: string;
  side: "Crew app" | "Office";
  /** one line of detail, GREEN or a plain paraphrase of a GREEN line */
  detail: string;
  src: string;
  screen?: string;
  focus?: Rect;
  /** callout on real data, in native px of the screen */
  pin?: { x: number; y: number; label: string };
  /** when the screen shown is the nearest real screen, not one made for this feature */
  shown?: string;
  pending?: true;
};

export const GROUPS: { id: GroupId; head: string; lead: string }[] = [
  { id: "hours", head: "Hours and payroll.", lead: "T1" },
  { id: "profit", head: "Job profit.", lead: "M1" },
  { id: "fleet", head: "Machines, hauling and safety.", lead: "E1" },
  { id: "office", head: "Office and sales.", lead: "S1" },
];

const P = { x: 0, y: 0, w: 402, h: 874 };

export const FEATURES: Feature[] = [
  // ── Hours and payroll ────────────────────────────────────────────────
  { id: "T1", group: "hours", text: "Crews clock in with one tap", after: ", or ", name: "One-tap clock in and out", side: "Crew app",
    detail: "Start the shift with one tap. End the day with one tap.", src: "L", screen: "phone-home", focus: { ...P, y: 0, h: 600 }, pin: { x: 252, y: 440, label: "One tap" } },
  { id: "T2", group: "hours", text: "by GPS at the job", after: ". ", name: "GPS auto clock-in (optional)", side: "Office",
    detail: "Turn on GPS auto clock-in and hours log as the crew arrives at and leaves the jobsite.", src: "L, LV", screen: "web-dashboard",
    focus: { x: 860, y: 150, w: 560, h: 420 }, pin: { x: 1122, y: 378, label: "Crew on site, by job" }, shown: "Dashboard map" },
  { id: "T3", group: "hours", text: "Every hour gets a cost code", after: ", ", name: "Cost codes on every hour", side: "Crew app",
    detail: "Assign cost codes to every hour, so you see exactly where time and money are going.", src: "L", screen: "phone-select-task", focus: { ...P, y: 310, h: 600 }, pin: { x: 360, y: 650, label: "Cost code" } },
  { id: "T4", group: "hours", text: "every machine hour a job", after: ". ", name: "Equipment hours at clock-in", side: "Crew app",
    detail: "When the crew clocks in and picks a machine, its hours attach to the job.", src: "L, V", screen: "phone-working", focus: { ...P, y: 150, h: 600 }, pin: { x: 376, y: 465, label: "Machine on the job" } },
  { id: "T5", group: "hours", text: "Timecards turn in daily", after: ". ", name: "Timecards submitted daily", side: "Crew app",
    detail: "Time is tracked daily and submitted automatically. No late entries, no Friday memory games.", src: "L", screen: "phone-summary", focus: { ...P, y: 0, h: 600 }, pin: { x: 360, y: 290, label: "Sent daily" } },
  { id: "T6", group: "hours", text: "PTO goes through the app", after: ". ", name: "PTO requests", side: "Crew app",
    detail: "Employees request time off right from the app, and the office plans around it.", src: "L", screen: "phone-home", focus: { ...P, y: 200, h: 600 }, pin: { x: 290, y: 606, label: "Day off" } },
  { id: "T7", group: "hours", text: "Prevailing wage is tracked by jurisdiction", after: ". ", name: "Prevailing wage", side: "Office",
    detail: "Activity code hours are tracked by jurisdiction for prevailing wage jobs, with no manual entry.", src: "L", screen: "web-timecards",
    focus: { x: 346, y: 236, w: 700, h: 460 }, shown: "Timecards report" },
  { id: "T8", group: "hours", text: "Every employee has a profile", after: ". ", name: "Employee profiles", side: "Office",
    detail: "SmartCrew keeps a profile for every employee, with their role and their hours on each job.", src: "V-tab", screen: "web-project-detail",
    focus: { x: 146, y: 640, w: 700, h: 260 }, shown: "Project, labor tab" },
  { id: "T10", group: "hours", text: "You see who's on site now", after: ", ", name: "Who's on site right now", side: "Office",
    detail: "See who's clocked in, on which job, with which machine.", src: "L, SS", screen: "web-dashboard",
    focus: { x: 346, y: 560, w: 720, h: 340 }, pin: { x: 622, y: 734, label: "Clocked in 6:42 am" } },
  { id: "T9", group: "hours", text: "who's late and who's pulling weight", after: ". ", name: "Attendance and performance", side: "Office",
    detail: "See who's late and who's pulling weight. Spot patterns in attendance, sick days and no-shows.", src: "L", screen: "web-timecards",
    focus: { x: 700, y: 290, w: 704, h: 460 } },
  { id: "T11", group: "hours", text: "Overtime shows before payroll", after: ". ", name: "Overtime hours", side: "Office",
    detail: "Overtime hours show on the dashboard while the week is still running.", src: "SS", screen: "web-dashboard",
    focus: { x: 346, y: 176, w: 540, h: 372 }, pin: { x: 690, y: 409, label: "OT this week" } },
  { id: "T2c", group: "hours", text: "Missed clock-outs get flagged", after: ". ", name: "Missed clock-out flags", side: "Office",
    detail: "Forgotten clock-outs get caught before payroll.", src: "V-tab", pending: true },
  { id: "M4", group: "hours", text: "Hours go to QuickBooks for payroll", after: ".", name: "QuickBooks integration for payroll", side: "Office",
    detail: "From crew hours to payroll without the Friday scramble.", src: "L, V-tab", screen: "web-timecards",
    focus: { x: 700, y: 100, w: 704, h: 330 }, pin: { x: 866, y: 135, label: "Payroll report" } },

  // ── Job profit ───────────────────────────────────────────────────────
  { id: "M1", group: "profit", text: "Every job shows its profit daily", after: ". ", name: "Daily profit on every job", side: "Office",
    detail: "Labor, equipment and materials roll into each job's profit every day, so you can fix problems before they cost you.", src: "L",
    screen: "web-project-detail", focus: { x: 146, y: 380, w: 760, h: 240 }, pin: { x: 752, y: 437, label: "Profit, updated daily" } },
  { id: "M2", group: "profit", text: "Subs and change orders get logged", after: ". ", name: "Subs and change orders", side: "Office",
    detail: "Log subs, extras and change orders as they happen. Stay on top of budget, billing and payroll.", src: "L", screen: "web-project-detail",
    focus: { x: 900, y: 470, w: 504, h: 220 }, pin: { x: 1230, y: 497, label: "Change orders" } },
  { id: "M3", group: "profit", text: "Every billable hour and load gets billed", after: ". ", name: "Every billable hour and load", side: "Office",
    detail: "Track every labor and equipment hour and every load for each job, so nothing gets missed and everything gets paid.", src: "L, SS",
    screen: "web-materials", focus: { x: 700, y: 160, w: 704, h: 350 }, pin: { x: 986, y: 217, label: "Billable cost" } },
  { id: "M7", group: "profit", text: "Jobs sit on one board and map", after: ", ", name: "Projects board and job map", side: "Office",
    detail: "Every job, its status and where it is, on one board and one map.", src: "SS", screen: "web-projects", focus: { x: 346, y: 110, w: 700, h: 460 } },
  { id: "M5", group: "profit", text: "your numbers on one dashboard", after: ". ", name: "Owner dashboard", side: "Office",
    detail: "Labor, material and equipment spend, hours and overtime on one screen, live.", src: "V-tab, SS", screen: "web-dashboard",
    focus: { x: 346, y: 100, w: 700, h: 460 } },
  { id: "M6", group: "profit", text: "Reports export to PDF", after: ". ", name: "Exportable reports", side: "Office",
    detail: "Timecards, payroll, equipment and incident reports, weekly or yearly, one click to PDF.", src: "V-tab, SS", screen: "web-timecards",
    focus: { x: 900, y: 100, w: 504, h: 300 }, pin: { x: 1348, y: 135, label: "Export PDF" } },
  { id: "H1", group: "profit", text: "Orders show delivered or late", after: ". ", name: "Material orders and deliveries", side: "Office",
    detail: "One-click logging keeps you updated on what's ordered, delivered or delayed.", src: "L, SS", screen: "web-materials",
    focus: { x: 760, y: 320, w: 644, h: 420 }, pin: { x: 1030, y: 392, label: "Delivery date" } },
  { id: "H2", group: "profit", text: "Crews snap their receipts", after: ". ", name: "Field usage and receipts", side: "Office",
    detail: "Crews log what they used and upload receipts from the app, so receipts stop dying in group texts.", src: "V-tab, V", screen: "web-materials",
    focus: { x: 346, y: 260, w: 640, h: 400 }, pin: { x: 619, y: 296, label: "Receipts" }, shown: "Materials, receipts tab" },
  { id: "H5", group: "profit", text: "Suppliers live in one list", after: ".", name: "Suppliers and vendors", side: "Office",
    detail: "One vendor list that feeds your orders.", src: "LV, SS", screen: "web-materials", focus: { x: 346, y: 320, w: 620, h: 420 },
    pin: { x: 512, y: 392, label: "Vendor" } },

  // ── Machines, hauling and safety ─────────────────────────────────────
  { id: "E1", group: "fleet", text: "Every machine has a rate and a cost per job", after: ". ", name: "Machine rates, hours and cost", side: "Office",
    detail: "Treat every machine like the profit center it is: hourly rate, hours, cost per job.", src: "V-tab, L, SS", screen: "web-equipment",
    focus: { x: 700, y: 236, w: 704, h: 470 }, pin: { x: 1070, y: 687, label: "$165.00 an hour" } },
  { id: "E2", group: "fleet", text: "The shop queue keeps service history", after: ". ", name: "Shop queue and service records", side: "Office",
    detail: "Manage all equipment repairs and shop work orders in one place, with full history.", src: "L, SS", screen: "web-service-queue",
    focus: { x: 346, y: 160, w: 720, h: 460 } },
  { id: "E3", group: "fleet", text: "Operators request repairs from the cab", after: ". ", name: "Repair requests from the field", side: "Crew app",
    detail: "Submit equipment service requests with one click from the mobile app.", src: "L", screen: "phone-reports", focus: { ...P, y: 0, h: 600 }, pin: { x: 384, y: 229, label: "Service request" } },
  { id: "E4", group: "fleet", text: "Drivers do DOT pre-trips on the phone", after: ". ", name: "DOT pre-trip inspections", side: "Crew app",
    detail: "Audit-ready DOT logs without the paper nightmare.", src: "V-tab, L, SS", screen: "phone-dot", focus: { ...P, y: 0, h: 600 }, pin: { x: 360, y: 461, label: "Defect flagged" } },
  { id: "E5", group: "fleet", text: "Incidents get filed on the spot", after: ", ", name: "Accident and incident reports", side: "Crew app",
    detail: "File accident and incident reports with one click from the mobile app.", src: "L", screen: "phone-reports", focus: { ...P, y: 0, h: 600 }, pin: { x: 384, y: 158, label: "Incident report" } },
  { id: "E6", group: "fleet", text: "safety records stay searchable", after: ". ", name: "Safety records", side: "Office",
    detail: "DOT and safety records, digitized and easy to search.", src: "L", screen: "web-timecards", focus: { x: 700, y: 100, w: 704, h: 330 },
    pin: { x: 1040, y: 135, label: "Incidents" }, shown: "Reports" },
  { id: "E7", group: "fleet", text: "JSAs and toolbox talks get logged", after: ". ", name: "JSAs and toolbox talks", side: "Crew app",
    detail: "Keep JSAs, toolbox talks and incident records alongside your jobs.", src: "LV", pending: true },
  { id: "H3", group: "fleet", text: "Hauling tickets come off paper", after: ". ", name: "Hauling logs", side: "Crew app",
    detail: "Hauling logs, digitized and easy to search. No more paper folders.", src: "L, V, SS", screen: "phone-hauling", focus: { ...P, y: 0, h: 600 }, pin: { x: 360, y: 636, label: "Pit or dump site" } },
  { id: "H4", group: "fleet", text: "Fuel goes on the job", after: ".", name: "Fuel records", side: "Office",
    detail: "Fuel records tied to the job.", src: "LV", pending: true },

  // ── Office and sales ─────────────────────────────────────────────────
  { id: "S1", group: "office", text: "The schedule goes out to the crew", after: ". ", name: "Crew and equipment scheduling", side: "Office",
    detail: "Assign crews, jobs and equipment without the morning scramble.", src: "V-tab, L, SS", screen: "web-scheduling",
    focus: { x: 346, y: 100, w: 720, h: 470 } },
  { id: "C1", group: "office", text: "Daily reports come in with photos", after: ". ", name: "Daily reports and field notes", side: "Office",
    detail: "The office sees the day's notes and photos without chasing paper or calling around.", src: "L, LV, SS", screen: "web-dashboard",
    focus: { x: 346, y: 380, w: 700, h: 300 }, pin: { x: 690, y: 503, label: "Field notes and photos" } },
  { id: "C2", group: "office", text: "Plans ride in your pocket", after: ". ", name: "Project docs in your pocket", side: "Office",
    detail: "Plans, files and records, findable from the truck.", src: "L, LV", screen: "web-project-detail", focus: { x: 146, y: 620, w: 800, h: 280 },
    pin: { x: 765, y: 662, label: "Documents" }, shown: "Project tabs" },
  { id: "C3", group: "office", text: "Crew chat sits by the job", after: ". ", name: "Crew messaging", side: "Office",
    detail: "Keep conversations with your crew in the same place as the work.", src: "L, LV", screen: "web-messaging", focus: { x: 346, y: 90, w: 720, h: 470 } },
  { id: "G1", group: "office", text: "Leads and bids sit in one pipeline", after: ", ", name: "Sales pipeline", side: "Office",
    detail: "Track leads, opportunities and bids in the same app that runs the work.", src: "V-tab, LV, SS", screen: "web-pipeline",
    focus: { x: 346, y: 150, w: 720, h: 470 } },
  { id: "G2", group: "office", text: "bids use real job costs", after: ", ", name: "Bids from real job costs", side: "Office",
    detail: "Use real job data to create sharper, more competitive bids without cutting into profit.", src: "L", screen: "web-project-detail",
    focus: { x: 146, y: 470, w: 760, h: 160 }, shown: "Project budget" },
  { id: "G3", group: "office", text: "and won bids become jobs", after: ".", name: "Won bid to project", side: "Office",
    detail: "Converts won bids straight into projects, with no re-entry.", src: "V-tab", pending: true },
];

export const byId = (id: string) => FEATURES.find((f) => f.id === id)!;
