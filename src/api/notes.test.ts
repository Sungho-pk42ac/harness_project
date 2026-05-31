import type { Mock } from 'vitest';
import { createNote, updateNote, fetchNotes } from './notes';
import { getSupabase } from './supabaseClient';

// fetchNotes는 Supabase 경계(getSupabase)만 모킹한다(SUPA-2). create/update는 아직 fetch 기반.
vi.mock('./supabaseClient', () => ({ getSupabase: vi.fn() }));

/**
 * getSupabase().from('notes').select('*')가 주어진 결과를 resolve하도록 모킹한다.
 * @param result PostgREST 응답을 흉내낸 { data, error }
 */
function stubSupabaseSelect(result: { data: unknown; error: unknown }) {
  const select = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => ({ select }));
  (getSupabase as Mock).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>);
  return { from, select };
}

// 네트워크 경계인 fetch를 모킹한다. 응답은 { ok, json } 형태로 흉내낸다.
/**
 * 성공 응답을 돌려주는 fetch 모킹을 설치하고 mock을 반환한다.
 * @param responseBody json()이 resolve할 본문
 */
function stubFetchOk(responseBody: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => responseBody,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** 마지막 fetch 호출의 body를 JSON으로 파싱해 반환한다(없으면 {}). */
function lastRequestBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const calls = fetchMock.mock.calls;
  const init = calls.length ? (calls[calls.length - 1][1] as RequestInit | undefined) : undefined;
  return init?.body ? JSON.parse(init.body as string) : {};
}

describe('fetchNotes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('[정상] fetchNotes — should snake_case row를 camelCase Note[]로 매핑해 반환한다 when supabase가 데이터를 반환한다', async () => {
    // Arrange: snake_case row 한 건
    stubSupabaseSelect({
      data: [
        {
          id: 'u1',
          title: 't',
          content: 'c',
          created_at: 'c-time',
          updated_at: 'u-time',
          tags: ['x'],
          is_pinned: true,
          deleted_at: null,
        },
      ],
      error: null,
    });
    // Act
    const notes = await fetchNotes();
    // Assert: camelCase Note로 매핑
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
    stubSupabaseSelect({ data: null, error: null });
    expect(await fetchNotes()).toEqual([]);
  });

  it("[예외] fetchNotes — should Error('Failed to fetch notes')를 throw한다 when supabase가 error를 반환한다", async () => {
    stubSupabaseSelect({ data: null, error: { message: 'boom' } });
    await expect(fetchNotes()).rejects.toThrow('Failed to fetch notes');
  });
});

describe('createNote', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('[정상] createNote — should POST 요청 body에 tags를 포함해 보낸다 when tags가 담긴 note 객체를 받는다', async () => {
    // Arrange
    const fetchMock = stubFetchOk({ id: '1' });
    // Act
    await createNote({ title: 't', content: 'c', tags: ['react', 'vite'], isPinned: false });
    // Assert
    expect(lastRequestBody(fetchMock)).toMatchObject({ tags: ['react', 'vite'] });
  });

  it('[정상] createNote — should 서버가 부여한 id와 tags를 가진 Note를 반환한다 when 요청이 성공한다', async () => {
    // Arrange: 서버가 id와 tags를 부여한 Note를 응답으로 준다
    stubFetchOk({
      id: 'server-id',
      title: 't',
      content: 'c',
      tags: ['x'],
      createdAt: 'now',
      updatedAt: 'now',
    });
    // Act
    const result = await createNote({ title: 't', content: 'c', tags: ['x'], isPinned: false });
    // Assert
    expect(result).toMatchObject({ id: 'server-id', tags: ['x'] });
  });

  it('[경계] createNote — should 빈 배열을 그대로 전송한다 when tags가 []다', async () => {
    // Arrange
    const fetchMock = stubFetchOk({ id: '1' });
    // Act
    await createNote({ title: 't', content: 'c', tags: [], isPinned: false });
    // Assert: body.tags가 빈 배열로 그대로 전송되어야 한다
    expect(lastRequestBody(fetchMock)).toHaveProperty('tags', []);
  });

  it("[예외] createNote — should Error('Failed to create note')를 throw한다 when res.ok가 false다", async () => {
    // Arrange: 실패 응답을 주도록 fetch 모킹
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    // Act & Assert
    await expect(
      createNote({ title: 't', content: 'c', tags: [], isPinned: false }),
    ).rejects.toThrow('Failed to create note');
  });
});

describe('updateNote', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('[정상] updateNote — should PATCH 요청 body에 tags를 포함한다 when updates에 tags가 있다', async () => {
    // Arrange
    const fetchMock = stubFetchOk({ id: '1' });
    // Act
    await updateNote('1', { title: 't', content: 'c', tags: ['edited'] });
    // Assert
    expect(lastRequestBody(fetchMock)).toMatchObject({ tags: ['edited'] });
  });

  it("[예외] updateNote — should Error('Failed to update note')를 throw한다 when res.ok가 false다", async () => {
    // Arrange: 실패 응답을 주도록 fetch 모킹
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    // Act & Assert
    await expect(updateNote('1', { title: 't', content: 'c', tags: [] })).rejects.toThrow(
      'Failed to update note',
    );
  });
});
