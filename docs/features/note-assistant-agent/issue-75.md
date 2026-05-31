# NAA-4 (#75) — 시그니처 + 테스트 시나리오

> OpenAI 프록시 Edge Function + 실제 LLM 연결. 라이브 검증은 OPENAI_API_KEY 필요(Open Question).

## 확정 시그니처

### `src/lib/agent/openaiClient.ts`

```ts
export type OpenAiTransport = (body: OpenAiRequestBody) => Promise<OpenAiChatResponse>;
export function createOpenAiLlmClient(transport: OpenAiTransport, model?: string): LlmClient;
```

- LlmMessage[]↔OpenAI chat 포맷 변환 + TOOL_SCHEMAS를 tools로. 응답 tool_calls를 ToolCall[]로 안전 파싱.

### `src/lib/agent/agentClient.ts`

```ts
export function createAgentSend(deps: ToolDeps): (text: string) => Promise<string>;
```

- supabase.functions.invoke('openai-proxy')로 전송(세션 JWT 자동 첨부) → runAgent → reply.

### `src/components/AssistantContainer.tsx`

- NotesProvider 안에서 useNotes로 ToolDeps 구성 → createAgentSend → ChatPanel.onSend 주입.

### `supabase/functions/openai-proxy/index.ts` (Deno)

- OPTIONS→CORS, JWT 없음/무효→401, 키 없음→503, 그 외 OpenAI로 포워딩(키 서버 주입).

## 시나리오

### openaiClient (Vitest, transport 모킹)

- should 텍스트 응답을 LlmResponse로 파싱 when tool_calls 없음
- should tool_calls를 ToolCall[]로 파싱(arguments JSON) / 손상 arguments는 {} 안전 처리
- should model·messages·tools를 transport에 전달(assistant tool_calls·tool 메시지 매핑)

### openai-proxy (Deno — Vitest 밖, E2E 스모크/수동)

- 유효 JWT → 포워딩 / JWT 없음 → 401 / 키 없음 → 503
- **⚠ 라이브 검증·E2E 스모크는 사용자가 `OPENAI_API_KEY` secret 등록 + `supabase functions deploy` 후** (PRD Open Question).

## deviation

실제 LLM 호출은 프록시 경유. LangGraph는 여전히 순수 tool-loop(runAgent) 내부에 미적용(ADR-0001, 후속 스왑).
