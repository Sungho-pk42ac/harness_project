import { Note } from '../types/note';

/**
 * 노트 배열을 고정(pinned)/일반(others) 두 그룹으로 나누는 순수 함수 (pin ADR-0003).
 * 원본 배열을 변형하지 않으며, 각 그룹은 원본 순서를 그대로 유지한다.
 * isPinned가 없는 구버전 노트는 note.isPinned ?? false 로 일반(others)으로 취급한다.
 * @param notes 분리할 노트 배열
 * @returns 고정 노트(pinned)와 일반 노트(others)
 */
export function partitionByPinned(notes: Note[]): { pinned: Note[]; others: Note[] } {
  const pinned: Note[] = [];
  const others: Note[] = [];
  for (const note of notes) {
    if (note.isPinned ?? false) {
      pinned.push(note);
    } else {
      others.push(note);
    }
  }
  return { pinned, others };
}
