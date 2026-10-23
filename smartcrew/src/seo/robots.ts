// robots.txt cannot be one static file: the same deployment is served on *.vercel.app and,
// after the domain switch, on smartcrewhq.com. preview hosts get Disallow. Every other host,
// including smartcrewhq.com and www.smartcrewhq.com, gets the public rules.
// The gate is the same hostname test as the inline meta script (src/lib/preview-robots.ts)
// and the X-Robots-Tag host condition in vercel.json.

/** True for vercel.app and any subdomain of it. False for smartcrewhq.com and www.smartcrewhq.com. */
export function isVercelPreviewHost(host: string): boolean {
  const hostname = host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  return /(^|\.)vercel\.app$/i.test(hostname);
}

/** Public robots.txt. The preview deploy branch's text; the SEO branch keeps its named-crawler list. */
export function productionRobots(): string {
  return "User-agent: *\nAllow: /\n\nSitemap: https://www.smartcrewhq.com/sitemap.xml\n";
}

export function previewRobots(): string {
  return "User-agent: *\nDisallow: /\n";
}

export function robotsForHost(host: string): string {
  return isVercelPreviewHost(host) ? previewRobots() : productionRobots();
}
