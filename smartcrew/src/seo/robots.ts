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

/** Public robots.txt: allow everyone, and name the search and AI crawlers so a later blanket rule cannot block them. */
export function productionRobots(): string {
  return `User-agent: *
Allow: /

# Search and AI answer crawlers, allowed by name so a later blanket rule cannot block them by accident.
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Googlebot
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: meta-webindexer
User-agent: Bingbot
User-agent: DuckAssistBot
User-agent: MistralAI-User
Allow: /

Sitemap: https://www.smartcrewhq.com/sitemap.xml
`;
}

export function previewRobots(): string {
  return "User-agent: *\nDisallow: /\n";
}

export function robotsForHost(host: string): string {
  return isVercelPreviewHost(host) ? previewRobots() : productionRobots();
}
