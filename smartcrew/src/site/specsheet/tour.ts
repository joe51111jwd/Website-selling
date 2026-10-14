// The click-through's map of the app (SPEC_BRIEF.md): the six groups of the spec sheet (data.ts)
// as the office web app's sidebar, the real screens each one opens (src/screens), and on each
// screen the 1–4 things that matter, each named by one tool of that group.
//
// Every box is native CSS px of the recreated screen (web 1440 × 900, phone 402 × 874), measured
// from its DOM (scratchpad design/v2/scroll/spec/scripts/measure.cjs). A spot only ever names a
// tool of its own group, on the thing that shows that tool (no ⚑ tool gets a spot: those have no
// screen of their own). `dot` is where the pulsing dot sits (default: the box's top-right corner).
//
// Desktop: the office web app. `crop` cuts the screen's own sidebar away (ours replaces it): 295 px
// on the full shell, 95 px on the collapsed one (the job detail page).
// Phones: one screen per group in the 2D iPhone: the crew app where the group lives in the field,
// the office app's mobile layout (./phone screens in src/screens/phone/Office*) where it doesn't.

import type { Box } from "../../content/moments";
import type { IconName } from "../../screens/kit/Icon";
import { SPEC } from "../../content/copy";
import { CATEGORIES, type Category, type Tool } from "./data";

export type Spot = {
  tool: Tool;
  box: Box;
  dot: [x: number, y: number];
};

export type Page = {
  /** Screen id (src/screens/registry.ts, or one of this section's own phone screens). */
  screen: string;
  /** Its short name (copy.ts SPEC.screen): the page tabs and the screen reader's label. */
  name: string;
  /** Shown after the host in the browser bar. */
  path: string;
  /** Native px cut from the left (the screen's own sidebar). */
  crop: number;
  spots: Spot[];
};

export type Group = {
  cat: Category;
  icon: IconName;
  pages: Page[];
  /** The phone version's one screen. */
  phone: Page;
  /** The phone screen is the office app's mobile layout (not shown on the real site yet: ⚑). */
  officeMobile: boolean;
};

type RawSpot = [tool: string, box: Box, dot?: [number, number]];
type RawPage = { screen: string; path: string; crop?: number; spots: RawSpot[] };

// The tour slides its highlight from box to box on one screen far more often than it cuts to a
// new screen (the boss: "rather than cutting the entire screen, it just moves over the box — way
// cleaner"), so each group lives on one screen where it can (office keeps two).
const DESK: Record<string, { icon: IconName; pages: RawPage[] }> = {
  time: {
    icon: "clock",
    pages: [
      {
        screen: "web-dashboard",
        path: "dashboard",
        spots: [
          ["T2", [1021, 197, 35, 33], [1050, 200]],
          ["T10", [567, 711, 96, 32]],
          ["T3", [933, 712, 102, 30]],
          ["T4", [1085, 712, 172, 30]],
        ],
      },
    ],
  },
  costing: {
    icon: "dollarCircle",
    pages: [
      {
        screen: "web-project-detail",
        path: "projects/2417",
        crop: 95,
        spots: [
          ["M1", [561, 385, 199, 66]],
          ["M2", [1155, 467, 242, 138]],
          ["M3", [824, 740, 94, 30]],
        ],
      },
    ],
  },
  payroll: {
    icon: "cash",
    pages: [
      {
        screen: "web-timecards",
        path: "reports/timecards",
        spots: [
          ["M4", [823, 113, 70, 30]],
          ["T5", [643, 311, 412, 28]],
          ["T8", [392, 309, 146, 30]],
        ],
      },
    ],
  },
  equipment: {
    icon: "equipment",
    pages: [
      {
        screen: "web-service-queue",
        path: "equipment/service-queue",
        spots: [
          ["E3", [349, 287, 248, 40]],
          ["E2", [1203, 295, 162, 26]],
        ],
      },
    ],
  },
  materials: {
    icon: "materials",
    pages: [
      {
        screen: "web-materials",
        path: "materials",
        spots: [
          ["H3", [509, 275, 66, 28]],
          ["H2", [419, 275, 90, 28], [464, 275]],
          ["H5", [455, 372, 96, 24]],
          ["H1", [975, 372, 96, 24]],
        ],
      },
    ],
  },
  office: {
    icon: "scheduling",
    pages: [
      { screen: "web-scheduling", path: "scheduling", spots: [["S1", [346, 626, 137, 52]]] },
      { screen: "web-pipeline", path: "pipeline", spots: [["G1", [923, 383, 227, 175]]] },
    ],
  },
};

/** Phones (402 × 874). Dots sit where a thumb can tell them apart (≥ 60 native px). */
const PHONE: Record<string, RawPage> = {
  time: {
    screen: "phone-working",
    path: "",
    spots: [
      ["T1", [44, 306, 314, 60], [350, 309]],
      ["T3", [48, 405, 306, 32], [354, 412]],
      ["T4", [48, 435, 306, 32], [54, 468]],
    ],
  },
  costing: {
    screen: "phone-office-job",
    path: "",
    spots: [
      ["M1", [20, 196, 362, 112], [374, 204]],
      ["M2", [206, 436, 176, 88], [374, 444]],
      ["M3", [20, 576, 362, 46], [374, 584]],
    ],
  },
  payroll: {
    screen: "phone-summary",
    path: "",
    spots: [
      ["T11", [157, 181, 106, 48], [263, 184]],
      ["T5", [33, 258, 336, 50], [365, 262]],
    ],
  },
  equipment: {
    screen: "phone-reports",
    path: "",
    spots: [
      ["E5", [11, 116, 380, 70], [362, 151]],
      ["E3", [11, 186, 380, 70], [362, 221]],
      ["E2", [11, 465, 380, 70], [362, 500]],
      ["E4", [11, 605, 380, 70], [362, 640]],
    ],
  },
  materials: {
    screen: "phone-hauling",
    path: "",
    spots: [
      ["H5", [21, 605, 360, 48], [377, 609]],
      ["H3", [207, 777, 174, 41], [377, 781]],
    ],
  },
  office: {
    screen: "phone-office-plan",
    path: "",
    spots: [
      ["S1", [20, 236, 362, 74], [374, 244]],
      ["C3", [247, 766, 68, 60], [296, 772]],
      ["G1", [328, 766, 68, 60], [376, 772]],
    ],
  },
};

const OFFICE_MOBILE = new Set(["costing", "office"]);

function page(c: Category, r: RawPage, crop: number): Page {
  return {
    screen: r.screen,
    name: SPEC.screen[r.screen] ?? "",
    path: r.path,
    crop: r.crop ?? crop,
    spots: r.spots.map(([id, box, dot]) => {
      const tool = c.tools.find((t) => t.id === id);
      if (!tool) throw new Error(`spec tour: ${id} is not a ${c.id} tool`);
      return { tool, box, dot: dot ?? [box[0] + box[2], box[1]] };
    }),
  };
}

export const GROUPS: Group[] = CATEGORIES.map((c) => {
  const d = DESK[c.id];
  const p = PHONE[c.id];
  if (!d || !p) throw new Error(`spec tour: no screens for ${c.id}`);
  return { cat: c, icon: d.icon, pages: d.pages.map((r) => page(c, r, 295)), phone: page(c, p, 0), officeMobile: OFFICE_MOBILE.has(c.id) };
});

/** Where a tool can be seen: its group, page and spot (desktop), or null. */
export function findSpot(toolId: string): { g: number; p: number; s: number } | null {
  for (let g = 0; g < GROUPS.length; g++)
    for (let p = 0; p < GROUPS[g].pages.length; p++) {
      const s = GROUPS[g].pages[p].spots.findIndex((x) => x.tool.id === toolId);
      if (s >= 0) return { g, p, s };
    }
  return null;
}

/** The same on the phone screens. */
export function findPhoneSpot(toolId: string): { g: number; s: number } | null {
  for (let g = 0; g < GROUPS.length; g++) {
    const s = GROUPS[g].phone.spots.findIndex((x) => x.tool.id === toolId);
    if (s >= 0) return { g, s };
  }
  return null;
}

if (import.meta.env.DEV) {
  for (const g of GROUPS)
    for (const p of [...g.pages, g.phone])
      for (const s of p.spots) if (s.tool.confirm) console.warn(`[spec tour] ${s.tool.id} is a ⚑ tool on ${p.screen}`);
}
