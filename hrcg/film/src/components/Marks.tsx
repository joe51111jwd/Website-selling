// Drafting symbols used by the film: gridline bubble, COURSE mark, HOLD cloud. 1.25–1.5 px strokes.
import React from 'react';
import { C, stencil } from '../theme';
import { DRAW, prog } from '../lib/ease';

/** Gridline bubble: a circle with a stencil numeral; the circle draws on (DRAW), the numeral prints in. */
export const Bubble: React.FC<{
  cx: number;
  cy: number;
  r: number;
  n: string;
  t: number;
  at: number;
  dur?: number;
  numeral: number;
  stem?: number; // length of the gridline stub below the bubble
}> = ({ cx, cy, r, n, t, at, dur = 0.4, numeral, stem = 0 }) => {
  const k = DRAW(prog(t, at, at + dur));
  const circ = 2 * Math.PI * r;
  const ink = prog(t, at + dur * 0.6, at + dur * 0.6 + 0.2);
  return (
    <>
      <svg style={{ position: 'absolute', left: cx - r - 4, top: cy - r - 4, overflow: 'visible' }} width={r * 2 + 8} height={r * 2 + 8 + stem}>
        <circle
          cx={r + 4}
          cy={r + 4}
          r={r}
          fill="none"
          stroke={C.chalk}
          strokeWidth={1.5}
          strokeDasharray={`${circ * k} ${circ}`}
          transform={`rotate(-90 ${r + 4} ${r + 4})`}
        />
        {stem > 0 ? (
          <line x1={r + 4} y1={r * 2 + 4} x2={r + 4} y2={r * 2 + 4 + stem * k} stroke={C.pencil} strokeWidth={1.25} />
        ) : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ink,
          ...stencil(numeral, C.chalk),
        }}
      >
        <span style={{ position: 'relative', top: numeral * 0.04 }}>{n}</span>
      </div>
    </>
  );
};

/**
 * COURSE mark: five bricks in ONE course (2u × 1u, head joints 0.125u, overall 10.5u × 1u), 01→05
 * left to right. `laid` is how many bricks are down (fractional = the next one printing in);
 * `current` is the 0-based brick filled marking orange (or -1).
 */
export const CourseMark: React.FC<{
  x: number;
  y: number;
  u: number;
  laid?: number;
  current?: number;
  color?: string;
}> = ({ x, y, u, laid = 5, current = -1, color = C.chalk }) => (
  <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={10.5 * u} height={u}>
    {[0, 1, 2, 3, 4].map((i) => {
      const k = Math.max(0, Math.min(1, laid - i));
      if (k <= 0) return null;
      return (
        <rect
          key={i}
          x={i * 2.125 * u}
          y={(1 - k) * -0.18 * u}
          width={2 * u}
          height={u}
          fill={i === current ? C.orange : color}
          opacity={k}
        />
      );
    })}
  </svg>
);

/**
 * A closed path of 24 cubic segments around a rectangle, interpolated between the straight
 * rectangle (k = 0) and a scalloped revision cloud (k = 1). Same command structure at every k,
 * so the outline morphs into the HOLD cloud (brief §4.4).
 */
export const cloudPath = (x: number, y: number, w: number, h: number, k: number, bulge: number) => {
  // distribute 24 segments around the perimeter in proportion to side lengths (min 2 per short side)
  const per = 2 * (w + h);
  let nTop = Math.max(2, Math.round((24 * w) / per));
  let nSide = Math.max(2, Math.round((24 - 2 * nTop) / 2));
  nTop = (24 - 2 * nSide) / 2;
  if (!Number.isInteger(nTop)) {
    nSide = 2;
    nTop = 10;
  }
  const pts: [number, number][] = [];
  const sides: [[number, number], [number, number], number, [number, number]][] = [
    [[x, y], [x + w, y], nTop, [0, -1]],
    [[x + w, y], [x + w, y + h], nSide, [1, 0]],
    [[x + w, y + h], [x, y + h], nTop, [0, 1]],
    [[x, y + h], [x, y], nSide, [-1, 0]],
  ];
  let d = '';
  for (const [a, b, n, nrm] of sides) {
    for (let i = 0; i < n; i++) {
      const p0: [number, number] = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n];
      const p1: [number, number] = [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n];
      if (!d) d = `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}`;
      pts.push(p0);
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const out = bulge > 0 ? Math.min(bulge, len * 0.62) * k : 0;
      const c1: [number, number] = [p0[0] + (p1[0] - p0[0]) * 0.18 + nrm[0] * out, p0[1] + (p1[1] - p0[1]) * 0.18 + nrm[1] * out];
      const c2: [number, number] = [p0[0] + (p1[0] - p0[0]) * 0.82 + nrm[0] * out, p0[1] + (p1[1] - p0[1]) * 0.82 + nrm[1] * out];
      d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
    }
  }
  return d + ' Z';
};
