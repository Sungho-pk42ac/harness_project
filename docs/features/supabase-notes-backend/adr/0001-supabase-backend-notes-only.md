# ADR-0001 — 노트 영속 계층을 Supabase로 교체 (notes만, id=string/uuid)

## Status

Accepted

## Context

노트 데이터가 로컬 JSON Server에 묶여 Vercel 배포가 불가능하다. 클라우드 백엔드가 필요하고, 이 세션에
Supabase MCP가 연결돼 있다. 인증까지 한 번에 옮기면 한 기능의 범위를 크게 초과한다(세션·해싱·RLS).

## Decision

- **노트 CRUD만** Supabase Postgres + `@supabase/supabase-js`로 옮긴다. 인증은 별도 런.
- `Note.id`는 **`string` 유지**, Supabase `notes.id`는 `uuid default gen_random_uuid()`.
  (코드 확인: `id`는 이미 `string`이라 타입 전환 없음.)
- `src/api/notes.ts`의 공개 시그니처·반환 타입을 **불변** 유지(교체는 내부 구현만).

## Consequences

- (+) 교체 지점이 `api/notes.ts` 한 파일 + 신규 `supabaseClient.ts`로 격리. Context·컴포넌트·그 테스트 무변경.
- (+) 타입 전파 0(id가 이미 string).
- (−) `api/notes.test.ts`는 모킹 패러다임 전환으로 재작성 필요.
- (−) 인증은 여전히 JSON Server → 완전 배포 가능성은 다음 런까지 미뤄짐(PRD Open Question).

## Alternatives Considered

- **노트+인증 동시 마이그레이션**: 범위 과대(한 기능 규칙 위반), 리스크 결합 → 기각.
- **id를 number(bigint)로 전환**: 현재 id가 string이라 불필요한 전환 비용만 발생 → 기각.
- **PostgREST raw fetch로 fetch 모킹 재활용**: SDK 이점(타입·세션) 포기 → 기각.
