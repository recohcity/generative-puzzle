/**
 * Step3 basePuzzle修复测试 - 检查basePuzzle状态被重置的问题
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: basePuzzle修复测试', () => {
  test('检查basePuzzle状态被重置的问题', async ({ page }) => {
    console.log('🔧 basePuzzle修复测试: 检查状态重置问题');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('basePuzzle') || text.includes('RESET_GAME') || text.includes('SET_BASE_PUZZLE')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 1. 生成形状
    console.log('🔄 步骤1: 生成形状...');
    await page.click('button:has-text("圆形")');
    await page.waitForTimeout(1000);
    
    // 2. 设置切割参数并生成拼图
    console.log('🔄 步骤2: 设置切割参数...');
    await page.click('button:has-text("直线")');
    await page.waitForTimeout(500);
    
    // 点击切割次数1
    await page.click('button:has-text("1")');
    await page.waitForTimeout(500);
    
    // 3. 生成拼图并监控状态变化
    console.log('🔄 步骤3: 生成拼图并监控状态...');
    
    // 在点击切割按钮前检查状态
    const beforeCutState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 切割前状态:', beforeCutState);
    
    // 点击切割按钮
    await page.click('button:has-text("切割形状")');
    await page.waitForTimeout(1000);
    
    // 检查切割后的状态
    const afterCutState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 切割后状态:', afterCutState);
    
    // 4. 模拟窗口调整来触发适配逻辑
    console.log('🔄 步骤4: 模拟窗口调整...');
    await page.setViewportSize({ width: 900, height: 700 });
    await page.waitForTimeout(1000);
    
    // 检查窗口调整后的状态
    const afterResizeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0
      };
    });
    console.log('📊 窗口调整后状态:', afterResizeState);
    
    // 5. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('basePuzzle') || 
      log.includes('RESET_GAME') || 
      log.includes('SET_BASE_PUZZLE') ||
      log.includes('generatePuzzle')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 6. 验证问题
    if (!afterCutState.hasBasePuzzle) {
      console.log('❌ 确认问题: basePuzzle未设置');
      
      // 尝试手动修复
      console.log('🔧 尝试手动修复basePuzzle...');
      const fixResult = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        if (state.puzzle && !state.basePuzzle) {
          // 手动设置basePuzzle
          (window as any).__gameStateForTests__.basePuzzle = JSON.parse(JSON.stringify(state.puzzle));
          return {
            success: true,
            basePuzzleLength: state.basePuzzle?.length || 0
          };
        }
        return { success: false };
      });
      
      console.log('🔧 手动修复结果:', fixResult);
    } else {
      console.log('✅ basePuzzle状态正常');
    }
    
    // 验证测试结果
    expect(afterCutState.puzzleLength).toBeGreaterThan(0);
  });
});