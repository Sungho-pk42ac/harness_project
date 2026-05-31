import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useNotes } from '../context/NotesContext';
import { NoteGraph } from './NoteGraph';
import { Note } from '../types/note';

vi.mock('../context/NotesContext', () => ({
  useNotes: vi.fn(),
}));

const mockUseNotes = vi.mocked(useNotes);

function makeNote(over: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '노트',
    content: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    isPinned: false,
    deletedAt: null,
    ...over,
  };
}

/** useNotes 모킹의 notes만 채운다(컴포넌트는 notes만 사용). */
function setNotes(notes: Note[]) {
  mockUseNotes.mockReturnValue({ notes } as unknown as ReturnType<typeof useNotes>);
}

describe('NoteGraph', () => {
  it('should 노드 circle과 엣지 line을 렌더한다 when 공유 태그 노트 2개', () => {
    setNotes([
      makeNote({ id: 'a', title: 'A', tags: ['x'] }),
      makeNote({ id: 'b', title: 'B', tags: ['x'] }),
    ]);
    const { container } = render(<NoteGraph onSelectNote={vi.fn()} />);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelectorAll('line')).toHaveLength(1);
  });

  it('should 노드 클릭 시 onSelectNote(id)를 호출한다', () => {
    setNotes([
      makeNote({ id: 'a', title: 'A', tags: ['x'] }),
      makeNote({ id: 'b', title: 'B', tags: ['x'] }),
    ]);
    const onSelectNote = vi.fn();
    render(<NoteGraph onSelectNote={onSelectNote} />);
    fireEvent.click(screen.getByRole('button', { name: '노트: A' }));
    expect(onSelectNote).toHaveBeenCalledWith('a');
  });

  it('should 빈 상태를 보여준다 when 노드가 1개 이하', () => {
    setNotes([makeNote({ id: 'a', title: 'A', tags: ['x'] })]);
    render(<NoteGraph onSelectNote={vi.fn()} />);
    expect(screen.getByText(/그래프로 볼 노트가 아직 적어요/)).toBeInTheDocument();
  });

  it('should 빈 제목 노트를 "(제목 없음)"으로 라벨링한다', () => {
    setNotes([
      makeNote({ id: 'a', title: '', tags: ['x'] }),
      makeNote({ id: 'b', title: 'B', tags: ['x'] }),
    ]);
    render(<NoteGraph onSelectNote={vi.fn()} />);
    expect(screen.getByText('(제목 없음)')).toBeInTheDocument();
  });
});
