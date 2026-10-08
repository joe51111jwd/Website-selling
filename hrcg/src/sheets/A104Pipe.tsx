// A-104 · PIPE ASSEMBLY (brief 3.7). Owner: A4.
//
// The site's only oblique, three-dimensional page. PLAN 04 (b43) lies on a static plane at true
// isometric (rotateX 54.7356°, rotateZ −45°), 24 px over its own floor shadow, with the task drawing
// traced from the footage sitting in registration on it. The copy runs along an iso pipe route that
// leaves the traced drawing: one beat at each fitting (TO THE DRAWING · CORRECT GEOMETRY · SECURE
// JOINTS). PERSPECTIVE 04-A (c33, bottom-anchored 2.39:1 crop) plays in place as a framed strip below.
// Motion: none of its own. The route, its beats and the trace print in (opacity) when the sheet arrives.
//
// One projection serves CSS and SVG: CSS 3D without `perspective` is orthographic, so a point (u, v)
// of the plane (0..1, the registered plan frame) at height z lands on screen at
//   centre + s·((u − ½)·(1/√2, −1/√6) + (v − ½)·(1/√2, 1/√6)) + z·(0, −√⅔)
// which is exactly what rotateX(54.7356°) rotateZ(−45°) translateZ(z) does to the plane's own pixels.

import { useCallback, useRef, type CSSProperties } from 'react';
import { usePrinted } from './a4/util';
import { ViewTitle } from '../chrome/ViewTitle';
import { SheetTag } from '../chrome/SheetTag';
import { LoopVideo } from '../system/LoopVideo';
import { videoManager, type VideoState } from '../system/VideoManager';
import { MEDIA_STATES } from '../content/copy/chrome';
import { media } from '../media/manifest';
import { A104 } from '../content/copy/a104-a200';
import './a4/a4.css';

const R2 = Math.SQRT1_2;
const R6 = 1 / Math.sqrt(6);
const RZ = Math.sqrt(2 / 3);

type P3 = readonly [number, number, number];

interface Geometry {
  /** stage units (the SVG viewBox); the stage keeps this aspect ratio */
  w: number;
  h: number;
  /** plane centre and side, stage units */
  cx: number;
  cy: number;
  s: number;
  /** lift of the plane over its shadow, stage units (24 px at the design width) */
  lift: number;
  /** pipe route: (u, v) in plane units, z in stage units */
  route: readonly P3[];
  /** tee branch from the last fitting */
  branch: readonly P3[];
  /** route corners drawn as plain bends in the pipe (no fitting, no beat) */
  bends?: readonly number[];
  /** indexes into route of the three fittings, and where each beat sits relative to it */
  fittings: readonly { at: number; dx: number; dy: number; align: 'left' | 'right' }[];
}

// Desktop: plane top-left, H2 under it, the route out to the right.
const DESK: Geometry = {
  w: 1296,
  h: 900,
  cx: 395,
  cy: 270,
  s: 500,
  lift: 24,
  // down the plane's lower-right edge, a drop, a long run down and right, then up and away to the page
  // edge: each fitting sits lower than the last, so the beats read in route order from the top
  route: [
    [0.74, 0.84, 24],
    [0.74, 1.32, 24],
    [0.74, 1.32, -130],
    [0.74, 1.95, -130],
    [1.62, 1.95, -130],
  ],
  branch: [
    [0.74, 1.95, -130],
    [0.74, 1.95, -214],
  ],
  fittings: [
    { at: 1, dx: 20, dy: -6, align: 'left' },
    { at: 2, dx: 20, dy: -22, align: 'left' },
    { at: 3, dx: 22, dy: 22, align: 'left' },
  ],
};

// Phone: plane full width on top; the route drops from the drawing, jogs back across the column and
// drops again, so every beat has the whole width to its right.
const PHONE: Geometry = {
  w: 358,
  h: 690,
  cx: 179,
  cy: 150,
  s: 240,
  lift: 12,
  route: [
    [0.74, 0.84, 12],
    [0.74, 1.24, 12],
    [0.74, 1.24, -175],
    [0.3, 1.24, -175],
    [0.3, 1.24, -330],
    [0.05, 1.24, -330],
  ],
  branch: [
    [0.3, 1.24, -330],
    [0.3, 1.24, -430],
  ],
  // the first corner is a plain bend in the copper (no fitting): the beats start below the captions
  bends: [1],
  fittings: [
    { at: 2, dx: -18, dy: 0, align: 'right' },
    { at: 3, dx: -18, dy: 4, align: 'right' },
    { at: 4, dx: -18, dy: 0, align: 'right' },
  ],
};

function project(g: Geometry, [u, v, z]: P3): [number, number] {
  const x = g.cx + g.s * ((u - 0.5) * R2 + (v - 0.5) * R2);
  const y = g.cy + g.s * (-(u - 0.5) * R6 + (v - 0.5) * R6) - z * RZ;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

const poly = (g: Geometry, pts: readonly P3[]) =>
  pts
    .map((p, i) => {
      const [x, y] = project(g, p);
      return `${i ? 'L' : 'M'}${x} ${y}`;
    })
    .join('');

/** Plane outline (at the lift) and its footprint on the floor. */
function diamond(g: Geometry, z: number): string {
  return `${poly(g, [
    [0, 0, z],
    [1, 0, z],
    [1, 1, z],
    [0, 1, z],
  ])}Z`;
}

/** A short joint tick across the pipe at a fitting, perpendicular to the incoming run (screen space). */
function joints(g: Geometry): string {
  let d = '';
  const pts = g.route.map((p) => project(g, p));
  for (const f of g.fittings) {
    const here = pts[f.at]!;
    for (const nb of [pts[f.at - 1], pts[f.at + 1]]) {
      if (!nb) continue;
      const dx = nb[0] - here[0];
      const dy = nb[1] - here[1];
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const ax = here[0] + ux * 12;
      const ay = here[1] + uy * 12;
      const t = 5;
      d += `M${(ax - uy * t).toFixed(1)} ${(ay + ux * t).toFixed(1)}L${(ax + uy * t).toFixed(1)} ${(ay - ux * t).toFixed(1)}`;
    }
  }
  return d;
}

function pct(n: number, of: number) {
  return `${((n / of) * 100).toFixed(4)}%`;
}

/** CSS placement of the plane square for one geometry (custom properties, picked by media query). */
function planeVars(g: Geometry, tag: 'd' | 'm'): Record<string, string> {
  return {
    [`--pl-${tag}`]: pct(g.cx - g.s / 2, g.w),
    [`--pt-${tag}`]: pct(g.cy - g.s / 2, g.h),
    [`--pw-${tag}`]: pct(g.s, g.w),
    [`--lift-${tag}`]: `${((g.lift / g.w) * 100).toFixed(4)}cqw`,
    [`--s-${tag}`]: `${((g.s / g.w) * 100).toFixed(4)}cqw`,
    [`--ar-${tag}`]: `${g.w} / ${g.h}`,
  };
}

/** The route as a path; corners listed in g.bends are drawn as bends (radius r), the rest as fittings. */
function routePath(g: Geometry, r = 14): string {
  const pts = g.route.map((p) => project(g, p));
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    if (g.bends?.includes(i) && pts[i + 1]) {
      const a = pts[i - 1]!;
      const b = pts[i + 1]!;
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
      const lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
      const p1 = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r];
      const p2 = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
      d += `L${p1[0]!.toFixed(1)} ${p1[1]!.toFixed(1)}Q${p[0]} ${p[1]} ${p2[0]!.toFixed(1)} ${p2[1]!.toFixed(1)}`;
    } else d += `L${p[0]} ${p[1]}`;
  }
  return d;
}

function Route({ g, variant }: { g: Geometry; variant: 'desk' | 'phone' }) {
  const pts = g.route.map((p) => project(g, p));
  const start = pts[0]!;
  const end = pts[pts.length - 1]!;
  const branch = g.branch.length ? poly(g, g.branch) : '';
  const bEnd = g.branch.length ? project(g, g.branch[g.branch.length - 1]!) : null;
  return (
    <div className={`a104-route a104-route--${variant}`}>
      <svg className="a104-route-svg" viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true" focusable="false">
        <path className="a104-pipe" d={routePath(g)} />
        {branch ? <path className="a104-pipe" d={branch} /> : null}
        <path className="a104-joint" d={joints(g)} />
        {/* the route starts on the traced drawing: an open end */}
        <circle className="a104-end" cx={start[0]} cy={start[1]} r={4} />
        {bEnd ? <path className="a104-cap" d={`M${bEnd[0] - 6} ${bEnd[1]}H${bEnd[0] + 6}`} /> : null}
        {g.fittings.map((f) => {
          const [x, y] = pts[f.at]!;
          return <circle key={f.at} className="a104-fitting" cx={x} cy={y} r={4.5} />;
        })}
        <path className="a104-cap" d={`M${end[0] - 5} ${end[1] + 3}L${end[0] + 5} ${end[1] - 3}`} />
      </svg>
      <ol className="a104-beats">
        {g.fittings.map((f, i) => {
          const [x, y] = pts[f.at]!;
          const style = {
            ...(f.align === 'left' ? { left: pct(x + f.dx, g.w) } : { right: pct(g.w - x - f.dx, g.w) }),
            top: pct(y + f.dy, g.h),
            ['--d' as string]: `${120 * (i + 1)}ms`,
          } as CSSProperties;
          return (
            <li key={i} className={`a104-beat a104-beat--${f.align} t-beat print-in`} style={style}>
              {A104.beats[i]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function A104Pipe() {
  const rootRef = useRef<HTMLDivElement>(null);
  // PLAN 04's ▶ PLAY sits flat beside the plane (LoopVideo's own button would be laid at isometric)
  const onPlanState = useCallback((st: VideoState) => {
    rootRef.current?.setAttribute('data-plan', st);
  }, []);
  // the route, its beats, the trace and the copy print in when the sheet arrives (opacity only)
  usePrinted(rootRef, '0px 0px -25% 0px');

  const trace = media['trace-t43']?.sources?.[0]?.src;
  const stageVars = { ...planeVars(DESK, 'd'), ...planeVars(PHONE, 'm') } as CSSProperties;
  const traceStyle = trace
    ? ({ WebkitMaskImage: `url("${trace}")`, maskImage: `url("${trace}")` } as CSSProperties)
    : undefined;

  return (
    <div className="a104" ref={rootRef}>
      <div className="a104-head">
        <SheetTag id="A-104" />
      </div>

      <div className="a104-stage" style={stageVars}>
        {/* the floor: the plane's soft shadow and its dashed footprint, behind the plane */}
        <div className="a104-shadow" aria-hidden="true" />
        <svg className="a104-floor a104-floor--desk" viewBox={`0 0 ${DESK.w} ${DESK.h}`} aria-hidden="true" focusable="false">
          <path d={diamond(DESK, 0)} />
        </svg>
        <svg className="a104-floor a104-floor--phone" viewBox={`0 0 ${PHONE.w} ${PHONE.h}`} aria-hidden="true" focusable="false">
          <path d={diamond(PHONE, 0)} />
        </svg>

        {/* PLAN 04 on the iso plane, the traced task drawing in registration on it */}
        <ViewTitle id="a104-plan" className="a104-plan" frame={false} captionClassName="a104-plan-title">
          <div className="a104-plane">
            <LoopVideo id="plan-b43" className="a104-video" onState={onPlanState} />
            {traceStyle ? <div className="a104-trace print-in" style={traceStyle} aria-hidden="true" /> : null}
          </div>
        </ViewTitle>
        <ViewTitle id="a104-trace" captionClassName="a104-trace-title print-in" />
        <button
          type="button"
          className="cell-button a104-play js-only"
          aria-label={`${MEDIA_STATES.playLabelPrefix}${media['plan-b43']?.alt ?? ''}`}
          onClick={() => videoManager.userPlay('plan-b43')}
        >
          {MEDIA_STATES.play}
        </button>

        {/* the plane's hairline frame, drawn crisp in the overlay */}
        <svg className="a104-frame a104-frame--desk" viewBox={`0 0 ${DESK.w} ${DESK.h}`} aria-hidden="true" focusable="false">
          <path d={diamond(DESK, DESK.lift)} />
        </svg>
        <svg className="a104-frame a104-frame--phone" viewBox={`0 0 ${PHONE.w} ${PHONE.h}`} aria-hidden="true" focusable="false">
          <path d={diamond(PHONE, PHONE.lift)} />
        </svg>

        <Route g={DESK} variant="desk" />
        <Route g={PHONE} variant="phone" />

        <h2 className="t-h2-challenge a104-h2 print-in">{A104.h2}</h2>
      </div>

      <div className="a104-foot">
        <p className="t-spec a104-spec print-in" style={{ ['--d' as string]: '120ms' } as CSSProperties}>
          {A104.spec}
        </p>
        <ViewTitle id="a104-perspective" className="a104-persp">
          <LoopVideo id="el-c33" className="feather" />
        </ViewTitle>
      </div>
    </div>
  );
}
