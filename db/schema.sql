-- 신규 전용 Supabase 프로젝트에서만 적용. 기존 프로젝트에 자동 적용하지 않습니다.
-- 서버 전용 초기 규모 저장소: 변경은 version 비교 후 원자적 PATCH(CAS).
begin;
create table public.vc_state (
 id integer primary key check (id = 1),
 version integer not null default 0 check (version >= 0),
 data jsonb not null check (data->>'schemaVersion' = '1')
);
alter table public.vc_state enable row level security;
revoke all on public.vc_state from public, anon, authenticated;
grant select, update on public.vc_state to service_role;
insert into public.vc_state(id,data) values(1,'{"schemaVersion":1,"profiles":[],"works":[],"requests":[],"audit":[]}'::jsonb);
commit;
-- 일반 사용자 직접 접근은 정책 없이 거부. 서버 API만 검증 후 데이터의 일부를 반환.
-- 본인 신청/근거/운영 로그를 정적 JSON이나 공개 API에 내보내지 않습니다.
