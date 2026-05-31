import type { LlmClient, LlmMessage } from './llmClient';
import { dispatchTool, type ToolDeps } from './toolDispatcher';

// 한 번의 사용자 요청에서 허용하는 최대 LLM↔도구 왕복 횟수(무한 루프 가드).
const MAX_STEPS = 6;

const SYSTEM_PROMPT =
  '당신은 SLNOTE의 노트 작성 비서입니다. 사용자의 노트를 검색·생성·수정·삭제하도록 도구를 사용해 ' +
  '정확하고 간결하게 도와주세요. 도구 결과를 확인한 뒤 한국어로 답하세요.';

export interface RunAgentOptions {
  llm: LlmClient;
  deps: ToolDeps;
  history?: LlmMessage[]; // 이전 대화(멀티턴). 없으면 단발성.
}

export interface AgentResult {
  reply: string;
  messages: LlmMessage[];
}

/**
 * 에이전트 루프 (ADR-0001). LLM 응답에 도구 호출이 있으면 디스패치→결과 회신→재호출,
 * 없으면 그 텍스트로 종료한다. MAX_STEPS로 무한 루프를 막는다.
 *
 * 내부는 현재 순수 tool-loop이며, 추후 동일 시그니처 뒤에서 LangGraph.js StateGraph로
 * 교체할 수 있다(인터페이스 불변 — ADR-0001의 폴백/스왑 전략).
 */
export async function runAgent(userText: string, options: RunAgentOptions): Promise<AgentResult> {
  const { llm, deps, history = [] } = options;
  const messages: LlmMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userText },
  ];

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const res = await llm.complete(messages);
    messages.push({ role: 'assistant', content: res.content, toolCalls: res.toolCalls });

    if (!res.toolCalls || res.toolCalls.length === 0) {
      return { reply: res.content, messages };
    }

    for (const call of res.toolCalls) {
      const result = await dispatchTool(call, deps);
      messages.push({
        role: 'tool',
        toolCallId: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: '요청이 너무 복잡해 처리를 멈췄어요. 더 단순하게 말씀해 주세요.',
    messages,
  };
}
