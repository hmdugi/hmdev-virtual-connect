import {readFile,readdir} from 'node:fs/promises';
// Official seed wins on ID/channel collisions; collection never overrides review decisions.
export async function loadDirectory(directory='ingest') {
  const names=(await readdir(directory)).filter(name=>/^batch-\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
  const rows=[],ids=new Set(),channels=new Set();
  for(const name of ['directory-seed.json',...names]) {
    const values=JSON.parse(await readFile(`${directory}/${name}`,'utf8'));
    if(!Array.isArray(values)) throw new Error(`후보 배열이 아닙니다: ${name}`);
    for(const row of values) {
      if(ids.has(row.id)||(row.primary_url&&channels.has(row.primary_url))) continue;
      ids.add(row.id);if(row.primary_url)channels.add(row.primary_url);rows.push(row);
    }
  }
  return rows;
}
