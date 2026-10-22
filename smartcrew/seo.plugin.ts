// Builds the SEO library (src/seo) into static pages: /<slug>/index.html for every page, a hub per
// kind (/industries/, /compare/, /vs/, /features/, /guides/), sitemap.xml, robots.txt and llms.txt.
// Preview builds (`--mode preview`) mark every page noindex, like the rest of the preview site.
// In `vite dev` the same pages are served from memory, so they can be checked at localhost.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { PAGES } from "./src/seo/pages";
import { HUBS, llms, renderHub, renderPage, sitemap } from "./src/seo/render";

const root = import.meta.dirname;
const read = (p: string) => readFileSync(resolve(root, p));

/** tokens + fonts + the template's own sheet, as one file (the @imports of legal.css, flattened) */
function css() {
  return ["src/styles/fonts.css", "src/styles/tokens.css", "src/seo/seo.css"].map((p) => read(p).toString()).join("\n");
}

function check() {
  const seen = new Set<string>();
  for (const p of PAGES) {
    if (seen.has(p.slug)) throw new Error(`seo: two pages at /${p.slug}/`);
    seen.add(p.slug);
    for (const r of p.related ?? []) if (!PAGES.some((q) => q.slug === r)) console.warn(`seo: /${p.slug}/ relates to /${r}/, which isn't written yet (left out)`);
  }
}

function build(noindex: boolean, cssHref: string) {
  check();
  const lib = { pages: PAGES };
  const files: Record<string, string> = {};
  for (const p of PAGES) files[`${p.slug}/index.html`] = renderPage(lib, p, { noindex, css: cssHref });
  for (const h of HUBS) if (PAGES.some((p) => p.kind === h.kind)) files[`${h.slug}/index.html`] = renderHub(lib, h.kind, { noindex, css: cssHref });
  files["sitemap.xml"] = sitemap(lib);
  files["llms.txt"] = llms(lib);
  files["robots.txt"] = `User-agent: *\nAllow: /\n\nSitemap: https://www.smartcrewhq.com/sitemap.xml\n`;
  return files;
}

export function seoPages(): Plugin {
  let noindex = false;
  return {
    name: "smartcrew-seo",
    configResolved(c) {
      noindex = c.mode === "preview" || c.mode === "watermark";
    },
    generateBundle() {
      const sheet = css();
      const hash = createHash("sha256").update(sheet).digest("hex").slice(0, 10);
      const href = `/seo-assets/library-${hash}.css`;
      this.emitFile({ type: "asset", fileName: href.slice(1), source: sheet });
      this.emitFile({ type: "asset", fileName: "seo-assets/smartcrew-logo.webp", source: read("src/brand/assets/smartcrew-logo.webp") });
      for (const [fileName, source] of Object.entries(build(noindex, href))) this.emitFile({ type: "asset", fileName, source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "/").split("?")[0];
        if (url === "/seo-assets/library.css") {
          res.setHeader("Content-Type", "text/css");
          return res.end(css());
        }
        if (url === "/seo-assets/smartcrew-logo.webp") {
          res.setHeader("Content-Type", "image/webp");
          return res.end(read("src/brand/assets/smartcrew-logo.webp"));
        }
        const key = url === "/" ? "" : url.replace(/^\//, "").replace(/\/?$/, url.endsWith(".xml") || url.endsWith(".txt") ? "" : "/index.html");
        if (!key) return next();
        let files: Record<string, string>;
        try {
          files = build(false, "/seo-assets/library.css");
        } catch (e) {
          return next(e);
        }
        if (!(key in files)) return next();
        res.setHeader("Content-Type", key.endsWith(".xml") ? "application/xml" : key.endsWith(".txt") ? "text/plain" : "text/html");
        res.end(files[key]);
      });
    },
  };
}
