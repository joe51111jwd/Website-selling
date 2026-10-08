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

export const DepositDefs: React.FC<{ id: string; w: number }> = ({ id, w }) => (
  <filter id={`chalk-${id}`} x="-2%" y="-300%" width="104%" height="700%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.5" numOctaves="2" seed="11" result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={w * 0.8} xChannelSelector="R" yChannelSelector="G" result="d" />
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.75" result="a" />
    <feComposite in="d" in2="a" operator="in" />
  </filter>
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
      <line x1={ax} y1={y} x2={bx} y2={y} stroke={C.chalkBlue} strokeOpacity={0.22} strokeWidth={w * 2.6} filter={`url(#chalk-${id})`} />
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
        <DepositDefs id={id} w={w} />
      </defs>
      <DepositLines ax={ax} bx={bx} y={y} w={w} id={id} />
    </svg>
  );
};
