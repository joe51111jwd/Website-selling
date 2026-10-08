// The puff (brief 4.1): a small matte powder puff lifting off the deposited line. Owner: A2.
// canvas2D on every tier. <= 600 sprites on desktop, <= 300 on phones, drawn from 8 pre-rendered
// soft powder sprites that are shaded top-lit (lighter on top, darker beneath), so they read as
// matte powder, not glow. Normal source-over compositing, never additive. Colours sampled from
// c34's plume, desaturated. Motion: rise <= 140 px with drag, slight growth toward the lens, then
// gravity settles them back toward the line; gone by S + 0.8 s. Seeded and closed-form in tau, so
// `render(tau)` is a pure function (capture seeks repeat exactly).

import type { Vec } from './ChalkString';

/** c34 plume, sampled and desaturated (matte powder, not the bright #A9C3F5 highlight alone) */
const TINTS: Array<[number, number, number]> = [
  [150, 172, 210],
  [122, 146, 190],
  [169, 195, 245], // --powder: the lit tops
  [104, 124, 160],
];

const SPRITES = 8;
const SPRITE_PX = 64;
const LIFE = 0.77; // impact is at S + ~0.03, the puff is gone by S + 0.8

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSprites(): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  const rnd = mulberry32(0x5eed);
  for (let s = 0; s < SPRITES; s++) {
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE_PX;
    const g = c.getContext('2d')!;
    const [r, gg, b] = TINTS[s % TINTS.length];
    const img = g.createImageData(SPRITE_PX, SPRITE_PX);
    const cx = SPRITE_PX / 2;
    // a few lumps per sprite so edges are irregular, like a pinch of powder
    const lumps = Array.from({ length: 5 }, () => ({
      x: cx + (rnd() - 0.5) * 18,
      y: cx + (rnd() - 0.5) * 14,
      r: 9 + rnd() * 12,
    }));
    for (let y = 0; y < SPRITE_PX; y++) {
      for (let x = 0; x < SPRITE_PX; x++) {
        let d = 0;
        for (const l of lumps) {
          const q = 1 - Math.hypot(x - l.x, y - l.y) / l.r;
          if (q > d) d = q;
        }
        if (d <= 0) continue;
        const grain = 0.75 + rnd() * 0.5;
        const a = Math.min(1, d * d * (3 - 2 * d)) * grain;
        // top-lit: +16 % on the upper half, -22 % on the lower half
        const lit = 1 + 0.16 * (1 - y / cx) - (y > cx ? 0.22 * ((y - cx) / cx) : 0);
        const i = (y * SPRITE_PX + x) * 4;
        img.data[i] = Math.min(255, r * lit);
        img.data[i + 1] = Math.min(255, gg * lit);
        img.data[i + 2] = Math.min(255, b * lit);
        img.data[i + 3] = Math.round(a * 150);
      }
    }
    g.putImageData(img, 0, 0);
    out.push(c);
  }
  return out;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  v0: number;
  k: number;
  g: number;
  size: number;
  grow: number;
  sprite: number;
  delay: number;
  alpha: number;
}

export class Dust2D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: HTMLCanvasElement[] | null = null;
  private particles: Particle[] = [];
  private dpr = 1;
  private w = 0;
  private h = 0;
  private drawn = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.drawn = true;
    this.clear();
  }

  /**
   * Seed a puff along the line L -> R. `amount` (0..1, pull strength) scales the sprite count
   * (40-100 %) and the velocity. `max`: 600 desktop, 300 phone. `scale`: px per frame px ratio
   * (keeps the rise proportional on small frames).
   */
  emit(L: Vec, R: Vec, amount: number, seed: number, max: number, scale = 1) {
    if (!this.sprites) this.sprites = makeSprites();
    const rnd = mulberry32(0x0d057 + seed * 977);
    const A = Math.max(0, Math.min(1, amount));
    const count = Math.round(max * (0.4 + 0.6 * A));
    const len = Math.hypot(R.x - L.x, R.y - L.y) || 1;
    const nx = -(R.y - L.y) / len;
    const ny = (R.x - L.x) / len;
    const s = Math.max(0.45, Math.min(1.2, scale));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      // denser toward the middle of the line, where the string slapped hardest
      const u = Math.min(1, Math.max(0, 0.5 + (rnd() + rnd() + rnd() - 1.5) * 0.62));
      const off = (rnd() - 0.5) * 6;
      const strong = rnd();
      this.particles.push({
        x: L.x + (R.x - L.x) * u + nx * off,
        y: L.y + (R.y - L.y) * u + ny * off,
        vx: (rnd() - 0.5) * 90 * s,
        v0: (110 + strong * strong * 560) * (0.55 + 0.45 * A) * s,
        k: 3.6 + rnd() * 2.4,
        g: 300 * s,
        size: (5 + rnd() * rnd() * 24) * s,
        grow: 0.25 + rnd() * 0.45,
        sprite: Math.floor(rnd() * SPRITES),
        delay: rnd() * 0.05,
        alpha: 0.35 + rnd() * 0.5,
      });
    }
  }

  clear() {
    if (!this.drawn) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawn = false;
  }

  /** Draw the puff at tau seconds after impact. Returns false once it is over. */
  render(tau: number): boolean {
    if (!this.sprites || tau < 0 || tau > LIFE || !this.particles.length) {
      this.clear();
      return tau <= LIFE && tau >= 0;
    }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const fadeOut = 1 - Math.max(0, (tau - 0.42) / (LIFE - 0.42));
    for (const p of this.particles) {
      const t = tau - p.delay;
      if (t <= 0) continue;
      const e = Math.exp(-p.k * t);
      const gk = p.g / p.k;
      const rise = ((p.v0 + gk) / p.k) * (1 - e) - gk * t;
      const h = Math.max(0, rise);
      const x = p.x + (p.vx / p.k) * (1 - e);
      const y = p.y - h;
      const life = t / LIFE;
      const size = p.size * (1 + p.grow * Math.min(1, life * 1.6));
      const fadeIn = Math.min(1, t / 0.045);
      const a = p.alpha * fadeIn * fadeOut * fadeOut;
      if (a <= 0.004) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(this.sprites[p.sprite], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    this.drawn = true;
    return true;
  }

  dispose() {
    this.particles = [];
    this.clear();
  }
}
