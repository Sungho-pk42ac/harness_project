// 인증 사용자 타입 (spec-fixed §1) — 비밀번호는 클라이언트 타입에서 제외
export interface User {
  id: string;
  email: string;
}
