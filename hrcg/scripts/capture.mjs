#!/usr/bin/env node
// Deterministic frame capture of a registered capture scene (brief G16, §4.1 "Capture", A1's system/capture.ts).
// Opens <url> (add ?capture yourself, e.g. http://127.0.0.1:5300/?capture&sandbox=hero/CoverStage), waits for
// window.__hrcgCapture.ready, then for each time t calls __hrcgCapture.seek(scene, t) (which awaits the scene's
// seek + 2 frames) and screenshots the page, or only the element [data-capture-crop="<scene>"] with --crop.
// Run it through the CPU queue: scripts/cpuq node scripts/capture.mjs ...
//
// usage:
//   node scripts/capture.mjs <url> <scene> <outDir> [--fps 24] [--from 0] [--to <duration>]
//        [--times 0.1,0.5,0.9] [--w 1920] [--h 1080] [--dpr 1] [--crop] [--prefix f] [--timeout 120000]
// Frames are written as <outDir>/<prefix>00000.png …; --times writes <prefix>t<t>.png per time.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const [url, scene, outDir, ...rest] = process.argv.slice(2);
if (!url || !scene || !outDir) {
  console.error('usage: node scripts/capture.mjs <url> <scene> <outDir> [--fps 24] [--from 0] [--to d] [--times a,b] [--w 1920] [--h 1080] [--dpr 1] [--crop]');
  process.exit(2);
}
const opt = { fps: 24, from: 0, to: null, times: null, w: 1920, h: 1080, dpr: 1, crop: false, prefix: 'f', timeout: 120000 };
for (let i = 0; i < rest.length; i++) {
  const k = rest[i].replace(/^--/, '');
  if (k === 'crop') { opt.crop = true; continue; }
  const v = rest[++i];
  opt[k] = k === 'times' ? v.split(',').map(Number) : k === 'prefix' ? v : Number(v);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: opt.w, height: opt.h }, deviceScaleFactor: opt.dpr });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(url, { waitUntil: 'load', timeout: opt.timeout });
await page.waitForFunction(() => window.__hrcgCapture && window.__hrcgCapture.ready, null, { timeout: opt.timeout });
const scenes = await page.evaluate(() => window.__hrcgCapture.list());
if (!scenes.includes(scene)) {
  console.error(`scene "${scene}" not registered; have: ${scenes.join(', ')}`);
  await browser.close(); process.exit(1);
}
const duration = await page.evaluate((s) => window.__hrcgCapture.duration(s), scene);
const times = opt.times ?? (() => {
  const to = opt.to ?? duration; const n = Math.max(1, Math.round((to - opt.from) * opt.fps) + 1);
  return Array.from({ length: n }, (_, i) => opt.from + i / opt.fps);
})();
const target = opt.crop ? page.locator(`[data-capture-crop="${scene}"]`).first() : page;
for (let i = 0; i < times.length; i++) {
  const t = Math.min(times[i], duration);
  await page.evaluate(([s, tt]) => window.__hrcgCapture.seek(s, tt), [scene, t]);
  const name = opt.times ? `${opt.prefix}t${times[i]}.png` : `${opt.prefix}${String(i).padStart(5, '0')}.png`;
  await target.screenshot({ path: join(outDir, name) });
  if (i % 24 === 0 || opt.times) console.log(`${scene} t=${t.toFixed(3)} -> ${name}`);
}
await browser.close();
console.log(JSON.stringify({ scene, duration, frames: times.length, outDir }));
