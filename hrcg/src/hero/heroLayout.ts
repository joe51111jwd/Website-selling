// A-000 frame-space layout and constants (brief 2.2, 2.5, 4.1, 5.2). Owner: A2.
//
// All hero media share one crop per orientation: 1920x1076 (16:9 frame, x 2-1922 of the 1924x1076
// source) and 1076x1912 (9:16, the phone take). Type, line and labels are laid out in FRAME SPACE
// (fractions of that frame) by cover.css, so they stay registered with frame 84 at every viewport.
// The frame is scaled by min(cover, contain x 1.10) (brief 2.2). JS never re-derives positions from
// these numbers when it can measure the DOM: the string endpoints, the type planes and the plan-cut
// registration all read the rendered anchors (getBoundingClientRect), so CSS stays the one source.

export type Orientation = '169' | '916';

export const FRAME = {
  '169': { w: 1920, h: 1076 },
  '916': { w: 1076, h: 1912 },
} as const;

/** Portrait viewports use the 9:16 phone take (cover.css and <picture media> use the same query). */
export const PORTRAIT_QUERY = '(max-aspect-ratio: 4/5)';

/** BigShoulders-H1.woff2 (static instance: wght 900, opsz 72), measured with fontTools (A2 venv).
 *  upm 2000, hhea/typo ascent 1971, descent 429 (USE_TYPO_METRICS set), cap height 1600. */
export const H1_FONT = {
  family: 'BS H1',
  weight: 900,
  ascent: 1971 / 2000,
  descent: 429 / 2000,
  cap: 1600 / 2000,
  lineHeight: 0.86,
  tracking: -0.005,
} as const;

/** Baseline offset from the top of a line box (line-height .86): half-leading + ascent. */
export const H1_BASELINE_IN_LINE =
  (H1_FONT.lineHeight - (H1_FONT.ascent + H1_FONT.descent)) / 2 + H1_FONT.ascent; // 0.8155 em
/** Cap-top offset from the top of a line box. */
export const H1_CAPTOP_IN_LINE = H1_BASELINE_IN_LINE - H1_FONT.cap; // 0.0155 em

/**
 * Frame-space type blocks (fractions of frame W x H). FAR is anchored by its first cap-top, NEAR by
 * its last baseline (BUILD? stands on the chalk line). cover.css holds the same numbers; keep in sync.
 */
export const TYPE_LAYOUT = {
  // NEAR's right edge sits just inside the line's chalk box (brief 2.2 lists 0.92 for both; the box needs the room)
  '169': { size: 0.131, farLeft: 0.135, farCapTop: 0.135, nearRight: 0.885, nearBaseline: 0.755 }, // FAR shifted (+0.015, -0.005) by D1 into the bite window (hero-meta-169 typeLayerShift, A2-3)
  '916': { size: 0.075, farLeft: 0.08, farCapTop: 0.15, nearRight: 0.865, nearBaseline: 0.775 },
} as const;

/** Depth planes of the type in the 3D VIEW (brief 2.2): FAR just behind 07's shoulder, NEAR in front of the dust. */
export const TYPE_Z = { far: 2.6, near: 1.05 } as const;

/** Chalk line in frame space (brief 2.2, 2.5). */
export const LINE_LAYOUT = {
  '169': { x0: 0.52, x1: 0.92, y: 0.76 },
  '916': { x0: 0.47, x1: 0.92, y: 0.78 },
} as const;

// ------------------------------------------------------------------ string and timeline (brief 2.3, 4.1)

export const STRING = {
  nodes: 64,
  iterations: 12,
  /** desktop grab radius, px */
  grabRadius: 80,
  /** deflection caps as a fraction of the viewport height */
  capVh: 0.22,
  capVhPhone: 0.15,
  /** cast shadow: offset = deflection x 0.6, max 14 px */
  shadowK: 0.6,
  shadowMax: 14,
  /** auto-snap ghost pull, px */
  ghostPx: 60,
  /** standard pull for a tap / Space / Enter, fraction of the cap */
  standardPull: 0.42,
  /** residual buzz after impact: two cycles in 160 ms at 20 % amplitude */
  buzzMs: 160,
  buzzAmp: 0.2,
} as const;

export const TIMING = {
  /** wait for the H1 font + ground image, capped */
  readyCap: 1.2,
  payout: 0.6,
  /** auto-snap at max(3.0 s, pay-out end + 1.2 s) */
  autoSnapAt: 3.0,
  autoSnapAfterPayout: 1.2,
  ghostPull: 0.42,
  ghostHold: 0.08,
  standardPull: 0.18,
  /** H1 ink-in, from impact */
  ink: 0.28,
  /** film rises through the dust */
  filmIn: 0.25,
  filmFade: 0.55,
  /** puff gone by S + 0.8 */
  dustOut: 0.8,
  /** the deposit and the control points leave over S + 0.15 -> S + 0.5, before the film's own line is up (F-073) */
  depositFrom: 0.15,
  depositOut: 0.5,
  /** film can't play by S + 1.2 -> jump to the still */
  filmLate: 1.2,
  /** freeze crossfade: the canvas fades in over the film (120 ms), then the DOM H1 hands over to the
   *  type planes (120 ms; at yaw 0 they coincide, so this is where the FAR bite appears) */
  crossfade: 0.12,
  /** swing to rest, starting when the hand-over is done: 0.24 + 2.0 = the brief's 2.2 s window */
  swingDelay: 0.24,
  swing: 2.0,
} as const;

/** Rest pose of the 3D VIEW camera (brief 2.3, 4.1); overridden by hero-meta's yaw/pitch/dolly when present. */
export const POSE = {
  desktop: { yaw: 8, pitch: -2.5, dolly: 0.04, yawMin: -6, yawMax: 10, pitchMin: -3, pitchMax: 3 },
  // phone: a sideways drag may not push the H1 out of the frame (F-029): -1 deg left, +6 deg right
  phone: { yaw: 6, pitch: -2.5, dolly: 0.04, yawMin: -1, yawMax: 6, pitchMin: -3, pitchMax: 3 },
  lookDeg: 3,
  keyDeg: 2,
  lambda: 4,
} as const;

/** Stage beats, P = 0..1 over the pinned scroll (brief 3.3, as overridden by FIXLIST-1 F-005 / §5):
 *  the H1 is out by 0.10, the plan cut runs 0.10-0.30, the pull-out 0.30-0.75, A-100 prints at 0.55. */
export const BEATS = {
  camBack: [0, 0.1],
  /** status line, H1, sub, hint, RESET */
  h1Out: [0, 0.1],
  planCut: [0.1, 0.3],
  /** the hero media leave under the plan */
  heroOut: [0.1, 0.25],
  /** the plan still (and its slab backdrop) come in; DRAW-eased */
  planIn: [0.12, 0.28],
  /** the backdrop leaves before the A-100 row arrives (the row sits under the plan layer) */
  backdropOut: [0.28, 0.32],
  /** the visitor's deposit returns for the cut; portrait FLIPs it onto b44's line over this range */
  depositIn: [0.1, 0.22],
  /** ... and hands over to b44's own line as the plan's opacity passes 0.6 */
  depositHandover: [0.6, 1],
  pullOut: [0.3, 0.75],
  arenaIn: [0.32, 0.6],
  /** the A-100 row (bays, bubbles, captions) only once the pull-out has started */
  a100In: [0.32, 0.38],
  bubblesAt: 0.4,
  land: 0.75,
  printAt: 0.55,
  /** the A-100 load group (posters + videos) is released here, in time for the row at 0.32 (F-006) */
  releaseA100At: 0.25,
  sheetA100At: 0.3,
} as const;

/** Capture timeline (registerCaptureScene('hero')): the passive path with a scripted pull. */
export const CAPTURE = {
  ready: 0.4,
  pullStart: 1.7,
  pullEnd: 2.75,
  pullAmount: 0.62,
  snap: 3.0,
} as const;
