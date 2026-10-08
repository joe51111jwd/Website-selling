// The cover H1 in frame space. Before the snap: chalk at 50 % plus a 1 px pencil stroke.
// At impact the fills rise from each baseline through a noise mask over 280 ms (SETTLE):
// WHAT CAN A / HUMANOID ink chalk, ACTUALLY / BUILD? ink marking orange.
import React from 'react';
import { BS_CAP, F } from '../theme';
import { SETTLE, prog } from '../lib/ease';

export type H1Line = {
  text: string;
  x: number;
  baseline: number;
  anchor: 'start' | 'end';
  ink: string;
  plane: 'far' | 'near';
};

export const HeroType: React.FC<{
  t: number;
  inkAt: number; // seconds
  lines: H1Line[];
  size: number;
  width: number;
  height: number;
  pivot?: [number, number];
  farScale?: number;
  nearScale?: number;
  opacity?: number;
  inkDur?: number;
  id?: string;
}> = ({ t, inkAt, lines, size, width, height, pivot = [0, 0], farScale = 1, nearScale = 1, opacity = 1, inkDur = 0.28, id = 'h1' }) => {
  const k = SETTLE(prog(t, inkAt, inkAt + inkDur));
  const cap = size * BS_CAP;
  const textStyle: React.CSSProperties = {
    fontFamily: F.bs,
    fontWeight: 900,
    fontVariationSettings: "'opsz' 72",
    fontSize: size,
    letterSpacing: '-0.005em',
  };
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible' }}>
      <defs>
        <filter id={`${id}-noise`} x="-10%" y="-60%" width="120%" height="220%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="3" seed="23" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={cap * 0.42} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {lines.map((l, i) => {
          const h = k * (cap * 1.9) - cap * 0.18;
          return (
            <mask key={i} id={`${id}-m${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
              <rect
                x={l.anchor === 'start' ? l.x - size * 0.5 : l.x - size * 7}
                y={l.baseline - h}
                width={size * 7.5}
                height={Math.max(0, h + size * 0.45)}
                fill="#fff"
                filter={`url(#${id}-noise)`}
              />
            </mask>
          );
        })}
      </defs>
      {lines.map((l, i) => {
        const s = l.plane === 'far' ? farScale : nearScale;
        const tf = `translate(${pivot[0]} ${pivot[1]}) scale(${s}) translate(${-pivot[0]} ${-pivot[1]})`;
        return (
          <g key={i} transform={tf}>
            <text
              x={l.x}
              y={l.baseline}
              textAnchor={l.anchor}
              style={textStyle}
              fill="rgba(236,232,225,0.5)"
              stroke="rgba(236,232,225,0.35)"
              strokeWidth={1}
              opacity={k >= 1 ? 0 : 1}
            >
              {l.text}
            </text>
            {k > 0 ? (
              <text x={l.x} y={l.baseline} textAnchor={l.anchor} style={textStyle} fill={l.ink} mask={k < 1 ? `url(#${id}-m${i})` : undefined}>
                {l.text}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
