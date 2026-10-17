// The page's headline, drawn into a canvas word by word at exactly the places the page set them, so
// the renderer can put it into the scene and the droplets can bend it. The page keeps the real
// text (transparent while the canvas shows it) for selection, search and screen readers.

export type Headline = { canvas: HTMLCanvasElement; pad: number; w: number; h: number };

export async function drawHeadline(el: HTMLElement, dpr: number): Promise<Headline> {
  await document.fonts.ready;
  const box = el.getBoundingClientRect();
  const pad = 24;
  const w = box.width + pad * 2;
  const h = box.height + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * dpr);
  canvas.height = Math.ceil(h * dpr);
  const ctx = canvas.getContext('2d')!;
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontKerning?: string };

  for (const word of el.querySelectorAll<HTMLElement>('.hw')) {
    const cs = getComputedStyle(word);
    const fs = parseFloat(cs.fontSize);
    const text = word.textContent ?? '';
    const r = word.getBoundingClientRect();
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    if ('letterSpacing' in ls) ls.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    if ('fontKerning' in ls) ls.fontKerning = 'normal';
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent || fs * 0.92;
    const desc = m.fontBoundingBoxDescent || fs * 0.24;
    // the word's box spans ascent to descent, so the baseline sits at the same share of it
    const baseline = r.top - box.top + pad + asc * (r.height / (asc + desc));
    const sx = r.width / Math.max(1, m.width);
    ctx.setTransform(dpr * sx, 0, 0, dpr, (r.left - box.left + pad) * dpr, baseline * dpr);
    ctx.fillStyle = word.classList.contains('hw--warm') ? '#ffc29a' : word.classList.contains('hw--dim') ? 'rgb(246 242 236 / 0.5)' : '#f6f2ec';
    ctx.fillText(text, 0, 0);
  }
  return { canvas, pad, w, h };
}
