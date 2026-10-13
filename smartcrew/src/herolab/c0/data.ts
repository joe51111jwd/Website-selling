// Hero lab · concept 1 "Fence the Words". Copy and demo data for the prototype.
// Copy: research/features/TRUTH.md GREEN lines (the page's own H1/sub/CTA, src/content/copy.ts).
// Demo data: Cedar Ridge Earthworks (src/screens/data.ts): the Hwy 9 Culvert crew is Marcus Bell,
// Elena Ruiz, Jake Lindqvist and Andre Whitfield; the jobs are real rows of the demo account.

import { ANGLES, CTA, HERO, LOGOS, LOGO_VECTORS, type Angle } from "../../content/copy";

export { CTA, HERO, LOGOS, LOGO_VECTORS };
export type { Angle };

/** One headline line. `fence` marks the phrase the geofence stakes itself round. A fenced phrase
 * that ends the sentence drops its full stop on screen (the fence closes it; the H1's aria-label
 * keeps the whole sentence). */
export type Line = { pre?: string; fence?: string; post?: string };

export type Tone = "pos" | "neg" | "ink";
export type FlagRow = { job: string; state: string; tone: Tone };

export type AngleHero = {
  h1: string;
  sub: string;
  /** desktop: the fenced phrase sits alone on its line, so crew can walk in along its band */
  desk: Line[];
  /** phone (390 px): same rule, 4–5 short lines */
  phone: Line[];
  /** the tag tied to the fence: rows it rolls through once; it parks on the last */
  flag: FlagRow[];
  /** phone chip: one short line per row */
  chip: string[];
};

const PROFIT: FlagRow[] = [
  { job: "Hwy 9 Culvert", state: "+$4,120 today", tone: "pos" },
  { job: "Maple Ridge Subdivision", state: "+$2,310 today", tone: "pos" },
  { job: "Elm St Sewer", state: "−$860 today", tone: "neg" },
  { job: "Hwy 9 Culvert", state: "+$4,120 today", tone: "pos" },
];
const PROFIT_CHIP = ["Hwy 9 Culvert · +$4,120 today", "Maple Ridge · +$2,310 today", "Elm St Sewer · −$860 today", "Hwy 9 Culvert · +$4,120 today"];

const L = (pre: string | undefined, fence?: string, post?: string): Line => ({ pre, fence, post });

export const HEROES: Record<Angle, AngleHero> = {
  profit: {
    h1: ANGLES.profit.h1,
    sub: ANGLES.profit.sub,
    desk: [L("See what"), L(undefined, "every job"), L("is making, every day.")],
    phone: [L("See what"), L(undefined, "every job"), L("is making,"), L("every day.")],
    flag: PROFIT,
    chip: PROFIT_CHIP,
  },
  overbudget: {
    h1: ANGLES.overbudget.h1,
    sub: ANGLES.overbudget.sub,
    desk: [L("Know which jobs are"), L(undefined, "losing money"), L("before it’s too late.")],
    phone: [L("Know which"), L("jobs are"), L(undefined, "losing money"), L("before it’s"), L("too late.")],
    flag: [PROFIT[0], PROFIT[1], { job: "Riverside Storm Sewer", state: "+$1,180 today", tone: "pos" }, PROFIT[2]],
    chip: [PROFIT_CHIP[0], PROFIT_CHIP[1], "Riverside · +$1,180 today", PROFIT_CHIP[2]],
  },
  timecards: {
    h1: ANGLES.timecards.h1,
    sub: ANGLES.timecards.sub,
    desk: [L("Stop chasing"), L(undefined, "timecards")],
    phone: [L("Stop"), L("chasing"), L(undefined, "timecards")],
    flag: [
      { job: "Elena Ruiz · Pipe Laying", state: "7.5 h · Hwy 9", tone: "ink" },
      { job: "Jake Lindqvist · Backfill", state: "8.0 h · Hwy 9", tone: "ink" },
      { job: "Andre Whitfield · Pipe Laying", state: "8.5 h · Hwy 9", tone: "ink" },
      { job: "Marcus Bell · Pipe Laying", state: "8.0 h · Hwy 9", tone: "ink" },
    ],
    chip: ["Elena Ruiz · 7.5 h · Pipe Laying", "Jake Lindqvist · 8.0 h · Backfill", "Andre Whitfield · 8.5 h", "Marcus Bell · 8.0 h · Pipe Laying"],
  },
  payroll: {
    h1: ANGLES.payroll.h1,
    sub: ANGLES.payroll.sub,
    desk: [L("Payroll without the"), L(undefined, "Friday scramble")],
    phone: [L("Payroll"), L("without the"), L(undefined, "Friday scramble")],
    flag: [
      { job: "Week of Oct 5 · 16 crew", state: "612.5 h logged", tone: "ink" },
      { job: "Week of Oct 5 · 16 crew", state: "Every hour coded", tone: "ink" },
      { job: "Payroll · Week of Oct 5", state: "Sent to QuickBooks", tone: "pos" },
    ],
    chip: ["Week of Oct 5 · 612.5 h logged", "Every hour coded", "Payroll · Sent to QuickBooks"],
  },
  replace: {
    h1: ANGLES.replace.h1,
    sub: ANGLES.replace.sub,
    desk: [L("Replace your time app,"), L("your spreadsheets and the"), L(undefined, "group texts")],
    phone: [L("Replace your"), L("time app, your"), L("spreadsheets"), L("and the"), L(undefined, "group texts")],
    flag: PROFIT,
    chip: PROFIT_CHIP,
  },
};

export function readAngle(): Angle {
  try {
    const a = new URLSearchParams(location.search).get("angle");
    return a && a in HEROES ? (a as Angle) : "profit";
  } catch {
    return "profit";
  }
}

/** The Hwy 9 Culvert crew. MB is already on site (he crossed in the intro). */
export type Walker = { id: string; initials: string; name: string; time: string };
export const CREW: Walker[] = [
  { id: "mb", initials: "MB", name: "Marcus Bell", time: "6:42" },
  { id: "er", initials: "ER", name: "Elena Ruiz", time: "6:44" },
  { id: "jl", initials: "JL", name: "Jake Lindqvist", time: "6:51" },
  { id: "aw", initials: "AW", name: "Andre Whitfield", time: "6:58" },
];

export const COPY = {
  eyebrow: HERO.eyebrow,
  cta: CTA.primary,
  demo: CTA.demoLink,
  micro: ["Founding Member trial · starts with a ", "30-minute call", " with Andrew · no contract"] as const,
  demoNote: "Demo account. Names and numbers are made up.",
  cue: HERO.cue,
  usedBy: HERO.usedBy,
  nav: ["How it works", "FAQ"],
  onSite: "on site",
  /** the intro's place label, which becomes the fenced words */
  site: "Hwy 9 Culvert",
};
