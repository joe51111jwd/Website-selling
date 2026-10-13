// The spec sheet's data: the six sections from copy.ts (SPEC.categories), each tool joined with its
// name and line from moments.ts, where it's used (field / office, per research INVENTORY.md) and the
// real screen region that shows it (the boxes measured for One Day; see moments.ts).

import { MOMENTS, type Box, type Feature, type Moment } from "../../content/moments";
import { SPEC } from "../../content/copy";
import { SIZE } from "../../screens/registry";

export type Side = "field" | "office" | "both";
export type Kind = "phone" | "web";

export type Shot = {
  screen: string;
  kind: Kind;
  /** The exact box to ring (native px). */
  ring?: Box;
  /** Where the camera looks when there is no ring (native px). */
  focus: Box;
  /** A callout pinned to the ring (moments.ts mark labels). */
  tag?: string;
};

export type Tool = {
  id: string;
  label: string;
  line: string;
  confirm: boolean;
  side: Side;
  shot: Shot;
  /** True when the tool has no screen of its own (the preview shows the closest one). */
  closest: boolean;
};

export type Category = {
  id: string;
  name: string;
  outcome: string;
  tools: Tool[];
};

/** Where each tool lives (INVENTORY.md "Side"). */
const SIDE: Record<string, Side> = {
  T1: "field", T2: "field", T2c: "office", T3: "field", T4: "field", T5: "both", T6: "both", T7: "office",
  T8: "office", T9: "office", T10: "office", T11: "both",
  M1: "office", M2: "both", M3: "office", M4: "office", M5: "office", M6: "office", M7: "office",
  S1: "both",
  H1: "office", H2: "field", H3: "field", H4: "both", H5: "office",
  E1: "office", E2: "office", E3: "field", E4: "both", E5: "field", E6: "both", E7: "field",
  C1: "both", C2: "both", C3: "both",
  G1: "office", G2: "office", G3: "office",
};

/** Which device shows it best: the crew's phone for field actions, the office screen otherwise. */
const KIND: Record<string, Kind> = {
  T1: "phone", T2: "web", T3: "phone", T4: "phone", T10: "web", T9: "web", T2c: "web",
  E4: "phone", E5: "phone", E6: "web", E7: "phone",
  H3: "phone", H2: "phone", H1: "web", H5: "web", M3: "web", H4: "web",
  E3: "phone", E2: "web", E1: "web",
  M1: "web", M2: "web", M5: "web", M7: "web", M6: "web", C1: "web",
  S1: "web", C3: "web", C2: "web", G1: "web", G2: "web", G3: "web",
  T5: "phone", M4: "web", T11: "phone", T6: "phone", T7: "web", T8: "web",
};

/** ⚑ / no-screen tools: the closest real screen, and what part of it to look at. */
const CLOSEST: Record<string, { screen: string; focus: Box }> = {
  T2c: { screen: "web-dashboard", focus: [345, 600, 520, 260] },
  E7: { screen: "phone-reports", focus: [0, 90, 402, 420] },
  H4: { screen: "web-materials", focus: [345, 330, 520, 300] },
  G3: { screen: "web-pipeline", focus: [345, 250, 560, 320] },
  T7: { screen: "web-timecards", focus: [345, 160, 560, 300] },
};

/** Camera focus boxes that read better than the bare ring (the ring stays exact). */
const FOCUS: Record<string, Box> = {
  // the hauling form around its Submit button
  H3: [0, 430, 402, 400],
  // the map around Marcus's / Elena's pins
  T2: [860, 150, 520, 300],
  T10: [860, 150, 520, 300],
};

const byId = new Map<string, { f: Feature; m: Moment }>();
for (const m of MOMENTS) for (const f of m.features) byId.set(f.id, { f, m });

function shotFor(f: Feature, m: Moment): { shot: Shot; closest: boolean } {
  const kind = KIND[f.id] ?? "web";
  const near = CLOSEST[f.id];
  if (near || f.noScreen) {
    const n = near ?? { screen: kind === "web" ? m.office.id : m.phone.id, focus: [340, 150, 640, 400] as Box };
    return { shot: { screen: n.screen, kind: n.screen.startsWith("phone") ? "phone" : "web", focus: n.focus }, closest: true };
  }
  if (kind === "phone") {
    const own = f.phone;
    const screen = own?.id ?? m.phone.id;
    const ring = own?.ring ?? (own?.id ? undefined : m.phone.ring);
    const W = SIZE.phone;
    return { shot: { screen, kind, ring, focus: FOCUS[f.id] ?? ring ?? [0, 0, W.w, W.h] }, closest: false };
  }
  const own = f.office;
  const screen = own?.id ?? m.office.id;
  const mark = own?.mark ?? (own?.id ? undefined : m.office.mark);
  return {
    shot: { screen, kind, ring: mark?.b, focus: FOCUS[f.id] ?? mark?.b ?? [340, 150, 640, 400], tag: mark?.label },
    closest: false,
  };
}

export const CATEGORIES: Category[] = SPEC.categories.map((c) => ({
  id: c.id,
  name: c.name,
  outcome: c.outcome,
  tools: c.tools.map((id) => {
    const hit = byId.get(id);
    if (!hit) throw new Error(`spec sheet: unknown feature ${id}`);
    const { f, m } = hit;
    const { shot, closest } = shotFor(f, m);
    return { id, label: f.label, line: f.line, confirm: !!f.confirm, side: SIDE[id] ?? "both", shot, closest };
  }),
}));

export const TOOL_COUNT = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

/** Every screen a category's tools use, in order (to warm their code before they're shown). */
export const screensOf = (c: Category) => [...new Set(c.tools.map((t) => t.shot.screen))];

if (import.meta.env.DEV) {
  const all = new Set(MOMENTS.flatMap((m) => m.features.map((f) => f.id)));
  const used = CATEGORIES.flatMap((c) => c.tools.map((t) => t.id));
  const missing = [...all].filter((id) => !used.includes(id));
  if (missing.length || used.length !== all.size) console.warn("[specsheet] features not on the sheet:", missing, used.length, all.size);
}
