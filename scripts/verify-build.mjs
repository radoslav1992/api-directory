import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('dist'),html=files.filter(f=>f.endsWith('.html')),catalog=JSON.parse(fs.readFileSync('src/data/catalog.json','utf8'));
assert.equal(catalog.length,2112);assert.equal(catalog.filter(a=>a.review==='reviewed').length,32);
const routeFile=url=>{const clean=url.split(/[?#]/)[0];const file=path.join('dist',decodeURIComponent(clean));return fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(file,'index.html');};
let links=0;
for(const file of html){const text=fs.readFileSync(file,'utf8');assert.match(text,/<title>[^<]+<\/title>/,file+' title');assert.match(text,/rel="canonical"/,file+' canonical');if(!file.startsWith('dist/page/'))assert.equal((text.match(/<h1[\s>]/g)||[]).length,1,file+' h1');
 const ids=[...text.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+' duplicate ids');
 for(const m of text.matchAll(/\b(?:href|src)="(\/(?!\/)[^"]*)"/g)){const dest=routeFile(m[1]);assert.ok(fs.existsSync(dest),`${file}: missing ${m[1]}`);links++;}
 for(const m of text.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs))JSON.parse(m[1]);
}
for(const a of catalog){const text=fs.readFileSync(`dist/apis/${a.slug}/index.html`,'utf8');assert.equal(text.includes('content="noindex,follow"'),a.review!=='reviewed',a.slug+' indexing');assert.ok(text.includes('id="playground"'),a.slug+' playground');}
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(new Set(urls).size,urls.length);for(const url of urls){const text=fs.readFileSync(routeFile(new URL(url).pathname),'utf8');assert.ok(!text.includes('content="noindex,follow"'),url+' should not be in sitemap');}
assert.ok(fs.existsSync('dist/404.html'));assert.ok(fs.existsSync('dist/llms.txt'));assert.ok(fs.existsSync('dist/social.png'));
console.log(`Verified ${html.length} HTML files, ${links} internal links, ${urls.length} sitemap URLs, 2,112 API pages, and all indexing rules.`);
