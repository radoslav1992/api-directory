import { defineConfig } from 'astro/config';
// Cloudflare injects build variables here; Wrangler runtime vars do not affect static SEO.
const siteUrl = (process.env.SITE_URL || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
if (process.env.WORKERS_CI && !siteUrl) {
  throw new Error('Set SITE_URL in Cloudflare Settings > Builds > Variables and secrets to your public HTTPS origin (custom domain or workers.dev URL).');
}
const origin = siteUrl || process.env.CF_PAGES_URL || 'https://endpoint-directory.radod.chatgpt.site';
// Accept a bare hostname such as "example.com" by assuming HTTPS.
const url = URL.parse(/^[a-z][a-z\d+.-]*:\/\//i.test(origin) ? origin : `https://${origin}`);
if (!url || url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error(`SITE_URL must be an HTTPS origin such as https://example.com (no path, quotes, or spaces); got ${JSON.stringify(origin)}.`);
}
export default defineConfig({ site: url.origin, output: 'static', trailingSlash: 'always', build: { format: 'directory' }, devToolbar: { enabled: false } });
