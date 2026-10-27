import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { siteUrl } from "./scripts/site.mjs";

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const onVercel = Boolean(env.VERCEL);

// index.html writes its absolute URLs (canonical, og:url, og:image, the JSON-LD ids) as %SITE_URL%; this fills
// in the one public origin that scripts/site.mjs resolves, the same one build-appendix.mjs uses. It runs before
// Vite's own HTML handling so og:image is already an absolute URL when Vite looks at it.
function siteOrigin(): Plugin {
  const site = siteUrl(env);
  // it lands inside attributes and JSON, so refuse anything that could break out of them
  if (!/^https?:\/\/[^\s"'<>\\]+$/.test(site)) throw new Error(`SITE_URL must be an origin like https://example.com, got ${JSON.stringify(site)}`);
  return {
    name: "susd-site-origin",
    transformIndexHtml: { order: "pre", handler: (html) => html.replaceAll("%SITE_URL%", site) },
  };
}

// absolute paths on Vercel (so /appendix works), relative everywhere else (previews, artifact hosting)
export default defineConfig({
  base: onVercel ? "/" : "./",
  plugins: [siteOrigin(), react()],
});
