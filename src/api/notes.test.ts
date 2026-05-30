import { createNote, updateNote } from './notes';

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
