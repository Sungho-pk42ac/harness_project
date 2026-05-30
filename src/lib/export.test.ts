import { noteToMarkdown, notesToJson, buildExportFilename } from './export';
import type { Note } from '../types/note';

const makeNote = (over: Partial<Note> = {}): Note => ({
  id: '1',
  title: '회의록',
  content: '본문 내용',
  tags: ['업무', '주간'],
  isPinned: false,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
  ...over,
});

const FIXED = new Date('2026-05-31T12:00:00.000Z');

describe('noteToMarkdown', () => {
  it('[정상] should 제목을 # 헤딩, 본문 그대로, 태그 줄을 포함한다', () => {
    const md = noteToMarkdown(makeNote());
    expect(md).toContain('# 회의록');
    expect(md).toContain('본문 내용');
    expect(md).toContain('태그: 업무, 주간');
    expect(md).toContain('---');
  });

  it('[경계] should 태그가 없으면 태그 줄과 구분선을 생략한다', () => {
    const md = noteToMarkdown(makeNote({ tags: [] }));
    expect(md).not.toContain('태그:');
    expect(md).not.toContain('---');
  });

  it('[경계] should tags가 undefined인 구버전 노트도 에러 없이 처리한다', () => {
    const legacy = makeNote();
    delete (legacy as { tags?: string[] }).tags;
    expect(() => noteToMarkdown(legacy)).not.toThrow();
    expect(noteToMarkdown(legacy)).not.toContain('태그:');
  });

  it('[경계] should 빈 본문도 에러 없이 처리한다', () => {
    expect(() => noteToMarkdown(makeNote({ content: '' }))).not.toThrow();
  });
});

describe('notesToJson', () => {
  it('[정상] should 노트 배열을 2칸 들여쓰기 JSON으로 직렬화한다', () => {
    const json = notesToJson([makeNote()]);
    expect(json).toContain('"title": "회의록"');
    expect(JSON.parse(json)).toHaveLength(1);
  });

  it('[경계] should 빈 배열이면 "[]"를 반환한다', () => {
    expect(notesToJson([])).toBe('[]');
  });
});

describe('buildExportFilename', () => {
  it('[정상] should {안전제목}-{YYYY-MM-DD}.md 형식을 만든다', () => {
    expect(buildExportFilename('회의록', 'md', FIXED)).toBe('회의록-2026-05-31.md');
  });

  it('[정상] should notes-backup-{날짜}.json 형식을 만든다', () => {
    expect(buildExportFilename('notes-backup', 'json', FIXED)).toBe('notes-backup-2026-05-31.json');
  });

  it('[경계] should 위험 문자(\\ / : * ? " < > |)를 -로 치환한다', () => {
    const name = buildExportFilename('a/b:c*d?e"f<g>h|i', 'md', FIXED);
    expect(name).not.toMatch(/[\\/:*?"<>|]/);
    expect(name).toContain('2026-05-31.md');
  });

  it('[경계] should 빈 제목이면 untitled를 쓴다', () => {
    expect(buildExportFilename('', 'md', FIXED)).toBe('untitled-2026-05-31.md');
    expect(buildExportFilename('   ', 'md', FIXED)).toBe('untitled-2026-05-31.md');
  });
});
