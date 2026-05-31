import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';

export function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login'); // 기본 로그인 모드(E2E DOM 계약 보존)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 폼 제출 — 모드에 따라 로그인/회원가입. 실패 시 인라인 에러(alert 미사용), 재시도 시 초기화.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(messageFor(mode, err));
    }
  };

  // 모드 전환 시 에러 초기화
  const toggleMode = () => {
    setError('');
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
  };

  const isLogin = mode === 'login';
  const submitLabel = isLogin ? '로그인' : '회원가입';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-3xl px-8 py-10 shadow-md border border-border w-full max-w-sm space-y-5"
      >
        <h1 className="text-xl font-bold text-foreground text-center">{submitLabel}</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full text-sm text-foreground bg-muted rounded-xl px-4 py-2.5 border border-border outline-none placeholder:text-muted-foreground/60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full text-sm text-foreground bg-muted rounded-xl px-4 py-2.5 border border-border outline-none placeholder:text-muted-foreground/60"
        />
        {/* 인라인 에러 메시지 (alert 미사용, text-destructive 토큰) */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
        >
          {submitLabel}
        </button>
        {/* 로그인 ↔ 회원가입 전환 */}
        <button
          type="button"
          onClick={toggleMode}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </form>
    </div>
  );
}

/** 모드별 사용자 친화 에러 메시지 매핑. */
function messageFor(mode: AuthMode, err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  if (mode === 'login') {
    return raw === 'Invalid credentials'
      ? '이메일 또는 비밀번호가 올바르지 않습니다.'
      : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  // signup
  if (/already registered|already exists|user already/i.test(raw)) {
    return '이미 가입된 이메일입니다.';
  }
  if (/password/i.test(raw)) {
    return '비밀번호가 조건을 만족하지 않습니다(최소 6자 이상).';
  }
  return '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
}
