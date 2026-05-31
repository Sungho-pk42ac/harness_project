import { Note } from '../types/note';
import { getSupabase } from './supabaseClient';

const API_URL = 'http://localhost:3001';

// Supabase notes row(snake_case) 형태 (ADR-0002)
interface NoteRow {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  is_pinned: boolean | null;
  deleted_at: string | null;
}

/** snake_case row → camelCase Note 매핑 (구버전 방어: tags/is_pinned 기본값). */
function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    isPinned: row.is_pinned ?? false,
    deletedAt: row.deleted_at ?? null,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  // 삭제된 노트도 포함해 전부 반환 — 휴지통 분리는 상위(Context/utils) 소관(동작 불변).
  const { data, error } = await getSupabase().from('notes').select('*');
  if (error) throw new Error('Failed to fetch notes');
  return (data ?? []).map(toNote);
}

/**
 * 노트를 생성한다. 타임스탬프는 클라이언트에서 채우고 ID는 서버가 부여한다.
 * @param note id/타임스탬프를 제외한 노트 데이터(tags 포함)
 */
export async function createNote(
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Note> {
  const now = new Date().toISOString();
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...note, createdAt: now, updatedAt: now }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

/**
 * 노트를 부분 수정한다. updatedAt은 클라이언트에서 갱신한다.
 * @param id 수정할 노트 ID
 * @param updates 변경할 필드(tags 포함 가능)
 */
export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete note');
}
