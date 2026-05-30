import { filterNotes } from './filterNotes';
import type { Note } from '../types/note';

// 검색 필터 순수 함수 단위 테스트 (search spec-fixed §3·§7)
const makeNote = (id: string, title: string, content: string, tags: string[]): Note => ({
  id,
  title,
  content,
  tags,
  isPinned: false,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
});

const notes = [
  makeNote('1', '주간회의록', '이번 주 정리', ['업무']),
  makeNote('2', '장보기', '우유 계란', ['생활', 'Shopping']),
  makeNote('3', 'Recipe', '파스타 만들기', ['요리']),
];

describe('filterNotes', () => {
  it('[정상] 제목에 부분 포함되면 매치된다', () => {
    expect(filterNotes(notes, '회의').map((n) => n.id)).toEqual(['1']);
  });

  it('[정상] 본문에 부분 포함되면 매치된다', () => {
    expect(filterNotes(notes, '파스타').map((n) => n.id)).toEqual(['3']);
  });

  it('[정상] 태그 중 하나라도 부분 포함되면 매치된다', () => {
    expect(filterNotes(notes, '요리').map((n) => n.id)).toEqual(['3']);
  });

  it('[정상] 대소문자가 달라도 매치된다(소문자화 비교)', () => {
    expect(filterNotes(notes, 'recipe').map((n) => n.id)).toEqual(['3']);
    expect(filterNotes(notes, 'shopping').map((n) => n.id)).toEqual(['2']);
  });

  it('[경계] 빈 검색어면 전체를 반환한다', () => {
    expect(filterNotes(notes, '')).toHaveLength(3);
  });

  it('[경계] 공백만이면(trim 후 빈 값) 전체를 반환한다', () => {
    expect(filterNotes(notes, '   ')).toHaveLength(3);
  });

  it('[경계] 앞뒤 공백은 무시하고 비교한다', () => {
    expect(filterNotes(notes, '  회의  ').map((n) => n.id)).toEqual(['1']);
  });

  it('[정상] 일치하는 노트가 없으면 빈 배열을 반환한다', () => {
    expect(filterNotes(notes, '존재하지않는검색어')).toEqual([]);
  });

  it('[경계] tags가 undefined인 노트도 에러 없이 건너뛴다', () => {
    const legacy = { ...makeNote('4', '제목', '내용', []) } as Note;
    delete (legacy as { tags?: string[] }).tags;
    expect(() => filterNotes([legacy], '내용')).not.toThrow();
    expect(filterNotes([legacy], '내용').map((n) => n.id)).toEqual(['4']);
  });

  it('[경계] 원본 배열을 변형하지 않는다(불변)', () => {
    const input = [...notes];
    const snapshot = [...input];
    filterNotes(input, '회의');
    expect(input).toEqual(snapshot);
  });
});
