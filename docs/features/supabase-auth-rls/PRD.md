# PRD — supabase-auth-rls

## 배경

노트는 Supabase로 옮겼지만 **인증이 아직 json-server(localhost)** 라 Vercel 배포가 불가능하다. 이 런이
인증을 Supabase Auth로 옮겨 localhost 의존을 제거하고, 노트를 사용자별로 격리(RLS)한다.

## 목표 / 비목표

**목표**: Supabase Auth 로그인/세션/로그아웃, notes user_id + RLS 격리, json-server 제거(E2E 포함).
**비목표(다음 런)**: 회원가입 UI, 비번 재설정, OAuth, Vercel 배포 설정.

## 기능 요구사항 (FR)

| ID   | 요구사항                                  | 우선순위 | 수용기준(요약)                                       |
| ---- | ----------------------------------------- | -------- | ---------------------------------------------------- |
| FR-1 | 로그인이 Supabase Auth로 동작             | P0       | signInWithPassword, 실패 시 인라인 에러              |
| FR-2 | 세션 복원·로그아웃이 supabase.auth로      | P0       | getSession/onAuthStateChange/signOut                 |
| FR-3 | 노트가 사용자별로 격리                    | P0       | user_id + RLS(auth.uid()), createNote가 user_id 주입 |
| FR-4 | json-server 제거 + E2E Supabase Auth 시드 | P0       | E2E 그린, /users 미사용                              |

## 성공 지표

- 단위 테스트 전부 그린(회귀 0), tsc/build/eslint 통과.
- E2E(로컬 Supabase, json-server 없이) 그린 → **앱이 localhost 비의존**.

## 리스크

- 이메일 확인이 로그인 차단 → config off + 시드 email_confirm 두 겹.
- auth.users 시드 취약성 → service_role admin.createUser 사용(결정적).
- createNote가 user_id 누락 시 RLS 거부 → 세션에서 명시 주입(검증 필수).

## Open Questions

- 클라우드 데모 계정은 SQL/대시보드로 별도 생성(배포 시). 운영 데이터 백필은 범위 밖.
- 배포(`vercel-deploy-config`)는 다음 런 — 이 런 후 배포 가능 상태가 됨.
