import { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function NoteItem({ note, isSelected, onSelect, onDelete, onTogglePin }: NoteItemProps) {
  // 구버전 노트(isPinned 없음) 방어 (pin ADR-0001)
  const isPinned = note.isPinned ?? false;

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`bg-card rounded-2xl p-4 border cursor-pointer transition-all ${
        isSelected ? 'border-foreground shadow-lg' : 'border-border hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
          {note.title || '(제목 없음)'}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {/* 핀 토글 — 고정 시 인디고(primary) 활성, 미고정은 보조색. 카드 선택과 분리(stopPropagation) */}
          <button
            type="button"
            aria-label={isPinned ? '고정 해제' : '고정'}
            aria-pressed={isPinned}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`text-xs transition-colors cursor-pointer ${
              isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isPinned ? '★' : '☆'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="text-muted-foreground hover:text-destructive text-xs transition-colors cursor-pointer"
          >
            삭제
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
        {note.content || '(내용 없음)'}
      </p>
      {/* 태그 칩 — 있을 때만 표시, 많으면 flex-wrap으로 줄바꿈 (note.tags ?? [] 구버전 방어, ADR-0001) */}
      {(note.tags ?? []).length > 0 && (
        <div data-testid="note-tags" className="flex flex-wrap gap-1 mt-2">
          {(note.tags ?? []).map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground/70 mt-2">
        {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
      </p>
    </div>
  );
}
