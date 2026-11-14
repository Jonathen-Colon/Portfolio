// @ts-check
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';
import { contactInbox } from 'portfolio-contact-inbox';

// https://astro.build/config
// Server output on Cloudflare Workers: every request reads the latest published EmDash content
// from D1, and media from R2. `astro dev` uses local D1/R2 emulation (.wrangler/state).
// Tailwind v4 via @tailwindcss/vite (Vite 8 / Astro 7 no longer resolve @import "tailwindcss" through PostCSS).
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'DB' }),
      storage: r2({ binding: 'MEDIA' }),
      // Contact form submissions + the "Contact inbox" admin page (plugins/contact-inbox).
      plugins: [contactInbox()],
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
