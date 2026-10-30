import Lenis from 'lenis';
import { WaterModel } from '../water/model';
import { createGL, type GLWater } from '../water/gl';
import { easeInCubic, easeOutCubic } from '../motion/easing';
import { PARAMS } from './params';
import { lapEndP } from '../sections/cycle.timeline';

export type Frame = {
  now: number; // ms
  dt: number; // s
  scrollY: number;
  V: number;
  W: number;
  phone: boolean;
  compact: boolean; // < 1280 px wide: no gauge names
  jump: boolean; // first frames after a debug jump: tweens land instantly
};

/** A section that owns the water level while it is the last section to have entered the viewport. */
export interface Controller {
  measure(scrollY: number, V: number, W: number): void;
  start(): number; // document y where this section's top is
  /** Scroll position from which this section owns the water (default: when its top enters the viewport). */
  owns?(V: number): number;
  update(f: Frame): void;
  target(f: Frame): number;
  skipIntro?(): void;
}

type Wet = {
  root: HTMLElement;
  dry: HTMLElement;
  wet: HTMLElement;
  words: HTMLElement[];
  lines: number[];
  wobble: boolean;
  state: number; // -1 unknown, 0 dry, 1 split, 2 wet
  rect: DOMRect | null;
  dx: number; // the wet copy's box offset from the dry copy's (it bleeds sideways so the wobble is never cut)
};

const SAMPLES = 56;
const INTRO_MS = 2400; // the intro ends on its own (and on any input or scroll)
const BLEED = 32;

class Engine {
  model = new WaterModel();
  gl: GLWater | null = null;
  canvas: HTMLCanvasElement | null = null;
  css: HTMLElement | null = null; // CSS fallback water
  fallback = false;
  reduced = false;
  lenis: Lenis | null = null;
  controllers: Controller[] = [];
  wets: Wet[] = [];
  frameHooks: ((f: Frame) => void)[] = [];
  V = 900;
  W = 1440;
  phone = false;
  compact = false;
  dpr = 1;
  running = false;
  started = false;
  last = 0;
  fontsReady = false;
  introAt = -1; // performance.now() when the intro starts (fonts ready)
  introSkipped = false;
  drained = false;
  jumpFrames = 0;
  snapNext = true;
  private measureTimer = 0;
  private lastTargets: { t: number; v: number }[] = [];
  private lastAutoRipple = 0;
  private pointer = { x: 0, y: 0, t: 0, side: 0, cool: 0 };
  private glVisible = false;
  // Frame-time probe: the live water only stays on where it can hold a smooth frame rate. It samples
  // once the intro is over and the water covers a real part of the screen (the costly case), and a
  // watchdog keeps listening for the first 20 s of on-screen water.
  private probe = { at: -1, dts: [] as number[], done: false };
  private watch = { ring: new Float32Array(60), n: 0, i: 0, ms: 0, off: false };

  /* ---------- setup ---------- */

  boot(opts: { canvas: HTMLCanvasElement | null; css: HTMLElement | null; reduced: boolean }) {
    if (this.started) return;
    this.started = true;
    this.reduced = opts.reduced;
    this.readViewport();
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!PARAMS.section) window.scrollTo(0, 0);

    this.fallback = opts.reduced || PARAMS.fallback || !opts.canvas;
    this.canvas = opts.canvas;
    this.css = opts.css;
    if (!this.fallback && opts.canvas) {
      this.gl = createGL(opts.canvas);
      if (!this.gl) this.fallback = true;
    }
    document.documentElement.dataset.water = opts.reduced ? 'static' : this.fallback ? 'css' : 'gl';
    // Automated browsers (screenshots, audits) render WebGL in software, so their frame times say
    // nothing about a real device: they keep the live water. ?gl=1 forces it too.
    this.probe.done = this.fallback || PARAMS.gl || navigator.webdriver === true;
    this.watch.off = this.probe.done; // the same bypass silences the watchdog
    this.model.frozen = this.fallback;
    this.model.setSize(this.W, this.V, this.phone);
    this.resizeSurfaces();

    if (!opts.reduced && !this.phone && !matchMedia('(pointer: coarse)').matches) {
      this.lenis = new Lenis({ syncTouch: false, lerp: 0.1, wheelMultiplier: 1 });
    }

    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    if (!opts.reduced) {
      for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.addEventListener(ev, this.onInput, { passive: true });
      window.addEventListener('pointermove', this.onPointer, { passive: true });
    }
    window.addEventListener('scroll', this.wake, { passive: true });

    const fontsDone = () => {
      if (this.fontsReady) return;
      this.fontsReady = true;
      document.documentElement.classList.add('fonts-ready');
      this.measure();
      if (!opts.reduced) this.afterFirstMeasure();
    };
    const timeout = window.setTimeout(fontsDone, 1200);
    document.fonts?.ready.then(() => {
      window.clearTimeout(timeout);
      fontsDone();
    });
    // Re-measure if late layout shifts happen (font swap, address bar).
    new ResizeObserver(() => this.scheduleMeasure()).observe(document.body);
    this.wake();
  }

  private afterFirstMeasure() {
    this.probe.at = performance.now();
    const jump = this.debugJumpY();
    if (jump !== null) {
      this.skipIntro();
      this.scrollTo(jump, true);
      this.jumpFrames = 6;
      this.snapNext = true;
    } else if (PARAMS.n !== null) {
      this.skipIntro();
      this.snapNext = true;
    } else {
      this.introAt = performance.now();
      document.documentElement.classList.add('intro-run');
    }
    this.wake();
  }

  private debugJumpY(): number | null {
    const s = PARAMS.section;
    if (!s) return null;
    const el = document.getElementById(s === 'oxygen' ? 'cycle' : s);
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - this.V;
    if (s === 'turn') return top + travel * 0.8;
    if (s === 'oxygen') return top + travel * 0.95;
    return top + travel * lapEndP(PARAMS.lap ?? 1);
  }

  readViewport() {
    this.V = window.innerHeight;
    this.W = document.documentElement.clientWidth || window.innerWidth;
    this.phone = this.W <= 640;
    this.compact = this.W < 1280;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.phone ? 1.25 : 1.5);
    document.documentElement.classList.toggle('is-phone', this.phone);
    document.documentElement.classList.toggle('is-compact', this.compact);
  }

  private resizeSurfaces() {
    this.gl?.resize(this.W, this.V, this.dpr);
    if (this.css) this.buildCssWave();
  }

  /* ---------- registration ---------- */

  addController(c: Controller) {
    this.controllers.push(c);
    this.scheduleMeasure();
    return () => {
      this.controllers = this.controllers.filter((x) => x !== c);
    };
  }

  addWet(root: HTMLElement, wobble: boolean) {
    const dry = root.children[0] as HTMLElement;
    const wet = root.children[1] as HTMLElement;
    const w: Wet = { root, dry, wet, words: Array.from(wet.querySelectorAll<HTMLElement>('.w')), lines: [], wobble, state: -1, rect: null, dx: 0 };
    this.wets.push(w);
    this.scheduleMeasure();
    this.wake();
    return () => {
      this.wets = this.wets.filter((x) => x !== w);
    };
  }

  onFrame(fn: (f: Frame) => void) {
    this.frameHooks.push(fn);
    return () => {
      this.frameHooks = this.frameHooks.filter((x) => x !== fn);
    };
  }

  /* ---------- measuring ---------- */

  private onResize = () => {
    this.scheduleMeasure(120);
  };

  scheduleMeasure(delay = 0) {
    window.clearTimeout(this.measureTimer);
    this.measureTimer = window.setTimeout(() => this.measure(), delay);
  }

  measure() {
    const prevW = this.W;
    const prevV = this.V;
    this.readViewport();
    this.model.setSize(this.W, this.V, this.phone);
    if (prevW !== this.W || prevV !== this.V || !this.gl) this.resizeSurfaces();
    const y = window.scrollY;
    for (const c of this.controllers) c.measure(y, this.V, this.W);
    for (const w of this.wets) {
      // Group the wet copy's words into visual lines for the per-line wobble.
      const tops: number[] = [];
      w.lines = w.words.map((el) => {
        const t = el.offsetTop;
        let i = tops.findIndex((v) => Math.abs(v - t) < 4);
        if (i < 0) {
          tops.push(t);
          i = tops.length - 1;
        }
        return i;
      });
      w.dx = w.wet.offsetLeft - w.dry.offsetLeft;
      w.state = -1;
    }
    if (this.reduced) this.layoutStatic();
    this.wake();
  }

  /* ---------- the loop ---------- */

  wake = () => {
    // Child effects register before App boots the engine: never start the loop before boot,
    // and never at all under reduced motion.
    if (!this.started || this.reduced) return;
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  };

  private onVisibility = () => {
    if (!document.hidden) this.wake();
  };

  private frame = (now: number) => {
    if (document.hidden || this.reduced) {
      this.running = false;
      return;
    }
    const raw = now - this.last;
    const dt = Math.min(0.1, Math.max(0, raw / 1000)); // the spring sub-steps at 1/240 s, so long frames stay stable
    this.last = now;
    if (!this.fallback && this.gl && this.probe.at > 0 && this.introSkipped && this.glVisible && this.model.level.value < this.V * 0.75) {
      if (!this.probe.done) this.sample(raw);
      else this.watchdog(raw);
    }
    this.lenis?.raf(now);
    const scrollY = window.scrollY;
    if (this.introAt > 0 && !this.introSkipped && (now - this.introAt >= INTRO_MS || scrollY > 4)) this.skipIntro();
    const f: Frame = { now, dt, scrollY, V: this.V, W: this.W, phone: this.phone, compact: this.compact, jump: this.jumpFrames > 0 };
    if (this.jumpFrames > 0) this.jumpFrames--;

    // 1. Which section owns the water, and where does it want it?
    let active: Controller | null = null;
    for (const c of this.controllers) if (!active || scrollY >= (c.owns ? c.owns(this.V) : c.start() - this.V + 1)) active = c;
    this.model.ampGoal = 1;
    this.model.ctGoal = 1;
    this.model.level.k = 120;
    this.model.level.c = 18;
    if (active && !this.model.scripted) {
      const target = this.drained ? this.V + 40 : active.target(f);
      this.model.level.target = target;
      if (this.snapNext && this.fontsReady) {
        this.model.level.snap(target);
        this.snapNext = false;
      }
      this.autoRipple(now, target);
    }

    // 2. Physics.
    this.model.step(dt);

    // 3. Sections write their state (captions, readouts, transforms).
    for (const c of this.controllers) c.update(f);
    for (const h of this.frameHooks) h(f);

    // 4. Wet type: read every rect first, then write every clip.
    this.updateWets(f);

    // 5. Draw the water.
    this.draw();

    const busy = !this.model.idle || this.lenis?.isScrolling || (this.introAt > 0 && now - this.introAt < 3200) || this.jumpFrames > 0;
    if (busy || this.keepAlive > now) requestAnimationFrame(this.frame);
    else this.running = false;
  };

  /** 30 frames after boot: if the median frame takes longer than 30 ms, switch to the still CSS water. */
  private sample(ms: number) {
    const p = this.probe;
    if (ms <= 0 || ms > 250) return;
    p.dts.push(ms);
    if (p.dts.length < 30) return;
    p.done = true;
    const sorted = p.dts.slice().sort((a, b) => a - b);
    if (sorted[15] > 30) this.toFallback();
  }

  /** A rolling median over 60 frames while the water is on screen, for the first 20 s of it. */
  private watchdog(ms: number) {
    const w = this.watch;
    if (w.off || ms <= 0 || ms > 250) return;
    w.ms += ms;
    if (w.ms > 20000) {
      w.off = true;
      return;
    }
    w.ring[w.i] = ms;
    w.i = (w.i + 1) % w.ring.length;
    w.n = Math.min(w.ring.length, w.n + 1);
    if (w.n < w.ring.length || w.i % 15) return;
    const sorted = Array.from(w.ring).sort((a, b) => a - b);
    if (sorted[30] > 28) this.toFallback();
  }

  private toFallback() {
    if (this.fallback) return;
    this.fallback = true;
    this.gl?.clear();
    this.gl = null;
    this.model.frozen = true;
    this.model.ripples = [];
    document.documentElement.dataset.water = 'css';
    this.buildCssWave();
    for (const w of this.wets) {
      w.state = -1;
      for (const el of w.words) el.style.transform = '';
    }
  }

  keepAlive = 0;
  /** Keep the loop running for ms (e.g. while a tween plays). */
  hold(ms: number) {
    this.keepAlive = Math.max(this.keepAlive, performance.now() + ms);
    this.wake();
  }

  private autoRipple(now: number, target: number) {
    const hist = this.lastTargets;
    hist.push({ t: now, v: target });
    while (hist.length && now - hist[0].t > 100) hist.shift();
    if (hist.length > 1 && Math.abs(hist[hist.length - 1].v - hist[0].v) > 30 && now - this.lastAutoRipple > 260) {
      this.lastAutoRipple = now;
      this.model.ripple(this.W * (0.15 + Math.random() * 0.7));
    }
  }

  private draw() {
    const m = this.model;
    const onScreen = m.level.value < this.V + 24 || m.ripples.length > 0;
    if (this.gl) {
      if (onScreen) {
        this.gl.draw(m);
        this.glVisible = true;
      } else if (this.glVisible) {
        this.gl.clear();
        this.glVisible = false;
      }
    } else if (this.css) {
      this.css.style.transform = `translate3d(0, ${(m.level.value - 24).toFixed(2)}px, 0)`;
      this.css.style.visibility = onScreen ? 'visible' : 'hidden';
    }
  }

  private updateWets(f: Frame) {
    const m = this.model;
    const amp = m.ampNow();
    const surface = (x: number) => m.surfaceY(x, amp);
    for (const w of this.wets) {
      const r = w.root.getBoundingClientRect();
      w.rect = r.bottom < -80 || r.top > f.V + 80 || r.width === 0 ? null : r;
    }
    const t = m.t;
    for (const w of this.wets) {
      if (!w.rect) continue;
      const state = this.clip(w, w.rect, surface);
      if (w.wobble && state > 0 && !this.fallback) {
        for (let i = 0; i < w.words.length; i++) {
          const L = w.lines[i] ?? 0;
          const tx = Math.sin(1.3 * t + 1.7 * L) * 3;
          const sk = Math.sin(0.9 * t + L) * 0.5;
          w.words[i].style.transform = `translateX(${tx.toFixed(2)}px) skewX(${sk.toFixed(3)}deg) scaleY(1.03)`;
        }
      }
    }
  }

  /** Clip the dry copy to the air and the wet copy to the water. Returns 0 dry, 1 split, 2 wet. */
  private clip(w: Wet, r: DOMRect, surface: (x: number) => number) {
    const bl = BLEED + Math.abs(w.dx);
    const left = r.left - bl;
    const span = r.width + bl * 2;
    const h = r.height;
    let min = Infinity;
    let max = -Infinity;
    const ys = new Float32Array(SAMPLES + 1);
    for (let i = 0; i <= SAMPLES; i++) {
      const y = surface(left + (span * i) / SAMPLES) - r.top;
      ys[i] = y;
      if (y < min) min = y;
      if (y > max) max = y;
    }
    let state = 1;
    if (min >= h + 8) state = 0;
    else if (max <= -8) state = 2;
    if (state !== 1 && state === w.state) return state;
    if (state === 0) {
      w.dry.style.clipPath = 'none';
      w.wet.style.visibility = 'hidden';
      w.wet.style.clipPath = 'none';
    } else if (state === 2) {
      w.dry.style.clipPath = 'inset(0 0 100% 0)';
      w.wet.style.visibility = 'visible';
      w.wet.style.clipPath = 'none';
    } else {
      // Local coordinates: the dry copy sits on the root's box; the wet copy's box is offset by dx.
      const pts: string[] = [];
      const wpts: string[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const x = -bl + (span * i) / SAMPLES;
        const y = ys[i].toFixed(1);
        pts.push(`${x.toFixed(1)}px ${y}px`);
        wpts.push(`${(x - w.dx).toFixed(1)}px ${y}px`);
      }
      const rev = pts.reverse().join(',');
      const far = 4000;
      w.dry.style.clipPath = `polygon(${-bl}px ${-far}px,${(r.width + bl).toFixed(1)}px ${-far}px,${rev})`;
      w.wet.style.clipPath = `polygon(${wpts.join(',')},${(r.width + bl - w.dx).toFixed(1)}px ${h + far}px,${(-bl - w.dx).toFixed(1)}px ${h + far}px)`;
      w.wet.style.visibility = 'visible';
    }
    w.state = state;
    return state;
  }

  /* ---------- CSS fallback water ---------- */

  private buildCssWave() {
    const el = this.css;
    if (!el) return;
    const W = this.W;
    const path = el.querySelector<SVGPathElement>('.wave-fill');
    const edge = el.querySelector<SVGPathElement>('.wave-edge');
    const svg = el.querySelector<SVGSVGElement>('svg');
    if (!path || !edge || !svg) return;
    svg.setAttribute('viewBox', `0 0 ${W} 48`);
    // Same formula as the model at t = 0 with the level at 24 px, so the flat clip lines match.
    const save = this.model.level.value;
    this.model.level.value = 24;
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 8) pts.push(`${x},${this.model.surfaceY(x, 1).toFixed(2)}`);
    pts.push(`${W},${this.model.surfaceY(W, 1).toFixed(2)}`);
    this.model.level.value = save;
    edge.setAttribute('d', `M${pts.join('L')}`);
    path.setAttribute('d', `M${pts.join('L')}L${W},48L0,48Z`);
  }

  /* ---------- input ---------- */

  private onInput = (e: Event) => {
    if (e.type === 'keydown') {
      const k = (e as KeyboardEvent).key;
      if (k === 'Shift' || k === 'Alt' || k === 'Meta' || k === 'Control') return;
    }
    this.skipIntro();
    this.wake();
  };

  skipIntro() {
    if (this.introSkipped) return;
    this.introSkipped = true;
    document.documentElement.classList.remove('intro-run');
    document.documentElement.classList.add('intro-done');
    for (const c of this.controllers) c.skipIntro?.();
  }

  get introRunning() {
    return this.introAt > 0 && !this.introSkipped && performance.now() - this.introAt < INTRO_MS;
  }

  private onPointer = (e: PointerEvent) => {
    if (this.fallback || e.pointerType === 'touch') return;
    const p = this.pointer;
    const now = e.timeStamp || performance.now();
    const s = this.model.surfaceY(e.clientX);
    const side = Math.sign(e.clientY - s);
    if (p.t && side !== 0 && p.side !== 0 && side !== p.side) {
      const speed = Math.abs(e.clientY - p.y) / Math.max(1, now - p.t);
      if (speed > 0.2 && now - p.cool > 120) {
        p.cool = now;
        this.model.ripple(e.clientX);
        this.wake();
      }
    }
    p.x = e.clientX;
    p.y = e.clientY;
    p.t = now;
    p.side = side;
  };

  scrollTo(target: number | HTMLElement, instant = false) {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    if (this.lenis && !instant) this.lenis.scrollTo(y, { duration: 1.4 });
    else if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: instant || this.reduced ? 'auto' : 'smooth' });
    this.wake();
  }

  /* ---------- the drain ---------- */

  /** Drain every drop off the page. Calls landed() once the page is dry. */
  drain(landed: () => void) {
    this.drained = true;
    const m = this.model;
    const V = this.V;
    if (this.reduced) {
      landed();
      return;
    }
    const fall = () => {
      m.spike();
      m.ripple(this.W * 0.3, 10);
      m.ripple(this.W * 0.72, 10);
      m.script(V + 40, 820, easeInCubic, () => {
        m.foam = 0;
        landed();
      });
    };
    if (m.level.value > V - 8) {
      // Off-screen (phones): bring a strip into view, but never over the form or the Appendix link
      // (28 px clear of the lowest one on screen, room for the chop). No room: it drains unseen.
      let lowest = 0;
      document.querySelectorAll<HTMLElement>('#paths .optin,#paths .appendix').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < V) lowest = Math.max(lowest, r.bottom);
      });
      const to = Math.max(0.88 * V, lowest + 28);
      if (to < V - 16) m.script(to, 220, easeOutCubic, fall);
      else fall();
    } else fall();
    this.hold(2000);
  }

  /* ---------- reduced motion: stacked static blocks ---------- */

  layoutStatic() {
    const blocks = document.querySelectorAll<HTMLElement>('[data-block]');
    blocks.forEach((b) => {
      const level = Number(b.dataset.level || '0');
      const water = b.querySelector<HTMLElement>(':scope > .block-water');
      if (water) water.style.transform = `translateY(${level}px)`;
    });
    for (const w of this.wets) {
      const block = w.root.closest<HTMLElement>('[data-block]');
      if (!block) continue;
      const level = Number(block.dataset.level || '0');
      const br = block.getBoundingClientRect();
      const r = w.root.getBoundingClientRect();
      const local = level - (r.top - br.top);
      if (local >= r.height + 4) {
        w.dry.style.clipPath = 'none';
        w.wet.style.visibility = 'hidden';
      } else if (local <= -4) {
        w.dry.style.clipPath = 'inset(0 0 100% 0)';
        w.wet.style.visibility = 'visible';
        w.wet.style.clipPath = 'none';
      } else {
        w.dry.style.clipPath = `inset(-${BLEED}px -${BLEED}px ${(r.height - local).toFixed(1)}px -${BLEED}px)`;
        w.wet.style.clipPath = `inset(${local.toFixed(1)}px -${BLEED}px -${BLEED}px -${BLEED}px)`;
        w.wet.style.visibility = 'visible';
      }
    }
  }
}

export const engine = new Engine();
if (PARAMS.debug) (window as unknown as { __engine: Engine }).__engine = engine;
