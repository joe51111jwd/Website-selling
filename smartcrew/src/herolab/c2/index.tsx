// Herolab c2 · "The Work-Zone Board": the night becomes the sign.
//
// The intro's night doesn't leave: it contracts into the face of a road crew's portable
// changeable message sign (PCMS) at the top of the hero. The sign reads today's real events in
// two phases, the way crews read them at highway speed: MARCUS BELL / CLOCKED IN / 6:42 AM, then
// HWY 9 CULVERT / +$4,120 / TODAY. It shows the pair once more, then parks on the profit phase.
// The H1, the sub and the orange CTA sit centred under it on the warm day ground. On scroll the
// sign hands its "6:42 AM" to One Day (desktop: the dot-matrix time flies out of the sign and
// becomes the scene's huge first time; phones: the sign flips back to 6:42 and One Day opens on it).
//
// The board is a crafted vector face: a matte panel, a full 5×7 dot matrix with visible off-state
// dots (ONE pattern-filled rect), lit dots in pale warm amber (#FFD8A3, never the CTA's orange),
// a static glow layer (a wider, faint copy of the same path; no blur filter), corner bolts. Each
// phase is one path; a phase change is a column-by-column wipe done with two transforms (a
// clipping wrapper and its counter-moving content, both on steps() easing). No WebGL.
// Phones (≤ 760 px): transform/opacity only, no filters, no per-frame JS.

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Logo } from "../../brand/Logo";
import { gridFor, linePath, phasePath, type Grid } from "./font";
import { DAY, MapSvg, NIGHT_LAND, NIGHT_PORT, Notes, camTransform, noteBoxes, type Box, type NoteId } from "./frame";
import { EASE, timeline, type Timeline, type Track } from "./timeline";
import "./hl2.css";

// ─── copy ─────────────────────────────────────────────────────────────────────
// H1/sub: src/content/copy.ts ANGLES. The sign's phases: product facts from the demo account
// (Cedar Ridge Earthworks, src/screens/data.ts) and GREEN lines (research/features/TRUTH.md):
// "Timecards That Log Themselves", "Seamless integration with Quickbooks…", "Real-time profit
// metrics on every job, every day". ≤ 14 characters a line on desktop, ≤ 10 on phones.

export type Angle = "profit" | "overbudget" | "timecards" | "payroll" | "replace";
type Lines = [string, string, string];
type Copy = { h1: string[]; h1Phone: string[]; h1Scale?: number; h1PhoneScale?: number; sub: string; p2: Lines; p2Phone: Lines; sr2: string };

const SUB_GPS = "GPS fills in your crew’s timecards and tags every hour to the right job. You see each job’s profit daily, in time to fix it.";
const SUB_HOURS = "Hours log themselves when your crew gets to the job, tagged to the right cost code and ready for QuickBooks payroll.";

const P1: Lines = ["MARCUS BELL", "CLOCKED IN", "6:42 AM"];
const P1_PHONE: Lines = ["MARCUS B.", "CLOCKED IN", "6:42 AM"];
const SR1 = "Marcus Bell clocked in at 6:42 AM.";

const COPY: Record<Angle, Copy> = {
  profit: {
    h1: ["See what every job", "is making, every day."],
    h1Phone: ["See what every", "job is making,", "every day."],
    sub: SUB_GPS,
    p2: ["HWY 9 CULVERT", "+$4,120", "TODAY"],
    p2Phone: ["HWY 9 JOB", "+$4,120", "TODAY"],
    sr2: "Hwy 9 Culvert: $4,120 profit today.",
  },
  overbudget: {
    h1: ["Know which jobs are losing", "money before it’s too late."],
    h1Phone: ["Know which jobs", "are losing money", "before it’s too late."],
    h1Scale: 0.82,
    h1PhoneScale: 0.84,
    sub: "SmartCrew rolls your crew’s hours, machine time and materials into a profit number for every job, updated daily.",
    p2: ["ELM ST SEWER", "−$860", "TODAY"],
    p2Phone: ["ELM ST JOB", "−$860", "TODAY"],
    sr2: "Elm St Sewer: $860 under today.",
  },
  timecards: {
    h1: ["Stop chasing", "timecards."],
    h1Phone: ["Stop chasing", "timecards."],
    h1PhoneScale: 1.1,
    sub: SUB_HOURS,
    p2: ["TIMECARDS", "LOG", "THEMSELVES"],
    p2Phone: ["TIMECARDS", "LOG", "THEMSELVES"],
    sr2: "Timecards log themselves.",
  },
  payroll: {
    h1: ["Payroll without the", "Friday scramble."],
    h1Phone: ["Payroll without", "the Friday", "scramble."],
    sub: SUB_HOURS,
    p2: ["PAYROLL", "SENT TO", "QUICKBOOKS"],
    p2Phone: ["PAYROLL", "SENT TO", "QUICKBOOKS"],
    sr2: "Payroll sent to QuickBooks.",
  },
  replace: {
    h1: ["Replace your time app, your", "spreadsheets and the group texts."],
    h1Phone: ["Replace your", "time app, your", "spreadsheets and", "the group texts."],
    h1Scale: 0.74,
    h1PhoneScale: 0.8,
    sub: SUB_GPS,
    p2: ["TIMECARDS", "JOB COSTS", "ONE APP"],
    p2Phone: ["TIMECARDS", "JOB COSTS", "ONE APP"],
    sr2: "Timecards and job costs in one app.",
  },
};

const EYEBROW = "For dirt work contractors with 5–100 employees";
const CTA = "Get my free trial";
const DEMO = "or book a demo with Andrew";
const MICRO = "Founding Member trial · starts with a 30-minute call with Andrew · no contract";
const DEMO_DATA = "Demo account. Names and numbers are made up.";
const CUE = "Watch a day at Cedar Ridge Earthworks";
const LOGOS = [
  { name: "Drish Construction", src: "/logos/drish.webp", aspect: 2.16 },
  { name: "Rieke Grading", src: "/logos/rieke.webp", aspect: 1.75 },
  { name: "JCR Excavating", src: "/logos/jcr.svg", aspect: 2.61 },
  { name: "Fireball Construction", src: "/logos/fireball.webp", aspect: 1.49 },
  { name: "DW Companies", src: "/logos/dw.svg", aspect: 1.63 },
  { name: "Midwest Erosion Specialists", src: "/logos/midwest.svg", aspect: 4.01 },
];

export function readAngle(): Angle {
  const a = typeof location !== "undefined" ? new URLSearchParams(location.search).get("angle") : null;
  return a && a in COPY ? (a as Angle) : "profit";
}

// ─── layout ───────────────────────────────────────────────────────────────────

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prefersReduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export type Layout = {
  W: number;
  H: number;
  phone: boolean;
  /** type/space scale (1 = the 1440×660 / 390×664 design) */
  s: number;
  hh: number;
  board: Box;
  frame: number;
  /** the face (inside the frame), in section px */
  face: Box;
  grid: Grid;
  /** dot pitch, px */
  p: number;
  /** the text grid's top-left inside the face, px */
  gx: number;
  gy: number;
  /** extra off-dot columns/rows round the text grid (the matrix fills the face, as on a real sign) */
  ex: number;
  ey: number;
  /** top of the copy stack */
  stack: number;
};

export function computeLayout(W: number, H: number): Layout {
  const phone = W <= 760;
  if (phone) {
    const s = clamp(Math.min(W / 390, H / 664), 0.84, 1.12);
    const hh = 56;
    const bw = W - 32;
    const bh = Math.round(150 * Math.min(s, bw / 358));
    const board = { x: 16, y: hh + 8, w: bw, h: bh };
    return finish({ W, H, phone, s, hh, board, frame: 3, chars: 10, mx: 2, my: 1.5, stack: board.y + bh + 16 * s });
  }
  // the composition (board → foot) is 576 px at s = 1 under a 64 px header + 10 px air + 10 px foot
  const s = clamp(Math.min((H - 84) / 576, W / 1240), 0.78, 1.3);
  const hh = 64;
  const bw = Math.round(640 * s);
  const bh = Math.round(196 * s);
  // extra height (tall windows) goes mostly above the board, a little under the CTA
  const free = Math.max(0, H - 84 - 576 * s);
  const top = hh + 10 * s + free * 0.4;
  const board = { x: Math.round((W - bw) / 2), y: Math.round(top), w: bw, h: bh };
  return finish({ W, H, phone, s, hh, board, frame: 3, chars: 14, mx: 2.5, my: 1.5, stack: board.y + bh + 16 * s });
}

function finish(o: { W: number; H: number; phone: boolean; s: number; hh: number; board: Box; frame: number; chars: number; mx: number; my: number; stack: number }): Layout {
  const { board, frame } = o;
  const face = { x: board.x + frame, y: board.y + frame, w: board.w - 2 * frame, h: board.h - 2 * frame };
  const grid = gridFor(o.chars);
  const p = Math.min(face.w / (grid.cols + 2 * o.mx), face.h / (grid.rows + 2 * o.my));
  const gx = (face.w - grid.cols * p) / 2;
  const gy = (face.h - grid.rows * p) / 2;
  // the off-dot field fills the face, leaving a band of at least one pitch for the bolts
  const ex = Math.max(0, Math.floor(gx / p - 1.6));
  const ey = Math.max(0, Math.floor(gy / p - 1.6));
  return { W: o.W, H: o.H, phone: o.phone, s: o.s, hh: o.hh, board, frame, face, grid, p, gx, gy, ex, ey, stack: o.stack };
}

function useViewport() {
  const read = () => ({ W: window.innerWidth, H: window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const n = read();
        // phones: the URL bar showing/hiding changes innerHeight; keep the first height
        setV((o) => (n.W === o.W && (n.W <= 760 || n.H === o.H) ? o : n));
      });
    };
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

// ─── the sign ─────────────────────────────────────────────────────────────────

type FaceKind = "blank" | "p1" | "p2" | "p1x";

/** One face of the sign: the off-dot field (one pattern rect) + a phase's lit dots (glow, core, hot). */
function Face({ L, uid, kind, base }: { L: Layout; uid: string; kind: FaceKind; base?: boolean }) {
  const { face, p, gx, gy, grid, ex, ey } = L;
  const vb = `${(-gx / p).toFixed(4)} ${(-gy / p).toFixed(4)} ${(face.w / p).toFixed(4)} ${(face.h / p).toFixed(4)}`;
  return (
    <div className="hl2-face" data-a={base ? "base" : undefined}>
      <svg className="hl2-face-svg" width={face.w} height={face.h} viewBox={vb} aria-hidden="true">
        <rect x={-ex} y={-ey} width={grid.cols + 2 * ex} height={grid.rows + 2 * ey} fill={`url(#${uid}-off)`} />
        {kind !== "blank" && (
          <>
            <use href={`#${uid}-${kind}`} className="hl2-glow" />
            <use href={`#${uid}-${kind}`} className="hl2-lit" />
            <use href={`#${uid}-${kind}`} className="hl2-hot" />
          </>
        )}
      </svg>
    </div>
  );
}

/** The face stack: a base field, then the timeline's faces in the order they wipe on, each over
 * the one before (P1; then blank, P2; one more cycle), then three faces for the hand-off (driven
 * on scroll, z-ordered as they go). Between phases the sign blanks for a beat, as real ones do. */
const TL_FACES: FaceKind[] = ["p1", "blank", "p2", "blank", "p1", "blank", "p2"];
const HAND_FACES: FaceKind[] = ["blank", "p1", "p1x", "p2"];

/** Keyframes for a column-by-column wipe: the wrapper's right edge steps from the field's left edge
 * to its right edge one column at a time; its content counter-moves so it stays put. */
function wipeFrames(L: Layout) {
  const Wf = L.face.w;
  const a = L.gx;
  const b = L.gx + L.grid.cols * L.p;
  return {
    outer: [{ transform: `translateX(${(a - Wf).toFixed(2)}px)` }, { transform: `translateX(${(b - Wf).toFixed(2)}px)` }],
    inner: [{ transform: `translateX(${(Wf - a).toFixed(2)}px)` }, { transform: `translateX(${(Wf - b).toFixed(2)}px)` }],
    ease: `steps(${L.grid.cols}, start)`,
  };
}

// ─── the hero ─────────────────────────────────────────────────────────────────

export type HeroBoardProps = {
  angle?: Angle;
  /** start from the intro's last frame (the night map + its three notifications) */
  intro?: boolean;
  /** ms to hold on the intro's last frame before the hand-over (the real intro owns this) */
  hold?: number;
  /** don't start on its own (review: window.__hl2.seek) */
  paused?: boolean;
  /** desktop hand-off: the One Day time the sign's "6:42 AM" flies into, and the scroll it takes */
  handoff?: { target: () => HTMLElement | null; distance: () => number };
  onCta?: (intent: "trial" | "demo") => void;
};

type Phase = "night" | "run" | "done";

export default function HeroBoard({ angle = "profit", intro = true, hold = 500, paused = false, handoff, onCta }: HeroBoardProps) {
  const { W, H } = useViewport();
  const L = useMemo(() => computeLayout(W, H), [W, H]);
  const copy = COPY[angle];
  const root = useRef<HTMLElement>(null);
  const tl = useRef<Timeline | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (prefersReduced() ? "done" : intro ? "night" : "run"));
  const rawId = useId();
  const uid = "hl2" + rawId.replace(/[^a-zA-Z0-9]/g, "");

  // the phases as paths (grid units)
  const paths = useMemo(() => {
    const p1 = L.phone ? P1_PHONE : P1;
    const p2 = L.phone ? copy.p2Phone : copy.p2;
    const a = phasePath(p1, L.grid);
    const b = phasePath(p2, L.grid);
    // the hand-off face: desktop keeps the time off the sign (it flies out on its own); phones show it all
    const ax = L.phone ? a : phasePath([p1[0], p1[1], ""], L.grid);
    const t = linePath(p1[2]);
    return { p1: a, p2: b, p1x: ax, time: t, timeBox: a.boxes[2] };
  }, [L.phone, L.grid, copy]);

  // the first seconds: built once the fonts are in (the copy is measured), then played
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || phase === "done") return;
    let cancelled = false;
    let landTimer = 0;
    const go = () => {
      if (cancelled || !root.current) return;
      const t = build(root.current, L, { intro: phase === "night", lead: phase === "night" ? hold : 0 });
      tl.current = t;
      expose(t, L);
      if (!paused) {
        t.play();
        // the night's layers have done their job once the sign is lit: take them out of paint
        if (phase === "night") landTimer = window.setTimeout(() => root.current?.classList.add("is-landed"), hold + T.contract + 600);
      }
      t.done.then(() => {
        if (cancelled) return;
        setPhase("done");
      });
    };
    if (document.fonts?.status === "loaded") go();
    else document.fonts.ready.then(go);
    return () => {
      cancelled = true;
      window.clearTimeout(landTimer);
      tl.current?.cancel();
      tl.current = null;
    };
    // the sequence plays once; a resize later just shows the final frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a resize while it runs: settle on the final frame
  const first = useRef(`${W}x${H}`);
  useEffect(() => {
    if (`${W}x${H}` !== first.current && tl.current) {
      tl.current.cancel();
      tl.current = null;
      setPhase("done");
    }
  }, [W, H]);

  // desktop: the jobsite under the day drifts a few px against the cursor (the map is a layer of
  // its own: one transform per frame while it moves, none once it settles)
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>(".hl2-drift");
    if (!el || L.phone || prefersReduced() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const tgt = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const step = () => {
      cur.x += (tgt.x - cur.x) * 0.06;
      cur.y += (tgt.y - cur.y) * 0.06;
      el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
      raf = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      tgt.x = -((e.clientX / window.innerWidth) * 2 - 1) * 14;
      tgt.y = -((e.clientY / window.innerHeight) * 2 - 1) * 8;
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [L.phone]);

  // the hand-off into One Day (desktop: scroll-linked; phones: once, on the first scroll)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return attachHandoff(el, L, () => tl.current, handoff, paths.timeBox);
  }, [L, handoff, paths.timeBox]);

  const style = {
    "--s": L.s.toFixed(4),
    "--hh": `${L.hh}px`,
    "--stack": `${L.stack.toFixed(1)}px`,
    "--h1-scale": (L.phone ? copy.h1PhoneScale : copy.h1Scale) ?? 1,
    "--frame": `${L.frame}px`,
    height: L.phone ? undefined : `${H}px`,
    minHeight: L.phone ? `${H}px` : undefined,
  } as CSSProperties;

  const box = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h });
  const nb = intro && phase !== "done" ? noteBoxes(W, H) : null;
  const tb = paths.timeBox;
  const lines = L.phone ? copy.h1Phone : copy.h1;
  const nightCam = W / H <= 1 ? NIGHT_PORT : NIGHT_LAND;

  return (
    <section ref={root} className={`hl2 ${L.phone ? "is-phone" : "is-desk"} is-${phase}`} style={style} data-angle={angle} aria-label="SmartCrew">
      {/* the jobsite by day: the intro's map stays as the faint ground (desktop; phones keep it plain) */}
      <div className="hl2-ground" aria-hidden="true">
        {!L.phone && (
          <div className="hl2-drift">
            <div className="hl2-daymap" data-a="daymap">
              <MapSvg W={W} H={H} cam={DAY} className="hl2-map" />
            </div>
          </div>
        )}
        <div className="hl2-veil" />
      </div>

      <header className="hl2-head">
        <div className="hl2-head-in">
          <a className="hl2-logo" href="#" aria-label="SmartCrew home" data-a="logo" data-cursor="link">
            <Logo className="hl2-logo-svg" decorative />
          </a>
          {!L.phone && (
            <nav className="hl2-nav" data-a="nav" aria-label="Page">
              <a href="#day" data-cursor="link">
                How it works
              </a>
              <a href="#faq" data-cursor="link">
                FAQ
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* ── the sign ── */}
      <svg className="hl2-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <pattern id={`${uid}-off`} width="1" height="1" patternUnits="userSpaceOnUse">
            <circle className="hl2-off" cx="0.5" cy="0.5" r="0.355" />
            <circle className="hl2-off-hi" cx="0.43" cy="0.4" r="0.16" />
          </pattern>
          <path id={`${uid}-p1`} d={paths.p1.d} />
          <path id={`${uid}-p2`} d={paths.p2.d} />
          <path id={`${uid}-p1x`} d={paths.p1x.d} />
          <path id={`${uid}-time`} d={paths.time.d} />
        </defs>
      </svg>
      <div className="hl2-board" style={box(L.board)} data-a="board" data-cursor-tone="dark">
        <div className="hl2-board-in" data-a="board-in">
          <Face L={L} uid={uid} kind="blank" base />
          {TL_FACES.map((k, i) => (
            <div key={`t${i}`} className="hl2-wipe" data-role="tl" data-kind={k}>
              <div className="hl2-wipe-in">
                <Face L={L} uid={uid} kind={k} />
              </div>
            </div>
          ))}
          {HAND_FACES.map((k) => (
            <div key={`h${k}`} className="hl2-wipe is-idle" data-role="hand" data-kind={k}>
              <div className="hl2-wipe-in">
                <Face L={L} uid={uid} kind={k} />
              </div>
            </div>
          ))}
          <i className="hl2-bolt is-tl" />
          <i className="hl2-bolt is-tr" />
          <i className="hl2-bolt is-bl" />
          <i className="hl2-bolt is-br" />
        </div>
        <p className="hl2-sr">
          {SR1} {copy.sr2}
        </p>
      </div>
      {!L.phone && (
        <p className="hl2-demo" data-p="demo" style={{ left: L.board.x + L.board.w + 16 * L.s, bottom: L.H - (L.board.y + L.board.h) - 1 }}>
          {DEMO_DATA}
        </p>
      )}

      {/* the sign's "6:42 AM", lifted out for the hand-off into One Day (desktop) */}
      {!L.phone && (
        <div
          className="hl2-fly"
          data-a="fly"
          aria-hidden="true"
          style={{ left: L.face.x + L.gx + tb.x * L.p, top: L.face.y + L.gy + tb.y * L.p, width: tb.w * L.p, height: tb.h * L.p }}
        >
          <svg className="hl2-fly-lit" viewBox={`0 0 ${tb.w} ${tb.h}`} width={tb.w * L.p} height={tb.h * L.p}>
            <use href={`#${uid}-time`} className="hl2-glow" />
            <use href={`#${uid}-time`} className="hl2-lit" />
            <use href={`#${uid}-time`} className="hl2-hot" />
          </svg>
          <svg className="hl2-fly-ink" viewBox={`0 0 ${tb.w} ${tb.h}`} width={tb.w * L.p} height={tb.h * L.p}>
            <use href={`#${uid}-time`} className="hl2-ink" />
          </svg>
          {/* mid-flight the dots hand over to the display type One Day sets its time in (caps box
              aligned: Special Gothic's caps are 0.71 em, centred in a line-height-1 box) */}
          <span className="hl2-fly-type" style={{ fontSize: (tb.h * L.p) / 0.71, top: (-0.145 * tb.h * L.p) / 0.71 }}>
            {(L.phone ? P1_PHONE : P1)[2]}
          </span>
        </div>
      )}

      {/* ── the copy ── */}
      <div className="hl2-stack" data-a="stack">
        <p className="hl2-eyebrow" data-p="eyebrow">
          {EYEBROW}
        </p>
        <h1 className="hl2-h1">
          {lines.map((l, i) => (
            <span key={i} className="hl2-line">
              <span className="hl2-line-in" data-h1={i}>
                {l}
              </span>
            </span>
          ))}
        </h1>
        <p className="hl2-sub" data-p="sub">
          {copy.sub}
        </p>
        <div className="hl2-act">
          <div className="hl2-ctawrap" data-p="cta">
            <button type="button" className="hl2-cta" data-cursor="cta" data-cursor-magnet="7" onClick={() => onCta?.("trial")}>
              <span>{CTA}</span>
              <svg className="hl2-cta-arrow" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3.5 9h10.2M9.6 4.6 14 9l-4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Ring />
          </div>
          <button type="button" className="hl2-link" data-p="link" data-cursor="link" onClick={() => onCta?.("demo")}>
            {DEMO}
          </button>
        </div>
        <p className="hl2-micro" data-p="micro">
          {MICRO}
        </p>
        {L.phone && (
          <p className="hl2-demo" data-p="demo">
            {DEMO_DATA}
          </p>
        )}
      </div>

      <div className="hl2-foot" data-a="foot">
        <div className="hl2-used" data-p="used">
          <span className="hl2-used-k">Used by</span>
          <ul>
            {LOGOS.map((g) => (
              <li key={g.name}>
                <img src={g.src} alt={g.name} style={{ aspectRatio: String(g.aspect) }} loading={L.phone ? "lazy" : "eager"} decoding="async" />
              </li>
            ))}
          </ul>
        </div>
        <a className="hl2-cue" href="#day" data-p="cue" data-cursor="link">
          <span>{CUE}</span>
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 2v9.5M3 7.6 7 11.6l4-4" />
          </svg>
        </a>
      </div>

      {/* ── the intro's last frame (in the page: index.html #topo / #intro) ── */}
      {nb && (
        <>
          <div className="hl2-night" data-a="night" data-cursor-tone="dark">
            <div className="hl2-nightmap" data-a="nightmap">
              <MapSvg W={W} H={H} cam={nightCam} night className="hl2-map" />
            </div>
          </div>
          <div className="hl2-ilogo" data-a="ilogo" aria-hidden="true">
            <div className="hl2-head-in">
              <Logo className="hl2-logo-svg" tone="white" decorative />
            </div>
          </div>
          <div className="hl2-notes" aria-hidden="true">
            <Notes boxes={nb} />
          </div>
        </>
      )}
    </section>
  );
}

/** The CTA's one calm cue: a dashed geofence draws round it, closes in tight and goes solid
 * ("clocked in"), pings once and lets go. Geometry is set in build() once the button is measured. */
function Ring() {
  return (
    <svg className="hl2-ring" data-ring aria-hidden="true">
      <defs>
        <mask id="hl2-ring-mask" maskUnits="userSpaceOnUse">
          <path className="hl2-ring-draw" data-ring-draw pathLength={100} />
        </mask>
      </defs>
      <path className="hl2-ring-dash" data-ring-dash mask="url(#hl2-ring-mask)" />
      <path className="hl2-ring-solid" data-ring-solid />
    </svg>
  );
}

// ─── the choreography ─────────────────────────────────────────────────────────

/** A rounded rect as a path from top-centre, clockwise. */
function rr(w: number, h: number, r: number, pad: number) {
  const x0 = -pad;
  const y0 = -pad;
  const x1 = w + pad;
  const y1 = h + pad;
  const R = Math.min(r + pad, (h + 2 * pad) / 2);
  const f = (n: number) => n.toFixed(2);
  return (
    `M${f(w / 2)} ${f(y0)}H${f(x1 - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x1)} ${f(y0 + R)}V${f(y1 - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x1 - R)} ${f(y1)}` +
    `H${f(x0 + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x0)} ${f(y1 - R)}V${f(y0 + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x0 + R)} ${f(y0)}Z`
  );
}

/** ms on the hero clock. P1 wipes on as the clock-in card lands; P2 at 1.9 s; one more cycle. */
export const T = {
  contract: 720,
  /** P1 writes on as the night lands and the clock-in card arrives */
  p1: 730,
  write: 340,
  erase: 200,
  /** the blank beat between erase and write */
  dark: 70,
  p2: 1820,
  p1b: 6300,
  p2b: 8800,
};

function build(root: HTMLElement, L: Layout, o: { intro: boolean; lead: number }): Timeline {
  const T0: Track[] = [];
  const q = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s);
  const qa = <E extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<E>(s)];
  const add = (el: Element | null | undefined, kf: Keyframe[], at: number, dur: number, ease?: string, hold?: boolean, fill?: FillMode) => T0.push({ el, kf, at, dur, ease, hold, fill });
  const P = L.phone;
  const { W, H, board, face } = L;
  const rootBox = root.getBoundingClientRect();
  const rel = (r: DOMRect): Box => ({ x: r.left - rootBox.left, y: r.top - rootBox.top, w: r.width, h: r.height });

  if (o.intro) {
    // ── 0 · the night contracts into the sign's face ──
    const night = q("[data-a=night]");
    const nightmap = q("[data-a=nightmap]");
    const cam = W / H <= 1 ? NIGHT_PORT : NIGHT_LAND;
    if (!P) {
      // desktop: the whole night (map, fence, Marcus) shrinks into the sign like a camera pulling
      // back: one uniform scale onto the face's width, and an inset clip that trims the top and
      // bottom to the face's shape. The map dims as it lands and the dot field takes over.
      const k = face.w / W;
      let ci = (H - face.h / k) / 2;
      let cx = 0;
      if (ci < 0) {
        cx = (W - (face.w * H) / face.h) / 2;
        ci = 0;
      }
      const kk = cx ? face.h / H : k;
      const tx = face.x - kk * cx;
      const ty = face.y - kk * ci;
      const rad = (3 / kk).toFixed(1);
      add(night, [{ transform: "translate(0px, 0px) scale(1)" }, { transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${kk.toFixed(5)})` }], 0, T.contract, EASE.contract, true);
      add(night, [{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: `inset(${ci.toFixed(1)}px ${cx.toFixed(1)}px ${ci.toFixed(1)}px ${cx.toFixed(1)}px round ${rad}px)` }], 0, T.contract, EASE.contract, true);
      add(nightmap, [{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], 0, T.contract - 120, EASE.inOut, true);
      // the day map outside drifts back too (the same pull-back, gentler)
      const daymap = q("[data-a=daymap] svg");
      add(daymap, [{ transform: camTransform(W, H, { ...DAY, z: DAY.z * 1.12 }) }, { transform: camTransform(W, H, DAY) }], 0, T.contract + 300, EASE.contract);
      add(q("[data-a=daymap]"), [{ opacity: 0.3 }, { opacity: 1 }], 0, T.contract + 300, EASE.out);
      void cam;
    } else {
      // phones: a plain div scales to the face's rectangle (the map fades out first, so nothing squashes)
      const sx = face.w / W;
      const sy = face.h / H;
      add(nightmap, [{ opacity: 1 }, { opacity: 0 }], 0, 220, EASE.inOut, true);
      add(night, [{ transform: "translate(0px, 0px) scale(1, 1)" }, { transform: `translate(${face.x}px, ${face.y}px) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})` }], 0, T.contract, EASE.contract, true);
    }
    // landed exactly on the face: the night IS the sign's face. It lets go and the dot field shows
    // through (power-on) as P1 starts writing.
    add(night, [{ opacity: 1 }, { opacity: 0 }], T.contract, 180, EASE.out, true);

    // ── the intro's cards fly into the sign ──
    const c = { x: board.x + board.w / 2, y: board.y + board.h / 2 };
    const fly = (id: NoteId, at: number, dur: number, scale: number, keep: number) => {
      const el = q(`[data-note=${id}]`);
      if (!el) return;
      const b = rel(el.getBoundingClientRect());
      const dx = c.x - (b.x + b.w / 2);
      const dy = c.y - (b.y + b.h / 2);
      add(
        el,
        [
          { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
          { opacity: 1, offset: keep },
          { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale})`, opacity: 0 },
        ],
        at,
        dur,
        EASE.inOut,
        true,
      );
    };
    fly("load", 0, P ? 480 : 540, 0.28, 0.5);
    fly("profit", 40, P ? 560 : 620, 0.3, 0.55);
    fly("clockin", 90, P ? 720 : 760, 0.4, 0.74);

    // the night's logo hands over to the day's (same box: a crossfade in place)
    add(q("[data-a=ilogo]"), [{ opacity: 1 }, { opacity: 0 }], 80, 420, EASE.inOut, true);
    add(q("[data-a=logo]"), [{ opacity: 0 }, { opacity: 1 }], 80, 420, EASE.inOut);
  } else {
    // no intro: the sign powers on where it stands
    add(q("[data-a=board]"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], 0, 520, EASE.out);
    add(q("[data-a=logo]"), [{ opacity: 0 }, { opacity: 1 }], 0, 420, EASE.out);
  }
  add(q("[data-a=nav]"), [{ opacity: 0 }, { opacity: 1 }], 420, 500, EASE.out);

  // ── the sign: P1 wipes on column by column, then P2; one more cycle, then it parks on P2 ──
  const wf = wipeFrames(L);
  const faces = qa("[data-role=tl]");
  const wr = T.erase + T.dark;
  const plan: [number, number][] = [
    [o.intro ? T.p1 : 380, T.write],
    [T.p2, T.erase],
    [T.p2 + wr, T.write],
    [T.p1b, T.erase],
    [T.p1b + wr, T.write],
    [T.p2b, T.erase],
    [T.p2b + wr, T.write],
  ];
  faces.forEach((f, i) => {
    const [at, dur] = plan[i];
    add(f, wf.outer, at, dur, wf.ease);
    add(f.firstElementChild, wf.inner, at, dur, wf.ease);
  });

  // ── the copy builds under it ──
  const C0 = o.intro ? 640 : 420;
  add(q("[data-p=eyebrow]"), [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], C0, 520, EASE.out);
  qa("[data-h1]").forEach((el, i) => add(el, [{ transform: "translateY(106%)" }, { transform: "translateY(0%)" }], C0 + 60 + i * 90, P ? 640 : 720, EASE.expo));
  add(q("[data-p=sub]"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], C0 + 460, 560, EASE.out);
  add(q("[data-p=demo]"), [{ opacity: 0 }, { opacity: 1 }], C0 + 480, 500, EASE.out);
  add(q("[data-p=cta]"), [{ opacity: 0, transform: "translateY(18px) scale(0.94)" }, { opacity: 1, transform: "none" }], C0 + 660, 620, EASE.spring);
  add(q("[data-p=link]"), [{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "none" }], C0 + 820, 480, EASE.out);
  add(q("[data-p=micro]"), [{ opacity: 0 }, { opacity: 1 }], C0 + 900, 520, EASE.out);
  add(q("[data-p=used]"), [{ opacity: 0 }, { opacity: 1 }], C0 + 1060, 600, EASE.out);
  add(q("[data-p=cue]"), [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], C0 + 1140, 520, EASE.out);

  // ── the CTA's geofence: draws round it, closes in, goes solid, pings, lets go ──
  const ring = q<SVGSVGElement>("[data-ring]");
  const btn = q(".hl2-cta");
  if (ring && btn) {
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    const r = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 16;
    const OUT = P ? 8 : 9;
    const IN = 4;
    const pad = OUT + 4;
    ring.setAttribute("viewBox", `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`);
    ring.style.left = `${-pad}px`;
    ring.style.top = `${-pad}px`;
    ring.setAttribute("width", String(w + 2 * pad));
    ring.setAttribute("height", String(h + 2 * pad));
    const dash = ring.querySelector("[data-ring-dash]")!;
    const draw = ring.querySelector("[data-ring-draw]")!;
    const solid = ring.querySelector<SVGPathElement>("[data-ring-solid]")!;
    dash.setAttribute("d", rr(w, h, r, OUT));
    draw.setAttribute("d", rr(w, h, r, OUT));
    solid.setAttribute("d", rr(w, h, r, IN));
    const R0 = T.p2 + T.erase + T.dark + T.write - 40; // after P2 has landed (≈ 2.4 s)
    const sxIn = (w + 2 * IN) / (w + 2 * OUT);
    const syIn = (h + 2 * IN) / (h + 2 * OUT);
    if (!P) {
      // desktop: the dashed fence draws itself round (a mask stroke), 0.42 s
      add(draw, [{ strokeDashoffset: "100" }, { strokeDashoffset: "0" }], R0, 420, EASE.inOut, true);
    } else {
      add(dash, [{ opacity: 0, transform: "scale(1.04)" }, { opacity: 1, transform: "none" }], R0, 300, EASE.out, true);
    }
    // it closes in tight: the dashed fence shrinks onto the button and hands over to the solid one
    const CL = R0 + (P ? 300 : 420);
    add(dash, [{ transform: "none", opacity: 1 }, { transform: `scale(${sxIn.toFixed(4)}, ${syIn.toFixed(4)})`, opacity: 0 }], CL, 260, EASE.out, true, "forwards");
    add(solid, [{ opacity: 0, transform: "scale(1)" }, { opacity: 1, offset: 0.12 }, { opacity: 1, transform: "scale(1)", offset: 0.4 }, { opacity: 0, transform: "scale(1.06)" }], CL + 120, 1100, EASE.out, true);
    (root as unknown as { __ringAt: number }).__ringAt = CL + 120;
  }

  return timeline(T0, o.lead);
}

function expose(t: Timeline, L: Layout) {
  (window as unknown as { __hl2: unknown }).__hl2 = { seek: t.seek, play: t.play, finish: t.finish, end: t.end, layout: L, T };
}

// ─── the hand-off into One Day ────────────────────────────────────────────────

/** Imperative wipes for the hand-off faces (not on the review clock). */
function wipeFace(L: Layout, el: HTMLElement, z: number, dur = 240) {
  const wf = wipeFrames(L);
  if (prefersReduced()) dur = 1;
  el.classList.remove("is-idle");
  el.style.zIndex = String(z);
  const opts = { duration: dur, easing: wf.ease, fill: "both" as const };
  const a = el.animate(wf.outer, opts);
  const b = el.firstElementChild!.animate(wf.inner, opts);
  return Promise.all([a.finished, b.finished]).then(() => {
    el.classList.add("is-on");
    a.cancel();
    b.cancel();
  });
}

function attachHandoff(root: HTMLElement, L: Layout, getTl: () => Timeline | null, ho: HeroBoardProps["handoff"], tb: { x: number; y: number; w: number; h: number }) {
  const hand = Object.fromEntries([...root.querySelectorAll<HTMLElement>("[data-role=hand]")].map((el) => [el.dataset.kind!, el])) as Record<FaceKind, HTMLElement>;
  if (!hand.blank || !hand.p1 || !hand.p1x || !hand.p2) return;
  type Shown = "p1" | "p1x" | "p2";
  let z = 10;
  let want: Shown = "p2";
  let shown: Shown = "p2";
  let busy = false;
  let scrolled = false;
  // erase, a dark beat, write; then the faces under it go idle. One change at a time; the last
  // request wins.
  const run = async () => {
    if (busy || want === shown) return;
    busy = true;
    const next = want;
    await wipeFace(L, hand.blank, ++z, T.erase * 0.8);
    await new Promise((r) => setTimeout(r, T.dark));
    await wipeFace(L, hand[next], ++z, T.write * 0.8);
    for (const k of ["blank", "p1", "p1x", "p2"] as const) if (k !== next) hand[k].classList.add("is-idle"), hand[k].classList.remove("is-on");
    shown = next;
    busy = false;
    run();
  };
  const toP1 = () => {
    scrolled = true;
    const k: Shown = L.phone || !ho ? "p1" : "p1x";
    if (want === k) return;
    want = k;
    getTl()?.finish();
    run();
  };
  const toP2 = () => {
    if (!scrolled) return;
    scrolled = false;
    if (want === "p2") return;
    want = "p2";
    run();
  };
  // a tap or click on the sign pages it, the way a crew pages a real one from its keypad (no hover
  // state, no affordance: a quiet extra for the curious; the timeline's own cycle stops)
  const board = root.querySelector<HTMLElement>("[data-a=board]")!;
  const page = () => {
    if (scrolled) return;
    getTl()?.finish();
    want = (busy ? want : shown) === "p2" ? "p1" : "p2";
    run();
  };
  board.addEventListener("click", page);

  // phones: once, on the first scroll, the sign flips back to 6:42 as it slides away (no per-frame JS)
  if (L.phone || !ho || prefersReduced()) {
    const on = () => {
      if (window.scrollY > 6) {
        toP1();
        window.removeEventListener("scroll", on);
      }
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      board.removeEventListener("click", page);
    };
  }

  // desktop: scroll-linked (transform/opacity, one rAF per scroll event at most)
  const stack = root.querySelector<HTMLElement>("[data-a=stack]")!;
  const foot = root.querySelector<HTMLElement>("[data-a=foot]")!;
  const demo = root.querySelector<HTMLElement>("[data-p=demo]")!;
  const fly = root.querySelector<HTMLElement>("[data-a=fly]")!;
  const flyLit = fly.querySelector<SVGElement>(".hl2-fly-lit")!;
  const flyInk = fly.querySelector<SVGElement>(".hl2-fly-ink")!;
  const flyType = fly.querySelector<HTMLElement>(".hl2-fly-type")!;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t: number) => 1 - Math.pow(1 - t, 3);
  // the time's own box on the sign (section px)
  const sx = L.face.x + L.gx + tb.x * L.p;
  const sy = L.face.y + L.gy + tb.y * L.p;
  const sh = tb.h * L.p;
  let raf = 0;
  let last = -1;
  const render = () => {
    raf = 0;
    const dist = ho.distance();
    const p = clamp(window.scrollY / Math.max(1, dist));
    if (p === last) return;
    last = p;
    if (p > 0.004) toP1();
    else toP2();
    const target = ho.target();
    // the copy steps back first (a short lift and a quick fade: it never runs into the sign)
    const e = out(clamp(p / 0.3));
    stack.style.transform = `translateY(${(-12 * e).toFixed(1)}px)`;
    stack.style.opacity = String(clamp(1 - p / 0.24));
    foot.style.opacity = demo.style.opacity = String(clamp(1 - p / 0.16));
    // the sign rises away about its top once its time has left it
    const b = ease(clamp((p - 0.05) / 0.5));
    board.style.transform = `translateY(${(-(L.board.y + L.board.h) * 1.05 * b).toFixed(1)}px) scale(${(1 - 0.28 * b).toFixed(4)})`;
    board.style.opacity = String(clamp(1 - (p - 0.18) / 0.26));
    if (!target) return;
    // the time flies to One Day's first time (its caps box: the target is set with line-height 1)
    const r = target.getBoundingClientRect();
    const rb = root.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(target).fontSize);
    const capH = fs * 0.71;
    const tx = r.left - rb.left;
    const ty = r.top - rb.top + (r.height - capH) / 2;
    const k = clamp((p - 0.03) / 0.72);
    const t = ease(k);
    const scale = lerp(1, capH / sh, t);
    const x = lerp(sx, tx, t);
    const y = lerp(sy, ty, t);
    fly.style.visibility = p > 0.004 ? "visible" : "hidden";
    fly.style.transform = `translate(${(x - sx).toFixed(2)}px, ${(y - sy).toFixed(2)}px) scale(${scale.toFixed(4)})`;
    // lit amber while it's on the sign; ink dots once it's out on the day ground; then type
    const ink = clamp((k - 0.1) / 0.2);
    const type = clamp((k - 0.5) / 0.22);
    flyLit.style.opacity = String(1 - ink);
    flyInk.style.opacity = String(ink * (1 - type));
    flyType.style.opacity = String(type);
    // and the type takes over from the dots
    const handover = clamp((p - 0.74) / 0.16);
    fly.style.opacity = String(1 - handover);
    target.style.opacity = String(handover);
  };
  const on = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };
  window.addEventListener("scroll", on, { passive: true });
  window.addEventListener("resize", on);
  render();
  return () => {
    window.removeEventListener("scroll", on);
    window.removeEventListener("resize", on);
    board.removeEventListener("click", page);
    cancelAnimationFrame(raf);
    [stack, foot, demo, board, fly].forEach((el) => {
      el.style.transform = "";
      el.style.opacity = "";
    });
  };
}

