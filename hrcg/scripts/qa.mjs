#!/usr/bin/env node
// HRCG QA suite (brief 9.4 A6, 10.1-10.4). Owner: A6.
//
//   scripts/cpuq node scripts/qa.mjs                      build to a temp dir, serve it, run every suite
//   scripts/cpuq node scripts/qa.mjs --build <dir>        serve an existing build (skips the build)
//   scripts/cpuq node scripts/qa.mjs --url http://127.0.0.1:5300/   test a running server (no-JS suite
//                                                         then needs --build, the dev server is not prerendered)
//   --only desktop,strip,phone,rm,nogl,nojs,lint          run some suites
//   --out qa                                              results + screenshots (default qa/)
//
// Always run it through scripts/cpuq (one heavy job at a time on this box) and never call cpuq from
// inside it (the lock is already held). Headless Chromium here renders WebGL in SwiftShader at
// 2-5 fps: these checks judge layout, states, copy and determinism, never smoothness.
//
// Writes: <out>/results.json (every check), <out>/RESULTS.md (summary), <out>/shots/*.png.
// Exit code 1 when any check fails (unless --soft).
//
// Suites
//   desktop  1440x900, motion on: one H1, one H2 per sheet, view titles on every media element
//            (rule 22), THIS HASN'T HAPPENED YET count (G8), <=2 playing videos while walking the page
//            (S3), no horizontal scroll (S5), A-300 stencil slot live update + exact mailto (S7),
//            A-301 composer mailto, Copy address (granted and denied), focus-not-obscured Tab walk
//            (S4), MOTION OFF at runtime, accessibility (axe-core if installed, else the manual checks
//            below), console errors, per-sheet screenshots.
//   strip    the title strip's per-cell overflow test at 1920/1680/1440/1280/1024/768 (scrollWidth <=
//            clientWidth for every visible cell) plus the brief 3.1 collapse rules and no page scroll.
//   phone    390x844, touch: phone bar (>=44 px buttons), no horizontal scroll, no text < 10 px, H2s
//            and view titles never overflow, inputs >= 16 px, chips >= 44 px, the A-300 mini-slot stays
//            visible with an emulated keyboard viewport, exact mailto hrefs, a vertical touch swipe on
//            the hero scrolls, only the hero and A-200 pin.
//   rm       prefers-reduced-motion: rm class from first paint, no Lenis, no autoplay, no pinned
//            stages, every view title and both conversions present.
//   nogl     ?gl=0 and Chromium --disable-webgl: no errors, page complete.
//   nojs     JavaScript disabled on the prerendered build: all copy, posters, video controls, plain
//            anchors, #index, mailto links with default bodies, Copy address hidden, nothing hidden.
//   lint     the copy lint (src/system/lintRules.ts + lint-allow.json) on the rendered DOM after
//            hydration (incl. runtime-fetched copy) and on the prerendered HTML.
//
// Manual accessibility checks (used when axe-core is not installed; see results.json "a11y.engine"):
// images without alt, links/buttons without an accessible name, form controls without a label,
// duplicate ids, one h1, html[lang], one main, heading-level jumps, focusable content inside
// aria-hidden, fieldsets without legends, targets < 24x24 px (2.5.8, inline text links exempt), and
// text contrast against the nearest solid background (text over images/video is reported as
// "incomplete", as axe does).

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer as createHttpServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------------------- args

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
}
const OUT = resolve(ROOT, String(arg('out', 'qa')));
const SHOTS = join(OUT, 'shots');
const ONLY = arg('only') ? String(arg('only')).split(',') : null;
const SOFT = Boolean(arg('soft'));
const URL_ARG = arg('url');
let BUILD = arg('build') ? resolve(String(arg('build'))) : null;
const want = (s) => !ONLY || ONLY.includes(s);
const DEV_URL = process.env.HRCG_DEV_URL || 'http://127.0.0.1:5300/';

mkdirSync(SHOTS, { recursive: true });

// ---------------------------------------------------------------------------------------- deps

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_PATH, '/opt/node22/lib/node_modules/playwright', 'playwright'].filter(Boolean);
  for (const t of tries) {
    try {
      return require(t);
    } catch {
      /* next */
    }
  }
  throw new Error('Playwright not found (set PLAYWRIGHT_PATH)');
}

function findAxe() {
  const tries = [
    () => require.resolve('axe-core/axe.min.js', { paths: [ROOT] }),
    () => require.resolve('axe-core/axe.min.js', { paths: ['/opt/node22/lib/node_modules'] }),
    () => require.resolve('axe-core/axe.min.js', { paths: [resolve(ROOT, 'node_modules/@axe-core/playwright')] }),
  ];
  for (const t of tries) {
    try {
      const p = t();
      if (p && existsSync(p)) return p;
    } catch {
      /* next */
    }
  }
  return null;
}

/** Load the site's own TS modules (lint rules, mailto builder, copy) through Vite's SSR loader. */
async function loadSiteModules() {
  process.env.HRCG_PRERENDER_CHILD = '1';
  const { createServer } = await import('vite');
  const server = await createServer({
    root: ROOT,
    configFile: resolve(ROOT, 'vite.config.ts'),
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const [lint, mail, conv, chrome, sheets, challenges, viewTitles, config] = await Promise.all([
      server.ssrLoadModule('/src/system/lintRules.ts'),
      server.ssrLoadModule('/src/lib/mailto.ts'),
      server.ssrLoadModule('/src/content/copy/conversion.ts'),
      server.ssrLoadModule('/src/content/copy/chrome.ts'),
      server.ssrLoadModule('/src/content/sheets.ts'),
      server.ssrLoadModule('/src/content/challenges.ts'),
      server.ssrLoadModule('/src/content/viewTitles.ts'),
      server.ssrLoadModule('/src/content/config.ts'),
    ]);
    return { lint, mail, conv, chrome, sheets, challenges, viewTitles, config };
  } finally {
    await server.close();
  }
}

// ---------------------------------------------------------------------------------------- build + serve

function ensureBuild(log) {
  if (BUILD && existsSync(join(BUILD, 'index.html'))) return BUILD;
  const dir = BUILD ?? join(tmpdir(), 'hrcg-qa-build');
  log(`building into ${dir} (vite build + prerender; HRCG_PRERENDER_LENIENT=1)`);
  const r = spawnSync('npx', ['vite', 'build', '--outDir', dir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: ROOT,
    env: { ...process.env, HRCG_PRERENDER_LENIENT: '1', VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  if (r.status !== 0 || !existsSync(join(dir, 'index.html'))) {
    return { error: `build failed (exit ${r.status}):\n${out.slice(-4000)}` };
  }
  BUILD = dir;
  return { dir, log: out.slice(-4000) };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt',
  '.pdf': 'application/pdf',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/** Minimal static server for a build directory (with byte ranges, so <video> can seek). */
function serve(dir) {
  return new Promise((ok) => {
    const server = createHttpServer((req, res) => {
      try {
        const u = new URL(req.url, 'http://x');
        let p = decodeURIComponent(u.pathname);
        if (p.endsWith('/')) p += 'index.html';
        const file = resolve(dir, `.${p}`);
        if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
          const nf = join(dir, '404.html');
          res.writeHead(404, { 'content-type': MIME['.html'] });
          res.end(existsSync(nf) ? readFileSync(nf) : 'not found');
          return;
        }
        const buf = readFileSync(file);
        const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
        const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
        if (range) {
          const start = range[1] ? Number(range[1]) : 0;
          const end = range[2] ? Math.min(Number(range[2]), buf.length - 1) : buf.length - 1;
          res.writeHead(206, {
            'content-type': type,
            'content-range': `bytes ${start}-${end}/${buf.length}`,
            'accept-ranges': 'bytes',
            'content-length': end - start + 1,
          });
          res.end(buf.subarray(start, end + 1));
          return;
        }
        res.writeHead(200, { 'content-type': type, 'content-length': buf.length, 'accept-ranges': 'bytes' });
        res.end(buf);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

// ---------------------------------------------------------------------------------------- results

const results = {
  meta: { started: new Date().toISOString(), root: ROOT, url: null, build: null, axe: null, notes: [] },
  suites: {},
};
let failures = 0;

function suite(name) {
  const s = { checks: [], console: [], shots: [] };
  results.suites[name] = s;
  const check = (id, title, pass, detail = '') => {
    const status = pass === null ? 'skip' : pass ? 'pass' : 'fail';
    if (status === 'fail') failures++;
    s.checks.push({ id, title, status, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    const mark = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'SKIP';
    console.log(`  [${mark}] ${name}/${id} ${title}${detail && status !== 'pass' ? ` :: ${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 300)}` : ''}`);
  };
  return { s, check };
}

function attachConsole(page, s) {
  page.on('console', (m) => {
    if (m.type() === 'error') s.console.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => s.console.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText ?? '';
    if (!/ERR_ABORTED/.test(f)) s.console.push(`requestfailed: ${r.url()} ${f}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) s.console.push(`HTTP ${r.status()}: ${r.url()}`);
  });
}

async function shot(page, s, name, opts = {}) {
  const file = join(SHOTS, `${name}.png`);
  try {
    await page.screenshot({ path: file, ...opts });
    s.shots.push(relative(OUT, file));
  } catch (e) {
    s.console.push(`screenshot ${name} failed: ${e.message}`);
  }
}

async function gotoReady(page, url, { js = true } = {}) {
  let last = null;
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 90000 });
      await page.waitForSelector('#a-900', { timeout: 30000 });
      if (js) await page.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 15000 });
      await page.waitForTimeout(1500);
      return;
    } catch (e) {
      last = e;
      await page.waitForTimeout(2000);
    }
  }
  throw last;
}

const SHEET_IDS = ['a-000', 'a-100', 'a-101', 'a-102', 'a-103', 'a-104', 'a-105', 'a-200', 'a-300', 'a-301', 'a-900'];

/** Scroll through the whole page; returns the max number of playing videos seen. */
async function walk(page, { step = 0.7, wait = 450, sample = true } = {}) {
  const { H, vh } = await page.evaluate(() => ({ H: document.documentElement.scrollHeight, vh: innerHeight }));
  let maxPlaying = 0;
  const where = [];
  for (let y = 0; y <= H; y += Math.round(vh * step)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(wait);
    if (sample) {
      const n = await page.evaluate(
        () => [...document.querySelectorAll('video')].filter((v) => !v.paused && !v.ended && v.readyState > 2).length,
      );
      if (n > maxPlaying) maxPlaying = n;
      if (n > 2) where.push(y);
    }
  }
  return { maxPlaying, where };
}

async function sheetShots(page, s, prefix, ids = SHEET_IDS) {
  for (const id of ids) {
    const ok = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const top = el.getBoundingClientRect().top + scrollY;
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      window.scrollTo(0, Math.max(0, top - pad));
      return true;
    }, id);
    if (!ok) continue;
    await page.waitForTimeout(700);
    await shot(page, s, `${prefix}-${id}`);
  }
}

// ---------------------------------------------------------------------------------------- in-page probes

/** Structural page facts used by several suites. Runs in the page. */
function pageFacts() {
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const h1 = [...document.querySelectorAll('h1')].length;
  // A sheet is its [data-sheet] element; the cover stage (A2) puts data-sheet on empty scroll-track
  // elements inside a [data-stage], so an empty track counts the H2 / H1 of its stage instead.
  const sheets = [...document.querySelectorAll('[data-sheet]')].map((el) => {
    const id = el.getAttribute('data-sheet');
    const scope = el.textContent.trim().length === 0 ? el.closest('[data-stage]') ?? el : el;
    return { id, h2: scope.querySelectorAll('h2').length, h1: scope.querySelectorAll('h1').length, track: scope !== el };
  });
  // rule 22: media must sit under a non-drawing view title
  const media = [...document.querySelectorAll('video, picture, img')].filter((el) => {
    if (el.tagName === 'IMG' && el.closest('picture')) return false; // counted as its picture
    const img = el.tagName === 'PICTURE' ? el.querySelector('img') : el;
    if (img && img.tagName === 'IMG' && img.getAttribute('alt') === '') return false; // decorative
    if (el.closest('dialog')) return false;
    return true;
  });
  const unlabelled = [];
  for (const el of media) {
    const src = el.currentSrc || el.querySelector?.('img')?.getAttribute('src') || el.getAttribute('src') || '';
    const isSvgDrawing = /\.svg(\?|$)/.test(src) || /\/media\/data\//.test(src) || /t7-proof/.test(src);
    const kindEl = el.closest('[data-view-kind]');
    const kind = kindEl?.getAttribute('data-view-kind') ?? null;
    if (isSvgDrawing) continue; // drawings and our own digital renders are not AI imagery
    if (!kind || kind === 'drawing') unlabelled.push({ tag: el.tagName, src: src.split('/').pop(), kind });
  }
  const text = document.body.innerText;
  const hasnt = (document.body.textContent.match(/THIS HASN[’']T HAPPENED YET/g) ?? []).length;
  const hasntVisible = [...document.querySelectorAll('body *')].filter(
    (el) => el.childElementCount === 0 && /THIS HASN[’']T HAPPENED YET/.test(el.textContent) && vis(el),
  ).length;
  const viewTitles = document.querySelectorAll('.view-title').length;
  const mailtos = [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => ({
    id: a.getAttribute('data-mailto'),
    href: a.getAttribute('href'),
  }));
  return {
    h1,
    sheets,
    unlabelled,
    hasnt,
    hasntVisible,
    viewTitles,
    mailtos,
    textLength: text.length,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyScrollW: document.body.scrollWidth,
  };
}

/** Manual accessibility checks (axe-core substitute). Runs in the page. */
function manualA11y() {
  const out = { violations: [], incomplete: [] };
  const add = (rule, el, msg) =>
    out.violations.push({ rule, msg, node: el ? el.outerHTML.slice(0, 160) : '' });
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    const t = (el.textContent ?? '').trim();
    if (t) return t;
    const img = el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim();
    if (el.getAttribute('title')) return el.getAttribute('title');
    return '';
  };
  if (!document.documentElement.getAttribute('lang')) add('html-has-lang', null, 'html has no lang');
  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) add('page-has-one-h1', null, `${h1s.length} h1 elements`);
  if (document.querySelectorAll('main').length !== 1) add('one-main', null, 'not exactly one <main>');
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) add('image-alt', img, 'img without alt');
  });
  document.querySelectorAll('a[href], button, [role="button"]').forEach((el) => {
    if (el.closest('[hidden], dialog:not([open])')) return;
    if (!vis(el) && !el.matches(':focus-within')) return;
    if (!name(el)) add(el.tagName === 'A' ? 'link-name' : 'button-name', el, 'no accessible name');
  });
  document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => {
    const id = el.id;
    const labelled =
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.closest('label') ||
      (id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
    if (!labelled) add('label', el, 'form control without a label');
  });
  const ids = new Map();
  document.querySelectorAll('[id]').forEach((el) => ids.set(el.id, (ids.get(el.id) ?? 0) + 1));
  for (const [id, n] of ids) if (n > 1) add('duplicate-id', null, `id "${id}" x${n}`);
  let last = 0;
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (h.closest('dialog')) return;
    const lvl = Number(h.tagName[1]);
    if (last && lvl > last + 1) add('heading-order', h, `h${last} -> h${lvl}`);
    last = lvl;
  });
  document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
    const f = el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f && f.getAttribute('tabindex') !== '-1') add('aria-hidden-focus', f, 'focusable inside aria-hidden');
  });
  document.querySelectorAll('fieldset').forEach((fs) => {
    if (!fs.querySelector(':scope > legend')) add('fieldset-legend', fs, 'fieldset without legend');
  });
  // 2.5.8 target size (inline links in running text are exempt)
  document.querySelectorAll('a[href], button, input[type=checkbox], [role=button]').forEach((el) => {
    if (!vis(el) || el.closest('dialog:not([open])')) return;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /\S/.test(el.parentElement.textContent.replace(el.textContent, ''));
    if (inline) return;
    if (el.matches('input[type=checkbox]') && el.closest('label')) return; // the label is the target
    if (r.width < 24 || r.height < 24) add('target-size', el, `${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  // contrast against the nearest solid background (text over media is incomplete)
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const bgOf = (el) => {
    let e = el;
    const layers = [];
    while (e && e.nodeType === 1) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return { media: true };
      if (e.matches('video, img, picture, canvas, svg image')) return { media: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.99) break;
      }
      e = e.parentElement;
    }
    let bg = { r: 11, g: 11, b: 10, a: 1 }; // html background (--slab-black)
    for (const l of layers.reverse()) bg = blend(l, bg);
    return { bg };
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  let checked = 0;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || el.closest('svg, dialog:not([open]), .sr-only, [aria-hidden="true"], script, style, noscript')) continue;
    seen.add(el);
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    if (Number(cs.opacity) === 0) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    if (fg.a === 0) {
      out.incomplete.push({ rule: 'color-contrast', msg: 'transparent text (outline)', node: el.outerHTML.slice(0, 100) });
      continue;
    }
    const b = bgOf(el);
    // overlap with media siblings (absolutely positioned media under the text) is not detected
    if (b.media) {
      out.incomplete.push({ rule: 'color-contrast', msg: 'text over media', node: el.outerHTML.slice(0, 100) });
      continue;
    }
    const fgc = blend(fg, b.bg);
    const L1 = lum(fgc);
    const L2 = lum(b.bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    checked++;
    if (ratio + 0.005 < need)
      out.violations.push({
        rule: 'color-contrast',
        msg: `${ratio.toFixed(2)}:1 < ${need}:1 (${size}px)`,
        node: el.outerHTML.slice(0, 140),
      });
  }
  out.contrastChecked = checked;
  return out;
}

async function a11y(page, axePath) {
  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const r = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const res = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        resultTypes: ['violations', 'incomplete'],
      });
      return {
        violations: res.violations.map((v) => ({
          rule: v.id,
          impact: v.impact,
          msg: v.help,
          nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
          count: v.nodes.length,
        })),
        incomplete: res.incomplete.map((v) => ({ rule: v.id, count: v.nodes.length })),
      };
    });
    return { engine: 'axe-core', ...r };
  }
  const r = await page.evaluate(manualA11y);
  return { engine: 'manual (axe-core not installed)', ...r };
}

/** Tab through the page; every focused element must lie inside the unobscured viewport (S4). */
async function focusWalk(page, { max = 500 } = {}) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.activeElement?.blur?.();
  });
  await page.waitForTimeout(400);
  const seen = [];
  const strict = [];
  const entire = [];
  let first = null;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(160);
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body || a === document.documentElement) return null;
      const r = a.getBoundingClientRect();
      const header = document.querySelector('.sheet-header')?.getBoundingClientRect();
      const bars = [...document.querySelectorAll('.title-strip, .phone-bar')]
        .filter((e) => getComputedStyle(e).display !== 'none')
        .map((e) => e.getBoundingClientRect())
        .filter((b) => b.height > 0);
      const borderPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--border')) || 0;
      const inChrome = !!a.closest('.sheet-header, .title-strip, .phone-bar, dialog, .skip-link');
      // a checkbox drawn as a chip: judge the label (the visible target)
      const target = a.matches('input[type=checkbox]') && a.closest('label') ? a.closest('label') : a;
      const tr = target.getBoundingClientRect();
      return {
        key: `${a.tagName}#${a.id}.${String(a.className).split(' ')[0]}|${(a.textContent || a.getAttribute('aria-label') || a.getAttribute('placeholder') || '').trim().slice(0, 40)}`,
        rect: { top: tr.top, bottom: tr.bottom, left: tr.left, right: tr.right, h: tr.height },
        top: header ? Math.max(header.bottom, borderPx) : borderPx,
        bottom: bars.length ? Math.min(...bars.map((b) => b.top)) : innerHeight - borderPx,
        vh: innerHeight,
        inChrome,
        sheet: a.closest('[data-sheet]')?.getAttribute('data-sheet') ?? null,
        tiny: r.width === 0 && r.height === 0,
      };
    });
    if (!f) {
      if (seen.length) break;
      continue;
    }
    if (first === null) first = f.key;
    else if (f.key === first) break;
    seen.push(f.key);
    if (f.inChrome || f.tiny) continue;
    const { rect, top, bottom } = f;
    const fits = rect.h <= bottom - top;
    const partly = rect.top < top - 0.5 || rect.bottom > bottom + 0.5;
    const fully = rect.bottom <= top + 0.5 || rect.top >= bottom - 0.5;
    if (fully) entire.push({ el: f.key, sheet: f.sheet, rect: [Math.round(rect.top), Math.round(rect.bottom)], band: [Math.round(top), Math.round(bottom)] });
    else if (partly && fits) strict.push({ el: f.key, sheet: f.sheet, rect: [Math.round(rect.top), Math.round(rect.bottom)], band: [Math.round(top), Math.round(bottom)] });
  }
  return { count: seen.length, strict, entire };
}

/** Elements that pin (sticky and at least 80% of the viewport tall). */
function pins() {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'sticky' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.height < innerHeight * 0.8) continue;
    out.push({ sheet: el.closest('[data-sheet]')?.getAttribute('data-sheet') ?? el.closest('[data-stage]')?.getAttribute('data-stage') ?? null, cls: String(el.className).slice(0, 60) });
  }
  return out;
}

// ---------------------------------------------------------------------------------------- expectations

function expectedMail(mods) {
  const { mail } = mods;
  return {
    teamsDefault: mail.buildMailto('teams'),
    sponsorsDefault: mail.buildMailto('sponsors'),
    plain: mail.buildMailto('plain'),
    teamsFilled: mail.buildMailto('teams', {
      team: 'QA Lab',
      platform: 'Lab biped mk two',
      challenges: [1, 3],
      needs: 'Power & a pallet of brick',
    }),
    sponsorsFilled: mail.buildMailto('sponsors', {
      company: 'QA Masonry',
      make: 'Mortar, ties',
      bring: ['materials', 'expertise'],
      challenges: [5],
      also: ['demos'],
    }),
  };
}

/** Exact copy that must be in the no-JS page (a cross-section of every owner's file). */
function requiredCopy(mods) {
  const { conv, chrome, sheets, challenges, viewTitles, config } = mods;
  const out = [
    chrome.STRIP.statusValue,
    chrome.STRIP.teamsValue,
    chrome.STRIP.sponsorsValue,
    chrome.STRIP.imageryValue,
    chrome.SKIP_LINK,
    conv.TEAMS.diptychLeft,
    conv.TEAMS.diptychRight,
    conv.TEAMS.standIn,
    conv.TEAMS.h2,
    conv.TEAMS.lead,
    conv.TEAMS.body,
    conv.TEAMS.button,
    conv.TEAMS.fields.challenges.helper,
    conv.T7.h3,
    conv.T7.body,
    conv.T7.note,
    conv.SEND.finePrint,
    conv.SPONSORS.h2,
    conv.SPONSORS.body,
    conv.SPONSORS.button,
    ...conv.SPONSORS.keynotes.map((k) => k.text),
    conv.NOTES.closing,
    ...conv.NOTES.notes.flatMap((n) => [n.q, n.a]),
    ...conv.NOTES.imagery.map((r) => r.v),
    viewTitles.HASNT_HAPPENED,
    config.CONTACT_EMAIL,
    ...sheets.SHEETS.filter((s) => s.tag).map((s) => s.tag),
    ...challenges.CHALLENGES.map((c) => c.spec),
    ...Object.values(viewTitles.VIEW_TITLE_STRINGS).filter((v) => !/HASN’T HAPPENED/.test(v)),
  ];
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------------------- suites

async function runDesktop(browser, base, mods, axePath) {
  const { s, check } = suite('desktop');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
  const page = await ctx.newPage();
  attachConsole(page, s);
  await gotoReady(page, base);
  await page.waitForTimeout(2500);
  await shot(page, s, 'desktop-first-view');

  const walked = await walk(page, { step: 0.6, wait: 650 });
  check('S3', '<=2 videos playing at any sampled moment', walked.maxPlaying <= 2, `max ${walked.maxPlaying}${walked.where.length ? ` at y=${walked.where.join(',')}` : ''}`);

  const facts = await page.evaluate(pageFacts);
  check('H1-one', 'exactly one <h1>', facts.h1 === 1, `${facts.h1}`);
  // one H2 per sheet (A-000 carries the page's H1 instead); a cover-stage track counts its stage
  const badH2 = facts.sheets.filter((x) => (x.id === 'A-000' ? x.h1 !== 1 : x.track ? x.h2 < 1 : x.h2 !== 1));
  check('H2-per-sheet', 'one <h2> per sheet (A-000: the <h1>)', badH2.length === 0, badH2);
  check('S2-labels', 'every media element sits under a non-drawing view title (rule 22)', facts.unlabelled.length === 0, facts.unlabelled);
  check('S2-hasnt', 'THIS HASN’T HAPPENED YET in the DOM only at the hero film title and the A-900 end line', facts.hasntVisible <= 2 && facts.hasnt >= 1, `textContent ${facts.hasnt}, visible ${facts.hasntVisible}`);
  check('S5-1440', 'no horizontal page scroll at 1440', facts.scrollW <= facts.clientW, `${facts.scrollW} > ${facts.clientW}`);
  check('sheets', 'all eleven sheet anchors render', SHEET_IDS.every((id) => facts.sheets.some((x) => x.id?.toLowerCase() === id)), facts.sheets.map((x) => x.id).join(','));

  await sheetShots(page, s, 'desktop');

  // ---- S7: the stencil slot follows PLATFORM; the mailto stays exact
  const exp = expectedMail(mods);
  const teamsDefault = await page.getAttribute('a[data-mailto="rfi"]', 'href').catch(() => null);
  check('mailto-teams-default', 'Discuss competing → default href is exact', teamsDefault === exp.teamsDefault, teamsDefault ?? 'missing');
  const sponsorsDefault = await page.getAttribute('a[data-mailto="kit"]', 'href').catch(() => null);
  check('mailto-sponsors-default', 'Discuss sponsorship → default href is exact', sponsorsDefault === exp.sponsorsDefault, sponsorsDefault ?? 'missing');
  if (teamsDefault) {
    await page.locator('#rfi-team').scrollIntoViewIfNeeded();
    await page.fill('#rfi-team', 'QA Lab');
    await page.fill('#rfi-platform', 'Lab biped mk two');
    await page.check('#rfi-ch-01');
    await page.check('#rfi-ch-03');
    await page.fill('#rfi-needs', 'Power & a pallet of brick');
    await page.waitForTimeout(400);
    const slot = await page.evaluate(() => ({
      texts: [...document.querySelectorAll('[data-bay-slot]')].map((t) => t.textContent),
      ready: [...document.querySelectorAll('#a-300 .bay-plate .bay-ready-no.is-on')].map((t) => t.textContent),
      fits: [...document.querySelectorAll('[data-bay-slot]')].every((t) => {
        const rule = t.ownerSVGElement?.querySelector('.bay-slot-rule');
        if (!rule) return true;
        const a = t.getBBox();
        const b = rule.getBBox();
        return a.x >= b.x - 0.5 && a.x + a.width <= b.x + b.width + 0.5;
      }),
    }));
    check('S7-slot', 'the stencil slot shows PLATFORM, upper-cased, in every bay view', slot.texts.length >= 2 && slot.texts.every((t) => t === 'LAB BIPED MK TWO'), slot.texts);
    check('S7-fit', 'the stencil text fits inside its slot', slot.fits, '');
    check('S7-ready', 'ticking 01 and 03 paints READY FOR 01 03', JSON.stringify([...new Set(slot.ready)]) === '["01","03"]', slot.ready);
    const filled = await page.getAttribute('a[data-mailto="rfi"]', 'href');
    check('mailto-teams-filled', 'the teams href tracks the fields exactly', filled === exp.teamsFilled, filled);
    await page.fill('#rfi-platform', 'X'.repeat(40));
    await page.waitForTimeout(300);
    const long = await page.evaluate(() => [...document.querySelectorAll('[data-bay-slot]')].map((t) => t.textContent.length));
    check('S7-max', 'the slot holds at most 24 characters', long.every((n) => n <= 24), long);
    await shot(page, s, 'desktop-a300-typed');
    await page.fill('#rfi-platform', 'Lab biped mk two');
    await page.locator('a[data-mailto="rfi"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, s, 'desktop-a300-form');
  }
  if (sponsorsDefault) {
    await page.locator('#kit-company').scrollIntoViewIfNeeded();
    await page.fill('#kit-company', 'QA Masonry');
    await page.fill('#kit-make', 'Mortar, ties');
    await page.check('#kit-bring-materials');
    await page.check('#kit-bring-expertise');
    await page.check('#kit-ch-05');
    await page.check('#kit-also-demos');
    await page.waitForTimeout(300);
    const filled = await page.getAttribute('a[data-mailto="kit"]', 'href');
    check('mailto-sponsors-filled', 'the sponsors href tracks the composer exactly', filled === exp.sponsorsFilled, filled);
    // hover a crop -> its keynotes underline
    const mat = page.locator('.material-button').nth(1);
    await mat.scrollIntoViewIfNeeded();
    await mat.hover();
    await page.waitForTimeout(300);
    const lit = await page.evaluate(() => [...document.querySelectorAll('.keynote.is-lit')].map((k) => k.id));
    check('keynotes-hover', 'hovering MAT 02 underlines keynotes 1 and 2', JSON.stringify(lit) === '["keynote-1","keynote-2"]', lit);
    await shot(page, s, 'desktop-a301-hover');
  }

  // ---- clipboard: granted
  const copyBtn = page.locator('.copy-button').first();
  if (await copyBtn.count()) {
    await copyBtn.scrollIntoViewIfNeeded();
    await copyBtn.click();
    await page.waitForTimeout(250);
    const t = (await copyBtn.textContent())?.trim();
    const live = await page.evaluate(() => document.getElementById('hrcg-live')?.textContent ?? '');
    check('copy-granted', 'Copy address -> Copied + "Address copied." announced', t === mods.conv.COPY.copied && live === mods.conv.COPY.announce, `${t} / live "${live}"`);
  } else check('copy-granted', 'Copy address button exists', false, 'missing');

  // ---- MOTION OFF at runtime (brief 4.3, 10.3)
  const motion = page.locator('.title-strip [data-strip-cell="motion"] button');
  if (await motion.count()) {
    await page.evaluate(() => {
      const el = document.getElementById('a-101') ?? document.getElementById('a-100');
      el?.scrollIntoView();
    });
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => ({
      sheet: document.querySelector('.title-strip [data-strip-cell="sheet"]')?.textContent ?? '',
      playing: [...document.querySelectorAll('video')].filter((v) => !v.paused).length,
    }));
    await motion.click();
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({
      rm: document.documentElement.classList.contains('rm'),
      playing: [...document.querySelectorAll('video')].filter((v) => !v.paused).length,
      sheet: document.querySelector('.title-strip [data-strip-cell="sheet"]')?.textContent ?? '',
      pressed: document.querySelector('.title-strip [data-strip-cell="motion"] button')?.getAttribute('aria-pressed'),
    }));
    check('motion-off', 'MOTION OFF pauses every video at once and adds .rm', after.rm && after.playing === 0, `before ${before.playing} playing; after ${after.playing}, rm ${after.rm}, aria-pressed ${after.pressed}`);
    await page.waitForTimeout(600);
    const later = await page.evaluate(() => document.querySelector('.title-strip [data-strip-cell="sheet"]')?.textContent ?? '');
    check('motion-anchor', 'MOTION OFF keeps the reader on the same sheet', later === before.sheet, `${before.sheet} -> ${later}`);
    await motion.click();
    await page.waitForTimeout(400);
  } else check('motion-off', 'MOTION toggle exists in the strip', false, 'missing');

  // ---- S4 focus walk
  const fw = await focusWalk(page);
  check('S4-focus', 'every focused element lies inside the unobscured viewport (Tab walk)', fw.strict.length === 0 && fw.entire.length === 0, { focused: fw.count, partlyHidden: fw.strict.slice(0, 15), entirelyHidden: fw.entire.slice(0, 15) });

  // ---- accessibility
  await walk(page, { step: 0.9, wait: 120, sample: false });
  const ax = await a11y(page, axePath);
  results.meta.axe = ax.engine;
  s.a11y = ax;
  check('a11y', `accessibility (${ax.engine}): 0 violations`, ax.violations.length === 0, ax.violations.slice(0, 25));

  // ---- the rendered DOM, for the lint suite
  s.renderedHtml = await page.content();
  await ctx.close();
  return s;
}

async function runDenied(browser, base, mods) {
  if (!results.suites.desktop) suite('desktop');
  const s = results.suites.desktop;
  const check = suiteCheck('desktop');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
    } catch {
      /* ignore */
    }
    document.execCommand = () => false;
  });
  const page = await ctx.newPage();
  attachConsole(page, s);
  await gotoReady(page, base);
  const btn = page.locator('#a-300 .copy-button').first();
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(250);
    const t = (await btn.textContent())?.trim();
    const sel = await page.evaluate(() => String(window.getSelection()));
    check('copy-denied', 'clipboard refused -> address selected + "Press Ctrl+C or ⌘C to copy"', t === mods.conv.COPY.denied && sel === mods.config.CONTACT_EMAIL, `${t} / selection "${sel}"`);
    await shot(page, s, 'desktop-copy-denied');
  }
  await ctx.close();
}

function suiteCheck(name) {
  const s = results.suites[name];
  return (id, title, pass, detail = '') => {
    const status = pass === null ? 'skip' : pass ? 'pass' : 'fail';
    if (status === 'fail') failures++;
    s.checks.push({ id, title, status, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    console.log(`  [${status.toUpperCase()}] ${name}/${id} ${title}${status !== 'pass' && detail ? ` :: ${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 300)}` : ''}`);
  };
}

async function runStrip(browser, base) {
  const { s, check } = suite('strip');
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 900 } });
  const page = await ctx.newPage();
  attachConsole(page, s);
  await gotoReady(page, base);
  for (const w of [1920, 1680, 1440, 1280, 1024, 768]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(500);
    // land on a challenge sheet so the SHEET cell carries its longest kind of value
    await page.evaluate(() => document.getElementById('a-102')?.scrollIntoView());
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const strip = document.querySelector('.title-strip');
      if (!strip || getComputedStyle(strip).display === 'none') return { missing: true };
      const shown = (el) => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      const cells = [...strip.querySelectorAll('[data-strip-cell]')];
      const visible = cells.filter(shown);
      const overflow = [];
      for (const c of visible) {
        const els = [c, ...c.querySelectorAll('*')].filter((e) => shown(e) && !e.closest('.sr-only'));
        for (const e of els) {
          if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline') {
            overflow.push(`${c.getAttribute('data-strip-cell')}: ${e.className || e.tagName} ${e.scrollWidth}>${e.clientWidth}`);
          }
        }
      }
      const textOf = (cell) => {
        const c = strip.querySelector(`[data-strip-cell="${cell}"]`);
        return shown(c) ? c.innerText.replace(/\s+/g, ' ').trim() : null;
      };
      const sr = strip.getBoundingClientRect();
      const lastCell = visible[visible.length - 1]?.getBoundingClientRect();
      return {
        cells: visible.map((c) => c.getAttribute('data-strip-cell')),
        overflow,
        project: textOf('project'),
        imagery: textOf('imagery'),
        sheet: textOf('sheet'),
        status: textOf('status'),
        teams: textOf('teams'),
        sponsors: textOf('sponsors'),
        height: Math.round(sr.height),
        rowOverflow: lastCell ? lastCell.right > sr.right + 1 : false,
        pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    if (r.missing) {
      check(`strip-${w}`, `title strip renders at ${w}`, false, 'missing or hidden');
      continue;
    }
    check(`cells-${w}`, `every visible cell fits (scrollWidth <= clientWidth) at ${w}`, r.overflow.length === 0 && !r.rowOverflow, r.overflow.concat(r.rowOverflow ? ['row overflows the strip'] : []));
    check(`height-${w}`, `strip is one row, 56 px, at ${w}`, r.height === 56, `${r.height}px`);
    const rules = [];
    if (w >= 1680 && !r.project) rules.push('PROJECT missing at >=1680');
    if (w < 1680 && r.project) rules.push('PROJECT shown below 1680');
    if (w >= 1024 && w < 1280 && r.imagery && !/^IMAGERY CONCEPT$/i.test(r.imagery)) rules.push(`IMAGERY should read CONCEPT, got "${r.imagery}"`);
    if (w < 1280 && r.sheet && /·/.test(r.sheet.replace(/^SHEET\s*/i, ''))) rules.push(`SHEET should be the number only, got "${r.sheet}"`);
    if (w >= 1280 && r.sheet && !/·/.test(r.sheet)) rules.push(`SHEET should carry the name, got "${r.sheet}"`);
    if (w < 1024 && r.imagery) rules.push('IMAGERY shown at 768-1023');
    if (w < 1024 && r.status && !/PLANNED · NYC · 2027/.test(r.status)) rules.push(`STATUS should be PLANNED · NYC · 2027, got "${r.status}"`);
    if (w < 1024 && r.teams && !/Teams →/.test(r.teams)) rules.push(`teams CTA should read Teams →, got "${r.teams}"`);
    if (w >= 1024 && r.teams && !/Bring the robot →/.test(r.teams)) rules.push(`teams CTA should read Bring the robot →, got "${r.teams}"`);
    check(`collapse-${w}`, `collapse rules (brief 3.1) at ${w}`, rules.length === 0, rules.length ? rules : r.cells.join(','));
    check(`S5-${w}`, `no horizontal page scroll at ${w}`, !r.pageScroll, '');
    await shot(page, s, `strip-${w}`, { clip: { x: 0, y: 900 - 90, width: w, height: 90 } });
  }
  // narrow widths: the page itself never scrolls sideways
  for (const w of [390, 360, 320]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(500);
    const sc = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    check(`S5-${w}`, `no horizontal page scroll at ${w}`, sc[0] <= sc[1], `${sc[0]} > ${sc[1]}`);
  }
  await ctx.close();
}

async function runPhone(browser, base, mods) {
  const { s, check } = suite('phone');
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  attachConsole(page, s);
  await gotoReady(page, base);
  await page.waitForTimeout(2500);
  await shot(page, s, 'phone-first-view');

  const bar = await page.evaluate(() => {
    const b = document.querySelector('.phone-bar');
    const strip = document.querySelector('.title-strip');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return {
      shown: getComputedStyle(b).display !== 'none' && r.height > 0,
      inView: r.bottom <= innerHeight + 0.5 && r.top >= innerHeight - 140,
      text: b.innerText.replace(/\s+/g, ' '),
      buttons: [...b.querySelectorAll('a, button')].map((x) => Math.round(x.getBoundingClientRect().height)),
      strip: strip ? getComputedStyle(strip).display : null,
    };
  });
  check('P1-bar', 'phone bar visible with PLANNED · NYC · 2027 and both buttons >= 44 px', !!bar && bar.shown && bar.inView && /PLANNED · NYC · 2027/.test(bar.text) && bar.buttons.length >= 3 && bar.buttons.every((h) => h >= 44), bar);
  check('P1-strip', 'the desktop strip is hidden on the phone', bar?.strip === 'none', bar?.strip);

  // P2: a vertical touch swipe on the hero scrolls the page
  const cdp = await ctx.newCDPSession(page);
  const y0 = await page.evaluate(() => scrollY);
  // a real touch sequence (Input.synthesizeScrollGesture does not scroll in this headless build)
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600 }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - (350 * i) / 12 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } catch (e) {
    s.console.push(`dispatchTouchEvent: ${e.message}`);
  }
  await page.waitForTimeout(800);
  const y1 = await page.evaluate(() => scrollY);
  check('P2-swipe', 'a vertical touch swipe on the hero scrolls the page', y1 > y0 + 50, `${y0} -> ${y1}`);

  const walked = await walk(page, { step: 0.7, wait: 450 });
  check('P-S3', '<=2 videos playing (phone)', walked.maxPlaying <= 2, `max ${walked.maxPlaying}`);

  const facts = await page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const small = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    const seen = new Set();
    while ((n = tw.nextNode())) {
      const el = n.parentElement;
      if (!n.textContent.trim() || !el || seen.has(el) || el.closest('.sr-only, svg, dialog:not([open]), [aria-hidden="true"]')) continue;
      seen.add(el);
      if (!vis(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 10) small.push(`${fs}px: ${el.textContent.trim().slice(0, 40)}`);
    }
    const h2over = [...document.querySelectorAll('h2')].filter((h) => h.scrollWidth > h.clientWidth + 1).map((h) => `${h.textContent.slice(0, 30)} ${h.scrollWidth}>${h.clientWidth}`);
    const vtover = [...document.querySelectorAll('.view-title-text, .view-title')].filter((e) => e.scrollWidth > e.clientWidth + 1 || getComputedStyle(e).textOverflow === 'ellipsis').map((e) => e.textContent.slice(0, 40));
    const inputs = [...document.querySelectorAll('input:not([type=checkbox]):not([type=hidden]), textarea, select')].filter(vis).map((i) => ({ id: i.id, fs: parseFloat(getComputedStyle(i).fontSize) }));
    const chips = [...document.querySelectorAll('.chip')].filter(vis).map((c) => Math.round(c.getBoundingClientRect().height));
    return {
      small: small.slice(0, 20),
      h2over,
      vtover,
      inputs,
      chips,
      scroll: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    };
  });
  check('P8-text', 'no text smaller than 10 px', facts.small.length === 0, facts.small);
  check('P8-h2', 'sheet H2s never overflow at 390', facts.h2over.length === 0, facts.h2over);
  check('P8-vt', 'view titles wrap and are never truncated', facts.vtover.length === 0, facts.vtover);
  check('P6-inputs', 'inputs are >= 16 px (no zoom)', facts.inputs.length > 0 && facts.inputs.every((i) => i.fs >= 16), facts.inputs);
  check('P6-chips', 'chips are >= 44 px tall', facts.chips.length > 0 && facts.chips.every((h) => h >= 44), facts.chips);
  check('S5-390', 'no horizontal page scroll at 390', facts.scroll[0] <= facts.scroll[1], facts.scroll);
  const pinned = await page.evaluate(pins);
  const badPins = pinned.filter((p) => !['A-000', 'A-100', 'A-200', 'cover'].includes(p.sheet));
  check('P4-pins', 'only the hero and A-200 pin', badPins.length === 0, pinned);

  await sheetShots(page, s, 'phone');

  // P6: the mini-slot stays visible with the keyboard up
  const exp = expectedMail(mods);
  const href = await page.getAttribute('a[data-mailto="rfi"]', 'href').catch(() => null);
  check('P6-mailto', 'the teams mailto href is exact on the phone', href === exp.teamsDefault, href ?? 'missing');
  if (href) {
    await page.locator('#rfi-platform').scrollIntoViewIfNeeded();
    await page.tap('#rfi-platform');
    await page.setViewportSize({ width: 390, height: 470 }); // ~374 px software keyboard
    await page.waitForTimeout(400);
    await page.locator('#rfi-platform').scrollIntoViewIfNeeded();
    await page.keyboard.type('Lab biped mk two');
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const mini = document.querySelector('.mini-slot');
      const input = document.getElementById('rfi-platform');
      const header = document.querySelector('.sheet-header')?.getBoundingClientRect();
      if (!mini || !input) return null;
      const r = mini.getBoundingClientRect();
      const i = input.getBoundingClientRect();
      return {
        mini: [Math.round(r.top), Math.round(r.bottom)],
        input: [Math.round(i.top), Math.round(i.bottom)],
        vh: innerHeight,
        headerBottom: header ? Math.round(header.bottom) : 0,
        text: mini.querySelector('[data-bay-slot], .bay-slot-text')?.textContent ?? '',
        shown: getComputedStyle(mini).display !== 'none',
      };
    });
    check('P6-minislot', 'the 64 px mini-slot stays visible above the field with the keyboard up, and updates', !!m && m.shown && m.mini[0] >= m.headerBottom - 1 && m.mini[1] <= m.vh && m.mini[1] <= m.input[0] + 1 && m.input[1] <= m.vh && m.text === 'LAB BIPED MK TWO', m);
    await shot(page, s, 'phone-keyboard-minislot');
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await ctx.close();
}

async function runRm(browser, base) {
  const { s, check } = suite('rm');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  attachConsole(page, s);
  let firstPaint = null;
  page.on('domcontentloaded', async () => {
    try {
      firstPaint = await page.evaluate(() => document.documentElement.className);
    } catch {
      /* ignore */
    }
  });
  await gotoReady(page, base);
  check('rm-class', 'html.rm from first paint (head script)', /\brm\b/.test(firstPaint ?? '') || (await page.evaluate(() => document.documentElement.classList.contains('rm'))), firstPaint ?? '');
  await page.waitForTimeout(2000);
  await shot(page, s, 'rm-first-view');
  const walked = await walk(page, { step: 0.7, wait: 500 });
  check('rm-autoplay', 'no autoplay under reduced motion', walked.maxPlaying === 0, `max ${walked.maxPlaying} playing`);
  const st = await page.evaluate(() => ({
    lenis: document.documentElement.classList.contains('lenis'),
    viewTitles: document.querySelectorAll('.view-title').length,
    mailtos: [...document.querySelectorAll('a[data-mailto]')].map((a) => a.getAttribute('data-mailto')),
    printHidden: [...document.querySelectorAll('.print-in')].filter((e) => Number(getComputedStyle(e).opacity) < 0.1).length,
    playButtons: [...document.querySelectorAll('.loopvideo-play')].filter((b) => getComputedStyle(b).display !== 'none').length,
    videos: document.querySelectorAll('video').length,
  }));
  check('rm-lenis', 'no Lenis under reduced motion', !st.lenis, '');
  check('rm-conversions', 'both conversions present', st.mailtos.includes('rfi') && st.mailtos.includes('kit'), st.mailtos);
  check('rm-print', 'all print-in text visible', st.printHidden === 0, `${st.printHidden} hidden`);
  check('rm-play', '▶ buttons offered over posters', st.videos === 0 || st.playButtons > 0, `${st.playButtons} of ${st.videos}`);
  s.viewTitles = st.viewTitles;
  const pinned = await page.evaluate(pins);
  check('rm-pins', 'no pinned stages (end-state compositions in normal flow)', pinned.length === 0, pinned);
  const slider = page.locator('[role="slider"]').first();
  if (await slider.count()) {
    await slider.scrollIntoViewIfNeeded();
    const v0 = await slider.getAttribute('aria-valuenow');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const v1 = await slider.getAttribute('aria-valuenow');
    check('rm-slider', 'the section slider still works on user input', v0 !== v1, `${v0} -> ${v1}`);
  } else check('rm-slider', 'the section slider exists', null, 'no [role=slider] on the page yet');
  await sheetShots(page, s, 'rm');
  await ctx.close();
}

async function runNoGl(pw, base) {
  const { s, check } = suite('nogl');
  for (const [label, launchArgs, url] of [
    ['gl0', [], `${base}${base.includes('?') ? '&' : '?'}gl=0`],
    ['disable-webgl', ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'], base],
  ]) {
    const browser = await pw.chromium.launch({ args: launchArgs });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const before = s.console.length;
    attachConsole(page, s);
    await gotoReady(page, url);
    await page.waitForTimeout(4000);
    await shot(page, s, `nogl-${label}-first-view`);
    await walk(page, { step: 0.9, wait: 250, sample: false });
    const facts = await page.evaluate(pageFacts);
    const errs = s.console.slice(before).filter((l) => /^(console\.error|pageerror)/.test(l));
    check(`${label}-errors`, `${label}: no console errors`, errs.length === 0, errs.slice(0, 10));
    check(`${label}-complete`, `${label}: all sheets render`, facts.sheets.length >= 11, facts.sheets.length);
    await page.evaluate(() => document.getElementById('a-105')?.scrollIntoView());
    await page.waitForTimeout(1500);
    await shot(page, s, `nogl-${label}-a-105`);
    await ctx.close();
    await browser.close();
  }
}

async function runNoJs(browser, buildUrl, mods) {
  const { s, check } = suite('nojs');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  attachConsole(page, s);
  await gotoReady(page, buildUrl, { js: false });
  await shot(page, s, 'nojs-first-view');
  const exp = expectedMail(mods);
  const r = await page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    return {
      cls: document.documentElement.className,
      text: document.body.textContent.replace(/\s+/g, ' '),
      videos: [...document.querySelectorAll('video')].map((v) => ({ poster: !!v.getAttribute('poster'), controls: v.hasAttribute('controls') })),
      ctas: [...document.querySelectorAll('.title-strip a.strip-cta, .phone-bar a')].map((a) => a.getAttribute('href')),
      indexLink: document.querySelector('.sheet-header a[href="#index"]') !== null,
      indexTarget: document.getElementById('index')?.tagName ?? null,
      rfi: document.querySelector('a[data-mailto="rfi"]')?.getAttribute('href') ?? null,
      kit: document.querySelector('a[data-mailto="kit"]')?.getAttribute('href') ?? null,
      copyShown: [...document.querySelectorAll('.copy-button')].filter(vis).length,
      jsOnlyShown: [...document.querySelectorAll('.js-only')].filter(vis).length,
      printHidden: [...document.querySelectorAll('.print-in')].filter((e) => Number(getComputedStyle(e).opacity) < 0.1).length,
      emptySheets: [...document.querySelectorAll('[data-sheet]')]
        .filter((el) => (el.textContent.trim().length === 0 ? el.closest('[data-stage]') ?? el : el).textContent.trim().length < 20)
        .map((el) => el.id),
      placeholders: [...document.querySelectorAll('.sheet-placeholder')].map((el) => el.closest('[data-sheet]')?.id ?? '?'),
    };
  });
  check('nojs-class', 'html stays .no-js', /\bno-js\b/.test(r.cls), r.cls);
  const missing = requiredCopy(mods).filter((t) => !r.text.includes(t));
  check('nojs-copy', 'the prerendered page carries all copy (cross-section of every copy file)', missing.length === 0, missing.slice(0, 30));
  check('nojs-video', 'every video has a poster and controls', r.videos.every((v) => v.poster && v.controls), `${r.videos.length} videos; ${r.videos.filter((v) => !v.poster || !v.controls).length} without`);
  check('nojs-anchors', 'strip CTAs are plain anchors to #a-300 / #a-301', r.ctas.includes('#a-300') && r.ctas.includes('#a-301'), r.ctas);
  check('nojs-index', 'INDEX is a plain #index link and <nav id="index"> exists', r.indexLink && r.indexTarget === 'NAV', `${r.indexLink} / ${r.indexTarget}`);
  check('nojs-mailto', 'form buttons are mailto links with the exact default bodies', r.rfi === exp.teamsDefault && r.kit === exp.sponsorsDefault, { rfi: r.rfi === exp.teamsDefault, kit: r.kit === exp.sponsorsDefault });
  check('nojs-copybtn', 'Copy address is hidden', r.copyShown === 0, `${r.copyShown} shown`);
  check('nojs-jsonly', 'nothing js-only is shown', r.jsOnlyShown === 0, `${r.jsOnlyShown} shown`);
  check('nojs-print', 'no text is hidden waiting for JS', r.printHidden === 0, `${r.printHidden} hidden`);
  check('nojs-sheets', 'no sheet is empty or a placeholder', r.emptySheets.length === 0 && r.placeholders.length === 0, { empty: r.emptySheets, placeholders: r.placeholders });
  await sheetShots(page, s, 'nojs', ['a-000', 'a-300', 'a-301', 'a-900']);
  s.prerenderedHtml = await page.content();
  await ctx.close();
}

function runLint(mods, buildDir) {
  const { s, check } = suite('lint');
  const allow = JSON.parse(readFileSync(resolve(ROOT, 'src/content/lint-allow.json'), 'utf8')).allow;
  const dom = results.suites.desktop?.renderedHtml;
  if (dom) {
    const v = mods.lint.lintHtml(dom, 'rendered DOM (desktop, after hydration)', allow);
    s.rendered = v;
    check('lint-dom', 'copy lint on the rendered DOM (incl. runtime-fetched copy): 0 violations', v.length === 0, v.map((x) => `${x.message} :: "${x.text.slice(0, 160)}"`).slice(0, 20));
  } else check('lint-dom', 'copy lint on the rendered DOM', null, 'desktop suite not run');
  const built = buildDir && existsSync(join(buildDir, 'index.html')) ? readFileSync(join(buildDir, 'index.html'), 'utf8') : null;
  if (built) {
    const v = mods.lint.lintHtml(built, 'prerendered index.html', allow);
    s.prerendered = v;
    check('lint-html', 'copy lint on the prerendered HTML: 0 violations', v.length === 0, v.map((x) => `${x.message} :: "${x.text.slice(0, 160)}"`).slice(0, 20));
  } else check('lint-html', 'copy lint on the prerendered HTML', null, 'no build');
}

// ---------------------------------------------------------------------------------------- report

function writeReport() {
  for (const s of Object.values(results.suites)) {
    delete s.renderedHtml;
    delete s.prerenderedHtml;
  }
  results.meta.finished = new Date().toISOString();
  results.meta.failures = failures;
  writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  const lines = [
    '# QA results',
    '',
    `Generated by \`scripts/qa.mjs\` on ${results.meta.finished}. Target: ${results.meta.url}${results.meta.build ? ` (build ${results.meta.build})` : ''}.`,
    `Accessibility engine: ${results.meta.axe ?? 'not run'}. Failures: **${failures}**.`,
    '',
    'Headless Chromium on this box renders WebGL in SwiftShader at 2-5 fps: these checks judge layout, states, copy and determinism, never smoothness (smoothness, real devices and mail clients are in `qa/HANDOFF.md`).',
    '',
  ];
  for (const n of results.meta.notes) lines.push(`> ${n}`, '');
  for (const [name, s] of Object.entries(results.suites)) {
    const pass = s.checks.filter((c) => c.status === 'pass').length;
    const fail = s.checks.filter((c) => c.status === 'fail').length;
    lines.push(`## ${name} (${pass} pass, ${fail} fail)`, '', '| | Check | Detail |', '|---|---|---|');
    for (const c of s.checks) {
      const mark = c.status === 'pass' ? 'PASS' : c.status === 'fail' ? '**FAIL**' : 'skip';
      const d = c.status === 'pass' ? '' : String(c.detail).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 600);
      lines.push(`| ${mark} | ${c.id}: ${c.title} | ${d} |`);
    }
    const errs = s.console.filter((l) => /^(console\.error|pageerror|HTTP 5)/.test(l));
    if (errs.length) {
      lines.push('', `Console (${errs.length}):`, '');
      for (const e of [...new Set(errs)].slice(0, 15)) lines.push(`- \`${e.slice(0, 240).replace(/`/g, "'")}\``);
    }
    if (s.shots.length) lines.push('', `Screenshots: ${s.shots.map((p) => `\`${p}\``).join(', ')}`);
    lines.push('');
  }
  writeFileSync(join(OUT, 'RESULTS.md'), lines.join('\n'));
}

// ---------------------------------------------------------------------------------------- main

async function main() {
  const log = (m) => console.log(`[qa] ${m}`);
  const pw = loadPlaywright();
  const axePath = findAxe();
  if (!axePath) results.meta.notes.push('axe-core is not installed in this repo or globally; the manual accessibility checks listed in the header of scripts/qa.mjs ran instead (requested from A1: add axe-core as a devDependency).');
  log('loading site modules (lint rules, mailto builder, copy) through Vite SSR');
  const mods = await loadSiteModules();

  let buildDir = null;
  let base = URL_ARG ? String(URL_ARG) : null;
  let http = null;
  const needBuild = !base || want('nojs') || want('lint');
  if (needBuild) {
    const b = ensureBuild(log);
    if (b.error) {
      results.meta.notes.push(`The production build failed, so the JS suites ran against the shared dev server (${DEV_URL}) and the no-JS suite could not run:\n\n\`\`\`\n${b.error.slice(-2500)}\n\`\`\``);
      suite('build').check('build', 'vite build + prerender (incl. the prerender copy lint) succeeds', false, b.error.slice(-2500));
      log(b.error);
      if (!base) base = DEV_URL;
    } else {
      suite('build').check('build', 'vite build + prerender (incl. the prerender copy lint) succeeds', true);
      buildDir = typeof b === 'string' ? b : b.dir;
      results.meta.build = buildDir;
      http = await serve(buildDir);
      if (!base) base = http.url;
    }
  }
  if (!base) throw new Error('nothing to test: the build failed and no --url was given');
  results.meta.url = base;
  log(`target ${base}${buildDir ? ` · build ${buildDir}` : ''} · axe ${axePath ?? 'none (manual checks)'}`);

  const browser = await pw.chromium.launch();
  const run = async (name, fn) => {
    if (!want(name)) return;
    log(`suite ${name}`);
    const t = Date.now();
    try {
      await fn();
    } catch (e) {
      const s = results.suites[name] ?? suite(name).s;
      s.checks.push({ id: 'crash', title: 'suite ran to completion', status: 'fail', detail: String(e?.stack ?? e).slice(0, 1500) });
      failures++;
      log(`suite ${name} crashed: ${e?.message}`);
    }
    log(`suite ${name} done in ${Math.round((Date.now() - t) / 1000)} s`);
  };
  await run('desktop', async () => {
    await runDesktop(browser, base, mods, axePath);
    await runDenied(browser, base, mods);
  });
  await run('strip', () => runStrip(browser, base));
  await run('phone', () => runPhone(browser, base, mods));
  await run('rm', () => runRm(browser, base));
  await run('nogl', () => runNoGl(pw, base));
  if (want('nojs')) {
    if (http) await run('nojs', () => runNoJs(browser, http.url, mods));
    else suite('nojs').check('nojs', 'no-JS suite', null, 'needs a prerendered build (--build)');
  }
  if (want('lint')) runLint(mods, buildDir);
  await browser.close();
  http?.server.close();
  writeReport();
  log(`wrote ${relative(ROOT, join(OUT, 'results.json'))}, ${relative(ROOT, join(OUT, 'RESULTS.md'))}; ${failures} failure(s)`);
  if (failures && !SOFT) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  try {
    results.meta.notes.push(`qa.mjs crashed: ${String(e?.stack ?? e).slice(0, 1500)}`);
    writeReport();
  } catch {
    /* ignore */
  }
  process.exit(2);
});
