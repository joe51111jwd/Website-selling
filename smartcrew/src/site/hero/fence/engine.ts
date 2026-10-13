// The hero's engine ("Fence the Words", HERO_SPEC): measure the set type, build the ground and the
// fence, play the entrance.
//
// React renders the copy and empty layers (../Hero.tsx). Once the fonts are in, this measures the
// real glyph boxes, fits the headline to the screen, opens the leading round the fenced line so
// the fence keeps clear of its neighbours, stakes the geofence round the angle's phrase and lays
// out the crew, the tag and the button's own fence. Layout writes every element's REST state as
// inline style (so a resize, reduced motion or the end of the entrance all show the same frame);
// the entrance then plays WAAPI animations over it (fill: both), dropped once everything has
// landed. The entrance (HERO_SPEC §5B) plays on every visit; an opening can hand it pieces it has
// already delivered and start it part-way (./opening.ts). PHONE MODE: transform and opacity only,
// timers instead of rAF (zero rAF in the entrance), no per-frame JS. Desktop adds two short rAF
// pieces, both input-driven: the ground drifting with the cursor (only while it moves) and a
// dragged stake springing back.

import { HERO_JOBS } from "../../../content/copy";
import { markFirstScreenDone, markPageReady } from "../../ready";
import { OPENING_WAIT, heroEntered, heroEnter, heroLaidOut, openingOn, registerHero, type Box as TBox, type CrewId, type HeroEnterOpts, type HeroTargets, type PieceMode } from "./opening";
import { contoursSliced, type Rect, type TopoInput } from "./topo";
import { SPRING, Walk, hexFence, inside, polyPath, polyPoints, springFrames, walkEaseInv, walkFrames, type Box, type Pt } from "./geom";

const NS = "http://www.w3.org/2000/svg";
const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)";
const EPOP = "cubic-bezier(0.34, 1.5, 0.64, 1)";

export type FenceOpts = { phone: boolean; reduced: boolean };

/** Headline leading (× font size). */
const LH = 0.98;
/** The tag's height and row height (desktop), the chip's row height. */
const TAG_H = 62;
const TAG_ROW = 46;
const CHIP_ROW = 28;
/** Stake dot radius (orange part): the leading rule keeps the dots clear of the next line too. */
const STAKE_R = 3;
/** The page is ready (src/site/ready.ts) once the button has landed: this long after it starts. */
const CTA_LANDED = 400;

type Geom = { clear: [number, number]; point: number; inset: number; jitter: number; gap: number; side: number };
/** desktop: the fenced line keeps room each side for the point, a marker and a clock-in time */
const DESK: Geom = { clear: [16, 12], point: 46, inset: 9, jitter: 1, gap: 10, side: 16 + 46 + 12 + 36 + 8 };
const PHONE: Geom = { clear: [12, 8], point: 40, inset: 6, jitter: 0.5, gap: 8, side: 12 + 40 + 4 };

// ── a tiny timeline: WAAPI animations and one-off timers on one clock (never a frame loop) ──

type Cb = { at: number; f: () => void; done: boolean };

class Timeline {
  anims: Animation[] = [];
  private cbs: Cb[] = [];
  private timers: number[] = [];
  private stopped = false;

  /**
   * An animation `at` ms in. Default fill "backwards": it holds its first frame until it starts and
   * drops out when it ends, onto the inline rest state (the same frame). Dropping out matters: the
   * browser repaints the element then, which is when Largest Contentful Paint can see it (a
   * composited fade never repaints on its own, so a headline or sub that stayed under a finished
   * fill-forwards animation would be reported seconds late).
   */
  add(el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, easing = EO, fill: FillMode = "backwards") {
    if (!el) return null;
    const a = el.animate(kf, { delay: at, duration: Math.max(1, dur), easing, fill });
    this.anims.push(a);
    return a;
  }
  /** a one-off at `at` ms (a timer, never a frame loop) */
  at(at: number, f: () => void) {
    this.cbs.push({ at, f, done: false });
  }
  private run(cb: Cb) {
    if (this.stopped || cb.done) return;
    cb.done = true;
    cb.f();
  }
  /** start `from` ms in (everything before has landed), at `rate` × speed */
  play(from = 0, rate = 1) {
    if (from > 0 || rate !== 1) {
      for (const a of this.anims) {
        a.currentTime = from;
        if (rate !== 1) a.updatePlaybackRate(rate);
      }
    }
    // what is already past runs now, in order; the rest on timers
    const cbs = [...this.cbs].sort((a, b) => a.at - b.at);
    for (const cb of cbs) if (cb.at <= from) this.run(cb);
    for (const cb of cbs) if (!cb.done) this.timers.push(window.setTimeout(() => this.run(cb), (cb.at - from) / rate));
  }
  /** render the frame at `ms` (captures, ?heroDebug): animations paused there, timers up to it */
  seek(ms: number) {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    for (const a of this.anims) {
      a.pause();
      a.currentTime = ms;
    }
    for (const cb of [...this.cbs].sort((a, b) => a.at - b.at)) if (cb.at <= ms) this.run(cb);
  }
  /** run everything that is still to come, at once (a resize mid-entrance) */
  flush() {
    for (const cb of [...this.cbs].sort((a, b) => a.at - b.at)) this.run(cb);
  }
  cancel() {
    this.stopped = true;
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

/** The smallest box round two boxes (the second may be missing). */
function union(a: TBox, b: TBox | null): TBox {
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
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

/** ?heroDebug: build the entrance paused; window.__hero.seek(ms) renders any frame (captures). */
const DEBUG = typeof location !== "undefined" && /[?&]heroDebug\b/.test(location.search);

let uid = 0;

// ── the engine ──────────────────────────────────────────────────────────────────────────

export function mountFence(root: HTMLElement, o: FenceOpts): () => void {
  const id = `hf-${++uid}`;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T | null;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll(s)] as T[];
  const phone = o.phone;
  const P = phone ? PHONE : DESK;
  const reduced = o.reduced;
  const crew = HERO_JOBS.crew.filter((c) => !phone || c.id !== "jl");
  const tagRows = HERO_JOBS.rows.length + 1; // the strip parks back on the first row
  let alive = true;
  let tl = new Timeline();
  let G: Geo | null = null;
  const offs: (() => void)[] = [];
  let tagIdx = tagRows - 1;
  let chipIdx = tagRows - 1;
  let rolling = true;
  let busy = false; // the entrance is running
  let started = false; // this engine has entered (or shown its rest state)
  let landed: (() => void) | null = null; // resolves the entrance's promise
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
    let li = fi;
    while (li + 1 < lines.length && lines[li + 1].querySelector(".hf-fenced")) li++;
    const lh = LH * fs;
    const fTop = ink(lines[fi].querySelector(".hf-fenced")!.textContent || "", fs);
    const fBot = ink(lines[li].querySelector(".hf-fenced")!.textContent || "", fs);
    const reach = P.clear[1] + 1.5 * P.jitter + STAKE_R;
    const prev = fi > 0 ? ink(lines[fi - 1].textContent || "", fs) : null;
    const next = li < lines.length - 1 ? ink(lines[li + 1].textContent || "", fs) : null;
    let mb = 0;
    if (next) mb = Math.max(0, Math.max(0, fBot.desc) + reach + P.gap + next.asc - lh);
    else {
      // the fenced phrase ends the headline: the fence keeps clear of what follows (the job chip,
      // or the sub) by a little more than the gap between lines
      const ln = lines[li];
      const cur = parseFloat(getComputedStyle(ln).fontSize) || fs;
      const below = ((ln.getBoundingClientRect().bottom - ln.querySelector(".hf-base")!.getBoundingClientRect().top) / cur) * fs;
      const chip = q(".hf-chip")!;
      const after = getComputedStyle(chip).display !== "none" ? chip : q(".hf-sub")!;
      const gapAfter = parseFloat(getComputedStyle(after).marginTop) || 0;
      mb = Math.max(0, Math.max(0, fBot.desc) + reach + P.gap + 4 - below - gapAfter);
    }
    return {
      mt: prev ? Math.max(0, fTop.asc + reach + P.gap + Math.max(0, prev.desc) - lh) : 0,
      mb,
    };
  }

  function setFs(fs: number) {
    const l = leading(fs);
    root.style.setProperty("--fs", `${fs.toFixed(2)}px`);
    root.style.setProperty("--fl-mt", `${l.mt.toFixed(1)}px`);
    root.style.setProperty("--fl-mb", `${l.mb.toFixed(1)}px`);
  }

  /** The block's limits: desktop, from the top band to the logos row; phone, the button's bottom and the scroll cue's. */
  function overflow() {
    const R = root.getBoundingClientRect();
    if (phone) {
      const vis = Math.min(window.innerHeight, 900);
      const cta = q(".hf-cta-wrap")!.getBoundingClientRect().bottom - R.top;
      const cue = q(".hf-cue")!.getBoundingClientRect().bottom - R.top;
      // the button by 500 px, and the scroll cue fully on screen (never straddling the fold)
      return Math.max(cta - Math.min(500, vis - 150), cue - (vis - 2));
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
    // the fenced phrase: one line, or a run of lines (fenceLine … fenceLast)
    let fenceLine = -1;
    let fenceLast = -1;
    const wordBox: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const lineInfo: { x0: number; x1: number; top: number; bot: number; base: number }[] = [];
    const lineRects: TBox[] = [];
    qa(".hf-line-in").forEach((ln, i) => {
      const r = rel(ln.getBoundingClientRect());
      lineRects.push({ x: r.x, y: r.y, w: r.w, h: r.h });
      const base = rel(ln.querySelector(".hf-base")!.getBoundingClientRect()).y;
      const m = ink(ln.textContent || "", fs);
      const top = base - m.asc;
      const bot = base + m.desc;
      lineInfo.push({ x0: r.x, x1: r.x + r.w, top, bot, base });
      lineBoxes.push({ x: r.x - 6, y: top - 4, w: r.w + 12, h: bot - top + 8, r: 12 });
      const fz = ln.querySelector(".hf-fenced");
      if (fz) {
        if (fenceLine < 0) fenceLine = i;
        fenceLast = i;
        const fr = rel(fz.getBoundingClientRect());
        const fm = ink(fz.textContent || "", fs);
        wordBox.x0 = Math.min(wordBox.x0, fr.x + 1);
        wordBox.x1 = Math.max(wordBox.x1, fr.x + fr.w - 1);
        wordBox.y0 = Math.min(wordBox.y0, base - fm.asc);
        wordBox.y1 = Math.max(wordBox.y1, base + fm.desc);
      }
    });


    // the fence round the words
    const fence = hexFence(wordBox, { clear: P.clear, point: P.point, inset: P.inset, jitter: P.jitter });
    const yc = (wordBox.y0 + wordBox.y1) / 2;
    const cl = wordBox.x0 - P.clear[0];
    const cr = wordBox.x1 + P.clear[0];
    const wordC: Pt = [(wordBox.x0 + wordBox.x1) / 2, yc];

    // the crew: parked inside the fence's points (MB on the right: he is already on site)
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
    let stampBox: TBox | null = null;
    let tag: { x: number; y: number; w: number; h: number } | null = null;
    if (!phone) {
      for (const c of crew) {
        const s = q(`.hf-stamp[data-id="${c.id}"]`)!;
        const w = s.offsetWidth;
        const left = c.id !== "mb";
        stampPos[c.id] = [left ? fence[0][0] - 12 - w : fence[3][0] + 12, T[c.id][1] - 7.5];
        if (c.id === "mb") stampBox = { x: stampPos.mb[0], y: stampPos.mb[1], w, h: s.offsetHeight };
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

    // the headline's biggest line (by area): the page's Largest Contentful Paint (entrance)
    let lcpLine = 0;
    lineRects.forEach((r, i) => r.w * r.h > lineRects[lcpLine].w * lineRects[lcpLine].h && (lcpLine = i));

    // the boxes an opening flies its pieces to (./opening.ts), at rest
    const boxOfEl = (el: Element | null): TBox | null => {
      if (!el || !(el as HTMLElement).offsetParent) return null;
      const b = rel(el.getBoundingClientRect());
      return { x: b.x, y: b.y, w: b.w, h: b.h };
    };
    const boxes = {
      lines: lineRects,
      eyebrow: phone ? null : boxOfEl(q(".hf-eyebrow")),
      sub: boxOfEl(q(".hf-sub"))!,
      cta: { x: cb.x, y: cb.y, w: cb.w, h: cb.h },
      ctaRow: union(boxOfEl(q(".hf-cta-wrap"))!, boxOfEl(q(".hf-demo"))),
      micro: boxOfEl(q(".hf-micro"))!,
      stamp: stampBox as TBox | null,
    };

    return { W, H, vis, fs, fence, wordBox, yc, cl, cr, wordC, T, walks, ring, ringC, ctaBox, stampPos, tag, chip, line, fill, stakes, pulse, mask, maskPath, ringLine, rmask, ringMaskPath, topoIn, fenceLine, fenceLast, lineInfo, boxes, lcpLine };
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
      // the lines arrived after the ground came up: let them come up rather than pop
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
  }

  // ── 4 · the entrance ──

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
  function rollOnce(at: number) {
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
      tl.add(el, kf, at, t, "linear");
      return t;
    };
    const d = roll(q(".hf-tag-strip"), TAG_ROW) ?? 0;
    roll(q(".hf-chip-strip"), CHIP_ROW);
    tl.at(at + d + 40, () => (rolling = false));
  }

  /** The button lands: opacity, and a 14 px rise on a spring with a touch of overshoot. */
  function ctaIn(at: number) {
    const w = q(".hf-cta-wrap");
    tl.add(w, op(0, 1), at, 260, "linear");
    tl.add(w, springFrames(0.56, (s) => ({ transform: `translateY(${(14 * (1 - s)).toFixed(2)}px)` })), at, 560, "linear");
  }

  /** The button's own fence: draws round it, closes solid, pings once, lets go. */
  function ctaFence(g: Geo, r0: number) {
    const ring = q(".hf-ring")!;
    const solid = q(".hf-ring-s")!;
    const ping = q(".hf-ring-p")!;
    const draw = phone ? 510 : 600;
    const closeAt = r0 + draw;
    if (phone) {
      tl.add(ring, [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }], r0, draw, EO, "both");
    } else {
      g.ringLine.setAttribute("mask", `url(#${id}-rm)`);
      tl.add(ring, op(0, 1), r0, 120, "linear", "both");
      tl.add(ring, [{ transform: "scale(1.045)" }, { transform: "none" }], r0, draw, EIO);
      tl.add(g.ringMaskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], r0, draw, EIO);
      tl.at(closeAt + 20, () => g.ringLine.removeAttribute("mask"));
    }
    // closed: solid, one ping out, then it releases (gone by +1.2 s): at rest one fence, round the words
    tl.add(solid, op(0, 1), closeAt, 140, "ease-out", "both");
    // (phones: the full-width button's fence already reaches the screen's edges, so it pings outward
    // top and bottom only and never runs off the screen)
    const pingTo = phone ? "scale(1.012, 1.32)" : "scale(1.16)";
    tl.add(ping, [{ opacity: 0.9, transform: "scale(1)" }, { opacity: 0, transform: pingTo }], closeAt, 600, "ease-out", "forwards");
    // (fill forwards: before they start, the earlier animations decide)
    tl.add(ring, op(1, 0), closeAt + 600, 600, "ease-in", "forwards");
    tl.add(solid, op(1, 0), closeAt + 600, 600, "ease-in", "forwards");
    // hand the ring back to CSS (hover / focus), once it has let go
    tl.at(closeAt + 1220, () => {
      for (const a of tl.anims) {
        const t = (a.effect as KeyframeEffect | null)?.target;
        if (t === ring || t === solid || t === ping) a.cancel();
      }
    });
  }

  function fadeUp(el: Element | null, at: number, dur = 620, dy = 10) {
    return tl.add(el, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: "none" }], at, dur, EO);
  }

  /**
   * The entrance (HERO_SPEC §5B): the headline masks in, the jobsite stakes itself out on the
   * words, Marcus stands on the fence, the button lands, the crew walk in and clock in, the
   * button's own fence closes once, the tag rolls once. Pieces an opening already delivered
   * ("given") show at rest from the first frame; `at` starts it part-way.
   */
  function entrance(g: Geo, eo: HeroEnterOpts): Promise<void> {
    started = true;
    const done = new Promise<void>((r) => (landed = r));
    root.classList.add("is-live");
    if (reduced) {
      // the final frame only (§5C): nothing moves; interactions still work, without tweening
      settle();
      markPageReady();
      return done;
    }
    busy = true;
    const A = tl.add.bind(tl);
    const m = (v: PieceMode | undefined, d: PieceMode = "play") => (v ?? d) === "play";
    const mk = (cid: string) => m(typeof eo.markers === "string" ? eo.markers : eo.markers?.[cid as CrewId]);
    const h1 = m(eo.h1);
    const words = m(eo.words, eo.h1);
    const fence = m(eo.fence);
    const tag = m(eo.tag);
    const sub = m(eo.sub);
    const cta = m(eo.cta);

    if (m(eo.ground)) {
      const ground = q(".hf-ground")!;
      ground.style.transformOrigin = `${g.wordC[0].toFixed(1)}px ${g.wordC[1].toFixed(1)}px`;
      A(ground, [{ opacity: 0, transform: "scale(1.03)" }, { opacity: 1, transform: "none" }], 0, 900, EO);
    }
    if (!phone && h1) fadeUp(q(".hf-eyebrow"), 40, 560, 8);
    // once every line has landed, the biggest line's box is rebuilt in place (.is-set: display
    // flow-root, which looks the same). Largest Contentful Paint files each text block once, at its
    // first paint; a line that first painted half-way into its slot would count at that size, so
    // the headline's biggest line is filed again, whole, the moment it lands (the page's LCP)
    const lcpLine = qa(".hf-line")[g.lcpLine];
    lcpLine?.classList.remove("is-set");
    let lineEnd = 0;
    // the sentence closes in on the jobsite: lines above drop in, the fenced line and those below rise
    qa(".hf-line-in").forEach((ln, i) => {
      const inFence = i >= g.fenceLine && i <= g.fenceLast;
      if (!(inFence ? words : h1)) return;
      const d = i < g.fenceLine ? g.fenceLine - i : i > g.fenceLast ? i - g.fenceLast : i - g.fenceLine;
      A(ln, [{ transform: `translateY(${i < g.fenceLine ? -122 : 122}%)` }, { transform: "none" }], d * 70, 540, EO);
      lineEnd = Math.max(lineEnd, d * 70 + 540);
    });
    tl.at(lineEnd + 30, () => lcpLine?.classList.add("is-set"));
    if (fence) {
      if (phone) {
        // transform and opacity only on phones (no stroke-dashoffset)
        A(q(".hf-fence"), [{ opacity: 0, transform: "scale(1.035)" }, { opacity: 1, transform: "none" }], 300, 520, EO);
      } else {
        g.line.setAttribute("mask", `url(#${id}-fm)`);
        A(g.maskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 300, 600, EIO);
        tl.at(920, () => g.line.removeAttribute("mask"));
        g.stakes.forEach((s, i) => A(s.dot, [{ transform: "scale(0)" }, { transform: "none" }], 560 + i * 34, 360, EPOP));
      }
    }
    // Marcus is already on site
    if (mk("mb")) A(q('.hf-mk[data-id="mb"]'), op(0, 1), 420, 360, "ease-out");
    if (!phone && m(eo.stamp, mk("mb") ? "play" : "given")) A(q('.hf-stamp[data-id="mb"]'), [{ opacity: 0 }, { opacity: 1 }], 700, 420, EO);
    if (sub) {
      fadeUp(q(".hf-sub"), 400, 600, 10);
      fadeUp(q(".hf-micro"), 800, 480, 6);
    }
    if ((phone || !g.tag) && tag) fadeUp(q(".hf-chip"), 520, 520, 6);
    if (cta) {
      ctaIn(600);
      fadeUp(q(".hf-demo"), 720, 480, 6);
    }
    if (m(eo.foot)) A(q(".hf-foot"), op(0, 1), 900, 600, "ease-out");
    if (g.tag && tag) {
      const tg = q(".hf-tag")!;
      tg.style.transformOrigin = "0 50%";
      A(tg, [{ opacity: 0, transform: `${tr(g.tag.x - 10, g.tag.y)} scale(0.94)` }, { opacity: 1, transform: tr(g.tag.x, g.tag.y) }], 980, 520, EO);
      A(q(".hf-tape"), op(0, 1), 900, 360, "ease-out");
      A(q(".hf-tag-note"), op(0, 1), 1150, 500, "ease-out");
    }
    // the crew walk in and clock in on the headline (phones: ER only)
    if (mk("er")) clockIn(g, "er", walkIn(g, "er", 900, phone ? 820 : 900), !phone);
    if (!phone && mk("jl")) clockIn(g, "jl", walkIn(g, "jl", 1250, 900), true);
    if (eo.ctaFence !== false) ctaFence(g, 1400);
    if (eo.roll !== false) rollOnce(3000);
    else rolling = false;
    // the first screen has landed once the button has: the rest of the page may start its work
    tl.at(cta ? 600 + CTA_LANDED : 0, markPageReady);
    tl.at(tl.end() + 120, settle);

    if (DEBUG) {
      (window as unknown as { __hero: unknown }).__hero = { seek: (ms: number) => tl.seek(ms), geo: g, timing };
      tl.seek(Math.max(0, eo.at ?? 0));
    } else {
      tl.play(Math.max(0, eo.at ?? 0), clamp(eo.speed ?? 1, 0.1, 10));
    }
    return done;
  }

  /** Everything has landed: the animations go, the inline rest state is the same frame. */
  function settle() {
    rolling = false;
    busy = false;
    tl.cancel();
    tl = new Timeline();
    if (G) rest(G);
    root.classList.add("is-settled");
    landed?.();
    landed = null;
    markFirstScreenDone();
  }

  /** Where everything is at rest, in viewport px (./opening.ts). */
  function targets(): HeroTargets {
    const g = G!;
    const R = root.getBoundingClientRect();
    const b = (x: TBox): TBox => ({ x: x.x + R.left, y: x.y + R.top, w: x.w, h: x.h });
    const pt = ([x, y]: Pt): Pt => [x + R.left, y + R.top];
    const markers: HeroTargets["markers"] = {};
    for (const c of crew) {
      const [x, y] = g.T[c.id];
      markers[c.id as CrewId] = { at: pt([x, y]), box: b({ x: x - 13, y: y - 13, w: 26, h: 26 }), initials: c.initials, time: c.time };
    }
    const row = HERO_JOBS.rows[0];
    return {
      phone,
      fence: g.fence.map(pt),
      words: b({ x: g.wordBox.x0, y: g.wordBox.y0, w: g.wordBox.x1 - g.wordBox.x0, h: g.wordBox.y1 - g.wordBox.y0 }),
      phrase: qa(".hf-fenced").map((e) => e.textContent).join(" "),
      markers,
      stamp: g.boxes.stamp ? b(g.boxes.stamp) : null,
      tag: g.tag ? b(g.tag) : null,
      chip: g.chip ? b(g.chip) : null,
      job: { name: row.job, today: row.today },
      lines: g.boxes.lines.map(b),
      fenceLines: [g.fenceLine, g.fenceLast],
      eyebrow: g.boxes.eyebrow ? b(g.boxes.eyebrow) : null,
      sub: b(g.boxes.sub),
      cta: b(g.boxes.cta),
      ctaRow: b(g.boxes.ctaRow),
      micro: b(g.boxes.micro),
      ctaFence: g.ring.map(pt),
    };
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
      const tapWords = () => {
        if (busy) return;
        pulseOnce();
        if (reduced) return;
        for (const c of crew) {
          const m = q(`.hf-mk[data-id="${c.id}"]`)!;
          m.querySelector(".hf-mk-i")!.animate([{ opacity: 1 }, { opacity: 0, offset: 0.15 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: 1500 });
          m.querySelector(".hf-mk-t")!.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500 });
        }
      };
      for (const ln of qa(".hf-line--fence")) on(ln, "click", tapWords);
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
  let offCtrl: (() => void) | null = null;
  let waitT = 0;
  (async () => {
    const inTime = await fontsReady(1600);
    if (!alive) return;
    fontsLate = !inTime && !fontsIn();
    G = place();
    rest(G);
    root.classList.add("is-laid");
    interact(G);
    offCtrl = registerHero({
      targets,
      enter: (eo) => (alive && G && !started ? entrance(G, eo) : Promise.resolve()),
      // One Day's hand-off: land whatever is still to come, at once
      land: () => {
        if (!alive || !busy) return;
        tl.flush();
        settle();
      },
    });
    heroLaidOut();
    if (!started) {
      if (heroEntered()) {
        // a remount (crossing 760 px): the hero has entered already, show its rest state
        started = true;
        root.classList.add("is-live");
        settle();
      } else if (openingOn() && !reduced) {
        // an opening is playing: wait for its heroEnter (./opening.ts), never forever
        waitT = window.setTimeout(() => void heroEnter(), OPENING_WAIT);
      } else void heroEnter();
    }
    // the ground's contours: built in slices once the headline's first frame is out (phones: once
    // the button has landed, so the entrance has the main thread to itself). With an opening, now:
    // the hero is hidden, so they are ready when the opening hands over
    if (started && !reduced) setTimeout(() => G && alive && drawTopo(G), phone ? 1000 : 60);
    else drawTopo(G);
    if (import.meta.env.DEV) devChecks();
  })();

  // re-place on a width change (debounced; phones ignore height-only resizes: the URL bar), and
  // once if the fonts arrived after the measuring race
  let rt = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  const replace = () => {
    if (!alive || !G) return;
    // mid-entrance: land everything at once, then measure again
    if (busy) {
      tl.flush();
      settle();
    }
    offs.splice(0).forEach((f) => f());
    G = place();
    rest(G);
    drawTopo(G);
    rolling = false;
    interact(G);
    heroLaidOut();
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
    offCtrl?.();
    clearTimeout(waitT);
    tl.cancel();
    landed?.();
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
