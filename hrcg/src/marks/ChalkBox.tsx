// Usage: <ChalkBox size={20} side="left" /> draws the chalk-line reel where a string is anchored (the hero's anchor and, wrapped in a 44 px handle, its phone grip).
// Owner: A3. Brief 5.5: "chalk box: the hero's string anchor and phone handle" (2.1: [▣] at the line's
// right end). A square case (square corners), the reel inside, and the line's exit notch on `side`.
// Presentational: aria-hidden unless `title`. A2 wraps it in the interactive handle.

import type { CSSProperties } from 'react';
import './marks.css';

export interface ChalkBoxProps {
  /** Rendered size in px (default 20) */
  size?: number;
  /** Side the chalk line leaves from (default 'left') */
  side?: 'left' | 'right';
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function ChalkBox({ size = 20, side = 'left', title, className, style }: ChalkBoxProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const flip = side === 'right' ? 'translate(24 0) scale(-1 1)' : undefined;
  return (
    <svg className={`mk mk-cb ${className ?? ''}`} viewBox="0 0 24 24" width={size} height={size} focusable="false" style={style} {...a11y}>
      <g transform={flip}>
        {/* case, with the exit notch on the left edge at the line's height */}
        <path className="mk-reel" d="M3.5 3.5H20.5V20.5H3.5V13.4M3.5 10.6V3.5" />
        {/* reel and axle */}
        <circle className="mk-reel" cx="13" cy="12" r="5" />
        <circle className="mk-fill" cx="13" cy="12" r="1.4" />
        {/* the line paying out off the reel, through the notch */}
        <path className="mk-reel" d="M8 12H0" />
        {/* crank */}
        <path className="mk-reel" d="M20.5 16.5H23" />
      </g>
    </svg>
  );
}

export default ChalkBox;
