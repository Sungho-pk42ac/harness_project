// E2E 전용 격리 DB(db.e2e.json)를 매 실행마다 새로 시드한다.
// 개발용 db.json은 절대 건드리지 않는다(테스트 데이터 오염 방지).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 노트는 더 이상 json-server가 아니라 Supabase(supabase/seed.sql)가 시드한다.
// json-server는 인증(/users)만 담당한다(인증 이전은 다음 런 supabase-auth-rls).
const seed = {
  // 로그인 게이트(LOGIN-1~5) 통과용 시드 계정 — spec-fixed §1 규약(test@test.com / 1234)
  users: [
    {
      id: 'u1',
      email: 'test@test.com',
      password: '1234',
    },
  ],
  // /notes 형태 유지용(앱은 사용 안 함 — 노트는 Supabase에서 읽고 쓴다)
  notes: [],
};

writeFileSync(resolve(root, 'db.e2e.json'), JSON.stringify(seed, null, 2));
console.log('[e2e] db.e2e.json seeded (users only; notes는 Supabase)');
