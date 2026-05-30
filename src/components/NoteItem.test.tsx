import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

// NoteItem은 순수 프레젠테이션 컴포넌트 — props만 주입한다.
const baseNote: Note = {
  id: '1',
  title: '제목',
  content: '내용',
  tags: [],
  isPinned: false,
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
        onTogglePin={noop}
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
        onTogglePin={noop}
      />,
    );
    expect(screen.queryByTestId('note-tags')).not.toBeInTheDocument();
  });

  it('[경계] NoteItem — should 에러 없이 태그 영역을 렌더하지 않는다 when note.tags가 undefined다 (note.tags ?? [])', () => {
    const legacyNote = { ...baseNote } as Note;
    // 구버전 노트: tags 필드 자체가 없음
    delete (legacyNote as { tags?: string[] }).tags;
    render(
      <NoteItem
        note={legacyNote}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
        onTogglePin={noop}
      />,
    );
    expect(screen.queryByTestId('note-tags')).not.toBeInTheDocument();
  });

  it('[경계] NoteItem — should 태그 5개를 모두 칩으로 표시한다 when note.tags에 태그가 5개 있다', () => {
    const tags = ['a', 'b', 'c', 'd', 'e'];
    render(
      <NoteItem
        note={{ ...baseNote, tags }}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
        onTogglePin={noop}
      />,
    );
    const container = screen.getByTestId('note-tags');
    expect(container).toBeInTheDocument();
    // 줄바꿈 레이아웃(AC-C) — flex-wrap으로 칩이 넘치면 다음 줄로 내려간다
    expect(container).toHaveClass('flex-wrap');
    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });

  // ── 핀 토글 버튼 (PIN-1, spec-fixed §3·§7) ──

  it('[정상] NoteItem — should 핀 버튼 클릭 시 onTogglePin(id)을 호출하고 onSelect는 호출하지 않는다 (stopPropagation)', async () => {
    const user = userEvent.setup();
    const onTogglePin = vi.fn();
    const onSelect = vi.fn();
    render(
      <NoteItem
        note={baseNote}
        isSelected={false}
        onSelect={onSelect}
        onDelete={noop}
        onTogglePin={onTogglePin}
      />,
    );
    // 미고정 노트 → "고정" aria-label
    await user.click(screen.getByRole('button', { name: '고정' }));
    expect(onTogglePin).toHaveBeenCalledWith('1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('[정상] NoteItem — should 고정된 노트는 "고정 해제" aria-label 버튼을 보인다', () => {
    render(
      <NoteItem
        note={{ ...baseNote, isPinned: true }}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
        onTogglePin={noop}
      />,
    );
    expect(screen.getByRole('button', { name: '고정 해제' })).toBeInTheDocument();
  });

  it('[경계] NoteItem — should isPinned가 undefined면 "고정"(미고정) 버튼으로 취급한다', () => {
    const legacy = { ...baseNote } as Note;
    delete (legacy as { isPinned?: boolean }).isPinned;
    render(
      <NoteItem
        note={legacy}
        isSelected={false}
        onSelect={noop}
        onDelete={noop}
        onTogglePin={noop}
      />,
    );
    expect(screen.getByRole('button', { name: '고정' })).toBeInTheDocument();
  });

  // ── 복제 버튼 (DUPLICATE-1, spec-fixed §2) ──
  it('[정상] NoteItem — should 복제 버튼 클릭 시 onDuplicate(id)를 호출하고 onSelect는 호출하지 않는다', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    const onSelect = vi.fn();
    render(
      <NoteItem
        note={baseNote}
        isSelected={false}
        onSelect={onSelect}
        onDelete={noop}
        onTogglePin={noop}
        onDuplicate={onDuplicate}
      />,
    );
    await user.click(screen.getByRole('button', { name: '복제' }));
    expect(onDuplicate).toHaveBeenCalledWith('1');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
