// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Used by `Astro.site` to build absolute URLs for canonical + OG/Twitter
  // meta tags. Keep in sync with the production domain.
  site: 'https://gpuente.me',
  integrations: [react()]
});