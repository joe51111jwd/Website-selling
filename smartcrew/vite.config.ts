import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Preview builds (`--mode preview`, `--mode watermark`) ask search engines not to
// index; the watermark build also carries the watermark.
const noindex: Plugin = {
  name: "noindex",
  transformIndexHtml: (html) => html.replace("</head>", '    <meta name="robots" content="noindex, nofollow" />\n  </head>'),
};

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), ...(mode === "watermark" || mode === "preview" ? [noindex] : [])],
  build: {
    // two pages: the product page, and the "book a call" page the trial form lands on
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        book: resolve(import.meta.dirname, "book/index.html"),
      },
    },
  },
}));
