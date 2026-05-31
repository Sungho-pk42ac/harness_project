# 배포 가이드 — Vercel + Supabase

이 앱은 **Vite SPA(프론트) + Supabase(노트·인증)** 구조다. 백엔드가 클라우드(Supabase)에 있으므로
Vercel 같은 정적/서버리스 호스팅에 그대로 배포할 수 있다(로컬 json-server 의존 없음).

## 1. Supabase 준비 (배포 대상 클라우드 프로젝트)

- **스키마**: `supabase/migrations/`의 마이그레이션이 적용돼 있어야 한다(`notes` 테이블 + `user_id` + RLS).
  이 레포의 클라우드 프로젝트(`lfqedhbumxvaopocabae`)에는 이미 적용됨. 새 프로젝트라면
  `supabase link` 후 `supabase db push`로 적용한다.
- **이메일 확인**: 회원가입 UI가 아직 없으므로(다음 기능 `auth-signup`), 데모 계정을 **대시보드에서
  생성**한다 — Authentication → Users → Add user → 이메일/비번 입력 + "Auto Confirm User" 체크.
  (또는 `auth-signup` 배포 후 앱에서 직접 가입. 그 경우 Authentication → Providers → Email에서
  "Confirm email"을 끄거나 메일 설정을 구성한다.)

## 2. Vercel 설정

1. Vercel에서 이 GitHub 저장소를 Import. 프레임워크는 **Vite**로 자동 인식된다(`vercel.json`이 명시).
   - Build Command: `npm run build` (tsc 타입체크 + vite build)
   - Output Directory: `dist`
2. **환경 변수**(Project Settings → Environment Variables)에 클라우드 Supabase 값을 넣는다:
   - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = publishable/anon 키 (공개 가능 — `service_role` 키는 **절대 넣지 말 것**)
3. Deploy. SPA 라우팅은 `vercel.json`의 rewrite(`/(.*)` → `/`)로 처리된다.

## 3. 확인

- 배포 URL 접속 → 로그인 화면 → 데모 계정으로 로그인 → 노트 CRUD가 클라우드(Supabase)에 영속되는지 확인.
- 새 기기/브라우저에서도 같은 계정으로 동일 노트가 보이면 성공.

## 참고

- `.env`(로컬)는 gitignore. 위 두 env는 Vercel·로컬 각각에 설정한다(`.env.example` 참고).
- E2E/CI는 로컬 Supabase 스택(`supabase start`)으로 격리 실행된다(`.github/workflows/ci.yml`).
- 미구현(다음 런): `auth-signup`(앱 내 회원가입), `auto-save`(자동 저장).
