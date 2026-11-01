// Screenshot and check the real site (site/index.html) served over HTTP.
//   (cd site && python3 -m http.server 8765 --bind 127.0.0.1) &  node tools/shoot_site.cjs http://127.0.0.1:8765/
// Writes out/site-shots/{desktop,phone}-NN-<beat>.png (+ extra viewports, no-JS and reduced-motion shots) and
// prints a JSON report. Exit 1 on: a console error, a failed request, horizontal scroll, two visible text boxes
// within 8 px of each other (or on the rendered sentence), the Bootloader button missing where it must show (or
// showing on the offer/form screens), or the form not opening the Appendix URL.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const OUT = path.resolve(__dirname, '..', 'out', 'site-shots');
fs.mkdirSync(OUT, { recursive: true });
const APPENDIX = 'https://scaling-up-side-down.vercel.app/appendix#get';
const BEATS = [
  ['01', 'first-screen', 0], ['02', 'hiring', 95], ['03', 'twelve', 175], ['04', 'touch-13', 265], ['05', 'under', 375],
  ['06', 'redline', 495], ['07', 'turn', 595], ['08', 'side', 690], ['09', 'down', 780], ['10', 'offer', 868],
  ['11', 'cycle2', 1000], ['12', 'repeat', 1080], ['13', 'oxygen', 1180], ['14', 'finale-get', 'get'],
];
const NOBTN = new Set(['offer', 'finale-get']);       // one button per screen: the dock/bar steps aside here
const problems = [];
const report = {};

async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(450);
}
async function goS(page, s) {
  if (s === 'get') {
    await page.evaluate(() => { const g = document.getElementById('get'); window.scrollTo(0, g.getBoundingClientRect().top + scrollY); });
  } else {
    await page.evaluate((s) => window.scrollTo(0, window.SUSD.top() + s * window.SUSD.unit()), s);
  }
  // wait for the frames on screen to be decoded
  await page.waitForFunction(() => [...document.querySelectorAll('.beat')].every((b) => {
    const fo = +getComputedStyle(b).getPropertyValue('--fo') || 0;
    if (fo < 0.01) return true;
    const im = b.querySelector('.frame img');
    return !im || (im.complete && im.naturalWidth > 0);
  }), null, { timeout: 15000 }).catch(() => problems.push('frames not loaded at s=' + s));
  await settle(page);
}

// everything a visitor can read on this screen, with its box; and the rendered sentence's box
const PROBE = () => {
  const W = innerWidth, H = innerHeight;
  const vis = (el) => {
    let o = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= +cs.opacity;
    }
    return o;
  };
  const sel = ['.lockup', '.booklink', '.dock', '.bar', '.audience', '.tags .tag', '.wtag', '.instrument.live', '.legend.live', '.caption', '.offer',
    '.cluster .lead', '.fspec', '.fform', '.bookline', 'html:not(.js) .static'];
  const boxes = [];
  for (const q of sel) for (const el of document.querySelectorAll(q)) {
    const o = vis(el);
    if (o < 0.3) continue;
    let r = el.getBoundingClientRect();
    if (el.classList.contains('tag-margin')) r = el.querySelector('span').getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > H) continue;
    const name = q + (el.closest('.beat') ? '#' + el.closest('.beat').id : '') + (el.classList.contains('tag') ? '.' + [...el.classList].slice(1).join('.') : '');
    boxes.push({ q: name, r: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, o: +o.toFixed(2) });
  }
  // the frame on screen: the beat with the largest --fo; its anchors give the sentence's box
  let best = null, bo = -1;
  for (const b of document.querySelectorAll('.beat')) {
    const fo = document.documentElement.classList.contains('js') ? (+getComputedStyle(b).getPropertyValue('--fo') || 0) : 1;
    if (fo > bo && b.querySelector('.frame')) { bo = fo; best = b; }
  }
  let words = null;
  if (best && document.documentElement.classList.contains('js')) {
    const a = JSON.parse(best.dataset.a);
    const phone = matchMedia('(max-aspect-ratio: 3/4)').matches;
    const fb = best.querySelector('.fbox').getBoundingClientRect();
    const st = document.querySelector('.stage').getBoundingClientRect();
    const wk = phone ? (a.p && a.p.wb) : a.wb;
    const ww = JSON.parse(best.dataset.words || 'null');
    words = { id: best.id, wb: wk, fb: { left: fb.left, top: fb.top, w: fb.width, h: fb.height }, stTop: st.top };
  }
  const dock = document.querySelector(matchMedia('(max-aspect-ratio: 3/4)').matches ? '.bar .btn' : '.dock .btn');
  const dr = dock.getBoundingClientRect();
  const dockOn = vis(dock) > 0.5 && dr.width >= 44 && dr.height >= 44 && dr.top >= 0 && dr.bottom <= H;
  return { boxes, words, dockOn, dockBox: [Math.round(dr.width), Math.round(dr.height)], overflow: document.documentElement.scrollWidth - innerWidth,
    s: window.SUSD ? +window.SUSD.clock().toFixed(1) : null, frame: best && best.id };
};
// the rendered sentence's box per frame, from the anchors (words[0..3] of the frame on screen)
const WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'out', 'site-shots', '.words.json'), 'utf8'));

function check(name, pr, phone) {
  const pad = 8, hit = (a, b, p) => a.left - p < b.right && b.left - p < a.right && a.top - p < b.bottom && b.top - p < a.bottom;
  const out = [];
  const B = pr.boxes.filter((b) => !b.q.startsWith('.booklink'));
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j];
    if (a.q === '.lockup' && b.q === '.booklink') continue;
    if (hit(a.r, b.r, pad)) out.push(a.q + ' x ' + b.q);
  }
  if (pr.words) {
    const id = pr.words.id, w = WORDS[id] && WORDS[id][phone ? 'p' : 'd'];
    if (w) {
      const f = pr.words.fb;
      const wr = { left: f.left + w[0] * f.w, right: f.left + w[2] * f.w, top: f.top + w[1] * f.h, bottom: f.top + w[3] * f.h };
      for (const b of B) if (!b.q.startsWith('.bar') && !b.q.startsWith('.lockup') && hit(b.r, wr, 4)) out.push(b.q + ' x rendered sentence');
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const mk = async (opts, label) => {
    const ctx = await browser.newContext(opts);
    await ctx.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>appendix stub</title>' }));
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(label + ': console ' + m.text()); });
    page.on('pageerror', (e) => errors.push(label + ': pageerror ' + e.message));
    page.on('requestfailed', (r) => { if (!r.url().startsWith('https://scaling-up-side-down')) errors.push(label + ': failed ' + r.url() + ' ' + (r.failure() || {}).errorText); });
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('https://scaling-up-side-down.vercel.app/') && !u.startsWith('data:')) errors.push(label + ': other host ' + u); });
    page.on('response', (r) => { if (r.status() >= 400) errors.push(label + ': HTTP ' + r.status() + ' ' + r.url()); });
    return { ctx, page };
  };
  const layouts = [
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['phone', { ...devices['iPhone 13'] }],
  ];
  for (const [lay, opts] of layouts) {
    const { ctx, page } = await mk(opts, lay);
    // bytes before first paint
    const bytes = [];
    page.on('response', async (r) => { try { const b = await r.body(); bytes.push({ url: r.url(), n: b.length, t: Date.now() }); } catch (e) {} });
    const t0 = Date.now();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fcp = await page.evaluate(() => new Promise((r) => {
      const e = performance.getEntriesByName('first-contentful-paint')[0];
      if (e) return r(e.startTime);
      new PerformanceObserver((l) => r(l.getEntries()[0].startTime)).observe({ type: 'paint', buffered: true });
      setTimeout(() => r(null), 3000);
    }));
    const res = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => ({ n: e.name, start: e.startTime, end: e.responseEnd, size: e.encodedBodySize })));
    const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n.encodedBodySize; });
    const early = res.filter((e) => e.start < fcp);
    report[lay] = { fcpMs: Math.round(fcp), bytesBeforeFirstPaint: nav + early.reduce((a, e) => a + e.size, 0), earlyFiles: early.map((e) => e.n.replace(BASE, '') + ' ' + e.size), beats: {} };
    for (const [nn, name, s] of BEATS) {
      await goS(page, s);
      const file = path.join(OUT, `${lay}-${nn}-${name}.png`);
      await page.screenshot({ path: file });
      const pr = await page.evaluate(PROBE);
      const ov = check(name, pr, lay === 'phone');
      const wantBtn = !NOBTN.has(name);
      if (pr.dockOn !== wantBtn) problems.push(`${lay} ${name}: Bootloader button ${pr.dockOn ? 'shown' : 'missing'} (want ${wantBtn ? 'shown' : 'hidden'})`);
      if (pr.overflow > 0) problems.push(`${lay} ${name}: horizontal scroll ${pr.overflow}px`);
      ov.forEach((o) => problems.push(`${lay} ${name}: overlap ${o}`));
      report[lay].beats[name] = { s: pr.s, frame: pr.frame, dockOn: pr.dockOn, btn: pr.dockBox, overlaps: ov, boxes: pr.boxes.length };
    }
    // a crossfade in the middle (hiring), to look at the blend
    await goS(page, 65);
    await page.screenshot({ path: path.join(OUT, `${lay}-xf-crossfade-s65.png`) });
    // "Get it free" from the first screen jumps to the form (and focuses the field with a mouse)
    await page.evaluate(() => window.scrollTo(0, 0)); await settle(page);
    await page.click(lay === 'phone' ? '.bar .btn' : '.dock .btn');
    await settle(page);
    const jump = await page.evaluate(() => ({ top: Math.round(document.getElementById('get').getBoundingClientRect().top), focus: document.activeElement && (document.activeElement.id || document.activeElement.className), hash: location.hash }));
    report[lay].getItFree = jump;
    if (Math.abs(jump.top) > 2 || jump.hash !== '#get') problems.push(`${lay}: Get it free did not land on #get (${JSON.stringify(jump)})`);
    // the form: an empty submit says what to do; a real address opens the Appendix in the same tab
    await page.click('#get-form button');
    await page.waitForTimeout(150);
    const badShown = await page.evaluate(() => !document.querySelector('.msg-bad').hidden);
    if (!badShown) problems.push(`${lay}: empty submit showed no message`);
    await page.screenshot({ path: path.join(OUT, `${lay}-15-form-empty-submit.png`) });
    await page.fill('#email', 'founder@example.com');
    const [navReq] = await Promise.all([
      page.waitForRequest((r) => r.url().startsWith('https://scaling-up-side-down.vercel.app/appendix') && r.isNavigationRequest(), { timeout: 5000 }).catch(() => null),
      page.click('#get-form button'),
    ]);
    await page.waitForURL(APPENDIX, { timeout: 5000 }).catch(() => {});
    const landed = page.url();
    report[lay].form = { request: navReq && navReq.url(), landed };
    if (landed !== APPENDIX) problems.push(`${lay}: form landed on ${landed}, want ${APPENDIX}`);
    if (navReq && /email|founder/.test(navReq.url())) problems.push(`${lay}: the email left the page in the URL`);
    await ctx.close();
  }

  // other desktop sizes: the words and the HTML stay aligned, nothing overlaps or runs off
  for (const [w, h] of [[1280, 720], [1920, 1080], [1440, 789]]) {
    const lay = `desktop${w}x${h}`;
    const { ctx, page } = await mk({ viewport: { width: w, height: h } }, lay);
    await page.goto(BASE, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    report[lay] = {};
    for (const [nn, name, s] of BEATS) {
      await goS(page, s);
      const pr = await page.evaluate(PROBE);
      const ov = check(name, pr, false);
      const off = pr.boxes.filter((b) => b.r.bottom > h + 1 || b.r.right > w + 1 || b.r.left < -1).map((b) => b.q);
      ov.forEach((o) => problems.push(`${lay} ${name}: overlap ${o}`));
      off.forEach((o) => problems.push(`${lay} ${name}: off screen ${o}`));
      if (pr.overflow > 0) problems.push(`${lay} ${name}: horizontal scroll`);
      const wantBtn = !NOBTN.has(name);
      if (pr.dockOn !== wantBtn) problems.push(`${lay} ${name}: Bootloader button ${pr.dockOn ? 'shown' : 'missing'}`);
      if (['first-screen', 'touch-13', 'oxygen', 'finale-get'].includes(name)) await page.screenshot({ path: path.join(OUT, `${lay}-${nn}-${name}.png`) });
      report[lay][name] = ov.length + off.length;
    }
    await ctx.close();
  }

  // reduced motion: frames switch, never blend
  {
    const { ctx, page } = await mk({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, 'rm');
    await page.goto(BASE, { waitUntil: 'load' });
    const fos = [];
    for (const s of [50, 65, 75, 140, 150]) {
      await page.evaluate((s) => window.scrollTo(0, window.SUSD.top() + s * window.SUSD.unit()), s); await settle(page);
      fos.push(await page.evaluate(() => [...document.querySelectorAll('.beat')].map((b) => +getComputedStyle(b).getPropertyValue('--fo') || 0).filter((x) => x > 0)));
    }
    report.reducedMotion = fos;
    if (fos.some((f) => f.some((x) => x > 0 && x < 1))) problems.push('reduced motion: a frame was blended');
    await page.screenshot({ path: path.join(OUT, 'rm-desktop-s150.png') });
    await ctx.close();
  }
  // no JavaScript: the beats as plates, top to bottom
  for (const [lay, opts] of [['nojs-desktop', { viewport: { width: 1440, height: 900 } }], ['nojs-phone', { ...devices['iPhone 13'] }]]) {
    const { ctx, page } = await mk({ ...opts, javaScriptEnabled: false }, lay);
    await page.goto(BASE, { waitUntil: 'load' });
    const plates = await page.evaluate(() => [...document.querySelectorAll('.beat')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.id));
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ov > 0) problems.push(lay + ': horizontal scroll');
    report[lay] = { plates: plates.length, height: await page.evaluate(() => document.documentElement.scrollHeight) };
    // three plates and the finale, scrolled to
    for (const id of ['b-hero', 'b-redline', 'b-offer']) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
      await page.evaluate(() => Promise.all([...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; }))));
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `${lay}-${id}.png`) });
    }
    await page.evaluate(() => document.getElementById('get').scrollIntoView());
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${lay}-get.png`) });
    await ctx.close();
  }
  await browser.close();
  report.errors = errors;
  report.problems = problems.concat(errors);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.problems.length ? 1 : 0);
})();
