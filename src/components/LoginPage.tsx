import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 폼 제출 시 로그인 시도 — 실패 시 인라인 에러 표시(alert 미사용), 재시도 시 초기화
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      // 자격증명 불일치와 네트워크/기타 오류를 구분해 친화적 메시지 노출
      const message =
        err instanceof Error && err.message === 'Invalid credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-3xl px-8 py-10 shadow-md border border-border w-full max-w-sm space-y-5"
      >
        <h1 className="text-xl font-bold text-foreground text-center">로그인</h1>
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
          로그인
        </button>
      </form>
    </div>
  );
}
