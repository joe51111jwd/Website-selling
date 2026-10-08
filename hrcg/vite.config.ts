import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // relative asset paths, so the build works from any folder or host
  base: "./",
  plugins: [react()],
  server: { port: 5300 },
  preview: { port: 5300 },
});
