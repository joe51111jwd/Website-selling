// The One Day feature map: seven moments of one workday at Cedar Ridge Earthworks (our demo
// company), field → office, carrying all 38 features. Ported from the prototype's data.ts.
//
// Coordinates are native CSS px of the recreated screens (web 1440×900, phone 402×874; see
// src/screens/registry.ts), measured from the DOM. `ring` / `mark.b` boxes are [x, y, w, h] and
// can go straight into a Stage pose's `ring` (src/three/stage).
//
// `phone.y` / `office.x,y,w` were crop offsets for the old 2D prototype; the 3D devices show the
// whole screen, so the Stage ignores them (kept for reference and for 2D fallbacks).

export type Box = [x: number, y: number, w: number, h: number];
export type PhoneView = { id: string; y: number; ring?: Box };
export type OfficeView = { id: string; x: number; y: number; w?: number; mark?: { b: Box; label: string } };

export type Feature = {
  id: string; // inventory ID (features/INVENTORY.md)
  label: string;
  line: string; // one plain sentence (GREEN or a faithful paraphrase)
  src: string; // where the line comes from (L, V, V-tab, LV, SS)
  confirm?: boolean; // ⚑ exists only in LV/V copy: Andrew confirms before launch
  noScreen?: boolean; // no recreated screen shows it: the stage stays on the moment, unmarked
  phone?: Partial<PhoneView>;
  office?: Partial<OfficeView>;
};

export type MomentId = "clockin" | "pretrip" | "load" | "leak" | "profit" | "plan" | "payroll";

export type Moment = {
  id: MomentId;
  when: string;
  title: string;
  outcome: string;
  dir: "up" | "down"; // up = field → office; down = office → field
  phone: PhoneView;
  office: OfficeView;
  features: Feature[];
};

export const MOMENTS: Moment[] = [
  {
    id: "clockin",
    when: "6:42 AM",
    title: "The crew pulls onto the job",
    outcome: "The timecard starts on the right job and cost code.",
    dir: "up",
    phone: { id: "phone-select-task", y: 300, ring: [209, 785, 173, 50] },
    office: { id: "web-dashboard", x: 345, y: 548, mark: { b: [345, 696, 1050, 62], label: "Marcus Bell · clocked in 6:42 am" } },
    features: [
      {
        id: "T1",
        label: "One-tap clock in",
        line: "Your crew starts and ends the day with one tap.",
        src: "L",
        phone: { id: "phone-home", y: 150, ring: [86, 340, 230, 230] },
      },
      {
        id: "T2",
        label: "GPS auto clock-in (optional)",
        line: "Turn on GPS auto clock-in and hours log themselves when the crew gets to the job.",
        src: "L, LV",
        office: { x: 860, y: 168, w: 560, mark: { b: [1018, 196, 42, 36], label: "Marcus, on site" } },
      },
      {
        id: "T3",
        label: "Cost codes",
        line: "Every hour lands on the right job and task, so you see exactly where time and money go.",
        src: "L",
        phone: { ring: [21, 612, 360, 56] },
        office: { mark: { b: [925, 710, 132, 34], label: "Cost code: Pipe Laying" } },
      },
      {
        id: "T4",
        label: "Machine hours",
        line: "When the crew picks a machine, its hours go on the job too.",
        src: "L, V-tab",
        phone: { ring: [21, 709, 360, 56] },
        office: { x: 640, mark: { b: [1083, 710, 176, 34], label: "CAT 320 hours on Hwy 9" } },
      },
      {
        id: "T10",
        label: "Who’s on site",
        line: "See who’s clocked in and on which job, without calling around.",
        src: "L, SS",
        office: { x: 860, y: 168, w: 560, mark: { b: [1049, 214, 42, 36], label: "Elena Ruiz, on site" } },
      },
      { id: "T2c", label: "Missed clock-outs", line: "Forgotten clock-outs get flagged for the office.", src: "V-tab", confirm: true },
    ],
  },
  {
    id: "pretrip",
    when: "6:55 AM",
    title: "A driver does the DOT pre-trip",
    outcome: "The inspection is on the truck’s record, ready for an audit.",
    dir: "up",
    phone: { id: "phone-dot", y: 30, ring: [14, 151, 374, 48] },
    office: { id: "web-equipment", x: 340, y: 150, mark: { b: [340, 340, 1056, 60], label: "Truck 1102 · inspections on file" } },
    features: [
      { id: "E4", label: "DOT pre-trips", line: "Drivers do the pre-trip on the phone. You get audit-ready DOT logs without the paper.", src: "L, V-tab" },
      {
        id: "E5",
        label: "Incident reports",
        line: "Accidents and incidents get reported from the phone with one click.",
        src: "L",
        phone: { id: "phone-reports", y: 30, ring: [21, 125, 360, 52] },
        office: { id: "web-timecards", x: 560, y: 70, mark: { b: [986, 109, 94, 38], label: "Incidents" } },
      },
      {
        id: "E6",
        label: "Safety records",
        line: "DOT and safety records are digitized and easy to search.",
        src: "L",
        office: { id: "web-timecards", x: 560, y: 70, mark: { b: [986, 109, 94, 38], label: "Incidents" } },
      },
      { id: "E7", label: "JSAs and toolbox talks", line: "Safety meetings and JSAs get logged with the job.", src: "LV" },
    ],
  },
  {
    id: "load",
    when: "9:20 AM",
    title: "A driver logs a load",
    outcome: "The ticket lands on the job’s materials.",
    dir: "up",
    phone: { id: "phone-hauling", y: 250, ring: [207, 777, 174, 41] },
    office: { id: "web-materials", x: 340, y: 150, mark: { b: [505, 271, 74, 36], label: "Hauling tickets" } },
    features: [
      { id: "H3", label: "Hauling tickets", line: "Hauling tickets move out of paper folders and onto the job.", src: "L, V" },
      {
        id: "H2",
        label: "Field usage and receipts",
        line: "Crews log the material they use and send receipts from the app.",
        src: "V-tab, V",
        phone: { id: "phone-reports", y: 180, ring: [21, 405, 360, 52] },
        office: { mark: { b: [572, 271, 80, 36], label: "Receipts" } },
      },
      {
        id: "H1",
        label: "Orders and deliveries",
        line: "One-click logging shows what’s ordered, delivered or delayed.",
        src: "L",
        office: { x: 520, mark: { b: [962, 362, 122, 44], label: "Delivered Oct 8" } },
      },
      {
        id: "H5",
        label: "Supplier list",
        line: "Suppliers live in one list, next to the orders.",
        src: "LV, SS",
        office: { mark: { b: [450, 362, 108, 44], label: "Supplier" } },
      },
      {
        id: "M3",
        label: "Billable hours and loads",
        line: "Every labor hour, machine hour and load on a job gets tracked, so nothing gets missed and everything gets paid.",
        src: "L",
        office: { x: 520, mark: { b: [868, 163, 253, 74], label: "Billable $48,600" } },
      },
      { id: "H4", label: "Fuel records", line: "Fuel gets logged and costed to the job.", src: "LV", confirm: true },
    ],
  },
  {
    id: "leak",
    when: "4:12 PM",
    title: "An operator flags a leak",
    outcome: "It’s a work order in the shop queue.",
    dir: "up",
    phone: { id: "phone-reports", y: 30, ring: [21, 195, 360, 52] },
    office: { id: "web-service-queue", x: 340, y: 150, mark: { b: [345, 280, 1050, 62], label: "CAT D6 · idler seeping oil" } },
    features: [
      { id: "E3", label: "Repair requests", line: "Operators send a service request from the phone with one click.", src: "L" },
      {
        id: "E2",
        label: "Shop queue",
        line: "Every repair and shop work order in one place, with the full history.",
        src: "L",
        office: { x: 640, mark: { b: [1176, 289, 216, 38], label: "In the shop: Doing" } },
      },
      {
        id: "E1",
        label: "Machine rates and hours",
        line: "Each machine has an hourly rate and its hours by job, so you know what it costs on every job.",
        src: "V-tab, L",
        office: { id: "web-equipment", x: 560, y: 150, mark: { b: [990, 290, 146, 36], label: "$115 an hour" } },
      },
    ],
  },
  {
    id: "profit",
    when: "5:00 PM",
    title: "The crew clocks out",
    outcome: "Every job’s profit is up to date, today.",
    dir: "up",
    phone: { id: "phone-working", y: 190, ring: [206, 620, 140, 50] },
    office: { id: "web-project-detail", x: 140, y: 372, mark: { b: [558, 383, 204, 70], label: "Profit on Hwy 9 to date" } },
    features: [
      {
        id: "M1",
        label: "Daily job profit",
        line: "Up-to-date margins every day across labor, equipment and materials, so you can fix problems before they cost you.",
        src: "L",
      },
      {
        id: "M2",
        label: "Change orders and subs",
        line: "Log subs, extras and change orders in real time.",
        src: "L",
        office: { x: 660, mark: { b: [1153, 465, 246, 142], label: "Change orders" } },
      },
      {
        id: "M5",
        label: "Owner dashboard",
        line: "Labor, material and equipment costs, active jobs and hours on one screen.",
        src: "V-tab, SS",
        office: { id: "web-dashboard", x: 340, y: 100, mark: { b: [338, 168, 258, 86], label: "Labor cost, live" } },
      },
      {
        id: "M7",
        label: "Projects board",
        line: "Every job, its status and where it is, in one view.",
        src: "SS",
        office: { id: "web-projects", x: 340, y: 290, mark: { b: [668, 492, 230, 34], label: "In progress" } },
      },
      {
        id: "M6",
        label: "Exportable reports",
        line: "Export reports for any week or year as a PDF.",
        src: "V-tab, SS",
        office: { id: "web-timecards", x: 690, y: 70, mark: { b: [1280, 104, 121, 47], label: "Export PDF" } },
      },
      {
        id: "C1",
        label: "Field notes and daily reports",
        line: "Field notes, photos and reports from the crew, organized and there when you need them.",
        src: "L",
        office: { x: 400, mark: { b: [801, 636, 98, 36], label: "Field notes" } },
      },
    ],
  },
  {
    id: "plan",
    when: "5:30 PM",
    title: "The office plans Monday",
    outcome: "Crews see where to be and which machine to take.",
    dir: "down",
    phone: { id: "phone-reports", y: 300, ring: [21, 684, 360, 52] },
    office: { id: "web-scheduling", x: 340, y: 205, mark: { b: [342, 622, 145, 61], label: "Mon · Riverside Storm Sewer" } },
    features: [
      { id: "S1", label: "Crew scheduling", line: "Assign crews, jobs and equipment without the morning scramble.", src: "V-tab" },
      {
        id: "C3",
        label: "Crew messages",
        line: "Announcements and crew messages sit next to the work, not in a group text.",
        src: "LV, L",
        office: { id: "web-messaging", x: 340, y: 150, mark: { b: [400, 258, 360, 36], label: "Crew assignments" } },
      },
      {
        id: "C2",
        label: "Project docs",
        line: "Plans, files and field notes the crew can pull up from the truck.",
        src: "L",
        office: { id: "web-project-detail", x: 400, y: 372, mark: { b: [709, 636, 99, 36], label: "Documents" } },
      },
      {
        id: "G1",
        label: "Sales pipeline",
        line: "Leads, bids and customers in the same place you run the work.",
        src: "V-tab, LV",
        office: { id: "web-pipeline", x: 340, y: 150, mark: { b: [912, 340, 220, 34], label: "Proposal sent" } },
      },
      {
        id: "G2",
        label: "Bids from real costs",
        line: "Use real job data to make sharper bids without cutting into profit.",
        src: "L",
        office: { id: "web-project-detail", x: 140, y: 372, mark: { b: [138, 465, 244, 142], label: "Labor: budget vs spent" } },
      },
      { id: "G3", label: "Won bid to job", line: "A won bid turns into a job without typing it again.", src: "V-tab", confirm: true },
    ],
  },
  {
    id: "payroll",
    when: "Friday",
    title: "Payroll day",
    outcome: "From crew hours to payroll without the Friday scramble.",
    dir: "up",
    phone: { id: "phone-summary", y: 40, ring: [33, 258, 336, 50] },
    office: { id: "web-timecards", x: 340, y: 70, mark: { b: [819, 109, 78, 38], label: "Payroll for QuickBooks" } },
    features: [
      { id: "T5", label: "Daily timecards", line: "Time is tracked daily and submitted automatically. No more chasing timecards.", src: "L" },
      {
        id: "M4",
        label: "QuickBooks payroll",
        line: "The hours your crew logs go to QuickBooks for payroll, so nobody types them twice.",
        src: "L (AMBER: mechanics to confirm)",
      },
      {
        id: "T11",
        label: "Overtime",
        line: "Overtime shows on the crew’s weekly summary before payroll goes out.",
        src: "SS",
        phone: { ring: [150, 172, 120, 48] },
      },
      {
        id: "T6",
        label: "Time-off requests",
        line: "Your crew asks for days off in the app. The office approves and plans around it.",
        src: "L",
        phone: { id: "phone-home", y: 250, ring: [82, 570, 242, 56] },
        office: { x: 0, mark: { b: [22, 200, 252, 42], label: "2 day-off requests" } },
      },
      {
        id: "T7",
        label: "Prevailing wage",
        noScreen: true,
        line: "Activity code hours are tracked by jurisdiction for prevailing wage jobs, with no manual entry.",
        src: "L",
      },
      {
        id: "T8",
        label: "Employee profiles",
        line: "One record for each person on your crew.",
        src: "V-tab, SS",
        office: { x: 0, mark: { b: [22, 200, 252, 42], label: "Workforce" } },
      },
      {
        id: "T9",
        label: "Attendance and no-shows",
        line: "See who’s on site, who’s late and who’s pulling weight. Spot patterns in sick days and no-shows.",
        src: "L",
        office: { x: 560, mark: { b: [1074, 368, 41, 33], label: "No hours logged" } },
      },
    ],
  },
];

export const FEATURE_COUNT = MOMENTS.reduce((n, m) => n + m.features.length, 0);

export const momentById = (id: MomentId) => MOMENTS.find((m) => m.id === id)!;

/** Time-of-day ground for each moment (token names in src/styles/tokens.css). */
export const MOMENT_TONE: Record<MomentId, "dawn" | "day" | "dusk" | "evening"> = {
  clockin: "dawn",
  pretrip: "dawn",
  load: "day",
  leak: "dusk",
  profit: "dusk",
  plan: "dusk",
  payroll: "evening",
};
