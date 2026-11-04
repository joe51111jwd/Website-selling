// The Heap v2: beat screenshots + checks (Playwright, WebGL via SwiftShader). Serve susd-render/heap2-site first, then:
//   node tools/shoot_heap2.cjs http://127.0.0.1:PORT/ [outdir] [--only=d|p] [--beats=0,0.3]
// Per viewport: no console errors / page errors / failed requests; no horizontal scroll; every beat shot; the jump to
// #get hides the chrome; the form (empty -> error label, valid -> going label, then same-tab navigation to the Appendix
// with no email in the URL). Also a no-WebGL shot and a reduced-motion shot. Exit 1 on any problem.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const base = args[0] || 'http://127.0.0.1:8781/';
const out = args[1] || path.join(__dirname, '..', 'out', 'heap2', 'build-shots');
fs.mkdirSync(out, { recursive: true });
const VIEWS = [
  { name: 'd', w: 1440, h: 900 },
  { name: 'p', w: 390, h: 844, mobile: true, dpr: 3 },
].filter((v) => !flags.only || flags.only === v.name);
const BEATS = flags.beats ? flags.beats.split(',').map((x) => [x.replace('.', '_'), +x]) : [
  ['01-hero', 0], ['02-fall', 0.062], ['03-letters-down', 0.10], ['04-one-cup', 0.17], ['05-two-cups', 0.228], ['06-three', 0.268], ['07-four', 0.305],
  ['08-eight', 0.392], ['09-twelve', 0.445], ['10-fifteen', 0.49], ['11-pull', 0.55], ['12-freeze', 0.595], ['13-wait', 0.645], ['14-roll', 0.715],
  ['15-upside', 0.77], ['16-turn', 0.835], ['17-cyclical', 0.85], ['18-up', 0.885], ['19-side', 0.92], ['20-down', 0.957], ['21-calm', 0.99],
];
const problems = [];
const note = (v, m) => { problems.push(v + ': ' + m); console.log('PROBLEM ' + v + ': ' + m); };
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
(async () => {
  const browser = await chromium.launch({ args: GL });
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr ? 2 : 1, isMobile: !!v.mobile, hasTouch: !!v.mobile });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') note(v.name, 'console: ' + m.text()); });
    page.on('pageerror', (e) => note(v.name, 'pageerror: ' + e.message));
    page.on('requestfailed', (r) => { if (!/appendix/.test(r.url())) note(v.name, 'failed: ' + r.url()); });
    await page.goto(base + '?shots=1&nointro=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
    const gl = await page.evaluate(() => document.documentElement.classList.contains('gl'));
    if (!gl) note(v.name, 'no WebGL in this browser');
    for (const [name, t] of BEATS) {
      await page.evaluate((t) => { const s = document.getElementById('story'); const H = s.offsetHeight - innerHeight; window.scrollTo(0, s.offsetTop + t * H); }, t);
      await page.waitForTimeout(380);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const file = path.join(out, `${v.name}-${name}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
      const sx = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (sx > 0) note(v.name, name + ': horizontal scroll ' + sx);
    }
    const info = await page.evaluate(() => window.HEAP2 && window.HEAP2.info());
    console.log(v.name, 'scene', JSON.stringify(info));
    if (!flags.beats) {
      // the jump
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200);
      await page.click(v.mobile ? '.bar .getit' : '.top .getit');
      await page.waitForTimeout(500);
      const jr = await page.evaluate(() => ({ top: document.getElementById('get').getBoundingClientRect().top, off: document.documentElement.classList.contains('dock-off') }));
      if (Math.abs(jr.top) > 2 || !jr.off) note(v.name, 'jump: ' + JSON.stringify(jr));
      await page.screenshot({ path: path.join(out, `${v.name}-22-get.jpg`), type: 'jpeg', quality: 80 });
      // the form: invalid, then valid (nonav)
      await page.goto(base + '?shots=1&nointro=1&nonav=1#get'); await page.waitForTimeout(600);
      await page.evaluate(() => document.getElementById('get').scrollIntoView());
      await page.fill('#email', 'not-an-email'); await page.click('#get-form button');
      const badShown = await page.isVisible('.msg-bad');
      if (!badShown) note(v.name, 'invalid email: no error label');
      await page.screenshot({ path: path.join(out, `${v.name}-23-form-invalid.jpg`), type: 'jpeg', quality: 80 });
      await page.fill('#email', 'founder@example.com'); await page.click('#get-form button');
      if (!(await page.isVisible('.msg-go'))) note(v.name, 'valid email: no going label');
      await page.screenshot({ path: path.join(out, `${v.name}-24-form-valid.jpg`), type: 'jpeg', quality: 80 });
      // the real navigation
      await page.goto(base + '?shots=1&nointro=1#get'); await page.waitForTimeout(400);
      await page.evaluate(() => document.getElementById('get').scrollIntoView());
      await page.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }));
      await page.fill('#email', 'founder@example.com');
      await Promise.all([page.waitForURL(/appendix/, { timeout: 5000 }).catch(() => note(v.name, 'no navigation')), page.click('#get-form button')]);
      const u = page.url();
      if (!/^https:\/\/scaling-up-side-down\.vercel\.app\/appendix#get$/.test(u) || /example/.test(u)) note(v.name, 'navigated to ' + u);
    }
    await ctx.close();
    if (!flags.beats) {
      // no WebGL: the stills
      const c2 = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: !!v.mobile });
      const p2 = await c2.newPage();
      p2.on('pageerror', (e) => note(v.name + '-nogl', 'pageerror: ' + e.message));
      await p2.goto(base + '?nogl=1', { waitUntil: 'load' }); await p2.waitForTimeout(500);
      await p2.screenshot({ path: path.join(out, `${v.name}-30-nogl.jpg`), type: 'jpeg', quality: 70, fullPage: true });
      await c2.close();
      const c3 = await browser.newContext({ viewport: { width: v.w, height: v.h }, javaScriptEnabled: false, isMobile: !!v.mobile });
      const p3 = await c3.newPage(); await p3.goto(base, { waitUntil: 'load' }); await p3.waitForTimeout(300);
      await p3.screenshot({ path: path.join(out, `${v.name}-31-nojs-top.jpg`), type: 'jpeg', quality: 70 });
      await c3.close();
      // reduced motion: no intro, hard cuts between held states
      const c4 = await browser.newContext({ viewport: { width: v.w, height: v.h }, reducedMotion: 'reduce', isMobile: !!v.mobile });
      const p4 = await c4.newPage(); p4.on('pageerror', (e) => note(v.name + '-rm', 'pageerror: ' + e.message));
      await p4.goto(base + '?shots=1', { waitUntil: 'load' }); await p4.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
      for (const t of [0, 0.72]) {
        await p4.evaluate((t) => { const s = document.getElementById('story'); window.scrollTo(0, s.offsetTop + t * (s.offsetHeight - innerHeight)); }, t);
        await p4.waitForTimeout(400);
        await p4.screenshot({ path: path.join(out, `${v.name}-32-rm-${t}.jpg`), type: 'jpeg', quality: 70 });
      }
      await c4.close();
    }
  }
  await browser.close();
  console.log(problems.length ? problems.length + ' problem(s)' : 'all checks passed');
  process.exit(problems.length ? 1 : 0);
})();
