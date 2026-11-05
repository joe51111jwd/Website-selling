import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const SKIP = new Set(["public", "node_modules", "src", "masters", "tools", "dist"]);

/** Every index.html under the site root is a page (tools/pages.mjs writes them). */
function pages(dir = root, out: Record<string, string> = {}) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (!SKIP.has(name) && !name.startsWith(".")) pages(path, out);
    } else if (name === "index.html") {
      const rel = relative(root, dir);
      out[rel ? rel.split(sep).join("/") : "main"] = path;
    }
  }
  return out;
}

/** Drafts stay out of search: noindex unless built with LAUNCH=1 (npm run build:launch). */
const robots = (): Plugin => ({
  name: "robots",
  transformIndexHtml: (html) =>
    html.replace("<!--robots-->", process.env.LAUNCH ? "" : '<meta name="robots" content="noindex, nofollow" />'),
});

export default defineConfig({
  plugins: [robots()],
  build: { rollupOptions: { input: pages() } },
  server: { port: 5210 },
  preview: { port: 5210 },
});
