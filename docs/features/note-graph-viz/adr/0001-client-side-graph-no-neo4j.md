# ADR-0001 — 별도 Neo4j 없이 클라이언트에서 노트→그래프 빌드

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

사용자가 Neo4j(속성 그래프 DB)를 참고로 제시했다. 그러나 SLNOTE 데이터는 이미 Supabase에 있고, 노트
수는 단일 사용자 규모다. 별도 그래프 DB 서버를 세우면 인프라·동기화·RLS 복잡도가 급증한다.

## Decision

별도 Neo4j 서버를 두지 않는다. Neo4j의 **속성 그래프 모델**(노드/관계/속성)을 개념적으로만 차용하고,
기존 노트 배열에서 **클라이언트 순수 함수**(`buildNoteGraph`)로 `{nodes, edges}`를 만든다.

## Consequences

- 인프라 추가 0, 기존 RLS·데이터 흐름 그대로. 그래프 빌드가 결정적이라 단위 테스트 쉬움.
- 대량 노트(수백+) 성능은 클라이언트 한계 → MVP 단순 렌더, 후속 캡/샘플링(Open Question).

## Alternatives Considered

- **실제 Neo4j 서버 + 동기화**: 인프라·동기화·RLS 복잡, 단일 사용자 규모에 과함 → 기각.
- **graphify 산출물 재사용**: graphify는 별도 HTML 아티팩트 — 인앱 인터랙션/노트 클릭 연동이 어려움 → 후속 참고만.
