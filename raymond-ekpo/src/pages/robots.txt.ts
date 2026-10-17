import type { APIRoute } from 'astro';
import { glass } from '../theme';

// The glass build is an alternative design for review, so search engines are kept off it
const rules = glass ? 'Disallow: /' : 'Allow: /';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\n${rules}\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
