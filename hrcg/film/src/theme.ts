// Design tokens for THE SET. Values are the brief's §5.1 palette and §5.2 type roles, unchanged.
import type React from 'react';

export const C = {
  slabBlack: '#0B0B0A',
  slab: '#23221F',
  concrete: '#6E6A66',
  pencil: '#9A958C',
  chalk: '#ECE8E1',
  gypsum: '#E4E0D8',
  chalkBlue: '#6F98E8',
  powder: '#A9C3F5',
  orange: '#F06A2C',
  bayYellow: '#C9A23A',
} as const;

export const F = {
  bs: 'Big Shoulders',
  stencil: 'Big Shoulders Stencil',
  archivo: 'Archivo',
  mono: 'JetBrains Mono',
} as const;

// Label style: Archivo 600, wdth 68, +0.06em, upper case (brief §5.2 "Labels").
export const label = (size: number, color: string = C.chalk): React.CSSProperties => ({
  fontFamily: F.archivo,
  fontWeight: 600,
  fontVariationSettings: "'wdth' 68",
  fontSize: size,
  lineHeight: 1.25,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color,
  whiteSpace: 'nowrap',
});

// Numerals and IDs inside labels: JetBrains Mono 500, tabular.
export const mono = (size: number, color: string = C.chalk): React.CSSProperties => ({
  fontFamily: F.mono,
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  fontSize: size,
  letterSpacing: 0,
  color,
  whiteSpace: 'nowrap',
});

// Big Shoulders display (H1 900 opsz 72; H2 / supers 800–900).
export const display = (size: number, weight = 800, color: string = C.chalk): React.CSSProperties => ({
  fontFamily: F.bs,
  fontWeight: weight,
  fontVariationSettings: "'opsz' 72",
  fontSize: size,
  lineHeight: 0.86,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color,
  whiteSpace: 'nowrap',
});

export const stencil = (size: number, color: string = C.chalk): React.CSSProperties => ({
  fontFamily: F.stencil,
  fontWeight: 800,
  fontVariationSettings: "'opsz' 72",
  fontSize: size,
  lineHeight: 0.9,
  letterSpacing: '0.02em',
  color,
  whiteSpace: 'nowrap',
});

// Status line: Archivo 600, wdth 125, +0.06em.
export const status = (size: number, color: string = C.chalk): React.CSSProperties => ({
  fontFamily: F.archivo,
  fontWeight: 600,
  fontVariationSettings: "'wdth' 125",
  fontSize: size,
  lineHeight: 1,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color,
  whiteSpace: 'nowrap',
});

// Cap height of Big Shoulders (measured from OS/2 sCapHeight / unitsPerEm).
export const BS_CAP = 0.8;
