import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { seoPages } from "./seo.plugin";

// Preview builds (`--mode preview`, `--mode watermark`) ask search engines not to
// index; the watermark build also carries the watermark.
const noindex: Plugin = {
  name: "noindex",
  transformIndexHtml: (html) => html.replace("</head>", '    <meta name="robots" content="noindex, nofollow" />\n  </head>'),
};

// The pain picker asks /api/match-pain (api/match-pain.ts, a Vercel function) only in a build where
// that function can answer: on Vercel, with OPENROUTER_API_KEY in the environment. Elsewhere (vite
// dev, vite preview, a static host) there's no function and the call would 404, so the picker keeps
// to its own keyword match. Only a yes/no is baked into the page, never the key. VITE_PAIN_AI=1 or
// =0 decides it by hand (1 to try the call against a stub).
const painAi = process.env.VITE_PAIN_AI ?? (process.env.VERCEL && process.env.OPENROUTER_API_KEY ? "1" : "0");

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), seoPages(), ...(mode === "watermark" || mode === "preview" ? [noindex] : [])],
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
