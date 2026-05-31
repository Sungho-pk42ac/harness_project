import { describe, it, expect, vi } from 'vitest';
import { dispatchTool, type ToolDeps } from './toolDispatcher';
import type { Note } from '../../types/note';

function makeNote(over: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '회의',
    content: '내용',
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
    addNote: vi.fn(async (title: string) => makeNote({ id: 'new1', title })),
    editNote: vi.fn(async () => {}),
    removeNote: vi.fn(async () => {}),
    getNotes: vi.fn(() => [makeNote()]),
    searchNotes: vi.fn(() => [makeNote()]),
    ...over,
  };
}

describe('agent/toolDispatcher', () => {
  it('should addNote를 매핑된 인자로 호출하고 생성 노트를 반환한다 when createNote', async () => {
    const deps = makeDeps();
    const res = await dispatchTool(
      { id: 't1', name: 'createNote', args: { title: '회의', content: '본문', tags: ['업무'] } },
      deps,
    );
    expect(deps.addNote).toHaveBeenCalledWith('회의', '본문', ['업무']);
    expect(res.ok).toBe(true);
    expect(res.toolCallId).toBe('t1');
  });

  it('should 검증 에러를 반환하고 addNote를 호출하지 않는다 when title이 빈 createNote', async () => {
    const deps = makeDeps();
    const res = await dispatchTool({ id: 't2', name: 'createNote', args: { title: '  ' } }, deps);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
    expect(deps.addNote).not.toHaveBeenCalled();
  });

  it('should 에러 결과를 반환한다(throw 아님) when 알 수 없는 도구', async () => {
    const deps = makeDeps();
    const res = await dispatchTool({ id: 't3', name: 'frobnicate', args: {} }, deps);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/frobnicate|알 수 없/);
  });

  it('should editNote를 호출한다 when updateNote', async () => {
    const deps = makeDeps();
    const res = await dispatchTool(
      { id: 't4', name: 'updateNote', args: { id: 'n1', title: '새 제목' } },
      deps,
    );
    expect(deps.editNote).toHaveBeenCalledWith('n1', { title: '새 제목' });
    expect(res.ok).toBe(true);
  });

  it('should 변경 필드가 없으면 에러를 반환한다 when updateNote', async () => {
    const deps = makeDeps();
    const res = await dispatchTool({ id: 't5', name: 'updateNote', args: { id: 'n1' } }, deps);
    expect(res.ok).toBe(false);
    expect(deps.editNote).not.toHaveBeenCalled();
  });

  it('should 확인 후에만 removeNote를 호출한다 when deleteNote가 승인됨', async () => {
    const confirmDelete = vi.fn(async () => true);
    const deps = makeDeps({ confirmDelete });
    const res = await dispatchTool({ id: 't6', name: 'deleteNote', args: { id: 'n1' } }, deps);
    expect(confirmDelete).toHaveBeenCalledWith('n1');
    expect(deps.removeNote).toHaveBeenCalledWith('n1');
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ deleted: true });
  });

  it('should removeNote를 호출하지 않는다 when 사용자가 삭제를 취소함', async () => {
    const confirmDelete = vi.fn(async () => false);
    const deps = makeDeps({ confirmDelete });
    const res = await dispatchTool({ id: 't6b', name: 'deleteNote', args: { id: 'n1' } }, deps);
    expect(confirmDelete).toHaveBeenCalledWith('n1');
    expect(deps.removeNote).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ deleted: false, cancelled: true });
  });

  it('should 확인 콜백이 없으면 삭제하지 않는다 when confirmDelete 미주입', async () => {
    const deps = makeDeps();
    const res = await dispatchTool({ id: 't6c', name: 'deleteNote', args: { id: 'n1' } }, deps);
    expect(deps.removeNote).not.toHaveBeenCalled();
    expect(res.data).toMatchObject({ deleted: false });
  });

  it('should searchNotes 위임 결과를 반환한다 when searchNotes', async () => {
    const deps = makeDeps();
    const res = await dispatchTool(
      { id: 't7', name: 'searchNotes', args: { query: '회의' } },
      deps,
    );
    expect(deps.searchNotes).toHaveBeenCalledWith('회의');
    expect(res.ok).toBe(true);
  });

  it('should 전체 활성 노트를 반환한다 when listNotes', async () => {
    const deps = makeDeps();
    const res = await dispatchTool({ id: 't8', name: 'listNotes', args: {} }, deps);
    expect(deps.getNotes).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('should 도구 내부 에러를 ok=false로 회신한다 when 액션이 throw', async () => {
    const deps = makeDeps({
      addNote: vi.fn(async () => {
        throw new Error('네트워크 오류');
      }),
    });
    const res = await dispatchTool({ id: 't9', name: 'createNote', args: { title: '회의' } }, deps);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('네트워크 오류');
  });
});
