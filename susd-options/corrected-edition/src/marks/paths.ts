import { mulberry32 } from './rng';

const f = (n: number) => Math.round(n * 100) / 100;

/** A ruled strike: straight, with two seeded wobble points of ±0.6 px. */
export function strikeD(x0: number, x1: number, y: number, seed: number, over = 6) {
  const r = mulberry32(seed);
  const w = () => (r() * 2 - 1) * 0.6;
  const a = x0 + (x1 - x0) * (0.28 + r() * 0.12);
  const b = x0 + (x1 - x0) * (0.6 + r() * 0.12);
  return `M${f(x0 - over)},${f(y + w())} L${f(a)},${f(y + w())} L${f(b)},${f(y + w())} L${f(x1 + over)},${f(y + w())}`;
}

/** Caret ‸ centred on cx, its point at top y. */
export function caretD(cx: number, y: number, w = 14, h = 12) {
  return `M${f(cx - w / 2)},${f(y + h)} L${f(cx)},${f(y)} L${f(cx + w / 2)},${f(y + h)}`;
}

/** The dele mark: a stem that drops, loops back on itself, and kicks out a tail. s = scale (1 = 24 px tall). */
export function deleD(x: number, y: number, s = 1) {
  const P = (px: number, py: number) => `${f(x + px * s)},${f(y + py * s)}`;
  return `M${P(15, 0.5)} C${P(15.5, 7)} ${P(14.5, 14)} ${P(11.5, 18.5)} C${P(8.5, 23)} ${P(2.5, 22.5)} ${P(2.8, 17.6)} C${P(3.1, 12.8)} ${P(10.8, 12.4)} ${P(13.6, 17)} C${P(15.4, 20)} ${P(17.4, 23.4)} ${P(21.5, 23.2)}`;
}

/** Stet dots under a row: a dotted rule (round caps on a zero-length dash). */
export function stetDotsD(x0: number, x1: number, y: number) {
  return `M${f(x0)},${f(y)} L${f(x1)},${f(y)}`;
}

/**
 * Transpose loop: an S that rides over the first word and under the second, crossing between
 * them. a and b are word boxes in sheet space; top / bot are the inked band of the pair (cap and
 * ascender line, descender line), and pad keeps the pen clear of the glyphs (0.14 em).
 */
export function transposeD(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  band?: { top: number; bot: number; pad: number },
) {
  const padX = Math.max(10, a.h * 0.16);
  const top = band ? band.top - band.pad + 10 : Math.min(a.y, b.y) + a.h * 0.06;
  const bot = band ? band.bot + band.pad - 10 : Math.max(a.y + a.h, b.y + b.h) - a.h * 0.02;
  const mid = (top + bot) / 2;
  const ax0 = a.x - padX;
  const ax1 = a.x + a.w + padX * 0.2;
  const bx0 = b.x - padX * 0.2;
  const bx1 = b.x + b.w + padX;
  const cx = (ax1 + bx0) / 2;
  // Start low on the left, arch over word A, cross down through the gap, cup under word B, rise at the end.
  return [
    `M${f(ax0 + 6)},${f(bot - 4)}`,
    `C${f(ax0 - 10)},${f(mid)} ${f(ax0 - 2)},${f(top - 8)} ${f(ax0 + a.w * 0.2)},${f(top - 10)}`,
    `C${f(ax0 + a.w * 0.55)},${f(top - 14)} ${f(ax1 - a.w * 0.08)},${f(top - 12)} ${f(ax1)},${f(top + 2)}`,
    `C${f(cx - 6)},${f(top + (bot - top) * 0.35)} ${f(cx + 6)},${f(top + (bot - top) * 0.65)} ${f(bx0)},${f(bot - 2)}`,
    `C${f(bx0 + b.w * 0.08)},${f(bot + 12)} ${f(bx1 - b.w * 0.45)},${f(bot + 14)} ${f(bx1 - b.w * 0.2)},${f(bot + 10)}`,
    `C${f(bx1 + 2)},${f(bot + 8)} ${f(bx1 + 10)},${f(mid)} ${f(bx1 - 6)},${f(top + 4)}`,
  ].join(' ');
}

/** A corner-to-corner rule across a sheet (slight seeded wobble). */
export function diagonalD(w: number, h: number, inset: number, seed: number) {
  const r = mulberry32(seed);
  const w1 = () => (r() * 2 - 1) * 0.8;
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const p = (t: number) => `${f(x0 + (x1 - x0) * t + w1())},${f(y0 + (y1 - y0) * t + w1())}`;
  return `M${p(0)} L${p(0.33)} L${p(0.68)} L${p(1)}`;
}
