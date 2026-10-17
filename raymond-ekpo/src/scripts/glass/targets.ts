// What becomes glass, and what kind of glass. New markup says so with data-glass="kind"; the
// shared components used on the inner pages are matched by selector. Their CSS makes them
// transparent once the renderer is running (see .glass-gl in glass.css).

export type Kind = {
  /** how far in from the edge the surface curves, px */
  bezel: number;
  /** how tall the glass is, px: taller bends more */
  thick: number;
  /** mip level read inside: 0 is clear, 4 is milky */
  frost: number;
  tint: [number, number, number, number];
  magnify?: number;
  /** extra refraction, for effect */
  bend?: number;
  shadow?: number;
  z?: number;
};

const white = (a: number): [number, number, number, number] => [1, 0.995, 0.985, a];

export const KINDS: Record<string, Kind> = {
  // a sheet that carries text: milky enough that type on it reads at any point
  pane: { bezel: 26, thick: 22, frost: 3.6, tint: white(0.56), bend: 1.2, shadow: 1 },
  'pane-clear': { bezel: 30, thick: 26, frost: 1.4, tint: white(0.3), bend: 1.4, shadow: 1 },
  'pane-dark': { bezel: 26, thick: 22, frost: 3.4, tint: [0.05, 0.04, 0.035, 0.5], bend: 1.2, shadow: 0 },
  // the same on pale paper, where it needs to be darker to carry pale text
  'pane-ink': { bezel: 26, thick: 22, frost: 3.6, tint: [0.075, 0.06, 0.055, 0.86], bend: 1.2, shadow: 1 },
  'pane-ox': { bezel: 26, thick: 22, frost: 3.6, tint: [0.42, 0.08, 0.06, 0.86], bend: 1.2, shadow: 1 },
  'pane-warm': { bezel: 26, thick: 22, frost: 3.6, tint: [0.95, 0.89, 0.79, 0.62], bend: 1.2, shadow: 1 },
  // objects
  clear: { bezel: 22, thick: 24, frost: 0, tint: white(0.04), bend: 1.6, shadow: 0.8 },
  button: { bezel: 15, thick: 16, frost: 1.4, tint: white(0.34), bend: 1.5, shadow: 0.8 },
  'button-ox': { bezel: 15, thick: 16, frost: 1.6, tint: [0.4, 0.06, 0.045, 0.92], bend: 1.4, shadow: 0.9 },
  'button-light': { bezel: 15, thick: 16, frost: 1.2, tint: [1, 0.985, 0.965, 0.9], bend: 1.4, shadow: 0 },
  'button-dark': { bezel: 15, thick: 16, frost: 1.6, tint: [0.98, 0.95, 0.9, 0.12], bend: 1.5, shadow: 0 },
  track: { bezel: 14, thick: 12, frost: 2.6, tint: white(0.42), bend: 1.2, shadow: 0.5 },
  thumb: { bezel: 14, thick: 20, frost: 0.6, tint: white(0.55), magnify: 1.16, bend: 1.7, shadow: 0.9, z: 2 },
  'thumb-ox': { bezel: 14, thick: 20, frost: 0.4, tint: [0.43, 0.075, 0.06, 0.8], magnify: 1.1, bend: 1.5, shadow: 0.9, z: 2 },
  chip: { bezel: 11, thick: 12, frost: 1.2, tint: white(0.36), bend: 1.3, shadow: 0.6 },
  nav: { bezel: 20, thick: 18, frost: 2.4, tint: white(0.42), bend: 1.4, shadow: 0.8, z: 10 },
};

// shared components on the inner pages
export const SELECTORS: [string, string][] = [
  ['.nav-mobile summary', 'button'],
  ['.nav-mobile[open] nav', 'pane'],
  ['.btn--outline-light', 'button-dark'],
  ['.btn--light', 'button-light'],
  ['.btn--ghost', 'button'],
  ['.btn', 'button-ox'],
  ['.shelf-arrow', 'button'],
  ['.check, .choice-card', 'pane-clear'],
  ['.form input[type="text"], .form input[type="email"], .form input[type="url"], .form select, .form textarea', 'track'],
  ['.panel--desk', 'pane-warm'],
  ['.panel--ink', 'pane-ink'],
  ['.panel--ox', 'pane-ox'],
  ['.panel', 'pane'],
  ['.fit-sheet', 'pane'],
  ['.fit-mini', 'pane'],
  ['.stack-card--desk .stack-inner', 'pane-warm'],
  ['.stack-card--ink .stack-inner', 'pane-ink'],
  ['.stack-card--ox .stack-inner', 'pane-ox'],
  ['.stack-inner', 'pane'],
  ['.disclosure', 'pane'],
  ['.step', 'pane'],
  ['.shelf-card', 'pane'],
  ['.service-side', 'pane'],
  ['.plate', 'pane-clear'],
  ['.aside', 'pane-ink'],
  ['.success', 'pane'],
  ['.note-cta', 'pane'],
  ['.cases .empty', 'pane'],
  ['.term', 'pane'],
];
