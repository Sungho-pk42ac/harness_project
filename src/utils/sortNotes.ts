import { Note } from '../types/note';

export type SortBy = 'updatedAt' | 'createdAt' | 'title';
export type SortDir = 'asc' | 'desc';

/**
 * 노트 목록을 기준·방향으로 정렬한다 (sort spec-fixed §3). 원본 불변 — 복사본을 정렬해 반환한다.
 * - 날짜(updatedAt/createdAt): ISO 문자열 비교(사전식=시간순)
 * - 제목(title): localeCompare('ko')로 한·영 자연 정렬, 정렬 키는 원본 title(표시 문구 미사용)
 * - 방향: desc면 비교 부호 반전. JS sort는 stable이라 동률 시 원본 순서 유지.
 * @param notes 원본 노트 목록
 * @param sortBy 정렬 기준
 * @param sortDir 정렬 방향
 * @returns 정렬된 새 배열
 */
export function sortNotes(notes: Note[], sortBy: SortBy, sortDir: SortDir): Note[] {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...notes].sort((x, y) => {
    let cmp: number;
    if (sortBy === 'title') {
      cmp = (x.title ?? '').localeCompare(y.title ?? '', 'ko');
    } else {
      const xv = x[sortBy] ?? '';
      const yv = y[sortBy] ?? '';
      cmp = xv < yv ? -1 : xv > yv ? 1 : 0;
    }
    return cmp * dir;
  });
}
