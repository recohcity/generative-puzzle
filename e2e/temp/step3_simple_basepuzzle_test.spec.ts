/**
 * Step3 简单basePuzzle测试 - 最简单的测试来验证问题
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: 简单basePuzzle测试', () => {
  test('最简单的basePuzzle测试', async ({ page }) => {
    console.log('🔧 简单basePuzzle测试');
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 1. 生成形状
    console.log('🔄 生成形状...');
    await page.click('button:has-text("多边形")');
    await page.waitForTimeout(3000);
    
    // 2. 生成拼图
    console.log('🔄 生成拼图...');
    await page.evaluate(() => {
      (window as any).testAPI.generatePuzzle(1);
    });
    await page.waitForTimeout(2000);
    
    // 3. 检查状态
    const state = await page.evaluate(() => {
      const gameState = (window as any).__gameStateForTests__;
      
      // 详细检查状态对象
      console.log('🔍 详细状态检查:');
      console.log('  - gameState 存在:', !!gameState);
      console.log('  - puzzle 存在:', !!gameState?.puzzle);
      console.log('  - puzzle 长度:', gameState?.puzzle?.length || 0);
      console.log('  - basePuzzle 存在:', !!gameState?.basePuzzle);
      console.log('  - basePuzzle 长度:', gameState?.basePuzzle?.length || 0);
      console.log('  - basePuzzle 类型:', typeof gameState?.basePuzzle);
      console.log('  - basePuzzle 值:', gameState?.basePuzzle);
      
      // 检查状态对象的所有属性
      if (gameState) {
        console.log('🔍 gameState 所有属性:');
        Object.keys(gameState).forEach(key => {
          const value = gameState[key];
          console.log(`  - ${key}: ${typeof value} (${Array.isArray(value) ? `数组长度${value.length}` : value})`);
        });
      }
      
      return {
        hasGameState: !!gameState,
        hasPuzzle: !!gameState?.puzzle,
        puzzleLength: gameState?.puzzle?.length || 0,
        hasBasePuzzle: !!gameState?.basePuzzle,
        basePuzzleLength: gameState?.basePuzzle?.length || 0,
        basePuzzleType: typeof gameState?.basePuzzle,
        allKeys: gameState ? Object.keys(gameState) : []
      };
    });
    
    console.log('📊 状态检查结果:', state);
    
    // 4. 尝试手动设置并验证
    console.log('🔄 尝试手动设置basePuzzle...');
    const manualResult = await page.evaluate(() => {
      const gameState = (window as any).__gameStateForTests__;
      if (gameState && gameState.puzzle && gameState.puzzle.length > 0) {
        console.log('🔧 手动设置前 basePuzzle:', gameState.basePuzzle);
        
        // 手动设置
        gameState.basePuzzle = JSON.parse(JSON.stringify(gameState.puzzle));
        
        console.log('🔧 手动设置后 basePuzzle 长度:', gameState.basePuzzle.length);
        
        return {
          success: true,
          beforeSet: null,
          afterSet: gameState.basePuzzle.length
        };
      }
      return { success: false };
    });
    
    console.log('📊 手动设置结果:', manualResult);
    
    // 5. 再次检查状态
    const finalState = await page.evaluate(() => {
      const gameState = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!gameState?.basePuzzle,
        basePuzzleLength: gameState?.basePuzzle?.length || 0
      };
    });
    
    console.log('📊 最终状态:', finalState);
    
    // 验证
    expect(state.puzzleLength).toBeGreaterThan(0);
    
    if (finalState.hasBasePuzzle) {
      console.log('✅ basePuzzle 最终设置成功');
    } else {
      console.log('❌ basePuzzle 仍然未设置');
    }
  });
});