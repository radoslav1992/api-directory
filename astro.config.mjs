import { defineConfig } from 'astro/config';
// Cloudflare injects build variables here; Wrangler runtime vars do not affect static SEO.
if (process.env.WORKERS_CI && !process.env.SITE_URL) {
  throw new Error('Set SITE_URL in Cloudflare Settings > Builds > Variables and secrets to your public HTTPS origin (custom domain or workers.dev URL).');
}
const origin = process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://endpoint-directory.radod.chatgpt.site';
const url = new URL(origin);
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS origin, e.g. https://example.com');
export default defineConfig({ site: url.origin, output: 'static', trailingSlash: 'always', build: { format: 'directory' }, devToolbar: { enabled: false } });
