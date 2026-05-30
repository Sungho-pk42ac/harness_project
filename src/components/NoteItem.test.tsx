import { render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

// NoteItem은 순수 프레젠테이션 컴포넌트 — props만 주입한다.
const baseNote: Note = {
  id: '1',
  title: '제목',
  content: '내용',
  tags: [],
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
};

const noop = () => {};

describe('NoteItem', () => {
  it('[정상] NoteItem — should "회의" 칩을 카드에 표시한다 when note.tags에 "회의"가 있다', () => {
    render(
      <NoteItem
        note={{ ...baseNote, tags: ['회의'] }}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('회의')).toBeInTheDocument();
  });

  it('[경계] NoteItem — should 태그 영역(note-tags)을 렌더하지 않는다 when note.tags가 빈 배열이다', () => {
    render(
      <NoteItem
        note={{ ...baseNote, tags: [] }}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByTestId('note-tags')).not.toBeInTheDocument();
  });

  it('[경계] NoteItem — should 에러 없이 태그 영역을 렌더하지 않는다 when note.tags가 undefined다 (note.tags ?? [])', () => {
    const legacyNote = { ...baseNote } as Note;
    // 구버전 노트: tags 필드 자체가 없음
    delete (legacyNote as { tags?: string[] }).tags;
    render(<NoteItem note={legacyNote} isSelected={false} onSelect={noop} onDelete={noop} />);
    expect(screen.queryByTestId('note-tags')).not.toBeInTheDocument();
  });

  it('[경계] NoteItem — should 태그 5개를 모두 칩으로 표시한다 when note.tags에 태그가 5개 있다', () => {
    const tags = ['a', 'b', 'c', 'd', 'e'];
    render(
      <NoteItem note={{ ...baseNote, tags }} isSelected={false} onSelect={noop} onDelete={noop} />,
    );
    const container = screen.getByTestId('note-tags');
    expect(container).toBeInTheDocument();
    // 줄바꿈 레이아웃(AC-C) — flex-wrap으로 칩이 넘치면 다음 줄로 내려간다
    expect(container).toHaveClass('flex-wrap');
    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });
});
