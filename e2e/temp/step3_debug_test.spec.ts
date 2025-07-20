/**
 * Step3 调试测试 - 检查修复代码是否被正确调用
 */

import { test, expect, Page } from '@playwright/test';
test.setTimeout(60000);

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

test.describe('Step3: 调试测试', () => {
  test('检查拼图块适配调试信息', async ({ page }) => {
    console.log('🔍 调试测试: 检查拼图块适配调试信息');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('拼图') || text.includes('generatePuzzle') || text.includes('SET_PUZZLE') || text.includes('SET_BASE_PUZZLE')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    // 1. 生成拼图
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('直线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 2. 检查初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered,
        baseCanvasSize: state.baseCanvasSize,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    
    console.log('📊 初始状态检查:', initialState);
    
    expect(initialState.puzzleLength).toBeGreaterThan(0);
    expect(initialState.isScattered).toBe(false);
    
    // 3. 第一次窗口调整
    console.log('🔄 第一次窗口调整...');
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(2000); // 等待适配完成
    
    // 4. 第二次窗口调整
    console.log('🔄 第二次窗口调整...');
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(2000); // 等待适配完成
    
    // 5. 检查调试日志
    const debugLogs = consoleLogs.filter(log => 
      log.includes('拼图') || 
      log.includes('generatePuzzle') ||
      log.includes('SET_PUZZLE') ||
      log.includes('SET_BASE_PUZZLE')
    );
    
    console.log('🔍 相关调试日志:');
    debugLogs.forEach(log => console.log('  ', log));
    
    // 6. 检查最终状态
    const finalState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      
      // 手动触发generatePuzzle来测试
      console.log('🔍 手动测试generatePuzzle函数...');
      try {
        // 检查generatePuzzle函数是否存在
        if (typeof (window as any).testAPI?.generatePuzzle === 'function') {
          console.log('✅ testAPI.generatePuzzle 函数存在');
        } else {
          console.log('❌ testAPI.generatePuzzle 函数不存在');
        }
      } catch (error) {
        console.log('❌ 检查generatePuzzle函数时出错:', error);
      }
      
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered,
        hasTestAPI: !!(window as any).testAPI,
        hasGeneratePuzzle: typeof (window as any).testAPI?.generatePuzzle === 'function'
      };
    });
    
    console.log('📊 最终状态检查:', finalState);
    
    // 验证basePuzzle是否被正确设置
    if (finalState.hasBasePuzzle) {
      console.log('✅ basePuzzle已设置');
      expect(finalState.basePuzzleLength).toBe(finalState.puzzleLength);
    } else {
      console.log('❌ basePuzzle未设置');
    }
  });
});