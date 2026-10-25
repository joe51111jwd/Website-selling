// Timing of the scroll story. Frames are 1-based in Blender, 0-based here.
// Scroll progress (0-1 through the pinned section) maps to a frame through
// these keys; between keys it is linear, so held frames give text time to read.

export const HERO_FRAME = 27; // blocks settled after the intro drop (Blender frame 28)
export const INTRO_FRAMES = 28;
export const STORY_VH = 1400;

export const FRAME_KEYS: [progress: number, frame: number][] = [
  [0.0, 27],
  [0.035, 30],
  [0.235, 120], // the tower grows
  [0.3, 139], // it sways
  [0.415, 187], // it falls
  [0.585, 188], // hold on the wreckage while the diagnosis lands
  [0.66, 216], // Side: align
  [0.775, 266], // Down: prune
  [0.865, 280], // Up: one block lands
  [1.0, 299], // settle on the final stack
];

export function frameAt(p: number): number {
  const k = FRAME_KEYS;
  if (p <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [p0, f0] = k[i];
    const [p1, f1] = k[i + 1];
    if (p <= p1) return f0 + ((p - p0) / (p1 - p0)) * (f1 - f0);
  }
  return k[k.length - 1][1];
}

/** inverse: the scroll progress where a frame is first shown */
export function progressAt(frame: number): number {
  const k = FRAME_KEYS;
  for (let i = 0; i < k.length - 1; i++) {
    const [p0, f0] = k[i];
    const [p1, f1] = k[i + 1];
    if (frame <= f1 && f1 !== f0) return p0 + ((frame - f0) / (f1 - f0)) * (p1 - p0);
  }
  return 1;
}

// when each labelled block lands (Blender: drop starts 32 + 6i, falls 7 frames)
export const BLOCKS = [
  { id: "hire6", label: "Hire #6" },
  { id: "slack", label: "Slack" },
  { id: "hire9", label: "Hire #9" },
  { id: "crm", label: "CRM" },
  { id: "agency", label: "Agency" },
  { id: "ops", label: "Ops lead" },
  { id: "apps", label: "43 apps" },
  { id: "hire12", label: "Hire #12" },
  { id: "sops", label: "SOPs" },
  { id: "ai", label: "AI tools" },
  { id: "burn", label: "$12K a month" },
  { id: "sku", label: "New SKU" },
  { id: "hire15", label: "Hire #15" },
  { id: "meet", label: "Meetings" },
] as const;

export const landsAt = (i: number) => 31 + 6 * i + 7; // 0-based frame

// The margin inversion, Chapter 17: Michael's illustration of what each round of hiring does.
// The panel steps through his four years as the tower grows and sways, and only ever shows his values.
export type Year = { from: number; year: string; team: number; revenue: string; margin: string; take: string; lines: number };
export const YEARS: Year[] = [
  { from: landsAt(7), year: "Year 0", team: 12, revenue: "$3M", margin: "20%", take: "$900K", lines: 66 },
  { from: landsAt(12), year: "Year 1", team: 15, revenue: "$3.5M", margin: "14%", take: "$400K", lines: 105 },
  { from: 125, year: "Year 2", team: 20, revenue: "$4M", margin: "10%", take: "$250K", lines: 190 },
  { from: 133, year: "Year 3", team: 25, revenue: "$4.2M", margin: "5%", take: "$150K", lines: 300 },
];

export function yearAt(frame: number): Year | null {
  let y: Year | null = null;
  for (const row of YEARS) if (frame >= row.from) y = row;
  return y;
}

// labels pinned to blocks in the render (names match anchors.json)
export type Callout = { anchor: string; from: number; to: number; text: string; tone?: "red" | "green" | "ink"; side?: "left" | "right" };
export const CALLOUTS: Callout[] = [
  ...BLOCKS.map((b, i) => ({ anchor: b.id, from: landsAt(i), to: landsAt(i) + 9, text: b.label, side: "right" as const })),
  { anchor: "hire12", from: 121, to: 160, text: "Twelve holds", tone: "ink", side: "right" },
  { anchor: "sops", from: 125, to: 160, text: "Past twelve", tone: "red", side: "right" },
  { anchor: "agency", from: 214, to: 228, text: "Agency: pruned", tone: "red", side: "right" },
  { anchor: "apps", from: 235, to: 249, text: "43 apps: pruned", tone: "red", side: "right" },
  { anchor: "systems", from: 275, to: 299, text: "Systems", tone: "green", side: "right" },
];

// where to keep the subject when a narrow screen crops the 16:10 frame (0-1 across)
export const FOCUS_KEYS: [frame: number, x: number][] = [
  [0, 0.63],
  [30, 0.6],
  [70, 0.46],
  [120, 0.43],
  [140, 0.48],
  [165, 0.58],
  [188, 0.5],
  [216, 0.47],
  [266, 0.47],
  [299, 0.6],
];

export function focusAt(frame: number): number {
  const k = FOCUS_KEYS;
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, x0] = k[i];
    const [f1, x1] = k[i + 1];
    if (frame <= f1) return x0 + ((frame - f0) / (f1 - f0)) * (x1 - x0);
  }
  return k[k.length - 1][1];
}

// on portrait screens, how much of the screen height the render takes (the rest is backdrop)
export function portraitScale(frame: number): number {
  if (frame <= 31) return 0.58;
  if (frame >= 70) return 0.9;
  return 0.58 + ((frame - 31) / 39) * 0.32;
}
