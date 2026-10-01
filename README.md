# Jon Colon Portfolio

An Astro + React portfolio with projects, a devlog, a contact form, and a content admin dashboard at `/admin`. Convex provides live content, file storage, contact submissions, and password authentication. The frontend deploys to **Cloudflare Workers Static Assets**.

## Prerequisites

- Node.js **22.12.0 or newer** (a supported LTS release recommended)
- npm
- A [Convex](https://dashboard.convex.dev/) project
- A Cloudflare account for deployment

## Local development

```bash
npm ci
cp .env.example .env.local
```

Set `PUBLIC_CONVEX_URL` in `.env.local` to your Convex deployment's HTTP URL, such as `https://YOUR_DEPLOYMENT.convex.cloud`.

```bash
npm run convex:dev  # terminal 1: develop the Convex backend
npm run dev         # terminal 2: Astro at http://localhost:4321
```

Without `PUBLIC_CONVEX_URL`, the frontend uses its fallback mode; live content and the admin dashboard require Convex.

## Cloudflare Workers setup

Astro pre-renders all eight routes into `dist/`. [wrangler.jsonc](./wrangler.jsonc) tells Workers to serve those files. The `drop-trailing-slash` setting matches the frontend's URLs (`/web`, `/devlog`, `/admin`, etc.) and supports direct visits and refreshes. Unknown paths return HTTP 404.

### Connect the GitHub repository

In **Cloudflare → Workers & Pages**, create a Worker from the `Jonathen-Colon/Portfolio` GitHub repository. Use these build settings:

| Setting | Value |
| --- | --- |
| Worker name | `portfolio` (must match `name` in `wrangler.jsonc`) |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command (optional branch previews) | `npx wrangler preview` |
| Build variable | `PUBLIC_CONVEX_URL=https://YOUR_PRODUCTION_DEPLOYMENT.convex.cloud` |

Cloudflare installs dependencies using the committed `package-lock.json`. Use Node.js 22.12.0 or newer in the build environment; the default Workers Builds Node version meets this requirement. If you override it with `NODE_VERSION`, choose a supported LTS release.

For an existing Worker, connect the repository under **Settings → Build** and apply the same settings. If you choose a different Worker name, update `name` in `wrangler.jsonc` to match.

**Set `PUBLIC_CONVEX_URL` under Settings → Build → Build variables and secrets.** Astro embeds this public URL in the browser bundle at build time. Setting it only under Worker runtime Variables & Secrets will not configure the frontend. Rebuild and deploy after changing the URL. Branch preview builds also need this build variable; use a development Convex deployment if you want separate preview content.

After the first deployment, open the Worker's `workers.dev` URL. To use `joncolon.dev` or another domain, add a **Custom Domain** under the Worker's **Settings → Domains & Routes**.

### Deploy from your machine

Set `PUBLIC_CONVEX_URL` in `.env.local` or your shell, then run:

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` builds the frontend before uploading it. For external CI, configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in that CI's environment. Workers Builds manages its own Cloudflare authentication.

### Preview and validate locally

```bash
npm run preview:workers  # build, then serve with Wrangler at http://localhost:8787
npm run deploy:dry-run   # build and validate the Workers configuration without publishing
```

`npm run preview` remains available for Astro's own preview server.

## Convex production setup

Deploy the backend separately:

```bash
npx convex deploy
```

Use that production deployment's `.convex.cloud` URL for Cloudflare's `PUBLIC_CONVEX_URL`. Changing frontend hosting does not move the Convex backend.

Configure Convex Auth in the **Convex deployment's environment variables** using the [manual setup guide](https://labs.convex.dev/auth/setup/manual). The key generation helper is:

```bash
npm run generate:jwt-keys
```

Store its `JWT_PRIVATE_KEY` and `JWKS` output in Convex, along with the deployment's `CONVEX_SITE_URL` and your `ADMIN_EMAIL`. These backend credentials belong in Convex, and must never use a `PUBLIC_` prefix. Existing admins sign in at `/admin`; public sign-up is disabled in the current backend.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Astro development server |
| `npm run build` | Generate the static frontend in `dist/` |
| `npm run preview` | Preview with Astro |
| `npm run preview:workers` | Build and preview with the Workers runtime |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run deploy:dry-run` | Build and validate deployment without publishing |
| `npm run convex:dev` | Develop the Convex backend |
| `npm run generate:jwt-keys` | Generate Convex Auth keys |

See Cloudflare's [Astro guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) and [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) for more deployment options.
