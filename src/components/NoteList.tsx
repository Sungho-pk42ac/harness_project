import { useNotes } from '../context/NotesContext';
import { NoteItem } from './NoteItem';
import { partitionByPinned } from '../utils/partitionByPinned';
import { activeNotes } from '../utils/trash';
import type { Note } from '../types/note';

interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
}

export function NoteList({ selectedNoteId, onSelect }: NoteListProps) {
  const { notes, loading, error, removeNote, togglePin } = useNotes();

  // 노트 삭제 — 실패 시 사용자에게 알림 (NoteEditor.handleSave와 동일한 에러 처리 패턴)
  const handleDelete = async (id: string) => {
    try {
      await removeNote(id);
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다');
    }
  };

  // 핀 토글 — 실패 시 알림 (handleDelete와 동일한 호출부 에러 처리 패턴)
  const handleTogglePin = async (id: string) => {
    try {
      await togglePin(id);
    } catch (e) {
      console.error(e);
      alert('핀 상태 변경에 실패했습니다');
    }
  };

  // 노트 카드 렌더 헬퍼 (고정/일반 섹션이 동일하게 사용)
  const renderItem = (note: Note) => (
    <NoteItem
      key={note.id}
      note={note}
      isSelected={note.id === selectedNoteId}
      onSelect={onSelect}
      onDelete={handleDelete}
      onTogglePin={handleTogglePin}
    />
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive text-center py-8">오류: {error}</p>;
  }

  // 일반 목록은 활성 노트(삭제되지 않은 노트)만 표시한다 (trash spec-fixed §3-1)
  const active = activeNotes(notes);

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">노트가 없습니다</p>;
  }

  // 고정/일반 2섹션 분기 — 원본 불변 파생 계산 (pin spec-fixed §2·§4)
  const { pinned, others } = partitionByPinned(active);

  return (
    <>
      {/* 고정됨 섹션 — 고정 노트가 있을 때만 머리글·목록을 렌더 (빈 섹션 미표시, PIN-3) */}
      {pinned.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-1 pb-1">
            고정됨
          </p>
          {pinned.map(renderItem)}
        </div>
      )}
      {/* 일반 섹션 — 고정 제외 나머지가 있을 때만 렌더. 개수는 고정 제외 나머지 수 */}
      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-1 pb-1">
            노트 {others.length}개
          </p>
          {others.map(renderItem)}
        </div>
      )}
    </>
  );
}
