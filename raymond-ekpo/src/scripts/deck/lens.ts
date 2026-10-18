// Glass that bends what's behind it. Chromium can run an SVG filter on whatever sits behind an
// element (backdrop-filter: url(#…)), so each piece of glass gets a displacement map built for its
// own size. Controls (data-lens-glass) have a rounded rim that refracts like a convex bevel and a
// flat middle. Rods (rodLens: the wipe between slides, the before/after divider) are curved all
// the way across, like a glass cylinder. Other browsers keep frosted CSS glass.

const NS = 'http://www.w3.org/2000/svg';

export const chromium = () =>
  !!(navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands?.some(
    (b) => b.brand === 'Chromium',
  );

/** red and green carry the x and y offset, 128 is none */
function map(w: number, h: number, radius: number, bezel: number, thick: number, scale: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const r = Math.min(radius, w / 2, h / 2);
  const eta = 1 / 1.5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // distance inside the rounded rectangle's edge, and its outward direction
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      const qx = Math.abs(px) - (w / 2 - r);
      const qy = Math.abs(py) - (h / 2 - r);
      let s: number;
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0) {
        const d = Math.hypot(qx, qy) || 1;
        s = r - d;
        nx = (qx / d) * Math.sign(px);
        ny = (qy / d) * Math.sign(py);
      } else if (qx > qy) {
        s = r - qx;
        nx = Math.sign(px);
        ny = 0;
      } else {
        s = r - qy;
        nx = 0;
        ny = Math.sign(py);
      }
      let dx = 0;
      let dy = 0;
      if (s > 0 && s < bezel) {
        const t = s / bezel;
        const u = 1 - t;
        const u4 = u * u * u * u;
        const height = Math.pow(1 - u4, 0.25);
        const slope = Math.min(9, (u * u * u * Math.pow(Math.max(1 - u4, 1e-3), -0.75) * thick) / bezel);
        const len = Math.hypot(slope, 1);
        const N = [(nx * slope) / len, (ny * slope) / len, 1 / len];
        const cos = N[2];
        const k = 1 - eta * eta * (1 - cos * cos);
        const a = eta * cos - Math.sqrt(Math.max(k, 0));
        const R = [a * N[0], a * N[1], -eta + a * N[2]];
        const z = thick * (height + 0.2);
        dx = (R[0] / Math.max(-R[2], 0.25)) * z;
        dy = (R[1] / Math.max(-R[2], 0.25)) * z;
      }
      const o = (y * w + x) * 4;
      img.data[o] = Math.round(128 + (dx / scale) * 255);
      img.data[o + 1] = Math.round(128 + (dy / scale) * 255);
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** a glass cylinder standing upright: what's behind is magnified most in the middle and squeezed
 *  towards the rims, and every sample comes from inside the rod, so nothing goes blank */
function rodMap(w: number, scale: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 1;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, 1);
  const R = w / 2;
  for (let x = 0; x < w; x++) {
    const t = (x + 0.5 - R) / R;
    const a = Math.abs(t);
    // how much of the world each part of the rod shows: 1/0.6 magnification in the middle
    const f = 0.6 + 0.28 * a * a;
    const dx = R * t * (f - 1);
    const o = x * 4;
    img.data[o] = Math.round(128 + (dx / scale) * 255);
    img.data[o + 1] = 128;
    img.data[o + 2] = 128;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

let svg: SVGSVGElement | null = null;
const made = new Map<string, string>();

type Shape = { bezel?: number; thick?: number; scale?: number; rod?: boolean };

function filterFor(w: number, h: number, radius: number, blur: number, shape: Shape = {}) {
  const key = `${w}x${h}r${radius}b${blur}:${shape.bezel ?? ''}:${shape.thick ?? ''}:${shape.scale ?? ''}:${shape.rod ?? ''}`;
  const existing = made.get(key);
  if (existing) return existing;
  if (!svg) {
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    document.body.append(svg);
  }
  const id = `lens-${made.size}`;
  const scale = shape.scale ?? 70;
  const bezel = shape.bezel ?? Math.min(24, h * 0.42, w * 0.42);
  const f = document.createElementNS(NS, 'filter');
  f.setAttribute('id', id);
  f.setAttribute('x', '0');
  f.setAttribute('y', '0');
  f.setAttribute('width', String(w));
  f.setAttribute('height', String(h));
  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  f.innerHTML = `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft" />
    <feImage href="${shape.rod ? rodMap(w, scale) : map(w, h, radius, bezel, shape.thick ?? 22, scale)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map" />
    <feDisplacementMap in="soft" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="bent" />
    <feColorMatrix in="bent" type="saturate" values="1.7" />`;
  svg.append(f);
  made.set(key, id);
  return id;
}

export function lensGlass(root: ParentNode = document) {
  if (!chromium()) return;
  const apply = (el: HTMLElement) => {
    const w = Math.round(el.offsetWidth);
    const h = Math.round(el.offsetHeight);
    if (w < 8 || h < 8 || w * h > 900 * 220) return;
    const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2);
    const id = filterFor(w, h, radius, Number(el.dataset.lensGlass || 4));
    el.style.setProperty('--lens', `url(#${id})`);
    el.classList.add('is-lensed');
  };
  const els = [...root.querySelectorAll<HTMLElement>('[data-lens-glass]')];
  els.forEach(apply);
  const ro = new ResizeObserver((entries) => entries.forEach((e) => apply(e.target as HTMLElement)));
  els.forEach((el) => ro.observe(el));
}

/** a rod of glass, curved across its whole width; call again whenever it changes size */
export function rodLens(el: HTMLElement) {
  if (!chromium()) return;
  const w = Math.round(el.offsetWidth);
  const h = Math.round(el.offsetHeight);
  if (w < 8 || h < 8 || w * h > 300 * 1000) return;
  const id = filterFor(w, h, w / 2, Number(el.dataset.lensBlur || 0.3), { rod: true, scale: Math.ceil(w * 0.3) });
  el.style.setProperty('--lens', `url(#${id})`);
  el.classList.add('is-lensed');
}
