import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// relative asset paths, so the build works from any folder or host
export default defineConfig({
  base: "./",
  plugins: [react()],
});
