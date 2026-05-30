import { test, expect } from '@playwright/test';

/**
 * 노트 태그 기능 E2E — 출처: docs/features/tag/PRD.md
 * 각 테스트는 PRD의 유스케이스(U)·기능요구사항(FR)으로 추적된다.
 * 현재 구현: TAG-1(happy-path)만 GREEN. FR-2/3/4/5/6/7은 미구현 → fixme(담당 이슈 표기).
 * db.e2e.json은 실행마다 새로 시드되므로 테스트는 고유 제목으로 자기 데이터를 만든다.
 */

// 테스트 간 충돌을 막는 고유 제목 (실행마다 db 초기화 + 직렬 실행)
const uniqueTitle = (prefix: string) => `${prefix}-${Date.now()}`;

test.describe('노트 태그 (PRD tag)', () => {
  test('[J1] 새 노트에 태그를 달고 저장하면 다시 열었을 때 태그가 보인다 (U1, FR-1·8·9)', async ({
    page,
  }) => {
    const title = uniqueTitle('J1');
    await page.goto('/');
    await page.getByRole('button', { name: '+ 새 노트' }).click();

    await page.getByPlaceholder('제목').fill(title);
    const tagInput = page.getByPlaceholder('태그 입력');
    await tagInput.fill('회의');
    await tagInput.press('Enter');

    // 칩으로 추가된다 (FR-1)
    await expect(page.getByText('회의', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '저장' }).click();

    // 목록에서 방금 만든 노트를 다시 연다
    await page.getByText(title, { exact: true }).click();

    // 편집 화면에 태그 칩이 영속되어 다시 보인다 (FR-8·9)
    await expect(page.getByText('회의', { exact: true })).toBeVisible();
  });

  test('[J2] 쉼표(,)로도 태그가 칩으로 추가된다 (U1, FR-1)', async ({ page }) => {
    const title = uniqueTitle('J2');
    await page.goto('/');
    await page.getByRole('button', { name: '+ 새 노트' }).click();

    await page.getByPlaceholder('제목').fill(title);
    const tagInput = page.getByPlaceholder('태그 입력');
    await tagInput.fill('아이디어');
    await tagInput.press(',');

    // 칩 텍스트에 쉼표가 섞이지 않고 깔끔히 추가되고, 입력칸은 비워진다
    await expect(page.getByText('아이디어', { exact: true })).toBeVisible();
    await expect(tagInput).toHaveValue('');
  });

  // ── 아래는 PRD가 약속하지만 아직 미구현 → 담당 이슈에서 GREEN 되면 fixme를 해제 ──

  test.fixme('[J3] 목록에서 각 노트의 태그를 칩으로 확인한다 (U3, FR-7) — TAG-4 미구현 (NoteItem이 tags 미렌더)', async () => {});

  test.fixme('[J4] 기존 노트의 태그 칩을 ×로 개별 삭제한다 (U2, FR-2) — TAG-2 미구현 (칩에 삭제 버튼 없음)', async () => {});

  test.fixme('[J5] 태그가 정규화·중복방지·개수제한(최대 5)된다 (FR-3·4·5·6) — TAG-3 미구현', async () => {});
});
