/*
 * Demo dataset for the recreated SmartCrew screens. ONE fictional company, "Cedar Ridge
 * Earthworks", a 16-person dirt-work contractor. Every name, email, address and number here is
 * invented. Numbers are internally consistent:
 *  - per project: net = budget − spent per bucket; expenses = Σ spent; revenue = earned to date
 *    = (contract + approved change orders) × progress; profit = revenue − expenses;
 *  - dashboard totals are sums over projects; hours are derived from dollars at the blended
 *    rates below; timecard totals are sums of the day cells; pipeline KPIs are sums of the deals.
 * "Today" in the demo is Friday, October 9, 2026.
 *
 * Map coordinates (`map: { x, y }`) are in the MapPanel world (1600 × 1100 units), see
 * kit/MapPanel.tsx; they put each project on the right road / creek / town of that map.
 */

import type { IconName } from "./kit/Icon";

// ─────────────────────────────────────────────────────────────────────────────
// Company & calendar
// ─────────────────────────────────────────────────────────────────────────────

export const company = {
  name: "Cedar Ridge Earthworks",
  /** Owner/office login shown under the company name in the web top bar. */
  login: "office@cedarridge.example",
  town: "Cedar Ridge",
  state: "MN",
  phone: "(555) 014-2290",
  address: "4120 Quarry Rd, Cedar Ridge, MN",
} as const;

export const TODAY = {
  iso: "2026-10-09",
  weekday: "Fri",
  weekdayLong: "Friday",
  /** phone header right column, line 1 / line 2 */
  monthDay: "Oct 09",
  year: "2026",
  label: "Oct 9, 2026",
  /** current week Mon..Sun */
  weekStart: "2026-10-05",
  weekLabel: "Oct 5 - 11",
} as const;

/** Sidebar red count badges (Workforce = pending day-off requests, Equipment = open service-queue items, Reports = timecards to review = timecards.length). */
export const navBadges = { Workforce: 2, Equipment: 5, Reports: 14 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Crew
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "Owner" | "Project Manager" | "Foreman" | "Operator" | "Driver" | "Laborer" | "Pipe Layer" | "Mechanic" | "Office";
export type CrewName = "Pipe Crew" | "Grading Crew" | "Site Prep Crew" | "Trucking" | "Shop" | "Office";

export type CrewMember = {
  id: string;
  name: string;
  initials: string;
  role: Role;
  crew: CrewName;
  /** base hourly wage, USD */
  rate: number;
  phone: string;
  email: string;
  hired: string;
};

const m = (id: string, name: string, initials: string, role: Role, crew: CrewName, rate: number, phone: string, hired: string): CrewMember => ({
  id,
  name,
  initials,
  role,
  crew,
  rate,
  phone,
  email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@cedarridge.example`,
  hired,
});

export const crew: CrewMember[] = [
  m("c01", "Marcus Bell", "MB", "Foreman", "Pipe Crew", 38.5, "(555) 014-3301", "2017-04-03"),
  m("c02", "Elena Ruiz", "ER", "Operator", "Pipe Crew", 36.0, "(555) 014-3302", "2019-03-18"),
  m("c03", "Dale Hendricks", "DH", "Operator", "Grading Crew", 35.5, "(555) 014-3303", "2015-05-11"),
  m("c04", "Tomás Ortega", "TO", "Driver", "Trucking", 31.0, "(555) 014-3304", "2020-04-06"),
  m("c05", "Jake Lindqvist", "JL", "Laborer", "Pipe Crew", 26.0, "(555) 014-3305", "2023-04-24"),
  m("c06", "Andre Whitfield", "AW", "Pipe Layer", "Pipe Crew", 32.5, "(555) 014-3306", "2021-05-03"),
  m("c07", "Colin Brennan", "CB", "Driver", "Trucking", 31.0, "(555) 014-3307", "2022-03-28"),
  m("c08", "Sam Whitehorse", "SW", "Operator", "Grading Crew", 35.0, "(555) 014-3308", "2018-04-09"),
  m("c09", "Brianna Kowalski", "BK", "Laborer", "Grading Crew", 25.5, "(555) 014-3309", "2024-04-15"),
  m("c10", "Luis Delgado", "LD", "Mechanic", "Shop", 34.0, "(555) 014-3310", "2016-01-11"),
  m("c11", "Wes Tanner", "WT", "Operator", "Site Prep Crew", 34.5, "(555) 014-3311", "2019-06-17"),
  m("c12", "Kenji Mori", "KM", "Foreman", "Grading Crew", 37.5, "(555) 014-3312", "2016-03-21"),
  m("c13", "Nate Pearson", "NP", "Laborer", "Site Prep Crew", 24.5, "(555) 014-3313", "2025-04-07"),
  m("c14", "Gabe Moreno", "GM", "Driver", "Trucking", 30.5, "(555) 014-3314", "2023-05-01"),
  m("c15", "Priya Natarajan", "PN", "Project Manager", "Office", 44.0, "(555) 014-3315", "2020-08-03"),
  m("c16", "Ruth Calloway", "RC", "Office", "Office", 29.0, "(555) 014-3316", "2018-10-01"),
];

export const crewById = (id: string) => crew.find((c) => c.id === id)!;

/** The crew member whose phone the M-screens show. */
export const me = crewById("c01");

export const crews: CrewName[] = ["Pipe Crew", "Grading Crew", "Site Prep Crew", "Trucking", "Shop", "Office"];

/** Activity (cost) codes, as picked on the phone. */
export const activityCodes = [
  "Mobilization",
  "Site Clearing",
  "Excavation",
  "Pipe Laying",
  "Backfill & Compaction",
  "Grading",
  "Hauling",
  "Erosion Control",
  "Drain Tile",
  "Restoration",
  "Equipment Maintenance",
] as const;
export type ActivityCode = (typeof activityCodes)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Equipment
// ─────────────────────────────────────────────────────────────────────────────

export type Equipment = {
  /** Equipment ID column, e.g. "1102-MACK-GU713" */
  id: string;
  year: number;
  make: string;
  model: string;
  /** Category column (app wording: Dump Truck, Excavator, Packer, …) */
  category: string;
  /** friendly name used in pickers and tables */
  name: string;
  hourRate: number;
  /** hours logged this season, in minutes (Σ over the fleet = dashboard Equipment Hours) */
  minutes: number;
  status: "Active" | "In Shop" | "Inactive";
  purchasePrice: number;
  lastService: string;
  nextService: string;
  /** odometer (trucks) or hour meter reading */
  reading: number;
  notes?: string;
};

const eq = (
  id: string,
  year: number,
  make: string,
  model: string,
  category: string,
  name: string,
  hourRate: number,
  minutes: number,
  purchasePrice: number,
  lastService: string,
  nextService: string,
  reading: number,
  status: Equipment["status"] = "Active",
): Equipment => ({ id, year, make, model, category, name, hourRate, minutes, purchasePrice, lastService, nextService, reading, status });

export const equipment: Equipment[] = [
  eq("1101-MACK-GU713", 2019, "Mack", "Granite GU713", "Dump Truck", "Mack Granite #1101", 115, 13633, 168500, "2026-09-02", "2026-11-02", 148220),
  eq("1102-MACK-GU713", 2017, "Mack", "Granite GU713", "Dump Truck", "Mack Granite #1102", 115, 14830, 152000, "2026-08-21", "2026-10-21", 211640),
  eq("1103-MACK-GU713", 2021, "Mack", "Granite GU713", "Dump Truck", "Mack Granite #1103", 115, 11835, 184900, "2026-09-15", "2026-11-15", 96410),
  eq("BOMAG-BW213", 2016, "Bomag", "BW213 D-5", "Packer", "Bomag BW213 Roller", 95, 7390, 118000, "2026-07-28", "2026-10-28", 4380),
  eq("CAT-140M-01", 2014, "CAT", "140M", "Grader", "CAT 140M Grader", 150, 9485, 236000, "2026-10-05", "2027-01-05", 9810),
  eq("CAT-320-01", 2020, "CAT", "320 GC", "Excavator", "CAT 320 Excavator", 165, 16330, 214500, "2026-09-10", "2026-12-10", 5120),
  eq("CAT-336-01", 2018, "CAT", "336", "Excavator", "CAT 336 Excavator", 195, 13985, 312000, "2026-08-14", "2026-11-14", 7960),
  eq("CAT-420-01", 2015, "CAT", "420F2", "Backhoe", "CAT 420 Backhoe", 90, 6515, 98500, "2026-06-30", "2026-10-30", 8655),
  eq("CAT-950M-01", 2017, "CAT", "950M", "Loader", "CAT 950M Loader", 140, 8795, 228000, "2026-09-30", "2026-12-30", 10240),
  eq("CAT-CP-563", 2012, "CAT", "CP-563", "Packer", "CAT CP-563 Compactor", 110, 6770, 94000, "2026-08-04", "2026-11-04", 6890),
  eq("CAT-D6-01", 2019, "CAT", "D6", "Dozer", "CAT D6 Dozer", 175, 12940, 341000, "2026-09-18", "2026-12-18", 6215, "In Shop"),
  eq("KUBOTA-SVL75", 2022, "Kubota", "SVL75-2", "Track Loader", "Kubota SVL75", 85, 10250, 72400, "2026-09-08", "2026-12-08", 2410),
  eq("TALBERT-55SA", 2016, "Talbert", "55SA", "Trailer", "Talbert Lowboy", 40, 3370, 61000, "2026-05-12", "2027-05-12", 0),
  eq("CAT-305-01", 2023, "CAT", "305 CR", "Excavator", "CAT 305 Mini Ex", 75, 7915, 79800, "2026-09-22", "2026-12-22", 1305),
];

export const equipmentById = (id: string) => equipment.find((e) => e.id === id)!;

/** Counter chip on the Equipment page ("14/40 Equipment IDs"). */
export const equipmentIdUsage = { used: equipment.length, limit: 40 };

export const equipmentCategories = ["Dump Truck", "Excavator", "Dozer", "Grader", "Loader", "Track Loader", "Backhoe", "Packer", "Trailer"];

export const attachments = [
  { id: "ATT-BKT-36", name: '36" Dig Bucket', fits: "CAT 320 Excavator", category: "Bucket" },
  { id: "ATT-BKT-60D", name: '60" Ditching Bucket', fits: "CAT 336 Excavator", category: "Bucket" },
  { id: "ATT-HAMMER-H120", name: "H120 Hydraulic Hammer", fits: "CAT 336 Excavator", category: "Hammer" },
  { id: "ATT-PLATE-CMP", name: "Plate Compactor", fits: "CAT 320 Excavator", category: "Compactor" },
  { id: "ATT-MULCH-SVL", name: "Forestry Mulcher", fits: "Kubota SVL75", category: "Mulcher" },
  { id: "ATT-FORKS-950", name: "Pallet Forks", fits: "CAT 950M Loader", category: "Forks" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Projects & job costing
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = "Accepted" | "In Progress" | "On Hold" | "Completed";

export type Bucket = { budget: number; spent: number; net: number; /** spent / budget × 100 */ pct: number };

export type ChangeOrder = { no: string; title: string; /** price to the client */ amount: number; /** cost budget */ costBudget: number; status: "Approved" | "Pending"; date: string };

export type Project = {
  id: string;
  /** "#2417" */
  number: string;
  name: string;
  client: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  workingDays: { done: number; total: number };
  /** percent complete, 0–100 */
  progress: number;
  contractValue: number;
  /** earned to date = (contract + approved CO amounts) × progress */
  revenue: number;
  /** Σ spent over all buckets */
  expenses: number;
  /** revenue − expenses */
  profit: number;
  labor: Bucket;
  materials: Bucket;
  equipment: Bucket;
  other: Bucket;
  changeOrderBucket: Bucket;
  changeOrders: ChangeOrder[];
  /** labor hours to date (minutes), at the blended labor cost below */
  laborMinutes: number;
  /** overtime part of laborMinutes */
  otMinutes: number;
  /** equipment hours to date (minutes) */
  equipmentMinutes: number;
  foremanId?: string;
  crewIds: string[];
  map: { x: number; y: number };
};

/** Blended loaded labor cost per hour (wage + burden) used to turn labor $ into hours. */
export const BLENDED_LABOR_RATE = 47.15;
/** Blended equipment rate per hour used to turn equipment $ into hours. */
export const BLENDED_EQUIPMENT_RATE = 131.5;

const r2 = (n: number) => Math.round(n * 100) / 100;
const bucket = (budget: number, spent: number): Bucket => ({
  budget,
  spent,
  net: r2(budget - spent),
  pct: budget === 0 ? 0 : r2((spent / budget) * 100),
});

type ProjectSeed = {
  id: string;
  number: string;
  name: string;
  client: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  workingDays: [number, number];
  progress: number;
  contractValue: number;
  /** budgets L/M/E/O */
  budget: [number, number, number, number];
  /** spent L/M/E/O */
  spent: [number, number, number, number];
  changeOrders?: ChangeOrder[];
  coSpent?: number;
  foremanId?: string;
  crewIds: string[];
  map: { x: number; y: number };
};

function project(s: ProjectSeed): Project {
  const cos = s.changeOrders ?? [];
  const approved = cos.filter((c) => c.status === "Approved");
  const coAmount = approved.reduce((a, c) => a + c.amount, 0);
  const coBudget = approved.reduce((a, c) => a + c.costBudget, 0);
  const labor = bucket(s.budget[0], s.spent[0]);
  const materials = bucket(s.budget[1], s.spent[1]);
  const equipmentB = bucket(s.budget[2], s.spent[2]);
  const other = bucket(s.budget[3], s.spent[3]);
  const changeOrderBucket = bucket(coBudget, s.coSpent ?? 0);
  const expenses = r2(labor.spent + materials.spent + equipmentB.spent + other.spent + changeOrderBucket.spent);
  const revenue = r2(((s.contractValue + coAmount) * s.progress) / 100);
  const laborMinutes = Math.round((labor.spent / BLENDED_LABOR_RATE) * 60);
  return {
    id: s.id,
    number: s.number,
    name: s.name,
    client: s.client,
    address: s.address,
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    workingDays: { done: s.workingDays[0], total: s.workingDays[1] },
    progress: s.progress,
    contractValue: s.contractValue,
    revenue,
    expenses,
    profit: r2(revenue - expenses),
    labor,
    materials,
    equipment: equipmentB,
    other,
    changeOrderBucket,
    changeOrders: cos,
    laborMinutes,
    otMinutes: Math.round(laborMinutes * 0.087),
    equipmentMinutes: Math.round((equipmentB.spent / BLENDED_EQUIPMENT_RATE) * 60),
    foremanId: s.foremanId,
    crewIds: s.crewIds,
    map: s.map,
  };
}

export const projects: Project[] = [
  project({
    id: "p2417",
    number: "#2417",
    name: "Hwy 9 Culvert Replacement",
    client: "Hollis County Highway Dept.",
    address: "Hwy 9 at Willow Creek, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-08-17",
    endDate: "2026-11-13",
    workingDays: [38, 65],
    progress: 62,
    contractValue: 486250,
    budget: [98400, 176850, 92600, 12500],
    spent: [63180.5, 118420, 58912.75, 6240],
    changeOrders: [
      { no: "CO-01", title: "Additional rip-rap at outlet apron", amount: 23000, costBudget: 18400, status: "Approved", date: "2026-09-14" },
      { no: "CO-02", title: "Dewatering pump rental (extra 10 days)", amount: 6850, costBudget: 5480, status: "Pending", date: "2026-10-06" },
    ],
    coSpent: 11250,
    foremanId: "c01",
    crewIds: ["c01", "c02", "c05", "c06"],
    map: { x: 748, y: 190 },
  }),
  project({
    id: "p2422",
    number: "#2422",
    name: "Maple Ridge Subdivision Ph. 2",
    client: "Maple Ridge Homes LLC",
    address: "Maple Ridge Dr & 3rd Ave W, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-07-27",
    endDate: "2026-12-18",
    workingDays: [54, 104],
    progress: 41,
    contractValue: 742800,
    budget: [152300, 214600, 188450, 21000],
    spent: [61845.25, 82310.4, 79604.5, 7980],
    foremanId: "c12",
    crewIds: ["c12", "c08", "c09"],
    map: { x: 614, y: 374 },
  }),
  project({
    id: "p2409",
    number: "#2409",
    name: "Riverside Storm Sewer",
    client: "City of Millbrook",
    address: "Riverside Ave, Millbrook, MN",
    status: "In Progress",
    startDate: "2026-06-08",
    endDate: "2026-10-23",
    workingDays: [86, 98],
    progress: 88,
    contractValue: 318400,
    budget: [71200, 96500, 58300, 6800],
    spent: [66912, 100186.3, 52486.25, 5410],
    changeOrders: [{ no: "CO-01", title: "Relocate conflicting gas service", amount: 12600, costBudget: 10080, status: "Approved", date: "2026-08-03" }],
    coSpent: 9640,
    foremanId: "c01",
    crewIds: ["c06", "c04"],
    map: { x: 1205, y: 735 },
  }),
  project({
    id: "p2425",
    number: "#2425",
    name: "County Rd 14 Widening",
    client: "Hollis County Highway Dept.",
    address: "County Rd 14, mile 2.1–4.6, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-09-08",
    endDate: "2027-06-25",
    workingDays: [23, 118],
    progress: 23,
    contractValue: 612000,
    budget: [118000, 201400, 152600, 14000],
    spent: [26904.75, 38266, 37845.5, 2110],
    foremanId: "c12",
    crewIds: ["c03", "c07"],
    map: { x: 1010, y: 326 },
  }),
  project({
    id: "p2431",
    number: "#2431",
    name: "Lot 7 Site Prep",
    client: "Brightwater Builders",
    address: "Lot 7, Quarry Rd Business Park, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-09-21",
    endDate: "2026-10-16",
    workingDays: [14, 20],
    progress: 74,
    contractValue: 48600,
    budget: [9800, 6400, 21500, 900],
    spent: [7056, 4672, 16340, 450],
    foremanId: "c11",
    crewIds: ["c11", "c13"],
    map: { x: 862, y: 482 },
  }),
  project({
    id: "p2419",
    number: "#2419",
    name: "Oak Grove Pond Excavation",
    client: "Oak Grove Golf Club",
    address: "Oak Grove Lake Rd, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-09-14",
    endDate: "2026-10-30",
    workingDays: [19, 35],
    progress: 55,
    contractValue: 96400,
    budget: [18600, 4200, 50800, 2400],
    spent: [10416, 2310, 27686, 980],
    crewIds: ["c08"],
    map: { x: 1112, y: 386 },
  }),
  project({
    id: "p2430",
    number: "#2430",
    name: "Elm St Sewer Lateral Repair",
    client: "City of Cedar Ridge",
    address: "212 Elm St, Cedar Ridge, MN",
    status: "In Progress",
    startDate: "2026-10-05",
    endDate: "2026-10-14",
    workingDays: [4, 8],
    progress: 35,
    contractValue: 14800,
    budget: [4200, 2600, 4900, 300],
    spent: [1512, 1040, 1470, 0],
    crewIds: ["c06"],
    map: { x: 706, y: 452 },
  }),
  project({
    id: "p2428",
    number: "#2428",
    name: "Millbrook Water Main Ext.",
    client: "City of Millbrook",
    address: "Mill St & 5th Ave, Millbrook, MN",
    status: "Accepted",
    startDate: "2026-10-26",
    endDate: "2027-05-28",
    workingDays: [0, 86],
    progress: 0,
    contractValue: 264900,
    budget: [58400, 98700, 49800, 5000],
    spent: [0, 0, 0, 0],
    crewIds: [],
    map: { x: 1300, y: 790 },
  }),
  project({
    id: "p2426",
    number: "#2426",
    name: "North Fork Bank Stabilization",
    client: "Hollis Soil & Water District",
    address: "North Fork, Cedar River, Hollis, MN",
    status: "On Hold",
    startDate: "2026-08-31",
    endDate: "2026-11-20",
    workingDays: [6, 58],
    progress: 12,
    contractValue: 157200,
    budget: [28000, 61400, 34800, 3000],
    spent: [3360, 7980, 4176, 360],
    crewIds: [],
    map: { x: 402, y: 246 },
  }),
  project({
    id: "p2414",
    number: "#2414",
    name: "Hansen Farm Drain Tile",
    client: "Hansen, Erik",
    address: "21480 County Rd 6, Hollis, MN",
    status: "Completed",
    startDate: "2026-05-04",
    endDate: "2026-05-29",
    workingDays: [19, 19],
    progress: 100,
    contractValue: 38750,
    budget: [7900, 14200, 8600, 300],
    spent: [7512, 13886.4, 8215, 300],
    crewIds: [],
    map: { x: 405, y: 672 },
  }),
  project({
    id: "p2411",
    number: "#2411",
    name: "Fairview Elementary Parking Lot",
    client: "Fairview School District",
    address: "800 School St, Fairview, MN",
    status: "Completed",
    startDate: "2026-06-15",
    endDate: "2026-08-14",
    workingDays: [44, 45],
    progress: 100,
    contractValue: 128300,
    budget: [24600, 46900, 30400, 2000],
    spent: [25108.5, 45712, 28960, 1845],
    crewIds: [],
    map: { x: 1345, y: 222 },
  }),
  project({
    id: "p2433",
    number: "#2433",
    name: "Kessler Barn Pad & Driveway",
    client: "Kessler, Dana",
    address: "18820 210th St, Hollis, MN",
    status: "Accepted",
    startDate: "2026-10-19",
    endDate: "2026-10-30",
    workingDays: [0, 10],
    progress: 0,
    contractValue: 22450,
    budget: [4800, 7200, 6200, 200],
    spent: [0, 0, 0, 0],
    crewIds: [],
    map: { x: 520, y: 820 },
  }),
  project({
    id: "p2434",
    number: "#2434",
    name: "Cedar Ridge Trail Grading",
    client: "City of Cedar Ridge",
    address: "River Trail, Cedar Ridge, MN",
    status: "Accepted",
    startDate: "2026-11-02",
    endDate: "2026-11-25",
    workingDays: [0, 17],
    progress: 0,
    contractValue: 31900,
    budget: [7400, 8600, 9200, 400],
    spent: [0, 0, 0, 0],
    crewIds: [],
    map: { x: 640, y: 528 },
  }),
];

export const projectById = (id: string) => projects.find((p) => p.id === id)!;
export const projectStatuses: ProjectStatus[] = ["Accepted", "In Progress", "On Hold", "Completed"];

/** The project the detail / job-costing screens open. */
export const featuredProject = projectById("p2417");

const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));

export type CostCodeLine = { code: string; name: string; budget: number; spent: number };

/**
 * Hwy 9 (#2417) by cost code, the project page's Cost Codes tab: the budgets add up to the bid's
 * four buckets (L/M/E/O, $380,350) plus the approved change order's cost budget ($18,400), and
 * the spent to the project's expenses ($258,003.25). Excavation has run over; restoration hasn't
 * started.
 */
export const costCodes: CostCodeLine[] = [
  { code: "100", name: "Mobilization", budget: 14500, spent: 14180 },
  { code: "110", name: "Site Clearing", budget: 18200, spent: 17655.25 },
  { code: "200", name: "Excavation", budget: 86400, spent: 89312.5 },
  { code: "300", name: "Pipe Laying", budget: 124850, spent: 82640 },
  { code: "310", name: "Backfill & Compaction", budget: 52300, spent: 21035.75 },
  { code: "400", name: "Hauling", budget: 41600, spent: 18964.75 },
  { code: "500", name: "Erosion Control", budget: 9800, spent: 2965 },
  { code: "600", name: "Restoration", budget: 32700, spent: 0 },
  { code: "CO-01", name: "Rip-rap at outlet apron", budget: 18400, spent: 11250 },
];

/** Projects board KPI column (W2). */
export const projectTotals = {
  revenue: sum(projects.map((p) => p.revenue)),
  expenses: sum(projects.map((p) => p.expenses)),
  profit: sum(projects.map((p) => p.profit)),
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (W1)
// ─────────────────────────────────────────────────────────────────────────────

export const dashboard = {
  laborExpense: sum(projects.map((p) => p.labor.spent)),
  materialExpense: sum(projects.map((p) => p.materials.spent)),
  equipmentExpense: sum(projects.map((p) => p.equipment.spent)),
  activeProjects: projects.filter((p) => p.status === "In Progress").length,
  laborMinutes: projects.reduce((a, p) => a + p.laborMinutes, 0),
  otMinutes: projects.reduce((a, p) => a + p.otMinutes, 0),
  equipmentMinutes: projects.reduce((a, p) => a + p.equipmentMinutes, 0),
  fieldNotes: 46,
};

export type ClockIn = {
  crewId: string;
  status: "Clocked In" | "On Break";
  /** null = "Unassigned / Clocked in without task" */
  projectId: string | null;
  activity: ActivityCode | null;
  equipmentId: string | null;
  /** "6:42 AM" today */
  time: string;
  date: string;
};

const ci = (crewId: string, projectId: string | null, activity: ActivityCode | null, equipmentId: string | null, time: string, status: ClockIn["status"] = "Clocked In"): ClockIn => ({
  crewId,
  status,
  projectId,
  activity,
  equipmentId,
  time,
  date: TODAY.iso,
});

/** Who is on the clock right now (dashboard "Clock Ins" tab, map pins). */
export const clockIns: ClockIn[] = [
  ci("c01", "p2417", "Pipe Laying", "CAT-320-01", "6:42 AM"),
  ci("c02", "p2417", "Excavation", "CAT-336-01", "6:38 AM"),
  ci("c12", "p2422", "Grading", "CAT-950M-01", "6:55 AM"),
  ci("c04", "p2409", "Hauling", "1102-MACK-GU713", "6:20 AM"),
  ci("c03", "p2425", "Grading", "CAT-140M-01", "7:02 AM"),
  ci("c11", "p2431", "Site Clearing", "KUBOTA-SVL75", "7:10 AM"),
  ci("c06", "p2409", "Pipe Laying", "CAT-305-01", "6:46 AM"),
  ci("c08", "p2419", "Excavation", "CAT-420-01", "6:58 AM"),
  ci("c05", "p2417", "Erosion Control", null, "6:44 AM"),
  ci("c09", "p2422", "Backfill & Compaction", "CAT-CP-563", "7:05 AM"),
  ci("c07", "p2425", "Hauling", "1101-MACK-GU713", "6:31 AM"),
  ci("c13", "p2431", "Site Clearing", null, "7:12 AM"),
  ci("c10", null, null, null, "7:00 AM"),
];

export const activityLogs = [
  { crewId: "c04", time: "9:02 AM", text: "Logged load 6 of select fill, Riverside Storm Sewer", equipmentId: "1102-MACK-GU713" },
  { crewId: "c03", time: "8:47 AM", text: "Submitted DOT inspection for CAT 140M Grader", equipmentId: "CAT-140M-01" },
  { crewId: "c11", time: "8:21 AM", text: "Added field note with 3 photos on Lot 7 Site Prep", equipmentId: null },
  { crewId: "c12", time: "7:58 AM", text: "Started Grading on Maple Ridge Subdivision Ph. 2", equipmentId: "CAT-950M-01" },
  { crewId: "c01", time: "6:59 AM", text: "Switched to Pipe Laying on Hwy 9 Culvert Replacement", equipmentId: "CAT-320-01" },
];

export const fieldNotes = [
  { crewId: "c01", projectId: "p2417", time: "Oct 9, 2026 · 9:40 AM", text: "Second 24in RCP section set and joint wrapped. Outlet apron rip-rap tomorrow.", photos: 4 },
  { crewId: "c11", projectId: "p2431", time: "Oct 9, 2026 · 8:21 AM", text: "Clearing done on north half. Silt fence up along the east line.", photos: 3 },
  { crewId: "c12", projectId: "p2422", time: "Oct 8, 2026 · 3:55 PM", text: "Rough grade on lots 14–22 complete, ready for curb stakes.", photos: 2 },
  { crewId: "c06", projectId: "p2409", time: "Oct 8, 2026 · 2:10 PM", text: "MH-6 set and grouted. Inspector signed off on the run from MH-5.", photos: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Timecards (W4) — last full week, Mon Sep 28 – Sun Oct 4, 2026
// ─────────────────────────────────────────────────────────────────────────────

export type Timecard = {
  crewId: string;
  /** minutes per day Mon..Sun; null = no time (red ✕ "-") */
  days: (number | null)[];
  /** Σ days */
  total: number;
  overtime: number;
  status: "Pending" | "Approved";
};

const H = (h: number, mm = 0) => h * 60 + mm;
const tc = (crewId: string, days: (number | null)[], status: Timecard["status"] = "Pending"): Timecard => {
  const total = days.reduce<number>((a, d) => a + (d ?? 0), 0);
  // daily overtime over 8h + weekly over 40h, whichever is larger (simplified)
  const daily = days.reduce<number>((a, d) => a + Math.max(0, (d ?? 0) - 480), 0);
  return { crewId, days, total, overtime: Math.max(daily, total - 2400), status };
};

export const timecardWeek = { start: "2026-09-28", end: "2026-10-04", label: "Sep 28 - Oct 4" } as const;
export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const timecards: Timecard[] = [
  tc("c01", [H(9, 12), H(9, 40), H(10, 5), H(9, 18), H(8, 30), H(4, 15), null]),
  tc("c02", [H(9, 5), H(9, 35), H(9, 58), H(9, 10), H(8, 22), H(4, 10), null]),
  tc("c03", [H(10, 2), H(9, 48), H(10, 15), H(9, 30), H(8, 45), null, null]),
  tc("c04", [H(10, 30), H(10, 12), H(10, 41), H(10, 5), H(9, 20), null, null]),
  tc("c05", [H(9, 10), H(9, 38), null, H(9, 16), H(8, 28), H(4, 12), null]),
  tc("c06", [H(9, 5), H(9, 46), H(9, 57), H(9, 24), H(8, 36), H(4, 10), null]),
  tc("c07", [H(10, 22), H(10, 5), H(10, 34), H(9, 58), H(9, 12), null, null]),
  tc("c08", [H(9, 46), H(9, 30), H(9, 52), H(9, 25), H(8, 40), null, null]),
  tc("c09", [H(8, 50), H(9, 4), H(9, 21), H(8, 57), H(8, 10), null, null]),
  tc("c10", [H(8, 30), H(8, 30), H(8, 45), H(8, 30), H(8), H(3, 30), null]),
  tc("c11", [H(9, 35), H(9, 50), H(10, 8), H(9, 42), H(8, 55), null, null]),
  tc("c12", [H(10, 5), H(9, 52), H(10, 20), H(9, 40), H(8, 50), null, null]),
  tc("c13", [H(9, 28), H(9, 44), H(10, 2), H(9, 36), H(8, 47), null, null]),
  tc("c14", [H(10, 10), H(9, 55), H(10, 26), H(9, 48), H(9, 6), null, null]),
];

// ─────────────────────────────────────────────────────────────────────────────
// Service queue, inspections, service records
// ─────────────────────────────────────────────────────────────────────────────

export type Urgency = "Low" | "Medium" | "High";
export type QueueStatus = "Todo" | "Doing" | "Done";

export type ServiceItem = {
  id: string;
  equipmentId: string;
  /** reported by */
  crewId: string;
  /** "Oct 8 2026, 4:12 PM" */
  updated: string;
  urgency: Urgency;
  status: QueueStatus;
  issue: string;
};

export const serviceQueue: ServiceItem[] = [
  { id: "sq-118", equipmentId: "CAT-D6-01", crewId: "c03", updated: "Oct 8 2026, 4:12 PM", urgency: "High", status: "Doing", issue: "Left track tension low, idler seeping oil" },
  { id: "sq-117", equipmentId: "BOMAG-BW213", crewId: "c08", updated: "Oct 8 2026, 3:47 PM", urgency: "High", status: "Todo", issue: "Vibration won't engage on high amplitude" },
  { id: "sq-116", equipmentId: "1102-MACK-GU713", crewId: "c04", updated: "Oct 8 2026, 3:40 PM", urgency: "Medium", status: "Todo", issue: "Air dryer purge valve leaking" },
  { id: "sq-115", equipmentId: "KUBOTA-SVL75", crewId: "c11", updated: "Oct 7 2026, 5:05 PM", urgency: "Medium", status: "Todo", issue: "Bucket cutting edge worn, replace" },
  { id: "sq-114", equipmentId: "CAT-320-01", crewId: "c02", updated: "Oct 7 2026, 4:18 PM", urgency: "Low", status: "Todo", issue: "Cab door latch sticking" },
  { id: "sq-113", equipmentId: "CAT-140M-01", crewId: "c10", updated: "Oct 5 2026, 11:30 AM", urgency: "Low", status: "Done", issue: "250-hour service" },
  { id: "sq-112", equipmentId: "1101-MACK-GU713", crewId: "c07", updated: "Oct 2 2026, 2:15 PM", urgency: "Medium", status: "Done", issue: "Tarp motor not retracting" },
  { id: "sq-111", equipmentId: "CAT-950M-01", crewId: "c10", updated: "Sep 30 2026, 9:40 AM", urgency: "Low", status: "Done", issue: "Grease all fittings, replace cab filter" },
  { id: "sq-110", equipmentId: "CAT-336-01", crewId: "c02", updated: "Sep 29 2026, 3:22 PM", urgency: "High", status: "Done", issue: "Hydraulic hose chafed at boom" },
];

export type Inspection = {
  id: string;
  equipmentId: string;
  crewId: string;
  /** "8 October 2026; 6:12 AM" */
  date: string;
  checklist: "DOT" | "Pre-Trip" | "Post-Trip";
  /** odometer / hour reading */
  reading: number;
  maintenance: "Linked" | "Unlinked";
  status: "Pending" | "Approved" | "Defect Found";
  defective: boolean;
  trailer: string;
};

export const inspections: Inspection[] = [
  { id: "in-301", equipmentId: "1102-MACK-GU713", crewId: "c04", date: "9 October 2026; 6:08 AM", checklist: "DOT", reading: 211640, maintenance: "Linked", status: "Defect Found", defective: true, trailer: "No Trailer" },
  { id: "in-300", equipmentId: "1101-MACK-GU713", crewId: "c07", date: "9 October 2026; 6:14 AM", checklist: "DOT", reading: 148220, maintenance: "Unlinked", status: "Pending", defective: false, trailer: "No Trailer" },
  { id: "in-299", equipmentId: "1103-MACK-GU713", crewId: "c14", date: "8 October 2026; 6:05 AM", checklist: "DOT", reading: 96376, maintenance: "Unlinked", status: "Approved", defective: false, trailer: "TR-55 Lowboy" },
  { id: "in-298", equipmentId: "1102-MACK-GU713", crewId: "c04", date: "8 October 2026; 6:11 AM", checklist: "DOT", reading: 211488, maintenance: "Unlinked", status: "Approved", defective: false, trailer: "No Trailer" },
  { id: "in-297", equipmentId: "1101-MACK-GU713", crewId: "c07", date: "7 October 2026; 6:20 AM", checklist: "DOT", reading: 148061, maintenance: "Unlinked", status: "Approved", defective: false, trailer: "No Trailer" },
];

export const serviceRecords = [
  { equipmentId: "CAT-140M-01", date: "2026-10-05", type: "250-hr service", by: "c10", cost: 642.18, hours: 9810 },
  { equipmentId: "1101-MACK-GU713", date: "2026-10-02", type: "Tarp motor replaced", by: "c10", cost: 418.9, hours: 148004 },
  { equipmentId: "CAT-950M-01", date: "2026-09-30", type: "Grease + cab filter", by: "c10", cost: 96.4, hours: 10198 },
  { equipmentId: "CAT-336-01", date: "2026-09-29", type: "Boom hose replaced", by: "c10", cost: 388.75, hours: 7921 },
  { equipmentId: "CAT-D6-01", date: "2026-09-18", type: "500-hr service", by: "c10", cost: 1184.6, hours: 6102 },
];

export type ServiceLogEntry = {
  date: string;
  work: string;
  type: "Repair" | "Maintenance";
  /** hour meter at the service */
  meter: number;
  /** time to complete, minutes */
  took: number;
  cost: number;
  provider: string;
};

/**
 * The machine page (W13): the CAT D6, in the shop since Dale flagged the idler (sq-118, still
 * Doing, so not in the log yet), with its service records newest first. The 500-hr service is
 * serviceRecords' D6 row; hour meters run back from its reading (equipment.reading).
 */
export const machine = {
  equipmentId: "CAT-D6-01",
  serial: "KZB04217",
  costRate: 128,
  notes: "In the shop since Oct 8: left track tension low, idler seeping oil. Seal kit ordered, Luis on it.",
  log: [
    { date: "2026-09-18", work: "500-hr service", type: "Maintenance", meter: 6102, took: 330, cost: 1184.6, provider: "Luis Delgado (shop)" },
    { date: "2026-08-27", work: "Cutting edge and end bits replaced", type: "Repair", meter: 5991, took: 195, cost: 2436, provider: "Luis Delgado (shop)" },
    { date: "2026-07-14", work: "A/C compressor replaced", type: "Repair", meter: 5893, took: 400, cost: 3912.5, provider: "Hollis Diesel & Hydraulics" },
    { date: "2026-06-22", work: "250-hr service", type: "Maintenance", meter: 5852, took: 165, cost: 612.3, provider: "Luis Delgado (shop)" },
    { date: "2026-05-04", work: "Undercarriage inspection", type: "Maintenance", meter: 5741, took: 90, cost: 180, provider: "Luis Delgado (shop)" },
    { date: "2026-03-30", work: "Ripper cylinder hose replaced", type: "Repair", meter: 5668, took: 130, cost: 486.75, provider: "Hollis Diesel & Hydraulics" },
  ] as ServiceLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Materials (W8), hauling (M7), receipts
// ─────────────────────────────────────────────────────────────────────────────

export const vendors = [
  { id: "v1", name: "North Star Aggregates", contact: "Lisa Brandt", phone: "(555) 014-7720", category: "Aggregates" },
  { id: "v2", name: "Prairie Pipe & Supply", contact: "Doug Hamre", phone: "(555) 014-7731", category: "Pipe & Fittings" },
  { id: "v3", name: "Hollis Sand & Gravel", contact: "Terry Vang", phone: "(555) 014-7745", category: "Fill & Sand" },
  { id: "v4", name: "Midland Precast", contact: "Joanne Klein", phone: "(555) 014-7758", category: "Precast Structures" },
  { id: "v5", name: "Tri-County Fuel", contact: "Rick Olander", phone: "(555) 014-7762", category: "Fuel" },
  { id: "v6", name: "Ridgeway Erosion Supply", contact: "Mara Quist", phone: "(555) 014-7779", category: "Erosion Control" },
];
export const vendorById = (id: string) => vendors.find((v) => v.id === id)!;

export type MaterialOrder = {
  id: string;
  projectId: string;
  vendorId: string;
  material: string;
  quantity: number;
  unit: string;
  unitCost: number;
  /** quantity × unitCost */
  total: number;
  class: string;
  delivery: string;
  billable: boolean;
  paid: boolean;
};

const mo = (id: string, projectId: string, vendorId: string, material: string, quantity: number, unit: string, unitCost: number, cls: string, delivery: string, billable: boolean, paid: boolean): MaterialOrder => ({
  id,
  projectId,
  vendorId,
  material,
  quantity,
  unit,
  unitCost,
  total: r2(quantity * unitCost),
  class: cls,
  delivery,
  billable,
  paid,
});

export const materialOrders: MaterialOrder[] = [
  mo("mo-0418", "p2417", "v2", "24in RCP Class III pipe", 96, "LF", 64.5, "Pipe", "2026-09-30", true, true),
  mo("mo-0421", "p2417", "v1", "#57 stone", 180, "Ton", 27.8, "Aggregate", "2026-10-02", true, false),
  mo("mo-0424", "p2417", "v1", "Rip-rap, Class III", 140, "Ton", 41.5, "Aggregate", "2026-10-08", true, false),
  mo("mo-0416", "p2422", "v3", "Select fill", 1250, "CY", 9.4, "Fill", "2026-09-28", true, true),
  mo("mo-0412", "p2409", "v4", "48in precast manhole", 4, "EA", 2860, "Structures", "2026-09-22", true, true),
  mo("mo-0419", "p2409", "v2", "15in RCP pipe", 220, "LF", 38.2, "Pipe", "2026-10-01", true, false),
  mo("mo-0423", "p2431", "v6", "Silt fence, 100 ft roll", 12, "Roll", 186, "Erosion Control", "2026-09-23", false, true),
  mo("mo-0425", "p2425", "v1", "Class 5 aggregate base", 420, "Ton", 14.6, "Aggregate", "2026-10-07", false, false),
];

export const materialTotals = {
  orders: materialOrders.length,
  totalCost: sum(materialOrders.map((o) => o.total)),
  billable: sum(materialOrders.filter((o) => o.billable).map((o) => o.total)),
  nonBillable: sum(materialOrders.filter((o) => !o.billable).map((o) => o.total)),
};

export const fieldUsage = [
  { projectId: "p2417", material: "#57 stone", quantity: 64, unit: "Ton", crewId: "c01", date: "2026-10-08" },
  { projectId: "p2417", material: "24in RCP Class III pipe", quantity: 32, unit: "LF", crewId: "c06", date: "2026-10-08" },
  { projectId: "p2422", material: "Select fill", quantity: 310, unit: "CY", crewId: "c12", date: "2026-10-07" },
  { projectId: "p2409", material: "15in RCP pipe", quantity: 48, unit: "LF", crewId: "c06", date: "2026-10-07" },
];

export type HaulingLog = {
  id: string;
  date: string;
  equipmentId: string;
  crewId: string;
  projectId: string;
  type: "Import" | "Export";
  material: string;
  loads: number;
  /** tons hauled */
  tons: number;
  location: string;
};

export const haulingLogs: HaulingLog[] = [
  { id: "hl-882", date: "2026-10-09", equipmentId: "1102-MACK-GU713", crewId: "c04", projectId: "p2409", type: "Import", material: "Select fill", loads: 6, tons: 99, location: "Hollis Sand & Gravel pit" },
  { id: "hl-881", date: "2026-10-09", equipmentId: "1101-MACK-GU713", crewId: "c07", projectId: "p2425", type: "Export", material: "Topsoil", loads: 5, tons: 80, location: "Cedar Ridge Earthworks yard" },
  { id: "hl-880", date: "2026-10-08", equipmentId: "1103-MACK-GU713", crewId: "c14", projectId: "p2417", type: "Import", material: "Rip-rap, Class III", loads: 7, tons: 140, location: "North Star Aggregates, Pit 2" },
  { id: "hl-879", date: "2026-10-08", equipmentId: "1102-MACK-GU713", crewId: "c04", projectId: "p2409", type: "Export", material: "Excavated spoils", loads: 8, tons: 128, location: "Millbrook compost site" },
  { id: "hl-878", date: "2026-10-07", equipmentId: "1101-MACK-GU713", crewId: "c07", projectId: "p2422", type: "Import", material: "Select fill", loads: 9, tons: 151, location: "Hollis Sand & Gravel pit" },
];

export const receipts = [
  { id: "rc-221", date: "2026-10-08", crewId: "c01", vendor: "Cedar Ridge Hardware", category: "Small tools", amount: 84.37, projectId: "p2417" },
  { id: "rc-220", date: "2026-10-07", crewId: "c10", vendor: "Tri-County Fuel", category: "Fuel", amount: 412.6, projectId: null },
  { id: "rc-219", date: "2026-10-06", crewId: "c12", vendor: "Valley Rental", category: "Rental", amount: 265.0, projectId: "p2422" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Scheduling (W9) — October 2026 month view (Mon Sep 28 … Sun Nov 1)
// ─────────────────────────────────────────────────────────────────────────────

export type ScheduleBlock = {
  id: string;
  date: string;
  start: string;
  end: string;
  projectId: string;
  /** block title (the project name) */
  title: string;
  activity: ActivityCode;
  crewIds: string[];
};

const schedulePlan: { projectId: string; from: string; to: string; start: string; end: string; activity: ActivityCode; crewIds: string[] }[] = [
  { projectId: "p2417", from: "2026-09-28", to: "2026-10-30", start: "7:00 AM", end: "3:30 PM", activity: "Pipe Laying", crewIds: ["c01", "c02", "c05", "c06"] },
  { projectId: "p2422", from: "2026-09-28", to: "2026-10-30", start: "7:00 AM", end: "4:00 PM", activity: "Grading", crewIds: ["c12", "c08", "c09"] },
  { projectId: "p2409", from: "2026-09-28", to: "2026-10-23", start: "6:30 AM", end: "3:00 PM", activity: "Pipe Laying", crewIds: ["c06", "c04"] },
  { projectId: "p2425", from: "2026-09-28", to: "2026-10-30", start: "7:00 AM", end: "3:30 PM", activity: "Grading", crewIds: ["c03", "c07"] },
  { projectId: "p2431", from: "2026-09-28", to: "2026-10-16", start: "7:30 AM", end: "4:00 PM", activity: "Site Clearing", crewIds: ["c11", "c13"] },
  { projectId: "p2430", from: "2026-10-05", to: "2026-10-14", start: "8:00 AM", end: "2:00 PM", activity: "Excavation", crewIds: ["c06"] },
  { projectId: "p2433", from: "2026-10-19", to: "2026-10-30", start: "7:30 AM", end: "4:00 PM", activity: "Grading", crewIds: ["c11", "c13"] },
  { projectId: "p2428", from: "2026-10-26", to: "2026-11-01", start: "7:00 AM", end: "3:30 PM", activity: "Mobilization", crewIds: ["c06", "c04", "c14"] },
];

function isoAdd(iso: string, days: number) {
  const [y, mo_, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo_ - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export const scheduleBlocks: ScheduleBlock[] = (() => {
  const out: ScheduleBlock[] = [];
  for (let i = 0; i < 35; i++) {
    const date = isoAdd("2026-09-28", i);
    const dow = i % 7; // 0 = Mon
    if (dow >= 5) continue; // crews off weekends (Sat makeup days excluded from the plan)
    for (const p of schedulePlan) {
      if (date >= p.from && date <= p.to) {
        out.push({ id: `sb-${date}-${p.projectId}`, date, start: p.start, end: p.end, projectId: p.projectId, title: projectById(p.projectId).name, activity: p.activity, crewIds: p.crewIds });
      }
    }
  }
  return out;
})();

export const scheduleMonth = { label: "October 2026", gridStart: "2026-09-28", weeks: 5, month: 10 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Sales pipeline (W10) & customers (W11)
// ─────────────────────────────────────────────────────────────────────────────

export type DealStage = "Leads" | "In Progress" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
export type Deal = { id: string; name: string; company: string; value: number; close: string; stage: DealStage; notes: string | null; ownerId: string };

export const dealStages: DealStage[] = ["Leads", "In Progress", "Proposal Sent", "Negotiation"];

export const deals: Deal[] = [
  { id: "d-61", name: "Greenway Trail Phase 3", company: "City of Cedar Ridge", value: 138600, close: "2027-02-15", stage: "Leads", notes: "Bid opening in January", ownerId: "c15" },
  { id: "d-62", name: "Lakeview Church Parking Expansion", company: "Lakeview Community Church", value: 72300, close: "2026-12-11", stage: "Leads", notes: null, ownerId: "c15" },
  { id: "d-63", name: "Millbrook Industrial Park Lot 3", company: "Millbrook EDA", value: 195000, close: "2026-11-30", stage: "In Progress", notes: "Takeoff from civil set rev B", ownerId: "c15" },
  { id: "d-64", name: "Pine Hollow Pond Dredging", company: "Pine Hollow HOA", value: 54800, close: "2026-11-13", stage: "In Progress", notes: "Site walk Oct 14", ownerId: "c15" },
  { id: "d-65", name: "Hollis Co. Culvert Package 2027", company: "Hollis County Highway Dept.", value: 268500, close: "2026-12-04", stage: "Proposal Sent", notes: "6 culverts, unit-price bid", ownerId: "c15" },
  { id: "d-66", name: "Sunrise Farms Drain Tile, 160 ac", company: "Sunrise Farms", value: 86400, close: "2026-10-30", stage: "Proposal Sent", notes: null, ownerId: "c15" },
  { id: "d-67", name: "Westbrook Commons Site Work", company: "Westbrook Development Group", value: 412000, close: "2026-11-20", stage: "Negotiation", notes: "Revised alternates sent Oct 6", ownerId: "c15" },
  { id: "d-58", name: "Kessler Barn Pad & Driveway", company: "Kessler, Dana", value: 22450, close: "2026-10-02", stage: "Won", notes: null, ownerId: "c15" },
  { id: "d-59", name: "Cedar Ridge Trail Grading", company: "City of Cedar Ridge", value: 31900, close: "2026-10-06", stage: "Won", notes: null, ownerId: "c15" },
];

const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
export const pipelineTotals = {
  value: openDeals.reduce((a, d) => a + d.value, 0),
  activeDeals: openDeals.length,
  wonThisMonth: deals.filter((d) => d.stage === "Won" && d.close.startsWith("2026-10")).length,
  inNegotiation: deals.filter((d) => d.stage === "Negotiation").length,
};

export type Customer = { id: string; company: string; contact: string; phone: string; email: string; projects: number; value: number };

const customerContacts: Record<string, [string, string, string]> = {
  "Hollis County Highway Dept.": ["Megan Sorensen", "(555) 014-8801", "hollisco"],
  "Maple Ridge Homes LLC": ["Tyler Haugen", "(555) 014-8812", "mapleridgehomes"],
  "City of Millbrook": ["Ray Castellano", "(555) 014-8820", "millbrook"],
  "Brightwater Builders": ["Nora Lindgren", "(555) 014-8834", "brightwater"],
  "Oak Grove Golf Club": ["Phil Dorsey", "(555) 014-8846", "oakgrovegolf"],
  "City of Cedar Ridge": ["Alicia Brooks", "(555) 014-8853", "cedarridgecity"],
  "Hollis Soil & Water District": ["Greg Thorson", "(555) 014-8861", "hollisswcd"],
  "Hansen, Erik": ["Erik Hansen", "(555) 014-8875", "hansenfarms"],
  "Fairview School District": ["Diane Kruger", "(555) 014-8883", "fairviewschools"],
  "Kessler, Dana": ["Dana Kessler", "(555) 014-8890", "kesslerfarm"],
};

export const customers: Customer[] = Object.entries(customerContacts)
  .map(([companyName, [contact, phone, domain]], i) => {
    const ps = projects.filter((p) => p.client === companyName);
    return {
      id: `cu-${i + 1}`,
      company: companyName,
      contact,
      phone,
      email: `${contact.split(" ")[0].toLowerCase()}@${domain}.example`,
      projects: ps.length,
      value: ps.reduce((a, p) => a + p.contractValue, 0),
    };
  })
  .sort((a, b) => b.value - a.value);

// ─────────────────────────────────────────────────────────────────────────────
// Messaging (W12)
// ─────────────────────────────────────────────────────────────────────────────

export type Announcement = { id: string; title: string; date: string; time: string; by: string; body: string; attachment?: { name: string; kind: "pdf" | "image"; size: string } };

export const announcements: Announcement[] = [
  {
    id: "an-41",
    title: "Crew Assignments: Week of Oct 5",
    date: "Oct 5, 2026",
    time: "6:05 AM",
    by: "office@cedarridge.example",
    // Andrew's comment-mode note, Oct 21: "Draft this message to be longer with text. right now the PDF image
    // just takes up dead space without communicating anything." The assignments are written out.
    body:
      "Here's who's where this week. Check your start time and jobsite before you head out.\n\n" +
      "Hwy 9 Culvert Replacement: Marcus Bell's crew, 6:30 AM. CAT 336 and two tandems. Flaggers on site by 6:45.\n" +
      "Maple Ridge Subdivision Ph. 2: Elena Ruiz's crew, 7:00 AM. Finish grading lots 14 to 22, then curb prep.\n" +
      "Riverside Storm Sewer: Andre Whitfield's crew, 7:00 AM. Trench box goes in before anyone's in the hole.\n" +
      "Shop: Luis Delgado on the D6 track repair. Call him before you drop off a machine.\n\n" +
      "Questions or swaps, message the office before 5 PM Sunday. Full sheet attached.",
    attachment: { name: "Crew-Assignments-Oct-5.pdf", kind: "pdf", size: "212 KB" },
  },
  {
    id: "an-40",
    title: "Hwy 9 Lane Closure: Thursday, Oct 8",
    date: "Oct 1, 2026",
    time: "4:30 PM",
    by: "office@cedarridge.example",
    body: "Southbound lane closed 7 AM to 3 PM next Thursday for culvert setting. Flaggers report to Marcus at 6:30 AM.",
  },
  {
    id: "an-39",
    title: "Toolbox Talk: Trench Safety",
    date: "Sep 28, 2026",
    time: "6:00 AM",
    by: "office@cedarridge.example",
    body: "Anything over 5 ft gets a box or a bench, no exceptions. Sign-in sheet is in the Docs tab.",
    attachment: { name: "Trench-Safety-Toolbox-Talk.pdf", kind: "pdf", size: "1.4 MB" },
  },
];

export type CrewMessage = { id: string; crewId: string; text: string; time: string; mine?: boolean };

export const crewMessages: CrewMessage[] = [
  { id: "cm-1", crewId: "c01", text: "Second culvert section is set. Need two loads of #57 stone by 7 tomorrow for bedding.", time: "9:42 AM" },
  { id: "cm-2", crewId: "c15", text: "Booked 2 loads from North Star for 7:00 and 7:40.", time: "9:51 AM", mine: true },
  { id: "cm-3", crewId: "c04", text: "Copy. I'll take both after the Riverside run.", time: "9:55 AM" },
  { id: "cm-4", crewId: "c12", text: "Maple Ridge lots 14–22 rough graded. Photos in field notes.", time: "10:08 AM" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Daily reports (W14) — today's in progress, yesterday's submitted
// ─────────────────────────────────────────────────────────────────────────────

export type DailyReport = {
  id: string;
  projectId: string;
  date: string;
  /** author (the foreman on the job that day) */
  byId: string;
  /** "4:05 PM", or null while the day is still going */
  submitted: string | null;
  crew: number;
  photos: number;
  /** the field note it leads with (fieldNotes, where there is one) */
  note: string;
};

/** The list: today's two come from today's field notes, yesterday's from Oct 8's and the logs. */
export const dailyReports: DailyReport[] = [
  { id: "dr-2417-1009", projectId: "p2417", date: "2026-10-09", byId: "c01", submitted: null, crew: 3, photos: 4, note: fieldNotes[0].text },
  { id: "dr-2431-1009", projectId: "p2431", date: "2026-10-09", byId: "c11", submitted: null, crew: 2, photos: 3, note: fieldNotes[1].text },
  { id: "dr-2417-1008", projectId: "p2417", date: "2026-10-08", byId: "c01", submitted: "4:05 PM", crew: 4, photos: 6, note: "First 24in RCP section set on bedding. Rip-rap stockpiled at the outlet. Silt fence fixed along the west ditch." },
  { id: "dr-2422-1008", projectId: "p2422", date: "2026-10-08", byId: "c12", submitted: "4:30 PM", crew: 3, photos: 2, note: fieldNotes[2].text },
  { id: "dr-2409-1008", projectId: "p2409", date: "2026-10-08", byId: "c06", submitted: "3:20 PM", crew: 2, photos: 5, note: fieldNotes[3].text },
];

/**
 * The open report: Hwy 9 on Thursday, Oct 8. Production matches that day's field usage and the
 * rip-rap haul (fieldUsage, haulingLogs hl-880); Marcus's hours are his weekly summary's Oct 8;
 * Andre went to Riverside after lunch (he wrote that job's report).
 */
export const dailyReportDetail = {
  id: "dr-2417-1008",
  weather: "41°F, overcast",
  production: [
    { item: "24in RCP Class III set", qty: "32 LF" },
    { item: "#57 stone bedding placed", qty: "64 Ton" },
    { item: "Rip-rap, Class III delivered", qty: "7 loads · 140 Ton" },
  ],
  crew: [
    { crewId: "c01", minutes: H(9, 20) },
    { crewId: "c02", minutes: H(9, 15) },
    { crewId: "c05", minutes: H(9, 10) },
    { crewId: "c06", minutes: H(5, 10) },
  ],
  equipment: [
    { equipmentId: "CAT-320-01", minutes: H(7, 40) },
    { equipmentId: "CAT-336-01", minutes: H(6, 15) },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Safety (W15) — JSAs, toolbox talks, incidents
// ─────────────────────────────────────────────────────────────────────────────

export type SafetyKind = "JSA" | "Toolbox Talk" | "Incident";
export type SafetyItem = {
  id: string;
  kind: SafetyKind;
  title: string;
  /** null = company-wide */
  projectId: string | null;
  byId: string;
  date: string;
  time: string;
  /** crew sign-offs [signed, of] (JSAs and talks) */
  signed?: [number, number];
  /** incidents: what kind */
  severity?: "Near miss" | "First aid";
  status: "Complete" | "Open" | "Closed";
};

/** Newest first. Sign-offs match who was on the job (clockIns, schedulePlan); 16 on the roster. */
export const safetyItems: SafetyItem[] = [
  { id: "sf-512", kind: "JSA", title: "Mulching near overhead power line", projectId: "p2431", byId: "c11", date: "2026-10-09", time: "7:14 AM", signed: [2, 2], status: "Complete" },
  { id: "sf-511", kind: "JSA", title: "Mass grading, lots 23–30", projectId: "p2422", byId: "c12", date: "2026-10-09", time: "6:58 AM", signed: [1, 2], status: "Open" },
  { id: "sf-510", kind: "JSA", title: "Trench work, 8 ft cut at outlet", projectId: "p2417", byId: "c01", date: "2026-10-09", time: "6:45 AM", signed: [3, 3], status: "Complete" },
  { id: "sf-509", kind: "JSA", title: "Culvert setting under lane closure", projectId: "p2417", byId: "c01", date: "2026-10-08", time: "6:41 AM", signed: [4, 4], status: "Complete" },
  { id: "sf-508", kind: "Incident", title: "Unmarked drain tile hit while grading", projectId: "p2422", byId: "c12", date: "2026-10-07", time: "2:40 PM", severity: "Near miss", status: "Closed" },
  { id: "sf-507", kind: "Toolbox Talk", title: "Working around the swing radius", projectId: null, byId: "c15", date: "2026-10-05", time: "6:00 AM", signed: [15, 16], status: "Complete" },
  { id: "sf-506", kind: "Incident", title: "Hand cut on pipe gasket, first aid", projectId: "p2409", byId: "c06", date: "2026-10-02", time: "10:15 AM", severity: "First aid", status: "Closed" },
  { id: "sf-505", kind: "Toolbox Talk", title: "Trench Safety", projectId: null, byId: "c15", date: "2026-09-28", time: "6:00 AM", signed: [16, 16], status: "Complete" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Files (W16) — job files by project
// ─────────────────────────────────────────────────────────────────────────────

export type FileKind = "pdf" | "image" | "sheet";
export type JobFile = { id: string; name: string; kind: FileKind; folder: string; byId: string; date: string; size: string };

/** File count per job folder (left column), and the open job's folders (they add up to its count). */
export const fileFolders = {
  jobs: [
    { projectId: "p2417", files: 38 },
    { projectId: "p2422", files: 52 },
    { projectId: "p2409", files: 61 },
    { projectId: "p2425", files: 24 },
    { projectId: "p2431", files: 11 },
  ],
  company: 17,
  open: "p2417",
  folders: [
    { name: "Plans", files: 6 },
    { name: "Photos", files: 24 },
    { name: "Permits", files: 3 },
    { name: "Change Orders", files: 2 },
    { name: "Safety", files: 3 },
  ],
};

/** Hwy 9's newest files (the field note's photos, CO-02, the lane-closure JSA, the plan set …). */
export const jobFiles: JobFile[] = [
  { id: "f-1", name: "IMG_4471.jpg", kind: "image", folder: "Photos", byId: "c01", date: "Oct 9, 2026", size: "3.1 MB" },
  { id: "f-2", name: "IMG_4468.jpg", kind: "image", folder: "Photos", byId: "c01", date: "Oct 9, 2026", size: "2.9 MB" },
  { id: "f-3", name: "JSA - Lane closure, Oct 8.pdf", kind: "pdf", folder: "Safety", byId: "c01", date: "Oct 8, 2026", size: "248 KB" },
  { id: "f-4", name: "CO-02 Dewatering pump rental.pdf", kind: "pdf", folder: "Change Orders", byId: "c15", date: "Oct 6, 2026", size: "186 KB" },
  { id: "f-5", name: "Hwy 9 Culvert - Plan Set Rev C.pdf", kind: "pdf", folder: "Plans", byId: "c15", date: "Sep 21, 2026", size: "18.6 MB" },
  { id: "f-6", name: "Outlet apron detail.pdf", kind: "pdf", folder: "Plans", byId: "c15", date: "Sep 14, 2026", size: "2.3 MB" },
  { id: "f-7", name: "CO-01 Rip-rap at outlet apron.pdf", kind: "pdf", folder: "Change Orders", byId: "c15", date: "Sep 14, 2026", size: "204 KB" },
  { id: "f-8", name: "Quantities and bid items.xlsx", kind: "sheet", folder: "Plans", byId: "c15", date: "Aug 12, 2026", size: "96 KB" },
  { id: "f-9", name: "Hollis Co. work-in-ROW permit.pdf", kind: "pdf", folder: "Permits", byId: "c15", date: "Aug 10, 2026", size: "412 KB" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phone (M-screens) — Marcus Bell's phone, Friday Oct 9, 2026
// ─────────────────────────────────────────────────────────────────────────────

export type DayMark = "check" | "miss" | "lock" | null;

/** Home week strip Mon..Sun of the current week. */
export const phoneWeek: { date: string; day: string; label: string; mark: DayMark; today?: boolean }[] = [
  { date: "2026-10-05", day: "05", label: "MON", mark: "check" },
  { date: "2026-10-06", day: "06", label: "TUE", mark: "check" },
  { date: "2026-10-07", day: "07", label: "WED", mark: "check" },
  { date: "2026-10-08", day: "08", label: "THU", mark: "check" },
  { date: "2026-10-09", day: "09", label: "FRI", mark: null, today: true },
  { date: "2026-10-10", day: "10", label: "SAT", mark: "lock" },
  { date: "2026-10-11", day: "11", label: "SUN", mark: "lock" },
];

/** "Currently working on" card (M2) and the live variant (M2b). */
export const currentActivity = {
  projectId: "p2417",
  project: "Hwy 9 Culvert Replacement",
  projectCode: "JOB-2417",
  activity: "Pipe Laying" as ActivityCode,
  equipmentId: "CAT-320-01",
  equipment: "CAT 320 Excavator",
  /** seconds on the current task */
  taskSeconds: 2 * 3600 + 14 * 60 + 36,
  /** seconds on the clock today */
  todaySeconds: 2 * 3600 + 32 * 60 + 5,
  clockedInAt: "6:42 AM",
};

/** Options for the "Select task and project" modal (M3). */
export const taskOptions = {
  projects: projects.filter((p) => p.status === "In Progress").map((p) => ({ id: p.id, code: `JOB-${p.number.slice(1)}`, name: p.name })),
  activityCodes: [...activityCodes],
  equipment: equipment.filter((e) => e.status === "Active").map((e) => ({ id: e.id, name: e.name })),
};

export type SummaryTask = { activity: ActivityCode; start: string; end: string; equipment: string | null };
export type SummaryDay = { date: string; dow: string; label: string; minutes: number; location: string; in: string; out: string; tasks: SummaryTask[] };

/** Weekly summary (M5): Marcus, Mon–Thu of this week. */
export const weekSummary: { days: SummaryDay[]; total: number; overtime: number; averageDaily: number } = (() => {
  const days: SummaryDay[] = [
    {
      date: "2026-10-05", dow: "MON", label: "Oct 5", minutes: H(9, 10), location: "Hwy 9 Culvert Replacement", in: "06:40", out: "15:50",
      tasks: [
        { activity: "Excavation", start: "06:40", end: "11:30", equipment: "CAT 320 Excavator" },
        { activity: "Pipe Laying", start: "11:30", end: "15:50", equipment: "CAT 320 Excavator" },
      ],
    },
    {
      date: "2026-10-06", dow: "TUE", label: "Oct 6", minutes: H(9, 25), location: "Hwy 9 Culvert Replacement", in: "06:35", out: "16:00",
      tasks: [{ activity: "Pipe Laying", start: "06:35", end: "16:00", equipment: "CAT 320 Excavator" }],
    },
    {
      date: "2026-10-07", dow: "WED", label: "Oct 7", minutes: H(8, 50), location: "Riverside Storm Sewer", in: "06:45", out: "15:35",
      tasks: [
        { activity: "Backfill & Compaction", start: "06:45", end: "12:10", equipment: "CAT CP-563 Compactor" },
        { activity: "Restoration", start: "12:10", end: "15:35", equipment: null },
      ],
    },
    {
      date: "2026-10-08", dow: "THU", label: "Oct 8", minutes: H(9, 20), location: "Hwy 9 Culvert Replacement", in: "06:40", out: "16:00",
      tasks: [
        { activity: "Pipe Laying", start: "06:40", end: "12:00", equipment: "CAT 320 Excavator" },
        { activity: "Erosion Control", start: "12:00", end: "16:00", equipment: null },
      ],
    },
  ];
  const total = days.reduce((a, d) => a + d.minutes, 0); // 36h 45m
  const overtime = days.reduce((a, d) => a + Math.max(0, d.minutes - 480), 0); // 4h 45m
  return { days, total, overtime, averageDaily: Math.round(total / days.length) };
})();

/** Reports menu (M6), in app order. */
export const reportsMenu: { label: string; icon: IconName }[] = [
  { label: "Incident Report", icon: "alert" },
  { label: "Service Request", icon: "fileText" },
  { label: "Add Service Records", icon: "wrench" },
  { label: "Hauling Log Report", icon: "truck" },
  { label: "Receipts Report", icon: "receipt" },
  { label: "Service Queue", icon: "clock" },
  { label: "Field Usage Report", icon: "box" },
  { label: "DOT Inspection Report", icon: "clipboard" },
  { label: "Scheduling", icon: "calendar" },
  { label: "Day Off Request", icon: "calendarOff" },
];

/** Hauling Log form (M7) values when shown filled in. */
export const haulingForm = {
  date: "October 9th, 2026",
  equipment: "Mack Granite #1102",
  projectCategory: "Storm Sewer",
  projectNumber: "2409",
  type: "Import" as "Import" | "Export",
  location: "Hollis Sand & Gravel pit",
  notes: "6 loads select fill for trench backfill, MH-5 to MH-6.",
};

/** DOT Inspection form (M8) values. */
export const dotForm = {
  truck: "1102-MACK-GU713",
  mileage: "211,640",
  trailer: "No Trailer",
  defective: true,
  defectNote: "Air dryer purge valve leaking",
};
