# ADR 인덱스 — note-assistant-agent

기술 결정 하나당 한 파일. 한 번 Accepted 되면 불변(번복 시 새 ADR로 Superseded).

| #                                             | 제목                                                                    | 상태     |
| --------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| [0001](0001-agent-runs-in-browser.md)         | 에이전트(LangGraph) 실행 위치 = 브라우저, 루프는 인터페이스 뒤로 추상화 | Accepted |
| [0002](0002-edge-function-as-openai-proxy.md) | Edge Function은 OpenAI 프록시 + 인증 게이트 한 가지만                   | Accepted |
| [0003](0003-tools-execute-client-side.md)     | 도구 실행은 브라우저(사용자 세션)에서 → RLS 자동 준수                   | Accepted |
| [0004](0004-deletion-confirmation-gate.md)    | 삭제는 소프트 삭제 + 실행 전 확인 게이트                                | Accepted |
| [0005](0005-testing-strategy-mocked-llm.md)   | LLM은 모킹해 결정적 테스트, 실제 호출은 E2E 스모크                      | Accepted |
