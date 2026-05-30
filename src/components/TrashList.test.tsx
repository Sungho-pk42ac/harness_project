import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashList } from './TrashList';
import type { Note } from '../types/note';

const restoreNote = vi.fn().mockResolvedValue(undefined);
const purgeNote = vi.fn().mockResolvedValue(undefined);
let mockNotes: Note[] = [];

vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({
    notes: mockNotes,
    loading: false,
    error: null,
    restoreNote,
    purgeNote,
  }),
}));

const makeNote = (id: string, title: string, deletedAt?: string): Note => ({
  id,
  title,
  content: '내용',
  tags: [],
  isPinned: false,
  deletedAt,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
});

describe('TrashList', () => {
  beforeEach(() => {
    restoreNote.mockClear();
    purgeNote.mockClear();
    mockNotes = [];
  });

  it('[정상] should 삭제된 노트만 모아 보인다 (활성 노트는 제외)', () => {
    mockNotes = [makeNote('1', '삭제된노트', 'x'), makeNote('2', '활성노트')];
    render(<TrashList />);
    expect(screen.getByText('삭제된노트')).toBeInTheDocument();
    expect(screen.queryByText('활성노트')).not.toBeInTheDocument();
  });

  it('[경계] should 휴지통이 비면 전용 안내를 보인다', () => {
    mockNotes = [makeNote('1', '활성', undefined)];
    render(<TrashList />);
    expect(screen.getByText('휴지통이 비어 있습니다')).toBeInTheDocument();
  });

  it('[정상] should 복원 버튼 클릭 시 restoreNote(id)를 호출한다', async () => {
    const user = userEvent.setup();
    mockNotes = [makeNote('1', '삭제된노트', 'x')];
    render(<TrashList />);
    await user.click(screen.getByRole('button', { name: '복원' }));
    expect(restoreNote).toHaveBeenCalledWith('1');
  });

  it('[정상] should 영구 삭제 확인(confirm) 시 purgeNote(id)를 호출한다', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockNotes = [makeNote('1', '삭제된노트', 'x')];
    render(<TrashList />);
    await user.click(screen.getByRole('button', { name: '영구 삭제' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(purgeNote).toHaveBeenCalledWith('1');
    confirmSpy.mockRestore();
  });

  it('[예외] should 영구 삭제 취소(confirm=false) 시 purgeNote를 호출하지 않는다', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockNotes = [makeNote('1', '삭제된노트', 'x')];
    render(<TrashList />);
    await user.click(screen.getByRole('button', { name: '영구 삭제' }));
    expect(purgeNote).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
