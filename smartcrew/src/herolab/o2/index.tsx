// Opening O2 · "The office sees it" (scratchpad design/v2/opening/OPENING_BRIEF.md).
//
// The page opens on the office's own screen: SmartCrew's list of today's jobs (the app's UI, in
// the page's type). Hwy 9 Culvert is staked in its geofence with Elena (ER) already clocked in;
// Marcus (MB) walks into the fence and clocks in, and the office row says so: "Clocked In · Marcus
// Bell · 6:42 AM". Then the Hwy 9 row lifts out of the list and unfolds into the hero ("Fence the
// Words"): its geofence opens out into the fence round "every job", ER and MB ride it to their
// markers, the job's name and today's number become the hero's tag (desktop) or its job chip
// (phones); the rest of the list falls away under the headline. The fence, the crew, the name
// and the number are never swapped: each one the hero shows at rest on the landing frame is the
// one the visitor just watched travel there. (Marcus's 6:42 then fades in beside his marker.)
//
// It drives the hero only through its public hooks (src/site/hero/fence/opening.ts): it waits for
// the hero to be laid out, reads where every piece rests (getHeroTargets, plus the hero's own DOM
// for the tag's and chip's text runs), and hands over with heroEnter({ …: "given" }). The hero's
// given pieces stay hidden (html.o2-fly, ./o2.css) until the frame this opening's copies land.
//
// Cost: the list renders in its own task right after the hero's layout; the mount makes no
// animation (the list's entrance is CSS); everything else is built just after the first frame, on
// its time base. PHONE MODE (≤ 760 px): transform and opacity only, WAAPI only (one rAF to find
// the first frame, none after); one small layout read after the first frame. Desktop adds one
// short rAF piece: the fence's six stakes spring from the row's fence to the headline's (≤ 0.5 s),
// the way the hero's own stakes spring back when dragged.
//
// Any input (pointer, touch, wheel, key, scroll) or a width change lands everything at once. Once
// per session; never with reduced motion (the gate is the inline script in ./dev.html). If the
// hero is laid out too late for the opening to land the button in time, it doesn't play: the
// hero's own entrance runs (the orange button's time matters more than any animation).

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { HERO_JOBS } from "../../content/copy";
import { DAY_DATA } from "../../site/day/states/data";
import { heroEnter, whenHeroLaid, type HeroEnterOpts, type HeroTargets, type Pt } from "../../site/hero/fence/opening";
import { SPRING, polyPoints, springFrames } from "../../site/hero/fence/geom";
import markUrl from "../../site/assets/mark.svg";
import "./o2.css";

// ── timing (ms from the opening's first frame) ─────────────────────────────────────────────

type Span = readonly [number, number];
// (the list itself rises in over 0–240 ms: a CSS animation, .o2-in in ./o2.css)
type Beats = {
  /** Marcus walks into the Hwy 9 fence */
  walk: Span;
  /** …and clocks in: his ring flashes, his green dot pops, the fence pings */
  clock: number;
  /** the office row says so: "Clocked In · Marcus Bell · 6:42 AM" */
  event: Span;
  /** the list falls away; the Hwy 9 row lifts (its shadow), then lets go of its contents */
  lift: Span;
  /** the row's name and number travel to the tag / the chip: x and y on their own spans (an arc, up then over) */
  nameX: Span;
  nameY: Span;
  money: Span;
  /** the tag's / chip's own ground ties on under them */
  face: Span;
  /** the hero starts (headline, sub, button) */
  enter: number;
  /** the fence opens out (desktop: in place, round the rising words; phones: it rises to them) and the crew ride it */
  fence: Span;
  /** everything has landed: the hero's own pieces take over on this frame */
  land: number;
};

/**
 * The beats. The orange button is ≥ 60 % opaque at enter + 756 / SPEED (the hero's beat 600 + 156).
 * Desktop runs in two strokes: first the row's words leave the fenced line for the tag (straight
 * up out of the fence, then over; behind the headline's letters if they are rising by then), then
 * the fence opens out round "every job" as the words rise into it. Phones: the fence and the crew
 * rise into the headline first (it rises round the fence once it has arrived), while the name and
 * the number settle into the chip where they already are.
 */
const BEATS_DESK: Beats = {
  walk: [60, 310],
  clock: 290,
  event: [310, 460],
  lift: [620, 820],
  nameX: [730, 950],
  nameY: [660, 840],
  money: [690, 960],
  face: [830, 960],
  enter: 800,
  fence: [800, 1280],
  land: 1280,
};
const BEATS_PHONE: Beats = {
  walk: [60, 310],
  clock: 290,
  event: [310, 460],
  lift: [620, 840],
  nameX: [680, 1000],
  nameY: [680, 1000],
  money: [680, 1000],
  face: [720, 1000],
  enter: 830,
  fence: [650, 990],
  land: 1000,
};
export const BEATS = { desk: BEATS_DESK, phone: BEATS_PHONE };
/** The hero's entrance plays this much faster behind an opening (its button lands sooner). */
export const SPEED = 1.35;
/** Laid out later than this (ms after navigation start): no opening, the hero's own entrance. */
const LATE = 1250;

const EO = "cubic-bezier(0.22, 1, 0.36, 1)";
const EIO = "cubic-bezier(0.65, 0, 0.35, 1)";
const EI = "cubic-bezier(0.5, 0, 0.75, 0)";
const EPOP = "cubic-bezier(0.34, 1.5, 0.64, 1)";

const QS = typeof location !== "undefined" ? location.search : "";
const DEBUG = /[?&]o2Debug\b/.test(QS);
const HERO_DEBUG = /[?&]heroDebug\b/.test(QS);
const FORCED = /[?&]o2=1\b/.test(QS);
/** ?o2Perf: the opening's own mount phases, timed (window.__o2perf) */
const PERF: Record<string, number> | null = /[?&]o2Perf\b/.test(QS) ? ((window as unknown as { __o2perf: Record<string, number> }).__o2perf = {}) : null;
const mark = (k: string, t0: number) => PERF && (PERF[k] = +(performance.now() - t0).toFixed(1));

// ── data: the hero's jobs (HERO_JOBS, one source with the tag) and Marcus's clock-in ─────────

const MB = HERO_JOBS.crew.find((c) => c.id === "mb")!;
const ER = HERO_JOBS.crew.find((c) => c.id === "er")!;
/** Marcus Bell's clock-in (One Day's first moment; screens/data.ts clockIns[0]) */
const CLOCK = DAY_DATA.clockin;
const [CLOCK_HM, CLOCK_AP] = CLOCK.time.split(" ");

type Job = { key: string; job: string; today: string; tone: "pos" | "neg"; crew: boolean };
/** Hwy 9 has crew on the clock (ER, then MB); the other two show their geofence and today's number. */
const JOBS: Job[] = HERO_JOBS.rows.map((r, i) => ({ key: `j${i}`, job: r.job, today: r.today, tone: r.tone, crew: i === 0 }));

// ── geometry ────────────────────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };
const rectOf = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const bboxOf = (p: Pt[]): Rect => {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};
const px = (n: number) => `${n.toFixed(2)}px`;
const box = (b: Rect | null): CSSProperties => (b ? { left: b.x, top: b.y, width: b.w, height: b.h } : { display: "none" });

/** The list's sizes (desktop, phone). */
type Dims = { pad: number; head: number; row: number; half: number; point: number; mk: number; nameFs: number; moneyFs: number; gap: number };
const DESK: Dims = { pad: 30, head: 60, row: 88, half: 25, point: 18, mk: 28, nameFs: 20, moneyFs: 24, gap: 11 };
const PHONE: Dims = { pad: 14, head: 48, row: 68, half: 20, point: 12, mk: 24, nameFs: 15.5, moneyFs: 15, gap: 9 };
/** Phones: the site and today's number keep at least this much air between them (narrow phones set smaller). */
const PHONE_AIR = 30;
/** Phones: the Hwy 9 row is taller (its event line sits under its site). */
const PHONE_EVENT_ROW = 98;

let ctx: CanvasRenderingContext2D | null = null;
function textW(s: string, weight: number, size: number) {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * size * 0.55;
  ctx.font = `${weight} ${size}px "SmartCrew Text", sans-serif`;
  return ctx.measureText(s).width;
}

type RowL = { job: Job; y: number; cy: number; fence: Pt[]; nameX: number; mks: { er: number; mb: number }; slotIn: number };
type Layout = { phone: boolean; vw: number; d: Dims; card: Rect; rows: RowL[]; hwy: number; event: Pt; moneyR: number };

/**
 * Lay the list out round the hero's rest state. Desktop: the Hwy 9 row on the fenced line (its
 * fence opens out in place; its name and number rise into the tag above right). Phones: the Hwy 9
 * row where the job chip will be (its name and number settle into the chip; its fence and crew
 * rise into the headline), between the other two jobs, so the list sits mid-screen.
 */
function layOut(T: HeroTargets, chipFs: number | null): Layout {
  const phone = T.phone;
  const vw = window.innerWidth;
  let d = phone ? PHONE : DESK;
  if (phone) {
    // the row's name and number are set exactly as the chip sets them (its size, weight and figures),
    // so they fly into it by translation alone and land as themselves
    const fs = chipFs ?? PHONE.nameFs;
    // a narrow phone (375 px): the Hwy 9 row's site (with its crew) and its number keep apart
    const w = vw - 32 - 2 * PHONE.pad;
    const site = (k: number) => 2 * PHONE.point * k + 4 + PHONE.mk * k + PHONE.gap * k + textW(JOBS[0].job, 560, fs) + PHONE.gap * k + PHONE.mk * k + 4;
    const money = textW(JOBS[0].today, 650, fs);
    let k = 1;
    while (k > 0.7 && site(k) + money + PHONE_AIR > w) k -= 0.02;
    d = { ...PHONE, nameFs: fs, moneyFs: fs, point: PHONE.point * k, mk: Math.round(PHONE.mk * Math.max(k, 0.92)), gap: PHONE.gap * k };
  }
  const fb = bboxOf(T.fence);
  const order = phone ? [1, 0, 2] : [0, 1, 2];
  const hwy = order.indexOf(0);
  const w = phone ? vw - 32 : Math.min(880, Math.max(640, vw - 2 * 64));
  const x = Math.round((vw - w) / 2);
  // the Hwy 9 site pill's centre line, and the pill's centre from its row's top
  const anchorY = phone && T.chip ? T.chip.y + T.chip.h / 2 : fb.y + fb.h / 2;
  const rowH = (i: number) => (phone && i === hwy ? PHONE_EVENT_ROW : d.row);
  const pillOff = (i: number) => (phone && i === hwy ? 12 + d.half : rowH(i) / 2);
  const tops = order.map((_, i) => order.slice(0, i).reduce((a, __, k) => a + rowH(k), 0));
  const y = Math.round(anchorY - pillOff(hwy) - d.head - tops[hwy]);
  const card: Rect = { x, y, w, h: d.head + tops[order.length - 1] + rowH(order.length - 1) + (phone ? 6 : 10) };
  const rows: RowL[] = order.map((ji, i) => {
    const job = JOBS[ji];
    const ry = y + d.head + tops[i];
    const cy = ry + pillOff(i);
    const nw = textW(job.job, phone ? 560 : 600, d.nameFs);
    const inner = job.crew ? 4 + d.mk + d.gap + nw + d.gap + d.mk + 4 : 12 + nw + 12;
    const x0 = x + d.pad + d.point;
    const x1 = x0 + inner;
    const h = d.half;
    const fence: Pt[] = [
      [x0 - d.point, cy + 0.5],
      [x0 + 1, cy - h],
      [x1 - 1, cy - h - 0.5],
      [x1 + d.point, cy],
      [x1, cy + h],
      [x0 + 0.5, cy + h],
    ];
    return {
      job,
      y: ry,
      cy,
      fence,
      nameX: job.crew ? x0 + 4 + d.mk + d.gap : x0 + 12,
      mks: { er: x0 + 4 + d.mk / 2, mb: x1 - 4 - d.mk / 2 },
      // Marcus walks in from just outside the fence (phones: never as far as the number's column)
      slotIn: x1 + d.point + (phone ? 2 : 30),
    };
  });
  const H = rows[hwy];
  return {
    phone,
    vw,
    d,
    card,
    rows,
    hwy,
    event: phone ? [H.fence[0][0] + 1, H.cy + d.half + 17] : [H.fence[3][0] + 30, H.cy],
    moneyR: x + w - d.pad,
  };
}

// ── the hero's text runs (where the tag's / chip's words rest) ─────────────────────────────

/** The box of an element's first text run (font ascent to descent), whatever its line height. */
function runRect(el: Element | null): Rect | null {
  const n = el && [...el.childNodes].find((c) => c.nodeType === 3 && c.textContent?.trim());
  if (!n) return null;
  const r = document.createRange();
  r.selectNodeContents(n);
  return rectOf(r.getBoundingClientRect());
}

type HeroDom = { name: Rect | null; money: Rect | null; plate: Rect | null; chip: boolean; glyph: Rect | null; dot: Rect | null; chipFs: number | null };
function readHero(T: HeroTargets): HeroDom {
  const root = document.querySelector(".hf-root");
  const chip = T.phone || !T.tag;
  if (!root) return { name: null, money: null, plate: null, chip, glyph: null, dot: null, chipFs: null };
  if (chip) {
    // the chip parks on its last row (Hwy 9 again): "Hwy 9 Culvert · <b>+$4,120 today</b>"
    const all = root.querySelectorAll(".hf-chip-row");
    const row = all[all.length - 1] ?? null;
    // the " · " between the name and the number (its own text node), and the chip's geofence glyph
    const sep = row && [...row.childNodes].filter((c) => c.nodeType === 3 && c.textContent?.trim())[1];
    let dot: Rect | null = null;
    if (sep) {
      const r = document.createRange();
      r.selectNodeContents(sep);
      dot = rectOf(r.getBoundingClientRect());
    }
    const g = root.querySelector(".hf-chip-glyph");
    const fs = row ? parseFloat(getComputedStyle(row).fontSize) : NaN;
    return { name: runRect(row), money: runRect(row?.querySelector("b") ?? null), plate: T.chip, chip, glyph: g ? rectOf(g.getBoundingClientRect()) : null, dot, chipFs: Number.isFinite(fs) ? fs : null };
  }
  const all = root.querySelectorAll(".hf-tag-row");
  const row = all[all.length - 1] ?? null;
  return {
    name: runRect(row?.querySelector(".hf-tag-job") ?? null),
    money: runRect(row?.querySelector(".hf-tag-state") ?? null),
    plate: T.tag,
    chip,
    glyph: null,
    dot: null,
    chipFs: null,
  };
}

// ── a tiny clock: WAAPI on one timeline, callbacks on its beats (seekable for captures) ───────

type Cb = { at: number; f: () => void; done: boolean };
class Clock {
  anims: Animation[] = [];
  private cbs: Cb[] = [];
  private frame: ((t: number) => void) | null = null;
  private raf = 0;
  private dead = false;
  /** the timeline time of the opening's first frame: every animation counts from it */
  private base: number | null = null;
  constructor(private paused: boolean) {}
  /** set the time base (the list's own CSS entrance started on the first frame) and adopt that animation */
  begin(base: number | null, adopt: Animation[] = []) {
    this.base = base;
    for (const a of adopt) {
      if (this.paused) a.pause();
      this.anims.push(a);
    }
  }
  add(el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, easing = EO, fill: FillMode = "both") {
    if (!el) return null;
    const a = el.animate(kf, { delay: at, duration: Math.max(1, dur), easing, fill });
    if (this.paused) a.pause();
    else if (this.base != null) a.startTime = this.base;
    this.anims.push(a);
    return a;
  }
  at(at: number, f: () => void) {
    this.cbs.push({ at, f, done: false });
  }
  /** a per-frame function of time (desktop only: the fence's stakes) */
  onFrame(f: (t: number) => void) {
    this.frame = f;
  }
  private now() {
    return this.base == null ? 0 : (document.timeline.currentTime as number) - this.base;
  }
  start() {
    if (this.paused) return this.seek(0);
    // callbacks ride the animations' own timeline: an empty effect per beat, no target
    for (const cb of this.cbs) {
      const a = new Animation(new KeyframeEffect(null, [], { delay: cb.at, duration: 1 }), document.timeline);
      if (this.base != null) a.startTime = this.base;
      else a.play();
      a.finished.then(() => this.run(cb)).catch(() => {});
      this.anims.push(a);
    }
    if (this.frame) {
      const tick = () => {
        const f = this.frame;
        if (this.dead || !f) return;
        f(this.now());
        // (endFrame inside f leaves this one last request a no-op)
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }
  /** stop the per-frame function (its piece has landed) */
  endFrame() {
    this.frame = null;
    cancelAnimationFrame(this.raf);
  }
  private run(cb: Cb) {
    if (this.dead || cb.done) return;
    cb.done = true;
    cb.f();
  }
  seek(t: number) {
    for (const a of this.anims) a.currentTime = t;
    this.frame?.(t);
    for (const cb of [...this.cbs].sort((a, b) => a.at - b.at)) if (cb.at <= t) this.run(cb);
  }
  cancel() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }
}

// ── the component ─────────────────────────────────────────────────────────────────────────

type Props = { T: HeroTargets; L: Layout; hero: HeroDom; onDone: () => void };

const Marker = ({ id, initials, size }: { id: string; initials: string; size: number }) => (
  <span className="o2-mk" data-id={id} style={{ width: size, height: size, margin: -size / 2 }}>
    <span className="o2-mk-i">{initials}</span>
    <i className="o2-mk-ring" />
    <i className="o2-mk-dot" />
  </span>
);

const Fence = ({ pts, className, stake }: { pts: Pt[]; className: string; stake: number }) => (
  <svg className={`o2-svg ${className}`}>
    <polygon className="o2-line" points={polyPoints(pts)} />
    {pts.map(([x, y], k) => (
      <g key={k} className="o2-stake-g" transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
        <circle className="o2-stake" r={stake} />
      </g>
    ))}
  </svg>
);

function O2({ T, L, hero, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const { d, card, rows, hwy, phone } = L;
  const H = rows[hwy];
  const fb = bboxOf(T.fence);

  useLayoutEffect(() => {
    const tEff = performance.now();
    const el = root.current!;
    const q = <E extends Element = HTMLElement>(s: string) => el.querySelector(s) as E | null;
    const qa = <E extends Element = HTMLElement>(s: string) => [...el.querySelectorAll(s)] as E[];
    const html = document.documentElement;
    const B = phone ? BEATS_PHONE : BEATS_DESK;
    const clock = new Clock(DEBUG);
    const A = clock.add.bind(clock);
    const span = (s: Span) => [s[0], s[1] - s[0]] as const;
    const S = H.fence;
    const F = T.fence;
    const [f0, fd] = span(B.fence);
    const SPR_T = 0.62; // seconds of the stakes' spring over the fence's move
    let landed = false;
    let entered = false;
    let listening = false;
    const timers: number[] = [];
    let raf0 = 0;

    // The mount makes no animation at all (each one costs a phone ~1 ms at 4× CPU, and the first
    // forces a style pass): the list's entrance is a CSS animation that starts with the first
    // frame, and Marcus and the event line wait hidden in CSS. Everything else is made in the
    // tasks just after that frame, on its time base: build() first, then late() (the flights'
    // measurements and the input listeners).

    /** Every animation of the opening but the flying words, and its beats. */
    function build() {
      // ── 1 · Marcus walks in and clocks in ──
      const mb = q('.o2-mk[data-id="mb"]');
      A(mb, [{ opacity: 0, transform: `translateX(${px(H.slotIn - H.mks.mb)})` }, { opacity: 1, offset: 0.4 }, { opacity: 1, transform: "none" }], ...span(B.walk), "cubic-bezier(0.25, 0.8, 0.3, 1)");
      A(mb?.querySelector(".o2-mk-ring"), [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.22)", offset: 0.3 }, { opacity: 0, transform: "scale(1)" }], B.clock, 700, "ease-out");
      A(mb?.querySelector(".o2-mk-dot"), [{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "none" }], B.clock + 90, 320, EPOP);
      A(q(".o2-pulse"), [{ opacity: 0 }, { opacity: 0.95, offset: 0.22 }, { opacity: 0 }], B.clock, 640, "ease-out");
      A(q(".o2-ev"), [{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "none" }], ...span(B.event), EO);
      A(q(".o2-pill"), [{ transform: "scale(0.6)" }, { transform: "none" }], B.event[0], 380, EPOP);

      // ── 2 · the list falls away, the Hwy 9 row lifts out of it ──
      const [l0, l1] = B.lift;
      A(q(".o2-card-bg"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(10px) scale(0.99)" }], l0, l1 - l0, EI);
      A(q(".o2-head"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px)" }], l0 - 60, 100, EI);
      // (phones: the fence and the crew rise through the row above Hwy 9, so it is gone before they leave)
      qa(".o2-row:not(.is-hwy) .o2-row-in").forEach((r, i) => A(r, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(12px)" }], phone ? l0 - 50 : l0 + i * 30, phone ? 130 : 180, EI));
      A(q(".o2-plate"), [{ opacity: 0 }, { opacity: 1 }], l0, 1, "linear");
      A(q(".o2-lift"), [{ opacity: 0 }, { opacity: 1 }], l0, 120, "ease-out");
      A(q(".o2-plate-in"), [{ transform: "none" }, { transform: "translateY(-4px) scale(1.01)" }], l0, 200, EO);
      // the event line lets go (fill forwards: until it starts, the event line's own entrance decides)
      A(q(".o2-ev"), [{ opacity: 1 }, { opacity: 0 }], l0, 110, "ease-in", "forwards");

      // ── 3 · the row's plate: desktop, it lets go of its words (they fly; it fades where it is,
      // never over the headline); phones, it shrinks into the chip as the chip's ground fades in ──
      const plate = q(".o2-plate");
      const face = q(".o2-face");
      const to = hero.plate;
      if (plate && face && to) {
        if (phone) {
          const pr = plateR;
          const sx = to.w / pr.w;
          const sy = to.h / pr.h;
          A(plate, [{ transform: "none" }, { transform: `translate(${px(to.x - pr.x)}, ${px(to.y - pr.y)}) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})` }], ...span(B.face), EIO);
          // (fill forwards: before it starts, the lift's own fade decides)
          A(plate, [{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], B.face[0], (B.face[1] - B.face[0]) * 0.85, "linear", "forwards");
          A(face, [{ transform: `translate(${px(pr.x - to.x)}, ${px(pr.y - to.y)}) scale(${(1 / sx).toFixed(4)}, ${(1 / sy).toFixed(4)})` }, { transform: "none" }], ...span(B.face), EIO);
          A(face, [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], B.face[0], (B.face[1] - B.face[0]) * 0.9, "linear");
        } else {
          A(plate.firstElementChild, [{ opacity: 1 }, { opacity: 0 }], B.nameY[0] + 40, 120, "ease-in");
          A(face, [{ opacity: 0, transform: "translateX(-10px) scale(0.94)" }, { opacity: 1, transform: "none" }], ...span(B.face), EO);
        }
      }

      // ── 4 · the fence opens out and the crew ride it to their markers ──
      if (!phone) {
        // desktop: six stakes, all on the stakes' spring (rAF for ≤ 0.5 s): a convex hexagon at every frame
        const line = q<SVGPolygonElement>(".o2-fence-h .o2-line")!;
        const stakes = qa<SVGGElement>(".o2-fence-h .o2-stake-g");
        const pulse = q<SVGPolygonElement>(".o2-pulse polygon");
        const set = (p: Pt[], k: number) => {
          const s = polyPoints(p);
          line.setAttribute("points", s);
          pulse?.setAttribute("points", s);
          // the stroke and its dashes grow from the row's into the headline's (2 px, 10 · 7)
          line.style.strokeWidth = (1.6 + 0.4 * k).toFixed(3);
          line.style.strokeDasharray = `${(6 + 4 * k).toFixed(2)} ${(4.5 + 2.5 * k).toFixed(2)}`;
          p.forEach(([x, y], i) => stakes[i]?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`));
        };
        let idle = true; // nothing to do before the move (no per-frame writes while the row waits)
        clock.onFrame((t) => {
          const u = t - f0;
          if (u <= 0) {
            if (!idle) set(S, 0);
            idle = true;
            return;
          }
          idle = false;
          if (u >= fd) {
            set(F, 1);
            if (!DEBUG) clock.endFrame();
            return;
          }
          const k = SPRING((u / (fd - 52)) * SPR_T);
          set(
            S.map((s, i): Pt => [s[0] + (F[i][0] - s[0]) * k, s[1] + (F[i][1] - s[1]) * k]),
            Math.min(1, u / (fd * 0.6)),
          );
        });
      } else {
        // phones: the headline's fence, scaled out of the row's (transform only), as the row's fades
        const sb = bboxOf(S);
        A(q(".o2-flyfence"), [{ transform: `translate(${px(sb.x - fb.x)}, ${px(sb.y - fb.y)}) scale(${(sb.w / fb.w).toFixed(4)}, ${(sb.h / fb.h).toFixed(4)})` }, { transform: "none" }], f0, fd, EIO);
        A(q(".o2-flyfence"), [{ opacity: 0 }, { opacity: 1 }], f0, 100, "linear");
        A(q(".o2-fence-h"), [{ opacity: 1 }, { opacity: 0 }], f0, 100, "linear");
      }
      // the crew: on the stakes' spring too (desktop: they ride the fence's ends), WAAPI either way
      for (const id of ["er", "mb"] as const) {
        const t = T.markers[id];
        if (!t) continue;
        const dx = t.at[0] - H.mks[id];
        const dy = t.at[1] - H.cy;
        const s1 = 26 / d.mk;
        const kf: Keyframe[] = phone
          ? [{ transform: "none" }, { transform: `translate(${px(dx)}, ${px(dy)}) scale(${s1.toFixed(4)})` }]
          : springFrames(SPR_T * (fd / (fd - 52)), (k) => ({ transform: `translate(${px(dx * k)}, ${px(dy * k)}) scale(${(1 + (s1 - 1) * Math.min(1, k)).toFixed(4)})` }), 24);
        A(q(`.o2-mk-x[data-id="${id}"]`), kf, f0, fd, phone ? EIO : "linear");
      }

      // ── 5 · the hero takes over ──
      clock.at(B.enter, enter);
      clock.at(B.land, land);
    }

    // the text runs that fly are measured against a 0 × 0 anchor whose resting place is known, so
    // the entrance's own translations (still running then) drop out
    type Run = { el: HTMLElement; from: Rect; box: Rect };
    const measure = (sel: string, anchorSel: string, rest: Pt): Run | null => {
      const e = q(sel);
      const a = q(anchorSel);
      const from = runRect(e);
      if (!e || !a || !from) return null;
      const ar = a.getBoundingClientRect();
      const dx = ar.left - rest[0];
      const dy = ar.top - rest[1];
      const b = rectOf(e.getBoundingClientRect());
      return { el: e, from: { ...from, x: from.x - dx, y: from.y - dy }, box: { ...b, x: b.x - dx, y: b.y - dy } };
    };
    const plateR: Rect = { x: card.x + 6, y: H.y + 3, w: card.w - 12, h: (phone ? PHONE_EVENT_ROW : d.row) - 6 };
    /** FLIP a text run onto the hero's run (left edge, glyph box), scaled by height; x and y on their own spans */
    const flipRun = (run: Run | null, to: Rect | null, sx: Span, sy: Span, ex = EIO, ey = EIO) => {
      if (!run || !to) return;
      const { el: e, from, box } = run;
      e.style.transformOrigin = `${px(from.x - box.x)} ${px(from.y - box.y)}`;
      A(e.parentElement, [{ transform: "none" }, { transform: `translateX(${px(to.x - from.x)})` }], ...span(sx), ex);
      A(e, [{ transform: "none" }, { transform: `translateY(${px(to.y - from.y)}) scale(${(to.h / from.h).toFixed(4)})` }], ...span(sy), ey);
    };

    /** The row's words to the tag / the chip (they need a layout read), and the input listeners. */
    function late() {
      if (landed) return;
      const t0 = performance.now();
      const name = measure(".is-hwy .o2-name", ".is-hwy .o2-name-x", [H.nameX, H.cy]);
      const money = measure(".is-hwy .o2-money", ".is-hwy .o2-money-x", [L.moneyR, H.cy]);
      // (the name leaves its fence fast, straight up: it never sits on the fence's line)
      flipRun(name, hero.name, B.nameX, B.nameY, EIO, "cubic-bezier(0.2, 0.75, 0.3, 1)");
      // desktop: the name settles into the tag's own weight and ink as it flies (one short text run)
      if (!phone && name) A(name.el, [{ fontWeight: 600, color: "var(--ink)" }, { fontWeight: 500, color: "var(--ink-2)" }], B.nameY[0], B.nameX[1] - B.nameY[0], "linear");
      flipRun(money, hero.money, B.money, B.money);
      mark("late:flights", t0);
      // any input lands everything at once (pointerdown covers touch too)
      if (DEBUG) return;
      listening = true;
      INPUTS.forEach((t) => window.addEventListener(t, skip, { passive: true, capture: true }));
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      mark("late:total", t0);
    }

    const enterOpts: HeroEnterOpts = {
      fence: "given",
      markers: phone ? { mb: "given", er: "given" } : { mb: "given", er: "given", jl: "play" },
      // Marcus's 6:42 fades in beside him once the fence has landed (a time crossing the headline
      // on its own read as clutter); the office line showed it first
      stamp: "play",
      tag: "given",
      speed: SPEED,
    };
    function enter() {
      if (entered) return;
      entered = true;
      void heroEnter(enterOpts);
    }

    // landing: the hero's given pieces show on the frame this layer goes; the tape and the small
    // print under the tag tie on just after (desktop)
    function land() {
      if (landed) return;
      landed = true;
      off();
      clock.endFrame();
      el.style.display = "none";
      html.classList.remove("o2-fly", "o2-late", "has-opening");
      html.classList.add("o2-tie");
      clock.cancel();
      window.setTimeout(() => html.classList.remove("o2-tie"), 900);
      onDone();
    }

    function skip() {
      if (landed) return;
      if (!entered) {
        entered = true;
        void heroEnter({ ground: "given", h1: "given", fence: "given", markers: "given", stamp: "given", tag: "given", sub: "given", cta: "given", foot: "given", ctaFence: false, roll: false });
      } else {
        // mid-flight: the hero's entrance jumps to its end as well
        document
          .querySelector(".hf-root")
          ?.getAnimations({ subtree: true })
          .forEach((a) => a.finish());
      }
      land();
    }
    const INPUTS = ["pointerdown", "wheel", "keydown"] as const;
    const onScroll = () => window.scrollY > 4 && skip();
    // (the width the list was laid out at: reading innerWidth here would force a layout on a phone)
    const onResize = () => window.innerWidth !== L.vw && skip();
    function off() {
      if (!listening) return;
      listening = false;
      INPUTS.forEach((t) => window.removeEventListener(t, skip, { capture: true }));
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    }

    const entrance = () => qa(".o2-in").flatMap((e) => e.getAnimations());
    if (DEBUG) {
      // captures: everything now, paused; window.__o2.seek(t) renders any frame
      clock.begin(null, entrance());
      build();
      late();
      clock.start();
      (window as unknown as { __o2: unknown }).__o2 = {
        BEATS: B,
        SPEED,
        layout: L,
        hero,
        landed: () => landed,
        seek: (t: number) => {
          if (!landed) clock.seek(t);
          const h = (window as unknown as { __hero?: { seek: (ms: number) => void } }).__hero;
          if (HERO_DEBUG && h) h.seek(Math.max(0, (t - B.enter) * SPEED));
        },
        skip,
      };
      // (the hero's entrance is built paused now and seeked with this clock: hero time 0 until the
      // enter beat, everything still hidden; so its own fallback can't fire during a slow capture)
      if (HERO_DEBUG) enter();
    } else {
      // the first frame is out (the list's CSS entrance started on it): build on its time base
      raf0 = requestAnimationFrame(() =>
        timers.push(
          window.setTimeout(() => {
            const css = entrance();
            const st = css.find((a) => a.startTime != null)?.startTime;
            clock.begin(st != null ? (st as number) : (document.timeline.currentTime as number), css);
            const t0 = performance.now();
            build();
            clock.start();
            mark("build", t0);
            if (PERF) PERF.built = +performance.now().toFixed(0);
            timers.push(window.setTimeout(late, 0));
          }, 0),
        ),
      );
    }
    mark("effect", tEff);
    return () => {
      cancelAnimationFrame(raf0);
      timers.forEach((t) => clearTimeout(t));
      off();
      clock.cancel();
    };
  }, [T, L, H, d, card, hwy, phone, fb, hero, onDone]);

  const chip = phone || !T.tag;
  return (
    <div className={`o2-host${phone ? " o2--phone" : ""}`} ref={root} aria-hidden="true">
      <div className="o2">
      <div className="o2-in">
      {/* the office's list: its ground and its header */}
      <div className="o2-card" style={box(card)}>
        <div className="o2-card-bg" />
        <div className="o2-head" style={{ height: d.head }}>
          <img className="o2-head-mark" src={markUrl} alt="" width={17} height={20} />
          <b>Jobs today</b>
          <span className="o2-live">
            <i />
            Live
          </span>
        </div>
      </div>

      {/* the Hwy 9 row's plate (it lifts, then shrinks into the tag / the chip) and the hero's face for it */}
      <div className="o2-plate" style={box({ x: card.x + 6, y: H.y + 3, w: card.w - 12, h: (phone ? PHONE_EVENT_ROW : d.row) - 6 })}>
        <div className="o2-plate-in">
          <i className="o2-lift" />
        </div>
      </div>
      <div className="o2-face" style={box(chip ? T.chip : T.tag)}>
        {chip ? <ChipFace chip={T.chip} hero={hero} /> : <TagBg />}
      </div>

      {/* the rows (absolute, in viewport px) */}
      {rows.map((r, i) => (
        <div className={`o2-row${i === hwy ? " is-hwy" : ""}`} key={r.job.key}>
          <div className="o2-row-in">
            {i !== hwy && (
              <svg className="o2-svg o2-fence-s">
                <polygon className="o2-line" points={polyPoints(r.fence)} />
              </svg>
            )}
            <span className="o2-at o2-name-x" style={{ left: r.nameX, top: r.cy }}>
              <span className="o2-name" style={{ fontSize: d.nameFs }}>
                {r.job.job}
              </span>
            </span>
            <span className="o2-at o2-money-x" style={{ left: L.moneyR, top: r.cy }}>
              <span className={`o2-money${chip ? " o2-money--chip" : ""}`} data-tone={r.job.tone} style={{ fontSize: d.moneyFs }}>
                {r.job.today}
              </span>
            </span>
          </div>
        </div>
      ))}

      {/* Hwy 9's live pieces: its fence (desktop: it springs stake by stake into the headline's), the
          pulse when Marcus clocks in, the event line, and the crew */}
      <div className="o2-hwy-fx">
        <Fence pts={H.fence} className="o2-fence-h" stake={phone ? 2.4 : 3} />
        <svg className="o2-svg o2-pulse">
          <polygon points={polyPoints(H.fence)} />
        </svg>
        <div className="o2-ev" style={{ left: L.event[0], top: L.event[1] }}>
          <span className="o2-ev-rest o2-ev-a">
            <span className="o2-pill">Clocked In</span>
            <span className="o2-ev-name">{CLOCK.name}</span>
            {phone && <span className="o2-ev-sep">·</span>}
          </span>
          <span className="o2-time-x">
            <span className="o2-time">{CLOCK_HM}</span>
          </span>
          <span className="o2-ev-rest o2-ev-ap">{CLOCK_AP}</span>
        </div>
      </div>

      {phone && (
        <div className="o2-flyfence" style={box(fb)}>
          <svg viewBox={`${fb.x} ${fb.y} ${fb.w} ${fb.h}`} width={fb.w} height={fb.h}>
            <polygon className="o2-line o2-line--hero" points={polyPoints(T.fence)} />
            {T.fence.map(([x, y], k) => (
              <circle className="o2-stake o2-stake--hero" r={3} cx={x} cy={y} key={k} />
            ))}
          </svg>
        </div>
      )}
      </div>
      </div>
      {/* the crew, in their own layer just above the page's content: whatever else is still
          travelling when the headline rises passes behind its letters, the crew walk across them */}
      <div className="o2-top">
        <div className="o2-in">
          {[ER, MB].map((c) => (
            <span className="o2-at o2-mk-x" data-id={c.id} key={c.id} style={{ left: H.mks[c.id as "er" | "mb"], top: H.cy }}>
              <Marker id={c.id} initials={c.initials} size={d.mk} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The chip's ground, its geofence glyph and its " · ", where the hero has them (so nothing pops in at the hand-over). */
function ChipFace({ chip, hero }: { chip: Rect | null; hero: HeroDom }) {
  if (!chip) return null;
  const g = hero.glyph;
  const dot = hero.dot;
  return (
    <>
      <i className="o2-face-chip" />
      {g && (
        <svg className="o2-face-glyph" viewBox="0 0 15 13" style={{ left: g.x - chip.x, top: g.y - chip.y, width: g.w, height: g.h }}>
          <path d="M1 6.5 4 1.2h7L14 6.5 11 11.8H4Z" />
        </svg>
      )}
      {dot && (
        <span className="o2-face-dot" style={{ left: dot.x - chip.x, top: dot.y - chip.y, height: dot.h, lineHeight: `${dot.h}px` }}>
          {" · "}
        </span>
      )}
    </>
  );
}

/** The hero's tag ground (its shadow and hang-tag shape), copied from the hero's own DOM. */
function TagBg() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const src = document.querySelector(".hf-root .hf-tag-bgw");
    if (src && ref.current) ref.current.replaceChildren(src.cloneNode(true));
  }, []);
  return <div className="o2-face-tag" ref={ref} />;
}

// ── mount ─────────────────────────────────────────────────────────────────────────────────

/** Mount the opening into `host` (its own React root, in front of the page). */
export function mountO2(host: HTMLElement) {
  const html = document.documentElement;
  if (!html.classList.contains("o2-on")) return;
  html.classList.add("o2-fly", "o2-late");
  const bail = () => {
    html.classList.remove("o2-fly", "o2-late", "o2-on", "has-opening");
    void heroEnter();
  };
  const r = createRoot(host);
  void whenHeroLaid().then((T) => {
    // too late to land the button in time: the hero's own entrance, now (the dev server's
    // unbundled modules are always late, so it plays there regardless)
    if (!DEBUG && !FORCED && !import.meta.env.DEV && performance.now() > LATE) return bail();
    try {
      sessionStorage.setItem("sc-o2", "1");
    } catch {
      /* private mode */
    }
    try {
      const t0 = performance.now();
      if (PERF) PERF.laidAt = +t0.toFixed(0);
      const hero = readHero(T);
      mark("readHero", t0);
      const t1 = performance.now();
      const L = layOut(T, hero.chipFs);
      mark("layOut", t1);
      const done = () => {
        html.classList.remove("o2-on");
        // the layer is hidden: unmount it later, never in the middle of the hero's entrance
        window.setTimeout(() => r.unmount(), 3000);
      };
      // in its own task right after the hero's layout (not inside it: that task is long enough), and
      // synchronously there: a scheduled render would queue behind the page's own boot work (One
      // Day mounting) and start the opening hundreds of ms late on a phone
      window.setTimeout(() => flushSync(() => r.render(<Shell T={T} L={L} hero={hero} onDone={done} />)), 0);
      if (PERF) PERF.renderCalled = +performance.now().toFixed(0);
    } catch (e) {
      console.error("[o2]", e);
      bail();
    }
  });
}

function Shell(p: Props) {
  if (PERF && !PERF.renderStart) PERF.renderStart = +performance.now().toFixed(0);
  const [props] = useState(p);
  return <O2 {...props} />;
}
