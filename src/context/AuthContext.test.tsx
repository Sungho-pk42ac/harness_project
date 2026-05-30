import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('[정상] AuthContext — should localStorage의 user를 복원한다 when AuthProvider가 초기화된다', async () => {
    // Arrange: 이전 세션이 localStorage에 있다
    localStorage.setItem('auth.user', JSON.stringify({ id: 'u1', email: 'test@test.com' }));
    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Assert: 복원 완료 후 user가 채워진다
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ id: 'u1', email: 'test@test.com' });
  });

  it('[정상] AuthContext — should user를 null로 만들고 localStorage에서 제거한다 when logout을 호출한다', async () => {
    localStorage.setItem('auth.user', JSON.stringify({ id: 'u1', email: 'test@test.com' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    // Act
    act(() => {
      result.current.logout();
    });
    // Assert
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('auth.user')).toBeNull();
  });
});
