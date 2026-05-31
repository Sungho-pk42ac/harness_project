# ADR-0005 — LLM은 모킹해 결정적 테스트, 실제 호출은 E2E 스모크

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

이 레포는 TDD 7단계(RED→GREEN…)를 강제한다. 그러나 LLM 출력은 **비결정적**이라 매 실행 결과가 달라
RED/GREEN을 고정할 수 없다. auto-loop의 품질 게이트가 닿으려면 결정적 테스트 경계가 필요하다.

## Decision

LLM 호출을 **단일 경계(`LlmClient` 인터페이스)** 뒤로 격리한다. 테스트 계층을 셋으로 나눈다:

1. **순수 로직(LLM 무관)** — `toolDispatcher`, 도구 인자 검증, 메시지 reducer, 확인게이트 전이.
   `src/lib`에 두고 일반 Vitest 단위 테스트. (커버리지의 대부분)
2. **그래프 라우팅** — `runAgent`에 **모킹된 `LlmClient`**(고정 tool_call/응답 시퀀스)를 주입해, "LLM이 X
   도구를 부르면 → 디스패치 → 결과 회신 → 종료" 같은 전이를 **결정적으로** 검증.
3. **실제 OpenAI + 프록시 함수** — Playwright **E2E 스모크 1개**. `OPENAI_API_KEY` 있을 때만 실행하고,
   없으면 `test.skip` + 수동 가이드. (라이브 동작 확인용, 비결정성은 느슨하게 단언)

## Consequences

- 핵심 로직 전부가 RED/GREEN으로 검증 가능 → auto-loop 게이트 통과.
- 실제 LLM 비용/지연은 E2E 스모크 1회로 한정.
- `LlmClient` 경계가 OpenAI↔다른 공급자 교체점도 됨(후속 유연성).

## Alternatives Considered

- **실제 LLM로 RED/GREEN**: 비결정·비용·지연으로 불가 → 기각.
- **테스트 없이 수동 검증만**: 레포 규약·게이트 위반 → 기각.
