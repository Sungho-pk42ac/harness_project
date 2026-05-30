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
      createdAt: 'now',
      updatedAt: 'now',
    });
    await renderProvider();
    // Act
    await act(async () => {
      await ctx.addNote('t', 'c', ['a']);
    });
    // Assert
    expect(mockedApi.createNote).toHaveBeenCalledWith({
      title: 't',
      content: 'c',
      tags: ['a'],
    });
  });

  it('[정상] addNote — should 반환된 노트를 notes 상태에 append한다 when 생성이 성공한다', async () => {
    // Arrange
    const created: Note = {
      id: '1',
      title: 't',
      content: 'c',
      tags: ['a', 'b'],
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
      createdAt: 'now',
      updatedAt: 'now',
    });
    await renderProvider();
    // Act
    await act(async () => {
      await ctx.addNote('t', 'c', []);
    });
    // Assert: api.createNote가 빈 tags를 그대로 받아야 한다
    expect(mockedApi.createNote).toHaveBeenCalledWith({
      title: 't',
      content: 'c',
      tags: [],
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
