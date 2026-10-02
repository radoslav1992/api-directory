import records from '../data/catalog.json';
export const apis = records;
export const reviewed = apis.filter(a=>a.review==='reviewed');
export const snapshot = '2026-09-16';
export const pageSize = 36;
export const slugify = s => s.normalize('NFKD').replace(/[^\x00-\x7F]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const aliases={'Books & culture':'books-culture','Food & drink':'food-drink','Music & audio':'music-audio'};
export const categorySlug = c => aliases[c]||slugify(c);
export const categories=[...new Set(apis.map(a=>a.category))].sort().map(name=>({name,slug:categorySlug(name),count:apis.filter(a=>a.category===name).length}));
export const categoryNotes={
 'Weather': 'Find forecasts, historical observations, and climate data for dashboards and location-aware apps. Compare geographic coverage, update frequency, and commercial-use terms before choosing a provider.',
 'Finance': 'Explore exchange rates, market data, and economic indicators. Check whether prices are delayed, which markets are covered, and whether redistribution is allowed. Reference rates are not executable trading quotes.',
 'Music & audio': 'Discover radio directories, music metadata, and audio services. API access and permission to play or redistribute audio are separate questions. Test stream availability and browser compatibility before building a player.',
 'Science': 'Work with space, earthquake, biodiversity, and research metadata. Preserve units, observation dates, geographic precision, and attribution so the resulting application communicates the data accurately.',
 'Development': 'Prototype interfaces with placeholder posts, products, and user profiles. Use simulated data to test loading and error states; a successful write to a mock API may not persist.',
 'Geography': 'Look up countries, addresses, and locations. Compare regional coverage, geocoding limits, attribution requirements, and the freshness of administrative boundaries.',
 'Food & drink': 'Build recipe explorers and barcode-based food tools. Check image rights and production access, and treat ingredient or nutrition records as provider data that can be incomplete.',
 'Books & culture': 'Explore book records, museum collections, and cultural archives. Metadata access does not automatically include permission to reuse artwork or cover images.',
 'Entertainment': 'Find games, television, trivia, and character data for playful projects. Review media rights separately from endpoint access, and check how frequently a catalog is updated.'
};
export const categoryDescription = name => categoryNotes[name]||`Browse ${name.toLowerCase()} APIs by access requirements and source. Open a provider guide to compare authentication, documentation, and usage conditions before integrating.`;
export const collections=[
 {slug:'docs-reviewed',title:'Documentation-reviewed APIs',description:'32 guides with provider documentation, access notes, use cases, and editable request examples.',items:reviewed},
 {slug:'no-api-key',title:'APIs with no key reported',description:'Explore APIs listed as requiring no private key. Access is source-reported for community entries; rate limits and usage terms still apply.',items:apis.filter(a=>a.auth==='No key')},
 {slug:'starter-projects',title:'APIs for your first project',description:'Start a weather dashboard, a book search, or a prototype with these approachable API examples. Check the conditions in each guide.',items:reviewed.filter(a=>['open-meteo','jsonplaceholder','pokeapi','open-library','dog-ceo','frankfurter','random-user','radio-browser'].includes(a.slug))}
];
export function directoryRoutes(){
 const groups=[{base:'/library/',title:'The API library',description:'Search 2,112 public APIs across 50 categories. Compare authentication and review status, read the docs, and try requests in your browser.',items:apis,kind:'library'},...categories.map(c=>({base:`/categories/${c.slug}/`,title:`${c.name} APIs`,description:categoryDescription(c.name),items:apis.filter(a=>a.category===c.name),category:c.name,kind:'category'})),...collections.map(c=>({base:`/collections/${c.slug}/`,...c,kind:'collection'}))];
 return groups.flatMap(group=>Array.from({length:Math.max(1,Math.ceil(group.items.length/pageSize))},(_,i)=>({...group,current:i+1,path:i===0?group.base:group.base+`page/${i+1}/`})));
}
export function requestExample(a){
 let headers={};if(a.header&&!a.header.toLowerCase().startsWith('user-agent:')){const i=a.header.indexOf(':');headers[a.header.slice(0,i)]=a.header.slice(i+1).trim();}
 return {slug:a.slug,name:a.name,url:a.endpoint||'',headers,auth:a.auth,docs:a.docs};
}
