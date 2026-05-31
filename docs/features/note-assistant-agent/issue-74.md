# NAA-3 (#74) — 시그니처 + 테스트 시나리오

> 에이전트 루프 + LlmClient 경계. walking skeleton 완성(채팅→에이전트→노트 생성, 모킹 LLM).

## 확정 시그니처

### `src/lib/agent/llmClient.ts`

```ts
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}
export interface LlmResponse {
  content: string;
  toolCalls: ToolCall[];
}
export interface LlmClient {
  complete(messages: LlmMessage[]): Promise<LlmResponse>;
}
export function createMockLlm(responses: LlmResponse[]): LlmClient & { calls: LlmMessage[][] };
```

### `src/lib/agent/graph.ts`

```ts
export interface RunAgentOptions {
  llm: LlmClient;
  deps: ToolDeps;
  history?: LlmMessage[];
}
export interface AgentResult {
  reply: string;
  messages: LlmMessage[];
}
export function runAgent(userText: string, options: RunAgentOptions): Promise<AgentResult>;
```

- 루프: LLM 응답에 toolCalls 있으면 dispatchTool→결과 회신→재호출, 없으면 종료. `MAX_STEPS=6` 가드.
- **deviation(ADR-0001)**: 내부는 현재 순수 tool-loop. 실제 LangGraph.js는 동일 시그니처 뒤로 교체 예정
  (Vite 브라우저 번들 안정성 미검증 → 동작·테스트를 먼저 결정적으로 확보).

## 시나리오 (should…when…)

- should 노트를 생성하고 최종 응답을 반환 when LLM이 createNote 후 마무리
- should 도구 없이 텍스트만 반환 when LLM이 바로 답함
- should 도구 에러(ok=false)를 모델에 회신하고 계속 when 도구 실패
- should 무한 루프를 막는다 when LLM이 계속 도구만 부름(MAX_STEPS 가드)
