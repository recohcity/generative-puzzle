import { test, expect } from '@playwright/test';

test.describe('production guard checks', () => {
  test('F10/localStorage cannot expose debug panel or test APIs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 尝试通过 localStorage 强行开启调试
    await page.evaluate(() => {
      localStorage.setItem('debug-mode-enabled', 'true');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 尝试按 F10 开启调试
    await page.keyboard.press('F10');
    await page.waitForTimeout(300);

    // 调试按钮在生产模式不可见
    await expect(page.getByRole('button', { name: 'Auto Complete' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Force Complete' })).toHaveCount(0);

    // 生产模式不应暴露测试全局对象
    const hasTestGlobals = await page.evaluate(() => {
      const w = window as any;
      return {
        testAPI: typeof w.testAPI !== 'undefined',
        gameStateForTests: typeof w.__gameStateForTests__ !== 'undefined',
        forTestFns:
          typeof w.selectPieceForTest !== 'undefined' ||
          typeof w.markPieceAsCompletedForTest !== 'undefined' ||
          typeof w.rotatePieceForTest !== 'undefined' ||
          typeof w.resetPiecePositionForTest !== 'undefined',
      };
    });

    expect(hasTestGlobals.testAPI).toBe(false);
    expect(hasTestGlobals.gameStateForTests).toBe(false);
    expect(hasTestGlobals.forTestFns).toBe(false);
  });
});
