// Builds the SEO library (src/seo) into static pages: /<slug>/index.html for every page, a hub per
// kind (/industries/, /compare/, /vs/, /features/, /guides/), sitemap.xml, robots.txt and llms.txt.
// Pages are indexable in every build mode. *.vercel.app is noindex by request host (the inline
// script in render.ts, X-Robots-Tag in vercel.json, and robots.txt from proxy.ts). In `vite dev`
// the same pages are served from memory, and /robots.txt follows the request Host.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { pxToRemCss } from "./px-rem.postcss";
import { PAGES } from "./src/seo/pages";
import { HUBS, llms, renderHub, renderPage, sitemap } from "./src/seo/render";
import { productionRobots, robotsForHost } from "./src/seo/robots";

const root = import.meta.dirname;
const read = (p: string) => readFileSync(resolve(root, p));

/** tokens + fonts + the template's own sheet, as one file (the @imports of legal.css, flattened), in rem like the rest of the site */
function css() {
  return pxToRemCss(["src/styles/fonts.css", "src/styles/tokens.css", "src/seo/seo.css"].map((p) => read(p).toString()).join("\n"));
}

function check() {
  const seen = new Set<string>();
  for (const p of PAGES) {
    if (seen.has(p.slug)) throw new Error(`seo: two pages at /${p.slug}/`);
    seen.add(p.slug);
    for (const r of p.related ?? []) if (!PAGES.some((q) => q.slug === r)) console.warn(`seo: /${p.slug}/ relates to /${r}/, which isn't written yet (left out)`);
  }
}

function build(cssHref: string) {
  check();
  const lib = { pages: PAGES };
  const files: Record<string, string> = {};
  for (const p of PAGES) files[`${p.slug}/index.html`] = renderPage(lib, p, { css: cssHref });
  for (const h of HUBS) if (PAGES.some((p) => p.kind === h.kind)) files[`${h.slug}/index.html`] = renderHub(lib, h.kind, { css: cssHref });
  files["sitemap.xml"] = sitemap(lib);
  files["llms.txt"] = llms(lib);
  // Fallback if proxy.ts does not run. On Vercel, proxy.ts replaces this per host.
  files["robots.txt"] = productionRobots();
  return files;
}

function hostOf(req: { headers: { host?: string | string[] } }): string {
  const host = req.headers.host;
  return Array.isArray(host) ? (host[0] ?? "") : (host ?? "");
}

export function seoPages(): Plugin {
  return {
    name: "smartcrew-seo",
    generateBundle() {
      const sheet = css();
      const hash = createHash("sha256").update(sheet).digest("hex").slice(0, 10);
      const href = `/seo-assets/library-${hash}.css`;
      this.emitFile({ type: "asset", fileName: href.slice(1), source: sheet });
      this.emitFile({ type: "asset", fileName: "seo-assets/smartcrew-logo.webp", source: read("src/brand/assets/smartcrew-logo.webp") });
      for (const [fileName, source] of Object.entries(build(href))) this.emitFile({ type: "asset", fileName, source });
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
        if (key === "robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
          res.setHeader("Vary", "Host");
          return res.end(robotsForHost(hostOf(req)));
        }
        let files: Record<string, string>;
        try {
          files = build("/seo-assets/library.css");
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
