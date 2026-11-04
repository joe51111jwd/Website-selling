// The Heap v2: captures the fallback stills (assets/img/fb-d-N.jpg 1440x900, fb-p-N.jpg 780x1688) from the live scene,
// with the words and chrome hidden. Serve heap2-site first:  node tools/stills_heap2.cjs http://127.0.0.1:PORT/
const { chromium } = require('playwright');
const path = require('path');
const base = process.argv[2] || 'http://127.0.0.1:8781/';
const dir = path.join(__dirname, '..', 'heap2-site', 'assets', 'img');
const BEATS = [0, 0.230, 0.332, 0.49, 0.68, 0.78, 0.965];
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const v of [{ n: 'd', w: 1440, h: 900, s: 1 }, { n: 'p', w: 390, h: 844, s: 2, m: true }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.s, isMobile: !!v.m });
    const page = await ctx.newPage();
    await page.goto(base + '?shots=1&nointro=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
    await page.addStyleTag({ content: '.caps,.top,.bar{display:none!important}' });
    for (let i = 0; i < BEATS.length; i++) {
      await page.evaluate((t) => { const s = document.getElementById('story'); window.scrollTo(0, s.offsetTop + t * (s.offsetHeight - innerHeight)); }, BEATS[i]);
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(dir, `fb-${v.n}-${i + 1}.jpg`), type: 'jpeg', quality: 78 });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('stills written to', dir);
})();
