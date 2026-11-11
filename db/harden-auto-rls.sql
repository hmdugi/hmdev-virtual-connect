-- Supabase의 자동 RLS 생성 함수가 존재하는 경우에만 실행 권한을 제한합니다.
-- 이벤트 트리거의 소유자 실행은 유지하고 Data API 사용자 직접 호출을 막습니다.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
