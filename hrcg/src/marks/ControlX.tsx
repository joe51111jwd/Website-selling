// Usage: <ControlX size={18} /> marks a line end (a sprayed ✕ control point, marking orange); `stamp` + `stamped` animate it in.
// Owner: A3. Brief 5.5: "spray control point ✕ ... with an overspray edge: marks line ends".
// Paint, not ink: the two strokes are heavier than the 1.25 px drafting line, and the overspray is a
// deterministic speckle (never a blur or glow). Decorative unless `title` is given.

import { useMemo, type CSSProperties } from 'react';
import { prng, r2 } from './geometry';
import './marks.css';

export interface ControlXProps {
  /** Rendered size in px (default 18). */
  size?: number;
  /** Accessible name; without it the mark is aria-hidden. */
  title?: string;
  /** Seed for the overspray speckle (each ✕ on a sheet should differ a little). */
  seed?: number;
  /** Opt into the stamp-in animation: hidden until `stamped` is true (always shown under .no-js / .rm). */
  stamp?: boolean;
  stamped?: boolean;
  /** Delay before stamping, ms (stagger pairs of ✕ by 120 ms). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

const VB = 24;
/** paint scales with the mark (inline style beats marks.css' non-scaling default) */
const NOSCALE: CSSProperties = { vectorEffect: 'none' };

export function ControlX({ size = 18, title, seed = 7, stamp = false, stamped = true, delay = 0, className, style }: ControlXProps) {
  const speckle = useMemo(() => {
    const rnd = prng(seed);
    const dots: Array<[number, number, number, number]> = [];
    // overspray: fine dots biased toward the stroke edges and the ends of each bar
    for (let i = 0; i < 34; i++) {
      const bar = i % 2;
      const t = 0.06 + rnd() * 0.88;
      const off = (rnd() - 0.5) * 2 * (2.1 + rnd() * 2.2);
      const along = 4.2 + t * 15.6;
      const x = bar ? along + off * 0.707 : along + off * 0.707;
      const y = bar ? VB - along + off * 0.707 : along - off * 0.707;
      const r = 0.22 + rnd() * 0.42;
      const o = 0.25 + rnd() * 0.55;
      dots.push([r2(x), r2(y), r2(r), r2(o)]);
    }
    return dots;
  }, [seed]);

  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  const st = { ...style, ['--stamp-delay' as string]: `${delay}ms` } as CSSProperties;
  return (
    <svg
      className={`mk mk-x ${className ?? ''}`}
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      focusable="false"
      data-stamp={stamp ? (stamped ? 'in' : 'out') : undefined}
      style={st}
      {...a11y}
    >
      <g className="mk-fill" opacity="0.9">
        {speckle.map(([x, y, r, o], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </g>
      {/* soft paint shoulder: a wider, faint pass under the core stroke */}
      <path d="M5 5L19 19M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="4.2" opacity="0.22" style={NOSCALE} />
      <path d="M5.2 5.2L18.8 18.8M18.8 5.2L5.2 18.8" fill="none" stroke="currentColor" strokeWidth="2.5" style={NOSCALE} />
    </svg>
  );
}

export default ControlX;
