import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../types/note';

// useNotes를 모킹해 addNote/editNote 호출을 가로채고 notes를 주입한다.
const addNote = vi.fn().mockResolvedValue(undefined);
const editNote = vi.fn().mockResolvedValue(undefined);
let mockNotes: Note[] = [];

vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({
    notes: mockNotes,
    loading: false,
    error: null,
    addNote,
    editNote,
    removeNote: vi.fn(),
  }),
}));

describe('NoteEditor', () => {
  beforeEach(() => {
    addNote.mockClear();
    editNote.mockClear();
    mockNotes = [];
  });

  it('[정상] NoteEditor — should 입력 텍스트를 칩으로 추가한다 when 태그칸에 입력 후 Enter를 누른다', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
    // Act
    await user.type(screen.getByPlaceholderText('태그 입력'), 'react{Enter}');
    // Assert
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('[정상] NoteEditor — should 입력 텍스트를 칩으로 추가한다 when 태그칸에 쉼표(,)를 입력한다', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
    // Act: 쉼표로 태그 확정
    await user.type(screen.getByPlaceholderText('태그 입력'), 'vite,');
    // Assert
    expect(screen.getByText('vite')).toBeInTheDocument();
  });

  it('[정상] NoteEditor — should 현재 tags를 칩 목록으로 렌더한다 when tags가 비어있지 않다', async () => {
    // Arrange: tags를 가진 기존 노트를 편집으로 연다
    mockNotes = [
      {
        id: '1',
        title: 't',
        content: 'c',
        tags: ['alpha', 'beta'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    // Act
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Assert
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('[정상] NoteEditor — should addNote(title, content, tags)를 호출한다 when 새 노트를 저장한다', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await user.type(screen.getByPlaceholderText('태그 입력'), 'tagA{Enter}');
    // Act
    await user.click(screen.getByRole('button', { name: '저장' }));
    // Assert
    expect(addNote).toHaveBeenCalledWith('제목', '', ['tagA']);
  });

  it('[정상] NoteEditor — should editNote(id, { title, content, tags })를 호출한다 when 기존 노트를 저장한다', async () => {
    // Arrange: 기존 노트를 편집으로 연다
    mockNotes = [
      {
        id: '1',
        title: '기존제목',
        content: '기존내용',
        tags: ['old'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Act
    await user.click(screen.getByRole('button', { name: '저장' }));
    // Assert
    expect(editNote).toHaveBeenCalledWith('1', {
      title: '기존제목',
      content: '기존내용',
      tags: ['old'],
    });
  });

  it('[경계] NoteEditor — should 에러 없이 태그 0개로 렌더한다 when 노트의 tags가 undefined다 (note.tags ?? [])', async () => {
    // Arrange: tags가 없는(undefined) 기존 노트
    mockNotes = [
      {
        id: '1',
        title: 't',
        content: 'c',
        // tags 의도적으로 누락 (기존 호환 노트)
        createdAt: 'now',
        updatedAt: 'now',
      } as unknown as Note,
    ];
    // Act & Assert: 렌더가 throw 없이 되어야 하고, 태그칸은 존재하되 칩이 0개여야 한다
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // 태그 입력 UI가 존재해야 한다(note.tags ?? [] 방어가 적용된 태그 영역)
    expect(screen.getByPlaceholderText('태그 입력')).toBeInTheDocument();
    // 칩은 하나도 렌더되지 않아야 한다
    expect(screen.queryByText('old')).not.toBeInTheDocument();
  });

  it('[예외] NoteEditor — should 저장 실패 alert를 노출한다 when 저장 중 addNote/editNote가 throw한다', async () => {
    // Arrange
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    addNote.mockRejectedValueOnce(new Error('boom'));
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await user.type(screen.getByPlaceholderText('태그 입력'), 'tagA{Enter}');
    // Act
    await user.click(screen.getByRole('button', { name: '저장' }));
    // Assert: 저장 실패 알림이 떠야 한다
    expect(alertSpy).toHaveBeenCalledWith('저장에 실패했습니다');
    alertSpy.mockRestore();
  });

  // ── TAG-2 (이슈 #7): 태그 개별 삭제 ──────────────────────────────

  it('[정상] NoteEditor — should 클릭한 태그만 제거하고 나머지는 남긴다 when 특정 칩의 삭제(×) 버튼을 클릭한다', async () => {
    // Arrange: 두 태그를 가진 기존 노트를 편집으로 연다
    mockNotes = [
      {
        id: '1',
        title: 't',
        content: 'c',
        tags: ['회의', '아이디어'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Act: "회의" 칩의 삭제 버튼 클릭
    await user.click(screen.getByRole('button', { name: '회의 삭제' }));
    // Assert
    expect(screen.queryByText('회의')).not.toBeInTheDocument();
    expect(screen.getByText('아이디어')).toBeInTheDocument();
  });

  it('[경계] NoteEditor — should 클릭한 칩(인덱스)만 제거한다 when 같은 이름 태그가 여러 개 있다', async () => {
    // Arrange: 같은 이름 태그 2개
    mockNotes = [
      {
        id: '1',
        title: 't',
        content: 'c',
        tags: ['dup', 'dup'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    expect(screen.getAllByText('dup')).toHaveLength(2);
    // Act: 첫 번째 "dup" 칩의 삭제 버튼만 클릭
    await user.click(screen.getAllByRole('button', { name: 'dup 삭제' })[0]);
    // Assert: 하나만 남는다
    expect(screen.getAllByText('dup')).toHaveLength(1);
  });

  it('[경계] NoteEditor — should 칩 목록이 사라진다(미표시) when 유일한 태그를 삭제해 tags가 비게 된다', async () => {
    // Arrange: 태그 1개
    mockNotes = [
      { id: '1', title: 't', content: 'c', tags: ['solo'], createdAt: 'now', updatedAt: 'now' },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Act
    await user.click(screen.getByRole('button', { name: 'solo 삭제' }));
    // Assert: 칩이 사라진다
    expect(screen.queryByText('solo')).not.toBeInTheDocument();
  });

  it('[정상] NoteEditor — should 줄어든 tags로 editNote(id, { title, content, tags })를 호출한다 when 태그 삭제 후 저장한다', async () => {
    // Arrange
    mockNotes = [
      {
        id: '1',
        title: '기존제목',
        content: '기존내용',
        tags: ['회의', '아이디어'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Act: "회의" 삭제 후 저장
    await user.click(screen.getByRole('button', { name: '회의 삭제' }));
    await user.click(screen.getByRole('button', { name: '저장' }));
    // Assert: 줄어든 tags로 저장된다
    expect(editNote).toHaveBeenCalledWith('1', {
      title: '기존제목',
      content: '기존내용',
      tags: ['아이디어'],
    });
  });

  it('[정상] NoteEditor — should 키보드로 삭제 버튼을 활성화하면 해당 태그가 제거된다 when 칩 삭제 버튼에 포커스 후 Enter/Space를 누른다 (접근성)', async () => {
    // Arrange
    mockNotes = [
      {
        id: '1',
        title: 't',
        content: 'c',
        tags: ['회의', '아이디어'],
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];
    const user = userEvent.setup();
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />);
    // Act: 삭제 버튼에 포커스 후 키보드(Enter)로 활성화
    const removeBtn = screen.getByRole('button', { name: '회의 삭제' });
    removeBtn.focus();
    await user.keyboard('{Enter}');
    // Assert
    expect(screen.queryByText('회의')).not.toBeInTheDocument();
  });
});
