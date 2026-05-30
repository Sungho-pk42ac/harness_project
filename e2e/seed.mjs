// E2E 전용 격리 DB(db.e2e.json)를 매 실행마다 새로 시드한다.
// 개발용 db.json은 절대 건드리지 않는다(테스트 데이터 오염 방지).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const seed = {
  // 로그인 게이트(LOGIN-1~5) 통과용 시드 계정 — spec-fixed §1 규약(test@test.com / 1234)
  users: [
    {
      id: 'u1',
      email: 'test@test.com',
      password: '1234',
    },
  ],
  notes: [
    // tags 필드가 없는 구버전 노트 — 호환성(ADR-0001, note.tags ?? []) 확인용 시드
    {
      id: 'seed-legacy',
      title: '구버전 노트',
      content: '태그 필드가 없던 시절의 노트',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

writeFileSync(resolve(root, 'db.e2e.json'), JSON.stringify(seed, null, 2));
console.log('[e2e] db.e2e.json seeded');
