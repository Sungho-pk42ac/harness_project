// note-assistant-agent 공용 타입 (NAA-1). 도구 역할·toolCalls는 NAA-2/3에서 확장한다.

export type ChatRole = 'user' | 'assistant';

/** 채팅 한 줄. id는 React 키/중복 방지용 고유값. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}
