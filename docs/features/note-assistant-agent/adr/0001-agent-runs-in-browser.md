# ADR-0001 — 에이전트(LangGraph) 실행 위치 = 브라우저, 루프는 인터페이스 뒤로 추상화

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

목표는 LangGraph로 tool-calling 에이전트를 만드는 것이다. 후보 실행 위치는 (a) Supabase Edge
Function(Deno), (b) 브라우저(`src/`). Devil's Advocate가 (a)의 두 약점을 지적했다: LangGraph.js의
Deno 동작이 미검증이고, Edge Function 코드는 Vitest(`src/`) 수집 밖이라 이 레포의 TDD 게이트가 닿지
못한다. 한편 OpenAI 키는 브라우저에 노출하면 안 된다.

## Decision

**에이전트 오케스트레이션(LangGraph.js StateGraph)을 브라우저(`src/lib/agent`)에서 실행**한다.
OpenAI 키 노출 문제는 [ADR-0002](0002-edge-function-as-openai-proxy.md)의 프록시로 푼다.
또한 에이전트 루프를 **`runAgent(messages, deps): AgentResult` 인터페이스 뒤로 추상화**해, LangGraph가
Vite 번들에서 문제를 일으키면 동등한 순수 tool-loop 구현으로 **무중단 폴백**할 수 있게 한다(테스트는
인터페이스 기준이라 구현 교체에 불변).

## Consequences

- 그래프·라우팅·도구 디스패치·확인게이트 로직이 전부 `src/`에 있어 **Vitest로 결정적 테스트** 가능.
- LangGraph를 Deno에서 돌릴 필요가 없어져 호환성 리스크 제거.
- 브라우저 번들 크기 증가(LangChain 의존성) — 코드 스플리팅(동적 import)으로 채팅 패널 열 때만 로드.
- LLM이 도구를 "결정"하지만 실행은 클라이언트 신뢰 — 단일 사용자 노트앱 + RLS라 영향 범위가 본인 노트로 한정([ADR-0003]).

## Alternatives Considered

- **(a) Edge Function(Deno)에서 LangGraph 실행**: TDD 게이트 누수 + Deno 호환 미검증으로 기각.
- **(c) 프레임워크 없이 직접 tool-loop**: 가능하나 사용자가 LangGraph를 명시. 폴백 경로로만 보유.
