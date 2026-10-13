// Herolab c1 · "Today's Sheet". Geometry: the intro's jobsite map (world units, the intro's
// 1600×1000 viewBox from index.html) and today's sheet laid on top of it.
//
// World features come straight from the intro (the highway, the Hwy 9 Culvert hexagon, Marcus's
// truck, Hollis pit and its haul route), so the pull-back is the same map seen from higher up.
// The other jobs are authored in DESIGN pixels of one reference layout (desktop 1440×660, phone
// 390×664) and converted to world units here; at run time everything is placed through the real
// camera, so any viewport shows the same drawing, uniformly scaled into its field.

export type Pt = [number, number];

// ─── the intro's map (index.html) ─────────────────────────────────────────────

/** Hwy 9 Culvert's geofence (index.html .t-fence). */
export const HEX: Pt[] = [
  [978, 392],
  [1148, 362],
  [1238, 428],
  [1220, 548],
  [1062, 580],
  [962, 508],
];
/** The camera's anchor for the pull-back: the middle of the Hwy 9 fence. */
export const HEX_C: Pt = [1100, 470];
/** Where Marcus's truck stops inside the fence (index.html @keyframes t-drive 100%). */
export const MB_AT: Pt = [1150, 450];

/** The highway (index.html .t-road), run on a little past both ends for the wider view. */
export const ROAD =
  "M90 1135L240 1040C303.3 1000 510 870 620 800C730 730 826.7 668 900 620C973.3 572 1018.3 540.3 1060 512C1101.7 483.7 1116.7 471.2 1150 450C1183.3 428.8 1205 416.3 1260 385C1315 353.7 1403.3 302.8 1480 262C1556.7 221.2 1680 160.3 1720 140L1990 4";

/** Hollis pit and the haul route to the culvert; the intro has one set per orientation. */
export const PIT_LAND: Pt = [600, 336];
export const HAUL_LAND = "M606 344C621.7 354 662.7 383.7 700 404C737.3 424.3 787 450.3 830 466C873 481.7 936.7 492.7 958 498";
export const PIT_PORT: Pt = [1266, 905];
export const HAUL_PORT = "M1268 896C1271.7 880 1287.3 836 1290 800C1292.7 764 1293.3 719.7 1284 680C1274.7 640.3 1242.3 581.7 1234 562";

/** The intro's camera at the end of its hold: map point (fx, fy) at the viewport centre, zoom z. */
export const INTRO_CAM = {
  land: { fx: 1010, fy: 470, z: 1.5 },
  port: { fx: 1060, fy: 547, z: 1.15 },
};

/** The three notifications, at their places (index.html .i-n1/.i-n2/.i-n3). ox/oy in px, w = card width. */
export type NoteId = "clockin" | "load" | "profit";
export const INTRO_NOTES: Record<"land" | "port", Record<NoteId, { pin: Pt; ox: (w: number) => number; oy: number }>> = {
  land: {
    clockin: { pin: [1215, 411], ox: () => 22, oy: -30 },
    load: { pin: [600, 336], ox: () => -17, oy: -80 },
    profit: { pin: [1062, 580], ox: (w) => 40 - w, oy: 16 },
  },
  port: {
    clockin: { pin: [1215, 411], ox: () => -279, oy: -132 },
    load: { pin: [1266, 905], ox: (w) => -14 - w, oy: -30 },
    profit: { pin: [1062, 580], ox: () => -170, oy: 18 },
  },
};

// ─── today's sheet: the jobs (Cedar Ridge Earthworks demo data, src/screens/data.ts) ──────────
// Who is on site is the demo's clockIns; hours on site run from each clock-in to 5:00 PM less a
// 30-minute lunch. Today's profit per job is demo data (Hwy 9's +$4,120 is the intro's card).

export type JobId = "maple" | "hwy9" | "county" | "river";
export type Job = {
  id: JobId;
  name: string;
  /** full project name, for the hover tag's title attribute */
  full: string;
  crew: string[];
  hours: number;
  /** today's profit, USD */
  profit: number;
  note?: string;
};

export const JOBS: Record<JobId, Job> = {
  maple: { id: "maple", name: "Maple Ridge Ph. 2", full: "Maple Ridge Subdivision Ph. 2", crew: ["KM", "BK"], hours: 19.0, profit: 2310 },
  hwy9: { id: "hwy9", name: "Hwy 9 Culvert", full: "Hwy 9 Culvert Replacement", crew: ["MB", "ER", "JL"], hours: 29.4, profit: 4120 },
  county: { id: "county", name: "County Rd 14", full: "County Rd 14 Widening", crew: ["DH", "CB"], hours: 19.5, profit: 910 },
  river: { id: "river", name: "Riverside Storm Sewer", full: "Riverside Storm Sewer", crew: ["TO", "AW"], hours: 19.9, profit: -860, note: "Over on labor. Caught today." },
};

// ─── the reference layouts ────────────────────────────────────────────────────

/** A reference layout: its field rect and camera, in design px. */
export type Design = {
  W: number;
  H: number;
  /** field rect: left, top, right, bottom */
  field: [number, number, number, number];
  /** where HEX_C sits, and px per world unit */
  hex: Pt;
  k: number;
};

export const DESIGN_DESK: Design = { W: 1440, H: 660, field: [12, 60, 1428, 396], hex: [520, 236], k: 0.675 };
export const DESIGN_PHONE: Design = { W: 390, H: 664, field: [8, 52, 382, 262], hex: [96, 174], k: 0.45 };

const toWorld = (d: Design) => (p: Pt): Pt => [HEX_C[0] + (p[0] - d.hex[0]) / d.k, HEX_C[1] + (p[1] - d.hex[1]) / d.k];
const D = toWorld(DESIGN_DESK);
const P = toWorld(DESIGN_PHONE);
const poly = (f: (p: Pt) => Pt, pts: Pt[]) => pts.map(f);

/** How a job's label stack (name / number / "today") sits against its anchor point. */
export type Side = "r" | "l";

export type JobPlace = {
  id: JobId;
  /** fence polygon, world */
  fence: Pt[];
  /** crew dots, world */
  crew: Pt[];
  /** the spot: the small triangle sits here (world); the label stack beside it */
  spot: Pt;
  side: Side;
  /** the leader note's end (world), if the job carries one */
  note?: Pt;
  /** inner linework (lot lines, the sewer run…), world polylines */
  detail: Pt[][];
  /** manholes and such: small circles, world */
  dots?: Pt[];
};

export type Scene = {
  jobs: JobPlace[];
  /** extra linework (county road, river), world polylines; "double" draws two hairlines */
  lines: { pts: Pt[]; kind: "double" | "single" | "river" }[];
  pit: Pt | null;
  haul: string | null;
};

/** Desktop: four jobs across the width; Hwy 9 is the intro's hexagon, the largest. */
export const SCENE_DESK: Scene = {
  pit: PIT_LAND,
  haul: HAUL_LAND,
  lines: [
    // County Rd 14, north–south across the field
    { kind: "double", pts: poly(D, [[905, 40], [922, 140], [938, 240], [944, 330], [940, 420]]) },
    // the river along Riverside Ave
    { kind: "river", pts: poly(D, [[1300, 40], [1286, 110], [1252, 170], [1232, 236], [1248, 300], [1286, 352], [1300, 420]]) },
  ],
  jobs: [
    {
      id: "maple",
      fence: poly(D, [[96, 268], [238, 262], [244, 300], [270, 304], [266, 352], [100, 356]]),
      crew: poly(D, [[146, 318], [214, 292]]),
      spot: D([244, 264]),
      side: "r",
      detail: [
        poly(D, [[106, 312], [180, 309], [236, 322], [258, 330]]),
        poly(D, [[130, 270], [131, 309]]),
        poly(D, [[160, 268], [161, 309]]),
        poly(D, [[190, 267], [190, 310]]),
        poly(D, [[214, 265], [212, 316]]),
        poly(D, [[150, 355], [151, 311]]),
        poly(D, [[200, 353], [201, 314]]),
      ],
    },
    {
      id: "hwy9",
      fence: HEX,
      crew: [MB_AT, D([500, 262]), D([566, 274])],
      spot: D([620, 214]),
      side: "r",
      // the culvert under the highway: a short pipe run across it
      detail: [poly(D, [[488, 220], [552, 270]])],
    },
    {
      id: "county",
      fence: poly(D, [[908, 112], [952, 106], [968, 316], [922, 322]]),
      crew: poly(D, [[930, 168], [946, 272]]),
      spot: D([962, 132]),
      side: "r",
      detail: [],
    },
    {
      id: "river",
      fence: poly(D, [[1112, 214], [1206, 196], [1226, 278], [1124, 298]]),
      crew: poly(D, [[1146, 252], [1190, 236]]),
      spot: D([1112, 218]),
      side: "l",
      note: D([1238, 330]),
      detail: [poly(D, [[1124, 262], [1158, 252], [1214, 240]])],
      dots: poly(D, [[1124, 262], [1158, 252], [1214, 240]]),
    },
  ],
};

/** Phone: three jobs. Hwy 9 large on the left, Maple Ridge top right, Riverside bottom right. */
export const SCENE_PHONE: Scene = {
  pit: PIT_PORT,
  haul: HAUL_PORT,
  lines: [{ kind: "river", pts: poly(P, [[382, 150], [352, 168], [318, 178], [296, 200], [290, 240], [300, 270]]) }],
  jobs: [
    {
      id: "hwy9",
      fence: HEX,
      crew: [MB_AT, P([82, 188]), P([116, 200])],
      spot: P([44, 116]),
      side: "r",
      detail: [poly(P, [[66, 160], [104, 194]])],
    },
    {
      id: "maple",
      fence: poly(P, [[300, 64], [366, 62], [370, 108], [302, 110]]),
      crew: poly(P, [[322, 90], [348, 80]]),
      spot: P([292, 72]),
      side: "l",
      detail: [poly(P, [[304, 92], [368, 90]]), poly(P, [[324, 64], [324, 91]]), poly(P, [[346, 63], [346, 90]])],
    },
    {
      id: "river",
      fence: poly(P, [[310, 196], [362, 190], [368, 238], [314, 244]]),
      crew: poly(P, [[328, 222], [350, 212]]),
      spot: P([300, 202]),
      side: "l",
      detail: [poly(P, [[318, 230], [338, 222], [360, 214]])],
      dots: poly(P, [[318, 230], [338, 222], [360, 214]]),
    },
  ],
};
