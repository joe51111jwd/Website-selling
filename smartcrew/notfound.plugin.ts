// The 404 page: dist/404.html, which Vercel serves, with a 404 status, for any address that doesn't
// exist (James, Oct 23: "we need a better 404 page"). One self-contained file (fonts, tokens and the
// page's sheet inlined; the logo and fonts by absolute path, since it is served at any depth), the
// classic look, no script. The links to the library hubs are only written for hubs that have pages.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { PAGES } from "./src/seo/pages";
import { HUBS } from "./src/seo/render";

const root = import.meta.dirname;
const read = (p: string) => readFileSync(resolve(root, p));
const LOGO = "/notfound-assets/smartcrew-logo.webp";

const hubExists = (slug: string) => HUBS.some((h) => h.slug === slug && PAGES.some((p) => p.kind === h.kind));

function links() {
  const all = [
    { href: "/", name: "Home", line: "The SmartCrew product page." },
    { href: "/demo/", name: "Watch the demo", line: "Andrew walks you through the app." },
    { href: "/book/", name: "Book a call", line: "Pick a time with Andrew." },
    ...(hubExists("features") ? [{ href: "/features/", name: "Features", line: "What SmartCrew does, one feature at a time." }] : []),
    ...(hubExists("compare") ? [{ href: "/compare/", name: "Compare", line: "SmartCrew next to the software you may use now." }] : []),
  ];
  return all.map((l) => `<li><a href="${l.href}"><b>${l.name}</b><span>${l.line}</span></a></li>`).join("\n    ");
}

function page(css: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Page not found · SmartCrew</title>
<meta name="robots" content="noindex" />
<meta name="theme-color" content="#FBF8F4" />
<link rel="icon" type="image/svg+xml" href="/brand/mark.svg" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/special-gothic-var.latin.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/finlandica-text-var.latin.woff2" />
<style>${css}</style>
</head>
<body>
<header class="bar"><a class="home" href="/"><img src="${LOGO}" width="601" height="110" alt="SmartCrew home" /></a></header>
<main>
  <p class="code" aria-hidden="true">404</p>
  <p class="eyebrow">Page not found</p>
  <h1>We can’t find that page.</h1>
  <p class="sub">The link may be old, or the address may have a typo. Start with SmartCrew, or pick one of these.</p>
  <a class="btn" href="/?try=404">Try SmartCrew</a>
  <p class="or">Or go to</p>
  <ul class="links">
    ${links()}
  </ul>
</main>
</body>
</html>
`;
}

export function notFoundPage(): Plugin {
  return {
    name: "smartcrew-404",
    generateBundle() {
      const css = ["src/styles/fonts.css", "src/styles/tokens.css", "src/notfound/notfound.css"].map((p) => read(p).toString()).join("\n");
      this.emitFile({ type: "asset", fileName: LOGO.slice(1), source: read("src/brand/assets/smartcrew-logo.webp") });
      this.emitFile({ type: "asset", fileName: "404.html", source: page(css) });
    },
  };
}
