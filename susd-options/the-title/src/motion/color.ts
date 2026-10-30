// Colours as [r, g, b] and simple sRGB interpolation (fine for these short fades).
export type RGB = [number, number, number];
export const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const css = (c: RGB) => `rgb(${c[0].toFixed(1)} ${c[1].toFixed(1)} ${c[2].toFixed(1)})`;

// Tokens (mirror :root in styles/base.css)
export const C = {
  paper: hex('#F1EADF'),
  paperShade: hex('#E6DCCB'),
  paperEdge: hex('#D3C6B0'),
  ink: hex('#1C1A17'),
  up: hex('#2B5A37'),
  upEdge: hex('#1C3C25'),
  side: hex('#D49B2C'),
  sideEdge: hex('#9C6E19'),
  down: hex('#B2322A'),
  downEdge: hex('#7F211B'),
};

export interface Ink {
  face: RGB;
  edge: RGB;
}
export const INK = {
  up: { face: C.up, edge: C.upEdge } as Ink,
  side: { face: C.side, edge: C.sideEdge } as Ink,
  down: { face: C.down, edge: C.downEdge } as Ink,
  blind: { face: C.paperShade, edge: C.paperEdge } as Ink,
  ink: { face: C.ink, edge: hex('#000000') } as Ink,
};
export const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ face: mix(a.face, b.face, t), edge: mix(a.edge, b.edge, t) });
