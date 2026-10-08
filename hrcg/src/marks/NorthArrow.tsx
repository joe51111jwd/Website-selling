// Usage: <NorthArrow angle={29} length={120} label="THE 1811 GRID" drawn /> points north at a bearing (A-200 only: TRUE NORTH and THE 1811 GRID).
// Owner: A3. Brief 5.5 / 3.9. A drafting north arrow: a 1.5 px chalk shaft from the base and a half
// arrowhead (one side filled) at the tip, with an upright label beyond the tip. Draws on (DRAW).
// Every part carries a 6 px slab-black halo (an underlay under the shaft, paint-order: stroke on the
// head, the base dot and the label), so it reads over a street grid instead of merging with it (F-079).
// The base sits at the SVG's centre so two arrows can share one origin (stack them absolutely).

import type { CSSProperties } from 'react';
import { bearing, r2 } from './geometry';
import './marks.css';

export interface NorthArrowProps {
  /** Bearing in degrees clockwise from up (0 = TRUE NORTH) */
  angle?: number;
  /** Shaft length in px (default 120) */
  length?: number;
  /** Label beyond the tip, e.g. 'TRUE NORTH' */
  label?: string;
  /** Drawn state (default true); draws on when it flips */
  drawn?: boolean;
  delay?: number;
  /** Draw duration, ms (default 700) */
  duration?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function NorthArrow({ angle = 0, length = 120, label, drawn = true, delay = 0, duration = 700, title, className, style }: NorthArrowProps) {
  const pad = 70; // room for the label around the tip
  const size = 2 * (length + pad);
  const c = size / 2;
  const tip = bearing(c, c, length, angle);
  const head = 14;
  const back = bearing(c, c, length - head, angle);
  const side = bearing(back[0], back[1], 5, angle + 90);
  const lab = bearing(c, c, length + 16, angle);
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      className={`mk mk-na ${className ?? ''}`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      focusable="false"
      data-drawn={drawn || undefined}
      style={{ ...style, ['--draw-delay' as string]: `${delay}ms`, ['--draw-ms' as string]: `${duration}ms` } as CSSProperties}
      {...a11y}
    >
      <path className="mk-na-halo" d={`M${c} ${c}L${r2(tip[0])} ${r2(tip[1])}`} pathLength={1} data-draw="" />
      <path className="mk-line mk-na-shaft" d={`M${c} ${c}L${r2(tip[0])} ${r2(tip[1])}`} pathLength={1} data-draw="" />
      <path
        className="mk-fill"
        d={`M${r2(tip[0])} ${r2(tip[1])}L${r2(side[0])} ${r2(side[1])}L${r2(back[0])} ${r2(back[1])}Z`}
        data-ink=""
      />
      <circle className="mk-fill" cx={c} cy={c} r={2} data-ink="" />
      {label ? (
        <text
          className="mk-label"
          x={r2(lab[0])}
          y={r2(lab[1])}
          textAnchor={Math.abs(Math.sin((angle * Math.PI) / 180)) < 0.3 ? 'middle' : Math.sin((angle * Math.PI) / 180) > 0 ? 'start' : 'end'}
          dominantBaseline={Math.cos((angle * Math.PI) / 180) > 0.3 ? 'auto' : 'hanging'}
          data-ink=""
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}

export default NorthArrow;
