// Mass-1 spring, semi-implicit Euler at fixed 1/120 s substeps (brief §4).
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  k: number;
  c: number;
  private acc = 0;
  constructor(value: number, k = 300, c = 26) {
    this.value = value;
    this.target = value;
    this.k = k;
    this.c = c;
  }
  to(target: number, k?: number, c?: number) {
    this.target = target;
    if (k !== undefined) this.k = k;
    if (c !== undefined) this.c = c;
    return this;
  }
  set(v: number) {
    this.value = v;
    this.target = v;
    this.velocity = 0;
    return this;
  }
  get settled() {
    return Math.abs(this.target - this.value) < 1e-4 && Math.abs(this.velocity) < 1e-3;
  }
  /** dt in ms. Returns true while moving. */
  step(dt: number): boolean {
    if (this.settled) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    const h = 1 / 120;
    this.acc += dt / 1000;
    while (this.acc >= h) {
      const a = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
      this.acc -= h;
    }
    return true;
  }
}
