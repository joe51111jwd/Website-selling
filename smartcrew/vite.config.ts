import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { seoPages } from "./seo.plugin";
import { previewRobotsSnippet } from "./src/lib/preview-robots";
import { trackingSnippets } from "./src/lib/tracking-snippet";
import { homeHeadTags } from "./src/seo/entity";

const homeHtml = resolve(import.meta.dirname, "index.html");

// Home, /book, the legal pages (transformIndexHtml) and /notes (copied from public/, patched after emit).
// SEO pages get the same blocks from src/seo/render.ts. Noindex is not baked in: one build is served
// on the preview and, after DNS, on the real domain. See src/lib/preview-robots.ts.
const pages: Plugin = {
  name: "smartcrew-pages",
  transformIndexHtml: {
    order: "pre",
    handler(html, ctx) {
      return injectPage(html, ctx.filename);
    },
  },
  writeBundle(options) {
    if (!options.dir) return;
    const notes = resolve(options.dir, "notes/index.html");
    if (!existsSync(notes)) return;
    writeFileSync(notes, injectPage(readFileSync(notes, "utf8"), notes));
  },
};

function injectPage(html: string, filename: string) {
  let out = html;
  if (resolve(filename) === homeHtml && !out.includes('rel="canonical"')) {
    out = out.replace("</head>", `${homeHeadTags()}\n</head>`);
  }
  if (!out.includes("sc-preview-robots")) out = out.replace("</head>", `${previewRobotsSnippet()}\n</head>`);
  if (!out.includes("cdn.mouseflow.com/projects/")) {
    const block = trackingSnippets();
    if (block) out = out.replace("</head>", `${block}\n</head>`);
  }
  return out;
}

// The pain picker asks /api/match-pain (api/match-pain.ts, a Vercel function) only in a build where
// that function can answer: on Vercel, with OPENROUTER_API_KEY in the environment. Elsewhere (vite
// dev, vite preview, a static host) there's no function and the call would 404, so the picker keeps
// to its own keyword match. Only a yes/no is baked into the page, never the key. VITE_PAIN_AI=1 or
// =0 decides it by hand (1 to try the call against a stub).
const painAi = process.env.VITE_PAIN_AI ?? (process.env.VERCEL && process.env.OPENROUTER_API_KEY ? "1" : "0");

export default defineConfig(() => ({
  base: "./",
  plugins: [react(), pages, seoPages()],
  define: { "import.meta.env.VITE_PAIN_AI": JSON.stringify(painAi) },
  build: {
    // the product page, the "book a call" page the trial form lands on, and the two legal pages
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        book: resolve(import.meta.dirname, "book/index.html"),
        // Andrew's legal pages, kept at smartcrewhq.com's addresses (src/legal/legal.css)
        privacy: resolve(import.meta.dirname, "privacy-policy/index.html"),
        terms: resolve(import.meta.dirname, "terms-of-service/index.html"),
      },
    },
  },
}));
