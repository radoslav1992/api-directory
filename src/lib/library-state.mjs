export const escapeHTML = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function filterCatalog(items,{q='',reviewed=false,noKey=false,free=false,sort='curated',page=1},size=36){
 const words=q.toLowerCase().trim().split(/\s+/).filter(Boolean);
 let result=items.filter(a=>(!reviewed||a.review==='reviewed')&&(!noKey||a.auth==='No key')&&(!free||['Free access','Free tier'].includes(a.plan))&&words.every(w=>`${a.name} ${a.category} ${a.description}`.toLowerCase().includes(w)));
 if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
 const total=result.length,pages=Math.max(1,Math.ceil(total/size));page=Math.min(pages,Math.max(1,Math.floor(Number(page)||1)));
 return {total,pages,page,items:result.slice((page-1)*size,page*size)};
}
