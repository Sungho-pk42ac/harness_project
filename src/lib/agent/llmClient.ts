import type { ToolCall } from './types';

/** LLM에 보내는 대화 메시지(OpenAI chat 포맷에 정합). */
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[]; // assistant 턴이 도구를 부를 때
  toolCallId?: string; // tool 턴이 어떤 호출의 결과인지
}

/** LLM 한 턴의 응답: 자연어 content와(있으면) 도구 호출 목록. */
export interface LlmResponse {
  content: string;
  toolCalls: ToolCall[];
}

/**
 * LLM 경계 (ADR-0005). 실제 OpenAI 구현(NAA-4)과 테스트용 모킹이 이 인터페이스를 만족하므로,
 * 에이전트 루프(runAgent)는 LLM 구현과 무관하게 결정적으로 테스트된다.
 */
export interface LlmClient {
  complete(messages: LlmMessage[]): Promise<LlmResponse>;
}

/** 테스트/스토리북용 모킹 — 미리 정한 응답 시퀀스를 차례로 돌려주고, 마지막 응답을 반복한다. */
export function createMockLlm(responses: LlmResponse[]): LlmClient & { calls: LlmMessage[][] } {
  const calls: LlmMessage[][] = [];
  let i = 0;
  return {
    calls,
    async complete(messages: LlmMessage[]) {
      calls.push(messages.map((m) => ({ ...m })));
      const r = responses[Math.min(i, responses.length - 1)];
      i += 1;
      return r;
    },
  };
}
