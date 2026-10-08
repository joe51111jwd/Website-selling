// The cover controller (brief 2.3, 2.4, 3.3, 4.1). Owner: A2.
// Imperative: it writes styles and attributes directly (no React render per frame, brief 8.3).
//
// Modes
//   live     motion on: ready gate -> pay-out -> armed -> pull / auto-snap -> impact (deposit, puff,
//            ink) -> film rises through the dust -> freeze (GL 3D VIEW or DOM still + near-matte)
//            -> swing -> rest; then scroll performs the plan cut and the pull-out (P 0..1)
//   static   reduced motion / MOTION OFF: the final frozen composition, "PLAY THE SNAP (1 S)"
//   capture  ?capture: every visual is a pure function of t (registerCaptureScene 'hero', 'cover-plan')
//
// The timeline is a set of timestamps (`tl`); render(now) derives every visual from them, so live
// playback and capture seeks share one code path.

import { isCapture, registerCaptureScene } from '../system/capture';
import { prefsStore } from '../system/prefs';
import { tierStore } from '../system/tier';
import { onLayout, onScroll } from '../system/scroll';
import { videoManager } from '../system/VideoManager';
import { lenisScrollTo } from '../system/lenis';
import { sheetStore } from '../system/sheetStore';
import { drawEase, segment, settleEase, snap as snapFlick } from '../system/easing';
import { media, isMockManifest, loadDepthGrid, loadJson, freezeStillFor } from '../media/manifest';
import { HERO } from '../content/copy/hero';
import { ChalkString, IMPACT_T, buzzFactor, pathOf, releaseFactor, type Vec } from './ChalkString';
import { Dust2D } from './Dust2D';
import { OrbitRig } from './orbitRig';
import { heroMachine, type HeroState } from './heroMachine';
import { BEATS, CAPTURE, FRAME, POSE, PORTRAIT_QUERY, STRING, TIMING, type Orientation } from './heroLayout';
import {
  FRESH_FALLBACK,
  apply,
  compose,
  coverFit,
  cssAffine,
  cssMatrix,
  lineFlip,
  mix as mixSim,
  onBox,
  placeholderBay,
  registerLine,
  relativeAffine,
  type Similarity,
} from './PlanCut';
import type { FreezeScene, FreezeMeta } from './FreezeScene';
import type { TypeLine } from './typePlanes';

export interface ArenaHandle {
  getBayRect(n: 1 | 2 | 3 | 4 | 5): DOMRect;
}

export interface CoverHost {
  root: HTMLElement;
  setMode(mode: 'static' | 'stage'): void;
  setCodec(codec: 'av1' | 'h264'): void;
  arena(): ArenaHandle | null;
}

type Mode = 'live' | 'static' | 'capture';

interface Deposit {
  el: HTMLDivElement;
  L: Vec;
  R: Vec;
  bornAt: number;
}

interface Timeline {
  payStart: number | null;
  autoSnapAt: number | null;
  pullKind: 'none' | 'pointer' | 'ghost' | 'standard' | 'script';
  pullStart: number;
  pullIndex: number;
  pullAmount: number;
  pullDur: number;
  pullByUser: boolean;
  S: number | null;
  offsets: Float32Array | null;
  amount: number;
  impactAt: number | null;
  impactDone: boolean;
  filmT0: number | null;
  filmError: boolean;
  frozenAt: number | null;
  glAt: number | null;
  swingStart: number | null;
  swing: boolean;
  rest: boolean;
}

const freshTimeline = (): Timeline => ({
  payStart: null,
  autoSnapAt: null,
  pullKind: 'none',
  pullStart: 0,
  pullIndex: 40,
  pullAmount: 0,
  pullDur: 0,
  pullByUser: false,
  S: null,
  offsets: null,
  amount: 0,
  impactAt: null,
  impactDone: false,
  filmT0: null,
  filmError: false,
  frozenAt: null,
  glAt: null,
  swingStart: null,
  swing: false,
  rest: false,
});

/** perpendicular offsets of successive deposits (brief 4.1: each offset 3-6 px) */
const DEPOSIT_OFFSETS = [0, 4, -3, 6, -5, 3];
const SHADOW_DIR = { x: 0.38, y: 0.925 };

const nowS = () => performance.now() / 1000;
const q = <T extends Element>(root: ParentNode, sel: string) => root.querySelector(sel) as T | null;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

function idle(cb: () => void, timeout: number): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, Math.min(timeout, 600));
  return () => window.clearTimeout(id);
}

function seekVideo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const target = Math.max(0, t);
    if (Math.abs(v.currentTime - target) < 0.0005 && v.readyState >= 2) {
      resolve();
      return;
    }
    const done = () => {
      v.removeEventListener('seeked', done);
      resolve();
    };
    v.addEventListener('seeked', done);
    v.currentTime = target;
    window.setTimeout(done, 3000);
  });
}

function whenLoaded(v: HTMLVideoElement, ms = 8000): Promise<void> {
  return new Promise((resolve) => {
    if (v.readyState >= 2) {
      resolve();
      return;
    }
    const done = () => {
      v.removeEventListener('loadeddata', done);
      resolve();
    };
    v.addEventListener('loadeddata', done);
    window.setTimeout(done, ms);
  });
}

/** Resolves true once the video has a decoded frame at its current time (after any seek), false after `ms`. */
function frameReady(v: HTMLVideoElement, ms = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      v.removeEventListener('seeked', check);
      v.removeEventListener('loadeddata', check);
      v.removeEventListener('canplay', check);
      window.clearTimeout(timer);
      resolve(ok);
    };
    const check = () => {
      if (!v.seeking && v.readyState >= 2) finish(true);
    };
    const timer = window.setTimeout(() => finish(false), ms);
    v.addEventListener('seeked', check);
    v.addEventListener('loadeddata', check);
    v.addEventListener('canplay', check);
    check();
  });
}

function imageUrls(id: string): string[] {
  const e = media[id];
  if (!e?.sources) return [];
  const avif = e.sources.filter((s) => /avif/i.test(s.type)).map((s) => s.src);
  const rest = e.sources.filter((s) => !/avif/i.test(s.type)).map((s) => s.src);
  return [...avif, ...rest];
}

class CoverController {
  private host: CoverHost;
  private root: HTMLElement;
  private mode: Mode = 'static';
  private orient: Orientation = '169';
  private touch = false;
  private offs: Array<() => void> = [];
  private modeOffs: Array<() => void> = [];
  private destroyed = false;

  // elements
  private pin!: HTMLElement;
  private hero!: HTMLElement;
  private mediaBox!: HTMLElement;
  private film!: HTMLVideoElement;
  private stillPic!: HTMLElement;
  private glHost!: HTMLElement;
  private matte!: HTMLElement;
  private h1!: HTMLElement;
  private lines!: HTMLElement[];
  private xl!: HTMLElement;
  private xr!: HTMLElement;
  private chalkbox!: HTMLElement;
  private linebtn!: HTMLButtonElement;
  private handle!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private playBtn!: HTMLButtonElement;
  private a100!: HTMLElement;
  private planSq!: HTMLElement;
  private deps!: HTMLElement;
  private slot5!: HTMLVideoElement;
  private pShadow!: SVGPathElement;
  private pLine!: SVGPathElement;
  private pCore!: SVGPathElement;
  private puffCanvas!: HTMLCanvasElement;
  private track000!: HTMLElement;
  private track100!: HTMLElement;
  private trackCover!: HTMLElement;

  // engines
  private string = new ChalkString();
  private dust: Dust2D | null = null;
  private rig = new OrbitRig({ ...POSE.desktop });
  private tl: Timeline = freshTimeline();
  private deposits: Deposit[] = [];
  private snapCount = 0;
  private baseL: Vec = { x: 0, y: 0 };
  private baseR: Vec = { x: 1, y: 0 };
  private heroW = 1;
  private heroH = 1;
  private frameRect = new DOMRect();

  // GL
  private glAllowed = false;
  private glMod: Promise<typeof import('./FreezeScene')> | null = null;
  private glData: Promise<{ depth: Uint16Array; meta: FreezeMeta & Record<string, unknown> }> | null = null;
  private scene: FreezeScene | null = null;
  private building: Promise<FreezeScene | null> | null = null;
  private glFailed = false;
  private glShown = false;
  private glOutAt: number | null = null;
  private dpr = 1;
  private frameTimes: number[] = [];
  private lastFrameAt = 0;
  private perfStage = 0;

  // stage progress
  private P = 0;
  private coverTop = 0;
  private spacer = 1;
  private M0: Similarity | null = null;
  /** portrait: the deposit's base line and b44's line under M0 (the FLIP's two ends) */
  private depFlip: [Vec, Vec, Vec, Vec] | null = null;
  /** the plan still's current opacity (the deposit hands over to b44's own line as it passes 0.6) */
  private planO = 0;
  private fresh: [[number, number], [number, number]] = FRESH_FALLBACK;
  private landed = false;
  private releaseSlot: (() => void) | null = null;
  private releaseFilm: (() => void) | null = null;
  private scrolledSinceSnap = false;
  private a100Released = false;
  private planTimer = 0;
  /** the landed slot-05 film has a frame at 2.60 s, so it may replace the plan still (F-030) */
  private slotShown = false;
  private slotWait = 0;

  // loop
  private raf = 0;
  private lastTick = 0;
  private pointer: { id: number; x0: number; y0: number; t0: number; moved: boolean; kind: 'string' | 'look' } | null = null;
  private ignoreClickUntil = 0;
  private cancelIdle: (() => void) | null = null;
  private timers: number[] = [];
  private rmPlaying = false;

  constructor(host: CoverHost) {
    this.host = host;
    this.root = host.root;
  }

  // ----------------------------------------------------------------- setup
  start() {
    const r = this.root;
    this.pin = q(r, '.cv-pin')!;
    this.hero = q(r, '.cv-hero')!;
    this.mediaBox = q(r, '.cv-media')!;
    this.film = q(r, '.cv-film')!;
    this.stillPic = q(r, '.cv-still')!;
    this.glHost = q(r, '.cv-gl')!;
    this.matte = q(r, '.cv-matte')!;
    this.h1 = q(r, '.cv-h1')!;
    this.lines = Array.from(r.querySelectorAll<HTMLElement>('.cv-line'));
    this.xl = q(r, '.cv-x--l')!;
    this.xr = q(r, '.cv-x--r')!;
    this.chalkbox = q(r, '.cv-chalkbox')!;
    this.linebtn = q(r, '.cv-linebtn')!;
    this.handle = q(r, '.cv-handle')!;
    this.resetBtn = q(r, '.cv-reset')!;
    this.playBtn = q(r, '.cv-play')!;
    this.a100 = q(r, '.cv-a100')!;
    this.planSq = q(r, '.cv-plan-sq')!;
    this.deps = q(r, '.cv-deps')!;
    this.slot5 = q(r, '.cv-slot5')!;
    this.pShadow = q(r, '.cv-string-shadow')!;
    this.pLine = q(r, '.cv-string-line')!;
    this.pCore = q(r, '.cv-string-core')!;
    this.puffCanvas = q(r, '.cv-puff')!;
    this.track000 = q(r, '#a-000')!;
    this.track100 = q(r, '#a-100')!;
    this.trackCover = q(r, '.cv-track--cover')!;

    // the no-JS films keep their native controls; with JS the controller owns them
    for (const v of [this.film, this.slot5]) {
      v.controls = false;
      v.removeAttribute('controls');
    }

    try {
      this.touch = window.matchMedia('(pointer: coarse)').matches;
    } catch {
      this.touch = false;
    }
    if (this.touch) r.dataset.touch = '';
    this.orient = this.isPortrait() ? '916' : '169';
    this.rig = new OrbitRig({ ...(this.orient === '916' ? POSE.phone : POSE.desktop) });

    // anchors: forward focus from the tracks to the real headings
    const fwd000 = () => this.h1.focus({ preventScroll: true });
    const fwd100 = () => {
      const h2 = this.a100.querySelector<HTMLElement>('h2');
      if (h2) {
        if (!h2.hasAttribute('tabindex')) h2.setAttribute('tabindex', '-1');
        h2.focus({ preventScroll: true });
      }
    };
    this.on(this.track000, 'focus', fwd000);
    this.on(this.track100, 'focus', fwd100);
    // the cover range of A-100 (plan cut + pull-out) for the SHEET cell
    this.offs.push(sheetStore.register('A-100', this.trackCover));

    this.offs.push(onLayout(() => this.layout()));
    this.offs.push(
      prefsStore.subscribe(() => {
        const want: Mode = isCapture() ? 'capture' : prefsStore.get().motion ? 'live' : 'static';
        if (want !== this.mode) this.setModeTo(want, true);
      }),
    );
    this.offs.push(
      tierStore.subscribe(() => {
        if (!tierStore.get().gl && this.glAllowed) {
          this.glAllowed = false;
          this.glFallback();
        }
      }),
    );
    // dev / QA aids
    (window as unknown as { __hrcgHero?: unknown }).__hrcgHero = {
      state: () => heroMachine.get(),
      P: () => this.P,
      drawCalls: () => this.scene?.drawCalls() ?? 0,
      gl: () => !!this.scene,
      layout: () => this.typeLayers(),
      planLanding: () => this.planLanding(),
    };

    this.resolveFresh();
    this.layout();
    const initial: Mode = isCapture() ? 'capture' : prefsStore.get().motion ? 'live' : 'static';
    this.setModeTo(initial, false);
  }

  destroy() {
    this.destroyed = true;
    this.teardownMode();
    this.offs.forEach((f) => f());
    this.offs = [];
    this.disposeGl();
    this.dust?.dispose();
    this.releaseFilm?.();
    this.releaseSlot?.();
    this.deposits.forEach((d) => d.el.remove());
    this.deposits = [];
  }

  private on(el: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions, list = this.offs) {
    el.addEventListener(type, fn as EventListener, opts);
    list.push(() => el.removeEventListener(type, fn as EventListener, opts));
  }

  private isPortrait(): boolean {
    try {
      return window.matchMedia(PORTRAIT_QUERY).matches;
    } catch {
      return false;
    }
  }

  private isPhone(): boolean {
    return window.innerWidth < 768 || this.orient === '916';
  }

  // ----------------------------------------------------------------- modes
  private teardownMode() {
    this.modeOffs.forEach((f) => f());
    this.modeOffs = [];
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.cancelIdle?.();
    this.cancelIdle = null;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private setModeTo(mode: Mode, runtime: boolean) {
    this.teardownMode();
    this.mode = mode;
    const r = this.root;
    if (mode === 'static') {
      this.host.setMode('static');
      this.hero.style.opacity = '';
      this.hero.style.visibility = '';
      this.disposeGl();
      this.releaseFilm?.();
      this.releaseFilm = null;
      this.unland();
      this.film.pause();
      r.dataset.vt = 'still';
      r.dataset.hint = 'none';
      r.dataset.line = 'off';
      r.dataset.reset = 'off';
      delete r.dataset.inkfx;
      r.style.setProperty('--ink', '1');
      r.style.setProperty('--a0-o', '1');
      r.style.setProperty('--h1-dom', '1');
      r.style.setProperty('--h1-dom-near', '1');
      this.clearInline();
      this.stringHidden();
      this.dust?.clear();
      this.deposits.forEach((d) => (d.el.style.opacity = '0'));
      heroMachine.force('rest');
      this.setupStatic();
      return;
    }
    this.host.setMode('stage');
    this.glAllowed = this.computeGlAllowed();
    if (mode === 'capture') {
      this.setupCapture();
      return;
    }
    this.setupLive(runtime);
  }

  private clearInline() {
    for (const el of [this.film, this.stillPic, this.matte, this.glHost, this.planSq, this.slot5]) {
      el.style.removeProperty('opacity');
      el.style.removeProperty('display');
    }
  }

  private computeGlAllowed(): boolean {
    if (!tierStore.get().gl) return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if ((nav.deviceMemory ?? 4) < 4 || nav.connection?.saveData) return false;
    if (!media['hero-depth-169'] || !media['hero-meta-169']) return false;
    // brief: fall back to the DOM still + near-matte while the depth set is a mock, except in dev
    // (and ?hero3d=1) so the 3D VIEW can be built and reviewed against the spike depth
    const force = /[?&]hero3d=1/.test(location.search);
    if (/[?&]hero3d=0/.test(location.search)) return false;
    if (isMockManifest && !import.meta.env.DEV && !force) return false;
    return true;
  }

  // ----------------------------------------------------------------- layout
  private layout() {
    if (this.destroyed) return;
    const vtSpan = this.measureLabels();
    const heroR = this.hero.getBoundingClientRect();
    this.heroW = heroR.width;
    this.heroH = heroR.height;
    this.frameRect = this.mediaBox.getBoundingClientRect();
    const orient: Orientation = this.isPortrait() ? '916' : '169';
    if (orient !== this.orient) {
      this.orient = orient;
      this.rig.limits = { ...(orient === '916' ? POSE.phone : POSE.desktop) };
      this.disposeGl();
      this.glData = null;
      if (this.tl.filmT0 === null && this.mode !== 'static') {
        try {
          this.film.load();
        } catch {
          /* ignore */
        }
      }
    }
    // the line: left control point -> the chalk box's exit notch
    const xl = this.xl.getBoundingClientRect();
    const cb = this.chalkbox.getBoundingClientRect();
    this.baseL = { x: xl.left + xl.width / 2 - heroR.left, y: xl.top + xl.height / 2 - heroR.top };
    this.baseR = { x: cb.left - heroR.left, y: cb.top + cb.height / 2 - heroR.top };
    const capVh = this.isPhone() ? STRING.capVhPhone : STRING.capVh;
    this.string.cap = Math.max(40, window.innerHeight * capVh);
    this.setStringEnds();
    // stage
    const rr = this.root.getBoundingClientRect();
    this.coverTop = rr.top + window.scrollY;
    const sp = q<HTMLElement>(this.root, '.cv-spacer');
    this.spacer = Math.max(1, sp?.offsetHeight ?? 1);
    // puff canvas
    if (!this.dust) this.dust = new Dust2D(this.puffCanvas);
    this.dust.resize(this.heroW, this.heroH, Math.min(1.5, window.devicePixelRatio || 1));
    // DPR clamped to [1, 1.75], 1.5 on the lite tier (brief 8.4); the frame-time monitor may drop it to 1.25
    const dprMax = this.perfStage > 0 ? 1.25 : tierStore.get().lite ? 1.5 : 1.75;
    this.dpr = Math.max(1, Math.min(dprMax, window.devicePixelRatio || 1));
    if (this.scene) this.scene.resize(this.frameRect.width, this.frameRect.height, this.dpr);
    this.layoutDeposits();
    this.placeholderRow();
    // the plan caption takes over the hero caption's exact span (the spine, F-028)
    const pinR = this.pin.getBoundingClientRect();
    if (vtSpan && vtSpan.width > 0) {
      this.root.style.setProperty('--cv-vt-l', `${Math.max(0, vtSpan.left - pinR.left).toFixed(1)}px`);
      this.root.style.setProperty('--cv-vt-r', `${Math.max(0, pinR.right - vtSpan.right).toFixed(1)}px`);
    }
    // the 3D VIEW's focus ring: the visible part of the frame, between the header and the strip (F-024)
    this.writeVisInset(heroR, vtSpan);
    this.clipMatte();
    this.registerPlan();
    if (this.mode !== 'static') {
      this.readP();
      this.applyP();
      this.render(this.mode === 'capture' ? this.captureT : nowS());
    }
  }

  /**
   * Measure the labels the frame layout reserves room for (cover.css F-003 / F-028): the tallest hero
   * view title, the sub, the hint rows, the status line. Hidden ones are measured shown-but-invisible
   * for the one synchronous reflow; nothing paints in between. Returns a hero view title's span.
   */
  private measureLabels(): DOMRect | null {
    const r = this.root;
    const h = (el: Element | null, show = 'flex'): number => {
      if (!(el instanceof HTMLElement)) return 0;
      if (getComputedStyle(el).display !== 'none') return el.getBoundingClientRect().height;
      const d = el.style.display;
      const v = el.style.visibility;
      el.style.visibility = 'hidden';
      el.style.display = show;
      const out = el.getBoundingClientRect().height;
      el.style.display = d;
      el.style.visibility = v;
      return out;
    };
    const vts = Array.from(this.mediaBox.querySelectorAll<HTMLElement>('.cv-vt'));
    let span: DOMRect | null = null;
    let vtH = 0;
    for (const el of vts) {
      const hidden = getComputedStyle(el).display === 'none';
      const d = el.style.display;
      const v = el.style.visibility;
      if (hidden) {
        el.style.visibility = 'hidden';
        el.style.display = 'flex';
      }
      const rect = el.getBoundingClientRect();
      vtH = Math.max(vtH, rect.height);
      if (!span) span = rect;
      if (hidden) {
        el.style.display = d;
        el.style.visibility = v;
      }
    }
    const px = (n: number) => `${Math.ceil(n)}px`;
    const set = (k: string, n: number) => {
      if (n > 0) r.style.setProperty(k, px(n));
    };
    set('--vt-h', vtH);
    set('--status-h', h(q(r, '.cv-status')));
    set('--sub-h', h(q(r, '.cv-sub')));
    const pull = h(q(r, '.cv-hint--pull'));
    set('--pull-h', pull);
    const frozen = Math.max(h(q(r, '.cv-hint--frozen-gl')), h(q(r, '.cv-hint--frozen')));
    set('--frozen-h', frozen);
    set('--play-h', h(q(r, '.cv-play'), 'inline-flex'));
    set('--row-h', Math.max(pull, frozen, h(q(r, '.cv-reset'), 'inline-flex')));
    return span;
  }

  /**
   * The near-matte only ever has to cover FAR (the bite): clip it to FAR's line boxes + 20 px, so during
   * the DOM -> GL hand-over it can't lie over the GL NEAR planes and darken them (F-026).
   */
  private clipMatte() {
    const m = this.matte.getBoundingClientRect();
    if (m.width < 1) {
      // display: none until the freeze: measure through the type box instead (same frame box)
      const box = (this.matte.parentElement as HTMLElement).getBoundingClientRect();
      if (box.width < 1) return;
      this.applyMatteClip(box);
      return;
    }
    this.applyMatteClip(m);
  }

  private applyMatteClip(box: DOMRect) {
    let t = Infinity;
    let l = Infinity;
    let rr = -Infinity;
    let b = -Infinity;
    for (const el of this.lines.slice(0, 2)) {
      const g = el.getBoundingClientRect();
      t = Math.min(t, g.top);
      l = Math.min(l, g.left);
      rr = Math.max(rr, g.right);
      b = Math.max(b, g.bottom);
    }
    if (!Number.isFinite(t)) return;
    const pad = 20;
    const it = Math.max(0, t - pad - box.top);
    const il = Math.max(0, l - pad - box.left);
    const ir = Math.max(0, box.right - (rr + pad));
    const ib = Math.max(0, box.bottom - (b + pad));
    this.matte.style.clipPath = `inset(${it.toFixed(0)}px ${ir.toFixed(0)}px ${ib.toFixed(0)}px ${il.toFixed(0)}px)`;
  }

  private writeVisInset(heroR: DOMRect, vtSpan: DOMRect | null) {
    const fr = this.frameRect;
    const cs = getComputedStyle(this.root);
    const num = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
    const border = num('--border');
    const top = heroR.top + border + num('--header-h');
    // the view titles stand 12 px above the strip / phone bar (cover.css), so they give its top edge
    const bottom = vtSpan && vtSpan.height > 0 ? vtSpan.bottom + 12 : heroR.top + this.heroH - num('--strip-h') - border;
    const t = Math.max(0, top - fr.top);
    const b = Math.max(0, fr.bottom - bottom);
    const l = Math.max(0, heroR.left + border - fr.left);
    const rr = Math.max(0, fr.right - (heroR.right - border));
    this.root.style.setProperty('--vis-inset', `${t.toFixed(0)}px ${rr.toFixed(0)}px ${b.toFixed(0)}px ${l.toFixed(0)}px`);
  }

  private setStringEnds() {
    const k = Math.min(this.snapCount, DEPOSIT_OFFSETS.length - 1);
    const off = DEPOSIT_OFFSETS[k] * (this.frameRect.height / 888 || 1);
    const dx = this.baseR.x - this.baseL.x;
    const dy = this.baseR.y - this.baseL.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    this.string.setEnds(
      { x: this.baseL.x + nx * off, y: this.baseL.y + ny * off },
      { x: this.baseR.x + nx * off, y: this.baseR.y + ny * off },
    );
  }

  /**
   * Where the plan still starts (F-005). Landscape: b44's fresh line registered exactly on the visitor's
   * deposit. Portrait (9:16): the deposit is only ~0.45 of a narrow frame, so registering on it leaves a
   * small square low on the screen; instead the still cover-fits the stage around its line, and the
   * deposit FLIPs onto b44's line (depositIn).
   */
  private registerPlan() {
    const [fa, fb] = this.fresh;
    if (this.orient === '916') {
      const M0 = coverFit(this.heroW, this.heroH, (fa[0] + fb[0]) / 2, (fa[1] + fb[1]) / 2);
      this.M0 = M0;
      this.depFlip = [{ ...this.baseL }, { ...this.baseR }, apply(M0, fa[0], fa[1]), apply(M0, fb[0], fb[1])];
    } else {
      this.M0 = registerLine(fa, fb, this.baseL, this.baseR);
      this.depFlip = null;
    }
  }

  private placeholderRow() {
    const row = q<HTMLElement>(this.a100, '[data-cover-placeholder]');
    if (!row) return;
    const pinR = this.pin.getBoundingClientRect();
    const margin = parseFloat(getComputedStyle(this.root).getPropertyValue('--margin')) || 72;
    const top = window.innerHeight * (this.isPhone() ? 0.44 : 0.5);
    row.querySelectorAll<HTMLElement>('.cv-ph-bay').forEach((el) => {
      const n = Number(el.dataset.bay);
      const b = placeholderBay(n, pinR.width, window.innerHeight, margin, top);
      el.style.left = `${b.x}px`;
      el.style.top = `${b.y}px`;
      el.style.width = `${b.width}px`;
      el.style.height = `${b.height}px`;
    });
  }

  private bayRect(): DOMRect {
    const pinR = this.pin.getBoundingClientRect();
    let r: DOMRect | null = null;
    try {
      r = this.host.arena()?.getBayRect(5) ?? null;
    } catch {
      r = null;
    }
    if (!r || r.width < 4) {
      const ph = q<HTMLElement>(this.a100, '.cv-ph-bay[data-bay="5"]');
      r = ph ? ph.getBoundingClientRect() : placeholderBay(5, pinR.width, window.innerHeight, 72, window.innerHeight * 0.5);
    }
    return new DOMRect(r.x - pinR.left, r.y - pinR.top, r.width, r.height);
  }

  private resolveFresh() {
    const e = media['plan-b44-260'];
    if (e?.lineEndpoints && !isMockManifest) {
      this.fresh = e.lineEndpoints;
      return;
    }
    if (!media['lines-b44']) return;
    loadJson<{ mock?: boolean; fresh?: { a: [number, number]; b: [number, number] } }>('lines-b44')
      .then((j) => {
        if (!j || j.mock || !j.fresh) return;
        // fresh line, ordered left -> right like the deposit
        const a = j.fresh.a;
        const b = j.fresh.b;
        this.fresh = a[0] <= b[0] ? [a, b] : [b, a];
        this.registerPlan();
        if (this.mode !== 'static') this.applyP();
      })
      .catch(() => {});
  }

  // ----------------------------------------------------------------- static (reduced motion)
  private setupStatic() {
    const r = this.root;
    this.rmPlaying = false;
    delete r.dataset.playing;
    const onPlay = () => this.playOnce();
    this.on(this.playBtn, 'click', onPlay, undefined, this.modeOffs);
  }

  private async playOnce() {
    if (this.rmPlaying) return;
    this.rmPlaying = true;
    const r = this.root;
    r.dataset.playing = '';
    r.dataset.vt = 'film';
    const v = this.film;
    v.preload = 'auto';
    if (v.readyState < 2) {
      try {
        v.load();
      } catch {
        /* ignore */
      }
    }
    await whenLoaded(v, 6000);
    try {
      v.currentTime = 0;
    } catch {
      /* ignore */
    }
    const release = videoManager.reserve('hero-film');
    v.style.opacity = '1';
    this.matte.style.opacity = '0';
    const end = () => {
      release();
      this.matchCodec();
      v.style.transition = 'opacity 120ms linear';
      v.style.opacity = '0';
      this.matte.style.opacity = '1';
      r.dataset.vt = 'still';
      delete r.dataset.playing;
      this.rmPlaying = false;
      window.setTimeout(() => (v.style.transition = ''), 200);
      this.playBtn.focus({ preventScroll: true });
    };
    v.addEventListener('ended', end, { once: true });
    v.addEventListener('error', end, { once: true });
    v.play().catch(end);
  }

  // ----------------------------------------------------------------- live
  private setupLive(runtime: boolean) {
    const r = this.root;
    this.warmFilm();
    this.installInkMask();
    this.wireLive();

    if (runtime || window.scrollY > this.coverTop + 4) {
      // MOTION switched on mid-page, or a reload below the hero: start from the rest state
      this.skip(false);
    } else {
      this.tl = freshTimeline();
      r.dataset.line = 'off';
      r.dataset.hint = 'none';
      r.dataset.vt = 'none';
      heroMachine.force('waiting');
      this.readyGate().then(() => {
        if (this.destroyed || this.mode !== 'live' || this.tl.rest || this.tl.S !== null) return;
        const t = nowS();
        this.tl.payStart = t;
        // the ghost pull starts early enough that the RELEASE lands at max(3.0 s, pay-out end + 1.2 s) (F-074)
        const release = Math.max(TIMING.autoSnapAt, t + TIMING.payout + TIMING.autoSnapAfterPayout);
        this.tl.autoSnapAt = release - (TIMING.ghostPull + TIMING.ghostHold);
        this.timers.push(window.setTimeout(() => this.kick(), Math.max(0, (this.tl.autoSnapAt - nowS()) * 1000) + 5));
        this.kick();
      });
    }
    // the 3D chunk: after LCP on idle (desktop), first interaction or idle on phones (brief 8.4)
    if (this.glAllowed) {
      const prefetch = () => this.loadGlModule();
      this.cancelIdle = idle(prefetch, this.isPhone() ? 4000 : 2000);
      if (this.isPhone()) this.on(window, 'pointerdown', prefetch, { once: true, passive: true }, this.modeOffs);
    }
    this.readP();
    this.applyP();
    this.kick();
  }

  /**
   * Start fetching the snap film exactly once (F-006). Raising `preload` from "none" already resumes
   * the deferred load in Chromium; load() on a film that is already loading would restart the request
   * (the second full 181 kB fetch). Call load() only when nothing is in flight.
   */
  private warmFilm() {
    const v = this.film;
    if (v.preload !== 'auto') v.preload = 'auto';
    if (v.readyState > 0 || v.networkState === HTMLMediaElement.NETWORK_LOADING) return;
    try {
      v.load();
    } catch {
      /* ignore */
    }
  }

  /** Show (and so fetch) the PLAN 05 still that the plan cut registers on the deposit. */
  private prefetchPlan() {
    if (this.planSq.style.display !== 'block') this.planSq.style.display = 'block';
  }

  /** Release the A-100 load group (posters + videos) once, in time for the row (F-006, A1's F-002 API). */
  private releaseA100() {
    if (this.a100Released) return;
    this.a100Released = true;
    videoManager.release('a100');
  }

  private readyGate(): Promise<void> {
    const font = document.fonts ? document.fonts.load('900 100px "BS H1"').then(() => undefined) : Promise.resolve();
    const img = q<HTMLImageElement>(this.root, '.cv-ground img');
    const ground = img
      ? img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          })
      : Promise.resolve();
    // capped at 1.2 s from first paint; after that the hero continues regardless (brief 2.3)
    const cap = new Promise<void>((res) => window.setTimeout(res, Math.max(0, TIMING.readyCap * 1000 - performance.now())));
    return Promise.race([Promise.all([font, ground]).then(() => undefined), cap]);
  }

  private installInkMask() {
    const r = this.root;
    if (r.dataset.inkfx !== undefined) return;
    try {
      const W = 64;
      const H = 384;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      const img = g.createImageData(W, H);
      // value noise at 6 px + grain, seeded; thresholded against a rising front
      let s = 0x1b873593;
      const rnd = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      const cell = 6;
      const gw = Math.ceil(W / cell) + 1;
      const gh = Math.ceil(H / cell) + 1;
      const grid = Array.from({ length: gw * gh }, rnd);
      const at = (x: number, y: number) => grid[(y % gh) * gw + (x % (gw - 1))];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const fx = x / cell;
          const fy = y / cell;
          const ix = Math.floor(fx);
          const iy = Math.floor(fy);
          const tx = fx - ix;
          const ty = fy - iy;
          const n =
            (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
          const v = n * 0.8 + rnd() * 0.2;
          const front = (y / H - 0.38) / 0.24; // 0 at 38 % -> 1 at 62 %
          const a = Math.max(0, Math.min(1, (front - v) * 9 + 0.5));
          const i = (y * W + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
          img.data[i + 3] = Math.round(a * 255);
        }
      }
      g.putImageData(img, 0, 0);
      r.style.setProperty('--cv-ink-mask', `url(${c.toDataURL('image/png')})`);
      r.dataset.inkfx = '';
    } catch {
      /* no mask: the ink falls back to an opacity fade */
    }
  }

  private wireLive() {
    const L = this.modeOffs;
    this.on(this.hero, 'pointerdown', (e: PointerEvent) => this.onPointerDown(e), undefined, L);
    this.on(window, 'pointermove', (e: PointerEvent) => this.onPointerMove(e), { passive: true }, L);
    this.on(window, 'pointerup', (e: PointerEvent) => this.onPointerUp(e), undefined, L);
    this.on(window, 'pointercancel', (e: PointerEvent) => this.onPointerUp(e, true), undefined, L);
    this.on(this.hero, 'pointerleave', () => {
      this.rig.look.x = 0;
      this.rig.look.y = 0;
      this.kick();
    }, undefined, L);
    this.on(window, 'keydown', (e: KeyboardEvent) => this.onKey(e), undefined, L);
    this.on(this.linebtn, 'click', () => {
      if (performance.now() < this.ignoreClickUntil) return;
      this.standardPull(true);
    }, undefined, L);
    this.on(this.handle, 'click', () => {
      if (performance.now() < this.ignoreClickUntil) return;
      this.standardPull(true);
    }, undefined, L);
    this.on(this.resetBtn, 'click', () => this.reset(), undefined, L);
    this.on(this.glHost, 'keydown', (e: KeyboardEvent) => {
      if (!this.glShown) return;
      const k = e.key;
      const d = POSE.keyDeg;
      if (k === 'ArrowLeft') this.rig.key(-d, 0);
      else if (k === 'ArrowRight') this.rig.key(d, 0);
      else if (k === 'ArrowUp') this.rig.key(0, d);
      else if (k === 'ArrowDown') this.rig.key(0, -d);
      else return;
      e.preventDefault();
      this.kick();
    }, undefined, L);
    // the first sign of a scroll fetches the plan still (it is needed by P 0.12)
    const intent = () => this.prefetchPlan();
    this.on(window, 'wheel', intent, { passive: true, once: true }, L);
    this.on(window, 'touchmove', intent, { passive: true, once: true }, L);
    this.on(window, 'keydown', intent, { once: true }, L);
    // film
    this.on(this.film, 'ended', () => this.onFilmEnded(), undefined, L);
    this.on(this.film, 'error', () => this.onFilmError(), undefined, L);
    const srcs = this.film.querySelectorAll('source');
    const last = srcs[srcs.length - 1];
    if (last) this.on(last, 'error', () => this.onFilmError(), undefined, L);
    this.on(this.film, 'loadedmetadata', () => this.matchCodec(), undefined, L);
    // scroll: P, and any real scroll during the hero beats jumps to rest (brief 2.4)
    L.push(
      onScroll(() => {
        this.readP();
        if (!this.tl.rest && window.scrollY > this.coverTop + 2 && this.P > 0) this.skip(true);
        if (this.tl.S !== null) this.scrolledSinceSnap = true;
        this.applyP();
        this.kick();
      }),
    );
    // focus: keyboard users never land on invisible things
    this.on(this.a100, 'focusin', () => {
      if (this.P < BEATS.printAt) lenisScrollTo(this.track100, { immediate: true, focus: false });
    }, undefined, L);
    this.on(this.hero, 'focusin', () => {
      // the hero's labels and buttons are fading from P 0 (gone by 0.10): back to the top first
      if (this.P > BEATS.h1Out[1] * 0.5) lenisScrollTo(this.track000, { immediate: true, focus: false });
    }, undefined, L);
    // the slot-05 film
    this.on(this.slot5, 'ended', () => {
      this.releaseSlot?.();
      this.releaseSlot = null;
    }, undefined, L);
  }

  private matchCodec() {
    const src = this.film.currentSrc || '';
    if (!src) return;
    this.host.setCodec(/h264|avc/i.test(src) ? 'h264' : 'av1');
  }

  // ----------------------------------------------------------------- input
  private localXY(e: PointerEvent): Vec {
    const r = this.hero.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private lineArmed(): boolean {
    const st = this.phase(nowS());
    return st === 'paying-out' || st === 'armed';
  }

  private onPointerDown(e: PointerEvent) {
    if (this.mode !== 'live' || e.button > 0) return;
    const p = this.localXY(e);
    const target = e.target as HTMLElement;
    this.tl.autoSnapAt = null; // the visitor is here: no auto-snap
    if (this.lineArmed() && this.tl.pullKind === 'none') {
      const onHandle = target.closest('.cv-handle');
      let grabbed = false;
      if (onHandle) {
        // phones: the 44 x 44 chalk-box handle grabs the line at its box end
        grabbed = this.string.grab(p.x, p.y, 1e9, Math.round((this.string.n - 1) * 0.86));
      } else if (e.pointerType !== 'touch') {
        // desktop: within 80 px of the line (a tap on the line itself is the button's click)
        grabbed = this.string.grab(p.x, p.y, STRING.grabRadius);
      }
      if (grabbed) {
        e.preventDefault();
        try {
          (e.target as Element).setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        this.pointer = { id: e.pointerId, x0: p.x, y0: p.y, t0: performance.now(), moved: false, kind: 'string' };
        if (this.tl.payStart === null) this.tl.payStart = nowS() - TIMING.payout; // pulled before the pay-out
        this.tl.pullKind = 'pointer';
        this.tl.pullByUser = true;
        this.root.dataset.pulling = '';
        this.kick();
      }
      return;
    }
    if (this.glShown && (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch')) {
      if (target.closest('button, a')) return;
      if (e.pointerType === 'touch') {
        // horizontal drag only on phones; vertical stays native scroll (touch-action: pan-y)
        this.pointer = { id: e.pointerId, x0: p.x, y0: p.y, t0: performance.now(), moved: false, kind: 'look' };
        return;
      }
      this.pointer = { id: e.pointerId, x0: p.x, y0: p.y, t0: performance.now(), moved: false, kind: 'look' };
      this.root.dataset.pulling = '';
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (this.mode !== 'live') return;
    const p = this.localXY(e);
    const ptr = this.pointer;
    if (ptr && ptr.id === e.pointerId) {
      if (Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 6) ptr.moved = true;
      if (ptr.kind === 'string') {
        this.string.drag(p.x, p.y);
      } else {
        const dx = p.x - ptr.x0;
        const dy = p.y - ptr.y0;
        if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) return;
        this.rig.drag(dx, e.pointerType === 'touch' ? 0 : dy, this.frameRect.width, this.orient === '916' ? 10 : 22);
        ptr.x0 = p.x;
        ptr.y0 = p.y;
      }
      this.kick();
      return;
    }
    // pointer look (+-3 deg), mouse only, while the 3D VIEW is up
    if (this.glShown && e.pointerType === 'mouse' && p.y >= 0 && p.y <= this.heroH) {
      this.rig.look.x = Math.max(-1, Math.min(1, (p.x / this.heroW) * 2 - 1));
      this.rig.look.y = Math.max(-1, Math.min(1, -((p.y / this.heroH) * 2 - 1)));
      this.kick();
    }
  }

  private onPointerUp(e: PointerEvent, cancel = false) {
    const ptr = this.pointer;
    if (!ptr || ptr.id !== e.pointerId) return;
    this.pointer = null;
    delete this.root.dataset.pulling;
    if (ptr.kind !== 'string') return;
    this.ignoreClickUntil = performance.now() + 400;
    if (cancel) {
      // the browser took the gesture (a scroll): let go without a snap
      this.string.settle();
      this.tl.pullKind = 'none';
      this.kick();
      return;
    }
    const quick = !ptr.moved && performance.now() - ptr.t0 < 350;
    if (quick) {
      // a tap or a click: the standard pull
      this.string.release();
      this.tl.pullKind = 'none';
      this.standardPull(true);
      return;
    }
    this.releaseNow(true);
  }

  private onKey(e: KeyboardEvent) {
    if (this.mode !== 'live') return;
    const el = document.activeElement as HTMLElement | null;
    const inField = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    const CONTROL =
      'button, a[href], input, select, textarea, summary, [role="button"], [role="slider"], [contenteditable], [tabindex]:not([tabindex="-1"])';
    const onOther = !!el && el !== document.body && !el.matches('.cv-linebtn, .cv-handle') && el.matches(CONTROL);
    if ((e.key === ' ' || e.key === 'Enter') && this.lineArmed() && !inField && !onOther && !e.repeat) {
      e.preventDefault();
      this.ignoreClickUntil = performance.now() + 400;
      this.standardPull(true);
      return;
    }
    if (!this.tl.rest && (e.key === 'Escape' || e.key === 'PageDown' || e.key === 'End')) {
      if (e.key === 'Escape' && document.querySelector('dialog[open]')) return;
      this.skip(true);
    }
  }

  // ----------------------------------------------------------------- the snap
  /** Ghost pull (auto-snap) or standard pull (tap, Space, Enter): an analytic pluck, then release. */
  private standardPull(byUser: boolean, ghost = false) {
    if (!this.lineArmed() && this.tl.S !== null) return;
    if (this.tl.pullKind !== 'none' && this.tl.pullKind !== 'pointer') return;
    const t = nowS();
    if (this.tl.payStart === null) this.tl.payStart = t - TIMING.payout;
    this.tl.autoSnapAt = null;
    this.tl.pullKind = ghost ? 'ghost' : 'standard';
    this.tl.pullStart = t;
    this.tl.pullIndex = Math.round((this.string.n - 1) * 0.6);
    this.tl.pullAmount = ghost ? Math.min(1, STRING.ghostPx / this.string.cap) : STRING.standardPull;
    this.tl.pullDur = ghost ? TIMING.ghostPull : TIMING.standardPull;
    this.tl.pullByUser = byUser;
    this.kick();
  }

  private releaseNow(byUser: boolean) {
    const t = nowS();
    const { offsets, amount } = this.string.release();
    this.beginSnap(t, offsets, amount, byUser);
  }

  private beginSnap(t: number, offsets: Float32Array, amount: number, byUser: boolean) {
    const tl = this.tl;
    tl.pullKind = 'none';
    tl.S = t;
    tl.offsets = offsets;
    tl.amount = amount;
    tl.impactAt = t + IMPACT_T;
    tl.impactDone = false;
    tl.filmT0 = null;
    tl.frozenAt = null;
    tl.glAt = null;
    tl.swingStart = null;
    tl.swing = false;
    this.scrolledSinceSnap = false;
    delete this.root.dataset.pulling;
    delete this.root.dataset.inked;
    // the line button leaves with the line: keep keyboard focus in the hero (on its heading)
    const ae = document.activeElement;
    if (ae === this.linebtn || ae === this.handle) this.h1.focus({ preventScroll: true });
    heroMachine.force('snapped', byUser ? { snappedByUser: true } : {});
    // the still, the depth, the plate and the matte are fetched after the snap starts (brief 7e)
    this.stillPic.style.display = 'block';
    this.stillPic.style.opacity = '0';
    if (this.glAllowed) void this.buildGl();
    if (this.mode === 'live') {
      this.timers.push(window.setTimeout(() => this.startFilm(), TIMING.filmIn * 1000));
      this.timers.push(
        window.setTimeout(() => {
          if (this.tl.S === t && this.tl.filmT0 === null && this.tl.frozenAt === null) this.freeze(nowS());
        }, TIMING.filmLate * 1000),
      );
    }
    this.kick();
  }

  private impact(t: number) {
    const tl = this.tl;
    tl.impactDone = true;
    this.snapCount++;
    const [L, R] = this.string.ends;
    this.addDeposit(L, R, t);
    const scale = this.frameRect.height / 888 || 1;
    this.dust?.emit(L, R, tl.amount, this.snapCount, this.isPhone() ? 300 : 600, scale);
    heroMachine.force(heroMachine.get().state, { deposits: Math.min(4, this.deposits.length) });
  }

  private startFilm() {
    const tl = this.tl;
    if (this.mode !== 'live' || tl.S === null || tl.frozenAt !== null || tl.rest) return;
    const v = this.film;
    if (v.readyState < 2) {
      // keep waiting (filmLate covers the worst case)
      const retry = () => this.startFilm();
      v.addEventListener('loadeddata', retry, { once: true });
      return;
    }
    try {
      v.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.releaseFilm?.();
    this.releaseFilm = videoManager.reserve('hero-film');
    const p = v.play();
    tl.filmT0 = nowS();
    this.matchCodec();
    p?.catch(() => {
      // Low Power Mode / autoplay refused: hold the still (brief 3.13 states)
      if (this.tl.frozenAt === null) this.freeze(nowS());
    });
    this.kick();
  }

  private onFilmEnded() {
    if (this.mode !== 'live') return;
    const v = this.film;
    const go = () => {
      if (this.tl.frozenAt === null && this.tl.S !== null) this.freeze(nowS());
    };
    const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
    if (rvfc && !v.paused) rvfc.call(v, go);
    else go();
  }

  private onFilmError() {
    if (this.mode === 'static') return;
    this.tl.filmError = true;
    if (this.tl.S !== null && this.tl.frozenAt === null) this.freeze(nowS());
  }

  private freeze(t: number) {
    const tl = this.tl;
    tl.frozenAt = t;
    this.releaseFilm?.();
    this.releaseFilm = null;
    if (this.scene && !this.glFailed && this.P < BEATS.camBack[1]) this.showGl(t, !this.scrolledSinceSnap);
    heroMachine.force('frozen');
    this.kick();
  }

  private showGl(t: number, swing: boolean) {
    const tl = this.tl;
    if (!this.scene) return;
    tl.glAt = t;
    tl.swing = swing;
    tl.swingStart = swing ? t + TIMING.swingDelay : null;
    this.glShown = true;
    this.glOutAt = null;
    this.glHost.style.display = 'block';
    this.glHost.tabIndex = 0;
    if (!swing) {
      this.rig.snapTo(this.restPose());
      this.rig.base = this.restPose();
    }
    heroMachine.setGl(true);
    this.root.dataset.look = '';
  }

  private restPose() {
    const L = this.rig.limits;
    return { yaw: L.yaw, pitch: L.pitch, dolly: L.dolly };
  }

  /** Real scroll, Esc, PageDown, End: jump straight to the frozen rest state (brief 2.4). */
  private skip(scrolled: boolean) {
    const tl = this.tl;
    if (tl.rest) return;
    const t = nowS();
    this.string.settle();
    this.pointer = null;
    delete this.root.dataset.pulling;
    if (tl.S !== null && !tl.impactDone) this.impact(t);
    tl.pullKind = 'none';
    tl.rest = true;
    tl.autoSnapAt = null;
    if (tl.S === null) tl.S = t - 10;
    tl.impactAt = tl.impactAt ?? tl.S;
    tl.frozenAt = tl.frozenAt ?? t - 1;
    this.film.pause();
    this.releaseFilm?.();
    this.releaseFilm = null;
    this.dust?.clear();
    this.stillPic.style.display = 'block';
    this.root.dataset.inked = '';
    if (scrolled) this.scrolledSinceSnap = true;
    if (this.glAllowed) {
      void this.buildGl().then((s) => {
        if (s && this.mode === 'live' && !this.glShown && this.P < 0.02 && !this.glFailed) {
          this.showGl(nowS(), false);
          this.kick();
        }
      });
      if (this.scene && this.P < BEATS.camBack[1]) this.showGl(t - 1, false);
    }
    heroMachine.force('rest');
    this.kick();
  }

  /** ↺ RESET THE LINE: back to the taut string; the deposits stay on the slab (up to 4). */
  private reset() {
    const t = nowS();
    this.film.pause();
    this.releaseFilm?.();
    this.releaseFilm = null;
    try {
      this.film.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.tl = freshTimeline();
    this.tl.payStart = t;
    this.glShown = false;
    this.glOutAt = null;
    this.glHost.style.opacity = '0';
    this.glHost.style.display = 'none';
    this.glHost.tabIndex = -1;
    heroMachine.setGl(false);
    delete this.root.dataset.look;
    delete this.root.dataset.inked;
    this.rig.clearUser();
    this.rig.snapTo({ yaw: 0, pitch: 0, dolly: 0 });
    this.rig.base = { yaw: 0, pitch: 0, dolly: 0 };
    this.scene?.setPose(0, 0, 0);
    this.stillPic.style.display = 'none';
    this.setStringEnds();
    heroMachine.force('paying-out');
    this.linebtn.focus({ preventScroll: true });
    this.kick();
  }

  // ----------------------------------------------------------------- deposits
  private addDeposit(L: Vec, R: Vec, t: number) {
    const el = document.createElement('div');
    el.className = 'cv-dep';
    this.deps.appendChild(el);
    this.deposits.push({ el, L: { ...L }, R: { ...R }, bornAt: t });
    while (this.deposits.length > 4) this.deposits.shift()!.el.remove();
    this.layoutDeposits();
  }

  private layoutDeposits() {
    // deposits are stored relative to the base line, so a resize keeps them on it
    for (const d of this.deposits) {
      const dx = d.R.x - d.L.x;
      const dy = d.R.y - d.L.y;
      const len = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      d.el.style.width = `${len.toFixed(1)}px`;
      d.el.style.transform = `translate(${d.L.x.toFixed(1)}px, ${(d.L.y - 8).toFixed(1)}px) rotate(${ang.toFixed(5)}rad)`;
    }
  }

  // ----------------------------------------------------------------- GL
  private loadGlModule() {
    if (!this.glMod) {
      this.glMod = withTimeout(import('./FreezeScene'), 4000);
      this.glMod.catch(() => {
        this.glFailed = true;
      });
    }
    return this.glMod;
  }

  private loadGlData() {
    if (!this.glData) {
      const portrait = this.orient === '916';
      const depthId = portrait ? 'hero-depth-916' : 'hero-depth-169';
      const metaId = portrait ? 'hero-meta-916' : 'hero-meta-169';
      this.glData = Promise.all([loadDepthGrid(depthId), loadJson<FreezeMeta & Record<string, unknown>>(metaId)]).then(
        ([depth, meta]) => ({ depth, meta }),
      );
      this.glData.catch(() => {
        this.glData = null;
      });
    }
    return this.glData;
  }

  private buildGl(): Promise<FreezeScene | null> {
    if (this.scene) return Promise.resolve(this.scene);
    if (this.building) return this.building;
    if (!this.glAllowed || this.glFailed) return Promise.resolve(null);
    this.building = (async () => {
      try {
        const [mod, data] = await Promise.all([this.loadGlModule(), withTimeout(this.loadGlData(), 8000)]);
        await document.fonts?.load('900 100px "BS H1"');
        if (this.destroyed || this.mode === 'static' || !this.glAllowed) return null;
        const portrait = this.orient === '916';
        const fr = FRAME[this.orient];
        const entry = media[portrait ? 'hero-snap-916' : 'hero-snap-169'];
        const stillSrc = entry ? freezeStillFor(entry, this.film.currentSrc || '') : undefined;
        const codec = stillSrc && /h264/i.test(stillSrc) ? 'h264' : 'av1';
        const stillId = `hero-still-${portrait ? '916' : '169'}-${codec}`;
        const plateId = portrait ? 'hero-plate-916' : 'hero-plate-169';
        const depthE = media[portrait ? 'hero-depth-916' : 'hero-depth-169'];
        const cols = depthE?.w ?? (portrait ? 145 : 257);
        const rows = depthE?.h ?? (portrait ? 257 : 145);
        this.frameRect = this.mediaBox.getBoundingClientRect();
        const scene = await mod.createFreezeScene({
          host: this.glHost,
          frameW: fr.w,
          frameH: fr.h,
          depth: data.depth,
          cols,
          rows,
          meta: Object.assign({ a: 0.15, b: 1.6, f: 1.2, pivotZ: 1.6, overscan: 0.12 }, data.meta),
          plate: (data.meta as { plate?: { z?: number; scale?: number } }).plate,
          stillUrls: imageUrls(stillId),
          plateUrls: imageUrls(plateId),
          // 07's clean-edged layer (F-004). It bites FAR on the 16:9 take only; on the 9:16 take it would be
          // the head biting "ID" (A5-fix-2 §3), so phones have no FAR occlusion (F-022 fallback, brief 2.5)
          matteUrls: imageUrls(portrait ? 'hero-matte-916' : 'hero-matte-169'),
          farOcclusion: !portrait,
          lines: this.typeLines(),
          cssW: this.frameRect.width,
          cssH: this.frameRect.height,
          dpr: this.dpr,
        });
        if (this.destroyed || (this.mode as Mode) === 'static') {
          scene.dispose();
          return null;
        }
        const m = data.meta as Record<string, unknown>;
        const yaw = m.yaw as { auto?: number; min?: number; max?: number } | undefined;
        const pitch = m.pitch as { auto?: number; min?: number; max?: number } | undefined;
        const base = portrait ? POSE.phone : POSE.desktop;
        this.rig.limits = {
          yaw: portrait ? base.yaw : (yaw?.auto ?? base.yaw),
          // phones keep their own, narrower drag range (F-029): the meta's -6 pushes the H1 out of the frame
          yawMin: portrait ? base.yawMin : (yaw?.min ?? base.yawMin),
          yawMax: portrait ? base.yawMax : (yaw?.max ?? base.yawMax),
          pitch: pitch?.auto ?? base.pitch,
          pitchMin: pitch?.min ?? base.pitchMin,
          pitchMax: pitch?.max ?? base.pitchMax,
          dolly: typeof m.dolly === 'number' ? m.dolly : base.dolly,
        };
        scene.onContextLost(() => {
          // webglcontextlost: fall back to the near-matte still, no retry (brief 2.4)
          this.glFailed = true;
          this.glFallback();
        });
        this.scene = scene;
        this.glHost.style.display = 'block';
        this.glHost.style.opacity = '0';
        scene.setPose(0, 0, 0);
        scene.render(); // rendered at yaw 0, opacity 0, before the crossfade
        if (this.tl.frozenAt !== null && !this.glShown && this.P < BEATS.camBack[1] && this.mode === 'live') {
          // GL arrived after the freeze: swap in at yaw 0, swing only if the visitor hasn't scrolled
          this.showGl(nowS(), !this.scrolledSinceSnap && !this.tl.rest);
        }
        this.kick();
        return scene;
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[HRCG hero] 3D VIEW unavailable:', err);
        this.glFailed = true;
        return null;
      } finally {
        this.building = null;
      }
    })();
    return this.building;
  }

  private glFallback() {
    this.glShown = false;
    heroMachine.setGl(false);
    delete this.root.dataset.look;
    this.glHost.tabIndex = -1;
    this.disposeGl();
    this.kick();
  }

  private disposeGl() {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    this.glShown = false;
    this.glHost.style.opacity = '0';
    this.glHost.style.display = 'none';
  }

  /** The DOM H1 line boxes, measured, in frame CSS px (the GL type planes copy them exactly). */
  private typeLines(): TypeLine[] {
    const fr = this.mediaBox.getBoundingClientRect();
    return this.lines.map((lineEl, i) => {
      const ink = lineEl.querySelector('.cv-ink') as HTMLElement;
      const text = HERO.h1LinesUpper[i];
      const cs = getComputedStyle(ink);
      const fontPx = parseFloat(cs.fontSize);
      const range = document.createRange();
      range.selectNodeContents(ink);
      const rr = range.getBoundingClientRect();
      // inline content box = ascent + descent; the baseline sits at top + ascent
      const asc = (1971 / 2000) * fontPx;
      return {
        text,
        color: i < 2 ? '#ECE8E1' : '#F06A2C',
        plane: i < 2 ? 'far' : 'near',
        x: rr.left - fr.left,
        top: rr.top - fr.top,
        width: rr.width,
        baseline: rr.top - fr.top + asc,
        fontPx,
        letterSpacingPx: -0.005 * fontPx,
      } as TypeLine;
    });
  }

  /** QA: type layers normalised to the frame (A5's D1 occlusion and contrast measurements). */
  private typeLayers() {
    const fr = this.mediaBox.getBoundingClientRect();
    return this.typeLines().map((l) => ({
      text: l.text,
      plane: l.plane,
      x0: +(l.x / fr.width).toFixed(4),
      x1: +((l.x + l.width) / fr.width).toFixed(4),
      capTop: +((l.baseline - l.fontPx * 0.8) / fr.height).toFixed(4),
      baseline: +(l.baseline / fr.height).toFixed(4),
      size: +(l.fontPx / fr.height).toFixed(4),
    }));
  }

  private planLanding() {
    const bay = this.bayRect();
    return { bay: { x: bay.x, y: bay.y, w: bay.width, h: bay.height }, P: this.P };
  }

  // ----------------------------------------------------------------- stage progress (P)
  private readP() {
    const y = window.scrollY - this.coverTop;
    this.P = Math.max(0, Math.min(1, y / this.spacer));
  }

  private setVt(vt: string) {
    const r = this.root;
    if (r.dataset.vt === vt) return;
    const wasPlan = r.dataset.vt === 'plan';
    r.dataset.vt = vt;
    if (vt === 'plan' || wasPlan) {
      // the view title ticks into PLAN 05 (brief 3.3)
      const el = q<HTMLElement>(r, vt === 'plan' ? '.cv-plan .cv-vt' : '.cv-media .cv-vt:not(.view-title-hidden)');
      if (el) {
        el.classList.remove('is-tick');
        void el.offsetWidth;
        el.classList.add('is-tick');
      }
    }
  }

  /**
   * P as the plan cut sees it. While the 3D VIEW is still up (a fast scroll from the rest pose), the cut
   * holds at its start until the camera is home and GL has handed over to the DOM still (F-027); a jump
   * past the cut (INDEX, deep link) never waits.
   */
  private cutP(): number {
    const P = this.P;
    if (this.glShown && this.scene && P < BEATS.planCut[1]) return Math.min(P, BEATS.planCut[0]);
    return P;
  }

  private applyP() {
    if (this.mode === 'static') return;
    const P = this.P;
    const C = this.cutP();
    const r = this.root;
    const a100 = this.a100;
    r.style.setProperty('--a0-o', (1 - segment(P, BEATS.h1Out[0], BEATS.h1Out[1])).toFixed(3));
    a100.style.setProperty('--a100-o', segment(C, BEATS.a100In[0], BEATS.a100In[1]).toFixed(3));
    a100.style.setProperty('--arena-in', segment(C, BEATS.arenaIn[0], BEATS.arenaIn[1]).toFixed(3));
    a100.dataset.bubbles = C >= BEATS.bubblesAt ? 'in' : 'out';
    a100.dataset.print = C >= BEATS.printAt ? 'in' : 'out';
    a100.dataset.live = C >= BEATS.printAt ? 'on' : 'off';
    if (P >= BEATS.releaseA100At) this.releaseA100();
    // the hero media leave under the plan (P 0.10-0.25); the H1 stays in the accessibility tree (F-023)
    const heroO = 1 - segment(C, BEATS.heroOut[0], BEATS.heroOut[1]);
    this.hero.style.opacity = heroO.toFixed(3);
    if (heroO <= 0) r.dataset.heroGone = '';
    else delete r.dataset.heroGone;
    // the plan still and, under it, a full-frame slab: no hero band beside the registered square (F-005)
    const planO = drawEase(segment(C, BEATS.planIn[0], BEATS.planIn[1]));
    this.planO = planO;
    r.style.setProperty('--plan-o', (planO * (1 - segment(C, BEATS.backdropOut[0], BEATS.backdropOut[1]))).toFixed(3));
    r.style.setProperty('--cv-bgy', `${(-window.scrollY).toFixed(0)}px`);
    const M0 = this.M0;
    // fetch PLAN 05 (151 kB) on the first sign of a scroll, or a while after the hero rests: never inside
    // the first view's byte budget (F-002 / F-006)
    if (P > 0.003) this.prefetchPlan();
    if (M0 && C >= BEATS.planCut[0] * 0.5) {
      // pull-out: SETTLE-eased, so the square clears the row and the H2 early and docks slowly
      const e = settleEase(segment(C, BEATS.pullOut[0], BEATS.pullOut[1]));
      const M1 = onBox(this.bayRect());
      const m = e > 0 ? mixSim(M0, M1, e) : M0;
      this.planSq.style.transform = cssMatrix(m);
      this.planSq.style.setProperty('--fe', `${(6 * (1 - e * e)).toFixed(2)}%`);
      // the deposits ride with the plan; in portrait they first FLIP onto b44's line (P 0.10-0.22)
      let D = relativeAffine(m, M0);
      if (this.depFlip) {
        const [L0, R0, L1, R1] = this.depFlip;
        const u = drawEase(segment(C, BEATS.depositIn[0], BEATS.depositIn[1]));
        D = compose(D, lineFlip(L0, R0, L1, R1, u));
      }
      this.deps.style.transform = cssAffine(D);
      this.planSq.style.opacity = this.landed && this.slotShown ? '0' : planO.toFixed(3);
    } else {
      this.planSq.style.opacity = '0';
      this.deps.style.transform = '';
    }
    // landing (P >= 0.75): the slot swaps to b44 from 2.60 s
    if (C >= BEATS.land) this.land();
    else this.unland();
    // view titles: one at a time. PLAN 05 ticks in with the cut; the A-100 row's own title takes over
    // as the row arrives (it covers bay 05 too)
    if (C >= BEATS.a100In[0]) this.setVt('none');
    else if (C >= BEATS.planCut[0] && planO >= 0.5) this.setVt('plan');
    else this.setVt(this.heroVt());
    // the 3D VIEW eases back to yaw 0 over P 0..0.10, then hands over to the DOM still once the
    // camera is home (F-027)
    if (this.glShown) {
      const k = 1 - settleEase(segment(P, BEATS.camBack[0], BEATS.camBack[1]));
      if (this.tl.rest || !this.tl.swing) this.rig.base = { ...this.scaledRest(k) };
      const home = Math.abs(this.rig.pose.yaw) < 0.15 && Math.abs(this.rig.pose.pitch) < 0.15;
      const jump = P >= BEATS.planCut[1];
      if (P >= BEATS.camBack[1] && this.glOutAt === null && (home || jump || this.mode === 'capture')) {
        if (jump && !home) {
          // a jump past the cut: no camera move to wait for
          this.rig.snapTo({ yaw: 0, pitch: 0, dolly: 0 });
          this.rig.clearUser();
        }
        this.glOutAt = this.mode === 'capture' ? this.captureT : nowS();
      }
    } else if (
      this.scene === null &&
      this.mode === 'live' &&
      P < 0.05 &&
      this.glAllowed &&
      !this.glFailed &&
      this.tl.frozenAt !== null &&
      !this.building
    ) {
      // back at the top after the plan cut disposed it: rebuild at the rest pose
      void this.buildGl().then((s) => {
        if (s && !this.glShown && this.P < 0.05) {
          this.showGl(nowS(), false);
          this.kick();
        }
      });
    }
    if (P < 0.05 && this.glOutAt !== null && this.scene) {
      this.glOutAt = null;
    }
  }

  private scaledRest(k: number) {
    const L = this.rig.limits;
    return { yaw: L.yaw * k, pitch: L.pitch * k, dolly: L.dolly * k };
  }

  private land() {
    const bay = this.bayRect();
    const v = this.slot5;
    v.style.left = `${bay.x}px`;
    v.style.top = `${bay.y}px`;
    v.style.width = `${bay.width}px`;
    v.style.height = `${bay.height}px`;
    if (this.landed) return;
    this.landed = true;
    this.slotShown = false;
    if (this.mode === 'capture') return; // seekPlan() shows the slot once it has seeked
    const token = ++this.slotWait;
    const go = () => {
      if (!this.landed || token !== this.slotWait) return;
      try {
        if (v.currentTime < 2.59 || v.ended) v.currentTime = 2.6;
      } catch {
        /* ignore */
      }
      // the plan still (b44 at 2.60 s) stays up until the slot has that frame: never a black box (F-030)
      void frameReady(v).then((ok) => {
        if (ok && this.landed && token === this.slotWait) this.showSlot();
      });
      if (!prefsStore.get().motion) return;
      this.releaseSlot?.();
      this.releaseSlot = videoManager.reserve('a100-slot5');
      v.play().catch(() => {
        this.releaseSlot?.();
        this.releaseSlot = null;
      });
    };
    if (v.readyState >= 1) go();
    else {
      v.preload = 'auto';
      v.addEventListener('loadedmetadata', go, { once: true });
      if (v.networkState !== HTMLMediaElement.NETWORK_LOADING) {
        try {
          v.load();
        } catch {
          /* ignore */
        }
      }
    }
  }

  /** Swap the plan still for the landed slot-05 film (it has its 2.60 s frame). */
  private showSlot() {
    this.slotShown = true;
    this.slot5.style.opacity = '1';
    this.planSq.style.opacity = '0';
  }

  private unland() {
    const v = this.slot5;
    if (this.P >= BEATS.pullOut[0] && v.readyState === 0 && v.networkState !== HTMLMediaElement.NETWORK_LOADING && this.mode !== 'static') {
      // warm it up before landing, parked on the landing frame
      v.preload = 'auto';
      const seek = () => {
        try {
          v.currentTime = 2.6;
        } catch {
          /* ignore */
        }
      };
      v.addEventListener('loadedmetadata', seek, { once: true });
      try {
        v.load();
      } catch {
        /* ignore */
      }
    }
    if (!this.landed) return;
    this.landed = false;
    this.slotShown = false;
    this.slotWait++;
    v.pause();
    v.style.opacity = '0';
    this.releaseSlot?.();
    this.releaseSlot = null;
    try {
      v.currentTime = 2.6;
    } catch {
      /* ignore */
    }
  }

  // ----------------------------------------------------------------- render
  private phase(now: number): HeroState {
    const tl = this.tl;
    if (tl.rest) return 'rest';
    if (tl.S === null) {
      if (tl.payStart === null) return 'waiting';
      if (tl.pullKind !== 'none') return 'pulling';
      if (now < tl.payStart + TIMING.payout) return 'paying-out';
      return 'armed';
    }
    if (tl.frozenAt === null || now < tl.frozenAt) return tl.filmT0 !== null && now >= tl.filmT0 ? 'film' : 'snapped';
    if (this.glShown && tl.glAt !== null && tl.swing && tl.swingStart !== null) return 'swinging';
    if (now < tl.frozenAt + TIMING.crossfade) return 'frozen';
    return 'rest';
  }

  private heroVt(): string {
    const tl = this.tl;
    const now = this.mode === 'capture' ? this.captureT : nowS();
    if (tl.S === null && !tl.rest) return 'none';
    if (this.glShown && tl.glAt !== null && now >= tl.glAt) return '3d';
    if (tl.frozenAt !== null && now >= tl.frozenAt) return tl.filmError ? 'film' : 'still';
    if (tl.filmT0 !== null) return 'film';
    return 'none';
  }

  private kick() {
    if (this.raf || this.destroyed || this.mode !== 'live') return;
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (ms: number) => {
    this.raf = 0;
    if (this.destroyed || this.mode !== 'live') return;
    const dt = Math.min(0.1, Math.max(0.001, (ms - this.lastTick) / 1000));
    this.lastTick = ms;
    const now = ms / 1000;
    const tl = this.tl;
    // auto-snap if idle (a ghost pull of 60 px, then release)
    if (tl.autoSnapAt !== null && now >= tl.autoSnapAt && tl.S === null && tl.pullKind === 'none' && !tl.rest) {
      tl.autoSnapAt = null;
      this.standardPull(false, true);
    }
    // pointer pull: Verlet
    if (tl.pullKind === 'pointer') {
      const steps = Math.max(1, Math.min(4, Math.round(dt * 120)));
      for (let i = 0; i < steps; i++) this.string.step(dt / steps);
    }
    // analytic pull finishes -> release
    if ((tl.pullKind === 'ghost' || tl.pullKind === 'standard') && now >= tl.pullStart + tl.pullDur + (tl.pullKind === 'ghost' ? TIMING.ghostHold : 0)) {
      const offsets = this.string.pluckShape(tl.pullIndex, tl.pullAmount);
      this.beginSnap(now, offsets, tl.pullAmount, tl.pullByUser);
    }
    const busy = this.render(now, dt);
    if (busy) this.raf = requestAnimationFrame(this.tick);
  };

  /** Draw every visual for time `now`. Returns true while something is still moving. */
  private render(now: number, dt = 1 / 60): boolean {
    const tl = this.tl;
    const r = this.root;
    let busy = false;
    let st = this.phase(now);
    if (heroMachine.get().state !== st) heroMachine.force(st);

    // GL has handed back to the DOM still (plan cut): one WebGL context at a time, disposed (brief 8.4,
    // H9). First, so everything below already sees the released cut (F-027 held it until now).
    if (this.glOutAt !== null && this.scene && now >= this.glOutAt + TIMING.crossfade) {
      this.disposeGl();
      heroMachine.setGl(false);
      delete r.dataset.look;
      this.glHost.tabIndex = -1;
      this.glOutAt = null;
      this.applyP();
    }

    // impact at the first zero-crossing
    if (tl.S !== null && !tl.impactDone && tl.impactAt !== null && now >= tl.impactAt && !tl.rest) this.impact(tl.impactAt);

    // ---- string
    busy = this.renderString(now, st) || busy;

    // ---- control points and chalk box: stamp with the pay-out, leave with the deposit
    const pay = tl.payStart === null ? 0 : segment(now, tl.payStart, tl.payStart + TIMING.payout);
    let markO = 0;
    if (!tl.rest && tl.payStart !== null) {
      markO = tl.S === null ? 1 : 1 - segment(now, tl.S + TIMING.depositFrom, tl.S + TIMING.depositOut);
    }
    // each control point stamps (1.35 -> 1, SETTLE 300 ms): the right one as the line leaves the box,
    // the left one as the line arrives
    const ps = tl.payStart ?? 0;
    const stR = tl.payStart === null ? 0 : settleEase(segment(now, ps, ps + 0.3));
    const stL = tl.payStart === null ? 0 : settleEase(segment(now, ps + TIMING.payout, ps + TIMING.payout + 0.3));
    this.xr.style.opacity = (markO * Math.min(1, stR * 3)).toFixed(3);
    this.xr.style.scale = (1.35 - 0.35 * stR).toFixed(3);
    this.xl.style.opacity = (markO * Math.min(1, stL * 3)).toFixed(3);
    this.xl.style.scale = (1.35 - 0.35 * stL).toFixed(3);
    this.chalkbox.style.opacity = (markO * Math.min(1, pay * 8)).toFixed(3);
    if (tl.payStart !== null && now < ps + TIMING.payout + 0.3) busy = true;

    // ---- deposits: on the slab while armed; gone by S + 0.5, before the film's own line (which runs
    //      toward the lens, at right angles to ours) is up (F-073). They return for the plan cut and
    //      hand over to b44's own line as the plan still passes 0.6 opacity (F-005 step 8).
    let depO = 0;
    if (!tl.rest && (tl.S === null || now < tl.S + TIMING.depositOut)) {
      depO = tl.S === null ? 1 : 1 - segment(now, tl.S + TIMING.depositFrom, tl.S + TIMING.depositOut);
    }
    const C = this.cutP();
    // (it comes back WITH the plan, never alone over the perspective still and its own filmed line)
    const planDep =
      (C >= BEATS.depositIn[0] ? segment(this.planO, 0, 0.15) : 0) *
      (1 - segment(this.planO, BEATS.depositHandover[0], BEATS.depositHandover[1]));
    const dO = Math.max(depO, planDep);
    for (const d of this.deposits) {
      const born = tl.S !== null && d.bornAt >= tl.S - 0.001 ? segment(now, d.bornAt, d.bornAt + 0.03) : 1;
      d.el.style.opacity = (dO * born).toFixed(3);
    }
    if (tl.S !== null && now < tl.S + TIMING.dustOut + 0.05) busy = true;

    // ---- puff
    if (tl.impactAt !== null && tl.impactDone && !tl.rest) {
      const alive = this.dust?.render(now - tl.impactAt) ?? false;
      busy = busy || alive;
    } else if (tl.rest) this.dust?.clear();

    // ---- H1 ink (rises from the baseline through a noise mask over 280 ms)
    let ink = 0;
    if (tl.rest) ink = 1;
    else if (tl.impactAt !== null && tl.impactDone) ink = settleEase(segment(now, tl.impactAt, tl.impactAt + TIMING.ink));
    r.style.setProperty('--ink', ink.toFixed(3));
    if (ink >= 1) r.dataset.inked = '';
    else delete r.dataset.inked;
    if (ink > 0 && ink < 1) busy = true;

    // ---- film, still, matte, 3D VIEW
    const v = this.film;
    let filmO = 0;
    if (!tl.rest && tl.filmT0 !== null) {
      filmO = settleEase(segment(now, tl.filmT0, tl.filmT0 + TIMING.filmFade));
      if (tl.frozenAt !== null) filmO *= 1 - segment(now, tl.frozenAt, tl.frozenAt + TIMING.crossfade);
      if (filmO > 0 && filmO < 1) busy = true;
      if (tl.frozenAt === null) busy = true;
    }
    v.style.opacity = filmO.toFixed(3);
    const frozen = tl.frozenAt !== null && now >= tl.frozenAt;
    this.stillPic.style.display = tl.S !== null || tl.rest ? 'block' : 'none';
    this.stillPic.style.opacity = frozen || tl.rest ? '1' : '0';
    const glIn = this.glShown && tl.glAt !== null ? segment(now, tl.glAt, tl.glAt + TIMING.crossfade) : 0;
    // the DOM H1 hands over to the type planes once the canvas is fully in (no washed-out double layer)
    const typeIn =
      this.glShown && tl.glAt !== null ? segment(now, tl.glAt + TIMING.crossfade, tl.glAt + 2 * TIMING.crossfade) : 0;
    const glOut = this.glOutAt !== null ? segment(now, this.glOutAt, this.glOutAt + TIMING.crossfade) : 0;
    const glO = glIn * (1 - glOut);
    if ((typeIn > 0 && typeIn < 1) || (glIn > 0 && glIn < 1) || (glOut > 0 && glOut < 1)) busy = true;
    this.glHost.style.opacity = glO.toFixed(3);
    // who draws the type: the DOM H1 (+ the CSS near-matte for the FAR bite) or the GL type planes.
    // In: canvas first, then the DOM hands over (typeIn). Out (plan cut): the DOM takes it back at once.
    const glOwnsType = this.glShown && glOut === 0 ? typeIn : 0;
    let matteO = 0;
    if (frozen || tl.rest) {
      const fade = tl.frozenAt !== null && !tl.rest ? segment(now, tl.frozenAt, tl.frozenAt + TIMING.crossfade) : 1;
      matteO = fade * (1 - glOwnsType);
    }
    this.matte.style.display = matteO > 0 ? 'block' : 'none';
    this.matte.style.opacity = matteO.toFixed(3);
    // the DOM H1 stays in the accessibility tree throughout. FAR crossfades to its planes (the bite
    // appears there); NEAR hands over at once when the canvas is fully in: at yaw 0 the plane is the same
    // orange in the same place, and a fade would let the matte darken ACT on the way (F-026)
    r.style.setProperty('--h1-dom', (1 - glOwnsType).toFixed(3));
    r.style.setProperty('--h1-dom-near', this.glShown && glOut === 0 && glIn >= 1 ? '0' : '1');

    // ---- camera
    if (this.scene && this.glShown) {
      const swinging = tl.swing && tl.swingStart !== null && !tl.rest;
      if (swinging) {
        const s = now - tl.swingStart!;
        this.rig.base = this.rig.swingTarget(s, 1 - settleEase(segment(this.P, 0, BEATS.camBack[1])));
        busy = true;
      }
      // the plan cut: the user offsets ease out with the camera, and past P 0.10 the rig hurries home
      // (lambda 14) so GL can hand over to the DOM still at yaw 0 (F-027)
      this.rig.userK = 1 - settleEase(segment(this.P, BEATS.camBack[0], BEATS.camBack[1]));
      const homeward = this.P >= BEATS.camBack[1];
      const moving = this.rig.step(dt, homeward ? 14 : POSE.lambda);
      busy = busy || moving;
      if (swinging) {
        // rest when the camera has reached the pose (|delta| < 0.05 deg), not on a fixed clock (F-074)
        const s = now - tl.swingStart!;
        const tgt = this.rig.target();
        const settled = Math.abs(this.rig.pose.yaw - tgt.yaw) < 0.05 && Math.abs(this.rig.pose.pitch - tgt.pitch) < 0.05;
        if ((s >= TIMING.swing * 0.9 && settled) || s >= TIMING.swing + 1) {
          tl.swing = false;
          tl.rest = true;
          r.dataset.inked = '';
        }
      }
      const p = this.rig.pose;
      this.scene.setPose(p.yaw, p.pitch, p.dolly);
      // the GL type planes leave with the DOM H1 (--a0-o), so no type rides a turning camera
      this.scene.setTypeOpacity(1 - segment(this.P, BEATS.h1Out[0], BEATS.h1Out[1]));
      this.scene.render();
      if (homeward && this.glOutAt === null) {
        busy = true;
        this.applyP(); // hands over once home
      }
      if (moving) this.monitor(dt);
    }

    // ---- UI attributes (the camera may have just come to rest: read the phase again)
    st = this.phase(now);
    if (heroMachine.get().state !== st) heroMachine.force(st);
    const armed = st === 'paying-out' || st === 'armed' || st === 'pulling';
    r.dataset.line = armed ? 'armed' : 'off';
    const hint =
      st === 'paying-out' || st === 'armed' || st === 'pulling'
        ? 'pull'
        : st === 'rest' || (frozen && !this.glShown)
          ? this.glShown
            ? 'frozen-gl'
            : 'frozen'
          : 'none';
    r.dataset.hint = hint;
    // any pull (pointer, tap, key, ghost, capture script): the hint steps back under the bowed string (F-071)
    if (tl.S === null && tl.pullKind !== 'none' && !tl.rest) r.dataset.pull = '';
    else delete r.dataset.pull;
    r.dataset.reset = st === 'rest' || (frozen && !this.glShown) ? 'on' : 'off';
    if (st === 'rest' && this.mode === 'live' && !this.planTimer) {
      // idle at rest: fetch the plan still a few seconds later (after the first view)
      this.planTimer = window.setTimeout(() => this.prefetchPlan(), 3000);
      this.timers.push(this.planTimer);
    }
    if (this.cutP() < BEATS.planCut[0] || (this.planO < 0.5 && this.cutP() < BEATS.a100In[0])) this.setVt(this.heroVt());
    if (st === 'paying-out' || st === 'pulling' || (tl.pullKind !== 'none' && tl.S === null)) busy = true;
    return busy;
  }

  private stringHidden() {
    this.pLine.setAttribute('d', '');
    this.pCore.setAttribute('d', '');
    this.pShadow.setAttribute('d', '');
  }

  private shadowPath(pts: Float32Array): string {
    const n = this.string.n;
    const out = new Float32Array(n * 2);
    // only the deviation ACROSS the line lifts the string off the slab: during the pay-out the nodes
    // run along it (their along-line distance from the rest node is not height), so no wedge (F-070)
    const { perp } = this.string.axes;
    for (let i = 0; i < n; i++) {
      const rest = this.string.restAt(i);
      const dev = Math.abs((pts[i * 2] - rest.x) * perp.x + (pts[i * 2 + 1] - rest.y) * perp.y);
      const s = Math.min(STRING.shadowMax, dev * STRING.shadowK);
      out[i * 2] = pts[i * 2] + SHADOW_DIR.x * s;
      out[i * 2 + 1] = pts[i * 2 + 1] + SHADOW_DIR.y * s + 1;
    }
    return pathOf(out, n);
  }

  private drawString(pts: Float32Array, opacity = 1) {
    const n = this.string.n;
    const d = pathOf(pts, n);
    this.pLine.setAttribute('d', d);
    this.pCore.setAttribute('d', d);
    this.pShadow.setAttribute('d', this.shadowPath(pts));
    const o = opacity.toFixed(3);
    this.pLine.style.opacity = o;
    this.pCore.style.opacity = (opacity * 0.55).toFixed(3);
    this.pShadow.style.opacity = o;
  }

  private renderString(now: number, st: HeroState): boolean {
    const tl = this.tl;
    const S = this.string;
    if (tl.rest || tl.payStart === null) {
      this.stringHidden();
      return false;
    }
    const n = S.n;
    if (tl.S === null) {
      if (tl.pullKind === 'pointer') {
        this.drawString(S.p);
        return true;
      }
      if (tl.pullKind === 'ghost' || tl.pullKind === 'standard' || tl.pullKind === 'script') {
        const e = settleEase(segment(now, tl.pullStart, tl.pullStart + tl.pullDur));
        const off = S.pluckShape(tl.pullIndex, tl.pullAmount * e);
        this.drawString(S.shape(off, 1, new Float32Array(n * 2)));
        return true;
      }
      // pay-out from the chalk box to the left control point, with a sag that pulls taut
      const u = drawEase(segment(now, tl.payStart, tl.payStart + TIMING.payout));
      if (u >= 1) {
        // armed and idle: now and then the taut line gives a small twang, to say it can be plucked (H-2)
        const twang = this.twangAt(now - (tl.payStart + TIMING.payout));
        if (twang !== 0) {
          const amt = (this.isPhone() ? STRING.twangPxPhone : STRING.twangPx) / this.string.cap;
          const off = S.pluckShape(Math.round((n - 1) * 0.6), amt);
          this.drawString(S.shape(off, twang, new Float32Array(n * 2)));
        } else this.drawString(S.shape(new Float32Array(n * 2), 0, new Float32Array(n * 2)));
        return true;
      }
      if (u <= 0.02) {
        // nothing has left the box yet: no dot, no stray shadow tick (F-070)
        this.stringHidden();
        return true;
      }
      const [L, R] = S.ends;
      const pts = new Float32Array(n * 2);
      const { perp } = S.axes;
      const sag = 7 * (1 - u) * Math.min(1, u * 4);
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1); // 0 at the box, 1 at the moving end
        const x = R.x + (L.x - R.x) * u * k;
        const y = R.y + (L.y - R.y) * u * k;
        const s = sag * Math.sin(Math.PI * k);
        pts[(n - 1 - i) * 2] = x + perp.x * s;
        pts[(n - 1 - i) * 2 + 1] = y + perp.y * s;
      }
      this.drawString(pts);
      return st === 'paying-out';
    }
    // released: whip through rest, slap at the first zero-crossing, buzz for 160 ms, then hide
    const tau = now - tl.S;
    if (!tl.offsets) {
      this.stringHidden();
      return false;
    }
    let f: number;
    let o = 1;
    if (tau < IMPACT_T) f = releaseFactor(tau);
    else {
      const b = tau - IMPACT_T;
      f = buzzFactor(b);
      o = 1 - segment(b, STRING.buzzMs / 1000, STRING.buzzMs / 1000 + 0.06);
    }
    if (o <= 0) {
      this.stringHidden();
      return false;
    }
    this.drawString(S.shape(tl.offsets, f, new Float32Array(n * 2)), o);
    return true;
  }

  /** Idle twang factor at tau seconds after the pay-out (a light flick: SNAP from rest, every period). */
  private twangAt(tau: number): number {
    const t = tau - STRING.twangFirst;
    if (t < 0) return 0;
    const k = t % STRING.twangPeriod;
    if (k > 0.5) return 0;
    return snapFlick(k);
  }

  /** Frame-time monitor: median > 22 ms over 1 s drops DPR to 1.25; still slow -> the near-matte still. */
  private monitor(dt: number) {
    if (this.mode !== 'live' || /[?&]heroperf=0/.test(location.search)) return;
    const t = performance.now();
    if (t - this.lastFrameAt > 250) this.frameTimes = [];
    this.lastFrameAt = t;
    this.frameTimes.push(dt * 1000);
    const total = this.frameTimes.reduce((a, b) => a + b, 0);
    if (total < 1000) return;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.frameTimes = [];
    if (median <= 22) return;
    if (this.perfStage === 0 && this.dpr > 1.25) {
      this.perfStage = 1;
      this.dpr = 1.25;
      this.scene?.setDpr(1.25);
      tierStore.demote({ lite: true });
      return;
    }
    this.perfStage = 2;
    this.glFailed = true;
    this.glFallback();
  }

  // ----------------------------------------------------------------- capture (?capture)
  private captureT = 0;

  private setupCapture() {
    const r = this.root;
    this.warmFilm();
    this.installInkMask();
    r.dataset.vt = 'none';
    this.modeOffs.push(
      registerCaptureScene('hero', { duration: 10, seek: (t) => this.seekHero(t) }),
      registerCaptureScene('cover-plan', { duration: 3, seek: (t) => this.seekPlan(t) }),
    );
  }

  private scriptTimeline(t: number, filmDur: number) {
    const c = CAPTURE;
    const tl = freshTimeline();
    tl.payStart = c.ready;
    if (t >= c.pullStart && t < c.snap) {
      tl.pullKind = 'script';
      tl.pullStart = c.pullStart;
      tl.pullDur = c.pullEnd - c.pullStart;
      tl.pullIndex = Math.round((this.string.n - 1) * 0.62);
      tl.pullAmount = c.pullAmount;
    }
    if (t >= c.snap) {
      tl.S = c.snap;
      tl.offsets = this.string.pluckShape(Math.round((this.string.n - 1) * 0.62), c.pullAmount);
      tl.amount = c.pullAmount;
      tl.impactAt = c.snap + IMPACT_T;
      tl.filmT0 = c.snap + TIMING.filmIn;
      const tF = tl.filmT0 + filmDur;
      if (t >= tF) {
        tl.frozenAt = tF;
        if (this.scene) {
          tl.glAt = tF;
          tl.swing = true;
          tl.swingStart = tF + TIMING.swingDelay;
        }
      }
    }
    return tl;
  }

  private async seekHero(t: number) {
    this.captureT = t;
    this.P = 0;
    this.applyP();
    const v = this.film;
    await whenLoaded(v);
    const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1.042;
    if (t >= CAPTURE.snap && this.glAllowed && !this.scene) {
      await this.buildGl();
      if (this.scene) this.glShown = true;
    }
    const tl = this.scriptTimeline(t, dur);
    // deposit + puff exactly once, deterministic
    if (tl.impactAt !== null && t >= tl.impactAt) {
      if (!this.deposits.length) {
        this.snapCount = 0;
        this.setStringEnds();
        const [L, R] = this.string.ends;
        this.addDeposit(L, R, tl.impactAt);
        this.snapCount = 1;
        this.dust?.emit(L, R, tl.amount, 1, this.isPhone() ? 300 : 600, this.frameRect.height / 888 || 1);
      }
      tl.impactDone = true;
    } else {
      this.deposits.forEach((d) => d.el.remove());
      this.deposits = [];
      this.snapCount = 0;
      this.setStringEnds();
    }
    this.tl = tl;
    this.glShown = !!this.scene && tl.glAt !== null && t >= tl.glAt;
    // film frame
    if (tl.filmT0 !== null && t >= tl.filmT0) await seekVideo(v, Math.min(dur - 0.001, t - tl.filmT0));
    else await seekVideo(v, 0);
    this.matchCodec();
    // camera: deterministic integration from the freeze
    if (this.scene && tl.swingStart !== null && t >= tl.swingStart) {
      const p = this.rig.poseAt(t - tl.swingStart);
      this.rig.snapTo(p);
      this.rig.base = { ...p };
    } else {
      this.rig.snapTo({ yaw: 0, pitch: 0, dolly: 0 });
      this.rig.base = { yaw: 0, pitch: 0, dolly: 0 };
    }
    this.render(t, 0);
    if (this.scene) {
      this.scene.setPose(this.rig.pose.yaw, this.rig.pose.pitch, this.rig.pose.dolly);
      this.scene.render();
    }
  }

  private async seekPlan(t: number) {
    // the hero at rest, then P = t / 3 performs the plan cut and the pull-out
    await this.seekHero(10);
    this.captureT = 10;
    this.tl.rest = true;
    this.P = Math.max(0, Math.min(1, t / 3));
    this.glOutAt = this.P >= BEATS.camBack[1] ? 9 : null; // already handed over to the DOM still
    this.applyP();
    const k = 1 - settleEase(segment(this.P, 0, BEATS.camBack[1]));
    if (this.scene) {
      const p = this.scaledRest(k);
      this.rig.snapTo(p);
      this.scene.setPose(p.yaw, p.pitch, p.dolly);
      this.scene.setTypeOpacity(1 - segment(this.P, BEATS.h1Out[0], BEATS.h1Out[1]));
      this.scene.render();
    }
    this.render(10, 0);
    // the plan still must be decoded before the frame is taken
    const planImg = this.planSq.querySelector('img');
    if (planImg && this.P > 0.01) {
      if (!planImg.complete) await new Promise<void>((res) => {
        planImg.addEventListener('load', () => res(), { once: true });
        planImg.addEventListener('error', () => res(), { once: true });
        window.setTimeout(res, 8000);
      });
      await planImg.decode?.().catch(() => {});
    }
    // A3's R2 strip: hold it on a deterministic frame (capture frames must repeat exactly)
    for (const v of Array.from(this.a100.querySelectorAll<HTMLVideoElement>('video'))) {
      const key = v.closest<HTMLElement>('[data-video-key]')?.dataset.videoKey;
      if (key) videoManager.pause(key);
      v.pause();
      if (this.P < BEATS.arenaIn[0]) continue;
      if (v.readyState < 2) {
        v.preload = 'auto';
        if (v.readyState === 0) {
          try {
            v.load();
          } catch {
            /* ignore */
          }
        }
        await whenLoaded(v);
      }
      await seekVideo(v, Math.max(0, (this.P - BEATS.arenaIn[0]) * 4));
    }
    if (this.P >= BEATS.land) {
      const v = this.slot5;
      if (v.readyState === 0) {
        v.preload = 'auto';
        try {
          v.load();
        } catch {
          /* ignore */
        }
      }
      await whenLoaded(v);
      await seekVideo(v, 2.6 + Math.max(0, t - 3 * BEATS.land));
      if (v.readyState >= 2) this.showSlot();
    }
  }
}

export function createCoverController(host: CoverHost): { destroy(): void } {
  const c = new CoverController(host);
  c.start();
  return { destroy: () => c.destroy() };
}
