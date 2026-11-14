// Timing of the scroll story. Scroll progress (0-1 through the pinned section) maps to a frame
// through these keys; between keys it is linear, so held frames give the blocks' words time to read.
//
// It opens on the cover's three blocks lying face up, seen from above (render/prologue.py: its 45
// frames and the half-frames between them, 89 pictures): they stand up and stack into the cover. On
// the home page that opening plays by itself as the page loads (Story: INTRO_MS), so the first screen
// is the book's title page made of blocks and the scroll starts there (Michael, 30 Oct: land on the book).
// Then the film (render/words_film.py), told by the blocks alone, with no words over it (James, 14 Nov):
// three planks stamped ALWAYS LAUNCHING / ALWAYS HIRING / ALWAYS ADDING go on first, then hires and tools
// faster and crooked, and it falls over; SCALING and the cover's stack turn upside down and are set right;
// a yellow slab SIDEWAYS FOR STABILIZATION slides in and the twelve systems slide in around the cover; a
// red slab DOWN FOR PRUNING is lowered and the dead weight leaves; a green slab UP FOR GROWTH rises out of
// the table and the same team goes back on, on the systems, and the building keeps rising.
//
// Frame numbers below are the film's own Blender frames, placed with b(); its frame 28 is the hero, the
// opening's last picture (page frame 89), and the page plays the film from its frame 29.

import { FOCUS } from "./focus";
import film from "./focusfilm.json";
import words from "./wordsfilm.json";

export const OPENING = 89; // pictures in the opening; the next one is the film's frame 27, the stacked hero
const f = (filmFrame: number) => filmFrame - 27 + OPENING;
/** the opening's own frame numbers (1-45, in half steps) */
const o = (openingFrame: number) => (openingFrame - 1) * 2;
export const HERO_FRAME = f(27);
/** the words film's Blender frame → the page's frame (its frame 28 is the hero) */
const b = (blenderFrame: number) => blenderFrame - 28 + HERO_FRAME;
/** the home page: the story's progress (in the film's own 0-1) by which the hero's words and its button are gone
 *  (the menu's button takes over there) */
export const HERO_GONE = 0.027;
/** the home page's opening, played by itself on load: how long it takes, and its picture at t (0-1) */
export const INTRO_MS = 2400;
export const introFrame = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  // a breath on the blocks lying face up (the render holds them there itself), then they stand up and settle
  return ((1 - Math.cos(Math.PI * c)) / 2) * (OPENING - 1);
};
/** where the stacked blocks stand in the hero's picture (0-1 across and down; HERO_FRAME, measured from the render) */
export const HERO_STACK = { l: 0.54, r: 0.73, t: 0.15, b: 0.808 };
/** (the old focus film still scrolls through its opening: its section is taller by the opening's share) */
export const STORY_VH = FOCUS ? 1513 : 1460;
/** the share of the story's scroll the opening takes (none on the home page: it plays on load) */
export const OPEN_P = FOCUS ? 0.08 : 0;
/** a progress in the film's own 0-1 → progress through the whole story */
export const sp = (p: number) => OPEN_P + p * (1 - OPEN_P);
/** progress through the whole story → the film's own 0-1 (0 during the opening) */
export const filmP = (v: number) => Math.max(0, (v - OPEN_P) / (1 - OPEN_P));

const t = words.t;
const STORY_KEYS: [progress: number, blenderFrame: number][] = [
  [0.0, 28], // the hero...
  [0.032, 28], // ...holds while its picture steps in to fill the screen (Story: HERO_STEP_IN)
  [0.042, 30], // (the film's first frames: the hero's picture, with its planks now in the scene)
  [0.08, 52], // three planks thrown on, the camera rising with them...
  [0.11, 56], // ...and held: ALWAYS LAUNCHING / ALWAYS HIRING / ALWAYS ADDING
  [0.165, 92], // the rush runs away from the visitor's thumb
  [0.205, 106], // strain
  [0.265, 146], // it falls over
  [0.285, 146], // held on the wreckage
  [0.31, t.flip], // the footprint cleared
  [0.34, t.flip_hold], // SCALING and the stack turn upside down...
  [0.375, t.flip_back], // ...and hold: the title, upside down
  [0.4, t.flip_end], // set right
  [0.43, t.scaling_aside + 9], // SCALING steps aside
  [0.465, t.side_read], // SIDEWAYS FOR STABILIZATION slides in...
  [0.5, t.side_read + 2], // ...and is read
  [0.6, t.systems_done], // the twelve systems slide in from the sides
  [0.615, t.systems_done], // held: the foundation
  [0.645, t.down_read], // DOWN FOR PRUNING is lowered...
  [0.68, t.down_read + 2], // ...and read
  [0.73, t.down_done], // the dead weight leaves, what stays is gathered
  [0.76, t.up_read], // UP FOR GROWTH rises out of the table...
  [0.795, t.up_read + 2], // ...and is read
  [0.95, t.end - 2], // the team goes back on, then the building
  [1.0, t.end],
];
// The focus version runs its own film (render/focus_film.py, frames from 28 like the story's): the
// blocks carry the words. Three planks stamped ALWAYS LAUNCHING, ALWAYS HIRING, ALWAYS ADDING go on
// first; it falls over; the cover's stack turns upside down and is set right; the systems slide in
// from the sides; the planks leave with the dead weight; the building rises. Something moves, or one
// short line sits beside the still picture, never both: the film holds while each line is up.
const FOCUS_FILM_KEYS: [progress: number, frame: number][] = [
  [0.0, 27],
  [0.08, 54], // the three planks
  [0.135, 54], // But inside, nothing ever settled.
  [0.22, 105], // the rush, crooked past twelve, and the strain
  [0.275, 105], // the bank account didn't feel it
  [0.34, 146], // it falls over
  [0.39, 146], // That isn't scaling.
  [0.44, 162], // the cover's stack turns upside down
  [0.495, 162], // That's scaling upside down.
  [0.6, 222], // set right; the systems slide in from the sides
  [0.65, 222], // Sideways for stabilization.
  [0.705, 244], // the planks and the dead weight leave
  [0.755, 244], // Down for pruning.
  [0.89, 331], // the team goes back on, then the building
  [1.0, 331], // Up for growth. / Up. Side. Down. Repeat.
];
/** the focus version's lines: when each is up (film 0-1, inside a hold), and where it sits by its blocks */
export type FocusSide = "left" | "right" | "above" | "below";
export const FOCUS_LINES: { id: string; at: [number, number]; box: string; side: FocusSide }[] = [
  { id: "grow", at: [0.088, 0.127], box: "grow", side: "right" },
  { id: "redline", at: [0.228, 0.267], box: "redline", side: "left" },
  { id: "isnt", at: [0.347, 0.383], box: "isnt", side: "above" },
  { id: "upside", at: [0.447, 0.488], box: "upside", side: "below" },
  { id: "side", at: [0.607, 0.643], box: "side", side: "below" },
  { id: "down", at: [0.712, 0.748], box: "down", side: "below" },
  { id: "up", at: [0.897, 0.942], box: "up", side: "left" },
  { id: "repeat", at: [0.952, 0.997], box: "up", side: "left" },
];
/** the outline of a line's blocks in the picture [l, t, r, b], 0-1 (render/focus_anchors.py) */
export const focusBox = (k: string) => (film.lines as Record<string, { box: number[] }>)[k].box as [number, number, number, number];
/** the page's frame that a line's picture holds on (its Blender frame, exported with the outline) */
export const focusHold = (k: string) => f((film.lines as Record<string, { frame: number }>)[k].frame - 1);
/** the focus version's landing: the book holds the screen until here (story progress), then the blocks */
export const FOCUS_HERO: [number, number, number] = [0, OPEN_P * 0.22, OPEN_P * 0.36];
const FILM_KEYS = FOCUS ? FOCUS_FILM_KEYS : STORY_KEYS;
export const FRAME_KEYS: [progress: number, frame: number][] = FOCUS
  ? [
      [0, 0], // face up on the table
      [OPEN_P * 0.36, 0], // (focus: the row waits under the book)
      [OPEN_P * 0.95, OPENING - 1], // stood up and stacked
      ...FILM_KEYS.map(([p, n]) => [sp(p), f(n)] as [number, number]),
    ]
  : STORY_KEYS.map(([p, n]) => [p, b(n)] as [number, number]); // the home page: the scroll starts on the hero

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

// where to keep the subject when a narrow screen crops the 16:10 frame (0-1 across): the opening's row,
// then the film's own subject frame by frame (render/words_anchors.py)
const OPENING_KEYS: [frame: number, x: number][] = [
  [0, 0.5], // the row of three, centred
  [o(26), 0.55],
  [HERO_FRAME, words.x[0]], // the stack and its planks, as the film's first picture has them
];
const WORDS_FROM = b(words.first);
/** the page frames the words film's subject is known for (first, last) */
export const SUBJECT_FRAMES: [number, number] = [WORDS_FROM, WORDS_FROM + words.x.length - 1];
/** the words film's subject at a page frame: x its middle, w its width (0-1 of the picture), t and b its top
 *  and bottom (0-1 down it); null in the opening */
export function subjectAt(frame: number): { x: number; w: number; t: number; b: number } | null {
  if (FOCUS || frame < WORDS_FROM) return null;
  const n = words.x.length;
  const i = Math.max(0, Math.min(n - 1, frame - WORDS_FROM));
  const i0 = Math.floor(i);
  const i1 = Math.min(n - 1, i0 + 1);
  const k = i - i0;
  const mix = (a: number, c: number) => a + (c - a) * k;
  return { x: mix(words.x[i0], words.x[i1]), w: mix(words.w[i0], words.w[i1]), t: mix(words.y[i0][0], words.y[i1][0]), b: mix(words.y[i0][1], words.y[i1][1]) };
}

export function focusAt(frame: number): number {
  if (FOCUS) {
    // the opening's row is centred; from the hero on, the subject of each film frame (render/focus_anchors.py)
    const x = film.x;
    if (frame < HERO_FRAME) return 0.5 + (x[0] - 0.5) * Math.max(0, Math.min(1, (frame - o(5)) / (HERO_FRAME - o(5))));
    return x[Math.max(0, Math.min(x.length - 1, Math.round(frame - HERO_FRAME)))];
  }
  const sub = subjectAt(frame);
  if (sub) return sub.x;
  const k = OPENING_KEYS;
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, x0] = k[i];
    const [f1, x1] = k[i + 1];
    if (frame <= f1) return x0 + ((frame - f0) / (f1 - f0)) * (x1 - x0);
  }
  return k[k.length - 1][1];
}

/** focus: the subject's [top, bottom] in a film frame (0-1 down the picture; render/focus_anchors.py), or
 *  null in the opening */
export const FOCUS_SPANS = film.y as [number, number][];
/** focus: a film frame's place in FOCUS_SPANS (and film.x), or -1 in the opening */
export const focusIndex = (frame: number) => (!FOCUS || frame < HERO_FRAME ? -1 : Math.max(0, Math.min(FOCUS_SPANS.length - 1, Math.round(frame - HERO_FRAME))));
export function focusSpan(frame: number): [number, number] | null {
  const i = focusIndex(frame);
  return i < 0 ? null : FOCUS_SPANS[i];
}

// on portrait screens: how big the render is, and where its bottom edge sits (fractions of the
// screen height), through the opening: the whole row, centred, then the hero fills the screen. From the
// film on, Story steps the picture back until the subject fits the screen (subjectAt).
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
/** on a short phone the hero's picture is held below its button (Story measures it): the largest scale it may take */
let heroCap = 0.58;
export const setHeroCap = (cap: number) => void (heroCap = Math.max(0.4, Math.min(0.58, cap)));
export function portraitFit(frame: number): { scale: number; bottom: number } {
  const c = smooth((frame - o(5)) / (o(46) - o(5))); // follows the camera down to the hero (its frames 5-46)
  return { scale: Math.min(0.44 + c * 0.14, heroCap), bottom: 0.72 + c * 0.28 };
}
