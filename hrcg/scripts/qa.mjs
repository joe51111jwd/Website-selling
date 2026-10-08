#!/usr/bin/env node
// HRCG QA suite (brief 9.4 A6, 10.1-10.4). Owner: A6.
//
//   scripts/cpuq node scripts/qa.mjs                      build to a temp dir, serve it, run every suite
//   scripts/cpuq node scripts/qa.mjs --build <dir>        serve an existing build (skips the build)
//   scripts/cpuq node scripts/qa.mjs --url http://127.0.0.1:5300/   test a running server (no-JS suite
//                                                         then needs --build, the dev server is not prerendered)
//   --only build,desktop,strip,phone,rm,nogl,fixes,nojs,lint   run some suites (build = the production build + its F-052 checks only)
//   --out qa                                              results + screenshots (default qa/)
//
// Always run it through scripts/cpuq (one heavy job at a time on this box) and never call cpuq from
// inside it (the lock is already held). Headless Chromium here renders WebGL in SwiftShader at
// 2-5 fps: these checks judge layout, states, copy and determinism, never smoothness.
//
// Writes: <out>/results.json (every check), <out>/RESULTS.md (summary), <out>/shots/*.jpg.
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
//   fixes    regression gates for qa/review/FIXLIST-1.md (F-053): one check per item, keyed by its
//            F-id (H-id for director decisions); visual-only items are listed as skips with their
//            retake. --dev <url> names the dev server for the prod-vs-dev landing diff (F-013).
//   build    (always, with a build) the production checks of F-052: no jsxDEV / dev runtime, no
//            sandbox chunks, exactly one stylesheet.
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
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// The environment this script was started with, before anything in it changes process.env: Vite's
// createServer (loadSiteModules) sets NODE_ENV=development, and a build that inherits that is a
// development build (jsxDEV, sandbox chunks, chunk CSS linked ahead of index-*.css). FIXLIST-1 F-052.
const BASE_ENV = { ...process.env };

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

/** The env of a plain `vite build` from a clean shell, forced to production (F-052). */
function buildEnv() {
  const env = { ...BASE_ENV, NODE_ENV: 'production', HRCG_PRERENDER_LENIENT: '1', VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' };
  delete env.HRCG_PRERENDER_CHILD; // set by loadSiteModules for its own SSR server only
  return env;
}

function ensureBuild(log) {
  if (BUILD && existsSync(join(BUILD, 'index.html'))) return { dir: BUILD, reused: true };
  const dir = BUILD ?? join(tmpdir(), 'hrcg-qa-build');
  log(`building into ${dir} (production vite build + prerender; NODE_ENV=production, HRCG_PRERENDER_LENIENT=1)`);
  const r = spawnSync('npx', ['vite', 'build', '--outDir', dir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: ROOT,
    env: buildEnv(),
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

/**
 * Is this a real production build (F-052)? A development-mode build ships React's dev runtime
 * (jsxDEV, react-stack-bottom-frame), the dev-only sandbox chunks, and links chunk stylesheets
 * ahead of index-*.css, which flips the cascade (FIXLIST-1 §0, X-1). Runs on every build QA uses,
 * fresh or reused with --build.
 */
function productionFacts(dir) {
  const assets = join(dir, 'assets');
  const files = existsSync(assets) ? readdirSync(assets) : [];
  const devRuntime = [];
  for (const f of files) {
    if (!/\.(m?js)$/.test(f)) continue;
    const src = readFileSync(join(assets, f), 'utf8');
    if (/\bjsxDEV\b|react-stack-bottom-frame/.test(src)) devRuntime.push(f);
  }
  const sandboxes = files.filter((f) => /sandbox/i.test(f) || /^jsx-dev-runtime-/.test(f));
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const stylesheets = [...html.matchAll(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi)].map(
    (m) => /\bhref=["']?([^"' >]+)/i.exec(m[0])?.[1] ?? m[0],
  );
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  return { devRuntime, sandboxes, stylesheets, cssFiles };
}

function checkProduction(dir, check) {
  const p = productionFacts(dir);
  check('prod-runtime', 'production React runtime: no asset contains jsxDEV or react-stack-bottom-frame', p.devRuntime.length === 0, p.devRuntime);
  check('prod-sandboxes', 'no dev-only chunks (sandboxes, MarksSandbox, chromeSandbox, jsx-dev-runtime)', p.sandboxes.length === 0, p.sandboxes);
  check('prod-onecss', 'index.html links exactly one stylesheet (cascade order independent of JS chunking)', p.stylesheets.length === 1, { linked: p.stylesheets, cssFiles: p.cssFiles });
  return p;
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
  // JPEG keeps qa/ small enough to commit after every run (layout review, not pixel diffs)
  const file = join(SHOTS, `${name}.jpg`);
  try {
    await page.screenshot({ path: file, type: 'jpeg', quality: 82, ...opts });
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
    check('motion-off', 'MOTION OFF pauses every video at once, adds .rm and reports aria-pressed="false" (F-019)', after.rm && after.playing === 0 && after.pressed === 'false', `before ${before.playing} playing; after ${after.playing}, rm ${after.rm}, aria-pressed ${after.pressed}`);
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
    // the field aligned to the top of the scrollport, as a browser does on focus at worst (F-054)
    await page.evaluate(() => document.getElementById('rfi-platform').scrollIntoView({ block: 'start' }));
    await page.keyboard.type('Lab biped mk two');
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const mini = document.querySelector('.mini-slot');
      const input = document.getElementById('rfi-platform');
      const header = document.querySelector('.sheet-header')?.getBoundingClientRect();
      const bar = document.querySelector('.phone-bar');
      if (!mini || !input) return null;
      const r = mini.getBoundingClientRect();
      const i = input.getBoundingClientRect();
      const b = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
      return {
        mini: [Math.round(r.top), Math.round(r.bottom)],
        input: [Math.round(i.top), Math.round(i.bottom)],
        bar: b ? [Math.round(b.top), Math.round(b.bottom)] : null,
        vh: innerHeight,
        headerBottom: header ? Math.round(header.bottom) : 0,
        text: mini.querySelector('[data-bay-slot], .bay-slot-text')?.textContent ?? '',
        shown: getComputedStyle(mini).display !== 'none',
      };
    });
    check('P6-minislot', 'keyboard up, field aligned to the top: the 64 px mini-slot stays visible and updates, and the field sits below it and clear of the phone bar (F-054)', !!m && m.shown && m.mini[0] >= m.headerBottom - 1 && m.mini[1] <= m.vh && m.mini[1] <= m.input[0] + 1 && m.input[1] <= m.vh && (!m.bar || m.input[1] <= m.bar[0] || m.input[0] >= m.bar[1]) && m.text === 'LAB BIPED MK TWO', m);
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
      // a poster is either a real poster attribute or, since F-002 (posters no longer fetched eagerly), the
      // visible <picture class="loopvideo-poster"> beside the video
      videos: [...document.querySelectorAll('video')].map((v) => ({
        poster: (!!v.getAttribute('poster') && !/^data:/.test(v.getAttribute('poster'))) || !!v.parentElement?.querySelector(':scope > .loopvideo-poster'),
        controls: v.hasAttribute('controls'),
      })),
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
  check('nojs-video', 'every video has a poster (attribute or .loopvideo-poster sibling) and controls', r.videos.every((v) => v.poster && v.controls), `${r.videos.length} videos; ${r.videos.filter((v) => !v.poster || !v.controls).length} without`);
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

// ---------------------------------------------------------------------------------------- FIXLIST-1 gates (F-053)
//
// Suite `fixes`: one regression gate per item of qa/review/FIXLIST-1.md, keyed by its F-id (H-id for
// the director decisions). Each gate measures the item's pass condition on the production build, so
// it fails before the fix lands and passes after. Items whose pass condition is a visual judgement
// (tearing, timing, footage) are listed as `skip` with the retake to look at. Run alone with
// `--only fixes`; `--dev <url>` (default HRCG_DEV_URL or :5300) is the dev server for the prod-vs-dev
// landing diff (F-013), skipped when it does not answer.

const PHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FIX_SHEETS = ['a-101', 'a-102', 'a-103', 'a-104', 'a-105', 'a-200', 'a-300', 'a-301', 'a-900'];

/** Page helpers, installed on every page of the fixes suite (window.__qa). Serialized: no closures. */
function qaHelpers() {
  const opacityChain = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= Number(cs.opacity);
    }
    return o;
  };
  const vis = (el) => {
    if (!el) return false;
    if (opacityChain(el) < 0.1) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const band = () => {
    const root = getComputedStyle(document.documentElement);
    const border = parseFloat(root.getPropertyValue('--border')) || 0;
    const h = document.querySelector('.sheet-header');
    const bars = [...document.querySelectorAll('.title-strip, .phone-bar')]
      .filter((e) => getComputedStyle(e).display !== 'none')
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.height > 0);
    return {
      top: h ? Math.max(h.getBoundingClientRect().bottom, border) : border,
      bottom: bars.length ? Math.min(...bars.map((r) => r.top)) : innerHeight - border,
    };
  };
  const landY = (id) => {
    const e = document.getElementById(id);
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return Math.max(0, Math.round(e.getBoundingClientRect().top + scrollY - pad));
  };
  const go = (id, vh = 0) => {
    const y = (id === 'top' ? 0 : landY(id)) + Math.round((vh * innerHeight) / 100);
    window.scrollTo(0, y);
    return y;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const inside = (r, b) => r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
  const hits = (el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return { ok: false, hit: 'off-screen' };
    const h = document.elementFromPoint(x, y);
    const viaLabel = !!h && !!el.labels && [...el.labels].some((l) => l === h || l.contains(h));
    const ok = !!h && (h === el || el.contains(h) || viaLabel || (h.tagName === 'LABEL' && h.control === el));
    return { ok, hit: h ? `${h.tagName}.${String(h.className?.baseVal ?? h.className ?? '').split(' ')[0]}` : null };
  };
  const alpha = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return 0;
    const p = m[1].split(/[ ,/]+/).filter(Boolean);
    return p.length > 3 ? Number(p[3]) : 1;
  };
  const name = (el) =>
    `${el.tagName}${el.id ? `#${el.id}` : ''}.${String(el.className?.baseVal ?? el.className ?? '').trim().split(/\s+/)[0]}|${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}`;
  const sheetAt = () => {
    const v = (document.querySelector('.title-strip [data-strip-cell="sheet"]') ?? document.querySelector('.phone-status'))?.textContent ?? '';
    return /A-\d{3}/.exec(v)?.[0] ?? null;
  };
  const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  /** Decode two PNG data URLs and count pixels whose RGB differ by more than `thr` (sum of channels). */
  const pixelDiff = async (a, b, thr = 60) => {
    const load = async (u) => {
      const img = await createImageBitmap(await (await fetch(u)).blob());
      const c = new OffscreenCanvas(img.width, img.height);
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, img.width, img.height).data;
    };
    const [p, q] = await Promise.all([load(a), load(b)]);
    let n = 0;
    for (let i = 0; i < Math.min(p.length, q.length); i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > thr) n++;
    return n;
  };
  /** WCAG contrast of text over its real background: glyph pixels (with text) against the same pixels with the fill removed (shadow kept). */
  const glyphContrast = async (withText, without, need) => {
    const load = async (u) => {
      const img = await createImageBitmap(await (await fetch(u)).blob());
      const c = new OffscreenCanvas(img.width, img.height);
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, img.width, img.height).data;
    };
    const [w, b] = await Promise.all([load(withText), load(without)]);
    const lin = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const L = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
    const diffs = [];
    for (let i = 0; i < Math.min(w.length, b.length); i += 4) {
      const d = Math.abs(w[i] - b[i]) + Math.abs(w[i + 1] - b[i + 1]) + Math.abs(w[i + 2] - b[i + 2]);
      if (d > 60) diffs.push([i, d]);
    }
    if (diffs.length < 10) return { glyphPx: diffs.length, pass: null };
    const sorted = diffs.map((x) => x[1]).sort((x, y) => x - y);
    const thr = sorted[Math.floor(sorted.length * 0.7)];
    let n = 0;
    let lt = 0;
    for (const [i, d] of diffs) if (d >= thr) { lt += L(w, i); n++; }
    lt /= Math.max(1, n);
    let ok = 0;
    for (const [i] of diffs) {
      const lb = L(b, i);
      const cr = (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
      if (cr >= need) ok++;
    }
    return { glyphPx: diffs.length, pass: ok / diffs.length };
  };
  window.__qa = { opacityChain, vis, shown, band, landY, go, rect, inside, hits, alpha, name, sheetAt, overlap, pixelDiff, glyphContrast };
}

/** axe with the WCAG tags plus best-practice; returns every violation id and the incomplete counts. */
async function axeState(page, axePath) {
  if (!axePath) return null;
  if (!(await page.evaluate(() => typeof window.axe !== 'undefined'))) await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    });
    return {
      violations: res.violations.map((v) => ({ rule: v.id, count: v.nodes.length, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) })),
      incomplete: Object.fromEntries(res.incomplete.map((v) => [v.id, v.nodes.length])),
    };
  });
}

async function newPage(browser, opts, base, { wait = 4000, init = [] } = {}) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(qaHelpers);
  for (const f of init) await ctx.addInitScript(f);
  const page = await ctx.newPage();
  await gotoReady(page, `${base}${base.includes('?') ? '&' : '?'}heroperf=0`);
  await page.waitForTimeout(wait);
  return { ctx, page };
}

const desktopOpts = (w = 1440, h = 900, extra = {}) => ({ viewport: { width: w, height: h }, reducedMotion: 'no-preference', ...extra });
const phoneOpts = (w = 390, h = 844, extra = {}) => ({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: PHONE_UA, ...extra });

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function runFixes(pw, browser, base, mods, axePath, buildDir) {
  const { s, check } = suite('fixes');
  const step = async (id, fn) => {
    try {
      await fn();
    } catch (e) {
      check(id, `${id}: the gate ran`, false, String(e?.stack ?? e).slice(0, 700));
    }
  };
  const manual = (id, what, retake) => check(id, `${what} (visual: judge ${retake})`, null, `manual retake: ${retake}`);

  // ------------------------------------------------------------------ static (files and build)
  await step('F-013', async () => {
    // the cascade must not depend on how JS is chunked: a development-mode build also links one stylesheet
    const dir = join(tmpdir(), 'hrcg-qa-devbuild');
    const env = { ...buildEnv(), NODE_ENV: 'development', HRCG_SKIP_PRERENDER: '1' };
    const r = spawnSync('npx', ['vite', 'build', '--outDir', dir, '--emptyOutDir', '--logLevel', 'warn'], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) return check('F-013-devcss', 'development-mode build links exactly one stylesheet', false, `dev build failed: ${(r.stderr ?? '').slice(-600)}`);
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    const links = [...html.matchAll(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi)].length;
    check('F-013-devcss', 'development-mode build (NODE_ENV=development) links exactly one stylesheet, like production', links === 1, `${links} stylesheet links`);
  });
  await step('F-014', async () => {
    if (!buildDir) return check('F-014-entry', 'entry chunk <= 110 kB gz', null, 'no build');
    const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
    const src = /<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/i.exec(html)?.[1];
    if (!src) return check('F-014-entry', 'entry chunk <= 110 kB gz', false, 'no module script in index.html');
    const buf = readFileSync(resolve(buildDir, src.replace(/^\.?\//, '')));
    const gz = gzipSync(buf, { level: 9 }).length;
    check('F-014-entry', 'shell entry chunk <= 110 kB gzipped (brief 8.6)', gz <= 110 * 1024, `${src}: ${(buf.length / 1024).toFixed(1)} kB raw, ${(gz / 1024).toFixed(1)} kB gz`);
  });
  await step('A5-manifest', async () => {
    const man = JSON.parse(readFileSync(resolve(ROOT, 'src/media/manifest.json'), 'utf8'));
    const list = Array.isArray(man.media) ? man.media : Object.values(man.media ?? {});
    const byId = Object.fromEntries(list.map((e) => [e.id, e]));
    const withBytes = list.filter((e) => JSON.stringify(e).includes('"bytes"')).map((e) => e.id);
    check('F-045-slim', 'runtime manifest carries no bytes/debug fields (they live in pipeline/out/manifest-qa.json)', withBytes.length === 0, withBytes.slice(0, 12));
    const want = [[0.4, 0.528], [0.735, 0.528]];
    const bad = ['plan-b44-260', 'plan-b44', 'plan-b44-m'].filter((id) => {
      const le = byId[id]?.lineEndpoints;
      return !le || le.length !== 2 || le.some((p, i) => Math.abs(p[0] - want[i][0]) > 0.012 || Math.abs(p[1] - want[i][1]) > 0.012);
    });
    check('F-051-line', 'b44 lineEndpoints sit on the stripe core, about [[0.400, 0.528], [0.735, 0.528]]', bad.length === 0, bad.map((id) => `${id}: ${JSON.stringify(byId[id]?.lineEndpoints ?? null)}`));
    const alt = 'AI-generated concept film: robot 07 spreads mortar with a trowel and steadies a course of brick between two line posts, against a dark background.';
    check('F-090-alt', 'manifest alt of el-c30 is the F-081 text', byId['el-c30']?.alt === alt, byId['el-c30']?.alt ?? 'missing');
  });
  await step('F-091', async () => {
    const pdfs = ['public/kit/hrcg-t7-letter.pdf', 'public/kit/hrcg-t7-a4.pdf'].filter((p) => existsSync(resolve(ROOT, p)));
    const has = spawnSync('pdftotext', ['-v'], { encoding: 'utf8' });
    if (has.error) return check('F-091-case', 'T7 PDFs print "tag36h11" in its true case', null, 'pdftotext not installed');
    const bad = pdfs.filter((p) => !/tag36h11/.test(spawnSync('pdftotext', [resolve(ROOT, p), '-'], { encoding: 'utf8' }).stdout ?? ''));
    check('F-091-case', 'T7 PDFs print "tag36h11" in its true case', pdfs.length > 0 && bad.length === 0, bad);
  });

  // ------------------------------------------------------------------ first view (budgets, CLS, LCP)
  await step('F-002', async () => {
    const b2 = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    try {
      for (const [label, opts] of [
        ['desktop', desktopOpts()],
        ['phone', { ...phoneOpts(), deviceScaleFactor: 3 }],
      ]) {
        const ctx = await b2.newContext(opts);
        await ctx.addInitScript(() => {
          window.__cls = 0;
          new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
        });
        const page = await ctx.newPage();
        const reqs = [];
        page.on('requestfinished', async (r) => {
          try {
            const sz = await r.sizes();
            reqs.push({ url: r.url(), bytes: sz.responseBodySize + sz.responseHeadersSize, range: r.headers().range ?? '' });
          } catch {
            /* aborted */
          }
        });
        await page.goto(`${base}?heroperf=0`, { waitUntil: 'commit' });
        await page.waitForTimeout(9000);
        const cls = await page.evaluate(() => window.__cls);
        await ctx.close();
        const total = reqs.reduce((a, r) => a + r.bytes, 0);
        const budget = 1.1 * 1024 * 1024;
        const top = [...reqs].sort((a, b) => b.bytes - a.bytes).slice(0, 6).map((r) => `${Math.round(r.bytes / 1024)} kB ${r.url.replace(base, '/')}`);
        check(`F-002-bytes-${label}`, `first view (0-9 s, no scroll, AV1 path) moves <= 1.1 MB on ${label}`, total <= budget, `${(total / 1024 / 1024).toFixed(2)} MB; largest: ${top.join(' · ')}`);
        const posters = reqs.filter((r) => /\.poster\.jpg/.test(r.url) && !/\/hero[-/]/.test(r.url)).map((r) => r.url.split('/').pop());
        check(`F-002-posters-${label}`, `no *.poster.jpg outside A-000 is requested before scroll (${label})`, posters.length === 0, posters.slice(0, 12));
        const early = reqs.filter((r) => /arena-0104|plan-b44/.test(r.url)).map((r) => `${r.url.split('/').pop()} ${Math.round(r.bytes / 1024)} kB`);
        check(`F-002-a100-${label}`, `no arena-0104 or plan-b44 bytes arrive before scroll (${label}; F-002, F-006, F-037)`, early.length === 0, early);
        const snaps = reqs.filter((r) => /hero-snap-169/.test(r.url) && (!r.range || /bytes=0-/.test(r.range)));
        if (label === 'desktop') check('F-006-snap', 'the hero snap film is requested once (no second full fetch)', snaps.length <= 1, snaps.map((r) => `${r.url.split('/').pop()} ${r.range} ${Math.round(r.bytes / 1024)} kB`));
        if (label === 'desktop') check('F-065-cls', 'first-view CLS is 0 on desktop (fonts preloaded)', cls <= 0.0001, cls.toFixed(6));
      }
    } finally {
      await b2.close();
    }
  });
  await step('F-069', async () => {
    const { ctx, page } = await newPage(browser, desktopOpts(1440, 900, { reducedMotion: 'reduce' }), base, {
      wait: 3500,
      init: [
        () => {
          window.__lcp = null;
          new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lcp = e.element ? { tag: e.element.tagName, loading: e.element.getAttribute('loading'), src: (e.element.currentSrc || e.url || '').split('/').pop() } : null; })).observe({ type: 'largest-contentful-paint', buffered: true });
        },
      ],
    });
    const lcp = await page.evaluate(() => window.__lcp);
    check('F-069-lcp', 'the LCP image is not lazy under reduced motion', !!lcp && lcp.loading !== 'lazy', lcp);
    const ax = await axeState(page, axePath);
    if (ax) {
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check('F-053-axe-rm', 'axe (reduced motion, hero): no page-has-heading-one, no label-content-name-mismatch', bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    }
    await ctx.close();
  });

  // ------------------------------------------------------------------ desktop 1440x900, fresh page
  const D = await newPage(browser, desktopOpts(), base, { wait: 6000 });
  const p = D.page;
  const at = async (id, vh = 0, ms = 900) => {
    await p.evaluate(([id, vh]) => window.__qa.go(id, vh), [id, vh]);
    await settle(p, ms);
  };

  await step('F-001', async () => {
    await at('top', 0, 600);
    const top = await p.evaluate(() => ({ sheet: document.documentElement.dataset.sheet ?? null, alpha: window.__qa.alpha(getComputedStyle(document.querySelector('.sheet-header')).backgroundColor) }));
    check('F-001-hero', 'over A-000 the header stays transparent (no rail over the film)', top.alpha <= 0.01, top);
    const rows = [];
    for (const [id, vh] of [['a-102', 50], ['a-102', 90], ['a-104', 50], ['a-200', 120], ['a-301', 0], ['a-301', 120], ['a-900', 0]]) {
      await at(id, vh);
      rows.push(
        await p.evaluate(([id, vh]) => {
          const h = document.querySelector('.sheet-header');
          const hit = (el) => {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!e && h.contains(e);
          };
          return { at: `${id}+${vh}vh`, sheet: document.documentElement.dataset.sheet ?? null, alpha: window.__qa.alpha(getComputedStyle(h).backgroundColor), lockup: hit(document.querySelector('.header-home')), index: hit(document.querySelector('.header-index')) };
        }, [id, vh]),
      );
    }
    const bad = rows.filter((r) => r.alpha < 0.99 || !r.lockup || !r.index || r.sheet === 'A-000');
    check('F-001-rail', 'after A-000 the header is an opaque rail; the lockup and INDEX centres hit header elements (html[data-sheet] set)', bad.length === 0, bad.length ? bad : rows.map((r) => r.at).join(', '));
  });
  await step('F-059', async () => {
    const a = await p.evaluate(() => window.__qa.alpha(getComputedStyle(document.querySelector('.title-strip')).backgroundColor));
    check('F-059-strip', 'the title strip is opaque', a >= 0.99, `alpha ${a}`);
  });
  await step('F-060', async () => {
    const r = await p.evaluate(() => {
      const body = document.querySelector('.set-body');
      const cs = getComputedStyle(body, '::before');
      const x = body.getBoundingClientRect().left + parseFloat(cs.left);
      const lefts = [...document.querySelectorAll('.set-body .sheet-tag, .set-body h2')].filter((e) => window.__qa.vis(e)).map((e) => e.getBoundingClientRect().left);
      return { spine: Math.round(x), z: cs.zIndex, firstText: Math.round(Math.min(...lefts)) };
    });
    check('F-060-spine', 'the spine runs clear of the sheet tags and H2s (left of their first glyph) and under the media (z-index 0)', r.spine + 1 <= r.firstText - 4 && r.z === '0', r);
  });
  const nowrapGate = async (id, label) => {
    const broken = await p.evaluate(() => {
      const words = ['AI-GENERATED', 'NOT A VENUE PLAN', 'NOT SPONSOR PRODUCTS'];
      const out = [];
      for (const vt of document.querySelectorAll('.view-title, .cv-vt, figcaption')) {
        if (!window.__qa.vis(vt)) continue;
        const tw = document.createTreeWalker(vt, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          for (const w of words) {
            let i = n.textContent.indexOf(w);
            while (i >= 0) {
              const rg = document.createRange();
              rg.setStart(n, i);
              rg.setEnd(n, i + w.length);
              const tops = new Set([...rg.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
              if (tops.size > 1) out.push(`${w} in "${vt.textContent.trim().slice(0, 70)}"`);
              i = n.textContent.indexOf(w, i + 1);
            }
          }
        }
      }
      return out;
    });
    check(id, `no disclosure keyword (AI-GENERATED, NOT A VENUE PLAN, NOT SPONSOR PRODUCTS) breaks across lines (${label})`, broken.length === 0, broken.slice(0, 10));
  };
  await step('F-061', () => nowrapGate('F-061-1440', '1440'));
  await step('F-062', async () => {
    await at('a-103', 0, 400);
    await p.click('.header-index');
    await settle(p, 700);
    const xs = await p.evaluate(() => [...document.querySelectorAll('dialog[open] .index-row .index-num')].map((e) => Math.round(e.getBoundingClientRect().left * 2) / 2));
    check('F-062-index', 'INDEX: every sheet number shares one x, the current row included', xs.length >= 11 && Math.max(...xs) - Math.min(...xs) <= 0.5, xs);
    const ax = await axeState(p, axePath);
    if (ax) {
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check('F-053-axe-index', 'axe with INDEX open (desktop): no page-has-heading-one, no label-content-name-mismatch', bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    }
    await p.keyboard.press('Escape');
    await settle(p, 500);
  });
  const h2Tokens = async (label) => {
    const bad = await p.evaluate(() =>
      [...document.querySelectorAll('h2')]
        .filter((h) => window.__qa.shown(h))
        .map((h) => {
          const cs = getComputedStyle(h);
          const fs = parseFloat(cs.fontSize);
          const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
          const vh = innerHeight;
          const st = h.classList.contains('t-h2-statement');
          const ch = h.classList.contains('t-h2-challenge');
          const why = [];
          if (st && fs > 0.12 * vh + 0.5) why.push(`statement ${fs}px > 12vh`);
          if (st && !h.classList.contains('t-upper') && lh / fs < 0.95) why.push(`sentence-case leading ${(lh / fs).toFixed(2)} < .96`);
          if (ch && fs > 0.18 * vh + 0.5) why.push(`challenge ${fs}px > 18vh`);
          return why.length ? `${h.textContent.trim().slice(0, 30)}: ${why.join(', ')}` : null;
        })
        .filter(Boolean),
    );
    check(`F-016-${label}`, `H2 tokens respect the chrome: statement <= 12vh, challenge <= 18vh, sentence case leading >= .96 (${label})`, bad.length === 0, bad);
  };
  await step('F-016', () => h2Tokens('1440x900'));
  await step('F-040', async () => {
    const r = await p.evaluate(() => ({ text: document.body.textContent.includes('TASK DRAWING TRACED FROM CONCEPT FOOTAGE'), trace: [...document.querySelectorAll('.a104-trace')].filter((e) => window.__qa.vis(e)).length }));
    check('F-040-trace', 'no blue task-drawing trace and no trace caption on A-104 until b43 matches it (H-12 rejected)', !r.text && r.trace === 0, r);
  });
  await step('F-041', async () => {
    const rows = [];
    for (const vh of [0, 30, 60, 100]) {
      await at('a-105', vh);
      rows.push(await p.evaluate((vh) => {
        const h = document.querySelector('#a-105 h2');
        const r = h.getBoundingClientRect();
        return { vh, ok: window.__qa.vis(h) && window.__qa.inside(r, window.__qa.band()), h2: window.__qa.rect(h) };
      }, vh));
    }
    check('F-041-h2', 'A-105: the H2 is on screen, between the chrome, through the whole pin (+0/30/60/100vh)', rows.every((r) => r.ok), rows.filter((r) => !r.ok));
  });
  await step('F-033', async () => {
    await at('a-103', 60);
    const r = await p.evaluate(() => {
      const b = window.__qa.band();
      return [...document.querySelectorAll('#a-103 .pstage-view')].filter((e) => window.__qa.vis(e)).map((e) => ({ top: Math.round(e.getBoundingClientRect().top), min: Math.round(b.top) }));
    });
    check('F-033-hold', 'A-103 +60vh: the held film frame stays below the header until the pin releases', r.every((x) => x.top >= x.min - 0.5), r);
  });
  await step('F-039', async () => {
    const rows = [];
    for (const vh of [0, 50]) {
      await at('a-104', vh);
      rows.push(await p.evaluate((vh) => {
        const svg = document.querySelector('#a-104 .a104-route-svg');
        const inner = document.querySelector('#a-104 .sheet-inner') ?? document.querySelector('#a-104');
        const edge = inner.getBoundingClientRect().right;
        if (!svg || !window.__qa.vis(svg)) return { vh, right: null, edge: Math.round(edge) };
        const right = Math.max(...[...svg.querySelectorAll('path, line, polyline, circle, rect')].map((e) => e.getBoundingClientRect()).filter((r) => r.width + r.height > 0).map((r) => r.right));
        return { vh, right: Math.round(right), edge: Math.round(edge) };
      }, vh));
    }
    check('F-039-route', 'A-104: the route ends inside the content edge (never runs into INDEX)', rows.every((r) => r.right === null || r.right <= r.edge + 1), rows);
  });
  const captions = async (w, h) => {
    await p.setViewportSize({ width: w, height: h });
    await settle(p, 600);
    const bad = [];
    for (const id of FIX_SHEETS) {
      for (const vh of id === 'a-104' ? [0, 50] : [0]) {
        await at(id, vh, 500);
        bad.push(
          ...(await p.evaluate(([id, vh]) => {
            const sheet = document.getElementById(id);
            const vts = [...sheet.querySelectorAll('.view-title')].filter((e) => window.__qa.vis(e)).map((e) => ({ e, r: e.getBoundingClientRect() }));
            const out = [];
            for (let i = 0; i < vts.length; i++)
              for (let j = i + 1; j < vts.length; j++)
                if (!vts[i].e.contains(vts[j].e) && !vts[j].e.contains(vts[i].e) && window.__qa.overlap(vts[i].r, vts[j].r) > 2)
                  out.push(`${id}+${vh}vh: "${vts[i].e.textContent.trim().slice(0, 40)}" x "${vts[j].e.textContent.trim().slice(0, 40)}"`);
            for (const b of sheet.querySelectorAll('.a104-play, .loopvideo-play')) {
              if (!window.__qa.vis(b)) continue;
              const r = b.getBoundingClientRect();
              for (const v of vts) if (window.__qa.overlap(r, v.r) > 2) out.push(`${id}+${vh}vh: PLAY over "${v.e.textContent.trim().slice(0, 40)}"`);
            }
            return out;
          }, [id, vh])),
        );
      }
    }
    return bad;
  };
  await step('F-083', async () => {
    const all = {};
    for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800], [1024, 768]]) all[w] = await captions(w, h);
    const bad = Object.entries(all).flatMap(([w, b]) => b.map((x) => `${w}: ${x}`));
    check('F-083-captions', 'view titles never overprint each other or a PLAY cell, on every sheet at 1920/1440/1280/1024 (A-104 caption stack, X-1)', bad.length === 0, bad.slice(0, 12));
    await p.setViewportSize({ width: 1440, height: 900 });
    await settle(p, 600);
  });
  await step('F-038', async () => {
    const rows = [];
    for (const [w, h] of [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
      await p.setViewportSize({ width: w, height: h });
      await settle(p, 500);
      rows.push(await p.evaluate((w) => {
        const h2 = document.querySelector('#a-101 h2');
        const rg = document.createRange();
        rg.selectNodeContents(h2);
        const lines = new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top))).size;
        return { w, shy: h2.textContent.includes('­'), lines, fits: h2.scrollWidth <= h2.clientWidth + 1 };
      }, w));
    }
    await p.setViewportSize({ width: 1440, height: 900 });
    check('F-038-h2', 'A-101: BRICKLAYING has no soft hyphen and sets on one line at 1024/1280/1440/1920', rows.every((r) => !r.shy && r.lines === 1 && r.fits), rows);
  });
  await step('F-016b', async () => {
    await p.setViewportSize({ width: 1280, height: 800 });
    await settle(p, 600);
    await h2Tokens('1280x800');
    await p.setViewportSize({ width: 1440, height: 900 });
    await settle(p, 600);
  });
  await step('F-055', async () => {
    const rows = [];
    for (const [w, h] of [[1440, 900], [1280, 800]]) {
      await p.setViewportSize({ width: w, height: h });
      await at('a-300', 0, 600);
      rows.push(await p.evaluate((w) => {
        const inner = document.querySelector('#a-300 .sheet-inner').getBoundingClientRect();
        const L = document.querySelector('.diptych-view--left').getBoundingClientRect();
        const R = document.querySelector('.diptych-view--right').getBoundingClientRect();
        const word = document.querySelector('.diptych-word--right').getBoundingClientRect();
        return { w, left: Math.round(L.left), right: Math.round(R.right), content: [Math.round(inner.left), Math.round(inner.right)], wordStart: Math.round(word.left), panelStart: Math.round(R.left) };
      }, w));
    }
    await p.setViewportSize({ width: 1440, height: 900 });
    check('F-055-diptych', 'A-300: the diptych spans the content edge to edge (72/1368 at 1440, 72/1208 at 1280) and YOURS IS. starts on its panel', rows.every((r) => Math.abs(r.left - r.content[0]) <= 1 && Math.abs(r.right - r.content[1]) <= 1 && Math.abs(r.wordStart - r.panelStart) <= 1), rows);
  });
  await step('F-056', async () => {
    const rows = [];
    for (const [w, h] of [[1440, 900], [1280, 800]]) {
      await p.setViewportSize({ width: w, height: h });
      await at('a-301', 0, 700);
      rows.push(await p.evaluate((w) => {
        const h2 = document.querySelector('#a-301 h2');
        return { w, h2: window.__qa.rect(h2), band: window.__qa.band(), ok: window.__qa.inside(h2.getBoundingClientRect(), window.__qa.band()) };
      }, w));
    }
    await p.setViewportSize({ width: 1440, height: 900 });
    check('F-056-desktop', 'A-301 landing: the whole H2 sits between the header and the strip (1440x900, 1280x800)', rows.every((r) => r.ok), rows);
  });
  await step('F-098', async () => {
    const r = await p.evaluate(() => ({
      none: [...document.querySelectorAll('#a-300 .bay-ready-none')].map((e) => e.textContent),
      numbers: document.querySelectorAll('#a-300 .bay-ready-no').length,
    }));
    check('F-098-ready', 'A-300 bay: READY FOR — until a box is ticked; no challenge number printed before that (rule 11)', r.none.length >= 1 && r.none.every((t) => t === '—') && r.numbers === 0, r);
  });
  await step('F-096', async () => {
    const r = await p.evaluate(() => ({
      label: [...document.querySelectorAll('#a-300 .bay-number-label')].map((e) => e.textContent),
      painted: [...document.querySelectorAll('#a-300 .bay-number')].map((e) => !!e.closest('g[filter]')),
    }));
    check('F-096-bay', 'A-300 bay number: the legend word BAY over a "—" painted through the stencil mask', r.label.length >= 1 && r.label.every((t) => t === 'BAY') && r.painted.length >= 1 && r.painted.every(Boolean), r);
  });
  await step('F-097', async () => {
    const r = await p.evaluate(() => {
      const cols = [...document.querySelectorAll('.t7-proof-col')];
      return { n: cols.length, widths: cols.map((c) => Math.round(c.getBoundingClientRect().width)), labels: cols.map((c) => c.querySelector('.t7-proof-label')?.textContent.trim() ?? '') };
    });
    check('F-097-proofs', 'T7 proofs: three equal columns, each with its own label (FLAT · WARPED + BLURRED · measured width)', r.n === 3 && Math.max(...r.widths) - Math.min(...r.widths) <= 1 && r.labels[0] === 'FLAT' && r.labels[1] === 'WARPED + BLURRED' && /^\d+ PX WIDE$/.test(r.labels[2]), r);
  });
  await step('F-095', async () => {
    await at('a-301', 120, 600);
    const r = await p.evaluate(() =>
      [...document.querySelectorAll('.chips--bays')]
        .filter((g) => window.__qa.vis(g))
        .map((g) => {
          const chips = [...g.querySelectorAll('.chip')];
          const row = new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size === 1;
          const tops = chips.map((c) => Math.round(c.querySelector('.chip-num')?.getBoundingClientRect().top ?? 0));
          return { row, spread: Math.max(...tops) - Math.min(...tops) };
        })
        .filter((x) => x.row),
    );
    check('F-095-chips', 'challenge chips laid in one row: every numeral on one line, whatever the names wrap to', r.length > 0 && r.every((x) => x.spread <= 1), r);
  });
  await step('F-067', async () => {
    const r = await p.evaluate(() => {
      const a = document.getElementById('a-301').getBoundingClientRect();
      const b = document.getElementById('a-900').getBoundingClientRect();
      const head = document.querySelector('.conv--a900 > .conv-head');
      return { gap: Math.round(b.top - a.bottom), rule: head ? parseFloat(getComputedStyle(head).borderTopWidth) : 0 };
    });
    check('F-067-paper', 'A-301 runs straight into A-900 on one paper ground (no slab gap; F-067 + F-092)', Math.abs(r.gap) <= 1, r);
    check('F-092-rule', 'the A-301 → A-900 break is a 1 px rule on paper above the A-900 tag', r.rule >= 1, r);
  });
  await step('F-093', async () => {
    await p.evaluate(() => document.querySelector('.tb-cell--date')?.scrollIntoView({ block: 'center' }));
    await settle(p, 600);
    const r = await p.evaluate(() =>
      [...document.querySelectorAll('.tb-holdline')].map((hl) => {
        const cell = hl.closest('.tb-cell').getBoundingClientRect();
        const path = hl.querySelector('.mk-hold path')?.getBoundingClientRect();
        const txt = hl.querySelector(':scope > span:last-child')?.getBoundingClientRect();
        if (!path || !txt) return { missing: true };
        return { inset: +(path.left - cell.left).toFixed(1), gap: +(txt.left - path.right).toFixed(1), top: +(path.top - cell.top).toFixed(1), bottom: +(cell.bottom - path.bottom).toFixed(1) };
      }),
    );
    check('F-093-clouds', 'title block HOLD clouds: >= 4 px clear of the cell rule and >= 10 px before the sentence', r.length >= 2 && r.every((x) => !x.missing && x.inset >= 3.5 && x.gap >= 9.5 && x.bottom >= 3.5), r);
  });
  await step('H-7', async () => {
    await at('a-900', 0, 600);
    const r = await p.evaluate(() => {
      const a = document.getElementById('a-900');
      const notes = [...a.querySelectorAll('.notes > li')];
      return {
        details: a.querySelectorAll('details').length,
        notes: notes.length,
        headings: a.querySelectorAll('.notes h3').length,
        answers: a.querySelectorAll('.notes p').length,
        columns: new Set(notes.map((n) => Math.round(n.getBoundingClientRect().left))).size,
        open: notes.every((n) => window.__qa.vis(n.querySelector('p'))),
      };
    });
    check('H-7-notes', 'A-900 general notes print open: six headings + paragraphs, no <details>, two ruled columns at >= 1024 px', r.details === 0 && r.notes === 6 && r.headings === 6 && r.answers === 6 && r.columns === 2 && r.open, r);
  });
  await step('H-6', async () => {
    const r = await p.evaluate(() => {
      const end = document.querySelector('#a-900 .end-line');
      const tb = document.querySelector('.title-block .tb');
      const email = document.querySelector('.contact-email');
      const ctas = [...document.querySelectorAll('#a-900 .close-ctas a')].map((x) => x.getAttribute('href'));
      const vw = innerWidth;
      const vh = innerHeight;
      const e = end.getBoundingClientRect();
      const close = end.closest('.a900-close')?.getBoundingClientRect() ?? e;
      const t = tb.getBoundingClientRect();
      return {
        endPx: parseFloat(getComputedStyle(end).fontSize),
        statementPx: Math.min(Math.max(48, 0.08 * vw), 152, 0.12 * vh),
        ctas,
        aboveBlock: Math.round(t.top - close.bottom),
        leftEdge: Math.round(t.left - e.left),
        emailPx: parseFloat(getComputedStyle(email).fontSize),
        emailWant: Math.min(Math.max(28, 0.04 * vw), 56),
      };
    });
    check('H-6-close', 'A-900 close: end line at statement size with the two CTA cells (#a-300, #a-301), on its own row directly above the title block, sharing its left edge (F-094)', Math.abs(r.endPx - r.statementPx) <= 1 && r.ctas.join() === '#a-300,#a-301' && r.aboveBlock >= 0 && r.aboveBlock <= 64 && Math.abs(r.leftEdge) <= 1, r);
    check('H-6-email', 'A-900 email at clamp(28px, 4vw, 56px)', Math.abs(r.emailPx - r.emailWant) <= 0.5, r);
  });
  await step('H-4', async () => {
    const r = await p.evaluate(() => ({ title: document.querySelector('#keynote-3 .keynote-title')?.textContent ?? '', body: document.querySelector('#keynote-3 .keynote-body')?.textContent ?? '' }));
    const first = (t) => t.trim().split(/\s+/)[0]?.toLowerCase();
    check('H-4-keynote', 'A-301 keynote 3 no longer repeats "Meet … Meet" and matches the copy file', !!r.body && first(r.title) !== first(r.body) && r.body === mods.conv.SPONSORS.keynotes[2].text, r);
  });
  await step('H-5', async () => {
    const t = await p.evaluate(() => document.getElementById('a-200')?.textContent ?? '');
    check('H-5-wording', 'A-200 body says "drew most of Manhattan as a grid" (fact gate, qa/TRUTH.md)', t.includes('drew most of Manhattan as a grid') && !t.includes('drew Manhattan as a grid'), t.slice(0, 160));
  });
  await step('F-081', async () => {
    const r = await p.evaluate(() => [...document.querySelectorAll('#a-101 [alt], #a-101 [aria-label]')].map((e) => e.getAttribute('alt') || e.getAttribute('aria-label')).filter((t) => /PERSPECTIVE|concept film/i.test(t) || /mortar|brick/i.test(t)));
    check('F-081-alt', 'A-101 PERSPECTIVE 01-A alt describes the shot (trowel, mortar, line posts; no lights or stringline)', r.some((t) => t.includes('spreads mortar with a trowel')) && !r.some((t) => /hanging light|stringline/i.test(t)), r.slice(0, 4));
  });
  await step('F-023', async () => {
    const rows = [];
    for (const id of ['a-105', 'a-300']) {
      await at(id, 0, 900);
      rows.push(await p.evaluate((id) => {
        const h1 = document.querySelector('h1');
        let hidden = null;
        for (let n = h1; n && n.nodeType === 1; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden' || n.getAttribute('aria-hidden') === 'true' || n.inert) hidden = `${n.tagName}.${String(n.className).split(' ')[0]}`;
        }
        return { at: id, hidden };
      }, id));
    }
    check('F-023-h1', 'the H1 stays in the accessibility tree after the plan cut (at A-105 and A-300)', rows.every((r) => !r.hidden), rows);
  });
  await step('F-066', async () => {
    const r = await p.evaluate(() => ({
      contentinfo: [...document.querySelectorAll('footer')].filter((f) => !f.closest('main, article, aside, nav, section, [role="main"], [role="region"]')).length,
      footers: document.querySelectorAll('footer').length,
      index: document.querySelectorAll('#index').length,
      blocks: document.querySelectorAll('.title-block').length,
    }));
    check('F-066-footer', 'one title block, rendered once as the page footer (one contentinfo landmark, one #index; F-066 + F-100)', r.contentinfo === 1 && r.blocks === 1 && r.index === 1, r);
  });
  await step('F-068', async () => {
    const bad = await p.evaluate(() => {
      const out = [];
      const walk = (rules, gated) => {
        for (const r of rules) {
          if (r.type === CSSRule.MEDIA_RULE) walk(r.cssRules, gated || /hover\s*:\s*hover/.test(r.conditionText ?? r.media?.mediaText ?? ''));
          else if (r.selectorText && /:hover/.test(r.selectorText)) {
            if (!gated) out.push(r.selectorText.replace(/\s+/g, ' ').slice(0, 90));
            if (r.cssRules?.length) walk(r.cssRules, gated);
          } else if (r.cssRules?.length) walk(r.cssRules, gated);
        }
      };
      for (const ss of document.styleSheets) {
        try {
          walk(ss.cssRules, false);
        } catch {
          /* cross-origin */
        }
      }
      return out;
    });
    check('F-068-hover', 'every :hover rule sits inside @media (hover: hover) and (pointer: fine), so a tap leaves no hover state (F-068, F-075, F-082, F-089, F-101)', bad.length === 0, bad.slice(0, 25));
  });
  await step('F-064', async () => {
    const rows = [];
    for (const id of FIX_SHEETS) {
      for (const part of [0.45, 0.6]) {
        await p.evaluate(([id, part]) => {
          const r = document.getElementById(id).getBoundingClientRect();
          window.scrollTo(0, Math.round(r.bottom + scrollY - innerHeight * part));
        }, [id, part]);
        await settle(p, 1000);
        rows.push(await p.evaluate(([id, part]) => {
          const mid = innerHeight / 2;
          const sheets = [...document.querySelectorAll('[data-sheet]')];
          let expect = null;
          for (const s of sheets) if (s.getBoundingClientRect().top <= mid) expect = s.getAttribute('data-sheet');
          return { at: `${id} end-${part}`, shown: window.__qa.sheetAt(), expect };
        }, [id, part]));
      }
    }
    const bad = rows.filter((r) => r.shown !== r.expect);
    check('F-064-sheet', 'the live sheet number is the last sheet whose top is above mid-viewport, also in the gaps between sheets', bad.length === 0, bad.slice(0, 10));
  });
  await step('F-019', async () => {
    const r = await p.evaluate(() => {
      const btn = document.querySelector('.title-strip .motion-toggle');
      const cell = btn?.closest('[data-strip-cell]');
      if (!btn || !cell) return null;
      const c = cell.getBoundingClientRect();
      const corners = [[c.left + 3, c.top + 3], [c.right - 3, c.top + 3], [c.left + 3, c.bottom - 3], [c.right - 3, c.bottom - 3]];
      const hit = corners.every(([x, y]) => document.elementFromPoint(x, y)?.closest('.motion-toggle') === btn);
      const nameText = (btn.getAttribute('aria-label') ?? [...btn.childNodes].filter((n) => !(n.nodeType === 1 && n.getAttribute('aria-hidden') === 'true')).map((n) => n.textContent).join('')).trim();
      return { name: nameText, pressed: btn.getAttribute('aria-pressed'), cellH: Math.round(c.height), hit };
    });
    check('F-019-desktop', 'MOTION: button "Motion" with aria-pressed; the whole strip cell (>= 44 px) is its target', !!r && r.name === 'Motion' && ['true', 'false'].includes(r.pressed) && r.cellH >= 44 && r.hit, r);
  });
  await step('F-020', async () => {
    const opener = p.locator('.contact-film-link, .index-set').first();
    if (!(await opener.count())) return check('F-020-lightbox', 'THE SET lightbox has captions and a transcript', null, 'no THE SET link on the page (film not in the manifest)');
    await opener.scrollIntoViewIfNeeded();
    await opener.click();
    await settle(p, 1000);
    const sum = p.locator('dialog[open] details summary').first();
    if (await sum.count()) {
      await sum.click();
      await settle(p, 1500);
    }
    const r = await p.evaluate(() => {
      const d = document.querySelector('dialog[open]');
      if (!d) return { open: false };
      const v = d.querySelector('video');
      const tr = v?.querySelector('track[kind="captions"]');
      const det = d.querySelector('details');
      return { open: true, track: tr?.getAttribute('src') ?? null, label: v?.getAttribute('aria-label') ?? null, transcript: det ? det.textContent.trim().length : 0 };
    });
    check('F-020-lightbox', 'THE SET lightbox: a captions <track>, a transcript that opens, and the video named by THE_SET.videoLabel', r.open && !!r.track && r.transcript > 80 && r.label === mods.chrome.THE_SET?.videoLabel, r);
    await p.keyboard.press('Escape');
    await settle(p, 500);
  });
  await step('F-015', async () => {
    await at('top', 0, 600);
    const n = await p.evaluate(() => document.querySelectorAll('.index-dialog .index-row').length);
    const bad = [];
    for (let i = 0; i < n; i++) {
      await p.click('.header-index');
      await settle(p, 600);
      const label = await p.locator('dialog[open] .index-row').nth(i).textContent();
      await p.locator('dialog[open] .index-row').nth(i).click();
      await settle(p, 3200);
      const r = await p.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { ok: false, el: 'body' };
        const b = window.__qa.band();
        const inBand = window.__qa.inside(a.getBoundingClientRect(), b);
        const h = window.__qa.hits(a);
        return { ok: inBand && h.ok, el: window.__qa.name(a), rect: window.__qa.rect(a), band: b, hit: h.hit };
      });
      if (!r.ok) bad.push({ row: label?.trim().slice(0, 30), ...r });
    }
    for (const cell of ['teams', 'sponsors']) {
      await at('top', 0, 500);
      await p.click(`.title-strip [data-strip-cell="${cell}"]`);
      await settle(p, 3500);
      const r = await p.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { ok: false, el: 'body' };
        const h = window.__qa.hits(a);
        return { ok: window.__qa.inside(a.getBoundingClientRect(), window.__qa.band()) && h.ok, el: window.__qa.name(a), rect: window.__qa.rect(a), hit: h.hit };
      });
      if (!r.ok) bad.push({ row: `strip ${cell}`, ...r });
    }
    check('F-015-landing', 'every INDEX row and both strip CTAs land with the focused heading inside the unobscured band, hitting itself (desktop; F-007, F-039, F-041)', n >= 11 && bad.length === 0, bad.slice(0, 8));
  });
  await step('F-034', async () => {
    const r = await p.evaluate(async () => {
      const els = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), textarea, select, [role="slider"], [tabindex]:not([tabindex="-1"])')].filter(
        (e) => !e.closest('dialog, .sheet-header, .title-strip, .phone-bar, .skip-link') && !e.disabled && e.tabIndex >= 0,
      );
      const bad = [];
      let n = 0;
      for (const el of els) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        await new Promise((ok) => setTimeout(ok, 140));
        const target = el.matches('input[type="checkbox"]') && el.closest('label') ? el.closest('label') : el;
        if (!window.__qa.vis(target) || getComputedStyle(target).pointerEvents === 'none') continue;
        n++;
        const h = window.__qa.hits(el.matches('input[type="checkbox"]') ? el : target);
        if (!h.ok) bad.push(`${window.__qa.name(el)} -> ${h.hit}`);
      }
      return { n, bad };
    });
    check('F-034-selfhit', 'every visible interactive element, once scrolled into view, is what elementFromPoint returns at its own centre', r.n > 20 && r.bad.length === 0, { checked: r.n, failing: r.bad.slice(0, 15) });
  });
  await step('F-024', async () => {
    // Visible focus: each Tab stop, focused vs not, must change pixels around it (2.4.7 / 2.4.11)
    await at('top', 0, 400);
    await p.evaluate(() => document.querySelectorAll('video').forEach((v) => v.pause()));
    await p.keyboard.press('Tab');
    await settle(p, 200);
    const bad = [];
    let checked = 0;
    for (let i = 0; i < 70; i++) {
      if (i > 0) await p.keyboard.press('Tab');
      await settle(p, 220);
      const box = await p.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        document.querySelectorAll('video').forEach((v) => v.pause());
        const r = a.getBoundingClientRect();
        const x = Math.max(0, r.left - 8);
        const y = Math.max(0, r.top - 8);
        const w = Math.min(innerWidth, r.right + 8) - x;
        const h = Math.min(innerHeight, r.bottom + 8) - y;
        if (w < 4 || h < 4) return null;
        return { x, y, width: w, height: h, el: window.__qa.name(a) };
      });
      if (!box) continue;
      const { el, ...clip } = box;
      const on = (await p.screenshot({ clip })).toString('base64');
      await p.evaluate(() => {
        window.__qaFocus = document.activeElement;
        document.activeElement.blur();
      });
      await settle(p, 120);
      const off = (await p.screenshot({ clip })).toString('base64');
      await p.evaluate(() => window.__qaFocus?.focus({ preventScroll: true }));
      const diff = await p.evaluate(([a, b]) => window.__qa.pixelDiff(`data:image/png;base64,${a}`, `data:image/png;base64,${b}`), [on, off]);
      checked++;
      if (diff < 12) bad.push(`${el} (${diff} px changed)`);
    }
    check('F-024-focus', 'visible focus: every Tab stop (first 70) changes at least 12 pixels around itself when focused (incl. the 3D view)', checked > 20 && bad.length === 0, { checked, invisible: bad.slice(0, 15) });
  });
  for (const [state, id, vh] of [['hero-rest', 'top', 0], ['a-105', 'a-105', 30], ['a-300', 'a-300', 0]]) {
    await step(`F-053-axe-${state}`, async () => {
      await at(id, vh, 1200);
      const ax = await axeState(p, axePath);
      if (!ax) return check(`F-053-axe-${state}`, 'axe', null, 'axe-core not installed');
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check(`F-053-axe-${state}`, `axe at ${state} (desktop): no page-has-heading-one, no label-content-name-mismatch (F-023, F-031, F-035, F-044)`, bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    });
  }
  await D.ctx.close();

  // ------------------------------------------------------------------ desktop 1280x800 rest (F-028)
  await step('F-028', async () => {
    const { ctx, page } = await newPage(browser, desktopOpts(1280, 800), base, { wait: 9500 });
    const r = await page.evaluate(() => {
      const vt = [...document.querySelectorAll('.cv-media .cv-vt')].find((e) => window.__qa.vis(e));
      const sub = document.querySelector('.cv-sub');
      const lefts = ['.cv-sub', '.cv-status', '.cv-hint'].map((s) => [...document.querySelectorAll(s)].find((e) => window.__qa.vis(e))).filter(Boolean).map((e) => Math.round(e.getBoundingClientRect().left));
      const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--margin')) || 72;
      return { gap: vt && sub ? Math.round(vt.getBoundingClientRect().top - sub.getBoundingClientRect().bottom) : null, lefts, margin };
    });
    check('F-028-sub', 'hero at 1280x800 rest: >= 20 px between the sub and the view title, and the labels start on the spine', r.gap !== null && r.gap >= 20 && r.lefts.every((x) => x >= r.margin - 1), r);
    await ctx.close();
  });

  // ------------------------------------------------------------------ hero overlap on real phone heights (F-003, F-017)
  await step('F-003', async () => {
    const bad = [];
    for (const [w, h] of [[390, 844], [390, 664], [375, 667], [360, 780], [320, 568], [844, 390]]) {
      const ctx = await browser.newContext(phoneOpts(w, h));
      await ctx.addInitScript(qaHelpers);
      const page = await ctx.newPage();
      const t0 = Date.now();
      await page.goto(`${base}?heroperf=0`, { waitUntil: 'load', timeout: 90000 });
      await page.waitForFunction(() => document.documentElement.classList.contains('js'), null, { timeout: 15000 }).catch(() => {});
      for (const [state, t] of [['armed', 1600], ['rest', 9500]]) {
        await page.waitForTimeout(Math.max(200, t - (Date.now() - t0)));
        const r = await page.evaluate(() => {
          const vp = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
          const clip = (r) => ({ left: Math.max(r.left, vp.left), top: Math.max(r.top, vp.top), right: Math.min(r.right, vp.right), bottom: Math.min(r.bottom, vp.bottom) });
          const boxes = [];
          const add = (group, el) => {
            if (!el || !window.__qa.vis(el)) return;
            const r = clip(el.getBoundingClientRect());
            if (r.right - r.left > 1 && r.bottom - r.top > 1) boxes.push({ group, r, el: window.__qa.name(el) });
          };
          add('status', document.querySelector('.cv-status'));
          add('sub', document.querySelector('.cv-sub'));
          document.querySelectorAll('.cv-hint').forEach((e) => add('hint', e));
          add('reset', document.querySelector('.cv-reset'));
          document.querySelectorAll('.cv-media .cv-vt').forEach((e) => add('vt', e));
          add('header', document.querySelector('.sheet-header'));
          add('bar', document.querySelector('.phone-bar'));
          // the H1 lines (line boxes of the DOM type; the GL planes are laid on the same boxes)
          const h1 = document.querySelector('.cv-h1');
          if (h1 && getComputedStyle(h1).display !== 'none') {
            const rg = document.createRange();
            rg.selectNodeContents(h1);
            for (const r of rg.getClientRects()) if (r.width > 4 && r.height > 4) boxes.push({ group: 'h1', r: clip(r), el: 'H1 line' });
          }
          const out = [];
          for (let i = 0; i < boxes.length; i++)
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              if (a.group === b.group) continue;
              if (window.__qa.overlap(a.r, b.r) > 4) out.push(`${a.group} x ${b.group} (${a.el} / ${b.el})`);
            }
          return out;
        });
        if (r.length) bad.push(`${w}x${h} ${state}: ${r.slice(0, 4).join('; ')}`);
      }
      if (w === 844) {
        const l = await page.evaluate(() => ({
          bar: window.__qa.shown(document.querySelector('.phone-bar')),
          strip: getComputedStyle(document.querySelector('.title-strip')).display,
          lines: getComputedStyle(document.querySelector('.header-lines')).display,
          statusTop: Math.round(document.querySelector('.cv-status')?.getBoundingClientRect().top ?? -1),
          border: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--border')) || 0,
        }));
        check('F-017-landscape', 'a phone turned sideways (844x390) gets the phone chrome: phone bar, no strip, no header lines, nothing clipped by the border', l.bar && l.strip === 'none' && l.lines === 'none' && l.statusTop >= l.border, l);
      }
      await ctx.close();
    }
    check('F-003-overlap', 'phone hero, armed and at rest, at 390x844/390x664/375x667/360x780/320x568/844x390: status, H1 lines, sub, hint, RESET, view title, header and phone bar never intersect', bad.length === 0, bad.slice(0, 12));
  });

  // ------------------------------------------------------------------ contrast sampler (F-025)
  await step('F-025', async () => {
    const rows = [];
    for (const [label, opts] of [['desktop', desktopOpts()], ['phone', phoneOpts()]]) {
      for (const t of [1600, 3900, 9000]) {
        const { ctx, page } = await newPage(browser, opts, base, { wait: Math.max(0, t - 1500) });
        await page.evaluate(() => document.querySelectorAll('video').forEach((v) => v.pause()));
        for (const sel of ['.cv-status', '.cv-sub']) {
          const box = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el || !window.__qa.vis(el)) return null;
            const r = el.getBoundingClientRect();
            const x = Math.max(0, r.left);
            const y = Math.max(0, r.top);
            const cs = getComputedStyle(el);
            const fs = parseFloat(cs.fontSize);
            return { clip: { x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y }, need: fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5 };
          }, sel);
          if (!box || box.clip.width < 4 || box.clip.height < 4) continue;
          const a = (await page.screenshot({ clip: box.clip })).toString('base64');
          await page.addStyleTag({ content: `${sel}, ${sel} * { color: transparent !important; -webkit-text-fill-color: transparent !important; -webkit-text-stroke-color: transparent !important; }` });
          await page.waitForTimeout(60);
          const b = (await page.screenshot({ clip: box.clip })).toString('base64');
          await page.evaluate((sel) => document.querySelectorAll('style').forEach((st) => { if (st.textContent.startsWith(`${sel},`)) st.remove(); }), sel);
          const c = await page.evaluate(([a, b, need]) => window.__qa.glyphContrast(`data:image/png;base64,${a}`, `data:image/png;base64,${b}`, need), [a, b, box.need]);
          rows.push({ at: `${label} ${t / 1000}s ${sel}`, ...c });
        }
        await ctx.close();
      }
    }
    const bad = rows.filter((r) => r.pass !== null && r.pass < 0.9);
    check('F-025-contrast', 'hero status line and sub over the footage: >= 90% of glyph pixels at >= 4.5:1 at t 1.6/3.9/9 s (desktop, phone)', rows.length > 0 && bad.length === 0, bad.length ? bad : rows.map((r) => `${r.at} ${r.pass === null ? 'n/a' : `${Math.round(r.pass * 100)}%`}`));
  });

  // ------------------------------------------------------------------ phone 390x844
  const P = await newPage(browser, phoneOpts(), base, { wait: 5000 });
  const q = P.page;
  const pat = async (id, vh = 0, ms = 900) => {
    await q.evaluate(([id, vh]) => window.__qa.go(id, vh), [id, vh]);
    await settle(q, ms);
  };
  await step('F-061-390', async () => {
    await pat('top', 0, 2500);
    const broken = await q.evaluate(() => {
      const out = [];
      for (const vt of document.querySelectorAll('.view-title, .cv-vt, figcaption')) {
        if (!window.__qa.vis(vt)) continue;
        const tw = document.createTreeWalker(vt, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          for (const w of ['AI-GENERATED', 'NOT A VENUE PLAN', 'NOT SPONSOR PRODUCTS']) {
            const i = n.textContent.indexOf(w);
            if (i < 0) continue;
            const rg = document.createRange();
            rg.setStart(n, i);
            rg.setEnd(n, i + w.length);
            if (new Set([...rg.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size > 1) out.push(`${w} in "${vt.textContent.trim().slice(0, 60)}"`);
          }
        }
      }
      return out;
    });
    check('F-061-390', 'no disclosure keyword breaks across lines on the phone (390, hero after the snap)', broken.length === 0, broken.slice(0, 8));
    const sp = await q.evaluate(() => getComputedStyle(document.querySelector('.set-body'), '::before').display);
    check('F-060-phone', 'no spine line on phones (no doubled left edge)', sp === 'none', sp);
  });
  await step('F-018', async () => {
    await q.tap('.header-index');
    await settle(q, 900);
    const r = await q.evaluate(() => {
      const d = document.querySelector('dialog[open]');
      if (!d) return null;
      const btn = [...d.querySelectorAll('button')].find((b) => /close/i.test(b.textContent) && window.__qa.vis(b));
      const focusables = [...d.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')].filter((e) => window.__qa.vis(e));
      if (!btn) return { close: null };
      const r = btn.getBoundingClientRect();
      return { close: window.__qa.rect(btn), inView: r.top >= 0 && r.bottom <= innerHeight, right: r.left > innerWidth / 2, first: focusables[0] === btn, size: [Math.round(r.width), Math.round(r.height)] };
    });
    check('F-018-close', 'phone INDEX: a CLOSE control is in view at top right, >= 44 px, and is the first focusable', !!r && !!r.close && r.inView && r.right && r.first && r.size[0] >= 44 && r.size[1] >= 44, r);
    const ax = await axeState(q, axePath);
    if (ax) {
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check('F-053-axe-phone-index', 'axe with INDEX open (phone): no page-has-heading-one, no label-content-name-mismatch', bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    }
    await q.keyboard.press('Escape');
    await settle(q, 500);
  });
  await step('F-019-phone', async () => {
    await q.tap('.phone-status');
    await settle(q, 900);
    const r = await q.evaluate(() => {
      const btn = document.querySelector('dialog[open] .motion-toggle');
      const cell = btn?.closest('.ts-cell') ?? btn;
      if (!btn) return null;
      const c = cell.getBoundingClientRect();
      const corners = [[c.left + 3, c.top + 3], [c.right - 3, c.bottom - 3]];
      return { h: Math.round(c.height), pressed: btn.getAttribute('aria-pressed'), hit: corners.every(([x, y]) => document.elementFromPoint(x, y)?.closest('.motion-toggle') === btn) };
    });
    check('F-019-phone', 'title sheet MOTION row: >= 44 px target over the whole cell, with aria-pressed', !!r && r.h >= 44 && ['true', 'false'].includes(r.pressed) && r.hit, r);
    const ax = await axeState(q, axePath);
    if (ax) {
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check('F-053-axe-phone-titlesheet', 'axe with the title sheet open (phone): no page-has-heading-one, no label-content-name-mismatch', bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    }
    await q.keyboard.press('Escape');
    await settle(q, 500);
  });
  for (const [state, id, vh] of [['hero-rest', 'top', 0], ['a-105', 'a-105', 30], ['a-300', 'a-300', 0]]) {
    await step(`F-053-axe-phone-${state}`, async () => {
      await pat(id, vh, 1200);
      const ax = await axeState(q, axePath);
      if (!ax) return;
      const bad = ax.violations.filter((v) => ['page-has-heading-one', 'label-content-name-mismatch'].includes(v.rule));
      check(`F-053-axe-phone-${state}`, `axe at ${state} (phone): no page-has-heading-one, no label-content-name-mismatch`, bad.length === 0, { fail: bad, incomplete: ax.incomplete, other: ax.violations.map((v) => `${v.rule} x${v.count}`) });
    });
  }
  await step('F-056-phone', async () => {
    await pat('top', 0, 500);
    await q.tap('.phone-bar a[href="#a-301"]');
    await settle(q, 3500);
    const r = await q.evaluate(() => {
      const h2 = document.querySelector('#a-301 h2');
      return { h2: window.__qa.rect(h2), band: window.__qa.band(), ok: window.__qa.inside(h2.getBoundingClientRect(), window.__qa.band()) };
    });
    check('F-056-phone', 'phone: after "Sponsors →" the A-301 H2 is on screen', r.ok, r);
  });
  await step('F-057', async () => {
    const mat = q.locator('.material-button').nth(1);
    await mat.scrollIntoViewIfNeeded();
    await settle(q, 400);
    await mat.tap();
    await settle(q, 500);
    const r = await q.evaluate(() => ({
      active: [...document.querySelectorAll('.material')].map((x) => (x.classList.contains('is-active') ? 1 : 0)).join(''),
      lit: [...document.querySelectorAll('.keynote.is-lit')].map((k) => k.id),
      inline: document.querySelector('.materials-readout') && window.__qa.vis(document.querySelector('.materials-readout')) ? document.querySelector('.materials-readout').textContent : '',
    }));
    const titles = mods.conv.SPONSORS.keynotes.filter((k) => k.n <= 2).map((k) => k.title);
    check('F-057-tap', 'phone: one tap on MAT 02 makes it active, lights keynotes 1 and 2, and prints their titles inline', r.active === '01000' && JSON.stringify(r.lit) === '["keynote-1","keynote-2"]' && titles.every((t) => r.inline.includes(t)), r);
  });
  await step('F-054', async () => {
    const rows = [];
    for (const id of ['rfi-team', 'rfi-platform', 'rfi-needs', 'rfi-ch-02', 'kit-company', 'kit-make']) {
      await q.setViewportSize({ width: 390, height: 844 });
      await q.locator(`#${id}`).scrollIntoViewIfNeeded();
      await settle(q, 300);
      await q.focus(`#${id}`);
      await q.setViewportSize({ width: 390, height: 470 });
      await settle(q, 300);
      await q.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), id);
      await settle(q, 500);
      rows.push(await q.evaluate((id) => {
        const el = document.getElementById(id);
        const t = (el.closest('.chip') ?? el).getBoundingClientRect();
        const block = [];
        const mini = document.querySelector('.mini-slot');
        if (mini && el.closest('#a-300') && window.__qa.shown(mini)) block.push(['mini-slot', mini.getBoundingClientRect()]);
        const bar = document.querySelector('.phone-bar');
        if (window.__qa.shown(bar)) block.push(['phone-bar', bar.getBoundingClientRect()]);
        block.push(['header', document.querySelector('.sheet-header').getBoundingClientRect()]);
        const hit = block.filter(([, r]) => window.__qa.overlap(r, t) > 0).map(([n]) => n);
        return { id, field: [Math.round(t.top), Math.round(t.bottom)], covered: hit, barShown: window.__qa.shown(bar) };
      }, id));
    }
    await q.setViewportSize({ width: 390, height: 844 });
    check('F-054-keyboard', 'phone, keyboard up (390x470), each field aligned to the top: it never sits under the mini-slot, the header or the phone bar', rows.every((r) => r.covered.length === 0), rows);
    check('F-021-bar', 'phone: the phone bar steps aside while a text field has focus (keyboard up)', rows.filter((r) => !r.id.includes('-ch-')).every((r) => !r.barShown), rows.map((r) => `${r.id}: bar ${r.barShown ? 'shown' : 'hidden'}`));
  });
  await step('F-099', async () => {
    await q.evaluate(() => document.querySelector('.tb-cell--index')?.scrollIntoView({ block: 'end' }));
    await settle(q, 600);
    const r = await q.evaluate(() => ({
      links: [...document.querySelectorAll('.tb-index a')].map((a) => Math.round(a.getBoundingClientRect().height)),
      email: Math.round(document.querySelector('.contact-email').getBoundingClientRect().height),
      chipName: parseFloat(getComputedStyle(document.querySelector('.chip-name')).fontSize),
    }));
    check('F-099-targets', 'phone: footer index links and the email are >= 44 px targets; chip names >= 13 px', r.links.length >= 11 && r.links.every((h) => h >= 44) && r.email >= 44 && r.chipName >= 13, r);
  });
  await step('F-085', async () => {
    await pat('a-105', 0, 900);
    const r = await q.evaluate(() => {
      const h2 = document.querySelector('#a-105 h2')?.getBoundingClientRect();
      const body = document.querySelector('#a-105 .a105-line')?.getBoundingClientRect();
      const views = document.querySelector('#a-105 .a105-views')?.getBoundingClientRect();
      return { h2: h2 && Math.round(h2.top + scrollY), body: body && Math.round(body.top + scrollY), views: views && Math.round(views.top + scrollY) };
    });
    check('F-085-order', 'phone A-105: the H2 comes before the plan, the section and the body paragraph', r.h2 !== null && (r.body == null || r.h2 < r.body) && (r.views == null || r.h2 < r.views), r);
  });
  await step('F-084', async () => {
    const cut = q.locator('#a-105 .a105-cut').first();
    if (!(await cut.count())) return check('F-084-swipe', 'a vertical swipe on the section-cut handle scrolls the page', null, 'no .a105-cut');
    await cut.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await settle(q, 800);
    const box = await cut.boundingBox();
    const y0 = await q.evaluate(() => scrollY);
    const cdp = await P.ctx.newCDPSession(q);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - (250 * i) / 12 }] });
      await q.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settle(q, 800);
    const y1 = await q.evaluate(() => scrollY);
    check('F-084-swipe', 'phone: a vertical swipe that starts on the section-cut handle scrolls the page', y1 > y0 + 50, `${y0} -> ${y1}`);
  });
  await step('F-015-phone', async () => {
    const bad = [];
    const n = await q.evaluate(() => document.querySelectorAll('.index-dialog .index-row').length);
    for (let i = 0; i < n; i++) {
      await q.tap('.header-index');
      await settle(q, 700);
      const label = await q.locator('dialog[open] .index-row').nth(i).textContent();
      await q.locator('dialog[open] .index-row').nth(i).tap();
      await settle(q, 3200);
      const r = await q.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { ok: false, el: 'body' };
        const h = window.__qa.hits(a);
        return { ok: window.__qa.inside(a.getBoundingClientRect(), window.__qa.band()) && h.ok, el: window.__qa.name(a), rect: window.__qa.rect(a), hit: h.hit };
      });
      if (!r.ok) bad.push({ row: label?.trim().slice(0, 30), ...r });
    }
    for (const href of ['#a-300', '#a-301']) {
      await pat('top', 0, 500);
      await q.tap(`.phone-bar a[href="${href}"]`);
      await settle(q, 3500);
      const r = await q.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { ok: false, el: 'body' };
        const h = window.__qa.hits(a);
        return { ok: window.__qa.inside(a.getBoundingClientRect(), window.__qa.band()) && h.ok, el: window.__qa.name(a), rect: window.__qa.rect(a), hit: h.hit };
      });
      if (!r.ok) bad.push({ row: `phone ${href}`, ...r });
    }
    check('F-015-phone', 'phone: every INDEX row and both phone-bar CTAs land with the focused heading on screen, hitting itself', n >= 11 && bad.length === 0, bad.slice(0, 8));
  });
  await P.ctx.close();

  await step('F-063', async () => {
    const rows = [];
    for (const [w, h] of [[320, 568], [360, 780]]) {
      const { ctx, page } = await newPage(browser, phoneOpts(w, h), base, { wait: 1500 });
      rows.push(await page.evaluate((w) => {
        const st = document.querySelector('.phone-status');
        const clipped = [st, ...st.querySelectorAll('*')].filter((e) => window.__qa.shown(e) && !e.closest('.sr-only') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map((e) => `${e.className} ${e.scrollWidth}>${e.clientWidth}`);
        return { w, text: st.innerText.replace(/\s+/g, ' '), clipped, sheet: /A-\d{3}/.test(st.innerText) };
      }, w));
      await ctx.close();
    }
    check('F-063-status', 'phone status cell shows the sheet number unclipped at 320 and 360', rows.every((r) => r.clipped.length === 0 && r.sheet), rows);
  });

  // ------------------------------------------------------------------ prod vs dev landings (F-013)
  await step('F-013-dev', async () => {
    const dev = String(arg('dev', DEV_URL));
    let ok = false;
    try {
      const res = await fetch(dev, { signal: AbortSignal.timeout(4000) });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok || dev === base) return check('F-013-prodvsdev', 'sheet landings match between the production build and the dev server', null, `dev server ${dev} not answering`);
    const sig = async (url) => {
      const { ctx, page } = await newPage(browser, desktopOpts(), url, { wait: 5000 }).catch(() => ({}));
      if (!page) return null;
      const out = {};
      for (const id of FIX_SHEETS) {
        await page.evaluate((id) => window.__qa.go(id, 0), id);
        await page.waitForTimeout(900);
        out[id] = await page.evaluate((id) => {
          const sh = document.getElementById(id);
          const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
          return {
            vts: [...sh.querySelectorAll('.view-title')].filter((e) => window.__qa.vis(e)).map(r),
            h2: [...sh.querySelectorAll('h2')].map(r),
            buttons: [...sh.querySelectorAll('.cell-button')].filter((e) => window.__qa.vis(e)).length,
          };
        }, id);
      }
      await ctx.close();
      return out;
    };
    const a = await sig(base);
    const b = await sig(dev);
    if (!b) return check('F-013-prodvsdev', 'sheet landings match between the production build and the dev server', null, 'dev server did not render the set');
    const near = (x, y) => x.length === y.length && x.every((v, i) => v.every((n, k) => Math.abs(n - y[i][k]) <= 2));
    const diff = FIX_SHEETS.filter((id) => !(near(a[id].vts, b[id].vts) && near(a[id].h2, b[id].h2) && a[id].buttons === b[id].buttons)).map((id) => ({ id, prod: a[id], dev: b[id] }));
    check('F-013-prodvsdev', 'every sheet lands with the same view titles, H2 and visible buttons on the production build and the dev server (CSS order independent of chunking)', diff.length === 0, diff.slice(0, 3));
  });

  // ------------------------------------------------------------------ visual items (retake, not automatable)
  manual('F-004', 'rest pose: no streak or step more than 2 px past 07 (and the nine limit-pose PNGs)', 'r1/hero-1440-t8.0s.jpg, juror/hero390-t12.jpg');
  manual('F-005', 'plan cut: no hero type or band beside the plan, one view title, H2 + list from P 0.55', 'r1/plan-1440-t*.jpg, r1/plan-390-t*.jpg, motion/glout-seq.png');
  manual('F-008', 'freeze depth dilated (A5 limit-pose gate report)', 'pipeline gate report');
  manual('F-009', 'c31: no warm figure between the studs; hands and board readable (crowd sign-off in qa/TRUTH.md)', 'r1/1440-a-102-land.jpg, truth/c31-t3.4-person.jpg');
  manual('F-010', 'og image and film: grey tape housing; qa_shipped.py liveryFrames = 0', 'truth/og-tape.jpg');
  manual('F-011', 'og image / X card: no yellow-and-black tape measure', 'truth/og-tape.jpg, truth/x-card-small.jpg');
  manual('F-012', 'THE SET: no warm figure at 0:13.2 / 0:14.0 / 0:14.6', 'film frames');
  manual('F-022', 'FAR bite: every HUMANOID glyph >= 60% visible; the bite on the shoulder', 'r1/hero-1440-t8.0s.jpg, juror/hero390-t12.jpg');
  manual('F-026', 'ACT and UALLY the same orange through the DOM-to-GL handover', 'motion/zz-near.png');
  manual('F-027', 'fast scroll from rest: no pop', 'motion/glout-seq.png');
  manual('F-029', 'phone sideways drag keeps the H1 inside the border', 'phone/p2-hero-lookdrag.jpg');
  manual('F-030', 'bay 05 lands without a black frame (no-JS part: nojs-video)', 'motion/land-seq.png');
  manual('F-032', 'perspective entrances: caption rule never covered, no fragments, even iris', 'motion/a101-25-caption.png, a11y-perf/vm-a101-40vh.jpg, motion/a103-iris-grid.png');
  manual('F-036', 'phone detail bubble opens in flow under the H2 and spec', 'phone/p6-a101-bubble-open.jpg');
  manual('F-037', 'A-100 tiles show stills, slot 05 never empty', 'plan-390-t1.2s.jpg, plan-390-t1.8s.jpg, plan-1440-t1.8s.jpg');
  manual('F-042', 'A–A marker centred on the chalk line ✕ (probe105.cjs)', 'stage-a-105-100vh-1440.jpg');
  manual('F-043', 'A-200: readable text on every frame; HOLD tag readable over >= 15vh', 'art/montage-a200-cloud-1440.jpg');
  manual('F-046', 'per-glyph occlusion gate (A5 freeze report)', 'pipeline gate report');
  manual('F-047', 'no light fringe round the helmet or pads', 'art/crop-a101-persp-halo.png, stage-a-103-060vh-1440.jpg');
  manual('F-048', 'tools graphite, no orange/red trade dress', 'truth/b41-drill.jpg, truth/b42-tool.jpg');
  manual('F-049', 'no glyph-like marks in det-n03 / b41', 'truth/n03-socket-text.jpg');
  manual('F-050', 'b40 course intact next to STRAIGHT COURSES', 'stage-a-101-000vh-1440.jpg, truth/b40-wall-t4.5.jpg');
  manual('F-058', 'THE SET disclosure readable at 390 wide, outside the bottom 20%', 'truth/set916-at-390.jpg');
  manual('F-070', 'no shadow wedge, no stray tick', 'hero-1440-t0.0s.jpg, hero-1440-t0.8s.jpg');
  manual('F-071', 'hint dimmed under the pulled V', 'hero-1440-t2.4s.jpg');
  manual('F-072', 'BUILD? clean orange (no puff haze)', 'motion/zoom-32-build.png');
  manual('F-073', 'deposit gone by t 3.6 s', 'hero-1440-t3.6s.jpg');
  manual('F-074', 'snap releases at 3.0 ± 0.1 s; rest UI by 6.5 s (real-time run)', '$S/artrev/hero.cjs log');
  manual('F-076', 'A-103 hold frame left edge on the 72 px spine', 'stage-a-103-060vh-1440.jpg');
  manual('F-077', 'PLAN 03 thumbnail >= 24 px clear of the detail circle', 'extra-stage-a-103-minus025vh-1440.jpg');
  manual('F-078', 'no spine line across the perspective films', 'a11y-perf/vm-a101-40vh.jpg');
  manual('F-079', 'north arrows read against the grid', 'art/1440-a-200-100vh.jpg');
  manual('F-080', 'A-101 bond drawn as masonry, no empty outlined cells', 'stage-a-101-000vh-1440.jpg');
  manual('F-086', '07 not painted over by the A-105 traces', 'stage-a-105-030vh-1440.jpg');
  manual('F-088', 'A-200 grid knocked out under the arrows and the arc', 'art/1440-a-200-100vh.jpg');
  manual('F-102', 'THE SET end card gives the site address or DATE · VENUE: HOLD', 'truth/set-sheet4.jpg');
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
  const needBuild = !base || want('nojs') || want('lint') || want('fixes');
  if (needBuild) {
    const b = ensureBuild(log);
    if (b.error) {
      results.meta.notes.push(`The production build failed, so the JS suites ran against the shared dev server (${DEV_URL}) and the no-JS suite could not run:\n\n\`\`\`\n${b.error.slice(-2500)}\n\`\`\``);
      suite('build').check('build', 'vite build + prerender (incl. the prerender copy lint) succeeds', false, b.error.slice(-2500));
      log(b.error);
      if (!base) base = DEV_URL;
    } else {
      const { check: bcheck } = suite('build');
      bcheck(
        'build',
        b.reused ? `existing prerendered build ${b.dir} (not rebuilt; pass --build only with a fresh build)` : 'production vite build + prerender (incl. the prerender copy lint) succeeds',
        true,
      );
      checkProduction(b.dir, bcheck);
      buildDir = b.dir;
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
  await run('fixes', () => runFixes(pw, browser, base, mods, axePath, buildDir));
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
