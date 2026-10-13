// The page's topographic contour style, shared (TOPO_BRIEF.md: "one language across the page").
// Pure math, no DOM: it runs in a worker (./topo.worker.ts) and anywhere else (a phone SVG, Node).
//
//   · the land: one believable landform, seeded and fixed (the same land on every visit): a
//     low-frequency, domain-warped simplex fBm with a regional fall to the south-east, a ridge
//     spur and a drainage, scaled to the sheet so every viewport shows the same land;
//   · the plan: marching squares → joined polylines → Chaikin smoothing, one contour every
//     INTERVAL, every MAJOR-th an index contour (drawn heavier), a few index lines labelled with
//     their elevation in small figures, set along calm stretches.

export const INTERVAL = 2; // ft
export const MAJOR = 5; // every 5th line is an index contour (10 ft)

// ─── noise ───────────────────────────────────────────────────────────────────

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GX = [1, -1, 1, -1, 1, -1, 0, 0];
const GY = [1, 1, -1, -1, 0, 0, 1, -1];
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

function makeSimplex(seed: number) {
  const rnd = mulberry(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return (xin: number, yin: number) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = perm[ii + perm[jj]] & 7;
      t0 *= t0;
      n += t0 * t0 * (GX[g] * x0 + GY[g] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = perm[ii + i1 + perm[jj + j1]] & 7;
      t1 *= t1;
      n += t1 * t1 * (GX[g] * x1 + GY[g] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = perm[ii + 1 + perm[jj + 1]] & 7;
      t2 *= t2;
      n += t2 * t2 * (GX[g] * x2 + GY[g] * y2);
    }
    return 70 * n;
  };
}

// ─── the land ────────────────────────────────────────────────────────────────

/**
 * Elevation (ft) at (u, v), both in "sheet heights" (v 0..1 top to bottom; u 0..aspect). The
 * landform is laid out in those units, so any sheet of the same height shows the same land.
 */
export function makeLand(seed = 1240) {
  const n1 = makeSimplex(seed);
  const n2 = makeSimplex(seed + 17);
  const n3 = makeSimplex(seed + 41);
  const fbm = (x: number, y: number) => {
    let a = 0;
    let amp = 1;
    let f = 1;
    for (let o = 0; o < 3; o++) {
      a += amp * n1(x * f, y * f);
      amp *= 0.42;
      f *= 2.1;
    }
    return a;
  };
  return (u: number, v: number) => {
    // a slow domain warp, so the lines meander like real ground and never look like noise
    const wu = u + 0.3 * n2(u * 0.45 + 3.1, v * 0.45 - 1.7);
    const wv = v + 0.3 * n3(u * 0.45 - 2.3, v * 0.45 + 4.2);
    // regional fall to the south-east
    let h = 1240 - 16 * wu - 22 * wv;
    // the body of the land: broad rises and hollows
    h += 22 * fbm(wu * 0.5, wv * 0.5);
    // a ridge spur running in from the north-west
    const rd = (wu * 0.55 - wv * 0.84 + 0.1) * 2.2;
    h += 12 * Math.exp(-rd * rd);
    // a drainage cutting down the east side (contours V upstream)
    const dd = (wu - 1.55 - 0.18 * Math.sin(wv * 3.2)) * 3.6;
    h -= 10 * Math.exp(-dd * dd) * (0.4 + 0.6 * wv);
    return h;
  };
}

// ─── marching squares ────────────────────────────────────────────────────────

export type Contour = { level: number; index: boolean; pts: Float32Array };

/**
 * Contours of `land` over a w × h px sheet (cell px apart), one every INTERVAL ft. Each polyline
 * is [x0, y0, x1, y1, …] in sheet px.
 */
export function contours(w: number, h: number, cell = 6, seed = 1240): Contour[] {
  const land = makeLand(seed);
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const g = new Float32Array(cols * rows);
  let lo = Infinity;
  let hi = -Infinity;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const z = land((c * cell) / h, (r * cell) / h);
      g[r * cols + c] = z;
      if (z < lo) lo = z;
      if (z > hi) hi = z;
    }
  const out: Contour[] = [];
  const first = Math.ceil(lo / INTERVAL) * INTERVAL;
  for (let level = first; level <= hi; level += INTERVAL) {
    const segs: number[] = [];
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = g[r * cols + c];
        const b = g[r * cols + c + 1];
        const cc = g[(r + 1) * cols + c + 1];
        const d = g[(r + 1) * cols + c];
        const k = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (cc > level ? 2 : 0) | (d > level ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const x = c * cell;
        const y = r * cell;
        const top = (): [number, number] => [x + (cell * (level - a)) / (b - a), y];
        const right = (): [number, number] => [x + cell, y + (cell * (level - b)) / (cc - b)];
        const bottom = (): [number, number] => [x + (cell * (level - d)) / (cc - d), y + cell];
        const left = (): [number, number] => [x, y + (cell * (level - a)) / (d - a)];
        const add = (p: [number, number], q: [number, number]) => segs.push(p[0], p[1], q[0], q[1]);
        switch (k) {
          case 1: case 14: add(left(), bottom()); break;
          case 2: case 13: add(bottom(), right()); break;
          case 3: case 12: add(left(), right()); break;
          case 4: case 11: add(top(), right()); break;
          case 6: case 9: add(top(), bottom()); break;
          case 7: case 8: add(left(), top()); break;
          case 5: add(left(), top()); add(bottom(), right()); break;
          case 10: add(top(), right()); add(left(), bottom()); break;
        }
      }
    const index = Math.round(level / INTERVAL) % MAJOR === 0;
    for (const pts of join(segs)) out.push({ level, index, pts: chaikin(pts, 2) });
  }
  return out;
}

/** Join segments that share endpoints into polylines. */
function join(segs: number[]): Float32Array[] {
  const key = (x: number, y: number) => `${Math.round(x * 8)},${Math.round(y * 8)}`;
  const n = segs.length / 4;
  const at = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    for (const e of [0, 1]) {
      const k = key(segs[i * 4 + e * 2], segs[i * 4 + e * 2 + 1]);
      const l = at.get(k);
      if (l) l.push(i);
      else at.set(k, [i]);
    }
  }
  const used = new Uint8Array(n);
  const lines: Float32Array[] = [];
  for (let s = 0; s < n; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const pts: number[] = [segs[s * 4], segs[s * 4 + 1], segs[s * 4 + 2], segs[s * 4 + 3]];
    // grow at the tail, then at the head
    for (const head of [false, true]) {
      for (;;) {
        const x = head ? pts[0] : pts[pts.length - 2];
        const y = head ? pts[1] : pts[pts.length - 1];
        const cand = at.get(key(x, y))?.find((j) => !used[j]);
        if (cand === undefined) break;
        used[cand] = 1;
        const ax = segs[cand * 4], ay = segs[cand * 4 + 1], bx = segs[cand * 4 + 2], by = segs[cand * 4 + 3];
        const same = key(ax, ay) === key(x, y);
        const nx = same ? bx : ax;
        const ny = same ? by : ay;
        if (head) pts.unshift(nx, ny);
        else pts.push(nx, ny);
      }
    }
    if (pts.length >= 8) lines.push(new Float32Array(pts));
  }
  return lines;
}

/** Chaikin corner cutting (open polylines keep their ends). */
function chaikin(p: Float32Array, n: number): Float32Array {
  let cur = p;
  for (let k = 0; k < n; k++) {
    const m = cur.length / 2;
    if (m < 3) return cur;
    const closed = Math.hypot(cur[0] - cur[cur.length - 2], cur[1] - cur[cur.length - 1]) < 0.5;
    const out: number[] = closed ? [] : [cur[0], cur[1]];
    for (let i = 0; i < m - 1; i++) {
      const x0 = cur[i * 2], y0 = cur[i * 2 + 1], x1 = cur[i * 2 + 2], y1 = cur[i * 2 + 3];
      out.push(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1, 0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1);
    }
    if (closed) out.push(out[0], out[1]);
    else out.push(cur[cur.length - 2], cur[cur.length - 1]);
    cur = new Float32Array(out);
  }
  return cur;
}

// ─── drawing ─────────────────────────────────────────────────────────────────

export type Ink = { rgb: [number, number, number]; line: number; index: number; label: number };
/** The page's two inks: dark lines on the day's grounds, light lines at night. */
export const INKS: Record<"day" | "night", Ink> = {
  day: { rgb: [23, 19, 15], line: 0.075, index: 0.13, label: 0.34 },
  night: { rgb: [255, 238, 214], line: 0.06, index: 0.11, label: 0.3 },
};

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Draw contours (sheet px) into a context already scaled to the sheet. */
export function drawContours(g: Ctx2D, cs: Contour[], ink: Ink, w: number, h: number) {
  const col = (a: number) => `rgba(${ink.rgb[0]}, ${ink.rgb[1]}, ${ink.rgb[2]}, ${a})`;
  g.lineJoin = "round";
  g.lineCap = "round";
  const path = (p: Float32Array) => {
    g.beginPath();
    g.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
  };
  g.strokeStyle = col(ink.line);
  g.lineWidth = 0.8;
  for (const c of cs) if (!c.index) (path(c.pts), g.stroke());
  g.strokeStyle = col(ink.index);
  g.lineWidth = 1.35;
  for (const c of cs) if (c.index) (path(c.pts), g.stroke());

  // a few elevation labels along long, calm index lines, spread over the sheet
  const placed: [number, number][] = [];
  const cands: { x: number; y: number; a: number; level: number; len: number }[] = [];
  for (const c of cs) {
    if (!c.index || c.pts.length < 40) continue;
    const p = c.pts;
    let len = 0;
    for (let i = 2; i < p.length; i += 2) len += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
    if (len < 260) continue;
    // the calmest stretch near the middle of the line
    const mid = (p.length / 4) | 0;
    for (const at of [mid, (mid * 0.5) | 0, (mid * 1.5) | 0]) {
      const i = Math.max(4, Math.min(p.length / 2 - 5, at));
      const x0 = p[(i - 4) * 2], y0 = p[(i - 4) * 2 + 1], x1 = p[(i + 4) * 2], y1 = p[(i + 4) * 2 + 1];
      const x = p[i * 2], y = p[i * 2 + 1];
      if (x < 40 || y < 30 || x > w - 40 || y > h - 30) continue;
      let a = Math.atan2(y1 - y0, x1 - x0);
      if (a > Math.PI / 2) a -= Math.PI;
      if (a < -Math.PI / 2) a += Math.PI;
      if (Math.abs(a) > 0.7) continue;
      cands.push({ x, y, a, level: c.level, len });
    }
  }
  cands.sort((a, b) => b.len - a.len);
  const minGap = Math.max(260, Math.min(w, h) * 0.42);
  g.font = `500 10.5px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const c of cands) {
    if (placed.length >= Math.max(4, Math.round((w * h) / 260000))) break;
    if (placed.some(([x, y]) => Math.hypot(x - c.x, y - c.y) < minGap)) continue;
    placed.push([c.x, c.y]);
    const text = Math.round(c.level).toLocaleString("en-US");
    g.save();
    g.translate(c.x, c.y);
    g.rotate(c.a);
    const tw = g.measureText(text).width;
    // knock the line out under the figures, then set them
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000";
    g.fillRect(-tw / 2 - 5, -6.5, tw + 10, 13);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = col(ink.label);
    g.fillText(text, 0, 0.5);
    g.restore();
  }
}
