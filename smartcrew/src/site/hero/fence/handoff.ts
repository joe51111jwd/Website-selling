// The contract between the intro (src/site/intro/intro.ts) and the hero's engine (./engine.ts):
// snapshot and swap (HERO_SPEC §7). When its hold ends (or on a skip) the intro freezes its last
// frame and reads a snapshot of it: where the geofence's six stakes, the "Hwy 9 Culvert" label,
// Marcus's marker and the three notifications are on screen, and the nodes themselves (the
// contour map, the notifications, the night logo), frozen in place and ready to be moved. The hero
// then rebuilds that frame in its own night layer on ONE animation frame (moving the nodes, not
// copying them), the intro's DOM is removed on the same frame, and the move into the day plays.
//
// No imports: intro.ts loads this without pulling in the hero.

export type Pt = [number, number];

/** An element frozen where it was: its layout box (viewport px, without its transform) and look. */
export type Frozen<E extends Element = HTMLElement> = {
  el: E;
  left: number;
  top: number;
  width: number;
  height: number;
  transform: string;
  origin: string;
  opacity: number;
};

export type IntroSnapshot = {
  /** the intro hexagon's six stakes (index.html polygon order), viewport px */
  fence: Pt[];
  /** the solid fence's opacity (0 while it is still being drawn) and the jobsite's fill opacity */
  fenceOn: number;
  zone: number;
  /** screen px per map unit (the camera's zoom × the map's fit) */
  S: number;
  camera: { fx: number; fy: number; z: number };
  /** "Hwy 9 Culvert" on the map: its box, its <text> (cloned by the hero) and its screen matrix */
  label: { rect: DOMRect; text: SVGTextElement; ctm: DOMMatrix; opacity: number };
  /** Marcus's marker: its centre, the marker group (cloned) and its screen matrix */
  mb: { at: Pt; group: SVGGElement; ctm: DOMMatrix; opacity: number; ring: number };
  /** the three notifications, frozen (the hero moves these nodes) */
  cards: { clockin: Frozen; load: Frozen; profit: Frozen };
  /** the contour map (moved into the hero's night layer) */
  map: Frozen<SVGSVGElement>;
  /** the white night logo (it crossfades with the header's) and the "Press any key" hint */
  logo: Frozen<SVGSVGElement> | null;
  skip: Frozen | null;
};

export type HandoffOpts = {
  /** the visitor skipped: the same move, every duration × 0.6 */
  skip: boolean;
  /** PHONE MODE: transform and opacity only, ~0.8× durations, no rAF */
  phone: boolean;
  /** ?introDebug: build the move paused; window.__hero.seek(ms) renders any frame */
  debug?: boolean;
  /** called on the frame the hero's night layer takes over: remove #intro, retire #topo */
  onSwap: () => void;
  /** called when the camera move is over (the page may scroll, the intro is done) */
  onDone: () => void;
};

export type HandoffReq = { snap: IntroSnapshot; opts: HandoffOpts };

type Taker = (req: HandoffReq | null) => void;

let pending: HandoffReq | null = null;
let state: "idle" | "pending" | "taken" | "abandoned" = "idle";
let taker: Taker | null = null;
let skipper: (() => void) | null = null;

/**
 * The intro hands over (HERO_SPEC §7.1). The hero takes it at once if it is laid out, or as soon
 * as it is (the intro holds its frozen last frame meanwhile). Returns false if the hero could not
 * take it (no hero on the page).
 */
export function heroHandoff(snap: IntroSnapshot, opts: HandoffOpts): boolean {
  if (state === "taken") return false;
  pending = { snap, opts };
  state = "pending";
  if (taker) take();
  return true;
}

/** The intro gave up waiting (the hero never laid out in time): it fades itself out instead. */
export function abandonHandoff() {
  if (state === "taken") return;
  state = "abandoned";
  pending = null;
  taker?.(null);
}

/** Whether the hero has taken over (or the hand-over was abandoned). */
export const handoffState = () => state;

/** The engine, once laid out: take a pending hand-over now, or when it comes. */
export function onHeroHandoff(fn: Taker): () => void {
  taker = fn;
  if (state === "pending") take();
  else if (state === "abandoned") fn(null);
  return () => {
    if (taker === fn) taker = null;
  };
}

function take() {
  const req = pending;
  if (!req || !taker) return;
  pending = null;
  state = "taken";
  taker(req);
}

/** Any input during the move: the engine speeds the rest of it up (× 1/0.6). */
export function skipHandoff() {
  skipper?.();
}
export function onSkipHandoff(fn: (() => void) | null) {
  skipper = fn;
}
