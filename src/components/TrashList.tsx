import { useNotes } from '../context/NotesContext';
import { trashedNotes } from '../utils/trash';

/**
 * 휴지통 목록 — 소프트 삭제된 노트만 모아 보여주고, 각 항목을 복원/영구삭제한다 (TRASH-2·3·4).
 * 일반 목록(NoteList)과 달리 카드 선택·핀·삭제 버튼은 없고 복원·영구삭제만 제공한다.
 */
export function TrashList() {
  const { notes, restoreNote, purgeNote } = useNotes();
  const trashed = trashedNotes(notes);

  // 복원 — 실패 시 알림 (호출부 try/catch + alert 패턴)
  const handleRestore = async (id: string) => {
    try {
      await restoreNote(id);
    } catch (e) {
      console.error(e);
      alert('복원에 실패했습니다');
    }
  };

  // 영구 삭제 — 되돌릴 수 없으므로 확인 후 실행, 실패 시 알림
  const handlePurge = async (id: string) => {
    if (!confirm('이 노트를 영구 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await purgeNote(id);
    } catch (e) {
      console.error(e);
      alert('영구 삭제에 실패했습니다');
    }
  };

  if (trashed.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">휴지통이 비어 있습니다</p>;
  }

  return (
    <>
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-1 pb-1">
        휴지통 {trashed.length}개
      </p>
      {trashed.map((note) => (
        <div key={note.id} className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {note.title || '(제목 없음)'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {note.content || '(내용 없음)'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleRestore(note.id)}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              복원
            </button>
            <button
              type="button"
              onClick={() => handlePurge(note.id)}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              영구 삭제
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
