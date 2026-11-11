// Server keys stay inside the Supabase runtime. No keys are bundled or returned.
import {makeHandler} from './server/http.js';
import {supabaseStore} from './server/store.js';
const env={
 SUPABASE_URL:Deno.env.get('SUPABASE_URL'),
 SUPABASE_PUBLISHABLE_KEY:JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY'),
 SUPABASE_SERVICE_ROLE_KEY:JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
 APP_ORIGIN:'https://hmdev-virtual-connect.vercel.app',
 ADMIN_USER_IDS:Deno.env.get('VIRTUAL_ADMIN_USER_IDS')||'',
 REGISTRATION_ENABLED:Deno.env.get('VIRTUAL_REGISTRATION_ENABLED')==='true'?'true':'false',
 TURNSTILE_SITE_KEY:Deno.env.get('VIRTUAL_TURNSTILE_SITE_KEY')||''
};
const handler=makeHandler({store:supabaseStore(env),env});
Deno.serve(async req=>{
 const path=new URL(req.url).pathname.replace(/^\/virtual-api|^\/functions\/v1\/virtual-api/,'');
 if(!path.startsWith('/api/'))return Response.json({error:'요청을 찾을 수 없습니다.'},{status:404,headers:{'Cache-Control':'no-store'}});
 const url=new URL(path,env.APP_ORIGIN),headers=new Headers(req.headers);
 return handler(new Request(url,{method:req.method,headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:req.body,duplex:'half'})}));
});
