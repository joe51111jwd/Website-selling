// A toolpath is the line a printer's nozzle draws: every extrusion segment, in order.
// Units are local to the object: a cube of side 1, x and z in [-0.5, 0.5], y up from 0.
// The cubes are generated here the way a slicer would: walls (perimeters) from the inside
// out, then sparse infill, with solid diagonal skins on the bottom and top layers.

export type Infill = "grid" | "gyroid" | "honeycomb";

export type CubeSpec = {
  layers: number; // how many layers the cube is drawn with on screen
  walls: number; // perimeters per layer
  infill: Infill;
  density: number; // 0..1, how dense the infill looks
  solid: number; // solid skin layers at the bottom and the top
};

export type Toolpath = {
  seg: Float32Array; // 6 floats per segment: x0 y0 z0 x1 y1 z1
  count: number; // segments
  layers: number;
  layerStart: Uint32Array; // first segment of each layer, plus a final entry = count
  cum: Float32Array; // running length at the end of each segment
  length: number;
  w: number; // bead width
  h: number; // bead height (layer height)
};

type P = [number, number];

export function cubeToolpath(spec: CubeSpec): Toolpath {
  const n = spec.layers;
  const h = 1 / n;
  const w = Math.min(h * 1.75, 0.05);
  const out: number[] = [];
  const layerStart: number[] = [];

  for (let i = 0; i < n; i++) {
    layerStart.push(out.length / 6);
    const y = i * h + h / 2;
    let prev: P | null = null;
    // join = true extrudes from the previous point (one continuous line); false is a travel move
    const line = (pts: P[], join: boolean) => {
      if (pts.length < 2) return;
      if (join && prev) out.push(prev[0], y, prev[1], pts[0][0], y, pts[0][1]);
      for (let k = 1; k < pts.length; k++) out.push(pts[k - 1][0], y, pts[k - 1][1], pts[k][0], y, pts[k][1]);
      prev = pts[pts.length - 1];
    };

    // the very first segment leads in from the centre, so the line enters the cube on its axis
    if (i === 0) prev = [0, 0];

    // walls, inside out; the seam sits on one corner like a slicer's "aligned" seam
    for (let k = spec.walls - 1; k >= 0; k--) {
      const a = 0.5 - w / 2 - k * w;
      line([[-a, -a], [a, -a], [a, a], [-a, a], [-a, -a]], true);
    }

    const b = 0.5 - spec.walls * w + w * 0.3; // infill overlaps the inner wall slightly
    const solid = i < spec.solid || i >= n - spec.solid;
    if (solid) {
      for (const l of diagonals(b, w, i % 2 ? -1 : 1)) line(l.pts, l.join);
    } else if (spec.infill === "grid") {
      // both directions on every layer, so the walls of the grid stack straight up
      const s = (w / spec.density) * 0.95;
      for (const l of diagonals(b, s, 1)) line(l.pts, l.join);
      for (const l of diagonals(b, s, -1)) line(l.pts, l.join);
    } else if (spec.infill === "gyroid") {
      for (const l of gyroid(b, (w / spec.density) * 2.1, y)) line(l, false);
    } else {
      for (const l of honeycomb(b, (w / spec.density) * 0.95)) line(l, false);
    }

    // last layer: lead out to the top centre, where the line leaves for the next piece
    if (i === n - 1 && prev) out.push((prev as P)[0], y, (prev as P)[1], 0, y, 0);
  }
  layerStart.push(out.length / 6);

  const seg = new Float32Array(out);
  const count = seg.length / 6;
  const cum = new Float32Array(count);
  let len = 0;
  for (let s = 0; s < count; s++) {
    const o = s * 6;
    len += Math.hypot(seg[o + 3] - seg[o], seg[o + 4] - seg[o + 1], seg[o + 5] - seg[o + 2]);
    cum[s] = len;
  }
  return { seg, count, layers: n, layerStart: new Uint32Array(layerStart), cum, length: len, w, h };
}

// Parallel lines at ±45° across the square [-b, b]², printed back and forth (boustrophedon).
function diagonals(b: number, spacing: number, sign: 1 | -1): { pts: P[]; join: boolean }[] {
  const d: P = [Math.SQRT1_2, sign * Math.SQRT1_2]; // direction of travel along a line
  const nrm: P = [-d[1], d[0]]; // offset direction between lines
  const extent = b * Math.SQRT2;
  const res: { pts: P[]; join: boolean }[] = [];
  let flip = false;
  for (let c = -extent + spacing * 0.5; c < extent; c += spacing) {
    const ox = nrm[0] * c;
    const oz = nrm[1] * c;
    let t0 = -Infinity;
    let t1 = Infinity;
    for (const [o, dd] of [[ox, d[0]], [oz, d[1]]] as P[]) {
      const ta = (-b - o) / dd;
      const tb = (b - o) / dd;
      t0 = Math.max(t0, Math.min(ta, tb));
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t1 - t0 < spacing * 0.2) continue;
    const a: P = [ox + d[0] * t0, oz + d[1] * t0];
    const e: P = [ox + d[0] * t1, oz + d[1] * t1];
    res.push({ pts: flip ? [e, a] : [a, e], join: res.length > 0 });
    flip = !flip;
  }
  return res;
}

// Gyroid infill: the slice of sin X cos Y + sin Y cos Z + sin Z cos X = 0 at this layer's height.
// Solved for one coordinate in terms of the other, picking whichever runs smoothly at this height,
// which is how slicers lay it down: wavy lines that turn 90° every half period.
function gyroid(b: number, period: number, y: number): P[][] {
  const k = (Math.PI * 2) / period;
  const Y = y * k;
  const alongX = Math.abs(Math.sin(Y)) >= Math.abs(Math.cos(Y));
  const lim = b * k;
  const steps = Math.max(8, Math.round((b * 2) / (period / 5)));
  const lines: { pts: P[]; key: number }[] = [];
  const nMin = Math.floor((-lim - 2 * Math.PI) / (2 * Math.PI)) - 1;
  const nMax = Math.ceil((lim + 2 * Math.PI) / (2 * Math.PI)) + 1;

  for (let branch = 0; branch < 2; branch++) {
    for (let n = nMin; n <= nMax; n++) {
      let cur: P[] = [];
      let last = NaN;
      const flush = () => {
        if (cur.length > 1) lines.push({ pts: cur, key: cur.reduce((s, p) => s + (alongX ? p[1] : p[0]), 0) / cur.length });
        cur = [];
      };
      for (let s = 0; s <= steps; s++) {
        const U = -lim + (2 * lim * s) / steps;
        // alongX: solve Z(X) from cos X sin Z + sin Y cos Z = -sin X cos Y
        // else:   solve X(Z) from cos Y sin X + sin Z cos X = -sin Y cos Z
        const p = alongX ? Math.cos(U) : Math.cos(Y);
        const q = alongX ? Math.sin(Y) : Math.sin(U);
        const r = alongX ? -Math.sin(U) * Math.cos(Y) : -Math.sin(Y) * Math.cos(U);
        const R = Math.hypot(p, q);
        const th = Math.atan2(q, p);
        const ratio = r / R;
        if (Math.abs(ratio) > 1) { flush(); last = NaN; continue; }
        const as = Math.asin(ratio);
        const V = (branch === 0 ? as : Math.PI - as) - th + 2 * Math.PI * n;
        if (Math.abs(V) > lim || (!Number.isNaN(last) && Math.abs(V - last) > Math.PI * 0.6)) {
          flush();
          last = Math.abs(V) > lim ? NaN : V;
          if (Math.abs(V) <= lim) cur.push(alongX ? [U / k, V / k] : [V / k, U / k]);
          continue;
        }
        cur.push(alongX ? [U / k, V / k] : [V / k, U / k]);
        last = V;
      }
      flush();
    }
  }
  lines.sort((a, c) => a.key - c.key);
  return lines.map((l, i) => (i % 2 ? l.pts.reverse() : l.pts));
}

// Honeycomb infill: zigzags that meet their neighbours on the flats, so the cells are hexagons.
function honeycomb(b: number, L: number): P[][] {
  const dz = (L * Math.sqrt(3)) / 2;
  const period = 3 * L;
  const A = (x: number) => {
    const m = (((x % period) + period) % period);
    if (m < L) return 0;
    if (m < 1.5 * L) return ((m - L) / (0.5 * L)) * dz;
    if (m < 2.5 * L) return dz;
    return (1 - (m - 2.5 * L) / (0.5 * L)) * dz;
  };
  // breakpoints of the zigzag inside [-b, b]
  const xs: number[] = [-b];
  const start = Math.floor(-b / period) * period;
  for (let x0 = start; x0 < b; x0 += period) {
    for (const off of [0, L, 1.5 * L, 2.5 * L]) {
      const x = x0 + off;
      if (x > -b && x < b) xs.push(x);
    }
  }
  xs.push(b);
  xs.sort((a, c) => a - c);

  const lines: P[][] = [];
  const jMin = Math.floor(-b / dz) - 2;
  const jMax = Math.ceil(b / dz) + 1;
  for (let j = jMin; j <= jMax; j++) {
    const even = ((j % 2) + 2) % 2 === 0;
    const z = (x: number) => (even ? j * dz + A(x) : (j + 1) * dz - A(x));
    let cur: P[] = [];
    for (let s = 0; s < xs.length - 1; s++) {
      const clipped = clipZ([xs[s], z(xs[s])], [xs[s + 1], z(xs[s + 1])], b);
      if (!clipped) {
        if (cur.length > 1) lines.push(cur);
        cur = [];
        continue;
      }
      const [p0, p1] = clipped;
      if (cur.length && (Math.abs(cur[cur.length - 1][0] - p0[0]) > 1e-6 || Math.abs(cur[cur.length - 1][1] - p0[1]) > 1e-6)) {
        if (cur.length > 1) lines.push(cur);
        cur = [];
      }
      if (!cur.length) cur.push(p0);
      cur.push(p1);
    }
    if (cur.length > 1) lines.push(cur);
  }
  return lines.map((l, i) => (i % 2 ? l.reverse() : l));
}

function clipZ(a: P, c: P, b: number): [P, P] | null {
  let t0 = 0;
  let t1 = 1;
  const dz = c[1] - a[1];
  if (Math.abs(dz) < 1e-9) {
    if (Math.abs(a[1]) > b) return null;
  } else {
    const ta = (-b - a[1]) / dz;
    const tb = (b - a[1]) / dz;
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
    if (t1 - t0 < 1e-6) return null;
  }
  const lerp = (t: number): P => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
  return [lerp(t0), lerp(t1)];
}

// Where the nozzle is at progress p (0..1). Progress runs one layer at a time, so the piece
// grows at an even rate; inside a layer it follows the line's length.
export function locate(tp: Toolpath, p: number): { index: number; frac: number } {
  if (p <= 0) return { index: -1, frac: 0 };
  if (p >= 1) return { index: tp.count - 1, frac: 1 };
  const lf = p * tp.layers;
  const layer = Math.min(tp.layers - 1, Math.floor(lf));
  const f = lf - layer;
  const s0 = tp.layerStart[layer];
  const s1 = tp.layerStart[layer + 1];
  if (s1 <= s0) return { index: s0 - 1, frac: 1 };
  const base = s0 > 0 ? tp.cum[s0 - 1] : 0;
  const target = base + (tp.cum[s1 - 1] - base) * f;
  let lo = s0;
  let hi = s1 - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tp.cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const segStart = lo > 0 ? tp.cum[lo - 1] : 0;
  const segLen = tp.cum[lo] - segStart;
  return { index: lo, frac: segLen > 0 ? (target - segStart) / segLen : 1 };
}
