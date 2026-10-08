// The chalk string, its cast shadow, the powdery deposit, the two orange ✕ control points and the chalk
// box. One SVG in comp pixels. Everything is derived from t through lib/string.ts.
import React from 'react';
import { C } from '../theme';
import { prog } from '../lib/ease';
import { smoothPath, stringAt, type StringGeom, type StringTiming } from '../lib/string';
import { DepositDefs, DepositLines } from './Deposit';

export const XMark: React.FC<{ x: number; y: number; size: number; opacity: number; id: string }> = ({
  x,
  y,
  size,
  opacity,
  id,
}) => (
  <g opacity={opacity} filter={`url(#spray-${id})`}>
    <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} stroke={C.orange} strokeWidth={size * 0.36} strokeLinecap="round" />
    <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} stroke={C.orange} strokeWidth={size * 0.36} strokeLinecap="round" />
  </g>
);

export const SprayDefs: React.FC<{ id: string }> = ({ id }) => (
  <filter id={`spray-${id}`} x="-60%" y="-60%" width="220%" height="220%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d" />
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.55" result="a" />
    <feComposite in="d" in2="a" operator="in" />
  </filter>
);

export const ChalkLine: React.FC<{
  t: number; // seconds, scene-local
  timing: StringTiming;
  geom: StringGeom;
  shutter: number;
  width: number;
  height: number;
  stroke: number; // string stroke px
  depositWidth: number;
  xSize: number;
  shadowMax: number;
  depositOpacity: number;
  xOpacity?: number;
  boxScale?: number;
  id?: string;
}> = ({
  t,
  timing,
  geom,
  shutter,
  width,
  height,
  stroke,
  depositWidth,
  xSize,
  shadowMax,
  depositOpacity,
  xOpacity = 1,
  boxScale = 1,
  id = 'hero',
}) => {
  const st = stringAt(t, timing, geom, shutter);
  const stampA = prog(t, timing.payout[1], timing.payout[1] + 0.067) * xOpacity;
  const stampB = prog(t, timing.payout[0], timing.payout[0] + 0.067) * xOpacity;
  const n = st.samples.length;
  const smear = n > 1;
  const box = { w: 30 * boxScale, h: 20 * boxScale };
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs>
        <SprayDefs id={id} />
        <DepositDefs id={id} w={depositWidth} width={width} height={height} />
        <filter id={`shadow-${id}`} filterUnits="userSpaceOnUse" x={-100} y={-100} width={width + 200} height={height + 200}>
          <feGaussianBlur stdDeviation={stroke * 0.9} />
        </filter>
      </defs>

      {/* deposit: powder spread under a crisp eroded core */}
      {st.impacted && depositOpacity > 0 ? (
        <g opacity={depositOpacity}>
          <DepositLines ax={geom.ax} bx={geom.bx} y={geom.y} w={depositWidth} id={id} />
        </g>
      ) : null}

      {/* the string and its cast shadow */}
      {st.visible
        ? st.samples.map((s, i) => {
            const off = Math.min(s.lift * 0.6, shadowMax);
            const pts = s.pts;
            const op = smear ? 0.28 + 0.5 * (i / (n - 1)) : 1;
            return (
              <g key={i} opacity={op}>
                <path d={smoothPath(pts, off, off * 0.35)} stroke="#000" strokeOpacity={0.55} strokeWidth={stroke * 1.4} fill="none" filter={`url(#shadow-${id})`} />
                <path d={smoothPath(pts)} stroke={C.chalkBlue} strokeWidth={stroke} fill="none" strokeLinecap="round" />
              </g>
            );
          })
        : null}

      {/* control points and chalk box */}
      <XMark x={geom.ax} y={geom.y} size={xSize} opacity={stampA} id={id} />
      <XMark x={geom.bx} y={geom.y} size={xSize} opacity={stampB} id={id} />
      <g opacity={prog(t, timing.payout[0] - 0.2, timing.payout[0]) * xOpacity}>
        <rect
          x={geom.bx + xSize * 1.6}
          y={geom.y - box.h / 2}
          width={box.w}
          height={box.h}
          fill={C.slabBlack}
          stroke={C.chalk}
          strokeWidth={1.5}
        />
        <rect x={geom.bx + xSize * 1.6 + box.w * 0.36} y={geom.y - box.h * 0.2} width={box.w * 0.28} height={box.h * 0.4} fill={C.chalkBlue} />
        <line x1={geom.bx} y1={geom.y} x2={geom.bx + xSize * 1.6} y2={geom.y} stroke={C.chalkBlue} strokeWidth={stroke} />
      </g>
    </svg>
  );
};
