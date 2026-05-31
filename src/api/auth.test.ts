import type { Mock } from 'vitest';
import { login, logout, getSessionUser } from './auth';
import { getSupabase } from './supabaseClient';

vi.mock('./supabaseClient', () => ({ getSupabase: vi.fn() }));

/** getSupabase().auth를 주어진 구현으로 모킹한다. */
function stubAuth(auth: Record<string, unknown>) {
  (getSupabase as Mock).mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabase>);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('login (api/auth)', () => {
  it('[정상] login — should {id,email} User를 반환한다 when signInWithPassword가 성공한다', async () => {
    stubAuth({
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }),
    });
    expect(await login('test@test.com', '1234')).toEqual({ id: 'u1', email: 'test@test.com' });
  });

  it('[예외] login — should Invalid credentials를 throw한다 when error가 반환된다', async () => {
    stubAuth({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      }),
    });
    await expect(login('no@no.com', 'x')).rejects.toThrow('Invalid credentials');
  });
});

describe('logout (api/auth)', () => {
  it('[정상] logout — should signOut를 호출한다 when 호출된다', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    stubAuth({ signOut });
    await logout();
    expect(signOut).toHaveBeenCalled();
  });
});

describe('getSessionUser (api/auth)', () => {
  it('[정상] getSessionUser — should 세션 user를 반환한다 when 세션이 있다', async () => {
    stubAuth({
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'a@a.com' } } } }),
    });
    expect(await getSessionUser()).toEqual({ id: 'u1', email: 'a@a.com' });
  });

  it('[경계] getSessionUser — should null을 반환한다 when 세션이 없다', async () => {
    stubAuth({ getSession: vi.fn().mockResolvedValue({ data: { session: null } }) });
    expect(await getSessionUser()).toBeNull();
  });
});
