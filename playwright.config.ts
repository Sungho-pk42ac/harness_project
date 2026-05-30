import { defineConfig, devices } from '@playwright/test';

/**
 * E2E는 격리된 db.e2e.json을 쓰는 dev:e2e 서버(vite 5173 + json-server 3001)에 대고 실행한다.
 * 개발용 db.json/dev 서버와 분리되며, db.e2e.json은 매 실행 전 seed.mjs로 새로 초기화된다.
 */
export default defineConfig({
  testDir: './e2e',
  // 단일 json-server(공유 DB)를 쓰므로 테스트는 직렬 실행해 간섭을 막는다
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
