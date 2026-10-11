import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Preview builds (`--mode watermark`) carry the watermark and ask search engines not to index.
const noindex: Plugin = {
  name: "noindex",
  transformIndexHtml: (html) => html.replace("</head>", '    <meta name="robots" content="noindex, nofollow" />\n  </head>'),
};

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), ...(mode === "watermark" ? [noindex] : [])],
  // three.js, fiber and drei land in one ~1 MB vendor chunk (≈265 kB gzipped); that's expected
  build: { chunkSizeWarningLimit: 1100 },
}));
