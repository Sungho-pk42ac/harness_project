# 확정 정의서 — vercel-deploy-config

> 설정·문서 중심 기능(앱 로직 변경 없음). 인증·노트가 Supabase로 옮겨져 localhost 의존이 없어진 뒤,
> 실제 Vercel 배포가 가능하도록 설정과 가이드를 제공한다.

## 결정

1. **`vercel.json`**: framework=vite, buildCommand=`npm run build`(tsc+vite build), outputDirectory=`dist`,
   SPA rewrite `/(.*)` → `/`. — 근거: Vite 자동 인식 + 빌드 시 타입체크 게이트 유지 + 단일 페이지 fallback.
2. **환경 변수**: `VITE_SUPABASE_URL`·`VITE_SUPABASE_ANON_KEY`만 Vercel에 설정(publishable 키, 공개 안전).
   `service_role`는 클라이언트/배포 env에 **절대 미포함**. — 근거: 키 노출 보안.
3. **배포 가이드**: `docs/DEPLOY.md`에 Supabase 준비(스키마·데모 계정)·Vercel 설정·확인 절차 문서화.
4. **실제 `vercel deploy` 실행은 범위 밖**: 사용자의 Vercel 계정/토큰이 필요. 이 런은 "배포 가능한 설정·문서"까지.

## 범위

- In: `vercel.json`, `docs/DEPLOY.md`, README 링크.
- Out: 실제 배포 실행, 커스텀 도메인, 회원가입(`auth-signup`), 자동저장(`auto-save`).

## 검증

- `npm run build`가 `dist/`를 생성(기존 CI build 잡으로 검증). 앱 로직·테스트 불변(회귀 0).
- `vercel.json`에 시크릿 없음.
