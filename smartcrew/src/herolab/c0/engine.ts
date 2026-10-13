// The hero's engine: measure the set type, build the ground and the fence, play the first seconds.
//
// Layout writes every element's REST state as inline style (so a resize, reduced motion or the
// end of the timeline all show the same frame); the timeline then plays WAAPI animations over it
// (fill: both), which are cancelled once everything has landed. Phones: transform + opacity only,
// on HTML layers (the SVGs inside never change), plays once, no per-frame JS. Desktop adds two
// short rAF pieces (the fence's stakes spring onto the words; the dashed lines draw) and the cursor
// (the ground drifts ±6 px, the fence closes when the pointer steps inside, stakes can be dragged).

import type { Angle } from "../../content/copy";
import { CREW, type AngleHero } from "./data";
import { contoursAsync, type Pt, type Rect, type TopoInput } from "./topo";
import { Walk, bbox, hexFence, inside, polyPath, polyPoints, walkEaseInv, walkFrames, type Box } from "./geom";

const NS = "http://www.w3.org/2000/svg";
const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)";
const EPOP = "cubic-bezier(0.34, 1.5, 0.64, 1)";

export type HeroOpts = {
  phone: boolean;
  intro: boolean;
  hero: AngleHero;
  angle: Angle;
  seek: number | null;
  onIntro?: () => void;
};

// ── a tiny timeline: WAAPI animations + a few rAF functions on one clock, seekable ───────

type Fn = { at: number; dur: number; f: (p: number) => void };
type Cb = { at: number; f: () => void; done?: boolean };

class Timeline {
  anims: Animation[] = [];
  fns: Fn[] = [];
  cbs: Cb[] = [];
  private raf = 0;
  private t0 = 0;
  private stopped = false;
  add(el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, easing = EO, fill: FillMode = "both") {
    if (!el) return null;
    const a = el.animate(kf, { delay: at, duration: dur, easing, fill });
    this.anims.push(a);
    return a;
  }
  fn(at: number, dur: number, f: (p: number) => void) {
    this.fns.push({ at, dur, f });
  }
  at(at: number, f: () => void) {
    this.cbs.push({ at, f });
  }
  play() {
    this.t0 = performance.now();
    const loop = () => {
      if (this.stopped) return;
      const t = performance.now() - this.t0;
      let busy = false;
      for (const fn of this.fns) {
        if (t >= fn.at && t <= fn.at + fn.dur + 40) fn.f(Math.min(1, (t - fn.at) / fn.dur));
        if (t < fn.at + fn.dur + 40) busy = true;
      }
      for (const cb of this.cbs) {
        if (!cb.done && t >= cb.at) {
          cb.done = true;
          cb.f();
        }
        if (!cb.done) busy = true;
      }
      if (busy && !this.stopped) this.raf = requestAnimationFrame(loop);
    };
    // fns before their start get their first frame now (the stakes at their night positions)
    for (const fn of this.fns) fn.f(0);
    this.raf = requestAnimationFrame(loop);
  }
  seek(ms: number) {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    for (const a of this.anims) {
      a.pause();
      a.currentTime = ms;
    }
    for (const fn of this.fns) fn.f(Math.max(0, Math.min(1, (ms - fn.at) / fn.dur)));
  }
  cancel() {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────

const px = (n: number) => `${n.toFixed(1)}px`;
const tr = (x: number, y: number) => `translate(${px(x)}, ${px(y)})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}

function fontsReady(ms: number) {
  const f = document.fonts;
  if (!f) return Promise.resolve();
  const loads = Promise.all([
    f.load('700 96px "SmartCrew Display"', "See what every job"),
    f.load('400 16px "SmartCrew Text"', "GPS fills"),
    f.load('600 16px "SmartCrew Text"', "GPS fills"),
  ]).then(() => f.ready);
  return Promise.race([loads, new Promise((r) => setTimeout(r, ms))]);
}

/** The spring the stakes ride on (k 170, c 19: a touch of overshoot), as a lookup over 1.2 s. */
const SPRING = (() => {
  const out: number[] = [];
  let x = 0;
  let v = 0;
  const dt = 1 / 240;
  for (let i = 0; i <= 240 * 1.2; i++) {
    if (i % 4 === 0) out.push(x);
    const a = 170 * (1 - x) - 19 * v;
    v += a * dt;
    x += v * dt;
  }
  return (t: number) => {
    const s = clamp(t, 0, 1.2) * 60;
    const i = Math.floor(s);
    const f = s - i;
    return i >= out.length - 1 ? 1 : out[i] + (out[i + 1] - out[i]) * f;
  };
})();

let uid = 0;

// ── the engine ──────────────────────────────────────────────────────────────────────────

export function mountHero(root: HTMLElement, o: HeroOpts): () => void {
  const id = `hl0-${++uid}`;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T | null;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll(s)] as T[];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = o.phone;
  let alive = true;
  let tl = new Timeline();
  let G: Geo | null = null;
  const offs: (() => void)[] = [];
  let flagIdx = 0;
  let flagBusy = true;
  let chipIdx = 0;

  type Geo = NonNullable<ReturnType<typeof layout>>;

  /** fit + layout; a desktop too narrow for the tag swaps in the chip and fits again */
  function place(): Geo {
    root.classList.remove("no-flag");
    fit();
    const g = layout();
    if (g) return g;
    fit();
    return layout()!;
  }

  // ── 1 · fit the headline to the screen ──
  function fit() {
    const h1 = q(".hl0-h1")!;
    const copy = q(".hl0-copy")!;
    root.style.removeProperty("--fs");
    root.style.removeProperty("--copy-top");
    const cur = parseFloat(getComputedStyle(h1).fontSize);
    const lines = qa(".hl0-line-in");
    const W = root.clientWidth;
    const g = phone ? 16 : clamp(W * 0.04, 20, 64);
    const avail = W - 2 * g;
    let fsW = Infinity;
    for (const ln of lines) {
      const w = ln.offsetWidth || 1;
      const extra = ln.querySelector(".hl0-fenced") ? (phone ? 2 * (12 + 40 + 4) : 2 * (16 + 46 + 12 + 54 + 8)) : 0;
      fsW = Math.min(fsW, ((avail - extra) * cur) / w);
    }
    const n = lines.length;
    const lh = 0.98;
    let fsH: number;
    const R = root.getBoundingClientRect();
    if (phone) {
      const cta = q(".hl0-cta-wrap")!.getBoundingClientRect();
      const vis = Math.min(window.innerHeight, 900);
      fsH = (vis - 10 - (cta.bottom - R.top - h1.offsetHeight)) / (n * lh);
    } else {
      const footTop = q(".hl0-foot")!.getBoundingClientRect().top - R.top;
      const room = footTop - 22 - 70 - (copy.offsetHeight - h1.offsetHeight);
      fsH = room / (n * lh);
    }
    const fs = clamp(Math.min(fsW, fsH), phone ? 32 : 44, phone ? 54 : 124);
    root.style.setProperty("--fs", `${fs.toFixed(2)}px`);
    if (!phone) {
      const footTop = q(".hl0-foot")!.getBoundingClientRect().top - R.top;
      const space = footTop - 22 - 70 - copy.offsetHeight;
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

    // ink metrics of the display face (the DOM boxes are the font's ascent/descent, not the ink)
    const h1 = q(".hl0-h1")!;
    const fs = parseFloat(getComputedStyle(h1).fontSize);
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `700 ${fs}px "SmartCrew Display", "SmartCrew Display Fallback", sans-serif`;
    const ink = (s: string) => {
      const m = ctx.measureText(s);
      return { asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
    };

    const lineBoxes: Rect[] = [];
    let fenceLine = -1;
    let wordBox: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const lineInfo: { x0: number; x1: number; top: number; bot: number; base: number }[] = [];
    qa(".hl0-line-in").forEach((ln, i) => {
      const r = rel(ln.getBoundingClientRect());
      const base = rel(ln.querySelector(".hl0-base")!.getBoundingClientRect()).y;
      const m = ink(ln.textContent || "");
      const top = base - m.asc;
      const bot = base + m.desc;
      lineInfo.push({ x0: r.x, x1: r.x + r.w, top, bot, base });
      lineBoxes.push({ x: r.x - 6, y: top - 4, w: r.w + 12, h: bot - top + 8, r: 12 });
      const fz = ln.querySelector(".hl0-fenced");
      if (fz) {
        fenceLine = i;
        const fr = rel(fz.getBoundingClientRect());
        const fm = ink(fz.textContent || "");
        wordBox = { x0: fr.x + 1, x1: fr.x + fr.w - 1, y0: base - fm.asc, y1: base + fm.desc };
      }
    });

    // the fence round the words
    const clear: [number, number] = phone ? [12, 9] : [16, 13];
    const point = phone ? 40 : 46;
    const fence = hexFence(wordBox, { clear, point, inset: phone ? 6 : 9, jitter: phone ? 0.5 : 1 });
    const yc = (wordBox.y0 + wordBox.y1) / 2;
    const cl = wordBox.x0 - clear[0];
    const cr = wordBox.x1 + clear[0];
    const wordC: Pt = [(fence[0][0] + fence[3][0]) / 2, yc];

    // crew: parked inside the fence's points
    const T: Record<string, Pt> = phone
      ? { mb: [cr + 12, yc], er: [cl - 12, yc], jl: [cl - 12, yc], aw: [cr + 12, yc] }
      : { mb: [cr + 4, yc - 14], aw: [cr + 4, yc + 15], er: [cl - 4, yc - 14], jl: [cl - 4, yc + 15] };
    const walks: Record<string, Walk> = phone
      ? {
          mb: new Walk([[[W + 30, yc + 80], [W - 4, yc + 66], [T.mb[0] + 30, T.mb[1] + 8], T.mb]]),
          er: new Walk([[[-30, yc + 150], [8, yc + 120], [T.er[0] - 34, T.er[1] + 10], T.er]]),
          jl: new Walk([[[-30, yc + 150], [8, yc + 120], [T.er[0] - 34, T.er[1] + 10], T.er]]),
          aw: new Walk([[[W + 30, yc + 150], [W - 8, yc + 120], [T.aw[0] + 34, T.aw[1] + 10], T.aw]]),
        }
      : {
          mb: new Walk([[[W + 40, yc - 190], [W - 220, yc - 150], [T.mb[0] + 210, T.mb[1]], T.mb]]),
          er: new Walk([[[-40, yc - 200], [200, yc - 170], [T.er[0] - 240, T.er[1]], T.er]]),
          jl: new Walk([[[-40, yc + 230], [180, yc + 200], [T.jl[0] - 230, T.jl[1] + 6], T.jl]]),
          aw: new Walk([[[W + 40, yc + 240], [W - 200, yc + 210], [T.aw[0] + 230, T.aw[1] + 6], T.aw]]),
        };

    // the night: the intro's last frame (its jobsite, label, Marcus, the three notifications)
    const NIGHT: Pt[] = [
      [962, 508],
      [978, 392],
      [1148, 362],
      [1238, 428],
      [1220, 548],
      [1062, 580],
    ];
    const nS = phone ? 0.86 : 1.3;
    const nC: Pt = phone ? [W * 0.5, vis * 0.54] : [W * 0.6, H * 0.52];
    const night: Pt[] = NIGHT.map(([x, y]) => [nC[0] + (x - 1100) * nS, nC[1] + (y - 471) * nS]);
    const mbNight: Pt = [night[0][0] + (night[3][0] - night[0][0]) * 0.8, night[2][1] + (night[4][1] - night[2][1]) * 0.42];

    // the CTA's ring (the button's own box, before any lift)
    const ctaEl = q(".hl0-cta")!;
    const cb = rel(ctaEl.getBoundingClientRect());
    const ctaBox: Box = { x0: cb.x, y0: cb.y, x1: cb.x + cb.w, y1: cb.y + cb.h };
    const ring = hexFence(ctaBox, { clear: phone ? [5, 7] : [9, 9], point: phone ? 8 : 24, inset: phone ? 6 : 10, jitter: 0.4 });
    const ringC: Pt = [(ctaBox.x0 + ctaBox.x1) / 2, (ctaBox.y0 + ctaBox.y1) / 2];

    // ── write the SVG layers ──
    const sizeLayer = (el: HTMLElement | null) => {
      if (!el) return null;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      el.textContent = "";
      return svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, el);
    };

    const fenceSvg = sizeLayer(q(".hl0-fence"))!;
    const defs = svgEl("defs", {}, fenceSvg);
    const mask = svgEl("mask", { id: `${id}-fm`, maskUnits: "userSpaceOnUse", x: -50, y: -50, width: W + 100, height: H + 100 }, defs);
    const maskPath = svgEl("path", { d: polyPath(fence), fill: "none", stroke: "#fff", "stroke-width": 14, pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 0, "stroke-linejoin": "round" }, mask);
    const fill = svgEl("polygon", { class: "hl0-fence-fill", points: polyPoints(fence) }, fenceSvg);
    const line = svgEl("polygon", { class: "hl0-fence-line", points: polyPoints(fence) }, fenceSvg);
    const handles = fence.map(([x, y], i) => {
      const g = svgEl("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, fenceSvg);
      const s = phone ? 6 : 7;
      const r = svgEl("rect", { class: "hl0-handle hl0-handle-g", x: -s / 2, y: -s / 2, width: s, height: s }, g);
      if (!phone) svgEl("rect", { class: "hl0-handle-hit", x: -12, y: -12, width: 24, height: 24, "data-v": i, "data-cursor": "link" }, g);
      return { g, r };
    });
    // phones show four stakes (the points and the top corners): enough to read as the editor
    if (phone) [4, 5].forEach((i) => handles[i].g.setAttribute("display", "none"));

    const pulseSvg = sizeLayer(q(".hl0-pulse"))!;
    const pulse = svgEl("polygon", { class: "hl0-pulse-line", points: polyPoints(fence) }, pulseSvg);

    const nfenceEl = q(".hl0-nfence");
    if (phone && o.intro && nfenceEl) {
      const s = sizeLayer(nfenceEl)!;
      svgEl("polygon", { class: "hl0-pulse-line", points: polyPoints(night), style: "stroke-width:3" }, s);
    } else if (nfenceEl) nfenceEl.textContent = "";

    const ringSvg = sizeLayer(q(".hl0-ring"))!;
    const rdefs = svgEl("defs", {}, ringSvg);
    const rmask = svgEl("mask", { id: `${id}-rm`, maskUnits: "userSpaceOnUse", x: -50, y: -50, width: W + 100, height: H + 100 }, rdefs);
    const ringMaskPath = svgEl("path", { d: polyPath([...ring.slice(2), ...ring.slice(0, 2)]), fill: "none", stroke: "#fff", "stroke-width": 12, pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 0 }, rmask);
    const ringLine = svgEl("polygon", { class: "hl0-ring-line", points: polyPoints(ring) }, ringSvg);
    const ringSSvg = sizeLayer(q(".hl0-ring-s"))!;
    svgEl("polygon", { class: "hl0-ring-solid", points: polyPoints(ring) }, ringSSvg);
    for (const el of [q(".hl0-ring"), q(".hl0-ring-s")]) el!.style.transformOrigin = `${ringC[0]}px ${ringC[1]}px`;

    // ── desktop: stamps, the tally, the flag and its tape ──
    const stampPos: Record<string, Pt> = {};
    let tallyPos: Pt = [0, 0];
    let flag: { x: number; y: number; w: number; h: number } | null = null;
    let flagShown = false;
    if (!phone) {
      for (const c of CREW) {
        const s = q(`.hl0-stamp[data-id="${c.id}"]`)!;
        const w = s.offsetWidth;
        const left = c.id === "er" || c.id === "jl";
        const x = left ? fence[0][0] - 12 - w : fence[3][0] + 12;
        stampPos[c.id] = [x, T[c.id][1] - 7.5];
      }
      const tally = q(".hl0-tally")!;
      const tw = tally.offsetWidth;
      tallyPos = [Math.min(stampPos.er[0], stampPos.jl[0]) - 22 - tw, T.er[1] - 7];

      // the flag: in the right margin, beside the line above the fence, tied to the top-right stake
      const fl = q(".hl0-flag")!;
      let fw = 0;
      qa(".hl0-flag-row").forEach((r) => {
        for (const c of [...r.children] as HTMLElement[]) fw = Math.max(fw, c.scrollWidth);
      });
      fw = clamp(fw + 30 + 16, 176, 280);
      root.style.setProperty("--flag-w", `${fw}px`);
      const above = lineInfo[fenceLine - 1] ?? lineInfo[fenceLine];
      const fx0 = Math.max(fence[3][0] + 36, (fenceLine > 0 ? above.x1 : 0) + 52);
      const fy0 = (fenceLine > 0 ? (above.top + above.bot) / 2 : fence[2][1] - 60) - 31;
      const fits = fx0 + fw <= W - 14 && fy0 > 60;
      // no room for the tag in the margin: the job chip goes under the headline instead (re-fit)
      if (!fits && !root.classList.contains("no-flag")) {
        root.classList.add("no-flag");
        return null;
      }
      flagShown = fits && !root.classList.contains("no-flag");
      flag = { x: fx0, y: fy0, w: fw, h: 62 };
      fl.style.display = flagShown ? "" : "none";
      q(".hl0-flag-note")!.style.display = flagShown ? "" : "none";
      // the tag: a chamfered left end with an eyelet
      const bg = q<SVGSVGElement>(".hl0-flag-bg")!;
      bg.setAttribute("viewBox", `0 0 ${fw} 62`);
      bg.setAttribute("width", String(fw));
      bg.setAttribute("height", "62");
      bg.innerHTML = `<path d="M18 .5H${fw - 10.5}a10 10 0 0 1 10 10v41a10 10 0 0 1-10 10H18L.5 44V18Z"/><circle cx="13" cy="31" r="3.6"/>`;
      // the tape: from the top-right stake to the eyelet, with a little sag
      const tapeSvg = sizeLayer(q(".hl0-tape"))!;
      const a = fence[2];
      const b: Pt = [fx0 + 13, fy0 + 31];
      const mx = (a[0] + b[0]) / 2;
      const my = Math.max(a[1], b[1]) + 10;
      svgEl("path", { class: "hl0-tape", d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}` }, tapeSvg);
      svgEl("circle", { class: "hl0-tape-knot", cx: b[0].toFixed(1), cy: b[1].toFixed(1), r: 2.2 }, tapeSvg);
      q(".hl0-tape")!.style.display = flagShown ? "" : "none";
    }

    // ── the ground: the copy is the landform ──
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
      if (!el) return [];
      const b = rel(el.getBoundingClientRect());
      return [{ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2, r }];
    };
    const rects: Rect[] = [
      ...textRects(q(".hl0-eyebrow"), 8),
      ...lineBoxes,
      ...(phone || root.classList.contains("no-flag") ? boxOf(q(".hl0-chip"), 6) : []),
      ...textRects(q(".hl0-sub"), 8),
      ...boxOf(q(".hl0-cta-wrap"), 10, 22),
      ...boxOf(q(".hl0-demo"), 4),
      ...textRects(q(".hl0-micro"), 6),
      ...(phone || root.classList.contains("no-flag") ? textRects(q(".hl0-phone-note"), 6) : []),
    ];
    if (flag && flagShown) rects.push({ x: flag.x - 4, y: flag.y - 4, w: flag.w + 8, h: flag.h + 44, r: 14 });
    const topoIn: TopoInput = {
      W,
      H,
      step: phone ? 7 : 7,
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
      levels: 16,
      tilt: [1.2, -0.8],
    };
    const topoSvg = q<SVGSVGElement>(".hl0-topo svg")!;
    topoSvg.setAttribute("width", String(W));
    topoSvg.setAttribute("height", String(H));
    topoSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // night map
    let label = { x: 0, y: 0, w: 0, h: 0 };
    let nightIn: TopoInput | null = null;
    if (o.intro) {
      const nm = q(".hl0-night-map")!;
      nm.style.width = `${W}px`;
      nm.style.height = `${H}px`;
      const ns = nm.querySelector("svg")!;
      ns.setAttribute("width", String(W));
      ns.setAttribute("height", String(H));
      nightIn = {
        W,
        H,
        step: phone ? 8 : 8,
        rects: [],
        terrainOnly: true,
        amp: 3.4,
        scale: phone ? 200 : 260,
        seed: 4,
        levels: 9,
        major: 4,
        bumps: [
          { x: nC[0], y: nC[1], r: phone ? 120 : 170, h: 2.4 },
          { x: W * 0.12, y: H * 0.2, r: 90, h: 1.8 },
        ],
      };
      ns.querySelector(".zone")!.setAttribute("points", polyPoints(night));
      const lab = q(".hl0-night-label")!;
      const lw = lab.offsetWidth;
      const lh = lab.offsetHeight;
      label = phone ? { x: night[1][0] - 6, y: night[2][1] - 40, w: lw, h: lh } : { x: night[1][0] - 22 - lw, y: night[1][1] - lh / 2, w: lw, h: lh };
      lab.style.transform = tr(label.x, label.y);
      // the notifications at their places
      const nw = phone ? 300 : 324;
      const place: Record<string, Pt> = phone
        ? { load: [(W - nw) / 2, 64], clockin: [(W - nw) / 2, 134], profit: [(W - nw) / 2, night[5][1] + 22] }
        : { clockin: [mbNight[0] + 34, mbNight[1] - 32], load: [W * 0.1, H * 0.1], profit: [nC[0] - nw * 0.92, night[5][1] + 18] };
      for (const k in place) {
        const n = q(`.hl0-note[data-note="${k}"]`)!;
        n.style.transform = tr(place[k][0], place[k][1]);
        n.style.opacity = "1";
      }
    }

    return { W, H, vis, fs, fence, wordBox, yc, cl, cr, wordC, T, walks, night, nC, mbNight, ring, ringC, ctaBox, stampPos, tallyPos, flag, flagShown, label, line, fill, handles, pulse, mask, maskPath, ringLine, rmask, ringMaskPath, topoIn, nightIn, fenceLine };
  }

  // the contours: built in slices after the first frame (the ground fades in anyway)
  let topoJobs: { cancel: () => void }[] = [];
  const timing: Record<string, number> = {};
  function drawTopo(g: Geo) {
    topoJobs.forEach((j) => j.cancel());
    topoJobs = [];
    const t0 = performance.now();
    const day = contoursAsync(g.topoIn);
    topoJobs.push(day);
    day.done.then((t) => {
      const svg = q<SVGSVGElement>(".hl0-topo svg")!;
      svg.querySelector(".mi")!.setAttribute("d", t.minor);
      svg.querySelector(".ma")!.setAttribute("d", t.major);
      timing.topoDay = performance.now() - t0;
    });
    if (g.nightIn) {
      const night = contoursAsync(g.nightIn);
      topoJobs.push(night);
      night.done.then((t) => {
        const ns = q(".hl0-night-map svg")!;
        ns.querySelector(".mi")!.setAttribute("d", t.minor);
        ns.querySelector(".ma")!.setAttribute("d", t.major);
        timing.topoNight = performance.now() - t0;
      });
    }
  }

  // ── 3 · the rest state, as inline style ──
  function rest(g: Geo) {
    for (const c of CREW) {
      const m = q(`.hl0-mk[data-id="${c.id}"]`)!;
      const p = g.T[c.id];
      const show = phone ? c.id === "mb" || c.id === "er" : true;
      m.style.display = show ? "" : "none";
      m.style.transform = tr(p[0] - 13, p[1] - 13);
      (m.querySelector(".hl0-mk-dot") as HTMLElement).style.opacity = "1";
      const s = q(`.hl0-stamp[data-id="${c.id}"]`);
      if (s) {
        s.style.transform = tr(g.stampPos[c.id][0], g.stampPos[c.id][1]);
        s.style.opacity = "1";
      }
    }
    const tally = q(".hl0-tally");
    if (tally) {
      tally.style.transform = tr(g.tallyPos[0], g.tallyPos[1]);
      tally.style.opacity = "1";
      (q(".hl0-odo-in") as HTMLElement).style.transform = `translateY(-${(CREW.length - 1) * 1.15}em)`;
    }
    const fl = q(".hl0-flag");
    flagIdx = o.hero.flag.length - 1;
    if (fl && g.flag) {
      fl.style.transform = tr(g.flag.x, g.flag.y);
      q(".hl0-flag-strip")!.style.transform = `translateY(${-46 * flagIdx}px)`;
      const note = q(".hl0-flag-note")!;
      note.style.transform = tr(g.flag.x + 16, g.flag.y + g.flag.h + 8);
      note.style.opacity = "1";
    }
    chipIdx = o.hero.chip.length - 1;
    const strip = q(".hl0-chip-strip");
    if (strip) strip.style.transform = `translateY(${-28 * chipIdx}px)`;
    q(".hl0-ring")!.style.opacity = phone ? "0" : "1";
    g.line.removeAttribute("mask");
    g.ringLine.removeAttribute("mask");
    root.dataset.intro = "0";
  }

  // ── 4 · the first seconds ──
  function choreograph(g: Geo) {
    const A = tl.add.bind(tl);
    const intro = o.intro;
    const h = intro ? (phone ? 900 : 1150) : 0; // the hand-off starts here
    const op = (a: number, b: number): Keyframe[] => [{ opacity: a }, { opacity: b }];
    const fadeUp = (el: Element | null, at: number, dur = 620, dy = 10) => A(el, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: "none" }], at, dur, EO);
    const lineIns = qa(".hl0-line-in");
    const fenced = q(".hl0-fenced")!;
    const crossings: { t: number; id: string }[] = [];
    let count = 1;
    const tallySteps: { t: number; n: number }[] = [];

    // a crew member walks in and clocks in on the headline
    const walk = (cid: string, at: number, dur: number) => {
      const m = q(`.hl0-mk[data-id="${cid}"]`)!;
      const w = g.walks[cid];
      A(m, walkFrames(w), at, dur, "linear");
      const tc = at + dur * walkEaseInv(w.entry(g.fence));
      crossings.push({ t: tc, id: cid });
      return tc;
    };
    const clockIn = (cid: string, tc: number) => {
      const m = q(`.hl0-mk[data-id="${cid}"]`)!;
      A(q(".hl0-pulse"), [{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], tc, 620, "ease-out", "none");
      A(m.querySelector(".hl0-mk-ring"), [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.18)", offset: 0.3 }, { opacity: 0, transform: "scale(1)" }], tc, 760, "ease-out");
      A(m.querySelector(".hl0-mk-dot"), [{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "none" }], tc + 120, 320, EPOP);
      if (phone) {
        A(m.querySelector(".hl0-mk-i"), [{ opacity: 1 }, { opacity: 0, offset: 0.12 }, { opacity: 0, offset: 0.88 }, { opacity: 1 }], tc + 60, 1500, "linear");
        A(m.querySelector(".hl0-mk-t"), [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], tc + 60, 1500, "linear");
      } else {
        const s = q(`.hl0-stamp[data-id="${cid}"]`)!;
        const [sx, sy] = g.stampPos[cid];
        const dx = cid === "er" || cid === "jl" ? 8 : -8;
        A(s, [{ opacity: 0, transform: tr(sx + dx, sy) }, { opacity: 1, transform: tr(sx, sy) }], tc + 80, 420, EO);
        if (cid !== "mb") {
          count++;
          tallySteps.push({ t: tc + 140, n: count });
        }
      }
    };

    // the ground
    const topo = q(".hl0-topo")!;
    topo.style.transformOrigin = `${g.wordC[0] + 12}px ${g.wordC[1] + 12}px`;

    if (intro) {
      // ── the intro's last frame, held a beat, then ONE move into the day ──
      const nightEl = q(".hl0-night")!;
      const mb = q('.hl0-mk[data-id="mb"]')!;
      const [mx, my] = g.mbNight;
      const [dx, dy] = g.T.mb;
      A(mb, [{ transform: tr(mx - 13, my - 13) }, { transform: tr(dx - 13, dy - 13) }], h, phone ? 620 : 760, EIO);
      A(mb.querySelector(".hl0-mk-ring"), op(1, 0), h + 120, 420, "ease-out");
      A(mb.querySelector(".hl0-mk-dot"), op(0, 1), h + 420, 300, "ease-out");
      // the day breaks over the jobsite and spreads to the edges; the day's layers sit above the
      // night (ink on the dark ground is invisible), so each shows the moment the light reaches it
      const S = Math.hypot(g.W, Math.max(g.vis, 1)) * 2.5;
      const D = 180;
      const mid: Pt = [g.nC[0] + (g.wordC[0] - g.nC[0]) * 0.35, g.nC[1] + (g.wordC[1] - g.nC[1]) * 0.35];
      A(
        q(".hl0-dawn"),
        [
          { transform: `translate(${px(g.nC[0] - D)}, ${px(g.nC[1] - D)}) scale(0)` },
          { transform: `translate(${px(mid[0] - D)}, ${px(mid[1] - D)}) scale(${((phone ? 760 : 1000) / 360).toFixed(3)})`, offset: 0.34 },
          { transform: `translate(${px(g.wordC[0] - D)}, ${px(g.wordC[1] - D)}) scale(${(S / 360).toFixed(3)})` },
        ],
        h,
        phone ? 720 : 860,
        "cubic-bezier(0.42, 0, 0.62, 1)",
      );
      A(nightEl.querySelector(".hl0-night-bg"), op(1, 0), h + (phone ? 640 : 760), 160, "linear");
      // the camera pushes in on the jobsite and pans to the words
      const k = 2.4;
      A(
        q(".hl0-night-map"),
        [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { transform: `translate(${px(g.wordC[0] - g.nC[0] * k)}, ${px(g.wordC[1] - g.nC[1] * k)}) scale(${k})`, opacity: 0 }],
        h,
        phone ? 640 : 760,
        EIO,
      );
      A(topo, [{ opacity: 0, transform: "scale(0.86)" }, { opacity: 1, transform: "none" }], h + 60, phone ? 640 : 780, EO);
      A(q(".hl0-night-logo"), op(1, 0), h + 60, 420, "ease-out");
      A(q(".hl0-head"), op(0, 1), h + 260, 420, "ease-out");
      // the label becomes the words
      const lab = q(".hl0-night-label")!;
      A(lab, op(1, 0), h, 260, "ease-out");
      const fr = fenced.getBoundingClientRect();
      const R = root.getBoundingClientRect();
      const wx = fr.left - R.left;
      const wy = fr.top - R.top;
      const s = g.label.w / fr.width;
      const tx = g.label.x + g.label.w / 2 - (fr.width * s) / 2 - wx;
      const ty = g.label.y + g.label.h / 2 - (fr.height * s) / 2 - wy;
      A(fenced, [{ transform: `translate(${px(tx)}, ${px(ty)}) scale(${s.toFixed(4)})` }, { transform: "none" }], h, phone ? 640 : 760, EIO);
      A(fenced, [{ opacity: 0 }, { opacity: 1 }], h + 40, 240, "ease-out");
      // the notifications: the clock-in folds into Marcus, the load leaves, the profit becomes the flag
      const ci = q('.hl0-note[data-note="clockin"]')!;
      const cir = ci.getBoundingClientRect();
      ci.style.transformOrigin = `${mx - (cir.left - R.left)}px ${my - (cir.top - R.top)}px`;
      const ciT = ci.style.transform;
      A(ci, [{ transform: ciT, opacity: 1 }, { transform: `${ciT} scale(0.08)`, opacity: 0 }], h, 380, EIO);
      A(q('.hl0-note[data-note="load"]'), op(1, 0), h, 280, "ease-out");
      const pc = q('.hl0-note[data-note="profit"]')!;
      const pcr = pc.getBoundingClientRect();
      A(pc, op(1, 0), h + 60, 220, "ease-out");
      if (!phone && g.flag && g.flagShown) {
        const fl = q(".hl0-flag")!;
        const sc = pcr.width / g.flag.w;
        const fx = pcr.left - R.left + pcr.width / 2 - (g.flag.w * sc) / 2;
        const fy = pcr.top - R.top + pcr.height / 2 - (g.flag.h * sc) / 2;
        A(fl, [{ transform: `${tr(fx, fy)} scale(${sc.toFixed(3)})`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: tr(g.flag.x, g.flag.y), opacity: 1 }], h, 820, EIO);
        A(q(".hl0-tape"), op(0, 1), h + 700, 320, "ease-out");
      } else {
        const chip = q(".hl0-chip");
        if (chip) {
          const cr = chip.getBoundingClientRect();
          const sc = pcr.width / cr.width;
          const cx = pcr.left + pcr.width / 2 - (cr.left + cr.width / 2);
          const cy = pcr.top + pcr.height / 2 - (cr.top + cr.height / 2);
          A(chip, [{ transform: `translate(${px(cx)}, ${px(cy)}) scale(${sc.toFixed(3)})`, opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: "none", opacity: 1 }], h, 680, EIO);
        }
      }
      // the fence re-stakes itself round the words
      if (phone) {
        const nf = q(".hl0-nfence")!;
        const nb = bbox(g.night);
        const db = bbox(g.fence);
        const sx = (db.x1 - db.x0) / (nb.x1 - nb.x0);
        const sy = (db.y1 - db.y0) / (nb.y1 - nb.y0);
        nf.style.transformOrigin = "0 0";
        A(nf, [{ transform: "none", opacity: 1 }, { opacity: 1, offset: 0.55 }, { transform: `translate(${px(db.x0 - nb.x0 * sx)}, ${px(db.y0 - nb.y0 * sy)}) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, opacity: 0 }], h, 620, EIO);
        A(q(".hl0-fence"), op(0, 1), h + 340, 280, "ease-out");
      } else {
        const from = g.night;
        const to = g.fence;
        const set = (pts: Pt[]) => {
          const s = polyPoints(pts);
          g.line.setAttribute("points", s);
          g.fill.setAttribute("points", s);
          g.pulse.setAttribute("points", s);
          pts.forEach(([x, y], i) => g.handles[i].g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`));
        };
        g.line.removeAttribute("mask");
        tl.fn(h, 1250, (p) => {
          const ms = p * 1250;
          set(
            from.map(([x, y], i) => {
              const e = SPRING((ms - i * 26) / 1000);
              return [x + (to[i][0] - x) * e, y + (to[i][1] - y) * e] as Pt;
            }),
          );
          // closed solid at night, dashed by day
          const d = clamp((ms - 260) / 420, 0, 1);
          if (p >= 1) {
            g.line.style.removeProperty("stroke-dasharray");
            g.line.style.removeProperty("stroke-width");
          } else {
            g.line.style.strokeDasharray = `${(17 - 7 * d).toFixed(2)} ${(7 * d).toFixed(2)}`;
            g.line.style.strokeWidth = `${3 - d}`;
          }
        });
        g.handles.forEach((hd, i) => A(hd.r, [{ transform: "scale(0)" }, { transform: "none" }], h + 560 + i * 34, 380, EPOP));
      }
      // the rest of the headline masks in, line by line
      // (lines above the fence drop in, lines below rise: the sentence closes in on the jobsite)
      lineIns.forEach((ln, i) => {
        if (i === g.fenceLine) return;
        const d = Math.abs(i - g.fenceLine);
        A(ln, [{ transform: `translateY(${i < g.fenceLine ? -112 : 112}%)` }, { transform: "none" }], h + 420 + d * 70, 680, EO);
      });
      fadeUp(q(".hl0-eyebrow"), h + 470, 600, 8);
      if (!phone) A(q('.hl0-stamp[data-id="mb"]'), [{ opacity: 0, transform: tr(g.stampPos.mb[0] - 6, g.stampPos.mb[1]) }, { opacity: 1, transform: tr(g.stampPos.mb[0], g.stampPos.mb[1]) }], h + 620, 420, EO);
      // crew
      if (phone) clockIn("er", walk("er", h + 820, 860));
      else {
        clockIn("er", walk("er", h + 950, 900));
        clockIn("jl", walk("jl", h + 1150, 900));
      }
    } else {
      // ── no intro (second visit): the jobsite stakes itself out on the words ──
      A(topo, [{ opacity: 0, transform: "scale(1.03)" }, { opacity: 1, transform: "none" }], 0, 900, EO);
      A(q(".hl0-head"), op(0, 1), 0, 500, "ease-out");
      fadeUp(q(".hl0-eyebrow"), 60, 600, 8);
      lineIns.forEach((ln, i) => {
        const d = Math.abs(i - g.fenceLine);
        A(ln, [{ transform: `translateY(${i < g.fenceLine ? -112 : 112}%)` }, { transform: "none" }], 100 + d * 90, 700, EO);
      });
      if (phone) {
        q(".hl0-fence")!.style.transformOrigin = `${g.wordC[0]}px ${g.wordC[1]}px`;
        A(q(".hl0-fence"), [{ opacity: 0, transform: "scale(1.035)" }, { opacity: 1, transform: "none" }], 520, 520, EO);
      } else {
        g.line.setAttribute("mask", `url(#${id}-fm)`);
        A(g.maskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 540, 620, EIO);
        tl.at(1200, () => g.line.removeAttribute("mask"));
        g.handles.forEach((hd, i) => A(hd.r, [{ transform: "scale(0)" }, { transform: "none" }], 540 + i * 95, 360, EPOP));
      }
      clockIn("mb", walk("mb", 700, phone ? 820 : 900));
      if (phone) clockIn("er", walk("er", 900, 860));
      else {
        clockIn("er", walk("er", 980, 900));
        clockIn("jl", walk("jl", 1180, 900));
      }
      if (!phone && g.flag && g.flagShown) {
        const fl = q(".hl0-flag")!;
        fl.style.transformOrigin = "0 50%";
        A(fl, [{ opacity: 0, transform: `${tr(g.flag.x - 10, g.flag.y)} scale(0.94)` }, { opacity: 1, transform: tr(g.flag.x, g.flag.y) }], 1250, 520, EO);
        A(q(".hl0-tape"), op(0, 1), 1150, 360, "ease-out");
      } else fadeUp(q(".hl0-chip"), 700, 520, 6);
    }

    // ── the rest of the copy, then the button gets its fence ──
    const c0 = intro ? h + (phone ? 950 : 1300) : 650;
    fadeUp(q(".hl0-sub"), c0, 640, 10);
    A(q(".hl0-cta-wrap"), [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }], c0 + 150, 560, EO);
    fadeUp(q(".hl0-demo"), c0 + 250, 520, 6);
    fadeUp(q(".hl0-micro"), c0 + 330, 520, 6);
    fadeUp(q(".hl0-phone-note"), c0 + 380, 520, 6);
    A(q(".hl0-foot"), op(0, 1), c0 + 450, 700, "ease-out");
    if (!phone && g.flag && g.flagShown) A(q(".hl0-flag-note"), op(0, 1), intro ? h + 900 : 1650, 600, "ease-out");

    const r0 = intro ? h + (phone ? 1700 : 2150) : phone ? 1500 : 1900;
    const ring = q(".hl0-ring")!;
    const ringS = q(".hl0-ring-s")!;
    if (phone) {
      // phones: the ring closes, pings once and lets go (the full-width button needs no frame)
      A(ring, [{ opacity: 0, transform: "scale(1.1)" }, { opacity: 1, transform: "none", offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0, transform: "none" }], r0, 1900, "ease-out");
      A(ringS, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], r0 + 420, 760, "ease-out");
    } else {
      g.ringLine.setAttribute("mask", `url(#${id}-rm)`);
      A(ring, [{ transform: "scale(1.055)" }, { transform: "scale(1.055)", offset: 0.62 }, { transform: "none" }], r0, 1000, EIO);
      A(g.ringMaskPath, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], r0, 640, EIO);
      A(ringS, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], r0 + 640, 900, "ease-out");
      tl.at(r0 + 700, () => g.ringLine.removeAttribute("mask"));
    }

    // ── the flag rolls once through three jobs and parks on today's number ──
    const tones = o.hero.flag.map((r) => r.tone);
    const roll = (el: Element | null, rowH: number, from: number, n: number, at: number) => {
      if (!el) return;
      // hold on each row (longer on a red one), then roll one row (330 ms)
      const kf: Keyframe[] = [{ transform: `translateY(${-rowH * from}px)`, offset: 0, easing: EIO }];
      const marks: [number, number][] = [];
      let t = 0;
      for (let i = from; i < n - 1; i++) {
        t += i === from ? 380 : tones[Math.min(i, tones.length - 1)] === "neg" ? 760 : 460;
        marks.push([t, i]);
        t += 330;
        marks.push([t, i + 1]);
      }
      if (!marks.length) return;
      for (const [mt, idx] of marks) kf.push({ transform: `translateY(${-rowH * idx}px)`, offset: mt / t, easing: EIO });
      return A(el, kf, at, t, "linear");
    };
    const f0 = intro ? h + (phone ? 1400 : 1700) : phone ? 1250 : 1500;
    roll(q(".hl0-flag-strip"), 46, intro ? 0 : 1, o.hero.flag.length, f0);
    roll(q(".hl0-chip-strip"), 28, intro ? 0 : 1, o.hero.chip.length, f0);
    tl.at(f0 + 2600, () => (flagBusy = false));

    // later: one more of the crew walks in, then stillness
    if (!phone) clockIn("aw", walk("aw", intro ? h + 5200 : 4600, 1100));

    // the tally: one odometer, stepped at each clock-in
    const tally = q(".hl0-tally");
    if (tally && tallySteps.length) {
      const first = tallySteps[0];
      A(tally, [{ opacity: 0, transform: tr(g.tallyPos[0] + 6, g.tallyPos[1]) }, { opacity: 1, transform: tr(g.tallyPos[0], g.tallyPos[1]) }], first.t, 420, EO);
      const odo = q(".hl0-odo-in")!;
      const end = tallySteps[tallySteps.length - 1].t + 360;
      const span = end - first.t;
      const kf: Keyframe[] = [{ transform: `translateY(-${(first.n - 1) * 1.15}em)`, offset: 0 }];
      for (const st of tallySteps.slice(1)) {
        kf.push({ transform: `translateY(-${(st.n - 2) * 1.15}em)`, offset: (st.t - first.t) / span, easing: EO });
        kf.push({ transform: `translateY(-${(st.n - 1) * 1.15}em)`, offset: Math.min(1, (st.t + 360 - first.t) / span) });
      }
      A(odo, kf, first.t, span, "linear");
    }

    // when everything has landed: drop the animations (the inline rest state is the same frame)
    let last = Math.max(...crossings.map((c) => c.t)) + 900;
    for (const a of tl.anims) last = Math.max(last, Number(a.effect?.getComputedTiming().endTime ?? 0));
    tl.at(last + 120, () => settle());
    if (intro) tl.at(h + 1300, () => (root.dataset.intro = "0"));
  }

  function settle() {
    flagBusy = false;
    tl.cancel();
    tl = new Timeline();
    root.dataset.intro = "0";
    const nf = q(".hl0-nfence");
    if (nf) nf.textContent = "";
    if (G) {
      G.line.removeAttribute("mask");
      G.ringLine.removeAttribute("mask");
      G.line.style.removeProperty("stroke-dasharray");
      G.line.style.removeProperty("stroke-width");
    }
    root.classList.add("is-settled");
  }

  // ── 5 · touch and cursor ──
  function interact(g: Geo) {
    const fenceEl = q(".hl0-fence")!;
    const pulseEl = q(".hl0-pulse")!;
    const pulseOnce = () => pulseEl.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { duration: 620, easing: "ease-out" });
    let pts = g.fence.map((p) => [...p] as Pt);
    const setPts = (p: Pt[]) => {
      const s = polyPoints(p);
      g.line.setAttribute("points", s);
      g.fill.setAttribute("points", s);
      g.pulse.setAttribute("points", s);
      p.forEach(([x, y], i) => g.handles[i].g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`));
    };

    // the flag / chip: roll on to the next job
    const rollNext = (stripSel: string, rowH: number, n: number, idx: number, set: (i: number) => void) => {
      const strip = q(stripSel);
      if (!strip || flagBusy) return;
      let from = idx;
      // the profit strips start and end on the same job: wrap seamlessly
      const same = stripSel === ".hl0-flag-strip" ? o.hero.flag[0].job === o.hero.flag[n - 1].job : o.hero.chip[0] === o.hero.chip[n - 1];
      if (idx === n - 1 && same) from = 0;
      const to = (from + 1) % n;
      strip.style.transform = `translateY(${-rowH * to}px)`;
      strip.animate([{ transform: `translateY(${-rowH * from}px)` }, { transform: `translateY(${-rowH * to}px)` }], { duration: 380, easing: EIO });
      set(to);
    };

    if (phone) {
      // tap the words: the fence pings and the crew show when they clocked in
      const onWords = () => {
        if (!root.classList.contains("is-settled")) return;
        pulseOnce();
        for (const c of ["mb", "er"]) {
          const m = q(`.hl0-mk[data-id="${c}"]`)!;
          m.querySelector(".hl0-mk-i")!.animate([{ opacity: 1 }, { opacity: 0, offset: 0.15 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: 1500 });
          m.querySelector(".hl0-mk-t")!.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500 });
        }
      };
      const fz = q(".hl0-line--fence")!;
      fz.addEventListener("click", onWords);
      offs.push(() => fz.removeEventListener("click", onWords));
      const chip = q(".hl0-chip");
      const onChip = () => rollNext(".hl0-chip-strip", 28, o.hero.chip.length, chipIdx, (i) => (chipIdx = i));
      chip?.addEventListener("click", onChip);
      offs.push(() => chip?.removeEventListener("click", onChip));
      return;
    }

    // desktop: the ground drifts with the cursor; the fence closes when you step inside it
    const drift = q(".hl0-topo-drift")!;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      drift.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    let inFence = false;
    let drag: { i: number; ox: number; oy: number; base: Pt } | null = null;
    const R = () => root.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced) return;
      const r = R();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      tx = -((x / r.width) * 2 - 1) * 6;
      ty = -((y / r.height) * 2 - 1) * 6;
      if (!raf) raf = requestAnimationFrame(loop);
      if (drag) return;
      const now = inside(pts, x, y);
      if (now !== inFence) {
        inFence = now;
        fenceEl.classList.toggle("is-on", now);
        if (now && root.classList.contains("is-settled")) pulseOnce();
      }
    };
    root.addEventListener("pointermove", onMove);
    offs.push(() => {
      root.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    });

    // the stakes can be dragged; they spring back to where the fence belongs
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!t.classList?.contains("hl0-handle-hit") || !root.classList.contains("is-settled")) return;
      const i = Number(t.getAttribute("data-v"));
      const r = R();
      drag = { i, ox: e.clientX - r.left - pts[i][0], oy: e.clientY - r.top - pts[i][1], base: [...g.fence[i]] as Pt };
      (t as SVGElement).setPointerCapture?.(e.pointerId);
      fenceEl.classList.add("is-on");
      e.preventDefault();
    };
    const onDrag = (e: PointerEvent) => {
      if (!drag) return;
      const r = R();
      let x = e.clientX - r.left - drag.ox;
      let y = e.clientY - r.top - drag.oy;
      const dx = x - drag.base[0];
      const dy = y - drag.base[1];
      const d = Math.hypot(dx, dy);
      const max = 70;
      if (d > max) {
        // rubber band past 70 px
        const k = (max + (d - max) * 0.25) / d;
        x = drag.base[0] + dx * k;
        y = drag.base[1] + dy * k;
      }
      pts[drag.i] = [x, y];
      setPts(pts);
    };
    const onUp = () => {
      if (!drag) return;
      const i = drag.i;
      const start: Pt = [...pts[i]] as Pt;
      const goal = g.fence[i];
      drag = null;
      fenceEl.classList.toggle("is-on", inFence);
      const t0 = performance.now();
      const step = () => {
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
    };
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", onUp);
    offs.push(() => {
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", onUp);
    });

    // the job chip (desktops too narrow for the tag)
    const chipD = q(".hl0-chip");
    const onChipD = () => rollNext(".hl0-chip-strip", 28, o.hero.chip.length, chipIdx, (i) => (chipIdx = i));
    chipD?.addEventListener("click", onChipD);
    offs.push(() => chipD?.removeEventListener("click", onChipD));

    // the button: its fence closes while the cursor is on it
    const cta = q(".hl0-cta")!;
    const ctaOn = () => root.classList.add("is-cta");
    const ctaOff = () => root.classList.remove("is-cta");
    cta.addEventListener("pointerenter", ctaOn);
    cta.addEventListener("pointerleave", ctaOff);
    offs.push(() => {
      cta.removeEventListener("pointerenter", ctaOn);
      cta.removeEventListener("pointerleave", ctaOff);
    });

    // the flag rolls on to the next job when you point at it (or click)
    const fl = q(".hl0-flag");
    const onFlag = () => rollNext(".hl0-flag-strip", 46, o.hero.flag.length, flagIdx, (i) => (flagIdx = i));
    fl?.addEventListener("pointerenter", onFlag);
    fl?.addEventListener("click", onFlag);
    offs.push(() => {
      fl?.removeEventListener("pointerenter", onFlag);
      fl?.removeEventListener("click", onFlag);
    });
  }

  // ── boot ──
  (async () => {
    await fontsReady(1600);
    if (!alive) return;
    const tb = performance.now();
    G = place();
    rest(G);
    timing.boot = performance.now() - tb;
    root.classList.add("is-laid");
    drawTopo(G);
    const hook = { geo: G, seek: (ms: number) => tl.seek(ms), tl: () => tl, phone, timing, get topoMs() { return timing.topoDay; } };
    (window as unknown as { __hl0: unknown }).__hl0 = hook;
    if (reduced) {
      root.classList.add("is-settled");
      flagBusy = false;
    } else {
      if (o.intro) o.onIntro?.();
      root.dataset.intro = o.intro ? "1" : "0";
      choreograph(G);
      if (o.seek != null) tl.seek(o.seek);
      else tl.play();
    }
    interact(G);
    root.dispatchEvent(new CustomEvent("hl0:ready"));
  })();

  // re-measure on resize (the rest state, no replay)
  let rt = 0;
  let lastW = window.innerWidth;
  const onResize = () => {
    if (phone && window.innerWidth === lastW) return; // the phone's URL bar
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      if (!alive || !G) return;
      settle();
      offs.splice(0).forEach((f) => f());
      G = place();
      rest(G);
      drawTopo(G);
      flagBusy = false;
      interact(G);
    }, 140);
  };
  window.addEventListener("resize", onResize);

  return () => {
    alive = false;
    topoJobs.forEach((j) => j.cancel());
    tl.cancel();
    clearTimeout(rt);
    window.removeEventListener("resize", onResize);
    offs.splice(0).forEach((f) => f());
    root.classList.remove("is-laid", "is-settled");
  };
}
