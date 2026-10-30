import { tick } from './ticker';
import { MOTION } from '../hooks/media';

// Choreography on the single rAF loop of the page, against wall-clock time. The state of every
// element is a pure function of elapsed time, so any frame (even a late one) is coherent.
// Before-states are written inline the moment a tween is added; release() hands every element
// back to its resting CSS.

export type Ease = (t: number) => number;

/** CSS cubic-bezier() as a function. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
}

export const EASES = {
  linear: (t: number) => t,
  outCubic: cubicBezier(0.33, 1, 0.68, 1),
  outQuint: cubicBezier(0.22, 1, 0.36, 1),
  slide: cubicBezier(0.6, 0, 0.3, 1),
};

export const RGB = {
  ink: [28, 26, 23] as const,
  struck: [125, 120, 112] as const,
};

/**
 * The struck ink an element settles to (its CSS --struck: the large struck grey, or the darker
 * one used under 24 px), so a colour tween lands exactly where the resting CSS takes over.
 */
export function struckRGB(el: Element | null | undefined): readonly number[] {
  if (!el) return RGB.struck;
  const v = getComputedStyle(el).getPropertyValue('--struck').trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return RGB.struck;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Tween = { start: number; dur: number; ease: Ease; apply: (p: number) => void; last: number };
type Enter = { opacity?: number; x?: number; y?: number; scale?: number; blur?: number; base?: string };

export class Clock {
  private tweens: Tween[] = [];
  private touched = new Map<HTMLElement | SVGElement, string[]>();
  private doneCbs: (() => void)[] = [];
  private t0 = performance.now();
  private running = false;
  private finished = false;
  private stop: (() => void) | null = null;
  private lastFrame = 0;
  private slow = 0;

  private touch(el: HTMLElement | SVGElement, props: string[]) {
    const list = this.touched.get(el) ?? [];
    props.forEach((p) => !list.includes(p) && list.push(p));
    this.touched.set(el, list);
  }

  /** A raw tween: apply(easedProgress). apply(0) runs now. */
  tween(delay: number, dur: number, ease: Ease, apply: (p: number) => void) {
    const tw: Tween = { start: delay, dur: Math.max(1, dur), ease, apply, last: -1 };
    this.tweens.push(tw);
    apply(0);
    tw.last = 0;
    this.run();
  }

  /** Fade an element in from an offset (translate / scale / blur). */
  enter(el: HTMLElement | SVGElement | null | undefined, delay: number, dur: number, ease: Ease, from: Enter) {
    if (!el) return;
    const s = el.style;
    const o0 = from.opacity ?? 0;
    const base = from.base ? `${from.base} ` : '';
    this.touch(el, ['opacity', 'transform', ...(from.blur ? ['filter'] : [])]);
    this.tween(delay, dur, ease, (p) => {
      const q = 1 - p;
      s.opacity = String(o0 + (1 - o0) * p);
      const tx = (from.x ?? 0) * q;
      const ty = (from.y ?? 0) * q;
      const sc = 1 + ((from.scale ?? 1) - 1) * q;
      s.transform = p >= 1 ? from.base ?? 'none' : `${base}translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)${sc !== 1 ? ` scale(${sc.toFixed(4)})` : ''}`;
      if (from.blur) s.filter = p >= 1 ? 'none' : `blur(${(from.blur * q).toFixed(2)}px)`;
    });
  }

  /** Colour from one rgb to another. */
  color(el: HTMLElement | null | undefined, delay: number, dur: number, ease: Ease, from: readonly number[], to: readonly number[]) {
    if (!el) return;
    this.touch(el, ['color']);
    this.tween(delay, dur, ease, (p) => {
      const c = from.map((v, i) => Math.round(v + (to[i] - v) * p));
      el.style.color = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    });
  }

  /** Draw an SVG mark on with stroke-dashoffset (ruled: linear by default). */
  draw(path: SVGGeometryElement | null | undefined, delay: number, dur: number, ease: Ease = EASES.linear) {
    if (!path) return;
    const len = path.getTotalLength();
    const s = path.style;
    s.strokeDasharray = `${len} ${len + 24}`;
    this.touch(path, ['strokeDasharray', 'strokeDashoffset']);
    this.tween(delay, dur, ease, (p) => {
      s.strokeDashoffset = String((len + 12) * (1 - p));
      if (p >= 1) {
        s.strokeDasharray = '';
        s.strokeDashoffset = '';
      }
    });
  }

  private frame(now: number) {
    // Slow-frame guard: if frames keep arriving late (a starved renderer or a weak device),
    // jump to the end state rather than drip the choreography out at a few frames a second.
    if (this.lastFrame && !MOTION) {
      this.slow = now - this.lastFrame > 160 ? this.slow + 1 : 0;
      if (this.slow >= 3) {
        this.finish();
        return false;
      }
    }
    this.lastFrame = now;
    const t = now - this.t0;
    let live = false;
    for (const tw of this.tweens) {
      const raw = (t - tw.start) / tw.dur;
      const p = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
      if (p !== tw.last) {
        tw.apply(p >= 1 ? 1 : tw.ease(p));
        tw.last = p;
      }
      if (p < 1) live = true;
    }
    if (!live) this.complete();
    return live;
  }

  private run() {
    if (this.running || this.finished) return;
    this.running = true;
    this.stop = tick((now) => {
      const live = this.frame(now);
      if (!live) this.running = false;
      return live;
    });
  }

  /** Jump to the end state ("any input skips"). */
  finish() {
    for (const tw of this.tweens) {
      if (tw.last !== 1) {
        tw.apply(1);
        tw.last = 1;
      }
    }
    this.stop?.();
    this.running = false;
    this.complete();
  }

  /** Hand every element back to its resting CSS. */
  release() {
    this.finish();
    this.touched.forEach((props, el) => {
      const st = el.style as unknown as Record<string, string>;
      props.forEach((p) => (st[p] = ''));
    });
    this.touched.clear();
  }

  onDone(cb: () => void) {
    if (this.finished) cb();
    else this.doneCbs.push(cb);
  }

  private complete() {
    if (this.finished) return;
    this.finished = true;
    this.doneCbs.splice(0).forEach((cb) => cb());
  }
}
