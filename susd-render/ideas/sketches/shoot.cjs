// Screenshots each storyboard HTML in src/ to <slug>.jpg (1200 px wide, JPEG quality 82).
// node shoot.cjs [slug ...]   (no slugs = every src/*.html)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const here = __dirname;
(async () => {
  let slugs = process.argv.slice(2);
  if (!slugs.length) slugs = fs.readdirSync(path.join(here, 'src')).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  for (const slug of slugs) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('requestfailed', (r) => errs.push('failed ' + r.url()));
    await page.goto('file://' + path.join(here, 'src', slug + '.html'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const fontsOk = await page.evaluate(() => ['27px Plimsoll', '700 30px "Ortica Angular"', '700 30px "Ortica Linear"', '16px B612'].map((f) => document.fonts.check(f)));
    const out = path.join(here, slug + '.jpg');
    await page.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 82 });
    const dims = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
    console.log(slug, dims.join('x'), Math.round(fs.statSync(out).size / 1024) + ' KB', 'fonts', fontsOk.join(','), errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok');
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
