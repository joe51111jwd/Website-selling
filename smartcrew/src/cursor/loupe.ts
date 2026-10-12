// Loupe geometry: where a product screen sits on the page, and which point of its image is under
// a given page point. A screen is a quad (four corners, clockwise from top-left) so a device seen
// at an angle maps correctly; a plain rect is the special case.

export type Quad = [number, number, number, number, number, number, number, number];

export type LoupeConfig = {
  src: string;
  /** corners in the element's own px (or viewport px when space = "viewport"); null = the element's box */
  quad: Quad | null;
  /** part of the image the screen shows, as fractions: x, y, w, h */
  crop: [number, number, number, number];
  zoom: number;
  dpr: number;
  size: number;
  viewport: boolean;
};

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
const nums = (s: string | null) => (s ? (s.match(NUM) ?? []).map(Number) : []);

export const LOUPE_ATTRS = ["data-loupe-src", "data-loupe-rect", "data-loupe-quad", "data-loupe-crop", "data-loupe-zoom", "data-loupe-dpr", "data-loupe-size", "data-loupe-space"];

export function loupeKey(el: Element) {
  let k = "";
  for (const a of LOUPE_ATTRS) k += (el.getAttribute(a) ?? "") + "|";
  return k;
}

export function parseLoupe(el: Element): LoupeConfig {
  const rect = nums(el.getAttribute("data-loupe-rect"));
  const quadN = nums(el.getAttribute("data-loupe-quad"));
  const cropN = nums(el.getAttribute("data-loupe-crop"));
  let quad: Quad | null = null;
  if (quadN.length >= 8) quad = quadN.slice(0, 8) as Quad;
  else if (rect.length >= 4) {
    const [x, y, w, h] = rect;
    quad = [x, y, x + w, y, x + w, y + h, x, y + h];
  }
  const pos = (v: number | undefined, d: number) => (v !== undefined && isFinite(v) && v > 0 ? v : d);
  return {
    src: el.getAttribute("data-loupe-src") ?? "",
    quad,
    crop: cropN.length >= 4 ? [cropN[0], cropN[1], cropN[2] || 1, cropN[3] || 1] : [0, 0, 1, 1],
    zoom: pos(nums(el.getAttribute("data-loupe-zoom"))[0], 2),
    dpr: pos(nums(el.getAttribute("data-loupe-dpr"))[0], 2),
    size: pos(nums(el.getAttribute("data-loupe-size"))[0], 200),
    viewport: el.getAttribute("data-loupe-space") === "viewport",
  };
}

/**
 * Inverse of the projective map from the unit square to `q` (Heckbert's square-to-quad).
 * Returns a 3x3 row-major matrix that takes page (x, y) to screen (s, t) in 0..1.
 */
export function quadInverse(q: Quad): number[] | null {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let h = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) < 1e-9) return null;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const f = y0;
  // inverse of [[a b c][d e f][g h 1]]
  const A = e - f * h;
  const B = f * g - d;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  return [A / det, (c * h - b) / det, (b * f - c * e) / det, B / det, (a - c * g) / det, (c * d - a * f) / det, C / det, (b * g - a * h) / det, (a * e - b * d) / det];
}

export function toScreen(inv: number[], x: number, y: number): [number, number] {
  const w = inv[6] * x + inv[7] * y + inv[8];
  return [(inv[0] * x + inv[1] * y + inv[2]) / w, (inv[3] * x + inv[4] * y + inv[5]) / w];
}

/** Average on-page width of the quad's top and bottom edges. */
export function quadWidth(q: Quad) {
  return (Math.hypot(q[2] - q[0], q[3] - q[1]) + Math.hypot(q[4] - q[6], q[5] - q[7])) / 2;
}

/**
 * For the 3D stage: write a screen's projected corners (TL, TR, BR, BL; px relative to the
 * element) to data-loupe-quad. Only touches the DOM when the rounded value changes, so it is
 * safe to call from every useFrame.
 */
export function writeLoupeQuad(el: Element | null, corners: ArrayLike<number>) {
  if (!el) return;
  let s = "";
  for (let i = 0; i < 8; i++) s += (i ? (i % 2 ? "," : " ") : "") + (Math.round(corners[i] * 10) / 10);
  if (el.getAttribute("data-loupe-quad") !== s) el.setAttribute("data-loupe-quad", s);
}
