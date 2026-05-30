import { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { canAddTag } from '../lib/tag';
import { isTrashed } from '../utils/trash';
import { MarkdownPreview } from './MarkdownPreview';
import { noteToMarkdown, buildExportFilename } from '../lib/export';
import { downloadTextFile } from '../lib/download';

type EditorView = 'edit' | 'preview';

interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

export function NoteEditor({ selectedNoteId, isCreating, onDone }: NoteEditorProps) {
  const { notes, addNote, editNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  // 편집/미리보기 토글 — 편집기 로컬 화면 상태 (markdown-preview spec-fixed §2)
  const [view, setView] = useState<EditorView>('edit');

  // 삭제(휴지통)된 노트는 편집기에서 가리키지 않는다 — 열려 있던 노트가 삭제되면 빈 상태로 (trash spec-fixed §4)
  const selectedNote = notes.find((n) => n.id === selectedNoteId && !isTrashed(n));

  // 선택된 노트가 바뀔 때 폼 동기화
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setTags(selectedNote.tags ?? []); // 구버전 노트(tags 없음) 호환 (ADR-0001)
    } else if (isCreating) {
      setTitle('');
      setContent('');
      setTags([]);
    }
    setTagInput('');
    setView('edit'); // 노트 전환/새 노트 시 항상 편집 모드로 리셋 (spec-fixed §2)
  }, [selectedNoteId, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter/쉼표로 입력 텍스트를 태그 칩으로 확정한다 (정규화·검증은 canAddTag, ADR-0002)
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const result = canAddTag(tags, tagInput);
      if (result.ok) {
        setTags((prev) => [...prev, result.value]);
        setTagInput('');
      } else if (result.reason === 'duplicate') {
        // 중복은 사용자에게 명시적으로 안내 (ADR-0002)
        alert('이미 있는 태그입니다');
      } else {
        // 빈값(empty)·개수상한(max)은 조용히 무시
        setTagInput('');
      }
    }
  };

  // 칩 개별 삭제 — 인덱스 기반 제거 (같은 이름이 여러 개여도 클릭한 칩만)
  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  // 현재 저장된 노트를 마크다운(.md)으로 내보낸다 (export spec-fixed §2·§5)
  // 미저장 화면 상태가 아니라 저장된 selectedNote 기준으로 내보낸다.
  const handleExport = () => {
    if (!selectedNote) return;
    try {
      const md = noteToMarkdown(selectedNote);
      downloadTextFile(buildExportFilename(selectedNote.title, 'md'), md, 'text/markdown');
    } catch (e) {
      console.error(e);
      alert('내보내기에 실패했습니다');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        await addNote(title, content, tags);
      } else if (selectedNoteId) {
        await editNote(selectedNoteId, { title, content, tags });
      }
      onDone();
    } catch (e) {
      console.error(e);
      alert('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 아무것도 선택 안 됐거나, 선택한 노트가 삭제(휴지통)된 상태
  if (!isCreating && !selectedNote) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-5xl">📝</p>
          <p className="text-muted-foreground text-sm">노트를 선택하거나 새 노트를 만드세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl px-8 sm:px-12 py-8 shadow-md border border-border max-w-2xl">
      {/* 섹션 라벨 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">
        {isCreating ? '새 노트' : '노트 편집'}
      </p>

      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4"
      />

      {/* 구분선 */}
      <div className="h-px bg-border mb-4" />

      {/* 편집/미리보기 토글 — 본문 영역만 전환 (markdown-preview spec-fixed §3) */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          aria-label={view === 'edit' ? '미리보기' : '편집'}
          onClick={() => setView((v) => (v === 'edit' ? 'preview' : 'edit'))}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors cursor-pointer"
        >
          {view === 'edit' ? '미리보기' : '편집'}
        </button>
      </div>

      {/* 내용 입력 / 미리보기 — 토글에 따라 본문 영역만 전환 */}
      {view === 'edit' ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요..."
          rows={14}
          className="w-full text-base text-foreground/70 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
        />
      ) : (
        <MarkdownPreview content={content} />
      )}

      {/* 태그 영역 */}
      <div className="mt-4">
        {/* 현재 태그 칩 목록 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
              >
                {/* 라벨을 별도 요소로 분리 — 삭제 버튼(×) 텍스트와 섞이지 않게(E2E exact 매칭 보존) */}
                <span>{tag}</span>
                <button
                  type="button"
                  aria-label={`${tag} 삭제`}
                  onClick={() => handleRemoveTag(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {/* 태그 입력 */}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="태그 입력"
          className="w-full text-sm text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-foreground text-card px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
        >
          취소
        </button>
        {/* 내보내기(.md) — 저장된 노트가 있을 때만(미저장 새 노트엔 미표시) (export spec-fixed §2) */}
        {selectedNote && (
          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
          >
            내보내기
          </button>
        )}
      </div>
    </div>
  );
}
