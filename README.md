# Find Public APIs

A complete **Astro 7 static website**, with a redesigned landing page, searchable library, 2,112 API listings in 50 categories, 32 documentation-reviewed guides, and a browser-only request playground. No Python, database, server-side request proxy, or React/Vue runtime is required.

## Run locally

Use Node.js **22.12+** (Node 22 LTS or Node 24).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

The build imports the bundled catalog snapshots using Node and generates static pages into `dist/`. No provider APIs are called during builds.

## Cloudflare deployment through GitHub

The repository is ready for **Cloudflare Workers Builds with static assets**. Wrangler is pinned in `devDependencies` and the lockfile so Cloudflare uses the tested version. No GitHub Actions deployment workflow is needed: connect the repository in Cloudflare and Cloudflare deploys pushes to `main`.

### Recommended: Workers Git integration

1. In Cloudflare, open **Workers & Pages → Create application → Import a repository** (the label may appear as **Connect to Git**).
2. Connect GitHub and select **`radoslav1992/api-directory`**.
3. Set these values:

| Setting | Value |
| --- | --- |
| Worker/project name | `api-directory` — must match `wrangler.jsonc` |
| Production branch | `main` |
| Root directory | Repository root (`/`) |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy` |
| Node build variable | `NODE_VERSION=22` (22.12 or newer) |
| Site origin build variable | Optional. Defaults to `https://findpublicapis.com` |

Canonical URLs, the sitemap, and structured data point at `https://findpublicapis.com` unless `SITE_URL` says otherwise. Set `SITE_URL` only for a copy served from another origin (for example a staging workers.dev URL); add it to **build variables**, not just runtime variables. A bare hostname (`example.com`) is treated as `https://example.com`; anything else that is not a plain HTTPS origin stops the build with the rejected value in the error.

4. Save and deploy. Cloudflare installs dependencies from the lockfile, builds the Astro pages, validates the generated routes and indexing, then runs the pinned Wrangler to upload `dist/`.
5. Add `findpublicapis.com` under the Worker’s **Settings → Domains & Routes**. If you ever move to another domain, update the default in `astro.config.mjs` (or set `SITE_URL`) and rebuild: static metadata must be rebuilt when the origin changes.

`wrangler.jsonc` already declares `dist/` as the asset directory, enables the workers.dev route, enforces trailing-slash HTML URLs, and serves the real 404 page for missing routes. Do not add an SSR entry point, a Cloudflare Astro adapter, or SPA fallback.

Cloudflare’s own Git integration supplies deployment authorization. No API credentials, Cloudflare token in GitHub, D1 database, R2 bucket, or migrations are needed. API playground credentials are entered by visitors and never configured as deployment secrets.

### If you choose Cloudflare Pages instead

Choose **Pages → Connect to Git**, select the same repository and `main`, then use:

- Framework preset: **Astro**
- Build command: **`npm run build:cloudflare`**
- Build output directory: **`dist`**
- Root directory: repository root
- Build variables: **`NODE_VERSION=22`** (`SITE_URL` is optional, as above)
- No deploy command; Pages handles the upload.

The Workers Wrangler config is not a Pages Functions config. Pages uses the static output directory selected in its dashboard. Preview deployments also canonicalize to `https://findpublicapis.com`, which keeps search engines on the production domain.

### Deployment checks

```sh
npm ci
npm run build:cloudflare
npm run deploy:check
```

`deploy:check` validates the Wrangler configuration without publishing or requiring an API token. `npm run deploy` is the real publishing command and is run by Cloudflare after the build.

The generated output includes security headers, legacy URL redirects, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`. After public deployment, submit `/sitemap.xml` in Search Console.

## Example requests for community listings

`sources/examples.json` holds a drafted example GET request for community-listed APIs (keyed by slug). Drafts are not published on their own: `npm run check:examples` calls each one and records the outcome in `sources/example-checks.json`, and the import step only adds an example to a page when its latest check passed for that exact URL.

A check passes when the endpoint answers 2xx with data (not an HTML page), or, for examples that use the `YOUR_API_KEY` placeholder, when it answers 401 (or 400/403 with an authentication error). Redirects fail, because the playground blocks them. The checker also records whether the provider sent CORS headers, which the page uses to say whether the browser playground should work.

Run the checker from a machine with normal internet access, then commit both files. Pass slugs to re-check only those: `npm run check:examples -- cat-facts-catfact-ninja`.

## Client-side API playground

- Editable HTTPS endpoint, HTTP method, query parameters, headers, and JSON/text bodies.
- No auth, bearer/OAuth access token, API key in header/query, and Basic authentication.
- GET/HEAD send no body; POST/PUT/PATCH/DELETE require explicit acknowledgement.
- Direct browser `fetch` only: CORS enabled, automatic cookies omitted, no referrer, no redirect following, no backend proxy.
- Credentials are kept in page memory, never local/session storage or URL state. Leaving/reloading clears the editor.
- Code previews hide authentication, header/query values, and request bodies by default. Explicitly reveal values before copying a credential-bearing snippet.
- Response status, duration, byte count, exposed headers, JSON tree, formatted JSON, table, raw text, and download.
- Cancellation, 30-second timeout, 1 MB request body limit, 2 MB response limit. Tree/table display limits keep large results usable; raw data and downloads preserve the complete response within the size limit.
- Remote HTML is displayed as text, never executed. No third-party scripts or analytics run on the playground.

**Browser limitations:** Providers must permit CORS for the exact origin, method, and headers. A network error cannot reliably distinguish CORS from DNS/TLS/offline failures or blocked redirects. A failed fetch does not prove the request had no effect. Browser-controlled headers such as User-Agent and Cookie cannot be configured here. OAuth authorization/refresh flows are not implemented; paste a provider-issued, limited test access token. The receiving provider and browser extensions remain outside the directory's control.

## SEO and AI discovery

Astro prerenders the full page content. Page-specific titles/descriptions, canonical URLs, Open Graph images, WebSite/Organization/CollectionPage/TechArticle/Breadcrumb structured data, visible source links and review dates, integration guides, sitemap and robots are included. `/llms.txt` and reviewed guides at `/apis/<slug>.md` provide an optional machine-readable summary; they do not guarantee citations or rankings.

The 2,080 unreviewed detail pages retain `noindex,follow` and stay outside the sitemap. Search/filter query URLs canonicalize to their static page. Nothing fabricates provider reviews, uptime measurements, popularity rankings, or freshness dates. The preserved provider documentation review date is **16 September 2026**, while the new educational guides are dated **2 October 2026**.

## Structure

- `src/pages/`: landing, static library/category/collection pagination, API pages, guides, playground, sitemap, robots, Markdown endpoints.
- `src/components/`: cards, directory, pagination, and playground.
- `src/layouts/Base.astro`: shared navigation/footer and page metadata.
- `src/styles/global.css`: responsive design system with reduced-motion support.
- `src/scripts/`: browser library and playground behavior.
- `src/lib/`: shared catalog metadata, educational content, pure filtering and request helpers.
- `curated.json`: reviewed API source content.
- `sources/`: attributed catalog snapshots, import config, licenses and historical link-check results.
- `scripts/import-catalogs.mjs`: Node importer and deduplication; generated data stays out of Git.
- `tests/`: request safety, response limits, and filtering tests.

## Validation

```sh
npm test
npm run build
npm run verify
```

`verify` checks all generated HTML, internal link targets, schema JSON, single main headings, duplicate IDs, API counts, and sitemap/noindex consistency. Live third-party API availability is not part of these checks.

## Sources and updates

Community data is reused from [public-apis/public-apis](https://github.com/public-apis/public-apis) and [public-api-lists/public-api-lists](https://github.com/public-api-lists/public-api-lists) under their preserved MIT licenses. License files remain in `sources/` and `public/licenses/`. Catalog licenses do not grant rights to provider data or content.

Edit `curated.json` for reviewed guides, or deliberately update the snapshots in `sources/`, then rebuild. The saved link checks are partial; most were inconclusive. Confirm provider documentation before upgrading a listing's review status. Rebuilding does not imply a fresh provider review.
