// Calls every example in sources/examples.json once and records the result in
// sources/example-checks.json. The import step publishes only examples that pass.
// Usage: node scripts/check-examples.mjs [slug ...]
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const examples = read('sources/examples.json');
const outFile = new URL('sources/example-checks.json', root);
const previous = fs.existsSync(outFile) ? read('sources/example-checks.json').results : {};
const only = process.argv.slice(2);
const slugs = Object.keys(examples).filter(s => !only.length || only.includes(s));
const today = new Date().toISOString().slice(0, 10);
const origin = 'https://findpublicapis.com';
const keyed = e => /YOUR_API_KEY/.test(e.url + ' ' + (e.header || ''));
const looksLikeKeyError = text => /(api[ _-]?key|apikey|\bkey\b|token|auth|credential|client[ _-]?id|subscri|unauthori[sz]ed|forbidden|access to this api)/i.test(text);
const corsRejection = text => /\bcors\b|cross-origin/i.test(text);

async function check(slug, withOrigin = true) {
  const e = examples[slug], headers = { accept: 'application/json, */*;q=0.8', ...(withOrigin && { origin }), 'user-agent': 'FindPublicAPIs-ExampleCheck/1.0 (+https://github.com/radoslav1992/api-directory)' };
  if (e.header) { const i = e.header.indexOf(':'); headers[e.header.slice(0, i).trim().toLowerCase()] = e.header.slice(i + 1).trim(); }
  const started = Date.now();
  try {
    // The playground blocks redirects, so a redirect is a failure here too.
    const res = await fetch(e.url, { headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const body = Buffer.from(await res.arrayBuffer()).subarray(0, 65536).toString('utf8');
    const page = /^\s*<(!doctype html|html)/i.test(body), html = type.includes('html') || page;
    const cors = ['*', origin].includes(res.headers.get('access-control-allow-origin'));
    let ok = false, reason = '';
    if (/^Host not in allowlist/.test(body)) reason = 'blocked by the local network policy';
    else if (res.status >= 300 && res.status < 400) reason = 'redirect to ' + (res.headers.get('location') || '?');
    else if (res.status >= 200 && res.status < 300) {
      if (!body.trim() && !type.startsWith('image/')) reason = 'empty body';
      else if (html) reason = 'returned an HTML page, not data';
      else ok = true;
    // With a placeholder key, a 401 means "key required" whatever the body; 400/403 must say so.
    } else if (keyed(e) && (res.status === 401 || ([400, 403].includes(res.status) && !page && looksLikeKeyError(body)))) ok = true;
    // Some APIs refuse any request carrying an Origin header: they work from servers, not browsers.
    else if (withOrigin && res.status === 403 && corsRejection(body)) return { ...await check(slug, false), cors: false };
    else reason = 'HTTP ' + res.status;
    return { ok, status: res.status, type, cors, ms: Date.now() - started, checked: today, ...(reason && { reason }), ...(!ok && { sample: body.slice(0, 200) }) };
  } catch (error) {
    return { ok: false, status: 0, cors: false, ms: Date.now() - started, checked: today, reason: (error.cause?.code || error.name || 'error') + ': ' + (error.cause?.message || error.message) };
  }
}

const results = { ...previous }, queue = [...slugs];
let done = 0;
await Promise.all(Array.from({ length: 24 }, async () => {
  while (queue.length) {
    const slug = queue.shift();
    const r = { url: examples[slug].url, ...await check(slug) };
    // Don't let a run from a sandbox with blocked egress erase earlier real results.
    const keep = r.reason === 'blocked by the local network policy' && previous[slug]?.url === r.url;
    results[slug] = keep ? previous[slug] : r;
    if (++done % 100 === 0) console.log(`${done}/${slugs.length}`);
  }
}));
for (const slug of Object.keys(results)) if (!examples[slug]) delete results[slug];
const sorted = Object.fromEntries(Object.keys(results).sort().map(k => [k, results[k]]));
fs.writeFileSync(outFile, JSON.stringify({ checked_at: today, results: sorted }, null, 1) + '\n');
const checked = slugs.map(s => results[s]), passed = checked.filter(r => r.ok);
console.log(`Checked ${checked.length} examples: ${passed.length} passed, ${checked.length - passed.length} failed, ${passed.filter(r => r.cors).length} send CORS headers.`);
