import { Note } from '../types/note';

/** 복제본 생성에 넘길 페이로드(id·타임스탬프 제외) */
export interface DuplicatePayload {
  title: string;
  content: string;
  tags: string[];
}

/**
 * 노트 복제 페이로드를 만든다 (duplicate spec-fixed §3). 원본 불변.
 * - 제목: 원본 title + " (사본)", 빈 제목이면 "(사본)"만(앞 공백 없이). 연쇄 카운팅 없음.
 * - 본문: 그대로 복사. 태그: note.tags ?? [] 를 얕은 복사(참조 분리).
 * - id·타임스탬프는 포함하지 않는다(서버/클라이언트가 새로 채움).
 * @param note 원본 노트
 */
export function buildDuplicatePayload(note: Note): DuplicatePayload {
  const base = note.title ?? '';
  const title = base ? `${base} (사본)` : '(사본)';
  return {
    title,
    content: note.content,
    tags: [...(note.tags ?? [])],
  };
}
