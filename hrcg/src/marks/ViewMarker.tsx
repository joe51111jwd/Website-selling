// Usage: <ViewMarker view="01-A" sheet="A-101" target="a101-persp" focusId="a101-persp-title" label="go to perspective, …" angle={180} /> goes to its view.
// Owner: A3. Brief 5.5: "view marker (a circle split by a rule, 01-A over A-101, with a filled triangle): goes to its view".
// Accessible name (F-035, WCAG 2.5.3): "01-A A-101: <label>", so it starts with the visible text.
// A real <a href="#target"> (works with no JS). With JS it scrolls (Lenis, native under reduced
// motion) and then focuses the view's title (brief 3.13), without announcing.

import type { CSSProperties, MouseEvent } from 'react';
import { lenisScrollTo } from '../system/lenis';
import { pointerPath } from './geometry';
import './marks.css';

export interface ViewMarkerProps {
  /** View id printed in the top half, e.g. '01-A' */
  view: string;
  /** Sheet printed in the bottom half, e.g. 'A-101' */
  sheet: string;
  /** Element id to scroll to (the view, or a stage anchor that lands on its hold) */
  target: string;
  /** Element id focused on landing (the view title); defaults to `target` */
  focusId?: string;
  /** Plain-language purpose (brief copy); the name is "view sheet: label" */
  label: string;
  /** Direction of the filled triangle, degrees clockwise from up (180 = looking down the sheet) */
  angle?: number;
  /** Circle diameter in px (default 44) */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function ViewMarker({ view, sheet, target, focusId, label, angle = 180, size = 44, className, style }: ViewMarkerProps) {
  const r = size / 2;
  const reach = r * 1.62; // triangle apex distance from the centre
  const box = Math.ceil(reach + 3) * 2;
  const c = box / 2;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(target);
    if (!el || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    lenisScrollTo(el, {
      focus: false,
      onComplete: () => {
        const f = document.getElementById(focusId ?? target);
        if (!f) return;
        if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
        f.focus({ preventScroll: true });
      },
    });
  };

  return (
    <a
      className={`mk-hit mk-vm ${className ?? ''}`}
      href={`#${target}`}
      aria-label={`${view} ${sheet}: ${label}`}
      onClick={onClick}
      style={{ width: box, height: box, ...style }}
    >
      <svg className="mk" viewBox={`0 0 ${box} ${box}`} width={box} height={box} aria-hidden="true" focusable="false">
        <path className="mk-pointer" d={pointerPath(c, c, r, reach, angle)} />
        <circle className="mk-face" cx={c} cy={c} r={r} />
        <circle className="mk-line mk-ink" cx={c} cy={c} r={r} />
        <line className="mk-line mk-ink" x1={c - r} y1={c} x2={c + r} y2={c} />
        <text className="mk-id" x={c} y={c - 5} textAnchor="middle">
          {view}
        </text>{' '}
        <text className="mk-id" x={c} y={c + 13} textAnchor="middle">
          {sheet}
        </text>
        <circle className="mk-ring" cx={c} cy={c} r={r + 4} />
      </svg>
    </a>
  );
}

export default ViewMarker;
