// The Heap site: screenshots + rule checks (Playwright). Serve susd-render/heap-site first, then:
//   node tools/shoot_heap.cjs http://127.0.0.1:PORT/ [outdir]   (default outdir: out/heap-site/shell-shots)
// Checks, per viewport: no console errors / page errors / failed requests; no horizontal scroll; on each beat shot
// the words stay off the counts, the dock and the bar (and on screen); "Get it free" jumps to #get with the dock/bar
// hidden; the form: empty -> "Enter your email address.", valid -> "Taking you..." then same-tab navigation to the
// Appendix URL with no email in it. Also a no-JS full-page shot and a reduced-motion hero. Exit 1 on any problem.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.argv[2] || 'http://127.0.0.1:8770/';
const out = process.argv[3] || path.join(__dirname, '..', 'out', 'heap-site', 'shell-shots');
// numbered beat shots for review (1440x900 as d-NN-*.jpg, 390x844 as p-NN-*.jpg)
const shotsDir = process.argv[4] || path.join(__dirname, '..', 'out', 'heap-site', 'shots');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(shotsDir, { recursive: true });
const ANCH = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'heap-site', 'assets', 'img', 'anchors.json'), 'utf8'));
const FRAME_OF = { hero: '08', b09: '09', b10: '10', b11: '11', b12: '12', b13: '13', b14: '14', b15: '15', turn: '15', tidy1: '-tidy', tidy2: '-tidy', tidy3: '-tidy' };
const jpg = (page, file) => page.screenshot({ path: file, type: 'jpeg', quality: 82 });
const VIEWS = [
  { name: 'd1440', w: 1440, h: 900 },
  { name: 'd1280', w: 1280, h: 800 },
  { name: 'd1920', w: 1920, h: 1080 },
  { name: 'p390', w: 390, h: 844, mobile: true },
  { name: 'p375', w: 375, h: 667, mobile: true },
];
const BEATS = [['hero', 0], ['b09', 110], ['b10', 215], ['b11', 290], ['b12', 380], ['b13', 485], ['b14', 580], ['b15', 690], ['turn', 800], ['tidy1', 925], ['tidy2', 1010], ['tidy3', 1095]];
const SHOTS = new Set(['hero', 'b10', 'b13', 'b15', 'tidy1', 'tidy3']);
const problems = [];
const note = (v, m) => { problems.push(v + ': ' + m); console.log('PROBLEM ' + v + ': ' + m); };

(async () => {
  const browser = await chromium.launch();
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: !!v.mobile, hasTouch: !!v.mobile });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') note(v.name, 'console: ' + m.text()); });
    page.on('pageerror', (e) => note(v.name, 'pageerror: ' + e.message));
    page.on('requestfailed', (r) => { if (!/appendix/.test(r.url())) note(v.name, 'request failed: ' + r.url()); });
    await page.goto(base, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    let bi = 0;
    for (const [name, s] of BEATS) {
      bi++;
      await page.evaluate((s) => window.scrollTo(0, window.HEAP.top() + s * window.HEAP.unit()), s);
      await page.waitForTimeout(450);
      const fk = (v.mobile ? 'p' : 'd') + FRAME_OF[name];
      const r = await page.evaluate((A) => {
        const box = (el) => { const q = el.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
        const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
        const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
        const lines = [];
        document.querySelectorAll('.layer').forEach((L) => {
          if (+getComputedStyle(L).opacity < 0.05 || getComputedStyle(L).visibility === 'hidden') return;
          const w = document.createTreeWalker(L, NodeFilter.SHOW_TEXT); let n; const rg = document.createRange();
          while ((n = w.nextNode())) {
            if (!n.nodeValue.trim() || n.parentNode.closest('.static')) continue;
            rg.selectNodeContents(n);
            for (const q of rg.getClientRects()) if (q.width > 0.5) lines.push({ l: q.left, t: q.top, r: q.right, b: q.bottom, txt: n.nodeValue.trim().slice(0, 30) });
          }
        });
        const others = [];
        ['.cnt-people', '.cnt-cables', '.racktag', '.dock', '.bar', '.lockup'].forEach((sel) => {
          const el = document.querySelector(sel); if (el && vis(el)) others.push({ sel, ...box(el) });
        });
        const bad = [];
        lines.forEach((q) => {
          others.forEach((o) => { if (hit(q, o)) bad.push(q.txt + ' x ' + o.sel); });
          if (q.l < 0 || q.r > innerWidth || q.b > innerHeight) bad.push(q.txt + ' off screen');
        });
        const cp = document.querySelector('.cnt-people'), cc = document.querySelector('.cnt-cables');
        if (vis(cp) && vis(cc) && hit(box(cp), box(cc))) bad.push('people count x cables count');
        // the picture's things, from the renders' anchors, in viewport px: the words and the counts' words stay off
        // the mugs and the heap; the counts sit at the mugs and the heap top; the rack tag's leader ends in the port
        const fb = document.querySelector('.livebox').getBoundingClientRect();
        const X = (a) => fb.left + a[0] * fb.width, Y = (a) => fb.top + a[1] * fb.height;
        const a = A.anchors, land = [];
        // the mugs and the shelf board under them (mugs_left / mugs_right are the row's ends at mid-mug height, mugs_top
        // the rims; the board is ~6 px under the mugs' feet)
        const mugs = { l: X(a.mugs_left) - 4, t: Y(a.mugs_top) - 4, r: X(a.mugs_right) + 4, b: 2 * Y(a.mugs_left) - Y(a.mugs_top) + 6 };
        const heap = A.cables && !a.rack ? { l: X(a.heap_left), t: Y(a.heap_top) + 6, r: X(a.heap_top) + 0.3 * fb.width, b: innerHeight } : null;
        lines.forEach((q) => {
          if (hit(q, mugs)) bad.push(q.txt + ' x the mugs');
          if (heap && hit(q, heap)) bad.push(q.txt + ' x the heap');
        });
        if (vis(cc)) {
          [cp, cc].forEach((el) => {
            const q = box(el);
            if (hit(q, mugs)) bad.push(el.className + ' x the mugs');
            if (heap && hit(q, heap)) bad.push(el.className + ' x the heap');
          });
          const pq = box(cp);
          // people: under the shelf, starting within the row of mugs
          if (!(pq.l >= X(a.mugs_left) - 2 && pq.l <= X(a.mugs_right) && pq.t >= mugs.b && pq.t <= mugs.b + 60)) bad.push('people count not under the mugs ' + JSON.stringify(pq));
          // cables: the leader's end is on the heap top
          const ld = document.querySelector('.leader'), lq = box(ld);
          if (+getComputedStyle(ld).opacity > 0.05) {
            const ex = ld.classList.contains('v') ? lq.l : lq.r, ey = lq.b;
            land.push('leader end ' + Math.round(ex) + ',' + Math.round(ey) + ' heap top ' + Math.round(X(a.heap_top)) + ',' + Math.round(Y(a.heap_top)));
            if (Math.abs(ex - X(a.heap_top)) > 3 || Math.abs(ey - Y(a.heap_top)) > 14) bad.push('cables leader misses the heap top: ' + land[land.length - 1]);
          } else bad.push('cables leader hidden');
        }
        if (a.rack_port) {
          const tg = document.querySelector('.racktag'), rl = document.querySelector('.rackleader');
          if (!vis(tg)) bad.push('rack tag hidden');
          else {
            const rq = box(rl);
            land.push('rack leader end ' + Math.round(rq.l) + ',' + Math.round(rq.b) + ' port ' + Math.round(X(a.rack_port)) + ',' + Math.round(Y(a.rack_port)));
            if (Math.abs(rq.l - X(a.rack_port)) > 3 || Math.abs(rq.b - Y(a.rack_port)) > 8) bad.push('rack leader misses the empty port: ' + land[land.length - 1]);
          }
        }
        const dockVis = ['.dock .btn', '.bar .btn'].some((sel) => { const el = document.querySelector(sel); if (!el || !vis(el)) return false; const q = box(el); return q.r > 0 && q.l < innerWidth && q.b > 0 && q.t < innerHeight && vis(el.closest('.dock, .bar')); });
        if (!dockVis) bad.push('no visible Get it free button');
        return { bad, land, hs: document.documentElement.scrollWidth > innerWidth, counts: vis(cc) ? cp.textContent.trim().replace(/\s+/g, ' ') + ' | ' + cc.textContent.trim().replace(/\s+/g, ' ') : '(counts off)' };
      }, ANCH[fk]);
      if (r.land.length && (v.name === 'd1440' || v.name === 'p390')) console.log('   ', r.land.join('; '));
      if (r.hs) note(v.name, name + ': horizontal scroll');
      r.bad.forEach((b) => note(v.name, name + ': overlap ' + b));
      console.log(v.name, name, r.counts);
      if (SHOTS.has(name) || v.name === 'd1440' || v.name === 'p390') await page.screenshot({ path: path.join(out, `${v.name}-${name}.png`) });
      if (v.name === 'd1440' || v.name === 'p390') await jpg(page, path.join(shotsDir, `${v.mobile ? 'p' : 'd'}-${String(bi).padStart(2, '0')}-${name}.jpg`));
    }
    // "Get it free": instant jump to the form, the dock / bar step aside
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    if (v.mobile) await page.tap('.bar .btn'); else await page.click('.dock .btn');
    await page.waitForTimeout(500);
    const j = await page.evaluate(() => {
      const top = (sel) => { const el = document.querySelector(sel), q = el.getBoundingClientRect(); const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return hit === el || el.contains(hit); };
      const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
      const over = [...document.querySelectorAll('.livebox > *, .layer, .dock, .bar')].filter((el) => vis(el) && el.getBoundingClientRect().height > 0 && (!el.classList.contains('layer') || +getComputedStyle(el).opacity > 0.05)).map((el) => el.className);
      return { hash: location.hash, top: document.getElementById('get').getBoundingClientRect().top, off: document.documentElement.classList.contains('dock-off'),
        inputOnTop: top('#email'), buttonOnTop: top('#get-form button'), over };
    });
    if (j.hash !== '#get' || Math.abs(j.top) > 2 || !j.off || !j.inputOnTop || !j.buttonOnTop || j.over.length) note(v.name, 'jump to #get wrong ' + JSON.stringify(j));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) note(v.name, 'finale: horizontal scroll');
    await page.screenshot({ path: path.join(out, `${v.name}-finale.png`) });
    if (v.name === 'd1440' || v.name === 'p390') await jpg(page, path.join(shotsDir, `${v.mobile ? 'p' : 'd'}-13-finale.jpg`));
    // the form
    const press = (sel) => v.mobile ? page.tap(sel) : page.click(sel);
    await press('#get-form button');
    await page.waitForTimeout(200);
    if (!(await page.isVisible('.msg-bad'))) note(v.name, 'empty email: no message');
    if (v.name === 'd1440' || v.name === 'p390') await jpg(page, path.join(shotsDir, `${v.mobile ? 'p' : 'd'}-14-form-invalid.jpg`));
    await page.fill('#email', 'not-an-email');
    await press('#get-form button');
    await page.waitForTimeout(200);
    if (!(await page.isVisible('.msg-bad'))) note(v.name, 'bad email: no message');
    await page.fill('#email', 'founder@example.com');
    let navUrl = null;
    await page.route('**/appendix**', (route) => { navUrl = route.request().url(); route.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }); });
    await press('#get-form button');
    await page.waitForTimeout(150);
    if (!(await page.isVisible('.msg-go'))) note(v.name, 'valid email: no "Taking you" message');
    if (v.name === 'd1440' || v.name === 'p390') await page.screenshot({ path: path.join(out, `${v.name}-finale-sent.png`) });
    if (v.name === 'd1440' || v.name === 'p390') await jpg(page, path.join(shotsDir, `${v.mobile ? 'p' : 'd'}-15-form-valid.jpg`));
    await page.waitForTimeout(1200);
    if (navUrl !== 'https://scaling-up-side-down.vercel.app/appendix' && navUrl !== 'https://scaling-up-side-down.vercel.app/appendix#get') note(v.name, 'navigation wrong: ' + navUrl);
    if (!navUrl || /example\.com|%40|@|email|\?/.test(navUrl)) note(v.name, 'navigation carries the email: ' + navUrl);
    const landed = page.url();
    if (landed !== 'https://scaling-up-side-down.vercel.app/appendix#get') note(v.name, 'landed on ' + landed);
    console.log(v.name, 'form: navigated to', landed);
    if (ctx.pages().length !== 1) note(v.name, 'opened a new tab');
    await ctx.close();
  }
  // no JavaScript: every beat stacked as a plate with its frame and words
  for (const v of [VIEWS[0], VIEWS[3]]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, javaScriptEnabled: false, isMobile: !!v.mobile });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const hs = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (hs) note(v.name + '-nojs', 'horizontal scroll');
    // the page is taller than one capture allows: shoot plates 1, 6 and the finale
    for (const [tag, sel] of [['hero', '#b08'], ['b13', '#b13'], ['finale', '.finale']]) {
      await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), sel);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(out, `${v.name}-nojs-${tag}.png`) });
      await jpg(page, path.join(shotsDir, `${v.mobile ? 'p' : 'd'}-nojs-${tag}.jpg`));
    }
    const nj = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('.beat:not(.frameonly) .caption, .cluster').forEach((c) => {
        const q = c.getBoundingClientRect(), cs = getComputedStyle(c);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.9 || q.height < 10) bad.push('hidden words in ' + (c.closest('section') || {}).id);
        if (q.left < 0 || q.right > innerWidth + 1) bad.push('words off screen in ' + (c.closest('section') || {}).id);
      });
      const imgs = [...document.querySelectorAll('.beat:not(.frameonly) .frame img')].filter((i) => getComputedStyle(i.closest('.frame')).display !== 'none');
      return { bad, imgs: imgs.length };
    });
    nj.bad.forEach((b) => note(v.name + '-nojs', b));
    if (nj.imgs < 12) note(v.name + '-nojs', 'only ' + nj.imgs + ' frames shown');
    await ctx.close();
  }
  // reduced motion
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => note('rm', 'pageerror: ' + e.message));
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    for (let s = 0; s <= 1200; s += 15) {
      await page.evaluate((s) => window.scrollTo(0, window.HEAP.top() + s * window.HEAP.unit()), s);
      await page.waitForTimeout(60);
      const fo = await page.evaluate(() => [...document.querySelectorAll('.beat')].flatMap((b) => [b.style.getPropertyValue('--fo'), b.style.getPropertyValue('--lo')]).filter((x) => x && +x > 0 && +x < 1));
      if (fo.length) { note('rm', 's ' + s + ': half-blended frames or words with reduced motion: ' + fo.join(',')); break; }
    }
    await page.evaluate((s) => window.scrollTo(0, window.HEAP.top() + s * window.HEAP.unit()), 485);
    await page.waitForTimeout(300);
    await jpg(page, path.join(shotsDir, 'd-rm-b13.jpg'));
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ base, problems }, null, 1));
  console.log(problems.length ? problems.length + ' problems' : 'all checks passed');
  process.exit(problems.length ? 1 : 0);
})();
