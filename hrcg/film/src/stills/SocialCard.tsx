// R5: og:image (1200×630) and X card (1600×900) from the frozen frame 84 (re-extracted from A5's livery-shifted
// c34 mezzanine, F-011), the H1 laid out in frame space exactly as the site's CoverStage sets it (pass B note 1:
// two tight stacks at .86, FAR x 0.095 from cap-top 0.135, NEAR right edge 0.885, BUILD? on the line at 0.755),
// and a title strip carrying the status and the disclosure at ≥ 28 px at 1200 wide. The 2D frame (no depth swing).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { HeroType, type H1Line } from '../components/HeroType';
import { CourseMark } from '../components/Marks';
import { Lbl } from '../components/Lbl';
import { STILLS } from '../clips';
import { C } from '../theme';

export type SocialProps = { kind: 'og' | 'x' };

export const SOCIAL_STRIP = 'HUMANOID ROBOT CONSTRUCTION GAMES · PLANNED · NEW YORK CITY · 2027';
export const SOCIAL_DISCLOSURE = 'CONCEPT · AI-GENERATED. THIS HASN’T HAPPENED YET.';

export const SocialCard: React.FC<SocialProps> = ({ kind }) => {
  const W = kind === 'og' ? 1200 : 1600;
  const H = kind === 'og' ? 630 : 900;
  const k = W / 1920; // frame px → card px
  const fh = 1076 * k;
  const top = kind === 'og' ? -20 : -6; // frame offset (the strip covers the floor)
  const fx = (x: number) => x * W;
  const fy = (y: number) => top + y * fh;
  const size = 0.131 * fh;
  const cap = size * 0.8;
  const step = size * 0.86;
  const lines: H1Line[] = [
    { text: 'WHAT CAN A', x: fx(0.095), baseline: fy(0.135) + cap, anchor: 'start', ink: C.chalk, plane: 'far' },
    { text: 'HUMANOID', x: fx(0.095), baseline: fy(0.135) + cap + step, anchor: 'start', ink: C.chalk, plane: 'far' },
    { text: 'ACTUALLY', x: fx(0.885), baseline: fy(0.755) - step, anchor: 'end', ink: C.orange, plane: 'near' },
    { text: 'BUILD?', x: fx(0.885), baseline: fy(0.755), anchor: 'end', ink: C.orange, plane: 'near' },
  ];
  const lbl = kind === 'og' ? 28 : 38;
  const pad = kind === 'og' ? 40 : 56;
  const rowH = lbl * 1.75;
  const stripH = rowH * 2 + 1;
  const u = lbl * 0.4;
  return (
    <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
      <Img src={staticFile(STILLS.c34f84)} style={{ position: 'absolute', left: 0, top, width: W, height: fh }} />
      <HeroType t={1} inkAt={0} lines={lines} size={size} width={W} height={H} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: H - stripH,
          width: W,
          height: stripH,
          backgroundColor: 'rgba(11,11,10,0.96)',
          borderTop: `1px solid ${C.pencil}`,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'absolute', left: pad, top: 0, height: rowH, display: 'flex', alignItems: 'center', gap: lbl * 0.75 }}>
          <div style={{ position: 'relative', width: 10.5 * u, height: u }}>
            <CourseMark x={0} y={0} u={u} />
          </div>
          <Lbl text={SOCIAL_STRIP} size={lbl} color={C.chalk} />
        </div>
        <div style={{ position: 'absolute', left: pad, right: pad, top: rowH, height: 1, backgroundColor: 'rgba(154,149,140,0.5)' }} />
        <div style={{ position: 'absolute', left: pad, top: rowH + 1, height: rowH, display: 'flex', alignItems: 'center' }}>
          <Lbl text={SOCIAL_DISCLOSURE} size={lbl} color={C.chalk} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
