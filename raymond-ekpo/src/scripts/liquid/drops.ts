// The droplets: a few drops of liquid glass that drift over the headline, melt together when they
// meet and pull apart again. One follows the cursor and gathers the others; a click scatters them
// with a splash of little drops that find their way back.

export type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** the size it settles at */
  base: number;
  /** where it wanders around, as a share of the field */
  ax: number;
  ay: number;
  phase: number;
  /** splash drops shrink away */
  life: number;
  cursor?: boolean;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Drops {
  list: Drop[] = [];
  private cursor: Drop;
  private target = { x: 0, y: 0, on: false };

  constructor(private w: number, private h: number, small: boolean, kind = 'hero') {
    // anchors spread over the field, biggest towards the middle; an inner page's head (kind
    // "head") is shorter, so it gets fewer, smaller drops off to the right of the title
    const spots: [number, number, number][] =
      kind === 'head'
        ? small
          ? [
              [0.78, 0.26, 34],
              [0.9, 0.44, 20],
            ]
          : [
              [0.6, 0.4, 72],
              [0.8, 0.62, 50],
              [0.9, 0.3, 28],
            ]
        : small
          ? [
              [0.3, 0.3, 50],
              [0.74, 0.38, 38],
              [0.88, 0.22, 22],
            ]
          : [
              [0.24, 0.34, 96],
              [0.55, 0.46, 78],
              [0.78, 0.3, 64],
              [0.92, 0.52, 34],
              [0.4, 0.58, 26],
            ];
    for (const [ax, ay, r] of spots) {
      this.list.push({ x: ax * w, y: ay * h, vx: 0, vy: 0, r: 0, base: r, ax, ay, phase: rand(0, 6.28), life: -1 });
    }
    this.cursor = { x: w / 2, y: h / 2, vx: 0, vy: 0, r: 0, base: small ? 0 : 36, ax: 0.5, ay: 0.5, phase: 0, life: -1, cursor: true };
    this.list.push(this.cursor);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  /** pointer position inside the field, or null when it leaves */
  point(x: number | null, y = 0) {
    if (x === null) {
      this.target.on = false;
      return;
    }
    if (!this.target.on) {
      this.cursor.x = x;
      this.cursor.y = y;
    }
    this.target = { x, y, on: true };
  }

  splash(x: number, y: number) {
    for (const d of this.list) {
      const dx = d.x - x;
      const dy = d.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 320) continue;
      const k = (1 - dist / 320) * 900;
      d.vx += (dx / dist) * k;
      d.vy += (dy / dist) * k;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rand(-0.3, 0.3);
      const sp = rand(380, 720);
      this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(7, 14), base: 0, ax: 0, ay: 0, phase: 0, life: 1 });
    }
    if (this.list.length > 22) this.list.splice(8, this.list.length - 22);
  }

  step(dt: number, time: number, appear: number) {
    const { w, h } = this;
    const c = this.cursor;
    for (const d of this.list) {
      let fx = 0;
      let fy = 0;
      if (d.cursor) {
        if (this.target.on) {
          fx = (this.target.x - d.x) * 160 - d.vx * 18;
          fy = (this.target.y - d.y) * 160 - d.vy * 18;
        }
        d.r += ((this.target.on ? d.base : 0) - d.r) * Math.min(1, dt * 7);
      } else if (d.life >= 0) {
        // splash drops: fly, slow down, shrink away
        d.life -= dt * 0.9;
        d.r = Math.max(0, d.r - dt * 9);
        fx = -d.vx * 3;
        fy = -d.vy * 3;
      } else {
        // wander around an anchor on slow, separate currents
        const tx = d.ax * w + Math.sin(time * 0.21 + d.phase) * w * 0.07 + Math.sin(time * 0.13 + d.phase * 2.1) * w * 0.04;
        const ty = d.ay * h + Math.cos(time * 0.17 + d.phase * 1.3) * h * 0.06;
        fx = (tx - d.x) * 2.2 - d.vx * 2.4;
        fy = (ty - d.y) * 2.2 - d.vy * 2.4;
        // the cursor drop gathers the drops near it
        if (this.target.on && c.r > 4) {
          const dx = c.x - d.x;
          const dy = c.y - d.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 260 && dist > 1) {
            const pull = (1 - dist / 260) * 260;
            fx += (dx / dist) * pull;
            fy += (dy / dist) * pull;
          }
        }
        const breathe = 1 + Math.sin(time * 1.3 + d.phase) * 0.035;
        d.r += (d.base * appear * breathe - d.r) * Math.min(1, dt * 2.5);
      }
      d.vx += fx * dt;
      d.vy += fy * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    this.list = this.list.filter((d) => d.life < 0 || d.r > 0.6);
  }
}
