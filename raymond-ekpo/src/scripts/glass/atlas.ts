// Draws the glass lettering into one texture. Each line gets a slot holding three versions of
// the same text: sharp (red), lightly blurred (green: the height of the glass, whose slope bends
// the light) and heavily blurred (blue: the shadow, and the blob the letters condense from).

export type Slot = {
  el: HTMLElement;
  clip: HTMLElement | null;
  // atlas placement, px
  ax: number;
  ay: number;
  aw: number;
  ah: number;
  // CSS px around the text's content box, and the text box size when the atlas was drawn
  pad: number;
  w: number;
  h: number;
  appear: number;
  seen: boolean;
};

const SCALE = 0.5;

// The boxes of the element's text alone, leaving out decorations like the pen strokes
function textBoxes(el: HTMLElement) {
  const boxes: DOMRect[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    for (const b of range.getClientRects()) if (b.width > 0.5) boxes.push(b);
  }
  return boxes;
}

function textRect(el: HTMLElement) {
  const boxes = textBoxes(el);
  if (!boxes.length) return new DOMRect();
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

/** True if the element's text sits on more than one line (then it stays as ordinary text). */
function wraps(el: HTMLElement) {
  const tops = textBoxes(el).map((b) => b.top);
  return tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 4;
}

// three box blurs in a row come close to a gaussian
function blur(src: Uint8ClampedArray, w: number, h: number, radius: number) {
  const r = Math.max(1, Math.round(radius / 1.7));
  let a = Float32Array.from(src);
  let b = new Float32Array(a.length);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / (2 * r + 1);
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

export async function buildAtlas(targets: { el: HTMLElement; clip: HTMLElement | null }[]) {
  const slots: Slot[] = [];
  const parts: { slot: Slot; r: Uint8ClampedArray; g: Float32Array; b: Float32Array }[] = [];
  let width = 1;
  let height = 0;

  for (const { el, clip } of targets) {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text || wraps(el)) continue;
    const rect = textRect(el);
    if (rect.width < 4) continue;

    // the style of the text itself (an <em> inside a line, say)
    const styled = (el.querySelector('em') as HTMLElement | null) ?? el;
    const cs = getComputedStyle(styled);
    const fs = parseFloat(cs.fontSize);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    await document.fonts.load(font, text).catch(() => undefined);

    const pad = Math.ceil(fs * 0.22);
    const aw = Math.ceil((rect.width + pad * 2) * SCALE);
    const ah = Math.ceil((rect.height + pad * 2) * SCALE);

    const c = document.createElement('canvas');
    c.width = aw;
    c.height = ah;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, aw, ah);
    ctx.font = font;
    const lsAware = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ('letterSpacing' in lsAware && cs.letterSpacing !== 'normal') lsAware.letterSpacing = cs.letterSpacing;
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent || fs * 0.9;
    const desc = m.fontBoundingBoxDescent || fs * 0.25;
    // the text box on the page spans ascent to descent, so the baseline sits at the same share of it
    const baseline = asc * (rect.height / (asc + desc));
    const sx = rect.width / Math.max(1, m.width);
    ctx.setTransform(SCALE * sx, 0, 0, SCALE, pad * SCALE, (pad + baseline) * SCALE);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, 0);

    const data = ctx.getImageData(0, 0, aw, ah).data;
    const r = new Uint8ClampedArray(aw * ah);
    for (let i = 0; i < r.length; i++) r[i] = data[i * 4];
    const g = blur(r, aw, ah, fs * 0.05 * SCALE);
    const b = blur(r, aw, ah, fs * 0.11 * SCALE);

    const slot: Slot = { el, clip, ax: 0, ay: height, aw, ah, pad, w: rect.width, h: rect.height, appear: 0, seen: false };
    slots.push(slot);
    parts.push({ slot, r, g, b });
    width = Math.max(width, aw);
    height += ah + 2;
  }

  const pixels = new Uint8Array(Math.max(1, width) * Math.max(1, height) * 4);
  for (const { slot, r, g, b } of parts) {
    for (let y = 0; y < slot.ah; y++) {
      for (let x = 0; x < slot.aw; x++) {
        const s = y * slot.aw + x;
        const o = ((slot.ay + y) * width + x) * 4;
        pixels[o] = r[s];
        pixels[o + 1] = g[s];
        pixels[o + 2] = b[s];
        pixels[o + 3] = 255;
      }
    }
  }
  return { slots, pixels, width: Math.max(1, width), height: Math.max(1, height) };
}

/** Where a slot sits on screen this frame, from the live position of its text. */
export function slotRect(slot: Slot) {
  const r = textRect(slot.el);
  return { x: r.left - slot.pad, y: r.top - slot.pad, w: slot.w + slot.pad * 2, h: slot.h + slot.pad * 2 };
}
