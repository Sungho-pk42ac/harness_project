import { partitionByPinned } from './partitionByPinned';
import type { Note } from '../types/note';

// 핀 분리 순수 함수 단위 테스트 (PIN-2, spec-fixed §7)
const makeNote = (id: string, isPinned?: boolean): Note => ({
  id,
  title: `제목-${id}`,
  content: '내용',
  tags: [],
  isPinned: isPinned as boolean,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
});

describe('partitionByPinned', () => {
  it('[정상] should 고정 노트는 pinned, 나머지는 others로 분리한다', () => {
    const notes = [makeNote('1', true), makeNote('2', false), makeNote('3', true)];
    const { pinned, others } = partitionByPinned(notes);
    expect(pinned.map((n) => n.id)).toEqual(['1', '3']);
    expect(others.map((n) => n.id)).toEqual(['2']);
  });

  it('[정상] should 두 그룹 모두 원본 순서를 유지한다', () => {
    const notes = [
      makeNote('a', false),
      makeNote('b', true),
      makeNote('c', false),
      makeNote('d', true),
    ];
    const { pinned, others } = partitionByPinned(notes);
    expect(pinned.map((n) => n.id)).toEqual(['b', 'd']);
    expect(others.map((n) => n.id)).toEqual(['a', 'c']);
  });

  it('[경계] should isPinned가 undefined인 구버전 노트는 others로 취급한다', () => {
    const legacy = makeNote('x');
    delete (legacy as { isPinned?: boolean }).isPinned;
    const { pinned, others } = partitionByPinned([legacy]);
    expect(pinned).toHaveLength(0);
    expect(others.map((n) => n.id)).toEqual(['x']);
  });

  it('[경계] should 고정 노트가 없으면 pinned는 빈 배열이다', () => {
    const { pinned, others } = partitionByPinned([makeNote('1', false), makeNote('2', false)]);
    expect(pinned).toEqual([]);
    expect(others).toHaveLength(2);
  });

  it('[경계] should 원본 배열을 변형하지 않는다 (불변)', () => {
    const notes = [makeNote('1', true), makeNote('2', false)];
    const snapshot = [...notes];
    partitionByPinned(notes);
    expect(notes).toEqual(snapshot);
    expect(notes).toHaveLength(2);
  });
});
