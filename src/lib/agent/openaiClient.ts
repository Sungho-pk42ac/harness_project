import type { LlmClient, LlmMessage, LlmResponse } from './llmClient';
import type { ToolCall } from './types';
import { TOOL_SCHEMAS } from './tools';

// 기본 모델 — 비용/속도 균형(ADR: OpenAI). 필요 시 옵션으로 교체.
const DEFAULT_MODEL = 'gpt-4o-mini';

/** OpenAI chat/completions 요청 바디(필요 부분만). 프록시(Edge Function)가 그대로 OpenAI로 포워딩한다. */
export interface OpenAiRequestBody {
  model: string;
  messages: unknown[];
  tools?: unknown[];
}

/** OpenAI chat/completions 응답(필요 부분만). */
export interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    };
  }>;
}

/** 프록시로 요청 바디를 보내고 OpenAI 응답 JSON을 받는 전송 계층(테스트는 모킹 주입). */
export type OpenAiTransport = (body: OpenAiRequestBody) => Promise<OpenAiChatResponse>;

/** LlmMessage[] → OpenAI chat 메시지 포맷. */
function toOpenAiMessages(messages: LlmMessage[]): unknown[] {
  return messages.map((m) => {
    if (m.role === 'tool') {
      return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
    }
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

/** TOOL_SCHEMAS → OpenAI tools 파라미터. */
function toOpenAiTools(): unknown[] {
  return TOOL_SCHEMAS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/** OpenAI 응답 → LlmResponse(content + 안전 파싱된 toolCalls). */
function parseResponse(json: OpenAiChatResponse): LlmResponse {
  const message = json.choices?.[0]?.message;
  const content = message?.content ?? '';
  const toolCalls: ToolCall[] = (message?.tool_calls ?? []).map((tc) => {
    let args: Record<string, unknown> = {};
    try {
      args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch {
      args = {};
    }
    return { id: tc.id, name: tc.function.name, args };
  });
  return { content, toolCalls };
}

/**
 * OpenAI 기반 LlmClient (NAA-4, ADR-0002). 전송 계층(transport)은 Edge Function 프록시를 호출하므로
 * OpenAI 키는 브라우저에 노출되지 않는다. 메시지·도구 포맷 변환만 담당해 단위 테스트가 쉽다.
 */
export function createOpenAiLlmClient(
  transport: OpenAiTransport,
  model: string = DEFAULT_MODEL,
): LlmClient {
  return {
    async complete(messages: LlmMessage[]): Promise<LlmResponse> {
      const body: OpenAiRequestBody = {
        model,
        messages: toOpenAiMessages(messages),
        tools: toOpenAiTools(),
      };
      const json = await transport(body);
      return parseResponse(json);
    },
  };
}
