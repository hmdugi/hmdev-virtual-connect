export async function proxyToBackend(request,base,fetcher=fetch){
 let target;try{target=new URL(base);}catch{return Response.json({error:'서버 연결 설정이 필요합니다.'},{status:503});}
 if(target.protocol!=='https:'||!target.hostname.endsWith('.supabase.co')||target.pathname!=='/functions/v1/virtual-api'||target.search||target.hash||target.username||target.password)return Response.json({error:'서버 연결 설정이 올바르지 않습니다.'},{status:503});
 const original=new URL(request.url);if(!original.pathname.startsWith('/api/'))return new Response(null,{status:404});
 if(!['GET','POST'].includes(request.method))return new Response(null,{status:405});
 const headers=new Headers();for(const key of ['cookie','origin','content-type'])if(request.headers.has(key))headers.set(key,request.headers.get(key));
 let body;if(request.method==='POST'){body=await request.text();if(new TextEncoder().encode(body).length>16384)return Response.json({error:'입력이 너무 큽니다.'},{status:413});}
 try{const response=await fetcher(target.href+original.pathname,{method:request.method,headers,...(body?{body}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});const out=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Cookie'});for(const value of response.headers.getSetCookie())out.append('Set-Cookie',value);return new Response(await response.text(),{status:response.status,headers:out});}
 catch{return Response.json({error:'서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
