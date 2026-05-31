// note-assistant-agent 공용 타입. (NAA-1: 메시지 / NAA-2: 도구)

export type ChatRole = 'user' | 'assistant';

/** 채팅 한 줄. id는 React 키/중복 방지용 고유값. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

/** 에이전트가 다룰 수 있는 도구 이름 (NAA-2). */
export type ToolName = 'createNote' | 'searchNotes' | 'listNotes' | 'updateNote' | 'deleteNote';

/** LLM이 요청한 도구 호출. name은 string — 알 수 없는 이름도 디스패처가 방어한다. */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/** 도구 실행 결과. 실패해도 throw하지 않고 ok=false로 모델에 회신한다. */
export interface ToolResult {
  toolCallId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}
