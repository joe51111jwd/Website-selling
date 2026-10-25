// Timing of the scroll story. Scroll progress (0-1 through the pinned section) maps to a frame
// through these keys; between keys it is linear, so held frames give text time to read.
//
// It opens on the cover's three blocks lying face up, seen from above (render/prologue.py: its 45
// frames and the half-frames between them, 89 pictures): scrolling stands them up and stacks them
// into the cover. Then the film (render/story.py):
// hires and tools are thrown on faster and faster, crooked past twelve; it falls over; the book's
// twelve systems are laid as a foundation around the cover (Side); the dead weight leaves (Down);
// the same team goes back on, on the systems, and the building keeps rising past where the rush fell (Up).
//
// Frame numbers below are the film's own (0-based, Blender frame - 1), placed with f(); the film's
// first 27 frames (its old drop-in intro) are replaced by the opening.

export const OPENING = 89; // pictures in the opening; the next one is the film's frame 27, the stacked hero
const f = (filmFrame: number) => filmFrame - 27 + OPENING;
/** the opening's own frame numbers (1-45, in half steps) */
const o = (openingFrame: number) => (openingFrame - 1) * 2;
export const HERO_FRAME = f(27);
export const STORY_VH = 1513;
/** the share of the story's scroll the opening takes; the film keeps its own 0-1 timing in the rest */
export const OPEN_P = 0.08;
/** a progress in the film's own 0-1 → progress through the whole story */
export const sp = (p: number) => OPEN_P + p * (1 - OPEN_P);
/** progress through the whole story → the film's own 0-1 (0 during the opening) */
export const filmP = (v: number) => Math.max(0, (v - OPEN_P) / (1 - OPEN_P));

const FILM_KEYS: [progress: number, frame: number][] = [
  [0.0, 27], // the hero
  [0.03, 29],
  [0.08, 48], // the rush starts at a careful pace...
  [0.125, 71],
  [0.15, 87], // ...and runs away from the visitor's thumb
  [0.235, 105], // strain
  [0.31, 145], // it falls over
  [0.37, 146], // hold on the wreckage
  [0.39, 156],
  [0.5, 198], // Side: the twelve systems
  [0.55, 199], // hold on the finished foundation (Agency starts its hop at 199)
  [0.61, 219], // Down: the dead weight leaves
  [0.85, 317], // Up: the team, then the building
  [1.0, 339],
];
export const FRAME_KEYS: [progress: number, frame: number][] = [
  [0, 0], // face up on the table
  [OPEN_P * 0.82, OPENING - 1], // stood up and stacked; the hero holds while its title comes in
  ...FILM_KEYS.map(([p, n]) => [sp(p), f(n)] as [number, number]),
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

// The margin inversion, Chapter 17: Michael's illustration of what each round of hiring does.
// The desktop panel steps through his four years as the rush piles on, and only ever shows his values.
export type Year = { from: number; year: string; team: number; revenue: string; margin: string; take: string; lines: number };
export const YEARS: Year[] = [
  { from: f(71), year: "Year 0", team: 12, revenue: "$3M", margin: "20%", take: "$900K", lines: 66 }, // Hire #12 lands
  { from: f(84), year: "Year 1", team: 15, revenue: "$3.5M", margin: "14%", take: "$400K", lines: 105 }, // Hire #15 lands
  { from: f(94), year: "Year 2", team: 20, revenue: "$4M", margin: "10%", take: "$250K", lines: 190 },
  { from: f(100), year: "Year 3", team: 25, revenue: "$4.2M", margin: "5%", take: "$150K", lines: 300 },
];

export function yearAt(frame: number): Year | null {
  let y: Year | null = null;
  for (const row of YEARS) if (frame >= row.from) y = row;
  return y;
}

// labels pinned to blocks in the render (names match anchors.json).
// `wide`: desktop only. Phones show one tag at a time, and only the ones that carry the story.
export type Callout = { anchor: string; from: number; to: number; text: string; tone?: "red" | "green" | "ink"; side?: "left" | "right"; wide?: boolean };
export const CALLOUTS: Callout[] = [
  // the first few get named as they land; after that they come too fast to label, which is the point
  { anchor: "hire6", from: f(35), to: f(41), text: "Hire #6", wide: true },
  { anchor: "slack", from: f(42), to: f(48), text: "Slack", wide: true },
  { anchor: "hire9", from: f(48), to: f(54), text: "Hire #9", wide: true },
  { anchor: "crm", from: f(54), to: f(60), text: "CRM", wide: true },
  { anchor: "sops", from: f(84), to: f(106), text: "Past twelve", tone: "red" },
  { anchor: "sops", from: f(141), to: f(150), text: "The Graveyard", tone: "red" }, // the block that was past twelve
  // short enough to fit a phone crop; it hands the one phone slot to "Agency: cut" without overlapping
  { anchor: "retention", from: f(194), to: f(201), text: "Foundation", tone: "ink" },
  { anchor: "agency", from: f(201), to: f(207), text: "Agency: cut", tone: "red" },
  { anchor: "apps", from: f(205), to: f(212), text: "43 apps: cut", tone: "red", wide: true },
  { anchor: "retention", from: f(316), to: f(339), text: "Foundation · 12 systems", tone: "ink" },
  { anchor: "hire12", from: f(316), to: f(339), text: "Twelve holds", tone: "ink" },
];

// where to keep the subject when a narrow screen crops the 16:10 frame (0-1 across)
export const FOCUS_KEYS: [frame: number, x: number][] = [
  [0, 0.5], // the row of three, centred
  [o(26), 0.55],
  [HERO_FRAME, 0.6], // the stack, right of the title
  [f(29), 0.6],
  [f(91), 0.57],
  [f(117), 0.58],
  [f(145), 0.53], // the stump and the pile both in a phone crop
  [f(169), 0.585],
  [f(194), 0.6],
  [f(200), 0.65], // keep the block being cut in a phone crop
  [f(208), 0.65],
  [f(219), 0.6],
  [f(317), 0.57],
  [f(339), 0.57],
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

// on portrait screens: how big the render is, and where its bottom edge sits (fractions of the
// screen height). The opening shows the whole row, centred; the hero fills the screen; from then on
// the picture sits above the words.
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
export function portraitFit(frame: number): { scale: number; bottom: number } {
  if (frame < HERO_FRAME) {
    const c = smooth((frame - o(5)) / (o(46) - o(5))); // follows the camera down to the hero (its frames 5-46)
    return { scale: 0.44 + c * 0.14, bottom: 0.72 + c * 0.28 };
  }
  const e = smooth((frame - f(29)) / 16); // out of the way before the first line arrives
  // as the building rises past the frame, the picture eases smaller so its top clears the menu
  const h = smooth((frame - f(250)) / 67);
  return { scale: 0.58 + e * 0.18 - h * 0.1, bottom: 1 - e * 0.24 };
}

/** callouts past this frame may share a phone screen (the finished building) */
export const LAST_SHOT = f(316);
