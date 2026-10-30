// Where a strike should cross a word: through the middle of the x-height, from real font metrics.
let ctx: CanvasRenderingContext2D | null = null;

function metrics(el: HTMLElement) {
  ctx ??= document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(el);
  if (!ctx) return { asc: parseFloat(cs.fontSize) * 0.9, desc: parseFloat(cs.fontSize) * 0.3, xh: parseFloat(cs.fontSize) * 0.45, cs };
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText('x');
  const size = parseFloat(cs.fontSize);
  return {
    asc: m.fontBoundingBoxAscent || size * 0.9,
    desc: m.fontBoundingBoxDescent || size * 0.3,
    xh: m.actualBoundingBoxAscent || size * 0.45,
    cs,
  };
}

/** Offset from the element's offsetTop to the strike line (through the x-height middle). */
export function strikeOffset(el: HTMLElement, frac = 0.5) {
  const { asc, desc, xh, cs } = metrics(el);
  let baseline = asc;
  if (cs.display !== 'inline') baseline = (el.offsetHeight - (asc + desc)) / 2 + asc;
  return baseline - xh * frac;
}

/** Offset from offsetTop to the baseline. */
export function baselineOffset(el: HTMLElement) {
  const { asc, desc, cs } = metrics(el);
  if (cs.display !== 'inline') return (el.offsetHeight - (asc + desc)) / 2 + asc;
  return asc;
}

let bandCtx: CanvasRenderingContext2D | null = null;
/**
 * The inked band of a word, relative to its box top: from the tallest cap / ascender to the
 * lowest descender (real glyph bounds, not the line box). em is the font size in px.
 */
export function glyphBand(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const base = baselineOffset(el);
  bandCtx ??= document.createElement('canvas').getContext('2d');
  if (!bandCtx) return { top: base - size * 0.75, bottom: base + size * 0.24, em: size };
  bandCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const up = bandCtx.measureText('bdfhklCTE').actualBoundingBoxAscent || size * 0.75;
  const down = bandCtx.measureText('gjpqy').actualBoundingBoxDescent || size * 0.24;
  return { top: base - up, bottom: base + down, em: size };
}
