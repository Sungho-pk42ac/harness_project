// E2E 시드 — Supabase Auth에 데모 계정을 만든다(service_role admin API, RLS 우회).
// 로그인 게이트(LOGIN-1~5) 통과용 시드 계정: test@test.com / 1234 (email_confirm로 즉시 로그인 가능).
// 노트는 각 테스트가 로그인 후 고유 제목으로 직접 만든다(별도 시드 불필요).
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('[e2e] SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다(로컬 Supabase status에서 주입).');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await admin.auth.admin.createUser({
  email: 'test@test.com',
  password: '1234',
  email_confirm: true,
});

// 이미 존재하면(재실행) 무시, 그 외 오류는 실패 처리.
if (error && !/already|exists|registered/i.test(error.message)) {
  console.error('[e2e] 데모 계정 생성 실패:', error.message);
  process.exit(1);
}

console.log('[e2e] 데모 계정 준비 완료 (test@test.com)');
