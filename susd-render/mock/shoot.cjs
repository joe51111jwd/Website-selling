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
  ['beat-twelve.html', 'desktop-b2-twelve', D, false],
  ['beat-touch.html', 'desktop-b3-touch', D, false],
  ['beat-under.html', 'desktop-b4-under', D, false],
  ['beat-under.html', 'phone-b4-under', P, true],
  ['beat-redline.html', 'desktop-b5-redline', D, false],
  ['beat-turn.html', 'desktop-b6-turn', D, false],
  ['beat-side.html', 'desktop-b6-side', D, false],
  ['beat-down.html', 'desktop-b7-down', D, false],
  ['beat-offer.html', 'desktop-b7-offer', D, false],
  ['beat-repeat.html', 'desktop-b8-repeat', D, false],
  ['beat-oxygen.html', 'desktop-b9-oxygen', D, false],
  ['finale.html', 'desktop-finale', D, false],
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
    await page.waitForTimeout(400);
    const out = path.join(OUT, name + '.png');
    await page.screenshot({ path: out });
    // luminance of the plate under each text block: draw the <img> into a canvas at viewport size (cover) and sample
    const zones = await page.evaluate(async () => {
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
      const sel = ['.lockup', '.dock', '.audience', '.tag-water', '.tag-mark span', '.tag-deck', '.tag-margin span', '.tag-scar span', '.question', '.tie', '.readout', '.cue', '.bands', '.legend', '.caption', '.offer', '.lead', '.col-book', '.col-file', '.phoneband'];
      const res = {};
      for (const q of sel) {
        const el = document.querySelector(q);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || getComputedStyle(el).display === 'none') continue;
        const x = Math.max(0, Math.floor(r.left)), y = Math.max(0, Math.floor(r.top));
        const w = Math.min(W - x, Math.ceil(r.width)), h = Math.min(H - y, Math.ceil(r.height));
        const d = g.getImageData(x, y, w, h).data;
        const L = [];
        for (let i = 0; i < d.length; i += 4 * 3) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
        L.sort((a, b) => a - b);
        const p95 = L[Math.floor(L.length * 0.95)], med = L[Math.floor(L.length * 0.5)];
        const cream = 0.2126 * lin(0xEE) + 0.7152 * lin(0xF0) + 0.0722 * lin(0xEC);
        res[q] = { box: [x, y, w, h], p95: +p95.toFixed(3), median: +med.toFixed(3), contrastAtP95: +((cream + 0.05) / (p95 + 0.05)).toFixed(2) };
      }
      return { res, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    report[name] = { file: out, errors, ...zones };
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
