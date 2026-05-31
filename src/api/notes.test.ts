import type { Mock } from 'vitest';
import { createNote, updateNote, deleteNote, fetchNotes } from './notes';
import { getSupabase } from './supabaseClient';

// 모든 노트 CRUD는 Supabase 경계(getSupabase)만 모킹한다(SUPA-2~4).
vi.mock('./supabaseClient', () => ({ getSupabase: vi.fn() }));

/**
 * Supabase 쿼리 빌더를 흉내내는 thenable 객체를 만든다.
 * insert/update/delete/select/eq는 자기 자신을 반환(체이닝), single()과 await는 result로 resolve.
 * @param result PostgREST 응답 { data, error }
 */
function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn().mockResolvedValue(result),
    // delete().eq() / select('*')처럼 .single() 없이 await하는 경로 지원
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  };
  return builder;
}

/** getSupabase().from('notes')가 주어진 결과의 빌더를 반환하도록 모킹한다. */
function stubSupabase(result: { data: unknown; error: unknown }) {
  const builder = makeBuilder(result);
  const from = vi.fn(() => builder);
  (getSupabase as Mock).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>);
  return { from, builder };
}

const rowFixture = {
  id: 'u1',
  title: 't',
  content: 'c',
  created_at: 'c-time',
  updated_at: 'u-time',
  tags: ['x'],
  is_pinned: false,
  deleted_at: null,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('fetchNotes', () => {
  it('[정상] fetchNotes — should snake_case row를 camelCase Note[]로 매핑해 반환한다 when supabase가 데이터를 반환한다', async () => {
    stubSupabase({
      data: [{ ...rowFixture, is_pinned: true }],
      error: null,
    });
    const notes = await fetchNotes();
    expect(notes).toEqual([
      {
        id: 'u1',
        title: 't',
        content: 'c',
        createdAt: 'c-time',
        updatedAt: 'u-time',
        tags: ['x'],
        isPinned: true,
        deletedAt: null,
      },
    ]);
  });

  it('[경계] fetchNotes — should 빈 배열을 반환한다 when data가 null이다', async () => {
    stubSupabase({ data: null, error: null });
    expect(await fetchNotes()).toEqual([]);
  });

  it("[예외] fetchNotes — should Error('Failed to fetch notes')를 throw한다 when supabase가 error를 반환한다", async () => {
    stubSupabase({ data: null, error: { message: 'boom' } });
    await expect(fetchNotes()).rejects.toThrow('Failed to fetch notes');
  });
});

describe('createNote', () => {
  it('[정상] createNote — should insert에 snake_case tags를 포함해 보낸다 when tags가 담긴 note를 받는다', async () => {
    const { from, builder } = stubSupabase({ data: rowFixture, error: null });
    await createNote({ title: 't', content: 'c', tags: ['react', 'vite'], isPinned: false });
    expect(from).toHaveBeenCalledWith('notes');
    expect((builder.insert as Mock).mock.calls[0][0]).toMatchObject({ tags: ['react', 'vite'] });
  });

  it('[정상] createNote — should DB가 부여한 id·tags를 가진 Note를 반환한다 when 요청이 성공한다', async () => {
    stubSupabase({ data: { ...rowFixture, id: 'server-id', tags: ['x'] }, error: null });
    const result = await createNote({ title: 't', content: 'c', tags: ['x'], isPinned: false });
    expect(result).toMatchObject({ id: 'server-id', tags: ['x'] });
  });

  it('[경계] createNote — should 빈 배열을 그대로 전송한다 when tags가 []다', async () => {
    const { builder } = stubSupabase({ data: rowFixture, error: null });
    await createNote({ title: 't', content: 'c', tags: [], isPinned: false });
    expect((builder.insert as Mock).mock.calls[0][0]).toHaveProperty('tags', []);
  });

  it("[예외] createNote — should Error('Failed to create note')를 throw한다 when error가 반환된다", async () => {
    stubSupabase({ data: null, error: { message: 'boom' } });
    await expect(
      createNote({ title: 't', content: 'c', tags: [], isPinned: false }),
    ).rejects.toThrow('Failed to create note');
  });
});

describe('updateNote', () => {
  it('[정상] updateNote — should update에 snake_case tags를 포함한다 when updates에 tags가 있다', async () => {
    const { builder } = stubSupabase({ data: rowFixture, error: null });
    await updateNote('1', { title: 't', content: 'c', tags: ['edited'] });
    expect((builder.update as Mock).mock.calls[0][0]).toMatchObject({ tags: ['edited'] });
    expect((builder.eq as Mock).mock.calls[0]).toEqual(['id', '1']);
  });

  it('[정상] updateNote — should deletedAt을 deleted_at으로 매핑해 보낸다 when 소프트 삭제 PATCH다', async () => {
    const { builder } = stubSupabase({ data: rowFixture, error: null });
    await updateNote('1', { deletedAt: '2026-01-01T00:00:00.000Z' });
    expect((builder.update as Mock).mock.calls[0][0]).toMatchObject({
      deleted_at: '2026-01-01T00:00:00.000Z',
    });
  });

  it("[예외] updateNote — should Error('Failed to update note')를 throw한다 when error가 반환된다", async () => {
    stubSupabase({ data: null, error: { message: 'boom' } });
    await expect(updateNote('1', { title: 't', content: 'c', tags: [] })).rejects.toThrow(
      'Failed to update note',
    );
  });
});

describe('deleteNote', () => {
  it('[정상] deleteNote — should id로 delete().eq()를 호출한다 when 유효한 id를 받는다', async () => {
    const { builder } = stubSupabase({ data: null, error: null });
    await deleteNote('abc');
    expect(builder.delete as Mock).toHaveBeenCalled();
    expect((builder.eq as Mock).mock.calls[0]).toEqual(['id', 'abc']);
  });

  it("[예외] deleteNote — should Error('Failed to delete note')를 throw한다 when error가 반환된다", async () => {
    stubSupabase({ data: null, error: { message: 'boom' } });
    await expect(deleteNote('abc')).rejects.toThrow('Failed to delete note');
  });
});
