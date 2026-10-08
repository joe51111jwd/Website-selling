// Usage: <SectionCut length={220} letter="A" look="down" /> draws the A–A section-cut symbol (A-105 wraps it in its role="slider").
// Owner: A3. Brief 5.5: "section cut A◀━▶A: the A-105 slider". A chalk-blue chain line (the cutting
// plane) with a lettered bubble at each end and a filled triangle on each bubble pointing the way
// the section looks (`look`), or, with arrows="along", pointing outward along the line (A◀━▶A).
// Presentational: aria-hidden unless `title`. Rotate it with a CSS transform on a wrapper.

import type { CSSProperties } from 'react';
import { pointerPath } from './geometry';
import './marks.css';

export interface SectionCutProps {
  /** Overall length in px, bubble to bubble (default 200) */
  length?: number;
  /** Section letter (default 'A') */
  letter?: string;
  /** Viewing direction of the section, perpendicular to the cut (default 'down') */
  look?: 'up' | 'down';
  /** 'view' (standard: triangles show the viewing direction) or 'along' (◀ ▶ outward, A◀━▶A) */
  arrows?: 'view' | 'along';
  /** Bubble diameter, px (default 22) */
  bubble?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function SectionCut({ length = 200, letter = 'A', look = 'down', arrows = 'along', bubble = 22, title, className, style }: SectionCutProps) {
  const r = bubble / 2;
  const reach = r * 1.7;
  const pad = Math.ceil(reach - r) + 3;
  const w = length + 2 * pad;
  const h = 2 * (reach + 3);
  const cy = h / 2;
  const x0 = pad + r;
  const x1 = pad + length - r;
  const lookDeg = look === 'down' ? 180 : 0;
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      className={`mk mk-sc ${className ?? ''}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      focusable="false"
      style={style}
      {...a11y}
    >
      {/* the cutting plane: heavy chain line between the bubbles */}
      <line className="mk-cut" x1={x0 + r} y1={cy} x2={x1 - r} y2={cy} strokeDasharray="18 4 3 4" />
      {[x0, x1].map((x, i) => {
        const deg = arrows === 'along' ? (i === 0 ? 270 : 90) : lookDeg;
        return (
          <g key={i}>
            <path className="mk-fill" d={pointerPath(x, cy, r, reach, deg)} />
            <circle className="mk-paper" cx={x} cy={cy} r={r} />
            <circle className="mk-line" cx={x} cy={cy} r={r} />
            <text className="mk-id" x={x} y={cy + 4} textAnchor="middle" style={{ fontSize: 11 }}>
              {letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default SectionCut;
