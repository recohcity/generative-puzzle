/**
 * Step3 dispatch监控测试 - 监控所有dispatch调用来找出basePuzzle被重置的原因
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: dispatch监控测试', () => {
  test('监控dispatch调用找出basePuzzle重置原因', async ({ page }) => {
    console.log('🔧 dispatch监控测试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('DISPATCH') || text.includes('basePuzzle') || text.includes('SET_BASE_PUZZLE')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 1. 注入dispatch监控代码
    console.log('🔄 步骤1: 注入dispatch监控代码...');
    await page.evaluate(() => {
      // 尝试找到并包装dispatch函数
      const gameContext = (window as any).__gameContext__;
      
      // 创建一个dispatch监控函数
      (window as any).__dispatchMonitor__ = [];
      
      // 重写console.log来捕获dispatch相关的日志
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        const message = args.join(' ');
        if (message.includes('已调用') || message.includes('SET_') || message.includes('RESET_')) {
          (window as any).__dispatchMonitor__.push({
            timestamp: Date.now(),
            message: message,
            type: 'dispatch'
          });
          originalConsoleLog('🔍 [DISPATCH]', ...args);
        } else {
          originalConsoleLog(...args);
        }
      };
      
      console.log('🔧 dispatch监控已启动');
    });
    
    // 2. 点击多边形按钮生成形状
    console.log('🔄 步骤2: 生成形状...');
    await page.click('button:has-text("多边形")');
    await page.waitForTimeout(3000);
    
    // 3. 生成拼图
    console.log('🔄 步骤3: 生成拼图...');
    await page.evaluate(() => {
      console.log('🔧 准备生成拼图');
      (window as any).testAPI.generatePuzzle(1);
    });
    
    await page.waitForTimeout(2000);
    
    // 4. 检查dispatch监控记录
    console.log('🔄 步骤4: 检查dispatch监控记录...');
    const dispatchRecords = await page.evaluate(() => {
      return (window as any).__dispatchMonitor__ || [];
    });
    
    console.log('📊 dispatch调用记录:');
    dispatchRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. [${new Date(record.timestamp).toLocaleTimeString()}] ${record.message}`);
    });
    
    // 5. 检查最终状态
    const finalState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered
      };
    });
    console.log('📊 最终状态:', finalState);
    
    // 6. 尝试直接调用dispatch来测试SET_BASE_PUZZLE
    console.log('🔄 步骤5: 直接测试SET_BASE_PUZZLE action...');
    const directDispatchResult = await page.evaluate(() => {
      try {
        const state = (window as any).__gameStateForTests__;
        if (state.puzzle && state.puzzle.length > 0) {
          console.log('🔧 准备直接调用SET_BASE_PUZZLE action');
          
          // 尝试找到dispatch函数
          // 由于我们无法直接访问dispatch，我们尝试通过testAPI间接调用
          
          // 创建一个测试用的拼图数据
          const testPuzzleData = JSON.parse(JSON.stringify(state.puzzle));
          console.log('🔧 测试数据准备完成，长度:', testPuzzleData.length);
          
          return {
            success: true,
            testDataLength: testPuzzleData.length,
            currentPuzzleLength: state.puzzle.length
          };
        }
        return { success: false, reason: 'no puzzle data' };
      } catch (error) {
        console.error('🔧 直接测试失败:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('📊 直接测试结果:', directDispatchResult);
    
    // 7. 分析问题
    console.log('🔄 步骤6: 分析问题...');
    
    const setPuzzleRecords = dispatchRecords.filter(record => 
      record.message.includes('SET_PUZZLE') || record.message.includes('SET_BASE_PUZZLE')
    );
    
    const resetRecords = dispatchRecords.filter(record => 
      record.message.includes('RESET_GAME') || record.message.includes('重置')
    );
    
    console.log('📊 SET_PUZZLE相关记录:', setPuzzleRecords.length);
    setPuzzleRecords.forEach(record => console.log(`  - ${record.message}`));
    
    console.log('📊 RESET相关记录:', resetRecords.length);
    resetRecords.forEach(record => console.log(`  - ${record.message}`));
    
    // 8. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('DISPATCH') || 
      log.includes('basePuzzle') || 
      log.includes('SET_BASE_PUZZLE') ||
      log.includes('已调用')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 验证测试结果
    expect(finalState.puzzleLength).toBeGreaterThan(0);
    
    if (finalState.hasBasePuzzle) {
      console.log('✅ basePuzzle设置成功');
    } else {
      console.log('❌ basePuzzle未设置，需要进一步调查');
      
      // 如果basePuzzle未设置，检查是否有RESET_GAME调用
      if (resetRecords.length > 0) {
        console.log('⚠️  发现RESET_GAME调用，这可能是basePuzzle被重置的原因');
      }
    }
  });
});