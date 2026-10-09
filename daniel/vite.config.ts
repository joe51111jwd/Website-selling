import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // absolute paths: the site has deep routes like /work/atlas
  base: "/",
  plugins: [react()],
  build: {
    // three.js alone is ~600 kB; it gets its own long-cached chunk
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "three", test: /node_modules[\\/]three[\\/]/ },
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "motion", test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils|lenis)[\\/]/ },
          ],
        },
      },
    },
  },
});
