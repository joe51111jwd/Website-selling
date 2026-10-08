// The matte powder puff (brief §4.1): seeded sprites that lift off the line, rise ≤ ~140 site px under
// drag, drift slightly toward the lens, settle back under gravity and fade by S+0.8 s.
// Closed-form ballistics with linear drag, so every sprite is a pure function of τ = t − S.
// Three populations: fine grains (they fly highest), a soft body, and a low haze that hugs the line.
import { random } from 'remotion';

export type Sprite = { x: number; y: number; r: number; o: number; g: number; kind: 0 | 1 | 2 };

type Seeded = {
  u: number;
  jy: number;
  vx: number;
  vy: number;
  r0: number;
  grow: number;
  lens: number;
  g: number;
  o: number;
  kind: 0 | 1 | 2;
};

const POP: { kind: 0 | 1 | 2; n: number }[] = [
  { kind: 0, n: 460 },
  { kind: 1, n: 110 },
  { kind: 2, n: 18 },
];

const seeds: Seeded[] = (() => {
  const out: Seeded[] = [];
  let i = 0;
  for (const p of POP) {
    for (let j = 0; j < p.n; j++, i++) {
      const r = (k: string) => random(`puff-${i}-${k}`);
      // denser near the pull point (u ≈ 0.42), spread over the whole line
      const centre = 0.42 + (r('c') + r('c2') - 1) * 0.32;
      const u = Math.min(0.99, Math.max(0.01, r('mix') < 0.6 ? centre : r('u')));
      const kind = p.kind;
      out.push({
        u,
        jy: (r('jy') - 0.5) * (kind === 0 ? 6 : 3),
        vx: (r('vx') - 0.5) * (kind === 0 ? 190 : kind === 1 ? 90 : 40),
        vy:
          kind === 0
            ? -(260 + Math.pow(r('vy'), 0.8) * 680)
            : kind === 1
              ? -(110 + r('vy') * 300)
              : -(40 + r('vy') * 90),
        r0: kind === 0 ? 0.9 + Math.pow(r('r'), 2) * 2.6 : kind === 1 ? 12 + r('r') * 26 : 48 + r('r') * 60,
        grow: kind === 0 ? 0.2 + r('gr') * 0.4 : kind === 1 ? 0.9 + r('gr') * 1.1 : 0.5 + r('gr') * 0.6,
        lens: r('lens'),
        g: Math.floor(r('g') * 8),
        o: kind === 0 ? 0.45 + r('o') * 0.5 : kind === 1 ? 0.1 + r('o') * 0.16 : 0.07 + r('o') * 0.07,
        kind,
      });
    }
  }
  return out;
})();

const K = 4.5; // drag, 1/s
const G = 380; // gravity, px/s²
const N_TOTAL = seeds.length;

/**
 * Sprites at τ seconds after impact. Geometry in px: line from ax to bx at y; `scale` scales the rise
 * (frame px per site px); `strength` 0..1 scales sprite count (40–100 %) and launch speed.
 */
export const puffAt = (
  tau: number,
  ax: number,
  bx: number,
  y: number,
  scale: number,
  strength: number,
  fadeEnd = 0.8,
): Sprite[] => {
  if (tau < 0 || tau > fadeEnd) return [];
  const keep = 0.4 + 0.6 * strength;
  const vScale = 0.55 + 0.45 * strength;
  const out: Sprite[] = [];
  const e = Math.exp(-K * tau);
  for (let i = 0; i < N_TOTAL; i++) {
    const s = seeds[i];
    if (random(`puff-keep-${i}`) > keep) continue;
    const vy0 = s.vy * vScale * scale;
    const vx0 = s.vx * vScale * scale;
    // y down positive: v = g/k + (v0 − g/k)e^{−kt}
    let dy = (G / K) * tau + (vy0 - G / K) * ((1 - e) / K);
    dy = Math.min(dy, 0); // lands back on the line, never below it
    const dx = vx0 * ((1 - e) / K);
    // toward the lens: a little downward screen drift and growth for the near half
    const lensDrift = s.lens * 22 * scale * (1 - e);
    const r = s.r0 * scale * (1 + s.grow * tau * 1.6);
    const fadeIn = Math.min(1, tau / (s.kind === 0 ? 0.03 : 0.07));
    const fo = 1 - Math.min(1, Math.max(0, (tau - fadeEnd * 0.4) / (fadeEnd * 0.6)));
    out.push({
      x: ax + (bx - ax) * s.u + dx,
      y: y + s.jy + dy + lensDrift,
      r,
      o: s.o * fadeIn * fo * fo,
      g: s.g,
      kind: s.kind,
    });
  }
  return out;
};
