// t0 · "Grade the Pad": the hero's engine. It fits the headline, measures the copy's rows (the
// pad: a mesa, narrow round the short top lines, stepped out to the widest line), asks the worker
// for the land and the plan, draws the ground (desktop: one WebGL2 shader; phones and fallback:
// static SVG layers), and plays the entrance:
//
//   rough existing ground (dashed) runs through where the copy will be → the site is graded:
//   desktop, the whole field morphs, the uphill (cut) side a little ahead, the relief under the
//   copy falling fast and settling softly, so the contours slide aside and bunch into tight
//   cut-slope and wider fill-slope offsets round the level pad (the dashes turn solid as they're
//   graded); phones, a blade pass top → bottom in reading order, transforms only → each headline
//   line sets once the ground under it is clear (reading order, words 30 ms apart) → the sub →
//   the orange button lands last, like finish grade → index labels and PAD EL tick on.
//
// Rules it keeps: the button is in the DOM and clickable from the first frame; any input (scroll,
// wheel, touch, key, click) lands the rest frame on the same frame; reduced motion shows the rest
// frame; later visits in the session get a 0.4 s settle; at rest nothing renders (no rAF, no
// will-change), so two frames 500 ms apart are pixel-identical. Phones: no WebGL, no rAF, WAAPI
// on transform/opacity only, and the contouring runs in a worker (0 long tasks).

import { markFirstScreenDone, markPageReady } from "../../site/ready";
import { createGL, type GLGround, type PassMode } from "./gl";
import { padFromRows, sdPad, type Mode, type Pad, type Rect } from "./terrain";
import type { FieldReq, FieldRes, PlanReq, PlanRes } from "./terrain.worker";

export type GroundOpts = { phone: boolean; reduced: boolean };

const NS = "http://www.w3.org/2000/svg";
const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)";
const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
const DEBUG = q.has("t0Debug");
const NO_GL = q.get("t0Gl") === "0";
/** lab only: ?t0Perf records the JS time of each shader frame (window.__t0perf) */
const PERF = q.has("t0Perf");
/** lab only: the pass's shape (?t0Pass=x|c|u, ?t0Ang=deg for x) and soft band (?t0Band=px) */
const PASS_MODE: PassMode = ({ x: 0, c: 1, u: 2 } as Record<string, PassMode>)[q.get("t0Pass") ?? ""] ?? 2;
const PASS_ANG = Number(q.get("t0Ang") ?? 0);
const PASS_BAND = q.get("t0Band") ? Number(q.get("t0Band")) : 0;
/** mode 2: how far the uphill side leads (fraction of the pass) and the relief's fall-off power */
const PASS_LAG = q.get("t0Lag") ? Number(q.get("t0Lag")) : 0.2;
const PASS_POW = q.get("t0Pow") ? Number(q.get("t0Pow")) : 6;

/** The choreography, ms from the hero's first frame (t = 0). */
const DESK = {
  hold: 130,
  passEnd: 880,
  band: 420,
  /** headline lines: never later than h1Max, lineGap apart, words wordGap apart */
  h1Max: 620,
  lineGap: 70,
  wordGap: 30,
  rise: 8,
  h1Dur: 300,
  tapeDur: 300,
  subDur: 300,
  cta: 680,
  ctaMax: 740,
  ctaDur: 260,
  labels: 1000,
  labelDur: 260,
  labelStagger: 60,
  rest: 1320,
  ready: 960,
};
const PHONE = {
  hold: 40,
  passEnd: 760,
  band: 0,
  h1Max: 520,
  lineGap: 55,
  wordGap: 0,
  rise: 8,
  h1Dur: 240,
  tapeDur: 260,
  subDur: 260,
  cta: 540,
  ctaMax: 640,
  ctaDur: 250,
  labels: 0,
  labelDur: 0,
  labelStagger: 0,
  rest: 900,
  ready: 810,
};
/** The pass's easing: a gentle S (peak speed ~1.6× the mean), the same curve for the shader's
 * front (JS) and the phone's container (WAAPI). */
const PASS_CSS = "cubic-bezier(0.45, 0, 0.55, 1)";
const PASS_EASE = bezier(0.45, 0, 0.55, 1);
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (u: number) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = u;
    for (let i = 0; i < 26; i++) {
      t = (lo + hi) / 2;
      if (X(t) < u) lo = t;
      else hi = t;
    }
    return Y(t);
  };
}

/** SVG pass: how far the rough ground ahead of the blade is pushed (css px) */
const PUSH = 14;

/** a later visit in the session: a short settle */
const SETTLE = 400;
const SEEN = "sc-t0";

// ─── the worker ──────────────────────────────────────────────────────────────────────────

let worker: Worker | null = null;
let seq = 0;
const waiting = new Map<number, (r: FieldRes | PlanRes) => void>();

function ask<T extends FieldRes | PlanRes>(msg: Omit<FieldReq, "id"> | Omit<PlanReq, "id">): Promise<T> {
  const id = ++seq;
  if (!worker) {
    try {
      worker = new Worker(new URL("./terrain.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<FieldRes | PlanRes>) => {
        waiting.get(e.data.id)?.(e.data);
        waiting.delete(e.data.id);
      };
    } catch {
      worker = null;
    }
  }
  if (worker) {
    const w = worker;
    return new Promise<T>((resolve) => {
      waiting.set(id, resolve as (r: FieldRes | PlanRes) => void);
      w.postMessage({ ...msg, id });
    });
  }
  // no workers: the same code on the main thread, after a frame
  return import("./terrain").then(
    (T) =>
      new Promise<T>((resolve) =>
        setTimeout(() => {
          const t0 = performance.now();
          const f = T.buildField(msg.W, msg.H, msg.mode);
          if (msg.kind === "field") {
            const g = f.fine;
            resolve({ id, kind: "field", tex: msg.tex ? T.fieldTexture(f) : null, grid: { x0: g.x0, y0: g.y0, step: g.step, nx: g.nx, ny: g.ny }, ms: performance.now() - t0 } as T);
            return;
          }
          const p = T.buildPlan(f, msg);
          const by = (rs: typeof p.natural, idx: boolean) => T.pathD(rs.filter((r) => r.index === idx));
          resolve({
            id,
            kind: "plan",
            paths: {
              natI: by(p.natural, false),
              natX: by(p.natural, true),
              proI: by(p.proposed, false),
              proX: by(p.proposed, true),
              exPad: T.pathD(p.existingPad),
              exSlope: T.pathD(p.existingSlope),
            },
            labels: p.labels,
            limits: p.limits,
            grade: p.grade,
            ms: performance.now() - t0,
          } as T);
        }, 16),
      ),
  );
}

/**
 * Desktop: the land depends only on the viewport, so the worker starts on it as this module loads,
 * before React has rendered anything (the hero's root is the viewport: 100svh, min 540 px). The
 * engine picks the result up if the size matches.
 */
let prewarm: { key: string; p: Promise<FieldRes> } | null = null;
if (typeof window !== "undefined" && typeof Worker !== "undefined" && !window.matchMedia("(max-width: 760px)").matches) {
  const W = document.documentElement.clientWidth;
  const H = Math.max(540, window.innerHeight);
  prewarm = { key: `${W}x${H}`, p: ask<FieldRes>({ kind: "field", W, H, mode: "desk", tex: !NO_GL }) };
}

// ─── fonts ───────────────────────────────────────────────────────────────────────────────

const DISPLAY = '"SmartCrew Display"';
const TEXT = '"SmartCrew Text"';
function fontsReady(ms: number): Promise<boolean> {
  const f = document.fonts;
  if (!f) return Promise.resolve(true);
  const loads = Promise.all([f.load(`700 96px ${DISPLAY}`, "See what every job"), f.load(`400 16px ${TEXT}`, "GPS fills"), f.load(`600 16px ${TEXT}`, "GPS fills")])
    .then(() => f.ready)
    .then(() => true);
  return Promise.race([loads, new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);
}
const fontsIn = () => !document.fonts || (document.fonts.check(`700 96px ${DISPLAY}`, "See what") && document.fonts.check(`400 16px ${TEXT}`, "GPS"));

// ─── helpers ─────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function svg(W: number, H: number, cls: string) {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("class", cls);
  s.setAttribute("width", String(W));
  s.setAttribute("height", String(H));
  s.setAttribute("viewBox", `0 0 ${W} ${H}`);
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("focusable", "false");
  return s;
}
function path(parent: Element, d: string, cls: string, extra?: Record<string, string>) {
  if (!d) return null;
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", d);
  p.setAttribute("class", cls);
  if (extra) for (const k in extra) p.setAttribute(k, extra[k]);
  parent.appendChild(p);
  return p;
}
const inflate = (r: Rect, x: number, y = x): Rect => ({ x: r.x - x, y: r.y - y, w: r.w + 2 * x, h: r.h + 2 * y });
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

type Geo = {
  W: number;
  H: number;
  pad: Pad;
  copy: Rect[];
  halos: Rect[];
  /** the small print under the button: PAD EL sits on its baseline */
  micro: Rect;
  /** halos[0 … nHead) are the header's (always on); the rest are the foot row's */
  nHead: number;
};

type Layers = {
  kind: "gl" | "svg";
  /** desktop GL: the dashed existing ground on the pad (moves with the front) and under the slopes */
  exw?: HTMLDivElement;
  exin?: HTMLDivElement;
  exSlope?: SVGSVGElement;
  /** SVG: the graded container (slides with the pass), its content (counter-slides), the blade edge */
  box?: HTMLDivElement;
  boxIn?: HTMLDivElement;
  blade?: HTMLDivElement;
  existing?: SVGSVGElement;
  rect?: Rect;
  labels?: SVGSVGElement;
  limits: Rect;
};

let uid = 0;
let maskSeq = 0;

// ─── the engine ──────────────────────────────────────────────────────────────────────────

export function mountGround(root: HTMLElement, o: GroundOpts): () => void {
  const id = `t0-${++uid}`;
  const phone = o.phone;
  const mode: Mode = phone ? "phone" : "desk";
  const TL = phone ? PHONE : DESK;
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll(s)] as T[];
  const groundEl = $(".t0-ground")!;
  let alive = true;
  let geo: Geo | null = null;
  let gl: GLGround | null = null;
  let layers: Layers | null = null;
  let anims: Animation[] = [];
  let clock: Animation | null = null;
  let raf = 0;
  let playing = false;
  let finished = false;
  const timers: number[] = [];
  const offs: (() => void)[] = [];
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN) === "1";
  } catch {
    /* private mode */
  }
  const force = q.get("t0");
  const settleOnly = force === "settle" || (force !== "full" && seen);
  const reduced = o.reduced;

  // the land depends only on the viewport: ask for it now, while the fonts load
  const size = () => ({ W: root.clientWidth, H: root.clientHeight });
  let fieldKey = "";
  let fieldP: Promise<FieldRes> | null = null;
  const wantField = (W: number, H: number) => {
    const key = `${W}x${H}`;
    if (key !== fieldKey) {
      fieldKey = key;
      const pre = !phone && prewarm?.key === key ? prewarm.p : null;
      prewarm = null;
      fieldP = pre ?? ask<FieldRes>({ kind: "field", W, H, mode, tex: !phone && !NO_GL });
      if (DEBUG || PERF) {
        performance.mark("t0-field-ask");
        void fieldP.then((r) => {
          performance.mark("t0-field");
          const o = performance.timeOrigin;
          if (r.up) performance.mark("t0-worker-up", { startTime: r.up - o });
          if (r.at) performance.mark("t0-field-done", { startTime: r.at - o });
        });
      }
    }
    return fieldP!;
  };
  {
    const s = size();
    wantField(s.W, s.H);
  }
  // desktop: the shader links in parallel with all of that
  if (!phone && !NO_GL) gl = createGL(() => onLost());

  // ── 1 · fit the headline ──

  function overflow() {
    const R = root.getBoundingClientRect();
    if (phone) {
      const vis = Math.min(window.innerHeight, 900);
      const cta = $(".t0-cta-wrap")!.getBoundingClientRect().bottom - R.top;
      const cue = $(".t0-cue")!.getBoundingClientRect().bottom - R.top;
      return Math.max(cta - Math.min(500, vis - 150), cue - (vis - 2));
    }
    return 70 + $(".t0-copy")!.offsetHeight - copyLimit(R);
  }
  const copyLimit = (R: DOMRect) => $(".t0-foot")!.getBoundingClientRect().top - R.top - 18;

  function fit() {
    const h1 = $(".t0-h1")!;
    for (const p of ["--fs", "--copy-top"]) root.style.removeProperty(p);
    const cur = parseFloat(getComputedStyle(h1).fontSize);
    const W = root.clientWidth;
    const g = phone ? 16 : clamp(W * 0.05, 24, 72);
    const avail = W - 2 * g;
    let fsW = Infinity;
    for (const ln of $$(".t0-line-in")) fsW = Math.min(fsW, (avail * cur) / (ln.offsetWidth || 1));
    const min = phone ? 30 : 44;
    const max = phone ? 54 : 124;
    let fs = clamp(fsW, min, max);
    for (let i = 0; i < 5; i++) {
      root.style.setProperty("--fs", `${fs.toFixed(2)}px`);
      const over = overflow();
      if (over <= 0.5) break;
      const hh = h1.offsetHeight || 1;
      fs = clamp(fs * (1 - over / hh) - 0.25, min, max);
      if (fs === min) {
        root.style.setProperty("--fs", `${fs.toFixed(2)}px`);
        break;
      }
    }
    if (!phone) {
      const space = copyLimit(root.getBoundingClientRect()) - 70 - $(".t0-copy")!.offsetHeight;
      root.style.setProperty("--copy-top", `${(70 + Math.max(0, space * 0.42)).toFixed(1)}px`);
    }
  }

  // ── 2 · measure: the pad is the copy block, the halos are the header and the foot row ──

  function measure(): Geo {
    const R = root.getBoundingClientRect();
    const W = root.clientWidth;
    const H = root.clientHeight;
    const rel = (r: DOMRect): Rect => ({ x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });
    const copyEls = [".t0-eyebrow", ".t0-line-in", ".t0-sub", ".t0-cta-wrap", ".t0-demo", ".t0-micro"].flatMap((s) => $$(s));
    const copy = copyEls.map((e) => rel(e.getBoundingClientRect())).filter((r) => r.w > 0 && r.h > 0);
    const foot = [".t0-logos", ".t0-cue"].flatMap((s) => $$(s)).map((e) => rel(e.getBoundingClientRect()));
    const head = [".site-logo", ".site-nav"]
      .map((s) => document.querySelector(s))
      .filter((e): e is Element => !!e && e.getClientRects().length > 0)
      .map((e) => rel(e.getBoundingClientRect()))
      .filter((r) => r.w > 0);
    // the pad: a mesa from the copy's rows (a narrow top for short lines, stepped out to the
    // widest line below); desktop closes it under the small print when the foot row has room
    // for a slope, else just past the fold; phones carry it on under the foot row
    const u = (rs: Rect[]): Rect[] => {
      if (!rs.length) return [];
      const x0 = Math.min(...rs.map((r) => r.x));
      const y0 = Math.min(...rs.map((r) => r.y));
      return [{ x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 }];
    };
    const one = (sel: string) => $$(sel).map((e) => rel(e.getBoundingClientRect())).filter((r) => r.w > 0 && r.h > 0);
    const rows = [...one(".t0-eyebrow"), ...one(".t0-line-in"), ...one(".t0-sub"), ...u([...one(".t0-cta-wrap"), ...one(".t0-demo")]), ...one(".t0-micro"), ...(phone ? foot : [])];
    const lastB = Math.max(...rows.map((r) => r.y + r.h));
    const micro = one(".t0-micro")[0] ?? rows[rows.length - 1];
    const footT = foot.length ? Math.min(...foot.map((r) => r.y)) : H;
    const m = phone ? 12 : 26;
    const bottom = phone ? lastB + m : footT - (micro.y + micro.h) >= 96 ? micro.y + micro.h + m : H + 4;
    const pad: Pad = padFromRows(rows, { m, mTop: phone ? 10 : m - 4, tol: phone ? 30 : 60, r: phone ? 30 : 60, k: phone ? 24 : 36, bottom, side: phone ? 14 : m, W, bleed: phone ? 30 : 60 });
    // a halo that nearly reaches the screen's edge runs off it (no stubs of line left at the edge)
    const toEdge = (r: Rect): Rect => {
      let { x, w } = r;
      if (x < 28) {
        w += x + 40;
        x = -40;
      }
      if (x + w > W - 28) w = W + 40 - x;
      return { x, y: r.y < 20 ? -40 : r.y, w, h: r.y < 20 ? r.h + r.y + 40 : r.h };
    };
    const halos = [...head.map((r) => toEdge(inflate(r, 10, 6))), ...foot.map((r) => toEdge(inflate(r, 12, 8)))];
    return { W, H, pad, copy, halos, micro: rel($(".t0-micro")!.getBoundingClientRect()), nHead: head.length };
  }

  // ── 3 · the layers ──

  function clearLayers() {
    if (gl) gl.canvas.remove();
    groundEl.querySelectorAll(":scope > :not(.t0-gl)").forEach((n) => n.remove());
    $(".t0-labels")?.replaceChildren();
    layers = null;
  }

  function buildLabels(p: PlanRes, g: Geo): SVGSVGElement {
    const s = $<SVGSVGElement>(".t0-labels")!;
    s.setAttribute("width", String(g.W));
    s.setAttribute("height", String(g.H));
    s.setAttribute("viewBox", `0 0 ${g.W} ${g.H}`);
    s.replaceChildren();
    if (phone) return s;
    for (const l of p.labels) {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", l.x.toFixed(1));
      t.setAttribute("y", l.y.toFixed(1));
      t.setAttribute("transform", `rotate(${l.a.toFixed(1)} ${l.x.toFixed(1)} ${l.y.toFixed(1)})`);
      t.setAttribute("class", "t0-el");
      t.textContent = l.t;
      s.appendChild(t);
    }
    // the pad's own note, inside its lower-right corner (or lower-left), clear of the copy
    const note = document.createElementNS(NS, "text");
    note.setAttribute("class", "t0-padel");
    note.textContent = "PAD EL. 1,240.50";
    const nw = 112;
    const by = g.micro.y + g.micro.h - 3;
    const spots: [number, string, Rect][] = [
      [g.pad.x + g.pad.w - 22, "end", { x: g.pad.x + g.pad.w - 22 - nw, y: by - 10, w: nw, h: 14 }],
      [g.pad.x + 22, "start", { x: g.pad.x + 22, y: by - 10, w: nw, h: 14 }],
    ];
    const ok = spots.find(([, , r]) => !g.copy.some((c) => hit(inflate(c, 14, 8), r)) && !g.halos.some((c) => hit(c, r)) && r.y + r.h < g.H - 4);
    if (ok) {
      note.setAttribute("x", ok[0].toFixed(1));
      note.setAttribute("y", by.toFixed(1));
      note.setAttribute("text-anchor", ok[1]);
      s.appendChild(note);
    }
    return s;
  }

  /** halos as an SVG mask (the SVG plan's version of the shader's halo breaks) */
  function haloMask(s: SVGSVGElement, g: Geo, headOnly = false) {
    const hs = headOnly ? g.halos.slice(0, g.nHead) : g.halos;
    if (!hs.length) return "";
    const defs = document.createElementNS(NS, "defs");
    const m = document.createElementNS(NS, "mask");
    const mid = `${id}-halo-${++maskSeq}`;
    m.setAttribute("id", mid);
    m.setAttribute("maskUnits", "userSpaceOnUse");
    m.setAttribute("x", "0");
    m.setAttribute("y", "0");
    m.setAttribute("width", String(g.W));
    m.setAttribute("height", String(g.H));
    let inner = `<rect width="${g.W}" height="${g.H}" fill="#fff"/>`;
    // a soft edge in four steps (no filters): the lines thin out into the halo, they don't stop on a box
    for (const h of hs)
      for (let k = 3; k >= 0; k--) {
        const e = k * 2.5;
        inner += `<rect x="${(h.x - e).toFixed(1)}" y="${(h.y - e).toFixed(1)}" width="${(h.w + 2 * e).toFixed(1)}" height="${(h.h + 2 * e).toFixed(1)}" rx="${(8 + e).toFixed(1)}" fill="#000" fill-opacity="${[1, 0.5, 0.333, 0.25][k]}"/>`;
      }
    m.innerHTML = inner;
    defs.appendChild(m);
    s.appendChild(defs);
    return `url(#${mid})`;
  }

  function group(s: SVGSVGElement, mask: string) {
    const gEl = document.createElementNS(NS, "g");
    if (mask) gEl.setAttribute("mask", mask);
    s.appendChild(gEl);
    return gEl;
  }

  function buildGL(p: PlanRes, g: Geo): Layers {
    const G = gl!;
    G.setGrade(p.grade, g.halos, g.nHead, p.labels);
    G.size(g.W, g.H, window.devicePixelRatio || 1);
    G.canvas.style.width = `${g.W}px`;
    G.canvas.style.height = `${g.H}px`;
    if (!G.canvas.parentNode) groundEl.prepend(G.canvas);
    // the existing ground's dashes, the pass and the slopes are all the shader's (one canvas)
    return { kind: "gl", labels: buildLabels(p, g), limits: p.limits };
  }

  function buildSVG(p: PlanRes, g: Geo): Layers {
    const W = g.W;
    const H = g.H;
    const L = p.limits;
    // the pass's container: the grading limits' extent along the pass axis
    const rect: Rect = phone ? { x: 0, y: L.y - 6, w: W, h: L.h + 12 } : { x: L.x - 6, y: 0, w: L.w + 12, h: H };
    // 1 · existing ground inside the limits (dashed): covered as the pass goes over it
    const ex = svg(W, H, "t0-ex t0-ex-all");
    const gx = group(ex, haloMask(ex, g, true));
    path(gx, p.paths.exPad, "t0-ex-l");
    path(gx, p.paths.exSlope, "t0-ex-l");
    // 2 · the graded container: a ground-coloured backing + the proposed slopes
    const box = document.createElement("div");
    box.className = "t0-box";
    box.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px`;
    const boxIn = document.createElement("div");
    boxIn.className = "t0-box-in";
    boxIn.style.cssText = `left:${-rect.x}px;top:${-rect.y}px;width:${W}px;height:${H}px`;
    const back = document.createElement("div");
    back.className = "t0-back";
    back.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px`;
    const pr = svg(W, H, "t0-pro");
    const mp = haloMask(pr, g);
    const gp = group(pr, mp);
    path(gp, p.paths.proI, "t0-pi");
    path(gp, p.paths.proX, "t0-px");
    boxIn.append(back, pr);
    box.appendChild(boxIn);
    // 3 · the blade's edge: a soft ground-coloured band at the front, riding with the container
    const blade = document.createElement("div");
    blade.className = `t0-blade ${phone ? "is-y" : "is-x"}`;
    blade.style.cssText = phone ? `left:0;width:${W}px;top:${rect.y + rect.h - 22}px` : `top:0;height:${H}px;left:${rect.x + rect.w - 22}px`;
    // 4 · natural ground, on top of it all (it never changes)
    const nat = svg(W, H, "t0-nat");
    const mn = haloMask(nat, g);
    const gn = group(nat, mn);
    path(gn, p.paths.natI, "t0-ni");
    path(gn, p.paths.natX, "t0-nx");
    groundEl.append(ex, box, blade, nat);
    return { kind: "svg", box, boxIn, blade, existing: ex, rect, labels: buildLabels(p, g), limits: p.limits };
  }

  // ── 4 · the entrance ──

  /**
   * The pass. Desktop (shader): `mode` 0 sweeps a soft front along `dir`, 1 grades from deep inside
   * the pad outward, 2 everywhere at once. SVG (phones, fallback): a hard-edged blade along the axis
   * (phones top → bottom, in reading order; desktop left → right).
   */
  type Pass = { mode: PassMode; dir: [number, number]; band: number; a: number; b: number; lag?: [number, number, number, number] };
  let pass: Pass | null = null;
  function makePass(): Pass {
    const g = geo!;
    if (!layers || layers.kind === "svg") {
      const dir: [number, number] = phone ? [0, 1] : [1, 0];
      if (layers?.rect) {
        const r = layers.rect;
        return phone ? { mode: 0, dir, band: 0, a: r.y, b: r.y + r.h } : { mode: 0, dir, band: 0, a: r.x, b: r.x + r.w };
      }
      // the ground is late: the copy keeps the same rhythm over the whole hero
      return { mode: 0, dir, band: 0, a: 0, b: phone ? g.H : g.W };
    }
    const L = layers.limits;
    const mode = PASS_MODE;
    if (mode === 2) {
      // the uphill side (the cut) leads, along the land's fall (west → east)
      const t = (PASS_ANG * Math.PI) / 180;
      const dir: [number, number] = [Math.cos(t), Math.sin(t)];
      const pr = [0, g.W * dir[0], g.H * dir[1], g.W * dir[0] + g.H * dir[1]];
      const q0 = Math.min(...pr);
      const q1 = Math.max(...pr);
      return { mode, dir, band: 0, a: 0, b: 1, lag: [PASS_LAG, q0, 1 / Math.max(1, q1 - q0), PASS_POW] };
    }
    if (mode === 1) {
      const band = PASS_BAND || 220;
      // from the pad's deepest point out past the slopes' daylight
      let lo = 0;
      for (let y = Math.max(0, g.pad.y); y < Math.min(g.H, g.pad.y + g.pad.h); y += 12)
        for (let x = Math.max(0, g.pad.x); x < Math.min(g.W, g.pad.x + g.pad.w); x += 12) lo = Math.min(lo, sdPad(x, y, g.pad));
      return { mode, dir: [1, 0], band, a: lo - band / 2, b: 240 + band / 2 };
    }
    const band = PASS_BAND || TL.band;
    const t = (PASS_ANG * Math.PI) / 180;
    const dir: [number, number] = [Math.cos(t), Math.sin(t)];
    const pr = [L.x * dir[0] + L.y * dir[1], (L.x + L.w) * dir[0] + L.y * dir[1], L.x * dir[0] + (L.y + L.h) * dir[1], (L.x + L.w) * dir[0] + (L.y + L.h) * dir[1]];
    return { mode, dir, band, a: Math.min(...pr) - band / 2 - 10, b: Math.max(...pr) + band / 2 + 10 };
  }
  /** the pass's front at t (css px along its axis; mode 2: 0 → 1) */
  function frontAt(t: number) {
    const P = pass!;
    const u = clamp((t - TL.hold) / (TL.passEnd - TL.hold), 0, 1);
    return P.a + (P.b - P.a) * (P.mode === 2 ? u : PASS_EASE(u));
  }
  /** how graded the ground at (x, y) is at t: 1 graded, 0 the existing ground */
  function wAt(x: number, y: number, t: number) {
    const P = pass!;
    const f = frontAt(t);
    if (P.mode === 2 && P.lag) {
      const [L, q0, iq, k] = P.lag;
      const q01 = clamp((x * P.dir[0] + y * P.dir[1] - q0) * iq, 0, 1);
      const xx = clamp((f - L * q01) / (1 - L), 0, 1);
      return 1 - Math.pow(1 - Math.pow(xx, 1.5), k);
    }
    const qv = P.mode === 1 ? sdPad(x, y, geo!.pad) : x * P.dir[0] + y * P.dir[1];
    if (P.band <= 0) return qv < f ? 1 : 0;
    const u = clamp((qv - (f - P.band / 2)) / P.band, 0, 1);
    return 1 - u * u * (3 - 2 * u);
  }
  /** the existing ground E − PAD_EL at (x, y) (desktop: from the shader's texture), or null */
  let fieldTex: { tex: Float32Array; x0: number; y0: number; step: number; nx: number; ny: number } | null = null;
  function eAt(x: number, y: number) {
    const F = fieldTex;
    if (!F) return null;
    const i = clamp(Math.round((x - F.x0) / F.step), 0, F.nx - 1);
    const j = clamp(Math.round((y - F.y0) / F.step), 0, F.ny - 1);
    return F.tex[(j * F.nx + i) * 4];
  }
  /**
   * When a box of copy is on clear ground: no contour left across it. On the pad the morphing
   * ground is P + (1 − w)(E − P), so a point is clear once (1 − w)·|E − P| < 0.5 ft (the nearest
   * levels are P ± 0.5). The blade (SVG) clears what it has passed.
   */
  const CLEAR = q.get("t0Clear") ? Number(q.get("t0Clear")) : 2;
  function clearAt(r: Rect) {
    const pts: [number, number][] = [];
    for (let a = 0; a <= 2; a++) for (let b = 0; b <= 2; b++) pts.push([r.x + (r.w * a) / 2, r.y + (r.h * b) / 2]);
    const es = pts.map(([x, y]) => eAt(x, y));
    for (let t = 0; t <= TL.passEnd; t += 10) {
      const ok = pts.every(([x, y], i) => {
        const w = wAt(x, y, t);
        const e = es[i];
        return e == null ? w >= 0.999 : (1 - w) * Math.abs(e) < CLEAR;
      });
      if (ok) return t;
    }
    return TL.passEnd;
  }

  /** when the foot row starts landing (its halos fade in with it) */
  let footAt = 0;
  let copyTimes: unknown = null;
  let fieldMs = 0;
  const FOOT_DUR = 320;
  function drawGLAt(t: number) {
    if (!gl || !layers || layers.kind !== "gl" || !pass) return;
    const p0 = PERF ? performance.now() : 0;
    const rest = t >= TL.passEnd;
    gl.draw({ front: rest ? 1e6 : frontAt(t), band: pass.band, mode: pass.mode, dir: pass.dir, lag: pass.lag, entrance: !rest, keepFoot: clamp((t - footAt) / FOOT_DUR, 0, 1) });
    if (PERF) ((window as unknown as { __t0perf?: number[] }).__t0perf ??= []).push(performance.now() - p0);
  }

  const animate = (el: Element | null | undefined, kf: Keyframe[], delay: number, dur: number, easing = EO, fill: FillMode = "backwards") => {
    if (!el) return;
    const a = el.animate(kf, { delay, duration: dur, easing, fill });
    anims.push(a);
    return a;
  };
  const rise = (dy: number): Keyframe[] => [
    { opacity: 0, transform: `translate3d(0, ${dy}px, 0)` },
    { opacity: 1, transform: "none" },
  ];
  const fade: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

  /**
   * The copy sets on the graded pad, in reading order: each headline line once the ground under
   * it is clear (never before the line above, + 70 ms), its words 30 ms apart; the eyebrow with the
   * first line; the sub after the headline; the orange button last, like finish grade, landed by
   * TL.cta + its duration whatever the ground does.
   */
  function copyIn() {
    const R = root.getBoundingClientRect();
    const rel = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height };
    };
    const floor = phone ? 200 : 300;
    const lines = $$(".t0-line-in");
    let prev = -1e9;
    let last = 0;
    const lineAt: number[] = [];
    lines.forEach((ln) => {
      const d = Math.min(TL.h1Max, Math.max(floor, clearAt(rel(ln)) + 10, prev + TL.lineGap));
      prev = d;
      lineAt.push(d);
      const ws = phone ? [ln] : [...ln.querySelectorAll(".t0-w")];
      ws.forEach((w, k) => {
        const dw = d + k * TL.wordGap;
        last = Math.max(last, dw);
        animate(w, rise(TL.rise), dw, TL.h1Dur);
      });
    });
    const eb = $(".t0-eyebrow");
    if (eb) animate(eb, rise(6), Math.max(floor - 40, (lineAt[0] ?? floor) - 40), TL.h1Dur);
    // the flagging tape pulls tight once its words have set
    $$(".t0-tape").forEach((t) => {
      const i = lines.findIndex((l) => l.contains(t));
      const n = phone ? 1 : t.parentElement!.querySelectorAll(".t0-w").length + [...lines[i].querySelectorAll(".t0-w")].indexOf(t.parentElement!.querySelector(".t0-w")!);
      const d = (lineAt[i] ?? floor) + (phone ? 0 : (n - 1) * TL.wordGap) + 140;
      animate(t, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], d, TL.tapeDur, EIO);
    });
    const sub = $(".t0-sub")!;
    const dSub = Math.max(prev + 80, clearAt(rel(sub)) + 10);
    animate(sub, rise(TL.rise), dSub, TL.subDur);
    // the button: after the sub (+70 ms), from TL.cta at the earliest... and never later than
    // TL.ctaMax, whatever the ground does (a long headline only pushes it that far)
    const dCta = Math.min(TL.ctaMax, Math.max(TL.cta, dSub + 70, clearAt(rel($(".t0-cta-wrap")!)) + 10));
    animate($(".t0-cta-wrap"), rise(TL.rise), dCta, TL.ctaDur);
    animate($(".t0-demo"), rise(6), dCta + 60, TL.ctaDur);
    animate($(".t0-micro"), fade, dCta + 80, TL.ctaDur);
    footAt = dCta + 140;
    animate($(".t0-foot"), fade, footAt, FOOT_DUR);
    if (DEBUG) copyTimes = { lines: lineAt, sub: dSub, cta: dCta, last, clear: lines.map((l) => clearAt(rel(l))), e: lines.map((l) => { const r = rel(l); return [eAt(r.x, r.y), eAt(r.x + r.w, r.y + r.h)]; }) };
    return dCta + TL.ctaDur;
  }

  function labelsIn(l: SVGSVGElement | undefined) {
    if (!l) return;
    [...l.children]
      .filter((c) => c.tagName === "text")
      .forEach((t, i) => animate(t, fade, TL.labels + i * TL.labelStagger, TL.labelDur, "linear"));
  }

  /** the full entrance: t = 0 is this frame (withGround false: the copy only, the ground is late) */
  function play(withGround: boolean) {
    const Ly = layers;
    root.classList.add("is-live", "is-moving");
    root.classList.remove("is-pre");
    clock = new Animation(new KeyframeEffect(null, [], { duration: TL.rest }), document.timeline);
    clock.play();
    anims = [clock];
    pass = makePass();
    const landed = copyIn();
    // the rough ground comes up with the hero's first frame (a short fade, not a pop)
    if (withGround && Ly) animate(groundEl, fade, 0, phone ? 90 : 100, "linear");
    if (!withGround || !Ly) {
      // nothing to grade yet
    } else if (Ly.kind === "gl") {
      drawGLAt(0);
      const loop = () => {
        raf = 0;
        if (!alive || finished || !clock) return;
        const t = clock.currentTime == null ? 0 : Number(clock.currentTime);
        drawGLAt(t);
        if (t < Math.max(TL.passEnd, footAt + FOOT_DUR)) raf = requestAnimationFrame(loop);
      };
      if (!DEBUG) raf = requestAnimationFrame(loop);
      labelsIn(Ly.labels);
    } else {
      // the pass: the container slides along the axis while its content counter-slides
      const r = Ly.rect!;
      const n = phone ? r.h : r.w;
      const tr = (v: number) => (phone ? `translate3d(0, ${v}px, 0)` : `translate3d(${v}px, 0, 0)`);
      const dur = TL.passEnd - TL.hold;
      animate(Ly.box, [{ transform: tr(-n) }, { transform: tr(0) }], TL.hold, dur, PASS_CSS);
      animate(Ly.boxIn, [{ transform: tr(n) }, { transform: tr(0) }], TL.hold, dur, PASS_CSS);
      animate(Ly.blade, [{ transform: tr(-n) }, { transform: tr(0) }], TL.hold, dur, PASS_CSS);
      animate(Ly.blade, [{ opacity: 1 }, { opacity: 0 }], TL.passEnd, 120, "linear", "forwards");
      // the rough ground ahead of the blade gives a little as it is pushed (transform only)
      animate(Ly.existing, [{ transform: tr(0) }, { transform: tr(PUSH) }], TL.hold, dur, PASS_CSS, "both");
      if (!phone) labelsIn(Ly.labels);
    }
    // rest comes once the last beat has finished (never cutting a fade short: no pop at the end)
    const end = Math.max(TL.rest, ...anims.map((a) => {
      const t = a.effect?.getComputedTiming();
      return t ? Number(t.endTime ?? 0) : 0;
    }));
    if (clock?.effect) (clock.effect as KeyframeEffect).updateTiming({ duration: end });
    if (DEBUG) return;
    timers.push(window.setTimeout(() => markPageReady(), Math.min(TL.ready, landed)));
    timers.push(window.setTimeout(() => toRest(), end + 30));
  }

  /** a later visit (or the ground arriving late): everything fades in at rest, 0.4 s */
  function settle() {
    root.classList.add("is-live");
    root.classList.remove("is-pre");
    clock = new Animation(new KeyframeEffect(null, [], { duration: SETTLE }), document.timeline);
    clock.play();
    anims = [clock];
    if (layers) {
      showRest();
      animate(groundEl, [{ opacity: 0.6 }, { opacity: 1 }], 0, SETTLE, EO);
      animate($(".t0-labels"), fade, 0, SETTLE, EO);
    }
    for (const s of [".t0-eyebrow", ".t0-h1", ".t0-sub", ".t0-act", ".t0-micro", ".t0-foot"]) animate($(s), fade, 0, SETTLE, EO);
    if (DEBUG) return;
    timers.push(window.setTimeout(() => markPageReady(), 200));
    timers.push(window.setTimeout(() => toRest(), SETTLE + 30));
  }

  /** the rest frame's ground */
  function showRest() {
    if (!layers) return;
    if (layers.kind === "gl") {
      gl?.draw({ front: 1e6, band: TL.band, entrance: false, keepFoot: 1 });
    } else {
      if (layers.existing) layers.existing.style.display = "none";
      if (layers.blade) layers.blade.style.display = "none";
    }
  }

  /** land everything now (any input, the end of the entrance, a resize) */
  function toRest() {
    if (finished) return;
    finished = true;
    playing = false;
    cancelAnimationFrame(raf);
    raf = 0;
    timers.splice(0).forEach(clearTimeout);
    // the animations drop out as they finish: nothing holds a layer or a style at rest
    anims.forEach((a) => {
      try {
        a.cancel();
      } catch {
        /* gone */
      }
    });
    anims = [];
    clock = null;
    root.classList.remove("is-pre", "is-moving");
    root.classList.add("is-live", "is-rest");
    showRest();
    markPageReady();
    markFirstScreenDone();
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {
      /* private mode */
    }
  }

  function onLost() {
    // the GPU took the context: the SVG plan stands in, at rest
    if (!alive || !geo || !lastPlan) return;
    gl = null;
    const g = geo;
    const put = (p: PlanRes) => {
      if (!alive || geo !== g) return;
      lastPlan = p;
      clearLayers();
      layers = buildSVG(p, g);
      showRest();
    };
    if (lastPlan.lite) void fullPlan(g).then(put);
    else put(lastPlan);
  }

  // ── boot ──

  let lastPlan: PlanRes | null = null;
  let fontsLate = false;

  /**
   * Build the ground's layers from a plan (desktop: the shader if it has linked in time, else SVG).
   * Returns false when there is nothing to show yet: the page went away, or the shader didn't link
   * in time and the plan was the shader's lite one (labels only): the full SVG plan is then asked
   * for, and it joins at rest when it comes (`onLate`).
   */
  async function build(p: PlanRes, f: FieldRes, g: Geo, glWait: number, onLate: () => void) {
    let useGL = !!gl && !phone;
    if (useGL && gl) {
      const ok = await Promise.race([gl.linked, new Promise<boolean>((r) => setTimeout(() => r(false), Math.max(0, glWait)))]);
      if (!alive) return false;
      fieldMs = f.ms;
      if (ok && f.tex) {
        gl.setField(f.tex, f.grid);
        fieldTex = { tex: f.tex, ...f.grid };
      }
      useGL = ok && !gl.lost();
      if (!useGL) {
        gl.destroy();
        gl = null;
      }
    }
    if (!useGL && p.lite) {
      void fullPlan(g).then((full) => {
        if (!alive || !full) return;
        lastPlan = full;
        clearLayers();
        layers = buildSVG(full, g);
        onLate();
      });
      return false;
    }
    lastPlan = p;
    clearLayers();
    layers = useGL ? buildGL(p, g) : buildSVG(p, g);
    return true;
  }

  /** the SVG plan (every line as path data) for a layout */
  function fullPlan(g: Geo) {
    return ask<PlanRes>({ kind: "plan", W: g.W, H: g.H, mode, pad: g.pad, keep: [...g.copy, ...g.halos], labels: phone ? 0 : 4 });
  }

  /** the ground arrived after the copy's entrance started: it fades in at rest */
  function groundLate() {
    showRest();
    groundEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: EO });
    $(".t0-labels")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: EO });
  }

  /** how long the hero's first frame waits for the ground after the type is laid out */
  const WAIT = DEBUG ? 30000 : phone ? 380 : 320;

  async function lay(first: boolean) {
    fit();
    const g = measure();
    geo = g;
    root.classList.add("is-laid");
    if (first) performance.mark("t0-laid");
    const field = wantField(g.W, g.H);
    // the shader draws the lines itself: it only needs the labels and the grading limits
    const plan = ask<PlanRes>({ kind: "plan", W: g.W, H: g.H, mode, pad: g.pad, keep: [...g.copy, ...g.halos], labels: phone ? 0 : 4, lite: !!gl && !phone });
    const t0 = performance.now();
    const res: { v: [PlanRes, FieldRes] | null } = { v: null };
    const both = Promise.all([plan, field]).then((v) => {
      if (first) performance.mark("t0-ground");
      return (res.v = v);
    });
    const full = first && !finished && !reduced && !settleOnly;

    if (!full) {
      // a resize, reduced motion or a later visit: the copy shows (or settles) now, the ground
      // joins at rest when it's ready
      if (first) {
        playing = true;
        if (reduced) {
          root.classList.remove("is-pre");
          toRest();
        } else settle();
      }
      await both;
      if (!alive || !res.v) return;
      const [p, f] = res.v;
      const join = () => (first && !reduced ? groundLate() : showRest());
      if (!(await build(p, f, g, 400, join))) return;
      join();
      return;
    }

    // the first visit: the hero's first frame waits a beat for the ground (built in the worker)
    await Promise.race([both, new Promise((r) => setTimeout(r, WAIT))]);
    if (!alive) return;
    const inTime = !!res.v;
    if (res.v) {
      const [p, f] = res.v;
      // (no layers yet when the shader missed its slot: the SVG plan joins at rest)
      await build(p, f, g, WAIT + 120 - (performance.now() - t0), groundLate);
      if (!alive) return;
    }
    requestAnimationFrame(() => {
      if (!alive) return;
      playing = true;
      performance.mark("t0-first");
      play(!!layers);
      if (DEBUG) {
        anims.forEach((a) => a.pause());
        expose();
      }
      if (!inTime)
        // the ground was late: the copy plays its entrance on time, the ground fades in at rest
        void both.then(async () => {
          if (!alive || !res.v) return;
          const [p, f] = res.v;
          if (!(await build(p, f, g, 300, groundLate))) return;
          groundLate();
        });
    });
  }

  function expose() {
    (window as unknown as { __t0: unknown }).__t0 = {
      seek(t: number) {
        anims.forEach((a) => {
          a.pause();
          a.currentTime = t;
        });
        drawGLAt(t);
      },
      rest: () => toRest(),
      state: () => ({ copy: copyTimes, pass, workerMs: { field: fieldMs, plan: lastPlan?.ms }, kind: layers?.kind, limits: layers?.limits, pad: geo?.pad, halos: geo?.halos, plan: lastPlan && { labels: lastPlan.labels, ms: lastPlan.ms, bytes: Object.fromEntries(Object.entries(lastPlan.paths).map(([k, v]) => [k, (v as string).length])) } }),
    };
  }

  // any input lands the rest frame on the same frame
  const onInput = (e: Event) => {
    if (playing && !finished) {
      if (PERF) (window as unknown as { __t0input?: string }).__t0input = `${e.type}@${Math.round(performance.now())}`;
      toRest();
    }
  };
  const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"] as const;
  if (!DEBUG) INPUTS.forEach((t) => window.addEventListener(t, onInput, { passive: true, capture: true }));
  offs.push(() => INPUTS.forEach((t) => window.removeEventListener(t, onInput, { capture: true })));

  root.classList.add("is-pre");
  if (reduced) root.classList.add("is-reduced");
  (async () => {
    const inTime = await fontsReady(1600);
    if (!alive) return;
    fontsLate = !inTime && !fontsIn();
    await lay(true);
    if (DEBUG && !playing) expose();
  })();

  // ── the cursor (desktop, GL): the contours on natural ground make way, then settle ──
  if (!phone && !reduced && window.matchMedia("(pointer: fine)").matches) {
    let cx = 0;
    let cy = 0;
    let vx = 0;
    let vy = 0;
    let amt = 0;
    let lastT = 0;
    let lastX = 0;
    let lastY = 0;
    let crf = 0;
    const R = 120;
    const step = (now: number) => {
      crf = 0;
      if (!alive || !gl || !layers || layers.kind !== "gl" || !finished) return;
      const dt = clamp(now - (lastT || now), 1, 100);
      lastT = now;
      if (PERF) ((window as unknown as { __t0cur?: number[] }).__t0cur ??= []).push(Math.round(amt * 100) / 100);
      // the push follows the cursor's motion and relaxes when it stops
      const k = 1 - Math.exp(-dt / 140);
      vx += (0 - vx) * k;
      vy += (0 - vy) * k;
      amt = Math.hypot(vx, vy);
      if (amt < 0.05) {
        vx = vy = 0;
        gl.draw({ front: 1e6, band: TL.band, entrance: false });
        if (PERF) ((window as unknown as { __t0cur?: number[] }).__t0cur ??= []).push(-1);
        return;
      }
      gl.draw({ front: 1e6, band: TL.band, entrance: false, cursor: { x: cx, y: cy, dx: vx, dy: vy, r: R } });
      crf = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !finished || !gl || layers?.kind !== "gl") return;
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > r.height) return;
      const now = performance.now();
      if (lastX || lastY) {
        // a gentle push in the direction of travel, capped at 14 px
        vx = clamp(vx + (x - lastX) * 0.35, -14, 14);
        vy = clamp(vy + (y - lastY) * 0.35, -14, 14);
      }
      lastX = x;
      lastY = y;
      cx = x;
      cy = y;
      if (!crf) {
        lastT = now;
        crf = requestAnimationFrame(step);
      }
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    offs.push(() => {
      root.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(crf);
    });
  }

  // ── resize: lay out again and show the rest frame (phones ignore height-only changes) ──
  let rt = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  const relay = () => {
    if (!alive || !geo) return;
    if (!finished) toRest();
    void lay(false);
  };
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === lastW && (phone || h === lastH)) return;
    lastW = w;
    lastH = h;
    clearTimeout(rt);
    rt = window.setTimeout(relay, 140);
  };
  window.addEventListener("resize", onResize);
  const onFonts = () => {
    if (!fontsLate || !fontsIn()) return;
    fontsLate = false;
    clearTimeout(rt);
    rt = window.setTimeout(relay, 60);
  };
  document.fonts?.addEventListener("loadingdone", onFonts);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    timers.splice(0).forEach(clearTimeout);
    anims.forEach((a) => a.cancel());
    clearTimeout(rt);
    window.removeEventListener("resize", onResize);
    document.fonts?.removeEventListener("loadingdone", onFonts);
    offs.splice(0).forEach((f) => f());
    clearLayers();
    gl?.destroy();
    gl = null;
    root.classList.remove("is-laid", "is-live", "is-rest", "is-pre", "is-moving");
  };
}
