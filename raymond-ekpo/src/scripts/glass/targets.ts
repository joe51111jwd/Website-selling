// What becomes glass, and what kind. The page's own elements stay where they are and keep their
// text; the renderer draws the glass under each one. Their CSS makes them transparent once the
// renderer is running (see .glass-gl in glass.css), so the selectors here and there must agree.

export type Tint = 'clear' | 'bright' | 'amber' | 'smoke' | 'ox';

// rgb and how much of it the glass takes on
export const TINTS: Record<Tint, [number, number, number, number]> = {
  clear: [1, 1, 1, 0.02],
  bright: [1, 0.97, 0.92, 0.14],
  amber: [0.74, 0.44, 0.18, 0.3],
  smoke: [0.03, 0.025, 0.02, 0.52],
  ox: [0.52, 0.08, 0.07, 0.48],
};

export type Target = {
  sel: string;
  tint: Tint;
  frost: number; // mip level sampled inside: 0 is clear, 4 is heavily frosted
  bezel?: number; // how far in from the edge the glass bends, px
  refract?: number;
  z?: number; // drawn above lower z regardless of document order
};

export const TARGETS: Target[] = [
  // floating chrome
  { sel: '.bar-inner', tint: 'smoke', frost: 3.4, z: 10 },
  { sel: '.nav-mobile[open] nav', tint: 'smoke', frost: 3.8, z: 10 },
  { sel: '.nav-mobile summary', tint: 'clear', frost: 1.5, bezel: 14, z: 10 },

  // controls
  { sel: '.btn--ghost, .btn--outline-light, .btn--light', tint: 'clear', frost: 1.4, bezel: 16 },
  { sel: '.btn', tint: 'ox', frost: 1.8, bezel: 16 },
  { sel: '.chip span', tint: 'clear', frost: 1.2, bezel: 12, refract: 0.6 },
  { sel: '.shelf-arrow', tint: 'clear', frost: 1.2, bezel: 14 },
  { sel: '.story-tabs', tint: 'smoke', frost: 3, bezel: 14 },
  { sel: '.check, .choice-card', tint: 'clear', frost: 2.4, bezel: 16 },
  { sel: '.form input[type="text"], .form input[type="email"], .form input[type="url"], .form select, .form textarea', tint: 'smoke', frost: 3, bezel: 12, refract: 0.5 },

  // cards and panels
  { sel: '.hero-figure', tint: 'clear', frost: 2.6 },
  { sel: '.hire a', tint: 'clear', frost: 2.8, bezel: 18 },
  { sel: '.ticker', tint: 'smoke', frost: 3.2, bezel: 10, refract: 0.7 },
  { sel: '.story-steps', tint: 'smoke', frost: 3.6 },
  { sel: '.story-figure', tint: 'clear', frost: 2.4 },
  { sel: '.panel--paper', tint: 'clear', frost: 3.4 },
  { sel: '.panel--desk', tint: 'amber', frost: 3.4 },
  { sel: '.panel--ink', tint: 'smoke', frost: 3.6 },
  { sel: '.panel--ox', tint: 'ox', frost: 3.4 },
  { sel: '.fit-sheet', tint: 'smoke', frost: 3.6 },
  { sel: '.fit-mini', tint: 'smoke', frost: 3.4 },
  { sel: '.stack-card--paper .stack-inner', tint: 'clear', frost: 3.4, bezel: 30 },
  { sel: '.stack-card--desk .stack-inner', tint: 'amber', frost: 3.4, bezel: 30 },
  { sel: '.stack-card--ink .stack-inner', tint: 'smoke', frost: 3.6, bezel: 30 },
  { sel: '.stack-card--ox .stack-inner', tint: 'ox', frost: 3.4, bezel: 30 },
  { sel: '.disclosure', tint: 'smoke', frost: 3.4 },
  { sel: '.step:nth-child(1)', tint: 'clear', frost: 3, bezel: 18 },
  { sel: '.step:nth-child(2)', tint: 'amber', frost: 3, bezel: 18 },
  { sel: '.step:nth-child(3)', tint: 'smoke', frost: 3.4, bezel: 18 },
  { sel: '.step:nth-child(4)', tint: 'ox', frost: 3, bezel: 18 },
  { sel: '.shelf-card', tint: 'clear', frost: 2.8 },
  { sel: '.footer .cta', tint: 'ox', frost: 3.6, bezel: 34 },

  // inner pages
  { sel: '.service-side', tint: 'smoke', frost: 3.6 },
  { sel: '.audit-sheet', tint: 'ox', frost: 3.4 },
  { sel: '.plate', tint: 'clear', frost: 2.6 },
  { sel: '.aside', tint: 'smoke', frost: 3.6 },
  { sel: '.success', tint: 'smoke', frost: 3.6 },
  { sel: '.note-cta', tint: 'smoke', frost: 3.6 },
  { sel: '.cases .empty', tint: 'smoke', frost: 3.4 },
];

// Lettering cut from glass: the masthead nameplate, the drifting quote and the footer signature.
// The clip keeps cropped type (the footer name) inside its box.
export const TEXTS: { sel: string; clip?: string }[] = [
  { sel: '.nameplate > [aria-hidden]' },
  { sel: '.kinetic .k-line', clip: '.quote-band' },
  { sel: '.giant span', clip: '.giant' },
];

// The backdrop changes mood as you move down the page
export type Mood = { base: [number, number, number]; vein: [number, number, number]; glow: [number, number, number] };
const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

export const MOODS: Record<string, Mood> = {
  ink: { base: hex('#120c0a'), vein: hex('#5e1a15'), glow: hex('#cf7a42') },
  ember: { base: hex('#170a08'), vein: hex('#8f241a'), glow: hex('#ee9752') },
  dawn: { base: hex('#150f0a'), vein: hex('#713f1b'), glow: hex('#f2c47c') },
  ox: { base: hex('#1b0807'), vein: hex('#a42b22'), glow: hex('#f6a77c') },
};

export const SECTION_MOODS: [string, keyof typeof MOODS][] = [
  ['.hero', 'ink'],
  ['.story', 'ember'],
  ['#services', 'dawn'],
  ['.band-desk', 'dawn'],
  ['.quote-band', 'ox'],
  ['.approach', 'ember'],
  ['[data-chart]', 'dawn'],
  ['.notes', 'ink'],
  ['.overview', 'dawn'],
  ['.fit-band', 'dawn'],
  ['.beliefs', 'ember'],
  ['.footer', 'ox'],
];
