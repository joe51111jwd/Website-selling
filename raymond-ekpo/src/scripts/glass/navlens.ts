// The floating nav floats over the page's own text, which the WebGL canvas can't see. In
// Chromium, CSS can run an SVG filter on whatever is behind an element, so the capsule gets a
// displacement map built from the same squircle bevel the canvas uses: text and ink sliding under
// it bend at the rim. Other browsers keep the frosted capsule from glass.css.

const NS = 'http://www.w3.org/2000/svg';

function chromium() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  return !!brands?.some((b) => b.brand === 'Chromium');
}

/** A displacement map for a capsule w × h: red and green carry the x and y offset, 128 is none. */
function map(w: number, h: number, bezel: number, thick: number, scale: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const r = h / 2;
  const n = 1 / 1.5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // distance inside the capsule's edge, and the outward direction
      const qx = Math.abs(x + 0.5 - w / 2) - (w / 2 - r);
      const qy = y + 0.5 - h / 2;
      let s: number;
      let nx: number;
      let ny: number;
      if (qx > 0) {
        const d = Math.hypot(qx, qy) || 1;
        s = r - d;
        nx = (qx / d) * Math.sign(x + 0.5 - w / 2);
        ny = qy / d;
      } else {
        s = r - Math.abs(qy);
        nx = 0;
        ny = Math.sign(qy);
      }
      let dx = 0;
      let dy = 0;
      if (s > 0 && s < bezel) {
        // the convex squircle bevel, bent by Snell's law as in shaders.ts
        const t = s / bezel;
        const u = 1 - t;
        const u4 = u * u * u * u;
        const height = Math.pow(1 - u4, 0.25);
        const slope = Math.min(9, ((u * u * u * Math.pow(Math.max(1 - u4, 1e-3), -0.75)) * thick) / bezel);
        const len = Math.hypot(slope, 1);
        const N = [(nx * slope) / len, (ny * slope) / len, 1 / len];
        const cos = N[2];
        const k = 1 - n * n * (1 - cos * cos);
        const a = n * cos - Math.sqrt(Math.max(k, 0));
        const R = [a * N[0], a * N[1], -n + a * N[2]];
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

export function navLens() {
  const bar = document.querySelector<HTMLElement>('.bar');
  const capsule = bar?.querySelector<HTMLElement>('.bar-inner');
  if (!bar || !capsule || !chromium()) return;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="nav-lens" x="0" y="0" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="soft" />
    <feImage result="map" preserveAspectRatio="none" />
    <feDisplacementMap in="soft" in2="map" xChannelSelector="R" yChannelSelector="G" />
    <feColorMatrix type="saturate" values="1.6" />
  </filter>`;
  document.body.append(svg);
  const filter = svg.querySelector('filter')!;
  const image = svg.querySelector('feImage')!;
  const disp = svg.querySelector('feDisplacementMap')!;

  let size = '';
  const build = () => {
    const w = Math.round(capsule.offsetWidth);
    const h = Math.round(capsule.offsetHeight);
    if (!w || !h || `${w}x${h}` === size) return;
    size = `${w}x${h}`;
    const scale = 60;
    filter.setAttribute('width', String(w));
    filter.setAttribute('height', String(h));
    image.setAttribute('width', String(w));
    image.setAttribute('height', String(h));
    image.setAttribute('href', map(w, h, Math.min(22, h * 0.42), 20, scale));
    disp.setAttribute('scale', String(scale));
    bar.classList.add('lensed');
  };
  build();
  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(build, 150);
  });
}
