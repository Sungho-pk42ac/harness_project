import { render, screen, waitFor, act } from '@testing-library/react';
import { NotesProvider, useNotes } from './NotesContext';
import * as api from '../api/notes';
import type { Note } from '../types/note';

// Context는 api 모듈을 경계로 본다 → api/notes를 통째로 모킹한다.
vi.mock('../api/notes', () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

const mockedApi = vi.mocked(api);

// useNotes() 값을 테스트에서 잡아두기 위한 소비 컴포넌트
let ctx: ReturnType<typeof useNotes>;
function Capture() {
  ctx = useNotes();
  return <div data-testid="count">{ctx.notes.length}</div>;
}

/** Provider로 감싸 렌더하고 초기 로드 완료를 기다린다. */
async function renderProvider() {
  render(
    <NotesProvider>
      <Capture />
    </NotesProvider>,
  );
  // 초기 fetchNotes 반영 대기
  await waitFor(() => expect(screen.getByTestId('count')).toBeInTheDocument());
}

describe('addNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([]);
  });

  it('[정상] addNote — should api.createNote에 { title, content, tags }를 전달한다 when 호출된다', async () => {
    // Arrange
    mockedApi.createNote.mockResolvedValue({
      id: '1',
      title: 't',
      content: 'c',
      tags: ['a'],
      isPinned: false,
      createdAt: 'now',
      updatedAt: 'now',
    });
    await renderProvider();
    // Act
    await act(async () => {
      await ctx.addNote('t', 'c', ['a']);
    });
    // Assert: 새 노트는 isPinned: false로 시작한다 (pin spec-fixed §5)
    expect(mockedApi.createNote).toHaveBeenCalledWith({
      title: 't',
      content: 'c',
      tags: ['a'],
      isPinned: false,
    });
  });

  it('[정상] addNote — should 반환된 노트를 notes 상태에 append한다 when 생성이 성공한다', async () => {
    // Arrange
    const created: Note = {
      id: '1',
      title: 't',
      content: 'c',
      tags: ['a', 'b'],
      isPinned: false,
      createdAt: 'now',
      updatedAt: 'now',
    };
    mockedApi.createNote.mockResolvedValue(created);
    await renderProvider();
    // Act
    await act(async () => {
      await ctx.addNote('t', 'c', ['a', 'b']);
    });
    // Assert
    expect(ctx.notes).toContainEqual(created);
  });

  it('[경계] addNote — should 빈 tags로도 정상 생성한다 when tags가 []다', async () => {
    // Arrange
    mockedApi.createNote.mockResolvedValue({
      id: '1',
      title: 't',
      content: 'c',
      tags: [],
      isPinned: false,
      createdAt: 'now',
      updatedAt: 'now',
    });
    await renderProvider();
    // Act
    await act(async () => {
      await ctx.addNote('t', 'c', []);
    });
    // Assert: api.createNote가 빈 tags와 isPinned: false를 그대로 받아야 한다
    expect(mockedApi.createNote).toHaveBeenCalledWith({
      title: 't',
      content: 'c',
      tags: [],
      isPinned: false,
    });
  });

  it('[예외] addNote — should 에러를 호출부로 전파한다 when api.createNote가 throw한다 (자체 catch 없음)', async () => {
    // Arrange
    mockedApi.createNote.mockRejectedValue(new Error('boom'));
    await renderProvider();
    // Act & Assert: Context에 자체 catch가 없으므로 reject가 전파되어야 한다
    await expect(ctx.addNote('t', 'c', ['a'])).rejects.toThrow('boom');
  });
});

describe('editNote', () => {
  const initial: Note = {
    id: '1',
    title: 't',
    content: 'c',
    tags: ['old'],
    isPinned: false,
    createdAt: 'now',
    updatedAt: 'now',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([initial]);
  });

  it('[정상] editNote — should api.updateNote에 tags를 포함한 updates를 넘긴다 when { title, content, tags }로 호출된다', async () => {
    // Arrange
    mockedApi.updateNote.mockResolvedValue({ ...initial, tags: ['new'] });
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    // Act
    await act(async () => {
      await ctx.editNote('1', { title: 't', content: 'c', tags: ['new'] });
    });
    // Assert
    expect(mockedApi.updateNote).toHaveBeenCalledWith('1', {
      title: 't',
      content: 'c',
      tags: ['new'],
    });
  });

  it('[정상] editNote — should 갱신된 노트로 해당 항목을 교체한다 when 수정이 성공한다', async () => {
    // Arrange
    const updated: Note = { ...initial, tags: ['new'], updatedAt: 'later' };
    mockedApi.updateNote.mockResolvedValue(updated);
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    // Act
    await act(async () => {
      await ctx.editNote('1', { title: 't', content: 'c', tags: ['new'] });
    });
    // Assert
    expect(ctx.notes.find((n) => n.id === '1')).toEqual(updated);
  });

  it('[예외] editNote — should 에러를 호출부로 전파한다 when api.updateNote가 throw한다', async () => {
    // Arrange
    mockedApi.updateNote.mockRejectedValue(new Error('boom'));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    // Act & Assert
    await expect(ctx.editNote('1', { title: 't', content: 'c', tags: ['new'] })).rejects.toThrow(
      'boom',
    );
  });
});

// ── 휴지통(소프트 삭제/복원/영구삭제) (TRASH-1·3·4, spec-fixed §2) ──
describe('removeNote (소프트 삭제)', () => {
  const initial: Note = {
    id: '1',
    title: 't',
    content: 'c',
    tags: [],
    isPinned: false,
    createdAt: 'now',
    updatedAt: 'now',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([initial]);
  });

  it('[정상] removeNote — should api.updateNote(id,{deletedAt})로 소프트 삭제하고 deleteNote는 호출하지 않는다', async () => {
    mockedApi.updateNote.mockResolvedValue({ ...initial, deletedAt: '2026-05-31T02:00:00.000Z' });
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await act(async () => {
      await ctx.removeNote('1');
    });
    // updateNote가 deletedAt을 채워 호출되어야 한다
    expect(mockedApi.updateNote).toHaveBeenCalledTimes(1);
    const [calledId, updates] = mockedApi.updateNote.mock.calls[0];
    expect(calledId).toBe('1');
    expect(updates.deletedAt).toBeTruthy();
    // 영구 삭제(deleteNote)는 호출되지 않는다
    expect(mockedApi.deleteNote).not.toHaveBeenCalled();
  });

  it('[정상] removeNote — should 노트를 제거하지 않고 deletedAt이 채워진 노트로 교체한다 (휴지통에 남아야 함)', async () => {
    const soft = { ...initial, deletedAt: '2026-05-31T02:00:00.000Z' };
    mockedApi.updateNote.mockResolvedValue(soft);
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await act(async () => {
      await ctx.removeNote('1');
    });
    // notes에서 사라지지 않고 deletedAt이 채워진 채 남는다
    expect(ctx.notes).toHaveLength(1);
    expect(ctx.notes[0].deletedAt).toBeTruthy();
  });
});

describe('restoreNote', () => {
  const trashed: Note = {
    id: '1',
    title: 't',
    content: 'c',
    tags: [],
    isPinned: false,
    deletedAt: '2026-05-31T02:00:00.000Z',
    createdAt: 'now',
    updatedAt: 'now',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([trashed]);
  });

  it('[정상] restoreNote — should updateNote(id,{deletedAt:null})로 복원하고 응답으로 교체한다', async () => {
    const restored = { ...trashed, deletedAt: undefined };
    mockedApi.updateNote.mockResolvedValue(restored);
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await act(async () => {
      await ctx.restoreNote('1');
    });
    expect(mockedApi.updateNote).toHaveBeenCalledWith('1', { deletedAt: null });
    expect(ctx.notes[0].deletedAt).toBeFalsy();
  });
});

describe('purgeNote (영구 삭제)', () => {
  const trashed: Note = {
    id: '1',
    title: 't',
    content: 'c',
    tags: [],
    isPinned: false,
    deletedAt: '2026-05-31T02:00:00.000Z',
    createdAt: 'now',
    updatedAt: 'now',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([trashed]);
  });

  it('[정상] purgeNote — should api.deleteNote(id)로 영구 삭제하고 로컬에서 제거한다', async () => {
    mockedApi.deleteNote.mockResolvedValue(undefined);
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await act(async () => {
      await ctx.purgeNote('1');
    });
    expect(mockedApi.deleteNote).toHaveBeenCalledWith('1');
    expect(ctx.notes).toHaveLength(0);
  });

  it('[예외] purgeNote — should 에러를 호출부로 전파한다 when api.deleteNote가 throw한다', async () => {
    mockedApi.deleteNote.mockRejectedValue(new Error('boom'));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await expect(ctx.purgeNote('1')).rejects.toThrow('boom');
  });
});

// ── 복제 (DUPLICATE-1~3, spec-fixed §5) ──
describe('duplicateNote', () => {
  const original: Note = {
    id: '1',
    title: '회의록',
    content: '내용',
    tags: ['업무'],
    isPinned: false,
    createdAt: 'now',
    updatedAt: 'now',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.fetchNotes.mockResolvedValue([original]);
  });

  it('[정상] duplicateNote — should createNote에 (사본) 제목·본문·태그를 넘기고 생성 노트를 반환한다', async () => {
    const created: Note = {
      id: '2',
      title: '회의록 (사본)',
      content: '내용',
      tags: ['업무'],
      isPinned: false,
      createdAt: 'now2',
      updatedAt: 'now2',
    };
    mockedApi.createNote.mockResolvedValue(created);
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    let returned: Note | undefined;
    await act(async () => {
      returned = await ctx.duplicateNote('1');
    });
    expect(mockedApi.createNote).toHaveBeenCalledWith(
      expect.objectContaining({ title: '회의록 (사본)', content: '내용', tags: ['업무'] }),
    );
    expect(returned).toEqual(created);
    // 새 노트가 목록에 추가된다
    expect(ctx.notes.some((n) => n.id === '2')).toBe(true);
  });

  it('[예외] duplicateNote — should 원본이 없으면 에러를 던진다', async () => {
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await expect(ctx.duplicateNote('없는id')).rejects.toThrow();
  });
});
