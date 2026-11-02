// Screenshot the three Heap mocks: desktop 1440x900 at 1x, phone as an iPhone 13 (390x844 CSS at 2x... rendered
// at 3x by the device profile, so we force deviceScaleFactor 2). Writes PNGs to ../visuals/raw/.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, '..', 'visuals', 'raw');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const shots = [
    ['1-first-desktop.html', '1-first-screen-desktop.png', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['2-key-desktop.html', '2-key-beat-desktop.png', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['3-first-phone.html', '3-first-screen-phone.png', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }],
  ];
  for (const [file, out, ctxOpts] of shots) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(__dirname, file));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    // report any text box that runs into another one
    const boxes = await page.$$eval('.lockup, .dock, .line, .support, .who, .cue, .count, .bar', (els) =>
      els.map((e) => { const r = e.getBoundingClientRect(); return { c: e.className, t: e.textContent.trim().slice(0, 24), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) console.log('OVERLAP', file, a.t, '|', b.t);
    }
    console.log(file, JSON.stringify(boxes));
    await page.screenshot({ path: path.join(OUT, out) });
    await ctx.close();
  }
  await browser.close();
})();
