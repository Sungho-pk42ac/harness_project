import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import * as api from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 Supabase 세션 복원 + 상태 변화 구독(supabase-js가 토큰을 persist).
  // localStorage 수동 관리는 제거 — 세션의 단일 출처는 supabase-js.
  useEffect(() => {
    api
      .getSessionUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const unsubscribe = api.onAuthChange(setUser);
    return unsubscribe;
  }, []);

  // 로그인 — 성공 시 user 설정(실패는 호출부로 전파). 세션 저장은 supabase-js가 담당.
  const login = async (email: string, password: string) => {
    const loggedIn = await api.login(email, password);
    setUser(loggedIn);
  };

  // 회원가입 — 성공 시 user 설정(확인 off면 즉시 로그인). 실패는 호출부로 전파.
  const signup = async (email: string, password: string) => {
    const created = await api.signUp(email, password);
    setUser(created);
  };

  // 로그아웃 — Supabase 세션 종료 + 메모리 상태 해제(onAuthChange도 null로 동기화).
  const logout = () => {
    void api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
