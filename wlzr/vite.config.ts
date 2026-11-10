import { defineConfig } from "vite";

// Relative base, so the same build runs at wlzr.tv/ or under any sub-path (a preview at sons.llc/wlzr/).
export default defineConfig({
  base: "./",
  server: { port: 5201 },
  preview: { port: 5201 },
});
