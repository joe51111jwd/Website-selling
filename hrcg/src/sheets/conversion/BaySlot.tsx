// The empty bay (N02) with its live stencil slot (brief 3.10, 4.4: the A-300 set piece). Owner: A6.
//
// <BayPlate platform ready crop? /> renders the concept still (manifest `bay-empty`) with an SVG
// overlay in the still's own frame (0..1000), so the paint sits on the floor at every size:
//   - the stencil slot: `platform || 'YOUR ROBOT'`, upper-case, max 24 characters, fitted to the slot
//     width with measureText, Big Shoulders Stencil 800, chalk at 85% with a paint mask;
//   - the bay number slot "—" (we never assign numbers);
//   - READY FOR 01–05: the ticked challenges are painted, the others stay as pencil outlines.
// `crop` [x0, y0, x1, y1] (0..1) shows a detail of the same still (the sticky RFI column).
//
// <MiniSlot/> is the phone's 64 px sticky strip: the slot and the READY FOR line, no photo.

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Picture } from '../../system/Picture';
import { CHALLENGES } from '../../content/challenges';
import { TEAMS } from '../../content/copy/conversion';
import { slotText, useFitSize } from './fitText';

/** Slot geometry in the still's frame (0..1000), on the open floor under the plan's interior wall. */
export const SLOT = { x: 296, y: 566, w: 468, h: 118 } as const;
const SLOT_PAD = 26;
const READY_Y = 748;
const BAY_NO = { x: 206, y: 318 } as const;

export type Crop = readonly [number, number, number, number];
export const FULL: Crop = [0, 0, 1, 1];

function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** The paint mask: speckle the fill, then roughen the edges a hair (deterministic seeds). */
export function PaintFilter({ id, rough = 1 }: { id: string; rough?: number }) {
  return (
    <filter id={id} x="-4%" y="-30%" width="108%" height="160%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves={2} seed={7} result="grain" />
      <feColorMatrix
        in="grain"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 3.9"
        result="speckle"
      />
      <feComposite in="SourceGraphic" in2="speckle" operator="in" result="painted" />
      <feTurbulence type="turbulence" baseFrequency="0.09" numOctaves={1} seed={3} result="warp" />
      <feDisplacementMap in="painted" in2="warp" scale={2.2 * rough} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

export interface BayPlateProps {
  platform: string;
  ready: ReadonlySet<number>;
  crop?: Crop;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export function BayPlate({ platform, ready, crop = FULL, className, sizes, loading = 'lazy' }: BayPlateProps) {
  const paint = useSvgId('bay-paint');
  const text = slotText(platform, TEAMS.slotDefault);
  const isDefault = !platform.trim();
  const fs = useFitSize(text, SLOT.w - SLOT_PAD * 2, SLOT.h * 0.74);
  const [x0, y0, x1, y1] = crop;
  const cw = x1 - x0;
  const ch = y1 - y0;
  const frame: CSSProperties = { aspectRatio: `${cw} / ${ch}` };
  const canvas: CSSProperties = {
    width: `${100 / cw}%`,
    left: `${(-x0 / cw) * 100}%`,
    top: `${(-y0 / ch) * 100}%`,
  };
  const cy = SLOT.y + SLOT.h / 2;

  return (
    <div className={`bay-plate ${className ?? ''}`} style={frame} data-slot-default={isDefault ? '' : undefined}>
      <div className="bay-canvas" style={canvas}>
        <Picture id="bay-empty" className="bay-picture" sizes={sizes} loading={loading} />
        <svg className="bay-paint" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
          <defs>
            <PaintFilter id={paint} />
          </defs>
          {/* the slot: a chalk line on the floor (lines are blue) */}
          <rect
            className="bay-slot-rule"
            x={SLOT.x}
            y={SLOT.y}
            width={SLOT.w}
            height={SLOT.h}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <g filter={`url(#${paint})`}>
            <text
              className="bay-slot-text"
              data-bay-slot=""
              x={SLOT.x + SLOT.w / 2}
              y={cy + fs * 0.355}
              fontSize={fs}
              textAnchor="middle"
            >
              {text}
            </text>
          </g>
          <text className="bay-number" x={BAY_NO.x} y={BAY_NO.y} fontSize={190} textAnchor="start">
            {TEAMS.bayNumber}
          </text>
          <ReadyFor ready={ready} x={SLOT.x} y={READY_Y} size={30} />
        </svg>
      </div>
    </div>
  );
}

/** READY FOR 01 02 03 04 05: painted when ticked, pencil outline otherwise (stable layout). */
function ReadyFor({
  ready,
  x,
  y,
  size,
}: {
  ready: ReadonlySet<number>;
  x: number;
  y: number;
  size: number;
}) {
  const labelW = size * 4.2;
  const step = size * 1.42;
  return (
    <g className="bay-ready" fontSize={size}>
      <text className="bay-ready-label" x={x} y={y}>
        {TEAMS.readyFor}
      </text>
      {CHALLENGES.map((c, i) => {
        const on = ready.has(c.no);
        return (
          <text
            key={c.no}
            className={`bay-ready-no${on ? ' is-on' : ''}`}
            x={x + labelW + i * step}
            y={y}
          >
            {c.num}
          </text>
        );
      })}
    </g>
  );
}

/** Phone mini-slot (<768 px): 64 px, sticky above the RFI fields (brief 3.10 part 2). */
export function MiniSlot({ platform, ready }: { platform: string; ready: ReadonlySet<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(358);
  const paint = useSvgId('mini-paint');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const width = Math.round(e?.contentRect.width ?? 0);
      if (width > 0) setW(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const text = slotText(platform, TEAMS.slotDefault);
  const H = 64;
  const pad = 14;
  const fs = useFitSize(text, w - pad * 2, 34);
  return (
    <div ref={ref} className="mini-slot" aria-hidden="true">
      <svg className="mini-slot-svg" viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="xMinYMid meet" focusable="false">
        <defs>
          <PaintFilter id={paint} rough={0.5} />
        </defs>
        <g filter={`url(#${paint})`}>
          <text className="bay-slot-text" x={pad} y={8 + fs * 0.74} fontSize={fs}>
            {text}
          </text>
        </g>
        <ReadyFor ready={ready} x={pad} y={H - 9} size={12} />
      </svg>
    </div>
  );
}
