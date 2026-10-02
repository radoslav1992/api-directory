import { defineConfig } from 'astro/config';
const origin = process.env.SITE_URL || 'https://endpoint-directory.radod.chatgpt.site';
const url = new URL(origin);
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS origin, e.g. https://example.com');
export default defineConfig({ site: url.origin, output: 'static', trailingSlash: 'always', build: { format: 'directory' }, devToolbar: { enabled: false } });
