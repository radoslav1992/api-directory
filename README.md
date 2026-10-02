# Endpoint — API Directory

Searchable static API directory with 2,112 listings across 50 categories, including 32 documentation-reviewed guides. Includes Radio Browser, provider links, access filters, category pages, pagination, and copyable examples in reviewed guides.

## Build and preview

Requires Python 3.12 or newer. No third-party Python packages or Node dependencies are needed.

```sh
python3 build.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. The build regenerates the catalog from bundled source snapshots and writes the complete website to `dist/`.

## Hosting

Deploy the generated `dist/` directory to a static host. For a Git-connected build, use:

- Build command: `python3 build.py`
- Output directory: `dist`
- Python: 3.12 or newer

Set `SITE_URL` to the final HTTPS origin before building so canonical URLs, structured data, robots.txt and sitemap.xml reference the correct domain:

```sh
SITE_URL=https://your-domain.com python3 build.py
```

Without this variable the original Sites origin is used. Domain DNS and public access must be configured separately at your hosting provider. This repository does not configure automatic deployment.

## Project layout

- `build.py`: static HTML, SEO metadata, sitemap and robots generator.
- `assets/`: authored CSS and browser JavaScript, copied to the build output.
- `curated.json`: individually reviewed guide content and request examples.
- `scripts/import_catalogs.py`: deduplication and catalog import from local snapshots.
- `scripts/check_catalog_links.py`: optional documentation-link checks; not API uptime monitoring.
- `sources/`: source snapshots, licenses, import report and partial link-check results.
- `catalog.json`, `apis.json`, `dist/`: generated locally and excluded from version control.

## Data and review status

The preserved content snapshot was prepared on 16 September 2026. Importing it again does not constitute a fresh provider review. Only 32 guides were individually checked against documentation; community imports are explicitly marked unverified, and their detail pages use `noindex,follow` and are excluded from the sitemap. Pricing, limits, authentication and availability can change. The included link-check snapshot is partial and most requests were inconclusive.

Community data comes from [public-apis/public-apis](https://github.com/public-apis/public-apis) and [public-api-lists/public-api-lists](https://github.com/public-api-lists/public-api-lists). Their MIT licenses are preserved in `sources/` and included in the generated website. These licenses apply to the imported source catalogs; they do not imply rights to each provider’s content or API.

## Updating content

Edit `curated.json` for reviewed guides or deliberately replace the catalog snapshots in `sources/`, then rebuild. Confirm provider documentation before changing a listing’s review status. The build does not fetch external data or execute the API examples.
