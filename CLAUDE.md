# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npx emdash secrets generate --write .env   # first run only
npm run dev        # site at http://localhost:4321, admin at /_emdash/admin/
npm run build
```

## Architecture

**Astro (server output) on Cloudflare Workers + EmDash CMS (D1 + R2) + React islands.** Pushes to `master` deploy to production via Workers Builds.

- `seed/seed.json` — EmDash content model (`projects`, `posts`, `profile`) and starter content
- `src/live.config.ts` — connects EmDash to Astro live collections
- `src/lib/emdashContent.ts` — server-only queries; maps EmDash entries to UI types
- `src/components/PortfolioPage.astro` — loads content per request and mounts the React app
- `src/components/portfolio/PortfolioApp.tsx` — main React UI
- `plugins/contact-inbox/` — native EmDash plugin: public `submit` route for the contact form, admin-only `list`/`update` routes, and the Contact inbox admin page (`src/admin/index.tsx`)
- `wrangler.jsonc` / `src/worker.ts` — Worker config and entry (D1 `DB`, R2 `MEDIA`, KV `SESSION`, cron)
- `src/middleware.ts` — guards the setup wizard while the `SETUP_KEY` secret exists
- Local dev data lives in `.wrangler/state` (gitignored)

Use the EmDash docs (https://docs.emdashcms.com/llms.txt) rather than guessing APIs.
