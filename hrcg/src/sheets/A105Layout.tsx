// A-105 · LAYOUT AND MARKING (brief 3.8, 4.2). Owner: A4.
//
// Plan + SECTION A–A on 07's own lines. The stage pins on desktop (p = stage progress) as ONE composed
// frame between the header rail and the strip (FIXLIST-1 F-041): the tag and a one-line H2 on the top
// gridline, PLAN 05 and SECTION A–A below it sharing their top and bottom edges, the spec and beats on the
// bottom gridline. The gridlines are continuous 1 px lines from border to border UNDER the media (they pass
// behind the two views): the views' shared top and bottom edges, 07's fresh chalk line, the bottom gridline,
// and 07's east wall line carried down to hold the spec. The body line follows after the pin.
//   on entry   b44 plays once from 0 and holds its last frame (07 crouched at the bay's edge). Never loops.
//   p 0–0.30   the traced vectors draw over the filmed chalk lines (chalk blue, 1.5 px, DRAW, in the order
//              a crew snaps them); orange ✕ control points stamp in at the fresh line's ends; the lines
//              extend outward from the plan to the page edges and become the sheet's gridlines.
//   p 0.30–0.80 SECTION A–A: the cut marker sits on PLAN 05's fresh chalk line; dragging it (or ←/→)
//              moves the depth plane through the section (left = near the camera, right = near the robot).
//              Untouched, scroll sweeps it from near to far. The traces dim to 35% so 07 reads (F-086).
// The link between plan and section is illustrative (different shots of the same task); the section's
// view title says so. Reduced motion / MOTION OFF / no JS: no pin, no sweep, everything drawn; the slider
// still works on input (no JS: the middle still). Phone: no pin; tag, H2, spec and beats first (F-085).

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useStageProgress } from '../system/useStageProgress';
import { registerCaptureScene } from '../system/capture';
import { drawEase, segment } from '../system/easing';
import { onLayout } from '../system/scroll';
import { ViewTitle } from '../chrome/ViewTitle';
import { SheetTag } from '../chrome/SheetTag';
import { LoopVideo } from '../system/LoopVideo';
import { loadJson } from '../media/manifest';
import { ControlX } from '../marks/ControlX';
import { SectionCut } from '../marks/SectionCut';
import { DetailBubble } from '../marks/DetailBubble';
import { videoManager } from '../system/VideoManager';
import { A105 } from '../content/copy/a104-a200';
import { SectionSlice, type SectionSliceHandle } from './SectionSlice';
import { useLive, useMediaQuery, usePrinted, frames } from './a4/util';
import './a4/a4.css';

// ------------------------------------------------------------------ data: lines-b44.json (A5, D5)
type V2 = readonly [number, number];
interface Seg {
  id: number;
  a: V2;
  b: V2;
  order: number;
}
interface LinesData {
  mock?: boolean;
  segments: Seg[];
  fresh: { a: V2; b: V2 };
  gridlines?: Array<{ axis: 'x' | 'y'; at: number; from?: number; to?: number }>;
}

/**
 * Prerender / no-JS fallback: a copy of lines-b44.json (A5, D5) as of 2026-10-08, normalised 0..1 of the
 * registered plan frame. The real file is always fetched at runtime; this keeps the first paint (and the
 * no-JS sheet) drawn and registered. Regenerate it if D5 changes.
 */
const FALLBACK: LinesData = {
  segments: [
    [0.166, 0.1792, 0.166, 0.8458],
    [0.1562, 0.8326, 0.6667, 0.8326],
    [0.7576, 0.8319, 0.8444, 0.8319],
    [0.8361, 0.1521, 0.8361, 0.8424],
    [0.166, 0.1722, 0.3139, 0.1722],
    [0.7479, 0.1694, 0.8292, 0.1694],
    [0.1549, 0.5292, 0.3083, 0.5292],
    [0.159, 0.5583, 0.2917, 0.5583],
    [0.2868, 0.5243, 0.2868, 0.8319],
    [0.2792, 0.5243, 0.2792, 0.8319],
    [0.7632, 0.7285, 0.7632, 0.8403],
    [0.3882, 0.5264, 0.7542, 0.5264],
  ].map(([ax, ay, bx, by], i) => ({ id: i + 1, a: [ax!, ay!] as V2, b: [bx!, by!] as V2, order: i + 1 })),
  fresh: { a: [0.3882, 0.5255], b: [0.7542, 0.528] },
  gridlines: [
    { axis: 'x', at: 0.166, from: 0.1792, to: 0.8458 },
    { axis: 'x', at: 0.2792, from: 0.5243, to: 0.8319 },
    { axis: 'x', at: 0.7632, from: 0.7285, to: 0.8403 },
    { axis: 'x', at: 0.8361, from: 0.1521, to: 0.8424 },
    { axis: 'y', at: 0.1694, from: 0.166, to: 0.8292 },
    { axis: 'y', at: 0.5264, from: 0.1549, to: 0.7542 },
    { axis: 'y', at: 0.5583, from: 0.159, to: 0.2917 },
    { axis: 'y', at: 0.8319, from: 0.1562, to: 0.8444 },
  ],
};
/** Measured on the mock's last frame (A4-3): used while the JSON still says "mock". */
const MOCK_FRESH = { a: [0.4, 0.527] as V2, b: [0.708, 0.527] as V2 };

interface Line {
  at: number;
  from: number;
  to: number;
}
interface Grid {
  /** traced segments, in snap order (merged near-duplicates) */
  segs: Array<{ a: V2; b: V2 }>;
  /** vertical gridlines (at = u) and horizontal gridlines (at = v), with the traced extent along them */
  xs: Line[];
  ys: Line[];
  fresh: { x0: number; x1: number; y: number };
  /** the top and bottom wall lines: SECTION A–A hangs between them (its top and bottom edges on them) */
  vt: number;
  vb: number;
  /** the left wall line: the text column is set on it */
  u1: number;
}

function cluster(vals: Array<{ at: number; len: number; from: number; to: number }>, tol = 0.02): Line[] {
  const sorted = [...vals].sort((a, b) => a.at - b.at);
  const out: Array<Line & { w: number }> = [];
  for (const v of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(v.at - last.at) <= tol) {
      last.at = (last.at * last.w + v.at * v.len) / (last.w + v.len);
      last.w += v.len;
      last.from = Math.min(last.from, v.from);
      last.to = Math.max(last.to, v.to);
    } else out.push({ ...v, w: v.len });
  }
  return out.filter((c) => c.w >= 0.12).map((c) => ({ at: Math.round(c.at * 1000) / 1000, from: c.from, to: c.to }));
}

function deriveGrid(d: LinesData): Grid {
  const fresh = d.mock ? MOCK_FRESH : d.fresh;
  const segs = [...d.segments].sort((a, b) => a.order - b.order);
  // merge near-duplicate traces (lines.py reports both edges of a chalk stripe)
  const kept: Array<{ a: V2; b: V2 }> = [];
  for (const s of segs) {
    const dup = kept.some(
      (k) =>
        (Math.hypot(k.a[0] - s.a[0], k.a[1] - s.a[1]) < 0.03 && Math.hypot(k.b[0] - s.b[0], k.b[1] - s.b[1]) < 0.03) ||
        (Math.hypot(k.a[0] - s.b[0], k.a[1] - s.b[1]) < 0.03 && Math.hypot(k.b[0] - s.a[0], k.b[1] - s.a[1]) < 0.03),
    );
    if (!dup) kept.push({ a: s.a, b: s.b });
  }
  const freshSeg = { a: fresh.a, b: fresh.b };
  if (!kept.some((k) => Math.abs(k.a[1] - fresh.a[1]) < 0.01 && Math.abs(k.a[0] - fresh.a[0]) < 0.02)) kept.push(freshSeg);

  let xs: Line[];
  let ys: Line[];
  const fyA = (fresh.a[1] + fresh.b[1]) / 2;
  if (d.gridlines && d.gridlines.length) {
    // the page grid is 07's long lines (the perimeter and the fresh line); short interior lines and the
    // door jamb stay traces only, or the sheet would read as a lattice
    const long = d.gridlines
      .map((g) => ({ axis: g.axis, at: g.at, from: g.from ?? 0, to: g.to ?? 1 }))
      .filter((g) => g.to - g.from >= 0.45 || (g.axis === 'y' && Math.abs(g.at - fyA) < 0.01));
    xs = long.filter((g) => g.axis === 'x');
    ys = long.filter((g) => g.axis === 'y');
  } else {
    const hv = segs.map((t) => ({ dx: t.b[0] - t.a[0], dy: t.b[1] - t.a[1], t }));
    xs = cluster(
      hv
        .filter((q) => Math.abs(q.dx) < 0.15 * Math.abs(q.dy))
        .map((q) => ({
          at: (q.t.a[0] + q.t.b[0]) / 2,
          len: Math.abs(q.dy),
          from: Math.min(q.t.a[1], q.t.b[1]),
          to: Math.max(q.t.a[1], q.t.b[1]),
        })),
    ).filter((l) => l.to - l.from >= 0.45);
    ys = cluster(
      hv
        .filter((q) => Math.abs(q.dy) < 0.15 * Math.abs(q.dx))
        .map((q) => ({
          at: (q.t.a[1] + q.t.b[1]) / 2,
          len: Math.abs(q.dx),
          from: Math.min(q.t.a[0], q.t.b[0]),
          to: Math.max(q.t.a[0], q.t.b[0]),
        })),
    ).filter((l) => l.to - l.from >= 0.45 || Math.abs(l.at - fyA) < 0.02);
  }
  const x0 = Math.min(fresh.a[0], fresh.b[0]);
  const x1 = Math.max(fresh.a[0], fresh.b[0]);
  const fy = fyA;
  if (!ys.some((y) => Math.abs(y.at - fy) < 0.02)) ys.push({ at: fy, from: x0, to: x1 });
  ys.sort((a, b) => a.at - b.at);
  xs.sort((a, b) => a.at - b.at);
  const lower = ys.filter((y) => y.at > 0.6).map((y) => y.at);
  const upper = ys.filter((y) => y.at < 0.4).map((y) => y.at);
  const vb = lower.length ? Math.max(...lower) : 0.84;
  const vt = upper.length ? Math.min(...upper) : 0.16;
  const u1 = xs.length ? xs[0]!.at : 0.147;
  return { segs: kept, xs, ys, fresh: { x0, x1, y: fy }, vt: Math.max(0.05, vt), vb: Math.min(0.95, vb), u1 };
}

// ------------------------------------------------------------------ gridlines (pin px)
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Ext {
  d: string;
  /** distance from the plan's edge where this piece starts and ends (for the outward draw) */
  d0: number;
  d1: number;
}

/** A horizontal gridline from border to border, drawn as two pieces that grow outward from the plan. */
function hLine(y: number, plan: Box, W: number, edge: number): Ext[] {
  const yy = Math.round(y) + 0.5;
  const l = plan.x;
  const r = plan.x + plan.w;
  return [
    { d: `M${l} ${yy}H${edge}`, d0: 0, d1: Math.max(1, l - edge) },
    { d: `M${r} ${yy}H${W - edge}`, d0: 0, d1: Math.max(1, W - edge - r) },
  ];
}

const valueText = (n: number) => (n <= 3 ? A105.slider.near : n <= 6 ? A105.slider.middle : A105.slider.far);

// optional: the hero's machine (A2; already in the shell). Absent → the non-snapped line (brief F9).
type HeroMachineLike = { get(): { snappedByUser: boolean }; subscribe(l: () => void): () => void };
const heroMods = import.meta.glob<{ heroMachine?: HeroMachineLike }>('../hero/heroMachine.ts', { eager: true });

/** The ✕ control points sit this far beyond the fresh line's ends; the cut runs ✕ to ✕ (F-042). */
const X_OUT = 10;

export default function A105Layout() {
  const live = useLive();
  const phone = useMediaQuery('(max-width: 767px)');
  const [data, setData] = useState<LinesData>(FALLBACK);
  const grid = useMemo(() => deriveGrid(data), [data]);
  const [snapped, setSnapped] = useState(false);
  const [geo, setGeo] = useState<{ W: number; H: number; ext: Ext[] } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const sliceRef = useRef<SectionSliceHandle>(null);
  const tracesRef = useRef<SVGSVGElement>(null);
  const traceRefs = useRef<Array<SVGPathElement | null>>([]);
  const extRefs = useRef<Array<SVGPathElement | null>>([]);
  const xRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const s = useRef(0.5);
  const touched = useRef(false);
  const capture = useRef<number | null>(null);
  const secRef = useRef<HTMLDivElement>(null);
  // desktop: the pinned stage's progress. Phone (not pinned): the traces follow the stage passing through
  // the viewport and the sweep follows the section itself, so it happens while the section is on screen.
  usePrinted(pinRef, '0px 0px -10% 0px');
  usePrinted(afterRef);
  const p = useStageProgress(trackRef, phone ? { start: 'top bottom', end: 'bottom top' } : {});
  const pSec = useStageProgress(secRef, { start: 'top bottom', end: 'bottom top' });

  // a jump (INDEX, CTA) lands with the pin engaged at p = 0: the composed frame, H2 on screen (F-041, F-015)
  useEffect(() => {
    const sec = rootRef.current?.closest<HTMLElement>('[data-sheet]');
    if (!sec) return;
    if (live && !phone) sec.dataset.land = '0';
    else delete sec.dataset.land;
    return () => {
      delete sec.dataset.land;
    };
  }, [live, phone]);

  // the real lines (A5)
  useEffect(() => {
    let alive = true;
    loadJson<LinesData>('lines-b44')
      .then((d) => alive && d && Array.isArray(d.segments) && d.segments.length && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // F9: "you already snapped one line of it" only if the visitor really snapped
  useEffect(() => {
    const hm = heroMods['../hero/heroMachine.ts']?.heroMachine;
    if (!hm || typeof hm.get !== 'function') return;
    const read = () => setSnapped(!!hm.get().snappedByUser);
    read();
    return hm.subscribe(read);
  }, []);

  // ---- slider
  const setS = useCallback((v: number, from: 'user' | 'sweep' | 'init') => {
    const k = Math.min(1, Math.max(0, v));
    if (from === 'user') touched.current = true;
    s.current = k;
    const cut = cutRef.current;
    if (cut) {
      cut.style.setProperty('--s', String(k));
      const n = Math.round(k * 10);
      if (cut.getAttribute('aria-valuenow') !== String(n)) {
        cut.setAttribute('aria-valuenow', String(n));
        cut.setAttribute('aria-valuetext', valueText(n));
      }
    }
    sliceRef.current?.set(k);
  }, []);

  const fromPointer = useCallback(
    (clientX: number) => {
      const box = planRef.current?.getBoundingClientRect();
      if (!box) return;
      const x0 = box.left + grid.fresh.x0 * box.width - X_OUT;
      const x1 = box.left + grid.fresh.x1 * box.width + X_OUT;
      setS((clientX - x0) / (x1 - x0), 'user');
    },
    [grid, setS],
  );

  // F-084: a mouse drags at once; touch and pen take the cut only after a horizontal intent (|dx| > |dy| over
  // the first 6 px), so a vertical swipe that starts on the plan or the handle still scrolls the page.
  const drag = useRef<{ id: number; x: number; y: number; active: boolean; mouse: boolean } | null>(null);
  const take = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be gone */
    }
    cutRef.current?.focus({ preventScroll: true });
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const mouse = e.pointerType === 'mouse';
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: mouse, mouse };
    if (mouse) {
      take(e);
      fromPointer(e.clientX);
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.active) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        drag.current = null; // a scroll: let the page have it
        return;
      }
      d.active = true;
      take(e);
    }
    fromPointer(e.clientX);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // a touch tap (no travel) places the cut where it landed
    if (!d.active && !d.mouse) fromPointer(e.clientX);
    drag.current = null;
  };
  const onPointerCancel = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.1;
    const n = Math.round(s.current * 10);
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = (n + 1) / 10;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = (n - 1) / 10;
    else if (e.key === 'PageUp') next = s.current + step * 3;
    else if (e.key === 'PageDown') next = s.current - step * 3;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 1;
    if (next === null) return;
    e.preventDefault();
    setS(next, 'user');
  };

  // ---- fit and gridlines (on resize only). Desktop live: --H (the views' shared height) is the largest that
  // fits the frame between the chrome; the section takes the width left over (16:9 up to 2.1:1, cover-cropped).
  // Gridlines are desktop only: on a phone the plan is the full column, so lines out to the page edges
  // would be 4 px stubs.
  const measure = useCallback(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const plan = planRef.current;
    const foot = footRef.current;
    const stage = stageRef.current;
    if (!root || !pin || !plan || !stage) return;
    const isPhone = window.matchMedia('(max-width: 767px)').matches;
    const pinned = live && !isPhone;
    if (!pinned) root.style.removeProperty('--H');
    else {
      const cw = stage.clientWidth;
      const maxH = Math.floor((cw - 32) / 2.7778);
      for (let i = 0; i < 4; i++) {
        const cur = plan.closest('.view-frame')?.getBoundingClientRect().height ?? 0;
        const footRow = foot ? foot.getBoundingClientRect() : null;
        const cs = getComputedStyle(stage);
        const innerBottom = stage.getBoundingClientRect().bottom - (parseFloat(cs.paddingBottom) || 0);
        // slack between the spec/beats row and the frame's bottom padding (negative = overflowing)
        const slack = footRow ? innerBottom - footRow.bottom : 0;
        const next = Math.max(160, Math.min(maxH, Math.floor(cur + slack)));
        if (Math.abs(next - cur) < 1) break;
        root.style.setProperty('--H', `${next}px`);
      }
    }
    const pr = pin.getBoundingClientRect();
    if (isPhone) {
      setGeo({ W: pr.width, H: pr.height, ext: [] });
      return;
    }
    const rel = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width ? { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height } : null;
    };
    const inner = rel(plan);
    const frame = rel(plan.closest('.view-frame')) ?? inner;
    if (!inner || !frame) return;
    const edge = Math.max(12, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--border')) || 24);
    const W = pr.width;
    const ext: Ext[] = [];
    // the views' shared top and bottom edges, and 07's fresh chalk line, from border to border
    ext.push(...hLine(frame.y, frame, W, edge));
    ext.push(...hLine(inner.y + grid.fresh.y * inner.h, frame, W, edge));
    ext.push(...hLine(frame.y + frame.h - 1, frame, W, edge));
    // 07's east wall line carried down to the bottom gridline, which then runs out both ways from its foot
    const f = rel(foot);
    if (f) {
      const yb = Math.round(f.y + f.h + 6) + 0.5;
      const u2 = grid.xs.find((x) => x.at > grid.u1 + 0.2)?.at ?? 0.836;
      const x = Math.round(inner.x + u2 * inner.w) + 0.5;
      const y0 = frame.y + frame.h;
      const v = Math.max(1, yb - y0);
      ext.push({ d: `M${x} ${y0}V${yb}`, d0: 0, d1: v });
      ext.push({ d: `M${x} ${yb}H${edge}`, d0: v, d1: v + Math.max(1, x - edge) });
      ext.push({ d: `M${x} ${yb}H${W - edge}`, d0: v, d1: v + Math.max(1, W - edge - x) });
    }
    setGeo({ W, H: pr.height, ext });
  }, [grid, live]);

  useEffect(() => {
    measure();
    const off = onLayout(measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && pinRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(pinRef.current);
    }
    return () => {
      off();
      ro?.disconnect();
    };
  }, [measure, snapped, phone, live]);

  // ---- progress: traces draw, gridlines extend, the section sweeps
  const apply = useCallback(
    (v: number) => {
      const n = grid.segs.length;
      const k = (a: number, b: number) => drawEase(segment(v, a, b));
      traceRefs.current.forEach((el, i) => {
        if (!el) return;
        const a = (i / n) * 0.2;
        el.style.strokeDashoffset = String(1 - k(a, a + 0.2 / n + 0.04));
      });
      // F-086: once the section takes over, the traces step back so 07 isn't read as painted over
      if (tracesRef.current) tracesRef.current.style.opacity = String(1 - 0.65 * segment(v, 0.3, 0.36));
      const K = k(0.15, 0.3);
      const dmax = Math.max(1, ...(geo?.ext.map((e) => e.d1) ?? [1]));
      extRefs.current.forEach((el, i) => {
        const e = geo?.ext[i];
        if (!el || !e) return;
        const reach = K * dmax;
        const t = Math.min(1, Math.max(0, (reach - e.d0) / Math.max(1, e.d1 - e.d0)));
        el.style.strokeDashoffset = String(1 - t);
      });
      xRef.current?.toggleAttribute('data-stamped', v >= 0.18);
      if (capture.current !== null || phone) return;
      if (!touched.current) setS(segment(v, 0.3, 0.8), 'sweep');
    },
    [grid, geo, setS, phone],
  );
  const applySec = useCallback(
    (v: number) => {
      if (capture.current !== null || !phone || touched.current) return;
      setS(segment(v, 0.3, 0.75), 'sweep');
    },
    [phone, setS],
  );

  useEffect(() => {
    if (!live) {
      traceRefs.current.forEach((el) => el?.style.removeProperty('stroke-dashoffset'));
      extRefs.current.forEach((el) => el?.style.removeProperty('stroke-dashoffset'));
      tracesRef.current?.style.removeProperty('opacity');
      xRef.current?.setAttribute('data-stamped', '');
      if (!touched.current) setS(0.5, 'init');
      return;
    }
    apply(p.get());
    applySec(pSec.get());
    const offA = p.on('change', apply);
    const offB = pSec.on('change', applySec);
    return () => {
      offA();
      offB();
    };
  }, [live, p, pSec, apply, applySec, setS]);

  // ?capture scene 'slice': t (0..1) = the cut position; the section view is brought on screen
  useEffect(() => {
    return registerCaptureScene('slice', {
      duration: 1,
      async seek(t) {
        capture.current = t;
        const pin = pinRef.current;
        const track = trackRef.current;
        if (track && pin) {
          const r = track.getBoundingClientRect();
          const top = r.top + window.scrollY;
          const span = Math.max(0, r.height - window.innerHeight);
          window.scrollTo(0, top + span * 0.55);
          await frames(2);
        }
        await sliceRef.current?.ensureGL(12000);
        setS(t, 'init');
        await sliceRef.current?.settled();
      },
    });
  }, [setS]);

  // detail 5: the bubble plays its film only while open
  const onDetail = useCallback((open: boolean) => {
    if (open) videoManager.userPlay('det-n04');
    else videoManager.pause('det-n04');
  }, []);

  const n0 = 5;
  const cutStyle = {
    left: `calc(${grid.fresh.x0 * 100}% - ${X_OUT}px)`,
    width: `calc(${(grid.fresh.x1 - grid.fresh.x0) * 100}% + ${2 * X_OUT}px)`,
    top: `${grid.fresh.y * 100}%`,
    ['--s' as string]: '0.5',
  } as CSSProperties;
  const u2 = grid.xs.find((x) => x.at > grid.u1 + 0.2)?.at ?? 0.836;
  const rootStyle = {
    ['--vt' as string]: String(grid.vt),
    ['--vb' as string]: String(grid.vb),
    ['--u1' as string]: String(grid.u1),
    ['--u2' as string]: String(u2),
  } as CSSProperties;

  extRefs.current.length = geo?.ext.length ?? 0;
  traceRefs.current.length = grid.segs.length;

  return (
    <div className="a105" ref={rootRef} data-live={live ? '' : undefined} style={rootStyle}>
      <div className="a105-track" ref={trackRef}>
        <div className="a105-pin" ref={pinRef}>
          {geo && geo.ext.length ? (
            <svg className="a105-grid" viewBox={`0 0 ${geo.W} ${geo.H}`} width={geo.W} height={geo.H} aria-hidden="true" focusable="false">
              {geo.ext.map((e, i) => (
                <path
                  key={`${e.d}-${i}`}
                  ref={(el) => {
                    extRefs.current[i] = el;
                  }}
                  d={e.d}
                  pathLength={1}
                />
              ))}
            </svg>
          ) : null}
          <div className="a105-stage" ref={stageRef}>
            <SheetTag id="A-105" className="a105-tag" />
            {/* the H2 and the spec sit on the top gridline (the views' shared top edge) */}
            <div className="a105-head">
              <h2 className="t-h2-challenge a105-h2 print-in">{A105.h2}</h2>
              <p className="t-spec a105-spec print-in" style={{ ['--d' as string]: '120ms' } as CSSProperties}>
                {A105.spec}
              </p>
            </div>

            <div className="a105-views">
              <div className="a105-planside">
                <ViewTitle id="a105-plan" className="a105-plan" captionClassName="a105-cap">
                  <div
                    className="a105-planbox"
                    ref={planRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                  >
                    <LoopVideo id="plan-b44" instance="a105" />
                    <svg ref={tracesRef} className="a105-traces" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                      {grid.segs.map((sg, i) => (
                        <path
                          key={i}
                          ref={(el) => {
                            traceRefs.current[i] = el;
                          }}
                          d={`M${sg.a[0]} ${sg.a[1]}L${sg.b[0]} ${sg.b[1]}`}
                          pathLength={1}
                        />
                      ))}
                    </svg>
                    <div className="a105-x" ref={xRef} aria-hidden="true">
                      <ControlX size={16} seed={3} className="a105-x0" style={{ left: `${grid.fresh.x0 * 100}%`, top: `${grid.fresh.y * 100}%` }} />
                      <ControlX size={16} seed={9} className="a105-x1" style={{ left: `${grid.fresh.x1 * 100}%`, top: `${grid.fresh.y * 100}%` }} />
                    </div>
                    <div className="a105-cutrail" style={cutStyle}>
                      <div
                        className="a105-cut js-only"
                        ref={cutRef}
                        role="slider"
                        tabIndex={0}
                        aria-label={A105.slider.label}
                        aria-valuemin={0}
                        aria-valuemax={10}
                        aria-valuenow={n0}
                        aria-valuetext={valueText(n0)}
                        aria-orientation="horizontal"
                        onKeyDown={onKeyDown}
                      >
                        <span className="a105-cut-mark">
                          <SectionCut length={phone ? 84 : 132} bubble={phone ? 20 : 24} arrows="along" />
                        </span>
                      </div>
                    </div>
                  </div>
                </ViewTitle>
                <ViewTitle id="a105-trace" captionClassName="a105-cap a105-cap--trace" />
              </div>
              <div className="a105-secside">
                <div ref={secRef}>
                  <SectionSlice handle={sliceRef} initial={0.5} />
                </div>
                <p className="a105-hint t-label print-in">{A105.hint}</p>
              </div>
            </div>

            {/* the bottom gridline: DETAIL 5 on the spine, the beats hanging off 07's east wall line */}
            <div className="a105-foot" ref={footRef}>
              <div className="a105-detail">
                <DetailBubble n={5} sheet="A-105" label={A105.detail.label} onOpenChange={onDetail} panelClassName="a105-detail-panel" phoneFlow>
                  <ViewTitle id="a105-detail">
                    <LoopVideo id="det-n04" autoPlay={false} />
                  </ViewTitle>
                </DetailBubble>
              </div>
              <ul className="a105-beats print-in" style={{ ['--d' as string]: '240ms' } as CSSProperties}>
                {A105.beats.map((b) => (
                  <li key={b} className="t-beat">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* after the pin: the body line */}
      <div className="a105-after" ref={afterRef}>
        <p className="t-lead a105-line print-in">{snapped ? A105.lineSnapped : A105.line}</p>
      </div>
    </div>
  );
}
