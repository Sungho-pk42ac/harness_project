# ADR-0003 — 도구 실행은 브라우저(사용자 세션)에서 → RLS 자동 준수

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

에이전트가 `createNote`/`updateNote`/`deleteNote`/`searchNotes`/`listNotes` 도구를 실행해야 한다.
서버(Edge Function)에서 실행하면 service_role 키를 쓰기 쉬워 **RLS가 우회**돼 타사용자 노트가 샐
치명적 위험이 있다. 또 서버 도구 실행은 기존 `src/api`(브라우저 전용, `import.meta.env` 의존)를 재사용
못 한다.

## Decision

도구 실행을 **브라우저에서** 한다. `src/lib/agent/toolDispatcher.ts`가 도구 호출(name+args)을 받아
**기존 `NotesContext` 액션**(`addNote`/`editNote`/`removeNote`)과 **`src/utils`/`src/api`**로 위임한다.
브라우저는 이미 로그인 사용자 세션(anon 키 + JWT)을 쓰므로, 기존 RLS 정책(`user_id = auth.uid()`)이
**그대로** 적용된다. 별도 권한 코드가 필요 없다.

## Consequences

- **RLS 자동 준수** — 에이전트는 본인 노트만 읽고/쓴다. service_role 키는 어디에도 주입하지 않는다.
- 도구 실행 결과가 `NotesContext`를 거치므로 **노트 목록/에디터에 즉시 반영**(양방향 동기화 공짜).
- 소프트 삭제 규약(`removeNote` = `deletedAt` PATCH) 등 기존 비즈니스 규칙을 그대로 상속.
- 도구는 순수 함수 경계(`toolDispatcher`)로 분리 → 액션을 모킹해 결정적 단위 테스트.

## Alternatives Considered

- **Edge Function에서 도구 실행(사용자 JWT 클라이언트)**: RLS는 지킬 수 있으나 [ADR-0001]의 TDD 누수 +
  매핑/규칙 이중관리 + 양방향 반영을 별도 배선해야 함 → 기각.
- **service_role로 서버 실행**: RLS 우회 위험으로 즉시 기각.
