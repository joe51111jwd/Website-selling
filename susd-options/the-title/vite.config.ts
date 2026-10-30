import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Preload the one display font (the hashed woff2) in the normal build.
// The single-file build inlines the font into the CSS, so it needs no preload.
function preloadFont(): Plugin {
  return {
    name: 'preload-archivo',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /archivo-latin-wdth-normal.*\.woff2$/.test(f));
        if (!font) return html;
        return html.replace(
          '</title>',
          `</title>\n    <link rel="preload" href="./${font}" as="font" type="font/woff2" crossorigin>`,
        );
      },
    },
  };
}

// The single-file build carries the favicon inline too, so the one HTML file needs nothing else.
function inlineFavicon(): Plugin {
  return {
    name: 'inline-favicon',
    apply: 'build',
    transformIndexHtml(html) {
      const svg = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8');
      return html.replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile(), inlineFavicon()] : [preloadFont()])],
    publicDir: single ? false : 'public',
    build: {
      target: 'es2020',
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
    },
  };
});
