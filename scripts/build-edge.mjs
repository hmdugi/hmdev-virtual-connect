import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('.edge-build/server',{recursive:true});
for(const name of ['index.ts','deno.json'])await copyFile('edge/'+name,'.edge-build/'+name);
for(const name of ['domain.js','http.js','privacy.js','store.js'])await copyFile('server/'+name,'.edge-build/server/'+name);
console.log('Prepared .edge-build with application source only. No credentials included.');
