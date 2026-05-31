# 수직 슬라이스 이슈 — supabase-auth-rls

> 앱 일관 단위. 인증·RLS·시드·json-server 제거는 **함께 머지**해야 중간 깨짐이 없다(ADR-0001).
> 따라서 단일 일관 이슈 1개로 진행한다(회원가입은 다음 런 `auth-signup`).

---

## AUTH-1 — Supabase Auth 전면 이전 + notes user_id/RLS + json-server 제거

**설명**: 로그인/세션/로그아웃을 Supabase Auth로, notes를 user_id/RLS로 격리, E2E를 Supabase Auth 시드로
전환하고 json-server 제거. LoginPage DOM 계약 불변.

**범위**: `src/api/auth.ts`, `src/context/AuthContext.tsx`, `src/api/notes.ts`(createNote user_id),
`supabase/migrations/`(user_id+RLS), `supabase/config.toml`(confirmations off), `e2e/seed.mjs`(admin.createUser),
`package.json`(dev:e2e), `.github/workflows/ci.yml`. **범위 밖**: 회원가입 UI, 비번 재설정, 배포 설정.

**AC**

- Given 시드된 데모 계정, When 이메일/비번으로 로그인, Then `signInWithPassword`로 인증되어 노트 화면 진입.
- Given 잘못된 자격, When 로그인, Then 인라인 에러(기존 한국어 패턴) 표시.
- Given 로그인 세션, When 새로고침, Then `getSession`으로 세션 복원(localStorage 수동 X). When 로그아웃, Then `signOut`.
- Given 로그인 유저, When `createNote`, Then user_id가 세션에서 주입되어 본인 노트로 저장되고, RLS로 본인 노트만 조회된다.
- Given 인증이 Supabase로 이전됨, Then 앱·E2E·CI가 json-server(/users)에 의존하지 않는다.

**DoD**: 단위 전부 그린(auth/AuthContext/notes 테스트 재작성, 회귀 0) · tsc/build/eslint 통과 ·
**E2E(로컬 Supabase, json-server 없이) 그린** · service_role 키는 E2E 시드(CI 전용)에만, 클라이언트 번들 미포함.

---

## 등록된 GitHub 이슈 (역링크)

- AUTH-1 → #63
