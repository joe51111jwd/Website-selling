// The Heap v2: main-thread frame cost (update + upload + draw submission), the part a phone's CPU pays every frame
// while scrolling. Software GL here cannot say how fast a real GPU rasterises, so HEAP2.cpuBench() takes the raster
// cost out (tiny drawing buffer, tiny shadow map) and times the rest. Desktop 1440x900 and iPhone 13, each unthrottled
// and with Chromium CPU throttling x4 (CDP), over the heaviest stretch (t 0.30-0.58: the pile and the pull) and over
// the tidy end (t 0.80-0.97: 105 cables moving into the bundles).
//   node tools/perf_heap2.cjs http://127.0.0.1:8781/ [more base URLs to compare]
const { chromium, devices } = require('playwright');
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
const bases = process.argv.slice(2).length ? process.argv.slice(2) : ['http://127.0.0.1:8781/'];
(async () => {
  const browser = await chromium.launch({ args: GL });
  const rows = [];
  for (const base of bases) for (const [name, opts] of [
    ['desktop 1440x900', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['iPhone 13 390x844', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }],
  ]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage(); page.setDefaultTimeout(180000);
    await page.goto(base + '?nointro=1&shots=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 120000 });
    const cdp = await ctx.newCDPSession(page);
    for (const rate of [1, 4]) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await page.evaluate(() => window.HEAP2.cpuBench(20));   // warm up (JIT)
      const pile = await page.evaluate(() => window.HEAP2.cpuBench(90, 0.30, 0.58));
      const tidy = await page.evaluate(() => window.HEAP2.cpuBench(90, 0.80, 0.97));
      const upd = await page.evaluate(() => window.HEAP2.benchUpdate(60));
      const row = { base, view: name, cpu: 'x' + rate, pile_p50: pile.p50, pile_p95: pile.p95, pile_max: pile.max, tidy_p50: tidy.p50, tidy_p95: tidy.p95, update_only: +upd.toFixed(2), calls: pile.calls, triangles: pile.triangles };
      rows.push(row); console.log(JSON.stringify(row));
    }
    await ctx.close();
  }
  await browser.close();
  console.table(rows.map((r) => ({ build: r.base.replace(/^http:\/\/127\.0\.0\.1:/, ''), view: r.view, cpu: r.cpu, 'pile p50 ms': r.pile_p50, 'pile p95 ms': r.pile_p95, 'tidy p95 ms': r.tidy_p95, 'update ms': r.update_only, calls: r.calls })));
})().catch((e) => { console.error(e); process.exit(2); });
