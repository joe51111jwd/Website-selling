// A damped spring integrated with fixed sub-steps (semi-implicit Euler), stable at any frame rate.
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  constructor(value: number, public k = 120, public c = 18) {
    this.value = value;
    this.target = value;
  }
  step(dt: number) {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }
  }
  get resting() {
    return Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.05;
  }
  snap(v: number) {
    this.value = this.target = v;
    this.velocity = 0;
  }
}
