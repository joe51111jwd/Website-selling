// Glass lettering. Each line of display type is drawn once into a canvas, turned into a signed
// distance field (how far every pixel is from the nearest edge of a letter), and packed into one
// texture. The shader reads the distance to know where a letter's bevel is and which way it
// slopes, so the letters can be lit and bend light like solid glass at any size.

export type Slot = {
  el: HTMLElement;
  clip: HTMLElement | null;
  /** atlas placement, texels */
  ax: number;
  ay: number;
  aw: number;
  ah: number;
  /** atlas texels per CSS px */
  scale: number;
  /** distance encoded at 0 and 1, CSS px */
  range: number;
  /** CSS px of padding around the text box */
  pad: number;
  w: number;
  h: number;
  fontSize: number;
  appear: number;
  seen: boolean;
  /** set in a dark section, where the glass is lit differently */
  dark?: boolean;
};

const INF = 1e20;

// Felzenszwalb & Huttenlocher's linear-time squared distance transform, one row or column at a time
function edt1d(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint16Array, z: Float64Array) {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    const qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}

function edt(grid: Float64Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const v = new Uint16Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) edt1d(grid, x, w, h, f, v, z);
  for (let y = 0; y < h; y++) edt1d(grid, y * w, 1, w, f, v, z);
}

/** Signed distance from an alpha mask, using the alpha for sub-pixel edges (as TinySDF does). */
function sdf(alpha: Uint8ClampedArray, w: number, h: number, range: number) {
  const outer = new Float64Array(w * h);
  const inner = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = alpha[i * 4 + 3] / 255;
    if (a >= 1) {
      outer[i] = 0;
      inner[i] = INF;
    } else if (a <= 0) {
      outer[i] = INF;
      inner[i] = 0;
    } else {
      const d = 0.5 - a;
      outer[i] = d > 0 ? d * d : 0;
      inner[i] = d < 0 ? d * d : 0;
    }
  }
  edt(outer, w, h);
  edt(inner, w, h);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d = Math.sqrt(outer[i]) - Math.sqrt(inner[i]); // negative inside
    out[i] = Math.max(0, Math.min(255, Math.round(255 * (0.5 - d / (2 * range)))));
  }
  return out;
}

// The boxes of an element's text alone, leaving out decorations
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

export function textRect(el: HTMLElement) {
  const boxes = textBoxes(el);
  if (!boxes.length) return new DOMRect();
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function wraps(el: HTMLElement) {
  const tops = textBoxes(el).map((b) => b.top);
  return tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 4;
}

export async function buildAtlas(targets: { el: HTMLElement; clip: HTMLElement | null }[], maxTexels = 2048) {
  const slots: Slot[] = [];
  const parts: { slot: Slot; data: Uint8Array }[] = [];
  let width = 1;
  let height = 0;

  for (const { el, clip } of targets) {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text || wraps(el)) continue;
    const rect = textRect(el);
    if (rect.width < 4) continue;

    const styled = (el.querySelector('em') as HTMLElement | null) ?? el;
    const cs = getComputedStyle(styled);
    const fs = parseFloat(cs.fontSize);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    await document.fonts.load(font, text).catch(() => undefined);

    const pad = Math.ceil(fs * 0.3);
    // big type doesn't need full resolution: the distance field interpolates smoothly
    const scale = Math.min(1, (maxTexels - 8) / (rect.width + pad * 2), 1.4 * (160 / fs));
    const aw = Math.ceil((rect.width + pad * 2) * scale);
    const ah = Math.ceil((rect.height + pad * 2) * scale);
    const range = fs * 0.22;

    const c = document.createElement('canvas');
    c.width = aw;
    c.height = ah;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.font = font;
    const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontKerning?: string };
    if ('letterSpacing' in ls && cs.letterSpacing !== 'normal') ls.letterSpacing = cs.letterSpacing;
    if ('fontKerning' in ls) ls.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent || fs * 0.9;
    const desc = m.fontBoundingBoxDescent || fs * 0.25;
    const baseline = asc * (rect.height / (asc + desc));
    const sx = rect.width / Math.max(1, m.width);
    ctx.setTransform(scale * sx, 0, 0, scale, pad * scale, (pad + baseline) * scale);
    ctx.fillStyle = '#000';
    ctx.fillText(text, 0, 0);

    const data = sdf(ctx.getImageData(0, 0, aw, ah).data, aw, ah, range * scale);
    const slot: Slot = {
      el,
      clip,
      ax: 0,
      ay: height,
      aw,
      ah,
      scale,
      range,
      pad,
      w: rect.width,
      h: rect.height,
      fontSize: fs,
      appear: 0,
      seen: false,
    };
    slots.push(slot);
    parts.push({ slot, data });
    width = Math.max(width, aw);
    height += ah + 4;
  }

  const w = Math.max(4, width);
  const h = Math.max(4, height);
  const pixels = new Uint8Array(w * h); // outside everything = 0 = far outside
  for (const { slot, data } of parts) {
    for (let y = 0; y < slot.ah; y++) pixels.set(data.subarray(y * slot.aw, (y + 1) * slot.aw), (slot.ay + y) * w);
  }
  return { slots, pixels, width: w, height: h };
}

/** Where a slot sits on screen this frame, from the live position of its text. */
export function slotRect(slot: Slot) {
  const r = textRect(slot.el);
  return { x: r.left - slot.pad, y: r.top - slot.pad, w: slot.w + slot.pad * 2, h: slot.h + slot.pad * 2 };
}
