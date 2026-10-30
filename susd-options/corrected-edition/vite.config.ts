import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Preload the display face (Newsreader roman, latin, opsz+wght) so the H1 never waits on it.
function preloadDisplayFont(): Plugin {
  return {
    name: 'preload-display-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = Object.keys(ctx.bundle).filter((f) => /newsreader-latin-opsz-(normal|italic).*\.woff2$/.test(f));
        const tags = files
          .map((f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin>`)
          .join('\n    ');
        return html.replace('</title>', `</title>\n    ${tags}`);
      },
    },
  };
}

// Single-file build: the favicon goes inline too, so index.html is the only file needed.
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
    plugins: [react(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true }), inlineFavicon()] : [preloadDisplayFont()])],
    build: {
      target: 'es2020',
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      cssCodeSplit: !single,
      copyPublicDir: !single,
    },
  };
});
