# Jon Colon Portfolio

An Astro + React portfolio with projects, a devlog, and a contact page. Content is managed in [EmDash](https://emdashcms.com) at `/_emdash/admin/`, and every page reads the latest published content on each request.

## Local development

Requires Node.js 22.23.4 or newer.

```bash
npm ci
npx emdash secrets generate --write .env   # first run only; keep .env private
npm run dev
```

Open http://localhost:4321/_emdash/admin/ to finish setup (site details, admin account, passkey). `/admin` redirects there.

### What is editable

| Collection | Drives |
| --- | --- |
| Projects | `/web`, `/games`, home "Selected work" (kind, order, thumbnail, links, body) |
| Devlog | `/devlog`, home teaser |
| Profile (single entry) | Hero badges and typing phrases, About intro/facts/portrait, home CTA, resume rows, skills, resume PDF |

### Contact inbox

The contact form posts to a local EmDash plugin (`plugins/contact-inbox`). Messages appear in the admin under **Contact inbox** (also a dashboard card), each with an email button, **Mark complete**, and **Archive**/**Restore**. The form is validated server-side, has a spam honeypot, and is rate-limited to 5 messages per hour per email and per IP address.

The model and starter content live in `seed/seed.json`; a fresh database gets them from the setup wizard.

## Deployment (Cloudflare Workers)

The site runs on the existing `portfolio` Worker (joncolon.dev, www.joncolon.dev, jonathencolon.com, www.jonathencolon.com). Workers Builds deploys every push to `master` with `npm run build` and `npx wrangler deploy`.

| Binding | Resource | Holds |
| --- | --- | --- |
| `DB` | D1 `portfolio-emdash` | EmDash content, settings, contact inbox |
| `MEDIA` | R2 `portfolio-media` | Uploaded media (thumbnails, post images, resume PDF) |
| `SESSION` | KV `portfolio-session` | Admin sign-in sessions |
| `EMDASH_SITE_URL` | var | `https://joncolon.dev` (passkeys are bound to this origin) |

Secrets (set with `wrangler secret put`): `SETUP_KEY` guards the one-time setup wizard (see `src/middleware.ts`); delete it once the admin account exists. Set `EMDASH_ENCRYPTION_KEY` before saving any plugin secret.

`npm run dev` runs on the Workers runtime with local D1/R2 in `.wrangler/state`. `npm run deploy:dry-run` builds and validates the Worker without publishing.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Astro + EmDash development server |
| `npm run build` | Build the Worker into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run deploy:dry-run` | Build and validate the Worker without publishing |
| `npm run deploy` | Build and deploy from this machine (normally Workers Builds does this) |
