import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import * as api from '../api/auth';

// localStorage 세션 키 (ADR-0002)
const STORAGE_KEY = 'auth.user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 localStorage에서 세션 복원 — 끝나면 loading 해제(복원 중 깜빡임 방지)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        // 손상된 값은 제거
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // 로그인 — 성공 시 user 설정 + 비번 제외 user를 localStorage에 저장(실패는 호출부로 전파)
  const login = async (email: string, password: string) => {
    const loggedIn = await api.login(email, password);
    setUser(loggedIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
  };

  // 로그아웃 — 메모리 상태 해제 + localStorage 세션 제거(자동 재로그인 방지)
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
