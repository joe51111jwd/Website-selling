// Usage (from susd-render/): node tools/check_heap_artifact.cjs heap-site-artifact out/heap-site/artifact-shots   (serves on port 8774)
// Serves heap-site-artifact/ wrapped in a minimal skeleton (as the claude.ai host does) and checks it like a visitor,
// top-level and inside a sandboxed iframe (scripts + popups, no top navigation), desktop and iPhone.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = process.argv[2], shots = process.argv[3];
fs.mkdirSync(shots, { recursive: true });
const body = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const wrap = (theme) => `<!doctype html><html lang="en"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Heap</title></head><body>\n${body}\n</body></html>`;
const types = { '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/frame/' || u.pathname === '/frame') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(wrap(u.searchParams.get('theme'))); return; }
  if (u.pathname === '/host') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;height:100%;background:#fff}iframe{border:0;width:100%;height:100%;display:block}</style></head><body><iframe id="f" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms" src="/frame/"></iframe></body></html>`); return; }
  const f = path.join(root, u.pathname.replace(/^\/frame\//, '/'));
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
}).listen(8774, async () => {
  const problems = []; const note = (m) => { problems.push(m); console.log('PROBLEM ' + m); };
  const b = await chromium.launch();
  for (const [name, opts, url] of [
    ['desktop-top', { viewport: { width: 1440, height: 900 } }, '/frame/'],
    ['iphone-top', { ...devices['iPhone 13'] }, '/frame/'],
    ['iphone-iframe', { ...devices['iPhone 13'] }, '/host'],
    ['desktop-light-theme', { viewport: { width: 1440, height: 900 }, colorScheme: 'light' }, '/frame/?theme=light'],
    ['desktop-dark-scheme', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, '/frame/?theme=dark'],
  ]) {
    const ctx = await b.newContext({ ...opts, deviceScaleFactor: 1 });
    await ctx.route('https://scaling-up-side-down.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>appendix</p>' }));
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await page.goto('http://127.0.0.1:8774' + url, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const fr = url === '/host' ? page.frame({ url: /\/frame\// }) : page.mainFrame();
    const mobile = !!opts.isMobile;
    const info = await fr.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, cream: getComputedStyle(document.documentElement).getPropertyValue('--cream').trim(),
      imgs: [...document.images].filter((i) => i.complete && i.naturalWidth).length, counts: document.querySelector('.cnt-cables').textContent.replace(/\s+/g, ' ').trim(),
      hs: document.documentElement.scrollWidth > innerWidth, heap: !!window.HEAP }));
    console.log(name, JSON.stringify(info));
    if (info.bg !== 'rgb(16, 19, 21)' || info.cream !== '#EEF0EC') note(name + ': colours changed ' + JSON.stringify(info));
    if (!info.heap || info.imgs < 2 || info.hs) note(name + ': did not load right ' + JSON.stringify(info));
    await page.screenshot({ path: path.join(shots, name + '-hero.jpg'), type: 'jpeg', quality: 80 });
    // scroll to the tidy room: the rack tag
    await fr.evaluate(() => window.scrollTo(0, window.HEAP.top() + 925 * window.HEAP.unit())); await page.waitForTimeout(500);
    const tag = await fr.evaluate(() => +getComputedStyle(document.querySelector('.racktag')).opacity);
    if (tag < 0.9) note(name + ': rack tag not shown');
    await page.screenshot({ path: path.join(shots, name + '-tidy.jpg'), type: 'jpeg', quality: 80 });
    // the book link scrolls in-page (no navigation)
    await fr.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    const before = fr.url();
    await fr.click('.booklink');
    await page.waitForTimeout(400);
    const bk = await fr.evaluate(() => ({ url: location.href, top: Math.round(document.getElementById('book').getBoundingClientRect().top), h: innerHeight }));
    if (bk.url !== before || bk.top < 0 || bk.top > bk.h) note(name + ': book link ' + JSON.stringify(bk));
    // Get it free: first tap lands on the form
    await fr.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    if (mobile) await fr.tap('.bar .btn'); else await fr.click('.dock .btn');
    await page.waitForTimeout(500);
    const j = await fr.evaluate(() => ({ top: Math.round(document.getElementById('get').getBoundingClientRect().top), off: document.documentElement.classList.contains('dock-off'), url: location.href }));
    if (Math.abs(j.top) > 2 || !j.off) note(name + ': jump ' + JSON.stringify(j));
    // form: invalid, then valid -> a new tab with the appendix URL, this frame stays
    const press = (sel) => mobile ? fr.tap(sel) : fr.click(sel);
    await press('#get-form button'); await page.waitForTimeout(150);
    if (!(await fr.isVisible('.msg-bad'))) note(name + ': no invalid message');
    await fr.fill('#email', 'founder@example.com');
    const pop = ctx.waitForEvent('page', { timeout: 3000 }).catch(() => null);
    await press('#get-form button');
    const np = await pop;
    await page.waitForTimeout(500);
    const popUrl = np ? np.url() : null;
    console.log(name, 'new tab:', popUrl, '| frame url:', fr.url());
    if (popUrl !== 'https://scaling-up-side-down.vercel.app/appendix#get') note(name + ': new tab url ' + popUrl);
    if (fr.url() !== j.url) note(name + ': the frame navigated to ' + fr.url());
    if (!(await fr.isVisible('.msg-go'))) note(name + ': no "Taking you" message');
    await page.screenshot({ path: path.join(shots, name + '-form.jpg'), type: 'jpeg', quality: 80 });
    if (np) await np.close();
    // blocked popup: the visible link
    await fr.evaluate(() => { window.open = () => null; });
    await press('#get-form button'); await page.waitForTimeout(200);
    const lk = await fr.evaluate(() => { const a = document.querySelector('.msg-blocked a'); const p = a.closest('p'); return { shown: !p.hidden && a.getBoundingClientRect().height > 0, href: a.href, target: a.target, rel: a.rel }; });
    if (!lk.shown || lk.href !== 'https://scaling-up-side-down.vercel.app/appendix#get' || lk.target !== '_blank' || !/noopener/.test(lk.rel)) note(name + ': blocked fallback ' + JSON.stringify(lk));
    if (name === 'iphone-top') await page.screenshot({ path: path.join(shots, name + '-blocked.jpg'), type: 'jpeg', quality: 80 });
    errs.forEach((e) => note(name + ': ' + e));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(problems.length ? problems.length + ' problems' : 'artifact: all checks passed');
});
