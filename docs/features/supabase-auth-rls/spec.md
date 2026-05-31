# 기능 정의서 (초안) — supabase-auth-rls

## 개요

인증을 **json-server(`localhost:3001/users`, 평문 비번 비교) → Supabase Auth**로 이전한다. 이것이 남은
**Vercel 배포 마지막 블로커**(앱이 아직 localhost에 의존). 동시에 `notes.user_id` + RLS로 노트를 사용자별로 격리한다.

## 핵심 요구사항

- 로그인/세션/로그아웃을 Supabase Auth로. localStorage 수동 세션 제거.
- `notes`에 `user_id` + RLS(`auth.uid()`), anon 임시 정책 제거. `createNote`가 user_id 주입.
- E2E를 Supabase Auth 시드로 전환하고 **json-server를 완전히 제거**.

## 비고 (범위 밖 — 다음 런)

- 회원가입 UI(`auth-signup`), 비밀번호 재설정, OAuth, 프로필.
- Vercel 실제 배포 설정(`vercel-deploy-config`) — 단 이 런이 끝나면 localhost 의존이 사라져 배포 가능 상태가 된다.
