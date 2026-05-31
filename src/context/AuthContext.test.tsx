import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '../api/auth';

// 세션의 단일 출처는 supabase(api/auth). localStorage 대신 api 경계를 모킹한다.
vi.mock('../api/auth');

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.onAuthChange).mockReturnValue(() => {});
  });

  it('[정상] AuthContext — should Supabase 세션 user를 복원한다 when 세션이 있다', async () => {
    // Arrange: 기존 세션을 supabase가 반환
    vi.mocked(api.getSessionUser).mockResolvedValue({ id: 'u1', email: 'test@test.com' });
    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ id: 'u1', email: 'test@test.com' });
  });

  it('[정상] AuthContext — should signOut 호출 + user를 null로 만든다 when logout을 호출한다', async () => {
    vi.mocked(api.getSessionUser).mockResolvedValue({ id: 'u1', email: 'test@test.com' });
    vi.mocked(api.logout).mockResolvedValue();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    // Act
    act(() => {
      result.current.logout();
    });
    // Assert
    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
