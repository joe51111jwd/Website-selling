// Real liquid glass for the focus look (src/lib/look.ts): a lens that bends the page behind a small
// floating surface, the way Apple's Liquid Glass does (WWDC25 "Meet Liquid Glass": "dynamically
// bends, shapes, and concentrates light"). James's references, Oct 18: kube.io's "Liquid Glass in the
// browser" (the physics below), shuding/liquid-glass and stormaref/LiquidGlassSkill (the pipeline).
//
// How it works: a displacement map is baked for the surface's exact size (R = x shift, G = y shift,
// 128 = none) and fed to an SVG feDisplacementMap that the surface uses as a backdrop-filter. The
// surface's rim is a convex squircle bezel; each rim pixel shows the page from a little further in
// (Snell's law, glass n = 1.5), so the page bends at the edge and the flat middle stays undistorted,
// which keeps what sits on it readable. A second baked image adds the light catching the rim.
//
// Only Chromium paints SVG filters inside backdrop-filter (Safari, every iOS browser and Firefox
// don't, and CSS.supports() can't tell), so canRefract() gates on the engine and everything else
// keeps the plain frosted look. The research and its sources:
// /mnt/project-files/smartcrew/focus/liquid-glass-research.md.

export interface GlassMapOptions {
  /** The surface's border box, CSS px. */
  width: number;
  height: number;
  /** Corner radius, CSS px (clamped to half the short side). Keep it >= bezel, or the corners crease. */
  radius: number;
  /** Width of the curved rim, CSS px; inside it the glass is flat and bends nothing. */
  bezel: number;
  /** Height of the flat top above the page, CSS px (default 2 x bezel). */
  thickness?: number;
  /** Refractive index (default 1.5, glass). */
  ior?: number;
  /** The rim light: a top-left light (-135deg) on a band this many px wide. */
  specular?: { angleDeg?: number; width?: number; strength?: number };
}

export interface GlassMap {
  href: string;
  specHref?: string;
  /** For <feDisplacementMap scale>: feDisplacementMap reaches +-scale/2, so twice the largest shift. */
  scale: number;
  width: number;
  height: number;
}

/** The convex squircle: the bend packs into the outer edge of the rim (Apple's crisp edge lensing). */
const squircle = (x: number) => Math.max(0, 1 - (1 - x) ** 4) ** 0.25;

/** How far in (CSS px) each of n samples across the bezel looks, from the edge inwards. */
function bezelShift(bezel: number, thickness: number, ior: number, n = 128) {
  const out = new Float64Array(n);
  const e = 1e-3;
  for (let i = 0; i < n; i++) {
    const x = Math.min(Math.max((i + 0.5) / n, e), 1 - e);
    const slope = ((squircle(x + e) - squircle(x - e)) / (2 * e)) * (thickness / bezel);
    const t1 = Math.atan(slope); // the surface normal's tilt off the vertical ray
    const t2 = Math.asin(Math.sin(t1) / ior); // Snell: sin(t1) = n sin(t2)
    out[i] = thickness * squircle(x) * Math.tan(t1 - t2); // the glass's depth here x the ray's lean
  }
  return out;
}

function toDataUrl(rgba: Uint8ClampedArray<ArrayBuffer>, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
  return c.toDataURL("image/png");
}

/** Bakes the maps (about 20 ms for the 760 x 56 header at 2x). Rebuild when the size or DPR changes. */
export function buildGlassMap(o: GlassMapOptions): GlassMap {
  // the bend sits in the rim's first CSS px or two, so bake at up to 2x
  const ss = Math.min(window.devicePixelRatio || 1, 2);
  const W = o.width;
  const H = o.height;
  const r = Math.min(o.radius, W / 2, H / 2);
  const bezel = Math.max(1, Math.min(o.bezel, W / 2, H / 2));
  const shift = bezelShift(bezel, o.thickness ?? bezel * 2, o.ior ?? 1.5);
  const maxShift = Math.max(1e-3, ...shift);
  const w = Math.max(1, Math.round(W * ss));
  const h = Math.max(1, Math.round(H * ss));
  const disp = new Uint8ClampedArray(w * h * 4);
  const sp = o.specular;
  const spec = sp ? new Uint8ClampedArray(w * h * 4) : undefined;
  const la = ((sp?.angleDeg ?? -135) * Math.PI) / 180;
  const lx = Math.cos(la);
  const ly = Math.sin(la);
  const specW = sp?.width ?? 2.5;
  const specK = sp?.strength ?? 0.9;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const X = (px + 0.5) / ss;
      const Y = (py + 0.5) / ss;
      const sx = X < W / 2 ? -1 : 1;
      const sy = Y < H / 2 ? -1 : 1;
      const qx = Math.abs(X - W / 2) - (W / 2 - r);
      const qy = Math.abs(Y - H / 2) - (H / 2 - r);
      // u: distance in from the edge; (nx, ny): the outward normal
      let u: number, nx: number, ny: number;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy) || 1;
        u = r - len;
        nx = (sx * qx) / len;
        ny = (sy * qy) / len;
      } else if (qx >= qy) {
        u = r - qx;
        nx = sx;
        ny = 0;
      } else {
        u = r - qy;
        nx = 0;
        ny = sy;
      }
      let v = 0;
      if (u >= 0 && u < bezel) {
        const t = (u / bezel) * shift.length - 0.5;
        const i0 = Math.max(0, Math.min(shift.length - 1, Math.floor(t)));
        const i1 = Math.min(shift.length - 1, i0 + 1);
        const fr = Math.min(1, Math.max(0, t - i0));
        v = (shift[i0] * (1 - fr) + shift[i1] * fr) / maxShift;
      }
      const k = (py * w + px) * 4;
      // convex glass: each pixel shows the page from further in, along -n
      disp[k] = Math.round(127.5 - 127.5 * nx * v);
      disp[k + 1] = Math.round(127.5 - 127.5 * ny * v);
      disp[k + 2] = 128;
      disp[k + 3] = 255;
      if (spec && u >= 0 && u < specW) {
        const d = nx * lx + ny * ly; // facing the light (+1) or away (-1)
        const facing = Math.max(0, d) ** 1.5 + 0.45 * Math.max(0, -d) ** 1.5;
        const a = (1 - u / specW) ** 2 * facing * specK;
        spec[k] = spec[k + 1] = spec[k + 2] = 255;
        spec[k + 3] = Math.round(255 * Math.min(1, a));
      }
    }
  }
  return {
    href: toDataUrl(disp, w, h),
    specHref: spec ? toDataUrl(spec, w, h) : undefined,
    scale: 2 * maxShift,
    width: W,
    height: H,
  };
}

/** Whether this browser paints SVG filters inside backdrop-filter: Chromium on a desktop or Android. */
export function canRefract() {
  if (typeof window === "undefined" || !window.CSS?.supports?.("backdrop-filter", "url(#a)")) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  if (brands) return brands.some((b) => /^(Chromium|Google Chrome|Microsoft Edge)$/.test(b.brand));
  // userAgentData is missing on http:// origins; iOS Chrome ("CriOS") is WebKit underneath
  const ua = navigator.userAgent;
  return /\bChrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS|OPiOS/.test(ua);
}
