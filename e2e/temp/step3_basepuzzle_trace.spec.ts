/**
 * Step3 basePuzzle状态追踪测试 - 追踪basePuzzle状态的变化过程
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: basePuzzle状态追踪测试', () => {
  test('追踪basePuzzle状态变化过程', async ({ page }) => {
    console.log('🔧 basePuzzle状态追踪测试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('basePuzzle') || text.includes('SET_BASE_PUZZLE') || text.includes('RESET_GAME') || text.includes('generatePuzzle')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 1. 点击多边形按钮生成形状
    console.log('🔄 步骤1: 点击多边形按钮生成形状...');
    await page.click('button:has-text("多边形")');
    await page.waitForTimeout(3000);
    
    // 2. 检查形状生成后的状态
    const afterShapeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0
      };
    });
    console.log('📊 形状生成后状态:', afterShapeState);
    
    // 3. 添加状态监控函数
    console.log('🔄 步骤2: 添加状态监控...');
    await page.evaluate(() => {
      // 保存原始的dispatch函数
      const originalDispatch = (window as any).__originalDispatch__;
      if (!originalDispatch) {
        // 如果还没有保存，尝试获取dispatch函数
        console.log('🔧 尝试获取dispatch函数进行监控');
      }
      
      // 监控状态变化
      let lastBasePuzzleLength = 0;
      const checkBasePuzzleState = () => {
        const state = (window as any).__gameStateForTests__;
        const currentLength = state.basePuzzle?.length || 0;
        if (currentLength !== lastBasePuzzleLength) {
          console.log(`🔍 basePuzzle状态变化: ${lastBasePuzzleLength} -> ${currentLength}`);
          lastBasePuzzleLength = currentLength;
        }
      };
      
      // 每100ms检查一次状态
      (window as any).__basePuzzleMonitor__ = setInterval(checkBasePuzzleState, 100);
    });
    
    // 4. 生成拼图并监控状态变化
    console.log('🔄 步骤3: 生成拼图并监控状态变化...');
    
    // 在生成拼图前检查状态
    const beforePuzzleState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 生成拼图前状态:', beforePuzzleState);
    
    // 生成拼图
    await page.evaluate(() => {
      console.log('🔧 准备调用testAPI.generatePuzzle(1)');
      (window as any).testAPI.generatePuzzle(1);
    });
    
    // 等待一段时间让状态更新
    await page.waitForTimeout(1000);
    
    // 检查生成拼图后的状态
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
    
    // 5. 尝试手动设置basePuzzle来验证状态更新机制
    console.log('🔄 步骤4: 尝试手动设置basePuzzle...');
    const manualSetResult = await page.evaluate(() => {
      try {
        const state = (window as any).__gameStateForTests__;
        if (state.puzzle && state.puzzle.length > 0) {
          console.log('🔧 手动设置basePuzzle，当前puzzle长度:', state.puzzle.length);
          
          // 直接修改状态对象
          state.basePuzzle = JSON.parse(JSON.stringify(state.puzzle));
          
          console.log('🔧 手动设置完成，basePuzzle长度:', state.basePuzzle.length);
          
          return {
            success: true,
            basePuzzleLength: state.basePuzzle.length,
            puzzleLength: state.puzzle.length
          };
        }
        return { success: false, reason: 'no puzzle data' };
      } catch (error) {
        console.error('🔧 手动设置basePuzzle失败:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('📊 手动设置结果:', manualSetResult);
    
    // 6. 验证手动设置后的状态
    await page.waitForTimeout(500);
    const afterManualSetState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 手动设置后状态:', afterManualSetState);
    
    // 7. 清理监控
    await page.evaluate(() => {
      if ((window as any).__basePuzzleMonitor__) {
        clearInterval((window as any).__basePuzzleMonitor__);
      }
    });
    
    // 8. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('basePuzzle') || 
      log.includes('SET_BASE_PUZZLE') ||
      log.includes('RESET_GAME') ||
      log.includes('generatePuzzle')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 验证测试结果
    expect(afterPuzzleState.puzzleLength).toBeGreaterThan(0);
    
    if (afterManualSetState.hasBasePuzzle) {
      console.log('✅ 手动设置basePuzzle成功，说明状态更新机制正常');
    } else {
      console.log('❌ 手动设置basePuzzle也失败，可能是状态暴露有问题');
    }
  });
});