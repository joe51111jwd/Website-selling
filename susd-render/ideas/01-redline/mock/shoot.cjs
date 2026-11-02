// Screenshot the three Redline mocks as a browser renders them.
//   node ideas/01-redline/mock/shoot.cjs
// Serves susd-render/ over http (so the fonts and renders load by their relative paths), shoots
// desktop at 1440x900 and the phone as an iPhone 13 (390x844, 2x), writes PNGs to
// ideas/01-redline/visuals/_png/ and reports any failed request or overflowing text box.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.resolve(__dirname, '..', 'visuals', '_png');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const report = {};
const shots = [
  ['1-first-screen-desktop.html', '1-first-screen-desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['2-key-beat-desktop.html', '2-key-beat-desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['3-first-screen-phone.html', '3-first-screen-phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent }],
];
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/ideas/01-redline/mock/`;
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
    // every text box: its rectangle, so overlaps and edge clipping can be checked
    const boxes = await page.evaluate(() => [...document.querySelectorAll('.lockup, .col, .claim, .who, .eq, .support, .readout, .boot, .cue')]
      .map((e) => { const r = e.getBoundingClientRect(); return { c: e.className, x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) }; }));
    const vp = page.viewportSize();
    const out = path.join(OUT, name + '.png');
    await page.screenshot({ path: out });
    console.log(name, vp.width + 'x' + vp.height, 'fonts:', [...new Set(fonts)].join(', '));
    for (const b of boxes) {
      const clip = b.x < 0 || b.y < 0 || b.r > vp.width || b.b > vp.height;
      console.log('  ', b.c.padEnd(14), `${b.x},${b.y} -> ${b.r},${b.b}`, clip ? 'CLIPPED' : '');
    }
    if (errors.length) console.log('  ERRORS', errors);
    const words = await page.evaluate(() => { const e = document.querySelector('.claim, .eq'); const r = e.getBoundingClientRect(); return [r.x, r.y, r.right, r.bottom]; });
    report[name + '.png'] = { css: [vp.width, vp.height], words };
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'boxes.json'), JSON.stringify(report, null, 1));
  await browser.close();
  server.close();
})();
