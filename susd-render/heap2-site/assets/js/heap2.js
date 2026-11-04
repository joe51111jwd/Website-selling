/* Scaling Up-Side-Down: The Heap v2, clean. The real-time scene (three.js r160, vendored next to this file).
   Everything on screen is a pure function of the story clock t in [0, 1] (window.SUSD.t, set from the scroll by
   page.js), so scrolling back and forth always shows the same picture. The only clock-time motion is the intro, where
   the cables draw themselves into the title letters (about 1.6 s, skipped under reduced motion).
   Objects only: a seamless studio sweep, cables (tubes rebuilt in place, no allocation per frame) and white mugs.
   One mug is one person; one cable is one pair of people. The beat table is T below (see docs/11-HEAP2-CLEAN.md). */
import * as THREE from './three.module.js';
import { RoomEnvironment } from './RoomEnvironment.js';

const html = document.documentElement;
const SUSD = window.SUSD || (window.SUSD = {});
const params = new URLSearchParams(location.search);
const RM = html.classList.contains('rm');
const NOINTRO = RM || params.has('nointro');

// ---- small math ----------------------------------------------------------------------------------------------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lin = (a, b, x) => clamp01((x - a) / (b - a));
const ss = (x) => x * x * (3 - 2 * x);
const s5 = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const lerp = (a, b, u) => a + (b - a) * u;

// ---- the beat table (t = scroll progress through the story) -------------------------------------------------------
const T = {
  fall: [0.040, 0.080], fallDur: 0.034,                    // letters fall (start window per letter, then duration)
  // the first four arrive slowly, and two mugs with their one cable, and four with their six, are held a moment
  // before the next mug comes; then mugs 5-15 come fast
  cups: [0.150, 0.190, 0.236, 0.280, 0.336, 0.350, 0.364, 0.378, 0.392, 0.406, 0.420, 0.434, 0.448, 0.459, 0.470],
  pull: [0.495, 0.575],                                    // the weight drags the mugs in
  freeze: 0.575,                                           // from here the scene stops (the wait)
  dark: [0.575, 0.610], light: [0.800, 0.850],
  roll: [0.685, 0.745],                                    // turns upside down
  sag: [0.700, 0.790], unsag: [0.800, 0.848],              // upside down, the heap hangs lower: a weight pulling down
  settle: [0.800, 0.862],                                  // right side up again, the mugs leave and the peak settles
  unroll: [0.800, 0.860],                                  // ... and on round, right side up again
  stand: [0.800, 0.860],                                   // the mugs stand up and regroup
  bundles: [[0.840, 0.885], [0.878, 0.922], [0.915, 0.958]],
};
// reduced motion: hard cuts between held states (from t, to the t that is shown)
const RM_STEPS = [[0, 0], [0.06, 0.230], [0.262, 0.332], [0.336, 0.392], [0.430, 0.492], [0.530, 0.680], [0.700, 0.775], [0.800, 0.965], [0.975, 1]];
function tEff(t) { if (!RM) return t; let v = 0; for (const s of RM_STEPS) if (t >= s[0]) v = s[1]; return v; }

// ---- renderer, scene, light ---------------------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const phoneUA = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('shots') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phoneUA ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const SWEEP = new THREE.Color('#c9c2b6');
renderer.setClearColor('#b9b2a6');

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.fog = new THREE.Fog('#b9b2a6', 24, 52);

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);

const key = new THREE.SpotLight('#fff6ea', 330, 0, 0.62, 0.95, 2);
key.position.set(-5.5, 12, 8);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(phoneUA ? 1024 : 2048, phoneUA ? 1024 : 2048);   // phones: a smaller shadow map (GPU fill)
key.shadow.camera.near = 6; key.shadow.camera.far = 30;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
key.shadow.radius = 3;
scene.add(key, key.target);
const fill = new THREE.HemisphereLight('#f4efe6', '#b9b2a6', 0.18);
scene.add(fill);

// the sweep: floor curving up into a back wall, one matte surface
{
  const prof = [];                                         // (z, y, nz, ny) along the profile, front to back
  for (let z = 18; z > -3; z -= 1.5) prof.push([z, 0, 0, 1]);
  const R = 6, cz = -3, cy = R;                            // the cove: centre (z cz, y R), a quarter circle
  for (let i = 0; i <= 16; i++) { const f = (i / 16) * (Math.PI / 2); prof.push([cz - R * Math.sin(f), R - R * Math.cos(f), Math.sin(f), Math.cos(f)]); }
  for (let y = cy + 1.5; y < 30; y += 2) prof.push([cz - R, y, 1, 0]);
  const xs = [-40, 40], pos = [], nor = [], idx = [];
  prof.forEach((p) => xs.forEach((x) => { pos.push(x, p[1], p[0]); nor.push(0, p[3], p[2]); }));
  for (let i = 0; i < prof.length - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const m = new THREE.MeshStandardMaterial({ color: SWEEP, roughness: 0.94, metalness: 0, envMapIntensity: 0.32, side: THREE.DoubleSide });
  const sweep = new THREE.Mesh(g, m);
  sweep.receiveShadow = true;
  scene.add(sweep);
}

// ---- tubes: a centreline of N points, rebuilt into a round tube in place -------------------------------------------
const RAD = 7;                                             // radial segments
const COS = new Float32Array(RAD + 1), SIN = new Float32Array(RAD + 1);
for (let j = 0; j <= RAD; j++) { COS[j] = Math.cos((j / RAD) * Math.PI * 2); SIN[j] = Math.sin((j / RAD) * Math.PI * 2); }
// all the cables share ONE mesh (one draw call, one shadow call instead of 105 of each): each cable owns a slice of
// its buffers, colour per vertex, and only the slices that changed this frame are uploaded
class TubePool {
  constructor(count, N, material) {
    const nvT = N * (RAD + 1), nv = nvT * count, per = (N - 1) * RAD * 6;
    this.nvT = nvT; this.next = 0;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3); this.col = new Float32Array(nv * 3).fill(1);
    const idx = new Uint16Array(count * per);
    for (let k = 0, o = 0; k < count; k++) for (let i = 0; i < N - 1; i++) for (let j = 0; j < RAD; j++) {
      const a = k * nvT + i * (RAD + 1) + j, b = a + RAD + 1;
      idx[o++] = a; idx[o++] = b; idx[o++] = a + 1; idx[o++] = b; idx[o++] = b + 1; idx[o++] = a + 1;
    }
    for (let v = 0; v < nv; v++) this.pos[v * 3 + 1] = -50;   // every slice starts folded away under the floor
    const g = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.na = new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage);
    this.ca = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('normal', this.na); g.setAttribute('color', this.ca); g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
    this.lo = Infinity; this.hi = -1; this.clo = Infinity; this.chi = -1;
  }
  take() { return this.next++ * this.nvT; }
  mark(v0, nv) { this.lo = Math.min(this.lo, v0 * 3); this.hi = Math.max(this.hi, (v0 + nv) * 3); }
  markCol(v0, nv) { this.clo = Math.min(this.clo, v0 * 3); this.chi = Math.max(this.chi, (v0 + nv) * 3); }
  flush() {   // one upload range per attribute: the span of the slices that changed
    if (this.hi > this.lo) {
      for (const a of [this.pa, this.na]) { a.clearUpdateRanges(); a.addUpdateRange(this.lo, this.hi - this.lo); a.needsUpdate = true; }
      this.lo = Infinity; this.hi = -1;
    }
    if (this.chi > this.clo) { this.ca.clearUpdateRanges(); this.ca.addUpdateRange(this.clo, this.chi - this.clo); this.ca.needsUpdate = true; this.clo = Infinity; this.chi = -1; }
  }
}
class Tube {
  constructor(N, radius, material, pool) {
    this.N = N; this.radius = radius;
    const nv = N * (RAD + 1);
    this.pts = new Float32Array(N * 3);
    this.prof = new Float32Array(N).fill(1);
    this.prof[0] = this.prof[N - 1] = 0.3; this.prof[1] = this.prof[N - 2] = 0.86; this.prof[2] = this.prof[N - 3] = 0.97;
    if (pool) {
      // a slice of the shared mesh; "mesh.visible" folds the slice away (or marks it for the next build)
      const v0 = pool.take(), self = this; let vis = false;
      this.pool = pool; this.v0 = v0; this.nv = nv;
      this.pos = pool.pos.subarray(v0 * 3, (v0 + nv) * 3); this.nor = pool.nor.subarray(v0 * 3, (v0 + nv) * 3); this.col = pool.col.subarray(v0 * 3, (v0 + nv) * 3);
      this.cr = -1; this.cg = -1; this.cb = -1;
      this.mesh = { get visible() { return vis; }, set visible(v) { if (v === vis) return; vis = v; if (!v) self.fold(); } };
      return;
    }
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3);
    const idx = new Uint16Array((N - 1) * RAD * 6);
    let o = 0;
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < RAD; j++) {
      const a = i * (RAD + 1) + j, b = a + RAD + 1;
      idx[o++] = a; idx[o++] = b; idx[o++] = a + 1; idx[o++] = b; idx[o++] = b + 1; idx[o++] = a + 1;
    }
    const g = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.na = new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('normal', this.na); g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
  }
  fold() { const P = this.pos; for (let i = 0; i < P.length; i += 3) { P[i] = 0; P[i + 1] = -50; P[i + 2] = 0; } this.pool.mark(this.v0, this.nv); }
  setColor(c) {
    if (c.r === this.cr && c.g === this.cg && c.b === this.cb) return;
    this.cr = c.r; this.cg = c.g; this.cb = c.b;
    const C = this.col; for (let i = 0; i < C.length; i += 3) { C[i] = c.r; C[i + 1] = c.g; C[i + 2] = c.b; }
    this.pool.markCol(this.v0, this.nv);
  }
  build(rs = 1) {
    const P = this.pts, N = this.N, pos = this.pos, nor = this.nor, r = this.radius * rs, pr = this.prof;
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < N; i++) {
      const i0 = i > 0 ? i - 1 : 0, i1 = i < N - 1 ? i + 1 : N - 1;
      let tx = P[i1 * 3] - P[i0 * 3], ty = P[i1 * 3 + 1] - P[i0 * 3 + 1], tz = P[i1 * 3 + 2] - P[i0 * 3 + 2];
      let tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;   // sqrt, not hypot: hot loop
      if (i === 0) {                                       // first normal: perpendicular to the tangent
        if (Math.abs(ty) < 0.9) { nx = -tz; ny = 0; nz = tx; } else { nx = 0; ny = tz; nz = -ty; }
      } else {                                             // parallel transport
        const dt = nx * tx + ny * ty + nz * tz; nx -= tx * dt; ny -= ty * dt; nz -= tz * dt;
      }
      let nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl < 1e-6) { if (Math.abs(ty) < 0.9) { nx = -tz; ny = 0; nz = tx; } else { nx = 0; ny = tz; nz = -ty; } nl = Math.hypot(nx, ny, nz) || 1; }
      nx /= nl; ny /= nl; nz /= nl;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      let px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2]; const rr = r * pr[i];
      if (i === 0 || i === N - 1) { const n = i === 0 ? 1 : N - 2; px = P[n * 3] + (px - P[n * 3]) * 0.45; py = P[n * 3 + 1] + (py - P[n * 3 + 1]) * 0.45; pz = P[n * 3 + 2] + (pz - P[n * 3 + 2]) * 0.45; }   // a short, blunt end
      for (let j = 0; j <= RAD; j++) {
        const c = COS[j], s = SIN[j];
        const dx = c * nx + s * bx, dy = c * ny + s * by, dz = c * nz + s * bz, o = (i * (RAD + 1) + j) * 3;
        pos[o] = px + rr * dx; pos[o + 1] = py + rr * dy; pos[o + 2] = pz + rr * dz;
        nor[o] = dx; nor[o + 1] = dy; nor[o + 2] = dz;
      }
    }
    if (this.pool) this.pool.mark(this.v0, this.nv); else { this.pa.needsUpdate = true; this.na.needsUpdate = true; }
  }
}

// centripetal Catmull-Rom through C (nC points, flat), sampled over parameter [u0, u1] into N points of out.
// The knot intervals are worked out once per segment (the samples run through the segments in order).
function crSample(C, nC, u0, u1, N, out) {
  const segs = nC - 1;
  let cs = -1, t1 = 0, t2 = 0, t3 = 0;
  for (let i = 0; i < N; i++) {
    const u = u0 + ((u1 - u0) * i) / (N - 1);
    let f = u * segs, s = Math.floor(f);
    s = Math.max(0, Math.min(segs - 1, s));
    const lt = f - s;
    if (s !== cs) {
      cs = s;
      for (let k = 0; k < 3; k++) {
        const p1 = C[s * 3 + k], p2 = C[(s + 1) * 3 + k];
        W[3 + k] = p1; W[6 + k] = p2;
        W[k] = s >= 1 ? C[(s - 1) * 3 + k] : 2 * p1 - p2;
        W[9 + k] = nC - s >= 3 ? C[(s + 2) * 3 + k] : 2 * p2 - p1;
      }
      t1 = Math.max(Math.pow(dist2(0, 3), 0.25), 1e-4); t2 = t1 + Math.max(Math.pow(dist2(3, 6), 0.25), 1e-4); t3 = t2 + Math.max(Math.pow(dist2(6, 9), 0.25), 1e-4);
    }
    const tt = t1 + lt * (t2 - t1);
    for (let k = 0; k < 3; k++) {
      const p0 = W[k], p1 = W[3 + k], p2 = W[6 + k], p3 = W[9 + k];
      const A1 = ((t1 - tt) / t1) * p0 + (tt / t1) * p1;
      const A2 = ((t2 - tt) / (t2 - t1)) * p1 + ((tt - t1) / (t2 - t1)) * p2;
      const A3 = ((t3 - tt) / (t3 - t2)) * p2 + ((tt - t2) / (t3 - t2)) * p3;
      const B1 = ((t2 - tt) / t2) * A1 + (tt / t2) * A2;
      const B2 = ((t3 - tt) / (t3 - t1)) * A2 + ((tt - t1) / (t3 - t1)) * A3;
      out[i * 3 + k] = ((t2 - tt) / (t2 - t1)) * B1 + ((tt - t1) / (t2 - t1)) * B2;
    }
  }
}
const W = new Float64Array(12);
function dist2(a, b) { const x = W[a] - W[b], y = W[a + 1] - W[b + 1], z = W[a + 2] - W[b + 2]; return x * x + y * y + z * z; }

// resample a polyline (array of [x, y]) by arc length into n points
function resample(pl, n, closed) {
  const pts = closed ? pl.concat([pl[0]]) : pl.slice();
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1], out = []; let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (tot * i) / (n - 1);
    while (j < L.length - 2 && L[j + 1] < d) j++;
    const u = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u)]);
  }
  return out;
}
function smooth(pl, passes, closed) {
  let p = pl;
  for (let k = 0; k < passes; k++) {
    const q = p.map((v) => v.slice());
    for (let i = 0; i < p.length; i++) {
      if (!closed && (i === 0 || i === p.length - 1)) continue;
      const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length];
      q[i] = [(a[0] + 2 * p[i][0] + b[0]) / 4, (a[1] + 2 * p[i][1] + b[1]) / 4];
    }
    p = q;
  }
  return p;
}

// ---- the title, bent from cable: single-stroke capitals (our own centrelines, cap height 1) ------------------------
function arc(cx, cy, rx, ry, a0, a1, n = 28) { const o = []; for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
const GLYPH = {
  S: { w: 0.60, s: [[...arc(0.30, 0.755, 0.255, 0.245, 28, 270), ...arc(0.305, 0.255, 0.275, 0.255, 90, -150)]] },
  C: { w: 0.64, s: [arc(0.35, 0.5, 0.33, 0.5, 48, 312)] },
  A: { w: 0.70, s: [[[0.02, 0], [0.35, 1], [0.68, 0]], [[0.15, 0.33], [0.55, 0.33]]] },
  L: { w: 0.50, s: [[[0.05, 1], [0.05, 0], [0.50, 0]]] },
  I: { w: 0.14, s: [[[0.07, 0], [0.07, 1]]] },
  N: { w: 0.66, s: [[[0.05, 0], [0.05, 1], [0.61, 0], [0.61, 1]]] },
  G: { w: 0.68, s: [[...arc(0.36, 0.5, 0.33, 0.5, 48, 360), [0.69, 0.46], [0.42, 0.46]]] },
  U: { w: 0.62, s: [[[0.05, 1], [0.05, 0.31], ...arc(0.31, 0.31, 0.26, 0.31, 180, 360), [0.57, 1]]] },
  P: { w: 0.58, s: [[[0.05, 0], [0.05, 1], [0.30, 1], ...arc(0.30, 0.74, 0.26, 0.26, 90, -90), [0.05, 0.48]]] },
  '-': { w: 0.38, s: [[[0.05, 0.44], [0.33, 0.44]]] },
  D: { w: 0.64, s: [[[0.05, 0], [0.05, 1], [0.24, 1], ...arc(0.24, 0.5, 0.37, 0.5, 90, -90), [0.05, 0]]] },
  E: { w: 0.54, s: [[[0.52, 1], [0.05, 1], [0.05, 0], [0.52, 0]], [[0.05, 0.51], [0.43, 0.51]]] },
  O: { w: 0.74, s: [arc(0.37, 0.5, 0.35, 0.5, 90, 450, 48)], closed: true },
  W: { w: 0.90, s: [[[0.01, 1], [0.23, 0], [0.45, 0.80], [0.67, 0], [0.89, 1]]] },
};
const CAP = 0.86, TRACK = 0.13 * CAP, LR = 0.05, LN = 72;
const LAYOUT = { d: [['SCALING', 1.46], ['UP-SIDE-DOWN', 0.30]], p: [['SCALING', 2.62], ['UP-SIDE-', 1.44], ['DOWN', 0.26]] };

const matLetter = new THREE.MeshStandardMaterial({ color: '#27292c', roughness: 0.48, metalness: 0, envMapIntensity: 0.8 });
const letters = [];   // per letter: x centre, baseline, fall params
const strokes = [];   // per stroke: tube, letter, base points
const R0 = rng(7);
function buildTitle(mode) {
  const lines = LAYOUT[mode];
  let li = 0, si = 0;
  const R = rng(11);
  lines.forEach(([word, base], lineNo) => {
    let w = 0; for (const ch of word) w += GLYPH[ch].w * CAP + TRACK; w -= TRACK;
    let x = -w / 2;
    for (const ch of word) {
      const g = GLYPH[ch];
      const L = letters[li] || (letters[li] = {});
      L.cx = x + (g.w * CAP) / 2; L.base = base; L.line = lineNo;
      L.fs = lerp(T.fall[0], T.fall[1], (lineNo === 0 ? 0 : 0.35) + R() * 0.65);
      L.dir = R() < 0.55 ? 1 : -1; L.dx = (L.cx / 4.5) * (0.6 + R() * 0.8) + (R() - 0.5) * 0.4; L.dz = (R() - 0.5) * 1.4 + L.dir * 0.3;
      L.yaw = (R() - 0.5) * 1.2; L.intro = li;
      g.s.forEach((st, k) => {
        let pl = resample(st, 160, false);
        pl = smooth(pl, 6, !!g.closed);
        pl = resample(pl, LN, false);
        const S = strokes[si] || (strokes[si] = { tube: new Tube(LN, LR, matLetter) });
        S.li = li; S.k = k; S.base = new Float32Array(LN * 3); S.noise = new Float32Array(LN * 2);
        const ph = R() * 6.28, ph2 = R() * 6.28;
        pl.forEach((p, i) => {
          S.base[i * 3] = x + p[0] * CAP; S.base[i * 3 + 1] = base + p[1] * CAP + LR; S.base[i * 3 + 2] = 0;
          const s = i / (LN - 1);
          S.noise[i * 2] = Math.sin(s * 5 + ph) * 0.12; S.noise[i * 2 + 1] = Math.sin(s * 4 + ph2) * 0.16;
        });
        if (!S.added) { scene.add(S.tube.mesh); S.added = true; }
        S.tube.mesh.visible = true;
        si++;
      });
      x += g.w * CAP + TRACK; li++;
    }
  });
  // the title's extent (world units), for fitting it into the room the page leaves for it
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < si; i++) { const B = strokes[i].base; for (let j = 0; j < LN; j++) { x0 = Math.min(x0, B[j * 3]); x1 = Math.max(x1, B[j * 3]); y0 = Math.min(y0, B[j * 3 + 1]); y1 = Math.max(y1, B[j * 3 + 1]); } }
  titleBox = { hw: (x1 - x0) / 2 + 2 * LR, hh: (y1 - y0) / 2 + 2 * LR, cy: (y0 + y1) / 2 };
  for (let i = si; i < strokes.length; i++) strokes[i].tube.mesh.visible = false, strokes[i].unused = true;
  for (let i = 0; i < si; i++) strokes[i].unused = false;
  letters.length = li;
  strokes.forEach((S) => { S.last = -1; });
}

let introT0 = -1, titleBox = null;
function letterPose(S, t, intro) {
  const P = S.tube.pts, B = S.base, L = letters[S.li];
  if (S.unused) return;
  const fe = L.fs + T.fallDur;
  const u = lin(L.fs, fe, t);
  const g = intro;                                           // the draw-in: the first g of the stroke
  const u2 = ss(lin(fe, fe + 0.03, t)), v = lin(fe + 0.016, fe + 0.056, t);
  const drop = Math.pow(clamp01(u / 0.5), 2);
  let th = (Math.PI / 2) * Math.pow(clamp01((u - 0.28) / 0.5), 2);
  if (u > 0.78) th = Math.PI / 2 - 0.2 * Math.sin(Math.PI * clamp01((u - 0.78) / 0.16));
  const yb = lerp(L.base + LR, LR, drop), c = Math.cos(th), s = Math.sin(th);
  const cy = Math.cos(L.yaw * u2), sy = Math.sin(L.yaw * u2);
  for (let i = 0; i < LN; i++) {
    let fi = (i / (LN - 1)) * g * (LN - 1), i0 = Math.floor(fi), i1 = Math.min(i0 + 1, LN - 1), w = fi - i0;
    const bx = lerp(B[i0 * 3], B[i1 * 3], w), by = lerp(B[i0 * 3 + 1], B[i1 * 3 + 1], w);
    const h = by - L.base - LR;
    let x = bx - L.cx, y = yb + h * c + S.k * 2.1 * LR * s, z = L.dir * h * s;
    x += S.noise[i0 * 2] * u2; z += S.noise[i0 * 2 + 1] * u2;
    const xr = x * cy - z * sy, zr = x * sy + z * cy;
    P[i * 3] = L.cx + xr + L.dx * u2; P[i * 3 + 1] = y - v * 3.2 * LR; P[i * 3 + 2] = zr + L.dz * u2;
  }
  S.tube.build(1 - ss(v));
  S.tube.mesh.visible = v < 1;
}

// ---- mugs ---------------------------------------------------------------------------------------------------------
const MR = 0.34, MH = 0.80;
const mugGeo = (() => {
  const p = [[0, 0.012], [0.25, 0.0], [0.31, 0.006], [0.333, 0.03], [0.34, 0.09], [0.34, 0.74], [0.337, 0.785], [0.33, 0.80], [0.318, 0.80], [0.307, 0.785], [0.302, 0.74], [0.302, 0.13], [0.29, 0.095], [0.25, 0.082], [0, 0.08]];
  return new THREE.LatheGeometry(p.map((q) => new THREE.Vector2(q[0], q[1])), 56);
})();
const handleGeo = (() => { const g = new THREE.TorusGeometry(0.19, 0.042, 12, 28, Math.PI * 1.12); g.rotateZ(-Math.PI * 0.56); g.translate(MR - 0.03, 0.43, 0); return g; })();
const matMug = new THREE.MeshPhysicalMaterial({ color: '#f3f1ec', roughness: 0.34, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.14, envMapIntensity: 0.9 });
const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.45, 'rgba(0,0,0,0.38)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
})();
const blobGeo = new THREE.PlaneGeometry(1.15, 1.15).rotateX(-Math.PI / 2);
// all 15 mugs are ONE instanced mesh (body and handle merged into one geometry): one draw call and one shadow call
// instead of 30 of each. They arrive in order, so the mugs on the floor are always the first `count` instances.
const mugAll = (() => {
  const parts = [mugGeo, handleGeo], g = new THREE.BufferGeometry(), idx = [];
  const cat = (name, n) => { const out = new Float32Array(parts.reduce((m, q) => m + q.attributes[name].count * n, 0)); let o = 0; for (const q of parts) { out.set(q.attributes[name].array, o); o += q.attributes[name].count * n; } return out; };
  let base = 0;
  for (const q of parts) { const ix = q.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + base); base += q.attributes.position.count; }
  g.setAttribute('position', new THREE.BufferAttribute(cat('position', 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(cat('normal', 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(cat('uv', 2), 2));
  g.setIndex(idx);
  return g;
})();

const NC = 15, UP = new THREE.Vector3(0, 1, 0);
const mugs = new THREE.InstancedMesh(mugAll, matMug, NC);
mugs.castShadow = mugs.receiveShadow = true; mugs.frustumCulled = false; mugs.count = 0;
mugs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(mugs);
const cups = [];
{
  const R = rng(23);
  for (let k = 0; k < NC; k++) {
    const r = 0.86 * Math.sqrt(k + 0.45), a = k * 2.39996 + 0.9;
    const home = new THREE.Vector3(Math.cos(a) * r * 1.2 + (R() - 0.5) * 0.2, 0, Math.sin(a) * r * 0.82 + (R() - 0.5) * 0.2 + 0.15);
    const g = new THREE.Object3D();   // holds the mug's place; drawn as instance k of `mugs`
    g.visible = false;
    const blob = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: blobTex, transparent: true, opacity: 0.5, depthWrite: false }));
    blob.renderOrder = 1; blob.visible = false; scene.add(blob);
    const ta = T.cups[k], early = k < 4;
    const dc = new THREE.Vector3(-home.x, 0, -home.z); const dl = dc.length(); dc.normalize();
    const grp = k % 3, m = Math.floor(k / 3), gx = (grp - 1) * 2.7;
    const slot = [[-0.76, -1.62], [0, -1.68], [0.76, -1.62], [-0.38, -0.86], [0.38, -0.86]][m];
    const tidyQ = new THREE.Quaternion().setFromAxisAngle(UP, (R() - 0.5) * 0.3);
    cups.push({
      k, home, g, blob, ta, arr: early ? 0.024 : 0.013, drop: early ? 3.2 : 2.6, yaw: R() * 6.283, spin: R() - 0.5,
      dc: dl > 0.3 ? dc : new THREE.Vector3(1, 0, 0), slide: Math.min(dl, 3) * (0.16 + R() * 0.14),
      tilt: dl < 0.8 ? 0.35 : 0.7 + R() * 0.75, pd: R() * 0.03,
      tidyPos: new THREE.Vector3(gx + slot[0], 0, slot[1] + 0.2), tidyQ, sd: R() * 0.02,
      p: new THREE.Vector3(), q: new THREE.Quaternion(),
    });
  }
}
const _qy = new THREE.Quaternion(), _qt = new THREE.Quaternion(), _ax = new THREE.Vector3(), _v = new THREE.Vector3();
// the mug's place: arrive (drop + small bounce), get dragged in and tipped by the heap, then stand up in its group
function cupState(c, t, out) {
  const ts = Math.min(t, T.freeze);
  const ua = lin(c.ta, c.ta + c.arr, ts);
  let y = ua < 0.74 ? c.drop * (1 - Math.pow(ua / 0.74, 2)) : c.drop * 0.035 * Math.sin((Math.PI * (ua - 0.74)) / 0.26);
  _qy.setFromAxisAngle(UP, c.yaw + (1 - ss(ua)) * 0.8 * c.spin);
  const p = s5(lin(T.pull[0] + c.pd, T.pull[1], ts));
  _ax.crossVectors(UP, c.dc).normalize();
  _qt.setFromAxisAngle(_ax, c.tilt * p);
  out.p.copy(c.home).addScaledVector(c.dc, c.slide * p);
  // tip over the base edge that faces the heap
  _v.copy(c.dc).multiplyScalar(-MR).applyQuaternion(_qt);
  out.p.addScaledVector(c.dc, MR).add(_v);
  out.p.y += y;
  out.q.multiplyQuaternions(_qt, _qy);
  const q2 = s5(lin(T.stand[0] + c.sd, T.stand[1], t));
  if (q2 > 0) { out.p.lerp(c.tidyPos, q2); out.p.y += Math.sin(Math.PI * q2) * 0.45; out.q.slerp(c.tidyQ, q2); }
  out.air = y + (q2 > 0 ? Math.sin(Math.PI * q2) * 0.45 : 0);
  out.tip = c.tilt * p * (1 - q2);
  return out;
}
function attach(cs, lx, lz, out) { out.set(lx, 0.045, lz).applyQuaternion(cs.q).add(cs.p); return out; }

// ---- cables: one per pair of mugs ------------------------------------------------------------------------------------
const CR = 0.042, CN = 48, MID = 7;
const NEUTRAL = ['#ece9e2', '#ece9e2', '#c4c1ba', '#8c8a85', '#4a4b4d'];
const ACCENT = new THREE.Color().setRGB(0.07, 0.25, 0.66, THREE.LinearSRGBColorSpace);
const cables = [];
const matCable = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.52, metalness: 0, envMapIntensity: 0.7 });
const cablePool = new TubePool((NC * (NC - 1)) / 2, CN, matCable);
scene.add(cablePool.mesh);
{
  const R = rng(41);
  for (let b = 1; b < NC; b++) for (let a = 0; a < b; a++) {
    const A = cups[a], Bc = cups[b];
    const j = a, n = b;                                    // j-th of the new mug's n cables
    const early = b < 4;
    const gd = early ? 0.016 : 0.011, st = Math.min(0.0045, (early ? 0.016 : 0.009) / n);
    const tg = Bc.ta + Bc.arr * 0.8 + j * st;
    const neutral = new THREE.Color(NEUTRAL[Math.floor(R() * NEUTRAL.length)]);
    const col = ACCENT.clone();
    const tube = new Tube(CN, CR, null, cablePool);
    // the local attach direction on each mug (towards the other mug at home)
    const dirAB = new THREE.Vector3().subVectors(Bc.home, A.home); dirAB.y = 0; dirAB.normalize();
    const la = new THREE.Vector3().copy(dirAB).applyAxisAngle(UP, -A.yaw).multiplyScalar(MR * 0.8);
    const lb = new THREE.Vector3().copy(dirAB).negate().applyAxisAngle(UP, -Bc.yaw).multiplyScalar(MR * 0.8);
    const lat = [], lay = [], jit = [];
    for (let i = 0; i < MID; i++) { lat.push(R() * 2 - 1); lay.push(Math.pow(R(), 0.7)); jit.push(R() * 2 - 1); }
    cables.push({ a, b, tg, gd, neutral, col, tube, la, lb, lat, lay, jit, w1: R() * 2 - 1, w2: R() * 2 - 1, top: b === NC - 1 ? 1 : 0, bundle: cables.length % 3, last: -1, frozen: null, bpts: null, rank: R() });
  }
}
const nCab = cables.length;   // 105
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
const CTRL = new Float32Array((MID + 4) * 3);
let co = 0;
function put(x, y, z) { CTRL[co++] = x; CTRL[co++] = y; CTRL[co++] = z; }   // one control point of the cable being built

const PEAK = 1.15, PSIG = 1.2;   // the peak the pull raises in the middle of the heap (height, width)
function heapAt(t) {   // the heap: grows with the cables there are, swells as it drags the mugs in
  const ts = Math.min(t, T.freeze);
  let nc = 0, ncup = 0;
  for (const c of cables) nc += lin(c.tg, c.tg + c.gd, ts);
  for (const c of cups) if (ts >= c.ta) ncup++;
  const p = s5(lin(T.pull[0], T.pull[1], ts));
  return { H: 1.0 * Math.pow(nc / nCab, 0.85) * (1 + 0.45 * p), sig: 0.7 + 0.06 * ncup + 0.28 * p, pile: Math.pow(clamp01((nc - 12) / 75), 1.3), p,
    Hp: PEAK * p };   // the middle of the heap rises into a peak as it drags the mugs in
}
const cupCache = cups.map(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion() }));
let cacheT = NaN;
function cupAt(k, t) { if (cacheT !== t) { for (let i = 0; i < NC; i++) cupState(cups[i], t, cupCache[i]); cacheT = t; } return cupCache[k]; }
function cablePile(c, t, hp, out, gEnd) {
  const cupA = cupAt(c.a, t), cupB = cupAt(c.b, t);
  attach(cupB, c.lb.x, c.lb.z, _pb); attach(cupA, c.la.x, c.la.z, _pa);
  // the run between the two mugs, from mug centre to mug centre (stable while a mug tips)
  let dx = cupA.p.x - cupB.p.x, dz = cupA.p.z - cupB.p.z;
  const cl = Math.sqrt(dx * dx + dz * dz) || 1, ux = dx / cl, uz = dz / cl, px = -uz, pz = ux;
  // two mugs closer than the two end offsets would fold the run back on itself (a crumpled knot): keep a short run
  const off = Math.max(0, Math.min(MR + 0.12, (cl - 0.3) / 2));
  const bx = cupB.p.x + ux * off, bz = cupB.p.z + uz * off, ax = cupA.p.x - ux * off, az = cupA.p.z - uz * off;
  dx = ax - bx; dz = az - bz; const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const sh = Math.min(1, len / 2.2);   // a short cable gets less jitter, or its points cross and it crumples
  const amp = (0.05 + 0.045 * len) * 3.0 * hp.pile * (0.35 + 0.65 * sh), bend = 0.08 + 0.07 * len, q = hp.p;
  co = 0;
  // as the heap pulls, the cable ends leave the tipping mugs and lie in the heap beside them
  put(lerp(_pb.x, bx + ux * 0.2, q), lerp(_pb.y, CR + 0.02, q), lerp(_pb.z, bz + uz * 0.2, q));
  put(bx, CR + 0.01, bz);
  for (let i = 0; i < MID; i++) {
    const s = (i + 1) / (MID + 1);
    const sm = bend * (c.w1 * Math.sin(Math.PI * s) + 0.45 * c.w2 * Math.sin(2 * Math.PI * s));   // a lying cable's easy S
    let x = bx + dx * s + px * (c.lat[i] * amp + sm), z = bz + dz * s + pz * (c.lat[i] * amp + sm);
    x += ux * c.jit[i] * hp.pile * 0.25 * sh; z += uz * c.jit[i] * hp.pile * 0.25 * sh;
    const d2 = x * x + z * z, m = hp.H * Math.exp(-d2 / (2 * hp.sig * hp.sig)) + hp.Hp * Math.exp(-d2 / (2 * PSIG * PSIG));
    const y = CR * (1 + 1.7 * c.rank) + m * lerp(c.lay[i], 1, c.top * 0.5) + Math.sin(i * 1.7 + c.rank * 9) * 0.06 * hp.pile;
    put(x, y, z);
  }
  put(ax, CR + 0.01, az);
  put(lerp(_pa.x, ax - ux * 0.2, q), lerp(_pa.y, CR + 0.02, q), lerp(_pa.z, az - uz * 0.2, q));
  crSample(CTRL, MID + 4, 0, gEnd, CN, out);
  pushOut(out, c.a, c.b, t, q);
}
// no cable runs through a mug: a sample inside a mug's wall is pushed out to its side (a cable passing through the
// glaze showed as black, jagged cuts on the buried mugs). The mugs at t are put in a flat table once per t.
const MT = new Float32Array(NC * 8); let mtN = 0, mtT = NaN;
const RIN = MR + CR + 0.012, RIN2 = RIN * RIN, BND = 0.95 * 0.95;
function mugTable(t) {
  if (mtT === t) return; mtT = t; mtN = 0;
  for (let k = 0; k < NC; k++) {
    if (t < cups[k].ta) continue;
    const c = cupAt(k, t), o = mtN * 8;
    MT[o] = c.p.x; MT[o + 1] = c.p.y; MT[o + 2] = c.p.z; MT[o + 3] = c.q.x; MT[o + 4] = c.q.y; MT[o + 5] = c.q.z; MT[o + 6] = c.q.w; MT[o + 7] = k;
    mtN++;
  }
}
function pushOut(P, a, b, t, pull) {
  mugTable(t);
  // the first and last samples plug into the cable's own two mugs: leave those, until the heap pulls the ends out of
  // the mugs (then a tipped mug lies across its own cables, and they too go round it)
  const N = CN, e0 = pull > 0.4 ? 1 : 6, e1 = N - 1 - e0;
  for (let i = 1; i < N - 1; i++) {
    let px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
    for (let m = 0; m < mtN; m++) {
      const o = m * 8, k = MT[o + 7];
      if ((i < e0 || i > e1) && (k === a || k === b)) continue;
      const dx = px - MT[o], dy = py - MT[o + 1], dz = pz - MT[o + 2];
      if (dx * dx + dy * dy + dz * dz > BND) continue;
      // into the mug's own frame (rotate by the conjugate of its quaternion)
      const qx = -MT[o + 3], qy = -MT[o + 4], qz = -MT[o + 5], qw = MT[o + 6];
      let tx = 2 * (qy * dz - qz * dy), ty = 2 * (qz * dx - qx * dz), tz = 2 * (qx * dy - qy * dx);
      const lx = dx + qw * tx + (qy * tz - qz * ty), ly = dy + qw * ty + (qz * tx - qx * tz), lz = dz + qw * tz + (qx * ty - qy * tx);
      if (ly < -CR || ly > MH + CR) continue;
      const r2 = lx * lx + lz * lz;
      if (r2 >= RIN2) continue;
      const r = Math.sqrt(r2), f = r > 1e-4 ? RIN / r : 0;
      const nx = r > 1e-4 ? lx * f : RIN, nz = r > 1e-4 ? lz * f : 0;
      // back to the world (rotate by the quaternion itself)
      const ux = -qx, uy = -qy, uz = -qz;
      tx = 2 * (uy * nz - uz * ly); ty = 2 * (uz * nx - ux * nz); tz = 2 * (ux * ly - uy * nx);
      px = MT[o] + nx + qw * tx + (uy * tz - uz * ty); py = MT[o + 1] + ly + qw * ty + (uz * tx - ux * tz); pz = MT[o + 2] + nz + qw * tz + (ux * ty - uy * tx);
    }
    P[i * 3] = px; P[i * 3 + 1] = Math.max(py, CR * 0.9); P[i * 3 + 2] = pz;
  }
}
// the tidy end: three neat, round bundles running out of the three groups of mugs
function bundlePts(c) {
  const R = rng(1000 + cables.indexOf(c));
  const b = c.bundle, k = Math.floor(cables.indexOf(c) / 3), nb = 35, Rb = CR * Math.sqrt(nb) * 1.06;
  const gx = (b - 1) * 2.7, z0 = -1.05, z1 = 2.7, out = new Float32Array(CN * 3);
  const rho = (Rb - CR) * Math.sqrt((k + 0.5) / nb), phi0 = k * 2.39996, s0 = R() * 0.02, s1 = 1 - R() * 0.018;
  for (let i = 0; i < CN; i++) {
    const s = lerp(s0, s1, i / (CN - 1));
    const cx = gx + Math.sin(Math.PI * s) * 0.22 * (b - 1), cz = lerp(z0, z1, s);
    const spl = s < 0.16 ? 1 + 2.6 * Math.pow(1 - s / 0.16, 2) : 1;
    const phi = phi0 + s * 2.4;
    out[i * 3] = cx + Math.cos(phi) * rho * spl; out[i * 3 + 1] = Math.max(CR, Rb + Math.sin(phi) * rho * (s < 0.16 ? 1 + (spl - 1) * 0.2 : 1)); out[i * 3 + 2] = cz;
  }
  return out;
}

// ---- camera: keyframes by t ------------------------------------------------------------------------------------------
// t, target x y z, elevation, azimuth, fov, half-extents to fit (w, h), vertical shift (of the screen), roll (deg).
// The network (2-8 mugs) is seen from higher up, so every cable between two mugs shows on the floor. The wait: the
// camera stops dead with everything else (0.575-0.603), then, while the line reads, sinks slowly to a low angle and
// leans in, so the heap looms. Upside down it stays low: the heap hangs from the floor under the mugs like a weight.
const KD = [
  [0.000, 0, 1.30, 0.0, 7, 0, 30, 4.35, 1.45, -0.10, 0],
  [0.062, 0, 1.20, 0.0, 9, 0, 30, 4.35, 1.45, -0.08, 0],
  [0.140, 0, 0.30, 0.6, 34, 0, 30, 2.7, 1.25, 0.04, 0],
  [0.205, 0, 0.30, 0.6, 40, 0, 30, 2.8, 1.3, 0.04, 0],
  [0.292, 0, 0.30, 0.4, 46, 0, 30, 3.1, 1.6, 0.05, 0],
  [0.385, 0, 0.30, 0.3, 46, 0, 30, 4.1, 2.1, 0.06, 0],
  [0.485, 0, 0.50, 0.2, 40, 0, 30, 5.0, 2.6, 0.08, 0],
  [0.575, 0, 0.70, 0.1, 34, 0, 30, 4.8, 2.85, 0.21, 0],   // (the height bound only acts on wide screens, 16:9 and up)
  [0.603, 0, 0.70, 0.1, 34, 0, 30, 4.8, 2.85, 0.21, 0],
  [0.685, 0, 0.95, 0.1, 15, 0, 30, 4.25, 2.45, 0.22, 0],
  [0.750, 0, 1.15, 0.1, 13, 0, 30, 4.4, 3.35, 0.085, 180],
  [0.800, 0, 1.40, 0.1, 13, 0, 30, 4.4, 3.6, 0.075, 180],
  [0.862, 0, 0.25, 0.5, 33, 0, 30, 4.8, 2.9, 0.15, 360],
  [0.974, 0, 0.25, 0.5, 35, 0, 30, 4.8, 2.5, 0.12, 360],   // held until "Down for pruning." has gone (short landscape)
  [1.000, 0, 0.00, 10.2, 66, 0, 30, 4.8, 3.0, 0.0, 360],   // far enough in front that no bundle end peeks in at the top
];
const KP = [
  [0.000, 0, 1.86, 0.0, 7, 0, 36, 2.35, 1.6, -0.14, 0],
  [0.062, 0, 1.70, 0.0, 9, 0, 36, 2.35, 1.6, -0.12, 0],
  [0.140, 0, 0.30, 0.6, 40, 0, 36, 1.7, 1.6, 0.08, 0],
  [0.205, 0, 0.30, 0.6, 46, 0, 36, 1.8, 1.7, 0.08, 0],
  [0.292, 0, 0.30, 0.4, 52, 0, 36, 2.1, 2.0, 0.08, 0],
  [0.385, 0, 0.30, 0.3, 52, 0, 36, 2.9, 2.7, 0.10, 0],
  [0.485, 0, 0.45, 0.2, 50, 0, 36, 3.8, 3.4, 0.12, 0],
  [0.575, 0, 0.70, 0.1, 44, 0, 36, 3.5, 3.2, 0.17, 0],
  [0.603, 0, 0.70, 0.1, 44, 0, 36, 3.5, 3.2, 0.17, 0],
  [0.685, 0, 1.00, 0.1, 17, 0, 36, 2.75, 2.6, 0.20, 0],
  [0.750, 0, 1.15, 0.1, 15, 0, 36, 3.0, 2.9, 0.17, 180],
  [0.800, 0, 1.45, 0.1, 15, 0, 36, 3.0, 3.1, 0.15, 180],
  [0.862, 0, 0.25, 0.4, 46, 0, 36, 3.9, 3.5, 0.17, 360],
  [0.965, 0, 0.25, 0.4, 48, 0, 36, 3.9, 3.5, 0.17, 360],
  [1.000, 0, 0.00, 9.2, 84, 0, 36, 1.5, 2.6, 0.0, 360],   // far enough in front that no bundle end peeks in at the top
];
let mode = null, W0 = 1, H0 = 1;
// the hero frames (the first two keys): the designed framing, unless the room the page leaves for the title (between
// the chrome and the first sentence, measured by page.js into SUSD.layout) is smaller; then the title is fitted into
// it. Either way the title is centred in that room, so the words never sit on the letters (short phones, landscape).
const KD0 = KD.map((k) => k.slice()), KP0 = KP.map((k) => k.slice());
let layoutSeen = -1;
function heroFit() {
  layoutSeen = SUSD.layoutV;
  const K = mode === 'p' ? KP : KD, K0 = mode === 'p' ? KP0 : KD0, L = SUSD.layout;
  for (let i = 0; i < 2; i++) for (let n = 0; n < K0[i].length; n++) K[i][n] = K0[i][n];
  if (!L || !titleBox || !(L.hero > L.top)) return;
  const asp = W0 / H0, side = Math.max(16, 0.04 * W0);
  const y0 = L.top + Math.max(10, 0.03 * H0), y1 = L.hero - Math.max(14, 0.05 * H0), Hr = Math.max(40, y1 - y0), yc = (y0 + Math.max(y0 + 40, y1)) / 2;
  for (let i = 0; i < 2; i++) {
    const a = K[i], th = Math.tan((a[6] * Math.PI) / 360), el = (a[4] * Math.PI) / 180;
    const dD = Math.max(a[7] / (th * asp), a[8] / th);
    const dR = Math.max((titleBox.hw * W0) / ((W0 - 2 * side) * th * asp), (titleBox.hh * H0) / (Hr * th));
    const d = Math.max(dD, dR), f = d / dD;
    a[7] *= f; a[8] *= f;
    const yNo = (H0 / 2) * (1 - ((titleBox.cy - a[2]) * Math.cos(el)) / (d * th));   // the title's centre, unshifted
    a[9] = (yc - yNo) / H0;
  }
}
const _tg = new THREE.Vector3();
function placeCamera(t) {
  const K = mode === 'p' ? KP : KD;
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], u = s5(lin(a[0], b[0], t));
  const v = (n) => lerp(a[n], b[n], u);
  _tg.set(v(1), v(2), v(3));
  const el = (v(4) * Math.PI) / 180, az = (v(5) * Math.PI) / 180, fov = v(6), hw = v(7), hh = v(8), sy = v(9), roll = (v(10) * Math.PI) / 180;
  const asp = W0 / H0, th = Math.tan((fov * Math.PI) / 360);
  // fit the box as it lies on screen: while the camera rolls, a wide heap stands tall, so back off to keep it in frame
  const cr = Math.abs(Math.cos(roll)), sr = Math.abs(Math.sin(roll));
  const dist = Math.max((hw * cr + hh * sr) / (th * asp), (hw * sr + hh * cr) / th);
  camera.fov = fov; camera.aspect = asp;
  camera.position.set(_tg.x + Math.sin(az) * Math.cos(el) * dist, _tg.y + Math.sin(el) * dist, _tg.z + Math.cos(az) * Math.cos(el) * dist);
  camera.up.set(0, 1, 0); camera.lookAt(_tg); camera.rotateZ(roll);
  camera.setViewOffset(W0, H0, 0, -sy * H0, W0, H0);
  camera.updateProjectionMatrix();
}

// ---- one frame of the story at t ------------------------------------------------------------------------------------
const hpF = heapAt(T.freeze);
const SAG = 0.7, SAGW = 1.7, SETTLE = 0.42;   // upside down: how much lower the heap hangs, and how wide the part that hangs
function update(t, intro) {
  placeCamera(t);
  const ts = Math.min(t, T.freeze);
  // light: drops for the wait, comes back for the turn
  const dk = ss(lin(T.dark[0], T.dark[1], t)) * (1 - ss(lin(T.light[0], T.light[1], t)));
  renderer.toneMappingExposure = lerp(0.92, 0.56, dk);
  // title
  for (const S of strokes) {
    if (S.unused) continue;
    const L = letters[S.li];
    const g = NOINTRO ? 1 : clamp01((intro - L.intro * 0.055) / 0.75);
    const key2 = t < L.fs ? -2 - g : ts;
    if (S.last === key2) continue;
    S.last = key2;
    if (t > L.fs + T.fallDur + 0.06) { S.tube.mesh.visible = false; continue; }
    letterPose(S, t, g < 1 ? ss(g) : 1);
    if (g <= 0) S.tube.mesh.visible = false;
  }
  // mugs
  let nMugs = 0;
  for (const c of cups) {
    const vis = t >= c.ta;
    if (vis) nMugs = c.k + 1;
    c.g.visible = vis; c.blob.visible = vis;
    if (!vis) continue;
    cupState(c, t, c);
    c.g.position.copy(c.p); c.g.quaternion.copy(c.q);
    c.g.updateMatrix(); mugs.setMatrixAt(c.k, c.g.matrix);
    c.blob.position.set(c.p.x, 0.004, c.p.z);
    c.blob.material.opacity = 0.42 * clamp01(1 - c.air / 1.4) * (1 - 0.6 * clamp01(c.tip / 1.2));
  }
  mugs.count = nMugs; mugs.instanceMatrix.needsUpdate = true;
  // cables
  const hp = heapAt(t), sg = ss(lin(T.sag[0], T.sag[1], t)) * (1 - ss(lin(T.unsag[0], T.unsag[1], t))), st = ss(lin(T.settle[0], T.settle[1], t));
  for (let ci = 0; ci < nCab; ci++) {
    const c = cables[ci];
    const g = lin(c.tg, c.tg + c.gd, ts);
    if (g <= 0) { c.tube.mesh.visible = false; c.last = -1; continue; }
    c.tube.mesh.visible = true;
    // the newest mug's cables are blue until the next mug arrives (the last batch until the heap starts to pull)
    const nextT = c.b + 1 < NC ? cups[c.b + 1].ta + cups[c.b + 1].arr * 0.8 : T.pull[0];
    const aw = 1 - ss(lin(nextT, nextT + 0.012, ts));
    c.col.copy(c.neutral).lerp(ACCENT, aw);
    c.tube.setColor(c.col);
    let q = 0;
    if (t > T.freeze) { const bw = T.bundles[c.bundle]; q = s5(lin(bw[0] + c.rank * 0.012, bw[1], t)); }
    const key2 = t <= T.freeze ? ts : 10 + q + 2 * Math.round(sg * 1e4) + 40000 * Math.round(st * 1e4);
    if (c.last === key2) continue;
    c.last = key2;
    if (q <= 0 && sg <= 0 && st <= 0) cablePile(c, ts, hp, c.tube.pts, g);
    else {
      if (!c.frozen) { c.frozen = new Float32Array(CN * 3); cablePile(c, T.freeze, hpF, c.frozen, 1); }
      if (!c.bpts) c.bpts = bundlePts(c);
      const P = c.tube.pts, F = c.frozen, B = c.bpts, lift = Math.sin(Math.PI * q) * 0.5;
      // upside down the heap hangs lower (its height stretched, the floor end anchored): a weight under the mugs;
      // right side up again its peak settles as the mugs leave it
      for (let i = 0; i < CN; i++) {
        const o = i * 3, x = F[o], z = F[o + 2], yf = F[o + 1] * (1 + (SAG * sg - SETTLE * st) * Math.exp(-(x * x + z * z) / (2 * SAGW * SAGW)));
        P[o] = lerp(x, B[o], q); P[o + 1] = lerp(yf, B[o + 1], q); P[o + 2] = lerp(z, B[o + 2], q);
      }
      if (q > 0) { for (let i = 0; i < CN; i++) P[i * 3 + 1] += lift * Math.sin((Math.PI * i) / (CN - 1)) * (0.4 + c.rank); }
    }
    c.tube.build(1);
  }
}

// ---- run ----------------------------------------------------------------------------------------------------------
function resize() {
  // the canvas box itself (the viewport, the same box as the layer of words), so the picture is never stretched
  const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
  W0 = w; H0 = h;
  renderer.setSize(w, h, false);
  const m = w / h < 0.8 ? 'p' : 'd';
  if (m !== mode) { mode = m; buildTitle(m); }
  heroFit();
  dirty = true;
}
let tDisp = 0, tShown = -1, introShown = -1, dirty = true, frames = 0, fpsT = performance.now(), fps = 0;
const COST = new Float32Array(1200); let costI = 0, costN = 0;   // main-thread ms per drawn frame (update + render)
let paused = false;   // tests only: HEAP2.pause(true) stops drawing, HEAP2.pose(t) then moves the scene without drawing
function frame(now) {
  requestAnimationFrame(frame);
  if (paused) return;
  const tt = SUSD.t || 0;
  if (SUSD.layoutV !== layoutSeen) { heroFit(); dirty = true; }
  if (introT0 < 0) {
    // the first frame: compile every shader now (not when the first mug lands), draw the empty start, and only then
    // start the intro clock, so a slow first frame never eats the draw-in. Start where the page is (a reload mid-story).
    tDisp = tt;
    renderer.compile(scene, camera);
    update(tEff(tDisp), NOINTRO ? 99 : 0);
    cablePool.flush();
    renderer.render(scene, camera);
    tShown = tDisp; introShown = NOINTRO ? 99 : 0; dirty = false; introT0 = performance.now();
    return;
  }
  // the picture eases after the scroll, except after a jump ("Get it free", End, a dragged scrollbar): then it cuts,
  // so the story never fast-forwards behind the form
  if (RM || params.has('shots') || SUSD.snap || Math.abs(tt - tDisp) > 0.08) { tDisp = tt; SUSD.snap = false; }
  else { tDisp += (tt - tDisp) * 0.22; if (Math.abs(tt - tDisp) < 2e-5) tDisp = tt; }
  // the intro runs on the clock; a test or the video tool can drive it instead (SUSD.introClock, in seconds).
  // It keeps drawing until a frame at or past the end has been drawn, however slow the frames are.
  const intro = NOINTRO ? 99 : SUSD.introClock != null ? SUSD.introClock : (now - introT0) / 1000;
  const introOn = SUSD.introClock != null ? intro !== introShown : introShown < 2.0;
  if (tDisp === tShown && !introOn && !dirty) return;
  const c0 = performance.now();
  update(tEff(tDisp), intro);
  cablePool.flush();
  renderer.render(scene, camera);
  COST[costI++ % COST.length] = performance.now() - c0; costN++;
  tShown = tDisp; introShown = intro; dirty = false;
  frames++; if (now - fpsT > 1000) { fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; }
}
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
html.classList.add('gl-ready');
window.HEAP2 = {
  T, info: () => ({ triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, fps, t: tDisp, mode }),
  force: () => { dirty = true; },
  pause: (on) => { paused = !!on; dirty = true; },
  pose: (t) => { update(tEff(t), 99); },
  // main-thread cost of the frames drawn since the last call (ms each), for the frame-time test
  cost: () => { const n = Math.min(costN, COST.length), o = []; for (let i = 0; i < n; i++) o.push(COST[(costI - n + i + COST.length * 4) % COST.length]); costN = 0; return o; },
  // screen points (CSS px) of everything visible in the scene, for the layout test (no words over the objects)
  project: () => {
    // a posed scene (no render since) still has the last drawn frame's camera matrices: bring them up to date
    camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const out = [], v = new THREE.Vector3();
    const put = (x, y, z) => { v.set(x, y, z).project(camera); if (v.z > -1 && v.z < 1) out.push(Math.round(((v.x + 1) / 2) * W0), Math.round(((1 - v.y) / 2) * H0)); };
    for (const c of cups) {
      if (!c.g.visible) continue;
      c.g.updateMatrixWorld(true);
      for (let a = 0; a < 12; a++) for (const h of [0, 0.4, 0.8]) { v.set(Math.cos(a * 0.5236) * MR, h, Math.sin(a * 0.5236) * MR).applyMatrix4(c.g.matrixWorld); put(v.x, v.y, v.z); }
      v.set(MR + 0.2, 0.43, 0).applyMatrix4(c.g.matrixWorld); put(v.x, v.y, v.z);
    }
    const tubes = cables.map((c) => c.tube).concat(strokes.filter((S) => !S.unused).map((S) => S.tube));
    for (const tb of tubes) { if (!tb.mesh.visible) continue; for (let i = 0; i < tb.N; i += 2) put(tb.pts[i * 3], tb.pts[i * 3 + 1], tb.pts[i * 3 + 2]); }
    return out;
  },
  benchUpdate: (n = 120) => { const t0 = performance.now(); for (let i = 0; i < n; i++) update(0.3 + (i / n) * 0.27, 99); return (performance.now() - t0) / n; },
  // the main-thread cost of a frame (update + upload + draw submission) at story times a..b, with the raster cost taken
  // out (a tiny drawing buffer and shadow map), since software GL cannot tell how fast a real GPU rasterises
  cpuBench: (n = 90, a = 0.30, b = 0.58) => {
    const w = W0, h = H0, ms = key.shadow.mapSize.x, out = [];
    renderer.setSize(48, 30, false); key.shadow.mapSize.set(64, 64); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    update(a, 99); cablePool.flush(); renderer.render(scene, camera); renderer.getContext().finish();
    for (let i = 0; i < n; i++) { const t0 = performance.now(); update(a + ((b - a) * i) / (n - 1), 99); cablePool.flush(); renderer.render(scene, camera); out.push(performance.now() - t0); }
    renderer.getContext().finish();
    renderer.setSize(w, h, false); key.shadow.mapSize.set(ms, ms); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    dirty = true; tShown = -1;
    out.sort((x, y) => x - y);
    const q = (f) => +out[Math.min(out.length - 1, Math.floor(f * out.length))].toFixed(2);
    return { n, p50: q(0.5), p95: q(0.95), max: q(1), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  },
  bench: (n = 120) => { const t0 = performance.now(); for (let i = 0; i < n; i++) { update(0.3 + (i / n) * 0.3, 99); cablePool.flush(); renderer.render(scene, camera); } renderer.getContext().finish(); return (performance.now() - t0) / n; },
};
