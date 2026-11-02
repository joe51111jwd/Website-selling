// Screenshot the three Blackout mocks as a browser renders them.
//   node ideas/03-blackout/mock/shoot.cjs
// Serves susd-render/ over http (so the fonts and renders load by their relative paths), shoots desktop at
// 1440x900 and the phone as an iPhone 13 (390x844 CSS at 2x), writes PNGs to ../visuals/raw/ and the final
// JPEGs (quality 85) to ../visuals/, and reports failed requests, the fonts in use and every text box.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const VIS = path.resolve(__dirname, '..', 'visuals');
const RAW = path.join(VIS, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const only = process.argv[2];
const shots = [
  ['1-first-screen-desktop.html', '1-first-screen-desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['2-key-beat-desktop.html', '2-key-beat-desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['3-first-screen-phone.html', '3-first-screen-phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent }],
].filter((s) => !only || s[1].startsWith(only));
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/ideas/03-blackout/mock/`;
  const browser = await chromium.launch();
  for (const [file, name, opts] of shots) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('requestfailed', (r) => errors.push('failed ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(base + file, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
    const boxes = await page.evaluate(() => [...document.querySelectorAll('.lockup, .who, .cue, .boot, .ask, .bar, .btn')]
      .map((e) => { const r = e.getBoundingClientRect(); return { c: e.className, x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) }; }));
    const vp = page.viewportSize();
    const png = path.join(RAW, name + '.png');
    await page.screenshot({ path: png });
    await page.screenshot({ path: path.join(VIS, name + '.jpg'), type: 'jpeg', quality: 85 });
    console.log(name, vp.width + 'x' + vp.height, 'fonts:', [...new Set(fonts)].join(', '), 'jpg KB', Math.round(fs.statSync(path.join(VIS, name + '.jpg')).size / 1024));
    for (const b of boxes) {
      const clip = b.x < 0 || b.y < 0 || b.r > vp.width || b.b > vp.height;
      console.log('  ', b.c.padEnd(10), `${b.x},${b.y} -> ${b.r},${b.b}`, clip ? 'CLIPPED' : '');
    }
    if (errors.length) console.log('  ERRORS', errors);
    await ctx.close();
  }
  await browser.close();
  server.close();
})();
