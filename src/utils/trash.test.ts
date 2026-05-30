import { isTrashed, activeNotes, trashedNotes } from './trash';
import type { Note } from '../types/note';

// 활성/삭제 판정 순수 함수 단위 테스트 (trash ADR-0002)
const makeNote = (id: string, deletedAt?: string): Note => ({
  id,
  title: `제목-${id}`,
  content: '내용',
  tags: [],
  isPinned: false,
  deletedAt,
  createdAt: '2026-05-31T00:00:00.000Z',
  updatedAt: '2026-05-31T00:00:00.000Z',
});

describe('trash 파생 함수', () => {
  it('[정상] isTrashed — deletedAt이 있으면 true, 없으면 false', () => {
    expect(isTrashed(makeNote('1', '2026-05-31T01:00:00.000Z'))).toBe(true);
    expect(isTrashed(makeNote('2'))).toBe(false);
  });

  it('[경계] isTrashed — deletedAt이 빈 문자열/undefined면 활성(false)으로 본다', () => {
    expect(isTrashed(makeNote('3', ''))).toBe(false);
    const legacy = makeNote('4');
    delete (legacy as { deletedAt?: string }).deletedAt;
    expect(isTrashed(legacy)).toBe(false);
  });

  it('[정상] activeNotes — deletedAt 없는 노트만 원본 순서로 반환한다', () => {
    const notes = [makeNote('1'), makeNote('2', 'x'), makeNote('3')];
    expect(activeNotes(notes).map((n) => n.id)).toEqual(['1', '3']);
  });

  it('[정상] trashedNotes — deletedAt 있는 노트만 원본 순서로 반환한다', () => {
    const notes = [makeNote('1'), makeNote('2', 'x'), makeNote('3', 'y')];
    expect(trashedNotes(notes).map((n) => n.id)).toEqual(['2', '3']);
  });

  it('[경계] activeNotes/trashedNotes — 원본 배열을 변형하지 않는다', () => {
    const notes = [makeNote('1'), makeNote('2', 'x')];
    const snapshot = [...notes];
    activeNotes(notes);
    trashedNotes(notes);
    expect(notes).toEqual(snapshot);
  });
});
