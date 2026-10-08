// Usage: <HoldCloud width={320} height={72} tag="HOLD">VENUE: HOLD — Venue to be announced on this site.</HoldCloud> marks a status that is on hold.
// Owner: A3. Brief 5.5: "HOLD cloud (scalloped path plus tag): the status of date and venue".
// A revision-style cloud in marking orange around its content, with an orange tag cell (slab-black
// text on the orange fill, legal on paper too). `lift` 0..1 drives the one allowed shadow (2 -> 6 px).
// cloudPath()/rectCubicPath() in ./geometry share one vertex set (same cubic count) for morphs (A-200).

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { cloudPath } from './geometry';
import './marks.css';

export interface HoldCloudProps {
  width: number;
  height: number;
  /** Tag text (default 'HOLD'); null hides the tag */
  tag?: string | null;
  /** Number of scallops (cubic segments), default: about one per 26 px of perimeter */
  segments?: number;
  /** 0..1: lift shadow 2 -> 6 px (brief 3.9). Default 0. */
  lift?: number;
  /** No shadow at all (e.g. inside the strip) */
  flat?: boolean;
  seed?: number;
  /** Accessible name when the cloud carries no readable content of its own */
  title?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function HoldCloud({ width, height, tag = 'HOLD', segments, lift = 0, flat = false, seed = 11, title, children, className, style }: HoldCloudProps) {
  const n = segments ?? Math.max(8, Math.round((2 * (width + height)) / 26));
  const d = useMemo(() => cloudPath(width, height, n, { seed }), [width, height, n, seed]);
  const st = { width, height, ...style, ['--lift' as string]: `${2 + 4 * Math.max(0, Math.min(1, lift))}px` } as CSSProperties;
  const a11y = title ? { role: 'img', 'aria-label': title } : {};
  return (
    <span className={`mk-hold ${className ?? ''}`} style={st} data-flat={flat || undefined} {...a11y}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="mk">
        <path className="mk-line" d={d} style={{ color: 'var(--marking-orange)' }} />
      </svg>
      {tag ? (
        <span className="mk-hold-tag" aria-hidden={title ? true : undefined}>
          {tag}
        </span>
      ) : null}
      {children ? <span className="mk-hold-body">{children}</span> : null}
    </span>
  );
}

export default HoldCloud;
