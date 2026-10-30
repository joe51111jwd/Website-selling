import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Preload the display face so the H1 (the LCP element) never waits on CSS discovery.
function preloadDisplayFont(): Plugin {
  return {
    name: 'waterline-preload-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const file = Object.keys(ctx.bundle ?? {}).find((f) => /bricolage.*\.woff2$/.test(f));
        if (!file) return html;
        const tag = `<link rel="preload" as="font" type="font/woff2" href="./${file}" crossorigin>`;
        return html.replace('<meta name="viewport"', `${tag}\n    <meta name="viewport"`);
      },
    },
  };
}

// In the single-file build the favicon is inlined too, so dist-single/index.html stands alone.
function inlineFavicon(): Plugin {
  return {
    name: 'waterline-inline-favicon',
    apply: 'build',
    transformIndexHtml(html) {
      const svg = readFileSync(`${root}public/favicon.svg`, 'utf8');
      return html.replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    resolve: { alias: { '@fonts': `${root}node_modules/@fontsource-variable` } },
    plugins: [react(), ...(single ? [viteSingleFile(), inlineFavicon()] : [preloadDisplayFont()])],
    build: {
      target: 'es2020',
      outDir: single ? 'dist-single' : 'dist',
      copyPublicDir: !single,
      emptyOutDir: true,
    },
  };
});
