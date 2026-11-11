// Allow lists: database records must never be returned directly to a browser.
const payload=p=>p?Object.fromEntries(['name','bio','roles','platforms','genres','vibes','officialUrl','time','color','title','sourceUrl'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]).concat(p.people?[['people',p.people.map(m=>({id:m.id,role:m.role}))]]:[])):null;
export function ownRequest(r){return {id:r.id,kind:r.kind,targetId:r.targetId,status:r.status,createdAt:r.createdAt,payload:payload(r.payload),...(r.status==='pending'?{challenge:r.challenge}:{}),...(r.reviewedAt?{reviewedAt:r.reviewedAt,reviewMessage:r.reviewMessage||'검토가 완료되었습니다.'}:{} )};}
export function moderatorRequest(r){return {...ownRequest(r),evidenceUrl:r.evidenceUrl,note:r.note,challenge:r.challenge};}
