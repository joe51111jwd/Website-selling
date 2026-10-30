// A damped spring (stiffness k, damping c, unit mass), integrated in fixed 1/240 s substeps.
export class Spring {
  x: number;
  v = 0;
  target: number;
  constructor(x: number, public k: number, public c: number) {
    this.x = x;
    this.target = x;
  }
  /** Advances the spring; returns true while it is still moving. */
  step(dt: number): boolean {
    let t = dt;
    while (t > 1e-6) {
      const h = Math.min(t, 1 / 240);
      const a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
      t -= h;
    }
    if (Math.abs(this.x - this.target) < 0.0005 && Math.abs(this.v) < 0.005) {
      this.x = this.target;
      this.v = 0;
      return false;
    }
    return true;
  }
  jump(x: number) {
    this.x = this.target = x;
    this.v = 0;
  }
  get moving() {
    return this.x !== this.target || this.v !== 0;
  }
}
