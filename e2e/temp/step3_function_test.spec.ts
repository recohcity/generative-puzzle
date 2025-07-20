/**
 * Step3 函数测试 - 检查generatePuzzle函数的实际内容
 */

import { test, expect, Page } from '@playwright/test';
test.setTimeout(60000);

test.describe('Step3: 函数测试', () => {
  test('检查generatePuzzle函数的实际内容', async ({ page }) => {
    console.log('🔍 函数测试: 检查generatePuzzle函数');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 检查generatePuzzle函数的实际内容
    const functionInfo = await page.evaluate(() => {
      try {
        // 获取GameContext的实例
        const gameContext = (window as any).__gameContext__;
        const testAPI = (window as any).testAPI;
        
        return {
          hasGameContext: !!gameContext,
          hasTestAPI: !!testAPI,
          hasGeneratePuzzle: typeof testAPI?.generatePuzzle === 'function',
          testAPIGeneratePuzzleSource: testAPI?.generatePuzzle?.toString(),
          // 尝试直接访问generatePuzzle函数
          directAccess: typeof (window as any).generatePuzzle === 'function'
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('📊 函数信息:', functionInfo);
    
    // 尝试手动添加调试日志到generatePuzzle
    const patchResult = await page.evaluate(() => {
      try {
        // 保存原始的generatePuzzle函数
        const originalGeneratePuzzle = (window as any).testAPI.generatePuzzle;
        
        // 创建一个包装函数
        (window as any).testAPI.generatePuzzle = function(cutCount) {
          console.log('🔧 [PATCHED] generatePuzzle被调用，cutCount:', cutCount);
          return originalGeneratePuzzle.call(this, cutCount);
        };
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('📊 补丁结果:', patchResult);
    
    // 现在测试补丁后的函数
    console.log('🔄 测试补丁后的generatePuzzle...');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('PATCHED') || text.includes('generatePuzzle')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    // 调用补丁后的函数
    const callResult = await page.evaluate(() => {
      try {
        (window as any).testAPI.generatePuzzle(1);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('📊 调用结果:', callResult);
    
    // 等待一下让日志输出
    await page.waitForTimeout(1000);
    
    const patchedLogs = consoleLogs.filter(log => 
      log.includes('PATCHED') || log.includes('generatePuzzle')
    );
    
    console.log('🔍 补丁相关日志:');
    patchedLogs.forEach(log => console.log('  ', log));
  });
});