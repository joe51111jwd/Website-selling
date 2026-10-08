// Per-format chrome metrics. Each aspect is laid out natively (no cover-crops of 16:9).
import type { Format } from './timeline';

export type Chrome = {
  W: number;
  H: number;
  border: number; // sheet border inset
  inset: number; // burn-in distance from the frame edge
  lbl: number; // label size
  margin: number; // content margin (the spine)
};

export const CHROME: Record<Format, Chrome> = {
  '169': { W: 1920, H: 1080, border: 30, inset: 54, lbl: 20, margin: 96 },
  '916': { W: 1080, H: 1920, border: 22, inset: 44, lbl: 26, margin: 64 },
  '11': { W: 1080, H: 1080, border: 22, inset: 42, lbl: 22, margin: 64 },
};

// Burned in for the whole film (brief §7c R4). PASS B keeps the footage cut (no site captures), so the
// disclosure stays "AI-generated concept footage", now in the site's ":" form (F-058; the same words as
// THE_SET_TITLE and INDEX.watchTheSet on the site).
export const BURN = {
  topLeft: 'HRCG-2027 · PLANNED · DRAWING SET',
  disclosure: 'CONCEPT FILM: AI-GENERATED CONCEPT FOOTAGE',
  // only if site captures are ever cut in (then the site's three strings change back too, see requests/A7-1.md)
  disclosureCaptures: 'CONCEPT FILM: SCREEN CAPTURE OF THIS SITE + AI-GENERATED CONCEPT FOOTAGE',
};

/**
 * F-058: the disclosure is burned in twice at >= 3.2 % of the frame height (35 px at 1080; 62 px on the
 * 1920-tall 9:16, where it needs two lines): bottom left, and again in the top safe area (cap-top at
 * 10 % of the height), clear of the feeds' bottom-20 % UI. Positions are baselines (Archivo metrics:
 * ascent 0.878 em, cap height 0.686 em).
 */
export type Disclosure = {
  size: number;
  lines: string[];
  pitch: number; // baseline-to-baseline, px
  top: { x: number; baseline: number; anchor: 'start' | 'end' }; // first line's baseline
  bottom: { x: number; baseline: number }; // last line's baseline
};
const capTop = (y: number, size: number) => y + 0.686 * size; // cap-top → baseline

export const DISCLOSURE: Record<Format, Disclosure> = {
  '169': { size: 35, lines: [BURN.disclosure], pitch: 0, top: { x: 1866, baseline: capTop(112, 35), anchor: 'end' }, bottom: { x: 54, baseline: 1034 } },
  '11': { size: 35, lines: [BURN.disclosure], pitch: 0, top: { x: 1038, baseline: capTop(112, 35), anchor: 'end' }, bottom: { x: 42, baseline: 1036 } },
  '916': {
    size: 62,
    lines: ['CONCEPT FILM:', 'AI-GENERATED CONCEPT FOOTAGE'],
    pitch: 70,
    top: { x: 44, baseline: capTop(194, 62), anchor: 'start' },
    bottom: { x: 44, baseline: 1872 },
  },
};
