import {apis,directoryRoutes,reviewed} from '../lib/catalog';
import {guides} from '../lib/guides';
export function GET({site}){
 const origin=site.origin;const entries=[...['/','/about/','/playground/','/guides/'].map(path=>({path})),...directoryRoutes().map(r=>({path:r.path})),...reviewed.map(a=>({path:`/apis/${a.slug}/`,date:'2026-09-16'})),...apis.filter(a=>a.review!=='reviewed'&&a.example).map(a=>({path:`/apis/${a.slug}/`,date:a.example.checked})),...guides.map(g=>({path:`/guides/${g.slug}/`,date:'2026-10-02'}))];
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries.map(e=>`<url><loc>${origin}${e.path}</loc>${e.date?`<lastmod>${e.date}</lastmod>`:''}</url>`).join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
