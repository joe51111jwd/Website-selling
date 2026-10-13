// One Day's ground and light by the time of day (dawn → day → late afternoon → Friday night), and
// how much One Day owns the page's light (it fades in and out with the scroll around the scene).
// No three.js here: the DOM (the ground) and the Stage's light (./stageFx.ts) both read it.

import { MOMENTS } from "../../content/moments";
import { sceneY } from "../../three/stage/store";

export const DAY_STEPS = MOMENTS.length;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/**
 * How much One Day owns the page's light and ground (0..1): 1 while it fills the screen, fading
 * over the last 0.6 screen of the hero above it and the first 0.55 screen of the scene below.
 */
export function dayPresence(scrollY: number, vh: number) {
  const y0 = sceneY("day", 0);
  if (y0 === null) return 0;
  const a = clamp01((scrollY - (y0 - vh * 0.6)) / (vh * 0.6));
  const b = 1 - clamp01((scrollY - y0) / (vh * 0.55));
  return smooth(Math.min(a, b));
}

// ─── the ground: dawn (cool pale) → day (warm white) → late afternoon (amber) → Friday night ──

export type RGB = [number, number, number];
type Tone = "dawn" | "day" | "dusk" | "evening" | "orange";

/** Each moment's ground as a mix of two time-of-day tokens (src/styles/tokens.css). */
const GROUND: [Tone, Tone, number][] = [
  ["dawn", "dawn", 0], // 6:42 AM
  ["dawn", "day", 0.45], // 6:55 AM, the sun is up
  ["day", "day", 0], // 9:20 AM
  ["day", "dusk", 0.55], // 4:12 PM
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
/** Each moment's ground and the page's own, from the tokens (read once). */
export function readPalette() {
  if (palette) return palette;
  const cs = getComputedStyle(document.documentElement);
  const tok = (t: Tone | "ground") => parseHex(cs.getPropertyValue(`--${t}`)) ?? FALLBACK[t];
  const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as RGB;
  palette = { moments: GROUND.map(([a, b, t]) => mix(tok(a), tok(b), t)), ground: tok("ground") };
  return palette;
}

export const rgb = (c: RGB | number[]) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;

/** Relative luminance, 0..1 (sRGB, rough), to flip ink and the cursor's tone on dark grounds. */
export const luminance = ([r, g, b]: RGB | number[]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
