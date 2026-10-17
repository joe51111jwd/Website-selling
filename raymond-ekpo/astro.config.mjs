import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/site.config.ts';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || site.url,
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: { format: 'directory' },
});
