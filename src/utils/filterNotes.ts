import { Note } from '../types/note';

/**
 * 검색어로 노트 목록을 거른다 (search spec-fixed §3). 원본 불변.
 * - 제목·본문·태그를 통합 검색, 부분 포함, 대소문자 무시(양쪽 toLowerCase)
 * - 검색어는 앞뒤 공백만 trim, 빈 검색어(또는 공백만)면 전체를 그대로 반환
 * - tags가 없는 구버전 노트는 note.tags ?? [] 로 안전 처리
 * @param notes 원본 노트 목록
 * @param query 검색어
 * @returns 걸러진 노트 목록(빈 검색어면 원본 그대로)
 */
export function filterNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (q === '') return notes;
  return notes.filter((note) => {
    const haystacks = [note.title, note.content, ...(note.tags ?? [])];
    return haystacks.some((s) => s.toLowerCase().includes(q));
  });
}
