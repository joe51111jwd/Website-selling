import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  // three.js, fiber and drei land in one ~1 MB vendor chunk (≈265 kB gzipped); that's expected
  build: { chunkSizeWarningLimit: 1100 },
});
