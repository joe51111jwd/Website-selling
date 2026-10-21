// The section's map of the app: the ten features (src/content/features.ts) with their tools and
// screens, the office web app's sidebar (every recreated web screen, src/screens/registry.ts),
// and on each screen its crop, the crew phone beside it, a few labelled hotspots and the in-screen
// links that make it click like the real app.
//
// Boxes are native CSS px of the recreated screens (web 1440 × 900), measured from their DOM
// (scratchpad features-r2/scripts/measure.cjs). A hotspot's name sits just above its box (or below
// it, `place`), so it never covers the thing it names.

import type { IconName } from "../../screens/kit/Icon";
import { FEATURES, type FeatureId } from "../../content/features";
import { CATEGORIES, type Category, type Tool } from "../specsheet/data";
import shotTime from "./shots/time.webp";
import shotCosting from "./shots/costing.webp";
import shotEquipment from "./shots/equipment.webp";
import shotDaily from "./shots/daily.webp";
import shotMaterials from "./shots/materials.webp";
import shotScheduling from "./shots/scheduling.webp";
import shotSales from "./shots/sales.webp";
import shotComms from "./shots/comms.webp";
import shotSafety from "./shots/safety.webp";
import shotFiles from "./shots/files.webp";

export type Box = [x: number, y: number, w: number, h: number];

export type Spot = { id: string; label: string; line: string; box: Box; place: "above" | "below" };
export type Link = { to: string; box: Box };
export type ScreenDef = {
  id: string;
  name: string;
  feature: FeatureId;
  icon: IconName;
  /** a page inside another (shown indented under it in the sidebar) */
  under?: string;
  /** a page reached only from inside another (a tab of it): not listed, it lights up `nav` */
  nav?: string;
  /** native px cut from the left: the screen's own sidebar (ours replaces it) */
  crop: number;
  /** the crew's phone beside the window (a phone screen id) */
  phone?: string;
  spots: Spot[];
  links: Link[];
};

export type Feature = (typeof FEATURES.cards)[number] & {
  icon: IconName;
  /** the screen the card opens in the app */
  screen: string;
  /** the tools of the 38 it carries (the walkthrough's groups) */
  tools: string[];
  /** phones: the still in the open card */
  shot: { src: string; w: number; h: number };
};

const TOOLS = new Map<string, Tool>(CATEGORIES.flatMap((c) => c.tools.map((t) => [t.id, t] as const)));
const tool = (id: string) => {
  const t = TOOLS.get(id);
  if (!t) throw new Error(`features: no tool ${id}`);
  return t;
};

/** Shorter hotspot names where the tool's own name is long. */
const SHORT: Record<string, string> = { T2: "GPS clock-in" };

type RawSpot = [id: string, box: Box, place?: Spot["place"]];
function spots(raw: RawSpot[]): Spot[] {
  return raw.map(([id, box, place = "above"]) => {
    const custom = (FEATURES.spots as Record<string, { label: string; line: string }>)[id];
    const t = custom ? null : tool(id);
    return { id, label: custom?.label ?? SHORT[id] ?? t!.label, line: custom?.line ?? t!.line, box, place };
  });
}

const SHOT = { w: 1080, h: 705 };

/** Each feature's icon, the screen its card opens, its tools of the 38 (each in exactly one) and its still. */
const META: Record<FeatureId, { icon: IconName; screen: string; tools: string[]; shot: Feature["shot"] }> = {
  time: { icon: "clock", screen: "web-dashboard", tools: ["T2", "T1", "T10", "T5", "M4", "T3", "T11", "T2c", "T7"], shot: { src: shotTime, ...SHOT } },
  costing: { icon: "dollarCircle", screen: "web-project-costcodes", tools: ["M1", "M2", "M3", "M5", "M7"], shot: { src: shotCosting, ...SHOT } },
  equipment: { icon: "equipment", screen: "web-service-queue", tools: ["E2", "E3", "E4", "E1", "T4"], shot: { src: shotEquipment, ...SHOT } },
  daily: { icon: "clipboard", screen: "web-daily-reports", tools: ["C1", "M6"], shot: { src: shotDaily, ...SHOT } },
  materials: { icon: "materials", screen: "web-materials", tools: ["H3", "H2", "H1", "H5", "H4"], shot: { src: shotMaterials, ...SHOT } },
  scheduling: { icon: "scheduling", screen: "web-scheduling", tools: ["S1", "T6", "T9"], shot: { src: shotScheduling, ...SHOT } },
  sales: { icon: "pipeline", screen: "web-pipeline", tools: ["G1", "G2", "G3"], shot: { src: shotSales, ...SHOT } },
  comms: { icon: "messaging", screen: "web-messaging", tools: ["C3", "T8"], shot: { src: shotComms, ...SHOT } },
  safety: { icon: "hardHat", screen: "web-safety", tools: ["E7", "E5", "E6"], shot: { src: shotSafety, ...SHOT } },
  files: { icon: "docs", screen: "web-files", tools: ["C2"], shot: { src: shotFiles, ...SHOT } },
};

export const FEATURE_LIST: Feature[] = FEATURES.cards.map((c) => ({ ...c, ...META[c.id] }));
export const featureById = (id: FeatureId) => FEATURE_LIST.find((f) => f.id === id)!;

const S = FEATURES.screens;

/** The office app's sidebar, top to bottom, in the cards' order: every recreated web screen. */
export const SCREENS: ScreenDef[] = [
  {
    id: "web-dashboard",
    name: S["web-dashboard"],
    feature: "time",
    icon: "home",
    crop: 295,
    phone: "phone-working",
    spots: spots([
      ["T2", [1023, 197, 32, 32]],
      ["T10", [571, 714, 88, 26]],
      ["T3", [925, 714, 100, 26]],
    ]),
    links: [{ to: "web-projects", box: [604, 263, 258, 86] }],
  },
  {
    id: "web-timecards",
    name: S["web-timecards"],
    feature: "time",
    icon: "clock",
    crop: 295,
    phone: "phone-summary",
    spots: spots([
      ["T5", [642, 309, 418, 30]],
      ["M4", [823, 113, 70, 30]],
      ["M6", [1284, 108, 113, 39]],
    ]),
    links: [],
  },
  {
    id: "web-projects",
    name: S["web-projects"],
    feature: "costing",
    icon: "projects",
    crop: 295,
    spots: spots([["M7", [666, 487, 303, 44]]]),
    links: [{ to: "web-project-costcodes", box: [679, 760, 278, 104] }],
  },
  {
    // Andrew: "click the 'Cost Code' tab on the project page … That is the shot people will want to see."
    id: "web-project-costcodes",
    name: S["web-project-costcodes"],
    feature: "costing",
    icon: "dollarCircle",
    under: "web-projects",
    crop: 95,
    spots: spots([
      ["M1", [560, 385, 199, 66]],
      ["M2", [1155, 467, 242, 138]],
      ["bidVsActual", [1110, 686, 284, 508]],
    ]),
    links: [
      { to: "web-projects", box: [138, 110, 74, 36] },
      { to: "web-project-detail", box: [157, 640, 57, 28] },
    ],
  },
  {
    // the same page on its Labor tab (the Cost Codes tab goes back)
    id: "web-project-detail",
    name: S["web-project-detail"],
    feature: "costing",
    icon: "dollarCircle",
    nav: "web-project-costcodes",
    crop: 95,
    spots: spots([
      ["M1", [560, 385, 199, 66]],
      ["M2", [1155, 467, 242, 138]],
      ["M3", [824, 740, 94, 30]],
    ]),
    links: [
      { to: "web-projects", box: [138, 110, 74, 36] },
      { to: "web-project-costcodes", box: [384, 640, 92, 28] },
    ],
  },
  {
    id: "web-equipment",
    name: S["web-equipment"],
    feature: "equipment",
    icon: "equipment",
    crop: 295,
    phone: "phone-dot",
    spots: spots([
      ["E4", [348, 343, 130, 54]],
      ["E1", [990, 290, 270, 34]],
    ]),
    links: [
      { to: "web-service-queue", box: [624, 180, 135, 28] },
      { to: "web-machine", box: [759, 180, 118, 28] },
      { to: "web-machine", box: [339, 959, 1057, 62] },
    ],
  },
  {
    // Andrew: "Lead with this screenshot on equipment page."
    id: "web-service-queue",
    name: S["web-service-queue"],
    feature: "equipment",
    icon: "wrench",
    under: "web-equipment",
    crop: 295,
    phone: "phone-reports",
    spots: spots([
      ["E3", [348, 290, 250, 37]],
      ["E2", [1203, 295, 162, 26]],
    ]),
    links: [
      { to: "web-equipment", box: [357, 180, 85, 28] },
      { to: "web-machine", box: [758, 180, 118, 28] },
      { to: "web-machine", box: [339, 277, 1057, 64] },
    ],
  },
  {
    // Andrew: "have a link to this page so people can see the service record logs"
    id: "web-machine",
    name: S["web-machine"],
    feature: "equipment",
    icon: "history",
    under: "web-equipment",
    crop: 95,
    spots: spots([
      ["E1", [579, 170, 376, 152]],
      ["E2", [1004, 369, 376, 97]],
      ["serviceLog", [139, 605, 1257, 324], "below"],
    ]),
    links: [{ to: "web-service-queue", box: [138, 110, 74, 36] }],
  },
  {
    id: "web-daily-reports",
    name: S["web-daily-reports"],
    feature: "daily",
    icon: "clipboard",
    crop: 295,
    spots: spots([
      ["production", [719, 312, 322, 104]],
      ["C1", [719, 456, 657, 77]],
    ]),
    links: [],
  },
  {
    id: "web-materials",
    name: S["web-materials"],
    feature: "materials",
    icon: "materials",
    crop: 295,
    phone: "phone-hauling",
    spots: spots([
      ["H3", [509, 275, 66, 28]],
      ["H5", [452, 368, 104, 30]],
      ["H1", [965, 368, 116, 30]],
    ]),
    links: [],
  },
  {
    id: "web-scheduling",
    name: S["web-scheduling"],
    feature: "scheduling",
    icon: "scheduling",
    crop: 295,
    spots: spots([["S1", [346, 437, 137, 52]]]),
    links: [],
  },
  {
    id: "web-pipeline",
    name: S["web-pipeline"],
    feature: "sales",
    icon: "pipeline",
    crop: 295,
    spots: spots([
      ["G1", [351, 335, 1033, 44]],
      ["bids", [923, 383, 227, 175]],
    ]),
    links: [],
  },
  {
    id: "web-messaging",
    name: S["web-messaging"],
    feature: "comms",
    icon: "messaging",
    crop: 295,
    // the crew's group chat, its channels listed (Andrew's comment-mode note, Oct 21: "Add mobile
    // view of group chat screen so peopel can see the different chat channels")
    phone: "phone-messages",
    spots: spots([
      ["C3", [359, 266, 1017, 42]],
      ["dispatch", [338, 628, 1059, 118]],
    ]),
    links: [],
  },
  {
    id: "web-safety",
    name: S["web-safety"],
    feature: "safety",
    icon: "hardHat",
    crop: 295,
    // the Incident Report form (Andrew's comment-mode note, Oct 21: "Change this screen to the
    // Incident Report Screen")
    phone: "phone-incident-report",
    spots: spots([
      ["E7", [339, 376, 1057, 224]],
      ["E5", [874, 163, 256, 86]],
    ]),
    links: [],
  },
  {
    id: "web-files",
    name: S["web-files"],
    feature: "files",
    icon: "docs",
    crop: 295,
    spots: spots([
      ["jobFiles", [640, 201, 757, 100]],
      ["C2", [641, 360, 755, 450]],
    ]),
    links: [],
  },
];

export const screenDef = (id: string) => SCREENS.find((s) => s.id === id)!;

/** The sidebar's rows: every screen but the ones reached only from inside another. */
export const NAV_SCREENS = SCREENS.filter((s) => !s.nav);

/**
 * The 38 tools grouped by the ten features (the "See all 38 tools" list and its walkthrough), in
 * the cards' order, each tool as the spec sheet has it (its screen, ring and one line).
 */
export const FEATURE_CATEGORIES: Category[] = FEATURE_LIST.map((f) => ({ id: f.id, name: f.name, outcome: f.headline, tools: f.tools.map(tool) }));

if (import.meta.env.DEV) {
  const all = CATEGORIES.flatMap((c) => c.tools.map((t) => t.id));
  const ours = FEATURE_LIST.flatMap((f) => f.tools);
  const missing = all.filter((id) => !ours.includes(id));
  const twice = ours.filter((id, i) => ours.indexOf(id) !== i);
  if (missing.length || twice.length) console.warn("[features] tools missing / twice:", missing, twice);
}
