import { User } from '../types/user';

const API_URL = 'http://localhost:3001';

/**
 * 로그인 — JSON Server users 컬렉션을 이메일로 조회한 뒤 비밀번호를 대조한다 (spec-fixed §2).
 * 비밀번호 대조를 클라이언트에서 하는 이유: json-server 1.x는 숫자형 쿼리값(예: password=1234)을
 * 숫자로 강제 변환해 문자열 "1234"와 불일치시키므로 `?email=&password=` 결합 쿼리가 빈 배열을
 * 반환한다. 이메일로만 조회 후 password를 직접 비교하면 이 거동과 무관하게 검증이 동작한다.
 * @param email 이메일
 * @param password 비밀번호(평문, 실습용)
 */
export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Failed to login');
  const users: Array<{ id: string; email: string; password?: string }> = await res.json();
  const matched = Array.isArray(users) ? users.find((u) => u.password === password) : undefined;
  if (!matched) {
    throw new Error('Invalid credentials');
  }
  // 비밀번호를 제외한 형태로 반환
  const { id, email: userEmail } = matched;
  return { id, email: userEmail };
}
