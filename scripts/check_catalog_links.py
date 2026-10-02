"""Bounded HEAD checks of public documentation URLs, not API uptime tests."""
import urllib.request,urllib.error,concurrent.futures,json,time
from pathlib import Path
P=Path(__file__).resolve().parents[1]
items=json.loads((P/'catalog.json').read_text());results={};start=time.time()
def check(a):
 url=a['docs']
 try:
  req=urllib.request.Request(url,method='HEAD',headers={'User-Agent':'EndpointDirectory/1.0 (documentation link check)'})
  with urllib.request.urlopen(req,timeout=4) as response:return a['slug'],{'status':response.status,'url':response.url}
 except urllib.error.HTTPError as e:return a['slug'],{'status':e.code}
 except Exception:return a['slug'],{'status':None}
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 for i,future in enumerate(concurrent.futures.as_completed([pool.submit(check,a) for a in items]),1):
  slug,r=future.result()
  results[slug]=r
  if i%50==0:
   (P/'sources/link-checks.json').write_text(json.dumps({'checked_at':'2026-09-16','method':'HEAD','results':results},indent=2))
   print(f'Checked {i}/{len(items)} documentation links',flush=True)
(P/'sources/link-checks.json').write_text(json.dumps({'checked_at':'2026-09-16','method':'HEAD','results':results},indent=2))
from collections import Counter
print('Completed',len(results),'in',round(time.time()-start),'seconds:',dict(Counter(str(r['status']) for r in results.values())),flush=True)
