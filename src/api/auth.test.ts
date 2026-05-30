import { login } from './auth';

describe('login (api/auth)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('[정상] login — should 비밀번호를 제외한 user를 반환한다 when users 조회가 1건을 반환한다', async () => {
    // Arrange: 서버가 비밀번호 포함 사용자를 1건 반환
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'u1', email: 'test@test.com', password: '1234' }],
      }),
    );
    // Act
    const user = await login('test@test.com', '1234');
    // Assert: 비밀번호가 제외된 {id,email}만 반환
    expect(user).toEqual({ id: 'u1', email: 'test@test.com' });
  });

  it('[예외] login — should Invalid credentials를 throw한다 when users 조회가 빈 배열을 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    await expect(login('no@no.com', 'x')).rejects.toThrow('Invalid credentials');
  });

  it("[예외] login — should Error('Failed to login')을 throw한다 when 응답이 ok가 아니다", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(login('a@a.com', 'x')).rejects.toThrow('Failed to login');
  });
});
