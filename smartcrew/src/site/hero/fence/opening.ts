// The hero's hooks for an opening (scratchpad design/v2/opening/OPENING_BRIEF.md). An opening is
// a short first beat that shows the real product (the crew's phone, the app's UI) and then hands
// its pieces to the hero with no cut: its geofence lands on the hero's fence, its crew dot becomes
// Marcus's marker, its profit card becomes the tag (desktop) or the job chip (phones). This module
// is the contract between the two. It has no imports, so an opening can load it without the hero.
//
// How an opening uses it:
//   1. Before first paint, put `has-opening` on <html> (an inline script in index.html: the
//      opening's own gate, e.g. once per session and never with reduced motion). The hero then
//      lays itself out (fonts in, type measured, fence staked) but stays hidden until `heroEnter`
//      is called. Without the class the hero plays its own entrance (HERO_SPEC §5B) at once: that
//      is the default, and the page works the same with no opening at all.
//      The page-level signals in src/site/ready.ts (READY: the hero's button has landed; DONE: the
//      entrance has played out, or the visitor scrolled) follow the hero, so the rest of the page
//      waits for the opening + entrance automatically.
//   2. `await whenHeroLaid()` (or `getHeroTargets()` once laid) to read where every piece of the
//      hero will be at rest, in viewport px: fly your own elements there (FLIP, transform and
//      opacity only on phones).
//   3. On the frame your pieces land, call `heroEnter({ fence: "given", markers: { mb: "given" },
//      tag: "given", at: 300 })`: the hero shows the pieces you delivered at rest on that frame
//      (so you can drop yours on the same frame, no double), plays the rest of its entrance from
//      `at` ms in, and resolves when everything has landed. Remove `has-opening` when your own
//      layer is gone.
//   If `heroEnter` never comes (an opening that failed to load), the hero enters on its own
//   OPENING_WAIT ms after it is laid out.

export type Pt = [number, number];
/** A box in viewport px (CSS), at rest (no entrance transform applied). */
export type Box = { x: number; y: number; w: number; h: number };
export type CrewId = "mb" | "er" | "jl";

/** Where the hero's pieces are at rest, in viewport px (call again after a resize or a scroll). */
export type HeroTargets = {
  /** PHONE MODE (≤ 760 px): the light build (no tag: the chip; ER and MB only) */
  phone: boolean;
  /** the geofence round the fenced phrase: six stakes (left point, top-left, top-right, right point, bottom-right, bottom-left) */
  fence: Pt[];
  /** the fenced words themselves (their glyph box) and the phrase */
  words: Box;
  phrase: string;
  /** the crew markers on the fence (26 px discs): centre and box; ER/JL are absent where they don't show (phones: no JL) */
  markers: Partial<Record<CrewId, { at: Pt; box: Box; initials: string; time: string }>>;
  /** Marcus's clock-in time ("6:42") next to the fence (desktop only) */
  stamp: Box | null;
  /** the profit tag tied to the fence (desktop) — or null where the job chip shows instead */
  tag: Box | null;
  /** the job chip under the headline (phones, narrow laptops) */
  chip: Box | null;
  /** the job the tag / chip shows at rest */
  job: { name: string; today: string };
  /** every line of the headline as set on screen, top to bottom; the fenced phrase sits on lines
   * fenceLines[0] … fenceLines[1] (one line, or a run of them on a phone: "Friday / scramble") */
  lines: Box[];
  fenceLines: [number, number];
  /** the eyebrow (desktop) and the sub */
  eyebrow: Box | null;
  sub: Box;
  /** the orange button, its row (button + demo link) and the small print under it */
  cta: Box;
  ctaRow: Box;
  micro: Box;
  /** the button's own fence (it closes round the button once): six stakes */
  ctaFence: Pt[];
};

/** "play": the hero animates it in (§5B). "given": the opening delivered it; it shows at rest at once. */
export type PieceMode = "play" | "given";

export type HeroEnterOpts = {
  /** the contour ground */
  ground?: PieceMode;
  /** the headline lines (and the eyebrow) */
  h1?: PieceMode;
  /** the fenced line only (defaults to `h1`) */
  words?: PieceMode;
  /** the dashed geofence and its stakes */
  fence?: PieceMode;
  /** the crew markers: all at once, or per crew member (MB stands on the fence; ER and JL walk in) */
  markers?: PieceMode | Partial<Record<CrewId, PieceMode>>;
  /** Marcus's "6:42" (defaults to his marker's mode) */
  stamp?: PieceMode;
  /** the profit tag + its tape and note (desktop), or the job chip (phones) */
  tag?: PieceMode;
  /** the sub (and the small print) */
  sub?: PieceMode;
  /** the orange button and the demo link */
  cta?: PieceMode;
  /** the logos row and the scroll cue */
  foot?: PieceMode;
  /** the button's own fence closing once round it (default true) */
  ctaFence?: boolean;
  /** the tag / chip rolling once through the jobs at ~3 s (default true) */
  roll?: boolean;
  /** start the entrance this many ms in: every beat before `at` has already landed */
  at?: number;
  /** playback rate (1 = the spec's timings) */
  speed?: number;
};

/** The entrance's beats (ms, before `at`/`speed`), so an opening can line its own motion up with them. */
export const HERO_BEATS = {
  /** headline lines mask in, 70 ms apart by distance from the fenced line (540 ms each: 5 lines end by ~820) */
  lines: [0, 820],
  /** the fence draws round the words, then its stakes pop */
  fence: [300, 1100],
  /** MB fades in on the fence; his "6:42" */
  mb: 420,
  stamp: 700,
  sub: 400,
  /** the button: opaque by `cta[0] + 260`, settled by `cta[1]` */
  cta: [600, 1160],
  /** ER walks in (and JL at +350 on desktop), each clocks in as he crosses the fence */
  walkers: 900,
  tag: 900,
  /** the button's own fence draws, closes solid, pings, lets go */
  ctaFence: [1400, 3200],
  roll: 3000,
} as const;

/** How long the hero waits, laid out and hidden, for an opening's `heroEnter` before entering on its own. */
export const OPENING_WAIT = 3200;

type Controller = { targets: () => HeroTargets; enter: (o: HeroEnterOpts) => Promise<void> };

let ctrl: Controller | null = null;
let pending: { opts: HeroEnterOpts; resolve: () => void } | null = null;
let entered: Promise<void> | null = null;
const laidWaiters: ((t: HeroTargets) => void)[] = [];

/** Whether the page opened with an opening (the hero waits, hidden, for `heroEnter`). */
export const openingOn = () => typeof document !== "undefined" && document.documentElement.classList.contains("has-opening");

/** Where the hero's pieces are at rest, in viewport px; null until the hero is laid out (fonts in). */
export function getHeroTargets(): HeroTargets | null {
  return ctrl ? ctrl.targets() : null;
}

/** Resolves with the targets once the hero is laid out (at once if it already is). */
export function whenHeroLaid(): Promise<HeroTargets> {
  if (ctrl) return Promise.resolve(ctrl.targets());
  return new Promise((r) => laidWaiters.push(r));
}

/**
 * Play the hero's entrance (once per page view; later calls return the first one's promise).
 * Pieces marked "given" show at rest on this frame; the rest plays from `at` ms in. Called before
 * the hero is laid out, it runs the moment it is. Resolves when everything has landed.
 */
export function heroEnter(opts: HeroEnterOpts = {}): Promise<void> {
  if (entered) return entered;
  if (ctrl) return (entered = ctrl.enter(opts));
  entered = new Promise<void>((resolve) => (pending = { opts, resolve }));
  return entered;
}

/** Whether the hero has entered (by `heroEnter`, or on its own). */
export const heroEntered = () => entered !== null;

// ── the engine's side ───────────────────────────────────────────────────────────────────

/**
 * The engine, once laid out: register (a `heroEnter` that came early runs now). Returns an
 * unregister. A remounted engine (crossing 760 px) finds `heroEntered()` true and shows its rest
 * state instead of playing the entrance again.
 */
export function registerHero(c: Controller): () => void {
  ctrl = c;
  laidWaiters.splice(0).forEach((f) => f(c.targets()));
  if (pending) {
    const p = pending;
    pending = null;
    void c.enter(p.opts).then(p.resolve);
  }
  return () => {
    if (ctrl === c) ctrl = null;
  };
}
