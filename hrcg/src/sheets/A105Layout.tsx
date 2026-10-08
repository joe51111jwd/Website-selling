// A-105 · LAYOUT AND MARKING (brief 3.8, 4.2). Owner: A4.
//
// Plan + SECTION A–A on 07's own gridlines. The stage pins on desktop (p = stage progress):
//   on entry   b44 plays once from 0 and holds its last frame (07 crouched at the bay's edge). Never loops.
//   p 0–0.30   the traced vectors draw over the filmed chalk lines (chalk blue, 1.5 px, DRAW, in the order
//              a crew snaps them); orange ✕ control points stamp in at the fresh line's ends; the extracted
//              lines extend outward to the page edges and become the sheet's gridlines. SECTION A–A sits
//              between them (its bottom edge on 07's bottom wall line); the H2 and spec are set on them.
//   p 0.30–0.80 SECTION A–A: the cut marker sits on PLAN 05's fresh chalk line; dragging it (or ←/→)
//              moves the depth plane through the section (left = near the camera, right = near the robot).
//              Untouched, scroll sweeps it from near to far.
// The link between plan and section is illustrative (different shots of the same task); the section's
// view title says so. Reduced motion / MOTION OFF / no JS: no pin, no sweep, everything drawn; the slider
// still works on input (no JS: the middle still).

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
import { useLive, useMediaQuery, frames } from './a4/util';
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
 * Prerender / no-JS fallback: the first-wave mock (normalised 0..1 of the plan frame). The real file is
 * always fetched at runtime; this only keeps the first paint from being empty.
 */
const FALLBACK: LinesData = {
  mock: true,
  segments: [
    [0.1611, 0.835, 0.6689, 0.8398],
    [0.1475, 0.5273, 0.1504, 0.1602],
    [0.1396, 0.8262, 0.1455, 0.1592],
    [0.8457, 0.584, 0.8545, 0.8252],
    [0.5693, 0.8369, 0.6699, 0.8379],
    [0.1377, 0.5215, 0.2949, 0.5215],
    [0.833, 0.166, 0.8369, 0.3203],
    [0.5684, 0.5225, 0.75, 0.5234],
  ].map(([ax, ay, bx, by], i) => ({ id: i + 1, a: [ax!, ay!] as V2, b: [bx!, by!] as V2, order: i + 1 })),
  fresh: { a: [0.4, 0.527], b: [0.708, 0.527] },
};
/** Measured on the mock's last frame (A4-3): used while the JSON still says "mock". */
const MOCK_FRESH = { a: [0.4, 0.527] as V2, b: [0.708, 0.527] as V2 };

interface Grid {
  /** traced segments, in snap order (merged near-duplicates) */
  segs: Array<{ a: V2; b: V2 }>;
  /** vertical gridlines (u) and horizontal gridlines (v), plan units */
  xs: number[];
  ys: number[];
  fresh: { x0: number; x1: number; y: number };
  /** the bottom wall line: SECTION A–A's bottom edge sits on it */
  vb: number;
  /** the left wall line: the text column is set on it */
  u1: number;
}

function cluster(vals: Array<{ at: number; len: number }>, tol = 0.02): number[] {
  const sorted = [...vals].sort((a, b) => a.at - b.at);
  const out: Array<{ at: number; w: number }> = [];
  for (const v of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(v.at - last.at) <= tol) {
      last.at = (last.at * last.w + v.at * v.len) / (last.w + v.len);
      last.w += v.len;
    } else out.push({ at: v.at, w: v.len });
  }
  return out.filter((c) => c.w >= 0.12).map((c) => Math.round(c.at * 1000) / 1000);
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

  let xs: number[];
  let ys: number[];
  if (d.gridlines && d.gridlines.length) {
    xs = d.gridlines.filter((g) => g.axis === 'x').map((g) => g.at);
    ys = d.gridlines.filter((g) => g.axis === 'y').map((g) => g.at);
  } else {
    const hv = segs.map((s) => ({ dx: s.b[0] - s.a[0], dy: s.b[1] - s.a[1], s }));
    xs = cluster(
      hv.filter((t) => Math.abs(t.dx) < 0.15 * Math.abs(t.dy)).map((t) => ({ at: (t.s.a[0] + t.s.b[0]) / 2, len: Math.abs(t.dy) })),
    );
    ys = cluster(
      hv.filter((t) => Math.abs(t.dy) < 0.15 * Math.abs(t.dx)).map((t) => ({ at: (t.s.a[1] + t.s.b[1]) / 2, len: Math.abs(t.dx) })),
    );
  }
  const x0 = Math.min(fresh.a[0], fresh.b[0]);
  const x1 = Math.max(fresh.a[0], fresh.b[0]);
  const fy = (fresh.a[1] + fresh.b[1]) / 2;
  if (!ys.some((y) => Math.abs(y - fy) < 0.02)) ys.push(fy);
  ys.sort((a, b) => a - b);
  xs.sort((a, b) => a - b);
  const vb = ys.length ? Math.max(...ys.filter((y) => y > 0.6), 0.84) : 0.84;
  const u1 = xs.length ? xs[0]! : 0.147;
  return { segs: kept, xs, ys, fresh: { x0, x1, y: fy }, vb: Math.min(0.92, vb), u1 };
}

// ------------------------------------------------------------------ gridline extensions (stage px)
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Ext {
  d: string;
  /** distance from the plan edge where this piece starts and ends (for the outward draw) */
  d0: number;
  d1: number;
}

/** Subtract boxes from [a, b] along one axis. */
function gaps(a: number, b: number, blocks: Array<[number, number]>): Array<[number, number]> {
  let parts: Array<[number, number]> = [[a, b]];
  for (const [s, e] of blocks) {
    const next: Array<[number, number]> = [];
    for (const [p, q] of parts) {
      if (e <= p || s >= q) next.push([p, q]);
      else {
        if (s > p) next.push([p, s]);
        if (e < q) next.push([e, q]);
      }
    }
    parts = next;
  }
  return parts.filter(([p, q]) => q - p > 6);
}

function extensions(g: Grid, plan: Box, W: number, H: number, edge: number, avoid: Box[], top: number, bottom: number): Ext[] {
  const out: Ext[] = [];
  const pad = 10;
  for (const v of g.ys) {
    const y = Math.round(plan.y + v * plan.h) + 0.5;
    const blocks = avoid
      .filter((b) => y > b.y - pad && y < b.y + b.h + pad && !(Math.abs(y - (b.y + b.h)) < 2.5))
      .map((b) => [b.x - pad, b.x + b.w + pad] as [number, number]);
    // left of the plan
    for (const [p, q] of gaps(edge, plan.x, blocks)) out.push({ d: `M${q} ${y}H${p}`, d0: plan.x - q, d1: plan.x - p });
    for (const [p, q] of gaps(plan.x + plan.w, W - edge, blocks))
      out.push({ d: `M${p} ${y}H${q}`, d0: p - plan.x - plan.w, d1: q - plan.x - plan.w });
  }
  for (const u of g.xs) {
    const x = Math.round(plan.x + u * plan.w) + 0.5;
    const blocks = avoid
      .filter((b) => x > b.x - pad && x < b.x + b.w + pad)
      .map((b) => [b.y - pad, b.y + b.h + pad] as [number, number]);
    for (const [p, q] of gaps(top, plan.y, blocks)) out.push({ d: `M${x} ${q}V${p}`, d0: plan.y - q, d1: plan.y - p });
    for (const [p, q] of gaps(plan.y + plan.h, bottom, blocks))
      out.push({ d: `M${x} ${p}V${q}`, d0: p - plan.y - plan.h, d1: q - plan.y - plan.h });
  }
  void H;
  return out;
}

const valueText = (n: number) => (n <= 3 ? A105.slider.near : n <= 6 ? A105.slider.middle : A105.slider.far);

// lazy, optional: the hero's machine (A2). Absent → the non-snapped line (brief F9).
const heroMods = import.meta.glob<{ heroMachine?: { get(): { snappedByUser: boolean }; subscribe(l: () => void): () => void } }>(
  '../hero/heroMachine.ts',
);

export default function A105Layout() {
  const live = useLive();
  const phone = useMediaQuery('(max-width: 767px)');
  const [data, setData] = useState<LinesData>(FALLBACK);
  const grid = useMemo(() => deriveGrid(data), [data]);
  const [snapped, setSnapped] = useState(false);
  const [geo, setGeo] = useState<{ W: number; H: number; ext: Ext[]; text: { W: number; H: number; lines: string[] } } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const sliceRef = useRef<SectionSliceHandle>(null);
  const traceRefs = useRef<Array<SVGPathElement | null>>([]);
  const extRefs = useRef<Array<SVGPathElement | null>>([]);
  const textRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const s = useRef(0.5);
  const touched = useRef(false);
  const capture = useRef<number | null>(null);
  const p = useStageProgress(trackRef);

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
    const load = heroMods['../hero/heroMachine.ts'];
    if (!load) return;
    let off: (() => void) | undefined;
    let alive = true;
    load()
      .then((m) => {
        const hm = m.heroMachine;
        if (!alive || !hm) return;
        const read = () => setSnapped(!!hm.get().snappedByUser);
        read();
        off = hm.subscribe(read);
      })
      .catch(() => {});
    return () => {
      alive = false;
      off?.();
    };
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
      const x0 = box.left + grid.fresh.x0 * box.width;
      const x1 = box.left + grid.fresh.x1 * box.width;
      setS((clientX - x0) / (x1 - x0), 'user');
    },
    [grid, setS],
  );

  const drag = useRef<number | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    cutRef.current?.focus({ preventScroll: true });
    fromPointer(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current === e.pointerId) fromPointer(e.clientX);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current === e.pointerId) drag.current = null;
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

  // ---- geometry of the gridline extensions (on resize only)
  const measure = useCallback(() => {
    const pin = pinRef.current;
    const plan = planRef.current;
    const text = textRef.current;
    if (!pin || !plan) return;
    const pr = pin.getBoundingClientRect();
    const rel = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width ? { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height } : null;
    };
    const planBox = rel(plan)!;
    const avoid = Array.from(pin.querySelectorAll('[data-a105-avoid]'))
      .map(rel)
      .filter((b): b is Box => !!b);
    const edge = Math.max(12, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--border')) || 24);
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 48;
    const ext = extensions(grid, planBox, pr.width, pr.height, edge, avoid, edge + header, pr.height - 4);
    // the text block: its verticals, set exactly on the plan's x positions, minus the text itself
    let textGeo = { W: 0, H: 0, lines: [] as string[] };
    if (text) {
      const tr = text.getBoundingClientRect();
      const blocks = Array.from(text.querySelectorAll('[data-a105-text]')).map((el) => el.getBoundingClientRect());
      const lines: string[] = [];
      for (const u of grid.xs) {
        const xv = planBox.x + pr.left + u * planBox.w;
        const x = Math.round(xv - tr.left) + 0.5;
        const bl = blocks
          .filter((b) => xv > b.left - 8 && xv < b.right + 8)
          .map((b) => [b.top - tr.top - 16, b.bottom - tr.top + 16] as [number, number]);
        for (const [a, b] of gaps(0, tr.height, bl)) lines.push(`M${x} ${a}V${b}`);
      }
      textGeo = { W: tr.width, H: tr.height, lines };
    }
    setGeo({ W: pr.width, H: pr.height, ext, text: textGeo });
  }, [grid]);

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
      if (capture.current !== null) return;
      if (!touched.current) setS(segment(v, 0.3, 0.8), 'sweep');
    },
    [grid, geo, setS],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!live) {
      traceRefs.current.forEach((el) => el?.style.removeProperty('stroke-dashoffset'));
      extRefs.current.forEach((el) => el?.style.removeProperty('stroke-dashoffset'));
      xRef.current?.setAttribute('data-stamped', '');
      if (!touched.current) setS(0.5, 'init');
      return;
    }
    void root;
    apply(p.get());
    return p.on('change', apply);
  }, [live, p, apply, setS]);

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
    left: `${grid.fresh.x0 * 100}%`,
    width: `${(grid.fresh.x1 - grid.fresh.x0) * 100}%`,
    top: `${grid.fresh.y * 100}%`,
    ['--s' as string]: '0.5',
  } as CSSProperties;
  const u2 = grid.xs.find((x) => x > grid.u1 + 0.2) ?? 0.85;
  const rootStyle = {
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
          {geo ? (
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
          <div className="a105-stage">
            <SheetTag id="A-105" className="a105-tag" />

            <div className="a105-views">
              <div className="a105-left">
                <SectionSlice handle={sliceRef} initial={0.5} />
                <p className="a105-hint t-label" data-a105-avoid="">
                  {A105.hint}
                </p>
                <p className="t-lead a105-line" data-a105-avoid="">
                  {snapped ? A105.lineSnapped : A105.line}
                </p>
              </div>

              <div className="a105-right">
                <ViewTitle id="a105-plan" className="a105-plan" captionClassName="a105-cap">
                  <div
                    className="a105-planbox"
                    ref={planRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    <LoopVideo id="plan-b44" />
                    <svg className="a105-traces" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
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
                          <SectionCut length={phone ? 64 : 92} bubble={phone ? 18 : 20} arrows="along" />
                        </span>
                      </div>
                    </div>
                  </div>
                </ViewTitle>
                <ViewTitle id="a105-trace" captionClassName="a105-cap a105-cap--trace" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="a105-text" ref={textRef}>
        {geo && geo.text.W ? (
          <svg className="a105-textgrid" viewBox={`0 0 ${geo.text.W} ${geo.text.H}`} aria-hidden="true" focusable="false">
            {geo.text.lines.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        ) : null}
        <div className="a105-textin">
        <h2 className="t-h2-challenge a105-h2" data-a105-text="">
          {A105.h2}
        </h2>
        <div className="a105-col">
          <p className="t-spec a105-spec" data-a105-text="">
            {A105.spec}
          </p>
          <ul className="a105-beats" data-a105-text="">
            {A105.beats.map((b) => (
              <li key={b} className="t-beat">
                {b}
              </li>
            ))}
          </ul>
          <div className="a105-detail" data-a105-text="">
            <DetailBubble n={5} sheet="A-105" label={A105.detail.open} onOpenChange={onDetail} panelClassName="a105-detail-panel">
              <ViewTitle id="a105-detail">
                <LoopVideo id="det-n04" autoPlay={false} />
              </ViewTitle>
            </DetailBubble>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
