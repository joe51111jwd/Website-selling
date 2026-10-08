// Vite + Vitest config. Owner: A1.
// - hrcgHtml: injects the SEO head (brief 8.8) and the inline head script (brief 8.3a) into
//   index.html, in dev and build, from the same sources the app uses.
// - hrcgPrerender: after the client build, scripts/prerender.mjs renders <App/> with
//   react-dom/static into dist/index.html, lints the HTML, checks absolute og:image URLs, and
//   writes the CSP head-script hash into dist/_headers. Skipped with HRCG_SKIP_PRERENDER=1.
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HEAD_SCRIPT } from './src/system/headScript';
import { SEO } from './src/content/copy/chrome';
import { resolveSiteUrl, absoluteUrl, OG_IMAGE_PATH } from './src/content/config';

const ROOT = __dirname;
const SITE_URL = resolveSiteUrl(process.env);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function headTags(): string {
  const tags = [
    `<script>${HEAD_SCRIPT}</script>`,
    `<title>${esc(SEO.title)}</title>`,
    `<meta name="description" content="${esc(SEO.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SEO.siteName)}" />`,
    `<meta property="og:title" content="${esc(SEO.title)}" />`,
    `<meta property="og:description" content="${esc(SEO.ogDescription)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(SEO.title)}" />`,
    `<meta name="twitter:description" content="${esc(SEO.ogDescription)}" />`,
  ];
  // Absolute URLs only (X needs them). Without a resolved SITE_URL they are omitted, never relative.
  if (SITE_URL) {
    tags.push(`<link rel="canonical" href="${esc(SITE_URL)}/" />`);
    tags.push(`<meta property="og:url" content="${esc(SITE_URL)}/" />`);
    const og = absoluteUrl(OG_IMAGE_PATH, SITE_URL);
    if (og && existsSync(resolve(ROOT, 'public', OG_IMAGE_PATH))) {
      tags.push(`<meta property="og:image" content="${esc(og)}" />`);
      tags.push(`<meta property="og:image:width" content="1200" />`);
      tags.push(`<meta property="og:image:height" content="630" />`);
      tags.push(`<meta property="og:image:alt" content="${esc(SEO.ogImageAlt)}" />`);
      tags.push(`<meta name="twitter:image" content="${esc(og)}" />`);
      tags.push(`<meta name="twitter:image:alt" content="${esc(SEO.ogImageAlt)}" />`);
    }
  }
  return tags.join('\n    ');
}

function hrcgHtml(): Plugin {
  return {
    name: 'hrcg-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const h1Font = existsSync(resolve(ROOT, 'public/fonts/BigShoulders-H1.woff2'))
          ? '<link rel="preload" href="/fonts/BigShoulders-H1.woff2" as="font" type="font/woff2" crossorigin />'
          : '';
        return html.replace('<!--hrcg:head-->', headTags()).replace('<!--hrcg:preload-h1-->', h1Font);
      },
    },
  };
}

function hrcgPrerender(): Plugin {
  let outDir = resolve(ROOT, 'dist');
  let isSsrBuild = false;
  return {
    name: 'hrcg-prerender',
    apply: 'build',
    enforce: 'post',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
      isSsrBuild = Boolean(c.build.ssr);
    },
    async closeBundle() {
      if (isSsrBuild || process.env.HRCG_SKIP_PRERENDER === '1') return;
      const mod = await import(/* @vite-ignore */ pathToFileURL(resolve(ROOT, 'scripts/prerender.mjs')).href);
      await mod.prerender({ root: ROOT, outDir, siteUrl: SITE_URL });
    },
  };
}

export default defineConfig({
  // relative asset paths, so the build works from any folder or host
  base: './',
  plugins: [react(), hrcgHtml(), hrcgPrerender()],
  define: {
    __HRCG_SITE_URL__: JSON.stringify(SITE_URL),
  },
  server: { port: 5300, host: '127.0.0.1' },
  preview: { port: 5300 },
  build: {
    target: 'es2022',
    // three is lazy (hero / section chunks); keep the shell lean
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    reporters: ['default'],
  },
});
