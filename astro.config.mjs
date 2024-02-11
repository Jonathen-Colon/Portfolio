import { defineConfig } from 'astro/config';

// import cloudflare from "@astrojs/cloudflare";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone"
  })
} // output: "server",
// adapter: cloudflare()
);