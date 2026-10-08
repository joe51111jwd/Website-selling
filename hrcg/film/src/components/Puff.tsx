// Matte powder: pre-shaded, top-lit sprites (lighter on top, darker beneath), normal compositing, never
// additive. Colours are c34's plume, desaturated; highlights use --powder.
import React from 'react';
import { puffAt } from '../lib/puff';

const SHADES = [
  ['#B4C8EE', '#5E78A8'],
  ['#A9C3F5', '#56709F'],
  ['#9DB4E0', '#4E668F'],
  ['#C2D0EA', '#6A7FA6'],
  ['#AABDE3', '#5A719B'],
  ['#93AAD6', '#4A6088'],
  ['#B8C6E2', '#64789C'],
  ['#A3B9E6', '#526A97'],
];

// stop profiles per population: grains are crisp, the body is soft, the haze is softest
const STOPS: [number, number, number][][] = [
  [
    [0, 1, 0],
    [0.6, 0.95, 1],
    [1, 0, 1],
  ],
  [
    [0, 0.55, 0],
    [0.45, 0.32, 1],
    [1, 0, 1],
  ],
  [
    [0, 0.3, 0],
    [0.5, 0.16, 1],
    [1, 0, 1],
  ],
];

export const Puff: React.FC<{
  tau: number;
  ax: number;
  bx: number;
  y: number;
  scale: number;
  strength: number;
  width: number;
  height: number;
  fadeEnd?: number;
  id?: string;
}> = ({ tau, ax, bx, y, scale, strength, width, height, fadeEnd = 0.8, id = 'p' }) => {
  const sprites = puffAt(tau, ax, bx, y, scale, strength, fadeEnd);
  if (sprites.length === 0) return null;
  // draw haze first, then body, then grains
  const order = [...sprites].sort((a, b) => b.kind - a.kind);
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        {STOPS.map((stops, k) =>
          SHADES.map(([hi, lo], i) => (
            <radialGradient key={`${k}-${i}`} id={`${id}-k${k}g${i}`} cx="50%" cy="42%" r="50%" fx="47%" fy="28%">
              {stops.map(([off, a, which], j) => (
                <stop key={j} offset={`${off * 100}%`} stopColor={which === 0 ? hi : lo} stopOpacity={a} />
              ))}
            </radialGradient>
          )),
        )}
      </defs>
      {order.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`url(#${id}-k${s.kind}g${s.g})`} opacity={s.o} />
      ))}
    </svg>
  );
};
