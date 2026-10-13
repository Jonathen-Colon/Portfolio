// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Tailwind v4 via @tailwindcss/vite (Vite 8 / Astro 7 no longer resolve @import "tailwindcss" through PostCSS).
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
