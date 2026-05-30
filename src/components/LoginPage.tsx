import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 폼 제출 시 로그인 시도 (실패 인라인 에러 표시는 LOGIN-4 소관)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // 실패해도 화면 전환 없이 머문다 (에러 메시지는 LOGIN-4)
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
        <button
          type="submit"
          className="w-full bg-foreground text-card px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
