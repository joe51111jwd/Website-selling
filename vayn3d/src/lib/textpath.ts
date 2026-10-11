import type { Toolpath } from "./toolpath";

// Turns a line of DOM text into a print: the toolpath a slicer would make for that word cut
// out of a flat sheet. Letter by letter, two perimeters run just inside the outline, then a
// 45° solid infill fills what's left, so the nozzle looks like it's writing the word.
//
// Coordinates are CSS pixels from the element's top-left: x right, z down, y up off the bed.

export type TextPrint = {
  tp: Toolpath;
  ghost: Float32Array; // the outline as line-segment pairs (x, y, z), for the dashed preview
  key: string; // what it was built from; rebuild when this changes
  fontPx: number;
};

type P = [number, number];

const STRETCH: Record<string, string> = {
  "50%": "ultra-condensed",
  "62.5%": "extra-condensed",
  "75%": "condensed",
  "87.5%": "semi-condensed",
  "100%": "normal",
  "112.5%": "semi-expanded",
  "125%": "expanded",
  "150%": "extra-expanded",
};

// What a title's toolpath depends on; when this is unchanged there's nothing to rebuild.
export function textKey(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return `${(el.textContent ?? "").trim()}|${cs.fontFamily}|${cs.fontWeight}|${cs.fontStretch}|${cs.fontSize}|${Math.round(el.getBoundingClientRect().width)}`;
}

export function textToolpath(el: HTMLElement): TextPrint | null {
  const text = (el.textContent ?? "").trim();
  if (!text) return null;
  const cs = getComputedStyle(el);
  const fontPx = parseFloat(cs.fontSize);
  const rect = el.getBoundingClientRect();
  const key = textKey(el);

  const R = fontPx < 90 ? 2 : 1.5; // canvas pixels per CSS pixel
  const pad = Math.ceil(fontPx * 0.2);
  const lineH = parseFloat(cs.lineHeight) || rect.height || fontPx;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const setFont = () => {
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontPx * R}px ${cs.fontFamily}`;
    const cx = ctx as CanvasRenderingContext2D;
    if ("fontStretch" in cx) cx.fontStretch = (STRETCH[cs.fontStretch] ?? "normal") as CanvasFontStretch;
    if ("letterSpacing" in cx) cx.letterSpacing = `${(parseFloat(cs.letterSpacing) || 0) * R}px`;
  };
  setFont();
  const m = ctx.measureText(text);
  const W = Math.ceil(m.width / R + pad * 2);
  const H = Math.ceil(lineH + pad * 2);
  c.width = Math.ceil(W * R);
  c.height = Math.ceil(H * R);
  setFont(); // resizing the canvas resets its state
  const fA = (m.fontBoundingBoxAscent ?? fontPx * R * 0.9) / R;
  const fD = (m.fontBoundingBoxDescent ?? fontPx * R * 0.25) / R;
  const baseline = pad + (lineH - (fA + fD)) / 2 + fA; // where CSS puts the baseline in the line box
  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, pad * R, baseline * R);

  // where each letter sits, to print one letter at a time
  const edges: number[] = [];
  for (let i = 0; i <= text.length; i++) edges.push(pad + ctx.measureText(text.slice(0, i)).width / R);

  // inside distance field (CSS px): how far each inside pixel is from the outline
  const gw = c.width;
  const gh = c.height;
  const alpha = ctx.getImageData(0, 0, gw, gh).data;
  const d = distanceField(alpha, gw, gh);
  for (let i = 0; i < d.length; i++) d[i] /= R;

  const bead = Math.min(4.2, Math.max(2.2, fontPx * 0.034));
  const h = bead * 0.62;
  const toCss = (p: P): P => [p[0] / R - pad, p[1] / R - pad];

  const outer = contours(d, gw, gh, bead * 0.5).map((l) => simplify(l, 0.45 * R).map(toCss));
  const inner = contours(d, gw, gh, bead * 1.5).map((l) => simplify(l, 0.45 * R).map(toCss));
  const hatch = hatchLines(d, gw, gh, bead * 1.95, bead * R).map((s) => s.map(toCss) as [P, P]);

  // group everything by letter, left to right
  const slot = (x: number) => {
    const X = x + pad;
    for (let i = 0; i < text.length; i++) if (X < edges[i + 1]) return i;
    return text.length - 1;
  };
  const midX = (l: P[]) => {
    let a = Infinity;
    let b = -Infinity;
    for (const p of l) {
      a = Math.min(a, p[0]);
      b = Math.max(b, p[0]);
    }
    return (a + b) / 2;
  };
  const letters = Array.from({ length: text.length }, () => ({ loops: [] as P[][], fill: [] as [P, P][] }));
  for (const l of [...inner, ...outer]) if (l.length > 2) letters[slot(midX(l))].loops.push(l);
  for (const s of hatch) letters[slot((s[0][0] + s[1][0]) / 2)].fill.push(s);

  const out: number[] = [];
  const y = h / 2;
  let prev: P | null = null;
  const seg = (a: P, b: P) => out.push(a[0], y, a[1], b[0], y, b[1]);
  for (const L of letters) {
    for (const loop of L.loops) {
      // start each loop at the point nearest the nozzle
      let k = 0;
      if (prev) {
        let best = Infinity;
        loop.forEach((p, i) => {
          const dd = (p[0] - prev![0]) ** 2 + (p[1] - prev![1]) ** 2;
          if (dd < best) (best = dd), (k = i);
        });
      }
      const n = loop.length;
      for (let i = 0; i < n; i++) seg(loop[(k + i) % n], loop[(k + i + 1) % n]);
      prev = loop[k];
    }
    // infill: back and forth, joining neighbouring lines along the edge like a slicer does
    let flip = false;
    for (const s of L.fill) {
      const [a, b] = flip ? [s[1], s[0]] : s;
      if (prev && Math.hypot(a[0] - prev[0], a[1] - prev[1]) < bead * 2.2) seg(prev, a);
      seg(a, b);
      prev = b;
      flip = !flip;
    }
  }
  if (!out.length) return null;

  const segs = new Float32Array(out);
  const count = segs.length / 6;
  const cum = new Float32Array(count);
  let len = 0;
  for (let s = 0; s < count; s++) {
    const o = s * 6;
    len += Math.hypot(segs[o + 3] - segs[o], segs[o + 5] - segs[o + 2]);
    cum[s] = len;
  }
  const ghost: number[] = [];
  for (const l of outer) for (let i = 0; i < l.length; i++) {
    const a = l[i];
    const b = l[(i + 1) % l.length];
    ghost.push(a[0], 0, a[1], b[0], 0, b[1]);
  }
  return {
    tp: { seg: segs, count, layers: 1, layerStart: new Uint32Array([0, count]), cum, length: len, w: bead, h },
    ghost: new Float32Array(ghost),
    key,
    fontPx,
  };
}

// Two-pass chamfer distance (in canvas px) from each inside pixel to the nearest outside one.
function distanceField(alpha: Uint8ClampedArray, w: number, h: number) {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = alpha[i * 4 + 3] > 127 ? INF : 0;
  const D = Math.SQRT2;
  for (let y = 1; y < h; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i - 1] + 1, d[i - w] + 1, d[i - w - 1] + D, d[i - w + 1] + D);
    }
  for (let y = h - 2; y >= 0; y--)
    for (let x = w - 2; x >= 1; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i + 1] + 1, d[i + w] + 1, d[i + w + 1] + D, d[i + w - 1] + D);
    }
  // sample at pixel centres: an inside pixel next to the edge is half a pixel in
  for (let i = 0; i < w * h; i++) if (d[i]) d[i] -= 0.5;
  return d;
}

// Marching squares: closed contour loops of the field at one level, as canvas-pixel points.
function contours(f: Float32Array, w: number, h: number, level: number): P[][] {
  const next = new Map<number, number>(); // edge id -> next edge id, walking with inside on the left
  const pts = new Map<number, P>();
  // edge ids: horizontal edge (x,y)-(x+1,y) = 2*(y*w+x); vertical (x,y)-(x,y+1) = 2*(y*w+x)+1
  const H = (x: number, y: number) => 2 * (y * w + x);
  const Vv = (x: number, y: number) => 2 * (y * w + x) + 1;
  const v = (x: number, y: number) => f[y * w + x];
  const point = (id: number): P => {
    let p = pts.get(id);
    if (p) return p;
    const cell = id >> 1;
    const x = cell % w;
    const y = (cell - x) / w;
    if (id & 1) {
      const a = v(x, y);
      const b = v(x, y + 1);
      p = [x, y + (level - a) / (b - a)];
    } else {
      const a = v(x, y);
      const b = v(x + 1, y);
      p = [x + (level - a) / (b - a), y];
    }
    pts.set(id, p);
    return p;
  };
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w - 1; x++) {
      const tl = v(x, y) > level ? 1 : 0;
      const tr = v(x + 1, y) > level ? 1 : 0;
      const br = v(x + 1, y + 1) > level ? 1 : 0;
      const bl = v(x, y + 1) > level ? 1 : 0;
      const code = tl * 8 + tr * 4 + br * 2 + bl;
      if (code === 0 || code === 15) continue;
      const top = H(x, y);
      const bottom = H(x, y + 1);
      const left = Vv(x, y);
      const right = Vv(x + 1, y);
      const link = (a: number, b: number) => next.set(a, b);
      switch (code) {
        case 1: link(bottom, left); break;
        case 2: link(right, bottom); break;
        case 3: link(right, left); break;
        case 4: link(top, right); break;
        case 5: {
          const mid = (v(x, y) + v(x + 1, y) + v(x + 1, y + 1) + v(x, y + 1)) / 4 > level;
          if (mid) { link(top, left); link(bottom, right); } else { link(top, right); link(bottom, left); }
          break;
        }
        case 6: link(top, bottom); break;
        case 7: link(top, left); break;
        case 8: link(left, top); break;
        case 9: link(bottom, top); break;
        case 10: {
          const mid = (v(x, y) + v(x + 1, y) + v(x + 1, y + 1) + v(x, y + 1)) / 4 > level;
          if (mid) { link(left, bottom); link(right, top); } else { link(left, top); link(right, bottom); }
          break;
        }
        case 11: link(right, top); break;
        case 12: link(left, right); break;
        case 13: link(bottom, right); break;
        case 14: link(left, bottom); break;
      }
    }
  const loops: P[][] = [];
  const seen = new Set<number>();
  for (const startId of next.keys()) {
    if (seen.has(startId)) continue;
    const loop: P[] = [];
    let id: number | undefined = startId;
    while (id !== undefined && !seen.has(id)) {
      seen.add(id);
      loop.push(point(id));
      id = next.get(id);
    }
    if (loop.length > 3) loops.push(loop);
  }
  return loops;
}

// Ramer–Douglas–Peucker on a closed loop.
function simplify(loop: P[], eps: number): P[] {
  if (loop.length < 8) return loop;
  const rdp = (pts: P[]): P[] => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1e-9;
    let best = -1;
    let bi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const dist = Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dx) / L;
      if (dist > best) (best = dist), (bi = i);
    }
    if (best <= eps) return [a, b];
    return [...rdp(pts.slice(0, bi + 1)).slice(0, -1), ...rdp(pts.slice(bi))];
  };
  const half = loop.length >> 1;
  const out = [...rdp(loop.slice(0, half + 1)).slice(0, -1), ...rdp([...loop.slice(half), loop[0]]).slice(0, -1)];
  return out.length > 2 ? out : loop;
}

// Solid infill: 45° lines, `spacing` canvas px apart, wherever the field is above `level`.
function hatchLines(f: Float32Array, w: number, h: number, level: number, spacing: number): [P, P][] {
  const out: [P, P][] = [];
  const at = (x: number, y: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    return xi >= 0 && yi >= 0 && xi < w && yi < h ? f[yi * w + xi] : 0;
  };
  // lines x - y = c, walked top to bottom
  const step = 0.7;
  let n = 0;
  for (let c = -h; c < w; c += spacing, n++) {
    const y0 = Math.max(0, -c);
    const y1 = Math.min(h - 1, w - 1 - c);
    let runStart: P | null = null;
    const runs: [P, P][] = [];
    for (let y = y0; y <= y1; y += step) {
      const x = c + y;
      const inside = at(x, y) > level;
      if (inside && !runStart) runStart = [x, y];
      if (!inside && runStart) {
        if (Math.hypot(x - runStart[0], y - runStart[1]) > spacing * 0.6) runs.push([runStart, [x - step, y - step]]);
        runStart = null;
      }
    }
    if (n % 2) runs.reverse();
    out.push(...runs);
  }
  return out;
}
