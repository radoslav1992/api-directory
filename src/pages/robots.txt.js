export function GET({site}){return new Response(`User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
