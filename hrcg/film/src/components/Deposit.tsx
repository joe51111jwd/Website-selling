// The powdery chalk deposit: a crisp eroded core with ~3 % skip gaps over a faint powder spread.
import React from 'react';
import { random } from 'remotion';
import { C } from '../theme';

const dashPattern = (len: number, seed: string) => {
  const out: number[] = [];
  let acc = 0;
  let i = 0;
  while (acc < len) {
    const on = 40 + random(`${seed}-on-${i}`) * 150;
    const off = 1.5 + random(`${seed}-off-${i}`) * 5;
    out.push(on, off);
    acc += on + off;
    i++;
  }
  return out.map((v) => v.toFixed(1)).join(' ');
};

// Filters use userSpaceOnUse regions: a horizontal line has a zero-height bounding box.
export const DepositDefs: React.FC<{ id: string; w: number; width?: number; height?: number }> = ({ id, w, width = 4000, height = 4000 }) => (
  <>
    <filter id={`chalk-${id}`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={width + 400} height={height + 400}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.45" numOctaves="2" seed="11" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={w * 0.9} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="5" result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 0 0 0 -2.9" result="a" />
      <feComposite in="d" in2="a" operator="in" />
    </filter>
    <filter id={`powder-${id}`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={width + 400} height={height + 400}>
      <feTurbulence type="fractalNoise" baseFrequency="0.35 0.9" numOctaves="3" seed="17" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={w * 2.2} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="8" result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -2.2" result="a" />
      <feComposite in="d" in2="a" operator="in" />
    </filter>
  </>
);

export const DepositLines: React.FC<{ ax: number; bx: number; y: number; w: number; id: string; seed?: string }> = ({
  ax,
  bx,
  y,
  w,
  id,
  seed = 'dep',
}) => {
  const len = bx - ax;
  const scale = len / 768;
  return (
    <>
      <line x1={ax} y1={y} x2={bx} y2={y} stroke={C.powder} strokeOpacity={0.3} strokeWidth={w * 2.4} filter={`url(#powder-${id})`} />
      <line
        x1={ax}
        y1={y}
        x2={bx}
        y2={y}
        stroke={C.chalkBlue}
        strokeWidth={w}
        strokeDasharray={dashPattern(768, seed)
          .split(' ')
          .map((v) => (Number(v) * scale).toFixed(2))
          .join(' ')}
        filter={`url(#chalk-${id})`}
      />
      <line x1={ax} y1={y} x2={bx} y2={y} stroke={C.chalkBlue} strokeOpacity={0.55} strokeWidth={Math.max(1, w * 0.3)} strokeDasharray={dashPattern(len, `${seed}-c`)} />
    </>
  );
};

export const ChalkDeposit: React.FC<{
  ax: number;
  bx: number;
  y: number;
  w: number;
  width: number;
  height: number;
  opacity: number;
  id: string;
}> = ({ ax, bx, y, w, width, height, opacity, id }) => {
  if (opacity <= 0) return null;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, opacity }}>
      <defs>
        <DepositDefs id={id} w={w} width={width} height={height} />
      </defs>
      <DepositLines ax={ax} bx={bx} y={y} w={w} id={id} />
    </svg>
  );
};
