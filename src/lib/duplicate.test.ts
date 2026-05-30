import { buildDuplicatePayload } from './duplicate';
import type { Note } from '../types/note';

// 복제 페이로드 생성 순수 함수 테스트 (duplicate spec-fixed §3·§7)
const makeNote = (over: Partial<Note> = {}): Note => ({
  id: '1',
  title: '회의록',
  content: '내용',
  tags: ['업무'],
  isPinned: false,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
  ...over,
});

describe('buildDuplicatePayload', () => {
  it('[정상] should 제목에 " (사본)"을 붙이고 본문·태그를 복사한다', () => {
    const p = buildDuplicatePayload(makeNote());
    expect(p.title).toBe('회의록 (사본)');
    expect(p.content).toBe('내용');
    expect(p.tags).toEqual(['업무']);
  });

  it('[경계] should 빈 제목이면 "(사본)"만 단다(앞 공백 없이)', () => {
    expect(buildDuplicatePayload(makeNote({ title: '' })).title).toBe('(사본)');
  });

  it('[경계] should 이미 (사본)이 붙어도 연쇄 카운팅 없이 " (사본)"을 또 붙인다', () => {
    expect(buildDuplicatePayload(makeNote({ title: '회의록 (사본)' })).title).toBe(
      '회의록 (사본) (사본)',
    );
  });

  it('[경계] should tags가 undefined인 구버전 노트는 빈 배열로 복사한다', () => {
    const legacy = makeNote();
    delete (legacy as { tags?: string[] }).tags;
    expect(buildDuplicatePayload(legacy).tags).toEqual([]);
  });

  it('[정상] should 태그 배열을 얕은 복사해 원본과 참조를 분리한다', () => {
    const note = makeNote({ tags: ['a', 'b'] });
    const p = buildDuplicatePayload(note);
    expect(p.tags).toEqual(['a', 'b']);
    expect(p.tags).not.toBe(note.tags);
  });

  it('[정상] should id·타임스탬프는 페이로드에 포함하지 않는다', () => {
    const p = buildDuplicatePayload(makeNote());
    expect(p).not.toHaveProperty('id');
    expect(p).not.toHaveProperty('createdAt');
    expect(p).not.toHaveProperty('updatedAt');
  });
});
