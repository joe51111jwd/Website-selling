// The site's one public origin, used for every absolute URL a build writes (canonical, og:url, JSON-LD, the
// sitemap, robots.txt, llms.txt). In order: SITE_URL if it is set; else Vercel's production domain for the
// project (VERCEL_PROJECT_PRODUCTION_URL, set at build time to the shortest production domain, so it becomes
// scalingupsidedown.com by itself once that domain is attached); else the project's vercel.app address.
// No trailing slash.
export function siteUrl(env = process.env) {
  const set = (v) => (typeof v === "string" ? v.trim() : "");
  const vercel = set(env.VERCEL_PROJECT_PRODUCTION_URL);
  const origin =
    set(env.SITE_URL) ||
    (vercel ? (/^https?:\/\//.test(vercel) ? vercel : `https://${vercel}`) : "") ||
    "https://scaling-up-side-down.vercel.app";
  return origin.replace(/\/+$/, "");
}
