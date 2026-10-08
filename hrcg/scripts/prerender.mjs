// Prerender (brief 8.3a, 8.8, 8.9, 10.5). Owner: A1.
// Called by the hrcg-prerender plugin in vite.config.ts after the client build:
//   1. renders <App/> with react-dom/static (src/system/ssr.tsx, via Vite's ssrLoadModule)
//   2. writes it into <outDir>/index.html as <div id="root" data-prerendered>…</div>
//   3. FAILS the build on: a relative og:image / twitter:image / og:url / canonical; any copy-lint
//      violation in the HTML (src/system/lintRules.ts + src/content/lint-allow.json); a render
//      error (set HRCG_PRERENDER_LENIENT=1 to downgrade render errors to warnings while another
//      agent's sheet is broken); an inline script other than the head script
//   4. writes <outDir>/_headers with the CSP head-script hash (from public/_headers' placeholder)
//   5. robots.txt names the sitemap and sitemap.xml is written when SITE_URL resolves
//
// Standalone: node scripts/prerender.mjs [outDir]  (after `vite build` with HRCG_SKIP_PRERENDER=1)

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HASH_PLACEHOLDER = "'sha256-HEAD_SCRIPT_HASH'";

function fail(msg) {
  const e = new Error(`[hrcg-prerender] ${msg}`);
  e.stack = e.message;
  throw e;
}

function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/.test(m[1])) continue;
    if (/type\s*=\s*"(application\/(ld\+)?json|importmap)"/i.test(m[1])) {
      out.push({ attrs: m[1], body: m[2], data: true });
      continue;
    }
    out.push({ attrs: m[1], body: m[2], data: false });
  }
  return out;
}

const sha256 = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

function checkAbsolute(html) {
  const checks = [
    [/<meta\s+property="og:image"\s+content="([^"]*)"/i, 'og:image'],
    [/<meta\s+name="twitter:image"\s+content="([^"]*)"/i, 'twitter:image'],
    [/<meta\s+property="og:url"\s+content="([^"]*)"/i, 'og:url'],
    [/<link\s+rel="canonical"\s+href="([^"]*)"/i, 'canonical'],
  ];
  for (const [re, name] of checks) {
    const m = html.match(re);
    if (m && !/^https?:\/\//i.test(m[1])) fail(`${name} must be an absolute URL, got "${m[1]}" (brief 8.8)`);
  }
}

export async function prerender({ root, outDir, siteUrl = null }) {
  const t0 = Date.now();
  const indexPath = resolve(outDir, 'index.html');
  if (!existsSync(indexPath)) fail(`no ${indexPath}; run the client build first`);
  const template = readFileSync(indexPath, 'utf8');
  if (!template.includes('<div id="root"></div>')) fail('index.html has no empty <div id="root"></div>');

  process.env.HRCG_PRERENDER_CHILD = '1';
  const { createServer } = await import('vite');
  const server = await createServer({
    root,
    configFile: resolve(root, 'vite.config.ts'),
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });

  let app;
  let errors;
  let lint;
  try {
    const ssr = await server.ssrLoadModule('/src/system/ssr.tsx');
    ({ html: app, errors } = await ssr.render());
    lint = { lintHtml: ssr.lintHtml };
  } finally {
    await server.close();
  }

  if (errors.length) {
    const msg = `render errors (the affected sheets were prerendered as placeholders):\n${errors.join('\n---\n')}`;
    if (process.env.HRCG_PRERENDER_LENIENT === '1') console.warn(`[hrcg-prerender] WARNING ${msg}`);
    else fail(`${msg}\nSet HRCG_PRERENDER_LENIENT=1 to build anyway.`);
  }

  const html = template.replace('<div id="root"></div>', `<div id="root" data-prerendered="">${app}</div>`);

  // ---- absolute URLs
  checkAbsolute(html);

  // ---- structure sanity
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) console.warn(`[hrcg-prerender] WARNING expected exactly one <h1>, found ${h1s}`);
  if (!/\sid="index"/.test(html)) console.warn('[hrcg-prerender] WARNING no element with id="index" (INDEX no-JS target; A-900 footer must render <InPageIndex/>)');
  for (const id of ['a-000', 'a-100', 'a-101', 'a-102', 'a-103', 'a-104', 'a-105', 'a-200', 'a-300', 'a-301', 'a-900']) {
    if (!html.includes(`id="${id}"`)) console.warn(`[hrcg-prerender] WARNING sheet anchor #${id} missing`);
  }

  // ---- copy lint on the final HTML
  const allow = JSON.parse(readFileSync(resolve(root, 'src/content/lint-allow.json'), 'utf8')).allow;
  const violations = lint.lintHtml(html, relative(root, indexPath), allow);
  if (violations.length) {
    fail(
      `copy lint failed on the prerendered HTML (brief 10.5):${violations
        .map((v) => `\n  ${v.message}\n    "${v.text}"`)
        .join('')}\nFix the copy, or add an exact-string exception with a reason to src/content/lint-allow.json (A1).`,
    );
  }

  // ---- CSP hash of the inline head script (the only inline script allowed)
  const scripts = inlineScripts(html).filter((s) => !s.data);
  if (scripts.length !== 1) fail(`expected exactly 1 inline script (the head script), found ${scripts.length}`);
  const hashes = scripts.map((s) => sha256(s.body));
  const notFound = resolve(outDir, '404.html');
  if (existsSync(notFound)) {
    const extra = inlineScripts(readFileSync(notFound, 'utf8')).filter((s) => !s.data);
    for (const s of extra) hashes.push(sha256(s.body));
  }
  const headersSrc = resolve(root, 'public/_headers');
  if (existsSync(headersSrc)) {
    const tpl = readFileSync(headersSrc, 'utf8');
    if (!tpl.includes(HASH_PLACEHOLDER)) fail(`public/_headers has no ${HASH_PLACEHOLDER} placeholder`);
    writeFileSync(resolve(outDir, '_headers'), tpl.split(HASH_PLACEHOLDER).join([...new Set(hashes)].join(' ')));
  }

  // ---- robots + sitemap
  const robotsPath = resolve(outDir, 'robots.txt');
  if (siteUrl) {
    writeFileSync(
      resolve(outDir, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
    );
    if (existsSync(robotsPath)) {
      const robots = readFileSync(robotsPath, 'utf8').trimEnd();
      if (!/^Sitemap:/m.test(robots)) writeFileSync(robotsPath, `${robots}\nSitemap: ${siteUrl}/sitemap.xml\n`);
    }
  }

  writeFileSync(indexPath, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(
    `[hrcg-prerender] ${relative(root, indexPath)} ${kb} kB · CSP ${hashes[0]} · SITE_URL ${siteUrl ?? '(none: no absolute og tags)'} · ${Date.now() - t0} ms`,
  );
}

// standalone
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = resolve(process.argv[2] ?? resolve(root, 'dist'));
  // same order as src/content/config.ts resolveSiteUrl
  const e = process.env;
  const raw = e.SITE_URL?.trim() || e.URL?.trim() || (e.VERCEL_PROJECT_PRODUCTION_URL?.trim() ? `https://${e.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/^https?:\/\//, '')}` : '');
  const siteUrl = /^https?:\/\/[^/\s]+/i.test(raw) ? raw.replace(/\/+$/, '') : null;
  prerender({ root, outDir, siteUrl }).catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
