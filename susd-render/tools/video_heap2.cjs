// The Heap v2: a smooth scroll-through video, made by STEPPING the scroll frame by frame and screenshotting each frame
// (software GL is far too slow to record in real time). 30 fps, about 40 s, H.264 mp4 (yuv420p, +faststart).
// Serve heap2-site first, then (from susd-render/):
//   node tools/video_heap2.cjs http://127.0.0.1:8781/ d out/heap2/heap2-desktop.mp4     (1440x900)
//   node tools/video_heap2.cjs http://127.0.0.1:8781/ p out/heap2/heap2-phone.mp4       (iPhone 13, 390x844, captured at 2x: 780x1688)
// The pace is a list of keys (seconds -> story position; 0..1 is the story, 1..2 the last screen down to #get), joined
// by a monotone cubic so the scroll speeds up and slows down like a hand on a wheel, with holds where two keys match.
// The intro's draw-in is driven by the same clock (SUSD.introClock), so it is in the video too.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [base = 'http://127.0.0.1:8781/', which = 'd', outFile = path.join(__dirname, '..', 'out', 'heap2', `heap2-${which === 'p' ? 'phone' : 'desktop'}.mp4`)] = argv;
// --from=32 --to=35 (seconds): re-render only those frames into the existing frames folder, then re-encode it all
const FPS = 30;
const KEYS = [
  [0, 0], [3.6, 0],                                  // the title draws itself in; read the line
  [6.2, 0.165],                                      // the letters fall and sink away; the first mug lands
  [7.4, 0.226], [8.0, 0.233],                        // a second mug and their one cable, held
  [9.1, 0.277], [10.2, 0.325], [10.9, 0.334],        // a third, a fourth: four people, six cables, held
  [13.0, 0.476], [13.6, 0.495],                      // more people join, the cables pile up
  [15.8, 0.575],                                     // the heap pulls the mugs in
  [17.4, 0.601],                                     // the wait: everything stops, the light drops
  [18.1, 0.618], [19.1, 0.632],                      // "Most founders think they're scaling."
  [19.7, 0.645], [21.4, 0.668], [22.0, 0.686],      // ... "They're not." lands; held, the camera low and close
  [23.8, 0.746],                                     // the roll: upside down, the heap hangs like a weight
  [24.4, 0.756], [27.8, 0.795], [28.4, 0.812],      // "They're scaling upside down..."
  [30.0, 0.858],                                     // right side up, "Real scaling is cyclical."
  [31.4, 0.895], [32.8, 0.931], [34.2, 0.968],      // Up for growth. Side for stability. Down for pruning.
  [35.2, 1.0], [36.5, 2.0], [39.7, 2.0],            // down to the Bootloader card, hold
];
// monotone cubic (Fritsch-Carlson) through the keys
function pace(keys) {
  const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]), d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (x[i + 1] - x[i - 1])) / ((2 * x[i + 1] - x[i] - x[i - 1]) / d[i - 1] + (x[i + 1] + x[i] - 2 * x[i - 1]) / d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 0; i < n - 1; i++) if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; }
  return (t) => {
    if (t <= x[0]) return y[0]; if (t >= x[n - 1]) return y[n - 1];
    let i = 0; while (t > x[i + 1]) i++;
    const h = x[i + 1] - x[i], s = (t - x[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
(async () => {
  const frames = path.join(path.dirname(outFile), `frames-${which}`);
  const ranged = flags.from != null || flags.to != null;
  if (!ranged) fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const browser = await chromium.launch({ args: GL });
  const ctx = await browser.newContext(which === 'p'
    ? { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { window.SUSD = { introClock: 0 }; });
  const page = await ctx.newPage();
  page.setDefaultTimeout(180000);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(base + '?shots=1&nonav=1', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // CDP's own capture: about 0.1 s a frame here, where page.screenshot() takes seconds
  const cdp = await ctx.newCDPSession(page);
  const P = pace(KEYS), N = Math.round(KEYS[KEYS.length - 1][0] * FPS) + 1;
  const t0 = Date.now();
  const f0 = ranged ? Math.max(0, Math.floor(+(flags.from || 0) * FPS)) : 0, f1 = ranged ? Math.min(N, Math.ceil(+(flags.to || 1e9) * FPS) + 1) : N;
  if (ranged) {
    // the intro clock must be past its end before a later frame is drawn
    await page.evaluate(() => { window.SUSD.introClock = 2.4; });
  }
  for (let f = f0; f < f1; f++) {
    const sec = f / FPS, pos = P(sec);
    await page.evaluate(([pos, ic]) => {
      window.SUSD.introClock = ic;
      const s = document.getElementById('story'), H = s.offsetHeight - innerHeight, end = s.offsetTop + H;
      const g = document.getElementById('get'), gTop = g.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.round(pos <= 1 ? s.offsetTop + pos * H : end + (pos - 1) * (gTop - end)));
    }, [pos, Math.min(2.4, sec * 1.0)]);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    // phone: a 2x capture (780x1688), so the type is sharp on an iPhone; the clip is in page coordinates
    const clip = which === 'p' ? await page.evaluate(() => ({ x: 0, y: window.scrollY, width: innerWidth, height: innerHeight, scale: 2 })) : undefined;
    const shot = await cdp.send('Page.captureScreenshot', clip ? { format: 'jpeg', quality: 92, clip } : { format: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(frames, `f${String(f).padStart(5, '0')}.jpg`), Buffer.from(shot.data, 'base64'));
    if (f % 60 === 0) console.log(`${which} frame ${f}/${N} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  await browser.close();
  if (errs.length) console.log('page errors:', errs);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', which === 'p' ? '21' : '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile]);
  const mb = fs.statSync(outFile).size / 1e6;
  console.log(`wrote ${outFile}: ${N} frames, ${(N / FPS).toFixed(1)} s, ${mb.toFixed(1)} MB`);
  if (mb > 15) { console.log('over 15 MB'); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(2); });
