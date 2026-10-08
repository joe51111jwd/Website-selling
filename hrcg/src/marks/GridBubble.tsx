// Usage: <GridBubble n="03" drawn leader={14} /> labels gridline 03 (pass href + label to make it a link to its sheet).
// Owner: A3. Brief 5.5: "gridline bubble (28 px circle with a stencil numeral): navigation on A-100".
// Draw-on (DRAW, 400 ms) when `drawn` turns true; stagger with `delay` (120 ms steps). The circle
// starts at its foot, where the gridline leaves it, and the leader follows.

import type { CSSProperties, MouseEvent } from 'react';
import { lenisScrollTo } from '../system/lenis';
import './marks.css';

export interface GridBubbleProps {
  /** Numeral, e.g. '01' */
  n: string;
  /** Circle diameter in px (default 28) */
  size?: number;
  /** Gridline leader below the bubble, px (0 = none). Dashed, like a grid line. */
  leader?: number;
  /** Drawn state (default true). false -> hidden until it flips, then draws on. */
  drawn?: boolean;
  /** Draw delay in ms (stagger) */
  delay?: number;
  /** Make it a link (>= 44 px target) */
  href?: string;
  /** Accessible name; required with href, otherwise makes the symbol role="img" */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function GridBubble({ n, size = 28, leader = 0, drawn = true, delay = 0, href, label, className, style }: GridBubbleProps) {
  const r = size / 2;
  const w = size + 4;
  const h = size + 4 + leader;
  const c = w / 2;
  const cy = r + 2;
  // circle as a path that starts at the foot and runs clockwise (so the draw-on reads like a pen)
  const circle = `M${c} ${cy + r}A${r} ${r} 0 1 1 ${c} ${cy - r}A${r} ${r} 0 1 1 ${c} ${cy + r}`;
  const svg = (
    <svg
      className="mk mk-gb"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      focusable="false"
      data-drawn={drawn || undefined}
      style={{ ['--draw-delay' as string]: `${delay}ms` } as CSSProperties}
      {...(href || !label ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': label })}
    >
      {href ? <circle className="mk-face" cx={c} cy={cy} r={r} /> : null}
      <path className="mk-line mk-ink" d={circle} pathLength={1} data-draw="" />
      {leader > 0 ? (
        <line
          className="mk-line"
          x1={c}
          y1={cy + r}
          x2={c}
          y2={h}
          strokeDasharray="6 3 1.5 3"
          opacity={0.7}
          data-ink=""
        />
      ) : null}
      <text className="mk-stencil mk-ink mk-id-fill" x={c} y={cy + 5} textAnchor="middle" data-ink="">
        {n}
      </text>
      {href ? <circle className="mk-ring" cx={c} cy={cy} r={r + 4} /> : null}
    </svg>
  );

  if (!href) {
    return (
      <span className={`mk-gbw ${className ?? ''}`} style={style}>
        {svg}
      </span>
    );
  }
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith('#') || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    e.preventDefault();
    lenisScrollTo(el);
  };
  return (
    <a className={`mk-hit mk-gbw ${className ?? ''}`} href={href} aria-label={label} onClick={onClick} style={style}>
      {svg}
    </a>
  );
}

export default GridBubble;
