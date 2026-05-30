import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note } from '../types/note';
import * as api from '../api/notes';
import { buildDuplicatePayload } from '../lib/duplicate';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  // 확정 시그니처(issue-6): tags 인자 추가. 복제(duplicate ADR-0001)를 위해 생성 노트를 반환
  addNote: (title: string, content: string, tags: string[]) => Promise<Note>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  // 소프트 삭제(trash ADR-0001): deletedAt을 채워 휴지통으로 보낸다(제거 아님)
  removeNote: (id: string) => Promise<void>;
  // 핀 토글(pin ADR-0003): 현재 isPinned를 뒤집어 영속화 후 로컬 배열 교체
  togglePin: (id: string) => Promise<void>;
  // 복원: deletedAt을 비워 활성 목록으로 되돌린다
  restoreNote: (id: string) => Promise<void>;
  // 영구 삭제: DB에서 실제 제거(되돌릴 수 없음)
  purgeNote: (id: string) => Promise<void>;
  // 복제: 원본의 (사본) 페이로드로 새 노트를 생성해 반환 (duplicate ADR-0002)
  duplicateNote: (id: string) => Promise<Note>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchNotes()
      .then(setNotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 생성: api 응답으로 받은 노트를 로컬 상태에 append (자체 catch 없이 호출부로 전파)
  // 새 노트는 핀이 꺼진 상태(isPinned: false)로 시작한다 (pin spec-fixed §5)
  const addNote = async (title: string, content: string, tags: string[]) => {
    const created = await api.createNote({ title, content, tags, isPinned: false });
    setNotes((prev) => [...prev, created]);
    return created; // 복제 등에서 새 노트 id가 필요하므로 생성 노트를 반환 (duplicate ADR-0001)
  };

  // 수정: api 응답으로 받은 노트로 해당 항목을 교체 (자체 catch 없이 호출부로 전파)
  const editNote = async (id: string, updates: Partial<Note>) => {
    const updated = await api.updateNote(id, updates);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  // 삭제 = 소프트 삭제: deletedAt을 채워 영속화하고, 응답 노트로 교체(제거하지 않음 — 휴지통에 남아야 함)
  const removeNote = async (id: string) => {
    const updated = await api.updateNote(id, { deletedAt: new Date().toISOString() });
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  // 복원: deletedAt을 비워(null) 활성 목록으로 되돌리고 응답으로 교체
  const restoreNote = async (id: string) => {
    const updated = await api.updateNote(id, { deletedAt: null });
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  // 영구 삭제: DB에서 실제 제거 후 로컬에서도 제거(filter)
  const purgeNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // 복제: 원본을 찾아 (사본) 페이로드로 새 노트를 생성하고 그 노트를 반환한다
  const duplicateNote = async (id: string) => {
    const original = notes.find((n) => n.id === id);
    if (!original) throw new Error('복제할 노트를 찾을 수 없습니다');
    const { title, content, tags } = buildDuplicatePayload(original);
    return addNote(title, content, tags);
  };

  // 핀 토글: 현재 노트의 isPinned를 뒤집어 updateNote로 영속화, 응답으로 로컬 교체 (editNote와 동일 패턴)
  const togglePin = async (id: string) => {
    const current = notes.find((n) => n.id === id);
    const next = !(current?.isPinned ?? false);
    const updated = await api.updateNote(id, { isPinned: next });
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        error,
        addNote,
        editNote,
        removeNote,
        togglePin,
        restoreNote,
        purgeNote,
        duplicateNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
