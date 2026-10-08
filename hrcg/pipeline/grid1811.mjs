#!/usr/bin/env node
// pipeline/grid1811.mjs — A-200 CONTEXT geometry (brief 3.9, 4.4). Owner: A4.
//
//   node pipeline/grid1811.mjs            writes public/svg/grid1811.svg and the generated block in
//                                         src/sheets/A200Context.tsx (between the <grid1811> markers)
//   node pipeline/grid1811.mjs --check    exits 1 if either output is stale
//
// What it authors
// 1. ROW OUTLINE and HOLD CLOUD, in the row poster's own units (R2 arena strip: 1890 × 350, five 350²
//    bays with 35 gaps). Both are closed paths of EXACTLY 24 cubic segments with the same command
//    structure (M + 24 C + Z), so the morph is a straight interpolation of numbers. The outline is the
//    strip's outer rectangle (10 segments on each long side, 2 on each short side); the cloud is a
//    revision cloud drawn around the same footprint, one scallop per outline segment, so a drafter's
//    meaning carries over: "this area is on HOLD".
// 2. THE 1811 GRID MODULE, a separate history diagram (rule 2: no bay, arena or slab shape is ever
//    drawn on it). Real proportions from the fact gate: blocks 200 ft north–south, cross streets 60 ft,
//    avenues 100 ft, blocks between avenues 610–920 ft (Wikipedia, Commissioners' Plan of 1811; MCNY,
//    The Greatest Grid). Drawn as right-of-way edges: long block edges along the cross streets are thin
//    lines, short block edges along the avenues are the heavier lines. The whole module is rotated about
//    29° east of true north. No coastline, no Broadway, no parks, no names or numbers, no highlighted
//    block, no pin: just the module.
// 3. North arrows (TRUE NORTH, THE 1811 GRID) and the angle arc share one vertex at the centre of an
//    intersection, which is also the centre of the radial reveal.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_OUT = resolve(root, 'public/svg/grid1811.svg');
const TSX = resolve(root, 'src/sheets/A200Context.tsx');
const CHECK = process.argv.includes('--check');

const r1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => {
  const v = r1(n);
  return Object.is(v, -0) ? '0' : String(v);
};

// ------------------------------------------------------------------ 1. row outline and HOLD cloud
const ROW = { w: 1890, h: 350, bay: 350, gap: 35 };
const SEGMENTS = { long: 10, short: 2 }; // 10 + 2 + 10 + 2 = 24

/** Corner-to-corner walk, clockwise from the top-left: returns 25 points (first == last). */
function rectPoints(x0, y0, x1, y1) {
  const pts = [];
  const side = (ax, ay, bx, by, n) => {
    for (let i = 0; i < n; i++) pts.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]);
  };
  side(x0, y0, x1, y0, SEGMENTS.long); // top, left → right
  side(x1, y0, x1, y1, SEGMENTS.short); // right, top → bottom
  side(x1, y1, x0, y1, SEGMENTS.long); // bottom, right → left
  side(x0, y1, x0, y0, SEGMENTS.short); // left, bottom → top
  pts.push(pts[0]);
  return pts;
}

/** Straight outline as cubics: controls at thirds. Flat array: [x0,y0, (c1x,c1y,c2x,c2y,x,y) × 24]. */
function outlineNumbers() {
  const p = rectPoints(0, 0, ROW.w, ROW.h);
  const out = [p[0][0], p[0][1]];
  for (let i = 0; i < 24; i++) {
    const [ax, ay] = p[i];
    const [bx, by] = p[i + 1];
    out.push(ax + (bx - ax) / 3, ay + (by - ay) / 3, ax + ((bx - ax) * 2) / 3, ay + ((by - ay) * 2) / 3, bx, by);
  }
  return out;
}

/**
 * Revision cloud around the same footprint, offset outward by `m`. Each scallop is a cubic whose
 * controls lift off the chord along the outward normal (k × chord), meeting its neighbours in
 * inward cusps, as a drafter's revision cloud does. Scallop widths come out equal (≈ 197 / 215 units).
 */
function cloudNumbers(m = 40, k = 0.42) {
  const p = rectPoints(-m, -m, ROW.w + m, ROW.h + m);
  const out = [p[0][0], p[0][1]];
  for (let i = 0; i < 24; i++) {
    const [ax, ay] = p[i];
    const [bx, by] = p[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    // clockwise walk in y-down space: outward normal = (dy, -dx) / len
    const nx = dy / len;
    const ny = -dx / len;
    const h = k * len;
    // controls pulled slightly past the endpoints along the chord: rounder lobes, sharper cusps
    const t = 0.08;
    out.push(ax - dx * t + nx * h, ay - dy * t + ny * h, bx + dx * t + nx * h, by + dy * t + ny * h, bx, by);
  }
  return out;
}

function numbersToPath(a) {
  let d = `M${fmt(a[0])} ${fmt(a[1])}`;
  for (let i = 2; i < a.length; i += 6) {
    d += `C${fmt(a[i])} ${fmt(a[i + 1])} ${fmt(a[i + 2])} ${fmt(a[i + 3])} ${fmt(a[i + 4])} ${fmt(a[i + 5])}`;
  }
  return d + 'Z';
}

function baysPath() {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const x = i * (ROW.bay + ROW.gap);
    d += `M${x} 0H${x + ROW.bay}V${ROW.bay}H${x}Z`;
  }
  return d;
}

// ------------------------------------------------------------------ 2. the 1811 grid module
// View box of the diagram (5:4) and the vertex of the angle (centre of the reveal).
const VIEW = { w: 1000, h: 800 };
const VERTEX = { x: 500, y: 430 };
const ANGLE = 29; // degrees east of true north ("about 29°", fact-gated)
const FT = 0.19; // view units per foot
const STREET_W = 60; // ft, cross street right-of-way
const AVENUE_W = 100; // ft, avenue right-of-way
const BLOCK_NS = 200; // ft, block depth north–south
// Block lengths between avenues, east → west, within the documented 610–920 ft range
// (East Side ~620–640, 610 between Second and Third, 920 in the middle, 800 on the West Side).
// The diagram shows a window of the module; it is not registered to any real avenue.
const BLOCKS_EW = [630, 610, 920, 920, 920, 800, 800, 800, 800];
// Where the vertex sits: the centre of the intersection on the avenue after this many blocks (from the east).
const VERTEX_AFTER_BLOCK = 4;
const R_FIELD = Math.hypot(VIEW.w, VIEW.h) / 2 + 40; // reveal must be able to cover the whole frame

function gridPaths() {
  // Grid space: x = grid east (feet), y = grid south (feet), origin at the vertex intersection centre.
  // Avenue centre-lines (x) from the block sequence.
  const aveX = [];
  let x = 0;
  aveX.push(x);
  for (const b of BLOCKS_EW) {
    x += AVENUE_W + b;
    aveX.push(x);
  }
  const shift = aveX[VERTEX_AFTER_BLOCK];
  for (let i = 0; i < aveX.length; i++) aveX[i] -= shift;
  // Street centre-lines (y): pitch 260 ft, one through the vertex.
  const pitch = BLOCK_NS + STREET_W;
  const maxFt = R_FIELD / FT;
  const streetY = [];
  for (let y = -Math.ceil(maxFt / pitch) * pitch; y <= maxFt; y += pitch) streetY.push(y);

  const inField = (gx, gy) => Math.hypot(gx * FT, gy * FT) <= R_FIELD + 20;
  let thin = '';
  let heavy = '';
  for (let a = 0; a < aveX.length - 1; a++) {
    const xl = aveX[a] + AVENUE_W / 2; // block west/east faces (avenue edges)
    const xr = aveX[a + 1] - AVENUE_W / 2;
    for (let s = 0; s < streetY.length - 1; s++) {
      const yt = streetY[s] + STREET_W / 2;
      const yb = streetY[s + 1] - STREET_W / 2;
      const cx = (xl + xr) / 2;
      const cy = (yt + yb) / 2;
      if (!inField(cx, cy)) continue;
      const X0 = xl * FT;
      const X1 = xr * FT;
      const Y0 = yt * FT;
      const Y1 = yb * FT;
      // long edges, along the cross streets: thin
      thin += `M${fmt(X0)} ${fmt(Y0)}H${fmt(X1)}M${fmt(X0)} ${fmt(Y1)}H${fmt(X1)}`;
      // short edges, along the avenues: heavy
      heavy += `M${fmt(X0)} ${fmt(Y0)}V${fmt(Y1)}M${fmt(X1)} ${fmt(Y0)}V${fmt(Y1)}`;
    }
  }
  return { thin, heavy };
}

// ------------------------------------------------------------------ 3. north arrows and arc
const ARROW = { len: 250, head: 14, arcR: 132 };
function north() {
  const rad = (ANGLE * Math.PI) / 180;
  const tn = { x: VERTEX.x, y: VERTEX.y - ARROW.len };
  const gn = { x: VERTEX.x + ARROW.len * Math.sin(rad), y: VERTEX.y - ARROW.len * Math.cos(rad) };
  const a0 = { x: VERTEX.x, y: VERTEX.y - ARROW.arcR };
  const a1 = { x: VERTEX.x + ARROW.arcR * Math.sin(rad), y: VERTEX.y - ARROW.arcR * Math.cos(rad) };
  // arrowheads: open drafting arrowheads (two strokes), pointing along each arrow
  const head = (tip, ang) => {
    const h = ARROW.head;
    const w = 0.36;
    const back = (s) => ({
      x: tip.x - h * Math.sin(ang) + s * h * w * Math.cos(ang),
      y: tip.y + h * Math.cos(ang) + s * h * w * Math.sin(ang),
    });
    const l = back(-1);
    const r = back(1);
    return `M${fmt(l.x)} ${fmt(l.y)}L${fmt(tip.x)} ${fmt(tip.y)}L${fmt(r.x)} ${fmt(r.y)}`;
  };
  return {
    trueNorth: `M${fmt(VERTEX.x)} ${fmt(VERTEX.y)}L${fmt(tn.x)} ${fmt(tn.y)}`,
    trueNorthHead: head(tn, 0),
    gridNorth: `M${fmt(VERTEX.x)} ${fmt(VERTEX.y)}L${fmt(gn.x)} ${fmt(gn.y)}`,
    gridNorthHead: head(gn, rad),
    arc: `M${fmt(a0.x)} ${fmt(a0.y)}A${ARROW.arcR} ${ARROW.arcR} 0 0 1 ${fmt(a1.x)} ${fmt(a1.y)}`,
    tips: { trueNorth: [r1(tn.x), r1(tn.y)], gridNorth: [r1(gn.x), r1(gn.y)] },
    arcMid: [
      r1(VERTEX.x + (ARROW.arcR + 14) * Math.sin(rad / 2)),
      r1(VERTEX.y - (ARROW.arcR + 14) * Math.cos(rad / 2)),
    ],
    arcLen: r1(ARROW.arcR * rad),
  };
}

/** Conservative bounds [x0, y0, x1, y1] of a cubic path's numbers (the curve lies inside its control hull). */
function bbox(a) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < a.length; i += 2) {
    x0 = Math.min(x0, a[i]); x1 = Math.max(x1, a[i]);
    y0 = Math.min(y0, a[i + 1]); y1 = Math.max(y1, a[i + 1]);
  }
  return [x0, y0, x1, y1].map(r1);
}

// ------------------------------------------------------------------ outputs
const outline = outlineNumbers().map(r1);
const cloud = cloudNumbers().map(r1);
if (outline.length !== 2 + 24 * 6 || cloud.length !== outline.length) throw new Error('segment count');
const grid = gridPaths();
const arrows = north();

const GEN = {
  row: { w: ROW.w, h: ROW.h },
  bays: baysPath(),
  outline,
  cloud,
  cloudBox: bbox(cloud),
  view: VIEW,
  vertex: VERTEX,
  angle: ANGLE,
  fieldR: r1(R_FIELD),
  thin: grid.thin,
  heavy: grid.heavy,
  north: arrows,
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}" width="${VIEW.w}" height="${VIEW.h}" role="img" aria-labelledby="t d">
<title id="t">The 1811 grid · about 29° east of true north</title>
<desc id="d">Line drawing of the 1811 street-grid module, set about 29 degrees east of true north. A history diagram, not a map, and not the venue. Generated by pipeline/grid1811.mjs.</desc>
<defs>
<clipPath id="frame"><rect width="${VIEW.w}" height="${VIEW.h}"/></clipPath>
<!-- A-200 morph sources, in the row poster's units (${ROW.w} × ${ROW.h}); never drawn on the grid -->
<path id="row-outline" d="${numbersToPath(outline)}"/>
<path id="hold-cloud" d="${numbersToPath(cloud)}"/>
<path id="row-bays" d="${GEN.bays}"/>
</defs>
<rect width="${VIEW.w}" height="${VIEW.h}" fill="#0B0B0A"/>
<g clip-path="url(#frame)" fill="none" stroke="#9A958C" stroke-linecap="butt">
<g transform="translate(${VERTEX.x} ${VERTEX.y}) rotate(${ANGLE})">
<path d="${grid.thin}" stroke-width="0.75" vector-effect="non-scaling-stroke"/>
<path d="${grid.heavy}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
</g>
</g>
<g fill="none" stroke="#ECE8E1" stroke-width="1.5" stroke-linecap="square">
<path d="${arrows.trueNorth}${arrows.trueNorthHead}" stroke="#9A958C"/>
<path d="${arrows.gridNorth}${arrows.gridNorthHead}"/>
<path d="${arrows.arc}"/>
</g>
<g font-family="Archivo, sans-serif" font-weight="600" font-size="13" letter-spacing="0.8" fill="#ECE8E1" stroke="#0B0B0A" stroke-width="5" paint-order="stroke">
<text x="${arrows.tips.trueNorth[0]}" y="${arrows.tips.trueNorth[1] - 14}" text-anchor="middle" fill="#9A958C">TRUE NORTH</text>
<text x="${arrows.tips.gridNorth[0] + 10}" y="${arrows.tips.gridNorth[1] - 10}">THE 1811 GRID · ABOUT 29° E OF TRUE NORTH</text>
</g>
</svg>
`;

const block = `// <grid1811> generated by pipeline/grid1811.mjs, do not edit by hand
const GEN = ${JSON.stringify(GEN)} as const;
// </grid1811>`;

let stale = false;
mkdirSync(dirname(SVG_OUT), { recursive: true });
let prevSvg = '';
try {
  prevSvg = readFileSync(SVG_OUT, 'utf8');
} catch {
  /* first run */
}
if (prevSvg !== svg) {
  stale = true;
  if (!CHECK) writeFileSync(SVG_OUT, svg);
}

const tsx = readFileSync(TSX, 'utf8');
const re = /\/\/ <grid1811>[\s\S]*?\/\/ <\/grid1811>/;
if (!re.test(tsx)) {
  console.error('grid1811: markers // <grid1811> … // </grid1811> not found in src/sheets/A200Context.tsx');
  process.exit(2);
}
const next = tsx.replace(re, block);
if (next !== tsx) {
  stale = true;
  if (!CHECK) writeFileSync(TSX, next);
}

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1);
if (CHECK) {
  if (stale) {
    console.error('grid1811: outputs are stale; run node pipeline/grid1811.mjs');
    process.exit(1);
  }
  console.log('grid1811: up to date');
} else {
  console.log(`grid1811: wrote public/svg/grid1811.svg (${kb(svg)} kB) and the GEN block (${kb(block)} kB)`);
}
