import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// In the single-file build every font is inlined into the CSS, so the separate
// <link rel="preload"> would only duplicate it. Drop it there.
// The favicon is inlined too, so dist-single/index.html needs no other file.
const singleHtml = (): Plugin => ({
  name: 'single-html',
  transformIndexHtml: (html) => {
    const svg = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8').trim();
    return html
      .replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>/g, '')
      .replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`);
  },
});

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile(), singleHtml()] : [])],
    publicDir: single ? false : 'public',
    build: {
      target: 'es2020',
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
    },
  };
});
