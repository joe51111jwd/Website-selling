// The chalk string as a pure function of time (brief §4.1 / §6 SNAP).
// Pay-out (DRAW) with a sag that pulls taut, a pull into a triangular bow, then release:
// a plucked string summed over its modes, y = A·e^(−ζωt)·cos(ωt) per mode (ζ = 0.12, ω = 2π·9 Hz),
// impact at the fundamental's first zero-crossing, then a two-cycle 160 ms residual buzz at 20 %.
import { DRAW, SETTLE, prog } from './ease';

export type StringTiming = {
  payout: [number, number]; // seconds
  pull: [number, number]; // [start, release]
  impact: number; // = release + T/4
};

export const ZETA = 0.12;
export const F0 = 9; // Hz
export const OMEGA = 2 * Math.PI * F0;
export const T_IMPACT = 1 / (4 * F0); // first zero-crossing of the fundamental, 27.8 ms
export const BUZZ = { dur: 0.16, amp: 0.2, cycles: 2 };

const NODES = 64;
const MODES = 24;

/** Unit triangular pluck profile, slightly rounded at the finger. */
const pluck = (u: number, up: number) => {
  const tri = u < up ? u / up : (1 - u) / (1 - up);
  const round = 0.035;
  const dist = Math.abs(u - up);
  if (dist < round) {
    // blend toward a parabola cap so the bow has no hard corner under the finger
    const k = 1 - dist / round;
    return tri * (1 - 0.06 * k * k);
  }
  return tri;
};

const modeCoeff = (n: number, up: number) =>
  (2 * Math.sin(n * Math.PI * up)) / (n * n * Math.PI * Math.PI * up * (1 - up));

/** Displacement (0..1 of the pull depth; + = pulled away from the rest line) of the released string. */
const released = (u: number, tau: number, up: number) => {
  let y = 0;
  for (let n = 1; n <= MODES; n++) {
    const w = n * OMEGA;
    y += modeCoeff(n, up) * Math.sin(n * Math.PI * u) * Math.cos(w * tau) * Math.exp(-ZETA * w * tau);
  }
  return Math.max(0, y); // the slab stops it
};

export type StringState = {
  /** fraction of the line that has paid out (0..1) from the chalk box end */
  paid: number;
  /** polylines to draw (several sub-frame samples while it whips; one otherwise) */
  samples: { pts: [number, number][]; lift: number }[];
  /** whether the string itself is visible */
  visible: boolean;
  /** impact has happened (deposit + puff + ink) */
  impacted: boolean;
  /** pull strength 0..1, scales the puff */
  pullStrength: number;
};

export type StringGeom = {
  ax: number; // left control point (pinned end after pay-out)
  bx: number; // chalk box end
  y: number;
  depth: number; // pull depth in px (screen up)
  up: number; // pull point as a fraction from A
  sag: number; // sag in px while paying out
  maxDepth: number; // reference for pullStrength (22vh on the site)
};

const shapeAt = (t: number, tm: StringTiming, g: StringGeom): { disp: (u: number) => number; paid: number } => {
  const [p0, p1] = tm.payout;
  const paid = DRAW(prog(t, p0, p1));
  const taut = SETTLE(prog(t, p1, p1 + 0.6));
  const sag = g.sag * (1 - taut) * (0.4 + 0.6 * paid);
  if (t < tm.pull[0]) {
    // the paid-out string sags, shaped over the paid length
    return { paid, disp: (u) => sag * Math.sin(Math.PI * u) };
  }
  const release = tm.pull[1];
  if (t < release) {
    const d = g.depth * DRAW(prog(t, tm.pull[0], tm.pull[0] + 0.55));
    return { paid: 1, disp: (u) => d * pluck(u, g.up) };
  }
  const tau = t - release;
  if (tau < T_IMPACT) {
    return { paid: 1, disp: (u) => g.depth * released(u, tau, g.up) };
  }
  const tb = tau - T_IMPACT;
  if (tb < BUZZ.dur) {
    const f = BUZZ.cycles / BUZZ.dur;
    const a = BUZZ.amp * g.depth * Math.abs(Math.sin(Math.PI * f * tb)) * (1 - tb / BUZZ.dur);
    return { paid: 1, disp: (u) => a * Math.sin(Math.PI * u) };
  }
  return { paid: 1, disp: () => 0 };
};

/**
 * The string at time t. `shutter` is the exposure in seconds: while the string moves faster than a frame
 * (the release), several sub-frame samples inside the shutter are returned and drawn as a motion smear.
 */
export const stringAt = (t: number, tm: StringTiming, g: StringGeom, shutter: number): StringState => {
  const release = tm.pull[1];
  const hideAt = release + T_IMPACT + BUZZ.dur;
  const impacted = t >= release + T_IMPACT;
  const visible = t >= tm.payout[0] && t < hideAt;
  const pullStrength = Math.min(1, g.depth / g.maxDepth);
  const whip = t > release && t - shutter < release + T_IMPACT + BUZZ.dur;
  const times = whip ? Array.from({ length: 9 }, (_, i) => t - shutter + (shutter * i) / 8) : [t];
  const samples = times.map((ts) => {
    const { disp, paid } = shapeAt(ts, tm, g);
    const pts: [number, number][] = [];
    // paid string runs from the chalk box (B) leftward to the free end
    const xEnd = g.bx + (g.ax - g.bx) * paid;
    for (let i = 0; i <= NODES; i++) {
      const v = i / NODES; // along the paid length, from the free end toward B
      const x = xEnd + (g.bx - xEnd) * v;
      // u is measured from A over the full line once paid out
      const u = paid >= 1 ? (x - g.ax) / (g.bx - g.ax) : v;
      pts.push([x, g.y + disp(u)]);
    }
    let lift = 0;
    for (const [, y] of pts) lift = Math.max(lift, y - g.y);
    return { pts, lift };
  });
  return { paid: shapeAt(t, tm, g).paid, samples, visible, impacted, pullStrength };
};

/** Smooth SVG path through points (Catmull-Rom → cubic Bézier). */
export const smoothPath = (pts: [number, number][], dy = 0, dx = 0) => {
  if (pts.length < 2) return '';
  let d = `M${(pts[0][0] + dx).toFixed(2)},${(pts[0][1] + dy).toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${(c1x + dx).toFixed(2)},${(c1y + dy).toFixed(2)} ${(c2x + dx).toFixed(2)},${(c2y + dy).toFixed(2)} ${(p2[0] + dx).toFixed(2)},${(p2[1] + dy).toFixed(2)}`;
  }
  return d;
};
