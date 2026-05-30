import { User } from '../types/user';

const API_URL = 'http://localhost:3001';

/**
 * 로그인 — JSON Server users 컬렉션을 쿼리해 검증한다 (spec-fixed §2).
 * 결과 1건 이상이면 첫 사용자(비밀번호 제외)를 반환, 0건이면 실패.
 * @param email 이메일
 * @param password 비밀번호(평문, 실습용)
 */
export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(
    `${API_URL}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  );
  if (!res.ok) throw new Error('Failed to login');
  const users: Array<{ id: string; email: string }> = await res.json();
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Invalid credentials');
  }
  // 비밀번호를 제외한 형태로 반환
  const { id, email: userEmail } = users[0];
  return { id, email: userEmail };
}
