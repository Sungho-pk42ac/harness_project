import { Note } from '../types/note';

/**
 * 노트가 휴지통(소프트 삭제) 상태인지 판정한다 (trash ADR-0002).
 * deletedAt이 truthy면 삭제, 없거나 빈 문자열이면 활성으로 본다(구버전 호환).
 * @param note 판정할 노트
 */
export function isTrashed(note: Note): boolean {
  return !!note.deletedAt;
}

/**
 * 활성 노트(삭제되지 않은 노트)만 원본 순서로 반환한다. 원본 배열은 변형하지 않는다.
 * @param notes 전체 노트 배열
 */
export function activeNotes(notes: Note[]): Note[] {
  return notes.filter((n) => !isTrashed(n));
}

/**
 * 휴지통 노트(소프트 삭제된 노트)만 원본 순서로 반환한다. 원본 배열은 변형하지 않는다.
 * @param notes 전체 노트 배열
 */
export function trashedNotes(notes: Note[]): Note[] {
  return notes.filter((n) => isTrashed(n));
}
