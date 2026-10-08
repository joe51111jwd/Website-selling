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

// Burned in for the whole film (brief §7c R4; PASS A wording).
export const BURN = {
  topLeft: 'HRCG-2027 · PLANNED · DRAWING SET',
  bottomLeft: 'CONCEPT FILM · AI-GENERATED CONCEPT FOOTAGE',
  // PASS B, only if site captures are used:
  bottomLeftCaptures: 'CONCEPT FILM · SCREEN CAPTURE OF THIS SITE + AI-GENERATED CONCEPT FOOTAGE',
};
