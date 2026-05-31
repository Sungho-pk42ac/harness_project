import type { Mock } from 'vitest';
import { login, logout, getSessionUser, signUp } from './auth';
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

describe('signUp (api/auth)', () => {
  it('[정상] signUp — should User를 반환한다 when 가입이 성공한다', async () => {
    stubAuth({
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'n1', email: 'new@new.com' } }, error: null }),
    });
    expect(await signUp('new@new.com', 'pw1234')).toEqual({ id: 'n1', email: 'new@new.com' });
  });

  it('[예외] signUp — should error.message를 throw한다 when 가입이 실패한다', async () => {
    stubAuth({
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } }),
    });
    await expect(signUp('dup@dup.com', 'pw')).rejects.toThrow('User already registered');
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
