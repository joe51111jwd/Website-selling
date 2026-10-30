// Screenshots a page at desktop (1440x900) and phone (390x844), scrolling with the wheel like a person.
// node shoot.cjs <url> <outdir> [steps=14] [stepPx=0 (0 = 0.85 of the viewport)]
// Prints JSON: files, console errors, page errors, failed requests, horizontal overflow, page height.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out, stepsArg, stepArg] = process.argv.slice(2);
  if (!url || !out) { console.error('usage: node shoot.cjs <url> <outdir> [steps] [stepPx]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const steps = Number(stepsArg || 14);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const report = { files: [], consoleErrors: [], pageErrors: [], failedRequests: [], overflow: {}, height: {} };
  for (const [name, vp, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(`${name}: ${m.text()}`.slice(0, 300)); });
    page.on('pageerror', e => report.pageErrors.push(`${name}: ${String(e)}`.slice(0, 300)));
    page.on('requestfailed', r => report.failedRequests.push(`${name}: ${r.url()} ${r.failure()?.errorText}`.slice(0, 300)));
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(600);
    let f = `${out}/${name}-00-first-600ms.png`; await page.screenshot({ path: f }); report.files.push(f);
    await page.waitForTimeout(2400);
    f = `${out}/${name}-01-first-3s.png`; await page.screenshot({ path: f }); report.files.push(f);
    const step = Number(stepArg) || Math.round(vp.height * 0.85);
    for (let i = 0; i < steps; i++) {
      const before = await page.evaluate(() => window.scrollY);
      if (mobile) await page.evaluate(d => window.scrollBy(0, d), step); else { await page.mouse.move(vp.width / 2, vp.height / 2); await page.mouse.wheel(0, step); }
      await page.waitForTimeout(1400);
      const after = await page.evaluate(() => window.scrollY);
      f = `${out}/${name}-${String(i + 2).padStart(2, '0')}-scroll.png`; await page.screenshot({ path: f }); report.files.push(f);
      if (after === before && i > 0) break; // reached the bottom
    }
    report.overflow[name] = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    report.height[name] = await page.evaluate(() => document.documentElement.scrollHeight);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
