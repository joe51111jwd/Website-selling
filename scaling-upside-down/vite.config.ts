import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// relative base so the build also works from a subfolder (previews, artifact hosting)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
