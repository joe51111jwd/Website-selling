// Screenshot the mocks as they really render, and measure the plate under every text box.
//   python3 mock/build_img.py && node mock/shoot.cjs
// Writes out/mock/{desktop-hero,phone-hero,desktop-redline,desktop-finale}.png and prints, per text box, the
// relative luminance of the render behind it (95th percentile; brief 7.7 wants <= 0.15 under cream text) and
// the resulting contrast ratio of cream #EEF0EC against that 95th-percentile pixel.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.MOCK_OUT || path.join(ROOT, 'out', 'mock');
const SERVE = process.env.MOCK_DIR || __dirname;
fs.mkdirSync(OUT, { recursive: true });
const D = { width: 1440, height: 900 }, P = { width: 390, height: 844 };
const shots = [
  ['index.html', 'desktop-hero', D, false],
  ['index.html', 'phone-hero', P, true],
  ['beat-hire.html', 'desktop-b2-hire', D, false],
  ['beat-twelve.html', 'desktop-b2-twelve', D, false],
  ['beat-twelve.html', 'phone-b2-twelve', P, true],
  ['beat-touch.html', 'desktop-b3-touch', D, false],
  ['beat-touch.html', 'phone-b3-touch', P, true],
  ['beat-under.html', 'desktop-b4-under', D, false],
  ['beat-under.html', 'phone-b4-under', P, true],
  ['beat-redline.html', 'desktop-b5-redline', D, false],
  ['beat-redline.html', 'phone-b5-redline', P, true],
  ['beat-turn.html', 'desktop-b6-turn', D, false],
  ['beat-turn.html', 'phone-b6-turn', P, true],
  ['beat-side.html', 'desktop-b6-side', D, false],
  ['beat-down.html', 'desktop-b7-down', D, false],
  ['beat-offer.html', 'desktop-b7-offer', D, false],
  ['beat-offer.html', 'phone-b7-offer', P, true],
  ['beat-cycle2.html', 'desktop-b8-cycle2', D, false],
  ['beat-repeat.html', 'desktop-b8-repeat', D, false],
  ['beat-oxygen.html', 'desktop-b9-oxygen', D, false],
  ['beat-oxygen.html', 'phone-b9-oxygen', P, true],
  ['finale.html', 'desktop-finale', D, false],
  ['finale.html', 'phone-finale', P, true],
];
const only = process.argv[2];
// a tiny static server (file:// would taint the canvas used for the luminance check)
const http = require('http');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const f = path.join(SERVE, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(SERVE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const report = {};
  for (const [file, name, vp, mobile] of shots) {
    if (only && !name.includes(only)) continue;
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => errors.push('failed ' + r.url()));
    await page.goto(BASE + file, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // two frames for the dock's IntersectionObserver to report (one button per screen), then settle
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(600);
    const out = path.join(OUT, name + '.png');
    await page.screenshot({ path: out });
    // luminance of the plate under each text block: draw the <img> into a canvas at viewport size (cover) and sample
    const zones = await page.evaluate(async () => { try {
      const img = document.querySelector('.stage picture img');
      await img.decode();
      const W = innerWidth, H = innerHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      const src = img.currentSrc ? Object.assign(new Image(), { src: img.currentSrc }) : img;
      if (src !== img) await src.decode();
      const s = Math.max(W / src.naturalWidth, H / src.naturalHeight);
      const dw = src.naturalWidth * s, dh = src.naturalHeight * s;
      g.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
      // composite the functional top scrim exactly as CSS draws it (sRGB blending, like the browser)
      const scrim = document.querySelector('.scrim-top');
      if (scrim) {
        const h = scrim.getBoundingClientRect().height;
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(13,17,16,0.4)'); gr.addColorStop(1, 'rgba(13,17,16,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, h);
      }
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const sel = ['.lockup', '.dock', '.audience', '.tag-water', '.tag-mark', '.tag-tick', '.tag-deck', '.tag-margin span', '.tag-scar', '.question', '.readout', '.band', '.bandline', '.sell', '.cue', '.instrument .q', '.legend', '.caption', '.offer', '.cluster .lead', '.fspec', '.fform', '.bookline'];
      const res = {};
      for (const q of sel) {
        const el = document.querySelector(q);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || getComputedStyle(el).display === 'none') continue;
        const x = Math.max(0, Math.floor(r.left)), y = Math.max(0, Math.floor(r.top));
        const w = Math.min(W - x, Math.ceil(r.width)), h = Math.min(H - y, Math.ceil(r.height));
        // an element with its own solid background (the phone's top strip) is its own plate
        const bgc = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (bgc && bgc.length === 4 && +bgc[3] >= 0.9) {
          const Lb = 0.2126 * lin(+bgc[0]) + 0.7152 * lin(+bgc[1]) + 0.0722 * lin(+bgc[2]);
          const cream0 = 0.2126 * lin(0xEE) + 0.7152 * lin(0xF0) + 0.0722 * lin(0xEC);
          res[q] = { box: [x, y, w, h], p95: +Lb.toFixed(3), median: +Lb.toFixed(3), contrastAtP95: +((cream0 + 0.05) / (Lb + 0.05)).toFixed(2), plate: 'own background' };
          continue;
        }
        const d = g.getImageData(x, y, w, h).data;
        const L = [];
        for (let i = 0; i < d.length; i += 4 * 3) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
        L.sort((a, b) => a - b);
        const p95 = L[Math.floor(L.length * 0.95)], med = L[Math.floor(L.length * 0.5)];
        const cream = 0.2126 * lin(0xEE) + 0.7152 * lin(0xF0) + 0.0722 * lin(0xEC);
        res[q] = { box: [x, y, w, h], p95: +p95.toFixed(3), median: +med.toFixed(3), contrastAtP95: +((cream + 0.05) / (p95 + 0.05)).toFixed(2) };
      }
      // Overlap check (review round 2): no two positioned text boxes may come within 12 px of each other, and no
      // text box may sit on the rendered sentence (its anchors box, placed with the same cover mapping as the image).
      const boxSel = ['.lockup', '.dock', '.audience', '.tag', '.instrument', '.legend', '.caption', '.offer', '.cluster', '.bar'];
      const boxes = [];
      for (const q of boxSel) for (const el of document.querySelectorAll(q)) {
        if (getComputedStyle(el).display === 'none') continue;
        let r = el.getBoundingClientRect();
        // a tag's box is its text (the margin dimension is a line, its text is the span)
        if (el.classList.contains('tag-margin')) r = el.querySelector('span').getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > H) continue;
        boxes.push({ q: q + (el.classList.length > 1 ? '.' + [...el.classList].slice(1).join('.') : ''), r });
      }
      const pad = 12, overlaps = [];
      const hit = (a, b, p) => a.left - p < b.right && b.left - p < a.right && a.top - p < b.bottom && b.top - p < a.bottom;
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
        if (hit(boxes[i].r, boxes[j].r, pad)) overlaps.push(boxes[i].q + ' x ' + boxes[j].q);
      const st = document.querySelector('.stage');
      const wk = (innerWidth / innerHeight < 0.75 && st.dataset.pwords) ? st.dataset.pwords : st.dataset.words;
      if (wk) {
        const [x0, y0, x1, y1] = wk.split(',').map(Number);
        const wr = { left: (W - dw) / 2 + x0 * dw, right: (W - dw) / 2 + x1 * dw, top: (H - dh) / 2 + y0 * dh, bottom: (H - dh) / 2 + y1 * dh };
        for (const b of boxes) if (b.q !== '.bar' && hit(b.r, wr, 4)) overlaps.push(b.q + ' x rendered sentence');
      }
      if (st.dataset.gauge && innerWidth / innerHeight >= 0.75) {      // the draught marks' column, desktop
        const [gx, gy] = st.dataset.gauge.split(',').map(Number);
        const gr = { left: (W - dw) / 2 + gx * dw - 6, right: (W - dw) / 2 + gx * dw + 30, top: (H - dh) / 2 + gy * dh - 8, bottom: H };
        for (const b of boxes) if (!b.q.startsWith('.tag') && hit(b.r, gr, 2)) overlaps.push(b.q + ' x rendered draught marks');
      }
      return { res, overlaps, overflow: document.documentElement.scrollWidth - innerWidth };
    } catch (e) { return { error: String(e) }; } });
    report[name] = { file: out, errors, ...zones };
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(Object.fromEntries(shots.map(([f, n]) => [n + '.png', f])), null, 1));
  const bad = Object.entries(report).filter(([, v]) => (v.overlaps || []).length || (v.errors || []).length || v.overflow > 0);
  for (const [k, v] of bad) console.error('FAIL', k, JSON.stringify({ overlaps: v.overlaps, errors: v.errors, overflow: v.overflow }));
  console.error(bad.length ? `${bad.length} screen(s) fail the overlap/console/overflow check` : 'overlap check: 0 screens fail');
  process.exitCode = bad.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
