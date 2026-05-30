import { Note } from '../types/note';

const API_URL = 'http://localhost:3001';

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
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
