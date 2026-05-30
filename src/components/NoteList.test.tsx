import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteList } from './NoteList';
import type { Note } from '../types/note';

// NotesContext를 모킹해 NoteList의 섹션 분기를 독립적으로 검증한다 (PIN-2·PIN-3)
const togglePin = vi.fn();
const removeNote = vi.fn();
let mockNotes: Note[] = [];

vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({
    notes: mockNotes,
    loading: false,
    error: null,
    removeNote,
    togglePin,
  }),
}));

const makeNote = (id: string, title: string, isPinned: boolean, deletedAt?: string): Note => ({
  id,
  title,
  content: '내용',
  tags: [],
  isPinned,
  deletedAt,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
});

const noop = () => {};

describe('NoteList (핀 섹션 분기)', () => {
  beforeEach(() => {
    togglePin.mockReset();
    removeNote.mockReset();
  });

  it('[정상] should 고정 노트가 있으면 "고정됨" 머리글과 고정/일반 노트를 모두 보인다 (PIN-2 A·B)', () => {
    mockNotes = [makeNote('1', '고정노트', true), makeNote('2', '일반노트', false)];
    render(<NoteList selectedNoteId={null} onSelect={noop} />);
    expect(screen.getByText('고정됨')).toBeInTheDocument();
    expect(screen.getByText('고정노트')).toBeInTheDocument();
    expect(screen.getByText('일반노트')).toBeInTheDocument();
  });

  it('[경계] should 고정 노트가 하나도 없으면 "고정됨" 머리글을 표시하지 않는다 (PIN-3 A)', () => {
    mockNotes = [makeNote('1', 'a', false), makeNote('2', 'b', false)];
    render(<NoteList selectedNoteId={null} onSelect={noop} />);
    expect(screen.queryByText('고정됨')).not.toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('[정상] should 일반 섹션 머리글 개수는 고정 노트를 제외한 나머지 개수다', () => {
    mockNotes = [makeNote('1', 'p', true), makeNote('2', 'o1', false), makeNote('3', 'o2', false)];
    render(<NoteList selectedNoteId={null} onSelect={noop} />);
    // 일반 섹션은 고정 제외 2개
    expect(screen.getByText('노트 2개')).toBeInTheDocument();
  });

  it('[정상] should 핀 버튼 클릭 시 togglePin(id)이 호출된다', async () => {
    const user = userEvent.setup();
    mockNotes = [makeNote('1', '일반', false)];
    render(<NoteList selectedNoteId={null} onSelect={noop} />);
    await user.click(screen.getByRole('button', { name: '고정' }));
    expect(togglePin).toHaveBeenCalledWith('1');
  });

  it('[정상] should 삭제된(deletedAt) 노트는 일반 목록에 표시하지 않는다 (TRASH-1 B)', () => {
    mockNotes = [makeNote('1', '활성노트', false), makeNote('2', '삭제된노트', false, 'x')];
    render(<NoteList selectedNoteId={null} onSelect={noop} />);
    expect(screen.getByText('활성노트')).toBeInTheDocument();
    expect(screen.queryByText('삭제된노트')).not.toBeInTheDocument();
  });

  // ── 검색 필터·빈 결과 (SEARCH-1·2·3) ──
  it('[정상] should searchQuery로 제목/본문/태그를 걸러 표시한다', () => {
    mockNotes = [makeNote('1', '주간회의', false), makeNote('2', '장보기', false)];
    render(<NoteList selectedNoteId={null} onSelect={noop} searchQuery="회의" />);
    expect(screen.getByText('주간회의')).toBeInTheDocument();
    expect(screen.queryByText('장보기')).not.toBeInTheDocument();
  });

  it('[경계] should 검색 결과가 0개면 "검색 결과가 없습니다"를, 원본 0개면 "노트가 없습니다"를 보인다', () => {
    mockNotes = [makeNote('1', '주간회의', false)];
    const { rerender } = render(
      <NoteList selectedNoteId={null} onSelect={noop} searchQuery="없는검색어" />,
    );
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    // 원본이 0개일 때는 다른 안내
    mockNotes = [];
    rerender(<NoteList selectedNoteId={null} onSelect={noop} searchQuery="" />);
    expect(screen.getByText('노트가 없습니다')).toBeInTheDocument();
  });
});
