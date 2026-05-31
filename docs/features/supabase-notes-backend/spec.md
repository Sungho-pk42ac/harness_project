# 기능 정의서 (초안) — supabase-notes-backend

## 개요

노트 데이터의 영속 계층을 **로컬 JSON Server(`localhost:3001`)에서 Supabase Postgres로 교체**한다.
현재 앱은 JSON Server에 묶여 있어 Vercel 같은 서버리스/정적 호스팅에 배포할 수 없다. 노트 CRUD를
클라우드 백엔드(Supabase)로 옮겨 **배포 가능성의 1순위 블로커를 제거**한다.

> 이 기능은 막연한 목표 "Vercel에 배포 가능한 프로덕트레벨 노트앱"을 향한 첫 번째 수직 슬라이스다.
> `auto-loop` Phase 1(멀티에이전트 발굴)에서 PM·Tech Lead·User Advocate·Devil's Advocate 합의로 선정됐다.

## 핵심 요구사항

- `src/api/notes.ts`의 데이터 소스를 JSON Server → Supabase로 교체한다.
- **공개 시그니처(`fetchNotes/createNote/updateNote/deleteNote`)와 반환 타입(`Note`)은 그대로 유지**한다
  (Context·컴포넌트·그 테스트는 건드리지 않는다).
- 기존 `db.json`의 노트 데이터를 Supabase로 1회 이관한다.

## 비고 (제약·범위 밖)

- **인증/RLS 잠금은 이번 범위 밖** — 다음 런 `supabase-auth-rls`. 이번엔 anon 읽기/쓰기를 임시 허용한다.
- **Vercel 배포 설정도 범위 밖** — 다음 런 `vercel-deploy-config`. 단 이 런이 끝나면 노트 측 localhost 의존은 사라진다.
- 인증(`/users`)은 여전히 JSON Server를 쓴다 → 완전한 배포 가능성은 인증 런까지 필요(Open Question에 기록).
- 실시간 구독·오프라인·낙관적 업데이트는 범위 밖(기존 "응답 기반 갱신" 패턴 유지).
