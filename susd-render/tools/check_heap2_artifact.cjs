// The Heap v2, claude.ai artifact copy: check it like a visitor, framed the way the host frames it.
// Usage (from susd-render/): node tools/check_heap2_artifact.cjs heap2-site-artifact out/heap2/artifact-shots   (port 8775)
// Serves heap2-site-artifact/ wrapped in a minimal skeleton (as the host does) and loads it top-level and inside a
// sandboxed iframe (sandbox="allow-scripts allow-popups": an opaque origin, no top navigation, no same-origin), with
// CORS headers on the files (an opaque origin needs them for the ES modules and the fonts), and once without them (the
// page must then drop to the stills, still readable, still with a working form). Checks: no errors; colours fixed in a
// dark-scheme host and with data-theme; the story scrolls; "Get it free" lands on the form with nothing over it; the
// form opens EXACTLY https://scaling-up-side-down.vercel.app/appendix#get in a NEW tab and never navigates the frame or
// the top page; a blocked popup shows the visible link (target=_blank, rel=noopener).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.resolve(process.argv[2] || 'heap2-site-artifact'), shots = path.resolve(process.argv[3] || 'out/heap2/artifact-shots');
fs.mkdirSync(shots, { recursive: true });
const APPX = 'https://scaling-up-side-down.vercel.app/appendix#get';
const body = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const wrap = (theme) => `<!doctype html><html lang="en"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Heap</title></head><body>\n${body}\n</body></html>`;
const types = { '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const PORT = 8775;
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const nc = u.pathname.startsWith('/nc/'), p = nc ? u.pathname.slice(3) : u.pathname;
  const cors = nc ? {} : { 'access-control-allow-origin': '*' };
  if (p === '/frame/') { res.writeHead(200, { 'content-type': 'text/html', ...cors }); res.end(wrap(u.searchParams.get('theme'))); return; }
  if (p === '/host') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;height:100%;background:#fff}iframe{border:0;width:100%;height:100%;display:block}</style></head><body><iframe id="f" sandbox="allow-scripts allow-popups" src="${nc ? '/nc' : ''}/frame/${u.search}"></iframe></body></html>`);
    return;
  }
  const f = path.join(root, p.replace(/^\/frame\//, '/'));
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', ...cors }); res.end(b); });
}).listen(PORT, async () => {
  const problems = []; const note = (m) => { problems.push(m); console.log('PROBLEM ' + m); };
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const IPH = { ...devices['iPhone 13'], viewport: { width: 390, height: 664 } };
  for (const [name, opts, url, expectGL] of [
    ['desktop-top', { viewport: { width: 1440, height: 900 } }, '/frame/', true],
    ['desktop-iframe', { viewport: { width: 1440, height: 900 } }, '/host', true],
    ['iphone-iframe', IPH, '/host', true],
    ['iphone-iframe-dark-scheme', { ...IPH, colorScheme: 'dark' }, '/host', true],
    ['desktop-iframe-theme-dark', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, '/host?theme=dark', true],
    ['iphone-iframe-no-cors', IPH, '/nc/host', false],
  ]) {
    const ctx = await b.newContext({ ...opts, deviceScaleFactor: opts.isMobile ? 2 : 1 });
    await ctx.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }));
    const page = await ctx.newPage(); page.setDefaultTimeout(120000);
    const errs = [], navs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !(expectGL === false && /CORS|Failed to load|module|font/i.test(m.text()))) errs.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    page.on('framenavigated', (f) => navs.push(f.url()));
    await page.goto('http://127.0.0.1:' + PORT + url, { waitUntil: 'load' });
    const fr = url.includes('/host') ? page.frames().find((f) => f !== page.mainFrame()) : page.mainFrame();
    if (expectGL) await fr.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 60000 }).catch(() => note(name + ': the scene never started'));
    else await page.waitForTimeout(2500);
    const frameUrl0 = fr.url(), topUrl0 = page.url(), navs0 = navs.length;
    const mobile = !!opts.isMobile;
    const info = await fr.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, paper: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
      gl: document.documentElement.classList.contains('gl'), ready: document.documentElement.classList.contains('gl-ready'), plates: getComputedStyle(document.querySelector('.plates')).display,
      hs: document.documentElement.scrollWidth - innerWidth, origin: location.origin, fontOk: document.fonts ? [...document.fonts].filter((f) => f.status === 'loaded').length : -1 }));
    console.log(name, JSON.stringify(info));
    if (info.bg !== 'rgb(198, 192, 182)' || info.paper !== '#c6c0b6') note(name + ': colours changed ' + JSON.stringify(info));
    if (expectGL && (!info.gl || !info.ready)) note(name + ': no scene ' + JSON.stringify(info));
    if (!expectGL && (info.gl || info.plates === 'none')) note(name + ': no fallback stills ' + JSON.stringify(info));
    if (info.hs > 0) note(name + ': horizontal scroll');
    await page.screenshot({ path: path.join(shots, name + '-hero.jpg'), type: 'jpeg', quality: 80 });
    if (expectGL) {
      // the wait line, mid-story
      await fr.evaluate(() => { const s = document.getElementById('story'); window.scrollTo(0, s.offsetTop + 0.645 * (s.offsetHeight - innerHeight)); });
      await fr.waitForFunction(() => window.HEAP2 && window.SUSD.t > 0.64 && Math.abs(window.HEAP2.info().t - window.SUSD.t) < 1e-6, null, { timeout: 120000, polling: 300 }).catch(() => {});
      const op = await fr.evaluate(() => +getComputedStyle(document.querySelector('.cap.big')).opacity);
      if (op < 0.99) note(name + ': the wait line is not shown at t=0.645 (' + op + ')');
      await page.screenshot({ path: path.join(shots, name + '-wait.jpg'), type: 'jpeg', quality: 80 });
      await fr.evaluate(() => { const s = document.getElementById('story'); window.scrollTo(0, s.offsetTop + 0.3 * (s.offsetHeight - innerHeight)); });
      await page.waitForTimeout(400);
    }
    // Get it free: the first tap lands on the form
    const sel = mobile ? '.bar .getit' : '.top .getit';
    if (mobile) await fr.tap(sel); else await fr.click(sel);
    await page.waitForTimeout(500);
    const j = await fr.evaluate(() => { const d = document, e = d.getElementById('email'), r = e.getBoundingClientRect(), hit = d.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      return { top: Math.round(d.getElementById('get').getBoundingClientRect().top), off: d.documentElement.classList.contains('dock-off'), clear: hit === e, url: location.href,
        scene: window.HEAP2 ? window.HEAP2.info().t : null, t: window.SUSD.t }; });
    if (Math.abs(j.top) > 2 || !j.off || !j.clear) note(name + ': jump ' + JSON.stringify(j));
    if (expectGL && j.scene !== j.t) note(name + ': the scene is still easing behind the form ' + JSON.stringify(j));
    await page.screenshot({ path: path.join(shots, name + '-get.jpg'), type: 'jpeg', quality: 80 });
    // the form: invalid, then valid -> a new tab with the Appendix URL; this frame and the top page stay put
    const press = (s) => (mobile ? fr.tap(s) : fr.click(s));
    await fr.fill('#email', 'nope'); await press('#get-form button'); await page.waitForTimeout(150);
    if (!(await fr.isVisible('.msg-bad'))) note(name + ': no invalid message');
    // the keyboard path: Enter in the field (an invalid address) shows the same label and submits nothing
    await fr.fill('#email', 'still-nope'); await fr.evaluate(() => { document.querySelector('.msg-bad').hidden = true; });
    await fr.press('#email', 'Enter'); await page.waitForTimeout(150);
    if (!(await fr.isVisible('.msg-bad'))) note(name + ': Enter in the field did nothing');
    await fr.fill('#email', 'founder@example.com');
    const pop = ctx.waitForEvent('page', { timeout: 20000 }).catch(() => null);
    await press('#get-form button');
    const np = await pop;
    if (np) await np.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(400);
    const popUrl = np ? np.url() : null;
    console.log(name, 'new tab:', popUrl);
    if (popUrl !== APPX) note(name + ': new tab url ' + popUrl);
    if (fr.url() !== frameUrl0) note(name + ': the frame navigated to ' + fr.url());
    if (page.url() !== topUrl0 || navs.length !== navs0) note(name + ': a navigation happened: ' + navs.slice(navs0).join(' '));
    if (!(await fr.isVisible('.msg-go'))) note(name + ': no "Taking you" message');
    await page.screenshot({ path: path.join(shots, name + '-form.jpg'), type: 'jpeg', quality: 80 });
    if (np) await np.close();
    // a blocked popup: the visible link
    await fr.evaluate(() => { window.open = () => null; });
    await press('#get-form button'); await page.waitForTimeout(300);
    const lk = await fr.evaluate(() => { const a = document.querySelector('.msg-blocked a'), p = a.closest('p'), r = a.getBoundingClientRect(); return { shown: !p.hidden && r.height > 0, inView: r.bottom <= innerHeight, href: a.href, target: a.target, rel: a.rel }; });
    if (!lk.shown || !lk.inView || lk.href !== APPX || lk.target !== '_blank' || !/noopener/.test(lk.rel)) note(name + ': blocked fallback ' + JSON.stringify(lk));
    if (/iphone-iframe$/.test(name)) await page.screenshot({ path: path.join(shots, name + '-blocked.jpg'), type: 'jpeg', quality: 80 });
    errs.forEach((e) => note(name + ': ' + e));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(problems.length ? problems.length + ' problems' : 'artifact: all checks passed');
  process.exit(problems.length ? 1 : 0);
});
