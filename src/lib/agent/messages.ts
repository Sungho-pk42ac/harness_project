import type { ChatMessage, ChatRole } from './types';

/**
 * role+content로 채팅 메시지를 만든다.
 * @param role 메시지 작성자
 * @param content 메시지 본문
 * @param id 미지정 시 crypto.randomUUID()로 생성(테스트는 id를 주입해 결정적으로 검증)
 */
export function makeMessage(role: ChatRole, content: string, id?: string): ChatMessage {
  return { id: id ?? crypto.randomUUID(), role, content };
}

/** 불변 append — 원본 배열을 유지하고 새 배열을 반환한다. */
export function appendMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  return [...messages, message];
}
