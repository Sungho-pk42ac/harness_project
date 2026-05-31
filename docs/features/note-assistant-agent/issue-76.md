# NAA-5 (#76) · NAA-6 (#77) — 읽기·수정 도구의 에이전트 통합

> 도구 자체는 NAA-2(toolDispatcher)에서 구현·단위 테스트됨. 이 슬라이스는 **에이전트 루프를 통한
> end-to-end 동작**을 모킹 LLM으로 결정적으로 증명한다(ADR-0005). 새 런타임 로직 없음 — 통합 커버리지.

## NAA-5 — 읽기(searchNotes / listNotes)

- should searchNotes로 찾은 노트를 모델에 넘겨 답한다 when "회의 노트 찾아줘"
- should listNotes로 빈 결과를 안내한다 when 노트가 없다

## NAA-6 — 수정(updateNote)

- should editNote로 제목을 바꾼다 when "제목을 B로 바꿔줘"
- should 변경 필드가 없으면 수정하지 않고 에러를 회신한다 when updateNote에 id만

테스트: `src/lib/agent/graph.integration.test.ts` 6개. (검색은 AssistantContainer에서 filterNotes 재사용)

Closes #76, #77
