// One Day's clock: where each beat of a moment falls on the scene's scroll, a continuous "time of
// day" for the light and the ground, and the ground colours. No three.js here: the DOM (tint,
// copy) and the Stage effects (./stageFx.ts) both read it, so they land on the same beats.

import { MOMENTS } from "../../content/moments";
import { stepAt } from "../scene/Scene";
import { sceneY } from "../../three/stage/store";

export const DAY_STEPS = MOMENTS.length;

/** Scene progress at `phase` (0..1) of moment `i`. */
export const beat = (i: number, phase: number) => stepAt(i, DAY_STEPS, phase);

/**
 * The beats inside each moment, as fractions of its share of the scroll (one screen each).
 * The camera move from one moment to the next runs from `leave` to the next moment's `arrive`
 * (about a quarter of a screen), and the time, the light and the ground change during it.
 */
export const B = {
  /** the devices have settled into the moment's shot; the sending screen shows the action + ring */
  arrive: 0.1,
  /** the orange pulse leaves the sending screen */
  send: 0.3,
  /** the pulse lands; the receiving screen switches to the result, ring on the exact row */
  land: 0.56,
  /** push-in: the receiving device comes forward (Friday: the QuickBooks toast) */
  push: 0.74,
  /** the hold ends; the camera starts moving to the next moment */
  leave: 0.88,
} as const;

/** Where the rail jumps to: just before the pulse leaves, so the visitor sees it travel. */
export const JUMP = 0.2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/**
 * The time of day as a continuous moment index (0 = 6:42 AM … 6 = Friday): whole numbers while
 * a moment holds, eased between them during the camera move.
 */
export function dayClock(p: number) {
  const f = clamp01(p) * DAY_STEPS;
  const i = Math.min(DAY_STEPS - 1, Math.floor(f));
  const ph = f - i;
  const span = 1 - B.leave + B.arrive;
  if (ph < B.arrive && i > 0) return i - 1 + smooth((ph + 1 - B.leave) / span);
  if (ph > B.leave && i < DAY_STEPS - 1) return i + smooth((ph - B.leave) / span);
  return i;
}

/**
 * How much the Day owns the page's light and ground (0..1): fades in while the hero scrolls
 * away, and out over the first half screen after the scene unpins.
 */
export function dayPresence(scrollY: number, vh: number) {
  const y0 = sceneY("day", 0);
  const y1 = sceneY("day", 1);
  if (y0 === null || y1 === null) return 0;
  const a = clamp01((scrollY - (y0 - vh * 0.6)) / (vh * 0.6));
  const b = 1 - clamp01((scrollY - y1) / (vh * 0.55));
  return smooth(Math.min(a, b));
}

// ─── the ground: dawn (cool pale) → day (warm white) → late afternoon (amber) → Friday night ──

type RGB = [number, number, number];
type Tone = "dawn" | "day" | "dusk" | "evening" | "orange";

/** Each moment's ground as a mix of two time-of-day tokens (src/styles/tokens.css). */
const GROUND: [Tone, Tone, number][] = [
  ["dawn", "dawn", 0], // 6:42 AM
  ["dawn", "day", 0.45], // 6:55 AM, the sun is up
  ["day", "day", 0], // 9:20 AM
  ["day", "dusk", 0.55], // 4:13 PM
  ["dusk", "dusk", 0], // 5:00 PM
  ["dusk", "orange", 0.08], // 5:30 PM, the last of the sun
  ["evening", "evening", 0], // Friday night
];

const FALLBACK: Record<Tone | "ground", RGB> = {
  dawn: [238, 241, 243],
  day: [251, 248, 244],
  dusk: [246, 231, 212],
  evening: [29, 26, 22],
  orange: [255, 122, 1],
  ground: [251, 248, 244],
};

function parseHex(v: string): RGB | null {
  const m = v.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

let palette: { moments: RGB[]; ground: RGB } | null = null;
function readPalette() {
  if (palette) return palette;
  const cs = getComputedStyle(document.documentElement);
  const tok = (t: Tone | "ground") => parseHex(cs.getPropertyValue(`--${t}`)) ?? FALLBACK[t];
  const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t) as RGB;
  palette = { moments: GROUND.map(([a, b, t]) => mix(tok(a), tok(b), t)), ground: tok("ground") };
  return palette;
}

const mixRGB = (a: RGB | number[], b: RGB | number[], t: number) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);

/** The page ground at a time of day (`clock` from dayClock), blended with the page's own ground by `presence`. */
export function groundAt(clock: number, presence: number): RGB {
  const { moments, ground } = readPalette();
  const i = Math.max(0, Math.min(DAY_STEPS - 1, Math.floor(clock)));
  const j = Math.min(DAY_STEPS - 1, i + 1);
  const c = mixRGB(moments[i], moments[j], clock - i);
  // leaving from the night, go back to the day ground through the warm dusk, not through grey
  if (clock > DAY_STEPS - 1.5 && presence < 1) {
    const dusk = moments[4];
    const out = presence > 0.5 ? mixRGB(dusk, c, (presence - 0.5) * 2) : mixRGB(ground, dusk, presence * 2);
    return out.map(Math.round) as RGB;
  }
  return mixRGB(ground, c, presence).map(Math.round) as RGB;
}

/** Relative luminance, 0..1 (sRGB, rough), to flip ink and the cursor's tone on dark grounds. */
export const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
