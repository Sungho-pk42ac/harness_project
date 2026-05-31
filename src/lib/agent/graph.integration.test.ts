import { describe, it, expect, vi } from 'vitest';
import { runAgent } from './graph';
import { createMockLlm } from './llmClient';
import type { ToolDeps } from './toolDispatcher';
import type { Note } from '../../types/note';

// 에이전트 루프를 통한 읽기(NAA-5)·수정(NAA-6) 도구 통합 — 모킹 LLM으로 결정적 검증(ADR-0005).

function makeNote(over: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '회의록',
    content: '분기 계획 회의',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: ['업무'],
    isPinned: false,
    deletedAt: null,
    ...over,
  };
}

function makeDeps(over: Partial<ToolDeps> = {}): ToolDeps {
  const notes = [makeNote(), makeNote({ id: 'n2', title: '장보기', content: '우유', tags: [] })];
  return {
    addNote: vi.fn(async (title: string) => makeNote({ id: 'new', title })),
    editNote: vi.fn(async () => {}),
    removeNote: vi.fn(async () => {}),
    getNotes: vi.fn(() => notes),
    searchNotes: vi.fn((q: string) =>
      notes.filter((n) => n.title.includes(q) || n.content.includes(q)),
    ),
    ...over,
  };
}

describe('agent 통합 — 읽기(NAA-5)', () => {
  it('should searchNotes로 찾은 노트를 모델에 넘겨 답한다 when "회의 노트 찾아줘"', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 's1', name: 'searchNotes', args: { query: '회의' } }] },
      { content: '회의록 노트를 찾았어요.', toolCalls: [] },
    ]);
    const deps = makeDeps();
    const result = await runAgent('회의 노트 찾아줘', { llm, deps });
    expect(deps.searchNotes).toHaveBeenCalledWith('회의');
    // 두 번째 LLM 호출에 검색 결과(tool 메시지)가 들어갔는지
    const toolMsg = llm.calls[1].find((m) => m.role === 'tool');
    expect(toolMsg?.content).toContain('회의록');
    expect(result.reply).toBe('회의록 노트를 찾았어요.');
  });

  it('should listNotes로 빈 결과를 안내한다 when 노트가 없다', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 'l1', name: 'listNotes', args: {} }] },
      { content: '저장된 노트가 없어요.', toolCalls: [] },
    ]);
    const deps = makeDeps({ getNotes: vi.fn(() => []) });
    const result = await runAgent('내 노트 목록', { llm, deps });
    expect(deps.getNotes).toHaveBeenCalled();
    const toolMsg = llm.calls[1].find((m) => m.role === 'tool');
    expect(toolMsg?.content).toContain('[]');
    expect(result.reply).toBe('저장된 노트가 없어요.');
  });
});

describe('agent 통합 — 수정(NAA-6)', () => {
  it('should editNote로 제목을 바꾼다 when "제목을 B로 바꿔줘"', async () => {
    const llm = createMockLlm([
      {
        content: '',
        toolCalls: [{ id: 'u1', name: 'updateNote', args: { id: 'n1', title: '새 회의록' } }],
      },
      { content: '제목을 바꿨어요.', toolCalls: [] },
    ]);
    const deps = makeDeps();
    const result = await runAgent('회의록 제목을 새 회의록으로 바꿔줘', { llm, deps });
    expect(deps.editNote).toHaveBeenCalledWith('n1', { title: '새 회의록' });
    expect(result.reply).toBe('제목을 바꿨어요.');
  });

  it('should 변경 필드가 없으면 수정하지 않고 에러를 회신한다 when updateNote에 id만', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 'u2', name: 'updateNote', args: { id: 'n1' } }] },
      { content: '무엇을 바꿀지 알려주세요.', toolCalls: [] },
    ]);
    const deps = makeDeps();
    const result = await runAgent('n1 수정', { llm, deps });
    expect(deps.editNote).not.toHaveBeenCalled();
    const toolMsg = llm.calls[1].find((m) => m.role === 'tool');
    expect(toolMsg?.content).toContain('false');
    expect(result.reply).toBe('무엇을 바꿀지 알려주세요.');
  });
});
