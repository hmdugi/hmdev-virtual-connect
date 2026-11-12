import json,re,hashlib,collections,argparse
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,urljoin
parser=argparse.ArgumentParser(description='공개 디렉터리 HTML에서 미검증 후보 사실 정보만 추출');parser.add_argument('html');parser.add_argument('--date',required=True);args=parser.parse_args();s=Path(args.html).read_text();data,_=json.JSONDecoder().raw_decode(s[s.index('const DATA = ')+len('const DATA = '):]);known=json.loads(Path('ingest/directory-seed.json').read_text());byname={r['display_name'].replace(' ',''):r for r in known}
def links(s):
 out=[]
 for value in re.findall(r'https?://[^\s;，,]+',s or ''):
  p=urlsplit(value.rstrip(').'));path=p.path.rstrip('/');out.append(urlunsplit(('https',p.netloc.lower(),path,'','')))
 return list(dict.fromkeys(out))
groups=[r for r in data if r.get('소속_그룹') not in ['치지직 개인 버튜버','SOOP 개인 버튜버']];chzzk=[r for r in data if r.get('소속_그룹')=='치지직 개인 버튜버'];soop=[r for r in data if r.get('소속_그룹')=='SOOP 개인 버튜버'];selected=groups+chzzk+soop;rows=[];merged=[]
for record in selected:
 name=record.get('활동명_한글','').strip()
 if not name:continue
 urls=links(record.get('공식_채널',''));social=links(record.get('공식_SNS',''));youtube=next((u for u in urls if urlsplit(u).netloc in ['youtube.com','www.youtube.com'] and ('/@'in u or '/channel/'in u)),None);broadcast=next((u for u in urls if any(host in urlsplit(u).netloc for host in ['chzzk.naver.com','sooplive.com','afreecatv.com'])),youtube)
 source=urljoin('https://vtarchive.minky1117.workers.dev',record.get('_url','/'));evidence={'url':source,'kind':'secondary_directory_lead','checked_on':args.date,'upstream_checked_on':record.get('확인_날짜'),'verification':'unverified','fields':['display_name','agency','primary_platform','primary_url','youtube_url','social_urls','topics'],'reported_career':record.get('데뷔일'),'reported_status':record.get('현재_상태'),'reported_agency':record.get('소속_그룹')}
 if name.replace(' ','') in byname:
  merged.append({'id':byname[name.replace(' ','')]['id'],'source':evidence});continue
 group=record.get('소속_그룹');agency=None if group in ['치지직 개인 버튜버','SOOP 개인 버튜버','확인 필요'] else group
 genres=record.get('콘텐츠_장르','');topics=[] if '확인 필요' in genres else [v.strip() for v in re.split('[,·/]',genres) if v.strip()][:12]
 reasons=['secondary_source_needs_verification','broadcast_hours_unverified','career_unverified','recent_live_activity_unverified']
 if not agency:reasons.append('agency_unverified')
 if not youtube:reasons.append('youtube_missing')
 if not social:reasons.append('sns_missing')
 if not topics:reasons.append('topics_missing')
 status=record.get('현재_상태','')
 if any(word in status for word in ['졸업','종료','중단','해지','퇴출','은퇴']):reasons.append('source_reports_inactive_needs_verification')
 primary='치지직' if broadcast and 'chzzk'in broadcast else 'SOOP' if broadcast and ('sooplive'in broadcast or 'afreecatv'in broadcast) else 'YouTube' if broadcast else None
 rows.append({'id':'lead-'+hashlib.sha256(source.encode()).hexdigest()[:20],'display_name':name[:100],'agency':agency,'primary_platform':primary,'primary_url':broadcast,'youtube_url':youtube,'social_urls':social,'topics':topics,'career_started_no_later_than':None,'career_start_is_exact':False,'sources':[evidence],'review_status':'pending','review_reasons':reasons})
# Stable channel dedupe within this batch; do not equate two missing links.
unique={};dupes=0
for row in rows:
 key=row['primary_url'] or row['sources'][0]['url']
 if key in unique:
  unique[key]['sources']+=row['sources'];dupes+=1
 else:unique[key]=row
rows=list(unique.values());out=Path('ingest');(out/f'batch-{args.date}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(out/f'batch-{args.date}-existing-evidence.json').write_text(json.dumps(merged,ensure_ascii=False,indent=2));summary={'source_records_considered':len(selected),'new_candidates':len(rows),'matched_existing':len(merged),'deduplicated':dupes,'platforms':dict(collections.Counter(r['primary_platform'] for r in rows)),'basic_link_complete':sum(bool(r['primary_url'] and r['youtube_url'] and r['social_urls']) for r in rows),'topics_present_unverified':sum(bool(r['topics']) for r in rows),'inactive_flags':sum('source_reports_inactive_needs_verification'in r['review_reasons'] for r in rows)};(out/f'batch-{args.date}-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
