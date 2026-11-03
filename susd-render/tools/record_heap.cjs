// The Heap: record a slow scroll-through for review (Playwright recordVideo, small wheel steps so the crossfades show).
//   node tools/record_heap.cjs http://127.0.0.1:PORT/ [outdir]   -> outdir/heap-desktop.webm, heap-phone.webm
// Then convert to H.264 (see docs/10-HEAP-SITE.md): ffmpeg -i X.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart ...
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const base = process.argv[2] || 'http://127.0.0.1:8771/';
const out = process.argv[3] || path.join(__dirname, '..', 'out', 'heap-site', 'video-raw');
fs.mkdirSync(out, { recursive: true });
const SCROLL_SECONDS = 33;
(async () => {
  const browser = await chromium.launch();
  for (const v of [{ name: 'heap-desktop', w: 1440, h: 900 }, { name: 'heap-phone', w: 390, h: 844, mobile: true }]) {
    const dir = path.join(out, v.name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: !!v.mobile, hasTouch: !!v.mobile,
      recordVideo: { dir, size: { width: v.w, height: v.h } } });
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(base, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // let every frame load before the scroll starts (they load two at a time in story order)
    await page.waitForFunction(() => { const f = [...document.querySelectorAll('.beat[data-fs]')]; return f.every((b) => b.classList.contains('ld') && b.querySelector('.frame img').complete && b.querySelector('.frame img').naturalWidth); }, null, { timeout: 20000 }).catch(() => console.log('frames still loading'));
    const lead = (Date.now() - t0) / 1000;
    await page.mouse.move(v.w / 2, v.h / 2);
    await page.waitForTimeout(2200);                       // hold on the first screen
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const stepMs = 50, steps = Math.round(SCROLL_SECONDS * 1000 / stepMs), dy = total / steps;
    let acc = 0, start = Date.now();
    for (let i = 1; i <= steps; i++) {
      const target = Math.round(dy * i), delta = target - acc; acc = target;
      await page.mouse.wheel(0, delta);
      const wait = start + i * stepMs - Date.now(); if (wait > 0) await page.waitForTimeout(wait);
    }
    const y = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
    if (y[0] < y[1] - 2) { await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); }
    await page.waitForTimeout(2500);                       // hold on the form
    await ctx.close();
    const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
    fs.renameSync(path.join(dir, webm), path.join(out, v.name + '.webm'));
    fs.writeFileSync(path.join(out, v.name + '.lead.txt'), String(Math.max(0, lead - 0.2).toFixed(2)));
    console.log(v.name, 'scrolled', y, 'px; load lead', lead.toFixed(2), 's');
  }
  await browser.close();
})();
