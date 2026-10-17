// The section's map of the app: the six features (src/content/features.ts) with their tools and
// screens, the office web app's sidebar (every recreated web screen, src/screens/registry.ts),
// and on each screen its crop, the crew phone beside it, a few labelled hotspots and the in-screen
// links that make it click like the real app.
//
// Boxes are native CSS px of the recreated screens (web 1440 × 900), measured from their DOM
// (scratchpad features/scripts/measure.cjs). A hotspot's name sits just above its box (or below it,
// `place`), so it never covers the thing it names.

import type { IconName } from "../../screens/kit/Icon";
import { FEATURES, type FeatureId } from "../../content/features";
import { CATEGORIES, type Category, type Tool } from "../specsheet/data";
import shotTime from "./shots/time.webp";
import shotCosting from "./shots/costing.webp";
import shotEquipment from "./shots/equipment.webp";
import shotMaterials from "./shots/materials.webp";
import shotSales from "./shots/sales.webp";
import shotCrew from "./shots/crew.webp";

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

const META: Record<FeatureId, { icon: IconName; screen: string; tools: string[]; shot: Feature["shot"] }> = {
  time: { icon: "clock", screen: "web-dashboard", tools: ["T1", "T2", "T3", "T4", "T10", "T2c", "T5", "M4", "T11", "T7"], shot: { src: shotTime, w: 1080, h: 705 } },
  costing: { icon: "dollarCircle", screen: "web-project-detail", tools: ["M1", "M2", "M5", "M3", "M7", "M6"], shot: { src: shotCosting, w: 960, h: 627 } },
  equipment: { icon: "equipment", screen: "web-equipment", tools: ["E4", "E3", "E2", "E1", "E5", "E6", "E7"], shot: { src: shotEquipment, w: 1080, h: 705 } },
  materials: { icon: "materials", screen: "web-materials", tools: ["H3", "H2", "H1", "H5", "H4"], shot: { src: shotMaterials, w: 1080, h: 705 } },
  sales: { icon: "pipeline", screen: "web-pipeline", tools: ["G1", "G2", "G3"], shot: { src: shotSales, w: 1080, h: 705 } },
  crew: { icon: "scheduling", screen: "web-scheduling", tools: ["S1", "C3", "C2", "C1", "T6", "T8", "T9"], shot: { src: shotCrew, w: 1080, h: 705 } },
};

export const FEATURE_LIST: Feature[] = FEATURES.cards.map((c) => ({ ...c, ...META[c.id] }));
export const featureById = (id: FeatureId) => FEATURE_LIST.find((f) => f.id === id)!;

/** The office app's sidebar, top to bottom: every recreated web screen. */
export const SCREENS: ScreenDef[] = [
  {
    id: "web-dashboard",
    name: FEATURES.screens["web-dashboard"],
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
    name: FEATURES.screens["web-timecards"],
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
    name: FEATURES.screens["web-projects"],
    feature: "costing",
    icon: "projects",
    crop: 295,
    spots: spots([["M7", [666, 487, 303, 44]]]),
    links: [{ to: "web-project-detail", box: [679, 760, 278, 104] }],
  },
  {
    id: "web-project-detail",
    name: FEATURES.screens["web-project-detail"],
    feature: "costing",
    icon: "dollarCircle",
    under: "web-projects",
    crop: 95,
    spots: spots([
      ["M1", [560, 385, 199, 66]],
      ["M2", [1155, 467, 242, 138]],
      ["M3", [824, 740, 94, 30]],
    ]),
    links: [{ to: "web-projects", box: [138, 110, 74, 36] }],
  },
  {
    id: "web-equipment",
    name: FEATURES.screens["web-equipment"],
    feature: "equipment",
    icon: "equipment",
    crop: 295,
    phone: "phone-dot",
    spots: spots([
      ["E4", [348, 343, 130, 54]],
      ["E1", [990, 290, 270, 34]],
    ]),
    links: [{ to: "web-service-queue", box: [624, 180, 135, 28] }],
  },
  {
    id: "web-service-queue",
    name: FEATURES.screens["web-service-queue"],
    feature: "equipment",
    icon: "wrench",
    under: "web-equipment",
    crop: 295,
    phone: "phone-reports",
    spots: spots([
      ["E3", [348, 290, 250, 37]],
      ["E2", [1203, 295, 162, 26]],
    ]),
    links: [{ to: "web-equipment", box: [357, 180, 85, 28] }],
  },
  {
    id: "web-materials",
    name: FEATURES.screens["web-materials"],
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
    id: "web-pipeline",
    name: FEATURES.screens["web-pipeline"],
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
    id: "web-scheduling",
    name: FEATURES.screens["web-scheduling"],
    feature: "crew",
    icon: "scheduling",
    crop: 295,
    spots: spots([["S1", [346, 437, 137, 52]]]),
    links: [],
  },
  {
    id: "web-messaging",
    name: FEATURES.screens["web-messaging"],
    feature: "crew",
    icon: "messaging",
    crop: 295,
    spots: spots([
      ["C3", [359, 266, 1017, 42]],
      ["C2", [359, 357, 1017, 236]],
    ]),
    links: [],
  },
];

export const screenDef = (id: string) => SCREENS.find((s) => s.id === id)!;

/**
 * The 38 tools grouped by the six features (the "See all 38 tools" list and its walkthrough), in
 * the cards' order, each tool as the spec sheet has it (its screen, ring and one line).
 */
export const FEATURE_CATEGORIES: Category[] = FEATURE_LIST.map((f) => ({ id: f.id, name: f.name, outcome: f.line, tools: f.tools.map(tool) }));

if (import.meta.env.DEV) {
  const all = CATEGORIES.flatMap((c) => c.tools.map((t) => t.id));
  const ours = FEATURE_LIST.flatMap((f) => f.tools);
  const missing = all.filter((id) => !ours.includes(id));
  const twice = ours.filter((id, i) => ours.indexOf(id) !== i);
  if (missing.length || twice.length) console.warn("[features] tools missing / twice:", missing, twice);
}
