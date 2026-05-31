import { runAgent } from './graph';
import {
  createOpenAiLlmClient,
  type OpenAiRequestBody,
  type OpenAiChatResponse,
} from './openaiClient';
import type { ToolDeps } from './toolDispatcher';
import { getSupabase } from '../../api/supabaseClient';

/**
 * 브라우저 → openai-proxy Edge Function 전송 (ADR-0002).
 * supabase.functions.invoke가 현재 세션 access token을 자동 첨부하므로 프록시가 JWT를 검증할 수 있다.
 */
async function invokeProxy(body: OpenAiRequestBody): Promise<OpenAiChatResponse> {
  const { data, error } = await getSupabase().functions.invoke('openai-proxy', { body });
  if (error) {
    // 프록시가 503(키 미설정)/401 등으로 응답하면 사용자에게 전달할 메시지로 변환
    throw new Error(error.message ?? 'AI 비서 호출에 실패했어요.');
  }
  return data as OpenAiChatResponse;
}

/**
 * ChatPanel.onSend로 쓸 함수를 만든다 — runAgent + OpenAI(프록시 경유) + 주입된 도구 deps(ADR-0003).
 * @param deps NotesContext 액션/utils로 구성한 도구 의존성
 */
export function createAgentSend(deps: ToolDeps): (text: string) => Promise<string> {
  const llm = createOpenAiLlmClient(invokeProxy);
  return async (text: string) => {
    const result = await runAgent(text, { llm, deps });
    return result.reply;
  };
}
