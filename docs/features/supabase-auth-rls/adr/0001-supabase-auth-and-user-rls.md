# ADR-0001 — Supabase Auth 이전 + notes user_id/RLS (한 PR 일관 머지)

## Status

Accepted

## Context

인증이 json-server 평문 비교라 보안·배포(localhost) 모두 결격. 노트는 Supabase로 옮겼으나 RLS가 anon
전체 허용(임시)이라 사용자 격리가 없다. 인증·RLS·시드를 따로 옮기면 앱이 반쪽 상태가 돼 E2E가 깨진다
(직전 런 supabase-notes-backend에서 함수 단위 슬라이스가 정확히 이 문제를 일으킴).

## Decision

- 로그인/세션/로그아웃을 **Supabase Auth**(`signInWithPassword`/`getSession`/`onAuthStateChange`/`signOut`)로 전면 교체. localStorage 수동 세션 제거.
- `notes.user_id uuid references auth.users` + RLS `user_id = auth.uid()` 4정책, anon 정책·GRANT 제거.
- `createNote`가 user_id를 **세션에서 명시 주입**(DB default auth.uid() 비의존).
- E2E는 **service_role `auth.admin.createUser`** 로 데모 계정 시드 + 데모 노트(user_id 박음), **json-server 제거**.
- 위 변경은 **한 PR로 함께 머지**(중간 상태가 깨지므로).

## Consequences

- (+) localhost 의존 제거 → Vercel 배포 가능 상태. 사용자별 노트 격리. 평문 비번 제거.
- (+) DOM 계약 불변으로 기존 E2E 헬퍼/컴포넌트 무변경.
- (−) auth.ts/AuthContext/관련 테스트 재작성. E2E 시드 방식 변경.
- (−) 회원가입 UI 부재 → 배포 데모는 시드 계정 사용(다음 런에서 signup).

## Alternatives Considered

- **raw auth.users SQL 시드**: 스키마 버전 의존·취약 → admin.createUser로 기각.
- **createNote가 default auth.uid()에 의존**: 보장 불확실 → 명시 주입으로 기각.
- **signup 포함**: 범위 확대(새 화면·검증·E2E 여정) → 다음 런으로 추방.
- **슬라이스 분리(인증/RLS/정리 따로 머지)**: 중간 상태 E2E 깨짐 → 한 PR 일관 머지로 기각.
