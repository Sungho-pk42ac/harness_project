# 확정 정의서 — supabase-auth-rls

> 멀티에이전트 합의(Tech Lead 제안 + Devil's Advocate 범위 축소). 인증을 Supabase Auth로 옮겨
> json-server(localhost) 의존을 제거 → Vercel 배포 가능. 노트는 user_id/RLS로 사용자별 격리.

## 1. 범위 (한 PR로 일관 머지 — 직전 런 교훈)

- **포함**: ① 로그인 경로(auth.ts/AuthContext)를 Supabase Auth로 ② `notes.user_id` + RLS(`auth.uid()`) ③ E2E를 Supabase Auth 시드로 + **json-server 완전 제거**.
- **제외(다음 런)**: 회원가입 UI(`auth-signup`), 비밀번호 재설정·OAuth·프로필. 데모 계정은 시드로 제공.
- **근거**: 셋 중 하나만 바꾸면 앱이 반쪽(로그인 Supabase·노트 anon 등)이 돼 E2E가 깨진다 → 함께 머지.

## 2. 이메일 확인 — 끈다 (두 겹)

- config `[auth.email] enable_confirmations = false` **그리고** 시드 계정을 `email_confirm: true`로 생성.
- **근거**: 로컬/CI에 메일 서버 없음. 확인 메일 없이 즉시 로그인 가능해야 E2E가 돈다. config 한 줄에만 의존하지 않는다(DA).

## 3. 세션 — supabase.auth로 전면 교체

- `AuthContext`: `supabase.auth.getSession()`(초기 복원) + `onAuthStateChange`(구독) + `signInWithPassword`(login) + `signOut`(logout). localStorage 수동 관리(`auth.user`) 제거(supabase-js가 persist).
- `User = {id, email}` 유지(session.user에서 매핑). **LoginPage DOM 계약 불변**(placeholder "이메일"/"비밀번호", 버튼 "로그인", 성공 후 "+ 새 노트") — E2E 헬퍼가 의존.
- 에러: supabase `Invalid login credentials` → LoginPage 한국어 인라인 에러 패턴 유지.

## 4. RLS — user_id = auth.uid()

- 마이그레이션: `notes.user_id uuid references auth.users(id) on delete cascade`. anon 정책·GRANT **제거/REVOKE**, `authenticated`에 GRANT + 본인 행 4정책(`user_id = auth.uid()`).
- **`createNote`는 user_id를 세션에서 명시 주입**(`getSupabase().auth.getUser()`) — DB default auth.uid()에 의존하지 않는다(DA: 검증 필수). `fetchNotes`는 RLS가 본인 행만 반환하므로 코드 불변.

## 5. 기존 노트 — 데모 유저 귀속

- E2E/로컬 시드 노트는 데모 계정 id를 `user_id`로 박는다. user_id 없는 행은 RLS상 안 보이므로 시드에서 처리(클라우드 운영 데이터 백필은 범위 밖).

## 6. E2E 인증 시드 — service_role admin.createUser (견고)

- raw `auth.users` SQL 대신 `e2e/seed.mjs`가 **service_role 키로 `supabase.auth.admin.createUser({email, password, email_confirm:true})`** 로 데모 계정 생성 + 그 user_id로 데모 노트 insert.
- **근거**: auth.users/identities 스키마 직접 insert는 버전 의존·취약(직전 anon-key 401류 시간낭비 위험). admin API가 결정적.
- json-server 제거: `dev:e2e`=`node e2e/seed.mjs && vite`(json-server 빼기), CI에서 인증 서버 제거. seed.mjs는 Supabase로 시드.

## 영향 파일

- 변경: `src/api/auth.ts`(또는 Context 흡수), `src/context/AuthContext.tsx`, `src/api/notes.ts`(createNote user_id), `src/components/LoginPage.tsx`(에러만), `e2e/seed.mjs`, `package.json`(dev:e2e), `.github/workflows/ci.yml`, `supabase/config.toml`.
- 신규: `supabase/migrations/<ts>_notes_user_id_rls.sql`.
- 테스트: `auth.test.ts`, `AuthContext.test.tsx`, `notes.test.ts`(createNote) 재작성.
- 불변: LoginPage DOM, NoteList/NoteEditor 등.
