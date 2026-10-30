// The title as an object: three words and two hyphen blocks, laid out with transforms only.
// Every state of this object is a sentence of the book:
//   trap      "UPSIDE DOWN"   no hyphens, red, leaning      (the diagnosis)
//   level     "UP-SIDE-DOWN"  three inks, hyphens in place   (the operating system)
// Words are absolutely positioned; widths are measured once per fit, so nothing ever reflows
// while it moves (brief §8). Neighbours are pushed with translateX.
import { Spring } from '../motion/spring';
import { subscribe, wake } from '../motion/loop';
import { tween, type Handle } from '../motion/timeline';
import { type Ease, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../motion/ease';
import { css, INK, type Ink, mixInk } from '../motion/color';

export type Layout = 'line' | 'stack';
export type WordKey = 'up' | 'side' | 'down';
const KEYS: WordKey[] = ['up', 'side', 'down'];

export interface TitleEls {
  root: HTMLElement;
  ink: HTMLElement;
  words: Record<WordKey, HTMLElement>; // positioned box
  faces: Record<WordKey, HTMLElement>; // the glyphs
  hy: [HTMLElement, HTMLElement]; // positioned box
  hyFace: [HTMLElement, HTMLElement]; // the block
  jobs: HTMLElement[]; // job lines (optional)
  uls: HTMLElement[]; // their underlines
}

export interface TitleConfig {
  layout: Layout;
  restWdth: number; // 112 for the line, 105 for the stack
  /** line: target width in px. stack: font-size in px (clamped to fit). */
  size: () => number;
  /** max width available (px) */
  maxWidth: () => number;
  jobs: boolean;
  /** stack only: centre the two-row trap/collapsed slab in the three-row box */
  centerTrap?: boolean;
  /** underline thickness in px at rest / active */
  ulRest: number;
  ulActive: number;
}

interface Env {
  t0: number;
  a: number;
  h: number;
  r: number;
  amp: number;
}

const HY_W = 0.36; // em
const HY_H = 0.13; // em
const GAP_OPEN = 0.42; // em
const WORD_SPACE = 0.26; // em
const STACK_HY_GAP = 0.05; // em, between a word and its hyphen in the stack

function envValue(e: Env, now: number) {
  const t = now - e.t0;
  if (t < 0) return 0;
  if (t < e.a) return easeOutCubic(t / e.a);
  if (t < e.a + e.h) return 1;
  const r = (t - e.a - e.h) / e.r;
  if (r < 1) return 1 - easeOutQuint(r);
  return -1; // finished
}

export class TitleEngine {
  els: TitleEls;
  cfg: TitleConfig;
  // measured at 100 px
  private m = { up: 0, side: 0, down: 0, sideWide: 0, downNarrow: 0, cap: 70, base: 85 };
  F = 100; // font-size px
  boxW = 0;
  boxH = 0;
  ready = false;

  // animated state
  o1 = new Spring(1, 520, 34); // gap 1 openness 0..1
  o2 = new Spring(1, 520, 34); // gap 2 openness 0..1
  lean = new Spring(0, 300, 26); // degrees
  hyW = [new Spring(HY_W, 300, 26), new Spring(HY_W, 300, 26)]; // block width (em)
  hyDy = [0, 0]; // px offset (drop)
  hySq = [1, 1]; // squash scaleY
  hyVis = [1, 1]; // 0..1 (snap shut / appear)
  master = { op: 1, sc: 1 };
  ink: Record<WordKey, Ink> = { up: INK.up, side: INK.side, down: INK.down };
  env: Record<WordKey, Env[]> = { up: [], side: [], down: [] };
  strikeAmp: Record<WordKey, number> = { up: 0.16, side: 1, down: 1 };
  job = [0, 1, 2].map(() => ({ op: 1, y: 0, ul: 1, th: 0, thT: 0 }));
  active = -1;
  /** pushes the job lines away while collapsed */
  jobsOp = 1;
  /** per-job ink (a job line fades with its word when that word goes blind) */
  jobInk = [1, 1, 1];

  /** an element that leans with the slab (the SCALING label in the hero) */
  companion: HTMLElement | null = null;
  private compOff = { x: 0, y: 0 };

  private handles: Handle[] = [];
  private unsub: () => void;
  private dirty = true;
  private ro: ResizeObserver | null = null;
  private roTimer = 0;
  onFit: (() => void) | null = null;

  constructor(els: TitleEls, cfg: TitleConfig) {
    this.els = els;
    this.cfg = cfg;
    this.unsub = subscribe((now, dt) => this.frame(now, dt));
    this.measure();
    this.fit();
    this.ro = new ResizeObserver(() => {
      window.clearTimeout(this.roTimer);
      this.roTimer = window.setTimeout(() => {
        this.fit();
      }, 100);
    });
    this.ro.observe(els.root.parentElement ?? els.root);
  }

  destroy() {
    this.unsub();
    this.ro?.disconnect();
    this.handles.forEach((h) => h.cancel());
  }

  // ---------- measuring ----------
  measure() {
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;line-height:1;font-size:100px;font-weight:900;font-kerning:normal;';
    probe.style.fontFamily = getComputedStyle(this.els.root).fontFamily;
    const mk = (text: string, wdth: number, ls = 0) => {
      const s = document.createElement('span');
      s.textContent = text;
      s.style.cssText = `display:inline-block;font-variation-settings:"wdth" ${wdth};letter-spacing:${ls}em;`;
      probe.appendChild(s);
      return s;
    };
    const r = this.cfg.restWdth;
    const up = mk('UP', r), side = mk('SIDE', r), down = mk('DOWN', r);
    const sideWide = mk('SIDE', 125, 0.015), downNarrow = mk('DOWN', 90);
    const base = document.createElement('span');
    base.style.cssText = 'display:inline-block;width:1px;height:0;vertical-align:baseline;';
    probe.appendChild(base);
    this.els.root.appendChild(probe);
    const pr = probe.getBoundingClientRect();
    this.m.up = up.getBoundingClientRect().width;
    this.m.side = side.getBoundingClientRect().width;
    this.m.down = down.getBoundingClientRect().width;
    this.m.sideWide = sideWide.getBoundingClientRect().width;
    this.m.downNarrow = downNarrow.getBoundingClientRect().width;
    this.m.base = base.getBoundingClientRect().top - pr.top;
    probe.remove();
    try {
      const c = document.createElement('canvas').getContext('2d');
      if (c) {
        c.font = `900 100px ${getComputedStyle(this.els.root).fontFamily}`;
        const cap = c.measureText('H').actualBoundingBoxAscent;
        if (cap > 40 && cap < 95) this.m.cap = cap;
      }
    } catch {
      /* keep default */
    }
  }

  fit() {
    const { cfg, els, m } = this;
    const maxW = cfg.maxWidth();
    if (cfg.layout === 'line') {
      const w100 = m.up + m.side + m.down + 2 * GAP_OPEN * 100;
      this.F = (Math.min(cfg.size(), maxW) / w100) * 100;
    } else {
      // each word is centred on the axis and its hyphen hangs outside it, so a row needs the hyphen's room on both sides
      const hy = 2 * (STACK_HY_GAP + HY_W) * 100;
      const widest = Math.max(m.up + hy, m.side + hy, m.down);
      this.F = Math.min(cfg.size(), (maxW / widest) * 100);
    }
    this.boxW = els.root.parentElement ? els.root.parentElement.clientWidth : maxW;
    const F = this.F;
    els.root.style.fontSize = `${F}px`;
    const s = F / 100;
    for (const k of KEYS) {
      els.words[k].style.width = `${m[k] * s}px`;
      els.words[k].style.height = `${F}px`;
      els.faces[k].style.transformOrigin = `50% ${(m.base * s).toFixed(2)}px`;
    }
    // job line metrics
    const jh = els.jobs[0]?.offsetHeight ?? 0;
    const cap = m.cap * s;
    if (cfg.layout === 'line') {
      this.boxH = cap + (cfg.jobs ? this.jobGap() + jh : 0) + 0.08 * F;
    } else {
      this.boxH = 2 * this.pitch() + cap + (cfg.jobs ? this.jobGap() + jh : 0) + 0.06 * F;
    }
    els.root.style.height = `${this.boxH}px`;
    if (this.companion) {
      const a = this.companion.getBoundingClientRect();
      const b = els.root.getBoundingClientRect();
      this.compOff = { x: a.left - b.left, y: a.top - b.top };
    }
    this.ready = true;
    this.dirty = true;
    this.apply(performance.now());
    this.onFit?.();
    wake();
  }

  cap() {
    return (this.m.cap * this.F) / 100;
  }
  jobGap() {
    return this.cfg.layout === 'line' ? Math.max(18, 0.2 * this.F) : Math.max(10, 0.13 * this.F);
  }
  pitch() {
    const jh = this.cfg.jobs ? (this.els.jobs[0]?.offsetHeight ?? 0) + this.jobGap() : 0;
    return this.cap() + jh + Math.max(14, 0.22 * this.F);
  }
  wordW(k: WordKey) {
    return (this.m[k] * this.F) / 100;
  }
  /** SIDE's width gain at the wide strike, px */
  sideGain() {
    return ((this.m.sideWide - this.m.side) * this.F) / 100;
  }

  // ---------- state helpers ----------
  private track(h: Handle) {
    this.handles.push(h);
    if (this.handles.length > 64) this.handles.splice(0, this.handles.length - 64);
    return h;
  }
  cancelAll() {
    this.handles.forEach((h) => h.cancel());
    this.handles = [];
  }
  touch() {
    this.dirty = true;
    wake();
  }
  /** apply the current state now, without waiting for the next frame (no one-frame flash on setup) */
  flush() {
    this.dirty = false;
    this.apply(performance.now());
  }

  setInk(k: WordKey, ink: Ink) {
    this.ink[k] = ink;
    this.touch();
  }
  inkTo(k: WordKey, to: Ink, dur: number, delay = 0, ease: Ease = easeInOutCubic) {
    let from: Ink | null = null;
    return this.track(
      tween(
        dur,
        (v) => {
          if (!from) from = this.ink[k];
          this.ink[k] = mixInk(from, to, v);
          this.touch();
        },
        { delay, ease },
      ),
    );
  }

  /** A struck beat on one word. amp scales the strike; timings in ms. */
  strike(k: WordKey, opts: { amp?: number; a?: number; h?: number; r?: number; scale?: number; activate?: boolean } = {}) {
    const e: Env = { t0: performance.now(), a: opts.a ?? 90, h: opts.h ?? 50, r: opts.r ?? 520, amp: opts.amp ?? 1 };
    if (k === 'up') this.strikeAmp.up = opts.scale ?? 0.16;
    this.env[k].push(e);
    if (opts.activate !== false) this.activate(KEYS.indexOf(k));
    this.touch();
  }
  activate(i: number) {
    this.active = i;
    this.job.forEach((j, n) => (j.thT = n === i ? 1 : 0));
    this.touch();
  }

  /** job line n rises in (y 10 -> 0) and its underline draws */
  jobIn(n: number, delay = 0) {
    const j = this.job[n];
    j.op = 0;
    j.y = 10;
    j.ul = 0;
    this.track(
      tween(
        360,
        (v) => {
          j.op = v;
          j.y = 10 * (1 - v);
          this.touch();
        },
        { delay, ease: easeOutQuint },
      ),
    );
    this.track(
      tween(
        300,
        (v) => {
          j.ul = v;
          this.touch();
        },
        { delay: delay + 60, ease: easeOutCubic },
      ),
    );
  }

  /** hyphen block n falls from fromY (px above its slot) and lands */
  dropHyphen(n: 0 | 1, fromY: number, onLand: () => void) {
    this.hyVis[n] = 1;
    this.hyDy[n] = -fromY;
    this.touch();
    this.track(
      tween(
        260,
        (v) => {
          this.hyDy[n] = -fromY * (1 - v);
          this.touch();
        },
        {
          ease: (t) => t * t * t * 0.85 + t * 0.15, // easeInCubic with a little initial velocity
          done: () => {
            this.hyDy[n] = 0;
            this.hySq[n] = 0.86;
            this.track(
              tween(
                110,
                (v) => {
                  this.hySq[n] = lerp(0.86, 1, v);
                  this.touch();
                },
                { ease: easeOutCubic },
              ),
            );
            onLand();
          },
        },
      ),
    );
  }

  /** fade job line n's ink (its text and underline) to `to` */
  jobInkTo(n: number, to: number, dur: number) {
    let from = -1;
    return this.track(
      tween(
        dur,
        (v) => {
          if (from < 0) from = this.jobInk[n];
          this.jobInk[n] = lerp(from, to, v);
          this.touch();
        },
        { ease: easeOutCubic },
      ),
    );
  }

  /** fade all job lines together (collapse / recovery) */
  jobsOpTo(to: number, dur: number) {
    let from = -1;
    return this.track(
      tween(
        dur,
        (v) => {
          if (from < 0) from = this.jobsOp;
          this.jobsOp = lerp(from, to, v);
          this.touch();
        },
        { ease: easeOutCubic },
      ),
    );
  }

  hyVisTo(n: 0 | 1, to: number, dur: number, ease: Ease, delay = 0) {
    let from = -1;
    return this.track(
      tween(
        dur,
        (v) => {
          if (from < 0) from = this.hyVis[n];
          this.hyVis[n] = lerp(from, to, v);
          this.touch();
        },
        { delay, ease },
      ),
    );
  }

  /** instant states */
  setTrap(lean = 2.5) {
    this.o1.set(0);
    this.o2.set(0);
    this.lean.set(lean);
    this.hyVis = [0, 0];
    this.ink = { up: INK.down, side: INK.down, down: INK.down };
    this.touch();
  }
  setLevel() {
    this.o1.set(1);
    this.o2.set(1);
    this.lean.set(0);
    this.hyVis = [1, 1];
    this.hyDy = [0, 0];
    this.hySq = [1, 1];
    this.hyW[0].set(HY_W);
    this.hyW[1].set(HY_W);
    this.master = { op: 1, sc: 1 };
    this.ink = { up: INK.up, side: INK.side, down: INK.down };
    this.job.forEach((j) => {
      j.op = 1;
      j.y = 0;
      j.ul = 1;
    });
    this.jobInk = [1, 1, 1];
    this.touch();
  }
  setCollapsed(lean = 3) {
    this.o1.set(0);
    this.o2.set(0);
    this.lean.set(lean);
    this.hyVis = [0, 0];
    this.ink = { up: INK.down, side: INK.down, down: INK.down };
    this.touch();
  }
  hideJobs() {
    this.job.forEach((j) => {
      j.op = 0;
      j.ul = 0;
    });
    this.touch();
  }

  // ---------- per frame ----------
  private frame(now: number, dt: number): boolean {
    if (!this.ready) return false;
    let moving = false;
    for (const s of [this.o1, this.o2, this.lean, this.hyW[0], this.hyW[1]]) if (s.step(dt)) moving = true;
    for (const k of KEYS) if (this.env[k].length) moving = true;
    for (const j of this.job) {
      const tgt = j.thT;
      if (Math.abs(j.th - tgt) > 0.002) {
        j.th += (tgt - j.th) * Math.min(1, dt / 90);
        moving = true;
      } else j.th = tgt;
    }
    if (moving) this.dirty = true;
    if (this.dirty) {
      this.apply(now);
      this.dirty = false;
    }
    return moving;
  }

  private envSum(k: WordKey, now: number) {
    const list = this.env[k];
    let v = 0;
    let amp = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      const x = envValue(e, now);
      if (x < 0) {
        list.splice(i, 1);
        continue;
      }
      if (x * e.amp > v * amp || amp === 0) {
        v = x;
        amp = e.amp;
      }
    }
    return v * amp;
  }

  private apply(now: number) {
    if (!this.ready) return;
    const { els, F, cfg } = this;
    const cap = this.cap();
    const s = F / 100;
    const wU = this.m.up * s, wS = this.m.side * s, wD = this.m.down * s;
    const W = this.boxW;
    const R = cfg.restWdth;

    // beats
    const eU = this.envSum('up', now);
    const eS = this.envSum('side', now);
    const eD = this.envSum('down', now);
    const sideDelta = (this.m.sideWide - this.m.side) * s * Math.min(eS, 1.2);
    const push = sideDelta / 2;

    const pos: Record<WordKey, { x: number; y: number }> = { up: { x: 0, y: 0 }, side: { x: 0, y: 0 }, down: { x: 0, y: 0 } };
    const hyPos = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    const hyWpx = [this.hyW[0].value * F, this.hyW[1].value * F];
    const hyH = HY_H * F;
    const o1 = this.o1.value, o2 = this.o2.value;
    let originX = 0, originY = cap, scale = 1;
    const scaleOrigin = { x: W / 2, y: 0 };

    if (cfg.layout === 'line') {
      const g1 = GAP_OPEN * o1 * F;
      const g2 = (WORD_SPACE + (GAP_OPEN - WORD_SPACE) * o2) * F;
      const total = wU + wS + wD + g1 + g2;
      const x0 = (W - total) / 2;
      pos.up.x = x0 - push;
      pos.side.x = x0 + wU + g1;
      pos.down.x = pos.side.x + wS + g2 + push;
      // the box stays centred in its gap; the face scales about its own centre (one compensation, not two)
      hyPos[0].x = x0 + wU + g1 / 2 - (HY_W * F) / 2 - push;
      hyPos[1].x = pos.side.x + wS + g2 / 2 - (HY_W * F) / 2 + push;
      hyPos[0].y = hyPos[1].y = cap / 2 - hyH / 2;
      originX = x0;
      originY = cap;
    } else {
      const P = this.pitch();
      const hg = STACK_HY_GAP * F;
      // level rows: each word centred on the axis, its hyphen hanging outside it (like real hyphenation)
      const L = { up: (W - wU) / 2, side: (W - wS) / 2, down: (W - wD) / 2 };
      // trap rows: UPSIDE / DOWN
      const tw = wU + wS;
      const T = { up: (W - tw) / 2, side: (W - tw) / 2 + wU, down: (W - wD) / 2 };
      pos.up.x = lerp(T.up, L.up, o1);
      pos.side.x = lerp(T.side, L.side, o1);
      pos.down.x = lerp(T.down, L.down, o1);
      const yOff = cfg.centerTrap ? (1 - Math.min(1, Math.max(0, o1))) * P * 0.5 : 0;
      pos.up.y = yOff;
      pos.side.y = lerp(0, P, o1) + yOff;
      pos.down.y = lerp(P, 2 * P, o1) + yOff;
      // the face's left edge stays at word + gap while the block shrinks (it scales about its centre)
      hyPos[0].x = pos.up.x + wU + hg - (HY_W * F - hyWpx[0]) / 2;
      hyPos[0].y = pos.up.y + cap / 2 - hyH / 2;
      hyPos[1].x = pos.side.x + wS + hg - (HY_W * F - hyWpx[1]) / 2 + push;
      hyPos[1].y = pos.side.y + cap / 2 - hyH / 2;
      const maxW = cfg.maxWidth();
      const st = Math.min(1, (maxW * 0.97) / tw);
      scale = lerp(st, 1, Math.min(1, Math.max(0, o1)));
      // lean about the left-bottom of the (scaled) slab
      originX = W / 2 + (Math.min(pos.up.x, pos.down.x) - W / 2) * scale;
      originY = (pos.down.y + cap) * scale;
    }

    // word transforms: box top so that cap top sits at y (line-height 1 box)
    const lift = (this.m.base - this.m.cap) * s; // space above caps inside the 1em box
    for (const k of KEYS) {
      const p = pos[k];
      els.words[k].style.transform = `translate3d(${p.x.toFixed(2)}px, ${(p.y - lift).toFixed(2)}px, 0)`;
      const face = els.faces[k];
      const ink = this.ink[k];
      face.style.color = css(ink.face);
      face.style.setProperty('--edge', css(ink.edge));
      let wdth = R, ls = 0, sy = 1, ty = 0;
      if (k === 'up') sy = 1 + this.strikeAmp.up * eU;
      if (k === 'side') {
        wdth = R + (125 - R) * Math.min(eS, 1.2);
        ls = 0.015 * eS;
      }
      if (k === 'down') {
        wdth = R - (R - 90) * eD;
        sy = 1 - 0.06 * eD;
        ty = 0.06 * eD;
      }
      face.style.fontVariationSettings = `"wdth" ${wdth.toFixed(2)}`;
      face.style.letterSpacing = ls ? `${ls.toFixed(4)}em` : '';
      face.style.transform = sy !== 1 || ty ? `translateY(${ty.toFixed(4)}em) scaleY(${sy.toFixed(4)})` : '';
    }
    for (const n of [0, 1] as const) {
      const vis = this.hyVis[n];
      // a shrinking hyphen keeps its proportions and fades: it reads as a block going away, never as a tick
      const f = Math.max(0, Math.min(1, hyWpx[n] / (HY_W * F)));
      const hf = 0.4 + 0.6 * f;
      const sx = f * Math.max(0, vis);
      const sy = this.hySq[n] * Math.max(0.0001, Math.min(1, vis * 1.5)) * hf;
      const rise = ((1 - hf) * hyH) / 2; // the face scales from its foot: keep it centred on the cap height
      els.hy[n].style.transform = `translate3d(${hyPos[n].x.toFixed(2)}px, ${(hyPos[n].y + this.hyDy[n]).toFixed(2)}px, 0)`;
      els.hy[n].style.opacity = vis > 0.01 ? '1' : '0';
      els.hyFace[n].style.transform = `${rise > 0.01 ? `translateY(${(-rise).toFixed(2)}px) ` : ''}scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      els.hyFace[n].style.opacity = f < 0.999 ? (0.35 + 0.65 * Math.min(1, Math.max(0, (f - 0.15) / 0.6))).toFixed(3) : '';
    }
    // the ink layer: lean + (stack) trap scale + master fade
    const lean = this.lean.value;
    const sc = scale * this.master.sc;
    const so = scaleOrigin;
    els.ink.style.transformOrigin = '0 0';
    els.ink.style.transform =
      `translate(${originX.toFixed(1)}px, ${originY.toFixed(1)}px) rotate(${lean.toFixed(3)}deg) translate(${(-originX).toFixed(1)}px, ${(-originY).toFixed(1)}px) ` +
      `translate(${so.x.toFixed(1)}px, ${so.y.toFixed(1)}px) scale(${sc.toFixed(4)}) translate(${(-so.x).toFixed(1)}px, ${(-so.y).toFixed(1)}px)`;
    els.ink.style.opacity = String(this.master.op);
    const comp = this.companion;
    if (comp) {
      comp.style.transformOrigin = `${(originX - this.compOff.x).toFixed(1)}px ${(originY - this.compOff.y).toFixed(1)}px`;
      comp.style.rotate = Math.abs(lean) > 0.001 ? `${lean.toFixed(3)}deg` : '';
    }

    // job lines
    if (cfg.jobs) {
      const jg = this.jobGap();
      const jobX =
        cfg.layout === 'line'
          ? [pos.up.x + push + wU / 2, (W - (wU + wS + wD + 2 * GAP_OPEN * F)) / 2 + wU + GAP_OPEN * F + wS / 2, W / 2]
          : [W / 2, W / 2, W / 2];
      if (cfg.layout === 'line') {
        // job lines sit under the LEVEL positions (they appear only once the line is level)
        const x0 = (W - (wU + wS + wD + 2 * GAP_OPEN * F)) / 2;
        jobX[0] = x0 + wU / 2;
        jobX[1] = x0 + wU + GAP_OPEN * F + wS / 2;
        jobX[2] = x0 + wU + wS + 2 * GAP_OPEN * F + wD / 2;
      }
      const P = cfg.layout === 'stack' ? this.pitch() : 0;
      this.job.forEach((j, n) => {
        const el = els.jobs[n];
        if (!el) return;
        const y = (cfg.layout === 'line' ? cap + jg : n * P + cap + jg) + j.y;
        el.style.transform = `translate3d(${jobX[n].toFixed(2)}px, ${y.toFixed(2)}px, 0) translateX(-50%)`;
        el.style.opacity = String(j.op * this.jobsOp * this.jobInk[n]);
        const ul = els.uls[n];
        if (ul) {
          const th = lerp(cfg.ulRest, cfg.ulActive, j.th) / cfg.ulRest;
          ul.style.transform = `scale(${j.ul.toFixed(4)}, ${th.toFixed(4)})`;
        }
      });
    }
  }
}
