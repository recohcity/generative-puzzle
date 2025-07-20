/**
 * Step3 basePuzzle直接测试 - 使用testAPI直接测试basePuzzle问题
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: basePuzzle直接测试', () => {
  test('使用testAPI直接测试basePuzzle问题', async ({ page }) => {
    console.log('🔧 basePuzzle直接测试: 使用testAPI');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('basePuzzle') || text.includes('RESET_GAME') || text.includes('SET_BASE_PUZZLE') || text.includes('generatePuzzle')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 1. 使用testAPI生成形状
    console.log('🔄 步骤1: 使用testAPI生成形状...');
    await page.evaluate(() => {
      (window as any).testAPI.generateShape('circle');
    });
    await page.waitForTimeout(1000);
    
    // 2. 检查生成形状后的状态
    const afterShapeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 生成形状后状态:', afterShapeState);
    
    // 3. 使用testAPI生成拼图
    console.log('🔄 步骤2: 使用testAPI生成拼图...');
    await page.evaluate(() => {
      (window as any).testAPI.generatePuzzle(1);
    });
    await page.waitForTimeout(1000);
    
    // 4. 检查生成拼图后的状态
    const afterPuzzleState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered
      };
    });
    console.log('📊 生成拼图后状态:', afterPuzzleState);
    
    // 5. 如果basePuzzle没有设置，尝试手动修复
    if (!afterPuzzleState.hasBasePuzzle && afterPuzzleState.puzzleLength > 0) {
      console.log('🔧 basePuzzle未设置，尝试手动修复...');
      
      const fixResult = await page.evaluate(() => {
        try {
          const state = (window as any).__gameStateForTests__;
          if (state.puzzle && !state.basePuzzle) {
            // 手动设置basePuzzle
            state.basePuzzle = JSON.parse(JSON.stringify(state.puzzle));
            console.log('🔧 手动设置basePuzzle成功，长度:', state.basePuzzle.length);
            return {
              success: true,
              basePuzzleLength: state.basePuzzle.length
            };
          }
          return { success: false, reason: 'no puzzle or basePuzzle already exists' };
        } catch (error) {
          console.error('🔧 手动设置basePuzzle失败:', error);
          return { success: false, error: error.message };
        }
      });
      
      console.log('🔧 手动修复结果:', fixResult);
    }
    
    // 6. 模拟窗口调整来测试适配
    console.log('🔄 步骤3: 模拟窗口调整测试适配...');
    await page.setViewportSize({ width: 900, height: 700 });
    await page.waitForTimeout(1000);
    
    // 7. 检查窗口调整后的状态
    const afterResizeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 窗口调整后状态:', afterResizeState);
    
    // 8. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('basePuzzle') || 
      log.includes('RESET_GAME') || 
      log.includes('SET_BASE_PUZZLE') ||
      log.includes('generatePuzzle') ||
      log.includes('拼图块适配')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 9. 总结问题
    if (!afterPuzzleState.hasBasePuzzle) {
      console.log('❌ 确认问题: basePuzzle在生成拼图后未设置');
    } else {
      console.log('✅ basePuzzle状态正常');
    }
    
    // 验证测试结果
    expect(afterPuzzleState.puzzleLength).toBeGreaterThan(0);
  });
});