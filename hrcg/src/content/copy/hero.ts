// A-000 COVER copy (brief 2.1, 2.3, 2.6, 2.7, 3.13, 4.1). Owner: A2.
// Exact brief strings; typographic apostrophes in the UI (brief 5.2). View titles are NOT here:
// they come from src/content/viewTitles.ts through <ViewTitle> (ids hero-film, hero-still, hero-3d,
// plan-cut). Media alts come from the manifest (A5).

export const HERO = {
  /** Status line over the frame (DOM only, never in GL) */
  status: 'PLANNED · NEW YORK CITY · 2027',
  /** H1 eyebrow, inside the <h1>, visually hidden on the cover (the sheet header carries the name) */
  eyebrow: 'Humanoid Robot Construction Games',
  /** Separator read between the eyebrow and the question (screen readers only) */
  eyebrowSep: ': ',
  /** The cover question, one entry per line. FAR = lines 0-1, NEAR = lines 2-3 (brief 2.2). Set uppercase in CSS. */
  h1Lines: ['What can a', 'humanoid', 'actually', 'build?'],
  /** The same lines as drawn by canvas2D on the GL type planes (canvas has no text-transform) */
  h1LinesUpper: ['WHAT CAN A', 'HUMANOID', 'ACTUALLY', 'BUILD?'],
  sub: 'Five construction tasks, with results you can see.',
  hint: {
    pull: 'PULL THE LINE. LET GO.',
    key: 'or press Space',
    /** touch devices have no Space bar: the same instruction for a tap */
    tap: 'or tap the line',
    frozenGl: 'DRAG TO LOOK · SCROLL FOR THE PLAN ↓',
    frozen: 'SCROLL FOR THE PLAN ↓',
  },
  /** The chalk line is a real button laid over the line (brief 2.4, 4.1) */
  lineLabel: 'Snap the chalk line',
  /** The phone handle (44 x 44 chalk box) */
  handleLabel: 'Pull the chalk line: drag down, or tap to snap',
  reset: '↺ RESET THE LINE',
  resetLabel: 'Reset the chalk line',
  /** Reduced motion / MOTION OFF (brief 2.6) */
  play: '▶ PLAY THE SNAP (1 S) · CONCEPT FILM',
  /** The 3D VIEW wrapper (focusable; the canvas itself is aria-hidden) */
  viewLabel: '3D view of the frozen moment. Use arrow keys to look around.',
} as const;

export type HeroCopy = typeof HERO;
