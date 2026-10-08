// The chalk string (brief 4.1, 6 SNAP). Owner: A2. Pure logic, no DOM: every tier uses it.
//
// - Pulling: a 64-node Verlet chain pinned at both control points, 12 constraint iterations, no
//   gravity (the view is top-down). The grabbed node follows the pointer; the rest bows under it.
// - Release: the pulled shape returns under tension as an underdamped spring released from rest
//   at its displacement (SNAP: zeta 0.12, omega 2*pi*9 Hz). Impact fires at the first
//   zero-crossing (~30 ms), then a two-cycle, 160 ms residual buzz at 20 % amplitude.
// Release and buzz are closed-form in t, so `?capture` seeks are exact and repeatable.

import { SNAP_OMEGA, SNAP_ZETA } from '../system/easing';
import { STRING } from './heroLayout';

export interface Vec {
  x: number;
  y: number;
}

const OMEGA_D = SNAP_OMEGA * Math.sqrt(1 - SNAP_ZETA * SNAP_ZETA);
const PHASE_K = SNAP_ZETA / Math.sqrt(1 - SNAP_ZETA * SNAP_ZETA);

/** Displacement factor after release from rest at displacement 1 (zero initial velocity). */
export function releaseFactor(t: number): number {
  if (t <= 0) return 1;
  return Math.exp(-SNAP_ZETA * SNAP_OMEGA * t) * (Math.cos(OMEGA_D * t) + PHASE_K * Math.sin(OMEGA_D * t));
}

/** First zero-crossing of releaseFactor: the string slaps the slab (impact). */
export const IMPACT_T = (Math.PI / 2 + Math.asin(SNAP_ZETA)) / OMEGA_D;

/** Residual buzz factor at tau seconds after impact (two cycles over 160 ms, 20 %, decaying). */
export function buzzFactor(tau: number): number {
  const T = STRING.buzzMs / 1000;
  if (tau <= 0 || tau >= T) return 0;
  const env = 1 - tau / T;
  // the string arrives from the pulled side: start the buzz going through the slab, small
  return -STRING.buzzAmp * Math.sin((2 * Math.PI * 2 * tau) / T) * env * env;
}

export class ChalkString {
  readonly n: number;
  /** current node positions (x, y interleaved), px in the stage's coordinate space */
  readonly p: Float32Array;
  private q: Float32Array;
  private rest: Float32Array;
  private L: Vec = { x: 0, y: 0 };
  private R: Vec = { x: 1, y: 0 };
  private grabbed = -1;
  private target: Vec = { x: 0, y: 0 };
  /** max perpendicular deflection, px */
  cap = 120;

  constructor(n: number = STRING.nodes) {
    this.n = n;
    this.p = new Float32Array(n * 2);
    this.q = new Float32Array(n * 2);
    this.rest = new Float32Array(n * 2);
  }

  setEnds(L: Vec, R: Vec) {
    this.L = { ...L };
    this.R = { ...R };
    for (let i = 0; i < this.n; i++) {
      const u = i / (this.n - 1);
      this.rest[i * 2] = L.x + (R.x - L.x) * u;
      this.rest[i * 2 + 1] = L.y + (R.y - L.y) * u;
    }
    this.settle();
  }

  get ends(): [Vec, Vec] {
    return [this.L, this.R];
  }

  /** unit vector along the line (L -> R) and its normal (pointing "down" on screen for a left-to-right line) */
  get axes(): { along: Vec; perp: Vec; length: number } {
    const dx = this.R.x - this.L.x;
    const dy = this.R.y - this.L.y;
    const length = Math.hypot(dx, dy) || 1;
    const along = { x: dx / length, y: dy / length };
    return { along, perp: { x: -along.y, y: along.x }, length };
  }

  restAt(i: number): Vec {
    return { x: this.rest[i * 2], y: this.rest[i * 2 + 1] };
  }

  /** put every node back on the taut line */
  settle() {
    this.p.set(this.rest);
    this.q.set(this.rest);
    this.grabbed = -1;
  }

  /** distance (px) from a point to the taut line segment, and the nearest node index */
  nearest(x: number, y: number): { dist: number; index: number } {
    const { along, perp, length } = this.axes;
    const rx = x - this.L.x;
    const ry = y - this.L.y;
    const s = Math.max(0, Math.min(length, rx * along.x + ry * along.y));
    const d = Math.abs(rx * perp.x + ry * perp.y);
    const outside = rx * along.x + ry * along.y;
    const extra = outside < 0 ? -outside : outside > length ? outside - length : 0;
    const index = Math.max(1, Math.min(this.n - 2, Math.round((s / length) * (this.n - 1))));
    return { dist: Math.hypot(d, extra), index };
  }

  /** Grab the node nearest (x, y). Returns false if the point is outside `radius`. */
  grab(x: number, y: number, radius: number, index?: number): boolean {
    const near = this.nearest(x, y);
    if (index === undefined && near.dist > radius) return false;
    this.grabbed = index ?? near.index;
    this.target = { x, y };
    return true;
  }

  get isGrabbed(): boolean {
    return this.grabbed >= 0;
  }

  get grabIndex(): number {
    return this.grabbed;
  }

  /** Move the grabbed node's target (clamped: perpendicular <= cap, along +-28 px). */
  drag(x: number, y: number) {
    if (this.grabbed < 0) return;
    this.target = { x, y };
  }

  private clampedTarget(): Vec {
    const i = this.grabbed;
    const r = this.restAt(i);
    const { along, perp } = this.axes;
    const dx = this.target.x - r.x;
    const dy = this.target.y - r.y;
    const a = Math.max(-28, Math.min(28, dx * along.x + dy * along.y));
    const raw = dx * perp.x + dy * perp.y;
    // soft limit: approaches the cap without a hard wall
    const c = this.cap;
    const pd = c * Math.tanh(raw / c);
    return { x: r.x + along.x * a + perp.x * pd, y: r.y + along.y * a + perp.y * pd };
  }

  /** One Verlet step (dt seconds). */
  step(dt: number) {
    const n = this.n;
    const p = this.p;
    const q = this.q;
    const damping = Math.pow(0.86, Math.max(0.25, Math.min(3, dt * 60)));
    for (let i = 1; i < n - 1; i++) {
      const ix = i * 2;
      const vx = (p[ix] - q[ix]) * damping;
      const vy = (p[ix + 1] - q[ix + 1]) * damping;
      q[ix] = p[ix];
      q[ix + 1] = p[ix + 1];
      // a weak pull back toward the taut line stands in for the string's own tension
      const rx = this.rest[ix] - p[ix];
      const ry = this.rest[ix + 1] - p[ix + 1];
      p[ix] += vx + rx * 0.012;
      p[ix + 1] += vy + ry * 0.012;
    }
    const pin = (i: number, v: Vec) => {
      p[i * 2] = v.x;
      p[i * 2 + 1] = v.y;
    };
    const restLen = this.axes.length / (n - 1);
    const g = this.grabbed;
    const gt = g >= 0 ? this.clampedTarget() : null;
    for (let k = 0; k < STRING.iterations; k++) {
      pin(0, this.L);
      pin(n - 1, this.R);
      if (gt) pin(g, gt);
      for (let i = 0; i < n - 1; i++) {
        const a = i * 2;
        const b = a + 2;
        const dx = p[b] - p[a];
        const dy = p[b + 1] - p[a + 1];
        const len = Math.hypot(dx, dy) || 1e-6;
        const diff = (len - restLen) / len;
        const fixedA = i === 0 || i === g;
        const fixedB = i + 1 === n - 1 || i + 1 === g;
        if (fixedA && fixedB) continue;
        const wa = fixedA ? 0 : fixedB ? 1 : 0.5;
        const wb = fixedB ? 0 : fixedA ? 1 : 0.5;
        p[a] += dx * diff * wa;
        p[a + 1] += dy * diff * wa;
        p[b] -= dx * diff * wb;
        p[b + 1] -= dy * diff * wb;
      }
    }
    pin(0, this.L);
    pin(n - 1, this.R);
    if (gt) pin(g, gt);
  }

  /** Current offsets from the taut line (x, y interleaved). */
  offsets(): Float32Array {
    const o = new Float32Array(this.n * 2);
    for (let i = 0; i < o.length; i++) o[i] = this.p[i] - this.rest[i];
    return o;
  }

  /** Max perpendicular deflection, px */
  deflection(): number {
    const { perp } = this.axes;
    let m = 0;
    for (let i = 0; i < this.n; i++) {
      const d = Math.abs((this.p[i * 2] - this.rest[i * 2]) * perp.x + (this.p[i * 2 + 1] - this.rest[i * 2 + 1]) * perp.y);
      if (d > m) m = d;
    }
    return m;
  }

  /** Let go: returns the offsets the analytic release starts from, and the pull strength 0..1. */
  release(): { offsets: Float32Array; amount: number } {
    const offsets = this.offsets();
    const amount = Math.max(0, Math.min(1, this.deflection() / this.cap));
    this.grabbed = -1;
    return { offsets, amount };
  }

  /**
   * Analytic pulled shape (ghost pull, tap, keys, capture): a pluck at node `index` displaced
   * `amount * cap` along the normal, with the slight rounding a finger gives the apex.
   */
  pluckShape(index: number, amount: number, sign = 1): Float32Array {
    const n = this.n;
    const o = new Float32Array(n * 2);
    const { perp } = this.axes;
    const d = amount * this.cap * sign;
    const k = index / (n - 1);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      // triangle with a softened apex
      let w = u <= k ? u / k : (1 - u) / (1 - k);
      const apex = 1 - Math.abs(u - k) / 0.06;
      if (apex > 0) w = w * (1 - 0.18 * apex * apex) + 0.18 * apex * apex * 0.97;
      o[i * 2] = perp.x * d * w;
      o[i * 2 + 1] = perp.y * d * w;
    }
    return o;
  }

  /** Write rest + offsets * f into `out` (x, y interleaved). */
  shape(offsets: Float32Array, f: number, out: Float32Array = this.p): Float32Array {
    for (let i = 0; i < this.n * 2; i++) out[i] = this.rest[i] + offsets[i] * f;
    return out;
  }
}

/** SVG path for interleaved points */
export function pathOf(pts: Float32Array, n: number, dx = 0, dy = 0): string {
  let d = `M${(pts[0] + dx).toFixed(1)} ${(pts[1] + dy).toFixed(1)}`;
  for (let i = 1; i < n; i++) d += `L${(pts[i * 2] + dx).toFixed(1)} ${(pts[i * 2 + 1] + dy).toFixed(1)}`;
  return d;
}
