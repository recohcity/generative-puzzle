/**
 * Step3 直接测试 - 直接调用generatePuzzle函数
 */

import { test, expect, Page } from '@playwright/test';
test.setTimeout(60000);

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

test.describe('Step3: 直接测试', () => {
  test('直接调用generatePuzzle函数测试', async ({ page }) => {
    console.log('🔍 直接测试: 调用generatePuzzle函数');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('🔍 浏览器控制台:', text);
    });
    
    // 1. 生成形状
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('直线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '1' }).click();
    
    // 2. 在点击切割形状按钮之前检查状态
    const beforeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape && state.originalShape.length > 0,
        cutType: state.cutType,
        cutCount: state.cutCount,
        hasBasePuzzle: !!state.basePuzzle,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    
    console.log('📊 点击切割按钮前状态:', beforeState);
    
    // 3. 点击切割形状按钮
    console.log('🔄 点击切割形状按钮...');
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    
    // 4. 等待拼图生成完成
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 5. 检查生成后的状态
    const afterState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered
      };
    });
    
    console.log('📊 点击切割按钮后状态:', afterState);
    
    // 6. 手动调用testAPI.generatePuzzle来测试
    console.log('🔄 手动调用testAPI.generatePuzzle...');
    const manualCallResult = await page.evaluate(() => {
      try {
        // 调用testAPI.generatePuzzle
        (window as any).testAPI.generatePuzzle(1);
        
        // 等待一下让dispatch完成
        return new Promise(resolve => {
          setTimeout(() => {
            const state = (window as any).__gameStateForTests__;
            resolve({
              success: true,
              hasBasePuzzle: !!state.basePuzzle,
              basePuzzleLength: state.basePuzzle?.length || 0,
              puzzleLength: state.puzzle?.length || 0
            });
          }, 100);
        });
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📊 手动调用结果:', manualCallResult);
    
    // 7. 检查所有相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('generatePuzzle') || 
      log.includes('SET_PUZZLE') || 
      log.includes('SET_BASE_PUZZLE') ||
      log.includes('拼图生成')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('  ', log));
    
    // 验证结果
    expect(afterState.puzzleLength).toBeGreaterThan(0);
  });
});