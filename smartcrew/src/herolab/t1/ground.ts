// t1 · the engine of "The Site Model" (./HeroT1.tsx).
//
// 1. Fit the headline to the screen (the fonts first: the pad is measured from the set type).
// 2. Measure the copy's blocks: the level pad is their union (a narrower top over a wider base).
// 3. Ask the worker (./terrain.worker.ts) for the land, graded round the pad and cut into sheets,
//    one per 5 ft index interval. Its field sampling starts at mount, while the fonts load.
// 4. Build one SVG per sheet: paper, the shadow of the sheet above, and its band's contour lines.
// 5. The entrance (first visit in a session): the model sits three-quarter (desktop: rotateX 56°,
//    rotateZ −16°, scale .84; phones: rotateX 48°), sheets 7 px apart, the copy printed on its pad.
//    One eased camera move (WAAPI on .t1-model) tips it flat while the stack closes up (WAAPI on
//    .t1-zs, a z-scale): the parallax that showed each sheet's edge and shadow goes to 0 by
//    itself. On landing, in one frame: the transforms and the paper go, and the sheets are the
//    plan (flat SVGs, nothing composited, nothing animates). Then the labels and the foot.
// No rAF anywhere; the button is in the DOM and clickable from the model's first frame (hit
// testing follows transforms). Any input lands it at once. Reduced motion: the rest frame.
// Later visits in the session: a short settle. ?t1=full|settle|rest forces one; ?t1Debug builds
// the entrance paused (window.__t1.seek(ms)).

import { markFirstScreenDone, markPageReady } from "../../site/ready";
import type { Box, Ink, InkKey, Pad, Rect } from "./terrain";
import type { PlanReq, PlanRes } from "./terrain.worker";

export type T1Opts = { phone: boolean; reduced: boolean };

const NS = "http://www.w3.org/2000/svg";
const DISPLAY = '"SmartCrew Display"';
const TEXT = '"SmartCrew Text"';
const EIO = "cubic-bezier(0.42, 0, 0.18, 1)";
const EO = "cubic-bezier(0.22, 1, 0.36, 1)";

/** The camera move; t = 0 is the model's first frame (ms). */
type Move = { rx: number; rz: number; s: number; ty: number; m: number; sep: number; persp: number; fade: number; from: number; to: number; zHold: number; labels: number; labelsDur: number };
const DESK: Move = { rx: 56, rz: -16, s: 0.76, ty: -34, m: 0, sep: 7, persp: 2000, fade: 220, from: 90, to: 980, zHold: 0.3, labels: 1030, labelsDur: 340 };
const PHONE: Move = { rx: 46, rz: -9, s: 0.7, ty: -10, m: 90, sep: 6, persp: 1100, fade: 200, from: 80, to: 860, zHold: 0.25, labels: 900, labelsDur: 300 };

/** museum board: the paper is the page's ground, so a closed stack seen from above is the plan */
const PAPER = "#fbf8f4";
/** the gap under a sheet's edge, seen only while the stack is apart (true parallax) */
const UNDER = "#ddd3c7";
/** the base board's cut edge */
const EDGE = "#b9ab9c";

/** How long the first frame may wait for the land before the copy shows flat (the land fades in when it lands); ?t1Wait=ms (lab). */
const LAND_WAIT = (typeof location !== "undefined" && Number(new URLSearchParams(location.search).get("t1Wait"))) || 650;
const SEEN_KEY = "t1-seen";
/** the sheets' line classes, minor first (the index lines draw over them) */
const INK_KEYS: InkKey[] = ["nm", "pm", "nmn", "pmn", "ni", "pi", "nin", "pin"];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}

/** The pad is measured from real glyph boxes: wait for the faces (preloaded), at most `ms`. */
function fontsReady(ms: number): Promise<boolean> {
  const f = document.fonts;
  if (!f) return Promise.resolve(true);
  const loads = Promise.all([f.load(`700 96px ${DISPLAY}`, "See what every job"), f.load(`400 16px ${TEXT}`, "GPS fills"), f.load(`600 16px ${TEXT}`, "GPS fills")])
    .then(() => f.ready)
    .then(() => true);
  return Promise.race([loads, new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);
}
const fontsIn = () => !document.fonts || (document.fonts.check(`700 96px ${DISPLAY}`, "See what") && document.fonts.check(`400 16px ${TEXT}`, "GPS"));

// ── the worker ─────────────────────────────────────────────────────────────────────────

let worker: Worker | null | undefined;
let nextId = 1;
const waiting = new Map<number, (r: PlanRes) => void>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./terrain.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<PlanRes>) => {
      const f = waiting.get(e.data.id);
      waiting.delete(e.data.id);
      f?.(e.data);
    };
  } catch {
    worker = null;
  }
  return worker;
}

type Req = Omit<PlanReq, "id" | "kind">;

function requestPlan(r: Req): Promise<PlanRes> {
  const w = getWorker();
  if (!w) {
    // no workers: on the main thread, in an idle moment
    return import("./terrain").then(
      (m) =>
        new Promise<PlanRes>((res) => {
          const run = () => {
            const t = performance.now();
            const f = m.buildField(r.W, r.H, r.Hv, r.phone, r.m);
            const fieldMs = performance.now() - t;
            const { lines: _l, ...plan } = m.buildPlan(f, r);
            res({ id: 0, kind: "plan", plan, lines: new Float32Array(0), lineIdx: new Int32Array(0), fieldMs, planMs: performance.now() - t - fieldMs });
          };
          if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 300 });
          else setTimeout(run, 0);
        }),
    );
  }
  return new Promise((res) => {
    const id = nextId++;
    waiting.set(id, res);
    w.postMessage({ ...r, id, kind: "plan" } satisfies PlanReq);
  });
}

const DEBUG = typeof location !== "undefined" && /[?&]t1Debug\b/.test(location.search);

// ── the engine ─────────────────────────────────────────────────────────────────────────

type Mode = "full" | "settle" | "rest";
type Geo = { W: number; H: number; Hv: number; pads: Pad[]; keep: Rect[]; quiet: Rect[]; to: [number, number]; foot: Rect[]; padEl: { x: number; y: number; anchor: string } | null };

export function mountT1(root: HTMLElement, o: T1Opts): () => void {
  const phone = o.phone;
  const M = phone ? PHONE : DESK;
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll(s)] as T[];
  const cam = q(".t1-cam");
  const model = q(".t1-model");
  const zs = q(".t1-zs");
  const host = q(".t1-sheets");
  const table = q(".t1-table");
  const copy = q(".t1-copy");
  const foot = q(".t1-foot");
  const labelsSvg = q<SVGSVGElement>(".t1-labels");
  const dpr = window.devicePixelRatio || 1;
  // sheets under / over the pad's (the rest merge into the base board and the top sheet);
  // ?t1Depth=b,a overrides (lab)
  const dq = new URLSearchParams(location.search).get("t1Depth")?.split(",").map(Number);
  const DEPTH: [number, number] = dq && dq.length === 2 && dq.every((n) => n >= 0 && n < 9) ? [dq[0], dq[1]] : phone ? [2, 2] : [3, 2];
  root.classList.add(dpr < 1.5 ? "t1-d1" : dpr >= 2.5 ? "t1-d3" : "t1-d2");

  let alive = true;
  let anims: Animation[] = [];
  let state: "wait" | "move" | "land" | "rest" = "wait";
  let geo: Geo | null = null;
  let plan: PlanRes | null = null;
  const marks: Record<string, number> = {};
  const offs: (() => void)[] = [];

  const forced = new URLSearchParams(location.search).get("t1");
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    /* storage blocked: every visit is a first visit */
  }
  const can3d = typeof CSS !== "undefined" && CSS.supports("transform-style", "preserve-3d");
  let mode: Mode = forced === "full" || forced === "settle" || forced === "rest" ? forced : o.reduced ? "rest" : seen ? "settle" : "full";
  if (mode === "full" && !can3d) mode = "settle";

  // ── 1 · fit the headline ──

  /** desktop: the copy ends this far above the logos row */
  const copyLimit = () => q(".t1-logos").getBoundingClientRect().top - root.getBoundingClientRect().top - 16;

  function overflow() {
    const R = root.getBoundingClientRect();
    if (phone) {
      const vis = Math.min(window.innerHeight, 900);
      const cta = q(".t1-cta-wrap").getBoundingClientRect().bottom - R.top;
      const cue = q(".t1-cue").getBoundingClientRect().bottom - R.top;
      // the button by 500 px, the scroll cue fully on screen (never straddling the fold)
      return Math.max(cta - Math.min(500, vis - 150), cue - (vis - 2));
    }
    return 70 + copy.offsetHeight - copyLimit();
  }

  function fit() {
    const h1 = q(".t1-h1");
    root.style.removeProperty("--fs");
    root.style.removeProperty("--copy-top");
    const cur = parseFloat(getComputedStyle(h1).fontSize);
    const W = root.clientWidth;
    const g = phone ? 16 : clamp(W * 0.04, 20, 64);
    const avail = W - 2 * g;
    let fsW = Infinity;
    for (const ln of qa(".t1-line-in")) fsW = Math.min(fsW, (avail * cur) / (ln.offsetWidth || 1));
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
      const space = copyLimit() - 70 - copy.offsetHeight;
      root.style.setProperty("--copy-top", `${(70 + Math.max(0, space * 0.42)).toFixed(1)}px`);
    }
  }

  // ── 2 · measure the pad ──

  function measure(): Geo {
    const R = root.getBoundingClientRect();
    const W = root.clientWidth;
    const H = root.clientHeight;
    const Hv = phone ? Math.min(window.innerHeight, H) : H;
    const rel = (e: Element): Rect => {
      const r = e.getBoundingClientRect();
      return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height };
    };
    const cx = W / 2;
    // the copy's rows, each made symmetric about the axis (the copy is centred; the demo link
    // hangs off the button's right, so its row is mirrored)
    const rows: Rect[] = [];
    const sym = (r: Rect): Rect => {
      const half = Math.max(cx - r.x, r.x + r.w - cx);
      return { x: cx - half, y: r.y, w: half * 2, h: r.h };
    };
    if (!phone) rows.push(sym(rel(q(".t1-eyebrow"))));
    for (const l of qa(".t1-line-in")) rows.push(sym(rel(l)));
    rows.push(sym(rel(q(".t1-sub"))));
    const a = rel(q(".t1-cta-wrap"));
    const d = rel(q(".t1-demo"));
    const ax0 = Math.min(a.x, d.x);
    const ax1 = Math.max(a.x + a.w, d.x + d.w);
    const ay0 = Math.min(a.y, d.y);
    const ay1 = Math.max(a.y + a.h, d.y + d.h);
    rows.push(sym({ x: ax0, y: ay0, w: ax1 - ax0, h: ay1 - ay0 }));
    const mi = rel(q(".t1-micro"));
    // desktop: the pad's elevation note sits on the micro line's baseline, to its right (the pad
    // makes room for it)
    const NOTE_GAP = 36;
    const NOTE_W = 134;
    rows.push(sym(phone ? mi : { ...mi, w: mi.w + NOTE_GAP + NOTE_W }));
    const m = phone ? 12 : 22;
    const r = phone ? 22 : 30;
    const pads: Pad[] = [];
    if (phone) {
      // the copy is the screen's width: one pad, from the headline to the scroll cue
      const top = rows[0].y - m;
      const cue = rel(q(".t1-cue"));
      // (wider than the screen: its slopes run off the sides, never down the screen's edges)
      pads.push({ x: -36, y: top, w: W + 72, h: cue.y + cue.h + m - top, r });
    } else {
      // rows of a similar width merge into one block; a much wider or narrower row starts a new one
      let b: { x0: number; x1: number; y0: number; y1: number } | null = null;
      const flush = () => b && pads.push({ x: b.x0 - m, y: b.y0 - m, w: b.x1 - b.x0 + 2 * m, h: b.y1 - b.y0 + 2 * m, r });
      for (const row of rows) {
        const w = row.w;
        if (b && Math.abs(w - (b.x1 - b.x0)) / Math.max(w, b.x1 - b.x0) < 0.36) {
          b.x0 = Math.min(b.x0, row.x);
          b.x1 = Math.max(b.x1, row.x + row.w);
          b.y1 = Math.max(b.y1, row.y + row.h);
        } else {
          flush();
          b = { x0: row.x, x1: row.x + row.w, y0: row.y, y1: row.y + row.h };
        }
      }
      flush();
    }
    // the pad's centroid: the camera's pivot
    let px = 0;
    let py = 0;
    let pa = 0;
    for (const p of pads) {
      px += (p.x + p.w / 2) * p.w * p.h;
      py += (p.y + p.h / 2) * p.w * p.h;
      pa += p.w * p.h;
    }
    const footRects = phone ? [] : [rel(q(".t1-logos")), rel(q(".t1-cue"))];
    const head = phone ? 56 : 72;
    const footBox = footRects.map((f) => ({ x: f.x - 14, y: f.y - 12, w: f.w + 28, h: f.h + 24 }));
    const keep: Rect[] = [...pads, { x: 0, y: 0, w: W, h: head }, ...footBox];
    const quiet: Rect[] = [{ x: -40, y: -40, w: W + 80, h: head + 40 }, ...footBox];
    const padEl: Geo["padEl"] = phone ? null : { x: mi.x + mi.w + NOTE_GAP, y: mi.y + mi.h * 0.76, anchor: "start" };
    return { W, H, Hv, pads, keep, quiet, to: [px / pa, py / pa], foot: footRects, padEl };
  }

  const req = (g: Geo): Req => ({ W: g.W, H: g.H, Hv: g.Hv, m: M.m, phone, pads: g.pads, blend: phone ? 24 : 36, keep: g.keep, quiet: g.quiet, labels: phone ? 2 : 4, labelGap: phone ? 190 : 250 });

  // ── 4 · the sheets ──

  function build(res: PlanRes, g: Geo, withPaper: boolean) {
    host.textContent = "";
    const all = res.plan.sheets;
    if (!all.length) return buildLabels(res, g);
    // the stack: at most `below` sheets under the pad and `above` over it; the outer sheets merge
    // into the base board and the top sheet (printed on them: no parallax that far out, no layers)
    const kp0 = Math.min(all.length - 1, res.plan.padSheet);
    const lo = Math.max(0, kp0 - DEPTH[0]);
    const hi = Math.min(all.length - 1, kp0 + DEPTH[1]);
    type Layer = { fill: string; inner: string; ink: Ink; box: Box };
    const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
    const merge = (into: Ink, from: Ink) => {
      for (const k of INK_KEYS) if (from[k]) into[k] = (into[k] ?? "") + from[k];
    };
    const stack: Layer[] = [];
    for (let k = lo; k <= hi; k++) {
      const s = all[k];
      const ink: Ink = { ...s.ink };
      let box = union(s.fillBox, s.inkBox);
      let fill = s.fill;
      if (k === lo && lo > 0) {
        // the base board: the whole frame, with the lower bands printed on it
        fill = all[0].fill;
        box = union(box, all[0].fillBox);
        for (let j = 0; j < lo; j++) {
          merge(ink, all[j].ink);
          box = union(box, all[j].inkBox);
        }
      }
      if (k === hi) {
        for (let j = hi + 1; j < all.length; j++) {
          merge(ink, all[j].ink);
          box = union(box, all[j].inkBox);
        }
      }
      stack.push({ fill, inner: s.inner, ink, box });
    }
    const kp = kp0 - lo;
    const step = phone ? 6 : 7;
    const e = M.m + step + 2;
    stack.forEach((s, k) => {
      const b = s.box;
      if (!Number.isFinite(b[0])) return;
      const x0 = Math.floor(Math.max(-e, b[0] - 2));
      const y0 = Math.floor(Math.max(-e, b[1] - 2));
      const x1 = Math.ceil(Math.min(g.W + e, b[2] + 2));
      const y1 = Math.ceil(Math.min(g.H + e, b[3] + 2));
      const svg = svgEl("svg", { width: x1 - x0, height: y1 - y0, viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, "data-k": k, "data-z": (k - kp) * M.sep });
      svg.style.left = `${x0}px`;
      svg.style.top = `${y0}px`;
      if (withPaper && s.fill) {
        const paper = svgEl("g", { class: "t1-paper" }, svg);
        const up = stack[k + 1];
        // the paper is a band: this sheet's region, less the sheet above (it backs only a few px
        // under that sheet's edge, where the gap shows); no overdraw, and its hole costs nothing
        // (a 1 px paper outset hides the antialiased fringe of the shadow strip below once the
        // stack has closed: no dark rim on the last frames, nothing to pop off on landing)
        svgEl("path", k === 0 ? { d: s.fill + (up?.inner ?? ""), fill: PAPER, "fill-rule": "evenodd", stroke: EDGE, "stroke-width": 1 } : { d: s.fill + (up?.inner ?? ""), fill: PAPER, "fill-rule": "evenodd", stroke: PAPER, "stroke-width": 2, "stroke-linejoin": "round" }, paper);
        // the sheet above, printed in shadow along that strip: it shows only through the gap under
        // that sheet's edges while the stack is apart, and is covered exactly once it closes
        if (up?.fill) svgEl("path", { d: up.fill + up.inner, fill: UNDER, "fill-rule": "evenodd" }, paper);
      }
      for (const key of INK_KEYS) if (s.ink[key]) svgEl("path", { d: s.ink[key]!, class: `t1-${key}` }, svg);
      host.appendChild(svg);
    });
    if (withPaper) {
      const z0 = (0 - kp) * M.sep - 1.5;
      const t = M.m + step;
      Object.assign(table.style, { left: `${-t}px`, top: `${-t}px`, width: `${g.W + 2 * t}px`, height: `${g.H + 2 * t}px`, right: "auto", bottom: "auto", transform: `translateZ(${z0}px)` });
    }
    buildLabels(res, g);
    if (!phone) {
      indexLines(res);
      probeSvg.setAttribute("width", String(g.W));
      probeSvg.setAttribute("height", String(g.H));
      probeSvg.setAttribute("viewBox", `0 0 ${g.W} ${g.H}`);
    }
  }

  function buildLabels(res: PlanRes, g: Geo) {
    labelsSvg.textContent = "";
    labelsSvg.setAttribute("width", String(g.W));
    labelsSvg.setAttribute("height", String(g.H));
    labelsSvg.setAttribute("viewBox", `0 0 ${g.W} ${g.H}`);
    for (const l of res.plan.labels) {
      const t = svgEl("text", { class: "t1-lbl", "text-anchor": "middle", "dominant-baseline": "central", transform: `translate(${l.x} ${l.y}) rotate(${l.a})` }, labelsSvg);
      t.textContent = l.t;
    }
    if (g.padEl) {
      const t = svgEl("text", { class: "t1-padel", x: g.padEl.x, y: g.padEl.y, "text-anchor": g.padEl.anchor }, labelsSvg);
      t.textContent = `PAD EL. ${res.plan.padEl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    }
  }

  /** the 3D transforms on (z per sheet, the copy just above the pad) */
  function setZ(on: boolean) {
    for (const s of [...host.children] as SVGSVGElement[]) s.style.transform = on ? `translateZ(${s.dataset.z}px)` : "";
    copy.style.transform = on ? "translateZ(0.6px)" : "";
    foot.style.transform = on ? "translateZ(0.6px)" : "";
  }

  function dropPaper() {
    for (const p of qa(".t1-paper")) p.remove();
  }

  // ── 5 · the entrance ──

  const cancelAll = () => {
    anims.forEach((a) => a.cancel());
    anims = [];
  };

  const mark = (n: string) => {
    marks[n] = performance.now();
    try {
      performance.mark(`t1-${n}`);
    } catch {
      /* fine */
    }
  };

  function playFull(g: Geo) {
    state = "move";
    mark("first");
    root.style.setProperty("--persp", `${M.persp}px`);
    root.style.setProperty("--po", `${g.to[0].toFixed(1)}px ${g.to[1].toFixed(1)}px`);
    root.style.setProperty("--to", `${g.to[0].toFixed(1)}px ${g.to[1].toFixed(1)}px`);
    setZ(true);
    root.classList.add("is-3d", "is-pre-foot", "is-on");
    const dur = M.to - M.from;
    // (fill "backwards": once in, the effect ends, so no group surface stays round the 3D stack)
    // (from 0.01, not 0: the headline counts as painted on the first frame, for Largest Contentful Paint)
    anims.push(cam.animate([{ opacity: 0.01 }, { opacity: 1 }], { duration: M.fade, easing: EO, fill: "backwards" }));
    anims.push(
      // the model starts small by distance, not by scale(): the layers' own scale stays 1, so the
      // compositor rasters them at full resolution from the first frame and the copy lands crisp
      // (a scale() start rasters at 0.76 and upscales: the headline goes soft, then snaps sharp)
      model.animate([{ transform: `translateY(${M.ty}px) translateZ(${(-M.persp * (1 / M.s - 1)).toFixed(1)}px) rotateX(${M.rx}deg) rotateZ(${M.rz}deg)` }, { transform: "translateY(0px) translateZ(0px) rotateX(0deg) rotateZ(0deg)" }], {
        delay: M.from,
        duration: dur,
        easing: EIO,
        fill: "both",
      }),
    );
    anims.push(zs.animate([{ transform: "scale3d(1, 1, 1)" }, { transform: "scale3d(1, 1, 1)", offset: M.zHold }, { transform: "scale3d(1, 1, 0.02)" }], { delay: M.from, duration: dur, easing: EIO, fill: "both" }));
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* fine */
    }
    if (DEBUG) {
      anims.forEach((a) => a.pause());
      return;
    }
    anims[1].finished.then(() => alive && state === "move" && land(false), () => {});
  }

  /** The camera has landed: one frame from the model to the plan. */
  function land(skip: boolean) {
    if (state !== "move") return;
    state = "land";
    mark("land");
    cancelAll();
    root.classList.remove("is-3d");
    setZ(false);
    dropPaper();
    markPageReady();
    // the labels and the foot
    root.classList.remove("is-pre-foot");
    if (skip) return rest();
    const delay = Math.max(0, M.labels - M.to);
    anims = [foot, labelsSvg].map((e) => e.animate([{ opacity: 0 }, { opacity: 1 }], { delay, duration: M.labelsDur, easing: EO, fill: "backwards" }));
    if (DEBUG) {
      anims.forEach((a) => a.pause());
      return;
    }
    anims[0].finished.then(() => alive && state === "land" && rest(), () => {});
  }

  function rest() {
    cancelAll();
    root.classList.remove("is-3d", "is-pre-foot");
    root.classList.add("is-on", "is-rest");
    state = "rest";
    mark("rest");
    markPageReady();
    markFirstScreenDone();
  }

  function playSettle() {
    state = "move";
    mark("first");
    root.classList.add("is-on");
    dropPaper();
    anims.push(host.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 420, easing: EO }));
    anims.push(copy.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EO }));
    anims.push(...[foot, labelsSvg].map((e) => e.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 120, duration: 360, easing: EO, fill: "backwards" })));
    markPageReady();
    anims[0].finished.then(() => alive && state === "move" && rest(), () => {});
  }

  // any input lands it at once
  const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const finish = () => {
    if (state === "move" && !DEBUG) {
      if (root.classList.contains("is-3d")) land(true);
      else rest();
    } else if (state === "land") rest();
  };
  let afterClick = false;
  const onInput = (e: Event) => {
    if (state !== "move" && state !== "land") return;
    // a press on a control (the orange button above all) lands the model only after its click:
    // landing on the press would move the button out from under the finger before it lifts
    const t = e.target as Element | null;
    if ((e.type === "pointerdown" || e.type === "touchstart") && t?.closest?.("a, button, [role=button], input, label")) {
      if (!afterClick) {
        afterClick = true;
        const done = () => {
          afterClick = false;
          window.removeEventListener("click", done, true);
          window.removeEventListener("pointercancel", done, true);
          setTimeout(finish, 0);
        };
        window.addEventListener("click", done, true);
        window.addEventListener("pointercancel", done, true);
      }
      return;
    }
    finish();
  };
  INPUTS.forEach((t) => window.addEventListener(t, onInput, { passive: true, capture: true }));
  offs.push(() => INPUTS.forEach((t) => window.removeEventListener(t, onInput, { capture: true })));

  // ── the contour readout (desktop, at rest): the line under the cursor reads its elevation ──

  const probeSvg = q<SVGSVGElement>(".t1-probe");
  let probeIdx: { cell: Map<number, number[]>; pts: Float32Array; idx: Int32Array } | null = null;
  const CELL = 32;
  const REACH = 22;

  function indexLines(res: PlanRes) {
    // the runs, densified to a sample every 6 px (a long straight line keeps only its ends after
    // simplification), hashed into 32 px cells: [run, x, y, arc length]
    const cell = new Map<number, number[]>();
    const { lines: src, lineIdx: idx } = res;
    const out: number[] = [];
    for (let r = 0; r < idx.length / 3; r++) {
      const o = idx[r * 3 + 1];
      const n = idx[r * 3 + 2];
      let s = 0;
      for (let i = o; i < o + n - 2; i += 2) {
        const ax = src[i];
        const ay = src[i + 1];
        const dx = src[i + 2] - ax;
        const dy = src[i + 3] - ay;
        const L = Math.hypot(dx, dy);
        const k = Math.max(1, Math.ceil(L / 6));
        for (let j = 0; j < k; j++) {
          const t = j / k;
          const x = ax + dx * t;
          const y = ay + dy * t;
          const at = out.length;
          out.push(r, x, y, s + L * t);
          const key = Math.floor(x / CELL) * 4096 + Math.floor(y / CELL);
          let a = cell.get(key);
          if (!a) cell.set(key, (a = []));
          a.push(at);
        }
        s += L;
      }
    }
    probeIdx = { cell, pts: Float32Array.from(out), idx };
  }

  /** the nearest line sample to (x, y) within REACH: [sample offset, distance] */
  function nearest(x: number, y: number): [number, number] | null {
    if (!probeIdx) return null;
    const { cell, pts } = probeIdx;
    let best: [number, number] | null = null;
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let i = cx - 1; i <= cx + 1; i++)
      for (let j = cy - 1; j <= cy + 1; j++) {
        const a = cell.get(i * 4096 + j);
        if (!a) continue;
        for (const at of a) {
          const d = Math.hypot(pts[at + 1] - x, pts[at + 2] - y);
          if (d < REACH && (!best || d < best[1])) best = [at, d];
        }
      }
    return best;
  }

  let probeRun = -1;
  let probeT = 0;
  let probeRaf = 0;
  let px = 0;
  let py = 0;
  const probeG = svgEl("g", { class: "t1-probe-g" }, probeSvg);
  const defs = svgEl("defs", {}, probeSvg);
  const grad = svgEl("radialGradient", { id: "t1-probe-fade", gradientUnits: "userSpaceOnUse", r: 150 }, defs);
  svgEl("stop", { offset: 0, "stop-color": "#fff" }, grad);
  svgEl("stop", { offset: 0.55, "stop-color": "#fff", "stop-opacity": 0.6 }, grad);
  svgEl("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, grad);
  const mask = svgEl("mask", { id: "t1-probe-m", maskUnits: "userSpaceOnUse", x: -4000, y: -4000, width: 9000, height: 9000 }, defs);
  const maskRect = svgEl("rect", { x: -4000, y: -4000, width: 9000, height: 9000, fill: "url(#t1-probe-fade)" }, mask);
  const probeLine = svgEl("path", { class: "t1-probe-line", mask: "url(#t1-probe-m)" }, probeG);
  const probeText = svgEl("text", { class: "t1-lbl t1-probe-lbl", "text-anchor": "middle", "dominant-baseline": "central" }, probeG);
  void maskRect;

  function probeAt() {
    probeRaf = 0;
    if (state !== "rest" || !probeIdx || !geo) return;
    const R = root.getBoundingClientRect();
    const x = px - R.left;
    const y = py - R.top;
    const hit = y > 72 && nearest(x, y);
    if (!hit) {
      if (probeRun >= 0) {
        probeRun = -1;
        probeSvg.classList.remove("is-on");
      }
      return;
    }
    const [at] = hit;
    const { pts: S, idx } = probeIdx;
    const run = S[at];
    const src = plan!.lines;
    const o = idx[run * 3 + 1];
    const n = idx[run * 3 + 2];
    if (run !== probeRun) {
      let d = `M${src[o].toFixed(1)} ${src[o + 1].toFixed(1)}`;
      for (let i = o + 2; i < o + n; i += 2) d += `L${src[i].toFixed(1)} ${src[i + 1].toFixed(1)}`;
      probeLine.setAttribute("d", d);
      probeText.textContent = idx[run * 3].toLocaleString("en-US");
      probeRun = run;
    }
    // the readout is set on the line itself, 46 px along it from the cursor (clear of the
    // pointer), upright: the sample that far along the same run, whichever side has room
    const s0 = S[at + 3];
    let lab = -1;
    for (const dir of [1, -1]) {
      for (let k = at; k >= 0 && k < S.length && S[k] === run; k += 4 * dir) {
        if (Math.abs(S[k + 3] - s0) >= 46) {
          lab = k;
          break;
        }
      }
      if (lab >= 0) break;
    }
    if (lab < 0) lab = at;
    const k0 = Math.max(0, lab - 8);
    const k1 = Math.min(S.length - 4, lab + 8);
    const a0 = S[k0] === run ? k0 : lab;
    const a1 = S[k1] === run ? k1 : lab;
    let ang = a0 === a1 ? 0 : (Math.atan2(S[a1 + 2] - S[a0 + 2], S[a1 + 1] - S[a0 + 1]) * 180) / Math.PI;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    probeText.setAttribute("transform", `translate(${S[lab + 1].toFixed(1)} ${S[lab + 2].toFixed(1)}) rotate(${ang.toFixed(1)})`);
    grad.setAttribute("cx", S[at + 1].toFixed(1));
    grad.setAttribute("cy", S[at + 2].toFixed(1));
    probeSvg.classList.add("is-on");
    clearTimeout(probeT);
    // the cursor has stopped: the readout stays until it moves off the line (nothing animates at rest)
  }

  if (!phone && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      // over the copy or any control: no readout
      const t = e.target as Element | null;
      if (t?.closest?.("a, button, .t1-copy > *, .t1-foot > *, header")) {
        if (probeRun >= 0) {
          probeRun = -1;
          probeSvg.classList.remove("is-on");
        }
        return;
      }
      if (!probeRaf) probeRaf = requestAnimationFrame(probeAt);
    };
    const onLeave = () => {
      probeRun = -1;
      probeSvg.classList.remove("is-on");
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    offs.push(() => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(probeRaf);
    });
  }

  // ── go ──

  async function start() {
    // the land's sampling starts now, while the fonts load (the field depends on the size only)
    const W0 = root.clientWidth;
    const H0 = root.clientHeight;
    getWorker()?.postMessage({ id: 0, kind: "field", W: W0, H: H0, Hv: phone ? Math.min(window.innerHeight, H0) : H0, m: M.m, phone });
    const ok = await fontsReady(1600);
    if (!alive) return;
    fit();
    root.classList.add("is-laid");
    const g = (geo = measure());
    mark("laid");
    const wanted = requestPlan(req(g));
    const res = mode === "rest" ? await wanted : await Promise.race([wanted, new Promise<null>((r) => setTimeout(() => r(null), LAND_WAIT))]);
    if (!alive) return;
    if (!res) {
      // the land is late: the copy now, flat; the plan settles in when it lands
      marks.late = 1;
      mode = "settle";
      root.classList.add("is-on");
      playSettleCopyOnly();
      wanted.then((r) => {
        if (!alive) return;
        plan = r;
        build(r, g, false);
        host.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: EO });
      });
    } else {
      plan = res;
      mark("plan");
      build(res, g, mode === "full");
      if (mode === "full") playFull(g);
      else if (mode === "settle") playSettle();
      else {
        root.classList.add("is-on");
        rest();
      }
    }
    if (!ok) {
      // the fonts raced past 1.6 s: re-place once when they arrive
      const f = document.fonts;
      const re = () => {
        if (fontsIn()) {
          f.removeEventListener("loadingdone", re);
          relayout();
        }
      };
      f?.addEventListener("loadingdone", re);
      offs.push(() => f?.removeEventListener("loadingdone", re));
    }
  }

  function playSettleCopyOnly() {
    state = "move";
    mark("first");
    anims.push(copy.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EO }));
    anims.push(...[foot, labelsSvg].map((e) => e.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 120, duration: 360, easing: EO, fill: "backwards" })));
    markPageReady();
    anims[0].finished.then(() => alive && state === "move" && rest(), () => {});
  }

  /** a new width (or late fonts): fit, measure and cut the land again; no entrance */
  async function relayout() {
    if (!alive) return;
    if (state === "move") finish();
    fit();
    const g = (geo = measure());
    const r = await requestPlan(req(g));
    if (!alive) return;
    plan = r;
    build(r, g, false);
  }

  let rw = window.innerWidth;
  let rh = window.innerHeight;
  let rt = 0;
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // phones ignore height-only changes (the URL bar)
    if (w === rw && (phone || h === rh)) return;
    rw = w;
    rh = h;
    clearTimeout(rt);
    rt = window.setTimeout(relayout, 140);
  };
  window.addEventListener("resize", onResize);
  offs.push(() => window.removeEventListener("resize", onResize));

  if (DEBUG || /[?&]t1Marks\b/.test(location.search)) {
    (window as unknown as { __t1: unknown }).__t1 = {
      seek(ms: number) {
        if (state === "move" && root.classList.contains("is-3d")) {
          if (ms < M.to) {
            anims.forEach((a) => (a.currentTime = ms));
            return;
          }
          land(false);
        }
        if (state === "land") anims.forEach((a) => (a.currentTime = Math.max(0, ms - M.to)));
      },
      state: () => ({ state, mode, marks, geo, stats: plan?.plan.stats, fieldMs: plan?.fieldMs, planMs: plan?.planMs, sheets: plan?.plan.sheets.length, padSheet: plan?.plan.padSheet }),
      move: M,
    };
  }

  start();

  return () => {
    alive = false;
    cancelAll();
    // unmounted mid-move (the phone/laptop layout switched): leave the hero flat
    root.classList.remove("is-3d", "is-pre-foot");
    setZ(false);
    clearTimeout(rt);
    offs.forEach((f) => f());
  };
}
