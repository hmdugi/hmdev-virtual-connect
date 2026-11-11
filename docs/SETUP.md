# 실제 연결과 검증 절차

현재 코드에는 인증·접수·검토·정정·비공개·크레딧 기능이 있습니다. 운영 DB·인증 메일·상업 배포는 미연결입니다.

## 개발

Node 24 이상에서 `npm run dev`. 외부 패키지 설치 없이 실행됩니다. 로컬 개발 모드는 가상 신청자/운영자 버튼을 표시하며 `.local/review.sqlite`에만 저장합니다. 개발 계정은 Vercel API에 존재하지 않습니다. `npm start`는 실제 Supabase 연결 모드이며 개발 로그인은 비활성입니다.

## AI가 이어서 수행할 작업

1. 신규 전용 Supabase 프로젝트를 확보합니다. 기존 전서구·MyRPG·apple-game DB는 사용하거나 수정하지 않습니다. 생성이 비용을 발생시키면 결제 전 사용자 결정이 필요합니다.
2. `db/schema.sql`을 전용 프로젝트에 적용합니다. 배포 전 별도 Postgres에서 쿼리·권한을 먼저 검증합니다. 현재 SQL은 원격 실행 검증을 마치지 않았습니다.
3. `anon`, `authenticated` 역할로 vc_state 읽기/쓰기 모두 거절되는지 확인합니다. service_role로 읽기 및 version 조건 PATCH, 오래된 version 거절을 확인합니다. DB 보안 어드바이저를 실행합니다.
4. Vercel 서버에 SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USER_IDS(인증된 운영자 UUID 목록), APP_ORIGIN(정확한 https origin)을 설정합니다. 비밀키를 프런트 파일이나 Git에 넣지 않습니다.
5. Supabase Auth 이메일 템플릿에 인증 코드 `{{ .Token }}`를 사용하고, 발송자·SMTP·발송 한도를 설정합니다. Auth CAPTCHA를 켜고 TURNSTILE_SITE_KEY를 설정합니다. 기존 계정 설정을 임의 변경하지 않습니다.
6. 실제 이메일 → 코드 인증 → HttpOnly 세션 → 신청 → 비공개 대기 → 다른 계정 접근 거절 → 운영자 근거 확인 → 승인 → 탐색 노출 → 정정/비공개 → 세션 만료/재발급 → 로그아웃을 검증합니다.
7. 승인 근거와 본인 확인 기준을 검증한 초기 참여자를 확보한 뒤 공개합니다. 회사 설립 전에도 브랜드 표기는 hmdev입니다. 실제로 설립된 회사라고 표시하지 않습니다.

## 최소 구조와 한계

- 프런트는 기존 HTML/JS, API는 Node 기본 fetch/Request/Response. 별도 프레임워크나 패키지 없음.
- 서버만 접근 가능한 vc_state 단일 JSONB 행에 상태를 저장합니다. version 비교 PATCH로 동시 갱신 충돌 시 최대 5회 재시도합니다. 초기 500 프로필/2,000 신청 한도이며, 한도 전 정규화된 테이블로 이전하고 신청 보관 정책을 적용해야 합니다.
- 공개 API는 승인된 소개·공식 주소·공개 크레딧만 반환합니다. 신청자 ID·근거 메모·확인 문구·운영 로그는 공개하지 않습니다.
- 검토함은 대기 신청 100개씩 처리합니다. 이메일 확인은 채널 소유 확인이 아닙니다. 운영자가 공식 채널 문구 또는 당사자 근거를 직접 확인하고 승인합니다. 크레딧은 참여자별 공개 근거 또는 동의가 필요합니다.
- 접수 제한: 이메일 확인 계정당 하루 3건, 동일 유형·대상의 대기 신청 1건. 계정 다중 생성 방지는 Auth CAPTCHA/메일 제한과 함께 검증해야 합니다. 모든 스팸을 차단한다고 보장하지 않습니다.
- 의뢰 결제·에스크로·이미지 업로드·실시간 채팅·커뮤니티 게시판은 첫 MVP 범위에 없습니다. 제작자는 공식 포트폴리오로 연결합니다.

## 사람이 해야 하는 것

결제·본인 계정 인증·발송 도메인 소유 확인, 초기 참여자의 실제 동의, 공개할 운영자 연락처 및 실제 민원 대응. 코드·테스트·설정 문서·배포 준비는 AI가 수행합니다. 민감한 신분증은 수집하지 않습니다.

운영 연락처·신청 보관 기간·삭제 요청 처리 절차는 공개 접수 전에 확정해야 합니다. 테스트 자료를 실제 유입이나 매출로 집계하지 않습니다.

## 실제 생성 진행 결과 — 2026-11-11

기존 조직과 분리된 `hmdev` 무료 조직을 생성했습니다. 조직 ID: kobvicwpaeiccrzbryoc. 새 DB 프로젝트 생성 화면에서 계정의 활성 무료 프로젝트 2개 한도에 도달했다는 차단을 확인했습니다. 새 DB는 생성되지 않았습니다. 기존 프로젝트 중지/삭제·유료 전환은 수행하지 않았습니다.

연결된 Supabase 도구에는 조직 생성 기능이 없어서 조직은 로그인한 대시보드에서 생성했습니다. 신규 조직/프로젝트를 연결 도구로 관리하려면 해당 범위의 연결도 필요합니다. 다음 선택은 추가 개발 계정의 무료 여력을 확인하여 전용 조직·DB를 만들거나, 유료 비용을 확인하고 별도로 결정하는 것입니다.

## DB 생성·초기 설정 완료 — 2026-11-11

앞선 무료 한도 차단 기록은 해결되었습니다. 사용자가 apple-game DB를 삭제하고 hmdev 프로젝트를 생성했습니다.

- 공용 조직: hmdev (kobvicwpaeiccrzbryoc), Free
- 공용 프로젝트: hmdev (lvrlqlggghcrikjjbidz), Healthy, 서울 ap-northeast-2
- 대시보드: https://supabase.com/dashboard/project/lvrlqlggghcrikjjbidz
- API URL: https://lvrlqlggghcrikjjbidz.supabase.co
- 생성 전 public 테이블 0개 확인. `db/schema.sql`에 해당하는 vc_state와 빈 상태 행 생성 완료. 다른 서비스의 테이블은 만들지 않았습니다.
- RLS true, anon SELECT/INSERT false, authenticated SELECT/UPDATE false, service_role SELECT/UPDATE true 확인.
- service_role의 현재 version 갱신 성공·오래된 version 갱신 0건을 SQL로 검사하고 rollback. version=0, request_count=0 보존 확인. 실제 사용자 데이터 없음.
- 자동 생성된 public.rls_auto_enable()의 공개/로그인 사용자 SECURITY DEFINER 실행 권한 경고 2건 발견. `db/harden-auto-rls.sql`에 해당하는 권한 회수 후 두 역할 EXECUTE false 확인.

현재 ChatGPT의 Supabase 연결은 기존 조직 범위로 한정되어 새 프로젝트 조회가 권한 오류를 반환합니다. 따라서 초기 SQL은 로그인된 대시보드에서 실행했습니다. 향후 자동 관리·인증 설정·앱 서버 환경변수 연결을 위해 hmdev 조직/프로젝트 범위의 Supabase 앱 연결이 필요합니다. DB 비밀번호나 서비스 비밀키를 채팅/GitHub에 올리지 않습니다.

이 DB는 hmdev 사업 공용입니다. vc_state는 버튜버용 서버 비공개 테이블이며 다른 서비스가 임의로 읽게 하지 않습니다. 향후 공용 DB를 사용하는 서비스에는 서비스별 테이블·권한을 따로 설계하고, 전체 DB 권한의 service_role 키를 모든 앱에 무차별 배포하지 않습니다.

실제 인증 메일·서버 비밀키 프로비저닝·Vercel 앱 연결/상업 배포는 아직 완료하지 않았습니다.

보안 어드바이저 재검사: Errors 0 / Warnings 0. 정보성 안내 1건은 서버 전용 vc_state에 일반 사용자 허용 정책을 만들지 않은 의도된 기본 거부 설정입니다.

## 실제 연결 완료 범위 — 2026-11-11

이전의 ChatGPT 연결 권한 오류는 해결되었습니다. hmdev 연결로 실제 프로젝트/SQL/보안 어드바이저 조회가 성공했습니다.

### 권장 실행 구조

Vercel 프런트/동일 출처 API 프록시 → Supabase virtual-api Edge Function → hmdev DB의 vc_state. 서버 비밀키는 Supabase 런타임이 제공하며 Vercel·GitHub·브라우저로 복사하지 않습니다. 위의 직접 SUPABASE_SERVICE_ROLE_KEY 환경변수 설정 절차는 선택적 직접 실행 모드이며 현재 배포 방식에는 필요하지 않습니다.

- 실제 Edge Function: virtual-api, version 1, ACTIVE
- 함수 주소: https://lvrlqlggghcrikjjbidz.supabase.co/functions/v1/virtual-api
- Vercel 준비 프로젝트: hmdev-virtual-connect, prj_LgAqSzAt8K7uyAOtTfkhUJzkabzB (아직 프런트 배포 없음)
- Vercel production 환경변수 VIRTUAL_API_URL에 함수 주소만 저장 완료. 서비스 키 저장 없음. Preview 환경에는 실제 DB 연결을 주입하지 않았습니다.
- `npm run edge:build`는 기존 server 모듈에서 .edge-build 배포 파일을 생성합니다. 비밀키는 생성물에 포함하지 않습니다. 로컬 SQLite 코드는 서버 공통 모듈에서 분리했고 실제 함수에는 넣지 않았습니다.

### 실제 HTTP 검사 결과

| 경로 | 결과 |
|---|---|
| /api/config | 200, connected, registrationEnabled=false |
| /api/catalog | 200, 실제 DB에서 people/works 빈 배열 |
| /api/me | 200, user=null |
| /api/requests | 비로그인 401 |
| /api/admin/requests | 비로그인 401 |
| /api/auth/start | 공개 접수 중지 503 |

비밀키를 보지 않고 실제 런타임 환경변수를 사용하는 DB 읽기를 확인했습니다. 실제 사용자 신청/매출 데이터를 넣지 않았습니다. 로그인 사용자 인증과 신청·승인 전체 HTTP 흐름은 아직 실사용 검증 전입니다.

### 접수를 열기 전에

- Vercel 프런트를 검토 가능한 환경에 배포하고 실제 Origin을 Edge의 APP_ORIGIN과 맞춥니다. 현재 APP_ORIGIN은 https://hmdev-virtual-connect.vercel.app 입니다. 허용 출처를 임의의 요청 헤더로 신뢰하거나 광범위한 와일드카드로 풀지 않습니다.
- Supabase 이메일 OTP 템플릿·실제 발송 설정·CAPTCHA를 검증합니다. 인증된 운영자 UUID를 서버 비밀 설정 VIRTUAL_ADMIN_USER_IDS에 지정합니다.
- 공개 운영 절차·보관/삭제 대응을 준비한 뒤 VIRTUAL_REGISTRATION_ENABLED=true를 설정하고 함수를 다시 배포하여 연결된 실제 사용자 흐름을 확인합니다. 현재는 false로 기본 중지되어 있습니다.
- Gateway JWT 검사는 false지만 보호 API는 makeHandler의 Supabase 사용자 확인/권한 검사로 인증합니다. 공개 목록/이메일 인증 경로와 HttpOnly 쿠키 인증을 함께 제공하기 위한 구조이며 개발용 가상 계정은 함수에 존재하지 않습니다.
- 현대식 sb_secret 키는 apikey로만 전달합니다. JWT가 아닌 키를 Authorization Bearer로 보내지 않습니다.

공통 JavaScript 구문 검사 및 19개 자동 테스트 통과. 현재는 실제 DB+서버 API 연결 완료이며 프런트 공개/이메일 인증/운영자 승인 전체 검증/상업 운영 개시는 미완료입니다.
