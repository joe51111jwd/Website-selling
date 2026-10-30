import { easeOutCubic } from './easing';

// A reversible time-based tween: set a new goal at any moment and it eases from wherever it is.
export class Tween {
  value: number;
  private from: number;
  private to: number;
  private t0 = 0;
  constructor(value = 0, public dur = 600, public ease: (t: number) => number = easeOutCubic) {
    this.value = this.from = this.to = value;
  }
  set(goal: number, now: number, instant = false) {
    if (goal === this.to) return;
    if (instant) {
      this.value = this.from = this.to = goal;
      return;
    }
    this.from = this.value;
    this.to = goal;
    this.t0 = now;
  }
  update(now: number) {
    const u = this.dur <= 0 ? 1 : (now - this.t0) / this.dur;
    this.value = u >= 1 ? this.to : this.from + (this.to - this.from) * this.ease(u);
    return this.value;
  }
  get goal() {
    return this.to;
  }
  get busy() {
    return this.value !== this.to;
  }
}
