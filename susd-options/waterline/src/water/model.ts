import { Spring } from '../motion/spring';

const TAU = Math.PI * 2;
export const MAX_RIPPLES = 6;

export type Ripple = { x: number; t0: number; a: number };
type Scripted = { from: number; to: number; t0: number; dur: number; ease: (t: number) => number; done?: () => void };

// The one water model. The shader evaluates exactly the same surface formula with the same
// uniforms, so the clip lines on the type and the rendered water always agree.
export class WaterModel {
  W = 1440;
  V = 900;
  A1 = 5;
  A2 = 2.5;
  t = 0; // seconds, drives the swell and ripples
  frozen = false; // CSS fallback: a still surface
  level = new Spring(2000, 120, 18);
  amp = 1; // smoothed amplitude multiplier
  ampGoal = 1;
  spikeAt = -1; // chop spike (the drain)
  ct = 0; // caustic clock
  ctSpeed = 1;
  ctGoal = 1;
  foam = 1;
  ripples: Ripple[] = [];
  scripted: Scripted | null = null;

  setSize(W: number, V: number, phone: boolean) {
    this.W = W;
    this.V = V;
    this.A1 = phone ? 3.5 : 5;
    this.A2 = phone ? 1.8 : 2.5;
  }

  /** Amplitude multiplier this frame, including a decaying chop spike. */
  ampNow() {
    let m = this.amp;
    if (this.spikeAt >= 0) {
      const u = (this.t - this.spikeAt) / 0.6;
      if (u < 1) m *= 1 + 2 * (1 - u) * (1 - u);
      else this.spikeAt = -1;
    }
    return this.frozen ? 1 : m; // the CSS fallback keeps a still, gently shaped surface
  }

  surfaceY(x: number, m = this.ampNow()) {
    const t = this.frozen ? 0 : this.t;
    let y = this.level.value + this.A1 * m * Math.sin((TAU * 1.6 * x) / this.W + 0.9 * t) + this.A2 * m * Math.sin((TAU * 3.7 * x) / this.W - 1.7 * t);
    for (const r of this.ripples) {
      const dt = t - r.t0;
      if (dt < 0) continue;
      const d = Math.abs(x - r.x);
      y += r.a * Math.exp(-1.6 * dt) * Math.exp(-d / 160) * Math.sin(0.045 * d - 7 * dt);
    }
    return y;
  }

  ripple(x: number, a = 8) {
    if (this.frozen) return;
    if (this.ripples.length >= MAX_RIPPLES) this.ripples.shift();
    this.ripples.push({ x, t0: this.t, a });
  }

  spike() {
    this.spikeAt = this.t;
  }

  /** Tween the level to `to` over `dur` ms (the drain). Runs on the wall clock, so a slow device never stretches it. */
  script(to: number, dur: number, ease: (t: number) => number, done?: () => void) {
    this.scripted = { from: this.level.value, to, t0: performance.now(), dur, ease, done };
  }

  step(dt: number) {
    this.t += dt;
    const e = 1 - Math.exp(-dt * 2.5);
    this.amp += (this.ampGoal - this.amp) * e;
    this.ctSpeed += (this.ctGoal - this.ctSpeed) * e;
    this.ct += dt * this.ctSpeed;
    const s = this.scripted;
    if (s) {
      const u = Math.min(1, (performance.now() - s.t0) / s.dur);
      const prev = this.level.value;
      this.level.value = s.from + (s.to - s.from) * s.ease(u);
      this.level.velocity = dt > 0 ? (this.level.value - prev) / dt : 0;
      this.level.target = this.level.value;
      if (u >= 1) {
        this.scripted = null;
        s.done?.();
      }
    } else {
      this.level.step(dt);
    }
    if (this.ripples.length) this.ripples = this.ripples.filter((r) => this.t - r.t0 < 3.6);
  }

  /** Highest point the surface can reach this frame (the shader skips everything above it). */
  crest(m = this.ampNow()) {
    let a = (this.A1 + this.A2) * m;
    for (const r of this.ripples) a += r.a;
    return this.level.value - a - 4;
  }

  /** True when nothing on screen can move: water off-screen and at rest. */
  get idle() {
    return !this.scripted && this.level.resting && this.level.value > this.V + 30 && this.ripples.length === 0;
  }
}
