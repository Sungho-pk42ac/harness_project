# PRD — supabase-notes-backend

## 배경

앱은 노트 데이터를 로컬 JSON Server(`localhost:3001`)에서 받는다. 이 구조는 개발 머신에서만 동작하며
Vercel(서버리스/정적)에 배포할 수 없다. "Vercel 배포 가능한 프로덕트레벨 노트앱"이라는 목표의 **가장 큰
단일 블로커**가 이 로컬 백엔드다.

## 목표 / 비목표

**목표**

- 노트 CRUD를 클라우드 백엔드(Supabase Postgres)로 이전해, 새로고침·재배포 후에도 데이터가 보존되게 한다.
- `src/api/notes.ts` 외부 계약을 유지해 앱 전반(Context·컴포넌트·테스트)에 파급을 주지 않는다.

**비목표(이번 런)**

- 인증/RLS 사용자별 격리 (→ `supabase-auth-rls`)
- Vercel 배포 설정·도메인 (→ `vercel-deploy-config`)
- 실시간 동기화, 오프라인, 낙관적 업데이트

## 기능 요구사항 (FR)

| ID   | 요구사항                                                | 우선순위 | 수용기준(요약)                                   |
| ---- | ------------------------------------------------------- | -------- | ------------------------------------------------ |
| FR-1 | Supabase 클라이언트·`notes` 테이블·env가 갖춰진다       | P0       | env로 클라이언트 생성, 테이블 존재, 앱 빌드 성공 |
| FR-2 | `fetchNotes`가 Supabase에서 노트 목록을 읽는다          | P0       | 반환형 `Note[]` 동일, snake→camel 매핑           |
| FR-3 | `createNote`/`updateNote`가 Supabase에 쓴다             | P0       | 생성 노트 반환, 타임스탬프 클라이언트 채움       |
| FR-4 | `deleteNote`가 Supabase에서 제거한다 + 기존 데이터 이관 | P0       | 실제 삭제, db.json 노트 시드됨                   |

## 성공 지표

- 기존 145개 단위 테스트 + 신규 api 테스트가 전부 통과(회귀 0).
- `npm run build`(tsc) 성공. 앱이 Supabase만으로 노트 CRUD 동작(JSON Server 없이 notes 동작).

## 범위

- In: 노트 CRUD 4함수, 테이블/스키마, env, 클라이언트 모듈, api 테스트 재작성, 데이터 시드.
- Out: 위 "비목표" 전부.

## 리스크

- **모킹 패러다임 전환**(fetch→supabase client): slice-0에서 모킹 패턴 확정해 완화.
- **anon RLS 공개 쓰기**: 의도된 임시 상태. service_role 키 클라이언트 유입 금지(review 게이트).

## Open Questions

- **완전한 Vercel 배포 가능성은 인증 런까지 필요**: 이번 런 후에도 인증(`/users`)은 JSON Server에 남는다.
  따라서 "notes는 클라우드, auth는 로컬"의 하이브리드가 되며, 완전 배포는 `supabase-auth-rls` +
  `vercel-deploy-config` 완료 후 달성된다. (다음 런 1순위로 큐잉)
- anon 공개 쓰기는 데모 한정. 인증 런에서 RLS를 user_id 기반으로 잠근다.
