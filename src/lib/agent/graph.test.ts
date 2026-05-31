import { describe, it, expect, vi } from 'vitest';
import { runAgent } from './graph';
import { createMockLlm } from './llmClient';
import type { ToolDeps } from './toolDispatcher';
import type { Note } from '../../types/note';

function makeNote(over: Partial<Note> = {}): Note {
  return {
    id: 'new1',
    title: '회의',
    content: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    isPinned: false,
    deletedAt: null,
    ...over,
  };
}

function makeDeps(over: Partial<ToolDeps> = {}): ToolDeps {
  return {
    addNote: vi.fn(async (title: string) => makeNote({ title })),
    editNote: vi.fn(async () => {}),
    removeNote: vi.fn(async () => {}),
    getNotes: vi.fn(() => []),
    searchNotes: vi.fn(() => []),
    ...over,
  };
}

describe('agent/graph runAgent', () => {
  it('should 노트를 생성하고 최종 응답을 반환한다 when LLM이 createNote 후 마무리한다', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 'c1', name: 'createNote', args: { title: '회의' } }] },
      { content: '만들었어요', toolCalls: [] },
    ]);
    const deps = makeDeps();
    const result = await runAgent('회의 노트 만들어줘', { llm, deps });
    expect(deps.addNote).toHaveBeenCalledWith('회의', '', []);
    expect(result.reply).toBe('만들었어요');
  });

  it('should 도구 없이 텍스트만 반환한다 when LLM이 바로 답한다', async () => {
    const llm = createMockLlm([{ content: '안녕하세요!', toolCalls: [] }]);
    const deps = makeDeps();
    const result = await runAgent('안녕', { llm, deps });
    expect(deps.addNote).not.toHaveBeenCalled();
    expect(result.reply).toBe('안녕하세요!');
  });

  it('should 도구 에러를 모델에 회신하고 계속 진행한다 when 도구가 실패한다', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 'c1', name: 'createNote', args: { title: '' } }] }, // 검증 실패
      { content: '제목이 필요해요', toolCalls: [] },
    ]);
    const deps = makeDeps();
    const result = await runAgent('만들어줘', { llm, deps });
    expect(deps.addNote).not.toHaveBeenCalled();
    expect(result.reply).toBe('제목이 필요해요');
    // 두 번째 호출 시 tool 결과(ok=false)가 메시지에 포함되어 전달됐는지 확인
    const secondCallMessages = llm.calls[1];
    expect(secondCallMessages.some((m) => m.role === 'tool' && m.content.includes('false'))).toBe(
      true,
    );
  });

  it('should 무한 루프를 막는다 when LLM이 계속 도구만 부른다 (최대 스텝 가드)', async () => {
    const llm = createMockLlm([
      { content: '', toolCalls: [{ id: 'loop', name: 'listNotes', args: {} }] }, // 항상 반복
    ]);
    const deps = makeDeps();
    const result = await runAgent('루프', { llm, deps });
    // 가드로 종료, getNotes 호출 횟수가 유한(폭주 아님)
    expect((deps.getNotes as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThanOrEqual(10);
    expect(result.reply).toMatch(/멈췄|복잡|다시/);
  });
});
