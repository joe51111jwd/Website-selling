// The Heap v2: a visitor's QA pass (Playwright, WebGL on SwiftShader). Serve the page first, then (from susd-render/):
//   node tools/qa_heap2.cjs http://127.0.0.1:8781/ [--out=out/heap2/qa] [--only=d1440,p390] [--skip=perf,rm,fallback]
// Per viewport (1440x900, 1280x800, 1920x1080, iPhone 13 390x844, 390x664 (Safari's visible area), 375x667, landscape
// 844x390): scrolls the whole story forwards in small steps and checks at every step
//   - at most one sentence on screen (until the Bootloader card), every line inside the viewport,
//   - no words over the objects (scene points projected to the screen, HEAP2.project()) or over the chrome,
//   - "Get it free" visible and not covered, no horizontal scroll;
// then scrubs back and compares the pictures at the beats with the forward ones (must be the same);
// the jump ("Get it free" from mid-story lands on #get, chrome hidden, nothing over the form), the form (invalid ->
// error label; valid -> going label -> exactly https://scaling-up-side-down.vercel.app/appendix#get, no email in any
// request), the intro, reduced motion (hard cuts), no-WebGL and no-JS (readable, with the form), console errors.
// Frame time: main-thread cost per drawn frame (update + render) while scrolling, 1440x900 and iPhone 13 with CDP CPU
// throttling x4. Writes shots + qa.json to --out. Exit 1 on any problem.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v == null ? '1' : v]; }));
const base = args[0] || 'http://127.0.0.1:8781/';
const out = path.resolve(flags.out || path.join(__dirname, '..', 'out', 'heap2', 'qa'));
fs.mkdirSync(out, { recursive: true });
const skip = new Set((flags.skip || '').split(',').filter(Boolean));
const APPX = 'https://scaling-up-side-down.vercel.app/appendix#get';
const IPH = devices['iPhone 13'];
const VIEWS = [
  { name: 'd1440', w: 1440, h: 900 },
  { name: 'd1280', w: 1280, h: 800 },
  { name: 'd1920', w: 1920, h: 1080 },
  { name: 'p390', w: 390, h: 844, phone: true },
  { name: 'p390s', w: 390, h: 664, phone: true },
  { name: 'p375', w: 375, h: 667, phone: true },
  { name: 'l844', w: 844, h: 390, phone: true },
].filter((v) => !flags.only || flags.only.split(',').includes(v.name));
const BEATS = [['01-hero', 0], ['02-fall', 0.062], ['03-letters-down', 0.1], ['04-one-cup', 0.17], ['05-two-cups', 0.228], ['06-four', 0.33],
  ['07-eight', 0.392], ['08-fifteen', 0.49], ['09-pull', 0.55], ['10-wait', 0.595], ['11-not-scaling', 0.645], ['12-roll', 0.715], ['13-upside', 0.77],
  ['14-cyclical', 0.85], ['15-up', 0.885], ['16-side', 0.92], ['17-down', 0.957], ['18-floor', 0.99]];
const BACK = new Set(['02-fall', '05-two-cups', '08-fifteen', '09-pull', '11-not-scaling', '13-upside', '15-up', '17-down']);
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
const problems = [], report = { base, views: {} };
const note = (v, m) => { problems.push(v + ': ' + m); console.log('PROBLEM ' + v + ': ' + m); };
const ctxOpts = (v, extra = {}) => (v.phone
  ? { ...IPH, viewport: { width: v.w, height: v.h }, screen: { width: Math.min(v.w, v.h) === v.w ? 390 : 844, height: Math.min(v.w, v.h) === v.w ? 844 : 390 }, ...extra }
  : { viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, ...extra });
const frames2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
const toT = (page, t) => page.evaluate((t) => { const s = document.getElementById('story'); window.scrollTo(0, s.offsetTop + t * (s.offsetHeight - innerHeight)); }, t);

// everything a visitor sees at this moment, measured
function gather() {
  const vw = innerWidth, vh = innerHeight, d = document;
  const vis = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.02) return false; } return true; };
  const box = (r) => [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  const caps = [...d.querySelectorAll('.cap')].filter(vis).map((el) => {
    const rects = [], sentences = [];
    el.querySelectorAll('p, a.cta').forEach((p) => {
      if (!vis(p)) return;
      if (p.tagName === 'A') { rects.push(box(p.getBoundingClientRect()).concat('cta')); return; }
      const label = p.classList.contains('by');   // the byline is a label, not a sentence
      if (!label) sentences.push(p.textContent.trim());
      const rg = d.createRange(); rg.selectNodeContents(p);
      for (const r of rg.getClientRects()) if (r.width > 1) rects.push(box(r).concat(label ? 'label' : 'text'));
    });
    return { cls: el.className, op: +getComputedStyle(el).opacity, rects, sentences, size: el.querySelector('p') ? parseFloat(getComputedStyle(el.querySelector('p:not([style*="none"])') || el.querySelector('p')).fontSize) : 0 };
  });
  const chrome = [...d.querySelectorAll('.top .title, .top .getit, .bar')].filter(vis).map((el) => box(el.getBoundingClientRect()).concat(el.className)).filter((c) => c[3] > c[1] && c[2] > c[0]);
  // the one button on screen: "Get it free" in the chrome, or on the first screen the hero's own Bootloader button
  // (the chrome's button waits until the hero goes)
  const getit = [...d.querySelectorAll('.getit, .cap.hero .cta')].filter((el) => { const r = el.getBoundingClientRect(); return vis(el) && r.width > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw; });
  // how many buttons are really on screen (the product of the opacities up the tree, so a crossfade is allowed)
  const eff = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const buttons = getit.filter((el) => eff(el) > 0.5).length;
  const clear = getit.map((el) => { const r = el.getBoundingClientRect(); const e2 = d.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2); return !!e2 && (el === e2 || el.contains(e2)); });
  if (window.HEAP2 && window.__posed) window.HEAP2.pose(window.SUSD.t);   // the scene at this t, not drawn (fast)
  const pts = window.HEAP2 ? window.HEAP2.project() : [];
  const M = 8; let hits = 0, where = null;
  for (const c of caps) for (const r of c.rects) {
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i], y = pts[i + 1];
      if (x > r[0] - M && x < r[2] + M && y > r[1] - M && y < r[3] + M) { hits++; if (!where) where = { cls: c.cls, rect: r, x, y }; }
    }
  }
  // how far the objects reach on screen (inside the viewport)
  let ox0 = 1e9, oy0 = 1e9, ox1 = -1e9, oy1 = -1e9;
  for (let i = 0; i < pts.length; i += 2) { const x = pts[i], y = pts[i + 1]; if (x < 0 || x > vw || y < 0 || y > vh) continue; ox0 = Math.min(ox0, x); oy0 = Math.min(oy0, y); ox1 = Math.max(ox1, x); oy1 = Math.max(oy1, y); }
  return { t: window.SUSD && window.SUSD.t, caps, chrome, getit: getit.length, buttons, getitClear: clear.every(Boolean), hs: d.documentElement.scrollWidth - vw, hits, where, objects: pts.length ? [ox0, oy0, ox1, oy1] : null, dockOff: d.documentElement.classList.contains('dock-off') };
}
const inter = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

(async () => {
  const browser = await chromium.launch({ args: GL });
  for (const v of VIEWS) {
    const R = (report.views[v.name] = { steps: 0, maxSentences: 0, hitSteps: [], minFont: 99, backDiff: {} });
    const ctx = await browser.newContext(ctxOpts(v));
    const page = await ctx.newPage();
    page.setDefaultTimeout(180000);
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => { if (!/appendix/.test(r.url())) errs.push('failed: ' + r.url()); });
    page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await page.goto(base + '?shots=1&nointro=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
    if (!(await page.evaluate(() => document.documentElement.classList.contains('gl')))) note(v.name, 'no WebGL in this browser');
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // ---- forward, small steps
    const ts = new Set(); for (let i = 0; i <= 200; i++) ts.add(+(i * 0.005).toFixed(4));
    BEATS.forEach(([, t]) => ts.add(t));
    const fwd = flags.ts ? flags.ts.split(',').map(Number) : [...ts].sort((a, b) => a - b);
    const beatAt = Object.fromEntries(BEATS.map(([n, t]) => [t, n]));
    let firstScreen = null;
    // between the beats the scene is posed, not drawn (software GL is slow); at the beats it is drawn and shot
    const draw = async (on) => page.evaluate((on) => { window.__posed = !on; window.HEAP2.pause(!on); }, on);
    for (const t of fwd) {
      const beat = beatAt[t] != null || !!flags.ts;
      await draw(beat);
      await toT(page, t); await frames2(page);
      const g = await page.evaluate(gather);
      R.steps++;
      if (t === 0) firstScreen = g;
      const sentences = g.caps.reduce((n, c) => n + c.sentences.length, 0);
      R.maxSentences = Math.max(R.maxSentences, sentences);
      if (sentences > 1) note(v.name, `t=${t}: ${sentences} sentences on screen ${JSON.stringify(g.caps.map((c) => c.sentences))}`);
      for (const c of g.caps) {
        if (c.op > 0.5 && c.size) R.minFont = Math.min(R.minFont, c.size);
        for (const r of c.rects) {
          if (r[0] < 0 || r[2] > v.w || r[1] < 0 || r[3] > v.h) note(v.name, `t=${t}: ${c.cls} ${r[4]} outside the viewport ${JSON.stringify(r)}`);
          for (const ch of g.chrome) if (inter(r, ch)) note(v.name, `t=${t}: ${c.cls} ${r[4]} under the chrome ${ch[4]} ${JSON.stringify(r)} / ${JSON.stringify(ch)}`);
        }
      }
      if (g.hits > 0) { R.hitSteps.push([t, g.hits, g.where]); if (g.hits > 3) note(v.name, `t=${t}: words over the objects (${g.hits} points) ${JSON.stringify(g.where)}`); }
      if (g.getit < 1) note(v.name, `t=${t}: "Get it free" not on screen`);
      if (g.buttons > 1) note(v.name, `t=${t}: ${g.buttons} buttons on screen (one only)`);
      else if (!g.getitClear) note(v.name, `t=${t}: "Get it free" covered`);
      if (g.hs > 0) note(v.name, `t=${t}: horizontal scroll ${g.hs}`);
      if (beatAt[t] != null) await page.screenshot({ path: path.join(out, `${v.name}-${beatAt[t]}.png`) });
      if (flags.ts) { console.log(v.name, t, JSON.stringify({ hits: g.hits, where: g.where, objects: g.objects, caps: g.caps.map((c) => [c.cls, c.op, c.rects]) })); await page.screenshot({ path: path.join(out, `probe-${v.name}-${t}.png`) }); }
    }
    if (flags.ts) { errs.forEach((e) => note(v.name, e)); await ctx.close(); continue; }
    R.firstScreen = { sentences: firstScreen.caps.map((c) => c.sentences), cta: firstScreen.caps.some((c) => c.rects.some((r) => r[4] === 'cta' && r[3] <= v.h)), objects: firstScreen.objects };
    if (!R.firstScreen.cta) note(v.name, 'first screen: the Bootloader button is not fully on screen');
    // ---- backwards: scrub back through everything, compare the beats
    const bts = new Set(); for (let i = 80; i >= 0; i--) bts.add(+(i * 0.0125).toFixed(4));
    BEATS.forEach(([n, t]) => { if (BACK.has(n)) bts.add(t); });
    for (const t of [...bts].sort((a, b) => b - a)) {
      const beat = beatAt[t] != null && BACK.has(beatAt[t]);
      await draw(beat);
      await toT(page, t); await frames2(page);
      if (beat) await page.screenshot({ path: path.join(out, `${v.name}-${beatAt[t]}-back.png`) });
      else await page.evaluate(() => window.HEAP2.pose(window.SUSD.t));
    }
    await draw(true);
    // ---- the jump, from mid-story
    await toT(page, 0.3); await frames2(page); await page.waitForTimeout(300);
    const sel = v.phone && v.w < 721 ? '.bar .getit' : '.top .getit';
    if (v.phone) await page.tap(sel); else await page.click(sel);
    await page.waitForTimeout(450);
    const j = await page.evaluate(() => {
      const d = document, q = (s) => d.querySelector(s), c = (el) => { const r = el.getBoundingClientRect(); const e = d.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2); return { ok: e === el || el.contains(e), by: e && e.className, r: [r.left, r.top, r.right, r.bottom].map(Math.round) }; };
      const shown = [...d.querySelectorAll('.getit, .bar')].filter((el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02; }).map((el) => el.className);
      return { top: Math.round(d.getElementById('get').getBoundingClientRect().top), off: d.documentElement.classList.contains('dock-off'), email: c(q('#email')), btn: c(q('#get-form button')), shown, vh: innerHeight, hash: location.hash };
    });
    R.jump = j;
    if (Math.abs(j.top) > 2 || !j.off) note(v.name, 'jump: ' + JSON.stringify({ top: j.top, off: j.off }));
    if (!j.email.ok || !j.btn.ok) note(v.name, 'something over the form: ' + JSON.stringify([j.email, j.btn]));
    if (j.shown.length) note(v.name, 'chrome still shown over the form: ' + j.shown.join(','));
    if (j.btn.r[3] > j.vh) note(v.name, 'jump: the button is below the fold ' + JSON.stringify(j.btn.r));
    await page.screenshot({ path: path.join(out, `${v.name}-20-get.png`) });
    // ---- the form
    const press = (s) => (v.phone ? page.tap(s) : page.click(s));
    await page.fill('#email', 'not-an-email'); await press('#get-form button'); await page.waitForTimeout(150);
    if (!(await page.isVisible('.msg-bad'))) note(v.name, 'invalid email: no error label');
    await page.screenshot({ path: path.join(out, `${v.name}-21-form-invalid.png`) });
    const reqs = [];
    page.on('request', (r) => reqs.push(r.url()));
    await page.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }));
    await page.fill('#email', 'founder@example.com');
    const nav = page.waitForURL(/appendix/, { timeout: 6000 }).then(() => true).catch(() => false);
    await press('#get-form button'); await page.waitForTimeout(120);
    const going = await page.isVisible('.msg-go').catch(() => false);
    if (!going) note(v.name, 'valid email: no going label');
    if (!(await nav)) note(v.name, 'valid email: no navigation');
    R.navigated = page.url();
    if (page.url() !== APPX) note(v.name, 'navigated to ' + page.url());
    if (reqs.some((u) => /example|founder/.test(u))) note(v.name, 'the email went into a request: ' + reqs.filter((u) => /example|founder/.test(u)).join(' '));
    // a picture of the going label, on a page that does not navigate (a screenshot during a navigation can hang)
    if (['d1440', 'p390'].includes(v.name)) {
      await page.goto(base + '?shots=1&nointro=1&nonav=1', { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 60000 });
      await page.evaluate(() => window.scrollTo(0, document.getElementById('get').getBoundingClientRect().top + window.scrollY));
      await page.fill('#email', 'founder@example.com'); await press('#get-form button'); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(out, `${v.name}-22-form-valid.png`) });
    }
    errs.forEach((e) => note(v.name, e));
    await ctx.close();
    // ---- the intro (real clock, no test flags)
    const ci = await browser.newContext(ctxOpts(v));
    const pi = await ci.newPage(); const errsI = []; pi.setDefaultTimeout(180000);
    pi.on('pageerror', (e) => errsI.push(e.message)); pi.on('console', (m) => { if (m.type() === 'error') errsI.push(m.text()); });
    await pi.goto(base, { waitUntil: 'load' });
    await pi.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
    await pi.waitForTimeout(600); await pi.screenshot({ path: path.join(out, `${v.name}-00-intro-a.png`) });
    await pi.waitForTimeout(2400); await pi.screenshot({ path: path.join(out, `${v.name}-00-intro-b.png`) });
    // still frames are not redrawn: no drawing when nothing moves
    await pi.evaluate(() => window.HEAP2.cost()); await pi.waitForTimeout(800);
    const idle = await pi.evaluate(() => window.HEAP2.cost().length);
    R.idleFrames = idle;
    if (idle > 2) note(v.name, `the scene redraws while nothing moves (${idle} frames in 0.8 s)`);
    // and in real (smoothed) mode a beat ends on the same picture as in the stepped mode
    await toT(pi, 0.49);
    await pi.waitForFunction(() => window.SUSD.t > 0.48 && window.HEAP2.info().t === window.SUSD.t, null, { timeout: 180000, polling: 250 });
    await frames2(pi);
    await pi.screenshot({ path: path.join(out, `${v.name}-08-fifteen-real.png`) });
    // a jump from mid-story cuts the scene to the end at once (it must not fast-forward behind the form)
    if (v.phone && v.w < 721) await pi.tap('.bar .getit'); else await pi.click('.top .getit');
    await frames2(pi);
    const cut = await pi.evaluate(() => ({ scene: window.HEAP2.info().t, page: window.SUSD.t }));
    R.jumpCut = cut;
    if (cut.page < 0.999 || cut.scene !== cut.page) note(v.name, 'after the jump the scene is still easing: ' + JSON.stringify(cut));
    errsI.forEach((e) => note(v.name + '-intro', e));
    await ci.close();
    // ---- pictures: forward vs back, stepped vs real
    const pairs = BEATS.filter(([n]) => BACK.has(n)).map(([n]) => [`${v.name}-${n}.png`, `${v.name}-${n}-back.png`]).concat([[`${v.name}-08-fifteen.png`, `${v.name}-08-fifteen-real.png`]]);
    const res = JSON.parse(execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image, ImageChops, ImageStat
o = {}
for a, b in json.loads(sys.argv[2]):
    A = Image.open(sys.argv[1] + '/' + a).convert('L'); B = Image.open(sys.argv[1] + '/' + b).convert('L')
    D = ImageChops.difference(A, B); o[b] = [round(ImageStat.Stat(D).mean[0], 3), D.getextrema()[1]]
print(json.dumps(o))`, out, JSON.stringify(pairs)]).toString());
    R.backDiff = res;
    for (const [k, [mean, max]] of Object.entries(res)) if (mean > 0.6) note(v.name, `${k} differs from the forward picture (mean ${mean}, max ${max})`);
    console.log(v.name, JSON.stringify({ steps: R.steps, maxSentences: R.maxSentences, hitSteps: R.hitSteps.length, minFont: R.minFont, first: R.firstScreen, back: res }));
  }

  // ---- reduced motion: hard cuts, no intro
  if (!skip.has('rm')) for (const v of VIEWS.filter((x) => ['d1440', 'p390'].includes(x.name))) {
    const c4 = await browser.newContext(ctxOpts(v, { reducedMotion: 'reduce' }));
    const p4 = await c4.newPage(); const e4 = []; p4.setDefaultTimeout(180000);
    p4.on('pageerror', (e) => e4.push(e.message)); p4.on('console', (m) => { if (m.type() === 'error') e4.push(m.text()); });
    await p4.goto(base + '?shots=1', { waitUntil: 'load' }); await p4.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
    const rmOk = await p4.evaluate(() => document.documentElement.classList.contains('rm'));
    if (!rmOk) note(v.name + '-rm', 'reduced motion not picked up');
    let halfway = 0, maxS = 0; const states = new Set();
    for (let i = 0; i <= 100; i++) {
      const t = i / 100; await toT(p4, t); await frames2(p4);
      const g = await p4.evaluate(() => [...document.querySelectorAll('.cap')].map((c) => +getComputedStyle(c).opacity));
      halfway += g.filter((o) => o > 0.01 && o < 0.99).length;
      maxS = Math.max(maxS, g.filter((o) => o > 0.01).length);
      states.add(await p4.evaluate(() => window.HEAP2.info().t.toFixed(3)));
      if ([0, 0.25, 0.5, 0.65, 0.77, 0.9].includes(t)) await p4.screenshot({ path: path.join(out, `${v.name}-30-rm-${t}.png`) });
    }
    report.views[v.name].rm = { halfway, maxSentences: maxS, states: states.size };
    if (halfway) note(v.name + '-rm', `${halfway} half-faded words (should cut)`);
    if (maxS > 1) note(v.name + '-rm', 'more than one sentence on screen');
    e4.forEach((e) => note(v.name + '-rm', e));
    await c4.close();
  }

  // ---- no WebGL, no JS: the stills, readable, with the form
  if (!skip.has('fallback')) for (const v of VIEWS.filter((x) => ['d1440', 'p390', 'l844'].includes(x.name))) {
    for (const [kind, opts, url] of [['nogl', {}, '?nogl=1'], ['nojs', { javaScriptEnabled: false }, '']]) {
      const c = await browser.newContext(ctxOpts(v, opts));
      const p = await c.newPage(); const e5 = []; p.setDefaultTimeout(180000);
      p.on('pageerror', (e) => e5.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') e5.push(m.text()); });
      await p.goto(base + url, { waitUntil: 'load' });
      // scroll through so the lazy stills load, as a visitor would
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += v.h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(90); }
      await p.waitForTimeout(400);
      const f = await p.evaluate(() => {
        const d = document, ims = [...d.querySelectorAll('.plates img')];
        const form = d.getElementById('get-form'), fr = form.getBoundingClientRect();
        const sizes = [...d.querySelectorAll('.plates figcaption p:not(.by), .lead, .question')].map((e) => parseFloat(getComputedStyle(e).fontSize));
        return { plates: getComputedStyle(d.querySelector('.plates')).display, story: getComputedStyle(d.getElementById('story')).display, loaded: ims.filter((i) => i.complete && i.naturalWidth).length, total: ims.length,
          form: fr.height > 0, named: [...form.querySelectorAll('input')].filter((i) => i.name).length, minFont: Math.min(...sizes), hs: d.documentElement.scrollWidth - innerWidth, firstEager: ims[0] && ims[0].loading };
      });
      report.views[v.name][kind] = f;
      if (f.plates === 'none' || f.story !== 'none' || f.loaded < f.total || !f.form || f.named || f.minFont < 16 || f.hs > 0) note(`${v.name}-${kind}`, JSON.stringify(f));
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(out, `${v.name}-40-${kind}-top.png`) });
      await p.screenshot({ path: path.join(out, `${v.name}-41-${kind}-full.jpg`), type: 'jpeg', quality: 60, fullPage: true });
      if (kind === 'nojs') {
        // the plain form still works: it opens the Appendix with nothing in the URL
        await p.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }));
        await p.fill('#email', 'founder@example.com');
        await Promise.all([p.waitForURL(/appendix/, { timeout: 5000 }).catch(() => note(`${v.name}-nojs`, 'form: no navigation')), p.click('#get-form button')]);
        report.views[v.name].nojsNav = p.url();
        if (!/^https:\/\/scaling-up-side-down\.vercel\.app\/appendix\??#get$/.test(p.url())) note(`${v.name}-nojs`, 'form went to ' + p.url());
      }
      e5.forEach((e) => note(`${v.name}-${kind}`, e));
      await c.close();
    }
  }

  // ---- frame time while scrolling (main thread: update + render), 1440x900 and iPhone 13 with CPU throttling x4
  if (!skip.has('perf')) for (const [name, v, rate] of [['d1440', VIEWS.find((x) => x.name === 'd1440') || { name: 'd1440', w: 1440, h: 900 }, 1], ['d1440-x4', { name: 'd1440', w: 1440, h: 900 }, 4], ['p390-x4', { name: 'p390', w: 390, h: 844, phone: true }, 4]]) {
    const c = await browser.newContext(ctxOpts(v));
    const p = await c.newPage();
    await p.goto(base + '?nointro=1', { waitUntil: 'load' });
    await p.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
    const cdp = await c.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const r = await p.evaluate(async () => {
      const s = document.getElementById('story'), H = s.offsetHeight - innerHeight;
      const lt = []; let po = null;
      try { po = new PerformanceObserver((l) => l.getEntries().forEach((e) => lt.push(e.duration))); po.observe({ type: 'longtask', buffered: false }); } catch (e) {}
      window.HEAP2.cost();
      // scroll the heaviest stretch (the pile and the pull) at a steady pace: t 0.30 -> 0.58 in 5 s
      const t0 = performance.now(), dur = 5000, a = 0.30, b = 0.58, gaps = []; let last = t0;
      await new Promise((res) => { function step(now) { gaps.push(now - last); last = now; const u = Math.min(1, (now - t0) / dur); window.scrollTo(0, s.offsetTop + (a + (b - a) * u) * H); if (u < 1) requestAnimationFrame(step); else res(); } requestAnimationFrame(step); });
      await new Promise((res) => setTimeout(res, 300));
      const cost = window.HEAP2.cost().sort((x, y) => x - y);
      if (po) po.disconnect();
      const q = (arr, f) => (arr.length ? +arr[Math.min(arr.length - 1, Math.floor(f * arr.length))].toFixed(2) : null);
      gaps.sort((x, y) => x - y);
      return { frames: cost.length, p50: q(cost, 0.5), p95: q(cost, 0.95), max: q(cost, 1), longtasks: lt.length, longest: lt.length ? Math.round(Math.max(...lt)) : 0, rafGapP50: q(gaps, 0.5), rafGapP95: q(gaps, 0.95), info: window.HEAP2.info() };
    });
    (report.perf || (report.perf = {}))[name] = r;
    console.log('perf', name, JSON.stringify(r));
    await c.close();
  }
  await browser.close();
  report.problems = problems;
  fs.writeFileSync(path.join(out, 'qa-' + (flags.only ? flags.only.replace(/,/g, '+') : 'all') + (flags.skip ? '-skip-' + flags.skip.replace(/,/g, '+') : '') + '.json'), JSON.stringify(report, null, 1));
  console.log(problems.length ? problems.length + ' problem(s)' : 'all checks passed');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
