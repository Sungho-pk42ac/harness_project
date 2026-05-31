import { getSupabase } from './supabaseClient';
import { User } from '../types/user';

/** Supabase 세션 user → 앱 User 매핑(비밀번호 등 제외). */
function toUser(u: { id: string; email?: string }): User {
  return { id: u.id, email: u.email ?? '' };
}

/**
 * 로그인 — Supabase Auth `signInWithPassword`. 실패 시 'Invalid credentials'를 throw
 * (LoginPage가 이 메시지를 한국어 인라인 에러로 매핑하므로 문구를 유지한다).
 */
export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error('Invalid credentials');
  }
  return toUser(data.user);
}

/** 로그아웃 — Supabase 세션 종료. */
export async function logout(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error('Failed to logout');
}

/** 현재 세션의 user(없으면 null). 앱 시작 시 세션 복원에 사용. */
export async function getSessionUser(): Promise<User | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user ? toUser(data.session.user) : null;
}

/** 인증 상태 변화 구독. 변경 시 user(또는 null)를 콜백. 해제 함수를 반환한다. */
export function onAuthChange(cb: (user: User | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    cb(session?.user ? toUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
