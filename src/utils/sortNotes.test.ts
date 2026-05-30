import { sortNotes } from './sortNotes';
import type { Note } from '../types/note';

// 정렬 순수 함수 단위 테스트 (sort spec-fixed §3·§7)
const makeNote = (id: string, title: string, createdAt: string, updatedAt: string): Note => ({
  id,
  title,
  content: '내용',
  tags: [],
  isPinned: false,
  createdAt,
  updatedAt,
});

const a = makeNote('a', 'banana', '2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');
const b = makeNote('b', 'apple', '2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
const c = makeNote('c', '가나다', '2026-03-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');

describe('sortNotes', () => {
  it('[정상] updatedAt desc — 가장 최근 수정 노트가 맨 앞', () => {
    const r = sortNotes([b, c, a], 'updatedAt', 'desc');
    expect(r.map((n) => n.id)).toEqual(['a', 'c', 'b']); // 03>02>01
  });

  it('[정상] updatedAt asc — 가장 오래된 수정 노트가 맨 앞', () => {
    const r = sortNotes([a, c, b], 'updatedAt', 'asc');
    expect(r.map((n) => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('[정상] createdAt asc/desc — 생성일 순서대로 정렬', () => {
    expect(sortNotes([c, a, b], 'createdAt', 'asc').map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(sortNotes([a, b, c], 'createdAt', 'desc').map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });

  it('[정상] title asc — ABC 순(localeCompare), desc는 그 역순', () => {
    // 라틴 제목으로 결정적 순서 검증 (ICU의 한·영 교차 순서에 의존하지 않음)
    const apple = makeNote('ap', 'apple', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    const banana = makeNote('ba', 'banana', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    const cherry = makeNote('ch', 'cherry', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    expect(sortNotes([cherry, apple, banana], 'title', 'asc').map((n) => n.id)).toEqual([
      'ap',
      'ba',
      'ch',
    ]);
    expect(sortNotes([apple, banana, cherry], 'title', 'desc').map((n) => n.id)).toEqual([
      'ch',
      'ba',
      'ap',
    ]);
  });

  it('[정상] title — 한글 제목도 localeCompare로 가나다 순 정렬된다', () => {
    const ga = makeNote('g', '가', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    const na = makeNote('n', '나', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    expect(sortNotes([na, ga], 'title', 'asc').map((n) => n.id)).toEqual(['g', 'n']);
    expect(sortNotes([ga, na], 'title', 'desc').map((n) => n.id)).toEqual(['n', 'g']);
  });

  it('[경계] 빈 제목 노트도 에러 없이 정렬된다 (오름차순 맨 앞)', () => {
    const empty = makeNote('e', '', '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
    const r = sortNotes([a, empty, b], 'title', 'asc');
    expect(r[0].id).toBe('e');
  });

  it('[경계] 같은 값이면 원본 순서 유지(안정 정렬)', () => {
    const x = makeNote('x', 'same', '2026-01-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z');
    const y = makeNote('y', 'same', '2026-01-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z');
    const r = sortNotes([x, y], 'updatedAt', 'desc');
    expect(r.map((n) => n.id)).toEqual(['x', 'y']);
  });

  it('[경계] 원본 배열을 변형하지 않는다(불변)', () => {
    const input = [b, c, a];
    const snapshot = [...input];
    sortNotes(input, 'updatedAt', 'desc');
    expect(input).toEqual(snapshot);
    expect(input[0]).toBe(b);
  });
});
