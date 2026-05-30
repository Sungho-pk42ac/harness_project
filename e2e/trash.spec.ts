import { test, expect, Page } from '@playwright/test';

/**
 * 휴지통(소프트 삭제·복원·영구삭제) E2E — 출처: docs/features/trash/spec-fixed.md
 * 실제 json-server에 대한 소프트 삭제(PATCH deletedAt)·복원(PATCH null)·영구삭제(DELETE)를 검증한다.
 */

const uniqueTitle = (prefix: string) => `${prefix}-${Date.now()}`;

async function loginAndOpenNotes(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('이메일').fill('test@test.com');
  await page.getByPlaceholder('비밀번호').fill('1234');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByRole('button', { name: '+ 새 노트' })).toBeVisible();
}

async function createNote(page: Page, title: string) {
  await page.getByRole('button', { name: '+ 새 노트' }).click();
  await page.getByPlaceholder('제목').fill(title);
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test.describe('휴지통 (PRD trash)', () => {
  test('[J1] 삭제하면 휴지통에서 보이고, 복원하면 목록으로 돌아온다', async ({ page }) => {
    const title = uniqueTitle('T1');
    await loginAndOpenNotes(page);
    await createNote(page, title);

    // 목록 카드의 "삭제" 클릭 → 활성 목록에서 사라진다(소프트 삭제)
    const card = page.locator('div.bg-card').filter({ hasText: title });
    await card.getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    // 휴지통 진입 → 삭제된 노트가 보인다
    await page.getByRole('button', { name: '휴지통' }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    // 복원 → 노트로 돌아가면 다시 보인다
    await page.getByRole('button', { name: '복원' }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '노트로 돌아가기' }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  test('[J2] 휴지통에서 영구 삭제하면 완전히 사라진다', async ({ page }) => {
    const title = uniqueTitle('T2');
    await loginAndOpenNotes(page);
    await createNote(page, title);

    const card = page.locator('div.bg-card').filter({ hasText: title });
    await card.getByRole('button', { name: '삭제' }).click();
    await page.getByRole('button', { name: '휴지통' }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    // 영구 삭제 confirm 수락 → 휴지통에서도 사라진다
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '영구 삭제' }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });
});
