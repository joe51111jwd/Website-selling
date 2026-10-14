// The headline is poured in sand (the boss: "it should look like someone just poured sand over the
// thing, and it filled up the text… as realistic as possible with physics… a heavy grain texture").
//
// How it works:
// - The letters start empty: the DOM headline is transparent (fence.css), so nothing shows.
// - A sand grid covers the headline (one cell = CELL px). Its mask is the glyphs, drawn into an
//   offscreen canvas one character at a time at the DOM characters' own boxes, so the mask lines up
//   with the real type. Outside the glyphs is wall.
// - Sand pours from the top of the screen in a falling curtain (the "stream" canvas). Each grain
//   that reaches the headline enters a letter at the top of the lowest stroke in its column that
//   isn't full yet, so the letters fill from the bottom up, bottom line first.
// - Inside the letters it's a falling-sand automaton: a grain falls if the cell below is free,
//   else slides down-left or down-right, so it piles, forms slopes and settles into the corners.
// - Every grain gets its own colour (dark soil browns with light and dark specks; orange clay in
//   the key phrase): the texture is the grain itself.
// - When the pour is done the sand picture becomes the DOM headline's own fill (background-clip:
//   text), so the edges are the real glyph edges, it stays selectable and it survives resizes.
// Reduced motion: the letters are filled at once.

const CELL = 1.5;
const SUBSTEPS = 3;

type Seg = { y0: number; y1: number };

export function startSand(root: HTMLElement, opts: { phone: boolean }) {
  const h1 = root.querySelector<HTMLElement>(".hf-h1-v");
  const lines = [...root.querySelectorAll<HTMLElement>(".hf-line-in")];
  if (!h1 || !lines.length) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dead = false;
  let raf = 0;
  const offs: (() => void)[] = [];
  const stop = () => {
    dead = true;
    cancelAnimationFrame(raf);
    offs.forEach((f) => f());
  };

  // the grid ---------------------------------------------------------------------------------
  let gx = 0;
  let gy = 0;
  let gw = 0;
  let gh = 0;
  let mask = new Uint8Array(0); // 0 wall, 1 soil, 2 clay
  let sand = new Uint8Array(0); // 0 empty, 1 sand
  let col = new Uint32Array(0); // ABGR per cell
  let segs: Seg[][] = []; // per column, glyph runs, bottom first
  let lineOfRow = new Int16Array(0);
  let lineCols: number[][] = [];
  let clayRects: { x0: number; y0: number; x1: number; y1: number }[] = [];

  const SOIL = [0x2a1f16, 0x3b2c20, 0x1c1510, 0x4a3726, 0x241b14, 0x5a4430, 0x33261b, 0x6b5038, 0x7d5f43];
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
      if (r < 0.06) return abgr(0xf3b27a, 1);
      if (r < 0.1) return abgr(0x5c2a06, 1);
      return abgr(CLAY[(Math.random() * CLAY.length) | 0], 0.85 + Math.random() * 0.3);
    }
    if (r < 0.1) return abgr(0xc7a77c, 0.75 + Math.random() * 0.45); // light quartz speck
    if (r < 0.16) return abgr(0x0d0a07, 1); // dark speck
    return abgr(SOIL[(Math.random() * SOIL.length) | 0], 0.8 + Math.random() * 0.45);
  };

  const build = () => {
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
      const font = `${cs.fontWeight} ${fs / CELL}px ${cs.fontFamily}`;
      m.font = font;
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
    mask = new Uint8Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) {
      const a = px[i * 4 + 3];
      if (a > 110) mask[i] = px[i * 4 + 2] > px[i * 4] ? 2 : 1;
    }
    sand = new Uint8Array(gw * gh);
    col = new Uint32Array(gw * gh);
    segs = [];
    lineCols = lines.map(() => []);
    for (let x = 0; x < gw; x++) {
      const runs: Seg[] = [];
      let y = gh - 1;
      while (y >= 0) {
        if (mask[y * gw + x]) {
          const y1 = y;
          while (y >= 0 && mask[y * gw + x]) y--;
          runs.push({ y0: y + 1, y1 });
        } else y--;
      }
      segs.push(runs);
      const seen = new Set<number>();
      runs.forEach((r) => {
        const li = lineOfRow[r.y1] >= 0 ? lineOfRow[r.y1] : lineOfRow[r.y0];
        if (li >= 0 && !seen.has(li)) {
          seen.add(li);
          lineCols[li].push(x);
        }
      });
    }
  };

  // the sand canvas (over the headline) ------------------------------------------------------
  const cv = document.createElement("canvas");
  cv.className = "hf-sand";
  cv.setAttribute("aria-hidden", "true");
  const ctx = cv.getContext("2d")!;
  let img: ImageData | null = null;
  let buf32 = new Uint32Array(0);
  const place = () => {
    cv.width = gw;
    cv.height = gh;
    cv.style.left = `${gx}px`;
    cv.style.top = `${gy}px`;
    cv.style.width = `${gw * CELL}px`;
    cv.style.height = `${gh * CELL}px`;
    img = ctx.createImageData(gw, gh);
    buf32 = new Uint32Array(img.data.buffer);
  };
  const paint = () => {
    if (!img) return;
    for (let i = 0; i < sand.length; i++) buf32[i] = sand[i] ? col[i] : 0;
    ctx.putImageData(img, 0, 0);
  };

  // the falling curtain (over the whole hero) ------------------------------------------------
  const sv = document.createElement("canvas");
  sv.className = "hf-pour";
  sv.setAttribute("aria-hidden", "true");
  const sctx = sv.getContext("2d")!;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  type Drop = { x: number; y: number; vy: number; tx: number; ty: number; c: string; s: number };
  const drops: Drop[] = [];
  const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

  // physics ----------------------------------------------------------------------------------
  let flip = false;
  const stepSand = () => {
    flip = !flip;
    for (let y = gh - 2; y >= 0; y--) {
      const row = y * gw;
      for (let k = 0; k < gw; k++) {
        const x = flip ? k : gw - 1 - k;
        const i = row + x;
        if (!sand[i]) continue;
        const d = i + gw;
        if (mask[d] && !sand[d]) {
          sand[d] = 1;
          col[d] = col[i];
          sand[i] = 0;
          continue;
        }
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (const s of [dir, -dir]) {
          const nx = x + s;
          if (nx < 0 || nx >= gw) continue;
          const j = d + s;
          // slide only if the side cell is open too (no tunnelling through a stroke's wall)
          if (mask[j] && !sand[j] && mask[i + s] && !sand[i + s]) {
            sand[j] = 1;
            col[j] = col[i];
            sand[i] = 0;
            break;
          }
        }
      }
    }
  };

  // drop a grain into column x: the top of the lowest stroke in that column that isn't full
  const entry = (x: number): number => {
    for (const r of segs[x]) {
      const top = r.y0 * gw + x;
      if (!sand[top]) return top;
    }
    return -1;
  };
  // the end: the sand picture becomes the headline's own fill --------------------------------
  const settle = () => {
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] && !sand[i]) {
        sand[i] = 1;
        col[i] = grainColor(mask[i]);
      }
    }
    paint();
  };
  // the picture the letters keep: the poured grains, and grains all round them too, so the real
  // glyph edges (which the grid only approximates) never show a gap
  const isClay = (x: number, y: number) => clayRects.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
  const fillAll = () => {
    for (let i = 0; i < mask.length; i++) {
      if (sand[i]) continue;
      const x = i % gw;
      const y = (i / gw) | 0;
      sand[i] = 1;
      col[i] = grainColor(isClay(x, y) ? 2 : 1);
    }
    paint();
  };
  const handOver = () => {
    fillAll();
    const url = cv.toDataURL("image/png");
    // each line shows its own window onto the one sand picture
    const rr = root.getBoundingClientRect();
    lines.forEach((el) => {
      const b = el.getBoundingClientRect();
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundSize = `${gw * CELL}px ${gh * CELL}px`;
      el.style.backgroundPosition = `${gx - (b.left - rr.left)}px ${gy - (b.top - rr.top)}px`;
    });
    // the key phrase is its own box (inline-block): it needs its own window onto the picture
    root.querySelectorAll<HTMLElement>(".hf-fenced").forEach((el) => {
      const b = el.getBoundingClientRect();
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundSize = `${gw * CELL}px ${gh * CELL}px`;
      el.style.backgroundPosition = `${gx - (b.left - rr.left)}px ${gy - (b.top - rr.top)}px`;
    });
    root.classList.remove("is-sand-failed");
    root.classList.add("is-sanded");
    window.setTimeout(() => {
      cv.remove();
      sv.remove();
    }, 450);
  };

  // resizes after the pour: rebuild the grid and refill at once
  let resizeT = 0;
  const onResize = () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      if (!root.classList.contains("is-sanded")) return;
      build();
      place();
      for (let i = 0; i < mask.length; i++) if (mask[i]) col[i] = grainColor(mask[i]);
      settle();
      handOver();
    }, 160);
  };
  window.addEventListener("resize", onResize);
  offs.push(() => window.removeEventListener("resize", onResize));

  // the pour ---------------------------------------------------------------------------------
  const run = () => {
    if (dead) return;
    build();
    place();
    if (/[?&]sandDebug/.test(location.search)) (window as unknown as { __sand: unknown }).__sand = { get gw() { return gw; }, get gh() { return gh; }, mask: () => mask, sand: () => sand, lineCols: () => lineCols.map((c) => c.length), drops: () => drops.length };
    root.appendChild(sv);
    root.appendChild(cv);
    if (reduced) {
      for (let i = 0; i < mask.length; i++) if (mask[i]) col[i] = grainColor(mask[i]);
      settle();
      handOver();
      return;
    }
    const rr = root.getBoundingClientRect();
    sv.width = Math.round(rr.width * dpr);
    sv.height = Math.round(rr.height * dpr);

    // bottom line first; each line's pour overlaps the next a little
    const order = lines.map((_, i) => lines.length - 1 - i);
    const POUR = opts.phone ? 1150 : 1300;
    const GAP = opts.phone ? 820 : 900;
    const t0 = performance.now();
    const rate = opts.phone ? 70 : 150; // grains entering per frame at full flow
    let last = t0;

    const tick = (now: number) => {
      if (dead) return;
      const t = now - t0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      order.forEach((li, k) => {
        const start = k * GAP;
        const lt = t - start;
        if (lt < 0 || lt > POUR + 600) return;
        const cols = lineCols[li];
        if (!cols.length) return;
        // the flow eases in and out like a bucket tipped and lifted
        const flow = lt < POUR ? Math.sin(Math.min(1, lt / POUR) * Math.PI) ** 0.6 : 0;
        const n = Math.round(rate * flow);
        for (let q = 0; q < n; q++) {
          const x = cols[(Math.random() * cols.length) | 0];
          const e = entry(x);
          if (e < 0) continue;
          sand[e] = 1;
          col[e] = grainColor(mask[e]);
        }
        // the visible curtain above the headline
        const vis = Math.round((opts.phone ? 5 : 11) * flow);
        for (let q = 0; q < vis; q++) {
          const x = cols[(Math.random() * cols.length) | 0];
          const e = entry(x);
          const ty = e >= 0 ? Math.floor(e / gw) : segs[x][0]?.y0 ?? 0;
          const clay = e >= 0 && mask[e] === 2;
          const pal = clay ? [0xb84f00, 0xd76b22, 0x9c4200] : [0x2a1f16, 0x3b2c20, 0x4a3726, 0x1c1510];
          drops.push({
            x: gx + x * CELL + (Math.random() - 0.5) * 3,
            y: -Math.random() * 120,
            vy: 380 + Math.random() * 200,
            tx: 0,
            ty: gy + ty * CELL,
            c: hex(pal[(Math.random() * pal.length) | 0]),
            s: (opts.phone ? 1.2 : 1.6) + Math.random() * 1.6,
          });
        }
      });

      for (let s = 0; s < SUBSTEPS; s++) stepSand();
      paint();

      // the curtain
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, sv.width, sv.height);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += 2200 * dt;
        d.y += d.vy * dt;
        if (d.y >= d.ty) {
          drops.splice(i, 1);
          continue;
        }
        sctx.fillStyle = d.c;
        sctx.fillRect(d.x, d.y, d.s, d.s * (1 + Math.min(3, d.vy / 700)));
      }

      const lastStart = (order.length - 1) * GAP;
      const done = t > lastStart + POUR + 700 && !drops.length;
      if (!done) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // whatever the pour couldn't reach (under overhangs) settles in, then hand over
      let n = 0;
      const sprinkle = () => {
        if (dead) return;
        let left = 0;
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] && !sand[i]) {
            left++;
            if (Math.random() < 0.35) {
              sand[i] = 1;
              col[i] = grainColor(mask[i]);
            }
          }
        }
        for (let s = 0; s < SUBSTEPS; s++) stepSand();
        paint();
        if (left > 0 && n++ < 14) raf = requestAnimationFrame(sprinkle);
        else {
          settle();
          handOver();
        }
      };
      raf = requestAnimationFrame(sprinkle);
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
    // the headline sizes itself to the screen and its lines slide into place: wait until every
    // line has landed and the box has stopped changing, so the sand grid matches the real type
    const lineEls = [...root.querySelectorAll(".hf-line")];
    for (let k = 0; k < 60 && !lineEls.every((l) => l.classList.contains("is-set")); k++) await wait(50);
    let prev = "";
    for (let k = 0; k < 30; k++) {
      const r = h1.getBoundingClientRect();
      const sig = `${r.width.toFixed(1)}x${r.height.toFixed(1)}@${r.left.toFixed(1)},${r.top.toFixed(1)}`;
      if (sig === prev) break;
      prev = sig;
      await wait(90);
    }
    run();
  };
  void ready();

  // never leave the headline invisible
  const guard = window.setTimeout(() => {
    if (!root.classList.contains("is-sanded")) root.classList.add("is-sand-failed");
  }, 15000);
  offs.push(() => window.clearTimeout(guard));
  return stop;
}
