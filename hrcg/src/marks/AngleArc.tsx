// Usage: <AngleArc from={0} to={29} radius={90} label="ABOUT 29°" drawn /> dimensions the angle between two bearings (A-200 only).
// Owner: A3. Brief 5.5 / 3.9: "the angle arc ... draws to ABOUT 29°". A drafting angular dimension:
// a 1.25 px arc with a small filled arrowhead at each end, the value set beyond the arc's middle.
// Centre at the SVG's centre, so it registers with <NorthArrow> stacked on the same origin.

import type { CSSProperties } from 'react';
import { arcPath, bearing, r2 } from './geometry';
import './marks.css';

export interface AngleArcProps {
  /** Start bearing, degrees clockwise from up */
  from?: number;
  /** End bearing */
  to: number;
  /** Arc radius, px */
  radius?: number;
  /** Value label, e.g. 'ABOUT 29°' */
  label?: string;
  /** SVG half-size; match NorthArrow's (length + 70) to share an origin */
  extent?: number;
  drawn?: boolean;
  delay?: number;
  duration?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

function arrowHead(cx: number, cy: number, radius: number, deg: number, dir: 1 | -1): string {
  // small filled head lying along the arc's tangent, pointing toward the end bearing
  const tip = bearing(cx, cy, radius, deg);
  const backDeg = deg - dir * (8 / radius) * (180 / Math.PI);
  const n1 = bearing(cx, cy, radius + 3, backDeg);
  const n2 = bearing(cx, cy, radius - 3, backDeg);
  return `M${r2(tip[0])} ${r2(tip[1])}L${r2(n1[0])} ${r2(n1[1])}L${r2(n2[0])} ${r2(n2[1])}Z`;
}

export function AngleArc({ from = 0, to, radius = 90, label, extent, drawn = true, delay = 0, duration = 700, title, className, style }: AngleArcProps) {
  const half = extent ?? radius + 70;
  const size = half * 2;
  const c = half;
  const mid = (from + to) / 2;
  const lab = bearing(c, c, radius + 14, mid);
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      className={`mk mk-aa ${className ?? ''}`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      focusable="false"
      data-drawn={drawn || undefined}
      style={{ ...style, ['--draw-delay' as string]: `${delay}ms`, ['--draw-ms' as string]: `${duration}ms` } as CSSProperties}
      {...a11y}
    >
      <path className="mk-line" d={arcPath(c, c, radius, from, to)} pathLength={1} data-draw="" />
      <path className="mk-fill" d={arrowHead(c, c, radius, from, -1)} data-ink="" />
      <path className="mk-fill" d={arrowHead(c, c, radius, to, 1)} data-ink="" />
      {label ? (
        <text className="mk-label" x={r2(lab[0])} y={r2(lab[1])} textAnchor="start" dominantBaseline="auto" data-ink="">
          {label}
        </text>
      ) : null}
    </svg>
  );
}

export default AngleArc;
