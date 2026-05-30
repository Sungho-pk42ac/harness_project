import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note } from '../types/note';
import * as api from '../api/notes';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  // 확정 시그니처(issue-6): tags 인자 추가
  addNote: (title: string, content: string, tags: string[]) => Promise<void>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  // 핀 토글(pin ADR-0003): 현재 isPinned를 뒤집어 영속화 후 로컬 배열 교체
  togglePin: (id: string) => Promise<void>;
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
  };

  // 수정: api 응답으로 받은 노트로 해당 항목을 교체 (자체 catch 없이 호출부로 전파)
  const editNote = async (id: string, updates: Partial<Note>) => {
    const updated = await api.updateNote(id, updates);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const removeNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
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
      value={{ notes, loading, error, addNote, editNote, removeNote, togglePin }}
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
