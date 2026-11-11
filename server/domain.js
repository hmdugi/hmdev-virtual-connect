import {randomUUID,randomBytes} from 'node:crypto';
export class Problem extends Error {constructor(status,message){super(message);this.status=status;}}
const fail=(message,status=400)=>{throw new Problem(status,message);};
const text=(v,max,required=false)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail('입력 길이와 필수 항목을 확인해주세요.');return v.trim();};
const list=(v,allowed)=>{if(!Array.isArray(v)||v.length>allowed.length||v.some(x=>!allowed.includes(x)))fail('선택 항목이 올바르지 않습니다.');return [...new Set(v)];};
export function safeUrl(v){text(v,500,true);let u;try{u=new URL(v);}catch{fail('공식 주소는 올바른 HTTPS URL이어야 합니다.');}if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.hostname==='localhost')fail('공식 주소는 공개 HTTPS URL이어야 합니다.');return u.href;}
export function cleanProfile(p){if(!p||typeof p!=='object')fail('프로필을 입력해주세요.');const roles=list(p.roles,['streamer','illustrator','rigger','designer']);if(!roles.length)fail('활동 분야를 선택해주세요.');return {name:text(p.name,60,true),bio:text(p.bio,400,true),roles,platforms:list(p.platforms,['YouTube','치지직','SOOP']),genres:list(p.genres,['게임','잡담','노래','그림']),vibes:list(p.vibes,['차분한','활기찬','편안한']),officialUrl:safeUrl(p.officialUrl),time:text(p.time||'',80),color:'violet'};}
export const emptyState=()=>({schemaVersion:1,profiles:[],works:[],requests:[],audit:[]});
export function publicCatalog(s){const people=s.profiles.filter(p=>p.publicationStatus==='published').map(({id,name,bio,roles,platforms,genres,vibes,officialUrl,time,color})=>({id,name,bio,roles,platforms,genres,vibes,officialUrl,time,color,publicationStatus:'published',verificationLabel:'공식 채널 근거 확인'}));const visible=new Set(people.map(p=>p.id));return {people,works:s.works.filter(w=>w.publicationStatus==='published'&&w.people.every(p=>visible.has(p.id))).map(({id,title,people,sourceUrl})=>({id,title,people,sourceUrl,publicationStatus:'published',confirmationStatus:'confirmed'}))};}
export function submit(s,user,input,now=Date.now()){
 if(!user?.id)fail('로그인이 필요합니다.',401);if(!user.emailVerified)fail('이메일 확인 후 신청할 수 있습니다.',403);if(!input||!['profile','correction','credit','removal'].includes(input.kind))fail('신청 유형을 확인해주세요.');
 if(s.requests.length>=2000)fail('접수를 잠시 중지했습니다. 운영자에게 문의해주세요.',503);
 const own=s.requests.filter(r=>r.ownerId===user.id);if(own.filter(r=>now-Date.parse(r.createdAt)<86400000).length>=3)fail('하루 3건까지 신청할 수 있습니다.',429);if(own.some(r=>r.status==='pending'&&r.kind===input.kind&&r.targetId===(input.targetId||null)))fail('같은 대상의 검토 중인 신청이 있습니다.',409);
 const target=input.targetId?s.profiles.find(p=>p.id===input.targetId):null;if(input.kind!=='profile'&&!target)fail('대상 프로필을 찾을 수 없습니다.',404);
 const r={id:randomUUID(),ownerId:user.id,kind:input.kind,targetId:target?.id||null,status:'pending',createdAt:new Date(now).toISOString(),challenge:'hmdev-'+randomBytes(8).toString('hex'),evidenceUrl:safeUrl(input.evidenceUrl),note:text(input.note||'',1200),payload:null};
 if(input.kind==='profile'||input.kind==='correction')r.payload=cleanProfile(input.profile);
 if(input.kind==='credit'){const members=input.members;if(!Array.isArray(members)||members.length<2||members.length>6||new Set(members.map(m=>m.id)).size!==members.length||members.some(m=>!s.profiles.some(p=>p.id===m.id&&p.publicationStatus==='published')))fail('공개된 서로 다른 프로필 2~6개를 연결해주세요.');r.payload={title:text(input.title,120,true),people:members.map(m=>({id:m.id,role:text(m.role,60,true)})),sourceUrl:safeUrl(input.evidenceUrl)};}
 s.requests.push(r);return r;
}
export function review(s,admin,input,now=Date.now()){
 if(!admin?.isAdmin)fail('운영자 권한이 필요합니다.',403);const r=s.requests.find(x=>x.id===input.id);if(!r)fail('신청을 찾을 수 없습니다.',404);if(r.status!=='pending')fail('이미 처리된 신청입니다.',409);if(!['approved','rejected'].includes(input.decision))fail('처리 결과를 선택해주세요.');const note=text(input.note,1200,true);if(input.decision==='approved'&&input.evidenceChecked!==true)fail('공식 채널·당사자 근거를 먼저 확인해주세요.');
 if(input.decision==='approved'){
  if(r.kind==='profile'){if(s.profiles.length>=500)fail('초기 운영 프로필 한도를 확인해주세요.',503);s.profiles.push({...r.payload,id:r.id,ownerId:r.ownerId,publicationStatus:'published'});}
  if(r.kind==='correction'){const p=s.profiles.find(p=>p.id===r.targetId);if(!p)fail('대상 프로필을 찾을 수 없습니다.',404);Object.assign(p,r.payload);}
  if(r.kind==='removal'){const p=s.profiles.find(p=>p.id===r.targetId);if(!p)fail('대상 프로필을 찾을 수 없습니다.',404);p.publicationStatus='hidden';}
  if(r.kind==='credit'){if(r.payload.people.some(m=>!s.profiles.some(p=>p.id===m.id&&p.publicationStatus==='published')))fail('현재 비공개인 참여자가 있어 승인할 수 없습니다.',409);s.works.push({...r.payload,id:r.id,publicationStatus:'published'});}
 }
 r.status=input.decision;r.reviewNote=note;r.reviewedAt=new Date(now).toISOString();s.audit.push({requestId:r.id,adminId:admin.id,decision:r.status,at:r.reviewedAt});return r;
}
