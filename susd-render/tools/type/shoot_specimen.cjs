// Full-page screenshots of docs/type/web/specimen.html at 1440 and 390 wide, plus a font check:
// node tools/type/shoot_specimen.cjs   (writes docs/type/specimens/21-web-1440.png, 22-web-390.png)
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const url = 'file://' + path.join(root, 'docs/type/web/specimen.html');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h, out, mobile] of [[1440, 900, '21-web-1440.png', false], [390, 844, '22-web-390.png', true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('requestfailed', r => errors.push(r.url() + ' ' + r.failure()?.errorText));
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: path.join(root, 'docs/type/specimens', out), fullPage: true });
    console.log(out, JSON.stringify({ fonts, overflow, errors }));
    await ctx.close();
  }
  await browser.close();
})();
