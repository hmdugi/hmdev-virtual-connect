import {makeHandler} from '../server/http.js';
import {supabaseStore} from '../server/store.js';
let handler;
export default async function api(req,res){
 if(!handler){const env=process.env;const store=env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY?supabaseStore(env):null;handler=makeHandler({store,env});}
 const host=req.headers.host,proto=req.headers['x-forwarded-proto']==='https'?'https':'http';
 const headers=new Headers();for(const [name,value]of Object.entries(req.headers)){if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(','):value);}
 let body;if(req.method!=='GET'&&req.method!=='HEAD'){if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.statusCode=413;res.end();return;}chunks.push(chunk);}body=Buffer.concat(chunks);}}
 const response=await handler(new Request(`${proto}://${host}${req.url}`,{method:req.method,headers,...(body?{body}:{})}));res.statusCode=response.status;for(const [key,value]of response.headers){if(key!=='set-cookie')res.setHeader(key,value);}const cs=response.headers.getSetCookie();if(cs.length)res.setHeader('Set-Cookie',cs);res.end(await response.text());
}
