// t0's production build (the real page's config, plus this lab page as an extra input), for perf runs:
// npx vite build --config src/herolab/t0/vite.t0.config.mjs --mode preview --outDir <scratch>
import { resolve } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import base from "../../../vite.config";

export default defineConfig((env) =>
  mergeConfig(typeof base === "function" ? base(env) : base, {
    build: { rollupOptions: { input: { t0: resolve(import.meta.dirname, "dev.html") } } },
  }),
);
