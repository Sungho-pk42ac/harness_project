import { Note } from '../types/note';

/**
 * 노트 1건을 사람이 읽기 좋은 마크다운으로 변환한다 (export spec-fixed §3.1).
 * 제목은 # 헤딩, 본문은 그대로, 태그가 1개 이상일 때만 구분선+태그 줄을 덧붙인다.
 * @param note 변환할 노트
 */
export function noteToMarkdown(note: Note): string {
  const tags = note.tags ?? [];
  let md = `# ${note.title}\n\n${note.content}`;
  if (tags.length > 0) {
    md += `\n\n---\n태그: ${tags.join(', ')}`;
  }
  return md;
}

/**
 * 노트 배열을 백업용 JSON 문자열로 직렬화한다 (2칸 들여쓰기, export spec-fixed §3.2).
 * @param notes 전체 노트 배열
 */
export function notesToJson(notes: Note[]): string {
  return JSON.stringify(notes, null, 2);
}

/**
 * 내보내기 파일명을 만든다: {안전제목}-{YYYY-MM-DD}.{ext} (export spec-fixed §3.3).
 * 파일명 금지/위험 문자와 공백을 -로 치환하고 앞뒤 -를 정리, 빈 제목이면 untitled.
 * @param base 파일명 베이스(노트 제목 또는 'notes-backup')
 * @param ext 확장자
 * @param date 날짜(기본 현재)
 */
export function buildExportFilename(
  base: string,
  ext: 'md' | 'json',
  date: Date = new Date(),
): string {
  const safe =
    base
      .replace(/[\\/:*?"<>|]/g, '-') // 파일명 금지 문자 → -
      .replace(/\s+/g, '-') // 공백 → -
      .replace(/-+/g, '-') // 연속 - 축약
      .replace(/^-+|-+$/g, '') || // 앞뒤 - 제거
    'untitled';
  const day = date.toISOString().slice(0, 10);
  return `${safe}-${day}.${ext}`;
}
