export const MAX_RESPONSE_BYTES=2*1024*1024;
export const MAX_REQUEST_BYTES=1024*1024;
export const methods=['GET','HEAD','POST','PUT','PATCH','DELETE'];
const forbidden=/^(accept-charset|accept-encoding|access-control-request-.*|connection|content-length|cookie2?|date|dnt|expect|host|keep-alive|origin|permissions-policy|referer|te|trailer|transfer-encoding|upgrade|user-agent|via|proxy-.*|sec-.*)$/i;
export function buildRequest(input,{preview=false,reveal=false}={}){
 const method=String(input.method||'GET').toUpperCase();if(!methods.includes(method))throw new Error('Choose a supported HTTP method.');
 let url;try{url=new URL(input.url);}catch{throw new Error('Enter a complete HTTPS endpoint URL.');}
 if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use HTTPS without credentials embedded in the URL.');
 url.hash='';
 const sensitive=!preview||reveal;
 if(!sensitive)for(const key of [...url.searchParams.keys()])url.searchParams.set(key,'YOUR_VALUE');
 for(const [key,value] of input.params||[])if(key.trim())url.searchParams.set(key.trim(),sensitive?value:'YOUR_VALUE');
 const headers=new Headers();
 for(const [key,value] of input.headers||[]){if(!key.trim())continue;if(forbidden.test(key.trim()))throw new Error(`The browser controls the ${key.trim()} header. Remove it to continue.`);try{headers.set(key.trim(),sensitive?value:'YOUR_VALUE');}catch{throw new Error('A header name or value is invalid. Remove line breaks and check the header name.');}}
 const auth=input.auth||{type:'none'};
 if(String(auth.value||'').length>16384||String(auth.username||'').length>4096)throw new Error('Authentication value exceeds the playground limit.');
 if(auth.type!=='none'){
  if(!auth.value&&!preview)throw new Error('Enter your authentication value before sending.');
  if(['bearer','basic'].includes(auth.type)&&headers.has('Authorization'))throw new Error('Set Authorization in either the headers or authentication section, not both.');
  if(auth.type==='bearer')headers.set('Authorization','Bearer '+(sensitive?auth.value:'YOUR_TOKEN'));
  else if(auth.type==='basic'){
   if((auth.username||'').includes(':'))throw new Error('A Basic authentication username cannot contain a colon.');
   const value=sensitive?btoa(String.fromCharCode(...new TextEncoder().encode(`${auth.username||''}:${auth.value||''}`))):'BASE64_USERNAME_PASSWORD';headers.set('Authorization','Basic '+value);
  }else if(auth.type==='header'){
   if(!auth.name?.trim())throw new Error('Enter the API-key header name.');if(forbidden.test(auth.name.trim()))throw new Error('Choose a header name the browser can send.');
   if(headers.has(auth.name.trim()))throw new Error('Remove the duplicate API-key header from custom headers.');
   headers.set(auth.name.trim(),sensitive?auth.value:'YOUR_API_KEY');
  }else if(auth.type==='query'){
   if(!auth.name?.trim())throw new Error('Enter the API-key query parameter name.');url.searchParams.set(auth.name.trim(),sensitive?auth.value:'YOUR_API_KEY');
  }else throw new Error('Choose a supported authentication method.');
 }
 let body=undefined;
 if(!['GET','HEAD'].includes(method)){
  if(!input.confirmed&&!preview)throw new Error('Confirm that you intend to send a request that may change provider data.');
  if(new TextEncoder().encode(input.body||'').byteLength>MAX_REQUEST_BYTES)throw new Error('Request body exceeds the 1 MB playground limit.');
  if(input.body){body=sensitive?input.body:'<REQUEST_BODY>';if(input.bodyType==='json'){try{JSON.parse(input.body);}catch{throw new Error('The JSON request body is invalid.');}if(!headers.has('Content-Type'))headers.set('Content-Type','application/json');}}
 }
 return {url:url.href,options:{method,headers:Object.fromEntries(headers),...(body!==undefined?{body}:{}),mode:'cors',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store'}};
}
const shellQuote=s=>"'"+String(s).replaceAll("'","'\\''")+"'";
export function snippets(request){
 const {url,options}=request;
 const curl=[`curl --request ${options.method} ${shellQuote(url)}`,...Object.entries(options.headers).map(([k,v])=>`  --header ${shellQuote(k+': '+v)}`),...(options.body!==undefined?[`  --data-raw ${shellQuote(options.body)}`]:[])].join(' \\\n');
 const javascript=`const response = await fetch(${JSON.stringify(url)}, ${JSON.stringify(options,null,2)});\nif (!response.ok) throw new Error(\`HTTP \${response.status}\`);\nconst text = await response.text();\nlet data;\ntry { data = JSON.parse(text); } catch { data = text; }\nconsole.log(data);`;
 return {curl,javascript};
}
export async function readLimited(response,limit=MAX_RESPONSE_BYTES){
 if(!response.body)return {text:'',bytes:0};
 const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();throw new Error('Response exceeds the 2 MB playground limit. Narrow the request with provider pagination or a smaller limit.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();return {text,bytes};}finally{reader.releaseLock();}
}
export function tableData(data){
 function find(value,depth=0,path='$'){if(Array.isArray(value))return {rows:value,path};if(value&&typeof value==='object'&&depth<3){for(const [k,v] of Object.entries(value)){const found=find(v,depth+1,path+'.'+k);if(found)return found;}}return null;}
 let found=find(data);if(!found&&data&&typeof data==='object')found={rows:[data],path:'$'};
 if(!found)return null;
 const rows=found.rows.slice(0,200).map(v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{value:v});
 const columns=[...new Set(rows.flatMap(Object.keys))].slice(0,25);
 return {rows,columns,total:found.rows.length,path:found.path};
}
