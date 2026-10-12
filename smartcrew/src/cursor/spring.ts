// A damped spring, tuned by natural frequency (rad/s) and damping ratio (1 = no overshoot).
// Integrated with semi-implicit Euler in fixed sub-steps so stiff springs stay stable.

const STEP = 1 / 240;

export class Spring {
  x: number;
  v = 0;
  target: number;
  w: number;
  z: number;
  eps: number;

  constructor(x: number, w: number, z: number, eps = 0.02) {
    this.x = this.target = x;
    this.w = w;
    this.z = z;
    this.eps = eps;
  }

  tune(w: number, z: number) {
    this.w = w;
    this.z = z;
  }

  snap(x = this.target) {
    this.x = this.target = x;
    this.v = 0;
  }

  /** Advances by dt seconds. Returns true while still moving. */
  step(dt: number) {
    if (this.x === this.target && this.v === 0) return false;
    const k = this.w * this.w;
    const c = 2 * this.z * this.w;
    const n = Math.max(1, Math.ceil(dt / STEP));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (-k * (this.x - this.target) - c * this.v) * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.x - this.target) < this.eps && Math.abs(this.v) < this.eps * 10) {
      this.snap();
      return false;
    }
    return true;
  }
}

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const r2 = (v: number) => Math.round(v * 100) / 100;
