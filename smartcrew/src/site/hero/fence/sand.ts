// The headline is poured in sand (the boss: "it should look like someone just poured sand over the
// thing, and it filled up the text… as realistic as possible with physics… I want to feel the
// grain texture on the edges of the text").
//
// How it works:
// - The letters start empty: the DOM headline is transparent (fence.css), so nothing shows. It
//   stays transparent: the sand canvas is what you see, start to finish. There is no clean type
//   laid over the grains at the end.
// - A sand grid covers the headline (one cell = one grain, CELL css px). Its mask is the glyphs,
//   drawn into an offscreen canvas one character at a time at the DOM characters' own boxes, so it
//   lines up with the real type. The mask's edge is roughened before the pour: some edge cells are
//   knocked out (notches) and a few loose grains sit just outside the strokes, so the outline is
//   made of grains, never a clean line.
// - Sand pours from the top of the screen (the "pour" canvas), bottom line first. Every falling
//   drop is real sand: it aims at a column of the line being poured and becomes grains where it
//   lands, on the pile in the lowest stroke of that column that isn't full, so the letters fill
//   from the bottom up. Each line gets exactly the sand it holds, on a clock, so nothing is ever
//   filled in at the end.
// - Inside the letters it's a falling-sand automaton: a grain falls if the cell below is free,
//   else slides down-left or down-right, so it piles, forms slopes and settles into the corners.
// - Every grain is drawn at device resolution as a little lit pebble: its own colour, its own
//   shape and size, light from the top left, shade on the bottom right. Between packed grains the
//   gaps are dark; at the edges they're open, so the outline breaks up into grains.
// Reduced motion: the letters are filled at once.

import { holdFirstScreen } from "../../ready";

const DESK_CELL = 2;
const PHONE_CELL = 1.5;
const SUBSTEPS = 3;
const VARIANTS = 14;

type Seg = { y0: number; y1: number; li: number };
type Pat = { a: Float32Array; m: Float32Array };

export function startSand(root: HTMLElement, opts: { phone: boolean }) {
  const h1 = root.querySelector<HTMLElement>(".hf-h1-v");
  const lines = [...root.querySelectorAll<HTMLElement>(".hf-line-in")];
  if (!h1 || !lines.length) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dead = false;
  let raf = 0;
  const offs: (() => void)[] = [];
  // the rest of the page (the 3D Stage, the later scenes) waits for the sand, so none of its heavy
  // start-up work lands in the middle of the pour (../../ready.ts); never for more than 10 s
  const release = holdFirstScreen();
  const holdT = window.setTimeout(release, 10000);
  offs.push(() => window.clearTimeout(holdT), release);
  const stop = () => {
    dead = true;
    cancelAnimationFrame(raf);
    offs.forEach((f) => f());
  };

  // the grain size: S device px a grain, so every grain is drawn on whole pixels ----------------
  let dpr = 1;
  let S = 4;
  let CELL = 2;
  let pats: Pat[] = [];
  let need = new Uint8Array(0); // per pixel: the neighbours a gap pixel faces (1 up, 2 down, 4 left, 8 right)
  const sizeGrain = () => {
    dpr = Math.min(3, window.devicePixelRatio || 1);
    S = Math.max(2, Math.round((opts.phone ? PHONE_CELL : DESK_CELL) * dpr));
    CELL = S / dpr;
    // the grain shapes: a lit ellipsoid each, a little off-centre, a little squashed
    const L = [-0.45, -0.6, 0.66];
    const ll = Math.hypot(L[0], L[1], L[2]);
    const [lx, ly, lz] = L.map((v) => v / ll);
    pats = [];
    for (let v = 0; v < VARIANTS; v++) {
      const r = S * (0.38 + Math.random() * 0.16);
      const ex = 0.8 + Math.random() * 0.4;
      const ey = 2 - ex;
      const cx = S / 2 + (Math.random() - 0.5) * 0.4 * S;
      const cy = S / 2 + (Math.random() - 0.5) * 0.4 * S;
      // a lumpy outline: the radius wobbles with the angle
      const k1 = Math.random() * 6.3;
      const k2 = Math.random() * 6.3;
      const w1 = 0.08 + Math.random() * 0.1;
      const w2 = 0.05 + Math.random() * 0.08;
      const a = new Float32Array(S * S);
      const m = new Float32Array(S * S);
      for (let py = 0; py < S; py++) {
        for (let px = 0; px < S; px++) {
          let cov = 0;
          let sh = 0;
          for (let sy = 0; sy < 4; sy++) {
            for (let sx = 0; sx < 4; sx++) {
              const ux = (px + (sx + 0.5) / 4 - cx) / (r * ex);
              const uy = (py + (sy + 0.5) / 4 - cy) / (r * ey);
              const an = Math.atan2(uy, ux);
              const lump = 1 + w1 * Math.sin(2 * an + k1) + w2 * Math.sin(3 * an + k2);
              const dx = ux / lump;
              const dy = uy / lump;
              const d2 = dx * dx + dy * dy;
              if (d2 >= 1) continue;
              cov++;
              const dif = Math.max(0, dx * lx + dy * ly + Math.sqrt(1 - d2) * lz);
              sh += 0.62 + 0.55 * dif + (dif > 0.95 ? 0.12 : 0);
            }
          }
          a[py * S + px] = cov / 16;
          m[py * S + px] = cov ? sh / cov : 1;
        }
      }
      pats.push({ a, m });
    }
    need = new Uint8Array(S * S);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const h = px * 2 + 1;
        const v = py * 2 + 1;
        need[py * S + px] = (v < S ? 1 : v > S ? 2 : 0) | (h < S ? 4 : h > S ? 8 : 0);
      }
    }
  };

  // the grid ---------------------------------------------------------------------------------
  let gx = 0;
  let gy = 0;
  let gw = 0;
  let gh = 0;
  let mask = new Uint8Array(0); // 0 wall, 1 soil, 2 clay
  let sand = new Uint8Array(0); // 0 empty, else the grain's shape + 1
  let col = new Uint32Array(0); // ABGR per cell
  let segs: Seg[][] = []; // per column, glyph runs, bottom first
  let lineOfRow = new Int16Array(0);
  let lineCols: number[][] = []; // per line: the columns with a stroke of that line
  let lineCells: number[] = []; // per line: how many grains fill it
  let spill: number[][] = []; // per line: the loose grains just outside the strokes
  let clayRects: { x0: number; y0: number; x1: number; y1: number }[] = [];

  const SOIL = [0x2a1f16, 0x3b2c20, 0x1c1510, 0x4a3726, 0x241b14, 0x5a4430, 0x33261b, 0x6b5038, 0x7d5f43, 0x8a6a4a];
  const CLAY = [0xb84f00, 0xd76b22, 0x9c4200, 0xc25a12, 0xa84800, 0xe07a2e];
  const abgr = (rgb: number, k: number) => {
    const r = Math.max(0, Math.min(255, ((rgb >> 16) & 255) * k));
    const g = Math.max(0, Math.min(255, ((rgb >> 8) & 255) * k));
    const b = Math.max(0, Math.min(255, (rgb & 255) * k));
    return (255 << 24) | (b << 16) | (g << 8) | r;
  };
  const grainColor = (m: number) => {
    const r = Math.random();
    if (m === 2) {
      if (r < 0.07) return abgr(0xf3b27a, 0.9 + Math.random() * 0.15);
      if (r < 0.12) return abgr(0x5c2a06, 1);
      return abgr(CLAY[(Math.random() * CLAY.length) | 0], 0.82 + Math.random() * 0.32);
    }
    if (r < 0.11) return abgr(0xc7a77c, 0.75 + Math.random() * 0.45); // light quartz speck
    if (r < 0.17) return abgr(0x0d0a07, 1); // dark speck
    return abgr(SOIL[(Math.random() * SOIL.length) | 0], 0.8 + Math.random() * 0.45);
  };
  const isClay = (x: number, y: number) => clayRects.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);

  const build = () => {
    sizeGrain();
    const rr = root.getBoundingClientRect();
    const hb = h1.getBoundingClientRect();
    gx = hb.left - rr.left - 8;
    gy = hb.top - rr.top - 8;
    gw = Math.ceil((hb.width + 16) / CELL);
    gh = Math.ceil((hb.height + 24) / CELL);
    // draw the glyphs at the DOM characters' boxes
    const mc = document.createElement("canvas");
    mc.width = gw;
    mc.height = gh;
    const m = mc.getContext("2d", { willReadFrequently: true })!;
    const range = document.createRange();
    const clayBoxes: DOMRect[] = [];
    root.querySelectorAll(".hf-fenced").forEach((f) => clayBoxes.push(f.getBoundingClientRect()));
    clayRects = clayBoxes.map((c) => ({ x0: (c.left - hb.left + 8) / CELL - 2, y0: (c.top - hb.top + 8) / CELL - 2, x1: (c.right - hb.left + 8) / CELL + 2, y1: (c.bottom - hb.top + 8) / CELL + 2 }));
    lineOfRow = new Int16Array(gh).fill(-1);
    lines.forEach((el, li) => {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      m.font = `${cs.fontWeight} ${fs / CELL}px ${cs.fontFamily}`;
      m.textBaseline = "alphabetic";
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let top = Infinity;
      let bottom = -Infinity;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent ?? "";
        for (let i = 0; i < t.length; i++) {
          const ch = t[i];
          if (!ch.trim()) continue;
          range.setStart(n, i);
          range.setEnd(n, i + 1);
          const b = range.getBoundingClientRect();
          if (!b.width) continue;
          const mt = m.measureText(ch);
          const sx = mt.width > 0 ? b.width / CELL / mt.width : 1;
          const x = (b.left - hb.left + 8) / CELL;
          const base = (b.top - hb.top + 8) / CELL + (mt.fontBoundingBoxAscent || (fs / CELL) * 0.8);
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          const clay = clayBoxes.some((c) => cx >= c.left && cx <= c.right && cy >= c.top && cy <= c.bottom);
          m.fillStyle = clay ? "#0000ff" : "#ff0000";
          m.save();
          m.translate(x, base);
          m.scale(sx, 1);
          m.fillText(ch, 0, 0);
          m.restore();
          top = Math.min(top, base - (mt.actualBoundingBoxAscent || 0));
          bottom = Math.max(bottom, base + (mt.actualBoundingBoxDescent || 0));
        }
      }
      for (let y = Math.max(0, Math.floor(top) - 1); y <= Math.min(gh - 1, Math.ceil(bottom) + 1); y++) lineOfRow[y] = li;
    });
    const px = m.getImageData(0, 0, gw, gh).data;
    const N = gw * gh;
    const glyph = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (px[i * 4 + 3] > 110) glyph[i] = px[i * 4 + 2] > px[i * 4] ? 2 : 1;
    }

    // the rough edge: knock out some edge cells (and a few behind them), so the outline is notched
    const nb = (a: Uint8Array, i: number, x: number, y: number) => (x > 0 && a[i - 1] ? 1 : 0) + (x < gw - 1 && a[i + 1] ? 1 : 0) + (y > 0 && a[i - gw] ? 1 : 0) + (y < gh - 1 && a[i + gw] ? 1 : 0);
    mask = glyph.slice();
    const knocked = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (!glyph[i]) continue;
      const x = i % gw;
      const y = (i / gw) | 0;
      const open = 4 - nb(glyph, i, x, y);
      if (open && Math.random() < 0.18 + 0.07 * open) {
        mask[i] = 0;
        knocked[i] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      if (!mask[i]) continue;
      const x = i % gw;
      const y = (i / gw) | 0;
      if (nb(knocked, i, x, y) && Math.random() < 0.07) mask[i] = 0;
    }
    // loose grains just outside the strokes: most on the tops of strokes, where poured sand rests
    const ring = new Uint8Array(N);
    const loose: number[] = [];
    for (let i = 0; i < N; i++) {
      if (glyph[i]) continue;
      const x = i % gw;
      const y = (i / gw) | 0;
      if (!nb(glyph, i, x, y)) continue;
      ring[i] = 1;
      const onTop = y < gh - 1 && glyph[i + gw];
      if (Math.random() < (onTop ? 0.13 : 0.055)) loose.push(i);
    }
    for (let i = 0; i < N; i++) {
      if (glyph[i] || ring[i]) continue;
      const x = i % gw;
      const y = (i / gw) | 0;
      if (nb(ring, i, x, y) && Math.random() < 0.012) loose.push(i);
    }
    spill = lines.map(() => []);
    for (const i of loose) {
      const y = (i / gw) | 0;
      let li = -1;
      for (const d of [0, 1, -1, 2, -2, 3, -3]) {
        const yy = y + d;
        if (yy >= 0 && yy < gh && lineOfRow[yy] >= 0) {
          li = lineOfRow[yy];
          break;
        }
      }
      if (li >= 0) spill[li].push(i);
    }
    spill.forEach((s) => s.sort(() => Math.random() - 0.5));

    sand = new Uint8Array(N);
    col = new Uint32Array(N);
    dirty = new Uint8Array(N);
    dlist = [];
    awake = new Uint8Array(gh);
    woken = new Uint8Array(gh);
    segs = [];
    lineCols = lines.map(() => []);
    lineCells = lines.map(() => 0);
    // every stroke run belongs to a line (the nearest one, for a stray run between lines)
    const lineAt = (y0: number, y1: number) => {
      for (let d = 0; d < gh; d++) {
        for (const y of [y1 + d, y0 - d, y1 - d, y0 + d]) if (y >= 0 && y < gh && lineOfRow[y] >= 0) return lineOfRow[y];
      }
      return lines.length - 1;
    };
    for (let x = 0; x < gw; x++) {
      const runs: Seg[] = [];
      let y = gh - 1;
      while (y >= 0) {
        if (mask[y * gw + x]) {
          const y1 = y;
          while (y >= 0 && mask[y * gw + x]) y--;
          runs.push({ y0: y + 1, y1, li: lineAt(y + 1, y1) });
        } else y--;
      }
      segs.push(runs);
      const seen = new Set<number>();
      runs.forEach((r) => {
        lineCells[r.li] += r.y1 - r.y0 + 1;
        if (!seen.has(r.li)) {
          seen.add(r.li);
          lineCols[r.li].push(x);
        }
      });
    }
  };

  // the sand (over the headline), at device resolution, in bands of BAND rows: a frame only
  // uploads the bands where grains moved -------------------------------------------------------
  const BAND = 32;
  const box = document.createElement("div");
  box.className = "hf-sand";
  box.setAttribute("aria-hidden", "true");
  let bands: CanvasRenderingContext2D[] = [];
  let img: ImageData | null = null;
  let dev = new Uint32Array(0);
  let W = 0;
  const place = () => {
    W = gw * S;
    box.replaceChildren();
    box.style.left = `${gx}px`;
    box.style.top = `${gy}px`;
    box.style.width = `${gw * CELL}px`;
    box.style.height = `${gh * CELL}px`;
    bands = [];
    for (let y = 0; y < gh; y += BAND) {
      const rows = Math.min(BAND, gh - y);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = rows * S;
      c.style.top = `${y * CELL}px`;
      c.style.width = `${gw * CELL}px`;
      c.style.height = `${rows * CELL}px`;
      box.appendChild(c);
      bands.push(c.getContext("2d")!);
    }
    bx0 = new Int32Array(bands.length);
    bx1 = new Int32Array(bands.length);
    by0 = new Int32Array(bands.length);
    by1 = new Int32Array(bands.length);
    img = new ImageData(W, gh * S);
    dev = new Uint32Array(img.data.buffer);
  };
  let bx0 = new Int32Array(0);
  let bx1 = new Int32Array(0);
  let by0 = new Int32Array(0);
  let by1 = new Int32Array(0);

  // one grain: its shape, lit, with dark gaps where it packs against its neighbours and open gaps
  // where it faces the outside (that's the grainy edge)
  const paintCell = (i: number) => {
    const x = i % gw;
    const y = (i / gw) | 0;
    const o0 = y * S * W + x * S;
    const v = sand[i];
    if (!v) {
      for (let py = 0; py < S; py++) dev.fill(0, o0 + py * W, o0 + py * W + S);
      return;
    }
    const up = y > 0 && sand[i - gw] ? 1 : 0;
    const dn = y < gh - 1 && sand[i + gw] ? 2 : 0;
    const lf = x > 0 && sand[i - 1] ? 4 : 0;
    const rt = x < gw - 1 && sand[i + 1] ? 8 : 0;
    const nbs = up | dn | lf | rt;
    const c = col[i];
    // the top of a stroke catches the light, the underside is in shade
    const k = !up ? 1.12 : !dn ? 0.84 : 1;
    const r = (c & 255) * k;
    const g = ((c >> 8) & 255) * k;
    const b = ((c >> 16) & 255) * k;
    const p = pats[v - 1];
    for (let py = 0; py < S; py++) {
      const o = o0 + py * W;
      for (let px = 0; px < S; px++) {
        const q = py * S + px;
        const a = p.a[q];
        const mm = p.m[q];
        let R = r * mm;
        let G = g * mm;
        let B = b * mm;
        if (R > 255) R = 255;
        if (G > 255) G = 255;
        if (B > 255) B = 255;
        let A = 255;
        if (a < 1) {
          const nq = need[q];
          if ((nbs & nq) === nq) {
            // packed: the gap is the shadow between grains
            R = r * 0.45 + (R - r * 0.45) * a;
            G = g * 0.45 + (G - g * 0.45) * a;
            B = b * 0.45 + (B - b * 0.45) * a;
          } else {
            A = (a * 255) | 0;
            if (A < 10) {
              dev[o + px] = 0;
              continue;
            }
          }
        }
        dev[o + px] = (A << 24) | ((B | 0) << 16) | ((G | 0) << 8) | (R | 0);
      }
    }
  };
  let dirty = new Uint8Array(0);
  let dlist: number[] = [];
  const touch = (k: number) => {
    if (k < 0 || k >= dirty.length || dirty[k]) return;
    dirty[k] = 1;
    dlist.push(k);
  };
  const mark = (i: number) => {
    touch(i);
    touch(i - 1);
    touch(i + 1);
    touch(i - gw);
    touch(i + gw);
  };
  const flush = () => {
    if (!img || !dlist.length) return;
    bx0.fill(gw);
    bx1.fill(-1);
    by0.fill(gh);
    by1.fill(-1);
    for (const k of dlist) {
      dirty[k] = 0;
      paintCell(k);
      const x = k % gw;
      const y = (k / gw) | 0;
      const b = (y / BAND) | 0;
      if (x < bx0[b]) bx0[b] = x;
      if (x > bx1[b]) bx1[b] = x;
      if (y < by0[b]) by0[b] = y;
      if (y > by1[b]) by1[b] = y;
    }
    dlist.length = 0;
    for (let b = 0; b < bands.length; b++) {
      if (bx1[b] < 0) continue;
      bands[b].putImageData(img, 0, -b * BAND * S, bx0[b] * S, by0[b] * S, (bx1[b] - bx0[b] + 1) * S, (by1[b] - by0[b] + 1) * S);
    }
  };
  const paintAll = () => {
    if (!img) return;
    for (let i = 0; i < sand.length; i++) paintCell(i);
    dirty.fill(0);
    dlist.length = 0;
    bands.forEach((c, b) => c.putImageData(img!, 0, -b * BAND * S, 0, b * BAND * S, W, Math.min(BAND, gh - b * BAND) * S));
  };

  const add = (i: number, m: number) => {
    sand[i] = 1 + ((Math.random() * VARIANTS) | 0);
    col[i] = grainColor(m);
    mark(i);
    wake(i);
  };
  // sand that's come to rest: in a stroke, on the floor of it or on more sand (not still falling)
  const resting = (k: number) => sand[k] > 0 && mask[k] > 0 && (k + gw >= mask.length || !mask[k + gw] || sand[k + gw] > 0);
  const nearSand = (i: number) => {
    const x = i % gw;
    const y = (i / gw) | 0;
    for (let d = 1; d <= 2; d++) {
      if (x - d >= 0 && resting(i - d)) return true;
      if (x + d < gw && resting(i + d)) return true;
      if (y - d >= 0 && resting(i - d * gw)) return true;
      if (y + d < gh && resting(i + d * gw)) return true;
    }
    return false;
  };
  const addLoose = (i: number) => {
    if (sand[i]) return;
    add(i, isClay(i % gw, (i / gw) | 0) ? 2 : 1);
  };

  // the falling sand (the strip above the headline) -------------------------------------------
  const sv = document.createElement("canvas");
  sv.className = "hf-pour";
  sv.setAttribute("aria-hidden", "true");
  const sctx = sv.getContext("2d")!;

  // physics ----------------------------------------------------------------------------------
  let flip = false;
  let moved = 0;
  // only rows where something can move are scanned: a row wakes when a grain lands in it or a
  // grain leaves it or a row next to it
  let awake = new Uint8Array(0);
  let woken = new Uint8Array(0);
  const wake = (i: number) => {
    const y = (i / gw) | 0;
    if (y > 0) woken[y - 1] = 1;
    woken[y] = 1;
    if (y < gh - 1) woken[y + 1] = 1;
  };
  const move = (i: number, j: number) => {
    moved++;
    sand[j] = sand[i];
    col[j] = col[i];
    sand[i] = 0;
    mark(i);
    mark(j);
    wake(i);
    wake(j);
  };
  const stepSand = () => {
    flip = !flip;
    const t = awake;
    awake = woken;
    woken = t;
    woken.fill(0);
    for (let y = gh - 2; y >= 0; y--) {
      if (!awake[y]) continue;
      const row = y * gw;
      for (let k = 0; k < gw; k++) {
        const x = flip ? k : gw - 1 - k;
        const i = row + x;
        // loose grains outside the strokes stay where they landed
        if (!sand[i] || !mask[i]) continue;
        const d = i + gw;
        if (mask[d] && !sand[d]) {
          move(i, d);
          continue;
        }
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (const s of [dir, -dir]) {
          const nx = x + s;
          if (nx < 0 || nx >= gw) continue;
          const j = d + s;
          // slide only if the side cell is open too (no tunnelling through a stroke's wall)
          if (mask[j] && !sand[j] && mask[i + s] && !sand[i + s]) {
            move(i, j);
            break;
          }
        }
      }
    }
  };

  // drop a grain into column x of line li: into the lowest stroke of that line in that column that
  // isn't full, a few grains above the pile already in it (the falling curtain carries it down to
  // there, so the empty letters never show before the sand reaches them)
  const entry = (x: number, li: number): number => {
    for (const r of segs[x]) {
      if (r.li !== li || sand[r.y0 * gw + x]) continue;
      let y = r.y0;
      while (y < r.y1 && !sand[(y + 1) * gw + x]) y++;
      return Math.max(r.y0, y - ((Math.random() * 5) | 0)) * gw + x;
    }
    return -1;
  };
  // a random column of the line with room left (full columns drop out of the list)
  let room: number[][] = [];
  const pick = (li: number): number => {
    const c = room[li];
    while (c.length) {
      const k = (Math.random() * c.length) | 0;
      const e = entry(c[k], li);
      if (e >= 0) return e;
      c[k] = c[c.length - 1];
      c.pop();
    }
    return -1;
  };
  // fill at once (reduced motion, resizes): every stroke cell and every loose grain
  const fillNow = () => {
    for (let i = 0; i < mask.length; i++) if (mask[i] && !sand[i]) add(i, mask[i]);
    spill.forEach((s) => s.forEach(addLoose));
  };
  const finish = () => {
    root.classList.remove("is-sand-failed");
    root.classList.add("is-sanded");
    window.setTimeout(() => sv.remove(), 450);
    release();
  };

  // resizes rebuild the grid and refill at once (a resize mid-pour is caught up at the end)
  let poured = false;
  let stale = false;
  let resizeT = 0;
  const rebuild = () => {
    build();
    place();
    fillNow();
    paintAll();
  };
  const onResize = () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      if (dead) return;
      if (!poured) {
        stale = true;
        return;
      }
      rebuild();
    }, 160);
  };
  window.addEventListener("resize", onResize);
  offs.push(() => window.removeEventListener("resize", onResize));

  // the pour ---------------------------------------------------------------------------------
  const run = () => {
    if (dead) return;
    const tb0 = performance.now();
    build();
    place();
    const buildMs = performance.now() - tb0;
    const prof: number[][] | null = /[?&]sandDebug/.test(location.search) ? [] : null;
    const stats = { buildMs: 0, popped: 0, tailFrames: 0 };
    if (prof) (window as unknown as { __sand: unknown }).__sand = { prof, stats, get gw() { return gw; }, get gh() { return gh; }, get S() { return S; }, cells: () => lineCells, mask: () => mask, sand: () => sand };
    stats.buildMs = buildMs;
    root.appendChild(sv);
    root.appendChild(box);
    if (reduced) {
      fillNow();
      paintAll();
      poured = true;
      finish();
      return;
    }
    // the curtain only needs the strip from the top of the screen down to the headline's bottom
    const pdpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = gw * CELL;
    const ch = gy + gh * CELL;
    sv.style.left = `${gx}px`;
    sv.style.width = `${cw}px`;
    sv.style.height = `${ch}px`;
    sv.width = Math.round(cw * pdpr);
    sv.height = Math.round(ch * pdpr);

    // The pour. Every grain you see falling is a grain that fills a letter: each falling drop
    // carries a few grains, aims at a column of the line being poured, and becomes sand where it
    // lands, on top of the pile already there. Nothing appears without falling, and nothing falls
    // where the sand isn't rising.
    // Bottom line first; each line's pour overlaps the next a little. Each line gets exactly the
    // sand it holds, on a clock: the flow eases in and out like a bucket tipped and lifted
    // (smoothstep), so the letters fill evenly and are full when the line's pour ends. The clock
    // only moves on by a frame's worth at a time: if the browser stalls, the pour waits for it
    // instead of catching up in one lump.
    const order = lines.map((_, i) => lines.length - 1 - i);
    const POUR = opts.phone ? 1250 : 1400;
    const GAP = opts.phone ? 1000 : 1100;
    const END = (order.length - 1) * GAP + POUR;
    const K = opts.phone ? 2 : 3; // grains a falling drop carries
    const G = 2200; // px/s², the fall
    const sent = lines.map(() => 0);
    // grains on their way to each column, so the last drops aren't sent to a column that's full
    const pending = new Int32Array(gw);
    const free = (x: number, li: number) => {
      let n = 0;
      for (const r of segs[x]) if (r.li === li) for (let y = r.y0; y <= r.y1; y++) if (!sand[y * gw + x]) n++;
      return n;
    };
    room = lineCols.map((c) => c.slice());
    let clock = 0;
    let last = performance.now();
    let tail = 0;

    type Drop = { x: number; y: number; vy: number; ty: number; aimed: boolean; c: number; li: number; k: number; stray: number; s: number };
    const drops: Drop[] = [];
    const SOIL_FALL = ["#2a1f16", "#3b2c20", "#4a3726", "#1c1510", "#6b5038", "#8a6a4a"];
    const CLAY_FALL = ["#b84f00", "#d76b22", "#9c4200", "#c25a12"];
    const COLORS = [...SOIL_FALL, ...CLAY_FALL];
    const drop = (e: number, li: number, k: number, stray = -1) => {
      const x = e % gw;
      const row = (e / gw) | 0;
      const clay = mask[e] === 2 || isClay(x, row);
      if (stray < 0) pending[x] += k;
      drops.push({
        x: x * CELL + (Math.random() - 0.5) * CELL,
        y: -Math.random() * 60,
        vy: 380 + Math.random() * 200,
        ty: gy + row * CELL,
        aimed: false,
        c: clay ? SOIL_FALL.length + ((Math.random() * CLAY_FALL.length) | 0) : (Math.random() * SOIL_FALL.length) | 0,
        li,
        k,
        stray,
        s: CELL * (0.7 + Math.random() * 0.5),
      });
    };
    // a drop lands: its grains go onto the pile in its column (or the next one along, if that
    // column has filled up meanwhile); any that find no room go back to be poured again
    const land = (d: Drop) => {
      if (d.stray >= 0) {
        addLoose(d.stray);
        return;
      }
      const cx = Math.min(gw - 1, Math.max(0, Math.round(d.x / CELL)));
      pending[cx] -= d.k;
      let left = d.k;
      for (const o of [0, -1, 1, -2, 2, -3, 3]) {
        const x = cx + o;
        if (x < 0 || x >= gw) continue;
        while (left > 0) {
          const e = entry(x, d.li);
          if (e < 0) break;
          add(e, mask[e]);
          left--;
        }
        if (!left) break;
      }
      sent[d.li] -= left;
    };

    const tick = (now: number) => {
      if (dead) return;
      const adv = Math.min(34, Math.max(0, now - last));
      last = now;
      clock += adv;
      const dt = adv / 1000;

      if (clock <= END) {
        order.forEach((li, k) => {
          const u = Math.min(1, Math.max(0, (clock - k * GAP) / POUR));
          if (u <= 0) return;
          const target = Math.round(lineCells[li] * u * u * (3 - 2 * u));
          while (sent[li] < target) {
            const e = pick(li);
            if (e < 0) break;
            const n = Math.min(K, target - sent[li]);
            drop(e, li, n);
            sent[li] += n;
          }
        });
      } else {
        // the tail: any gap left is topped up from above, a few drops a frame, until it's full
        if (tail++ % 12 === 0) room = lineCols.map((c) => c.slice());
        order.forEach((li) => {
          for (let q = 0; q < 24; q++) {
            const e = pick(li);
            if (e < 0) break;
            // never more than the column can still take, counting the drops already on their way
            const x = e % gw;
            if (free(x, li) > pending[x]) drop(e, li, 1);
          }
        });
      }
      // the strays: grains that bounce off and come to rest on and beside the strokes, only once
      // there's sand there for them to rest against
      spill.forEach((sp, li) => {
        for (let q = sp.length - 1; q >= 0; q--) {
          if (Math.random() > (tail ? 0.3 : 0.1) || !(tail > 20 || nearSand(sp[q]))) continue;
          drop(sp[q], li, 1, sp[q]);
          sp[q] = sp[sp.length - 1];
          sp.pop();
        }
      });

      // the drops fall; each one re-aims at its column's pile as it nears it, and lands on it
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += G * dt;
        d.y += d.vy * dt;
        if (!d.aimed && d.stray < 0 && d.ty - d.y < 60) {
          d.aimed = true;
          const e = entry(Math.round(d.x / CELL), d.li);
          if (e >= 0) d.ty = gy + ((e / gw) | 0) * CELL;
        }
        if (d.y >= d.ty) {
          land(d);
          drops[i] = drops[drops.length - 1];
          drops.pop();
        }
      }

      const ta = performance.now();
      moved = 0;
      const steps = Math.min(6, Math.max(1, Math.round((adv / 16.7) * SUBSTEPS)));
      for (let q = 0; q < steps; q++) stepSand();
      const tb = performance.now();
      const nd = dlist.length;
      flush();
      const tc = performance.now();
      if (prof) prof.push([tb - ta, tc - tb, nd, drops.length]);

      // draw the falling drops, one path per colour
      sctx.setTransform(pdpr, 0, 0, pdpr, 0, 0);
      sctx.clearRect(0, 0, sv.width, sv.height);
      for (let c = 0; c < COLORS.length; c++) {
        sctx.beginPath();
        let any = false;
        for (const d of drops) {
          if (d.c !== c || d.y < -20) continue;
          any = true;
          // a grain, a little drawn out by its speed
          sctx.rect(d.x, d.y, d.s, d.s * (1 + Math.min(1.6, d.vy / 900)));
        }
        if (!any) continue;
        sctx.fillStyle = COLORS[c];
        sctx.fill();
      }

      const full = room.every((c) => !c.length);
      const quiet = !moved && !drops.length && full && spill.every((sp) => !sp.length);
      if (clock <= END || (tail < 180 && !quiet)) {
        raf = requestAnimationFrame(tick);
        return;
      }
      poured = true;
      stats.tailFrames = tail;
      if (stale) rebuild();
      else {
        // whatever is left (should be nothing) goes in now
        const before = dlist.length;
        fillNow();
        stats.popped = dlist.length - before;
        flush();
      }
      finish();
    };
    raf = requestAnimationFrame(tick);
  };

  // start once the headline has its final size (fonts in, the engine has laid it out)
  const ready = async () => {
    try {
      await document.fonts.ready;
    } catch {
      /* go anyway */
    }
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    for (let k = 0; k < 60 && !root.classList.contains("is-laid"); k++) await wait(50);
    // the headline sizes itself to the screen and its lines slide into place (engine.ts): the
    // engine marks one line .is-set once the last line has landed. Then wait for the type to hold
    // still for two frames, so the sand grid matches the real type
    for (let k = 0; k < 40 && !root.querySelector(".hf-line.is-set"); k++) await wait(30);
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const sig = () => {
      const r = h1.getBoundingClientRect();
      const c = lines[lines.length - 1].getBoundingClientRect();
      return `${r.width.toFixed(1)}x${r.height.toFixed(1)}@${r.left.toFixed(1)},${r.top.toFixed(1)}|${c.top.toFixed(1)}`;
    };
    let prev = "";
    for (let k = 0; k < 30; k++) {
      const now = sig();
      if (now === prev) break;
      prev = now;
      await frame();
      await frame();
    }
    run();
  };
  void ready();

  // never leave the headline invisible
  const guard = window.setTimeout(() => {
    if (!root.classList.contains("is-sanded")) root.classList.add("is-sand-failed");
    release();
  }, 15000);
  offs.push(() => window.clearTimeout(guard));
  return stop;
}
