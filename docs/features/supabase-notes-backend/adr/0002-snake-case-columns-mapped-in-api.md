# ADR-0002 — snake_case 컬럼 + api 계층에서 camelCase 매핑

## Status

Accepted

## Context

`Note` 타입은 camelCase(`createdAt`, `updatedAt`, `isPinned`, `deletedAt`)다. Postgres 관례와
`supabase-postgres-best-practices`(lowercase identifiers)는 snake_case를 권한다. 둘을 어디서 잇느냐가
"시그니처 불변" 유지의 관건이다.

## Decision

- DB 컬럼은 **snake_case**(`created_at`, `updated_at`, `is_pinned`, `deleted_at`, `tags text[]`).
- **`src/api/notes.ts`가 매핑 전담**: 읽기 시 row(snake) → `Note`(camel)로, 쓰기 시 `Note`/payload(camel)
  → row(snake)로 변환하는 작은 매퍼(`toNote`/`toRow`)를 둔다.

## Consequences

- (+) `Note` 타입·Context·컴포넌트가 camelCase 그대로 → 앱 전체 불변.
- (+) DB가 Postgres 관례를 따라 추후 SQL·인덱싱·RLS가 자연스럽다.
- (−) api에 매핑 함수 한 쌍이 추가됨(순수 함수라 테스트 용이 — `lib`/`utils` 패턴과 정합).

## Alternatives Considered

- **camelCase 컬럼(따옴표 식별자)**: 매핑은 없애지만 모든 쿼리에서 `"createdAt"` 따옴표 강제 + 관례 위반 → 기각.
- **Context/컴포넌트까지 snake_case 전파**: 시그니처 불변 위반, 파급 큼 → 기각.
