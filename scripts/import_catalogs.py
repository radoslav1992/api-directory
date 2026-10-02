"""Rebuild the catalog from attributed, locally saved MIT-licensed snapshots."""
import re,json,html,unicodedata,hashlib
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode
P=Path(__file__).resolve().parents[1]
curated=json.loads((P/'curated.json').read_text())
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
def key(s):return re.sub(r'[^a-z0-9]','',slug(s).replace('-api',''))
def host(u):
 h=urlsplit(u).hostname or ''
 for prefix in ['www.','docs.','api.','developer.']:h=h.removeprefix(prefix)
 return h.lower()
def urlclean(u):
 u=html.unescape(u.strip());p=urlsplit(u)
 if p.scheme not in ('http','https') or not p.hostname or p.username or p.password:return None
 params=[(k,v) for k,v in parse_qsl(p.query) if not k.lower().startswith('utm_') and k.lower() not in {'ref','referral','referrer'}]
 return urlunsplit((p.scheme,p.netloc.lower(),p.path or '/',urlencode(params),''))
def text(s):
 s=re.sub(r'!\[[^]]*\]\([^)]+\)','',s)
 s=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',s)
 return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]*>','',s)).replace('`','').replace('**','')).strip()
category_map={'Art & Design':'Books & culture','Books':'Books & culture','Currency Exchange':'Finance','Dictionaries':'Language','Food & Drink':'Food & drink','Geocoding':'Geography','Music':'Music & audio','Science & Math':'Science','Test Data':'Development','Programming':'Development','Calendar':'Utilities'}
by_url={urlclean(a['docs']):a for a in curated};by_identity={(key(a['name']),host(a['docs'])):a for a in curated}
curated_hosts={host(a['docs']):a for a in curated if not any(v in host(a['docs']) for v in ['github.','github.io','apple.com','worldbank.org'])}
known_aliases={'radio-browser':'radio-browser','radio-browser.info':'radio-browser','itunes-search':'itunes-search','itunes':'itunes-search','art-institute-of-chicago':'art-institute','chicago-art-institute':'art-institute','metropolitan-museum-of-art':'met-museum','the-metropolitan-museum-of-art':'met-museum','nager-date':'nager-date','open-food-facts':'open-food-facts','crossref-metadata-search':'crossref','gbif':'gbif','sunrise-and-sunset':'sunrise-sunset'}
curated_names={key(a['name']):a for a in curated}
by_slug={a['slug']:a for a in curated};items=list(curated);skipped=[];merged=0;counts={}
for filename,repo in [('public-apis.md','public-apis/public-apis'),('public-api-lists.md','public-api-lists/public-api-lists')]:
 category=None;started=False;rows=0
 for line_number,line in enumerate((P/'sources'/filename).read_text().splitlines(),1):
  heading=re.match(r'^###\s+(.+?)\s*$',line)
  if heading:
   category=heading[1].strip();started=started or category=='Animals';continue
  if not started or not re.match(r'^\|\s*\[',line):continue
  cells=[c.strip() for c in re.split(r'(?<!\\)\|',line.strip().strip('|'))]
  if len(cells)<5:continue
  m=re.match(r'\[([^]]+)\]\((https?://.+)\)',cells[0])
  if not m:continue
  name=text(m[1]);url=urlclean(m[2]);desc=text(cells[1]);rows+=1
  if not url or not name or not desc or len(name)>110:
   skipped.append({'name':name,'reason':'invalid record'});continue
  if re.search(r'\b(discontinued|deprecated|shut down|shutdown|no longer available|defunct|retired)\b',name+' '+desc,re.I):
   skipped.append({'name':name,'reason':'catalog reports retirement or deprecation'});continue
  source={'name':repo,'url':f'https://github.com/{repo}/blob/master/README.md#'+re.sub(r'[^\w -]','',category.lower()).replace(' ','-'),'line':line_number}
  identity=(key(name),host(url))
  existing=by_url.get(url) or by_identity.get(identity) or curated_names.get(key(name)) or curated_hosts.get(host(url)) or by_slug.get(known_aliases.get(slug(name),''))
  if existing:
   if source['name'] not in [x['name'] for x in existing['sources']]:existing['sources'].append(source)
   merged+=1;continue
  authraw=text(cells[2]);auth={'No':'No key','apiKey':'API key','OAuth':'OAuth','X-Mashape-Key':'API key','User-Agent':'User-Agent','HTTP Basic Auth':'Basic auth'}.get(authraw,'Unknown')
  item_slug=slug(name) or 'api'
  if item_slug in by_slug:item_slug+='-'+slug(host(url))
  if item_slug in by_slug:item_slug+='-'+hashlib.sha256(url.encode()).hexdigest()[:7]
  c=category_map.get(category,category)
  item={'slug':item_slug,'name':name,'category':c,'mark':''.join(w[0] for w in name.split()[:2]).upper()[:2], 'color':['blue','green','orange','violet','red','yellow'][len(items)%6],'description':desc,'auth':auth,'plan':'Check pricing','docs':url,'endpoint':'','note':'Imported from a community catalog. Current pricing, authentication, and availability have not been individually checked. Confirm requirements in the provider documentation before integration.','use':'','header':'','review':'catalog','sources':[source],'reported_auth':authraw,'reported_https':text(cells[3]),'reported_cors':text(cells[4]),'imported_at':'2026-09-16'}
  items.append(item);by_slug[item_slug]=item;by_url[url]=item;by_identity[identity]=item
 counts[repo]=rows
merge_names={'urlhaus','rijksmuseum','bitquery','onedrive','codeship','blockchain','coindesk','coinranking','poloniex','us autocomplete','us extract','us street address','gitter','ibm text to speech','image-charts','postman','jokeapi','filingrail','razorpay ifsc','cross universe','destiny the game','pandascore','tcgdex','airtel ip','us zipcode','bclaws','enigma public','newton','ebay','discord','watson natural language understanding','navitia','transport for grenoble, france','transport for united states','owen wilson wow','trakt'}
unique=[];seen_names={}
for a in items:
 n=a['name'].lower()
 if n in merge_names and n in seen_names:
  old=seen_names[n]
  for source in a['sources']:
   if source['name'] not in [x['name'] for x in old['sources']]:old['sources'].append(source)
  merged+=1
 else:unique.append(a);seen_names[n]=a
items=unique
items=[a for a in items if host(a['docs'])!='iexcloud.io']
skipped.append({'name':'IEX Cloud','reason':'Provider domain is parked, not API documentation','source':'https://www.iexcloud.io/'})
report={'source_rows':counts,'merged_duplicate_rows':merged,'excluded':skipped,'curated_count':len(curated),'total':len(items),'categories':len(set(a['category'] for a in items))}
(P/'catalog.json').write_text(json.dumps(items,ensure_ascii=False,indent=2))
(P/'sources/import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='excluded'}));print('Excluded',len(skipped))
