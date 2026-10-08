// Site configuration. The ONE place the contact address lives (truth rule 15).
// Owner: A1. Imported by the app, the prerender (scripts/prerender.mjs) and vite.config.ts.

/** RFC 2606 placeholder. Never replace with an invented address. */
export const CONTACT_EMAIL = 'hello@example.com';

/** Plain mailto for the address itself (A-900 email link adds its own subject). */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

/**
 * Path (relative to the site root, no leading slash) of the og:image (R5, 1200 x 630 JPEG).
 * The prerender only emits og:image / twitter:image when this file exists in the
 * build output AND SITE_URL resolves, so the image URL is always absolute.
 */
export const OG_IMAGE_PATH = 'media/og/og-image.jpg';

type Env = Record<string, string | undefined>;

function normalise(url: string): string | null {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/\s]+/i.test(trimmed)) return null;
  return trimmed;
}

/**
 * SITE_URL resolution (brief 8.8): an explicit SITE_URL, else Netlify's URL,
 * else https:// + Vercel's VERCEL_PROJECT_PRODUCTION_URL. These are the deploy's
 * own addresses; we never invent a domain. Returns null when nothing resolves.
 */
export function resolveSiteUrl(env: Env): string | null {
  if (env.SITE_URL && env.SITE_URL.trim()) return normalise(env.SITE_URL);
  if (env.URL && env.URL.trim()) return normalise(env.URL);
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel && vercel.trim()) return normalise(`https://${vercel.trim().replace(/^https?:\/\//, '')}`);
  return null;
}

declare const __HRCG_SITE_URL__: string | null | undefined;

/** Resolved at build time by vite.config.ts (define). null in dev or when nothing resolves. */
export const SITE_URL: string | null =
  typeof __HRCG_SITE_URL__ !== 'undefined' ? (__HRCG_SITE_URL__ ?? null) : null;

/** Absolute URL for a root-relative path, or null when SITE_URL is unknown. */
export function absoluteUrl(path: string, base: string | null = SITE_URL): string | null {
  if (!base) return null;
  return `${base}/${path.replace(/^\/+/, '')}`;
}
