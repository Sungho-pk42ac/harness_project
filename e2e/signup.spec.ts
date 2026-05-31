import { test, expect } from '@playwright/test';

/**
 * 회원가입 E2E — 출처: docs/features/auth-signup/spec-fixed.md
 * 로컬 Supabase는 이메일 확인이 꺼져 있어(config.toml [auth.email].enable_confirmations=false)
 * 가입 즉시 세션이 생겨 노트 화면으로 진입한다. 매 실행 고유 이메일을 써 충돌을 피한다.
 */
test('[J1] 새 계정으로 회원가입하면 노트 화면으로 진입한다', async ({ page }) => {
  await page.goto('/');
  // 기본은 로그인 모드 → 회원가입 모드로 전환
  await page.getByRole('button', { name: '계정이 없으신가요? 회원가입' }).click();

  const email = `e2e-${Date.now()}@example.com`;
  await page.getByPlaceholder('이메일').fill(email);
  await page.getByPlaceholder('비밀번호').fill('pw123456');
  await page.getByRole('button', { name: '회원가입' }).click();

  // 가입 즉시 로그인되어 노트 화면(+ 새 노트)이 보인다
  await expect(page.getByRole('button', { name: '+ 새 노트' })).toBeVisible();
});
