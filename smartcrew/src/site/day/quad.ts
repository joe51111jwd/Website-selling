// Put a flat DOM box exactly onto four points on screen (a device screen's corners as the Stage
// projects them): the projective map from the box to the quad, as a CSS matrix3d. With it, a crisp
// DOM copy of a row or a card sits pixel-for-pixel on the 3D screen, and can then leave it.

/** Corners as [x0, y0, x1, y1, x2, y2, x3, y3]: top-left, top-right, bottom-right, bottom-left. */
export type Quad = number[];

/** The matrix3d() that maps a w × h box (transform-origin 0 0) onto quad `q`. */
export function quadMatrix(w: number, h: number, q: Quad): string {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, hh: number;
  if (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6) {
    a = x1 - x0;
    b = x2 - x1;
    c = x0;
    d = y1 - y0;
    e = y2 - y1;
    f = y0;
    g = 0;
    hh = 0;
  } else {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
    g = (sx * dy2 - dx2 * sy) / det;
    hh = (dx1 * sy - sx * dy1) / det;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + hh * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + hh * y3;
    f = y0;
  }
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  return `matrix3d(${r(a / w)}, ${r(d / w)}, 0, ${r(g / w)}, ${r(b / h)}, ${r(e / h)}, 0, ${r(hh / h)}, 0, 0, 1, 0, ${r(c)}, ${r(f)}, 0, 1)`;
}

/** An axis-aligned rect as a quad. */
export const rectQuad = (x: number, y: number, w: number, h: number): Quad => [x, y, x + w, y, x + w, y + h, x, y + h];

export const lerpQuad = (a: Quad, b: Quad, t: number): Quad => a.map((v, i) => v + (b[i] - v) * t);

/** A quad moved by (dx, dy) and scaled by k about its centre. */
export function moveQuad(q: Quad, dx: number, dy: number, k = 1): Quad {
  const cx = (q[0] + q[2] + q[4] + q[6]) / 4;
  const cy = (q[1] + q[3] + q[5] + q[7]) / 4;
  return q.map((v, i) => (i % 2 ? cy + (v - cy) * k + dy : cx + (v - cx) * k + dx));
}

export const quadCentre = (q: Quad): [number, number] => [(q[0] + q[2] + q[4] + q[6]) / 4, (q[1] + q[3] + q[5] + q[7]) / 4];
