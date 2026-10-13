// t1's production build (the real page's config, plus this lab page as an extra input), for perf runs:
// npx vite build --config src/herolab/t1/vite.t1.config.mjs --mode preview --outDir <scratch>
import { resolve } from "node:path";
import { defineConfig, mergeConfig } from "vite";
import base from "../../../vite.config";

export default defineConfig((env) =>
  mergeConfig(typeof base === "function" ? base(env) : base, {
    build: { rollupOptions: { input: { t1: resolve(import.meta.dirname, "dev.html") } } },
  }),
);
