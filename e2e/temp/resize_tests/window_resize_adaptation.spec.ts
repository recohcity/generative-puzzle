/**
 * 窗口大小变化适配系统 - E2E测试
 */

import { test, expect, Page } from '@playwright/test';

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page, initialWidth = 1366, initialHeight = 768) {
  await page.setViewportSize({ width: initialWidth, height: initialHeight });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas#puzzle-canvas');
}

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 辅助函数：获取游戏状态
async function getGameState(page: Page) {
  return page.evaluate(() => (window as any).__gameStateForTests__);
}

// 辅助函数：获取拼图块偏移信息
async function getPieceOffsets(page: Page) {
  return page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state.puzzle || !state.originalPositions) return [];
    
    return state.puzzle.map((piece: any, index: number) => {
      const target = state.originalPositions[index];
      return {
        index,
        currentX: piece.x,
        currentY: piece.y,
        targetX: target.x,
        targetY: target.y,
        offsetX: piece.x - target.x,
        offsetY: piece.y - target.y,
        offsetDistance: Math.sqrt(Math.pow(piece.x - target.x, 2) + Math.pow(piece.y - target.y, 2))
      };
    });
  });
}

test('窗口大小变化适配系统 - 基本功能测试', async ({ page }) => {
  // 1. 导航到页面
  await gotoAndEnsureCanvas(page);
  await waitForTip(page, '请点击生成你喜欢的形状');
  
  // 2. 生成形状
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');
  
  // 3. 生成拼图
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');
  
  // 4. 散开拼图
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  // 等待拼图散开
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state && state.isScattered === true;
  });
  
  // 5. 记录窗口调整前的状态
  const beforeResizeState = await getGameState(page);
  const beforeResizeOffsets = await getPieceOffsets(page);
  const beforeResizeAvgOffset = beforeResizeOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / beforeResizeOffsets.length;
  
  // 保存窗口调整前的截图
  await page.screenshot({ path: 'before-resize-adaptation.png' });
  
  // 6. 改变浏览器窗口大小
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(1000); // 等待调整完成和可能的重绘
  
  // 保存窗口调整后的截图
  await page.screenshot({ path: 'after-resize-adaptation.png' });
  
  // 7. 记录窗口调整后的状态
  const afterResizeState = await getGameState(page);
  const afterResizeOffsets = await getPieceOffsets(page);
  const afterResizeAvgOffset = afterResizeOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / afterResizeOffsets.length;
  
  // 8. 验证适配结果
  
  // 验证拼图块数量没有变化
  expect(afterResizeState.puzzle.length).toBe(beforeResizeState.puzzle.length);
  
  // 验证平均偏移没有显著增加（允许5%的误差）
  const offsetRatio = afterResizeAvgOffset / beforeResizeAvgOffset;
  expect(offsetRatio).toBeLessThan(1.05);
  
  // 验证第一个拼图块的偏移变化不大
  const firstPieceBeforeOffset = beforeResizeOffsets[0];
  const firstPieceAfterOffset = afterResizeOffsets[0];
  
  const offsetXChange = Math.abs(firstPieceAfterOffset.offsetX - firstPieceBeforeOffset.offsetX);
  const offsetYChange = Math.abs(firstPieceAfterOffset.offsetY - firstPieceBeforeOffset.offsetY);
  
  // 允许一定的误差（10像素）
  expect(offsetXChange).toBeLessThan(10);
  expect(offsetYChange).toBeLessThan(10);
  
  // 9. 验证拼图仍然可以交互
  
  // 选择第一个拼图块
  await page.evaluate((index) => (window as any).selectPieceForTest(index), 0);
  
  // 验证选择成功
  const selectedPiece = await page.evaluate(() => (window as any).__gameStateForTests__.selectedPiece);
  expect(selectedPiece).toBe(0);
  
  // 10. 完成拼图
  for (let i = 0; i < beforeResizeState.puzzle.length; i++) {
    await page.evaluate((idx) => {
      (window as any).selectPieceForTest(idx);
      (window as any).resetPiecePositionForTest(idx);
      (window as any).markPieceAsCompletedForTest(idx);
    }, i);
  }
  
  // 验证游戏完成
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state.isCompleted === true;
  });
  
  const finalState = await getGameState(page);
  expect(finalState.isCompleted).toBe(true);
  expect(finalState.completedPieces.length).toBe(finalState.puzzle.length);
});

test('窗口大小变化适配系统 - 多次调整测试', async ({ page }) => {
  // 1. 导航到页面
  await gotoAndEnsureCanvas(page);
  await waitForTip(page, '请点击生成你喜欢的形状');
  
  // 2. 生成形状
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');
  
  // 3. 生成拼图
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');
  
  // 4. 散开拼图
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  // 等待拼图散开
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state && state.isScattered === true;
  });
  
  // 5. 记录初始状态
  const initialState = await getGameState(page);
  const initialOffsets = await getPieceOffsets(page);
  const initialAvgOffset = initialOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / initialOffsets.length;
  
  // 6. 第一次调整窗口大小
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(1000);
  
  // 7. 记录第一次调整后的状态
  const firstResizeState = await getGameState(page);
  const firstResizeOffsets = await getPieceOffsets(page);
  const firstResizeAvgOffset = firstResizeOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / firstResizeOffsets.length;
  
  // 8. 第二次调整窗口大小
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(1000);
  
  // 9. 记录第二次调整后的状态
  const secondResizeState = await getGameState(page);
  const secondResizeOffsets = await getPieceOffsets(page);
  const secondResizeAvgOffset = secondResizeOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / secondResizeOffsets.length;
  
  // 10. 第三次调整窗口大小（回到原始大小）
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(1000);
  
  // 11. 记录第三次调整后的状态
  const thirdResizeState = await getGameState(page);
  const thirdResizeOffsets = await getPieceOffsets(page);
  const thirdResizeAvgOffset = thirdResizeOffsets.reduce((sum, offset) => sum + offset.offsetDistance, 0) / thirdResizeOffsets.length;
  
  // 12. 验证多次调整后的结果
  
  // 验证拼图块数量没有变化
  expect(thirdResizeState.puzzle.length).toBe(initialState.puzzle.length);
  
  // 验证平均偏移没有显著增加（允许10%的误差）
  const finalOffsetRatio = thirdResizeAvgOffset / initialAvgOffset;
  expect(finalOffsetRatio).toBeLessThan(1.1);
  
  // 13. 验证拼图仍然可以交互和完成
  for (let i = 0; i < initialState.puzzle.length; i++) {
    await page.evaluate((idx) => {
      (window as any).selectPieceForTest(idx);
      (window as any).resetPiecePositionForTest(idx);
      (window as any).markPieceAsCompletedForTest(idx);
    }, i);
  }
  
  // 验证游戏完成
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state.isCompleted === true;
  });
  
  const finalState = await getGameState(page);
  expect(finalState.isCompleted).toBe(true);
});