// The slab: ld14 concrete at about 12 % exposure, with the site's one soft work-light pool (centre-left).
import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { C } from '../theme';

export const Ground: React.FC<{ pool?: [number, number]; tile?: number; exposure?: number }> = ({
  pool = [36, 46],
  tile = 768,
  exposure = 0.12,
}) => (
  <AbsoluteFill style={{ backgroundColor: C.slabBlack }}>
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('tex/ld14.jpg')})`,
        backgroundSize: `${tile}px ${tile}px`,
        backgroundRepeat: 'repeat',
        opacity: 1,
        filter: `brightness(${exposure * 2.6}) saturate(0.6)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 58% 64% at ${pool[0]}% ${pool[1]}%, rgba(11,11,10,0.18) 0%, rgba(11,11,10,0.62) 52%, rgba(11,11,10,0.94) 100%)`,
      }}
    />
  </AbsoluteFill>
);
