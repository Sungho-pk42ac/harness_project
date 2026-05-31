# 확정 정의서 — auth-signup

> 배포된 앱에서 사용자가 직접 계정을 만들 수 있게 한다(현재는 시드 데모 계정만 로그인 가능).
> LoginPage에 로그인/회원가입 모드 토글을 추가하되, **기본은 로그인 모드 + 기존 DOM 계약 보존**(tag/trash E2E 의존).

## 결정

1. **`auth.signUp(email, password)`**: `supabase.auth.signUp` → 이메일 확인이 꺼져 있으면 즉시 세션 생성 → User 반환.
   확인이 켜져 있어 세션이 없으면 'Check your email' 류 처리 — 본 범위는 confirmations off 전제(로컬/CI off, 클라우드는 배포 시 off 설정, DEPLOY.md 명시).
2. **AuthContext.signup(email, password)**: login과 동일 패턴(성공 시 setUser).
3. **LoginPage 모드 토글**: `mode: 'login' | 'signup'`, **기본 'login'**. 로그인 모드는 기존과 동일(placeholder 이메일/비밀번호, 버튼 "로그인") → E2E 불변. 회원가입 모드는 버튼 "회원가입" + 토글 링크로 전환. 실패 시 인라인 에러(기존 패턴).
4. **범위 밖**: 비밀번호 재설정, 이메일 변경, 비밀번호 강도 검증 UI(최소 길이는 Supabase 기본에 위임), OAuth.

## 영향 파일

- 변경: `src/api/auth.ts`(+signUp), `src/context/AuthContext.tsx`(+signup), `src/components/LoginPage.tsx`(모드 토글), `docs/DEPLOY.md`(클라우드 confirmations off 안내 보강).
- 테스트: `auth.test.ts`(signUp), `AuthContext.test.tsx`(signup), `App.test.tsx`(회원가입 흐름) 추가.
- 불변: 로그인 모드 DOM(이메일/비밀번호/로그인), tag·trash E2E.
