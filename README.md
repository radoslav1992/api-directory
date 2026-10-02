# Endpoint — Astro API Directory

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

## Cloudflare deployment

### Cloudflare Pages (Git integration)

- Repository: `radoslav1992/api-directory`
- Production branch: `main`
- Framework preset: **Astro**
- Build command: **`npm run build`**
- Build output directory: **`dist`**
- Set build environment variable **`NODE_VERSION=22`** (22.12 or newer).
- Set build environment variable **`SITE_URL=https://your-final-domain.com`**.

The existing Python build command must be replaced. No API credentials, D1 database, R2 bucket, or Cloudflare Astro adapter are required for this static app.

### Cloudflare Workers with static assets

The included `wrangler.jsonc` config serves `dist/` with trailing-slash HTML routing and a real 404 page. In Workers Builds, use `npm run build` for the build and `npx wrangler deploy` for deployment. Configure the same Node and `SITE_URL` build variables above. Wrangler is a deployment tool; it is not an app runtime dependency.

`public/_headers` provides response security headers on compatible static hosts. `public/_redirects` retains legacy pagination and license URLs. Legacy `/page/N/` paths also have static redirect pages for other hosts.

The default site origin remains the previous Sites URL until `SITE_URL` is set. Use an HTTPS origin with no path. Attach the chosen custom domain in Cloudflare separately and submit `/sitemap.xml` in Search Console after public deployment. This repository update does not redeploy the original Sites-hosted copy.

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
