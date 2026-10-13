// One Day, moment by moment: what is tapped, what each screen shows before and after, and how
// the office screen changes when the update lands. The camera (./poses.ts) and the screens' life
// (./rideLife.ts) read the screens from this table. (`focus` and `mark` are the v1 ride's push-ins
// and leader lines; the v2 shots set their own in ./poses.ts and ./Fx.tsx.)
//
// Native px of the screens (web 1440×900, phone 402×874), measured on the rendered screens
// (src/screens and ./states). New state screens live in public/renders/day-s (./states).

import type { MomentId } from "../../content/moments";
import type { Box } from "../../three/stage/types";
import { stateScreen } from "./states/registry";

/** How the office screen changes when the update lands. */
export type Update =
  /** a new top row: the rows under it slide down one row, the new row fades in on top */
  | { kind: "insert"; row: Box; next: number }
  /** a number ticks up in place (cell to repaint, the text's left/baseline, the card's background) */
  | { kind: "tick"; rect: Box; text: [number, number]; from: number; to: number; bg: string }
  /** a calendar block drops into its slot */
  | { kind: "block"; rect: Box; cell: Box; bg: string }
  /** row by row, "Review" flips to "Approved", then a toast */
  | { kind: "approve"; cells: Box[]; toast: Box };

export type Script = {
  id: MomentId;
  /** up = field → office (the phone acts); down = office → field (the laptop acts) */
  dir: "up" | "down";
  /** `mark`: where the phone's state shows on its "after" screen (its label's leader lands there;
   * at the sheet's right edge, level with the state line, so the dot never sits on its words) */
  phone: { before: string; after: string; tap?: Box; mark: [number, number] };
  laptop: {
    before: string;
    after: string;
    tap?: Box;
    update: Update;
    /** the push-in: the spot carried to `to` (fractions of the stage), `zoom`× */
    focus: { px: [number, number]; zoom: number; to: [number, number] };
    /** where the update card's leader line lands (native px) */
    mark: [number, number];
  };
};

const S = stateScreen;

/** The sent sheet's state line ("Load #14 logged"…): its row, at the sheet's right edge (native px). */
const MARK_SHEET: [number, number] = [378, 545];

export const SCRIPT: Script[] = [
  {
    id: "clockin",
    dir: "up",
    phone: { before: "phone-home", after: S("phone-d-clockedin"), tap: [118.5, 383.3, 165, 165], mark: [128, 287] },
    laptop: {
      before: "web-dashboard",
      after: "web-dashboard",
      update: { kind: "insert", row: [339, 694, 1057, 66], next: 760 },
      focus: { px: [640, 727], zoom: 2.2, to: [0.6, 0.62] },
      mark: [420, 727],
    },
  },
  {
    id: "pretrip",
    dir: "up",
    phone: { before: S("phone-d-dot"), after: S("phone-d-dot-sent"), tap: [207, 777.2, 174.5, 41], mark: MARK_SHEET },
    laptop: {
      before: S("web-d-inspections"),
      after: S("web-d-inspections"),
      update: { kind: "insert", row: [139, 506.8, 1257, 62], next: 568.8 },
      focus: { px: [560, 538], zoom: 2.1, to: [0.6, 0.6] },
      mark: [250, 538],
    },
  },
  {
    id: "load",
    dir: "up",
    phone: { before: S("phone-d-hauling"), after: S("phone-d-load-sent"), tap: [207, 777.2, 174.5, 41], mark: MARK_SHEET },
    laptop: {
      before: S("web-d-hauling"),
      after: S("web-d-hauling"),
      update: { kind: "insert", row: [339, 351.5, 1057, 56], next: 407.5 },
      focus: { px: [700, 380], zoom: 2.15, to: [0.6, 0.6] },
      mark: [470, 380],
    },
  },
  {
    id: "leak",
    dir: "up",
    phone: { before: S("phone-d-service"), after: S("phone-d-service-sent"), tap: [207, 777.2, 174.5, 41], mark: MARK_SHEET },
    laptop: {
      before: S("web-d-queue"),
      after: S("web-d-queue"),
      update: { kind: "insert", row: [339, 277, 1057, 63.5], next: 340.5 },
      focus: { px: [660, 309], zoom: 2.15, to: [0.6, 0.6] },
      mark: [430, 309],
    },
  },
  {
    id: "profit",
    dir: "up",
    phone: { before: S("phone-d-working-5pm"), after: S("phone-d-clockedout"), tap: [205.7, 620.1, 140, 50], mark: [120, 280] },
    laptop: {
      before: "web-project-detail",
      after: "web-project-detail",
      update: { kind: "tick", rect: [622, 411, 150, 32], text: [627.3, 433.3], from: 53611.75, to: 57731.75, bg: "#f5f5f5" },
      focus: { px: [560, 418], zoom: 2.2, to: [0.56, 0.6] },
      mark: [672, 427],
    },
  },
  {
    id: "plan",
    dir: "down",
    phone: { before: "phone-home", after: S("phone-d-plan"), mark: [150, 440] },
    laptop: {
      before: "web-scheduling",
      after: "web-scheduling",
      tap: [346, 685, 137, 52.8],
      update: { kind: "block", rect: [346, 685, 137, 52.8], cell: [339, 594, 151, 189], bg: "#ffffff" },
      focus: { px: [460, 690], zoom: 2.1, to: [0.5, 0.6] },
      mark: [414, 711],
    },
  },
  {
    id: "payroll",
    dir: "up",
    phone: { before: "phone-summary", after: S("phone-d-summary-sent"), tap: [33, 257.7, 336, 49.5], mark: [201, 283] },
    laptop: {
      before: "web-timecards",
      after: "web-timecards",
      update: {
        kind: "approve",
        cells: Array.from({ length: 8 }, (_, i) => [1250, 294.3 + i * 60.75, 110, 60.75] as Box),
        toast: [1018, 70, 404, 100],
      },
      focus: { px: [1150, 330], zoom: 1.75, to: [0.77, 0.62] },
      mark: [1304, 325],
    },
  },
];

export const scriptOf = (id: MomentId) => SCRIPT.find((s) => s.id === id)!;
