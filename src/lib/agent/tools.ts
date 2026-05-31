import type { ToolName } from './types';

/**
 * OpenAI function-calling 스키마 (NAA-2). 에이전트(LLM)에게 노출할 도구 목록.
 * 실제 실행은 toolDispatcher가, 확인 게이트는 agent 루프가 담당한다.
 */
export interface ToolSchema {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'listNotes',
    description: '내 활성 노트 목록(제목)을 반환한다. 무엇이 있는지 훑을 때 사용.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'searchNotes',
    description: '질의어로 내 노트를 검색한다. 특정 주제의 노트를 찾을 때 사용.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: '검색어' } },
      required: ['query'],
    },
  },
  {
    name: 'createNote',
    description: '새 노트를 만든다.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '노트 제목(필수)' },
        content: { type: 'string', description: '노트 본문' },
        tags: { type: 'array', items: { type: 'string' }, description: '태그 목록' },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateNote',
    description: '기존 노트의 제목/본문/태그/핀을 수정한다.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '수정할 노트 id(필수)' },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        isPinned: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteNote',
    description: '노트를 휴지통으로 보낸다(소프트 삭제). 실행 전 사용자 확인이 필요하다.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string', description: '삭제할 노트 id(필수)' } },
      required: ['id'],
    },
  },
];

/**
 * 실행 전 사용자 확인이 필요한 도구 집합 (ADR-0004). agent 루프가 이 집합을 보고
 * PendingAction(확인 카드)으로 전환한다. 데이터로 표현해 향후 확장 가능.
 */
export const TOOLS_REQUIRING_CONFIRMATION: ReadonlySet<string> = new Set<string>(['deleteNote']);
