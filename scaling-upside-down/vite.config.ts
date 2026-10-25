import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const onVercel = Boolean((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.VERCEL);

// absolute paths on Vercel (so /appendix works), relative everywhere else (previews, artifact hosting)
export default defineConfig({
  base: onVercel ? "/" : "./",
  plugins: [react()],
});
