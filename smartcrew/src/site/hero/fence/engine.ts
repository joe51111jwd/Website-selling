// The hero's engine ("Fence the Words", HERO_SPEC): measure the set type, build the ground and the
// fence, take over the intro's last frame, play the first seconds.
//
// React renders the copy and empty layers (../Hero.tsx). Once the fonts are in, this measures the
// real glyph boxes, fits the headline to the screen, opens the leading round the fenced line so
// the fence keeps clear of its neighbours, stakes the geofence round the angle's phrase and lays
// out the crew, the tag and the button's own fence. Layout writes every element's REST state as
// inline style (so a resize, reduced motion or the end of the timeline all show the same frame);
// the timeline then plays WAAPI animations over it (fill: both), dropped once everything has
// landed. PHONE MODE: transform and opacity only, timers instead of rAF (zero rAF after the
// hand-off), no per-frame JS. Desktop adds three short rAF pieces only: the fence's stakes
// springing onto the words (≤ 1.25 s), the ground drifting with the cursor (only while it moves)
// and a dragged stake springing back.

import { HERO_JOBS } from "../../../content/copy";
import { getIntroPhase } from "../../intro/intro";
import { onHeroHandoff, onSkipHandoff, type Frozen, type HandoffReq } from "./handoff";
import { contoursSliced, type Rect, type TopoInput } from "./topo";
import { SPRING, Walk, bbox, centroid, hexFence, inside, polyPath, polyPoints, springFrames, walkEaseInv, walkFrames, type Box, type Pt } from "./geom";

const NS = "http://www.w3.org/2000/svg";
const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)";
const EPOP = "cubic-bezier(0.34, 1.5, 0.64, 1)";
/** the dawn: it starts large and accelerates out (HERO_SPEC §5A) */
const EDAWN = "cubic-bezier(0.5, 0, 0.75, 0)";

export type FenceMode = "intro" | "plain" | "reduced";
export type FenceOpts = { phone: boolean; mode: FenceMode; debug: boolean };

/** Headline leading (× font size). */
const LH = 0.98;
/** The tag's height and row height (desktop), the chip's row height. */
const TAG_H = 62;
const TAG_ROW = 46;
const CHIP_ROW = 28;
/** Stake dot radius (orange part): the leading rule keeps the dots clear of the next line too. */
const STAKE_R = 3;

type Geom = { clear: [number, number]; point: number; inset: number; jitter: number; gap: number; side: number };
/** desktop: the fenced line keeps room each side for the point, a marker and a clock-in time */
const DESK: Geom = { clear: [16, 12], point: 46, inset: 9, jitter: 1, gap: 10, side: 16 + 46 + 12 + 36 + 8 };
const PHONE: Geom = { clear: [12, 8], point: 40, inset: 6, jitter: 0.5, gap: 8, side: 12 + 40 + 4 };

// ── a tiny timeline: WAAPI animations, a few desktop rAF functions and timers on one clock ──

type Fn = { at: number; dur: number; f: (p: number) => void };
type Cb = { at: number; f: () => void; done: boolean };

class Timeline {
  anims: Animation[] = [];
  private fns: Fn[] = [];
  private cbs: Cb[] = [];
  private timers: number[] = [];
  private raf = 0;
  private vBase = 0;
  private tBase = 0;
  private rate = 1;
  private stopped = false;
  private playing = false;

  add(el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, easing = EO, fill: FillMode = "both") {
    if (!el) return null;
    const a = el.animate(kf, { delay: at, duration: Math.max(1, dur), easing, fill });
    if (this.playing && this.rate !== 1) a.updatePlaybackRate(this.rate);
    this.anims.push(a);
    return a;
  }
  /** a per-frame function (desktop only): f(p) for p 0..1 over [at, at + dur] */
  fn(at: number, dur: number, f: (p: number) => void) {
    this.fns.push({ at, dur, f });
  }
  /** a one-off at `at` ms (a timer, never a frame loop) */
  at(at: number, f: () => void) {
    this.cbs.push({ at, f, done: false });
  }
  private v() {
    return this.vBase + (performance.now() - this.tBase) * this.rate;
  }
  private schedule() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    const v = this.v();
    for (const cb of this.cbs) {
      if (cb.done) continue;
      this.timers.push(
        window.setTimeout(
          () => {
            if (this.stopped || cb.done) return;
            cb.done = true;
            cb.f();
          },
          Math.max(0, (cb.at - v) / this.rate),
        ),
      );
    }
  }
  private loop = () => {
    this.raf = 0;
    if (this.stopped) return;
    const v = this.v();
    let busy = false;
    for (const fn of this.fns) {
      if (v >= fn.at && v <= fn.at + fn.dur + 60) fn.f(Math.min(1, (v - fn.at) / fn.dur));
      if (v < fn.at + fn.dur + 60) busy = true;
    }
    if (busy) this.raf = requestAnimationFrame(this.loop);
  };
  play() {
    this.playing = true;
    this.tBase = performance.now();
    this.vBase = 0;
    // the functions' first frame now (the stakes where the intro left them)
    for (const fn of this.fns) fn.f(0);
    this.schedule();
    if (this.fns.length) this.raf = requestAnimationFrame(this.loop);
  }
  /** speed the rest up (a skip during the move) */
  speed(k: number) {
    if (!this.playing || this.stopped) return;
    this.vBase = this.v();
    this.tBase = performance.now();
    this.rate = k;
    this.anims.forEach((a) => a.updatePlaybackRate(k));
    this.schedule();
  }
  /** render the frame at `ms` (debug captures): animations paused there, functions and timers up to it */
  seek(ms: number) {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.timers.forEach((t) => clearTimeout(t));
    for (const a of this.anims) {
      a.pause();
      a.currentTime = ms;
    }
    for (const fn of this.fns) fn.f(Math.max(0, Math.min(1, (ms - fn.at) / fn.dur)));
    for (const cb of [...this.cbs].sort((a, b) => a.at - b.at)) {
      if (!cb.done && cb.at <= ms) {
        cb.done = true;
        cb.f();
      }
    }
  }
  /** run everything that is still to come, at once (a resize mid-move) */
  flush() {
    for (const cb of [...this.cbs].sort((a, b) => a.at - b.at)) {
      if (!cb.done) {
        cb.done = true;
        cb.f();
      }
    }
    for (const fn of this.fns) fn.f(1);
  }
  cancel() {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }
  /** the time the last animation ends (ms) */
  end() {
    let last = 0;
    for (const a of this.anims) last = Math.max(last, Number(a.effect?.getComputedTiming().endTime ?? 0));
    for (const cb of this.cbs) last = Math.max(last, cb.at);
    for (const fn of this.fns) last = Math.max(last, fn.at + fn.dur);
    return last;
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────

const px = (n: number) => `${n.toFixed(1)}px`;
const tr = (x: number, y: number) => `translate(${px(x)}, ${px(y)})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const op = (a: number, b: number): Keyframe[] => [{ opacity: a }, { opacity: b }];

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}

function div(cls: string, parent?: Element) {
  const d = document.createElement("div");
  d.className = cls;
  parent?.appendChild(d);
  return d;
}

const DISPLAY = '"SmartCrew Display"';
const TEXT = '"SmartCrew Text"';

/**
 * The fence is measured from real glyph boxes, so measuring must never happen on a fallback face:
 * wait for the display and text faces (preloaded in index.html), at most `ms`. Resolves true if
 * they arrived, false if the race timed out (the engine then re-places once they do).
 */
function fontsReady(ms: number): Promise<boolean> {
  const f = document.fonts;
  if (!f) return Promise.resolve(true);
  const loads = Promise.all([f.load(`700 96px ${DISPLAY}`, "See what every job"), f.load(`400 16px ${TEXT}`, "GPS fills"), f.load(`600 16px ${TEXT}`, "GPS fills")])
    .then(() => f.ready)
    .then(() => true);
  return Promise.race([loads, new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);
}

const fontsIn = () => !document.fonts || (document.fonts.check(`700 96px ${DISPLAY}`, "See what") && document.fonts.check(`400 16px ${TEXT}`, "GPS"));

let uid = 0;
/** The intro plays once per page view: a remount (crossing 760 px, StrictMode) never replays it. */
let introUsed = false;

// ── the engine ──────────────────────────────────────────────────────────────────────────

export function mountFence(root: HTMLElement, o: FenceOpts): () => void {
  const id = `hf-${++uid}`;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T | null;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll(s)] as T[];
  const phone = o.phone;
  const P = phone ? PHONE : DESK;
  const reduced = o.mode === "reduced";
  const crew = HERO_JOBS.crew.filter((c) => !phone || c.id !== "jl");
  const tagRows = HERO_JOBS.rows.length + 1; // the strip parks back on the first row
  let alive = true;
  let tl = new Timeline();
  let G: Geo | null = null;
  const offs: (() => void)[] = [];
  let tagIdx = tagRows - 1;
  let chipIdx = tagRows - 1;
  let rolling = true;
  let busy = false; // a choreography is running
  let endMove: (() => void) | null = null; // finishes a running hand-off at once
  const ctx = document.createElement("canvas").getContext("2d")!;
  const ink = (s: string, fs: number) => {
    ctx.font = `700 ${fs}px ${DISPLAY}, sans-serif`;
    const m = ctx.measureText(s);
    return { asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
  };

  type Geo = NonNullable<ReturnType<typeof layout>>;

  /** fit + layout; a laptop too narrow for the tag swaps in the chip under the headline and fits again */
  function place(): Geo {
    root.classList.remove("no-tag");
    fit();
    const g = layout();
    if (g) return g;
    fit();
    return layout()!;
  }

  // ── 1 · fit the headline to the screen ──

  /** The fenced line's extra leading, so the fence (and its stakes) keep `gap` px off the lines either side. */
  function leading(fs: number) {
    const lines = qa(".hf-line-in");
    const fi = lines.findIndex((l) => l.querySelector(".hf-fenced"));
    if (fi < 0) return { mt: 0, mb: 0 };
    const lh = LH * fs;
    const f = ink(q(".hf-fenced")!.textContent || "", fs);
    const reach = P.clear[1] + 1.5 * P.jitter + STAKE_R;
    const prev = fi > 0 ? ink(lines[fi - 1].textContent || "", fs) : null;
    const next = fi < lines.length - 1 ? ink(lines[fi + 1].textContent || "", fs) : null;
    return {
      mt: prev ? Math.max(0, f.asc + reach + P.gap + Math.max(0, prev.desc) - lh) : 0,
      mb: next ? Math.max(0, Math.max(0, f.desc) + reach + P.gap + next.asc - lh) : 0,
    };
  }

  function setFs(fs: number) {
    const l = leading(fs);
    root.style.setProperty("--fs", `${fs.toFixed(2)}px`);
    root.style.setProperty("--fl-mt", `${l.mt.toFixed(1)}px`);
    root.style.setProperty("--fl-mb", `${l.mb.toFixed(1)}px`);
  }

  /** The block's limits: desktop, from the top band to the logos row; phone, the button's bottom. */
  function overflow() {
    const R = root.getBoundingClientRect();
    if (phone) {
      const vis = Math.min(window.innerHeight, 900);
      const limit = Math.min(500, vis - 150);
      return q(".hf-cta-wrap")!.getBoundingClientRect().bottom - R.top - limit;
    }
    return 70 + q(".hf-copy")!.offsetHeight - copyLimit(R);
  }

  /** Desktop: the copy block ends this far above the logos row. */
  function copyLimit(R: DOMRect) {
    return q(".hf-logos")!.getBoundingClientRect().top - R.top - 16;
  }

  function fit() {
    const h1 = q(".hf-h1")!;
    for (const p of ["--fs", "--fl-mt", "--fl-mb", "--copy-top"]) root.style.removeProperty(p);
    const cur = parseFloat(getComputedStyle(h1).fontSize);
    const lines = qa(".hf-line-in");
    const W = root.clientWidth;
    const g = phone ? 16 : clamp(W * 0.04, 20, 64);
    const avail = W - 2 * g;
    let fsW = Infinity;
    for (const ln of lines) {
      const w = ln.offsetWidth || 1;
      const extra = ln.querySelector(".hf-fenced") ? 2 * P.side : 0;
      fsW = Math.min(fsW, ((avail - extra) * cur) / w);
    }
    const min = phone ? 30 : 44;
    const max = phone ? 54 : 124;
    let fs = clamp(fsW, min, max);
    for (let i = 0; i < 4; i++) {
      setFs(fs);
      const over = overflow();
      if (over <= 0.5) break;
      const hh = h1.offsetHeight || 1;
      fs = clamp(fs * (1 - over / hh) - 0.25, min, max);
      if (fs === min) {
        setFs(fs);
        break;
      }
    }
    if (!phone) {
      const space = copyLimit(root.getBoundingClientRect()) - 70 - q(".hf-copy")!.offsetHeight;
      root.style.setProperty("--copy-top", `${(70 + Math.max(0, space * 0.42)).toFixed(1)}px`);
    }
  }

  // ── 2 · measure and build ──
  function layout() {
    const R = root.getBoundingClientRect();
    const W = root.clientWidth;
    const H = root.clientHeight;
    const rel = (r: DOMRect) => ({ x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });
    const vis = phone ? Math.min(window.innerHeight, H) : H;
    const h1 = q(".hf-h1")!;
    const fs = parseFloat(getComputedStyle(h1).fontSize);

    const lineBoxes: Rect[] = [];
    let fenceLine = -1;
    let wordBox: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const lineInfo: { x0: number; x1: number; top: number; bot: number; base: number }[] = [];
    qa(".hf-line-in").forEach((ln, i) => {
      const r = rel(ln.getBoundingClientRect());
      const base = rel(ln.querySelector(".hf-base")!.getBoundingClientRect()).y;
      const m = ink(ln.textContent || "", fs);
      const top = base - m.asc;
      const bot = base + m.desc;
      lineInfo.push({ x0: r.x, x1: r.x + r.w, top, bot, base });
      lineBoxes.push({ x: r.x - 6, y: top - 4, w: r.w + 12, h: bot - top + 8, r: 12 });
      const fz = ln.querySelector(".hf-fenced");
      if (fz) {
        fenceLine = i;
        const fr = rel(fz.getBoundingClientRect());
        const fm = ink(fz.textContent || "", fs);
        wordBox = { x0: fr.x + 1, x1: fr.x + fr.w - 1, y0: base - fm.asc, y1: base + fm.desc };
      }
    });
    const fencedEl = q(".hf-fenced")!;
    const wr = rel(fencedEl.getBoundingClientRect());
    const words = { x: wr.x, y: wr.y, w: wr.w, h: wr.h };

    // the fence round the words
    const fence = hexFence(wordBox, { clear: P.clear, point: P.point, inset: P.inset, jitter: P.jitter });
    const yc = (wordBox.y0 + wordBox.y1) / 2;
    const cl = wordBox.x0 - P.clear[0];
    const cr = wordBox.x1 + P.clear[0];
    const wordC: Pt = [(wordBox.x0 + wordBox.x1) / 2, yc];

    // the crew: parked inside the fence's points (MB on the right: he crossed in the intro)
    const T: Record<string, Pt> = phone ? { mb: [cr + 12, yc], er: [cl - 12, yc], jl: [cl - 12, yc] } : { mb: [cr + 7, yc], er: [cl - 4, yc - 14], jl: [cl - 4, yc + 15] };
    // they walk in from the left edge, along the band of the fenced line (clear of the other lines)
    const walks: Record<string, Walk> = phone
      ? { er: new Walk([[[-30, yc + 22], [6, yc + 18], [T.er[0] - 26, T.er[1] + 6], T.er]]) }
      : {
          er: new Walk([[[-40, yc - 84], [W * 0.14, yc - 92], [T.er[0] - 210, T.er[1] - 4], T.er]]),
          jl: new Walk([[[-40, yc + 60], [W * 0.13, yc + 70], [T.jl[0] - 220, T.jl[1] + 8], T.jl]]),
        };

    // the button's own fence (the button's box before any lift)
    const ctaEl = q(".hf-cta-wrap .cta")!;
    const cb = rel(ctaEl.getBoundingClientRect());
    const ctaBox: Box = { x0: cb.x, y0: cb.y, x1: cb.x + cb.w, y1: cb.y + cb.h };
    const ring = hexFence(ctaBox, { clear: phone ? [5, 7] : [9, 9], point: phone ? 8 : 24, inset: phone ? 6 : 10, jitter: 0.4 });
    const ringC: Pt = [(ctaBox.x0 + ctaBox.x1) / 2, (ctaBox.y0 + ctaBox.y1) / 2];

    // ── the SVG layers ──
    const sizeLayer = (el: HTMLElement | null) => {
      if (!el) return null;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      el.textContent = "";
      return svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, el);
    };

    const fenceSvg = sizeLayer(q(".hf-fence"))!;
    const defs = svgEl("defs", {}, fenceSvg);
    const mask = svgEl("mask", { id: `${id}-fm`, maskUnits: "userSpaceOnUse", x: -60, y: -60, width: W + 120, height: H + 120 }, defs);
    const maskPath = svgEl("path", { d: polyPath(fence), fill: "none", stroke: "#fff", "stroke-width": 16, pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 0, "stroke-linejoin": "round" }, mask);
    const fill = svgEl("polygon", { class: "hf-fence-fill", points: polyPoints(fence) }, fenceSvg);
    const line = svgEl("polygon", { class: "hf-fence-line", points: polyPoints(fence) }, fenceSvg);
    // survey stakes: a solid orange dot with a ground-coloured halo (not design-tool handles)
    const stakes = fence.map(([x, y], i) => {
      const g = svgEl("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, fenceSvg);
      const dot = svgEl("circle", { class: "hf-stake", r: STAKE_R }, g);
      if (!phone) svgEl("circle", { class: "hf-stake-hit", r: 12, "data-v": i, "data-cursor": "drag", "data-cursor-label": "Drag" }, g);
      return { g, dot };
    });

    const pulseSvg = sizeLayer(q(".hf-pulse"))!;
    const pulse = svgEl("polygon", { class: "hf-pulse-line", points: polyPoints(fence) }, pulseSvg);

    const ringSvg = sizeLayer(q(".hf-ring"))!;
    const rdefs = svgEl("defs", {}, ringSvg);
    const rmask = svgEl("mask", { id: `${id}-rm`, maskUnits: "userSpaceOnUse", x: -60, y: -60, width: W + 120, height: H + 120 }, rdefs);
    const ringMaskPath = svgEl("path", { d: polyPath([...ring.slice(2), ...ring.slice(0, 2)]), fill: "none", stroke: "#fff", "stroke-width": 12, pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 0 }, rmask);
    const ringLine = svgEl("polygon", { class: "hf-ring-line", points: polyPoints(ring) }, ringSvg);
    svgEl("polygon", { class: "hf-ring-solid", points: polyPoints(ring) }, sizeLayer(q(".hf-ring-s"))!);
    svgEl("polygon", { class: "hf-ring-solid", points: polyPoints(ring) }, sizeLayer(q(".hf-ring-p"))!);
    for (const el of qa(".hf-ring, .hf-ring-s, .hf-ring-p")) el.style.transformOrigin = `${ringC[0].toFixed(1)}px ${ringC[1].toFixed(1)}px`;
    q(".hf-fence")!.style.transformOrigin = `${wordC[0].toFixed(1)}px ${wordC[1].toFixed(1)}px`;

    // ── desktop: the clock-in times, the tag and its tape ──
    const stampPos: Record<string, Pt> = {};
    let tag: { x: number; y: number; w: number; h: number } | null = null;
    if (!phone) {
      for (const c of crew) {
        const s = q(`.hf-stamp[data-id="${c.id}"]`)!;
        const w = s.offsetWidth;
        const left = c.id !== "mb";
        stampPos[c.id] = [left ? fence[0][0] - 12 - w : fence[3][0] + 12, T[c.id][1] - 7.5];
      }
      // the tag: in the right margin, beside the line above the fence, tied to the top-right stake
      const tg = q(".hf-tag")!;
      let fw = 0;
      qa(".hf-tag-row").forEach((r) => {
        for (const c of [...r.children] as HTMLElement[]) fw = Math.max(fw, c.scrollWidth);
      });
      fw = clamp(fw + 30 + 16, 176, 280);
      root.style.setProperty("--tag-w", `${fw}px`);
      const above = lineInfo[fenceLine - 1] ?? lineInfo[fenceLine];
      const fx0 = Math.max(fence[3][0] + 36, (fenceLine > 0 ? above.x1 : 0) + 52);
      const fy0 = (fenceLine > 0 ? (above.top + above.bot) / 2 : fence[2][1] - 60) - TAG_H / 2;
      const note = q(".hf-tag-note")!;
      const noteW = note.scrollWidth;
      const fits = fx0 + Math.max(fw, noteW + 16) <= W - 14 && fy0 > 66;
      // no room for the tag in the margin: the job chip goes under the headline instead (fit again)
      if (!fits && !root.classList.contains("no-tag")) {
        root.classList.add("no-tag");
        return null;
      }
      const shown = fits && !root.classList.contains("no-tag");
      tag = shown ? { x: fx0, y: fy0, w: fw, h: TAG_H } : null;
      tg.style.display = shown ? "" : "none";
      note.style.display = shown ? "" : "none";
      const bg = q<SVGSVGElement>(".hf-tag-bg")!;
      bg.setAttribute("viewBox", `0 0 ${fw} ${TAG_H}`);
      bg.setAttribute("width", String(fw));
      bg.setAttribute("height", String(TAG_H));
      // a chamfered hang tag with an eyelet
      bg.innerHTML = `<path d="M18 .5H${fw - 10.5}a10 10 0 0 1 10 10v41a10 10 0 0 1-10 10H18L.5 44V18Z"/><circle cx="13" cy="31" r="3.6"/>`;
      const tapeSvg = sizeLayer(q(".hf-tape"))!;
      if (tag) {
        const a = fence[2];
        const b: Pt = [fx0 + 13, fy0 + 31];
        const mx = (a[0] + b[0]) / 2;
        const my = Math.max(a[1], b[1]) + 10;
        svgEl("path", { class: "hf-tape-line", d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}` }, tapeSvg);
        svgEl("circle", { class: "hf-tape-knot", cx: b[0].toFixed(1), cy: b[1].toFixed(1), r: 2.2 }, tapeSvg);
      }
    }
    const chipEl = q(".hf-chip");
    const chipShown = phone || root.classList.contains("no-tag");
    const chip = chipShown && chipEl ? rel(chipEl.getBoundingClientRect()) : null;

    // ── the ground: the copy is the landform (nothing in the copy is ever crossed by a contour) ──
    const textRects = (el: Element | null, pad: number): Rect[] => {
      if (!el) return [];
      const rg = document.createRange();
      rg.selectNodeContents(el);
      return [...rg.getClientRects()].map((r) => {
        const b = rel(r);
        return { x: b.x - pad, y: b.y - pad / 2, w: b.w + pad * 2, h: b.h + pad, r: 8 };
      });
    };
    const boxOf = (el: Element | null, pad: number, r = 14): Rect[] => {
      if (!el || !(el as HTMLElement).offsetParent) return [];
      const b = rel(el.getBoundingClientRect());
      return [{ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2, r }];
    };
    const rects: Rect[] = [
      ...boxOf(document.querySelector(".site-logo"), 8),
      ...(!phone ? qa(".site-nav a").flatMap((a) => textRects(a, 6)) : []),
      ...textRects(q(".hf-eyebrow"), 8),
      ...lineBoxes,
      ...(chipShown ? boxOf(chipEl, 6) : []),
      ...textRects(q(".hf-sub"), 8),
      ...boxOf(q(".hf-cta-wrap"), 10, 22),
      ...textRects(q(".hf-demo"), 6),
      ...textRects(q(".hf-micro"), 6),
      ...boxOf(q(".hf-logos"), 6),
      ...textRects(q(".hf-cue"), 8),
    ];
    if (tag) rects.push({ x: tag.x - 4, y: tag.y - 4, w: Math.max(tag.w, q(".hf-tag-note")!.scrollWidth + 16) + 8, h: tag.h + 34, r: 14 });
    const topoIn: TopoInput = {
      W,
      H,
      step: phone ? 8 : 8,
      rects,
      polys: [fence, ring],
      blend: phone ? 18 : 30,
      first: phone ? 14 : 18,
      falloff: phone ? 80 : 115,
      amp: phone ? 2.2 : 2.6,
      wobble: 0.24,
      scale: phone ? 210 : 320,
      seed: 11,
      major: 4,
      levels: phone ? 12 : 15,
      tilt: [1.2, -0.8],
      // path budget: ≤ 32 KB desktop, ≤ 14 KB phone
      eps: phone ? 0.8 : 0.7,
    };
    const topoSvg = q<SVGSVGElement>(".hf-ground svg")!;
    topoSvg.setAttribute("width", String(W));
    topoSvg.setAttribute("height", String(H));
    topoSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    return { W, H, vis, fs, fence, wordBox, words, yc, cl, cr, wordC, T, walks, ring, ringC, ctaBox, stampPos, tag, chip, line, fill, stakes, pulse, mask, maskPath, ringLine, rmask, ringMaskPath, topoIn, fenceLine, lineInfo };
  }

  // the contours: built in ≤ 7 ms slices, never a long task
  let topoJob: { cancel: () => void } | null = null;
  const timing: Record<string, number> = {};
  function drawTopo(g: Geo) {
    topoJob?.cancel();
    const t0 = performance.now();
    const job = contoursSliced(g.topoIn);
    topoJob = job;
    job.done.then((t) => {
      if (!alive || topoJob !== job) return;
      const svg = q<SVGSVGElement>(".hf-ground svg")!;
      const late = svg.querySelector(".mi")!.getAttribute("d") === null && root.classList.contains("is-live");
      svg.querySelector(".mi")!.setAttribute("d", t.minor);
      svg.querySelector(".ma")!.setAttribute("d", t.major);
      timing.topo = performance.now() - t0;
      timing.topoBytes = t.minor.length + t.major.length;
      // the lines arrived after the ground faded in: let them come up rather than pop
      if (late && !reduced) svg.animate(op(0, 1), { duration: 600, easing: "ease-out" });
    });
  }

  // ── 3 · the rest state, as inline style ──
  function rest(g: Geo) {
    for (const c of HERO_JOBS.crew) {
      const m = q(`.hf-mk[data-id="${c.id}"]`)!;
      const p = g.T[c.id];
      const show = crew.some((k) => k.id === c.id);
      m.style.display = show ? "" : "none";
      m.style.transform = tr(p[0] - 13, p[1] - 13);
      (m.querySelector(".hf-mk-dot") as HTMLElement).style.opacity = "1";
      m.querySelector(".hf-mk-night")?.remove();
      const s = q(`.hf-stamp[data-id="${c.id}"]`);
      if (s && g.stampPos[c.id]) {
        s.style.transform = tr(g.stampPos[c.id][0], g.stampPos[c.id][1]);
        // only Marcus's 6:42 stays: the anchor for One Day's first moment
        s.style.opacity = c.id === "mb" ? "1" : "0";
      }
    }
    tagIdx = tagRows - 1;
    const tg = q(".hf-tag");
    if (tg && g.tag) {
      tg.style.transform = tr(g.tag.x, g.tag.y);
      q(".hf-tag-strip")!.style.transform = `translateY(${-TAG_ROW * tagIdx}px)`;
      const note = q(".hf-tag-note")!;
      note.style.transform = tr(g.tag.x + 18, g.tag.y + g.tag.h + 8);
      note.style.opacity = "1";
    }
    chipIdx = tagRows - 1;
    const strip = q(".hf-chip-strip");
    if (strip) strip.style.transform = `translateY(${-CHIP_ROW * chipIdx}px)`;
    // at rest the button's fence has let go: one orange fence on screen, round the words
    for (const el of qa(".hf-ring, .hf-ring-s, .hf-ring-p")) el.style.opacity = "";
    g.line.removeAttribute("mask");
    g.ringLine.removeAttribute("mask");
    g.line.style.removeProperty("stroke-dasharray");
    g.line.style.removeProperty("stroke-width");
    g.fill.style.removeProperty("fill-opacity");
    q(".hf-nfence")!.textContent = "";
    root.classList.remove("is-flying");
  }

  // ── 4 · the first seconds ──

  /** A crew member walks in along the fenced line's band and clocks in on the headline. */
  function walkIn(g: Geo, cid: string, at: number, dur: number) {
    const m = q(`.hf-mk[data-id="${cid}"]`)!;
    const w = g.walks[cid];
    tl.add(m, walkFrames(w), at, dur, "linear");
    return at + dur * walkEaseInv(w.entry(g.fence));
  }
  function clockIn(g: Geo, cid: string, tc: number, stamp: boolean) {
    const m = q(`.hf-mk[data-id="${cid}"]`)!;
    tl.add(q(".hf-pulse"), [{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], tc, 620, "ease-out", "none");
    tl.add(m.querySelector(".hf-mk-ring"), [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.18)", offset: 0.3 }, { opacity: 0, transform: "scale(1)" }], tc, 760, "ease-out");
    tl.add(m.querySelector(".hf-mk-dot"), [{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "none" }], tc + 120, 320, EPOP);
    const s = stamp ? q(`.hf-stamp[data-id="${cid}"]`) : null;
    if (s && g.stampPos[cid]) {
      // a crossing time shows for 1.6 s, then lets go (only Marcus's 6:42 stays)
      const [sx, sy] = g.stampPos[cid];
      tl.add(s, [{ opacity: 0, transform: tr(sx + 8, sy) }, { opacity: 1, transform: tr(sx, sy), offset: 0.14 }, { opacity: 1, transform: tr(sx, sy), offset: 0.86 }, { opacity: 0, transform: tr(sx, sy) }], tc + 80, 1860, "ease-out");
    }
  }

  /** The tag (or chip) rolls once through the jobs and parks back on Hwy 9 (one row every 1.1 s, the red one held 1.4 s). */
  function rollOnce(at: number, k = 1) {
    const roll = (el: Element | null, rowH: number) => {
      if (!el) return;
      const kf: Keyframe[] = [{ transform: "translateY(0px)", offset: 0, easing: EIO }];
      let t = 0;
      const marks: [number, number][] = [];
      for (let i = 0; i < tagRows - 1; i++) {
        if (i > 0) t += HERO_JOBS.rows[i]?.tone === "neg" ? 1400 : 1100;
        marks.push([t, i]);
        t += 380;
        marks.push([t, i + 1]);
      }
      for (const [mt, idx] of marks) kf.push({ transform: `translateY(${-rowH * idx}px)`, offset: mt / t, easing: EIO });
      tl.add(el, kf, at, t * k, "linear");
      return t * k;
    };
    const d = roll(q(".hf-tag-strip"), TAG_ROW) ?? 0;
    roll(q(".hf-chip-strip"), CHIP_ROW);
    tl.at(at + d + 40, () => (rolling = false));
  }

  /** The button lands: opacity, and a 14 px rise on a spring with a touch of overshoot. */
  function ctaIn(at: number, k: number) {
    const w = q(".hf-cta-wrap");
    tl.add(w, op(0, 1), at, 260 * k, "linear");
    tl.add(w, springFrames(0.56, (s) => ({ transform: `translateY(${(14 * (1 - s)).toFixed(2)}px)` })), at, 560 * k, "linear");
  }

  /** The button's own fence: draws round it, closes solid, pings once, lets go. */
  function ctaFence(g: Geo, r0: number, k: number) {
    const ring = q(".hf-ring")!;
    const solid = q(".hf-ring-s")!;
    const ping = q(".hf-ring-p")!;
    const closeAt = r0 + 600 * k;
    if (phone) {
      tl.add(ring, [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }], r0, 600 * k, EO);
    } else {
      g.ringLine.setAttribute("mask", `url(#${id}-rm)`);
      tl.add(ring, op(0, 1), r0, 120, "linear");
      tl.add(ring, [{ transform: "scale(1.045)" }, { transform: "none" }], r0, 600 * k, EIO);
      tl.add(g.ringMaskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], r0, 600 * k, EIO);
      tl.at(closeAt + 20, () => g.ringLine.removeAttribute("mask"));
    }
    // closed: solid, one ping out, then it releases (gone by +1.2 s): at rest one fence, round the words
    tl.add(solid, op(0, 1), closeAt, 140, "ease-out");
    tl.add(ping, [{ opacity: 0.9, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.16)" }], closeAt, 600 * k, "ease-out", "forwards");
    // (fill forwards: before they start, the earlier animations decide)
    tl.add(ring, op(1, 0), closeAt + 600 * k, 600 * k, "ease-in", "forwards");
    tl.add(solid, op(1, 0), closeAt + 600 * k, 600 * k, "ease-in", "forwards");
    // hand the ring back to CSS (hover / focus), once it has let go
    tl.at(closeAt + 1220 * k, () => {
      for (const a of tl.anims) {
        const t = (a.effect as KeyframeEffect | null)?.target;
        if (t === ring || t === solid || t === ping) a.cancel();
      }
    });
  }

  function fadeUp(el: Element | null, at: number, dur = 620, dy = 10) {
    return tl.add(el, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: "none" }], at, dur, EO);
  }

  /** B · no intro (second visit): the jobsite stakes itself out on the words. */
  function playPlain(g: Geo) {
    busy = true;
    root.classList.add("is-live");
    const A = tl.add.bind(tl);
    const lineIns = qa(".hf-line-in");
    const ground = q(".hf-ground")!;
    ground.style.transformOrigin = `${g.wordC[0].toFixed(1)}px ${g.wordC[1].toFixed(1)}px`;
    A(ground, [{ opacity: 0, transform: "scale(1.03)" }, { opacity: 1, transform: "none" }], 0, 900, EO);
    if (!phone) fadeUp(q(".hf-eyebrow"), 40, 560, 8);
    lineIns.forEach((ln, i) => {
      const d = Math.abs(i - g.fenceLine);
      A(ln, [{ transform: `translateY(${i < g.fenceLine ? -112 : 112}%)` }, { transform: "none" }], d * 90, 560, EO);
    });
    if (phone) {
      A(q(".hf-fence"), [{ opacity: 0, transform: "scale(1.035)" }, { opacity: 1, transform: "none" }], 300, 520, EO);
    } else {
      g.line.setAttribute("mask", `url(#${id}-fm)`);
      A(g.maskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 300, 600, EIO);
      tl.at(920, () => g.line.removeAttribute("mask"));
      g.stakes.forEach((s, i) => A(s.dot, [{ transform: "scale(0)" }, { transform: "none" }], 560 + i * 34, 360, EPOP));
    }
    // Marcus is already on site
    const mb = q('.hf-mk[data-id="mb"]');
    A(mb, op(0, 1), 420, 360, "ease-out");
    if (!phone) A(q('.hf-stamp[data-id="mb"]'), [{ opacity: 0 }, { opacity: 1 }], 700, 420, EO);
    fadeUp(q(".hf-sub"), 400, 600, 10);
    if (phone || !g.tag) fadeUp(q(".hf-chip"), 520, 520, 6);
    ctaIn(600, 1);
    fadeUp(q(".hf-demo"), 720, 480, 6);
    fadeUp(q(".hf-micro"), 800, 480, 6);
    A(q(".hf-foot"), op(0, 1), 900, 600, "ease-out");
    if (g.tag) {
      const tg = q(".hf-tag")!;
      tg.style.transformOrigin = "0 50%";
      A(tg, [{ opacity: 0, transform: `${tr(g.tag.x - 10, g.tag.y)} scale(0.94)` }, { opacity: 1, transform: tr(g.tag.x, g.tag.y) }], 980, 520, EO);
      A(q(".hf-tape"), op(0, 1), 900, 360, "ease-out");
      A(q(".hf-tag-note"), op(0, 1), 1150, 500, "ease-out");
    }
    // the crew walk in
    clockIn(g, "er", walkIn(g, "er", 900, phone ? 820 : 900), !phone);
    if (!phone) clockIn(g, "jl", walkIn(g, "jl", 1250, 900), true);
    ctaFence(g, 1400, phone ? 0.85 : 1);
    rollOnce(3000);
    finishAt();
    tl.play();
  }

  /** Settle once everything has landed: the animations go, the inline rest state is the same frame. */
  function finishAt() {
    tl.at(tl.end() + 120, () => settle());
  }

  function settle() {
    rolling = false;
    busy = false;
    tl.cancel();
    tl = new Timeline();
    if (G) rest(G);
    root.classList.add("is-settled");
    root.classList.remove("is-intro");
    q(".hf-night")!.textContent = "";
    q(".hf-tag-plate")?.removeAttribute("style");
    q(".hf-chip-plate")?.removeAttribute("style");
  }

  // ── A · the hand-off from the intro (HERO_SPEC §5A, §7) ──

  /** Put a frozen node where it was, in the night layer. */
  function placeFrozen(f: Frozen<HTMLElement | SVGSVGElement>, parent: Element) {
    const s = f.el.style;
    s.position = "absolute";
    s.left = px(f.left);
    s.top = px(f.top);
    s.right = "auto";
    s.bottom = "auto";
    s.width = px(f.width);
    s.height = px(f.height);
    s.margin = "0";
    s.maxWidth = "none";
    s.maxHeight = "none";
    s.transform = f.transform;
    s.transformOrigin = f.origin;
    s.opacity = String(f.opacity);
    parent.appendChild(f.el);
  }

  function playIntro(g: Geo, req: HandoffReq) {
    const { snap, opts } = req;
    introUsed = true;
    busy = true;
    root.classList.add("is-intro");
    const k = (phone ? 0.8 : 1) * (opts.skip ? 0.6 : 1);
    const T = (ms: number) => ms * k;
    const A = tl.add.bind(tl);
    const nightEl = q(".hf-night")!;
    nightEl.textContent = "";

    // ── 1 · the night layer: the intro's last frame, rebuilt (its nodes moved, not copied) ──
    const ground = div("hf-night-ground", nightEl);
    const mapW = div("hf-night-map", nightEl);
    placeFrozen(snap.map, mapW);
    const svg = snap.map.el;
    // the fence, the label and Marcus are the hero's own from here (they move); the map keeps the rest
    svg.querySelectorAll<SVGElement>(".t-fence, .t-zone, .t-ripple, .t-dashes, .t-truck").forEach((e) => (e.style.visibility = "hidden"));
    snap.label.text.style.visibility = "hidden";
    const dawn = div("hf-dawn", nightEl);
    // the label, set again at its exact screen matrix (so it can grow into the words)
    const labW = div("hf-night-label", nightEl);
    const labSvg = svgEl("svg", { width: window.innerWidth, height: window.innerHeight }, labW);
    const lab = snap.label.text.cloneNode(true) as SVGTextElement;
    const m = snap.label.ctm;
    lab.setAttribute("transform", `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
    lab.style.visibility = "";
    lab.style.opacity = String(snap.label.opacity);
    labSvg.appendChild(lab);
    placeFrozen(snap.cards.clockin, nightEl);
    placeFrozen(snap.cards.load, nightEl);
    if (snap.logo) placeFrozen(snap.logo, nightEl);
    if (snap.skip) placeFrozen(snap.skip, nightEl);

    // the night fence, at the intro's stakes and stroke (it re-stakes itself round the words)
    const S = snap.S;
    const stroke = 3 * S;
    const nfence = q(".hf-nfence")!;
    if (phone) {
      nfence.textContent = "";
      const s = svgEl("svg", { width: g.W, height: g.H, viewBox: `0 0 ${g.W} ${g.H}` }, nfence);
      svgEl("polygon", { class: "hf-nfence-zone", points: polyPoints(snap.fence), style: `fill-opacity:${snap.zone}` }, s);
      svgEl("polygon", { class: "hf-nfence-line", points: polyPoints(snap.fence), style: `stroke-width:${stroke.toFixed(2)}px` }, s);
    }

    // Marcus: the hero's marker, wearing the intro's night marker for the first frames
    const mbEl = q('.hf-mk[data-id="mb"]')!;
    const mbT = Math.hypot(snap.mb.ctm.a, snap.mb.ctm.b);
    const k0 = (14.5 * mbT) / 13;
    const nf = svgEl("svg", { class: "hf-mk-night", viewBox: "0 0 26 26", width: 26, height: 26 });
    const gI = snap.mb.group.cloneNode(true) as SVGGElement;
    gI.removeAttribute("class");
    gI.removeAttribute("style");
    gI.setAttribute("transform", `translate(13 13) scale(${(13 / 14.5).toFixed(5)})`);
    nf.appendChild(gI);
    mbEl.appendChild(nf);

    // the profit notification becomes the tag (desktop) or the chip (phones): ONE element, one FLIP
    const target = g.tag ? q(".hf-tag") : q(".hf-chip");
    const tBox = g.tag ? { x: g.tag.x, y: g.tag.y, w: g.tag.w, h: g.tag.h } : g.chip;
    const pc = snap.cards.profit;
    const flip = pc.opacity > 0.5 && target && tBox;
    let plate: HTMLElement | null = null;
    if (flip) {
      plate = q(g.tag ? ".hf-tag-plate" : ".hf-chip-plate");
      // the card rides inside the target, centred on it
      placeFrozen({ ...pc, left: (tBox.w - pc.width) / 2, top: (tBox.h - pc.height) / 2, transform: "none", origin: "50% 50%" }, target);
      pc.el.classList.add("hf-flying-card");
      target.classList.add("is-flying");
    } else {
      placeFrozen(pc, nightEl);
    }

    opts.onSwap();
    root.classList.add("is-live");

    // ── 2 · the move ──
    const nb = bbox(snap.fence);
    const nC = centroid(snap.fence);
    const W = window.innerWidth;
    const H = window.innerHeight;

    // camera: push in on the jobsite, the fence's centre carried onto the words
    const zk = 2.4;
    mapW.style.transformOrigin = "0 0";
    A(mapW, [{ transform: "translate(0px, 0px) scale(1)" }, { transform: `translate(${px(g.wordC[0] - nC[0] * zk)}, ${px(g.wordC[1] - nC[1] * zk)}) scale(${zk})` }], 0, T(760), EIO);
    A(mapW, op(1, 0), T(300), T(460), "ease-in");
    // the dawn: a large lit field from the fence that accelerates out to the edges (no spotlight).
    // It is as wide as the screen is (an ellipse on a landscape screen, a circle on a phone), so
    // it reads as light coming over the land, not a disc in the dark
    const D = 200; // the element is 400 px: radius 200
    const asp = clamp(Math.pow(W / H, 0.6), 1, 1.7);
    const reach = (x: number, y: number) => Math.hypot((x - nC[0]) / asp, y - nC[1]);
    const far = Math.max(reach(0, 0), reach(W, 0), reach(0, H), reach(W, H));
    const near = Math.min(nC[0] / asp, (W - nC[0]) / asp, nC[1], H - nC[1]);
    // first visible frame: ≥ 0.6 × the fence's width, and its solid core already reaching the
    // nearest edges: a band of light across the screen from the start, never a disc in the dark
    const r0 = Math.max(0.6 * (nb.x1 - nb.x0), near / 0.8 + 4);
    const r1 = far / 0.8 + 8; // the solid core (80 %) covers the farthest corner
    const sc = (r: number) => `scale(${((r * asp) / D).toFixed(4)}, ${(r / D).toFixed(4)})`;
    A(dawn, [{ transform: `${tr(nC[0] - D, nC[1] - D)} ${sc(r0)}` }, { transform: `${tr(nC[0] - D, nC[1] - D)} ${sc(r1)}` }], 0, T(phone ? 450 : 420), EDAWN);
    A(dawn, op(0, 1), 0, T(130), "ease-out");
    A(ground, op(1, 0), T(200), T(220), "linear");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FBF8F4");

    // the notifications: the clock-in folds into Marcus, the load leaves
    const ci = snap.cards.clockin;
    ci.el.style.transformOrigin = `${px(snap.mb.at[0] - ci.left)} ${px(snap.mb.at[1] - ci.top)}`;
    const ciT = ci.transform === "none" ? "" : ci.transform;
    A(ci.el, [{ transform: `${ciT} scale(1)`, opacity: ci.opacity }, { transform: `${ciT} scale(0.08)`, opacity: 0 }], 0, T(380), EIO);
    A(snap.cards.load.el, op(snap.cards.load.opacity, 0), 0, T(280), "ease-out");
    if (snap.skip) A(snap.skip.el, op(snap.skip.opacity, 0), 0, T(150), "ease-out");

    // the profit card → the tag / chip
    if (flip && plate) {
      const tc: Pt = [tBox!.x + tBox!.w / 2, tBox!.y + tBox!.h / 2];
      const cc: Pt = [pc.left + pc.width / 2, pc.top + pc.height / 2];
      const rest = g.tag ? tr(g.tag.x, g.tag.y) : "none";
      const from = g.tag ? tr(g.tag.x + cc[0] - tc[0], g.tag.y + cc[1] - tc[1]) : tr(cc[0] - tc[0], cc[1] - tc[1]);
      A(target, [{ transform: from }, { transform: rest }], 0, T(820), EIO);
      A(plate, [{ transform: `scale(${(pc.width / tBox!.w).toFixed(4)}, ${(pc.height / tBox!.h).toFixed(4)})`, opacity: 1 }, { transform: "none", opacity: 1 }], 0, T(820), EIO);
      A(pc.el, [{ transform: "scale(1)" }, { transform: `scale(${(tBox!.w / pc.width).toFixed(4)})` }], 0, T(820), EIO);
      A(pc.el, op(pc.opacity, 0), T(140), T(220), "ease-out");
      A(q(g.tag ? ".hf-tag-face" : ".hf-chip-face"), op(0, 1), T(300), T(260), "ease-out");
      if (g.tag) {
        // the plate (a plain card) settles into the tag's own shape
        A(q(".hf-tag-bgw"), op(0, 1), T(560), T(240), "ease-out");
        A(plate, [{ opacity: 1 }, { opacity: 0 }], T(640), T(200), "ease-out");
      }
      tl.at(T(840), () => {
        pc.el.remove();
        target!.classList.remove("is-flying");
        plate!.removeAttribute("style");
      });
    } else {
      A(pc.el, op(pc.opacity, 0), 0, T(240), "ease-out");
      if (g.tag) {
        const tg = q(".hf-tag")!;
        tg.style.transformOrigin = "0 50%";
        A(tg, [{ opacity: 0, transform: `${tr(g.tag.x - 10, g.tag.y)} scale(0.94)` }, { opacity: 1, transform: tr(g.tag.x, g.tag.y) }], T(500), T(520), EO);
      } else fadeUp(q(".hf-chip"), T(500), T(520), 6);
    }
    if (g.tag) {
      A(q(".hf-tape"), op(0, 1), T(700), T(320), "ease-out");
      A(q(".hf-tag-note"), op(0, 1), T(900), T(500), "ease-out");
    }

    // the label grows into the words; the words grow out of it
    const lr = snap.label.rect;
    const lc: Pt = [lr.left + lr.width / 2, lr.top + lr.height / 2];
    const wc: Pt = [g.words.x + g.words.w / 2, g.words.y + g.words.h / 2];
    const fenced = q(".hf-fenced")!;
    const sIn = lr.width / g.words.w;
    fenced.style.transformOrigin = "50% 50%";
    A(fenced, [{ transform: `${tr(lc[0] - wc[0], lc[1] - wc[1])} scale(${sIn.toFixed(4)})` }, { transform: "none" }], 0, T(760), EIO);
    A(fenced, op(0, 1), T(40), T(240), "ease-out");
    labW.style.transformOrigin = `${px(lc[0])} ${px(lc[1])}`;
    A(labW, [{ transform: "none" }, { transform: `${tr(wc[0] - lc[0], wc[1] - lc[1])} scale(${(1 / sIn).toFixed(4)})` }], 0, T(760), EIO);
    A(labW, op(1, 0), 0, T(260), "ease-out");

    // the fence re-stakes itself round the words
    if (phone) {
      // one transform on the whole night polygon, then a crossfade to the measured fence (no per-frame JS)
      const db = bbox(g.fence);
      const sx = (db.x1 - db.x0) / (nb.x1 - nb.x0);
      const sy = (db.y1 - db.y0) / (nb.y1 - nb.y0);
      nfence.style.transformOrigin = "0 0";
      A(nfence, [{ transform: "none", opacity: snap.fenceOn }, { opacity: snap.fenceOn, offset: 0.45 }, { transform: `${tr(db.x0 - nb.x0 * sx, db.y0 - nb.y0 * sy)} scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, opacity: 0 }], 0, T(780), EIO);
      A(q(".hf-fence"), op(0, 1), T(340), T(280), "ease-out");
      tl.at(T(800), () => (nfence.textContent = ""));
    } else {
      const from = snap.fence;
      const to = g.fence;
      const on = snap.fenceOn;
      const set = (pts: Pt[]) => {
        const s = polyPoints(pts);
        g.line.setAttribute("points", s);
        g.fill.setAttribute("points", s);
        g.pulse.setAttribute("points", s);
        pts.forEach(([x, y], i) => g.stakes[i].g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`));
      };
      g.line.removeAttribute("mask");
      const dur = T(1250);
      tl.fn(0, dur, (p) => {
        const ms = p * dur;
        set(from.map(([x, y], i) => {
          const e = SPRING((ms - T(i * 26)) / 1000 / k);
          return [x + (to[i][0] - x) * e, y + (to[i][1] - y) * e] as Pt;
        }));
        // closed solid at night, dashed by day; the jobsite's fill fades with the night
        const d = clamp((ms - T(260)) / T(420), 0, 1);
        if (p >= 1) {
          g.line.style.removeProperty("stroke-dasharray");
          g.line.style.removeProperty("stroke-width");
          g.line.style.removeProperty("opacity");
          g.fill.style.removeProperty("fill-opacity");
        } else {
          const sw = stroke + (2 - stroke) * clamp(ms / T(680), 0, 1);
          g.line.style.strokeDasharray = `${(17 - 7 * d).toFixed(2)} ${(7 * d).toFixed(2)}`;
          g.line.style.strokeWidth = `${sw.toFixed(2)}px`;
          g.line.style.opacity = String(clamp(on + (1 - on) * (ms / T(160)), 0, 1));
          g.fill.style.fillOpacity = String(snap.zone * (1 - clamp(ms / T(680), 0, 1)));
        }
      });
      g.stakes.forEach((s, i) => A(s.dot, [{ transform: "scale(0)" }, { transform: "none" }], T(560 + i * 34), T(380), EPOP));
    }

    // Marcus glides from his night spot to his place on the fence and clocks in
    const [mx, my] = snap.mb.at;
    const [dx, dy] = g.T.mb;
    A(mbEl, [{ transform: `${tr(mx - 13, my - 13)} scale(${k0.toFixed(4)})`, opacity: snap.mb.opacity }, { transform: tr(dx - 13, dy - 13), opacity: 1 }], 0, T(760), EIO);
    A(nf, op(1, 0), T(120), T(420), "ease-out");
    A(mbEl.querySelector(".hf-mk-dot"), [{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "none" }], T(420), T(300), EPOP);
    tl.at(T(780), () => nf.remove());
    if (!phone) A(q('.hf-stamp[data-id="mb"]'), [{ opacity: 0, transform: tr(g.stampPos.mb[0] - 6, g.stampPos.mb[1]) }, { opacity: 1, transform: tr(g.stampPos.mb[0], g.stampPos.mb[1]) }], T(620), T(420), EO);

    // the ground: the landform's contours come up round the copy
    const topo = q(".hf-ground")!;
    topo.style.transformOrigin = `${g.wordC[0].toFixed(1)}px ${g.wordC[1].toFixed(1)}px`;
    A(topo, [{ opacity: 0, transform: "scale(0.86)" }, { opacity: 1, transform: "none" }], T(60), T(780), EO);

    // the header: the night logo hands over to the page's, in place; the nav comes in
    const header = document.querySelector<HTMLElement>(".site-header");
    if (snap.logo) A(snap.logo.el, op(snap.logo.opacity, 0), T(260), T(420), "ease-out");
    const hd = A(header, op(0, 1), T(260), T(420), "ease-out");

    // the rest of the headline closes in on the jobsite: lines above drop in, lines below rise
    qa(".hf-line-in").forEach((ln, i) => {
      if (i === g.fenceLine) return;
      const d = Math.abs(i - g.fenceLine);
      A(ln, [{ transform: `translateY(${i < g.fenceLine ? -112 : 112}%)` }, { transform: "none" }], T(600 + (d - 1) * 60), T(400), EO);
    });
    if (!phone) fadeUp(q(".hf-eyebrow"), T(700), T(500), 8);
    fadeUp(q(".hf-sub"), T(800), T(520), 10);
    ctaIn(T(900), k);
    fadeUp(q(".hf-demo"), T(1000), T(460), 6);
    fadeUp(q(".hf-micro"), T(1100), T(460), 6);
    A(q(".hf-foot"), op(0, 1), T(1150), T(600), "ease-out");

    // the crew walk in and clock in on the headline
    clockIn(g, "er", walkIn(g, "er", T(1000), T(phone ? 820 : 900)), !phone);
    if (!phone) clockIn(g, "jl", walkIn(g, "jl", T(1350), T(900)), true);
    ctaFence(g, T(1600), k);
    rollOnce(T(3000), k);

    // the camera move is over: the page is the page (scroll, the late scenes, smooth scroll)
    let doneCalled = false;
    const done = () => {
      if (doneCalled) return;
      doneCalled = true;
      opts.onDone();
      nightEl.textContent = "";
      hd?.cancel();
    };
    tl.at(T(1000), () => {
      ground.remove();
      mapW.remove();
      dawn.remove();
      labW.remove();
    });
    tl.at(T(900), done);
    endMove = () => {
      done();
      endMove = null;
    };
    finishAt();
    onSkipHandoff(() => tl.speed(1 / 0.6));
    tl.at(T(1300), () => onSkipHandoff(null));

    if (opts.debug) {
      (window as unknown as { __hero: unknown }).__hero = { seek: (ms: number) => tl.seek(ms), geo: g, timing };
      tl.seek(0);
    } else tl.play();
  }

  // ── 5 · touch and cursor ──
  function interact(g: Geo) {
    const fenceEl = q(".hf-fence")!;
    const pulseEl = q(".hf-pulse")!;
    const pulseOnce = () => pulseEl.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { duration: reduced ? 1 : 620, easing: "ease-out" });
    let pts = g.fence.map((p) => [...p] as Pt);
    const setPts = (p: Pt[]) => {
      const s = polyPoints(p);
      g.line.setAttribute("points", s);
      g.fill.setAttribute("points", s);
      g.pulse.setAttribute("points", s);
      p.forEach(([x, y], i) => g.stakes[i].g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`));
    };
    const on = (el: EventTarget | null, ev: string, f: EventListener, opt?: AddEventListenerOptions) => {
      if (!el) return;
      el.addEventListener(ev, f, opt);
      offs.push(() => el.removeEventListener(ev, f));
    };

    // the tag / chip: roll on to the next job
    const rollNext = (strip: HTMLElement | null, rowH: number, idx: number, set: (i: number) => void) => {
      if (!strip || rolling) return;
      // the strip starts and ends on the same job: wrap seamlessly
      const from = idx === tagRows - 1 ? 0 : idx;
      const to = from + 1;
      strip.style.transform = `translateY(${-rowH * to}px)`;
      if (!reduced) strip.animate([{ transform: `translateY(${-rowH * from}px)` }, { transform: `translateY(${-rowH * to}px)` }], { duration: 380, easing: EIO });
      set(to);
    };
    const chip = q(".hf-chip");
    on(chip, "click", () => rollNext(q(".hf-chip-strip"), CHIP_ROW, chipIdx, (i) => (chipIdx = i)));

    if (phone) {
      // tap the words: the fence pings and the crew show when they clocked in
      on(q(".hf-line--fence"), "click", () => {
        if (busy) return;
        pulseOnce();
        if (reduced) return;
        for (const c of crew) {
          const m = q(`.hf-mk[data-id="${c.id}"]`)!;
          m.querySelector(".hf-mk-i")!.animate([{ opacity: 1 }, { opacity: 0, offset: 0.15 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: 1500 });
          m.querySelector(".hf-mk-t")!.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500 });
        }
      });
      return;
    }

    // desktop: the ground drifts ±6 px with the cursor (rAF only while it is moving); the fence
    // closes solid when the cursor steps inside it
    const drift = q(".hf-ground-drift")!;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      drift.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    let inFence = false;
    let drag: { i: number; ox: number; oy: number; base: Pt } | null = null;
    const R = () => root.getBoundingClientRect();
    on(root, "pointermove", ((e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = R();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!reduced) {
        tx = -((x / r.width) * 2 - 1) * 6;
        ty = -((y / r.height) * 2 - 1) * 6;
        if (!raf) raf = requestAnimationFrame(loop);
      }
      if (drag) return;
      const now = inside(pts, x, y);
      if (now !== inFence) {
        inFence = now;
        fenceEl.classList.toggle("is-on", now);
        if (now && !busy) pulseOnce();
      }
    }) as EventListener);
    offs.push(() => cancelAnimationFrame(raf));

    // the stakes can be dragged; they spring back to where the fence belongs
    on(root, "pointerdown", ((e: PointerEvent) => {
      const t = e.target as Element;
      if (!t.classList?.contains("hf-stake-hit") || busy) return;
      const i = Number(t.getAttribute("data-v"));
      const r = R();
      drag = { i, ox: e.clientX - r.left - pts[i][0], oy: e.clientY - r.top - pts[i][1], base: [...g.fence[i]] as Pt };
      (t as SVGElement).setPointerCapture?.(e.pointerId);
      fenceEl.classList.add("is-on");
      e.preventDefault();
    }) as EventListener);
    on(window, "pointermove", ((e: PointerEvent) => {
      if (!drag) return;
      const r = R();
      let x = e.clientX - r.left - drag.ox;
      let y = e.clientY - r.top - drag.oy;
      const ddx = x - drag.base[0];
      const ddy = y - drag.base[1];
      const d = Math.hypot(ddx, ddy);
      const max = 70;
      if (d > max) {
        const kk = (max + (d - max) * 0.25) / d;
        x = drag.base[0] + ddx * kk;
        y = drag.base[1] + ddy * kk;
      }
      pts[drag.i] = [x, y];
      setPts(pts);
    }) as EventListener);
    on(window, "pointerup", () => {
      if (!drag) return;
      const i = drag.i;
      const start: Pt = [...pts[i]] as Pt;
      const goal = g.fence[i];
      drag = null;
      fenceEl.classList.toggle("is-on", inFence);
      if (reduced) {
        pts = g.fence.map((p) => [...p] as Pt);
        setPts(pts);
        return;
      }
      const t0 = performance.now();
      const step = () => {
        if (!alive) return;
        const t = (performance.now() - t0) / 1000;
        const e = SPRING(t);
        pts[i] = [start[0] + (goal[0] - start[0]) * e, start[1] + (goal[1] - start[1]) * e];
        setPts(pts);
        if (t < 1.2) requestAnimationFrame(step);
        else {
          pts = g.fence.map((p) => [...p] as Pt);
          setPts(pts);
          pulseOnce();
        }
      };
      requestAnimationFrame(step);
    });

    // the button: its own fence redraws solid while the cursor is on it (or it has keyboard focus)
    const cta = q(".hf-cta-wrap .cta")!;
    const ctaOn = () => root.classList.add("is-cta");
    const ctaOff = () => root.classList.remove("is-cta");
    on(cta, "pointerenter", ctaOn);
    on(cta, "pointerleave", ctaOff);
    on(cta, "focus", () => cta.matches(":focus-visible") && ctaOn());
    on(cta, "blur", ctaOff);

    // the tag rolls on to the next job when you point at it (or click)
    const tg = q(".hf-tag");
    const onTag = () => rollNext(q(".hf-tag-strip"), TAG_ROW, tagIdx, (i) => (tagIdx = i));
    on(tg, "pointerenter", onTag);
    on(tg, "click", onTag);
  }

  // ── boot ──
  let fontsLate = false;
  let offHandoff: (() => void) | null = null;
  (async () => {
    const inTime = await fontsReady(1600);
    if (!alive) return;
    fontsLate = !inTime && !fontsIn();
    G = place();
    rest(G);
    root.classList.add("is-laid");
    const mode: FenceMode = reduced ? "reduced" : o.mode === "intro" && !introUsed && getIntroPhase() !== "done" ? "intro" : "plain";
    if (mode === "reduced") {
      root.classList.add("is-live", "is-settled");
      rolling = false;
      drawTopo(G);
    } else if (mode === "intro") {
      // build the ground now, in the intro's hold, so the hand-off itself runs on a quiet thread
      drawTopo(G);
      offHandoff = onHeroHandoff((req) => {
        if (!alive || !G) return;
        if (req) playIntro(G, req);
        else playPlain(G);
      });
    } else {
      playPlain(G);
      // after the headline's first frame
      setTimeout(() => G && alive && drawTopo(G), 60);
    }
    interact(G);
    if (import.meta.env.DEV) devChecks();
  })();

  // re-place on a width change (debounced; phones ignore height-only resizes: the URL bar), and
  // once if the fonts arrived after the measuring race
  let rt = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  const replace = () => {
    if (!alive || !G) return;
    if (busy) {
      // mid-move: land everything at once, then measure again
      endMove?.();
      tl.flush();
      settle();
    }
    offs.splice(0).forEach((f) => f());
    G = place();
    rest(G);
    drawTopo(G);
    rolling = false;
    interact(G);
  };
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === lastW && (phone || h === lastH)) return;
    lastW = w;
    lastH = h;
    clearTimeout(rt);
    rt = window.setTimeout(replace, 140);
  };
  window.addEventListener("resize", onResize);
  const onFonts = () => {
    if (!fontsLate || !fontsIn()) return;
    fontsLate = false;
    clearTimeout(rt);
    rt = window.setTimeout(replace, 60);
  };
  document.fonts?.addEventListener("loadingdone", onFonts);

  return () => {
    alive = false;
    topoJob?.cancel();
    offHandoff?.();
    onSkipHandoff(null);
    endMove?.();
    tl.cancel();
    clearTimeout(rt);
    window.removeEventListener("resize", onResize);
    document.fonts?.removeEventListener("loadingdone", onFonts);
    offs.splice(0).forEach((f) => f());
    root.classList.remove("is-laid", "is-settled", "is-live");
  };
}

/** Dev only: the hero's crew and jobs must match the demo account (src/screens/data.ts). */
function devChecks() {
  void import("../../../screens/data").then(({ clockIns, crewById }) => {
    const onSite = clockIns.filter((c) => c.projectId === "p2417");
    const want = HERO_JOBS.crew.map((c) => c.crewId).sort().join();
    const have = onSite.map((c) => c.crewId).sort().join();
    if (want !== have) console.warn(`[hero] HERO_JOBS.crew (${want}) ≠ Hwy 9 clock-ins in screens/data.ts (${have})`);
    for (const c of HERO_JOBS.crew) {
      const ci = onSite.find((x) => x.crewId === c.crewId);
      if (ci && ci.time.replace(/ [AP]M$/, "") !== c.time) console.warn(`[hero] ${c.initials} clocked in at ${ci.time} in screens/data.ts, the hero says ${c.time}`);
      if (crewById(c.crewId).initials !== c.initials) console.warn(`[hero] ${c.crewId} initials differ`);
    }
  });
}
