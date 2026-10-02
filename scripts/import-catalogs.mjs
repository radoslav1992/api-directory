import fs from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => JSON.parse(fs.readFileSync(new URL('../'+p, import.meta.url), 'utf8'));
const root = new URL('../', import.meta.url);
const write = (p, data) => fs.writeFileSync(new URL(p,root), data);
const { category_map, known_aliases, merge_names } = read('sources/import-config.json');
const curated = read('curated.json');
const slug = s => s.normalize('NFKD').replace(/[^\x00-\x7F]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const key = s => slug(s).replaceAll('-api','').replace(/[^a-z0-9]/g,'');
function host(u) { let h=new URL(u).hostname; for (const p of ['www.','docs.','api.','developer.']) if(h.startsWith(p)) h=h.slice(p.length); return h; }
const decode = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n)));
const text = s => decode(s.replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/<[^>]*>/g,'')).replaceAll('`','').replaceAll('**','').replace(/\s+/g,' ').trim();
function clean(s) { try {const u=new URL(decode(s.trim())); if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return null; for(const k of [...u.searchParams.keys()])if(k.toLowerCase().startsWith('utm_')||['ref','referral','referrer'].includes(k.toLowerCase()))u.searchParams.delete(k);u.hash='';return u.href;}catch{return null;} }
const byURL=new Map(curated.map(a=>[clean(a.docs),a]));
const byIdentity=new Map(curated.map(a=>[key(a.name)+'|'+host(a.docs),a]));
const names=new Map(curated.map(a=>[key(a.name),a]));
const hosts=new Map(curated.filter(a=>!['github.','github.io','apple.com','worldbank.org'].some(v=>host(a.docs).includes(v))).map(a=>[host(a.docs),a]));
const bySlug=new Map(curated.map(a=>[a.slug,a]));
let items=[...curated], merged=0; const counts={}, excluded=[];
for(const [filename,repo] of [['public-apis.md','public-apis/public-apis'],['public-api-lists.md','public-api-lists/public-api-lists']]) {
 let category='',started=false,rows=0;
 const lines=fs.readFileSync(new URL('sources/'+filename,root),'utf8').split(/\r?\n/);
 for(let i=0;i<lines.length;i++) {
  const line=lines[i],heading=line.match(/^###\s+(.+?)\s*$/);
  if(heading){category=heading[1].trim();started ||= category==='Animals';continue;}
  if(!started||!/^\|\s*\[/.test(line))continue;
  const cells=line.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(s=>s.trim());if(cells.length<5)continue;
  const m=cells[0].match(/^\[([^\]]+)\]\((https?:\/\/.+)\)/);if(!m)continue;
  const name=text(m[1]),url=clean(m[2]),description=text(cells[1]);rows++;
  if(!url||!name||!description||name.length>110){excluded.push({name,reason:'invalid record'});continue;}
  if(/\b(discontinued|deprecated|shut down|shutdown|no longer available|defunct|retired)\b/i.test(name+' '+description)){excluded.push({name,reason:'catalog reports retirement or deprecation'});continue;}
  const source={name:repo,url:`https://github.com/${repo}/blob/master/README.md#${category.toLowerCase().replace(/[^\w -]/g,'').replaceAll(' ','-')}`,line:i+1};
  const identity=key(name)+'|'+host(url);
  const old=byURL.get(url)||byIdentity.get(identity)||names.get(key(name))||hosts.get(host(url))||bySlug.get(known_aliases[slug(name)]);
  if(old){if(!old.sources.some(s=>s.name===repo))old.sources.push(source);merged++;continue;}
  const raw=text(cells[2]);const auth=({'No':'No key','apiKey':'API key','OAuth':'OAuth','X-Mashape-Key':'API key','User-Agent':'User-Agent','HTTP Basic Auth':'Basic auth'})[raw]||'Unknown';
  let id=slug(name)||'api';if(bySlug.has(id))id+='-'+slug(host(url));if(bySlug.has(id))id+='-'+createHash('sha256').update(url).digest('hex').slice(0,7);
  const a={slug:id,name,category:category_map[category]||category,mark:name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2),color:['blue','green','orange','violet','red','yellow'][items.length%6],description,auth,plan:'Check pricing',docs:url,endpoint:'',note:'Imported from a community catalog. Current pricing, authentication, and availability have not been individually checked. Confirm requirements in the provider documentation before integration.',use:'',header:'',review:'catalog',sources:[source],reported_auth:raw,reported_https:text(cells[3]),reported_cors:text(cells[4]),imported_at:'2026-09-16'};
  items.push(a);bySlug.set(id,a);byURL.set(url,a);byIdentity.set(identity,a);
 }
 counts[repo]=rows;
}
const seen=new Map(),unique=[];
for(const a of items){const n=a.name.toLowerCase();if(merge_names.includes(n)&&seen.has(n)){const old=seen.get(n);for(const s of a.sources)if(!old.sources.some(t=>t.name===s.name))old.sources.push(s);merged++;}else{unique.push(a);seen.set(n,a);}}
const checks=read('sources/link-checks.json').results;
items=unique.filter(a=>host(a.docs)!=='iexcloud.io').map(a=>({...a,link_status:checks[a.slug]?.status??null})).filter(a=>a.review==='reviewed'||![404,410].includes(a.link_status));
if(new Set(items.map(a=>a.slug)).size!==items.length)throw new Error('Duplicate API slugs');
fs.mkdirSync(new URL('src/data/',root),{recursive:true});fs.mkdirSync(new URL('public/',root),{recursive:true});
write('src/data/catalog.json',JSON.stringify(items));
write('public/catalog.json',JSON.stringify(items.map(({slug,name,category,mark,color,description,auth,plan,review})=>({slug,name,category,mark,color,description,auth,plan,review}))));
console.log(`Catalog: ${items.length} APIs, ${new Set(items.map(a=>a.category)).size} categories, ${items.filter(a=>a.review==='reviewed').length} reviewed guides.`);
